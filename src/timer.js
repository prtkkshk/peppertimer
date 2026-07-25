// Core Timer & Stopwatch State Engine with WakeLock, Haptics & Tab Title updates
import { sounds } from './audio.js';
import { StorageManager } from './storage.js';

export class TimerEngine {
  constructor(callbacks) {
    this.callbacks = callbacks || {}; // { onTick, onComplete, onModeChange, onStateChange }

    this.mode = 'timer'; // 'timer' | 'stopwatch'
    this.state = 'stopped'; // 'stopped' | 'running' | 'paused'
    this.isCompleted = false; // true when timer just finished 00:00

    // Timer settings
    this.targetDurationSeconds = 15 * 60; // default 15 minutes
    this.remainingSeconds = this.targetDurationSeconds;

    // Stopwatch settings
    this.elapsedSeconds = 0;

    // Internal timing
    this.intervalId = null;
    this.lastTimestamp = 0;
    this.wakeLock = null;

    // Handle tab visibility change for Screen WakeLock re-activation
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.state === 'running') {
        this.requestWakeLock();
      }
    });
  }

  setMode(newMode) {
    if (this.mode === newMode) return;
    this.reset();
    this.mode = newMode;
    if (this.callbacks.onModeChange) {
      this.callbacks.onModeChange(this.mode);
    }
    this.notifyTick();
  }

  setTargetDuration(seconds) {
    if (this.state !== 'stopped') return;
    this.isCompleted = false;
    this.targetDurationSeconds = Math.max(1, Math.round(seconds));
    this.remainingSeconds = this.targetDurationSeconds;
    this.notifyTick();
  }

  start() {
    if (this.state === 'running') return;

    this.isCompleted = false;

    if (this.mode === 'timer' && this.remainingSeconds <= 0) {
      this.remainingSeconds = this.targetDurationSeconds;
    }

    this.state = 'running';
    this.lastTimestamp = performance.now();
    this.requestWakeLock();

    sounds.playButtonClick();

    this.intervalId = setInterval(() => this.tick(), 100); // 100ms precise tick

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.state);
    }
  }

  pause() {
    if (this.state !== 'running') return;

    this.state = 'paused';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.releaseWakeLock();
    sounds.playButtonClick();

    this.updateTitle();

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.state);
    }
  }

  resume() {
    this.start();
  }

  reset() {
    this.state = 'stopped';
    this.isCompleted = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.releaseWakeLock();

    if (this.mode === 'timer') {
      this.remainingSeconds = this.targetDurationSeconds;
    } else {
      this.elapsedSeconds = 0;
    }

    this.updateTitle();
    this.notifyTick();

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.state);
    }
  }

  restartSameDuration() {
    this.reset();
    this.start();
  }

  tick() {
    const now = performance.now();
    const deltaSec = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    if (this.mode === 'timer') {
      this.remainingSeconds = Math.max(0, this.remainingSeconds - deltaSec);
      this.notifyTick();
      this.updateTitle();

      if (this.remainingSeconds <= 0) {
        this.completeTimer();
      }
    } else {
      // Stopwatch mode
      this.elapsedSeconds += deltaSec;
      this.notifyTick();
      this.updateTitle();
    }
  }

  completeTimer() {
    this.state = 'stopped';
    this.isCompleted = true;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.releaseWakeLock();

    // 1. Play mechanical bell audio
    sounds.playBell();

    // 2. Mobile vibration haptics
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch (e) {
        // ignore restriction
      }
    }

    // 3. Save completed session in history
    StorageManager.addSession('timer', this.targetDurationSeconds);

    // 4. Update title
    document.title = '🔔 Time Up! — Pepper Timer';

    if (this.callbacks.onComplete) {
      this.callbacks.onComplete(this.targetDurationSeconds);
    }

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.state);
    }
  }

  notifyTick() {
    if (!this.callbacks.onTick) return;

    if (this.mode === 'timer') {
      const displaySec = Math.ceil(this.remainingSeconds);
      const progress = this.targetDurationSeconds > 0
        ? Math.min(1, Math.max(0, 1 - (this.remainingSeconds / this.targetDurationSeconds)))
        : 0;

      this.callbacks.onTick({
        mode: 'timer',
        displaySeconds: displaySec,
        progress,
        state: this.state,
        isCompleted: this.isCompleted
      });
    } else {
      // Stopwatch
      const displaySec = Math.floor(this.elapsedSeconds);
      const progress = (this.elapsedSeconds % 60) / 60; // 60-second loop

      this.callbacks.onTick({
        mode: 'stopwatch',
        displaySeconds: displaySec,
        progress,
        state: this.state,
        isCompleted: false
      });
    }
  }

  updateTitle() {
    if (this.state === 'running' || this.state === 'paused') {
      const seconds = this.mode === 'timer'
        ? Math.ceil(this.remainingSeconds)
        : Math.floor(this.elapsedSeconds);

      const formatted = this.formatTime(seconds);
      const icon = this.mode === 'timer' ? '⏳' : '⏱️';
      const statusPrefix = this.state === 'paused' ? '[PAUSED] ' : '';

      document.title = `${statusPrefix}${icon} ${formatted} — Pepper Timer`;
    } else {
      document.title = 'Pepper Timer';
    }
  }

  formatTime(totalSec) {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator && !this.wakeLock) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.log('WakeLock error:', err.message);
      }
    }
  }

  async releaseWakeLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch (err) {
        // ignore
      }
      this.wakeLock = null;
    }
  }
}

// Minimalist High-Precision Stopwatch Engine with WakeLock & Tab Title updates

export class StopwatchEngine {
  constructor(callbacks) {
    this.callbacks = callbacks || {}; // { onTick, onStateChange }

    this.state = 'stopped'; // 'stopped' | 'running' | 'paused'
    this.elapsedMs = 0;
    this.startTime = 0;
    this.intervalId = null;
    this.wakeLock = null;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.state === 'running') {
        this.requestWakeLock();
      }
    });
  }

  start() {
    if (this.state === 'running') return;

    this.state = 'running';
    this.startTime = performance.now() - this.elapsedMs;
    this.requestWakeLock();

    this.intervalId = setInterval(() => this.tick(), 50); // 20fps update for crisp tenths of a sec

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
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.elapsedMs = 0;
    this.releaseWakeLock();
    this.updateTitle();
    this.notifyTick();

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.state);
    }
  }

  restoreState(elapsedMs, state = 'paused') {
    this.state = state;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.elapsedMs = elapsedMs;
    this.startTime = performance.now() - this.elapsedMs;
    this.releaseWakeLock();
    this.notifyTick();
    this.updateTitle();

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.state);
    }
  }

  tick() {
    this.elapsedMs = performance.now() - this.startTime;
    this.notifyTick();
    this.updateTitle();
  }

  notifyTick() {
    if (this.callbacks.onTick) {
      this.callbacks.onTick({
        elapsedMs: this.elapsedMs,
        formatted: this.formatTime(this.elapsedMs),
        state: this.state
      });
    }
  }

  formatTime(ms) {
    const totalTenths = Math.floor(ms / 100);
    const tenths = totalTenths % 10;

    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');

    return {
      timeStr: `${hh}:${mm}:${ss}`,
      tenthsStr: `.${tenths}`,
      fullStr: `${hh}:${mm}:${ss}.${tenths}`
    };
  }

  updateTitle() {
    if (this.state === 'running' || this.state === 'paused') {
      const { fullStr } = this.formatTime(this.elapsedMs);
      const prefix = this.state === 'paused' ? '[PAUSED] ' : '';
      document.title = `${prefix}⏱️ ${fullStr} — Minimal Stopwatch`;
    } else {
      document.title = 'Minimal Stopwatch';
    }
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator && !this.wakeLock) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (e) {
        // ignore restriction
      }
    }
  }

  async releaseWakeLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch (e) {
        // ignore
      }
      this.wakeLock = null;
    }
  }
}

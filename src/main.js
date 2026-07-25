// Pepper Timer Main Application Entry Point
import { sounds } from './audio.js';
import { StorageManager } from './storage.js';
import { DialControl } from './dial.js';
import { TimerEngine } from './timer.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const timeDisplay = document.getElementById('time-display');
  const modeSubtext = document.getElementById('mode-subtext');
  const ringProgress = document.getElementById('ring-progress');

  const startBtn = document.getElementById('start-btn');
  const startBtnText = document.getElementById('start-btn-text');
  const resetBtn = document.getElementById('reset-btn');

  const modeLeverTrack = document.getElementById('mode-lever-track');
  const timerLabel = document.querySelector('.timer-label');
  const stopwatchLabel = document.querySelector('.stopwatch-label');

  const dialKnobElement = document.getElementById('dial-knob');
  const dialSection = document.getElementById('dial-section');

  const muteBtn = document.getElementById('mute-btn');
  const muteIcon = document.getElementById('mute-icon');

  const historyBtn = document.getElementById('history-btn');
  const historyModal = document.getElementById('history-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');

  const completionBanner = document.getElementById('completion-banner');
  const restartSameBtn = document.getElementById('restart-same-btn');

  const statToday = document.getElementById('stat-today');
  const statWeek = document.getElementById('stat-week');
  const barChart = document.getElementById('bar-chart');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  // Ring circumference for SVG stroke-dashoffset calculation
  // Radius = 102 (portrait), 2 * PI * 102 = 640.88
  const RING_CIRCUMFERENCE = 640.88;

  // Initialize Dial Control
  const dial = new DialControl(dialKnobElement, (seconds) => {
    if (timerEngine.mode === 'timer' && timerEngine.state === 'stopped') {
      timerEngine.setTargetDuration(seconds);
    }
  });

  // Initialize Timer Engine
  const timerEngine = new TimerEngine({
    onTick: ({ mode, displaySeconds, progress, state }) => {
      updateDisplay(displaySeconds, mode, progress);
    },
    onStateChange: (state) => {
      updateControlsForState(state);
    },
    onModeChange: (mode) => {
      updateUIForMode(mode);
    },
    onComplete: (durationSeconds) => {
      completionBanner.classList.remove('hidden');
    }
  });

  // Set default dial duration to 15 mins
  dial.setSeconds(15 * 60, false);
  timerEngine.setTargetDuration(15 * 60);

  // Initialize Mute Button State
  updateMuteUI();

  // Mode Lever Switch Click
  const toggleMode = () => {
    sounds.playLeverClick();
    const newMode = timerEngine.mode === 'timer' ? 'stopwatch' : 'timer';
    timerEngine.setMode(newMode);
  };

  modeLeverTrack.addEventListener('click', toggleMode);
  timerLabel.addEventListener('click', () => {
    if (timerEngine.mode !== 'timer') toggleMode();
  });
  stopwatchLabel.addEventListener('click', () => {
    if (timerEngine.mode !== 'stopwatch') toggleMode();
  });

  // Start / Pause / Resume Button
  startBtn.addEventListener('click', () => {
    completionBanner.classList.add('hidden');
    if (timerEngine.state === 'stopped') {
      timerEngine.start();
    } else if (timerEngine.state === 'running') {
      timerEngine.pause();
    } else if (timerEngine.state === 'paused') {
      timerEngine.resume();
    }
  });

  // Reset Button
  resetBtn.addEventListener('click', () => {
    sounds.playButtonClick();
    completionBanner.classList.add('hidden');
    timerEngine.reset();
  });

  // Restart Same Duration Button
  restartSameBtn.addEventListener('click', () => {
    sounds.playButtonClick();
    completionBanner.classList.add('hidden');
    timerEngine.restartSameDuration();
  });

  // Mute Toggle Button
  muteBtn.addEventListener('click', () => {
    sounds.toggleMute();
    updateMuteUI();
  });

  function updateMuteUI() {
    if (sounds.isMuted()) {
      muteIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      `;
      muteBtn.style.opacity = '0.6';
    } else {
      muteIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      `;
      muteBtn.style.opacity = '1';
    }
  }

  // History & Stats Modal Events
  historyBtn.addEventListener('click', () => {
    sounds.playButtonClick();
    renderStatsAndHistory();
    historyModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    sounds.playButtonClick();
    historyModal.classList.add('hidden');
  });

  historyModal.addEventListener('click', (e) => {
    if (e.target === historyModal) {
      historyModal.classList.add('hidden');
    }
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all recorded focus session history?')) {
      sounds.playButtonClick();
      StorageManager.clearHistory();
      renderStatsAndHistory();
    }
  });

  // Render Stats & Past Sessions
  function renderStatsAndHistory() {
    const todaySec = StorageManager.getTodayTotalSeconds();
    const weekSec = StorageManager.getWeekTotalSeconds();

    statToday.textContent = formatDurationShort(todaySec);
    statWeek.textContent = formatDurationShort(weekSec);

    // Render 7-day Bar Chart
    const stats = StorageManager.getDailyStats(7);
    const maxSec = Math.max(...stats.map(s => s.totalSeconds), 1800); // minimum scale 30 mins

    barChart.innerHTML = stats.map(s => {
      const heightPercent = Math.min(100, Math.round((s.totalSeconds / maxSec) * 100));
      const mins = Math.round(s.totalSeconds / 60);
      return `
        <div class="chart-column">
          <span class="chart-val">${mins > 0 ? mins + 'm' : ''}</span>
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="height: ${Math.max(4, heightPercent)}%;"></div>
          </div>
          <span class="chart-day">${s.dayLabel}</span>
        </div>
      `;
    }).join('');

    // Render Past Sessions List
    const history = StorageManager.getHistory();
    if (history.length === 0) {
      historyList.innerHTML = '<li class="history-item" style="justify-content:center; color:#7a6045;">No sessions logged yet.</li>';
    } else {
      historyList.innerHTML = history.slice(0, 30).map(item => {
        const d = new Date(item.timestamp);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const durStr = formatDurationShort(item.durationSeconds);
        const modeTag = item.mode === 'stopwatch' ? '⏱️ Stopwatch' : '⏳ Timer';
        return `
          <li class="history-item">
            <span class="history-date">${dateStr} (${modeTag})</span>
            <span class="history-duration">${durStr}</span>
          </li>
        `;
      }).join('');
    }
  }

  function formatDurationShort(totalSec) {
    if (!totalSec || totalSec <= 0) return '0m';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.round((totalSec % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  }

  // Update UI state for Mode change
  function updateUIForMode(mode) {
    if (mode === 'timer') {
      modeLeverTrack.classList.remove('stopwatch-active');
      timerLabel.classList.add('active');
      stopwatchLabel.classList.remove('active');
      modeSubtext.textContent = 'SET TIMER';
      dialSection.style.display = 'flex';
      dial.setDisabled(timerEngine.state !== 'stopped');
    } else {
      // Stopwatch mode
      modeLeverTrack.classList.add('stopwatch-active');
      stopwatchLabel.classList.add('active');
      timerLabel.classList.remove('active');
      modeSubtext.textContent = 'STOPWATCH';
      dialSection.style.display = 'none'; // hidden in stopwatch mode
    }
  }

  // Update Controls state (Start / Pause / Resume)
  function updateControlsForState(state) {
    if (state === 'stopped') {
      startBtnText.textContent = 'START';
      dial.setDisabled(false);
    } else if (state === 'running') {
      startBtnText.textContent = 'PAUSE';
      dial.setDisabled(true);
    } else if (state === 'paused') {
      startBtnText.textContent = 'RESUME';
      dial.setDisabled(true);
    }
  }

  // Update Main Digital Readout & Ring Progress
  function updateDisplay(displaySeconds, mode, progress) {
    timeDisplay.textContent = timerEngine.formatTime(displaySeconds);

    // SVG stroke offset
    const offset = RING_CIRCUMFERENCE * (1 - progress);
    ringProgress.style.strokeDashoffset = offset;
  }

  // PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('PWA ServiceWorker registered:', reg.scope))
        .catch(err => console.log('PWA ServiceWorker registration failed:', err));
    });
  }
});

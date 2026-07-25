// Minimalist Stopwatch Main Client Application
import { StopwatchEngine } from './stopwatch.js';
import { saveRun, getRuns, clearRuns, getSummaryStats, get7DayChartData } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Timer & Header Controls
  const timeMain = document.getElementById('time-main');
  const timeSub = document.getElementById('time-sub');

  const startBtn = document.getElementById('start-btn');
  const resetBtn = document.getElementById('reset-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const fullscreenIcon = document.getElementById('fullscreen-icon');
  const progressBtn = document.getElementById('progress-btn');

  // DOM Elements - Modal & Progress UI
  const progressModal = document.getElementById('progress-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  const statTodayTime = document.getElementById('stat-today-time');
  const statWeekTime = document.getElementById('stat-week-time');
  const statTotalRuns = document.getElementById('stat-total-runs');

  const chartContainer = document.getElementById('chart-container');
  const chartMaxLabel = document.getElementById('chart-max-label');
  const runsList = document.getElementById('runs-list');

  // Initialize Stopwatch Engine
  const stopwatch = new StopwatchEngine({
    onTick: ({ formatted, state }) => {
      timeMain.textContent = formatted.timeStr;
      timeSub.textContent = formatted.tenthsStr;
    },
    onStateChange: (state) => {
      updateControls(state);
    }
  });

  // Start / Pause / Resume Button
  startBtn.addEventListener('click', () => {
    if (stopwatch.state === 'stopped') {
      stopwatch.start();
    } else if (stopwatch.state === 'running') {
      stopwatch.pause();
    } else if (stopwatch.state === 'paused') {
      stopwatch.resume();
    }
  });

  // Reset Button — Save run if duration >= 1 second
  resetBtn.addEventListener('click', () => {
    const durationMs = stopwatch.elapsedMs;
    if (durationMs >= 1000) {
      saveRun(durationMs);
    }
    stopwatch.reset();
  });

  // Fullscreen Toggle
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen error:', err.message);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      fullscreenIcon.innerHTML = `
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
      `;
    } else {
      fullscreenIcon.innerHTML = `
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      `;
    }
  });

  function updateControls(state) {
    if (state === 'running') {
      startBtn.textContent = 'PAUSE';
      startBtn.className = 'btn secondary-btn';
    } else if (state === 'paused') {
      startBtn.textContent = 'RESUME';
      startBtn.className = 'btn primary-btn';
    } else {
      // stopped
      startBtn.textContent = 'START';
      startBtn.className = 'btn primary-btn';
    }
  }

  // Modal Open / Close Logic
  progressBtn.addEventListener('click', openModal);
  modalCloseBtn.addEventListener('click', closeModal);

  progressModal.addEventListener('click', (e) => {
    if (e.target === progressModal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && progressModal.classList.contains('active')) {
      closeModal();
    }
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all session history?')) {
      clearRuns();
      renderProgressData();
    }
  });

  function openModal() {
    renderProgressData();
    progressModal.classList.add('active');
    progressModal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    progressModal.classList.remove('active');
    progressModal.setAttribute('aria-hidden', 'true');
  }

  function renderProgressData() {
    // 1. Render Summary Stats
    const stats = getSummaryStats();
    statTodayTime.textContent = stats.todayFormatted;
    statWeekTime.textContent = stats.weekFormatted;
    statTotalRuns.textContent = stats.totalRuns;

    // 2. Render 7-Day Chart
    const chartData = get7DayChartData();
    chartMaxLabel.textContent = `MAX: ${chartData.maxFormatted}`;
    
    chartContainer.innerHTML = '';
    chartData.bars.forEach(bar => {
      const barWrapper = document.createElement('div');
      barWrapper.className = `chart-bar-wrapper${bar.isToday ? ' today' : ''}`;

      barWrapper.innerHTML = `
        <span class="chart-bar-val">${bar.formattedTime}</span>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="height: ${bar.percent}%;"></div>
        </div>
        <span class="chart-bar-label">${bar.dayLabel}</span>
      `;
      chartContainer.appendChild(barWrapper);
    });

    // 3. Render Session History List
    const runs = getRuns();
    runsList.innerHTML = '';

    if (runs.length === 0) {
      runsList.innerHTML = '<li class="empty-runs">No focus sessions recorded yet.</li>';
    } else {
      runs.slice(0, 30).forEach(run => {
        const li = document.createElement('li');
        li.className = 'run-item';
        li.innerHTML = `
          <div>
            <span class="run-date">${run.dateStr}</span>
            <span class="run-time">${run.timeOfDay}</span>
          </div>
          <span class="run-duration">${run.formattedDuration}</span>
        `;
        runsList.appendChild(li);
      });
    }
  }

  // PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.log('SW failed:', err));
    });
  }
});

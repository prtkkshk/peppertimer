// Minimalist Stopwatch Main Client Application
import { StopwatchEngine } from './stopwatch.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const timeMain = document.getElementById('time-main');
  const timeSub = document.getElementById('time-sub');

  const startBtn = document.getElementById('start-btn');
  const resetBtn = document.getElementById('reset-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const fullscreenIcon = document.getElementById('fullscreen-icon');

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

  // Reset Button
  resetBtn.addEventListener('click', () => {
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

  // PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.log('SW failed:', err));
    });
  }
});

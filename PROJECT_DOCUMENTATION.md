# Pepper Timer — Project Documentation & Maintenance Guide

## 1. Overview
**Pepper Timer** is a minimalist, high-precision Stopwatch & Focus Timer built as an installable Progressive Web App (PWA). It features a pure dark-mode UI, responsive design for both portrait and landscape mobile/desktop orientations, screen wake lock support, tab title live updates, and persistent session tracking with daily progress visualization.

---

## 2. Technology Stack
- **Core:** HTML5, Vanilla JavaScript (ES Modules)
- **Styling:** Custom Vanilla CSS (Modern CSS variables, Flexbox/Grid, Glassmorphism backdrop-filter)
- **Build Tool:** Vite 5.4+
- **Persistence:** Web `localStorage` API
- **APIs Used:** Screen Wake Lock API, Web Audio / Haptics, Service Worker & Web App Manifest

---

## 3. Project Structure
```
Pepper Timer/
├── dist/                      # Production build output
├── public/                    # Static assets (PWA icons, manifest, service worker)
│   ├── favicon.svg
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── main.js                # Application entry point & modal/UI controller
│   ├── stopwatch.js           # High-precision StopwatchEngine class
│   ├── storage.js             # LocalStorage manager, stats aggregation & 7-day chart data generator
│   └── style.css              # Design system, layout, animations & modal/chart styles
├── index.html                 # Main DOM template & modal container
├── package.json               # Dependencies & build scripts
├── pepper-timer-spec.md       # Product spec & design reference
└── PROJECT_DOCUMENTATION.md   # Developer & Agent maintenance guide (this file)
```

---

## 4. Key Features & Implementation Details

### A. High-Precision Stopwatch Engine (`src/stopwatch.js`)
- Uses `performance.now()` for millisecond-level precision without cumulative drift.
- Runs at ~20 FPS (`setInterval` 50ms) for crisp tenths-of-a-second readout (`00:00:00.0`).
- Keeps screen awake while active using `navigator.wakeLock`.
- Updates browser tab title dynamically (e.g., `⏱️ 00:01:23.4 — Minimal Stopwatch` or `[PAUSED]`).

### B. LocalStorage Session Persistence (`src/storage.js`)
- Key: `pepper_timer_runs`
- Storage Format: Array of run objects:
  ```json
  {
    "id": "run_1722000000000_abc12",
    "timestamp": 1722000000000,
    "dateStr": "2026-07-26",
    "timeOfDay": "01:55",
    "durationMs": 125000,
    "formattedDuration": "02:05"
  }
  ```
- Save Trigger: Auto-saved when user clicks **RESET** after a session of at least 1 second (`durationMs >= 1000`).

### C. Daily Progress & Bar Chart Modal (`src/main.js` & `src/style.css`)
- **Header Icon:** Positioned in top-right header, directly to the left of the Fullscreen toggle button.
- **Summary Cards:**
  - **TODAY:** Total focus time recorded today (formatted e.g. `1h 15m`).
  - **THIS WEEK:** Rolling 7-day focus time.
  - **SESSIONS:** Total session count.
- **7-Day Bar Chart:**
  - SVG/Flex-based minimalist bar chart displaying the last 7 days of focus time.
  - Dynamic scaling relative to peak day.
  - Highlights today's bar and displays exact time on hover or focus.
- **Recent Sessions Log:** Scrollable list showing date, start time, and session duration.
- **History Management:** "Clear History" button with confirmation alert.

---

## 5. Command Reference for Developers & Agents

### Development & Build Commands
*(Note: If `node` is not in standard system PATH on Windows, reference `"C:\Program Files\nodejs\node.exe"` directly)*

- **Start Local Development Server:**
  ```powershell
  & "C:\Program Files\nodejs\node.exe" .\node_modules\vite\bin\vite.js
  ```
- **Create Production Build:**
  ```powershell
  & "C:\Program Files\nodejs\node.exe" .\node_modules\vite\bin\vite.js build
  ```
- **Preview Production Build:**
  ```powershell
  & "C:\Program Files\nodejs\node.exe" .\node_modules\vite\bin\vite.js preview
  ```

### Git & Deployment Commands
- **Check Repository Status:**
  ```powershell
  git status
  ```
- **Commit & Push Changes:**
  ```powershell
  git add .
  git commit -m "Your descriptive commit message"
  git push origin main
  ```

---

## 6. Guidelines for Future AI Agents & Developers
1. **Preserve Minimalist Aesthetic:** Maintain pure black background (`#000000`), dark panel contrast (`#121212`), border accents (`#2b2b2b`), and clean off-white typography (`#f5f5f5`).
2. **LocalStorage Schema Compatibility:** If modifying the storage structure in `src/storage.js`, ensure backwards compatibility or migration handling for existing `pepper_timer_runs` entries.
3. **No Unnecessary External Dependencies:** Prefer vanilla JS / CSS and native browser APIs (Web Audio, WakeLock, LocalStorage) to keep bundle size lightweight (< 10 kB compressed) for offline PWA speed.

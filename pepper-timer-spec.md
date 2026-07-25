# Pepper Timer — Product Spec & Build Prompt

## 1. One-line pitch
A vintage-tech-styled web app (installable as a mobile PWA) with two modes — a **Countdown Timer** and a **Stopwatch** — built for continuous, focused work sessions. Warm, analog, mechanical-feeling UI instead of a flat modern digital timer.

---

## 2. Platform & Delivery
- **Type:** Web app, built as an installable **PWA** (Progressive Web App)
- **Primary device:** Mobile phone, used **full screen**
- **Orientation:** Must support both **portrait and landscape**
- **Secondary:** Should still work fine on desktop browsers
- **Offline:** Should work offline once installed (PWA cache)
- **Tech stack:** Open — builder's choice of whatever best achieves the design and mobile requirements below (e.g. vanilla HTML/CSS/JS with a manifest + service worker, or React + a PWA plugin). Prioritize small bundle size and smooth animation performance over framework preference.

---

## 3. Core Modes
Only two modes, switched via a **physical-looking lever/switch** (skeuomorphic — visually like flipping a real toggle):

### A) Timer (Countdown)
- Plain countdown timer — **no automatic work/break cycling**, no Pomodoro logic
- Only **one active timer at a time** (no need for multiple simultaneous timers)
- Every session is started **manually** by the user
- **No time limit** — must support durations from seconds up to many hours
- **No task labels/naming** — kept intentionally simple, just time in, time counting down

### B) Stopwatch
- Simple count-up elapsed timer
- **No lap/split times** — just running elapsed time
- Supports pause/resume, same as the Timer

### Shared behavior (both modes)
- **Pause / Resume** supported
- **Reset** is a distinct, separate button from Pause (not a long-press or combined action)
- When a countdown **finishes**: show a **one-click "Restart same duration"** button

---

## 4. Setting the Time
- Time is set via a **literal rotating dial knob** — a skeuomorphic control the user turns with mouse/touch/drag, like an old mechanical kitchen timer, rather than typing numbers or tapping presets
- Should feel tactile and satisfying to turn

---

## 5. Visual Design — "Vintage Tech" Aesthetic
This is the defining design direction — avoid modern flat/neon UI entirely.

- **Palette:** Warm, aged tones — light yellow / amber / sepia. Explicitly **no neon colors**.
- **Texture:** Paper-like background texture, combined with **3D shapes and subtle 3D animation** (e.g. the dial, lever, and bell should have real depth/shadow, not flat vector icons)
- **Typography:** Old **typewriter/serif font** for numbers and text — not a digital LED/monospace look
- **Timer display:** A **circular progress ring wrapped around the digital number readout** (ring shows time remaining/elapsed visually; numbers show it precisely)
- **Decorative elements:** Small vintage details around the main UI for flavor — gears, tiny clock hands, secondary dials — decorative only, not functional clutter
- **Mode switch:** A physical lever/toggle switch visual, not a flat tab bar

---

## 6. Sound & Haptics
- **On completion:** A classic **mechanical bell/ding** sound (like an old kitchen timer going off)
- **While running:** **No ticking sound** — silent during countdown
- **Setting the time:** The rotating dial should play an **old mechanical dial/clockwork sound** as it's turned (like winding an old kitchen timer or rotary phone dial)
- **Mute:** A **mute/volume toggle** must be available to silence all sounds
- **Vibration (mobile):** Device should **vibrate on completion**, in addition to the sound

---

## 7. Mobile-Specific Requirements
- **Screen Wake Lock:** Screen must **stay awake** and not auto-lock while a timer/stopwatch is actively running (use the Wake Lock API)
- **PWA installable:** Must be installable to the home screen with a proper app icon and manifest
- **Landscape support:** Layout must adapt cleanly to landscape, not just portrait
- **Full-screen:** Should run full-screen (standalone display mode), no browser chrome once installed

---

## 8. Browser Tab Behavior
- While a timer is running, the **browser tab title should update live** to show the countdown (e.g. `12:34 — Pepper Timer`), so the time is visible even when the tab isn't focused

---

## 9. History & Stats
- **Session history:** Log of completed sessions is kept automatically
- **History view:** Shown as a **list of past sessions**, plus a **small chart/graph of daily totals**
- **Stats:** Show **total focused time today** and **this week**
- **Clear history:** User must be able to **clear/delete history**
- **Storage:** **Local only** — browser local storage (e.g. `localStorage` / `IndexedDB`). **No login, no account, no cross-device sync** needed

---

## 10. Explicitly Out of Scope (don't build these)
- No automatic Pomodoro-style work/break cycling
- No multiple simultaneous timers
- No session labels/task names
- No lap/split times in stopwatch
- No ticking sound during countdown
- No login/account system or cross-device sync
- No hard cap on max timer duration

---

## 11. Suggested Technical Notes for the Builder
- Use the **Web Audio API** for the bell sound and dial-turning sound effects
- Use the **Vibration API** for mobile completion haptics
- Use the **Screen Wake Lock API** to keep the screen on during active sessions
- Use `document.title` updates (with `requestAnimationFrame`/`setInterval`) for the live tab-title countdown
- Use a **Web App Manifest** + **Service Worker** for PWA installability and offline support
- Use CSS transforms/SVG for the circular progress ring and the rotating dial interaction
- Persist history/stats in `localStorage` (or `IndexedDB` if history grows large)

---

## 12. App Identity
- **Name:** Pepper Timer
- **Tone:** Warm, analog, a little nostalgic — like a well-loved kitchen timer, not a productivity SaaS tool

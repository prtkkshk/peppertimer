// Storage Manager for Pepper Timer
// Saves sessions in localStorage and generates daily statistics & chart data

const STORAGE_KEY = 'pepper_timer_runs';
const ACTIVE_SESSION_KEY = 'pepper_timer_active_session';

export function getRuns() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read runs from localStorage', e);
    return [];
  }
}

export function saveRun(durationMs) {
  return saveOrUpdateRun(durationMs, null);
}

export function saveOrUpdateRun(durationMs, existingRunId = null) {
  if (!durationMs || durationMs < 1000) return null; // Ignore runs shorter than 1 second

  const runs = getRuns();
  const now = new Date();

  let runIndex = -1;
  if (existingRunId) {
    runIndex = runs.findIndex(r => r.id === existingRunId);
  }

  if (runIndex !== -1) {
    // Update existing run duration and formatted duration
    runs[runIndex].durationMs = durationMs;
    runs[runIndex].formattedDuration = formatMs(durationMs);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
    } catch (e) {
      console.error('Failed to update run in localStorage', e);
    }
    return runs[runIndex];
  } else {
    // Format date as YYYY-MM-DD in local time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeOfDayStr = `${hours}:${minutes}`;

    const newRun = {
      id: existingRunId || ('run_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
      timestamp: now.getTime(),
      dateStr: dateStr,
      timeOfDay: timeOfDayStr,
      durationMs: durationMs,
      formattedDuration: formatMs(durationMs)
    };

    runs.unshift(newRun); // Newest first

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
    } catch (e) {
      console.error('Failed to save run to localStorage', e);
    }

    return newRun;
  }
}

export function getActiveSession() {
  try {
    const data = localStorage.getItem(ACTIVE_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to read active session from localStorage', e);
    return null;
  }
}

export function setActiveSession(sessionData) {
  try {
    if (!sessionData) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sessionData));
    }
  } catch (e) {
    console.error('Failed to save active session to localStorage', e);
  }
}

export function clearActiveSession() {
  setActiveSession(null);
}

export function clearRuns() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear runs from localStorage', e);
  }
}

export function getSummaryStats() {
  const runs = getRuns();
  const now = new Date();
  
  const todayYear = now.getFullYear();
  const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
  const todayDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

  // Start of week (7 days ago)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  let todayTotalMs = 0;
  let weekTotalMs = 0;

  runs.forEach(run => {
    if (run.dateStr === todayStr) {
      todayTotalMs += run.durationMs;
    }
    if (run.timestamp >= sevenDaysAgo.getTime()) {
      weekTotalMs += run.durationMs;
    }
  });

  return {
    todayTotalMs,
    todayFormatted: formatMsCompact(todayTotalMs),
    weekTotalMs,
    weekFormatted: formatMsCompact(weekTotalMs),
    totalRuns: runs.length
  };
}

export function get7DayChartData() {
  const runs = getRuns();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartData = [];

  const now = new Date();

  // Create slots for last 7 days (6 days ago through today)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayName = dayNames[d.getDay()];
    const isToday = i === 0;

    chartData.push({
      dateStr,
      dayLabel: dayName,
      shortDate: `${d.getMonth() + 1}/${d.getDate()}`,
      totalMs: 0,
      isToday
    });
  }

  // Aggregate durationMs for each day
  const dateMap = new Map();
  chartData.forEach(item => dateMap.set(item.dateStr, item));

  runs.forEach(run => {
    if (dateMap.has(run.dateStr)) {
      dateMap.get(run.dateStr).totalMs += run.durationMs;
    }
  });

  // Calculate maxMs for bar scaling
  const maxMs = Math.max(...chartData.map(d => d.totalMs), 60000); // min 1 min scale

  chartData.forEach(item => {
    item.percent = Math.min(100, Math.round((item.totalMs / maxMs) * 100));
    item.formattedTime = formatMsCompact(item.totalMs);
  });

  return {
    bars: chartData,
    maxMs,
    maxFormatted: formatMsCompact(maxMs)
  };
}

export function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function formatMsCompact(ms) {
  if (!ms || ms < 1000) return '0m';
  
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Pepper Timer Local Storage Manager for Session History & Analytics

const STORAGE_KEY = 'pepper_timer_history_v1';

export class StorageManager {
  static getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read session history:', e);
      return [];
    }
  }

  static addSession(mode, durationSeconds) {
    if (!durationSeconds || durationSeconds <= 0) return;
    try {
      const history = this.getHistory();
      const newSession = {
        id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        mode, // 'timer' or 'stopwatch'
        durationSeconds,
        timestamp: Date.now(),
        dateISO: new Date().toISOString()
      };
      history.unshift(newSession); // newest first
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      return newSession;
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }

  static clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  }

  static getTodayTotalSeconds() {
    const history = this.getHistory();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();

    return history
      .filter(s => s.timestamp >= todayMs)
      .reduce((sum, s) => sum + s.durationSeconds, 0);
  }

  static getWeekTotalSeconds() {
    const history = this.getHistory();
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - 6); // past 7 days
    const weekMs = startOfWeek.getTime();

    return history
      .filter(s => s.timestamp >= weekMs)
      .reduce((sum, s) => sum + s.durationSeconds, 0);
  }

  // Returns past 7 days breakdown for bar chart
  static getDailyStats(daysCount = 7) {
    const history = this.getHistory();
    const stats = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const startMs = d.getTime();
      const endMs = startMs + 86400000;

      const daySessions = history.filter(s => s.timestamp >= startMs && s.timestamp < endMs);
      const totalSec = daySessions.reduce((sum, s) => sum + s.durationSeconds, 0);

      const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' });
      const dateSubtext = `${d.getMonth() + 1}/${d.getDate()}`;

      stats.push({
        dateMs: startMs,
        dayLabel,
        dateSubtext,
        totalSeconds: totalSec,
        count: daySessions.length
      });
    }

    return stats;
  }
}

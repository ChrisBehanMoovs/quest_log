/**
 * History - Session tracking and statistics with localStorage
 */

const History = (function() {
    const STORAGE_KEY = 'questlog_sessions';
    const SETTINGS_KEY = 'questlog_settings';

    /**
     * Get all sessions from storage
     */
    function getSessions() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load sessions:', e);
            return [];
        }
    }

    /**
     * Save sessions to storage
     */
    function saveSessions(sessions) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        } catch (e) {
            console.error('Failed to save sessions:', e);
        }
    }

    /**
     * Add a new session
     */
    function addSession(sessionData) {
        const sessions = getSessions();

        const session = {
            id: Date.now(),
            startTime: sessionData.startTime.toISOString(),
            endTime: sessionData.endTime.toISOString(),
            duration: sessionData.duration, // in seconds
            completed: sessionData.completed,
            wasBreak: sessionData.wasBreak || false
        };

        sessions.unshift(session); // Add to beginning

        // Keep only last 1000 sessions
        if (sessions.length > 1000) {
            sessions.pop();
        }

        saveSessions(sessions);
        return session;
    }

    /**
     * Get today's date string (YYYY-MM-DD)
     */
    function getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Get sessions from today
     */
    function getTodaySessions() {
        const today = getTodayString();
        return getSessions().filter(s => {
            return s.startTime.startsWith(today) && !s.wasBreak;
        });
    }

    /**
     * Calculate total time today (in seconds)
     */
    function getTodayTotal() {
        return getTodaySessions()
            .filter(s => s.completed)
            .reduce((sum, s) => sum + s.duration, 0);
    }

    /**
     * Format duration in seconds to readable string
     */
    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    /**
     * Get completed session count
     */
    function getCompletedCount() {
        return getSessions().filter(s => s.completed && !s.wasBreak).length;
    }

    /**
     * Calculate streak (consecutive days with completed sessions)
     */
    function getStreak() {
        const sessions = getSessions().filter(s => s.completed && !s.wasBreak);
        if (sessions.length === 0) return 0;

        // Get unique dates with sessions
        const dates = new Set();
        sessions.forEach(s => {
            dates.add(s.startTime.split('T')[0]);
        });

        const sortedDates = Array.from(dates).sort().reverse();

        // Check if today or yesterday has a session
        const today = getTodayString();
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (!dates.has(today) && !dates.has(yesterday)) {
            return 0; // Streak broken
        }

        // Count consecutive days
        let streak = 0;
        let checkDate = new Date();

        // If no session today, start from yesterday
        if (!dates.has(today)) {
            checkDate = new Date(Date.now() - 86400000);
        }

        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (dates.has(dateStr)) {
                streak++;
                checkDate = new Date(checkDate.getTime() - 86400000);
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Get statistics object
     */
    function getStats() {
        const sessions = getSessions();
        const focusSessions = sessions.filter(s => !s.wasBreak);

        return {
            todayTotal: getTodayTotal(),
            todayFormatted: formatDuration(getTodayTotal()),
            completedCount: focusSessions.filter(s => s.completed).length,
            abortedCount: focusSessions.filter(s => !s.completed).length,
            streak: getStreak(),
            totalTime: focusSessions.reduce((sum, s) => sum + s.duration, 0),
            totalTimeFormatted: formatDuration(focusSessions.reduce((sum, s) => sum + s.duration, 0))
        };
    }

    /**
     * Get recent sessions for display
     */
    function getRecentSessions(limit = 20) {
        return getSessions()
            .filter(s => !s.wasBreak)
            .slice(0, limit)
            .map(s => ({
                ...s,
                durationFormatted: formatDuration(s.duration),
                dateFormatted: formatDate(new Date(s.startTime))
            }));
    }

    /**
     * Format date for display
     */
    function formatDate(date) {
        const today = getTodayString();
        const dateStr = date.toISOString().split('T')[0];

        if (dateStr === today) {
            return 'Today ' + date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (dateStr === yesterday) {
            return 'Yesterday ' + date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * Clear all history
     */
    function clearAll() {
        localStorage.removeItem(STORAGE_KEY);
    }

    /**
     * Save a setting
     */
    function saveSetting(key, value) {
        try {
            const settings = getSettings();
            settings[key] = value;
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save setting:', e);
        }
    }

    /**
     * Get all settings
     */
    function getSettings() {
        try {
            const data = localStorage.getItem(SETTINGS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    /**
     * Get a specific setting with default
     */
    function getSetting(key, defaultValue) {
        const settings = getSettings();
        return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
    }

    return {
        getSessions,
        addSession,
        getTodayTotal,
        getCompletedCount,
        getStreak,
        getStats,
        getRecentSessions,
        formatDuration,
        clearAll,
        saveSetting,
        getSetting
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = History;
}

/**
 * Timer - Core state machine for the focus timer
 * States: idle, running, paused, break
 */

const Timer = (function() {
    // State
    let state = 'idle'; // idle, running, paused, break
    let totalSeconds = 14400; // Default 4 hours
    let remainingSeconds = 14400;
    let intervalId = null;
    let sessionStartTime = null;
    let isBreak = false;

    // Callbacks
    let onTick = () => {};
    let onStateChange = () => {};
    let onComplete = () => {};
    let onWarning = () => {};

    // Constants
    const WARNING_THRESHOLDS = [300, 60]; // 5 min, 1 min warnings
    let triggeredWarnings = new Set();

    /**
     * Format seconds to HH:MM:SS
     */
    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return {
            hours: String(h).padStart(2, '0'),
            minutes: String(m).padStart(2, '0'),
            seconds: String(s).padStart(2, '0'),
            formatted: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        };
    }

    /**
     * Tick - called every second when running
     */
    function tick() {
        if (remainingSeconds <= 0) {
            complete();
            return;
        }

        remainingSeconds--;

        // Check for warnings
        WARNING_THRESHOLDS.forEach(threshold => {
            if (remainingSeconds === threshold && !triggeredWarnings.has(threshold)) {
                triggeredWarnings.add(threshold);
                onWarning(threshold);
            }
        });

        onTick(formatTime(remainingSeconds), remainingSeconds);
    }

    /**
     * Complete - session finished successfully
     */
    function complete() {
        clearInterval(intervalId);
        intervalId = null;

        const duration = totalSeconds - remainingSeconds;
        const wasBreak = isBreak;

        state = 'idle';
        isBreak = false;

        onComplete({
            duration: totalSeconds,
            startTime: sessionStartTime,
            endTime: new Date(),
            completed: true,
            wasBreak: wasBreak
        });

        onStateChange(state);
    }

    /**
     * Start the timer
     */
    function start() {
        if (state === 'running') return;

        if (state === 'idle') {
            sessionStartTime = new Date();
            triggeredWarnings.clear();
        }

        state = 'running';
        intervalId = setInterval(tick, 1000);
        onStateChange(state, isBreak);
    }

    /**
     * Pause the timer
     */
    function pause() {
        if (state !== 'running') return;

        state = 'paused';
        clearInterval(intervalId);
        intervalId = null;
        onStateChange(state);
    }

    /**
     * Toggle play/pause
     */
    function toggle() {
        if (state === 'running') {
            pause();
        } else {
            start();
        }
    }

    /**
     * Reset to initial time
     */
    function reset() {
        clearInterval(intervalId);
        intervalId = null;
        state = 'idle';
        remainingSeconds = totalSeconds;
        isBreak = false;
        triggeredWarnings.clear();
        onTick(formatTime(remainingSeconds), remainingSeconds);
        onStateChange(state);
    }

    /**
     * Abort - end session without completing
     */
    function abort() {
        const duration = totalSeconds - remainingSeconds;
        const startTime = sessionStartTime;

        clearInterval(intervalId);
        intervalId = null;
        state = 'idle';
        remainingSeconds = totalSeconds;
        isBreak = false;
        triggeredWarnings.clear();

        // Only log if some time has passed
        if (duration > 60) {
            onComplete({
                duration: duration,
                startTime: startTime,
                endTime: new Date(),
                completed: false,
                wasBreak: false
            });
        }

        onTick(formatTime(remainingSeconds), remainingSeconds);
        onStateChange(state);
    }

    /**
     * Set total time in seconds
     */
    function setTime(seconds) {
        if (state === 'running') return; // Can't change while running

        totalSeconds = Math.max(60, Math.min(seconds, 43200)); // 1 min to 12 hours
        remainingSeconds = totalSeconds;
        onTick(formatTime(remainingSeconds), remainingSeconds);
    }

    /**
     * Adjust time by delta seconds
     */
    function adjustTime(delta) {
        if (state === 'running') return;

        const newTime = totalSeconds + delta;
        setTime(newTime);
    }

    /**
     * Start a break timer
     */
    function startBreak(breakSeconds) {
        totalSeconds = breakSeconds;
        remainingSeconds = breakSeconds;
        isBreak = true;
        sessionStartTime = new Date();
        triggeredWarnings.clear();
        onTick(formatTime(remainingSeconds), remainingSeconds);
        start();
    }

    /**
     * Get current state info
     */
    function getState() {
        return {
            state: state,
            totalSeconds: totalSeconds,
            remainingSeconds: remainingSeconds,
            isBreak: isBreak,
            time: formatTime(remainingSeconds)
        };
    }

    // Public API
    return {
        start,
        pause,
        toggle,
        reset,
        abort,
        setTime,
        adjustTime,
        startBreak,
        getState,
        formatTime,

        // Event handlers
        set onTick(fn) { onTick = fn; },
        set onStateChange(fn) { onStateChange = fn; },
        set onComplete(fn) { onComplete = fn; },
        set onWarning(fn) { onWarning = fn; },
    };
})();

// Export for ES modules (if needed in future)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Timer;
}

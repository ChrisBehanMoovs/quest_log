/**
 * Quest Log - Main Application
 * Hardcore Focus Timer with Matrix Aesthetic
 */

(function() {
    'use strict';

    // DOM Elements
    const elements = {
        // Timer display
        timerDigits: {
            hours: document.querySelector('[data-digit="hours"]'),
            minutes: document.querySelector('[data-digit="minutes"]'),
            seconds: document.querySelector('[data-digit="seconds"]')
        },
        timerFrame: document.querySelector('.timer-frame'),
        timerContainer: document.querySelector('.timer-container'),
        timerStatus: document.getElementById('timer-status'),

        // Controls
        btnStart: document.getElementById('btn-start'),
        btnReset: document.getElementById('btn-reset'),
        btnAbort: document.getElementById('btn-abort'),
        presetBtns: document.querySelectorAll('.preset-btn'),
        adjustBtns: document.querySelectorAll('.adjust-btn'),

        // Stats
        statToday: document.getElementById('stat-today'),
        statStreak: document.getElementById('stat-streak'),
        statSessions: document.getElementById('stat-sessions'),

        // History
        toggleHistory: document.getElementById('toggle-history'),
        historyPanel: document.getElementById('history-panel'),
        historyList: document.getElementById('history-list'),
        closeHistory: document.getElementById('close-history'),

        // Sound
        toggleSound: document.getElementById('toggle-sound'),
        soundStatus: document.getElementById('sound-status'),

        // Modals
        breakModal: document.getElementById('break-modal'),
        abortModal: document.getElementById('abort-modal'),
        btnShortBreak: document.getElementById('btn-short-break'),
        btnLongBreak: document.getElementById('btn-long-break'),
        btnSkipBreak: document.getElementById('btn-skip-break'),
        btnConfirmAbort: document.getElementById('btn-confirm-abort'),
        btnCancelAbort: document.getElementById('btn-cancel-abort'),

        // Matrix
        matrixCanvas: document.getElementById('matrix-rain')
    };

    // App state
    let currentPreset = 14400; // 4 hours default
    let lastCompletedDuration = 0;

    /**
     * Initialize the application
     */
    function init() {
        // Initialize modules
        MatrixRain.init(elements.matrixCanvas);
        MatrixRain.start();

        Keyboard.init();
        Sounds.init();

        // Load saved settings
        const savedMuted = History.getSetting('muted', false);
        Sounds.setMuted(savedMuted);
        updateSoundStatus();

        // Set up Timer callbacks
        Timer.onTick = handleTick;
        Timer.onStateChange = handleStateChange;
        Timer.onComplete = handleComplete;
        Timer.onWarning = handleWarning;

        // Initial display
        updateTimerDisplay(Timer.getState().time);
        updateStats();

        // Bind event listeners
        bindEvents();
        bindKeyboardShortcuts();

        // Set initial preset highlight
        highlightPreset(currentPreset);

        console.log('// QUEST LOG INITIALIZED');
        console.log('// DEFAULT SESSION: 4 HOURS');
        console.log('// PRESS SPACE TO BEGIN');
    }

    /**
     * Bind DOM event listeners
     */
    function bindEvents() {
        // Start/Pause button
        elements.btnStart.addEventListener('click', () => {
            Sounds.playKeypress();
            Timer.toggle();
        });

        // Reset button
        elements.btnReset.addEventListener('click', () => {
            Sounds.playKeypress();
            Timer.reset();
            Timer.setTime(currentPreset);
        });

        // Abort button
        elements.btnAbort.addEventListener('click', () => {
            Sounds.playKeypress();
            showAbortModal();
        });

        // Preset buttons
        elements.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                Sounds.playKeypress();
                const time = parseInt(btn.dataset.time, 10);
                setPreset(time);
            });
        });

        // Adjust buttons
        elements.adjustBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                Sounds.playKeypress();
                const adjust = parseInt(btn.dataset.adjust, 10);
                Timer.adjustTime(adjust);
                currentPreset = Timer.getState().totalSeconds;
                highlightPreset(currentPreset);
            });
        });

        // History toggle
        elements.toggleHistory.addEventListener('click', () => {
            toggleHistoryPanel();
        });

        elements.closeHistory.addEventListener('click', () => {
            toggleHistoryPanel(false);
        });

        // Sound toggle
        elements.toggleSound.addEventListener('click', () => {
            toggleMute();
        });

        // Break modal buttons
        elements.btnShortBreak.addEventListener('click', () => {
            hideBreakModal();
            startBreak(300); // 5 minutes
        });

        elements.btnLongBreak.addEventListener('click', () => {
            hideBreakModal();
            startBreak(900); // 15 minutes
        });

        elements.btnSkipBreak.addEventListener('click', () => {
            hideBreakModal();
            Timer.setTime(currentPreset);
        });

        // Abort modal buttons
        elements.btnConfirmAbort.addEventListener('click', () => {
            hideAbortModal();
            Sounds.playAbort();
            Timer.abort();
        });

        elements.btnCancelAbort.addEventListener('click', () => {
            hideAbortModal();
        });

        // Close modals on background click
        elements.breakModal.addEventListener('click', (e) => {
            if (e.target === elements.breakModal) {
                hideBreakModal();
            }
        });

        elements.abortModal.addEventListener('click', (e) => {
            if (e.target === elements.abortModal) {
                hideAbortModal();
            }
        });
    }

    /**
     * Bind keyboard shortcuts
     */
    function bindKeyboardShortcuts() {
        Keyboard.on('toggle', () => {
            Sounds.playKeypress();
            Timer.toggle();
        });

        Keyboard.on('reset', () => {
            Sounds.playKeypress();
            Timer.reset();
            Timer.setTime(currentPreset);
        });

        Keyboard.on('abort', () => {
            const state = Timer.getState();
            if (state.state === 'running' || state.state === 'paused') {
                Sounds.playKeypress();
                showAbortModal();
            }
        });

        Keyboard.on('adjustUp', () => {
            Sounds.playKeypress();
            Timer.adjustTime(900);
            currentPreset = Timer.getState().totalSeconds;
            highlightPreset(currentPreset);
        });

        Keyboard.on('adjustDown', () => {
            Sounds.playKeypress();
            Timer.adjustTime(-900);
            currentPreset = Timer.getState().totalSeconds;
            highlightPreset(currentPreset);
        });

        Keyboard.on('preset1', () => {
            Sounds.playKeypress();
            setPreset(3600);
        });

        Keyboard.on('preset2', () => {
            Sounds.playKeypress();
            setPreset(7200);
        });

        Keyboard.on('preset3', () => {
            Sounds.playKeypress();
            setPreset(14400);
        });

        Keyboard.on('preset4', () => {
            Sounds.playKeypress();
            setPreset(28800);
        });

        Keyboard.on('toggleHistory', () => {
            Sounds.playKeypress();
            toggleHistoryPanel();
        });

        Keyboard.on('toggleMute', () => {
            toggleMute();
        });
    }

    /**
     * Handle timer tick
     */
    function handleTick(time, remaining) {
        updateTimerDisplay(time);
        updatePageTitle(time.formatted);

        // Subtle glitch on second change
        if (Math.random() < 0.02) {
            Glitch.glitchText(elements.timerDigits.seconds, 50, 1);
        }
    }

    /**
     * Handle timer state changes
     */
    function handleStateChange(state, isBreak) {
        const container = elements.timerContainer;

        // Remove all state classes
        container.classList.remove('timer-running', 'timer-paused', 'timer-warning');

        switch (state) {
            case 'running':
                container.classList.add('timer-running');
                elements.timerStatus.textContent = isBreak ? '[ BREAK ]' : '[ FOCUS ]';
                elements.btnStart.querySelector('.btn-text').textContent = 'PAUSE';
                elements.btnStart.querySelector('.btn-icon').textContent = '⏸';
                elements.btnAbort.classList.remove('hidden');
                Sounds.playStart();
                Glitch.startDigitGlitch(Object.values(elements.timerDigits));
                break;

            case 'paused':
                container.classList.add('timer-paused');
                elements.timerStatus.textContent = '[ PAUSED ]';
                elements.btnStart.querySelector('.btn-text').textContent = 'RESUME';
                elements.btnStart.querySelector('.btn-icon').textContent = '▶';
                Sounds.playPause();
                Glitch.stopDigitGlitch();
                break;

            case 'idle':
                elements.timerStatus.textContent = '[ READY ]';
                elements.btnStart.querySelector('.btn-text').textContent = 'INITIATE';
                elements.btnStart.querySelector('.btn-icon').textContent = '▶';
                elements.btnAbort.classList.add('hidden');
                Glitch.stopDigitGlitch();
                updatePageTitle('QUEST LOG');
                break;
        }
    }

    /**
     * Handle timer completion
     */
    function handleComplete(sessionData) {
        if (sessionData.wasBreak) {
            // Break completed
            Sounds.playComplete();
            Timer.setTime(currentPreset);
            updateStats();
            return;
        }

        // Focus session completed
        History.addSession(sessionData);
        lastCompletedDuration = sessionData.duration;
        updateStats();

        if (sessionData.completed) {
            Sounds.playComplete();
            Glitch.glitchBurst(elements.timerStatus, 500);
            showBreakModal();
        }
    }

    /**
     * Handle timer warnings
     */
    function handleWarning(secondsRemaining) {
        elements.timerContainer.classList.add('timer-warning');
        Glitch.rgbSplit(elements.timerDigits.minutes, 200);
    }

    /**
     * Update timer display
     */
    function updateTimerDisplay(time) {
        elements.timerDigits.hours.textContent = time.hours;
        elements.timerDigits.minutes.textContent = time.minutes;
        elements.timerDigits.seconds.textContent = time.seconds;
    }

    /**
     * Update page title with time
     */
    function updatePageTitle(text) {
        document.title = `${text} // QUEST LOG`;
    }

    /**
     * Update stats display
     */
    function updateStats() {
        const stats = History.getStats();
        elements.statToday.textContent = stats.todayFormatted;
        elements.statStreak.textContent = `${stats.streak} day${stats.streak !== 1 ? 's' : ''}`;
        elements.statSessions.textContent = stats.completedCount;
    }

    /**
     * Set preset time
     */
    function setPreset(seconds) {
        const state = Timer.getState();
        if (state.state === 'running') return;

        currentPreset = seconds;
        Timer.setTime(seconds);
        highlightPreset(seconds);
    }

    /**
     * Highlight active preset button
     */
    function highlightPreset(seconds) {
        elements.presetBtns.forEach(btn => {
            const btnTime = parseInt(btn.dataset.time, 10);
            btn.classList.toggle('active', btnTime === seconds);
        });
    }

    /**
     * Toggle history panel
     */
    function toggleHistoryPanel(show) {
        const isHidden = elements.historyPanel.classList.contains('hidden');
        const shouldShow = show !== undefined ? show : isHidden;

        if (shouldShow) {
            renderHistoryList();
            elements.historyPanel.classList.remove('hidden');
        } else {
            elements.historyPanel.classList.add('hidden');
        }
    }

    /**
     * Render history list
     */
    function renderHistoryList() {
        const sessions = History.getRecentSessions(20);

        if (sessions.length === 0) {
            elements.historyList.innerHTML = '<div class="history-empty">No sessions yet. Start your first focus session!</div>';
            return;
        }

        elements.historyList.innerHTML = sessions.map(session => `
            <div class="history-item">
                <span class="history-date">${session.dateFormatted}</span>
                <span class="history-duration">${session.durationFormatted}</span>
                <span class="history-status ${session.completed ? 'completed' : 'aborted'}">
                    ${session.completed ? 'DONE' : 'ABORT'}
                </span>
            </div>
        `).join('');
    }

    /**
     * Toggle mute
     */
    function toggleMute() {
        const isMuted = Sounds.toggleMute();
        History.saveSetting('muted', isMuted);
        updateSoundStatus();

        if (!isMuted) {
            Sounds.playKeypress();
        }
    }

    /**
     * Update sound status display
     */
    function updateSoundStatus() {
        const { isMuted } = Sounds.getState();
        elements.soundStatus.textContent = isMuted ? 'MUTED' : 'SOUND ON';
    }

    /**
     * Start a break
     */
    function startBreak(seconds) {
        Sounds.playBreakStart();
        Timer.startBreak(seconds);
    }

    /**
     * Show break modal
     */
    function showBreakModal() {
        // Adjust break message based on session duration
        const message = lastCompletedDuration >= 14400
            ? 'Epic session logged. You earned a long break.'
            : 'Session logged. Take a break?';

        elements.breakModal.querySelector('.modal-message').textContent = message;
        elements.breakModal.classList.remove('hidden');
        Keyboard.disable();
    }

    /**
     * Hide break modal
     */
    function hideBreakModal() {
        elements.breakModal.classList.add('hidden');
        Keyboard.enable();
    }

    /**
     * Show abort confirmation modal
     */
    function showAbortModal() {
        elements.abortModal.classList.remove('hidden');
        Keyboard.disable();
    }

    /**
     * Hide abort modal
     */
    function hideAbortModal() {
        elements.abortModal.classList.add('hidden');
        Keyboard.enable();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

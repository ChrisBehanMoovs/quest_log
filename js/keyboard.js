/**
 * Keyboard - Hotkey bindings for the timer
 */

const Keyboard = (function() {
    let handlers = {};
    let isEnabled = true;

    // Default key bindings
    const bindings = {
        'Space': 'toggle',
        'KeyR': 'reset',
        'Escape': 'abort',
        'Equal': 'adjustUp',      // + key
        'Minus': 'adjustDown',    // - key
        'NumpadAdd': 'adjustUp',
        'NumpadSubtract': 'adjustDown',
        'Digit1': 'preset1',
        'Digit2': 'preset2',
        'Digit3': 'preset3',
        'Digit4': 'preset4',
        'KeyH': 'toggleHistory',
        'KeyM': 'toggleMute'
    };

    /**
     * Initialize keyboard handler
     */
    function init() {
        document.addEventListener('keydown', handleKeyDown);
    }

    /**
     * Handle keydown events
     */
    function handleKeyDown(event) {
        if (!isEnabled) return;

        // Ignore if typing in an input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        const action = bindings[event.code];
        if (action && handlers[action]) {
            event.preventDefault();
            handlers[action](event);
        }
    }

    /**
     * Register handler for an action
     */
    function on(action, callback) {
        handlers[action] = callback;
    }

    /**
     * Remove handler for an action
     */
    function off(action) {
        delete handlers[action];
    }

    /**
     * Enable keyboard shortcuts
     */
    function enable() {
        isEnabled = true;
    }

    /**
     * Disable keyboard shortcuts
     */
    function disable() {
        isEnabled = false;
    }

    /**
     * Get current bindings (for help display)
     */
    function getBindings() {
        return {
            'SPACE': 'Play/Pause',
            'R': 'Reset',
            'ESC': 'Abort',
            '+/-': 'Adjust ±15 min',
            '1-4': 'Quick presets',
            'H': 'Toggle history',
            'M': 'Toggle mute'
        };
    }

    /**
     * Clean up
     */
    function destroy() {
        document.removeEventListener('keydown', handleKeyDown);
        handlers = {};
    }

    return {
        init,
        on,
        off,
        enable,
        disable,
        getBindings,
        destroy
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Keyboard;
}

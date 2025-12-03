/**
 * Sounds - Web Audio API synthesized sound effects
 * No external audio files needed
 */

const Sounds = (function() {
    let audioCtx = null;
    let masterGain = null;
    let isMuted = false;
    let volume = 0.5;

    /**
     * Initialize audio context (must be called after user interaction)
     */
    function init() {
        if (audioCtx) return;

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = volume;
        masterGain.connect(audioCtx.destination);
    }

    /**
     * Resume audio context if suspended
     */
    function resume() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    /**
     * Create an oscillator with envelope
     */
    function createTone(frequency, type, duration, attack = 0.01, decay = 0.1, sustain = 0.5, release = 0.1) {
        if (!audioCtx || isMuted) return;

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        const now = audioCtx.currentTime;

        // ADSR envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(1, now + attack);
        gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);
        gainNode.gain.setValueAtTime(sustain, now + duration - release);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(gainNode);
        gainNode.connect(masterGain);

        osc.start(now);
        osc.stop(now + duration);

        return osc;
    }

    /**
     * Play start sound - system online beep sequence
     */
    function playStart() {
        init();
        resume();

        // Rising beep sequence
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                createTone(freq, 'square', 0.1, 0.005, 0.02, 0.3, 0.05);
            }, i * 80);
        });

        // Low hum
        setTimeout(() => {
            createTone(110, 'sawtooth', 0.3, 0.05, 0.1, 0.2, 0.15);
        }, 300);
    }

    /**
     * Play pause sound - descending tone
     */
    function playPause() {
        init();
        resume();

        createTone(660, 'square', 0.15, 0.01, 0.05, 0.4, 0.09);
        setTimeout(() => {
            createTone(440, 'square', 0.2, 0.01, 0.05, 0.3, 0.14);
        }, 100);
    }

    /**
     * Play complete sound - triumphant chord
     */
    function playComplete() {
        init();
        resume();

        // Chord progression
        const chord1 = [523, 659, 784]; // C major
        const chord2 = [587, 740, 880]; // D major
        const chord3 = [659, 830, 988]; // E major

        chord1.forEach(freq => {
            createTone(freq, 'triangle', 0.4, 0.02, 0.1, 0.6, 0.2);
        });

        setTimeout(() => {
            chord2.forEach(freq => {
                createTone(freq, 'triangle', 0.4, 0.02, 0.1, 0.5, 0.2);
            });
        }, 300);

        setTimeout(() => {
            chord3.forEach(freq => {
                createTone(freq, 'triangle', 0.6, 0.02, 0.15, 0.7, 0.3);
            });
        }, 600);

        // Victory beeps
        setTimeout(() => {
            createTone(1318, 'square', 0.1, 0.01, 0.02, 0.4, 0.07);
        }, 900);
        setTimeout(() => {
            createTone(1568, 'square', 0.15, 0.01, 0.02, 0.4, 0.12);
        }, 1000);
    }

    /**
     * Play abort sound - error buzzer
     */
    function playAbort() {
        init();
        resume();

        // Harsh descending buzz
        createTone(200, 'sawtooth', 0.3, 0.01, 0.05, 0.8, 0.2);
        createTone(150, 'sawtooth', 0.4, 0.05, 0.1, 0.6, 0.25);

        setTimeout(() => {
            createTone(100, 'sawtooth', 0.5, 0.01, 0.1, 0.5, 0.35);
        }, 200);
    }

    /**
     * Play warning sound - urgent beeps
     */
    function playWarning(intensity = 1) {
        init();
        resume();

        const baseFreq = 800 + (intensity * 200);
        const beeps = intensity === 1 ? 3 : 5;

        for (let i = 0; i < beeps; i++) {
            setTimeout(() => {
                createTone(baseFreq, 'square', 0.1, 0.005, 0.02, 0.5, 0.07);
            }, i * 150);
        }
    }

    /**
     * Play tick sound - subtle click (optional per-minute)
     */
    function playTick() {
        init();
        resume();

        createTone(1200, 'sine', 0.02, 0.001, 0.005, 0.2, 0.01);
    }

    /**
     * Play keypress sound - mechanical click
     */
    function playKeypress() {
        init();
        resume();

        // Short click
        createTone(800, 'square', 0.03, 0.001, 0.01, 0.3, 0.01);
        createTone(400, 'square', 0.02, 0.001, 0.005, 0.2, 0.01);
    }

    /**
     * Play break start sound - relaxing tone
     */
    function playBreakStart() {
        init();
        resume();

        // Soft descending tones
        createTone(659, 'sine', 0.5, 0.05, 0.2, 0.4, 0.25);
        setTimeout(() => {
            createTone(523, 'sine', 0.6, 0.05, 0.2, 0.3, 0.35);
        }, 300);
        setTimeout(() => {
            createTone(392, 'sine', 0.8, 0.05, 0.3, 0.2, 0.45);
        }, 600);
    }

    /**
     * Set mute state
     */
    function setMuted(muted) {
        isMuted = muted;
        if (masterGain) {
            masterGain.gain.value = muted ? 0 : volume;
        }
    }

    /**
     * Toggle mute
     */
    function toggleMute() {
        setMuted(!isMuted);
        return isMuted;
    }

    /**
     * Set volume (0 to 1)
     */
    function setVolume(value) {
        volume = Math.max(0, Math.min(1, value));
        if (masterGain && !isMuted) {
            masterGain.gain.value = volume;
        }
    }

    /**
     * Get current state
     */
    function getState() {
        return {
            isMuted,
            volume
        };
    }

    return {
        init,
        playStart,
        playPause,
        playComplete,
        playAbort,
        playWarning,
        playTick,
        playKeypress,
        playBreakStart,
        setMuted,
        toggleMute,
        setVolume,
        getState
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sounds;
}

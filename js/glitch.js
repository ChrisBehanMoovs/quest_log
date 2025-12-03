/**
 * Glitch - Text glitch effects for timer digits
 */

const Glitch = (function() {
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEF';
    let activeGlitches = new Map();

    /**
     * Glitch a single element's text temporarily
     */
    function glitchText(element, duration = 100, intensity = 3) {
        const originalText = element.textContent;
        let iterations = 0;
        const maxIterations = intensity;

        const interval = setInterval(() => {
            if (iterations >= maxIterations) {
                element.textContent = originalText;
                clearInterval(interval);
                return;
            }

            element.textContent = originalText
                .split('')
                .map((char, index) => {
                    if (Math.random() < 0.3) {
                        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
                    }
                    return char;
                })
                .join('');

            iterations++;
        }, duration / intensity);
    }

    /**
     * Apply continuous subtle glitch to timer digits
     */
    function startDigitGlitch(digitElements) {
        if (activeGlitches.has('digits')) return;

        const interval = setInterval(() => {
            // Randomly pick a digit to glitch
            if (Math.random() < 0.05) {
                const randomDigit = digitElements[Math.floor(Math.random() * digitElements.length)];
                glitchText(randomDigit, 80, 2);
            }
        }, 500);

        activeGlitches.set('digits', interval);
    }

    /**
     * Stop digit glitching
     */
    function stopDigitGlitch() {
        const interval = activeGlitches.get('digits');
        if (interval) {
            clearInterval(interval);
            activeGlitches.delete('digits');
        }
    }

    /**
     * Screen tear effect - add/remove class
     */
    function screenTear(element, duration = 200) {
        element.classList.add('screen-tear');
        setTimeout(() => {
            element.classList.remove('screen-tear');
        }, duration);
    }

    /**
     * RGB split effect on element
     */
    function rgbSplit(element, duration = 150) {
        element.style.textShadow = `
            -2px 0 #ff0040,
            2px 0 #00ffff
        `;
        element.style.transform = 'translateX(-1px)';

        setTimeout(() => {
            element.style.textShadow = '';
            element.style.transform = '';
        }, duration);
    }

    /**
     * Heavy glitch burst - for transitions/events
     */
    function glitchBurst(element, duration = 300) {
        const originalText = element.textContent;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;

            if (elapsed >= duration) {
                element.textContent = originalText;
                element.style.transform = '';
                element.style.filter = '';
                return;
            }

            // Random character replacement
            element.textContent = originalText
                .split('')
                .map(char => {
                    if (Math.random() < 0.4) {
                        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
                    }
                    return char;
                })
                .join('');

            // Random displacement
            const offsetX = (Math.random() - 0.5) * 4;
            const offsetY = (Math.random() - 0.5) * 2;
            element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

            // Random color shift
            if (Math.random() < 0.2) {
                element.style.filter = `hue-rotate(${Math.random() * 90}deg)`;
            } else {
                element.style.filter = '';
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Typing effect for text
     */
    function typeText(element, text, speed = 50, callback) {
        element.textContent = '';
        let index = 0;

        const type = () => {
            if (index < text.length) {
                element.textContent += text[index];
                index++;
                setTimeout(type, speed);
            } else if (callback) {
                callback();
            }
        };

        type();
    }

    /**
     * Scramble reveal effect
     */
    function scrambleReveal(element, targetText, duration = 500) {
        const length = targetText.length;
        const startTime = Date.now();
        const revealOrder = Array.from({ length }, (_, i) => i)
            .sort(() => Math.random() - 0.5);

        let revealed = new Set();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Reveal more characters over time
            const charsToReveal = Math.floor(progress * length);
            for (let i = 0; i < charsToReveal; i++) {
                revealed.add(revealOrder[i]);
            }

            // Build the display string
            let display = '';
            for (let i = 0; i < length; i++) {
                if (revealed.has(i)) {
                    display += targetText[i];
                } else {
                    display += glitchChars[Math.floor(Math.random() * glitchChars.length)];
                }
            }

            element.textContent = display;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * Clean up all active effects
     */
    function cleanup() {
        activeGlitches.forEach((interval) => {
            clearInterval(interval);
        });
        activeGlitches.clear();
    }

    return {
        glitchText,
        startDigitGlitch,
        stopDigitGlitch,
        screenTear,
        rgbSplit,
        glitchBurst,
        typeText,
        scrambleReveal,
        cleanup
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Glitch;
}

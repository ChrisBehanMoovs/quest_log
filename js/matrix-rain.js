/**
 * Matrix Rain - Canvas-based falling code effect
 */

const MatrixRain = (function() {
    let canvas = null;
    let ctx = null;
    let animationId = null;
    let columns = [];
    let isRunning = false;

    // Configuration
    const config = {
        fontSize: 14,
        speed: 0.5,
        fadeOpacity: 0.05,
        density: 1, // columns per pixel
        color: '#00ff41',
        dimColor: '#008f11',
        brightChance: 0.1 // Chance of bright character
    };

    // Character set - Katakana + Latin + Numbers + Symbols
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*(){}[]|;:<>?';

    /**
     * Initialize the rain effect
     */
    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');

        resize();
        window.addEventListener('resize', resize);
    }

    /**
     * Handle window resize
     */
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Recalculate columns
        const columnCount = Math.floor(canvas.width / config.fontSize * config.density);
        columns = [];

        for (let i = 0; i < columnCount; i++) {
            columns.push({
                x: i * (canvas.width / columnCount),
                y: Math.random() * canvas.height,
                speed: 0.3 + Math.random() * 0.7,
                chars: generateColumnChars()
            });
        }
    }

    /**
     * Generate random characters for a column
     */
    function generateColumnChars() {
        const length = 5 + Math.floor(Math.random() * 15);
        let result = [];
        for (let i = 0; i < length; i++) {
            result.push(chars[Math.floor(Math.random() * chars.length)]);
        }
        return result;
    }

    /**
     * Get random character
     */
    function getRandomChar() {
        return chars[Math.floor(Math.random() * chars.length)];
    }

    /**
     * Draw a single frame
     */
    function draw() {
        // Fade effect - draw semi-transparent black rectangle
        ctx.fillStyle = `rgba(10, 10, 10, ${config.fadeOpacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `${config.fontSize}px 'Fira Code', monospace`;

        columns.forEach((column, index) => {
            // Randomly change a character in the column
            if (Math.random() < 0.02) {
                const charIndex = Math.floor(Math.random() * column.chars.length);
                column.chars[charIndex] = getRandomChar();
            }

            // Draw characters in column
            column.chars.forEach((char, charIndex) => {
                const y = column.y - (charIndex * config.fontSize);

                if (y < 0 || y > canvas.height) return;

                // First character is brightest
                if (charIndex === 0) {
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = config.color;
                    ctx.shadowBlur = 10;
                } else if (charIndex < 3) {
                    ctx.fillStyle = config.color;
                    ctx.shadowColor = config.color;
                    ctx.shadowBlur = 5;
                } else {
                    ctx.fillStyle = config.dimColor;
                    ctx.shadowBlur = 0;
                }

                // Random brightness boost
                if (Math.random() < config.brightChance && charIndex > 2) {
                    ctx.fillStyle = config.color;
                }

                ctx.fillText(char, column.x, y);
            });

            // Reset shadow
            ctx.shadowBlur = 0;

            // Move column down
            column.y += column.speed * config.fontSize * config.speed;

            // Reset if off screen
            if (column.y - (column.chars.length * config.fontSize) > canvas.height) {
                column.y = 0;
                column.speed = 0.3 + Math.random() * 0.7;
                column.chars = generateColumnChars();
            }
        });
    }

    /**
     * Animation loop
     */
    function animate() {
        if (!isRunning) return;
        draw();
        animationId = requestAnimationFrame(animate);
    }

    /**
     * Start the rain effect
     */
    function start() {
        if (isRunning) return;
        isRunning = true;
        animate();
    }

    /**
     * Stop the rain effect
     */
    function stop() {
        isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    /**
     * Set intensity (0 to 1)
     */
    function setIntensity(value) {
        config.fadeOpacity = 0.03 + (1 - value) * 0.1;
        config.speed = 0.3 + value * 0.5;
    }

    /**
     * Clean up
     */
    function destroy() {
        stop();
        window.removeEventListener('resize', resize);
        canvas = null;
        ctx = null;
    }

    return {
        init,
        start,
        stop,
        setIntensity,
        destroy
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MatrixRain;
}

// robotAnimation.js - Enhanced Version
console.log("Robot animation initialized");

export function initRobot() {
    // =======================
    // 1. CONFIG / CONSTANTS
    // =======================
    const CONFIG = {
        BLINK_DURATION: 300,
        MIN_BLINK_INTERVAL: 2000,
        MAX_BLINK_INTERVAL: 4000,
        TYPEWRITER_SPEED: 100,
        TYPEWRITER_SPEED: 100,
        DEFAULT_DISPLAY_TIME: 1000,
        
        // New or revised:
        IDLE_EXPRESSION_INTERVAL_MIN: 4000,
        IDLE_EXPRESSION_INTERVAL_MAX: 8000,
        RANDOM_PAUSE_VARIATION: 500,  // ± ms to randomise
        RANDOM_SPEED_VARIATION: 30,   // ± ms variation in type speed
    };

    const robotFace = document.getElementById('robot-face');
    const bubble = document.getElementById('speech-bubble');

    if (!robotFace || !bubble) {
        console.error("Robot face or speech bubble not found. Animation cannot start.");
        return;
    }

    // ================
    // 2. SHAPES
    // ================
    const mouthShapes = {
        neutral: [[6, 3], [6, 4], [6, 5]],
        vowel: [[5, 3], [5, 4], [5, 5], [6, 2], [6, 6], [7, 3], [7, 4], [7, 5]],
        bilabial: [[6, 4]],
        wide: [[6, 2], [6, 3], [6, 4], [6, 5], [6, 6]],
        // Optional new 'idle' shape(s) for extra expression:
        idle: [[5, 4], [6, 3], [6, 5], [7, 4]]
    };

    const eyeShapes = {
        open: [[2, 3], [2, 5], [3, 3], [3, 5]],
        closed: [[3, 3], [3, 5]]
    };

    // =====================
    // 3. BUILD FACE GRID
    // =====================
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 81; i++) {
        const robotDot = document.createElement('div');
        robotDot.classList.add('robot-dot');
        fragment.appendChild(robotDot);
    }
    robotFace.appendChild(fragment);

    const robotDots = Array.from(robotFace.querySelectorAll('.robot-dot'));

    // =====================
    // 4. HELPER FUNCTIONS
    // =====================
    function setMouth(shape) {
        requestAnimationFrame(() => {
            robotDots.forEach(dot => dot.classList.remove('robot-dot--mouth'));
            mouthShapes[shape].forEach(([row, col]) => {
                const index = row * 9 + col;
                robotDots[index].classList.add('robot-dot--mouth');
            });
        });
    }

    function setEyes(shape) {
        requestAnimationFrame(() => {
            robotDots.forEach(dot => dot.classList.remove('robot-dot--eye'));
            eyeShapes[shape].forEach(([row, col]) => {
                const index = row * 9 + col;
                robotDots[index].classList.add('robot-dot--eye');
            });
        });
    }

    function setNeutralExpression() {
        setMouth('neutral');
        setEyes('open');
    }

    function blinkEyes() {
        setEyes('closed');
        setTimeout(() => setEyes('open'), CONFIG.BLINK_DURATION);

        const nextBlink = Math.random() * (CONFIG.MAX_BLINK_INTERVAL - CONFIG.MIN_BLINK_INTERVAL) + CONFIG.MIN_BLINK_INTERVAL;
        setTimeout(blinkEyes, nextBlink);
    }

    function updateMouthShape(letter) {
        const vowels = "AEIOUaeiou";
        const bilabial = "MBPmbp";
        if (vowels.includes(letter)) {
            setMouth('vowel');
        } else if (bilabial.includes(letter)) {
            setMouth('bilabial');
        } else {
            setMouth('wide');
        }
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const checkVisibility = () => {
        if (!robotFace.offsetParent) {
            console.error('Robot face is hidden or not in DOM');
        }
    };

    // ============================================
    // 5. MAIN TEXT ANIMATION + RANDOM VARIATIONS
    // ============================================
    const textPhrases = [
        "Initializing systems... [PAUSE:1000]",
        "Booting up. Running diagnostics. All systems operational. [PAUSE:3000]",
        "Scanning environment. [PAUSE:2000] Visitor detected.",
        "Analyzing visitor presence... [PAUSE:3000]",
        "Hello, human. I am an AI assistant. How may I help you today? [PAUSE:4000]",
        "I'm programmed to assist with various tasks and answer questions. [PAUSE:3000]",
        "My knowledge base covers a wide range of topics. Feel free to ask about anything. [PAUSE:4000]",
        "Is there a specific subject you'd like to discuss? [PAUSE:3000]"
    ];

    async function typeWriter() {
        for (let phrase of textPhrases) {
            await animatePhrase(phrase);
        }
        // Rerun after finishing
        setTimeout(typeWriter, CONFIG.DEFAULT_DISPLAY_TIME);
    }

    async function animatePhrase(phrase) {
        // Split the phrase into typed segments and pause times
        const segments = phrase.split(/\[PAUSE:\d+\]/);
        const pauses = phrase.match(/\[PAUSE:(\d+)\]/g) || [];

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i].trim();
            if (segment) {
                await animateSegment(segment);
                // Slight variation in the display time for randomness
                const randomVariation = Math.floor(Math.random() * CONFIG.RANDOM_PAUSE_VARIATION);
                await delay(CONFIG.DEFAULT_DISPLAY_TIME + randomVariation);
            }
            // Handle [PAUSE:x]
            if (pauses[i]) {
                const pauseTime = parseInt(pauses[i].match(/\d+/)[0]);
                bubble.style.display = "none";
                await delay(pauseTime);
                bubble.style.display = "block";
            }
        }
    }

    async function animateSegment(text) {
        bubble.textContent = '';
        for (let i = 0; i < text.length; i++) {
            updateMouthShape(text[i]);
            bubble.textContent = text.substring(0, i + 1);
            // Add small random speed variation
            const speedVariation = Math.floor(Math.random() * (CONFIG.RANDOM_SPEED_VARIATION * 2)) - CONFIG.RANDOM_SPEED_VARIATION;
            await delay(CONFIG.TYPEWRITER_SPEED + speedVariation);
        }
        setNeutralExpression();
    }

    // =================================
    // 6. RANDOM IDLE EXPRESSIONS
    // =================================
    // When idle (not typing or in between lines), do random “idle” shapes
    // This function runs forever in the background
    function randomIdleExpression() {
        // Decide on a random time to next idle expression
        const interval = Math.random() * (CONFIG.IDLE_EXPRESSION_INTERVAL_MAX - CONFIG.IDLE_EXPRESSION_INTERVAL_MIN) + CONFIG.IDLE_EXPRESSION_INTERVAL_MIN;

        setTimeout(() => {
            // Trigger an idle shape only if the bubble's text hasn't changed recently:
            // For simplicity, we just check if the bubble is empty or not.
            if (bubble.textContent === '') {
                setMouth('idle');
                setTimeout(() => setNeutralExpression(), 600); // hold shape briefly
            }
            randomIdleExpression(); // queue next
        }, interval);
    }

    // ======================
    // 7. INIT & START
    // ======================
    function init() {
        bubble.style.display = "block";
        setNeutralExpression();
        blinkEyes();
        typeWriter();
        checkVisibility();

        // Start idle expression loop
        randomIdleExpression();
    }

    // Start automatically
    init();

    // Reset face on window blur
    window.addEventListener("blur", setNeutralExpression);
}
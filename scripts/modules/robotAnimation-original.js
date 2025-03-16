// robotAnimation.js
console.log("Robot animation initialized");

export function initRobot() {
    // Safely get our elements
    const robotFace = document.getElementById('robot-face');
    const bubble = document.getElementById('speech-bubble');

    // If either element is missing, log error & don't proceed
    if (!robotFace || !bubble) {
        console.error("Robot face or speech bubble not found. Animation cannot start.");
        return;
    }

    // Timing variables
    const BLINK_DURATION = 300;
    const MIN_BLINK_INTERVAL = 2000;
    const MAX_BLINK_INTERVAL = 4000;
    const TYPEWRITER_SPEED = 100;
    const DEFAULT_DISPLAY_TIME = 1000;

    // Define face patterns
    const mouthShapes = {
        neutral: [[6, 3], [6, 4], [6, 5]],
        vowel: [[5, 3], [5, 4], [5, 5], [6, 2], [6, 6], [7, 3], [7, 4], [7, 5]],
        bilabial: [[6, 4]],
        wide: [[6, 2], [6, 3], [6, 4], [6, 5], [6, 6]]
    };

    const eyeShapes = {
        open: [[2, 3], [2, 5], [3, 3], [3, 5]],
        closed: [[3, 3], [3, 5]]
    };

    // Create robot face grid
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 81; i++) {
        const robotDot = document.createElement('div');
        robotDot.classList.add('robot-dot');
        fragment.appendChild(robotDot);
    }
    robotFace.appendChild(fragment);

    // Query only the newly created robot dots
    const robotDots = Array.from(robotFace.querySelectorAll('.robot-dot'));

    // Animation functions
    function setMouth(shape) {
        // Use requestAnimationFrame for better visual updates
        requestAnimationFrame(() => {
            // Remove old mouth states
            robotDots.forEach(dot => dot.classList.remove('robot-dot--mouth'));
            // Apply the new mouth shape
            mouthShapes[shape].forEach(([row, col]) => {
                const index = row * 9 + col;
                robotDots[index].classList.add('robot-dot--mouth');
            });
        });
    }

    function setEyes(shape) {
        requestAnimationFrame(() => {
            // Remove old eye states
            robotDots.forEach(dot => dot.classList.remove('robot-dot--eye'));
            // Apply the new eye shape
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
        setTimeout(() => setEyes('open'), BLINK_DURATION);
        // Schedule next blink
        setTimeout(
            blinkEyes,
            Math.random() * (MAX_BLINK_INTERVAL - MIN_BLINK_INTERVAL) + MIN_BLINK_INTERVAL
        );
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

    // Text animation with pauses
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
        // Go through each phrase
        for (let phrase of textPhrases) {
            await animatePhrase(phrase);
        }
        // After finishing, restart after delay
        setTimeout(typeWriter, DEFAULT_DISPLAY_TIME);
    }

    async function animatePhrase(phrase) {
        // Split the phrase into typed segments and pause times
        const segments = phrase.split(/\[PAUSE:\d+\]/);
        const pauses = phrase.match(/\[PAUSE:(\d+)\]/g) || [];

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i].trim();
            if (segment) {
                await animateSegment(segment);
                // Brief default delay after each segment
                await delay(DEFAULT_DISPLAY_TIME);
            }
            // Handle [PAUSE:x] if present
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
            await delay(TYPEWRITER_SPEED);
        }
        setNeutralExpression();
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Add visibility check
    const checkVisibility = () => {
        if (!robotFace.offsetParent) {
            console.error('Robot face is hidden or not in DOM');
        }
    };

    // Initialize animation
    function init() {
        bubble.style.display = "block";
        setNeutralExpression();
        blinkEyes();
        typeWriter();
        checkVisibility(); // Check if robot is visible
    }

    // Start automatically
    init();

    // Reset face on window blur
    window.addEventListener("blur", setNeutralExpression);
}
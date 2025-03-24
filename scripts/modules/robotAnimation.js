/**
 * Robot Animation Module
 * ---------------------
 * Controls the robot character animations, expressions and dialog system.
 * 
 * This module:
 * - Creates and manages a dot-matrix robot face with dynamic expressions
 * - Handles blinking, eye movement, and mouth animations synchronized with speech
 * - Manages a speech bubble with typewriter-style text animation
 * - Contains a library of tech/design jokes that are displayed randomly
 * - Coordinates facial expressions with dialog content
 */

console.log("Robot animation initialized");

export function initRobot() {
    // =======================
    // 1. CONFIG / CONSTANTS
    // =======================
    const CONFIG = {
        BLINK_DURATION: 200,
        MIN_BLINK_INTERVAL: 1000,
        MAX_BLINK_INTERVAL: 3000,
        TYPEWRITER_SPEED: 55,
        DEFAULT_DISPLAY_TIME: 2000,
        JOKE_PAUSE_TIME: 6000, 
        RANDOM_PAUSE_VARIATION: 100,
        RANDOM_SPEED_VARIATION: 30,
        EYE_MOVE_INTERVAL: 7000, 
        SMILE_DURATION: 3000, 
    };

    const robotFace = document.getElementById('robot-face');
    const bubble = document.getElementById('speech-bubble');

    if (!robotFace || !bubble) {
        console.error("Robot face or speech bubble not found. Animation cannot start.");
        return;
    }

    let isSmiling = false;

    // ================
    // 2. SHAPES
    // ================
    const mouthShapes = {
        neutral: [[3, 6], [4, 6], [5, 6]],
        vowel: [[3, 5], [4, 5], [5, 5], [2, 6], [6, 6], [3, 7], [4, 7], [5, 7]],
        bilabial: [[4, 6]],
        wide: [[2, 6], [3, 6], [4, 6], [5, 6], [6, 6]],
        idle: [[4, 5], [3, 6], [5, 6], [4, 7]],
        nasal: [[3, 6], [4, 6], [5, 6], [3, 7], [4, 7], [5, 7]],
        smile: [[3, 5],[5, 5], [4, 6],] 
    };

    const eyeShapes = {
        open: [[3, 2], [5, 2], [3, 3], [5, 3]],
        closed: [[3, 3], [5, 3]],
        left: [[2, 2], [4, 2], [2, 3], [4, 3]],
        right: [[4, 2], [6, 2], [4, 3], [6, 3]],
        squint: [[3, 3],[5, 3]], 
    };

    // =====================
    // 3. BUILD FACE GRID
    // =====================
    const ROWS = 9; 
    const COLUMNS = 9;
    const TOTAL_DOTS = ROWS * COLUMNS;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < TOTAL_DOTS; i++) {
        const robotDot = document.createElement('div');
        robotDot.classList.add('robot-dot');
        fragment.appendChild(robotDot);
    }
    robotFace.appendChild(fragment);

    const robotDots = Array.from(robotFace.querySelectorAll('.robot-dot'));

    if (robotDots.length !== TOTAL_DOTS) {
        console.error(`Expected ${TOTAL_DOTS} dots but found ${robotDots.length}.`);
        return;
    }

    // =====================
    // 4. HELPER FUNCTIONS
    // =====================
    function isValidIndex(col, row) {
        const index = row * COLUMNS + col;
        return index >= 0 && index < TOTAL_DOTS;
    }

    function setMouth(shape) {
        requestAnimationFrame(() => {
            robotDots.forEach(dot => dot.classList.remove('robot-dot--mouth'));
            mouthShapes[shape].forEach(([col, row]) => {
                if (isValidIndex(col, row)) {
                    const index = row * COLUMNS + col;
                    robotDots[index].classList.add('robot-dot--mouth');
                } else {
                    console.warn(`Invalid mouth index: col ${col}, row ${row}`);
                }
            });
        });
    }

    function setEyes(shape) {
        if (isSmiling && shape !== 'squint') return; // Prevent eye changes if smiling, except for squint
        requestAnimationFrame(() => {
            robotDots.forEach(dot => dot.classList.remove('robot-dot--eye'));
            eyeShapes[shape].forEach(([col, row]) => {
                if (isValidIndex(col, row)) {
                    const index = row * COLUMNS + col;
                    robotDots[index].classList.add('robot-dot--eye');
                } else {
                    console.warn(`Invalid eye index: col ${col}, row ${row}`);
                }
            });
        });
    }

    function setNeutralExpression() {
        setMouth('neutral');
        setEyes('open');
    }

    function setLaughExpression() {
        setMouth('smile');
        setEyes('squint');
    }

    let blinkTimeout;

    function blinkEyes() {
        if (isSmiling) return; // Prevent blinking if smiling
        setEyes('closed');
        setTimeout(() => setEyes('open'), CONFIG.BLINK_DURATION);

        const nextBlink = Math.random() * (CONFIG.MAX_BLINK_INTERVAL - CONFIG.MIN_BLINK_INTERVAL) + CONFIG.MIN_BLINK_INTERVAL;
        blinkTimeout = setTimeout(blinkEyes, nextBlink);
    }

    function stopBlinking() {
        clearTimeout(blinkTimeout);
    }

    function resumeBlinking() {
        blinkEyes();
    }

    function moveEyesRandomly() {
        if (isSmiling) return; // Prevent random eye movement if smiling
        const positions = ['left', 'right', 'open'];
        const randomPosition = positions[Math.floor(Math.random() * positions.length)];
        setEyes(randomPosition);
    }

    function updateMouthShape(letter) {
        const vowels = "AEIOUaeiou";
        const bilabial = "MBPmbp";
        const nasals = "Nn";
        if (vowels.includes(letter)) {
            setMouth('vowel');
        } else if (bilabial.includes(letter)) {
            setMouth('bilabial');
        } else if (nasals.includes(letter)) {
            setMouth('nasal');
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
    const jokes = [
    ["Why did the font go to jail?", "It was caught kerning in public."],
    ["Why did the div cross the road?", "To style the chicken on the other side."],
    ["A no-code developer walked into a bar.", "The bar auto-saved."],
    ["What’s a computer’s favorite snack?", "Microchips."],
    ["Why do 3D modelers make terrible baristas?", "Too meshy!"],
    ["Why did the designer fail their driving test?", "They couldn’t stop aligning to the left."],
    ["Why do programmers prefer dark mode?", "Because light attracts bugs."],
    ["A Figma file, a no-code developer, and a UX designer walk into a bar.", "The bartender says, 'This joke has too many layers.'"],
    ["Why did the div go to therapy?", "It couldn’t deal with its boundaries."],
    ["Why did the UX designer break up with the developer?", "They said, 'You’re just not responsive anymore.'"],
    ["AI-generated art is just clipart", "with delusions of grandeur."],
    ["Mac users measure time in battery percentages.", "Android users measure time in updates they refuse to install."],
    ["Every junior designer secretly believes", "they invented minimalism."],
    ["UX writing is just apologising to users", "in fewer words."],
    ["Somewhere, an AI is trying to decide if your website is good", "or if you’re just using a lot of drop shadows."],
    ["Nobody talks about how much emotional damage", "a bad colour palette can cause."],
    ["Graphic design is 90% knowing shortcuts", "and 10% remembering which layer you’re on."],
    ["Figma’s tagline should just be:", "'Who touched my frame?'"],
    ["UX is just saying 'It depends'", "over and over until the client gives up."],
    ["The Figma file isn’t too big.", "You’re just not emotionally prepared to open it."],
    ["UX designers don’t have impostor syndrome.", "They have edge case syndrome — what if someone scrolls upside down in incognito mode?"],
    ["UX designers don’t have impostor syndrome.", "They have edge case syndrome — what if someone scrolls backward on a smartwatch during a solar eclipse?"],
    ["UI design will break your heart.", "But printers will break your spirit."],
    ["Graphic design jokes make me so x-heighted.", ""],
    ["Are you my Photoshop file?", "Because I forgot your name."],
    ["How many designers does it take to screw in a lightbulb?", "Does it have to be a lightbulb?"],
    ["I don’t need glasses.", "I just prefer to view the world in a constant Gaussian blur."],
    ["I would tell you a joke about kerning,", "but it’s too spacey."],
    ["Two fonts walk into a bar.", "The barman says, 'Sorry lads, we don’t serve your type.'"],
    ["Why did the programmer quit his job?", "Because he didn’t get arrays."],
    ["An SEO expert walks into a bar, bars, pub, tavern,", "public house, Irish pub, drinks, beer, alcohol."],
    ["Web designer?", "I hardly knew her!"]
];

    function getRandomJoke() {
        const randomIndex = Math.floor(Math.random() * jokes.length);
        return jokes[randomIndex];
    }

    // Simplify text handling
    function prefillSpeechBubble(phrase) {
        bubble.innerHTML = ''; // Clear existing content
        for (let char of phrase) {
            const span = document.createElement('span');
            span.textContent = char;
            span.classList.add('hidden'); // Initially hidden
            bubble.appendChild(span);
        }
    }

    // Simplify text reveal function
    async function revealText() {
        const spans = Array.from(bubble.querySelectorAll('span'));
        for (let i = 0; i < spans.length; i++) {
            const span = spans[i];
            updateMouthShape(span.textContent);
            span.classList.remove('hidden');
            span.classList.add('visible');
            const speedVariation = Math.floor(Math.random() * (CONFIG.RANDOM_SPEED_VARIATION * 2)) - CONFIG.RANDOM_SPEED_VARIATION;
            await delay(CONFIG.TYPEWRITER_SPEED + speedVariation);
        }
        setNeutralExpression();
    }

    async function typeWriter() {
        while (true) {
            const joke = getRandomJoke();
            await animateJoke(joke);
            await delay(CONFIG.JOKE_PAUSE_TIME); // Longer pause between jokes
        }
    }

    async function animateJoke(joke) {
        for (let phrase of joke) {
            bubble.style.display = "block";
            prefillSpeechBubble(phrase);
            await revealText();
            await delay(CONFIG.DEFAULT_DISPLAY_TIME);
        }
        bubble.style.display = "none"; // Hide bubble during longer pause

        // Show laugh expression after the joke
        stopBlinking();
        isSmiling = true;
        setLaughExpression();
        await delay(CONFIG.SMILE_DURATION);
        setNeutralExpression(); // Return to neutral expression after laugh
        isSmiling = false;
        resumeBlinking();
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
        setInterval(moveEyesRandomly, CONFIG.EYE_MOVE_INTERVAL); // Move eyes randomly every 5 seconds
    }

    init();
}
/**
 * Robot Animation Module - Performance Optimized
 */

console.log("Robot animation module initialized");

// Import the sound system for speech effects
import { robotSpeech } from './sounds.js';

// Variable to track if animation has started
let animationStarted = false;

export function initRobot() {
    // =======================
    // 1. CONFIG / CONSTANTS
    // =======================
    const CONFIG = {
        BLINK_DURATION: 200,
        MIN_BLINK_INTERVAL: 1000,
        MAX_BLINK_INTERVAL: 3000,
        TYPEWRITER_SPEED: 60,
        DEFAULT_DISPLAY_TIME: 2000,
        JOKE_PAUSE_TIME: 6000, 
        RANDOM_SPEED_VARIATION: 30,
        EYE_MOVE_INTERVAL: 7000, 
        SMILE_DURATION: 2000,
        MOUTH_UPDATE_FREQUENCY: 2,
        DEBUG: true, // Enable debug temporarily to diagnose audio issues 
    };

    // DOM elements cached for performance
    const robotFace = document.getElementById('robot-display');
    const bubble = document.getElementById('speech-bubble');
    const speechBubbleText = document.getElementById('speech-bubble-text'); // NEW: Get the text element

    if (!robotFace || !bubble || !speechBubbleText) { // Check for the new element
        console.error("Robot face, speech bubble, or speech bubble text not found. Animation cannot start.");
        return;
    }

    let isSmiling = false;
    
    // Pre-compiled character type maps for faster lookups
    const charTypeMap = {
        vowels: new Set("AEIOUaeiou"),
        bilabial: new Set("MBPmbp"),
        nasals: new Set("Nn"),
        sibilants: new Set("SZszCcJj"),
        dentals: new Set("TDtd"),
        pauses: new Set(",.;:!?-")
    };

    // ================
    // 2. SHAPES
    // ================
    const mouthShapes = {
        neutral: [[3, 6], [4, 6], [5, 6]],
        vowel: [[3, 5], [4, 5], [5, 5], [2, 6], [6, 6], [3, 7], [4, 7],[5, 7]],
        bilabial: [[4, 6]],
        wide: [[2, 6], [3, 6], [4, 6], [5, 6], [6, 6]],
        idle: [[4, 5], [3, 6], [5, 6], [4, 7]],
        nasal: [[3, 6], [4, 6], [5, 6], [3, 7], [4, 7], [5, 7]],
        smile: [[2, 5],[3, 6],[4, 6],[5, 6],[6, 5]] 
    };

    const eyeShapes = {
        open: [[3, 2], [5, 2], [3, 3], [5, 3]],
        closed: [[3, 3], [5, 3]],
        left: [[2, 2], [4, 2], [2, 3], [4, 3]],
        right: [[4, 2], [6, 2], [4, 3], [6, 3]],
        squint: [[2, 3],[3, 2],[3, 3],[5, 2],[6, 3],[5, 3]]
    };

    // =====================
    // 3. GET EXISTING FACE GRID
    // =====================
    
    // Cache all robot dots for performance
    const robotDots = Array.from(robotFace.querySelectorAll('.robot-dot'));
    
    if (robotDots.length === 0) {
        console.error("No robot dots found in the SVG. Animation cannot start.");
        return;
    }
    
    // More efficient dot map creation - no unnecessary calculations
    const dotMap = new Map();
    const mouthDotCache = {};
    const eyeDotCache = {};
    
    // Pre-compute and cache all possible dot configurations
    robotDots.forEach(dot => {
        const row = parseInt(dot.getAttribute('data-row'));
        const col = parseInt(dot.getAttribute('data-col'));
        const key = `${col},${row}`;
        dotMap.set(key, dot);
    });
    
    // Pre-cache all mouth shape dots
    Object.entries(mouthShapes).forEach(([shapeName, coords]) => {
        mouthDotCache[shapeName] = coords
            .map(([col, row]) => dotMap.get(`${col},${row}`))
            .filter(Boolean);
    });
    
    // Pre-cache all eye shape dots
    Object.entries(eyeShapes).forEach(([shapeName, coords]) => {
        eyeDotCache[shapeName] = coords
            .map(([col, row]) => dotMap.get(`${col},${row}`))
            .filter(Boolean);
    });

    if (CONFIG.DEBUG) {
        console.log("Dot map created with", dotMap.size, "dots");
        console.log("Mouth cache created with", Object.keys(mouthDotCache).length, "shapes");
        console.log("Eye cache created with", Object.keys(eyeDotCache).length, "shapes");
    }
    
    // =====================
    // 4. HELPER FUNCTIONS - OPTIMIZED
    // =====================
    
    // Track current states to avoid unnecessary DOM updates
    let currentMouthShape = null;
    let currentEyeShape = null;
    
    // Optimized to use cached dots and avoid unnecessary DOM operations
    function setMouth(shape) {
        if (currentMouthShape === shape) return; // Skip if already set
        
        requestAnimationFrame(() => {
            // Remove current mouth shape
            if (currentMouthShape && mouthDotCache[currentMouthShape]) {
                mouthDotCache[currentMouthShape].forEach(dot => 
                    dot.classList.remove('robot-dot--mouth'));
            }
            
            // Apply new mouth shape
            if (mouthDotCache[shape]) {
                mouthDotCache[shape].forEach(dot => 
                    dot.classList.add('robot-dot--mouth'));
                currentMouthShape = shape;
            }
        });
    }

    // Optimized eye setting function
    function setEyes(shape) {
        if (isSmiling && shape !== 'squint') return;
        if (currentEyeShape === shape) return; // Skip if already set
        
        requestAnimationFrame(() => {
            // Remove current eye shape
            if (currentEyeShape && eyeDotCache[currentEyeShape]) {
                eyeDotCache[currentEyeShape].forEach(dot => 
                    dot.classList.remove('robot-dot--eye'));
            }
            
            // Apply new eye shape
            if (eyeDotCache[shape]) {
                eyeDotCache[shape].forEach(dot => 
                    dot.classList.add('robot-dot--eye'));
                currentEyeShape = shape;
            }
        });
    }

    function setNeutralExpression() {
        setMouth('neutral');
        setEyes('open');
    }

    function setLaughExpression() {
        setMouth('smile');
        setEyes('open');
    }

    let blinkTimeout;

    function blinkEyes() {
        if (isSmiling) return;
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
        if (isSmiling) return;
        const positions = ['left', 'right', 'open'];
        const randomPosition = positions[Math.floor(Math.random() * positions.length)];
        setEyes(randomPosition);
    }

    // Optimized mouth shape selection with pre-computed character sets
    function updateMouthShape(letter) {
        if (charTypeMap.vowels.has(letter)) {
            setMouth('vowel');
        } else if (charTypeMap.bilabial.has(letter)) {
            setMouth('bilabial');
        } else if (charTypeMap.nasals.has(letter)) {
            setMouth('nasal');
        } else if (charTypeMap.sibilants.has(letter)) {
            setMouth('wide');
        } else if (charTypeMap.dentals.has(letter)) {
            setMouth('neutral');
        } else if (charTypeMap.pauses.has(letter)) {
            setMouth('idle');
        } else if (letter === ' ' && Math.random() < 0.3) {
            setMouth('neutral');
        } else {
            // Use a simple array for better performance than Object.keys
            const availableMouths = ['wide', 'neutral', 'vowel', 'nasal', 'idle'];
            setMouth(availableMouths[Math.floor(Math.random() * availableMouths.length)]);
        }
    }

    // Simplified delay function
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // More reliable visibility check
    const checkVisibility = () => {
        try {
            const rect = robotFace.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                console.warn('Robot face may not be visible');
            } else if (CONFIG.DEBUG) {
                console.log('Robot face is visible');
            }
        } catch (e) {
            console.warn('Error checking robot visibility:', e);
        }
    };

    // ============================================
    // 5. MAIN TEXT ANIMATION - STREAMLINED
    // ============================================
    // Jokes array remains unchanged
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
        return jokes[Math.floor(Math.random() * jokes.length)];
    }

    // More efficient text handling with fragment
    function prefillSpeechBubble(phrase) {
        speechBubbleText.textContent = ''; // Clear existing text
    }

    // Simplified and optimized text reveal with sound
    async function revealText() {
        const phrase = currentPhrase;
        let displayedText = '';
        let mouthUpdateCounter = 0;
    
        for (let i = 0; i < phrase.length; i++) {
            const character = phrase[i];
    
            // Update mouth less frequently
            mouthUpdateCounter++;
            if (mouthUpdateCounter >= CONFIG.MOUTH_UPDATE_FREQUENCY) {
                updateMouthShape(character);
                mouthUpdateCounter = 0;
            }
    
            // Play speech sound through the sound system
            robotSpeech.play(character);
    
            // Append character to displayed text
            displayedText += character;
            speechBubbleText.textContent = displayedText; // Update text content
    
            // Add slight variation to typing speed
            const speedVariation = Math.floor(Math.random() * CONFIG.RANDOM_SPEED_VARIATION) - (CONFIG.RANDOM_SPEED_VARIATION / 2);
            await delay(CONFIG.TYPEWRITER_SPEED + speedVariation);
        }
        setNeutralExpression();
    }

    let currentPhrase = '';

    // Other animation functions remain largely the same
    async function typeWriter() {
        while (true) {
            const joke = getRandomJoke();
            await animateJoke(joke);
            await delay(CONFIG.JOKE_PAUSE_TIME);
        }
    }

    async function animateJoke(joke) {
        for (let phrase of joke) {
            bubble.style.display = "block";
            currentPhrase = phrase;
            prefillSpeechBubble(phrase);
            await revealText();
            await delay(CONFIG.DEFAULT_DISPLAY_TIME);
        }
        bubble.style.display = "none";

        // Show laugh expression
        stopBlinking();
        isSmiling = true;
        setLaughExpression();
        await delay(CONFIG.SMILE_DURATION);
        setNeutralExpression();
        isSmiling = false;
        resumeBlinking();
    }

    // Toggle speech sounds using the sound system
    function toggleSpeechSounds() {
        return robotSpeech.toggle();
    }

    // ======================
    // 7. INIT & START - IMPROVED
    // ======================
    function init() {
        if (CONFIG.DEBUG) console.log("Initializing robot animation...");
        
        // Set up multiple event listeners to initialize audio
        const audioTriggerEvents = ['click', 'touchstart', 'keydown'];
        
        audioTriggerEvents.forEach(eventType => {
            document.addEventListener(eventType, () => {
                if (!robotSpeech.isAudioInitialized()) {
                    robotSpeech.init();
                    // Only play test sound on explicit interaction
                    if (eventType === 'click') {
                        setTimeout(robotSpeech.playTestSound, 500);
                    }
                }
            }, { once: true, passive: true });
        });
        
        // Initialize face but don't start animation yet
        setNeutralExpression();
        blinkEyes();
        checkVisibility();
        
        // Use more efficient passive event listeners
        const moveEyesInterval = setInterval(moveEyesRandomly, CONFIG.EYE_MOVE_INTERVAL);
        
        // Clean up on page unload
        window.addEventListener('unload', () => {
            clearInterval(moveEyesInterval);
            clearTimeout(blinkTimeout);
        }, { passive: true });

        // Set up event listener to initialize audio on first user interaction
        document.addEventListener('click', () => {
            if (!robotSpeech.isAudioInitialized()) {
                robotSpeech.init();
            }
        }, { once: true, passive: true });
    }

    // More efficient initialization
    if (document.readyState !== "loading") {
        init();
    } else {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    }
    
    // Return a function to start the animation when called
    return {
        startSpeaking: () => {
            if (!animationStarted) {
                animationStarted = true;
                bubble.style.display = "block";
                typeWriter().catch(err => console.error('Animation error:', err));
                console.log("Robot animation started");
            }
        }
    };
}

// Add method to exported function to allow external control
initRobot.toggleSpeechSounds = function() {
    // This will be replaced with the actual toggle function when the module runs
    return robotSpeech.toggle();
};
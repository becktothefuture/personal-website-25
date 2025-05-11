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

    // More efficient text handling with fragment
    function prefillSpeechBubble(phrase) {
        speechBubbleText.textContent = ''; // Clear existing text
    }

    // ============================================
    // 5. MAIN TEXT ANIMATION - STREAMLINED
    // ============================================
    const jokeIntroductions = [
        "Here's one for you:",
        "How about this joke?",
        "Here's a little humor:",
        "Got a joke:",
        "Here's a classic:",
        "Let me tell you a joke:",
        "Heard this one?"
    ];

    const wisdomIntroductions = [
        "Here's a design thought:",
        "Consider this:",
        "Quick design insight:",
        "A bit of design wisdom:",
        "Remember this principle:",
        "Food for thought:",
        "From the design archives:"
    ];

    const designWisdoms = [
        ["Fitt's Law isn't just about button size;", "it's a reminder that interaction cost is physical.", "How can you minimize pointer travel in complex UIs?"],
        ["The Von Restorff effect highlights uniqueness.", "But consider its sibling, the Serial Position Effect:", "primacy and recency also heavily influence recall."],
        ["Hick's Law counsels choice reduction.", "Yet, for expert users, broader choice can be empowering.", "The key is balancing discoverability with efficiency."],
        ["Cognitive Load Theory distinguishes intrinsic, extraneous, and germane load.", "Effective design minimizes extraneous load to free resources for germane load (learning)."],
        ["The Aesthetic-Usability effect is potent.", "However, beauty can mask underlying usability flaws,", "delaying their discovery during testing."],
        ["Progressive disclosure is crucial for onboarding.", "For power users, consider 'progressive exposure' of advanced features", "based on demonstrated expertise or task frequency."],
        ["Variable fonts offer performance and flexibility.", "But their impact on perceived performance can be just as significant,", "reducing layout shifts and FOUT/FOIT."],
        ["Beyond avoiding dark patterns, champion 'bright patterns'.", "These are ethical designs that actively empower users", "and foster genuine trust and loyalty."],
        ["The 'fold' is less about a fixed pixel height,", "and more about maintaining information scent and engagement", "to motivate scrolling down a compelling narrative."],
        ["Microinteractions, when chained effectively,", "can form 'macro-moments' that define a product's feel.", "Think beyond single tasks to entire user flows."],
        ["A11y isn't a checklist, but a mindset.", "Shift from 'compliance' to 'inclusive design thinking'.", "Solutions for edge cases often benefit all users."],
        ["Semantic HTML is foundational.", "But consider ARIA's role in conveying dynamic states and properties", "for complex, JavaScript-driven components."],
        ["Eye-tracking patterns like F or Z are heuristics.", "Real engagement is driven by clear visual hierarchy", "and compelling content, not just layout conventions."],
        ["Gestalt principles are powerful.", "But be mindful of cultural variations in perception.", "What constitutes 'closure' or 'proximity' can differ."],
        ["A consistent color language is vital.", "Extend this to include 'semantic color' for states (error, success, warning)", "and ensure sufficient contrast ratios (WCAG AA/AAA)."],
        ["Typography's role extends beyond legibility.", "It shapes voice, conveys emotion, and builds brand identity.", "Consider its rhythmic and structural qualities."],
        ["Content-first design is a great starting point.", "But iterative 'content-and-design' sprints often yield better results,", "allowing content and layout to co-evolve."],
        ["Mobile-first indexing is standard.", "Now, consider 'AI-first' content optimization.", "How will your information be parsed and understood by LLMs?"],
        ["Performance is a core design tenet.", "Beyond load times, consider 'interaction performance'.", "Are transitions smooth? Is feedback immediate?"],
        ["The Rule of Thirds is a compositional aid.", "But dynamic symmetry and other compositional theories", "can lead to more sophisticated and engaging layouts."],
        ["Visual hierarchy directs attention.", "Use it not just for importance, but to guide users through tasks,", "reducing cognitive friction at each step."],
        ["Whitespace (negative space) is active, not passive.", "It's a tool for grouping, separating, and creating rhythm.", "Its deliberate use is a hallmark of mature design."],
        ["Personas are useful, but can oversimplify.", "Consider 'Jobs-to-be-Done' for a more task-oriented perspective,", "or 'Archetypes' to capture behavioral patterns."],
        ["A/B testing optimizes local maxima.", "For breakthrough innovation, complement it with qualitative insights", "and bold, hypothesis-driven design leaps."],
        ["The Doherty Threshold (400ms) is critical for flow.", "But for complex operations, managing expectations with clear feedback", "is more important than hitting an arbitrary number."],
        ["Skeuomorphism vs. Flat vs. Neumorphism is a stylistic choice.", "The underlying principle should be 'interactional honesty'.", "Does the form clearly communicate its function?"],
        ["UX writing should be clear, concise, and consistent.", "But also consider its role in shaping brand voice and personality.", "Can your error messages be empathetic or even witty?"],
        ["Design systems ensure consistency and efficiency.", "Their true power lies in freeing designers to focus on complex problems,", "rather than reinventing basic components."],
        ["Kerning and tracking are typographic details.", "But collectively, such details contribute to a polished, professional feel", "that signals quality and care to the user."],
        ["Serif vs. Sans-serif is a classic debate.", "Consider context, accessibility (dyslexia-friendly options),", "and the overall typographic system, not just isolated headlines."],
        ["The Golden Ratio can be a useful guide.", "But don't let it become a dogmatic constraint.", "Trust your eye and test with users for perceived harmony."],
        ["Occam's Razor: simpler is often better.", "However, 'simplicity' is subjective. Aim for 'optimal complexity'—", "as simple as possible, but no simpler for the task at hand."],
        ["Digital wayfinding relies on clear navigation.", "But also consider 'serendipitous discovery'.", "How can users explore and find unexpected value?"],
        ["Constructive error handling is key.", "Go beyond recovery; use errors as teaching moments", "to help users understand the system better."],
        ["Affordances signal utility.", "But in a mature digital landscape, 'signifiers' often do the heavy lifting,", "especially for non-visual or gestural interactions."],
        ["The Paradox of Choice is real.", "Mitigate it with smart defaults, categorization, filtering,", "and personalized recommendations based on user behavior."],
        ["'Don't Make Me Think' is a great mantra.", "But for complex domains, 'Help Me Think Clearly' might be more apt.", "Provide tools and structures for sense-making."],
        ["User journey maps visualize experiences.", "Extend them with 'service blueprints' to map frontstage and backstage actions,", "revealing operational dependencies and opportunities."],
        ["Atomic Design provides a structural metaphor.", "Its real value is in fostering a shared vocabulary", "and enabling collaborative, scalable design systems."],
        ["The Uncanny Valley is a known pitfall in realism.", "Stylization, abstraction, or focusing on expressive animation", "can often create more relatable and appealing characters."],
        ["Platform guidelines (Material, HIG) are starting points.", "Adapt them to your brand and user needs, creating a unique", "yet familiar experience. Don't just copy-paste."],
        ["Gamification can be effective, but also manipulative.", "Focus on intrinsic motivators like mastery, autonomy, and purpose,", "rather than just extrinsic rewards (points, badges)."],
        ["The Peak-End Rule influences memory of experiences.", "Strategically design memorable peaks and a positive end,", "even if the overall experience has some friction."],
        ["Confirmation bias is a cognitive trap for designers.", "Actively cultivate 'intellectual humility' and seek disconfirming evidence", "through diverse user research and peer critique."],
        ["Iterative design is fundamental.", "Embrace 'dual-track agile' where discovery and delivery happen in parallel,", "ensuring you're building the right thing, and building it right."],
        ["Empathy is the bedrock of UX.", "Translate empathic understanding into tangible design decisions", "that demonstrably improve users' lives or workflows."],
        ["Visual weight creates focal points.", "Consider 'temporal visual hierarchy' in animations and transitions,", "guiding the eye through changes over time."],
        ["WCAG guidelines are crucial for color contrast.", "Also, test your designs in grayscale to assess hierarchy without color,", "and use tools to simulate various forms of color blindness."],
        ["The Pareto Principle (80/20 rule) is a useful heuristic.", "But be wary of neglecting the 'long tail' of features or users;", "niche functionalities can be critical for specific segments."],
        ["Mental models guide user expectations.", "When an interface must deviate, provide clear signposting and onboarding", "to help users build an accurate new mental model."],
        ["Graceful degradation and progressive enhancement are two sides of the same coin.", "The goal is a robust, accessible core experience for all,", "with enhancements layered for capable browsers/devices."],
        ["The Law of Prägnanz favors simplicity in perception.", "Use this to create clear, uncluttered interfaces where elements", "are easily grouped and understood at a glance."],
        ["Feedback loops confirm actions.", "Consider different feedback modalities (visual, auditory, haptic)", "and ensure feedback is timely, appropriate, and informative."],
        ["Consistency reduces cognitive load.", "Strive for 'functional consistency' (elements that look similar, behave similarly)", "and 'aesthetic consistency' (a cohesive visual style)."],
        ["Storytelling in UX builds emotional connection.", "Use narrative structures to frame user onboarding, explain complex features,", "or showcase the impact of your product."],
        ["Color palettes define brand and guide interaction.", "Develop a systematic approach: primary, secondary, accent, semantic (error/success),", "and neutral shades with defined usage rules."],
        ["Iconography requires clarity and cultural sensitivity.", "Test icons for recognizability within your target demographic,", "and always provide text labels for critical functions."],
        ["Grid systems bring order to layouts.", "Explore 'modular grids' and 'baseline grids' for more sophisticated control", "over rhythm and harmony across different screen sizes."],
        ["Responsive vs. Adaptive: the debate continues.", "Often, a hybrid approach is best—fluid grids with adaptive content strategies", "at key breakpoints to optimize for context."],
        ["First impressions are critical.", "Optimize for 'perceived performance' as much as actual speed.", "Use skeleton screens, optimistic updates, and engaging loading states."],
        ["User research uncovers needs, not solutions.", "It's the designer's role to synthesize research findings", "into innovative and effective design solutions."],
        ["Design debt, if unaddressed, erodes user trust.", "Establish regular 'design reviews' and 'debt retrospectives'", "to prioritize and tackle accumulated UX issues."],
        ["KISS: Keep It Simple, Stupid.", "But remember Einstein's addendum: 'Everything should be made as simple as possible,", "but not simpler.' Context and user expertise matter."],
        ["Invisible design is often the best design.", "It seamlessly supports the user's goals without drawing attention to itself.", "Strive for 'flow' and effortless interaction."],
        ["Whitespace is an active design element.", "Master its use to improve readability, create focus, and convey sophistication.", "It's about the 'art of subtraction'."]
    ];

    const jokes = [
        ["Why did the font go to jail?", "It was caught kerning in public."],
        ["Why did the div cross the road?", "To style the chicken on the other side."],
        ["A no-code developer walked into a bar.", "The bar auto-saved."],
        ["What’s a computer’s favorite snack?", "Microchips."],
        ["Why do 3D modelers make terrible baristas?", "They are too meshy!"],
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
        ["90% of UX is saying 'It depends'", "until the client gives up."],
        ["The Figma file isn’t too big.", "You’re just not emotionally prepared to open it."],
        ["UX designers don’t have impostor syndrome.", "They have edge case syndrome — what if someone scrolls backward on a smartwatch during a solar eclipse?"],
        ["UI design will break your heart.", "But printers will break your spirit."],
        ["Typography jokes make me so x-heighted.", ""],
        ["Are you my Photoshop file?", "Because I forgot your name."],
        ["How many designers does it take to screw in a lightbulb?", "Does it have to be a lightbulb?"],
        ["I don’t need glasses.", "I just prefer to view the world in a constant Gaussian blur."],
        ["I would tell you a joke about kerning,", "but it’s too spacey."],
        ["Two fonts walk into a bar.", "The barman says, 'Sorry lads, we don’t serve your type.'"],
        ["Why did the programmer quit his job?", "Because he didn’t get arrays."],
        ["An SEO expert walks into a bar, bars, pub, tavern,", "public house, Irish pub, drinks, beer, alcohol."],
        ["Web designer?", "I hardly knew her!"]
    ];

    const allSpeechSources = [
        ...jokes.map(joke => ({ type: 'joke', content: joke })),
        ...designWisdoms.map(wisdom => ({ type: 'wisdom', content: wisdom })) // content is now an array of strings
    ];

    function getRandomSpeechItem() {
        const selectedItem = allSpeechSources[Math.floor(Math.random() * allSpeechSources.length)];

        if (selectedItem.type === 'joke') {
            const intro = jokeIntroductions[Math.floor(Math.random() * jokeIntroductions.length)];
            // selectedItem.content is [setup, punchline]
            return { type: 'joke', parts: [intro, ...selectedItem.content] }; 
        } else { // wisdom
            const intro = wisdomIntroductions[Math.floor(Math.random() * wisdomIntroductions.length)];
            // selectedItem.content is now an array of wisdom parts
            return { type: 'wisdom', parts: [intro, ...selectedItem.content] }; 
        }
    }

    async function revealText() {
        const phrase = currentPhrase;
        let displayedText = '';
        let mouthUpdateCounter = 0;
    
        for (let i = 0; i < phrase.length; i++) {
            const character = phrase[i];
    
            mouthUpdateCounter++;
            if (mouthUpdateCounter >= CONFIG.MOUTH_UPDATE_FREQUENCY) {
                updateMouthShape(character);
                mouthUpdateCounter = 0;
            }
    
            robotSpeech.play(character);
    
            displayedText += character;
            speechBubbleText.textContent = displayedText;
    
            const speedVariation = Math.floor(Math.random() * CONFIG.RANDOM_SPEED_VARIATION) - (CONFIG.RANDOM_SPEED_VARIATION / 2);
            await delay(CONFIG.TYPEWRITER_SPEED + speedVariation);
        }
    }

    let currentPhrase = '';

    async function typeWriter() {
        while (true) {
            const speechItem = getRandomSpeechItem();
            if (speechItem.type === 'joke') {
                await animateJoke(speechItem.parts);
            } else if (speechItem.type === 'wisdom') {
                await animateWisdom(speechItem.parts); // Pass parts array
            }
            await delay(CONFIG.JOKE_PAUSE_TIME); 
        }
    }

    async function animateJoke(jokeParts) { // jokeParts is an array: [intro, setup, punchline]
        for (let phrase of jokeParts) {
            bubble.style.display = "block";
            currentPhrase = phrase;
            prefillSpeechBubble(phrase);
            await revealText();
            await delay(CONFIG.DEFAULT_DISPLAY_TIME);
        }
        bubble.style.display = "none";

        stopBlinking();
        isSmiling = true;
        setLaughExpression();
        await delay(CONFIG.SMILE_DURATION);
        setNeutralExpression();
        isSmiling = false;
        resumeBlinking();
    }

    async function animateWisdom(wisdomParts) { // wisdomParts is an array: [intro, wisdomText]
        for (let phrase of wisdomParts) {
            bubble.style.display = "block";
            currentPhrase = phrase;
            prefillSpeechBubble(phrase);
            await revealText();
            await delay(CONFIG.DEFAULT_DISPLAY_TIME);
        }
        bubble.style.display = "none";
        setNeutralExpression(); 
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

        // Listen for intro completion to initialize audio
        document.addEventListener('intro:complete', () => {
            if (!robotSpeech.isAudioInitialized()) {
                robotSpeech.init();
            }
        }, { once: true, passive: true });
        
        // Automatically start speaking
        if (!animationStarted) {
            animationStarted = true;
            bubble.style.display = "block";
            typeWriter().catch(err => console.error('Animation error:', err));
            console.log("Robot animation started automatically");
        }
    }

    // More efficient initialization
    if (document.readyState !== "loading") {
        init();
    } else {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    }
    
    // Return a more robust controller (keeping startSpeaking for backward compatibility)
    return {
        startSpeaking: () => {
            // This is now just a wrapper for existing functionality
            if (!animationStarted) {
                if (!robotSpeech.isAudioInitialized()) {
                    robotSpeech.init();
                }
                
                animationStarted = true;
                bubble.style.display = "block";
                typeWriter().catch(err => console.error('Animation error:', err));
                console.log("Robot animation started manually");
            }
        },
        // Add ability to check status
        isActive: () => animationStarted
    };
}

// Add method to exported function to allow external control
initRobot.toggleSpeechSounds = function() {
    return robotSpeech.toggle();
};
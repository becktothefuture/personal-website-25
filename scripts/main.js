/**
 * Main initialization script for the website
 * 
 * This module orchestrates the loading and initialization of all website components
 * following a specific sequence for optimal user experience.
 * 
 * Modules and their responsibilities:
 * - browserTheme.js: Manages light/dark mode theme based on user preferences and system settings
 * - sounds.js: Handles sound system initialization, sound effects, and user audio preferences
 * - intro.js: Controls the website intro/loading sequence animation
 * - resizeOverlay.js: Shows an overlay during browser resize to prevent layout jumps
 * - starfieldThruster.js: Controls the animated starfield background with thruster effects
 * - scrollTracker.js: Tracks scrolling behavior and velocity, emitting events for other components
 * - smoothScroll.js: Implements smooth scrolling with Lenis.js for better scroll performance
 * - lightGrid.js: Manages light grid animations and responsive behaviors
 * - dateDisplay.js: Displays and updates formatted date information
 * - marqueeContent.js: Handles scrolling marquee text animations
 * - londonClock.js: Renders and updates an analog clock showing London time
 * - flicker.js: Creates realistic flickering effects for UI elements
 * - robotAnimation.js: Controls the robot character animations and dialog system
 * - widgetEffects.js: Manages interactive effects for various UI widgets
 * - mousemonitors.js: Tracks mouse movement, speed and interaction metrics
 * - processorAnimations.js: Handles the multiple processor visualization animations
 * - scrollEffect.js: Creates physical scrolly/shake effects based on scroll velocity
 * - lampEffect.js: Creates a decorative lamp visual effect that responds to page scrolling
 * - diffusionText.js: Creates text animation that "diffuses" between multiple phrases with character transitions
 * - buttonToggle.js: Manages 3D button toggling with only one active at a time AND view switching 
 * - scrollPattern.js: Creates and animates a pattern that moves based on scroll velocity
 * - widgetAnimations.js: Handles widget animations for view transitions
 * - viewToggle.js: DEPRECATED: Functionality moved to buttonToggle.js
 */

// Import browser theme module - this module self-initializes on import
import './modules/browserTheme.js';
console.log('Browser theme initialized via self-initialization');

// Import scrollTracker module first - it needs to be initialized before dependent modules
import { scrollTracker } from './modules/scrollTracker.js';
console.log('Scroll tracker initialized via self-initialization');

// Import smooth scroll module - needs to be initialized right after scrollTracker
// import { initSmoothScroll } from './modules/smoothScroll.js';
// console.log('Imported smooth scroll module');

// Import the buttonToggle module which now handles all view toggling
import { init3DButtons } from './modules/buttonToggle.js';
// DEPRECATED: viewToggle.js functionality moved to buttonToggle.js
// import initViewToggle from './modules/viewToggle.js';

// Import all other modules after browser theme
import { initSoundSystem, EVENTS, buttonSounds } from './modules/sounds.js';
import { initResizeOverlay } from './modules/resizeOverlay.js';
import { initStarfieldThruster } from './modules/starfieldThruster.js';
import { initcursorTracker } from './modules/cursorTracker.js'; // Fixed: lowercase 'c' to match export
import { initscrollEffect } from './modules/scrollEffect.js';
import { initCursorEffects } from './modules/cursorEffects.js'; 
import { initLampEffect } from './modules/lampEffect.js';
import { initLightGrids } from './modules/lightGrid.js';
import { initDateDisplay } from './modules/dateDisplay.js';
import { initMarqueeContent } from './modules/marqueeContent.js';
import { initLondonClock } from './modules/londonClock.js';
import { initRobot } from './modules/robotAnimation.js';
import { 
    initProcessorAnimation1, 
    initProcessorAnimation2,
    initProcessorAnimation3,
    initProcessorAnimation4 
} from './modules/processorAnimations.js';
import { initDiffusionText } from './modules/diffusionText.js';
import { initInterference } from './modules/interference.js';

// Start preloading button sounds immediately for instant availability
buttonSounds.preload().catch(err => console.warn('Early button sound preload failed:', err.toString()));



/********************************
 * MAIN INITIALIZATION SEQUENCE *
 ********************************/

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // STEP 1: PREPARATION & SOUND SYSTEM
        //--------------------------------------
        // Initialize buttonToggle first, which now handles all view toggling
        console.log('Initializing button toggle system (includes view switching)');
        init3DButtons();
        
        // DEPRECATED: viewToggle.js functionality moved to buttonToggle.js
        // console.log('Initializing view toggle system');
        // initViewToggle();
        
        // Initialize widget animations commented out
        // console.log('Initializing widget system for proper Lottie initialization');
        // initWidgetAnimations();
        
        // Give Lottie more time to initialize properly before continuing
        console.log('Waiting for Lottie animations to initialize...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Initialize sound system and wait for user confirmation
        await initSoundSystem();
        await new Promise(resolve => {
            window.addEventListener(EVENTS.SOUND_CHOICE_MADE, resolve, { once: true });
        });
        console.log('Sound system initialized');

        // STEP 2: MODULE INITIALIZATION
        //--------------------------------------
        // Initialize smooth scrolling FIRST as it affects all scroll events
        // initSmoothScroll();
        // console.log('Smooth scrolling initialized with Lenis.js');
        
        // Initialize tracking modules (cursor, scroll effects)
        initcursorTracker(); // Fix - using lowercase 'c' to match export
        // scrollTracker is already initialized on import, don't call it as a function
        initscrollEffect();
        
        // Initialize all other modules after sound choice is confirmed
        initResizeOverlay(); 
        initStarfieldThruster();
        initCursorEffects();
        initLampEffect();
        // init3DButtons already called above
        initLightGrids();
        initDateDisplay();
        initMarqueeContent();
        initLondonClock();
        initRobot();
        initProcessorAnimation1();
        initProcessorAnimation2();
        initProcessorAnimation3();
        initProcessorAnimation4();
        initDiffusionText();
        initInterference();


        console.log('All modules initialized');

        // STEP 3: UI REVEAL & INTERACTIONS
        //--------------------------------------
        // Button toggle handles showing the home view

    } catch (error) {
        console.error('Error in main initialization sequence:', error);
    }
});

console.log("Webflow External Scripts initialized");
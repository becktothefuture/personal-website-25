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
 * - button3DToggle.js: Manages 3D button toggling with only one active at a time
 * - scrollPattern.js: Creates and animates a pattern that moves based on scroll velocity
 * - widgetAnimations.js: Handles widget animations for view transitions
 */

// Import all modules up front
import { initBrowserTheme } from './modules/browserTheme.js';
import { initSoundSystem, EVENTS, buttonSounds } from './modules/sounds.js';
import { 
    hideAllWidgets, 
    animateAllWidgetsIntro, 
    showHomeView,
    init as initWidgetAnimations 
} from './modules/widgetAnimations.js';
import { initResizeOverlay } from './modules/resizeOverlay.js';
import { initStarfieldThruster } from './modules/starfieldThruster.js';
import { initCursorEffects } from './modules/cursorEffects.js'; 
import { initcursorTracker } from './modules/cursorTracker.js';
import { initscrollEffect } from './modules/scrollEffect.js';
import { initLampEffect } from './modules/lampEffect.js';
import { init3DButtons } from './modules/button3DToggle.js';
import { initLightGrids } from './modules/lightGrid.js';
import { initDateDisplay } from './modules/dateDisplay.js';
import { initMarqueeContent } from './modules/marqueeContent.js';
import { initLondonClock } from './modules/londonClock.js';
import { initFlicker } from './modules/flicker.js';
import { initRobot } from './modules/robotAnimation.js';
import { 
    initProcessorAnimation1, 
    initProcessorAnimation2,
    initProcessorAnimation3,
    initProcessorAnimation4 
} from './modules/processorAnimations.js';
import { initDiffusionText } from './modules/diffusionText.js';
import './modules/scrollTracker.js';

// Start preloading button sounds immediately for instant availability
buttonSounds.preload().catch(err => console.warn('Early button sound preload failed:', err));

// Critical visual components initialize immediately
initBrowserTheme();

/********************************
 * MAIN INITIALIZATION SEQUENCE *
 ********************************/

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // STEP 1: PREPARATION & SOUND SYSTEM
        //--------------------------------------
        // Hide widgets during initialization
        hideAllWidgets();
        console.log('Waiting for Lottie animations to initialize...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Initialize sound system and wait for user confirmation
        await initSoundSystem();
        await new Promise(resolve => {
            window.addEventListener(EVENTS.SOUND_CHOICE_MADE, resolve, { once: true });
        });
        console.log('Sound system initialized');

        // STEP 2: MODULE INITIALIZATION
        //--------------------------------------
        // Initialize all modules after sound choice is confirmed
        initWidgetAnimations();
        initResizeOverlay(); 
        initStarfieldThruster();
        initCursorEffects(); 
        initcursorTracker();
        initscrollEffect();
        initLampEffect();
        init3DButtons();
        initLightGrids();
        initDateDisplay();
        initMarqueeContent();
        initLondonClock();
        initFlicker();
        initRobot();
        initProcessorAnimation1();
        initProcessorAnimation2();
        initProcessorAnimation3();
        initProcessorAnimation4();
        initDiffusionText();

        console.log('All modules initialized');

        // STEP 3: UI REVEAL & INTERACTIONS
        //--------------------------------------
        // Reveal widgets after a delay
        const widgetRevealDelay = 2000;
        setTimeout(() => {
            // First animate all widgets intro
            animateAllWidgetsIntro()
              .then(() => {
                // Then ensure the home view is shown
                showHomeView();
              });
        }, widgetRevealDelay);


    } catch (error) {
        console.error('Error in main initialization sequence:', error);
    }
});

console.log("Webflow External Scripts initialized");
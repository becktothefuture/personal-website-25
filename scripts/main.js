/**
 * Main initialization script for the website
 * 
 * This module orchestrates the loading and initialization of all website components
 * following a specific sequence for optimal user experience.
 * 
 * Modules and their responsibilities:
 * - browserTheme.js: Manages light/dark mode theme based on user preferences and system settings
 * - sounds.js: Handles sound system initialization, sound effects, and user audio preferences
 * - loader.js: Manages the display of loading text and animations.
 * - resizeOverlay.js: Shows an overlay during browser resize to prevent layout jumps
 * - lightGrid.js: Manages light grid animations and responsive behaviors
 * - dateDisplay.js: Displays and updates formatted date information
 * - marqueeContent.js: Handles scrolling marquee text animations
 * - londonClock.js: Renders and updates an analog clock showing London time
 * - robotAnimation.js: Controls the robot character animations and dialog system
 * - processorAnimations.js: Handles the multiple processor visualization animations
 * - diffusionText.js: Creates text animation that "diffuses" between multiple phrases with character transitions
 * - buttonToggle.js: Manages 3D button toggling with only one active at a time AND view switching 
 * - cursorTracker.js: Tracks mouse movement, clicks, and distance.
 * - interference.js: Adds visual interference effects.
 * - intro.js: DEPRECATED: Controls the website intro/loading sequence animation
 * - starfieldThruster.js: DEPRECATED: Controls the animated starfield background with thruster effects
 * - flicker.js: DEPRECATED: Creates realistic flickering effects for UI elements
 * - widgetEffects.js: DEPRECATED: Manages interactive effects for various UI widgets
 * - mousemonitors.js: DEPRECATED: Tracks mouse movement, speed and interaction metrics
 * - widgetAnimations.js: DEPRECATED: Handles widget animations for view transitions
 * - viewToggle.js: DEPRECATED: Functionality moved to buttonToggle.js
 */

/**
 * Utility to detect Webflow environments
 * Used to ensure compatibility with Webflow's preview/canvas mode
 */
export const webflowEnv = {
  isPreviewMode: () => window.location.hostname.includes('canvas.webflow.com'),
  isPublishedSite: () => window.location.hostname.includes('webflow.io'),
  getSiteName: () => window.location.hostname.split('.')[0],
  getAllowedDomains: () => ['.webflow.io', '.canvas.webflow.com']
};

// Import browser theme module - this module self-initializes on import
import { applyBrowserColors, prefersDarkMode } from './modules/browserTheme.js';

// Correct import statement for loader.js - moved up for early parsing
import { initLoadingText, stopAnimation } from './modules/loader.js';

// Import the buttonToggle module which now handles all view toggling
import { init3DButtons } from './modules/buttonToggle.js';

// Import all other modules after browser theme
import { initSoundSystem, EVENTS, buttonSounds } from './modules/sounds.js';
import { initResizeOverlay } from './modules/resizeOverlay.js';
import { initcursorTracker } from './modules/cursorTracker.js'; // Fixed: lowercase 'c' to match export
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
        // Initialize browser theme and loader text first.
        console.log('Applying browser colors...');
        applyBrowserColors('DOMContentLoaded');
        console.log('Initializing loading text...');
        initLoadingText();

        // Add listener for system theme changes
        prefersDarkMode.addEventListener("change", () => applyBrowserColors('systemChange'));
        
        // STEP 1: PREPARATION & SOUND SYSTEM
        //--------------------------------------
        // Initialize buttonToggle first, which now handles all view toggling
        console.log('Initializing button toggle system (includes view switching)');
        init3DButtons();
        
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
        // Initialize tracking modules (cursor)
        initcursorTracker(); // Keep cursor tracker for clicks and distance tracking
        
        // Initialize all other modules after sound choice is confirmed
        initResizeOverlay(); 
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
/**
 * Main Application Initialization
 * -------------------------------
 */

// ===== DIRECT IMPORTS =====
import { initBrowserTheme } from './modules/browserTheme.js';
import { initSoundSystem, EVENTS } from './modules/sounds.js';
import { initIntroSequence } from './modules/intro.js';
import { initLightGrids } from './modules/lightGrid.js';
import { initDateDisplay } from './modules/dateDisplay.js';
import { initMarqueeContent } from './modules/marqueeContent.js';
import { initLondonClock } from './modules/londonClock.js';

// Initialize browser theme immediately (before DOM is ready)
initBrowserTheme();

/**
 * Core Module Initialization
 * Essential features that require sequential loading
 */
const initializeCoreModules = async () => {
    try {
        // Wait for sound system initialization and user choice
        await initSoundSystem();
        await new Promise(resolve => {
            window.addEventListener(EVENTS.SOUND_CHOICE_MADE, resolve, { once: true });
        });

        // Start intro sequence once sound is ready
        initIntroSequence();
        
        console.log('Core systems initialized');
    } catch (error) {
        console.error('Error initializing core modules:', error);
    }
};

/**
 * Secondary Module Initialization
 * Non-critical features loaded in parallel after core systems
 */
const initializeSecondaryModules = async () => {
    try {
        // Import all secondary modules
        const modules = await Promise.all([
            import('./modules/flicker.js'),
            import('./modules/robotAnimation.js'),
            import('./modules/widgetEffects.js'),
            import('./modules/mousemonitors.js'),
            import('./modules/processorAnimations.js'),
            import('./modules/starfieldThruster.js'),
            import('./modules/diffusionText.js') // Add the new diffusion text module
        ]);
        
        // Destructure modules by array position
        const [
            { initFlicker },
            { initRobot },
            { initWidgetEffects },
            { initMouseMonitors },
            { 
                initProcessorAnimation1, 
                initProcessorAnimation2, 
                initProcessorAnimation3, 
                initProcessorAnimation4 
            },
            { initStarfieldThruster },
            { initDiffusionText }  // Extract the diffusion text initializer
        ] = modules;

        // Initialize all secondary modules
        initFlicker();
        initRobot();
        initWidgetEffects();
        initMouseMonitors();
        initProcessorAnimation1();
        initProcessorAnimation2();
        initProcessorAnimation3();
        initProcessorAnimation4();
        initStarfieldThruster();
        initDiffusionText();  // Initialize diffusion text animations
        
        console.log('Secondary modules initialized');
    } catch (error) {
        console.error('Error loading secondary modules:', error);
    }
};

/**
 * Main Initialization Sequence
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize core modules first (sequential)
    await initializeCoreModules();
    
    // Initialize secondary modules (parallel)
    initializeSecondaryModules();
    
    // Initialize UI components
    initLightGrids();
    initDateDisplay();
    initMarqueeContent();
    initLondonClock();
    
    console.log('DOM fully loaded and parsed');
});

console.log("Webflow External Scripts initialized");
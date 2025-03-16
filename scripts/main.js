import { initBrowserTheme } from './modules/browserTheme.js';
import { initSoundSystem, EVENTS } from './modules/sounds.js';
import { initIntroSequence } from './modules/intro.js';
import { initLightGrids } from './modules/lightGrid.js';
import { initDateDisplay } from './modules/dateDisplay.js';
import { initMarqueeContent } from './modules/marqueeContent.js';
import { initLondonClock } from './modules/londonClock.js'
import { initRobot } from './modules/robotAnimation.js';


// Initialize browser theme immediately
initBrowserTheme();


// Function to initialize core modules
const initializeCoreModules = async () => {
    try {
        // Initialize sound system and wait for user to make a choice
        await initSoundSystem();
        await new Promise(resolve => {
            window.addEventListener(EVENTS.SOUND_CHOICE_MADE, resolve, { once: true });
        });

        // Start initializing core modules
        initIntroSequence();

        console.log('Core systems initialized');
    } catch (error) {
        console.error('Error initializing core modules:', error);
    }
};

// Secondary modules: load in parallel after core modules
// (these are not critical to the experience)
const initializeSecondaryModules = async () => {
    try {
        // Import individual modules separately for better readability
        const flickerModule = await import("./modules/flicker.js");
        const robotModule = await import("./modules/robotAnimation.js");
        const widgetEffectsModule = await import("./modules/widgetEffects.js");
        const mouseMonitorsModule = await import("./modules/mousemonitors.js");
        const processorAnimationsModule = await import("./modules/processorAnimations.js");

        // Destructure the needed functions from each module
        const { initMarqueeContent } = await import("./modules/marqueeContent.js");
        const { initFlicker } = flickerModule;
        const { initRobot } = robotModule;
        const { initWidgetEffects } = widgetEffectsModule;
        const { initMouseMonitors } = mouseMonitorsModule;
        
        // If processorAnimations.js exports multiple functions, destructure them properly
        const { 
            initProcessorAnimation1, 
            initProcessorAnimation2, 
            initProcessorAnimation3, 
            initProcessorAnimation4 
        } = processorAnimationsModule;

        // Initialize all secondary modules
        initFlicker();
        initRobot();
        initWidgetEffects();
        initMouseMonitors();
        initProcessorAnimation1();
        initProcessorAnimation2();
        initProcessorAnimation3();
        initProcessorAnimation4();
        initMarqueeContent();

        console.log('Secondary modules initialized');
    } catch (error) {
        console.error('Error loading secondary modules:', error);
    }
};

// Start initialization
document.addEventListener('DOMContentLoaded', async () => {
    await initializeCoreModules();
    initializeSecondaryModules();
    initLightGrids();
    initDateDisplay();
    initMarqueeContent();
    const clockControls = initLondonClock();
    console.log('DOM fully loaded and parsed');
});

console.log("Webflow External Scripts initialized");
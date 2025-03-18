/**
 * Main Application Initialization
 * -------------------------------
 */

// ===== IMMEDIATE INITIALISATION SEQUENCE =====
import { initBrowserTheme } from './modules/browserTheme.js';
import { initSoundSystem, EVENTS } from './modules/sounds.js';
import { initIntroSequence } from './modules/intro.js';
import { initResizeOverlay } from './modules/resizeOverlay.js'; 

initBrowserTheme();
initResizeOverlay(); // <-- initialize resize overlay module

// ===== MAIN INITIALISATION SEQUENCE =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Step 1: Initialize sound system and wait for user choice
        await initSoundSystem();
        await new Promise(resolve => {
            window.addEventListener(EVENTS.SOUND_CHOICE_MADE, resolve, { once: true });
        });
        console.log('Sound system initialized');

        // Step 2: Start intro sequence
        const introSequencePromise = initIntroSequence();
        console.log('Intro sequence started');

        // Step 3: While intro is running, load all other modules in parallel
        setTimeout(async () => {
            try {
                const { initLightGrids } = await import('./modules/lightGrid.js');
                const { initDateDisplay } = await import('./modules/dateDisplay.js');
                const { initMarqueeContent } = await import('./modules/marqueeContent.js');
                const { initLondonClock } = await import('./modules/londonClock.js');
                const { initFlicker } = await import('./modules/flicker.js');
                const { initRobot } = await import('./modules/robotAnimation.js');
                const { initWidgetEffects } = await import('./modules/widgetEffects.js');
                const { initMouseMonitors } = await import('./modules/mousemonitors.js');
                const { initStarfieldThruster } = await import('./modules/starfieldThruster.js');
                const { 
                    initProcessorAnimation1, 
                    initProcessorAnimation2,
                    initProcessorAnimation3,
                    initProcessorAnimation4 
                } = await import('./modules/processorAnimations.js');

                initLightGrids();
                initDateDisplay();
                initMarqueeContent();
                initLondonClock();
                initFlicker();
                initRobot();
                initWidgetEffects();
                initMouseMonitors();
                initProcessorAnimation1();
                initProcessorAnimation2();
                initProcessorAnimation3();
                initProcessorAnimation4();
                initStarfieldThruster();

                console.log('All modules initialized');

            } catch (error) {
                console.error('Error loading modules:', error);
            }
        }, 50); // Small delay to ensure intro sequence starts first

        // Wait for intro to complete
        await introSequencePromise;
        console.log('Intro sequence completed');

    } catch (error) {
        console.error('Error in main initialization sequence:', error);
    }
});

console.log("Webflow External Scripts initialized");
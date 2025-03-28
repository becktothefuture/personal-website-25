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
 * - rumbleEffect.js: Creates physical rumble/shake effects based on scroll velocity
 * - lampEffect.js: Creates a decorative lamp visual effect that responds to page scrolling
 * - diffusionText.js: Creates text animation that "diffuses" between multiple phrases with character transitions
 * - button3DToggle.js: Manages 3D button toggling with only one active at a time
 * - scrollPattern.js: Creates and animates a pattern that moves based on scroll velocity
 * 
 * The initialization process is divided into two phases:
 * 1. Immediate initialization: Components that need to be available immediately
 * 2. Sequential initialization after DOM content is loaded
 */



// ===== IMMEDIATE INITIALISATION SEQUENCE =====
import { initBrowserTheme } from './modules/browserTheme.js';
import { initSoundSystem, EVENTS, buttonSounds } from './modules/sounds.js';
import { initIntroSequence } from './modules/intro.js';
import { initResizeOverlay } from './modules/resizeOverlay.js'; 
import { initStarfieldThruster } from './modules/starfieldThruster.js';
import { initPerspectiveController } from './modules/perspectiveController.js';
import './modules/scrollTracker.js'; 
import './modules/button3DToggle.js';

// Start preloading button sounds immediately for instant availability
buttonSounds.preload().catch(err => console.warn('Early button sound preload failed:', err));

initBrowserTheme();
initResizeOverlay(); 
initStarfieldThruster();
initPerspectiveController();

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
        let robotController; // Add variable to store robot controller

        setTimeout(async () => {
            try {
                const { initLightGrids } = await import('./modules/lightGrid.js');
                const { initDateDisplay } = await import('./modules/dateDisplay.js');
                const { initMarqueeContent } = await import('./modules/marqueeContent.js');
                const { initLondonClock } = await import('./modules/londonClock.js');
                const { initFlicker } = await import('./modules/flicker.js');
                const { initRobot } = await import('./modules/robotAnimation.js');
                const { initMouseTracker } = await import('./modules/mouseTracker.js');
                const { 
                    initProcessorAnimation1, 
                    initProcessorAnimation2,
                    initProcessorAnimation3,
                    initProcessorAnimation4 
                } = await import('./modules/processorAnimations.js');
                const { initRumbleEffect } = await import('./modules/rumbleEffect.js');
                const { initLampEffect } = await import('./modules/lampEffect.js');
                const { initDiffusionText } = await import('./modules/diffusionText.js');
                const { scrollPattern } = await import('./modules/scrollPattern.js');

                initLightGrids();
                initDateDisplay();
                initMarqueeContent();
                initLondonClock();
                initFlicker();
                // Store the robot controller but don't start speaking yet
                robotController = initRobot();
                initMouseTracker();
                initProcessorAnimation1();
                initProcessorAnimation2();
                initProcessorAnimation3();
                initProcessorAnimation4();
                initRumbleEffect();
                initLampEffect();
                initDiffusionText();

                console.log('All modules initialized');

            } catch (error) {
                console.error('Error loading modules:', error);
            }
        }, 500); // Small delay to ensure intro sequence starts first

        // Wait for intro to complete
        await introSequencePromise;
        console.log('Intro sequence completed');
        
        // Start robot speaking only after intro is complete
        document.addEventListener('intro:complete', () => {
            if (robotController && robotController.startSpeaking) {
                // Add a small delay before starting the robot speech
                setTimeout(() => {
                    robotController.startSpeaking();
                }, 500);
            }
        }, { once: true });

    } catch (error) {
        console.error('Error in main initialization sequence:', error);
    }
});

console.log("Webflow External Scripts initialized");
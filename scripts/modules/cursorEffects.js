/**
 * Cursor Effects Module
 * -----------------------------
 * Controls the 3D perspective movement of elements based on:
 * 1. Mouse position (for devices with mouse/pointer)
 * 2. Automatic animations (for touch devices)
 * 
 * @requires ./cursorTracker.js
 */

import { cursorXPercent, cursorYPercent } from './cursorTracker.js';

// Configuration for element transformations
export const transformConfig = {
  // Configuration for panel element
  panel: {
    rotateXRange: 2,  // -2 to 2 deg rotation on X axis
    rotateYRange: 2   // -2 to 2 deg rotation on Y axis
  },
  // Configuration for reflection element
  reflection: {
    translateXRange: 2,  // -2% to 2% translation on X axis
    translateYRange: 2,  // -2% to 2% translation on Y axis
    inverted: true        // Move in opposite direction
  },
  // Configuration for depth-wrapper element (NEW)
  depthWrapper: {
    rotateXRange: 1.5, // -1.5 to 1.5 deg rotation on X axis
    rotateYRange: 1.5  // -1.5 to 1.5 deg rotation on Y axis
  },

  // Animation settings
  smoothFactor: 0.1,      // Adjusted for slightly faster response
  updateInterval: 10,     // Update interval in ms (throttle for performance)
  animation: {
    duration: '0.3s',
    easing: 'ease-out',   // Using ease-out for more natural movement
    touchDuration: '40s'
  }
};

class CursorEffectsController {
  // Private class fields
  #panel = null;
  #reflection = null;
  #depthWrapper = null; // NEW: Add depthWrapper element
  #isMouseDevice = false;
  #isInitialized = false;
  #animationFrameId = null;
  #lastUpdateTime = 0;

  constructor() {
    this.#detectDeviceType();
  }

  /**
   * Initialize the controller by finding DOM elements and setting up appropriate handlers
   */
  init() {
    if (this.#isInitialized) return;

    // Find and cache required DOM elements - using getElementById for better performance
    this.#panel = document.getElementById('panel');
    this.#reflection = document.getElementById('reflection');
    this.#depthWrapper = document.getElementById('depth-wrapper'); // NEW: Find depthWrapper

    // Check if elements exist
    const missingElements = [];
    if (!this.#panel) missingElements.push('#panel');
    if (!this.#reflection) missingElements.push('#reflection');
    if (!this.#depthWrapper) missingElements.push('#depth-wrapper'); // NEW: Check depthWrapper

    if (missingElements.length > 0) {
      console.warn(`Elements not found for cursor effects: ${missingElements.join(', ')}`);
      // Continue anyway - elements might be added dynamically or queried lazily
    }

    // Initialize based on device type
    if (this.#isMouseDevice) {
      this.#setupMouseControl();
    } else {
      this.#setupTouchAnimation();
    }

    this.#isInitialized = true;
    console.log(`Cursor effects initialized in ${this.#isMouseDevice ? 'mouse' : 'touch'} mode`);

    // Handle resize events with passive listener for better performance
    window.addEventListener('resize', this.#handleResize.bind(this), { passive: true });

    // Log initial state
    console.log('Cursor effects targeting:',
      this.#panel ? '#panel' : 'panel not found',
      this.#reflection ? '#reflection' : 'reflection not found',
      this.#depthWrapper ? '#depth-wrapper' : 'depth-wrapper not found' // NEW: Log depthWrapper
    );
  }

  /**
   * Detect if user is on a mouse device or touch device
   */
  #detectDeviceType() {
    // Simplified detection that prioritizes mouse input devices
    // This improves compatibility across devices that have both touch and mouse capabilities
    this.#isMouseDevice = true; // Default to mouse device for better compatibility

    // Only set to false if it's definitively a touch-only device
    if ('ontouchstart' in window &&
        navigator.maxTouchPoints > 0 &&
        !window.matchMedia('(pointer: fine)').matches) {
      this.#isMouseDevice = false;
    }

    console.log(`Device detected as: ${this.#isMouseDevice ? 'mouse' : 'touch'} device`);
  }

  /**
   * Apply CSS animations for touch devices
   */
  #setupTouchAnimation() {
    this.#clearStyles();

    // Apply transitions for smooth movement
    const transition = `transform ${transformConfig.animation.duration} ${transformConfig.animation.easing}`;

    // Apply transitions to elements
    if (this.#panel) this.#panel.style.transition = transition;
    if (this.#reflection) this.#reflection.style.transition = transition;
    if (this.#depthWrapper) this.#depthWrapper.style.transition = transition; // NEW: Apply to depthWrapper

    // For touch devices, we could add automatic animations if needed
    // Note: Currently no automatic animations are implemented to keep it simple
  }

  /**
   * Set up mouse-controlled movement
   */
  #setupMouseControl() {
    this.#clearStyles();

    // Set will-change property for better performance
    // This hints the browser to prepare for upcoming transforms
    if (this.#panel) this.#panel.style.willChange = 'transform';
    if (this.#reflection) this.#reflection.style.willChange = 'transform';
    if (this.#depthWrapper) this.#depthWrapper.style.willChange = 'transform'; // NEW: Apply to depthWrapper

    this.#startMouseControlLoop();
  }

  /**
   * Clear all animation styles
   */
  #clearStyles() {
    // Reset all styles on elements
    // NEW: Added this.#depthWrapper to the list
    for (const element of [this.#panel, this.#reflection, this.#depthWrapper]) {
      if (element) {
        element.style.animation = 'none';
        element.style.transform = 'none';
        element.style.transition = 'none';
        element.style.willChange = 'auto';
      }
    }
  }

  /**
   * Animation loop for mouse-controlled movement
   * Uses requestAnimationFrame with throttling for better performance
   */
  #startMouseControlLoop() {
    // State objects to track current transform values
    const state = {
      panel: { rotateX: 0, rotateY: 0 },
      reflection: { translateX: 0, translateY: 0 },
      depthWrapper: { rotateX: 0, rotateY: 0 } // NEW: Add state for depthWrapper
    };

    let lastTimestamp = 0;

    const animationStep = (timestamp) => {
      // Calculate delta time with a cap to handle tab switches/sleeps
      const deltaTime = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 16.67, 2) : 1;
      lastTimestamp = timestamp;

      // Throttle updates for better performance
      // Only update every transformConfig.updateInterval ms
      if (timestamp - this.#lastUpdateTime < transformConfig.updateInterval) {
        this.#animationFrameId = requestAnimationFrame(animationStep);
        return;
      }

      this.#lastUpdateTime = timestamp;

      // Lazily query elements if not found during init
      if (!this.#panel) this.#panel = document.getElementById('panel');
      if (!this.#reflection) this.#reflection = document.getElementById('reflection');
      if (!this.#depthWrapper) this.#depthWrapper = document.getElementById('depth-wrapper'); // NEW: Lazy query depthWrapper

      // Normalize mouse position to range -1 to 1
      const mouseXNormalized = (cursorXPercent - 0.5) * 2;
      const mouseYNormalized = (cursorYPercent - 0.5) * 2;

      // Calculate transform values

      // Panel rotation
      const targetPanelRotateX = mouseYNormalized * transformConfig.panel.rotateXRange;
      const targetPanelRotateY = -mouseXNormalized * transformConfig.panel.rotateYRange;

      // Reflection translation (opposite direction if inverted is true)
      const reflectionInversionFactor = transformConfig.reflection.inverted ? -1 : 1;
      const targetReflectionTranslateX = mouseXNormalized * transformConfig.reflection.translateXRange * reflectionInversionFactor;
      const targetReflectionTranslateY = mouseYNormalized * transformConfig.reflection.translateYRange * reflectionInversionFactor;

      // NEW: DepthWrapper rotation
      const targetDepthWrapperRotateX = mouseYNormalized * transformConfig.depthWrapper.rotateXRange;
      const targetDepthWrapperRotateY = -mouseXNormalized * transformConfig.depthWrapper.rotateYRange;


      // Calculate smooth interpolation factor
      // Use a slightly different factor if needed, or keep it consistent
      const smoothFactor = transformConfig.smoothFactor * deltaTime;

      // Interpolate values for smooth transitions
      // Panel
      this.#smoothInterpolate(state.panel, 'rotateX', targetPanelRotateX, smoothFactor);
      this.#smoothInterpolate(state.panel, 'rotateY', targetPanelRotateY, smoothFactor);

      // Reflection
      this.#smoothInterpolate(state.reflection, 'translateX', targetReflectionTranslateX, smoothFactor);
      this.#smoothInterpolate(state.reflection, 'translateY', targetReflectionTranslateY, smoothFactor);

      // NEW: DepthWrapper
      this.#smoothInterpolate(state.depthWrapper, 'rotateX', targetDepthWrapperRotateX, smoothFactor);
      this.#smoothInterpolate(state.depthWrapper, 'rotateY', targetDepthWrapperRotateY, smoothFactor);


      // Apply transformations to DOM elements
      this.#applyPanelTransforms(state.panel);
      this.#applyReflectionTransforms(state.reflection);
      this.#applyDepthWrapperTransforms(state.depthWrapper); // NEW: Apply depthWrapper transforms

      // Log current transform values every second (removed previous debug logs)
      // if (Math.floor(timestamp / 1000) !== Math.floor(lastTimestamp / 1000)) {
      //   console.log('Current transforms:', {
      //     panel: { ...state.panel },
      //     reflection: { ...state.reflection },
      //     depthWrapper: { ...state.depthWrapper } // NEW: Log depthWrapper state
      //   });
      // }

      this.#animationFrameId = requestAnimationFrame(animationStep);
    };

    this.#animationFrameId = requestAnimationFrame(animationStep);
  }

  /**
   * Smoothly interpolate a value for fluid animation
   */
  #smoothInterpolate(obj, key, targetValue, smoothFactor) {
    if (obj[key] === undefined) obj[key] = 0;
    // Clamp smoothFactor to prevent overshooting with large deltaTime
    const effectiveSmoothFactor = Math.min(smoothFactor, 1);
    obj[key] += effectiveSmoothFactor * (targetValue - obj[key]);
    // Optional: Add a threshold to snap to target when very close
     if (Math.abs(obj[key] - targetValue) < 0.001) {
       obj[key] = targetValue;
     }
  }

  /**
   * Apply transforms to panel element
   */
  #applyPanelTransforms({ rotateX, rotateY }) {
    if (this.#panel) {
      // Ensure perspective is set on the parent or the element itself if needed
      this.#panel.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  }

  /**
   * Apply transforms to reflection element
   */
  #applyReflectionTransforms({ translateX, translateY }) {
    if (this.#reflection) {
      // Reflections typically don't need perspective for simple translation
      this.#reflection.style.transform = `translate(${translateX}%, ${translateY}%)`;
    }
  }

  /**
   * NEW: Apply transforms to depthWrapper element
   */
  #applyDepthWrapperTransforms({ rotateX, rotateY }) {
    if (this.#depthWrapper) {
      // Ensure perspective is set on the parent or the element itself if needed
      this.#depthWrapper.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  }


  /**
   * Handle window resize events
   */
  #handleResize() {
    const wasMouseDevice = this.#isMouseDevice;
    this.#detectDeviceType();

    // Reinitialize if device type changes
    if (wasMouseDevice !== this.#isMouseDevice) {
      this.#isInitialized = false;
      this.#cancelAnimation();
      this.init();
    }
  }

  /**
   * Cancel any running animation
   */
  #cancelAnimation() {
    if (this.#animationFrameId) {
      cancelAnimationFrame(this.#animationFrameId);
      this.#animationFrameId = null;
    }
  }

  /**
   * Update configuration parameters
   */
  updateConfig(newConfig) {
    // Deep merge for nested objects
    for (const key of Object.keys(newConfig)) {
      if (typeof newConfig[key] === 'object' && transformConfig[key]) {
        // Ensure nested config exists before merging
         if (typeof transformConfig[key] !== 'object') {
           transformConfig[key] = {}; // Initialize if not an object
         }
        transformConfig[key] = {
          ...transformConfig[key],
          ...newConfig[key]
        };
      } else {
        transformConfig[key] = newConfig[key];
      }
    }

    // Re-initialize if necessary (e.g., if smoothFactor changed)
    // Consider if a full re-init is always needed or just specific updates
    if (this.#isInitialized) {
       console.log("CursorEffects config updated. Consider if re-initialization is needed.");
       // Optionally, re-apply styles or restart loop if needed based on changed config
       // For simplicity, we're not forcing a full re-init here.
    }
  }


  /**
   * Clean up and stop all animations
   */
  destroy() {
    this.#cancelAnimation();
    window.removeEventListener('resize', this.#handleResize);
    this.#clearStyles();
    this.#isInitialized = false;
  }
}

// Singleton instance
let cursorEffectsInstance = null;

/**
 * Initialize the cursor effects controller
 * @returns {CursorEffectsController} The controller instance
 */
export function initCursorEffects() {
  if (!cursorEffectsInstance) {
    cursorEffectsInstance = new CursorEffectsController();
    cursorEffectsInstance.init();
  }
  return cursorEffectsInstance;
}

// Export the instance directly if needed by other modules
export { cursorEffectsInstance };

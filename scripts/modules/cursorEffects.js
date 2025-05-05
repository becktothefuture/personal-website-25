/**
 * Cursor Effects Module - Optimized Version
 * -----------------------------
 * Controls the 3D perspective movement of elements with performance optimizations:
 * 1. Automatically disabled on touch devices
 * 2. Heavily throttled updates
 * 3. Simplified DOM operations
 */

import { cursorXPercent, cursorYPercent } from './cursorTracker.js';

// Configuration for element transformations - more conservative values
export const transformConfig = {
  // Configuration for panel element
  panel: {
    rotateXRange: 1.5,  // Reduced from 2 to 1.5 deg
    rotateYRange: 1.5   // Reduced from 2 to 1.5 deg
  },
  // Configuration for reflection element
  reflection: {
    translateXRange: 1.5, // Reduced from 2 to 1.5%
    translateYRange: 1.5, // Reduced from 2 to 1.5%
    inverted: true       // Move in opposite direction
  },
  // Configuration for depth-wrapper element
  depthWrapper: {
    rotateXRange: 1,    // Reduced from 1.5 to 1 deg
    rotateYRange: 1     // Reduced from 1.5 to 1 deg
  },

  // Animation settings - increased for better performance
  smoothFactor: 0.05,   // Lower for smoother but slower transitions
  updateInterval: 100,  // Increased from 10ms to 100ms for significant throttling
  animation: {
    duration: '0.5s',   // Longer animation for smoother feel
    easing: 'ease-out',
  }
};

class CursorEffectsController {
  // Private class fields
  #panel = null;
  #reflection = null;
  #depthWrapper = null;
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

    // If it's a touch device, don't initialize animation effects
    if (!this.#isMouseDevice) {
      console.log('Cursor effects disabled on touch device');
      return;
    }

    // Find and cache required DOM elements - using getElementById for better performance
    this.#panel = document.getElementById('panel');
    this.#reflection = document.getElementById('reflection');
    this.#depthWrapper = document.getElementById('depth-wrapper');

    // Check if elements exist
    const missingElements = [];
    if (!this.#panel) missingElements.push('#panel');
    if (!this.#reflection) missingElements.push('#reflection');
    if (!this.#depthWrapper) missingElements.push('#depth-wrapper');

    if (missingElements.length > 0) {
      console.warn(`Elements not found for cursor effects: ${missingElements.join(', ')}`);
    }

    // Only initialize mouse control on mouse devices with detected elements
    if (this.#panel || this.#reflection || this.#depthWrapper) {
      this.#setupMouseControl();
      this.#isInitialized = true;
      console.log('Cursor effects initialized in mouse mode');
    } else {
      console.log('No elements found for cursor effects, initialization skipped');
    }

    // Handle window resize with debounce for better performance
    const debouncedResize = this.#debounce(this.#handleResize.bind(this), 250);
    window.addEventListener('resize', debouncedResize, { passive: true });
  }

  /**
   * Detect if user is on a mouse device or touch device
   */
  #detectDeviceType() {
    // For consistent results, use the same detection logic as cursorTracker.js
    this.#isMouseDevice = true; // Default to mouse device

    // Set to false if it's a touch-only device
    if ('ontouchstart' in window &&
        navigator.maxTouchPoints > 0 &&
        !window.matchMedia('(pointer: fine)').matches) {
      this.#isMouseDevice = false;
    }

    console.log(`Cursor effects device detection: ${this.#isMouseDevice ? 'mouse' : 'touch'} device`);
  }

  /**
   * Debounce function to prevent excessive function calls
   */
  #debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Set up mouse-controlled movement with performance optimizations
   */
  #setupMouseControl() {
    this.#clearStyles();

    // Set will-change property for better performance
    // Only set on elements that exist to avoid unnecessary DOM operations
    if (this.#panel) this.#panel.style.willChange = 'transform';
    if (this.#reflection) this.#reflection.style.willChange = 'transform';
    if (this.#depthWrapper) this.#depthWrapper.style.willChange = 'transform';

    this.#startMouseControlLoop();
  }

  /**
   * Clear all animation styles
   */
  #clearStyles() {
    // Reset all styles on elements that exist
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
   * Animation loop for mouse-controlled movement - optimized for performance
   */
  #startMouseControlLoop() {
    // State objects to track current transform values
    const state = {
      panel: { rotateX: 0, rotateY: 0 },
      reflection: { translateX: 0, translateY: 0 },
      depthWrapper: { rotateX: 0, rotateY: 0 }
    };

    let lastTimestamp = 0;

    const animationStep = (timestamp) => {
      // Calculate delta time with a cap to handle tab switches/sleeps
      const deltaTime = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 16.67, 2) : 1;
      lastTimestamp = timestamp;

      // Heavily throttle updates for improved performance
      if (timestamp - this.#lastUpdateTime < transformConfig.updateInterval) {
        this.#animationFrameId = requestAnimationFrame(animationStep);
        return;
      }

      this.#lastUpdateTime = timestamp;

      // Normalize mouse position to range -1 to 1
      const mouseXNormalized = (cursorXPercent - 0.5) * 2;
      const mouseYNormalized = (cursorYPercent - 0.5) * 2;

      // Calculate transform values
      if (this.#panel) {
        // Panel rotation
        const targetPanelRotateX = mouseYNormalized * transformConfig.panel.rotateXRange;
        const targetPanelRotateY = -mouseXNormalized * transformConfig.panel.rotateYRange;
        
        // Interpolate values for smooth transitions
        this.#smoothInterpolate(state.panel, 'rotateX', targetPanelRotateX, transformConfig.smoothFactor * deltaTime);
        this.#smoothInterpolate(state.panel, 'rotateY', targetPanelRotateY, transformConfig.smoothFactor * deltaTime);
        
        // Apply transforms
        this.#applyPanelTransforms(state.panel);
      }

      if (this.#reflection) {
        // Reflection translation
        const reflectionInversionFactor = transformConfig.reflection.inverted ? -1 : 1;
        const targetReflectionTranslateX = mouseXNormalized * transformConfig.reflection.translateXRange * reflectionInversionFactor;
        const targetReflectionTranslateY = mouseYNormalized * transformConfig.reflection.translateYRange * reflectionInversionFactor;
        
        // Interpolate values
        this.#smoothInterpolate(state.reflection, 'translateX', targetReflectionTranslateX, transformConfig.smoothFactor * deltaTime);
        this.#smoothInterpolate(state.reflection, 'translateY', targetReflectionTranslateY, transformConfig.smoothFactor * deltaTime);
        
        // Apply transforms
        this.#applyReflectionTransforms(state.reflection);
      }

      if (this.#depthWrapper) {
        // DepthWrapper rotation
        const targetDepthWrapperRotateX = mouseYNormalized * transformConfig.depthWrapper.rotateXRange;
        const targetDepthWrapperRotateY = -mouseXNormalized * transformConfig.depthWrapper.rotateYRange;
        
        // Interpolate values
        this.#smoothInterpolate(state.depthWrapper, 'rotateX', targetDepthWrapperRotateX, transformConfig.smoothFactor * deltaTime);
        this.#smoothInterpolate(state.depthWrapper, 'rotateY', targetDepthWrapperRotateY, transformConfig.smoothFactor * deltaTime);
        
        // Apply transforms
        this.#applyDepthWrapperTransforms(state.depthWrapper);
      }

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
    // Snap to target when very close to prevent micro-movements
    if (Math.abs(obj[key] - targetValue) < 0.001) {
      obj[key] = targetValue;
    }
  }

  /**
   * Apply transforms to panel element
   */
  #applyPanelTransforms({ rotateX, rotateY }) {
    this.#panel.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  /**
   * Apply transforms to reflection element
   */
  #applyReflectionTransforms({ translateX, translateY }) {
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

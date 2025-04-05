/**
 * Perspective Controller Module
 * -----------------------------
 * Controls the 3D perspective movement of the page based on either:
 * 1. Mouse position (for devices with mouse/pointer)
 * 2. Automatic animations (for touch devices)
 * 
 * @requires ./cursorTracker.js
 */

import { cursorXPercent, cursorYPercent } from './cursorTracker.js';

// Updated configuration: removed perspective depth and shift factors; added separate rotation ranges
export const perspectiveConfig = {
  // Page rotation configuration
  pageRotation: {
    maxTiltX: 1,
    maxTiltY: 2
  },
  // Depth wrapper rotation configuration
  depthRotation: {
    maxTiltX: 2,
    maxTiltY: 4
  },
  // Page scaling
  scaleRange: 0.01,
  
  // Video effects remain unchanged
  video: {
    translateX: 3,
    translateY: 2,
    maxRotationX: 1, 
    maxRotationY: 2,
    inverted: true
  },
  
  // Animation settings
  smoothFactor: 0.1,
  animation: {
    duration: '0.5s',
    easing: 'ease-in-out',
    touchDuration: '40s'
  }
};

class PerspectiveController {
  #pageWrapper = null;
  #depthWrapper = null;
  #glassVideo = null;
  #isMouseDevice = false;
  #isInitialized = false;
  #animationFrameId = null;
  
  constructor() {
    this.#detectDeviceType();
  }
  
  /**
   * Initialize the controller by finding DOM elements and setting up appropriate handlers
   */
  init() {
    if (this.#isInitialized) return;
    
    // Find and cache required DOM elements
    this.#pageWrapper = document.querySelector('.page__inner');
    this.#depthWrapper = document.querySelector('.depth-wrapper');
    this.#glassVideo = document.querySelector('.glass-video');
    
    if (!this.#pageWrapper || !this.#depthWrapper) {
      console.error('Required DOM elements not found for perspective control');
      return;
    }
    
    // Initialize based on device type
    if (this.#isMouseDevice) {
      this.#setupMouseControl();
    } else {
      this.#setupTouchAnimation();
    }
    
    this.#isInitialized = true;
    console.log(`Perspective controller initialized in ${this.#isMouseDevice ? 'mouse' : 'touch'} mode`);
    
    // Handle resize events
    window.addEventListener('resize', this.#handleResize.bind(this), { passive: true });
  }
  
  /**
   * Detect if user is on a mouse device or touch device
   */
  #detectDeviceType() {
    this.#isMouseDevice = 
      window.matchMedia('(pointer: fine)').matches && 
      !('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }
  
  /**
   * Apply CSS animations for touch devices
   */
  #setupTouchAnimation() {
    this.#clearStyles();
    
    // Apply CSS animations from the stylesheet
    this.#pageWrapper.style.animation = `pageWrapper-naturalMovement ${perspectiveConfig.animation.touchDuration} infinite`;
    
    // Apply perspective value only for top wrapper
    this.#depthWrapper.style.perspective = `${perspectiveConfig.perspectiveDepth}px`;
    
    this.#depthWrapper.style.animation = `depthWrapper-naturalMovement ${perspectiveConfig.animation.touchDuration} infinite`;
    
    // Apply transitions
    const transition = `all ${perspectiveConfig.animation.duration} ${perspectiveConfig.animation.easing}`;
    this.#pageWrapper.style.transition = transition;
    this.#depthWrapper.style.transition = transition;
  }
  
  /**
   * Set up mouse-controlled movement
   */
  #setupMouseControl() {
    this.#clearStyles();
    this.#startMouseControlLoop();
  }
  
  /**
   * Clear all animation styles
   */
  #clearStyles() {
    this.#pageWrapper.style.animation = 'none';
    this.#depthWrapper.style.animation = 'none';
  }
  
  /**
   * Animation loop for mouse-controlled movement
   */
  #startMouseControlLoop() {
    // State for smooth interpolation: add separate 'depth' state for depth-wrapper rotation
    const state = {
      page: { rotateX: 0, rotateY: 0, scale: 1 },
      depth: { rotateX: 0, rotateY: 0 },
      video: { translateX: 0, translateY: 0, rotateX: 0, rotateY: 0 }
    };
    
    let lastTimestamp = 0;
    
    const animationStep = (timestamp) => {
      const deltaTime = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 16.67, 2) : 1;
      lastTimestamp = timestamp;
      
      const mouseXNormalized = (cursorXPercent - 0.5) * 2;
      const mouseYNormalized = (cursorYPercent - 0.5) * 2;
      
      // Calculate target values for page rotation using pageRotation config
      const targetPageRotateX = mouseYNormalized * perspectiveConfig.pageRotation.maxTiltX;
      const targetPageRotateY = -mouseXNormalized * perspectiveConfig.pageRotation.maxTiltY;
      const targetScale = 1 + (-Math.abs(mouseXNormalized) - Math.abs(mouseYNormalized) + 1) * (perspectiveConfig.scaleRange / 2);
      
      // Calculate target values for depth-wrapper rotation using depthRotation config
      const targetDepthRotateX = mouseYNormalized * perspectiveConfig.depthRotation.maxTiltX;
      const targetDepthRotateY = -mouseXNormalized * perspectiveConfig.depthRotation.maxTiltY;
      
      // Video movement/rotation remain unchanged
      const videoInversionFactor = perspectiveConfig.video.inverted ? -1 : 1;
      const targetVideoTranslateX = mouseXNormalized * perspectiveConfig.video.translateX * videoInversionFactor;
      const targetVideoTranslateY = mouseYNormalized * perspectiveConfig.video.translateY * videoInversionFactor;
      const targetVideoRotateX = -mouseYNormalized * perspectiveConfig.video.maxRotationX;
      const targetVideoRotateY = -mouseXNormalized * perspectiveConfig.video.maxRotationY;
      
      const smoothFactor = perspectiveConfig.smoothFactor * deltaTime;
      
      // Interpolate page state
      this.#smoothInterpolate(state.page, 'rotateX', targetPageRotateX, smoothFactor);
      this.#smoothInterpolate(state.page, 'rotateY', targetPageRotateY, smoothFactor);
      this.#smoothInterpolate(state.page, 'scale', targetScale, smoothFactor);
      
      // Interpolate depth-wrapper state
      this.#smoothInterpolate(state.depth, 'rotateX', targetDepthRotateX, smoothFactor);
      this.#smoothInterpolate(state.depth, 'rotateY', targetDepthRotateY, smoothFactor);
      
      // Interpolate video state
      this.#smoothInterpolate(state.video, 'translateX', targetVideoTranslateX, smoothFactor);
      this.#smoothInterpolate(state.video, 'translateY', targetVideoTranslateY, smoothFactor);
      this.#smoothInterpolate(state.video, 'rotateX', targetVideoRotateX, smoothFactor);
      this.#smoothInterpolate(state.video, 'rotateY', targetVideoRotateY, smoothFactor);
      
      // Apply transformations
      this.#applyPageTransforms(state.page);
      this.#applyVideoTransforms(state.video);
      this.#applyDepthWrapperTransforms(state.depth);
      
      this.#animationFrameId = requestAnimationFrame(animationStep);
    };
    
    this.#animationFrameId = requestAnimationFrame(animationStep);
  }
  
  /**
   * Smoothly interpolate a value
   */
  #smoothInterpolate(obj, key, targetValue, smoothFactor) {
    if (obj[key] === undefined) obj[key] = 0;
    obj[key] += smoothFactor * (targetValue - obj[key]);
  }
  
  /**
   * Apply transforms to page wrapper
   */
  #applyPageTransforms({ rotateX, rotateY, scale }) {
    if (this.#pageWrapper) {
      this.#pageWrapper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
    }
  }
  
  /**
   * Apply transforms to video element
   */
  #applyVideoTransforms({ translateX, translateY, rotateX, rotateY }) {
    if (this.#glassVideo) {
      this.#glassVideo.style.transform = 
        `translate(${translateX}%, ${translateY}%) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  }
  
  /**
   * Apply perspective transforms to depth wrapper
   */
  #applyDepthWrapperTransforms({ rotateX, rotateY }) {
    if (this.#depthWrapper) {
      this.#depthWrapper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  }
  
  /**
   * Handle window resize events
   */
  #handleResize() {
    const wasMouseDevice = this.#isMouseDevice;
    this.#detectDeviceType();
    
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
    if (newConfig.baseOrigin) {
      perspectiveConfig.baseOrigin = {
        ...perspectiveConfig.baseOrigin,
        ...newConfig.baseOrigin
      };
      delete newConfig.baseOrigin;
    }
    
    if (newConfig.video) {
      perspectiveConfig.video = {
        ...perspectiveConfig.video,
        ...newConfig.video
      };
      delete newConfig.video;
    }
    
    // Shallow merge for everything else
    Object.assign(perspectiveConfig, newConfig);
    
    if (this.#isInitialized) {
      this.#isInitialized = false;
      this.init();
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
let perspectiveControllerInstance = null;

/**
 * Initialize the perspective controller
 * @returns {PerspectiveController} The controller instance
 */
export function initPerspectiveController() {
  if (!perspectiveControllerInstance) {
    perspectiveControllerInstance = new PerspectiveController();
    perspectiveControllerInstance.init();
  }
  return perspectiveControllerInstance;
}

export function initCursorEffects() {
  return initPerspectiveController();
}

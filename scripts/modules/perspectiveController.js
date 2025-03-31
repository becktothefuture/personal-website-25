/**
 * Perspective Controller Module
 * -----------------------------
 * Controls the 3D perspective movement of the page based on either:
 * 1. Mouse position (for devices with mouse/pointer)
 * 2. Automatic animations (for touch devices)
 * 
 * The module maintains the relationship between different wrapper elements
 * to create a cohesive 3D effect that responds to user input or animates
 * automatically on touch devices.
 * 
 * @requires ./cursorTracker.js
 */

import { cursorXPercent, cursorYPercent } from './cursorTracker.js';

// Configuration for perspective movement
export const perspectiveConfig = {
  // Max tilt parameters (degrees)
  maxTiltX: 0.8,
  maxTiltY: 0.4,
  
  // Max translation parameters (percentage)
  maxTranslateX: 1,
  maxTranslateY: 0.6,
  
  // Scale range for subtle zoom effect
  scaleRange: 0.01,
  
  // Perspective shift factors
  perspectiveShiftFactorX: -10,
  perspectiveShiftFactorY: -8,
  
  // Rotation multiplier for depth elements
  rotationMultiplier: 1.2,
  
  // Animation duration for touch devices
  touchAnimationDuration: '40s',
  
  // Transition settings
  transitionDuration: '0.5s',
  transitionEasing: 'ease-in-out'
};

class PerspectiveController {
  #pageWrapper = null;
  #depthWrapper = null;
  #depthWrapperBottom = null;
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
    
    // Find required DOM elements
    this.#pageWrapper = document.querySelector('.page');
    this.#depthWrapper = document.querySelector('.depth-wrapper');
    this.#depthWrapperBottom = document.querySelector('.depth-wrapper-bottom');
    
    if (!this.#pageWrapper || !this.#depthWrapper || !this.#depthWrapperBottom) {
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
    // Check for fine pointer support (mouse) and absence of touch capability
    this.#isMouseDevice = 
      window.matchMedia('(pointer: fine)').matches && 
      !('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }
  
  /**
   * Apply CSS animations for touch devices
   */
  #setupTouchAnimation() {
    // Remove any inline styles that might interfere
    this.#clearStyles();
    
    // Apply CSS animations from the stylesheet
    this.#pageWrapper.style.animation = `pageWrapper-naturalMovement ${perspectiveConfig.touchAnimationDuration} infinite`;
    this.#depthWrapper.style.animation = `depthWrapper-naturalMovement ${perspectiveConfig.touchAnimationDuration} infinite`;
    this.#depthWrapperBottom.style.animation = `depthWrapperBottom-naturalMovement ${perspectiveConfig.touchAnimationDuration} infinite`;
    
    // Apply transitions
    const transition = `all ${perspectiveConfig.transitionDuration} ${perspectiveConfig.transitionEasing}`;
    this.#pageWrapper.style.transition = transition;
    this.#depthWrapper.style.transition = transition;
    this.#depthWrapperBottom.style.transition = transition;
  }
  
  /**
   * Set up mouse-controlled movement
   */
  #setupMouseControl() {
    // Remove CSS animations
    this.#clearStyles();
    
    // Start the animation loop for mouse control
    this.#startMouseControlLoop();
  }
  
  /**
   * Clear all animation styles
   */
  #clearStyles() {
    if (!this.#pageWrapper || !this.#depthWrapper || !this.#depthWrapperBottom) return;
    
    this.#pageWrapper.style.animation = 'none';
    this.#depthWrapper.style.animation = 'none';
    this.#depthWrapperBottom.style.animation = 'none';
  }
  
  /**
   * Animation loop for mouse-controlled movement
   */
  #startMouseControlLoop() {
    const updateTransforms = () => {
      if (!this.#isInitialized || !this.#isMouseDevice) return;
      
      // Update transformations based on current mouse position
      this.#updateFromMousePosition(cursorXPercent, cursorYPercent);
      
      // Continue the loop
      this.#animationFrameId = requestAnimationFrame(updateTransforms);
    };
    
    // Start the loop
    updateTransforms();
  }
  
  /**
   * Update element transformations based on mouse position
   */
  #updateFromMousePosition(x, y) {
    // Convert mouse position (0-1) to a -1 to 1 range (centered at 0.5, 0.5)
    const mouseXNormalized = (x - 0.5) * 2; // -1 (left) to 1 (right)
    const mouseYNormalized = (y - 0.5) * 2; // -1 (top) to 1 (bottom)
    
    // Calculate page wrapper transform (invert to tilt away from mouse)
    const translateX = -mouseXNormalized * perspectiveConfig.maxTranslateX;
    const translateY = -mouseYNormalized * perspectiveConfig.maxTranslateY;
    const rotateX = -mouseYNormalized * perspectiveConfig.maxTiltX;
    const rotateY = mouseXNormalized * perspectiveConfig.maxTiltY;
    const scale = 1 + (-Math.abs(mouseXNormalized) - Math.abs(mouseYNormalized) + 1) * (perspectiveConfig.scaleRange / 2);
    
    // Apply transforms to page wrapper
    this.#pageWrapper.style.transform = `translateX(${translateX}%) translateY(${translateY}%) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
    
    // Calculate depth wrapper transforms
    const depthRotateX = rotateX * perspectiveConfig.rotationMultiplier / 3;
    const depthRotateY = rotateY * perspectiveConfig.rotationMultiplier / 3;
    
    // Calculate perspective origin shifts
    const perspectiveOriginX = 50 + (translateX * perspectiveConfig.perspectiveShiftFactorX);
    const perspectiveOriginY = 50 + (translateY * perspectiveConfig.perspectiveShiftFactorY);
    
    // Apply transforms to depth wrapper
    this.#depthWrapper.style.transform = `rotateX(${depthRotateX}deg) rotateY(${depthRotateY}deg)`;
    this.#depthWrapper.style.perspectiveOrigin = `${perspectiveOriginX}% ${perspectiveOriginY}%`;
    
    // Apply perspective origin to depth wrapper bottom
    this.#depthWrapperBottom.style.perspectiveOrigin = `${perspectiveOriginX}% calc(-500% + ${translateY * perspectiveConfig.perspectiveShiftFactorY}%)`;
  }
  
  /**
   * Handle window resize events
   */
  #handleResize() {
    // Re-detect device type in case of device mode change
    const wasMouseDevice = this.#isMouseDevice;
    this.#detectDeviceType();
    
    // If device type changed, reinitialize
    if (wasMouseDevice !== this.#isMouseDevice) {
      this.#isInitialized = false;
      
      if (this.#animationFrameId) {
        cancelAnimationFrame(this.#animationFrameId);
        this.#animationFrameId = null;
      }
      
      this.init();
    }
  }
  
  /**
   * Update configuration parameters
   */
  updateConfig(newConfig) {
    Object.assign(perspectiveConfig, newConfig);
    
    // Reinitialize to apply new settings
    if (this.#isInitialized) {
      this.#isInitialized = false;
      this.init();
    }
  }
  
  /**
   * Clean up and stop all animations
   */
  destroy() {
    if (this.#animationFrameId) {
      cancelAnimationFrame(this.#animationFrameId);
      this.#animationFrameId = null;
    }
    
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

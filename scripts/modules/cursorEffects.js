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
    rotateXRange: 2,  // -5% to 5% rotation on X axis
    rotateYRange: 2   // -5% to 5% rotation on Y axis
  },
  // Configuration for display element
  display: {
    rotateXRange: 3,  // -4% to 4% rotation on X axis
    rotateYRange: 3   // -4% to 4% rotation on Y axis
  },
  // Configuration for reflection element
  reflection: {
    translateXRange: 6,  // -10% to 10% translation on X axis
    translateYRange: 3,  // -10% to 10% translation on Y axis
    rotateXRange: -4,     // Synchronized with panel rotation
    rotateYRange: 2,     // Synchronized with panel rotation
    inverted: true        // Move in opposite direction
  },
  
  // Animation settings
  smoothFactor: 0.2,      // Lower values create smoother, slower transitions
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
  #display = null;
  #reflection = null;
  #isMouseDevice = false;
  #isInitialized = false;
  #animationFrameId = null;
  #lastUpdateTime = 0;
  #debugElement = null;
  #isDebugging = true; // Set to true to enable debug mode
  
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
    this.#display = document.getElementById('display');
    this.#reflection = document.getElementById('reflection');
    
    // Setup debugging if enabled
    if (this.#isDebugging) {
      this.#setupDebugMode();
    }
    
    // Check if elements exist
    const missingElements = [];
    if (!this.#panel) missingElements.push('#panel');
    if (!this.#display) missingElements.push('#display');
    if (!this.#reflection) missingElements.push('#reflection');
    
    if (missingElements.length > 0) {
      console.warn(`Elements not found for cursor effects: ${missingElements.join(', ')}`);
      // Continue anyway - some elements might be added dynamically later
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
      this.#display ? '#display' : 'display not found', 
      this.#reflection ? '#reflection' : 'reflection not found'
    );
  }
  
  /**
   * Setup debug mode with visual feedback
   */
  #setupDebugMode() {
    // Create debug element if it doesn't exist
    if (!this.#debugElement) {
      this.#debugElement = document.createElement('div');
      this.#debugElement.id = 'cursor-effects-debug';
      this.#debugElement.style.position = 'fixed';
      this.#debugElement.style.bottom = '10px';
      this.#debugElement.style.left = '10px';
      this.#debugElement.style.padding = '10px';
      this.#debugElement.style.background = 'rgba(0,0,0,0.7)';
      this.#debugElement.style.color = '#9ce0a9';
      this.#debugElement.style.fontFamily = 'monospace';
      this.#debugElement.style.fontSize = '12px';
      this.#debugElement.style.zIndex = '9999';
      this.#debugElement.style.maxWidth = '300px';
      this.#debugElement.style.maxHeight = '150px';
      this.#debugElement.style.overflow = 'auto';
      document.body.appendChild(this.#debugElement);
    }
    
    // Debug toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Debug';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.zIndex = '9999';
    toggleButton.addEventListener('click', () => {
      this.#debugElement.style.display = this.#debugElement.style.display === 'none' ? 'block' : 'none';
    });
    document.body.appendChild(toggleButton);
  }
  
  /**
   * Update debug information
   */
  #updateDebugInfo(data) {
    if (!this.#isDebugging || !this.#debugElement) return;
    
    this.#debugElement.innerHTML = `
      <strong>Cursor Effects Debug:</strong><br>
      Mode: ${this.#isMouseDevice ? 'Mouse' : 'Touch'}<br>
      Initialized: ${this.#isInitialized}<br>
      Panel: ${this.#panel ? 'Found' : 'Not Found'}<br>
      Display: ${this.#display ? 'Found' : 'Not Found'}<br>
      Reflection: ${this.#reflection ? 'Found' : 'Not Found'}<br>
      Cursor X: ${(cursorXPercent * 100).toFixed(2)}%<br>
      Cursor Y: ${(cursorYPercent * 100).toFixed(2)}%<br>
      ${data ? `<br><strong>Transforms:</strong><br>
      Panel: rotateX=${data.panel?.rotateX.toFixed(2)}deg, rotateY=${data.panel?.rotateY.toFixed(2)}deg<br>
      Display: rotateX=${data.display?.rotateX.toFixed(2)}deg, rotateY=${data.display?.rotateY.toFixed(2)}deg<br>
      Reflection: translateX=${data.reflection?.translateX.toFixed(2)}%, translateY=${data.reflection?.translateY.toFixed(2)}%, rotateX=${data.reflection?.rotateX.toFixed(2)}deg, rotateY=${data.reflection?.rotateY.toFixed(2)}deg` : ''}
    `;
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
    if (this.#display) this.#display.style.transition = transition;
    if (this.#reflection) this.#reflection.style.transition = transition;
    
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
    if (this.#display) this.#display.style.willChange = 'transform';
    if (this.#reflection) this.#reflection.style.willChange = 'transform';
    
    this.#startMouseControlLoop();
  }
  
  /**
   * Clear all animation styles
   */
  #clearStyles() {
    // Reset all styles on elements
    for (const element of [this.#panel, this.#display, this.#reflection]) {
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
      display: { rotateX: 0, rotateY: 0 },
      reflection: { translateX: 0, translateY: 0, rotateX: 0, rotateY: 0 }
    };
    
    let lastTimestamp = 0;
    
    const animationStep = (timestamp) => {
      // Calculate delta time with a cap to handle tab switches/sleeps
      const deltaTime = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 16.67, 2) : 1;
      lastTimestamp = timestamp;
      
      // Always update debug info for every frame to ensure responsive UI
      this.#updateDebugInfo(state);
      
      // Throttle updates for better performance
      // Only update every transformConfig.updateInterval ms
      if (timestamp - this.#lastUpdateTime < transformConfig.updateInterval) {
        this.#animationFrameId = requestAnimationFrame(animationStep);
        return;
      }
      
      this.#lastUpdateTime = timestamp;
      
      // Normalize mouse position to range -1 to 1
      const mouseXNormalized = (cursorXPercent - 0.5) * 2;
      const mouseYNormalized = (cursorYPercent - 0.5) * 2;
      
      // Calculate transform values
      
      // Panel rotation
      const targetPanelRotateX = mouseYNormalized * transformConfig.panel.rotateXRange;
      const targetPanelRotateY = -mouseXNormalized * transformConfig.panel.rotateYRange;
      
      // Display rotation (synced with panel but with different range)
      const targetDisplayRotateX = mouseYNormalized * transformConfig.display.rotateXRange;
      const targetDisplayRotateY = -mouseXNormalized * transformConfig.display.rotateYRange;
      
      // Reflection translation (opposite direction if inverted is true)
      const reflectionInversionFactor = transformConfig.reflection.inverted ? -1 : 1;
      const targetReflectionTranslateX = mouseXNormalized * transformConfig.reflection.translateXRange * reflectionInversionFactor;
      const targetReflectionTranslateY = mouseYNormalized * transformConfig.reflection.translateYRange * reflectionInversionFactor;
      
      // Reflection rotation (synchronized with panel rotation)
      const targetReflectionRotateX = targetPanelRotateX;
      const targetReflectionRotateY = targetPanelRotateY;
      
      // Calculate smooth interpolation factor
      const smoothFactor = transformConfig.smoothFactor * deltaTime;
      
      // Interpolate values for smooth transitions
      // Panel
      this.#smoothInterpolate(state.panel, 'rotateX', targetPanelRotateX, smoothFactor);
      this.#smoothInterpolate(state.panel, 'rotateY', targetPanelRotateY, smoothFactor);
      
      // Display
      this.#smoothInterpolate(state.display, 'rotateX', targetDisplayRotateX, smoothFactor);
      this.#smoothInterpolate(state.display, 'rotateY', targetDisplayRotateY, smoothFactor);
      
      // Reflection
      this.#smoothInterpolate(state.reflection, 'translateX', targetReflectionTranslateX, smoothFactor);
      this.#smoothInterpolate(state.reflection, 'translateY', targetReflectionTranslateY, smoothFactor);
      this.#smoothInterpolate(state.reflection, 'rotateX', targetReflectionRotateX, smoothFactor);
      this.#smoothInterpolate(state.reflection, 'rotateY', targetReflectionRotateY, smoothFactor);
      
      // Apply transformations to DOM elements
      this.#applyPanelTransforms(state.panel);
      this.#applyDisplayTransforms(state.display);
      this.#applyReflectionTransforms(state.reflection);
      
      // Log current transform values every second (not every frame to avoid console spam)
      if (Math.floor(timestamp / 1000) !== Math.floor(lastTimestamp / 1000)) {
        console.log('Current transforms:', {
          panel: { ...state.panel },
          display: { ...state.display },
          reflection: { ...state.reflection },
        });
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
    obj[key] += smoothFactor * (targetValue - obj[key]);
  }
  
  /**
   * Apply transforms to panel element
   */
  #applyPanelTransforms({ rotateX, rotateY }) {
    if (this.#panel) {
      this.#panel.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  }
  
  /**
   * Apply transforms to display element
   */
  #applyDisplayTransforms({ rotateX, rotateY }) {
    if (this.#display) {
      this.#display.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  }
  
  /**
   * Apply transforms to reflection element
   */
  #applyReflectionTransforms({ translateX, translateY, rotateX, rotateY }) {
    if (this.#reflection) {
      this.#reflection.style.transform = `translate(${translateX}%, ${translateY}%) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
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
        transformConfig[key] = {
          ...transformConfig[key],
          ...newConfig[key]
        };
      } else {
        transformConfig[key] = newConfig[key];
      }
    }
    
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

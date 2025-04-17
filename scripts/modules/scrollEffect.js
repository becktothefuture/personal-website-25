/**
 * scrollEffect Module
 * --------------------
 * Implements scroll-reactive systems:
 * 
 * 1. SCROLL PATTERN:
 *    - Animates pattern elements based on scroll acceleration
 *    - Creates seamless looping background patterns that respond to scrolling
 * 
 * 2. TURNSTYLE:
 *    - Rotates elements with .turnstyle class based on scroll acceleration
 *    - Creates rotation effects that respond to scrolling
 */

import { scrollTracker } from './scrollTracker.js';

// Consolidated configuration for all scroll effects
export const scrollEffectConfig = {
  // Rumble effect removed for performance
  pattern: {
    enabled: true,
    accelerationMultiplier: 10  // How strongly patterns respond to scroll acceleration
  },
  turnstyle: {
    enabled: true,
    rotationMultiplier: 5,     // Controls rotation intensity
    damping: 0.95             // Controls how quickly rotation slows down
  }
};

// For backwards compatibility
export const scrollConfig = scrollEffectConfig;

/**
 * Pattern Effect - uses patterns from scroll acceleration from scrollTracker
 * Based on implementation from scrollPattern.js
 */
// Array to hold the state for each pattern element
const patterns = [];

// Holds the current normalized acceleration value from the ScrollTracker
let currentAcceleration = 0;

class PatternEffect {
  constructor(config) {
    this.config = config;
    this.patterns = [];
    this.lastTimestamp = null;
  }
  
  init() {
    if (!this.config.enabled) return;
    
    // Select all wrappers with the .scroll-pattern-wrapper class
    const wrappers = document.querySelectorAll('.scroll-pattern-wrapper');
    
    if (wrappers.length === 0) {
      console.warn('No scroll pattern wrappers found in the document');
      return;
    }
    
    wrappers.forEach(wrapper => {
      // Get the first pattern element from each wrapper
      const pattern = wrapper.querySelector('.scroll-pattern');
      if (pattern) {
        // Set up the initial state for the pattern element
        this.patterns.push({
          wrapper,
          pattern,
          offset: 0 // initial offset in percentage
        });
        console.log('Pattern found and initialized for scrolling effect');
      } else {
        console.warn('Pattern element not found inside wrapper', wrapper);
      }
    });

    console.log(`Scroll pattern initialized with ${this.patterns.length} patterns`);
    
    // Start the animation loop using requestAnimationFrame
    if (this.patterns.length > 0) {
      requestAnimationFrame(this.animatePatterns.bind(this));
    }
  }
  
  update({ normalizedAcceleration, normalizedSpeed }) {
    // Use both acceleration and speed for smoother movement
    currentAcceleration = normalizedAcceleration * 0.7 + normalizedSpeed * 0.3;
  }
  
  animatePatterns(timestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = (timestamp - this.lastTimestamp) / 1000; // Convert milliseconds to seconds
    this.lastTimestamp = timestamp;
  
    // Debug logging for acceleration values
    if (this.patterns.length > 0 && currentAcceleration > 0.05) {
      console.log(`Current acceleration: ${currentAcceleration}`);
    }
  
    this.patterns.forEach(item => {
      // Increase the offset based on current acceleration.
      // Using modulo (%) ensures that once the offset reaches 50%, it wraps back to 0% to create a seamless loop.
      // INVERTED: Added negative sign to reverse direction
      item.offset = (item.offset - currentAcceleration * this.config.accelerationMultiplier * dt) % 50;
      if (item.offset < 0) {
        item.offset += 50;
      }
  
      // Apply GPU-accelerated transform to move the pattern rightwards (inverted direction)
      item.pattern.style.transform = `translate3d(-${item.offset}%, 0, 0)`;
    });
  
    // Continue the animation loop
    requestAnimationFrame(this.animatePatterns.bind(this));
  }
  
  destroy() {
    this.patterns.forEach(item => {
      if (item.pattern) {
        item.pattern.style.transform = '';
      }
    });
    this.patterns = [];
  }
}

/**
 * Turnstyle Effect - rotates elements with .turnstyle class based on scroll acceleration
 */
class TurnstyleEffect {
  constructor(config) {
    this.config = config || scrollEffectConfig.turnstyle;
    this.turnstyles = [];
    this.lastTimestamp = null;
    this.currentRotation = 0;
    this.targetRotation = 0;
  }
  
  init() {
    if (!this.config.enabled) return;
    
    // Select all elements with the .turnstyle class
    this.turnstyles = Array.from(document.querySelectorAll('.turnstyle'));
    
    if (this.turnstyles.length === 0) {
      console.warn('No turnstyle elements found in the document');
      return;
    }
    
    console.log(`Turnstyle effect initialized with ${this.turnstyles.length} elements`);
    
    // Start the animation loop using requestAnimationFrame
    if (this.turnstyles.length > 0) {
      requestAnimationFrame(this.animateTurnstyles.bind(this));
    }
  }
  
  update({ normalizedAcceleration, normalizedSpeed }) {
    // Use the same acceleration formula as the pattern effect for consistency
    this.targetRotation += (normalizedAcceleration * 0.7 + normalizedSpeed * 0.3) * this.config.rotationMultiplier;
  }
  
  animateTurnstyles(timestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = (timestamp - this.lastTimestamp) / 1000; // Convert milliseconds to seconds
    this.lastTimestamp = timestamp;
    
    // Smooth out the rotation for a more natural feel
    this.currentRotation = this.currentRotation * this.config.damping + 
                           this.targetRotation * (1 - this.config.damping);
    
    // Apply rotation to all turnstyle elements
    this.turnstyles.forEach(element => {
      element.style.transform = `rotate(${this.currentRotation}deg)`;
    });
    
    // Continue the animation loop
    requestAnimationFrame(this.animateTurnstyles.bind(this));
  }
  
  destroy() {
    this.turnstyles.forEach(element => {
      element.style.transform = '';
    });
    this.turnstyles = [];
  }
}

/**
 * Simplified ScrollEffectManager - subscribes to scrollTracker updates.
 */
class ScrollEffectManager {
  constructor() {
    // RumbleEffect removed
    this.patternEffect = new PatternEffect(scrollEffectConfig.pattern);
    this.turnstyleEffect = new TurnstyleEffect(scrollEffectConfig.turnstyle);
    
    console.log("ScrollEffectManager initialized with pattern and turnstyle effects");
  }
  
  init() {
    this.patternEffect.init();
    this.turnstyleEffect.init();
    // Subscribe to scroll updates
    scrollTracker.on("normalizedUpdate", (data) => {
      // RumbleEffect update removed
      this.patternEffect.update(data);
      this.turnstyleEffect.update(data);
    });
    console.log("ScrollEffectManager initialized - rumble removed for performance");
  }
  
  destroy() {
    // RumbleEffect destroy removed
    this.patternEffect.destroy();
    this.turnstyleEffect.destroy();
  }
}

// Singleton instance
let scrollEffectInstance = null;

export function initscrollEffect() {
  if (!scrollEffectInstance) {
    scrollEffectInstance = new ScrollEffectManager();
    scrollEffectInstance.init();
  }
  return scrollEffectInstance;
}

// For backward compatibility, export a stub for scrollPattern:
export const scrollPattern = {
  // This is just a stub to maintain compatibility
  // The actual functionality is now part of the ScrollEffectManager class
};

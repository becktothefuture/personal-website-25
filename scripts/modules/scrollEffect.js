/**
 * scrollEffect Module
 * --------------------
 * Implements two distinct scroll-reactive systems:
 * 
 * 1. SPEED SYSTEM (like car velocity):
 *    - Gradual build-up and slow decrease
 *    - Used for rumble/shake effects
 *    - Ramps up over time and decreases slowly
 * 
 * 2. SCROLL PATTERN:
 *    - Animates pattern elements based on scroll acceleration
 *    - Creates seamless looping background patterns that respond to scrolling
 */

import { scrollTracker } from './scrollTracker.js';

// Updated configuration for scroll effects (removed rubberBand)
export const scrollConfig = {
  rumble: {
    enabled: true,
    minIntensity: 0,       // Minimum rumble intensity
    maxIntensity: 10       // Maximum rumble intensity (px)
  },
  pattern: {
    enabled: true,
    accelerationFactor: 10  // How strongly patterns respond to scroll acceleration
  }
};

/**
 * Simplified RumbleEffect - uses normalized speed from scrollTracker
 */
class RumbleEffect {
  constructor(config) {
    this.config = config;
    this.intensity = 0;
    // Only target the element with id '#rumble-wrapper'
    this.element = document.querySelector('#rumble-wrapper'); // changed: removed fallback to document.documentElement
  }
  update({ normalizedAcceleration }) { // changed parameter from normalizedSpeed to normalizedAcceleration
    if (!this.config.enabled || !this.element) return; // added: ensure element exists
    // Compute intensity based directly on normalizedAcceleration
    this.intensity = normalizedAcceleration * (this.config.maxIntensity - this.config.minIntensity) + this.config.minIntensity;
    if (this.intensity >= 0.1) {
      const offsetX = (Math.random() - 0.5) * this.intensity;
      const offsetY = (Math.random() - 0.5) * this.intensity;
      this.element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    } else {
      this.element.style.transform = '';
    }
  }
  destroy() {
    this.element.style.transform = '';
  }
}

/**
 * Simplified PatternEffect - uses normalized acceleration from scrollTracker
 */
class PatternEffect {
  constructor(config) {
    this.config = config;
    this.patternWrappers = [];
  }
  
  init() {
    if (!this.config.enabled) return;
    // Find all wrappers containing the pattern element
    this.patternWrappers = Array.from(document.querySelectorAll('.scroll-pattern-wrapper'));
    this.patternWrappers.forEach(wrapper => {
      // Use the element with the pattern texture or fallback to first child
      let patternEl = wrapper.querySelector('.scroll-pattern-container') || wrapper.firstElementChild;
      if (!patternEl) {
        console.warn('PatternEffect: No pattern element found in wrapper');
        return;
      }
      
      patternEl.style.willChange = 'transform';
      
      // Calculate and store the actual width of the pattern element
      const computedStyle = window.getComputedStyle(patternEl);
      const patternWidth = parseFloat(computedStyle.width);
      
      // Create a clone for seamless looping if needed
      if (!wrapper.querySelector('.scroll-pattern-clone')) {
        const clone = patternEl.cloneNode(true);
        clone.classList.add('scroll-pattern-clone');
        clone.style.position = 'absolute';
        clone.style.left = '100%';
        clone.style.top = '0';
        wrapper.style.position = 'relative';
        wrapper.style.overflow = 'hidden';
        wrapper.appendChild(clone);
      }
      
      // Store pattern element, its width and current position
      wrapper._patternData = { 
        patternEl, 
        position: 0,
        width: patternWidth || 100 // Fallback to 100 if width calculation fails
      };
    });
  }
  
  update({ normalizedAcceleration }) {
    if (!this.config.enabled) return;
    // Clamp acceleration similar to lampEffect responsiveness
    const effectiveAccel = Math.min(normalizedAcceleration, 1);
    const movement = effectiveAccel * this.config.accelerationFactor;
    
    this.patternWrappers.forEach(wrapper => {
      const data = wrapper._patternData;
      if (!data) return;
      
      // Update position
      data.position -= movement;
      
      // Check if we need to reset position for seamless loop
      if (Math.abs(data.position) >= data.width) {
        // Reset position while maintaining the exact fractional part for smoothness
        data.position = data.position % data.width;
      }
      
      // Apply the transform
      data.patternEl.style.transform = `translateX(${data.position}px)`;
      
      // Also update clone if it exists
      const clone = wrapper.querySelector('.scroll-pattern-clone');
      if (clone) {
        clone.style.transform = `translateX(${data.position}px)`;
      }
    });
  }
  
  destroy() {
    this.patternWrappers.forEach(wrapper => {
      if (wrapper._patternData && wrapper._patternData.patternEl) {
        wrapper._patternData.patternEl.style.transform = '';
      }
      // Remove clones if they exist
      const clone = wrapper.querySelector('.scroll-pattern-clone');
      if (clone) {
        clone.remove();
      }
    });
  }
}

/**
 * Simplified ScrollEffectManager - subscribes to scrollTracker updates.
 */
class ScrollEffectManager {
  constructor() {
    this.rumbleEffect = new RumbleEffect(scrollConfig.rumble);
    this.patternEffect = new PatternEffect(scrollConfig.pattern);
  }
  init() {
    this.patternEffect.init();
    // Remove extra "scroll" subscription; use only normalizedUpdate for immediate responsiveness.
    scrollTracker.on("normalizedUpdate", (data) => {
      this.rumbleEffect.update(data);
      this.patternEffect.update(data);
    });
    console.log("ScrollEffectManager initialized");
  }
  destroy() {
    this.rumbleEffect.destroy();
    this.patternEffect.destroy();
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

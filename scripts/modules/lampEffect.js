/**
 * @module lampEffect
 * 
 * Creates a decorative lamp visual effect that responds to page scrolling.
 * Updates a CSS variable that controls lamp brightness based on scroll acceleration.
 * 
 * @requires ./scrollTracker.js
 * 
 * @example
 * // Import and initialize the lamp effect
 * import { initLampEffect } from './modules/lampEffect.js';
 * 
 * // Initialize
 * initLampEffect();
 */

import { scrollTracker } from './scrollTracker.js';
console.log('Lamp Effect module initialized');

/**
 * Configuration for the lamp effect
 */
export const lampConfig = {
  minBrightness: 0.0,
  maxBrightness: 2.0
};

class LampEffect {
  #isActive = false;
  #animationFrameId = null;
  
  constructor() {
    this.init();
  }
  
  init() {
    // Update brightness continuously using normalizedUpdate (acceleration decays over time)
    scrollTracker.on("normalizedUpdate", (data) => {
      const normalizedAccel = Math.min(data.normalizedAcceleration, 1);
      const brightness = lampConfig.minBrightness + 
        normalizedAccel * (lampConfig.maxBrightness - lampConfig.minBrightness);
        
      // Directly set the CSS variable without additional dampening
      document.documentElement.style.setProperty('--lamp-brightness', brightness);
    });
    
    this.#isActive = true;
    this.#startListening();
  }
  
  #startListening() {
    if (!this.#isActive) return;
    this.#animationFrameId = requestAnimationFrame(this.#startListening.bind(this));
  }
  
  destroy() {
    this.#isActive = false;
    if (this.#animationFrameId) {
      cancelAnimationFrame(this.#animationFrameId);
    }
    document.documentElement.style.removeProperty('--lamp-brightness');
  }
}

let lampEffectInstance = null;

/**
 * Initialize the lamp effect module
 */
function initLampEffect() {
  if (!lampEffectInstance) {
    lampEffectInstance = new LampEffect();
  }
  return lampEffectInstance;
}

export { initLampEffect };

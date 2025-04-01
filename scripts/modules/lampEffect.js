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
  fadeSpeed: 4,
  minBrightness: 0.0,
  maxBrightness: 2.0
};

class LampEffect {
  #currentBrightness = lampConfig.minBrightness;
  #targetBrightness = lampConfig.minBrightness;
  #isActive = false;
  #animationFrameId = null;
  
  constructor() {
    this.init();
  }
  
  init() {
    // Update brightness continuously using normalizedUpdate (acceleration decays over time)
    scrollTracker.on("normalizedUpdate", (data) => {
      const normalizedAccel = Math.min(data.normalizedAcceleration, 1);
      this.#targetBrightness = lampConfig.minBrightness +
        normalizedAccel * (lampConfig.maxBrightness - lampConfig.minBrightness);
    });
    
    this.#isActive = true;
    this.#animate();
  }
  
  #animate() {
    if (!this.#isActive) return;
    
    // Use a simple lerp to move currentBrightness toward targetBrightness.
    const diff = this.#targetBrightness - this.#currentBrightness;
    const lerpFactor = Math.min(lampConfig.fadeSpeed * 0.05, 1);
    this.#currentBrightness += diff * lerpFactor;
    
    // Update CSS variable for the lamp brightness
    document.documentElement.style.setProperty('--lamp-brightness', this.#currentBrightness);
    
    this.#animationFrameId = requestAnimationFrame(this.#animate.bind(this));
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

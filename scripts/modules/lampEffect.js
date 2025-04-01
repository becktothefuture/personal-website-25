/**
 * @module lampEffect
 * 
 * Creates a lamp visual effect that responds directly to scroll acceleration.
 * Updates a CSS variable that controls lamp brightness.
 * 
 * @requires ./scrollTracker.js
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
  constructor() {
    // Setup event listener for scroll updates
    scrollTracker.on("normalizedUpdate", (data) => {
      const normalizedAccel = Math.min(data.normalizedAcceleration, 1);

      const brightness = lampConfig.minBrightness + 
        normalizedAccel * (lampConfig.maxBrightness - lampConfig.minBrightness);
        
      // Directly set the CSS variable
      document.documentElement.style.setProperty('--lamp-brightness', brightness);
    });
  }
  
  destroy() {
    // Note: We're not removing event listeners here since ScrollTracker is a singleton
    // In a more complex app, you'd want to properly remove the listeners
    document.documentElement.style.removeProperty('--lamp-brightness');
  }
}

// Create and export singleton
const lampEffectInstance = new LampEffect();
export const initLampEffect = () => lampEffectInstance;

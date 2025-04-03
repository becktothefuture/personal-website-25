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

 // Configuration for the lamp effect

export const lampConfig = {
  minBrightness: 0.0,
  maxBrightness: 2.0
};

class LampEffect {
  constructor() {
    scrollTracker.on("normalizedUpdate", (data) => {
      const normalizedAccel = Math.min(data.normalizedAcceleration, 1);

      const brightness = lampConfig.minBrightness + 
        normalizedAccel * (lampConfig.maxBrightness - lampConfig.minBrightness);
        
      document.documentElement.style.setProperty('--lamp-brightness', brightness);
    });
  }
  destroy() {
    document.documentElement.style.removeProperty('--lamp-brightness');
  }
}

const lampEffectInstance = new LampEffect();
export const initLampEffect = () => lampEffectInstance;

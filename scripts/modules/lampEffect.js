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
  maxBrightness: 2.0,
  pulsateEnabled: true // Enable pulsating effect when idle
};

class LampEffect {
  constructor() {
    this.lampElement = document.getElementById('thruster-lamp');
    
    // Add pulsate class to the lamp element if found
    if (this.lampElement) {
      this.lampElement.classList.add('pulsate-element');
    }
    
    // Add pulsate class to all light elements
    const lightElements = document.querySelectorAll('#light, .light-element');
    lightElements.forEach(light => {
      light.classList.add('pulsate-element');
    });
    
    scrollTracker.on("normalizedUpdate", (data) => {
      const normalizedAccel = Math.min(data.normalizedAcceleration, 1);
      
      // When scrolling actively, temporarily disable pulsation effect
      if (normalizedAccel > 0.1) {
        // Disable pulsate during active scrolling for a smoother effect
        this.disablePulsate();
        
        const brightness = lampConfig.minBrightness + 
          normalizedAccel * (lampConfig.maxBrightness - lampConfig.minBrightness);
          
        document.documentElement.style.setProperty('--lamp-brightness', brightness);
      } else {
        // Re-enable pulsate when idle
        this.enablePulsate();
      }
    });
    
    // Set initial brightness
    document.documentElement.style.setProperty('--lamp-brightness', 
      lampConfig.pulsateEnabled ? 1 : lampConfig.minBrightness);
  }
  
  enablePulsate() {
    if (lampConfig.pulsateEnabled && this.lampElement) {
      this.lampElement.classList.add('pulsate-element');
    }
  }
  
  disablePulsate() {
    if (this.lampElement) {
      this.lampElement.classList.remove('pulsate-element');
    }
  }
  
  destroy() {
    document.documentElement.style.removeProperty('--lamp-brightness');
    if (this.lampElement) {
      this.lampElement.classList.remove('pulsate-element');
    }
  }
}

const lampEffectInstance = new LampEffect();
export const initLampEffect = () => lampEffectInstance;

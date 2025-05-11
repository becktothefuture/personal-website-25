/**
 * @module lampEffect
 * 
 * Creates a lamp visual effect with a constant pulsing animation.
 * Sets up CSS variables that control lamp brightness.
 */

console.log('Lamp Effect module initialized');

// Configuration for the lamp effect
export const lampConfig = {
  minBrightness: 0.0,
  maxBrightness: 2.0,
  pulsateEnabled: true // Enable pulsating effect
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
    
    // Set initial brightness
    document.documentElement.style.setProperty('--lamp-brightness', 
      lampConfig.pulsateEnabled ? 1 : lampConfig.minBrightness);
      
    // Enable pulsating effect immediately
    this.enablePulsate();
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
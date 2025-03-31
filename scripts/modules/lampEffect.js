/**
 * @module lampEffect
 * 
 * Creates a decorative lamp visual effect that responds to page scrolling.
 * The effect consists of a "bulb" element and a radial gradient overlay that
 * simulates light spreading from the source. The brightness of the lamp varies
 * based on scroll speed and impulse.
 * 
 * Usage:
 * 1. Import the module
 * 2. Call initLampEffect() to create and activate the lamp
 * 3. Use the returned instance to control the lamp (change position, color, etc.)
 * 
 * @requires ./scrollTracker.js
 * 
 * @example
 * // Import and initialize the lamp effect
 * import { initLampEffect, lampConfig } from './modules/lampEffect.js';
 * 
 * // Initialize with default settings
 * const lamp = initLampEffect();
 * 
 * // Optionally customize the lamp
 * lamp.setPosition('top-right');
 * lamp.setBrightness(0.8);
 * lamp.setColor(1, 0.9, 0.8); // Warm light
 */

import { scrollTracker } from './scrollTracker.js';
console.log('Lamp Effect module initialized');


/**
 * Configuration for the lamp effect
 */
export const lampConfig = {
  brightness: 1,         
  color: [.9, 1.0, .9],  
  fadeSpeed: 1,         
  minBrightness: 0.0,      
  maxBrightness: 1.0,     
  pulseOnScroll: true,     
  speedThreshold: 200,     
  exponentialFactor: 5,    
  lampSize: 13,             
  bulbSize: 20,             
  bulbColor: "#c6ffcd",     
  glowIntensity: 0.8,       
  glowSpread: 30,
  // Rubber band effect configuration
  rubberBandFactor: 0.7,    // How much the rubber band effect influences brightness
  rubberBandPulseScale: 2.0 // Scale factor for pulse intensity during rubber band
};

class LampEffect {
  #currentBrightness = lampConfig.minBrightness;
  #targetBrightness = lampConfig.minBrightness;
  #lampElement = null;
  #bulbElement = null;
  #isActive = false;
  #animationFrameId = null;
  #position = 'bottom-right';
  #rubberBandEffect = 0; // Track rubber band intensity
  
  constructor() {
    this.init();
  }
  
  /**
   * Initialize the lamp effect
   */
  init() {
    this.#createLampElements();
    
    // Speed-based brightness (gradual car-like effect)
    scrollTracker.on("update", (data) => {
      const normalizedVelocity = Math.min(data.velocityKMH / lampConfig.speedThreshold, 1);
      const expCurve = Math.pow(normalizedVelocity, lampConfig.exponentialFactor);
      this.#targetBrightness = lampConfig.minBrightness + 
        (expCurve * (lampConfig.maxBrightness - lampConfig.minBrightness));
    });
    
    // Impulse-based pulse (immediate response)
    scrollTracker.on("scroll", (data) => {
      if (lampConfig.pulseOnScroll) {
        const impulseStrength = Math.min(Math.abs(data.impulse) / 200, 1);
        this.pulse(impulseStrength);
      }
    });
    
    // Listen for rubber band effect updates (acceleration-based response)
    document.addEventListener('rubberband:update', (event) => {
      // Store current rubber band effect for brightness boost
      this.#rubberBandEffect = event.detail.normalizedOffset * lampConfig.rubberBandFactor;
      
      // Create immediate pulse for significant rubber band movements
      if (event.detail.normalizedOffset > 0.1) {
        const pulseIntensity = event.detail.normalizedOffset * lampConfig.rubberBandPulseScale;
        this.pulse(pulseIntensity);
      }
    });
    
    this.#isActive = true;
    this.#animate();
  }
  
  /**
   * Get the existing thruster-lamp element and apply basic styling
   */
  #createLampElements() {
    // Use existing thruster-lamp element (lowercase)
    this.#bulbElement = document.getElementById('thruster-lamp');
    
    if (!this.#bulbElement) {
      console.warn('Element with id "thruster-lamp" not found. Lamp effect may not work correctly.');
      return; // Don't create a new element, just return and let the effect be disabled
    }
    
    // Ensure the bulb element has the necessary styling
    const style = this.#bulbElement.style;
    // DO NOT change the position of the element - only enhance visibility and glow
    style.width = `${lampConfig.bulbSize}px`;
    style.height = `${lampConfig.bulbSize}px`;
    style.background = lampConfig.bulbColor;
    style.borderRadius = '50%';
    style.boxShadow = '0 0 15px 5px rgba(255, 253, 234, 0.9)';
    style.pointerEvents = 'none';
    style.zIndex = '99999'; // Very high z-index to ensure visibility
    style.transition = 'box-shadow 0.1s ease';
    
    // Set initial brightness to make it visible immediately
    this.#currentBrightness = 0.5;
    this.#updateLampStyle();
  }
  
  /**
   * Update the visual style of the thruster-lamp
   */
  #updateLampStyle() {
    if (!this.#bulbElement) return;
    
    const color = lampConfig.color;
    const brightness = this.#currentBrightness;
    
    // DO NOT modify position here - keep original position
    
    // Enhanced glow based on brightness
    const glowIntensity = brightness * lampConfig.glowIntensity * 1.5; // Increased intensity
    const bulbOpacity = 0.7 + (brightness * 0.3); // Higher base opacity
    
    // Apply enhanced glow effect to bulb
    this.#bulbElement.style.boxShadow = `
      0 0 ${5 + (glowIntensity * 8)}px ${3 + (glowIntensity * 4)}px rgba(255, 253, 234, ${0.8 * brightness}),
      0 0 ${10 + (glowIntensity * 15)}px ${5 + (glowIntensity * 8)}px rgba(${color[0]*255}, ${color[1]*255}, ${color[2]*255}, ${0.7 * brightness}),
      0 0 ${20 + (glowIntensity * 30)}px ${10 + (glowIntensity * 15)}px rgba(${color[0]*255}, ${color[1]*255}, ${color[2]*255}, ${0.5 * brightness})
    `;
    
    // Set opacity based on brightness with higher minimum
    this.#bulbElement.style.opacity = bulbOpacity.toString();
    
    // Apply animation at higher brightness
    if (brightness > 0.3) { // Lower threshold for animation
      this.#bulbElement.style.animation = 'bulb-pulse 2s infinite alternate';
      if (!document.getElementById('bulb-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'bulb-pulse-style';
        style.textContent = `
          @keyframes bulb-pulse {
            0% { transform: scale(1); filter: brightness(0.9); }
            100% { transform: scale(1.15); filter: brightness(1.2); }
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      this.#bulbElement.style.animation = 'none';
    }
  }
  
  /**
   * Get x,y coordinates based on position name
   */
  #getLampPosition() {
    switch (this.#position) {
      case 'top-left': return { x: 20, y: 20 };
      case 'top-right': return { x: 80, y: 20 };
      case 'bottom-left': return { x: 20, y: 80 };
      case 'bottom-right': return { x: 80, y: 80 };
      default: return { x: 50, y: 50 }; 
    }
  }
  
  /**
   * Animation loop to smoothly update lamp brightness
   */
  #animate() {
    if (!this.#isActive || !this.#bulbElement) return;
    
    // Combine standard target brightness with rubber band effect boost
    const effectiveBrightness = Math.min(
      this.#targetBrightness + this.#rubberBandEffect, 
      lampConfig.maxBrightness
    );
    
    const diff = effectiveBrightness - this.#currentBrightness;
    if (Math.abs(diff) > 0.001) {
      this.#currentBrightness += diff * lampConfig.fadeSpeed;
      this.#updateLampStyle();
    }
    
    this.#animationFrameId = requestAnimationFrame(this.#animate.bind(this));
  }
  
  /**
   * Create a quick pulse effect (e.g. on scroll)
   */
  pulse(intensity = 1.0) {
    if (!this.#bulbElement) return;
    
    const boostAmount = intensity * (lampConfig.maxBrightness - this.#targetBrightness);
    this.#currentBrightness = Math.min(this.#targetBrightness + boostAmount, lampConfig.maxBrightness);
    this.#updateLampStyle();
  }
  
  /**
   * Set lamp brightness directly
   */
  setBrightness(value) {
    this.#targetBrightness = Math.max(lampConfig.minBrightness, 
                              Math.min(value, lampConfig.maxBrightness));
  }
  
  /**
   * Set lamp color
   */
  setColor(r, g, b) {
    lampConfig.color = [
      Math.max(0, Math.min(r, 1)), 
      Math.max(0, Math.min(g, 1)),
      Math.max(0, Math.min(b, 1))
    ];
    this.#updateLampStyle();
  }
  
  /**
   * Set lamp position
   */
  setPosition(position) {
    if (['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(position)) {
      this.#position = position;
      this.#updateLampStyle();
    }
  }
  
  /**
   * Set lamp size
   */
  setSize(size) {
    lampConfig.lampSize = Math.max(20, Math.min(100, size));
    this.#updateLampStyle();
  }
  
  /**
   * Stop the lamp effect and clean up
   */
  destroy() {
    this.#isActive = false;
    
    if (this.#animationFrameId) {
      cancelAnimationFrame(this.#animationFrameId);
    }
    
    // Keep the thruster-lamp element since we didn't create it
    // but reset its styling
    if (this.#bulbElement) {
      this.#bulbElement.style.boxShadow = '';
      this.#bulbElement.style.opacity = '1';
      this.#bulbElement.style.animation = 'none';
    }
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

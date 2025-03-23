// lampEffect.js
import { scrollTracker } from './scrollTracker.js';

/**
 * Configuration for the lamp effect
 */
export const lampConfig = {
  brightness: 0.8,         // Default brightness between 0-1
  color: [1.0, 0.9, 0.7],  // Default warm light color [r,g,b]
  fadeSpeed: 0.05,         // How quickly the lamp reacts (0-1)
  minBrightness: 0.2,      // Minimal brightness when idle
  maxBrightness: 0.95,     // Maximum brightness on full intensity
  pulseOnScroll: true,     // Whether the lamp should pulse on scroll
  speedThreshold: 200,     // Speed threshold for maximum brightness (km/h)
  exponentialFactor: 3,    // How steep the brightness curve is
  lampSize: 60             // Size of the lamp (percentage of screen)
};

class LampEffect {
  #currentBrightness = lampConfig.minBrightness;
  #targetBrightness = lampConfig.minBrightness;
  #lampElement = null;
  #isActive = false;
  #animationFrameId = null;
  #position = 'bottom-right';
  
  constructor() {
    this.init();
  }
  
  /**
   * Initialize the lamp effect
   */
  init() {
    // Create lamp overlay if it doesn't exist
    this.#createLampElement();
    
    // Subscribe to scrollTracker events
    scrollTracker.on("update", (data) => {
      // Adjust lamp brightness based on velocity using exponential curve
      const normalizedVelocity = Math.min(data.velocityKMH / lampConfig.speedThreshold, 1);
      const expCurve = Math.pow(normalizedVelocity, lampConfig.exponentialFactor);
      this.#targetBrightness = lampConfig.minBrightness + 
        (expCurve * (lampConfig.maxBrightness - lampConfig.minBrightness));
    });
    
    // Listen for scroll events for immediate pulses
    scrollTracker.on("scroll", (data) => {
      if (lampConfig.pulseOnScroll) {
        // Create a quick pulse when scroll impulse is applied
        const impulseStrength = Math.min(Math.abs(data.impulse) / 200, 1);
        this.pulse(impulseStrength);
      }
    });
    
    // Start the animation
    this.#isActive = true;
    this.#animate();
  }
  
  /**
   * Create the lamp DOM element
   */
  #createLampElement() {
    // Only create if it doesn't already exist
    if (!document.getElementById('lamp-overlay')) {
      this.#lampElement = document.createElement('div');
      this.#lampElement.id = 'lamp-overlay';
      
      // Style the lamp element
      const style = this.#lampElement.style;
      style.position = 'fixed';
      style.top = '0';
      style.left = '0';
      style.width = '100%';
      style.height = '100%';
      style.pointerEvents = 'none'; // Don't intercept interactions
      style.zIndex = '999';
      
      // Set initial lamplight effect
      this.#updateLampStyle();
      
      // Add to DOM
      document.body.appendChild(this.#lampElement);
    } else {
      this.#lampElement = document.getElementById('lamp-overlay');
    }
    
    // Set initial position
    this.setPosition(this.#position);
  }
  
  /**
   * Update the visual style of the lamp
   */
  #updateLampStyle() {
    if (!this.#lampElement) return;
    
    const color = lampConfig.color;
    const brightness = this.#currentBrightness;
    const size = lampConfig.lampSize;
    
    // Get position coordinates based on selected position
    const position = this.#getLampPosition();
    
    // Create a radial gradient for lamp effect
    this.#lampElement.style.background = `radial-gradient(
      circle at ${position.x}% ${position.y}%, 
      rgba(${color[0]*255}, ${color[1]*255}, ${color[2]*255}, ${brightness * 0.7}), 
      rgba(${color[0]*255}, ${color[1]*255}, ${color[2]*255}, 0) ${size}%
    )`;
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
      default: return { x: 50, y: 50 }; // center as fallback
    }
  }
  
  /**
   * Animation loop to smoothly update lamp brightness
   */
  #animate() {
    if (!this.#isActive) return;
    
    // Smoothly transition brightness towards target
    const diff = this.#targetBrightness - this.#currentBrightness;
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
    // Temporarily boost brightness
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
      Math.max(0, Math.min(r, 1)), // Clamp to 0-1
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
    
    // Remove the element from DOM
    if (this.#lampElement && this.#lampElement.parentNode) {
      this.#lampElement.parentNode.removeChild(this.#lampElement);
    }
  }
}

// Singleton instance
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

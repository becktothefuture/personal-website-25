
import { scrollTracker } from './scrollTracker.js';

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
  glowSpread: 30            
};

class LampEffect {
  #currentBrightness = lampConfig.minBrightness;
  #targetBrightness = lampConfig.minBrightness;
  #lampElement = null;
  #bulbElement = null;
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
    
    this.#createLampElements();
    
    
    scrollTracker.on("update", (data) => {
      
      const normalizedVelocity = Math.min(data.velocityKMH / lampConfig.speedThreshold, 1);
      const expCurve = Math.pow(normalizedVelocity, lampConfig.exponentialFactor);
      this.#targetBrightness = lampConfig.minBrightness + 
        (expCurve * (lampConfig.maxBrightness - lampConfig.minBrightness));
    });
    
    
    scrollTracker.on("scroll", (data) => {
      if (lampConfig.pulseOnScroll) {
        
        const impulseStrength = Math.min(Math.abs(data.impulse) / 200, 1);
        this.pulse(impulseStrength);
      }
    });
    
    
    this.#isActive = true;
    this.#animate();
  }
  
  /**
   * Create the lamp DOM elements (overlay and bulb)
   */
  #createLampElements() {
    
    if (!document.getElementById('lamp-overlay')) {
      this.#lampElement = document.createElement('div');
      this.#lampElement.id = 'lamp-overlay';
      
      
      const style = this.#lampElement.style;
      style.position = 'fixed';
      style.top = '0';
      style.left = '0';
      style.width = '100%';
      style.height = '100%';
      style.pointerEvents = 'none';
      style.zIndex = '998';
      
      
      document.body.appendChild(this.#lampElement);
    } else {
      this.#lampElement = document.getElementById('lamp-overlay');
    }
    
    
    if (!document.getElementById('lamp-bulb')) {
      this.#bulbElement = document.createElement('div');
      this.#bulbElement.id = 'lamp-bulb';
      
      
      const style = this.#bulbElement.style;
      style.position = 'fixed';
      style.width = `${lampConfig.bulbSize}px`;
      style.height = `${lampConfig.bulbSize}px`;
      style.background = lampConfig.bulbColor;
      style.borderRadius = '50%';
      style.boxShadow = '0 0 10px 2px rgba(255, 253, 234, 0.7)';
      style.pointerEvents = 'none';
      style.zIndex = '999';
      style.transition = 'box-shadow 0.1s ease';
      
      
      this.#bulbElement.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60%; height: 60%; 
                   background: rgba(255, 255, 255, 0.9); border-radius: 50%;"></div>
      `;
      
      
      document.body.appendChild(this.#bulbElement);
    } else {
      this.#bulbElement = document.getElementById('lamp-bulb');
    }
    
    
    this.setPosition(this.#position);
  }
  
  /**
   * Update the visual style of the lamp
   */
  #updateLampStyle() {
    if (!this.#lampElement || !this.#bulbElement) return;
    
    const color = lampConfig.color;
    const brightness = this.#currentBrightness;
    const size = lampConfig.lampSize;
    const position = this.#getLampPosition();
    
    
    this.#bulbElement.style.left = `${position.x}%`;
    this.#bulbElement.style.top = `${position.y}%`;
    this.#bulbElement.style.transform = 'translate(-50%, -50%)';
    
    
    const glowIntensity = brightness * lampConfig.glowIntensity;
    const bulbOpacity = 0.4 + (brightness * 0.6); 
    
    
    this.#bulbElement.style.boxShadow = `
      0 0 ${2 + (glowIntensity * 5)}px ${1 + (glowIntensity * 2)}px rgba(255, 253, 234, ${0.6 * brightness}),
      0 0 ${5 + (glowIntensity * 10)}px ${2 + (glowIntensity * 5)}px rgba(${color[0]*255}, ${color[1]*255}, ${color[2]*255}, ${0.5 * brightness}),
      0 0 ${10 + (glowIntensity * 20)}px ${5 + (glowIntensity * 10)}px rgba(${color[0]*255}, ${color[1]*255}, ${color[2]*255}, ${0.3 * brightness})
    `;
    
    
    this.#bulbElement.style.opacity = bulbOpacity.toString();
    
    
    this.#lampElement.style.background = `radial-gradient(
      circle at ${position.x}% ${position.y}%, 
      rgba(${color[0]*255}, ${color[1]*255}, ${color[2]*255}, ${brightness * 0.4}), 
      rgba(${color[0]*255}, ${color[1]*255}, ${color[2]*255}, 0) ${size}%
    )`;
    
    
    if (brightness > 0.5) {
      this.#bulbElement.style.animation = 'bulb-pulse 2s infinite alternate';
      if (!document.getElementById('bulb-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'bulb-pulse-style';
        style.textContent = `
          @keyframes bulb-pulse {
            0% { transform: translate(-50%, -50%) scale(1); }
            100% { transform: translate(-50%, -50%) scale(1.05); }
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
    if (!this.#isActive) return;
    
    
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
    
    
    if (this.#lampElement && this.#lampElement.parentNode) {
      this.#lampElement.parentNode.removeChild(this.#lampElement);
    }
    
    if (this.#bulbElement && this.#bulbElement.parentNode) {
      this.#bulbElement.parentNode.removeChild(this.#bulbElement);
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

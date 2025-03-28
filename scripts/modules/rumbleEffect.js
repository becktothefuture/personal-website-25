/**
 * Rumble Effect Module
 * --------------------
 * Creates a physical rumbling/shaking effect based on scroll velocity.
 * 
 * This module:
 * - Applies physics-based motion to an element with id 'rumble-wrapper'
 * - Uses spring physics to create realistic oscillation and damping
 * - Scales effect intensity exponentially with scroll speed
 * 
 * Dependencies:
 * - scrollTracker.js - For monitoring scroll velocity
 */
console.log("Rumble Effect module initialized");


import { scrollTracker } from './scrollTracker.js';

/**
 * Simplified configuration for the rumble effect
 */
export const rumbleConfig = {
  speedThreshold: 10,     // Speed (km/h) below which NO rumble occurs
  rampUpRange: 300,        // Speed range (km/h) over which rumble exponentially increases
  springStiffness: 1900,  // SprinEnhance stiffness constant for oscillation
  dampingFactor: 0.95,    // Damping for more controlled motion
};

class RumbleEffect {
  #wrapperElement = null;
  #isActive = false;
  #animationFrameId = null;
  #state = {
    active: false,
    intensity: 0,         // 0-1 normalized intensity
    xPosition: 0,
    yPosition: 0,
    zPosition: 0,         // New z-axis position
    rotation: 0,
    lastUpdateTime: 0,
    lastVelocity: 0,
    velocitySmoothed: 0   // For smoother velocity transitions
  };
  
  constructor() {
    this.init();
  }
  
  /**
   * Initialize the rumble effect
   */
  init() {
    if (!this.#findWrapper()) {
      console.warn('Rumble effect: No element with ID "rumble-wrapper" found. Effect disabled.');
      return;
    }
    
    // Subscribe to scrollTracker updates for velocity-based rumble
    scrollTracker.on("update", (data) => {
      const speed = data.velocityKMH;
      
      // Apply smooth transition to velocity to prevent abrupt changes
      this.#state.velocitySmoothed += (speed - this.#state.velocitySmoothed) * 0.1;
      
      // Calculate intensity ONLY when above threshold
      if (this.#state.velocitySmoothed <= rumbleConfig.speedThreshold) {
        // Below threshold - no rumble at all
        this.#state.intensity = 0;
        this.#state.active = false;
      } else {
        // Above threshold - calculate exponential intensity increase
        const excessSpeed = this.#state.velocitySmoothed - rumbleConfig.speedThreshold;
        const normalizedExcess = Math.min(excessSpeed / rumbleConfig.rampUpRange, 1);
        
        // Use exponential curve for more dramatic increase with speed
        // This creates a curve that starts slow and then ramps up quickly
        this.#state.intensity = Math.pow(normalizedExcess, 1.8); // Exponential curve
        this.#state.active = true;
      }
      
      this.#state.lastVelocity = speed;
    });
    
    // Start the animation loop
    this.#isActive = true;
    this.#animate();
  }
  
  /**
   * Find the element that will be affected by rumble 
   * @returns {boolean} True if the wrapper element was found, false otherwise
   */
  #findWrapper() {
    // Find the element with id 'rumble-wrapper'
    const wrapper = document.getElementById('rumble-wrapper');
    
    if (!wrapper) {
      return false;
    }
    
    this.#wrapperElement = wrapper;
    return true;
  }
  
  /**
   * Physics-based animation that scales with speed
   */
  #animate(timestamp) {
    if (!this.#isActive || !this.#wrapperElement) {
      this.#animationFrameId = requestAnimationFrame(this.#animate.bind(this));
      return;
    }
    
    // Calculate time delta with safety cap
    const dt = this.#state.lastUpdateTime ? 
      Math.min((timestamp - this.#state.lastUpdateTime) / 1000, 0.05) : 0.016;
    this.#state.lastUpdateTime = timestamp;
    
    // Skip calculation entirely if intensity is very close to zero
    if (this.#state.intensity < 0.001) {
      // Only reset position if we're not already at zero
      if (this.#state.xPosition !== 0 || this.#state.yPosition !== 0 || this.#state.zPosition !== 0 || this.#state.rotation !== 0) {
        this.#state.xPosition = 0;
        this.#state.yPosition = 0;
        this.#state.zPosition = 0;
        this.#state.rotation = 0;
        this.#wrapperElement.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
      }
      this.#animationFrameId = requestAnimationFrame(this.#animate.bind(this));
      return;
    }
    
    // Calculate maximum displacement based on intensity (max 2vw for x/y, 5vw for z)
    const maxDisplacement = this.#state.intensity * 2;
    const maxZDisplacement = this.#state.intensity * 5; // Z can have larger movement range
    
    // Calculate maximum rotation based on intensity (max 1 degree)
    const maxRotation = this.#state.intensity;
    
    // Apply spring physics to positions with improved stability
    const applySpringPhysics = (currentPos) => {
      // Random noise force scaled by intensity
      const noiseForce = (Math.random() * 2 - 1) * this.#state.intensity * 2000;
      
      // Spring force: F = -k * x where k is spring constant
      const springForce = -rumbleConfig.springStiffness * currentPos;
      
      // Total force including noise
      const totalForce = springForce + noiseForce;
      
      // Calculate acceleration: a = F/m (we use mass=1 for simplicity)
      const acceleration = totalForce;
      
      // Integrate acceleration to get new position
      const newPos = currentPos + (acceleration * dt * dt);
      
      // Apply damping
      return newPos * Math.pow(rumbleConfig.dampingFactor, dt * 60);
    };
    
    // Update positions with improved spring physics
    this.#state.xPosition = applySpringPhysics(this.#state.xPosition);
    this.#state.yPosition = applySpringPhysics(this.#state.yPosition);
    this.#state.zPosition = applySpringPhysics(this.#state.zPosition);
    
    // Update rotation similarly but with tighter constraints
    this.#state.rotation = applySpringPhysics(this.#state.rotation) * 0.5; // Reduced rotation effect
    
    // Scale positions to respect max values
    const xScale = Math.min(Math.abs(this.#state.xPosition), maxDisplacement) * Math.sign(this.#state.xPosition);
    const yScale = Math.min(Math.abs(this.#state.yPosition), maxDisplacement) * Math.sign(this.#state.yPosition);
    const zScale = Math.min(Math.abs(this.#state.zPosition), maxZDisplacement) * Math.sign(this.#state.zPosition);
    const rotScale = Math.min(Math.abs(this.#state.rotation), maxRotation) * Math.sign(this.#state.rotation);
    
    // Apply transform to the wrapper with vw units for viewport-relative sizing
    this.#wrapperElement.style.transform = `
      translate3d(${xScale}vw, ${yScale}vw, ${zScale}vw)
      rotate(${rotScale}deg)
    `;
    
    this.#animationFrameId = requestAnimationFrame(this.#animate.bind(this));
  }
  
  /**
   * Get current state for debugging
   */
  getState() {
    return {
      active: this.#state.active,
      intensity: this.#state.intensity
    };
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.#isActive = false;
    
    if (this.#animationFrameId) {
      cancelAnimationFrame(this.#animationFrameId);
    }
  }
}

// Singleton instance
let rumbleEffectInstance = null;

/**
 * Initialize the rumble effect module
 */
export function initRumbleEffect() {
  if (!rumbleEffectInstance) {
    rumbleEffectInstance = new RumbleEffect();
  }
  return rumbleEffectInstance;
}

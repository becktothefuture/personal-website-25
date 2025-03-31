/**
 * scrollEffect Module
 * --------------------
 * Implements two distinct scroll-reactive systems:
 * 
 * 1. SPEED SYSTEM (like car velocity):
 *    - Gradual build-up and slow decrease
 *    - Used for rumble/shake and starfield effects
 *    - Ramps up over time and decreases slowly
 * 
 * 2. ACCELERATION SYSTEM (rubber band):
 *    - Immediate elastic response to scroll impulses
 *    - Used for wall movement, scroll patterns, and lamp thruster
 *    - Rapid response followed by spring-like return to default
 */

import { scrollTracker } from './scrollTracker.js';

// Configuration for scroll effects
export const scrollyConfig = {
  // Speed-based rumble effect configuration
  rumble: {
    enabled: true,
    minIntensity: 0,       // Minimum rumble intensity
    maxIntensity: 10,      // Maximum rumble intensity (px)
    speedThreshold: 10,    // Speed (km/h) below which NO rumble occurs
    rampRange: 300,        // Speed range over which rumble increases
    dampingFactor: 0.95    // How quickly rumble decreases (0-1)
  },
  
  // Acceleration-based rubber band effect configuration
  rubberBand: {
    enabled: true,
    minZTranslate: 700,     // Closest to camera position (px)
    defaultZTranslate: 1200, // Default wall depth (var(--wall-depth))
    elasticity: 0.82,       // Springiness (0-1, higher = more bouncy)
    responsiveness: 6.0,    // How strongly it reacts to impulses
    stiffness: 220.0,       // How quickly it returns to default (higher = stiffer)
    maxImpulse: 300         // Maximum impulse magnitude to prevent extreme movement
  }
};

class scrollEffect {
  constructor() {
    // System states
    this.rumbleState = {
      intensity: 0,
      lastUpdateTime: performance.now()
    };
    
    this.rubberBandState = {
      currentZOffset: 0,    // Current offset from default (negative = closer to camera)
      velocity: 0,          // Current velocity of the rubber band effect
      lastUpdateTime: performance.now()
    };
    
    // Element collections
    this.scrollyWrapperElement = null;
    this.wallElements = [];
    
    // Animation frame tracking
    this.initialized = false;
    this.animationFrameId = null;
    
    // Initialize the module
    this.init();
  }
  
  init() {
    console.log("Initializing scrollEffect module");
    
    // Find the scrolly wrapper for rumble effect
    this.scrollyWrapperElement = document.getElementById('scrolly-wrapper');
    if (!this.scrollyWrapperElement) {
      console.warn('scrollEffect: No element with ID "scrolly-wrapper" found. Rumble effect disabled.');
    }
    
    // Find all wall elements for rubber band effect
    this.wallElements = Array.from(document.querySelectorAll('.wall'));
    console.log(`scrollEffect: Found ${this.wallElements.length} wall elements`);
    
    // Set CSS variable for default wall depth if not already set
    document.documentElement.style.setProperty('--wall-depth', `${scrollyConfig.rubberBand.defaultZTranslate}px`);
    
    // Initialize wall elements with default transform
    this.wallElements.forEach(wall => {
      wall.style.transform = `translateZ(${scrollyConfig.rubberBand.defaultZTranslate}px)`;
      // Add GPU acceleration
      wall.style.willChange = 'transform';
    });
    
    // Listen for scroll velocity updates (for rumble effect)
    scrollTracker.on("update", (data) => {
      // Calculate rumble intensity based on velocity (car-like speed behavior)
      if (scrollyConfig.rumble.enabled) {
        const speedRatio = Math.max(0, (data.velocityKMH - scrollyConfig.rumble.speedThreshold) / 
                               scrollyConfig.rumble.rampRange);
        const targetIntensity = Math.min(1, speedRatio) * 
                              (scrollyConfig.rumble.maxIntensity - scrollyConfig.rumble.minIntensity) + 
                              scrollyConfig.rumble.minIntensity;
        this.rumbleState.intensity = targetIntensity;
      }
    });
    
    // Listen for scroll impulses (for rubber band effect)
    scrollTracker.on("scroll", (data) => {
      if (scrollyConfig.rubberBand.enabled) {
        // Apply clamped impulse to rubber band (immediate acceleration response)
        const clampedImpulse = Math.max(-scrollyConfig.rubberBand.maxImpulse, 
                                     Math.min(data.impulse, scrollyConfig.rubberBand.maxImpulse));
        this.applyRubberBandImpulse(clampedImpulse * scrollyConfig.rubberBand.responsiveness);
      }
    });
    
    this.initialized = true;
    this.startAnimation();
  }
  
  applyRubberBandImpulse(impulse) {
    // Negative impulse pushes elements toward camera (reduces Z value)
    this.rubberBandState.velocity -= impulse;
  }
  
  startAnimation() {
    const animate = (timestamp) => {
      try {
        const now = timestamp;
        
        // Calculate delta time for physics simulation with safety cap
        const deltaTime = Math.min((now - this.rubberBandState.lastUpdateTime) / 1000, 0.05);
        this.rubberBandState.lastUpdateTime = now;
        
        // ===== UPDATE RUBBER BAND PHYSICS (ACCELERATION SYSTEM) =====
        if (scrollyConfig.rubberBand.enabled) {
          // Update position based on velocity
          this.rubberBandState.currentZOffset += this.rubberBandState.velocity * deltaTime;
          
          // Calculate spring force pulling back to default position (F = -k * x)
          const springForce = -scrollyConfig.rubberBand.stiffness * this.rubberBandState.currentZOffset;
          
          // Apply spring force to velocity (F = ma, assume mass=1)
          this.rubberBandState.velocity += springForce * deltaTime;
          
          // Apply damping (elasticity) to velocity
          this.rubberBandState.velocity *= Math.pow(scrollyConfig.rubberBand.elasticity, deltaTime * 60);
          
          // Limit the maximum offset (prevents extreme movement)
          const maxOffset = scrollyConfig.rubberBand.defaultZTranslate - scrollyConfig.rubberBand.minZTranslate;
          this.rubberBandState.currentZOffset = Math.max(-maxOffset, Math.min(0, this.rubberBandState.currentZOffset));
          
          // Apply effect to wall elements
          this.applyRubberBandEffect();
          
          // Broadcast rubber band state for other modules (scroll patterns, lamp)
          this.broadcastRubberBandState();
        }
        
        // ===== UPDATE RUMBLE EFFECT (SPEED SYSTEM) =====
        if (scrollyConfig.rumble.enabled && this.rumbleState.intensity > 0.01 && this.scrollyWrapperElement) {
          this.applyRumbleEffect();
          
          // Gradually decrease rumble intensity for car-like deceleration
          this.rumbleState.intensity *= Math.pow(scrollyConfig.rumble.dampingFactor, deltaTime * 60);
        }
      } catch (error) {
        console.error('Error in scrolly effect animation:', error);
      }
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }
  
  // Apply rubber band effect to wall elements
  applyRubberBandEffect() {
    // Calculate current Z translate value
    const currentZTranslate = scrollyConfig.rubberBand.defaultZTranslate + this.rubberBandState.currentZOffset;
    
    // Apply to all wall elements
    this.wallElements.forEach(wall => {
      wall.style.transform = `translateZ(${currentZTranslate}px)`;
    });
  }
  
  // Broadcast rubber band state for other modules
  broadcastRubberBandState() {
    // Calculate normalized offset (0-1) representing current rubber band stretch
    const maxOffset = scrollyConfig.rubberBand.defaultZTranslate - scrollyConfig.rubberBand.minZTranslate;
    const normalizedOffset = Math.abs(this.rubberBandState.currentZOffset) / maxOffset;
    
    // Create and dispatch custom event
    document.dispatchEvent(new CustomEvent('rubberband:update', { 
      detail: {
        offset: this.rubberBandState.currentZOffset,
        normalizedOffset: normalizedOffset,
        velocity: this.rubberBandState.velocity,
        currentZ: scrollyConfig.rubberBand.defaultZTranslate + this.rubberBandState.currentZOffset
      }
    }));
  }
  
  // Apply rumble effect to scrolly wrapper
  applyRumbleEffect() {
    // Simple screen shake effect based on rumble intensity
    const intensity = this.rumbleState.intensity;
    if (intensity < 0.1) return; // Skip tiny movements
    
    // Create random offsets scaled by intensity
    const offsetX = (Math.random() - 0.5) * intensity;
    const offsetY = (Math.random() - 0.5) * intensity;
    
    // Apply to scrolly wrapper or root element
    if (this.scrollyWrapperElement) {
      this.scrollyWrapperElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    } else {
      document.documentElement.style.margin = `${offsetY}px ${offsetX}px`;
    }
  }
  
  // Clean up method
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Reset elements
    if (this.scrollyWrapperElement) {
      this.scrollyWrapperElement.style.transform = '';
    } else {
      document.documentElement.style.margin = '';
    }
    
    this.wallElements.forEach(wall => {
      wall.style.transform = '';
      wall.style.willChange = '';
    });
  }
}

// Singleton instance
let scrollEffectInstance = null;

/**
 * Initialize the scrolly effect module
 */
export function initscrollEffect() {
  if (!scrollEffectInstance) {
    scrollEffectInstance = new scrollEffect();
  }
  return scrollEffectInstance;
}

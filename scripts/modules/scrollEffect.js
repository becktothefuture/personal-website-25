/**
 * scrollEffect Module
 * --------------------
 * Implements three distinct scroll-reactive systems:
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
 * 
 * 3. SCROLL PATTERN:
 *    - Animates pattern elements based on scroll velocity and rubber band effects
 *    - Creates seamless looping background patterns that respond to scrolling
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
  },
  
  // Scroll pattern configuration
  pattern: {
    enabled: true,
    speedFactor: 3.0,       // Base speed factor for patterns
    rubberBandFactor: 200,  // How strongly patterns respond to rubber band effect
  }
};

/**
 * Base Effect class that all specific effects extend from
 */
class BaseEffect {
  constructor(config) {
    this.config = config;
    this.enabled = config.enabled;
    this.initialized = false;
  }
  
  init() {
    if (this.initialized) return;
    this.initialized = true;
  }
  
  update(deltaTime) {
    // Override in child classes
  }
  
  destroy() {
    this.initialized = false;
  }
}

/**
 * RumbleEffect - Handles screen shake based on scroll speed
 */
class RumbleEffect extends BaseEffect {
  constructor(config) {
    super(config);
    this.intensity = 0;
    this.element = null;
  }
  
  init() {
    if (this.initialized) return;
    
    // Find the scrolly wrapper for rumble effect
    this.element = document.getElementById('scrolly-wrapper');
    if (!this.element) {
      console.warn('RumbleEffect: No element with ID "scrolly-wrapper" found. Using document.documentElement as fallback.');
      this.element = document.documentElement;
    }
    
    super.init();
  }
  
  setIntensity(velocityKMH) {
    if (!this.enabled || !this.initialized) return;
    
    const speedRatio = Math.max(0, (velocityKMH - this.config.speedThreshold) / 
                         this.config.rampRange);
    this.intensity = Math.min(1, speedRatio) * 
                    (this.config.maxIntensity - this.config.minIntensity) + 
                    this.config.minIntensity;
  }
  
  update(deltaTime) {
    if (!this.enabled || !this.initialized || this.intensity < 0.1) return;
    
    // Apply rumble effect
    const intensity = this.intensity;
    const offsetX = (Math.random() - 0.5) * intensity;
    const offsetY = (Math.random() - 0.5) * intensity;
    
    // Safely apply transform
    if (this.element) {
      this.element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }
    
    // Gradually decrease intensity (car-like deceleration)
    this.intensity *= Math.pow(this.config.dampingFactor, deltaTime * 60);
  }
  
  destroy() {
    if (this.element) {
      this.element.style.transform = '';
    }
    super.destroy();
  }
}

/**
 * RubberBandEffect - Handles elastic wall movement based on scroll acceleration
 */
class RubberBandEffect extends BaseEffect {
  constructor(config) {
    super(config);
    this.currentZOffset = 0;
    this.velocity = 0;
    this.wallElements = [];
  }
  
  init() {
    if (this.initialized) return;
    
    // Find all wall elements
    this.wallElements = Array.from(document.querySelectorAll('.wall'));
    
    if (this.wallElements.length === 0) {
      console.warn('RubberBandEffect: No wall elements found.');
    } else {
      console.log(`RubberBandEffect: Found ${this.wallElements.length} wall elements`);
      
      // Set CSS variable for default wall depth
      document.documentElement.style.setProperty('--wall-depth', `${this.config.defaultZTranslate}px`);
      
      // Initialize wall elements with default transform and GPU acceleration
      this.wallElements.forEach(wall => {
        wall.style.transform = `translateZ(${this.config.defaultZTranslate}px)`;
        wall.style.willChange = 'transform';
      });
    }
    
    super.init();
  }
  
  applyImpulse(impulse) {
    if (!this.enabled || !this.initialized) return;
    
    // Apply clamped impulse (negative impulse pushes elements toward camera)
    const clampedImpulse = Math.max(-this.config.maxImpulse, 
                               Math.min(impulse, this.config.maxImpulse));
    this.velocity -= clampedImpulse * this.config.responsiveness;
  }
  
  update(deltaTime) {
    if (!this.enabled || !this.initialized || this.wallElements.length === 0) return;
    
    // Update position based on velocity
    this.currentZOffset += this.velocity * deltaTime;
    
    // Calculate spring force pulling back to default position (F = -k * x)
    const springForce = -this.config.stiffness * this.currentZOffset;
    
    // Apply spring force to velocity (F = ma, assume mass=1)
    this.velocity += springForce * deltaTime;
    
    // Apply damping (elasticity) to velocity
    this.velocity *= Math.pow(this.config.elasticity, deltaTime * 60);
    
    // Limit the maximum offset (prevents extreme movement)
    const maxOffset = this.config.defaultZTranslate - this.config.minZTranslate;
    this.currentZOffset = Math.max(-maxOffset, Math.min(0, this.currentZOffset));
    
    // Apply effect to wall elements
    this.applyToWalls();
    
    // Broadcast rubber band state for other modules
    this.broadcastState();
  }
  
  applyToWalls() {
    // Calculate current Z translate value
    const currentZTranslate = this.config.defaultZTranslate + this.currentZOffset;
    
    // Apply to all wall elements
    this.wallElements.forEach(wall => {
      wall.style.transform = `translateZ(${currentZTranslate}px)`;
    });
  }
  
  broadcastState() {
    // Calculate normalized offset (0-1) representing current rubber band stretch
    const maxOffset = this.config.defaultZTranslate - this.config.minZTranslate;
    const normalizedOffset = Math.abs(this.currentZOffset) / maxOffset;
    
    // Create and dispatch custom event
    document.dispatchEvent(new CustomEvent('rubberband:update', { 
      detail: {
        offset: this.currentZOffset,
        normalizedOffset: normalizedOffset,
        velocity: this.velocity,
        currentZ: this.config.defaultZTranslate + this.currentZOffset
      }
    }));
  }
  
  destroy() {
    this.wallElements.forEach(wall => {
      wall.style.transform = '';
      wall.style.willChange = '';
    });
    super.destroy();
  }
}

/**
 * PatternEffect - Handles scroll pattern animations
 */
class PatternEffect extends BaseEffect {
  constructor(config) {
    super(config);
    this.patternWrappers = [];
  }
  
  init() {
    if (this.initialized) return;
    
    this.initPatterns();
    super.init();
  }
  
  initPatterns() {
    if (!this.enabled) return;
    
    try {
      // Find all wrappers containing the pattern element
      this.patternWrappers = Array.from(document.querySelectorAll('.scroll-pattern-wrapper'));
      console.log(`PatternEffect: Found ${this.patternWrappers.length} scroll pattern wrappers`);
      
      this.patternWrappers.forEach(wrapper => {
        if (wrapper.dataset.initialized) return; // Skip if already initialized
        wrapper.dataset.initialized = 'true';
        wrapper.style.overflow = 'hidden';

        // Use the element with the pattern texture
        let patternEl = wrapper.querySelector('.scroll-pattern-container');
        if (!patternEl) {
          patternEl = wrapper.firstElementChild;
        }
        if (!patternEl) {
          console.warn('PatternEffect: No pattern element found in wrapper');
          return;
        }

        // Ensure GPU-accelerated transforms for smooth animation
        patternEl.style.willChange = 'transform';

        // Since the pattern element is 200% width,
        // half its width equals the wrapper's width (for a seamless loop)
        const initialWidth = patternEl.scrollWidth / 2;
        wrapper._patternData = { patternEl, initialWidth, position: 0 };
      });
    } catch (error) {
      console.error('Error during scroll pattern initialization:', error);
    }
  }
  
  update(deltaTime, velocity, normalizedRubberBandOffset) {
    if (!this.enabled || !this.initialized || this.patternWrappers.length === 0) return;
    
    // Update each wrapper's pattern element position
    this.patternWrappers.forEach(wrapper => {
      if (!wrapper._patternData) return;
      const data = wrapper._patternData;

      // Calculate movement combining:
      // 1. Base movement from constant velocity (car-like speed)
      const baseMovement = velocity * this.config.speedFactor * deltaTime;
      
      // 2. Rubber band movement from acceleration impulses
      const rubberBandMovement = normalizedRubberBandOffset * this.config.rubberBandFactor * deltaTime;
      
      // Combine movements (move left as values increase)
      const totalMovement = baseMovement + rubberBandMovement;
      data.position -= totalMovement;

      // When the movement reaches half the pattern width, reset position to 0
      if (data.position <= -data.initialWidth) {
        data.position = 0;
      }

      // Apply the transform using translateX for performance
      data.patternEl.style.transform = `translateX(${data.position}px)`;
    });
  }
  
  reinitialize() {
    // Clear existing pattern data
    this.patternWrappers.forEach(wrapper => {
      if (wrapper._patternData && wrapper._patternData.patternEl) {
        wrapper._patternData.patternEl.style.transform = '';
        wrapper._patternData.patternEl.style.willChange = '';
      }
      delete wrapper.dataset.initialized;
    });
    
    this.patternWrappers = [];
    this.initPatterns();
  }
  
  destroy() {
    this.patternWrappers.forEach(wrapper => {
      if (wrapper._patternData && wrapper._patternData.patternEl) {
        wrapper._patternData.patternEl.style.transform = '';
        wrapper._patternData.patternEl.style.willChange = '';
      }
    });
    super.destroy();
  }
}

/**
 * Main ScrollEffectManager class that coordinates all effects
 */
class ScrollEffectManager {
  constructor() {
    // Create effect instances
    this.rumbleEffect = new RumbleEffect(scrollyConfig.rumble);
    this.rubberBandEffect = new RubberBandEffect(scrollyConfig.rubberBand);
    this.patternEffect = new PatternEffect(scrollyConfig.pattern);
    
    // Animation frame tracking
    this.initialized = false;
    this.animationFrameId = null;
    this.lastUpdateTime = performance.now();
    
    // Initialize the manager
    this.init();
  }
  
  init() {
    console.log("Initializing ScrollEffectManager");
    
    // Initialize all effects
    this.rumbleEffect.init();
    this.rubberBandEffect.init();
    this.patternEffect.init();
    
    // Listen for scroll velocity updates (for rumble effect)
    scrollTracker.on("update", (data) => {
      if (this.rumbleEffect.enabled) {
        this.rumbleEffect.setIntensity(data.velocityKMH);
      }
    });
    
    // Listen for scroll impulses (for rubber band effect)
    scrollTracker.on("scroll", (data) => {
      if (this.rubberBandEffect.enabled) {
        this.rubberBandEffect.applyImpulse(data.impulse);
      }
    });
    
    // Listen for window resize to reinitialize pattern elements
    window.addEventListener('resize', this.handleResize.bind(this));
    
    this.initialized = true;
    this.startAnimation();
  }
  
  handleResize() {
    if (!this.initialized) return;
    
    // Use a debounce approach
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.patternEffect.reinitialize();
    }, 300);
  }
  
  startAnimation() {
    const animate = (timestamp) => {
      try {
        const now = timestamp;
        
        // Calculate delta time for physics simulation with safety cap
        const deltaTime = Math.min((now - this.lastUpdateTime) / 1000, 0.05);
        this.lastUpdateTime = now;
        
        // Update rubber band effect
        this.rubberBandEffect.update(deltaTime);
        
        // Get normalized rubber band offset for pattern effect
        const maxOffset = scrollyConfig.rubberBand.defaultZTranslate - scrollyConfig.rubberBand.minZTranslate;
        const normalizedOffset = Math.abs(this.rubberBandEffect.currentZOffset) / maxOffset;
        
        // Update pattern effect with velocity from scrollTracker
        let velocity = 0;
        try {
          velocity = scrollTracker.getState().velocityMS || 0;
        } catch (e) {
          console.warn('ScrollTracker error, using 0 velocity');
        }
        this.patternEffect.update(deltaTime, velocity, normalizedOffset);
        
        // Update rumble effect
        this.rumbleEffect.update(deltaTime);
      } catch (error) {
        console.error('Error in scroll effect animation:', error);
      }
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }
  
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Clean up all effects
    this.rumbleEffect.destroy();
    this.rubberBandEffect.destroy();
    this.patternEffect.destroy();
    
    this.initialized = false;
  }
}

// Singleton instance
let scrollEffectInstance = null;

/**
 * Initialize the scroll effect module
 */
export function initscrollEffect() {
  if (!scrollEffectInstance) {
    scrollEffectInstance = new ScrollEffectManager();
  }
  return scrollEffectInstance;
}

// Export the scroll pattern functionality as a separate variable for backward compatibility
export const scrollPattern = {
  // This is just a stub to maintain compatibility
  // The actual functionality is now part of the ScrollEffectManager class
};

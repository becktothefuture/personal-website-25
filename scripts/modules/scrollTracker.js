/**
 * @fileoverview Scroll Tracker Module - Tracks and normalizes scroll speed and acceleration
 * @module scrollTracker
 * @author Alexander Beck
 * 
 * A module that provides scroll tracking functionality by monitoring wheel events and 
 * calculating normalized speed and acceleration values. This creates a physics-based
 * scroll experience that can be consumed by other components.
 */

/**
 * Simple event emitter for implementing the observer pattern and enabling decoupled communication
 * @class
 */

/**
 * ScrollTracker class that extends EventEmitter to provide scroll metrics
 * @class
 * @extends EventEmitter
 * @fires ScrollTracker#scroll - Emitted on wheel events with normalized values
 * @fires ScrollTracker#normalizedUpdate - Emitted on each animation frame with updated values
 */

/**
 * Configuration parameters for scroll tracking behavior
 * @private
 * @type {Object}
 * @property {number} scrollScalingFactor - Controls scroll sensitivity (lower = more sensitive)
 * @property {number} speedDecayRate - Controls how quickly speed decays (higher = faster decay)
 * @property {number} accelerationDecayRate - Controls how quickly acceleration decays (higher = faster decay)
 */

/**
 * Internal state values normalized between 0 and 1
 * @private
 * @type {Object}
 * @property {number} speed - Current normalized speed value
 * @property {number} acceleration - Current normalized acceleration value
 */

/**
 * DOM elements for displaying metrics (for demo purposes)
 * @private
 * @type {Object}
 * @property {HTMLElement|null} speedDisplay - Element to display speed value
 * @property {HTMLElement|null} accelDisplay - Element to display acceleration value
 */

/**
 * Singleton instance of the ScrollTracker
 * @const {ScrollTracker}
 */
// Scroll Tracker Module


console.log('Scroll Tracker Module Initialized');


// Simple event emitter for decoupled communication
class EventEmitter {
  constructor() {
    this.listeners = {};
  }
  on(event, fn) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(fn);
  }
  emit(event, ...args) {
    if (this.listeners[event]) {
      for (const fn of this.listeners[event]) {
        fn(...args);
      }
    }
  }
}

// Streamlined ScrollTracker: tracks normalized speed and acceleration from scroll events.
class ScrollTracker extends EventEmitter {
  // Configuration parameters.
  #config = {
    scrollScalingFactor: 100,  // Lower value increases sensitivity
    speedDecayRate: 0.1,  // Higher value increases speed decay
    accelerationDecayRate: 6  // Higher value increases acceleration decay
  };

  // State values (normalized 0 to 1).
  #state = {
    speed: 0,
    acceleration: 0
  };

  // Demo page display elements.
  #speedDisplay = document.getElementById('speed-system');
  #accelDisplay = document.getElementById('acceleration-system');

  constructor() {
    super();
    this.init();
  }
  
  init() {
    window.addEventListener("wheel", this.onWheel.bind(this), { passive: false });
    requestAnimationFrame(this.update.bind(this));
  }
  
  onWheel(event) {
    event.preventDefault();
    const delta = event.deltaY;
    // Use raw impulse without capping and always positive
    const impulse = Math.abs(delta) / this.#config.scrollScalingFactor;
    
    // Both scroll directions create positive acceleration.
    this.#state.acceleration = impulse;
    this.emit("scroll", { normalizedAcceleration: this.#state.acceleration, normalizedSpeed: this.#state.speed });
  }
  
  update() {
    const dt = 0.016; // ~60fps
    // Integrate acceleration to update speed
    this.#state.speed += this.#state.acceleration * dt;
    // Ensure speed is never negative.
    this.#state.speed = Math.max(this.#state.speed, 0);
    // Apply friction decay to speed (simulate resistance)
    this.#state.speed *= (1 - dt * this.#config.speedDecayRate);
    // Exponential decay on acceleration
    this.#state.acceleration *= Math.exp(-this.#config.accelerationDecayRate * dt);
    
    // Update demo displays.
    if(this.#speedDisplay) this.#speedDisplay.textContent = `Speed: ${this.#state.speed.toFixed(2)}`;
    if(this.#accelDisplay) this.#accelDisplay.textContent = `Acceleration: ${this.#state.acceleration.toFixed(2)}`;
    
    // Emit update event.
    this.emit("normalizedUpdate", { normalizedSpeed: this.#state.speed, normalizedAcceleration: this.#state.acceleration });
    requestAnimationFrame(this.update.bind(this));
  }
  
  getNormalizedSpeed() {
    return this.#state.speed;
  }
  
  getNormalizedAcceleration() {
    return this.#state.acceleration;
  }
}

const scrollTracker = new ScrollTracker();
export { scrollTracker };
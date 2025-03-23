// scrollTracker.js

// Simple event emitter class for decoupled communication.
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

class ScrollTracker extends EventEmitter {
  // Private configuration and state variables.
  #config = {
    baseSpeed: 5,              // Constant base speed (km/h) always active.
    maxVelocity: 500,           // Maximum additional velocity (km/h) from strokes.a
    strokeImpulse: 1,          // km/h impulse added per wheel event.
    frictionCoefficient: .75,  // Per-second friction decay coefficient.
    scalingFactor: 100         // Scale factor for wheel delta.
  };
  #state = {
    velocity: 0,         // Extra velocity (km/h) accumulated.
    lastImpulse: 0,      // Most recent impulse value.
    lastUpdateTime: performance.now()
  };

  constructor() {
    super();
    this.init();
  }
  
  init() {
    // Listen for wheel events; use passive: false so we can prevent default scrolling.
    window.addEventListener("wheel", this.onWheel.bind(this), { passive: false });
    // Start the update loop.
    requestAnimationFrame(this.update.bind(this));
  }
  
  onWheel(event) {
    event.preventDefault();
    const delta = Math.abs(event.deltaY);
    const impulse = this.#config.strokeImpulse *
                    (1 + Math.min(delta / this.#config.scalingFactor, 1));
    // Add impulse to velocity, capping at maxVelocity.
    this.#state.velocity = Math.min(this.#state.velocity + impulse, this.#config.maxVelocity);
    this.#state.lastImpulse = impulse;
    // Emit an update event immediately.
    this.emit("update", { velocity: this.#state.velocity, impulse });
  }
  
  update() {
    const now = performance.now();
    const deltaTime = (now - this.#state.lastUpdateTime) / 1000; // seconds
    this.#state.lastUpdateTime = now;
    // Exponential decay to simulate friction.
    this.#state.velocity *= Math.exp(-this.#config.frictionCoefficient * deltaTime);
    // Emit update event each frame.
    this.emit("update", { velocity: this.#state.velocity, impulse: 0 });
    requestAnimationFrame(this.update.bind(this));
  }
  
  // Expose state for debugging (read-only).
  getState() {
    return { ...this.#state };
  }
  
  getConfig() {
    return { ...this.#config };
  }
}

const scrollTracker = new ScrollTracker();
export { scrollTracker };
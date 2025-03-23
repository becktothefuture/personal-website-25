// scrollTracker.js

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

/**
 * Realistic rowing boat model using impulses & v² drag:
 * - topSpeed stored in km/h; converted to m/s internally.
 * - impulseDamping: a factor that reduces stroke impulse effectiveness as velocity approaches top speed.
 * - strokeImpulse: the base momentum (N·s) added per strong upward scroll stroke.
 * - dragCoefficient: water drag factor for v² deceleration.
 */
class ScrollTracker extends EventEmitter {
  #config = {
    mass: 85,                // kg (boat + rower)
    dragCoefficient: 10.0,    // Increased from 0.50 to 2.0 for much faster deceleration
    strokeImpulse: 150,      // Increased from 100 to 250 for more immediate effect
    scalingFactor: 50,       // Reduced from 100 to 50 to make scrolling more responsive
    topSpeed: 300,           // km/h (max target speed)
    impulseDamping: 5        // damping factor for impulse near top speed
  };

  // Internal velocity in m/s.
  #state = {
    velocityMS: 0,
    lastImpulse: 0,
    lastUpdateTime: performance.now()
  };

  constructor() {
    super();
    this.init();
  }
  
  init() {
    window.addEventListener("wheel", this.onWheel.bind(this), { passive: false });
    requestAnimationFrame(this.update.bind(this));
  }

  /**
   * onWheel: upward scroll => add momentum, downward => record negative impulse for debug only.
   */
  onWheel(event) {
    event.preventDefault();
    const delta = event.deltaY;
    if (delta < 0) {
      const magnitude = Math.min(Math.abs(delta) / this.#config.scalingFactor, 1);
      let impulse = this.#config.strokeImpulse * (1 + magnitude * 1.5); // Increased multiplier for better response
      // Guard for negative or zero impulse
      if (impulse < 0) impulse = 10; // clamp to a minimum

      // Convert topSpeed from km/h to m/s
      const topSpeedMS = this.#config.topSpeed / 3.6;

      // Reverse exponential damping
      const effectiveImpulse = impulse * Math.exp(
        -this.#config.impulseDamping * (this.#state.velocityMS / topSpeedMS)
      );

      this.#state.velocityMS += effectiveImpulse / this.#config.mass;
      this.#state.lastImpulse = effectiveImpulse;
      
      // Emit a special "scroll" event for immediate lamp response
      this.emit("scroll", { impulse: effectiveImpulse, velocity: this.getVelocityKMH() });
    } else if (delta > 0) {
      // Downward scroll => negative impulse debug
      const magnitude = Math.min(Math.abs(delta) / this.#config.scalingFactor, 1);
      let negImpulse = -this.#config.strokeImpulse * (1 + magnitude);
      if (negImpulse > 0) negImpulse = -10; // clamp
      this.#state.lastImpulse = negImpulse;
    }
    this.emit("update", { velocityKMH: this.getVelocityKMH(), impulse: this.#state.lastImpulse });
  }
  
  /**
   * update: applies v² drag each frame and clamps velocity to >= 0
   */
  update() {
    const now = performance.now();
    let dt = (now - this.#state.lastUpdateTime) / 1000;
    if (dt > 0.05) dt = 0.05;
    this.#state.lastUpdateTime = now;

    // v² drag
    const v = this.#state.velocityMS;
    const dv = - (this.#config.dragCoefficient / this.#config.mass) * v * v * dt;
    this.#state.velocityMS += dv;
    if (this.#state.velocityMS < 0) this.#state.velocityMS = 0;

    this.emit("update", { velocityKMH: this.getVelocityKMH(), impulse: 0 });
    requestAnimationFrame(this.update.bind(this));
  }
  
  getVelocityKMH() {
    return this.#state.velocityMS * 3.6;
  }

  // Additional safe getters
  getState() {
    return {
      velocityMS: this.#state.velocityMS,
      velocityKMH: this.getVelocityKMH(),
      lastImpulse: this.#state.lastImpulse
    };
  }
  
  getConfig() {
    return { ...this.#config };
  }
  
  // Public setters with minimal clamping
  setMass(val) {
    if (val < 1) val = 1;
    this.#config.mass = val;
  }
  setDragCoefficient(val) {
    if (val < 0) val = 0;
    this.#config.dragCoefficient = val;
  }
  setStrokeImpulse(val) {
    if (val < 1) val = 1;
    this.#config.strokeImpulse = val;
  }
  setScalingFactor(val) {
    if (val < 1) val = 1;
    this.#config.scalingFactor = val;
  }
  setTopSpeed(valMS) {
    // valMS is m/s, convert to km/h
    let kmh = valMS * 3.6;
    if (kmh < 1) kmh = 1;
    this.#config.topSpeed = kmh;
  }
  setImpulseDamping(val) {
    if (val < 0) val = 0;
    this.#config.impulseDamping = val;
  }
}

const scrollTracker = new ScrollTracker();
export { scrollTracker };
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
 * Enhanced ScrollTracker with improved control over physics parameters:
 * - topSpeed: Maximum velocity in km/h, strictly enforced
 * - strokeImpulse: Base impulse added per scroll stroke
 * - scrollScalingFactor: How much scroll distance impacts impulse
 * - dragCoefficient: Friction/resistance factor
 * - impulseDamping: Reduces impulse effectiveness as velocity approaches topSpeed
 */
class ScrollTracker extends EventEmitter {
  #config = {
    mass: 30,                    // kg (boat + rower)
    dragCoefficient: 0.2,          // Increased drag
    strokeImpulse: 7,           // Reduced impulse strength
    scrollScalingFactor: 10,    // How scroll distance translates to impulse
    topSpeed: 400,               // km/h (absolute maximum)
    impulseDamping: 0.8,        // Increased damping
    velocityScaleFactor: 1     // Reduced velocity scale
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
   * Enhanced onWheel handler with better control over impulse scaling
   */
  onWheel(event) {
    event.preventDefault();
    const delta = event.deltaY;
    
    if (delta < 0) { // Upward scroll = forward momentum
      // Normalize the scroll distance impact
      const magnitude = Math.min(Math.abs(delta) / this.#config.scrollScalingFactor, 1);
      
      // Calculate base impulse with scroll magnitude factor
      let impulse = this.#config.strokeImpulse * (1 + magnitude * 1.5);
      
      // Safety check
      if (impulse <= 0) impulse = 10;

      // Calculate top speed in m/s
      const topSpeedMS = this.#config.topSpeed / 3.6;
      
      // Calculate velocity ratio (how close we are to top speed)
      const velocityRatio = this.#state.velocityMS / topSpeedMS;
      
      // Apply damping: exponential decrease in effectiveness as we approach top speed
      const dampingFactor = Math.exp(-this.#config.impulseDamping * velocityRatio);
      const effectiveImpulse = impulse * dampingFactor;
      
      // Apply impulse to velocity
      const newVelocity = this.#state.velocityMS + (effectiveImpulse / this.#config.mass);
      
      // Strictly enforce top speed limit
      this.#state.velocityMS = Math.min(newVelocity, topSpeedMS);
      this.#state.lastImpulse = effectiveImpulse;
      
      // Emit scroll event for lamp and other listeners
      this.emit("scroll", { impulse: effectiveImpulse, velocity: this.getVelocityKMH() });
    } else if (delta > 0) { // Downward scroll (for debug feedback only)
      const magnitude = Math.min(Math.abs(delta) / this.#config.scrollScalingFactor, 1);
      const negImpulse = -this.#config.strokeImpulse * (1 + magnitude);
      this.#state.lastImpulse = negImpulse;
    }
    
    this.emit("update", { velocityKMH: this.getVelocityKMH(), impulse: this.#state.lastImpulse });
  }
  
  /**
   * Enhanced update with improved physics and velocity scaling
   */
  update() {
    const now = performance.now();
    let dt = (now - this.#state.lastUpdateTime) / 1000;
    if (dt > 0.05) dt = 0.05; // Cap dt for stability
    this.#state.lastUpdateTime = now;

    // Apply quadratic drag (v²) - realistic fluid dynamics
    const v = this.#state.velocityMS;
    const dragForce = this.#config.dragCoefficient * v * v;
    const acceleration = -dragForce / this.#config.mass;
    
    // Apply acceleration to velocity
    let newVelocity = this.#state.velocityMS + (acceleration * dt);
    
    // Enforce minimum velocity of 0
    newVelocity = Math.max(0, newVelocity);
    
    // Apply global velocity scale factor for easy tuning
    this.#state.velocityMS = newVelocity * this.#config.velocityScaleFactor;

    // Emit update event
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
  
  // Enhanced setters with improved validation and comments
  
  /**
   * Set overall mass (affects acceleration)
   * Higher mass = slower acceleration but more momentum
   */
  setMass(val) {
    this.#config.mass = Math.max(1, val);
  }
  
  /**
   * Set drag coefficient (affects deceleration)
   * Higher values = faster stopping
   */
  setDragCoefficient(val) {
    this.#config.dragCoefficient = Math.max(0, val);
  }
  
  /**
   * Set base impulse strength from each scroll stroke
   * Higher values = stronger acceleration per scroll
   */
  setStrokeImpulse(val) {
    this.#config.strokeImpulse = Math.max(1, val);
  }
  
  /**
   * Set scroll scaling factor (how scroll distance impacts impulse)
   * Lower values = more sensitive to small scrolls
   */
  setScrollScalingFactor(val) {
    this.#config.scrollScalingFactor = Math.max(1, val);
  }
  
  /**
   * Set top speed limit in m/s 
   * Converted to km/h for storage
   */
  setTopSpeed(valMS) {
    let kmh = valMS * 3.6;
    kmh = Math.max(1, kmh);
    this.#config.topSpeed = kmh;
  }
  
  /**
   * Set impulse damping (reduces effectiveness near top speed)
   * Higher values = harder to reach top speed
   */
  setImpulseDamping(val) {
    this.#config.impulseDamping = Math.max(0, val);
  }
  
  /**
   * Set global velocity scale factor
   * Easy way to tune overall speed without changing other parameters
   */
  setVelocityScaleFactor(val) {
    this.#config.velocityScaleFactor = Math.max(0.1, Math.min(val, 5.0));
  }
}

const scrollTracker = new ScrollTracker();
export { scrollTracker };
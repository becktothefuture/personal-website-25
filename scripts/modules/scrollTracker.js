/**
 * Scroll Tracker Module
 * --------------------
 * Tracks scrolling behavior and velocity, emitting events for other components.
 * 
 * This module:
 * - Implements a physics-based model for scroll momentum and velocity
 * - Provides configurable parameters for mass, drag, impulse and damping
 * - Calculates scroll speed in m/s and km/h with realistic physics
 * - Includes an event system to notify other modules of scroll updates
 * - Applies quadratic drag for realistic deceleration
 * - Handles both upward (accelerate) and downward (brake) scroll inputs
 * - Enforces maximum velocity limits with smooth damping
 * - Rotates elements with class "turnstyle" based on scroll velocity
 */

// scrollTracker.js


console.log('Scroll Tracker Module Initialized');

// DOM elements for displaying tracking values
let scrollValueM, scrollValueMiles, scrollValuePx;

// Improved version with error handling
function initializeElements() {
  // Get references to the tracking display elements
  scrollValueM = document.getElementById('scroll-value-m');
  scrollValueMiles = document.getElementById('scroll-value-miles');
  scrollValuePx = document.getElementById('scroll-value-px');

  // Validate that all elements were found
  const allElementsFound = scrollValueM && scrollValueMiles && scrollValuePx;
  
  // Log warning if elements are missing
  if (!allElementsFound) {
    console.warn('ScrollTracker: Some display elements were not found in the DOM');
  }

  return allElementsFound;
}

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
    velocityScaleFactor: 1,     // Reduced velocity scale
    turnstyleRotationFactor: 1.0  // Multiplier for turnstyle rotation speed
  };

  // Internal velocity in m/s.
  #state = {
    velocityMS: 0,
    lastImpulse: 0,
    lastUpdateTime: performance.now(),
    totalDistance: 0
  };
  
  // Turnstyle elements tracking
  #turnstyleElements = [];
  #lastElementCheckTime = 0;
  #elementCheckInterval = 5000; // Check for new elements every 5 seconds

  constructor() {
    super();
    this.init();
  }
  
  init() {
    window.addEventListener("wheel", this.onWheel.bind(this), { passive: false });
    requestAnimationFrame(this.update.bind(this));
    initializeElements();
    this.findTurnstyleElements();
  }
  
  /**
   * Find all elements with class "turnstyle"
   */
  findTurnstyleElements() {
    this.#turnstyleElements = Array.from(document.querySelectorAll('.turnstyle'));
    console.log(`Found ${this.#turnstyleElements.length} turnstyle elements`);
  }
  
  /**
   * Check for new turnstyle elements periodically
   */
  checkForNewTurnstyleElements() {
    const now = performance.now();
    if (now - this.#lastElementCheckTime > this.#elementCheckInterval) {
      this.findTurnstyleElements();
      this.#lastElementCheckTime = now;
    }
  }
  
  /**
   * Apply rotation to turnstyle elements based on velocity
   */
  updateTurnstyleRotation() {
    if (this.#turnstyleElements.length === 0) return;

    // Calculate rotation increment based on velocity and rotation factor
    const rotationIncrement = this.#state.velocityMS * this.#config.turnstyleRotationFactor;

    // Apply rotation to each element
    this.#turnstyleElements.forEach(element => {
      // Get current rotation or default to 0 if not set
      const currentRotation = parseFloat(element.dataset.rotation || 0);
      
      // Calculate new rotation value
      const newRotation = currentRotation + rotationIncrement;
      
      // Store rotation value in dataset for next frame
      element.dataset.rotation = newRotation;
      
      // Apply rotation using CSS transform
      element.style.transform = `rotate(${newRotation}deg)`;
    });
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
    } else if (delta > 0) { // Downward scroll = deceleration
      const magnitude = Math.min(Math.abs(delta) / this.#config.scrollScalingFactor, 1);
      
      // Calculate negative impulse with magnitude scaling
      const brakeStrength = this.#config.strokeImpulse * 1.5; // Brake strength multiplier
      const negImpulse = -brakeStrength * (1 + magnitude);
      
      // Apply the negative impulse to decelerate
      this.#state.velocityMS = Math.max(0, this.#state.velocityMS + (negImpulse / this.#config.mass));
      this.#state.lastImpulse = negImpulse;
      
      // Emit scroll event for other modules to react
      this.emit("scroll", { impulse: negImpulse, velocity: this.getVelocityKMH() });
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

    // Update total distance traveled
    this.#state.totalDistance += this.#state.velocityMS * dt;
    
    // Update DOM displays
    this.updateDisplayValues();
    
    // Check for new turnstyle elements periodically
    this.checkForNewTurnstyleElements();
    
    // Update rotation for turnstyle elements
    this.updateTurnstyleRotation();

    // Emit update event
    this.emit("update", { velocityKMH: this.getVelocityKMH(), impulse: 0 });
    requestAnimationFrame(this.update.bind(this));
  }
  
  /**
   * Update DOM display values with current speed and distance
   */
  updateDisplayValues() {
    if (scrollValueM) scrollValueM.textContent = this.getVelocityKMH().toFixed(2);
    if (scrollValueMiles) scrollValueMiles.textContent = (this.getVelocityKMH() / 1.60934).toFixed(2); // km/h to mph
    if (scrollValuePx) scrollValuePx.textContent = this.#state.velocityMS.toFixed(1);
    
    // Additional distance displays can be implemented here if needed
    // e.g., document.getElementById('scroll-distance').textContent = this.getDistanceKM().toFixed(2);
  }
  
  getVelocityKMH() {
    return this.#state.velocityMS * 3.6;
  }

  /**
   * Get total distance traveled in kilometers
   */
  getDistanceKM() {
    return this.#state.totalDistance / 1000;
  }

  /**
   * Get total distance traveled in miles
   */
  getDistanceMiles() {
    return this.getDistanceKM() / 1.60934;
  }

  // Additional safe getters
  getState() {
    return {
      velocityMS: this.#state.velocityMS,
      velocityKMH: this.getVelocityKMH(),
      lastImpulse: this.#state.lastImpulse,
      totalDistance: this.#state.totalDistance
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
  
  /**
   * Set turnstyle rotation speed factor
   * Higher values = faster rotation for the same velocity
   */
  setTurnstyleRotationFactor(val) {
    this.#config.turnstyleRotationFactor = Math.max(0.1, Math.min(val, 10.0));
  }
}

const scrollTracker = new ScrollTracker();
export { scrollTracker };
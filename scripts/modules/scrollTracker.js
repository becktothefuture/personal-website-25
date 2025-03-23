// scrollTracker.js
const config = {
    baseSpeed: 5,              // Constant base speed (km/h) that is always active.
    maxVelocity: 50,           // Maximum additional velocity (km/h) from strokes.
    strokeImpulse: 3,          // Base impulse (km/h per stroke) added on each wheel event.
    frictionCoefficient: 0.5,  // Friction coefficient (per second) controlling decay.
  };
  
  const state = {
    velocity: 0,         // Additional velocity (km/h) added from strokes.
    lastImpulse: 0,      // Last applied impulse (km/h) for debugging.
    lastUpdateTime: performance.now(),
  };
  
  /**
   * Applies friction to the current velocity using an exponential decay model.
   */
  function updatePhysics() {
    const now = performance.now();
    const deltaTime = (now - state.lastUpdateTime) / 1000; // Time in seconds.
    state.lastUpdateTime = now;
    // Exponential decay: v = v * exp(-frictionCoefficient * deltaTime)
    state.velocity *= Math.exp(-config.frictionCoefficient * deltaTime);
  }
  
  /**
   * Wheel event handler that translates scroll movements into a rowing stroke impulse.
   */
  function onWheel(event) {
    event.preventDefault(); // Prevent default scrolling.
    const scalingFactor = 100; // Scale the wheel delta to a 0–1 range.
    // Calculate impulse: larger deltaY means a stronger stroke.
    const impulse = config.strokeImpulse * (1 + Math.min(Math.abs(event.deltaY) / scalingFactor, 1));
    // Add impulse to velocity, capping it at maxVelocity.
    state.velocity = Math.min(state.velocity + impulse, config.maxVelocity);
    state.lastImpulse = impulse;
  }
  
  /**
   * Main animation loop: updates physics and refreshes the debug overlay.
   */
  function animationLoop() {
    updatePhysics();
  
    // Update the debug overlay with current physics values.
    const overlay = document.getElementById("debug-overlay");
    if (overlay) {
      const totalSpeed = config.baseSpeed + state.velocity;
      overlay.innerHTML =
        `Base Speed: ${config.baseSpeed.toFixed(1)} km/h<br>` +
        `Additional Speed: ${state.velocity.toFixed(1)} km/h<br>` +
        `Total Speed: ${totalSpeed.toFixed(1)} km/h<br>` +
        `Last Impulse: ${state.lastImpulse.toFixed(1)} km/h`;
    }
  
    // Reset the last impulse (so it only shows instantaneous values).
    state.lastImpulse = 0;
    requestAnimationFrame(animationLoop);
  }
  
  /**
   * Initialise the scroll tracker: sets up the wheel event listener and starts the animation loop.
   */
  function initScrollTracker() {
    state.lastUpdateTime = performance.now();
    window.addEventListener("wheel", onWheel, { passive: false });
    requestAnimationFrame(animationLoop);
  }
  
  // Expose the scroll tracker globally for immediate access by other modules.
  window.scrollTracker = { config, state, init: initScrollTracker };
  
  // Export the init function for module systems.
  export { initScrollTracker };
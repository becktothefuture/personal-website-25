/**
 * Diffusion Text Animation Module - Optimized for performance
 */

class DiffusionTextAnimator {
  constructor(options) {
    // Core configuration
    this.texts = options.texts;
    this.animateInDuration = options.animateInDuration;
    this.legiblePauseDuration = options.legiblePauseDuration;
    this.animateOutDuration = options.animateOutDuration;
    this.frameInterval = options.frameInterval;
    this.letterPool = options.letterPool;
    this.container = options.container;
    
    // State machine setup - minimal properties
    this.STATES = { IN: 0, PAUSE: 1, OUT: 2 };
    this.currentState = this.STATES.IN;
    this.currentTextIndex = 0;
    this.currentText = this.texts[this.currentTextIndex];
    this.stepCount = 0;
    this.totalStepsIn = Math.ceil(this.animateInDuration / this.frameInterval);
    this.totalStepsOut = Math.ceil(this.animateOutDuration / this.frameInterval);
    this.inThresholds = this.computeThresholds(this.currentText, this.totalStepsIn, true);
    this.outThresholds = [];
    this.stateStartTime = 0;
    this.lastFrameTime = 0;
    
    // Pre-allocate output buffer to avoid GC
    this.outputBuffer = new Array(this.currentText.length);
    
    // Pre-generate random character cache
    this.randomCharsCache = new Array(200);
    this.refreshRandomCache();
    this.randomCharIndex = 0;
    
    // Bind update method once
    this.update = this.update.bind(this);
    this.isRunning = false;
  }
  
  // Fast random char getter using pre-cached values
  getCachedRandomChar() {
    const char = this.randomCharsCache[this.randomCharIndex];
    this.randomCharIndex = (this.randomCharIndex + 1) % this.randomCharsCache.length;
    return char;
  }
  
  // Compute thresholds for diffusion phases
  computeThresholds(text, totalSteps, isInPhase) {
    const length = text.length;
    const thresholds = new Array(length);
    const noiseRange = Math.floor(totalSteps * 0.3);
    const baseThreshold = Math.floor(totalSteps * 0.7);
    
    for (let i = 0; i < length; i++) {
      // Fast space check
      if (text[i] === ' ' || text[i] === '\n' || text[i] === '\t') {
        thresholds[i] = isInPhase ? 0 : totalSteps;
      } else {
        thresholds[i] = isInPhase ? 
          (Math.random() * noiseRange + baseThreshold) | 0 : // Bitwise OR with 0 for faster integer conversion
          (Math.random() * noiseRange + baseThreshold) | 0;
      }
    }
    return thresholds;
  }
  
  // Fill random character cache
  refreshRandomCache() {
    const poolLength = this.letterPool.length;
    for (let i = 0; i < this.randomCharsCache.length; i++) {
      this.randomCharsCache[i] = this.letterPool.charAt((Math.random() * poolLength) | 0);
    }
  }
  
  // Main animation frame handler
  update(timestamp) {
    if (!this.isRunning) return;
    
    // Enforce frame rate limit
    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    if (timestamp - this.lastFrameTime < this.frameInterval) {
      requestAnimationFrame(this.update);
      return;
    }
    this.lastFrameTime = timestamp;
    
    // State machine
    switch (this.currentState) {
      case this.STATES.IN:
        this.updateInState();
        if (++this.stepCount > this.totalStepsIn) {
          this.container.textContent = this.currentText;
          this.currentState = this.STATES.PAUSE;
          this.stateStartTime = timestamp;
          this.stepCount = 0;
        }
        break;
        
      case this.STATES.PAUSE:
        if (timestamp - this.stateStartTime >= this.legiblePauseDuration) {
          this.currentState = this.STATES.OUT;
          this.outThresholds = this.computeThresholds(this.currentText, this.totalStepsOut, false);
          this.stepCount = 0;
          this.refreshRandomCache();
        }
        break;
        
      case this.STATES.OUT:
        this.updateOutState();
        if (++this.stepCount > this.totalStepsOut) {
          this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
          this.currentText = this.texts[this.currentTextIndex];
          
          // Resize output buffer if needed
          if (this.outputBuffer.length < this.currentText.length) {
            this.outputBuffer = new Array(this.currentText.length);
          }
          
          this.inThresholds = this.computeThresholds(this.currentText, this.totalStepsIn, true);
          this.currentState = this.STATES.IN;
          this.stepCount = 0;
        }
        break;
    }
    
    requestAnimationFrame(this.update);
  }
  
  // Update diffusion-in state
  updateInState() {
    const text = this.currentText;
    const buffer = this.outputBuffer;
    const step = this.stepCount;
    const thresholds = this.inThresholds;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ' ' || char === '\n' || char === '\t') {
        buffer[i] = char;
      } else {
        buffer[i] = step >= thresholds[i] ? char : this.getCachedRandomChar();
      }
    }
    
    this.container.textContent = buffer.join('');
  }
  
  // Update diffusion-out state
  updateOutState() {
    const text = this.currentText;
    const buffer = this.outputBuffer;
    const step = this.stepCount;
    const thresholds = this.outThresholds;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ' ' || char === '\n' || char === '\t') {
        buffer[i] = char;
      } else {
        buffer[i] = step >= thresholds[i] ? this.getCachedRandomChar() : char;
      }
    }
    
    this.container.textContent = buffer.join('');
  }
  
  // Start animation
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      requestAnimationFrame(this.update);
    }
  }
  
  // Stop animation
  stop() {
    this.isRunning = false;
  }
}

/**
 * Initialize the diffusion text animator
 */
export function initDiffusionText() {
  // Find target element
  const container = document.getElementById('diffusion-text');
  if (!container) {
    console.warn("No element with ID 'diffusion-text' found. Diffusion text animation not initialized.");
    return null;
  }
  
  // Create and start the animator with default configuration
  const animator = new DiffusionTextAnimator({
    texts: [
      "communication designer (ba) at heart\n— hybrid UX/ UI / Dev",
      "travelling across disciplines \nto create things entirely new",
      "Reach out and let us build \na brighter digital tomorrow."
    ],
    animateInDuration: 1500,
    legiblePauseDuration: 2000,
    animateOutDuration: 1500,
    frameInterval: 200,
    letterPool: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()+-=[]{}|;:,.<>/*‚·°‡›‹¬∆ƒ∂πø¥†®∑ */?/~`",
    container: container
  });
  
  animator.start();
  return animator;
}

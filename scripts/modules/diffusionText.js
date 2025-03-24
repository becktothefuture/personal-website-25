
/**
 * @module diffusionText
 * @description Creates animated text transitions with a "diffusion" effect where characters
 * gradually transform between different phrases through random character substitution.
 * The animation cycles through three phases: diffusing in (random to text), pause (legible text),
 * and diffusing out (text to random).
 * 
 * @example
 * // HTML usage:
 * // <div class="diffusion-text" data-texts='["First text", "Second text"]' 
 * //   data-in-duration="1500" data-pause-duration="2000" data-out-duration="1500"></div>
 * 
 * // JavaScript:
 * import { initDiffusionText } from './modules/diffusionText.js';
 * 
 * // Initialize all diffusion text elements on the page
 * initDiffusionText();
 * 
 * @property {Object} DiffusionTextAnimator - Class that handles the animation logic
 * 
 * @throws {Error} Will log a warning if data-texts attribute cannot be parsed
 * 
 * @see Data attributes:
 *  - data-texts: JSON string array of texts to cycle through
 *  - data-in-duration: Duration in ms for the diffusion-in animation (default: 1500)
 *  - data-pause-duration: Duration in ms to show legible text (default: 2000)
 *  - data-out-duration: Duration in ms for the diffusion-out animation (default: 1500)
 *  - data-frame-interval: Interval in ms between animation frames (default: 200)
 *  - data-letter-pool: String of characters to use for random substitution
 */

console.log('Diffusion Text module intialized');

class DiffusionTextAnimator {
  constructor(options) {
    // Animation configuration
    this.texts = options.texts;
    this.animateInDuration = options.animateInDuration;
    this.legiblePauseDuration = options.legiblePauseDuration;
    this.animateOutDuration = options.animateOutDuration;
    this.frameInterval = options.frameInterval;
    this.letterPool = options.letterPool;
    this.container = options.container;
    
    // State machine setup
    this.STATES = { IN: "in", PAUSE: "pause", OUT: "out" };
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
    
    // Reusable output buffer to minimise GC
    this.outputBuffer = [];
    
    // Pre-generated random character cache
    this.randomCharsCache = Array.from({ length: 200 }, () => this.getRandomChar());
    this.randomCharIndex = 0;
    
    // Bind the update method so it can be used in requestAnimationFrame
    this.update = this.update.bind(this);
  }
  
  // Returns a random character from the letter pool.
  getRandomChar() {
    return this.letterPool.charAt(Math.floor(Math.random() * this.letterPool.length));
  }
  
  // Returns a random character from the pre-generated cache.
  getCachedRandomChar() {
    const char = this.randomCharsCache[this.randomCharIndex];
    this.randomCharIndex = (this.randomCharIndex + 1) % this.randomCharsCache.length;
    return char;
  }
  
  // Compute thresholds for diffusion phases.
  computeThresholds(text, totalSteps, isInPhase) {
    const thresholds = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/\S/.test(char)) {
        thresholds[i] = Math.floor(Math.random() * (totalSteps * 0.3)) + Math.floor(totalSteps * 0.7);
      } else {
        thresholds[i] = isInPhase ? 0 : totalSteps;
      }
    }
    return thresholds;
  }
  
  // Refresh the random character cache periodically.
  refreshRandomCache() {
    for (let i = 0; i < this.randomCharsCache.length; i++) {
      this.randomCharsCache[i] = this.getRandomChar();
    }
  }
  
  // Update method called on each frame.
  update(timestamp) {
    // Enforce fixed frame rate
    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    const elapsed = timestamp - this.lastFrameTime;
    if (elapsed < this.frameInterval) {
      requestAnimationFrame(this.update);
      return;
    }
    this.lastFrameTime = timestamp;
    
    // Process current state.
    switch (this.currentState) {
      case this.STATES.IN:
        this.updateInState();
        if (++this.stepCount > this.totalStepsIn) {
          // Transition to legible pause
          this.container.textContent = this.currentText;
          this.currentState = this.STATES.PAUSE;
          this.stateStartTime = timestamp;
          this.stepCount = 0;
        }
        break;
      case this.STATES.PAUSE:
        // Keep text static. Once pause duration elapses, transition.
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
          // Cycle to next text.
          this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
          this.currentText = this.texts[this.currentTextIndex];
          this.inThresholds = this.computeThresholds(this.currentText, this.totalStepsIn, true);
          this.currentState = this.STATES.IN;
          this.stepCount = 0;
        }
        break;
    }
    
    requestAnimationFrame(this.update);
  }
  
  // Update diffusion-in state.
  updateInState() {
    this.outputBuffer.length = 0; // Clear buffer
    for (let i = 0; i < this.currentText.length; i++) {
      const char = this.currentText[i];
      if (/\s/.test(char)) {
        this.outputBuffer.push(char);
      } else {
        // Show correct character if threshold reached, else random cached char.
        this.outputBuffer.push(this.stepCount >= this.inThresholds[i] ? char : this.getCachedRandomChar());
      }
    }
    this.container.textContent = this.outputBuffer.join('');
  }
  
  // Update diffusion-out state.
  updateOutState() {
    this.outputBuffer.length = 0; // Clear buffer
    for (let i = 0; i < this.currentText.length; i++) {
      const char = this.currentText[i];
      if (/\s/.test(char)) {
        this.outputBuffer.push(char);
      } else {
        // Before threshold, show correct char; after, show random cached char.
        this.outputBuffer.push(this.stepCount >= this.outThresholds[i] ? this.getCachedRandomChar() : char);
      }
    }
    this.container.textContent = this.outputBuffer.join('');
  }
  
  // Start the animation.
  start() {
    requestAnimationFrame(this.update);
  }
}

/**
 * Initialize diffusion text animations on elements with class 'diffusion-text'
 */
export function initDiffusionText() {
  const elements = document.querySelectorAll('.diffusion-text');
  if (elements.length === 0) return;
  
  elements.forEach(element => {
    // Try to get texts from data attribute or use defaults
    let texts = [];
    try {
      const dataTexts = element.dataset.texts;
      if (dataTexts) {
        texts = JSON.parse(dataTexts);
      }
    } catch (e) {
      console.warn('Error parsing diffusion text data-texts attribute:', e);
    }
    
    // Use default texts if none provided or parsing failed
    if (!texts.length) {
      texts = [
        "communication designer (ba) at heart\n— hybrid UX/ UI / Dev",
        "travelling across disciplines to create things entirely new",
        "Reach out and let us create a brighter digital tomorrow."
      ];
    }
    
    // Create a new animator for this element
    const animator = new DiffusionTextAnimator({
      texts,
      animateInDuration: parseInt(element.dataset.inDuration || '1500'),
      legiblePauseDuration: parseInt(element.dataset.pauseDuration || '2000'),
      animateOutDuration: parseInt(element.dataset.outDuration || '1500'),
      frameInterval: parseInt(element.dataset.frameInterval || '200'),
      letterPool: element.dataset.letterPool || 
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()+-=[]{}|;:,.<>/*‚·°‡›‹¬∆ƒ∂πø¥†®∑ */?/~`",
      container: element
    });
    
    animator.start();
  });

  console.log('Diffusion text animations initialized');
}

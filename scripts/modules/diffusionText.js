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
  // Find target elements
  const textContainer = document.getElementById('diffusion-text');
  const authorContainer = document.getElementById('diffusion-text-author');
  const skillsContainer = document.getElementById('diffusion-text-skills'); // New container for skills

  if (!textContainer) {
    console.warn("No element with ID 'diffusion-text' found. Diffusion text animation not initialized.");
    // return null; // Keep this commented or adjust if skills animation should run independently
  }

  // Quote collection with text and authors
  const quotes = [
    {
      text: "No great discovery was ever made without a bold guess.",
      author: "– Isaac Newton"
    },
    {
      text: "Simplicity is the ultimate sophistication.",
      author: "– Leonardo da Vinci"
    },
    {
      text: "Obsessions make my life worse and my work better.",
      author: "– Stefan Sagmeister"
    },
    {
      text: "Creativity is intelligence having fun.",
      author: "– Albert Einstein"
    },
    {
      text: "Inspiration exists, but it has to find you working.",
      author: "– Pablo Picasso"
    },
    {
      text: "Innovation is saying 'no' to a thousand things.",
      author: "– Steve Jobs"
    },
    {
      text: "Imagination is the bridge to everywhere.",
      author: "– Albert Einstein"
    },
    {
      text: "The details are not the details. They make the design.",
      author: "– Charles Eames"
    }
  ];

  // Extract quote texts for the main animator
  const quoteTexts = quotes.map(quote => quote.text);

  let textAnimator = null;
  if (textContainer) {
    textAnimator = new DiffusionTextAnimator({
      texts: quoteTexts,
      animateInDuration: 1500,
      legiblePauseDuration: 2000,
      animateOutDuration: 1500,
      frameInterval: 200, // Original frame interval for quotes
      letterPool: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()+-=[]{}|;:,.<>/*‚·°‡›‹¬∆ƒ∂πø¥†®∑ */?/~`",
      container: textContainer
    });
    textAnimator.start();
  }

  // If author container exists, create and start the author animator
  let authorAnimator = null;
  if (authorContainer && textAnimator) {
    const authorTexts = quotes.map(quote => quote.author);

    authorAnimator = new DiffusionTextAnimator({
      texts: authorTexts,
      animateInDuration: 1500,
      legiblePauseDuration: 2000,
      animateOutDuration: 1500,
      frameInterval: 200,
      letterPool: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()+-=[]{}|;:,.<>/*‚·°‡›‹¬∆ƒ∂πø¥†®∑ */?/~`",
      container: authorContainer
    });
    
    // Synchronize with the text animator's state changes
    const originalUpdateMethod = textAnimator.update;
    textAnimator.update = function(timestamp) {
      const prevState = textAnimator.currentState;
      const prevIndex = textAnimator.currentTextIndex;
      
      originalUpdateMethod.call(textAnimator, timestamp);
      
      // If text animator changes state or index, update author animator too
      if (prevState !== textAnimator.currentState || prevIndex !== textAnimator.currentTextIndex) {
        authorAnimator.currentState = textAnimator.currentState;
        authorAnimator.currentTextIndex = textAnimator.currentTextIndex;
        authorAnimator.stepCount = textAnimator.stepCount;
        authorAnimator.stateStartTime = textAnimator.stateStartTime;
      }
    };
    
    authorAnimator.start();
  }

  // --- New Skills Animator ---
  let skillsAnimator = null;
  if (skillsContainer) {
    const skillTexts = [
      "End-to-End Product Design (UX/UI/Code)",
      "Strategic Thinking & Digital Vision",
      "Front-End Development (HTML, CSS, JS, WebGL)",
      "AI-Enhanced Design Workflows",
      "Motion Design & Microinteraction Craft",
      "Design Systems & Component Libraries",
      "Typography & Visual Systems",
      "Creative Technology & Prototyping",
      "Team Leadership & Stakeholder Alignment",
      "Inventive Problem Solving"
    ];

    skillsAnimator = new DiffusionTextAnimator({
      texts: skillTexts,
      animateInDuration: 1000, // Faster
      legiblePauseDuration: 1000, // More frequent changes
      animateOutDuration: 1000, // Faster
      frameInterval: 100, // Smoother/faster animation steps
      letterPool: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()+-=[]{}|;:,.<>/*‚·°‡›‹¬∆ƒ∂πø¥†®∑ */?/~`",
      container: skillsContainer
    });
    skillsAnimator.start();
  } else {
    console.warn("No element with ID 'diffusion-text-skills' found. Skills diffusion text animation not initialized.");
  }

  return {
    textAnimator,
    authorAnimator,
    skillsAnimator // Return the new animator as well
  };
}

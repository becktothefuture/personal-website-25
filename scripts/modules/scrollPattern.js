/**
 * Scroll Pattern Module
 * --------------------
 * Creates and animates a pattern that moves based on scroll velocity.
 * 
 * This module:
 * - Creates or finds a pattern wrapper and elements
 * - Animates the pattern based on scrollTracker velocity
 * - Implements a seamless infinite loop effect
 * - Uses performant techniques (transforms, requestAnimationFrame)
 */

import { scrollTracker } from './scrollTracker.js';

class ScrollPattern {
  #config = {
    patternSpeed: 0.5,           // Pattern movement multiplier
    minPatternCopies: 3,         // Minimum number of pattern copies for seamless scrolling
    checkInterval: 2000,         // Interval to check for DOM changes in ms
    patternElementClass: 'scroll-pattern-element',
    wrapperSelector: '.scroll-pattern-wrapper',
    defaultPatternWidth: '500px', // Default width of a single pattern if needed
  };

  #state = {
    initialized: false,
    wrapper: null,
    patternElements: [],
    patternWidth: 0,
    totalWidth: 0,
    position: 0,
    lastCheckTime: 0,
  };

  constructor() {
    this.init();

    // Listen for DOM loaded to ensure the wrapper is available
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    }

    // Set up mutation observer to watch for wrapper being added
    this.setupMutationObserver();
  }

  /**
   * Setup observer to detect when pattern wrapper is added to DOM
   */
  setupMutationObserver() {
    const observer = new MutationObserver(mutations => {
      if (!this.#state.initialized) {
        this.init();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Initialize pattern elements and setup
   */
  init() {
    // Find pattern wrapper
    const wrapper = document.querySelector(this.#config.wrapperSelector);
    
    if (!wrapper) {
      console.log('No scroll pattern wrapper found. Will check again later.');
      return;
    }

    this.#state.wrapper = wrapper;
    
    // Create pattern elements if they don't exist
    if (wrapper.children.length === 0) {
      this.createDefaultPattern();
    }
    
    // Store pattern elements and calculate widths
    this.#state.patternElements = Array.from(wrapper.querySelectorAll(`.${this.#config.patternElementClass}`));
    
    if (this.#state.patternElements.length === 0) {
      this.createDefaultPattern();
      this.#state.patternElements = Array.from(wrapper.querySelectorAll(`.${this.#config.patternElementClass}`));
    }
    
    // Calculate pattern dimensions
    this.calculatePatternDimensions();
    
    // Ensure we have enough pattern copies for seamless scrolling
    this.ensureSufficientPatternCopies();
    
    // Initialize CSS for wrapper and elements
    this.setupCSS();
    
    // Start animation loop
    if (!this.#state.initialized) {
      this.#state.initialized = true;
      this.animate();
    }
    
    console.log(`Scroll pattern initialized with ${this.#state.patternElements.length} elements`);
  }

  /**
   * Creates a default pattern if none exists
   */
  createDefaultPattern() {
    const wrapper = this.#state.wrapper;
    
    // Create a single pattern element
    const element = document.createElement('div');
    element.classList.add(this.#config.patternElementClass);
    
    // Add some default styling to make it visible
    element.style.width = this.#config.defaultPatternWidth;
    element.style.height = '100%';
    element.style.background = 'linear-gradient(90deg, rgba(0,0,0,0.05), rgba(0,0,0,0.1), rgba(0,0,0,0.05))';
    element.style.display = 'inline-block';
    
    // Add to wrapper
    wrapper.appendChild(element);
  }

  /**
   * Calculate dimensions of pattern elements
   */
  calculatePatternDimensions() {
    // Calculate width of a single pattern element
    const firstElement = this.#state.patternElements[0];
    this.#state.patternWidth = firstElement.offsetWidth;
    
    // Calculate total width of all pattern elements
    this.#state.totalWidth = this.#state.patternElements.reduce((total, element) => {
      return total + element.offsetWidth;
    }, 0);
  }

  /**
   * Ensure we have enough copies of the pattern for seamless scrolling
   */
  ensureSufficientPatternCopies() {
    const wrapper = this.#state.wrapper;
    const wrapperWidth = wrapper.offsetWidth;
    
    // We need enough copies to cover at least twice the wrapper width
    // for seamless looping in both directions
    const minimumRequiredWidth = wrapperWidth * 2;
    
    // Clone pattern elements until we have enough total width
    if (this.#state.totalWidth < minimumRequiredWidth) {
      // Store original elements before cloning
      const originalElements = [...this.#state.patternElements];
      const numberOfCopiesNeeded = Math.ceil(minimumRequiredWidth / this.#state.totalWidth);
      
      for (let i = 1; i < numberOfCopiesNeeded; i++) {
        originalElements.forEach(element => {
          const clone = element.cloneNode(true);
          wrapper.appendChild(clone);
          this.#state.patternElements.push(clone);
        });
      }
      
      // Recalculate total width
      this.#state.totalWidth = this.#state.patternElements.reduce((total, element) => {
        return total + element.offsetWidth;
      }, 0);
    }
  }

  /**
   * Set up CSS properties for wrapper and elements
   */
  setupCSS() {
    const wrapper = this.#state.wrapper;
    
    // Set up wrapper for horizontal scrolling
    wrapper.style.overflow = 'hidden';
    wrapper.style.position = 'relative';
    wrapper.style.width = '100%';
    
    // Create a container for horizontal movement
    let container = wrapper.querySelector('.scroll-pattern-container');
    if (!container) {
      container = document.createElement('div');
      container.classList.add('scroll-pattern-container');
      
      // Move all pattern elements into the container
      while (wrapper.firstChild) {
        container.appendChild(wrapper.firstChild);
      }
      
      wrapper.appendChild(container);
    }
    
    // Set up container styles for horizontal movement
    container.style.display = 'flex';
    container.style.position = 'relative';
    container.style.width = 'max-content';
    container.style.willChange = 'transform'; // Optimize for animations
    
    // Ensure all pattern elements are properly styled
    this.#state.patternElements.forEach(element => {
      element.style.display = 'inline-block';
      element.style.height = '100%';
    });
  }

  /**
   * Main animation loop
   */
  animate() {
    // Check if pattern wrapper exists periodically
    const now = performance.now();
    if (!this.#state.initialized || now - this.#state.lastCheckTime > this.#config.checkInterval) {
      this.init();
      this.#state.lastCheckTime = now;
    }
    
    if (this.#state.initialized) {
      this.updatePatternPosition();
    }
    
    requestAnimationFrame(() => this.animate());
  }

  /**
   * Update pattern position based on scroll velocity
   */
  updatePatternPosition() {
    if (!this.#state.wrapper) return;
    
    // Get the container that holds all pattern elements
    const container = this.#state.wrapper.querySelector('.scroll-pattern-container');
    if (!container) return;
    
    // Get velocity from scroll tracker (in m/s)
    const velocity = scrollTracker.getState().velocityMS;
    
    // Calculate movement amount (pixels per frame)
    // Using a consistent time delta for smooth animation
    const moveAmount = velocity * this.#config.patternSpeed;
    
    // Update position
    this.#state.position -= moveAmount;
    
    // Ensure seamless looping by resetting position when needed
    if (Math.abs(this.#state.position) >= this.#state.patternWidth) {
      // Reset position by the width of one pattern element
      // This creates the illusion of an infinite loop
      this.#state.position = this.#state.position % this.#state.patternWidth;
    }
    
    // Apply transform for hardware-accelerated animation
    container.style.transform = `translateX(${this.#state.position}px)`;
  }

  /**
   * Set pattern movement speed factor
   */
  setPatternSpeed(value) {
    this.#config.patternSpeed = Math.max(0.1, Math.min(value, 5.0));
  }
}

// Create and export a singleton instance
const scrollPattern = new ScrollPattern();
export { scrollPattern };

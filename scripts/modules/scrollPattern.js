/**
 * Refactored Scroll Pattern Module
 * --------------------------------
 * This version uses the pattern element already inside the wrapper.
 * The element is assumed to be styled with 200% width so that moving it by half its width (the wrapper's width)
 * creates a seamless loop.
 * 
 * Now responds to both:
 * - Constant speed (gradual scrolling effect)
 * - Rubber band impulses (elastic, immediate response)
 */

import { scrollTracker } from './scrollTracker.js';

class ScrollPattern {
  constructor() {
    this.speedFactor = 3.0;         // Base speed factor (reduced since we add rubber band effect)
    this.rubberBandFactor = 200;    // How strongly patterns respond to rubber band effect
    this.patternWrappers = [];      // Cache for performance
    this.rubberBandOffset = 0;      // Current rubber band state
    
    setTimeout(() => this.safeInit(), 500); // Delay initialisation to allow the DOM to settle
    
    // Listen for rubber band effect updates
    document.addEventListener('rubberband:update', (event) => {
      // Use the normalized offset (0-1) for pattern movement
      this.rubberBandOffset = event.detail.normalizedOffset;
    });
  }

  safeInit() {
    try {
      // Find all wrappers containing the pattern element
      this.patternWrappers = Array.from(document.querySelectorAll('.scroll-pattern-wrapper'));
      console.log(`Found ${this.patternWrappers.length} scroll pattern wrappers`);
      if (this.patternWrappers.length === 0) return;

      this.patternWrappers.forEach(wrapper => {
        if (wrapper.dataset.initialized) return; // Skip if already initialised
        wrapper.dataset.initialized = 'true';
        wrapper.style.overflow = 'hidden';

        // Use the element with the pattern texture.
        // If a container with class 'scroll-pattern-container' exists, use it; otherwise, use the first child.
        let patternEl = wrapper.querySelector('.scroll-pattern-container');
        if (!patternEl) {
          patternEl = wrapper.firstElementChild;
        }
        if (!patternEl) {
          console.warn('No pattern element found in wrapper');
          return;
        }

        // Ensure GPU-accelerated transforms for smooth animation
        patternEl.style.willChange = 'transform';

        // Since the pattern element is 200% width,
        // half its width equals the wrapper's width (for a seamless loop).
        const initialWidth = patternEl.scrollWidth / 2;
        wrapper._patternData = { patternEl, initialWidth, position: 0 };
      });

      // Start the animation loop
      this.startAnimation();
    } catch (error) {
      console.error('Error during scroll pattern initialisation:', error);
    }
  }

  startAnimation() {
    let lastTime = performance.now();

    const animate = (timestamp) => {
      try {
        const deltaTime = (timestamp - lastTime) / 1000; // Convert ms to seconds
        lastTime = timestamp;

        // Retrieve the scroll velocity from scrollTracker (default to 0 if unavailable)
        let velocity = 0;
        try {
          velocity = scrollTracker.getState().velocityMS || 0;
        } catch (e) {
          console.warn('ScrollTracker error, using 0 velocity');
        }

        // Update each wrapper's pattern element position
        this.patternWrappers.forEach(wrapper => {
          if (!wrapper._patternData) return;
          const data = wrapper._patternData;

          // Calculate movement combining:
          // 1. Base movement from constant velocity (car-like speed)
          const baseMovement = velocity * this.speedFactor * deltaTime;
          
          // 2. Rubber band movement from acceleration impulses
          const rubberBandMovement = this.rubberBandOffset * this.rubberBandFactor * deltaTime;
          
          // Combine movements (move left as values increase)
          const totalMovement = baseMovement + rubberBandMovement;
          data.position -= totalMovement;

          // When the movement reaches half the pattern width, reset position to 0
          if (data.position <= -data.initialWidth) {
            data.position = 0;
          }

          // Apply the transform using translateX for performance
          data.patternEl.style.transform = `translateX(${data.position}px)`;
        });

        requestAnimationFrame(animate);
      } catch (error) {
        console.error('Error in scroll pattern animation:', error);
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    // Reinitialise on window resize for responsiveness
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.safeInit(), 300);
    });
  }
}

export const scrollPattern = new ScrollPattern();
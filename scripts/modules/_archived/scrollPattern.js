// scrollPatterns.js

import { scrollTracker } from './scrollTracker.js';

// Internal multiplier to control the effect of acceleration on movement.
// Increased for more noticeable movement
const accelerationMultiplier = 300;

// Array to hold the state for each pattern element
const patterns = [];

// Holds the current normalized acceleration value from the ScrollTracker
let currentAcceleration = 0;

/**
 * Initialises the infinite scroll reactive pattern.
 */
export function initScrollPatterns() {
  // Select all wrappers with the .scroll-pattern-wrapper class
  const wrappers = document.querySelectorAll('.scroll-pattern-wrapper');
  
  if (wrappers.length === 0) {
    console.warn('No scroll pattern wrappers found in the document');
  }
  
  wrappers.forEach(wrapper => {
    // Get the first pattern element only from each wrapper
    const pattern = wrapper.querySelector('.  ');
    if (pattern) {
      // Set up the initial state for the pattern element
      patterns.push({
        wrapper,
        pattern,
        offset: 0 // initial offset in percentage
      });
      console.log('Pattern found and initialized for scrolling effect');
    } else {
      console.warn('Pattern element not found inside wrapper', wrapper);
    }
  });

  // Listen for normalized scroll updates from the ScrollTracker
  scrollTracker.on('normalizedUpdate', ({ normalizedAcceleration, normalizedSpeed }) => {
    // Use both acceleration and speed for smoother movement
    currentAcceleration = normalizedAcceleration * 0.7 + normalizedSpeed * 0.3;
  });

  console.log(`Scroll pattern initialized with ${patterns.length} patterns`);
  
  // Start the animation loop using requestAnimationFrame
  requestAnimationFrame(animatePatterns);
}

let lastTimestamp = null;
/**
 * The animation loop updates each pattern's offset based on the current acceleration.
 * @param {number} timestamp - The current time in milliseconds.
 */
function animatePatterns(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const dt = (timestamp - lastTimestamp) / 1000; // Convert milliseconds to seconds
  lastTimestamp = timestamp;

  // Debug logging for acceleration values
  if (patterns.length > 0 && currentAcceleration > 0.05) {
    console.log(`Current acceleration: ${currentAcceleration}`);
  }

  patterns.forEach(item => {
    // Increase the offset based on current acceleration.
    // Using modulo (%) ensures that once the offset reaches 50%, it wraps back to 0% to create a seamless loop.
    item.offset = (item.offset + currentAcceleration * accelerationMultiplier * dt) % 50;
    if (item.offset < 0) {
      item.offset += 50;
    }

    // Apply GPU-accelerated transform to move the pattern leftwards
    item.pattern.style.transform = `translate3d(-${item.offset}%, 0, 0)`;
  });

  // Continue the animation loop
  requestAnimationFrame(animatePatterns);
}
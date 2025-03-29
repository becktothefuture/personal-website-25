/**
 * @module intro
 * @description Handles the website intro animation sequence with a typewriter effect
 * 
 * This module manages an animated boot sequence with typewriter text effects and
 * widget animations. It simulates a computer boot/startup screen with configurable
 * animation speeds.
 * 
 * Features:
 * - Typewriter text animation with realistic typing speed variations
 * - Safety timeout to ensure website visibility if animation fails
 * - Sequential widget animations after intro completes
 * - Configurable animation speeds via the ANIMATION_SPEED object
 *
 * @usage Import the initIntroSequence function and call it when the page loads.
 * The function returns a Promise that resolves when the intro sequence completes.
 *
 * Example: 
 * ```
 * import { initIntroSequence } from './modules/intro.js';
 * 
 * document.addEventListener('DOMContentLoaded', async () => {
 *   await initIntroSequence();
 *   // Continue with other page initialization
 * });
 * ```
 */

console.log('Intro sequence module initialized');

import { playIntroTypeSound } from './sounds.js';

// Animation timing configuration
export const ANIMATION_TIMING = {
  // Delay before the intro animation starts (ms)
  INTRO_DELAY: 500,
  
  // Safety timeout duration (ms)
  SAFETY_TIMEOUT: 20000,
  
  // Duration of the wall animation (ms)
  WALL_ANIMATION_DURATION: 1000, // Reduced from 10000ms to 1000ms
  
  // Delay before widgets appear after wall animation starts (ms)
  WIDGETS_DELAY: 1100, // Slightly longer than wall animation to ensure proper sequence
};

// Speed configuration for intro animation
const ANIMATION_SPEED = {
  // Characters per second
  CHARS_PER_SECOND: 30,
  // Characters to batch together per update
  CHARS_PER_BATCH: 20,
  // Only play sound every N characters
  SOUND_FREQUENCY: 3
};

// Generate random number in a range
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

// Modified function: flashScreen to flash the intro-wrapper element
// Now using animation events instead of timeout
async function flashScreen(element) {
  return new Promise(resolve => {
    // Event handler for when the animation ends
    const handleAnimationEnd = () => {
      element.classList.remove('intro-flash-effect');
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    };
    
    // Listen for the animation end event
    element.addEventListener('animationend', handleAnimationEnd);
    
    // Add the flash animation class to the element
    element.classList.add('intro-flash-effect');
  });
}

// Single unified intro sequence
export async function initIntroSequence() {
  return new Promise((resolve) => {
    // Initialize wall container position
    const wallContainer = document.querySelector('.wall');
    if (wallContainer) {
      // Ensure the wall starts at position 0 with no transition
      wallContainer.classList.add('no-transition');
      // Explicitly set the initial transform to translateZ(0)
      wallContainer.style.transform = 'translateZ(0)';
      // Force a reflow to apply the no-transition and transform immediately
      void wallContainer.offsetWidth;
    }
    
    // Hide page and all widgets at the start of intro sequence
    const mainWrapper = document.querySelector('.page');
    if (mainWrapper) {
      mainWrapper.classList.add('page-hidden');
      
      // Hide all widgets explicitly at the start of intro sequence
      const widgets = document.querySelectorAll('.widget');
      widgets.forEach(widget => {
        widget.classList.add('widget-hidden');
      });
    }
    
    // Safety timeout - use configurable timing
    const safetyTimeout = setTimeout(() => {
      console.warn('Intro sequence safety timeout reached');
      document.body.style.visibility = 'visible';
      document.dispatchEvent(new CustomEvent('intro:complete'));
      resolve();
    }, ANIMATION_TIMING.SAFETY_TIMEOUT);
    
    try {
      const overlay = document.querySelector('.intro-wrapper');
      const bootText = document.querySelector('.intro-wrapper__text');
  
      if (!overlay || !bootText) {
        console.error('Intro elements not found');
        document.body.style.visibility = 'visible';
        document.dispatchEvent(new CustomEvent('intro:complete'));
        clearTimeout(safetyTimeout);
        resolve();
        return;
      }
  
      // Extract content from the bootText element
      const originalContent = bootText.textContent.trim();
      const contentLines = originalContent.split('\n');
      
      // Apply class styling instead of inline CSS
      overlay.className = 'intro-wrapper';
      
      const finishBootSequence = async () => {
        try {
          // Flash the intro-wrapper element before concluding
          await flashScreen(overlay);
          document.body.style.visibility = 'visible';          
          overlay.remove();
          
          // Show and animate the page first
          if (mainWrapper) {
            mainWrapper.classList.remove('page-hidden');
            mainWrapper.classList.add('page-intro');
            
            // Animate the wall container after a tiny delay
            if (wallContainer) {
              // Remove the no-transition class and add the animation class
              wallContainer.classList.remove('no-transition');
              // Remove the inline style to let the CSS class take effect
              wallContainer.style.transform = '';
              // Force reflow to ensure the transition is applied properly
              void wallContainer.offsetWidth;
              // Start the animation
              wallContainer.classList.add('wall-intro-animation');
              
              // Wait for wall animation to complete before animating widgets
              // This duration now comes from our configuration
              const wallAnimationDuration = ANIMATION_TIMING.WALL_ANIMATION_DURATION;
              
              // Set a timeout to match the wall animation duration
              setTimeout(() => {
                console.log('Wall animation completed, now animating widgets');
                
                // Remove the widget-hidden class - widgets will be animated by the button3DToggle.js
                document.querySelectorAll('.widget-hidden').forEach(widget => {
                  widget.classList.remove('widget-hidden');
                });
                
                // Dispatch event indicating intro is complete (widgets will animate on this event)
                document.dispatchEvent(new CustomEvent('intro:complete'));
              }, ANIMATION_TIMING.WIDGETS_DELAY);
            } else {
              // If wall container doesn't exist, animate widgets immediately
              document.querySelectorAll('.widget-hidden').forEach(widget => {
                widget.classList.remove('widget-hidden');
              });
              
              // Dispatch event indicating intro is complete
              document.dispatchEvent(new CustomEvent('intro:complete'));
            }
          } else {
            // If page doesn't exist, just dispatch the event
            document.dispatchEvent(new CustomEvent('intro:complete'));
          }
          
          clearTimeout(safetyTimeout);
          resolve();
        } catch (error) {
          console.error('Error in finishBootSequence:', error);
          document.body.style.visibility = 'visible';
          document.dispatchEvent(new CustomEvent('intro:complete'));
          clearTimeout(safetyTimeout);
          resolve();
        }
      };
  
      // Clear the element and create a pre element for the text
      bootText.innerHTML = '';
      
      // Create pre element to contain typed text with proper class
      const preElement = document.createElement('pre');
      preElement.className = 'intro-pre';
      bootText.appendChild(preElement);
      
      // Create cursor element with proper class
      const cursor = document.createElement('span');
      cursor.className = 'typing-cursor';
      cursor.innerHTML = '&#9608;'; // Block character

      // Optimized typing animation using requestAnimationFrame
      let currentLine = 0;
      let currentChar = 0;
      let displayedText = '';
      let lastTimestamp = 0;
      let charDelay = 1000 / ANIMATION_SPEED.CHARS_PER_SECOND;
      let lineCompleted = false;
      
      // Smooth animation frame handler
      function typeAnimationFrame(timestamp) {
        // First frame initialization
        if (!lastTimestamp) {
          lastTimestamp = timestamp;
        }
        
        // Calculate elapsed time
        const elapsed = timestamp - lastTimestamp;
        
        // If we've completed all lines, finish
        if (currentLine >= contentLines.length) {
          finishBootSequence();
          return;
        }
        
        // Process multiple characters per frame if enough time has passed
        if (elapsed >= charDelay) {
          const currentLineText = contentLines[currentLine];
          const charsToAdd = Math.min(
            Math.floor(elapsed / charDelay) * ANIMATION_SPEED.CHARS_PER_BATCH,
            currentLineText.length - currentChar
          );
          
          // If we have characters to add in this frame
          if (charsToAdd > 0) {
            // Add a batch of characters
            const newChars = currentLineText.substring(currentChar, currentChar + charsToAdd);
            displayedText += newChars;
            
            // Only play sound occasionally for performance
            if (currentChar % ANIMATION_SPEED.SOUND_FREQUENCY === 0) {
              const soundChar = currentLineText[currentChar];
              if (soundChar && soundChar !== ' ' && soundChar !== '\t') {
                playIntroTypeSound(soundChar);
              }
            }
            
            // Update display with all text so far
            preElement.textContent = displayedText;
            preElement.appendChild(cursor);
            
            // Update character position
            currentChar += charsToAdd;
            
            // Reset timestamp
            lastTimestamp = timestamp;
          }
          
          // If we've reached the end of the current line
          if (currentChar >= currentLineText.length && !lineCompleted) {
            lineCompleted = true;
            currentChar = 0;
            currentLine++;
            displayedText += '\n';
            
            // If we've completed all lines, finish in the next frame
            if (currentLine >= contentLines.length) {
              requestAnimationFrame(() => finishBootSequence());
              return;
            }
            
            // Reset line completion flag
            lineCompleted = false;
          }
        }
        
        // Continue animation
        requestAnimationFrame(typeAnimationFrame);
      }
      
      // Start the typing sequence after a short delay
      setTimeout(() => {
        // Initial empty display
        preElement.textContent = '';
        preElement.appendChild(cursor);
        
        // Start animation using requestAnimationFrame
        requestAnimationFrame(typeAnimationFrame);
      }, ANIMATION_TIMING.INTRO_DELAY);
      
    } catch (error) {
      console.error('Intro sequence error:', error);
      document.body.style.visibility = 'visible';
      document.dispatchEvent(new CustomEvent('intro:complete'));
      clearTimeout(safetyTimeout);
      resolve();
    }
  });
}

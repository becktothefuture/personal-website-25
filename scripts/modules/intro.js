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

// Configurable delay before the intro animation starts
export const INTRO_DELAY = 1000; // ms

// Speed configuration for intro animation
const ANIMATION_SPEED = {
  GLOBAL_MULTIPLIER: 3.0, // Higher multiplier = faster animation
  TYPING_SPEED: 3.3,      // How fast each character types
  PAUSE_BETWEEN_LINES: 0.2 // How long to pause between lines
};


// Function to add natural typing lag
function addTypingLag(speed) {
  return speed * (Math.random() * 0.5 + 0.75) / (ANIMATION_SPEED.GLOBAL_MULTIPLIER * ANIMATION_SPEED.TYPING_SPEED);
}

// Generate random number in a range
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

// Single unified intro sequence
export async function initIntroSequence() {
  return new Promise((resolve) => {
    // Safety timeout scaled by animation speed
    const safetyTimeout = setTimeout(() => {
      console.warn('Intro sequence safety timeout reached');
      document.body.style.visibility = 'visible';
      document.dispatchEvent(new CustomEvent('intro:complete'));
      resolve();
    }, 10000 / ANIMATION_SPEED.GLOBAL_MULTIPLIER); // Scaled safety timeout
    
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
          document.body.style.visibility = 'visible';          
          overlay.remove();
          
          // Dispatch event indicating intro is complete
          document.dispatchEvent(new CustomEvent('intro:complete'));
          
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

      let currentLine = 0;
      let displayedLines = [];

      async function typeNextLine() {
        try {
          if (currentLine >= contentLines.length) {
              await finishBootSequence();
              return;
          }
      
          const line = contentLines[currentLine];
          // Base typing speed, lower value = faster typing
          const baseSpeed = getRandom(3, 10); 
          // Shorter pause between lines
          const pause = getRandom(10, 100) / (ANIMATION_SPEED.GLOBAL_MULTIPLIER * ANIMATION_SPEED.PAUSE_BETWEEN_LINES);
          
          // Ensure we always have a line to work with, even for blank lines
          while (displayedLines.length <= currentLine) {
            displayedLines.push('');
          }
          
          // Type each character with a delay
          for (let i = 0; i < line.length; i++) {
            // Update the current line being typed
            displayedLines[currentLine] = line.substring(0, i + 1);
            
            // Preserve all whitespace exactly as it appears in the original text
            preElement.textContent = displayedLines.join('\n');
            
            // Make sure cursor is properly positioned at the end of current text
            if (preElement.lastChild) {
              preElement.appendChild(cursor);
            } else {
              preElement.appendChild(cursor);
            }

            // Play typing sound for this character
            playIntroTypeSound(line[i]);
            
            await new Promise(resolve => setTimeout(resolve, addTypingLag(baseSpeed)));
          }
      
          currentLine++;
          
          // Add pause between lines (now scaled by speed multiplier)
          if (currentLine < contentLines.length) {
            await new Promise(resolve => setTimeout(resolve, pause));
          }
          
          requestAnimationFrame(() => typeNextLine());
        } catch (error) {
          console.error('Error in typeNextLine:', error);
          document.body.style.visibility = 'visible';
          clearTimeout(safetyTimeout);
          resolve();
        }
      }

      // Start the typing sequence after the configured delay
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(typeNextLine, INTRO_DELAY));
      } else {
        setTimeout(typeNextLine, INTRO_DELAY);
      }
      
    } catch (error) {
      console.error('Intro sequence error:', error);
      document.body.style.visibility = 'visible';
      document.dispatchEvent(new CustomEvent('intro:complete'));
      clearTimeout(safetyTimeout);
      resolve();
    }
  });
}

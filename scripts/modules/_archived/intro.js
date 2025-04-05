/**
 * @module intro
 * @description Handles the website intro animation sequence with a typewriter effect
 * 
 * This module manages an animated boot sequence with typewriter text effects.
 * It simulates a computer boot/startup screen with minimal animation.
 */

console.log('Intro sequence module initialized');

// Import sounds for widget animations
import { buttonSounds } from './sounds.js';
import { animateAllWidgetsIntro, hideAllWidgets } from './widgetAnimations.js';

// Simplified timing configuration
const DOTS_INTERVAL = 300;            // Interval for each dot animation (ms)
const SOUND_CONFIRM_DELAY = 500;      // Delay after sound choice confirmed
const WALL_ANIMATION_DURATION = 10000; // Wall animation duration (ms)

// Widget animation timing configuration - Initial intro
const WIDGET_INTRO_CONFIG = {
  INDIVIDUAL_DURATION: 2,    // Widget animation duration in seconds (unchanged from CSS)
  GROUP_SIZE: 3,             // Number of widgets to animate at once
  GROUP_DELAY: 180,          // Delay between groups in ms
  TOTAL_DURATION: 3000,      // Target total duration for all widgets to appear (~3s)
};

// Speed configuration for intro animation
const ANIMATION_SPEED = {
  // Characters per second
  CHARS_PER_SECOND: 1000,
  // Characters to reveal in each batch (higher = faster animation)
  BATCH_SIZE: 20
};

// Flashes the intro-wrapper element using its animation event
async function flashScreen(element) {
  return new Promise(resolve => {
    const handleAnimationEnd = () => {
      element.classList.remove('intro-flash-effect');
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    };
    element.addEventListener('animationend', handleAnimationEnd);
    element.classList.add('intro-flash-effect');
  });
}

// Removed hideAllWidgets function since we're now importing it

/**
 * Ensures the intro overlay is completely removed from the DOM
 * This is a safety measure to guarantee intro disappearance
 */
function ensureIntroRemoval() {
  const introElements = document.querySelectorAll('.intro-wrapper');
  if (introElements.length > 0) {
    console.log(`Removing ${introElements.length} intro wrapper elements`);
    introElements.forEach(element => {
      // First make it invisible with CSS
      element.style.opacity = '0';
      element.style.pointerEvents = 'none';
      element.style.transition = 'opacity 0.3s ease-out';
      
      // Then remove from DOM after transition
      setTimeout(() => {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, 300);
    });
    return true;
  }
  return false;
}

// Animate wall depth from 0 to the CSS variable value
function animateWallDepth() {
  return new Promise(resolve => {
    const wall = document.querySelector('.wall');
    if (!wall) {
      console.error('Wall element not found');
      resolve();
      return;
    }
    
    // Get the wall depth from CSS variable
    const wallDepth = getComputedStyle(document.documentElement)
      .getPropertyValue('--wall-depth')
      .trim();
    
    // First set the wall at 0 depth with no transition
    wall.classList.add('no-transition');
    wall.style.transform = 'translateZ(0)';
    
    // Force reflow to ensure the initial position is applied
    void wall.offsetWidth;
    
    // Remove the no-transition class and animate to final depth
    wall.classList.remove('no-transition');
    wall.style.transition = `transform ${WALL_ANIMATION_DURATION/1000}s cubic-bezier(0.19, 1, 0.22, 1)`;
    wall.style.transform = `translateZ(calc(-1 * ${wallDepth}))`;
    
    // Only start widget animations after the overlay is gone, not during wall animation
    // This ensures widgets aren't visible too early
    
    // Resolve promise after animation completes
    setTimeout(resolve, WALL_ANIMATION_DURATION);
  });
}

// Simplified intro sequence
export async function initIntroSequence() {
  // Only hide widgets when intro sequence starts, not on page load
  // This allows Lottie animations to properly initialize first
  
  return new Promise((resolve) => {
    // Hide the text element immediately
    const bootText = document.querySelector('.intro-wrapper__text');
    if(!bootText) {
      console.error('Boot text element not found');
      ensureIntroRemoval(); // Try to clean up even if element not found
      resolve();
      return;
    }
    
    bootText.style.display = 'none';
    
    setTimeout(() => {
      const overlay = document.querySelector('.intro-wrapper');
      if (!overlay) {
        console.error('Intro wrapper not found');
        ensureIntroRemoval(); // Try to clean up even if element not found
        resolve();
        return;
      }
      
      // Reveal the text container when starting animation
      bootText.style.display = 'block';
      
      const originalContent = bootText.textContent;
      // Preserve all line breaks
      const contentLines = originalContent.split(/\r?\n/);
      bootText.innerHTML = '';
      
      const preElement = document.createElement('pre');
      preElement.className = 'intro-pre';
      preElement.style.whiteSpace = 'pre';
      preElement.style.transform = 'none';
      bootText.appendChild(preElement);
      
      // Character delay for typing effect - adjusted for batch processing
      const batchDelay = (1000 / ANIMATION_SPEED.CHARS_PER_SECOND) * ANIMATION_SPEED.BATCH_SIZE;
      let currentLine = 0, currentChar = 0, displayedText = '';
      
      function typeNextBatch() {
        if (currentLine >= contentLines.length) {
          animateDots();
          return;
        }
        
        const line = contentLines[currentLine];
        
        // Process a batch of characters
        let charsProcessed = 0;
        while (charsProcessed < ANIMATION_SPEED.BATCH_SIZE && currentChar < line.length) {
          displayedText += line[currentChar];
          currentChar++;
          charsProcessed++;
        }
        
        // Update display with batch of characters
        preElement.textContent = displayedText;
        
        // Check if we've reached the end of the line
        if (currentChar >= line.length) {
          // Explicitly add a new line character to preserve formatting
          displayedText += '\n';
          preElement.textContent = displayedText;
          currentLine++;
          currentChar = 0;
        }
        
        // Continue with next batch
        setTimeout(typeNextBatch, batchDelay);
      }
      
      function animateDots() {
        let dotCount = 0;
        function addDot() {
          if (dotCount < 3) {
            preElement.textContent += '.';
            dotCount++;
            setTimeout(addDot, DOTS_INTERVAL);
          } else {
            flashAndProceed();
          }
        }
        addDot();
      }
      
      async function flashAndProceed() {
        try {
          await flashScreen(overlay);
          
          // Set explicit styles to ensure the overlay is invisible before removal
          overlay.style.opacity = '0';
          overlay.style.pointerEvents = 'none';
          overlay.style.transition = 'opacity 0.3s ease-out';
          
          // Force a reflow to ensure style changes take effect
          void overlay.offsetWidth;
          
          // Remove after a short delay to allow opacity transition
          setTimeout(() => {
            // Use more robust removal method
            if (overlay && overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
              console.log('Intro overlay removed from DOM');
            }
            
            // Double-check for any remaining intro elements
            ensureIntroRemoval();
            
            // Start wall animation and widget animations concurrently
            animateWallDepth();
            animateAllWidgetsIntro()
              .then(() => {
                hideAllWidgets(); // hide widgets at the end
              });
            
            document.dispatchEvent(new CustomEvent('intro:complete'));
            resolve();
          }, 300);
        } catch (error) {
          console.error('Error in flashAndProceed:', error);
          ensureIntroRemoval();
          resolve();
        }
      }
      
      typeNextBatch();
    }, SOUND_CONFIRM_DELAY);
  });
}

// Add an additional exported function to force removal of intro elements
export function forceRemoveIntroElements() {
  return ensureIntroRemoval();
}

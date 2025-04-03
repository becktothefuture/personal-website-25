/**
 * @module intro
 * @description Handles the website intro animation sequence with a typewriter effect
 * 
 * This module manages an animated boot sequence with typewriter text effects.
 * It simulates a computer boot/startup screen with minimal animation.
 */

console.log('Intro sequence module initialized');

// Simplified timing configuration
const DOTS_INTERVAL = 300;            // Interval for each dot animation (ms)
const SOUND_CONFIRM_DELAY = 500;      // Delay after sound choice confirmed
const WALL_ANIMATION_DURATION = 3000; // Wall animation duration (ms)

// Speed configuration for intro animation
const ANIMATION_SPEED = {
  // Characters per second
  CHARS_PER_SECOND: 600,
  // Characters to reveal in each batch (higher = faster animation)
  BATCH_SIZE: 10
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

// Hide all widgets on page load
function hideAllWidgets() {
  document.querySelectorAll('.widget').forEach(widget => {
    widget.classList.add('widget-hidden');
  });
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
    
    // Resolve promise after animation completes
    setTimeout(resolve, WALL_ANIMATION_DURATION);
    
    // Start widget animations shortly after wall animation begins
    // This ensures widgets appear during the wall animation
    setTimeout(() => {
      animateWidgetsRandomly();
    }, 100); // Small delay to let wall animation start first
  });
}

// Animate all widgets in random order
function animateWidgetsRandomly() {
  const widgets = Array.from(document.querySelectorAll('.widget'));
  
  // Shuffle widgets array for random order
  const shuffledWidgets = widgets.sort(() => Math.random() - 0.5);
  
  // Animate each widget with increasing delay
  shuffledWidgets.forEach((widget, index) => {
    const delay = 100 + (index * 150) + (Math.random() * 300);
    setTimeout(() => {
      widget.classList.remove('widget-hidden');
      widget.classList.add('widget-intro');
      widget.addEventListener('animationend', () => {
        widget.classList.remove('widget-intro');
      }, { once: true });
    }, delay);
  });
}

// Simplified intro sequence
export async function initIntroSequence() {
  // Hide all widgets on initialization
  hideAllWidgets();
  
  return new Promise((resolve) => {
    // Hide the text element immediately
    const bootText = document.querySelector('.intro-wrapper__text');
    if(!bootText) {
      console.error('Boot text element not found');
      resolve();
      return;
    }
    
    bootText.style.display = 'none';
    
    setTimeout(() => {
      const overlay = document.querySelector('.intro-wrapper');
      if (!overlay) {
        console.error('Intro wrapper not found');
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
        await flashScreen(overlay);
        overlay.remove();
        
        // Start wall animation, but don't wait for its completion to move forward
        // Widget animation will be triggered by the animateWallDepth function
        animateWallDepth();
        
        // Dispatch intro complete event without waiting for animations
        document.dispatchEvent(new CustomEvent('intro:complete'));
        resolve();
      }
      
      typeNextBatch();
    }, SOUND_CONFIRM_DELAY);
  });
}

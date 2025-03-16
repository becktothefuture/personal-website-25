const ANIMATION_SPEED = {
  GLOBAL_MULTIPLIER: 1.0,
  TYPING_SPEED: 2.0,
  PAUSE_BETWEEN_LINES: 0.5,
  WIDGET_ANIMATION: 1.0
};

// Typing speeds + pauses
function addTypingLag(speed) {
  return speed * (Math.random() * 1.5 + 0.5) / (ANIMATION_SPEED.GLOBAL_MULTIPLIER * ANIMATION_SPEED.TYPING_SPEED);
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
      resolve();
    }, 15000 / ANIMATION_SPEED.GLOBAL_MULTIPLIER); // Scaled safety timeout
    
    // Declare handleSkip at higher scope so it's accessible in catch block
    let handleSkip;
      
    try {
      const overlay = document.querySelector('.intro-wrapper');
      const bootText = document.querySelector('.intro-wrapper__text');
      const widgets = document.querySelectorAll('.widget');
  
      if (!overlay || !bootText || !widgets.length) {
        console.error('Intro elements not found');
        document.body.style.visibility = 'visible';
        clearTimeout(safetyTimeout);
        resolve();
        return;
      }
  
      // Extract content from the bootText element
      const originalContent = bootText.textContent.trim();
      const contentLines = originalContent.split('\n');
      
      let isSkipped = false;
      
      // Apply class styling instead of inline CSS
      overlay.className = 'intro-wrapper';
      widgets.forEach(w => w.style.opacity = '0');
      
      const finishBootSequence = async () => {
        try {
          // Ensure the skip flag is set and event listener is removed
          isSkipped = true;
          document.removeEventListener('keydown', handleSkip);
          
          document.body.style.visibility = 'visible';          
          overlay.remove();
          
          animateWidgets();
          
          clearTimeout(safetyTimeout);
          resolve();
        } catch (error) {
          console.error('Error in finishBootSequence:', error);
          document.body.style.visibility = 'visible';
          document.removeEventListener('keydown', handleSkip); // Ensure cleanup even on error
          clearTimeout(safetyTimeout);
          resolve();
        }
      };
  
      // Skip by pressing Enter
      handleSkip = async (e) => {
        if (e.key === 'Enter' && !isSkipped) {
          isSkipped = true;
          document.removeEventListener('keydown', handleSkip);
          await finishBootSequence();
        }
      };
      document.addEventListener('keydown', handleSkip);
  
      // Clear the element and create a pre element for the text
      bootText.innerHTML = '';
      
      // Create skip instruction line with proper class
      const skipInstruction = document.createElement('div');
      skipInstruction.textContent = 'Press ENTER to skip intro';
      skipInstruction.className = 'intro-skip-instruction';
      bootText.appendChild(skipInstruction);
      
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
          if (isSkipped) return;
          
          if (currentLine >= contentLines.length) {
              await finishBootSequence(); // This will now properly clean up the event listener
              return;
          }
      
          const line = contentLines[currentLine];
          // Scale speed based on animation multiplier
          const baseSpeed = getRandom(5, 15);
          // Scale pause based on animation multiplier
          const pause = getRandom(0, 200) / (ANIMATION_SPEED.GLOBAL_MULTIPLIER * ANIMATION_SPEED.PAUSE_BETWEEN_LINES);
          
          // Ensure we always have a line to work with, even for blank lines
          while (displayedLines.length <= currentLine) {
            displayedLines.push('');
          }
          
          // Type each character with a delay
          for (let i = 0; i < line.length; i++) {
            if (isSkipped) break;
            
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
          document.removeEventListener('keydown', handleSkip); // Ensure cleanup on error
          document.body.style.visibility = 'visible';
          clearTimeout(safetyTimeout);
          resolve();
        }
      }

      // Start the typing sequence when DOM is fully loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => typeNextLine());
      } else {
        typeNextLine();
      }
      
    } catch (error) {
      console.error('Intro sequence error:', error);
      document.removeEventListener('keydown', handleSkip); // Ensure cleanup on general error
      document.body.style.visibility = 'visible';
      clearTimeout(safetyTimeout);
      resolve();
    }
  });
}

// Show widgets - removed delay, widgets appear immediately
function animateWidgets() {
  const widgets = document.querySelectorAll('.widget');
  const startTimes = new Map();
  
  // Adjust widget animation speed based on global multiplier
  const animationSpeedMultiplier = ANIMATION_SPEED.GLOBAL_MULTIPLIER * ANIMATION_SPEED.WIDGET_ANIMATION;
  const maxStartDelay = 2000 / animationSpeedMultiplier;
  
  widgets.forEach(w => {
    w.style.opacity = '0';
    w.style.animation = 'none';
    // Reduced delay for widget appearance
    startTimes.set(w, performance.now() + getRandom(100, maxStartDelay));
  });
  
  function animateFrame(now) {
    widgets.forEach(w => {
      if (now >= startTimes.get(w) && !w.classList.contains('widget--startup')) {
        w.classList.add('widget--startup');
        
        // Scale animation duration based on speed multiplier
        const startupDuration = (0.3 / animationSpeedMultiplier).toFixed(2);
        const flickerDuration = (0.5 / animationSpeedMultiplier).toFixed(2);
        const zoomDuration = (0.8 / animationSpeedMultiplier).toFixed(2);
        
        w.style.animation = `
          widgetStartup ${startupDuration}s ease-out,
          fluorescentFlicker ${flickerDuration}s ease-in-out,
          widgetZoomIn ${zoomDuration}s cubic-bezier(0.19, 1, 0.22, 1) forwards
        `;
        w.style.animationDelay = `0s, ${startupDuration}s, ${(parseFloat(startupDuration) + parseFloat(flickerDuration)).toFixed(2)}s`;
      }
    });
    if ([...startTimes.values()].some(t => now < t)) requestAnimationFrame(animateFrame);
  }
  requestAnimationFrame(animateFrame);
}

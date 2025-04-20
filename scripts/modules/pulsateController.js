/**
 * Pulsate Controller Module
 * 
 * Controls the global animation timing function for elements
 * that need synchronized pulsing effects across the site.
 */

export function initPulsateController() {
  // Find all elements that need the pulsate effect
  const pulsateElements = document.querySelectorAll('.pulsate-element');
  
  // Add the pulsate-element class to videos with glass effect
  const glassVideos = document.querySelectorAll('.glass-video');
  glassVideos.forEach(video => {
    video.classList.add('pulsate-element');
  });
  
  // Add the pulsate-element class to light elements
  const lightElements = document.querySelectorAll('#light, .light-element');
  lightElements.forEach(light => {
    light.classList.add('pulsate-element');
  });
  
  console.log(`Initialized pulsate controller for ${pulsateElements.length} elements`);
  
  // Apply custom brightness/contrast to elements based on the CSS variable
  document.documentElement.addEventListener('animationiteration', (e) => {
    if (e.animationName === 'pulsateMultiplier') {
      // You can add extra JavaScript control here if needed
      // This is optional as CSS handles most of the work
    }
  });
  
  return {
    // Method to manually add elements to the pulsate system
    addElement(element) {
      element.classList.add('pulsate-element');
    },
    
    // Method to remove elements from the pulsate system
    removeElement(element) {
      element.classList.remove('pulsate-element');
    },
    
    // Method to adjust timing of the pulsate animation
    setAnimationDuration(seconds) {
      document.documentElement.style.setProperty('--pulsate-duration', `${seconds}s`);
    }
  };
}
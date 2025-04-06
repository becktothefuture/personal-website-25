/**
 * Resize Overlay Module
 * --------------------
 * Manages the overlay that appears during browser resize events.
 * 
 * This module:
 * - Shows an overlay during window resize to prevent layout jumps and visual glitches
 * - Uses debounced event handling to manage resize events efficiently
 * - Controls the CSS transitions for smooth fade in/out of the overlay
 * - Provides clean DOM management by setting display:none after transitions complete
 * - Prevents viewing in extreme aspect ratios or very small viewport sizes
 * - Displays alert message when viewport dimensions are unacceptable
 */

console.log('Resize Overlay Module Initialized');

function setupResizeOverlay() {
  const overlay = document.getElementById('resize-overlay');
  const alertElement = document.getElementById('resize-overlay-alert');
  
  if (!overlay) {
    console.warn('Element with id "resize-overlay" not found');
    return;
  }
  
  if (!alertElement) {
    console.warn('Element with id "resize-overlay-alert" not found');
  }
  
  // Constants for viewport restrictions
  const MIN_WIDTH = 300; // Minimum acceptable width in pixels
  const MIN_HEIGHT = 400; // Minimum acceptable height in pixels
  const MAX_RATIO = 3; // Maximum width:height or height:width ratio
  
  // Force the overlay to be hidden initially by setting style directly
  overlay.style.opacity = '0';
  overlay.style.display = 'none';
  overlay.classList.add('resize-overlay--hidden');
  
  if (alertElement) {
    alertElement.style.display = 'none';
  }
  
  console.log('Resize overlay initialized and hidden');
  
  const TRANSITION_DURATION = 300; // Duration in ms for fade transition
  const RESIZE_DELAY = 1000; // Keep overlay visible for 1 second after resize
  
  let resizeTimer;
  let isResizing = false;
  let overlayShownForSizeRestriction = false;
  
  // Function to check if viewport dimensions are acceptable
  function isViewportAcceptable() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = Math.max(width / height, height / width);
    
    return width >= MIN_WIDTH && height >= MIN_HEIGHT && ratio <= MAX_RATIO;
  }
  
  // Function to show overlay
  function showOverlay(showAlert = false) {
    overlay.style.display = 'block';
    
    // Force a reflow before setting opacity to ensure transition works
    overlay.offsetHeight;
    
    overlay.style.opacity = '1';
    overlay.classList.remove('resize-overlay--hidden');
    overlay.classList.add('resize-overlay--visible');
    
    if (showAlert && alertElement) {
      alertElement.style.display = 'block';
    }
  }
  
  // Function to hide overlay
  function hideOverlay() {
    overlay.style.opacity = '0';
    overlay.classList.remove('resize-overlay--visible');
    overlay.classList.add('resize-overlay--hidden');
    
    if (alertElement) {
      alertElement.style.display = 'none';
    }
    
    // After transition completes, set display none
    setTimeout(() => {
      if (overlay.style.opacity === '0') {
        overlay.style.display = 'none';
      }
    }, TRANSITION_DURATION);
  }
  
  // Check viewport on initialization
  if (!isViewportAcceptable()) {
    showOverlay(true);
    overlayShownForSizeRestriction = true;
  }
  
  window.addEventListener('resize', () => {
    const viewportIsAcceptable = isViewportAcceptable();
    
    if (!isResizing) {
      isResizing = true;
      
      // Always show overlay during resize
      showOverlay(!viewportIsAcceptable);
    }
    
    if (resizeTimer) clearTimeout(resizeTimer);
    
    resizeTimer = setTimeout(() => {
      if (viewportIsAcceptable) {
        // Viewport is acceptable, hide overlay
        hideOverlay();
        overlayShownForSizeRestriction = false;
      } else {
        // Keep overlay visible with alert if viewport is unacceptable
        showOverlay(true);
        overlayShownForSizeRestriction = true;
      }
      
      isResizing = false;
    }, RESIZE_DELAY);
  });
}

export function initResizeOverlay() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupResizeOverlay);
  } else {
    setupResizeOverlay();
  }
}

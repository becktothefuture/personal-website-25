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
 */

console.log('Resize Overlay Module Initialized');

function setupResizeOverlay() {
  const overlay = document.getElementById('resize-overlay');
  if (!overlay) {
    console.warn('Element with id "resize-overlay" not found');
    return;
  }
  
  // Force the overlay to be hidden initially by setting style directly
  overlay.style.opacity = '0';
  overlay.style.display = 'none';
  overlay.classList.add('resize-overlay--hidden');
  
  console.log('Resize overlay initialized and hidden');
  
  const TRANSITION_DURATION = 300; // Duration in ms for fade transition
  const RESIZE_DELAY = 1000; // Keep overlay visible for 1 second after resize
  
  let resizeTimer;
  let isResizing = false;
  
  window.addEventListener('resize', () => {
    if (!isResizing) {
      isResizing = true;
      // Make visible during resize with fade in
      overlay.style.display = 'block';
      
      // Force a reflow before setting opacity to ensure transition works
      overlay.offsetHeight;
      
      overlay.style.opacity = '1';
      overlay.classList.remove('resize-overlay--hidden');
      overlay.classList.add('resize-overlay--visible');
    }
    
    if (resizeTimer) clearTimeout(resizeTimer);
    
    resizeTimer = setTimeout(() => {
      // Fade out after resize completes + 1s delay
      overlay.style.opacity = '0';
      overlay.classList.remove('resize-overlay--visible');
      overlay.classList.add('resize-overlay--hidden');
      
      // After transition completes, set display none
      setTimeout(() => {
        if (overlay.style.opacity === '0') {
          overlay.style.display = 'none';
        }
        isResizing = false;
      }, TRANSITION_DURATION);
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

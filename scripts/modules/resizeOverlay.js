function setupResizeOverlay() {
  const overlay = document.getElementById('resize-overlay');
  if (!overlay) {
    console.warn('Element with id "resize-overlay" not found');
    return;
  }
  
  // Force the overlay to be hidden initially by setting style directly
  overlay.style.opacity = '0';
  overlay.style.display = 'none';
  overlay.classList.remove('resize-overlay--visible');
  overlay.classList.add('resize-overlay--hidden');
  
  console.log('Resize overlay initialized and hidden');
  
  let resizeTimer;
  let isResizing = false;
  
  window.addEventListener('resize', () => {
    if (!isResizing) {
      isResizing = true;
      // Make visible during resize
      overlay.style.display = 'block';
      overlay.classList.remove('resize-overlay--hidden');
      overlay.classList.add('resize-overlay--visible');
    }
    
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Hide after resize completes
      overlay.classList.remove('resize-overlay--visible');
      overlay.classList.add('resize-overlay--hidden');
      
      // After transition completes, set display none
      setTimeout(() => {
        if (!overlay.classList.contains('resize-overlay--visible')) {
          overlay.style.display = 'none';
        }
        isResizing = false;
      }, 150); // Match transition time
    }, 150);
  });
}

export function initResizeOverlay() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupResizeOverlay);
  } else {
    setupResizeOverlay();
  }
}

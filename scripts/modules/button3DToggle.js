/**
 * 3D Button Toggle Module
 * 
 * Handles toggling between 3D buttons, allowing only one to be active at a time.
 * By default, the home-button is set to active if no other button is already active.
 * Controls visibility of corresponding screen sections.
 */

export function init3DButtons() {
  // Make sure DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeButtons);
  } else {
    initializeButtons();
  }
}

function initializeButtons() {
  const buttonWrappers = document.querySelectorAll('.btn-3d');
  
  // Check if any button is already active
  const activeButtonExists = document.querySelector('.btn-3d__button.btn-3d--active');
  
  // Set home button as active by default only if no active button exists yet
  if (!activeButtonExists) {
    const homeButton = document.getElementById('home-button');
    if (homeButton) {
      const homeButtonElement = homeButton.querySelector('.btn-3d__button');
      if (homeButtonElement) {
        homeButtonElement.classList.add('btn-3d--active');
      }
    }
  }

  // Verify all screens exist at initialization
  const screens = ['home-view', 'portfolio-view', 'contact-view'];
  const missingScreens = screens.filter(id => !document.getElementById(id));
  if (missingScreens.length > 0) {
    console.warn('Missing screen elements:', missingScreens.join(', '));
  }

  // Initialize screen visibility based on active button
  updateScreenVisibility();

  // Add click handlers to all button wrappers
  buttonWrappers.forEach(wrapper => {
    wrapper.addEventListener('click', handleButtonClick);
    
    // Enhance accessibility
    const button = wrapper.querySelector('.btn-3d__button');
    if (button) {
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', button.classList.contains('btn-3d--active') ? 'true' : 'false');
    }
  });
  
  console.log('3D button toggle initialized');
}

function handleButtonClick(event) {
  // Find the button element inside this wrapper
  const buttonElement = this.querySelector('.btn-3d__button');
  
  if (!buttonElement) return;
  
  // If already active, do nothing
  if (buttonElement.classList.contains('btn-3d--active')) return;

  // Remove active class from all buttons
  document.querySelectorAll('.btn-3d__button').forEach(btn => {
    btn.classList.remove('btn-3d--active');
  });

  // Activate the clicked one
  buttonElement.classList.add('btn-3d--active');
  
  // Update ARIA attributes for accessibility
  document.querySelectorAll('.btn-3d__button').forEach(btn => {
    btn.setAttribute('aria-selected', 'false');
  });
  buttonElement.setAttribute('aria-selected', 'true');
  
  // Update screen visibility based on which button is active
  updateScreenVisibility();
}

// Function to update screen visibility based on active button
function updateScreenVisibility() {
  // Find which button is active
  const activeButton = document.querySelector('.btn-3d__button.btn-3d--active');
  if (!activeButton) return;
  
  const buttonWrapper = activeButton.closest('.btn-3d');
  if (!buttonWrapper || !buttonWrapper.id) return;
  
  // Get the screen type from button ID (e.g., 'home-button' → 'home')
  const buttonId = buttonWrapper.id;
  const screenType = buttonId.replace('-button', '');
  
  // Get all screens
  const screens = {
    home: document.getElementById('home-view'),
    portfolio: document.getElementById('portfolio-view'),
    contact: document.getElementById('contact-view')
  };
  
  // Hide all screens first (for performance)
  Object.values(screens).forEach(screen => {
    if (screen) {
      screen.style.display = 'none';
    }
  });
  
  // Show the active screen
  if (screens[screenType]) {
    screens[screenType].style.display = 'block';
    
    // Simple fade-in effect for now, to be enhanced later
    animateScreenTransition(screens[screenType]);
  }
}

// Basic implementation of screen transition animations
function animateScreenTransition(screenElement) {
  // Simple fade-in effect that can be expanded later
  screenElement.style.opacity = '0';
  screenElement.style.transition = 'opacity 0.3s ease-in-out';
  
  // Use setTimeout to ensure the transition works properly
  setTimeout(() => {
    screenElement.style.opacity = '1';
  }, 10);
}

// Initialize when imported
init3DButtons();

/**
 * 3D Button Toggle Module
 * 
 * Handles toggling between 3D buttons, allowing only one to be active at a time.
 * Controls visibility of corresponding screen sections.
 * Manages staggered animation of widgets when switching views.
 */

// Import necessary modules
import { buttonSounds } from './sounds.js';
import { animateViewTransition, hideAllWidgets } from './widgetAnimations.js';

// Available screen IDs for validation
const SCREEN_IDS = ['home-view', 'portfolio-view', 'contact-view'];

// Track if a transition is currently in progress
let transitionInProgress = false;

/**
 * Initialize the 3D buttons module
 */
export function init3DButtons() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeButtons);
  } else {
    initializeButtons();
  }
}

// This function initializes the button toggle functionality
// and handles the activation of the home button when the intro is complete
function initializeButtons() {
  const buttonWrappers = document.querySelectorAll('.btn-3d');
  
  // Validate all screens exist
  const missingScreens = SCREEN_IDS.filter(id => !document.getElementById(id));
  if (missingScreens.length > 0) {
    console.warn('Missing screen elements:', missingScreens.join(', '));
  }

  // Hide all screens initially
  SCREEN_IDS.forEach(id => {
    const screen = document.getElementById(id);
    if (screen) screen.style.display = 'none';
  });

  // Set up event listeners for buttons
  buttonWrappers.forEach(setupButtonEvents);
  
  // Listen for intro complete event to activate home button
  document.addEventListener('intro:complete', activateHomeButton);
  
  // Automatically activate the home button at startup
  const homeButton = document.getElementById('home-button');
  if (homeButton) {
    activateButton(homeButton);
  }
  
  console.log('3D button toggle initialized');
}

// This function sets up event listeners for each button wrapper
// Applies click handler to the entire btn-3d wrapper
// Sets up sound effects on press and accessibility attributes
function setupButtonEvents(wrapper) {
  // Click handler on the wrapper (btn-3d)
  wrapper.addEventListener('click', handleButtonClick);
  
  // Sound effect on press
  wrapper.addEventListener('mousedown', () => {
    buttonSounds.play('press');
  });
  
  // Set up accessibility attributes
  const button = wrapper.querySelector('.btn-3d__button');
  if (button) {
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', 'false');
  }
}

/**
 * Handle the intro complete event by activating home button
 * This activates the home button when the intro animation is complete
 */
function activateHomeButton() {
  // Check if the home button element exists
  const homeButton = document.getElementById('home-button');
  if (!homeButton) return;
  
  // Deactivate any active buttons first
  deactivateAllButtons();
  
  // Activate home button wrapper
  activateButton(homeButton);
  
  // Show and animate home screen
  const homeScreen = document.getElementById('home-view');
  if (homeScreen) {
    showScreenOnly('home-view');
    
    // Animate widgets with delay to ensure screen is visible
    setTimeout(() => {
      animateViewTransition(null, '#home-view', homeButton).then(() => {
        transitionInProgress = false;
      });
      buttonSounds.play('confirm', 0.8);
    }, 50);
  }
}

// This function handles the button click event
// - Checks if the clicked button is already active
// - Stores the previously active screen
// - Deactivates all buttons
// - Activates the clicked button (applies btn-3d--active class)
// - Handles the screen transition
function handleButtonClick(event) {
  // Prevent rapid clicking during transitions
  if (transitionInProgress) return;
  transitionInProgress = true;
  
  // This refers to the .btn-3d wrapper element that was clicked
  const buttonWrapper = this;
  // Work out which variant modifier this button has
  // (e.g. btn-3d--home, btn-3d--portfolio, btn-3d--contact)
  const variant = buttonWrapper.dataset.variant;       // <‑‑ NEW

  
  // Don't do anything if button is already active
  if (buttonWrapper.classList.contains('btn-3d--active')) {
    transitionInProgress = false;
    return;
  }

  // Store previously active screen
  const previousScreen = getActiveScreen();

  // Update button states
  deactivateAllButtons();
  // Activate *all* buttons that share the same variant so each twin reacts
  document
    .querySelectorAll(`.btn-3d[data-variant="${variant}"]`)
    .forEach(activateButton);                         
  
  // Handle screen transition
  updateScreenVisibility(previousScreen);
}

/**
 * Deactivate all 3D buttons
 * Removes the active class and updates accessibility attributes
 */
function deactivateAllButtons() {
  document.querySelectorAll('.btn-3d').forEach(wrapper => {
    // Remove active class from wrapper
    wrapper.classList.remove('btn-3d--active');
    
    // Update accessibility attribute on the button element
    const button = wrapper.querySelector('.btn-3d__button');
    if (button) {
      button.setAttribute('aria-selected', 'false');
    }
  });
}

/**
 * Activate a specific button
 * Applies the active class to the wrapper and updates accessibility attributes
 * This affects the button front, sides, glow, and shadow via CSS
 * @param {Element} wrapper - Button wrapper (.btn-3d) to activate
 */
function activateButton(wrapper) {
  // Add active class to wrapper
  wrapper.classList.add('btn-3d--active');
  
  // Update accessibility attribute on the button element
  const button = wrapper.querySelector('.btn-3d__button');
  if (button) {
    button.setAttribute('aria-selected', 'true');
  }
}

/**
 * Show only the specified screen, hiding all others
 * Handles visibility, opacity, and positioning to maintain Lottie contexts
 * @param {string} screenId - ID of screen to show
 */
function showScreenOnly(screenId) {
  SCREEN_IDS.forEach(id => {
    const screen = document.getElementById(id);
    if (screen) {
      if (id === screenId) {
        // Make target screen visible but don't animate widgets yet
        screen.style.visibility = 'visible';
        screen.style.opacity = '1';
        screen.style.position = 'relative';
        screen.style.display = 'block';
      } else {
        // Hide other screens using position and opacity instead of display:none
        // This maintains Lottie context
        screen.style.visibility = 'hidden';
        screen.style.opacity = '0';
        screen.style.position = 'absolute';
      }
    }
  });
}

/**
 * Update screen visibility based on active button
 * Handles the transition between screens with proper animations
 * @param {Element|null} previousScreen - Previously active screen element
 */
function updateScreenVisibility(previousScreen = null) {
  const activeWrapper = document.querySelector('.btn-3d.btn-3d--active');
  if (!activeWrapper) {
    transitionInProgress = false;
    return;
  }
  
  if (!activeWrapper.id) {
    transitionInProgress = false;
    return;
  }
  
  const screenType = activeWrapper.id.replace('-button', '');
  const targetScreenId = `${screenType}-view`;
  const targetScreen = document.getElementById(targetScreenId);
  
  if (!targetScreen) {
    transitionInProgress = false;
    return;
  }

  // Play button sound
  buttonSounds.play('confirm', 0.8);

  // If no previous screen, simply show and animate target screen
  if (!previousScreen) {
    showScreenOnly(targetScreenId);
    animateViewTransition(null, `#${targetScreenId}`, activeWrapper).then(() => {
      transitionInProgress = false;
    });
    return;
  }
  
  // Animate out previous screen, then animate in target screen
  animateViewTransition(`#${previousScreen.id}`, `#${targetScreenId}`, activeWrapper)
    .then(() => {
      transitionInProgress = false;
    });
}

/**
 * Get the currently active screen element
 * Finds the active screen based on the active button wrapper
 * @returns {Element|null} The active screen element or null
 */
function getActiveScreen() {
  const activeWrapper = document.querySelector('.btn-3d.btn-3d--active');
  if (!activeWrapper) return null;
  
  if (!activeWrapper.id) return null;
  
  const screenType = activeWrapper.id.replace('-button', '');
  return document.getElementById(`${screenType}-view`);
}

// Initialize when imported
init3DButtons();

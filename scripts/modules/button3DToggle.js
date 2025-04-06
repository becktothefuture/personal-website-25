/**
 * 3D Button Toggle Module
 * 
 * Handles toggling between 3D buttons, allowing only one to be active at a time.
 * Controls visibility of corresponding screen sections.
 * Manages staggered animation of widgets when switching views.
 */

import { buttonSounds } from './sounds.js';
import { animateViewTransition, hideAllWidgets } from './widgetAnimations.js';

// Track if a transition is in progress to prevent multiple button clicks
let transitionInProgress = false;

// Available screen IDs for validation
const SCREEN_IDS = ['home-view', 'portfolio-view', 'contact-view'];

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

/**
 * Set up the 3D buttons and screen visibility
 */
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
  
  console.log('3D button toggle initialized');
}

/**
 * Set up event listeners for a button wrapper
 * @param {Element} wrapper - Button wrapper element
 */
function setupButtonEvents(wrapper) {
  // Click handler
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
 */
function activateHomeButton() {
  const homeButton = document.getElementById('home-button');
  if (!homeButton) return;
  
  const homeButtonElement = homeButton.querySelector('.btn-3d__button');
  if (!homeButtonElement) return;
  
  // Deactivate any active buttons first
  deactivateAllButtons();
  
  // Activate home button
  activateButton(homeButtonElement);
  
  // Show and animate home screen
  const homeScreen = document.getElementById('home-view');
  if (homeScreen) {
    showScreenOnly('home-view');
    
    // Animate widgets with delay to ensure screen is visible
    setTimeout(() => {
      animateViewTransition('#home-view', true).then(() => {
        transitionInProgress = false;
      });
      buttonSounds.play('confirm', 0.8);
    }, 50);
  }
}

/**
 * Handle button click events
 * @param {Event} event - Click event
 */
function handleButtonClick(event) {
  // Ignore clicks during transitions
  if (transitionInProgress) return;
  
  const buttonElement = this.querySelector('.btn-3d__button');
  if (!buttonElement) return;
  
  // If already active, do nothing
  if (buttonElement.classList.contains('btn-3d--active')) return;
  
  // Lock transitions
  transitionInProgress = true;

  // Store previously active screen
  const previousScreen = getActiveScreen();

  // Update button states
  deactivateAllButtons();
  activateButton(buttonElement);
  
  // Handle screen transition
  updateScreenVisibility(previousScreen);
}

/**
 * Deactivate all 3D buttons
 */
function deactivateAllButtons() {
  document.querySelectorAll('.btn-3d__button').forEach(btn => {
    btn.classList.remove('btn-3d--active');
    btn.setAttribute('aria-selected', 'false');
  });
}

/**
 * Activate a specific button
 * @param {Element} button - Button element to activate
 */
function activateButton(button) {
  button.classList.add('btn-3d--active');
  button.setAttribute('aria-selected', 'true');
}

/**
 * Show only the specified screen, hiding all others
 * @param {string} screenId - ID of screen to show
 */
function showScreenOnly(screenId) {
  SCREEN_IDS.forEach(id => {
    const screen = document.getElementById(id);
    if (screen) {
      if (id === screenId) {
        screen.style.visibility = 'visible';
        screen.style.opacity = '1';
        screen.style.position = 'relative';
      } else {
        screen.style.visibility = 'hidden';
        screen.style.opacity = '0';
        screen.style.position = 'absolute';
      }
    }
  });
}

/**
 * Update screen visibility based on active button
 * @param {Element|null} previousScreen - Previously active screen element
 */
function updateScreenVisibility(previousScreen = null) {
  const activeButton = document.querySelector('.btn-3d__button.btn-3d--active');
  if (!activeButton) {
    transitionInProgress = false;
    return;
  }
  
  const buttonWrapper = activeButton.closest('.btn-3d');
  if (!buttonWrapper || !buttonWrapper.id) {
    transitionInProgress = false;
    return;
  }
  
  const screenType = buttonWrapper.id.replace('-button', '');
  const targetScreenId = `${screenType}-view`;
  const targetScreen = document.getElementById(targetScreenId);
  
  if (!targetScreen) {
    transitionInProgress = false;
    return;
  }

  // If no previous screen, simply show target screen
  if (!previousScreen) {
    showScreenOnly(targetScreenId);
    animateViewTransition(`#${targetScreenId}`, true).then(() => {
      transitionInProgress = false;
    });
    return;
  }
  
  // Animate out previous screen, then animate in target screen
  buttonSounds.play('confirm', 0.8);
  
  animateViewTransition(`#${previousScreen.id}`, `#${targetScreenId}`, activeButton)
    .then(() => {
      transitionInProgress = false;
    });
}

/**
 * Get the currently active screen element
 * @returns {Element|null} The active screen element or null
 */
function getActiveScreen() {
  const activeButton = document.querySelector('.btn-3d__button.btn-3d--active');
  if (!activeButton) return null;
  
  const buttonWrapper = activeButton.closest('.btn-3d');
  if (!buttonWrapper || !buttonWrapper.id) return null;
  
  const screenType = buttonWrapper.id.replace('-button', '');
  return document.getElementById(`${screenType}-view`);
}

// Initialize when imported
init3DButtons();

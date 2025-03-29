/**
 * 3D Button Toggle Module
 * 
 * Handles toggling between 3D buttons, allowing only one to be active at a time.
 * By default, the home-button is set to active if no other button is already active.
 * Controls visibility of corresponding screen sections.
 * Manages staggered animation of widgets when switching views.
 */

import { buttonSounds } from './sounds.js';

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
  const screens = ['home-view', 'portfolio-view', 'contact-view']; // Removed about-view
  const missingScreens = screens.filter(id => !document.getElementById(id));
  if (missingScreens.length > 0) {
    console.warn('Missing screen elements:', missingScreens.join(', '));
  }

  // Initialize screen visibility based on active button
  updateScreenVisibility();

  // Add click and sound handlers to all button wrappers
  buttonWrappers.forEach(wrapper => {
    // Click handler
    wrapper.addEventListener('click', handleButtonClick);
    
    // Add press sound on mousedown
    wrapper.addEventListener('mousedown', () => {
      buttonSounds.play('press');
    });
    
    // Enhance accessibility
    const button = wrapper.querySelector('.btn-3d__button');
    if (button) {
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', button.classList.contains('btn-3d--active') ? 'true' : 'false');
    }
  });
  
  // Listen for intro complete event to animate widgets on first view
  document.addEventListener('intro:complete', () => {
    console.log('Intro complete, animating initial widgets');
    const activeScreen = getActiveScreen();
    if (activeScreen) {
      animateWidgets(activeScreen);
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

  // Store the previously active screen before changing buttons
  const previousScreen = getActiveScreen();

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
  
  // Update screen visibility with animation sequence
  updateScreenVisibility(previousScreen);
}

// Function to update screen visibility based on active button
function updateScreenVisibility(previousScreen = null) {
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
    // Removed about-view
  };
  
  // Get the target screen
  const targetScreen = screens[screenType];
  if (!targetScreen) return;
  
  // If no previous screen (first load) or same screen, just show the target screen
  if (!previousScreen) {
    Object.values(screens).forEach(screen => {
      if (screen && screen !== targetScreen) {
        screen.style.display = 'none';
      }
    });
    
    targetScreen.style.display = 'block';
    animateScreenTransition(targetScreen);
    return;
  }
  
  // Animate widgets out of the previous screen first, then switch
  animateWidgetsOut(previousScreen).then(() => {
    // Now hide all screens
    Object.values(screens).forEach(screen => {
      if (screen) {
        screen.style.display = 'none';
      }
    });
    
    // Show the target screen
    targetScreen.style.display = 'block';
    
    // Play confirm sound when view changes
    buttonSounds.play('confirm', 0.8); // Slightly reduced volume for confirmation sound
    
    // Animate the screen and its widgets in
    animateScreenTransition(targetScreen);
  });
}

// Basic implementation of screen transition animations
function animateScreenTransition(screenElement) {
  // Simple fade-in effect that can be expanded later
  screenElement.style.opacity = '0';
  screenElement.style.transition = 'opacity 0.3s ease-in-out';
  
  // Use setTimeout to ensure the transition works properly
  setTimeout(() => {
    screenElement.style.opacity = '1';
    // Animate widgets after screen becomes visible
    animateWidgets(screenElement);
  }, 10);
}

// Get the currently active screen element
function getActiveScreen() {
  const activeButton = document.querySelector('.btn-3d__button.btn-3d--active');
  if (!activeButton) return null;
  
  const buttonWrapper = activeButton.closest('.btn-3d');
  if (!buttonWrapper || !buttonWrapper.id) return null;
  
  const screenType = buttonWrapper.id.replace('-button', '');
  return document.getElementById(`${screenType}-view`);
}

// Reset widget animations before starting a new animation sequence
function resetWidgetAnimations(screenElement) {
  if (!screenElement) return;
  
  const widgets = screenElement.querySelectorAll('.widget');
  widgets.forEach(w => {
    if (w) {
      w.style.opacity = '0';
      w.classList.remove('widget-intro', 'widget-outro');
      // Force browser to recognize the change
      void w.offsetWidth;
    }
  });
}

// Show widgets with staggered animation
function animateWidgets(screenElement) {
  if (!screenElement) return;
  
  const widgets = Array.from(screenElement.querySelectorAll('.widget'));
  if (widgets.length === 0) return;
  
  // Animation speed settings
  const ANIMATION_SPEED = {
    GLOBAL_MULTIPLIER: 2.0,
    WIDGET_ANIMATION: 1.0,
    BASE_DELAY: 80, // ms between each widget
    MIN_RANDOM_DELAY: 20, // min additional random delay
    MAX_RANDOM_DELAY: 150  // max additional random delay
  };
  
  // Adjust widget animation speed based on global multiplier
  const animationSpeedMultiplier = ANIMATION_SPEED.GLOBAL_MULTIPLIER * ANIMATION_SPEED.WIDGET_ANIMATION;
  const animationDuration = (1.2 / animationSpeedMultiplier).toFixed(2);
  
  // Set animation duration CSS variable for widgets
  document.documentElement.style.setProperty('--widget-animation-duration', `${animationDuration}s`);
  
  // Sort widgets by position (top to bottom, left to right)
  widgets.sort((a, b) => {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    return aRect.top - bRect.top || aRect.left - bRect.left;
  });
  
  // Apply animations with staggered delays
  widgets.forEach((widget, index) => {
    // Remove any existing animation classes
    widget.classList.remove('widget-intro', 'widget-outro');
    
    // Calculate a progressive delay (earlier widgets appear sooner)
    const baseDelay = index * (ANIMATION_SPEED.BASE_DELAY / animationSpeedMultiplier);
    const randomDelay = getRandom(
      ANIMATION_SPEED.MIN_RANDOM_DELAY, 
      ANIMATION_SPEED.MAX_RANDOM_DELAY
    ) / animationSpeedMultiplier;
    
    const totalDelay = baseDelay + randomDelay;
    
    // First set the widget to be invisible
    widget.style.opacity = '0';
    
    // Apply animation with delay
    setTimeout(() => {
      // Add the intro animation class
      widget.classList.add('widget-intro');
    }, totalDelay);
  });
}

// Animate widgets out with staggered animation
function animateWidgetsOut(screenElement) {
  return new Promise((resolve) => {
    if (!screenElement) {
      resolve();
      return;
    }
    
    const widgets = Array.from(screenElement.querySelectorAll('.widget'));
    if (widgets.length === 0) {
      resolve();
      return;
    }
    
    // Animation speed settings
    const ANIMATION_SPEED = {
      GLOBAL_MULTIPLIER: 2.0,
      WIDGET_ANIMATION: 1.0,
      EXIT_SPEED_MULTIPLIER: 1.5, // Faster exit
      BASE_DELAY: 50, // ms between each widget for exit
      MIN_RANDOM_DELAY: 10, // min additional random delay
      MAX_RANDOM_DELAY: 100 // max additional random delay
    };
    
    // Adjust widget animation speed based on global multiplier
    const animationSpeedMultiplier = ANIMATION_SPEED.GLOBAL_MULTIPLIER * 
                                     ANIMATION_SPEED.WIDGET_ANIMATION * 
                                     ANIMATION_SPEED.EXIT_SPEED_MULTIPLIER;
    
    const animationDuration = (0.8 / animationSpeedMultiplier).toFixed(2);
    
    // Set animation duration CSS variable for widgets
    document.documentElement.style.setProperty('--widget-animation-duration', `${animationDuration}s`);
    
    // Sort widgets in reverse order (compared to entrance animation)
    // This creates a natural "last in, first out" effect
    widgets.sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return bRect.top - aRect.top || bRect.left - aRect.left;
    });
    
    // Keep track of max delay for promise resolution
    let maxDelay = 0;
    
    // Apply animations with staggered delays
    widgets.forEach((widget, index) => {
      // Remove any existing intro animation
      widget.classList.remove('widget-intro');
      
      // Calculate a progressive delay
      const baseDelay = index * (ANIMATION_SPEED.BASE_DELAY / animationSpeedMultiplier);
      const randomDelay = getRandom(
        ANIMATION_SPEED.MIN_RANDOM_DELAY, 
        ANIMATION_SPEED.MAX_RANDOM_DELAY
      ) / animationSpeedMultiplier;
      
      const totalDelay = baseDelay + randomDelay;
      maxDelay = Math.max(maxDelay, totalDelay);
      
      // Apply exit animation with delay
      setTimeout(() => {
        widget.classList.add('widget-outro');
      }, totalDelay);
    });
    
    // Resolve the promise after all animations complete (with a small buffer)
    const totalDuration = maxDelay + (parseFloat(animationDuration) * 1000) + 50;
    setTimeout(resolve, totalDuration);
  });
}

// Generate random number in a range
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

// Remove the keyframe injection function as it's now in the stylesheet

// Initialize when imported
init3DButtons();

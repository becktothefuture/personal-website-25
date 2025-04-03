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
  
  // Initially don't set any button as active - wait for intro to complete
  // The home button will be activated by the intro:complete event
  
  // Verify all screens exist at initialization
  const screens = ['home-view', 'portfolio-view', 'contact-view']; // Removed about-view
  const missingScreens = screens.filter(id => !document.getElementById(id));
  if (missingScreens.length > 0) {
    console.warn('Missing screen elements:', missingScreens.join(', '));
  }

  // Hide all screens initially
  screens.forEach(id => {
    const screen = document.getElementById(id);
    if (screen) {
      screen.style.display = 'none';
    }
  });

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
      button.setAttribute('aria-selected', 'false'); // All buttons inactive initially
    }
  });
  
  // Listen for intro complete event to toggle home button and animate widgets
  document.addEventListener('intro:complete', () => {
    console.log('Intro complete, toggling home button');
    const homeButton = document.getElementById('home-button');
    if (homeButton) {
      const homeButtonElement = homeButton.querySelector('.btn-3d__button');
      if (homeButtonElement) {
        // Deactivate any currently active button first
        document.querySelectorAll('.btn-3d__button.btn-3d--active').forEach(btn => {
          btn.classList.remove('btn-3d--active');
          btn.setAttribute('aria-selected', 'false');
        });
        
        // Activate home button
        homeButtonElement.classList.add('btn-3d--active');
        homeButtonElement.setAttribute('aria-selected', 'true');
        
        // Update screen visibility and animate widgets
        const homeScreen = document.getElementById('home-view');
        if (homeScreen) {
          // Show the home screen
          screens.forEach(id => {
            const screen = document.getElementById(id);
            if (screen) {
              screen.style.display = id === 'home-view' ? 'block' : 'none';
            }
          });
          
          // Animate the widgets with a slight delay to ensure screen is fully visible
          setTimeout(() => {
            animateWidgetsDirection(homeScreen, 'in');
            buttonSounds.play('confirm', 0.8);
          }, 50);
        }
      }
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
  const activeButton = document.querySelector('.btn-3d__button.btn-3d--active');
  if (!activeButton) return;
  
  const buttonWrapper = activeButton.closest('.btn-3d');
  if (!buttonWrapper || !buttonWrapper.id) return;
  
  const buttonId = buttonWrapper.id;
  const screenType = buttonId.replace('-button', '');
  const screens = {
    home: document.getElementById('home-view'),
    portfolio: document.getElementById('portfolio-view'),
    contact: document.getElementById('contact-view')
  };
  const targetScreen = screens[screenType];
  if (!targetScreen) return;
  
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
  
  animateWidgetsDirection(previousScreen, 'out').then(() => {
    Object.values(screens).forEach(screen => {
      if (screen) {
        screen.style.display = 'none';
      }
    });
    targetScreen.style.display = 'block';
    buttonSounds.play('confirm', 0.8);
    animateScreenTransition(targetScreen);
  });
}

// Basic implementation of screen transition animations
function animateScreenTransition(screenElement) {
  screenElement.style.opacity = '0';
  screenElement.style.transition = 'opacity 0.3s ease-in-out';
  
  setTimeout(() => {
    screenElement.style.opacity = '1';
    animateWidgetsDirection(screenElement, 'in');
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
      w.style.transform = ''; // Add this line to reset the transform
    }
  });
}

// Consolidated widget animation function for both entrance and exit
function animateWidgetsDirection(screenElement, direction) {
  if (!screenElement) return Promise.resolve();
  const widgets = Array.from(screenElement.querySelectorAll('.widget'));
  if (widgets.length === 0) return Promise.resolve();
  
  // Reset widget visibility before animation
  widgets.forEach(widget => {
    widget.classList.remove('widget-hidden');
  });
  
  let config;
  if (direction === 'in') {
    config = {
      GLOBAL_MULTIPLIER: 2.0,
      WIDGET_ANIMATION: 1.0,
      BASE_DELAY: 80,
      MIN_RANDOM_DELAY: 20,
      MAX_RANDOM_DELAY: 150,
      duration: 1.2 // seconds
    };
  } else { // 'out'
    config = {
      GLOBAL_MULTIPLIER: 2.0,
      WIDGET_ANIMATION: 1.0,
      EXIT_SPEED_MULTIPLIER: 1.5,
      BASE_DELAY: 50,
      MIN_RANDOM_DELAY: 10,
      MAX_RANDOM_DELAY: 100,
      duration: 0.8 // seconds
    };
  }
  
  const multiplier = config.GLOBAL_MULTIPLIER * config.WIDGET_ANIMATION * (direction === 'out' ? config.EXIT_SPEED_MULTIPLIER : 1);
  const animationDuration = (config.duration / multiplier).toFixed(2);
  document.documentElement.style.setProperty('--widget-animation-duration', `${animationDuration}s`);
  
  // For "in" animations, randomize widget order; for "out", sort in reverse order
  if (direction === 'in') {
    widgets.sort(() => Math.random() - 0.5);
  } else {
    widgets.sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return (bRect.top - aRect.top || bRect.left - aRect.left);
    });
  }
  
  let maxDelay = 0;
  widgets.forEach((widget, index) => {
    widget.classList.remove('widget-intro', 'widget-outro');
    const baseDelay = index * (config.BASE_DELAY / multiplier);
    const randomDelay = getRandom(config.MIN_RANDOM_DELAY, config.MAX_RANDOM_DELAY) / multiplier;
    const totalDelay = baseDelay + randomDelay;
    maxDelay = Math.max(maxDelay, totalDelay);
    
    if (direction === 'in') {
      widget.style.opacity = '0';
      setTimeout(() => {
        widget.style.removeProperty('opacity');
        widget.classList.add('widget-intro');
      }, totalDelay);
    } else {
      setTimeout(() => {
        widget.classList.add('widget-outro');
      }, totalDelay);
    }
  });
  
  const totalDuration = maxDelay + (parseFloat(animationDuration) * 1000) + 50;
  return new Promise(resolve => setTimeout(resolve, totalDuration));
}

// Generate random number in a range
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

// Initialize when imported
init3DButtons();

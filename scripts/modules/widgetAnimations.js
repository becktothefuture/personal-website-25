/**
 * @module widgetAnimations
 * @description Simple widget animation system
 */

import { buttonSounds } from './sounds.js';
// Import interference but we'll use it selectively
import { applyInterference, removeInterference } from './interference.js';

// Very simple animation delay
const WIDGET_DELAY = 50; // ms between widgets

/**
 * STEP 1: On page load, make all views except home invisible
 * but keep widgets in the DOM for proper Lottie initialization
 */
function setupInitialViewState() {
  console.log('Setting up initial view state - super simple version');
  
  // First, make ALL views visible in the DOM but with opacity 0
  // This ensures Lottie can initialize properly
  document.querySelectorAll('.view').forEach(view => {
    view.style.display = 'block'; 
    view.style.opacity = '0';
  });
  
  // Then, make home view visible but keep widgets invisible
  const homeView = document.getElementById('home-view');
  if (homeView) {
    homeView.style.opacity = '1';
    
    // Make home view widgets invisible initially
    homeView.querySelectorAll('.widget').forEach(widget => {
      widget.style.opacity = '0';
    });
  }
}

/**
 * STEP 2: Show all widgets in home view
 */
export function showHomeView() {
  console.log('Showing home view widgets - simple animation');
  
  const homeView = document.getElementById('home-view');
  if (!homeView) return Promise.resolve();
  
  // Make sure home view is fully visible
  homeView.style.display = 'block';
  homeView.style.opacity = '1';
  
  // Get all widgets in the home view
  const widgets = Array.from(homeView.querySelectorAll('.widget'));
  if (!widgets.length) return Promise.resolve();
  
  // Simple fade-in for each widget with slight delay
  widgets.forEach((widget, index) => {
    setTimeout(() => {
      // Play sound for each widget
      buttonSounds.play('confirm', 0.6);
      
      // Simple fade in with transition
      widget.style.transition = 'opacity 0.3s ease-in-out';
      widget.style.opacity = '1';
      
      // Optional: Add interference effect after fade
      setTimeout(() => {
        try {
          applyInterference(widget);
        } catch (e) {
          console.warn('Could not apply interference:', e);
        }
      }, 300);
    }, index * WIDGET_DELAY);
  });
  
  // Return a promise that resolves when all animations should be done
  return new Promise(resolve => {
    const totalTime = widgets.length * WIDGET_DELAY + 500;
    setTimeout(resolve, totalTime);
  });
}

/**
 * STEP 3: Hide all widgets in a view
 */
function hideViewWidgets(viewSelector) {
  console.log(`Hiding widgets in ${viewSelector}`);
  
  const view = document.querySelector(viewSelector);
  if (!view) return Promise.resolve();
  
  const widgets = Array.from(view.querySelectorAll('.widget'));
  if (!widgets.length) return Promise.resolve();
  
  // Simple fade-out for each widget
  widgets.forEach((widget, index) => {
    setTimeout(() => {
      // Remove any effects first
      try {
        removeInterference(widget);
      } catch (e) {
        console.warn('Could not remove interference:', e);
      }
      
      // Simple fade out
      widget.style.transition = 'opacity 0.3s ease-in-out';
      widget.style.opacity = '0';
    }, index * WIDGET_DELAY);
  });
  
  // Return a promise that resolves when all fade-outs should be complete
  return new Promise(resolve => {
    const totalTime = widgets.length * WIDGET_DELAY + 500;
    setTimeout(() => {
      // Hide the entire view when done
      view.style.opacity = '0';
      view.style.display = 'none';
      resolve();
    }, totalTime);
  });
}

/**
 * STEP 4: Show all widgets in a view
 */
function showViewWidgets(viewSelector) {
  console.log(`Showing widgets in ${viewSelector}`);
  
  const view = document.querySelector(viewSelector);
  if (!view) return Promise.resolve();
  
  // Make view visible first
  view.style.display = 'block';
  view.style.opacity = '1';
  
  const widgets = Array.from(view.querySelectorAll('.widget'));
  if (!widgets.length) return Promise.resolve();
  
  // Simple fade-in for each widget
  widgets.forEach((widget, index) => {
    setTimeout(() => {
      // Play sound for each widget
      buttonSounds.play('confirm', 0.6);
      
      // Simple fade in
      widget.style.transition = 'opacity 0.3s ease-in-out';
      widget.style.opacity = '1';
      
      // Optional: Add interference effect after fade
      setTimeout(() => {
        try {
          applyInterference(widget);
        } catch (e) {
          console.warn('Could not apply interference:', e);
        }
      }, 300);
    }, index * WIDGET_DELAY);
  });
  
  // Return a promise that resolves when all animations should be done
  return new Promise(resolve => {
    const totalTime = widgets.length * WIDGET_DELAY + 500;
    setTimeout(resolve, totalTime);
  });
}

/**
 * STEP 5: Handle view transitions
 */
export function animateViewTransition(oldViewSelector, newViewSelector, activeButton) {
  console.log(`Simple view transition: ${oldViewSelector || 'none'} → ${newViewSelector}`);
  
  // Update button states if provided
  if (activeButton) {
    // Remove active class from all buttons
    document.querySelectorAll('.nav-button, .btn-3d__button').forEach(btn => {
      btn.classList.remove('active', 'btn-3d--active');
    });
    
    // Add active class to clicked button
    if (activeButton.classList.contains('btn-3d__button')) {
      activeButton.classList.add('btn-3d--active');
    } else {
      activeButton.classList.add('active');
    }
  }
  
  // If no old view, just show the new view
  if (!oldViewSelector) {
    return showViewWidgets(newViewSelector);
  }
  
  // Otherwise, hide old view first, then show new view
  return hideViewWidgets(oldViewSelector)
    .then(() => showViewWidgets(newViewSelector));
}

/**
 * Legacy function for backward compatibility
 */
export function hideAllWidgets() {
  setupInitialViewState();
  return Promise.resolve();
}

/**
 * Legacy function for backward compatibility
 */
export function animateAllWidgetsIntro() {
  return showHomeView();
}

/**
 * Initialize module and set up event listeners
 */
export function init() {
  console.log('Initializing simple widget animations');
  
  // Set up initial state
  setupInitialViewState();
  
  // Listen for navigation events
  document.addEventListener('navigation:viewChange', (event) => {
    const { oldView, newView, button } = event.detail;
    animateViewTransition(oldView, newView, button);
  });
}

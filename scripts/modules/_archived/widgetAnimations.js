/**
 * @module widgetAnimations
 * @description Handles widget animations for view transitions
 * 
 * This module manages animating widgets in and out when switching between views.
 * Ensures proper Lottie initialization and sound synchronization.
 */

import { buttonSounds } from '../sounds.js';
import { applyInterference, removeInterference } from '../interference.js';

// Simple animation delay
const WIDGET_DELAY = 50; // ms between widgets

/**
 * Initialize site for proper Lottie animations
 * Critical: Keep all views visible during initialization, but make widgets hidden
 */
export function prepareWidgets() {
  console.log('Preparing widgets for proper Lottie initialization');
  
  // Keep all views visible to allow Lottie to initialize properly
  // But position non-home views off-screen
  document.querySelectorAll('.view').forEach(view => {
    view.style.opacity = '1';
    view.style.display = 'block'; // Keep all views in the DOM flow
    
    // Make all widgets within this view initially hidden
    view.querySelectorAll('.widget').forEach(widget => {
      widget.classList.add('widget-hidden');
    });
  });

  // After a brief delay to allow Lottie to initialize,
  // position non-home views absolute and hidden
  setTimeout(() => {
    document.querySelectorAll('.view:not(#home-view)').forEach(view => {
      view.style.position = 'absolute';
      view.style.opacity = '0';
      view.style.visibility = 'hidden';
    });
    
    // Make sure home view is properly positioned
    const homeView = document.getElementById('home-view');
    if (homeView) {
      homeView.style.position = 'relative';
      homeView.style.opacity = '1';
      homeView.style.visibility = 'visible';
    }
  }, 800);
}

/**
 * Show widgets in a view with staggered animation and synchronized sounds
 * @param {string} viewSelector - CSS selector for the view
 * @returns {Promise} - Resolves when all animations complete
 */
export function showView(viewSelector) {
  return new Promise(resolve => {
    console.log(`Showing view: ${viewSelector}`);
    
    // Get the target view
    const view = document.querySelector(viewSelector);
    if (!view) return resolve();
    
    // Make the view visible first
    view.style.visibility = 'visible';
    view.style.opacity = '1';
    view.style.position = 'relative';
    view.style.display = 'block';
    
    // Get all widgets in this view
    const widgets = Array.from(view.querySelectorAll('.widget'));
    if (!widgets.length) return resolve();
    
    // Randomize order for natural effect
    const shuffledWidgets = widgets.sort(() => Math.random() - 0.5);
    
    // Total animation time
    const totalTime = widgets.length * WIDGET_DELAY + 500;
    
    // Set up event listeners and animate each widget
    shuffledWidgets.forEach((widget, index) => {
      setTimeout(() => {
        // Remove hidden class and add intro animation class
        widget.classList.remove('widget-hidden', 'widget-outro');
        
        // IMPORTANT: Play sound exactly when animation begins
        buttonSounds.play('confirm', 0.6);
        
        // AFTER sound plays, add the animation class
        widget.classList.add('widget-intro');
        
        // When animation ends, remove intro class and apply interference
        widget.addEventListener('animationend', () => {
          if (widget.classList.contains('widget-intro')) {
            widget.classList.remove('widget-intro');
            applyInterference(widget);
          }
        }, { once: true });
      }, index * WIDGET_DELAY);
    });
    
    // Resolve after all animations complete
    setTimeout(resolve, totalTime);
  });
}

/**
 * Hide widgets in a view with staggered animation
 * @param {string} viewSelector - CSS selector for the view
 * @returns {Promise} - Resolves when all animations complete
 */
export function hideView(viewSelector) {
  return new Promise(resolve => {
    console.log(`Hiding view: ${viewSelector}`);
    
    const view = document.querySelector(viewSelector);
    if (!view) return resolve();
    
    const widgets = Array.from(view.querySelectorAll('.widget'));
    if (!widgets.length) {
      // If no widgets, just hide the view
      hideViewElement(view);
      return resolve();
    }
    
    // Randomize order for natural effect
    const shuffledWidgets = widgets.sort(() => Math.random() - 0.5);
    
    // Total animation time
    const totalTime = widgets.length * WIDGET_DELAY + 500;
    
    // Set up animations for each widget
    shuffledWidgets.forEach((widget, index) => {
      setTimeout(() => {
        // Remove interference before animation
        removeInterference(widget);
        
        // Remove intro class and add outro class
        widget.classList.remove('widget-intro');
        
        // IMPORTANT: Play sound exactly when animation begins
        buttonSounds.play('confirm', 0.6);
        
        // AFTER sound plays, add the animation class
        widget.classList.add('widget-outro');
        
        // When animation ends, add hidden class
        widget.addEventListener('animationend', () => {
          if (widget.classList.contains('widget-outro')) {
            widget.classList.add('widget-hidden');
            widget.classList.remove('widget-outro');
          }
        }, { once: true });
      }, index * WIDGET_DELAY);
    });
    
    // Hide the view after animations complete
    setTimeout(() => {
      hideViewElement(view);
      resolve();
    }, totalTime);
  });
}

/**
 * Helper function to hide a view element
 * @param {HTMLElement} view - The view element to hide
 */
function hideViewElement(view) {
  // Use absolute position and opacity instead of display:none
  // This allows Lottie animations to stay initialized
  view.style.position = 'absolute';
  view.style.opacity = '0';
  view.style.visibility = 'hidden';
}

/**
 * Handle view transitions with simplified logic
 * First hide old view, then show new view
 * @param {string} oldViewSelector - Selector for current view
 * @param {string} newViewSelector - Selector for target view
 * @param {HTMLElement} button - Button that triggered the transition
 * @returns {Promise} - Resolves when transition completes
 */
export function animateViewTransition(oldViewSelector, newViewSelector, button) {
  console.log(`View transition: ${oldViewSelector || 'none'} → ${newViewSelector}`);
  
  // Update button states if button provided
  if (button) {
    document.querySelectorAll('.nav-button, .btn-3d__button').forEach(btn => {
      btn.classList.remove('active', 'btn-3d--active');
      btn.setAttribute('aria-selected', 'false');
    });
    
    if (button.classList.contains('btn-3d__button')) {
      button.classList.add('btn-3d--active');
    } else {
      button.classList.add('active');
    }
    button.setAttribute('aria-selected', 'true');
  }
  
  // If no old view, just show new view
  if (!oldViewSelector) {
    return showView(newViewSelector);
  }
  
  // First hide old view, then show new view
  return hideView(oldViewSelector)
    .then(() => showView(newViewSelector));
}

/**
 * Show the home view widgets
 * Called after sound preferences are confirmed
 */
export function showHomeView() {
  console.log('Showing home view widgets');
  return showView('#home-view');
}

/**
 * Legacy function for backward compatibility
 */
export function hideAllWidgets() {
  prepareWidgets();
  return Promise.resolve();
}

/**
 * Legacy function for backward compatibility
 */
export function animateAllWidgetsIntro() {
  return showHomeView();
}

/**
 * Initialize the module
 */
export function init() {
  console.log('Initializing widget animation system');
  
  // Set up initial state
  prepareWidgets();
  
  // Set up navigation event listener
  document.addEventListener('navigation:viewChange', (event) => {
    const { oldView, newView, button } = event.detail;
    animateViewTransition(oldView, newView, button);
  });
}

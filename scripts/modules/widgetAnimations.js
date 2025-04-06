/**
 * @module widgetAnimations
 * @description Handles widget animations for view transitions
 * 
 * This module manages animating widgets in and out when switching between views.
 * It ensures only widgets within the active view are animated during navigation.
 */

import { buttonSounds } from './sounds.js';
import { applyInterference, removeInterference } from './interference.js';

// Animation configuration constants
const ANIMATION_CONFIG = {
  DURATION: 1,         // Animation duration in seconds
  GROUP_DELAY: 50,     // Delay between groups in ms
  MIN_GROUP_SIZE: 1,   // Minimum widgets per group
  MAX_GROUP_SIZE: 4,   // Maximum widgets per group
  TARGET_TOTAL_DURATION: 1800 // ~1.8 seconds total animation time
};

// Calculate optimal group size based on total widget count
function calculateOptimalGroupSize(widgetCount) {
  if (widgetCount <= ANIMATION_CONFIG.MIN_GROUP_SIZE) {
    return ANIMATION_CONFIG.MIN_GROUP_SIZE;
  }
  
  const animationSteps = ANIMATION_CONFIG.TARGET_TOTAL_DURATION / ANIMATION_CONFIG.GROUP_DELAY;
  const groupSize = Math.ceil(widgetCount / animationSteps);
  
  return Math.max(
    ANIMATION_CONFIG.MIN_GROUP_SIZE,
    Math.min(ANIMATION_CONFIG.MAX_GROUP_SIZE, groupSize)
  );
}

// Hide all widgets in the document
export function hideAllWidgets() {
  console.log('Hiding all widgets - widgets will remain in DOM for Lottie initialization');
  document.querySelectorAll('.widget').forEach(widget => {
    // Remove any interference effect if present
    removeInterference(widget);
    widget.classList.add('widget-hidden');
    widget.style.opacity = '0';
  });
}

// Animate all widgets into view when the page is loaded
export function animateAllWidgetsIntro() {
  const widgets = Array.from(document.querySelectorAll('.widget'));
  if (widgets.length === 0) {
    console.warn('No widgets found to animate');
    return Promise.resolve(0);
  }
  
  console.log(`Animating ${widgets.length} widgets intro`);
  
  // Shuffle widgets for randomness
  const shuffledWidgets = widgets.sort(() => Math.random() - 0.5);
  const groupSize = calculateOptimalGroupSize(shuffledWidgets.length);
  
  // Calculate total duration based on group size and animation duration
  const totalGroups = Math.ceil(shuffledWidgets.length / groupSize);
  const totalDuration = (totalGroups * ANIMATION_CONFIG.GROUP_DELAY) + 
                        (ANIMATION_CONFIG.DURATION * 1000);
  
  // Create animation groups and schedule them
  for (let groupIndex = 0; groupIndex < totalGroups; groupIndex++) {
    const startIdx = groupIndex * groupSize;
    const endIdx = Math.min(startIdx + groupSize, shuffledWidgets.length);
    const groupDelay = groupIndex * ANIMATION_CONFIG.GROUP_DELAY;
    
    setTimeout(() => {
      // Play sound for each group of widgets
      buttonSounds.play('confirm', 0.6);
      
      for (let i = startIdx; i < endIdx; i++) {
        const widget = shuffledWidgets[i];
        // Clear any inline styles that might interfere
        widget.style.opacity = '';
        widget.style.visibility = '';
        
        // Remove hidden class and add intro animation
        widget.classList.remove('widget-hidden', 'widget-outro');
        widget.classList.add('widget-intro');
        
        widget.addEventListener('animationend', () => {
          widget.classList.remove('widget-intro');
        }, { once: true });
      }
    }, groupDelay);
  }
  
  return Promise.resolve(totalDuration);
}

// Animate widgets in or out based on the view selector
export function animateViewWidgets(viewSelector, animateIn = true) {
  return new Promise(resolve => {
    // Check if viewSelector is valid
    const view = document.querySelector(viewSelector);
    if (!view) return resolve(0);
    
    // Get all widgets within the view
    const widgets = Array.from(view.querySelectorAll('.widget'));
    if (widgets.length === 0) return resolve(0);
    
    // Calculate group size based on widget count
    const groupSize = calculateOptimalGroupSize(widgets.length);
    
    // Randomize widget order for natural staggered effect
    const shuffledWidgets = widgets.sort(() => Math.random() - 0.5);
    
    // Calculate total duration based on group size and animation duration
    const totalGroups = Math.ceil(shuffledWidgets.length / groupSize);
    const totalDuration = (totalGroups * ANIMATION_CONFIG.GROUP_DELAY) + 
                          (ANIMATION_CONFIG.DURATION * 1000);
    
    // Generate unique animation ID to prevent conflicts
    const animationId = `anim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Schedule animation groups
    for (let groupIndex = 0; groupIndex < totalGroups; groupIndex++) {
      const startIdx = groupIndex * groupSize;
      const endIdx = Math.min(startIdx + groupSize, shuffledWidgets.length);
      const groupDelay = groupIndex * ANIMATION_CONFIG.GROUP_DELAY;
      
      setTimeout(() => {
        // Play sound for each group of widgets
        buttonSounds.play('confirm', 0.6);
        
        for (let i = startIdx; i < endIdx; i++) {
          animateWidget(shuffledWidgets[i], animateIn, animationId);
        }
      }, groupDelay);
    }
    
    setTimeout(resolve, totalDuration, totalDuration);
  });
}

// Animate a single widget in or out
function animateWidget(widget, animateIn, animationId) {
  
  // Store animation ID in dataset to prevent conflicts
  widget.dataset.animationId = animationId;
  
  // Reset animation state without forcing reflow
  widget.classList.remove('widget-intro', 'widget-outro');
  
  // Use requestAnimationFrame to ensure the class changes are applied in the next rendering frame
  requestAnimationFrame(() => {
    if (animateIn) {
      // First make the widget visible in the DOM
      widget.style.visibility = widget.dataset.originalVisibility || '';
      widget.classList.remove('widget-hidden');
      widget.classList.add('widget-intro');
      widget.addEventListener('animationend', () => {
        if (widget.dataset.animationId === animationId) {
          widget.classList.remove('widget-intro');
          // Apply interference effect when widget is visible
          applyInterference(widget);
        }
      }, { once: true });
    } else {
      // Remove interference effect before animating out
      removeInterference(widget);
      widget.classList.add('widget-outro');
      widget.addEventListener('animationend', () => {
        if (widget.dataset.animationId === animationId) {
          // Hide but keep in DOM
          widget.style.visibility = 'hidden';
          widget.classList.add('widget-hidden');
          widget.classList.remove('widget-outro');
        }
      }, { once: true });
    }
  });
}

// Handle view change animation
// This function is called when the view changes
export function animateViewChange(oldViewSelector, newViewSelector) {
  if (!oldViewSelector && newViewSelector) {
    return animateViewWidgets(newViewSelector, true);
  }
  
  return animateViewWidgets(oldViewSelector, false)
    .then(() => animateViewWidgets(newViewSelector, true));
}

// Show the home view on initialization
export function showHomeView() {
  const homeViewSelector = '#home-view';
  const homeView = document.querySelector(homeViewSelector);
  
  if (homeView) {
    console.log('Found home view, ensuring visibility');
    // Ensure the home view is visible by default
    homeView.style.display = 'block';
    homeView.style.visibility = 'visible';
    homeView.style.opacity = '1';
  } else {
    console.warn('Home view element not found for selector:', homeViewSelector);
    // Fallback: reveal all widgets
    document.querySelectorAll('.widget').forEach(widget => {
      // Remove hidden class
      widget.classList.remove('widget-hidden');
      // Clear any inline styles that might hide the widget
      widget.style.opacity = '';
      widget.style.visibility = '';
    });
    return Promise.resolve();
  }
  
  // Try to log the widgets within home view
  const homeViewWidgets = homeView.querySelectorAll('.widget');
  console.log(`Found ${homeViewWidgets.length} widgets in home view`);
  
  return animateViewWidgets(homeViewSelector, true);
}

// Initialize the module and set up event listeners
export function init() {
  document.addEventListener('navigation:viewChange', (event) => {
    const { oldView, newView } = event.detail;
    animateViewChange(oldView, newView);
  });
  
  // Show home view after DOM is fully loaded
  if (document.readyState === 'complete') {
    showHomeView();
  } else {
    window.addEventListener('load', () => {
      showHomeView();
    });
  }
}

// Initialize the module
init();

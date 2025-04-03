/**
 * @module widgetAnimations
 * @description Handles widget animations for view transitions
 * 
 * This module manages animating widgets in and out when switching between views.
 * It ensures only widgets within the active view are animated during navigation.
 */

// Animation durations
const ANIMATION_DURATIONS = {
  INTRO: 500,  // ms
  OUTRO: 400   // ms
};

// Function to animate widgets within a specific view
function animateViewWidgets(viewSelector, animateIn = true) {
  const view = document.querySelector(viewSelector);
  if (!view) return;
  
  const widgets = Array.from(view.querySelectorAll('.widget'));
  
  // Sort widgets randomly for intro animation
  const sortedWidgets = animateIn 
    ? widgets.sort(() => Math.random() - 0.5) 
    : widgets;
  
  sortedWidgets.forEach((widget, index) => {
    const delay = animateIn 
      ? 100 + (index * 80) + (Math.random() * 100) 
      : index * 50;
    
    setTimeout(() => {
      if (animateIn) {
        // Animate widget in
        widget.classList.remove('widget-hidden');
        widget.classList.add('widget-intro');
        widget.style.setProperty('--widget-animation-duration', `${ANIMATION_DURATIONS.INTRO}ms`);
        widget.addEventListener('animationend', () => {
          widget.classList.remove('widget-intro');
        }, { once: true });
      } else {
        // Animate widget out
        widget.classList.add('widget-outro');
        widget.style.setProperty('--widget-animation-duration', `${ANIMATION_DURATIONS.OUTRO}ms`);
        widget.addEventListener('animationend', () => {
          widget.classList.add('widget-hidden');
          widget.classList.remove('widget-outro');
        }, { once: true });
      }
    }, delay);
  });
}

// Handle view transitions
export function animateViewChange(oldViewSelector, newViewSelector) {
  // First animate out the old view widgets
  if (oldViewSelector) {
    animateViewWidgets(oldViewSelector, false);
  }
  
  // After a short delay, animate in the new view widgets
  setTimeout(() => {
    animateViewWidgets(newViewSelector, true);
  }, ANIMATION_DURATIONS.OUTRO);
}

// Initialize the module
export function init() {
  console.log('Widget animations module initialized');
  
  // Listen for navigation events (to be dispatched by navigation handlers)
  document.addEventListener('navigation:viewChange', (event) => {
    const { oldView, newView } = event.detail;
    animateViewChange(oldView, newView);
  });
}

/**
 * Consolidated View Toggling & 3D Button Module
 * 
 * This module is now the sole handler for view toggling and widget animations.
 * The viewToggle.js and widgetAnimations.js modules have been deprecated.
 * 
 * Responsibilities:
 * - Manages toggling between 3D buttons (only one active).
 * - Handles special buttons (like easter eggs) triggering views.
 * - Controls visibility of corresponding view sections.
 * - Manages staggered animation of widgets (.widget elements) when switching views.
 */

// Import necessary modules
import { buttonSounds } from './sounds.js';

// --- Configuration ---
const SCREEN_IDS = ['home-view', 'portfolio-view', 'contact-view', 'game-view']; // Added game-view
const WIDGET_ANIMATION_DURATION = 1000; // Max duration for stagger (in ms)
const WIDGET_BASE_DELAY = 50; // Base delay before starting animations

// Special buttons that trigger views but don't have active states
const SPECIAL_BUTTONS = {
  'easter-egg-button': 'game-view' // Map button ID to target view ID
};

// --- State ---
let transitionInProgress = false;

/**
 * WidgetAnimationManager
 * A class that handles widget animations and view transitions in a more robust way
 */
class WidgetAnimationManager {
  constructor() {
    this.animationRegistry = new Map(); // Tracks running animations by view ID
    this.completedAnimations = new Map(); // Tracks completed animations for cleanup
    this.soundDelayTime = 50; // 50ms delay before playing sound
  }
  
  /**
   * Prepares widgets in a view for animation
   * @param {Element} view - The view containing widgets
   * @param {string} type - Either 'in' or 'out'
   * @returns {Array} - Array of widgets
   */
  prepareWidgets(view, type) {
    const widgets = Array.from(view.querySelectorAll('.widget'));
    
    if (type === 'in') {
      // Prepare widgets for intro animation
      widgets.forEach(widget => {
        widget.style.opacity = '0.001';
        widget.style.visibility = 'hidden';
        widget.classList.remove('widget-intro', 'widget-outro');
      });
    } else if (type === 'out') {
      // Prepare widgets for outro animation
      widgets.forEach(widget => {
        widget.classList.remove('widget-intro', 'widget-hidden');
      });
    }
    
    return widgets;
  }
  
  /**
   * Animate widgets in a view with precise control
   * @param {Element} view - The view containing widgets
   * @param {string} type - Either 'in' or 'out'
   * @returns {Promise} - Resolves when all animations complete
   */
  animateWidgets(view, type) {
    return new Promise(resolve => {
      const viewId = view.id;
      const widgets = this.prepareWidgets(view, type);
      const numberOfWidgets = widgets.length;
      
      if (!numberOfWidgets) {
        console.log(`No widgets found in ${viewId} to animate ${type}.`);
        resolve(); // Nothing to animate
        return;
      }
      
      console.log(`Animating ${type} ${numberOfWidgets} widgets for ${viewId}`);
      
      // Track this animation in the registry
      if (!this.animationRegistry.has(viewId)) {
        this.animationRegistry.set(viewId, {
          type,
          count: 0,
          total: numberOfWidgets,
          complete: false
        });
      }
      
      // Shuffle widgets for random animation order
      const shuffledWidgets = widgets.sort(() => Math.random() - 0.5);
      
      // Calculate delay step for staggered animation
      const delayStep = numberOfWidgets > 1 
        ? (WIDGET_ANIMATION_DURATION - WIDGET_BASE_DELAY) / numberOfWidgets 
        : 0;
        
      // Set up event handler for animation tracking
      const handleAnimationEnd = (widget, index) => {
        const record = this.animationRegistry.get(viewId);
        
        if (!record) return; // Safety check
        
        record.count++;
        
        // Check if all animations are complete
        if (record.count >= record.total) {
          record.complete = true;
          
          // Move to completed registry for cleanup
          this.completedAnimations.set(viewId, Date.now());
          this.animationRegistry.delete(viewId);
          
          // Resolve the promise
          console.log(`All widget animations (${type}) complete for ${viewId}`);
          resolve();
        }
      };
      
      // Handle each widget
      shuffledWidgets.forEach((widget, index) => {
        const delay = index * delayStep;
        
        if (type === 'in') {
          // Make widget visible but transparent
          widget.style.opacity = '1';
          widget.style.visibility = 'visible';
          
          setTimeout(() => {
            // Play sound with delay and reduced volume
            setTimeout(() => {
              buttonSounds.play('confirm', 0.05); // Reduced volume from 0.3 to 0.05
            }, this.soundDelayTime);
            
            // Add animation class
            widget.classList.add('widget-intro');
            
            // Listen for animation end
            widget.addEventListener('animationend', () => {
              widget.classList.remove('widget-intro');
              handleAnimationEnd(widget, index);
            }, { once: true });
            
          }, WIDGET_BASE_DELAY + delay);
          
        } else if (type === 'out') {
          setTimeout(() => {
            // Play sound with delay and reduced volume
            setTimeout(() => {
              buttonSounds.play('confirm', 0.03); // Reduced volume from 0.2 to 0.03
            }, this.soundDelayTime);
            
            // Add animation class
            widget.classList.add('widget-outro');
            
            // Listen for animation end
            widget.addEventListener('animationend', () => {
              widget.classList.remove('widget-outro');
              widget.style.opacity = '0.001';
              widget.style.visibility = 'hidden';
              handleAnimationEnd(widget, index);
            }, { once: true });
            
          }, WIDGET_BASE_DELAY + delay);
        }
      });
      
      // Safety timeout in case animations don't complete properly
      const safetyTimeout = WIDGET_ANIMATION_DURATION + WIDGET_BASE_DELAY + 500;
      setTimeout(() => {
        if (this.animationRegistry.has(viewId) && !this.animationRegistry.get(viewId).complete) {
          console.warn(`Safety timeout triggered for ${viewId} ${type} animations`);
          
          // Force completion
          this.animationRegistry.delete(viewId);
          
          // If outro animation, ensure all widgets are hidden
          if (type === 'out') {
            widgets.forEach(widget => {
              widget.style.opacity = '0.001';
              widget.style.visibility = 'hidden';
              widget.classList.remove('widget-outro');
            });
          }
          
          resolve();
        }
      }, safetyTimeout);
    });
  }
  
  /**
   * Clean up any completed animations that are older than 5 seconds
   */
  cleanup() {
    const now = Date.now();
    for (const [viewId, timestamp] of this.completedAnimations.entries()) {
      if (now - timestamp > 5000) {
        this.completedAnimations.delete(viewId);
      }
    }
  }
  
  /**
   * Check if a view has active animations
   * @param {string} viewId - The ID of the view to check
   * @returns {boolean} - Whether the view has active animations
   */
  hasActiveAnimations(viewId) {
    return this.animationRegistry.has(viewId);
  }
}

// Create a singleton instance of the animation manager
const widgetAnimator = new WidgetAnimationManager();

// --- Initialization ---
export function init3DButtons() {
  console.log('Initializing consolidated button toggle, view, and widget animation system');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem();
  }
}

/**
 * Core initialization function called after DOM is ready.
 */
function initializeSystem() {
  // 1. Prepare Views and Widgets for Initialization
  prepareViewsAndWidgets();

  // 2. Setup Regular 3D Button Listeners
  const buttonWrappers = document.querySelectorAll('.btn-3d');
  console.log('Found 3D button wrappers:', buttonWrappers.length);
  buttonWrappers.forEach(wrapper => {
    setupButtonEvents(wrapper);
    console.log(`Set up events for 3D button: ${wrapper.id || wrapper.dataset.variant}`);
  });

  // 3. Setup Special Button Listeners
  setupSpecialButtons();

  // 4. Activate Home View by Default (after a slight delay for Lottie)
  // We wait a bit to ensure Lottie has initialized before the first animation
  setTimeout(() => {
    const homeButtonWrapper = document.querySelector('.btn-3d[data-variant="home"]');
    const homeView = document.getElementById('home-view');

    if (homeButtonWrapper && homeView) {
      console.log('Activating home button and view by default');
      
      deactivateAllButtons();
      homeButtonWrapper.classList.add('btn-3d--active');
      
      const innerButton = homeButtonWrapper.querySelector('.btn-3d__button');
      if (innerButton) {
        innerButton.setAttribute('aria-selected', 'true');
      }
      
      void homeButtonWrapper.offsetWidth;
      
      console.log(`Home button wrapper activated: ${homeButtonWrapper.className}`);
      
      showViewElement(homeView);
      widgetAnimator.animateWidgets(homeView, 'in');
    } else {
      console.warn('Home button wrapper or home view not found for default activation.');
      if (!homeButtonWrapper) console.warn('Could not find .btn-3d[data-variant="home"]');
      if (!homeView) console.warn('Could not find #home-view');
    }
    
    console.log('Consolidated system initialized.');
  }, 100);
}

/**
 * Prepares views and widgets for initial load.
 * - Hides all views except home initially.
 * - Sets initial opacity for widgets to allow Lottie init.
 */
function prepareViewsAndWidgets() {
  console.log('Preparing views and widgets...');
  SCREEN_IDS.forEach(id => {
    const screen = document.getElementById(id);
    if (screen) {
      screen.style.position = 'absolute';
      screen.style.top = '0';
      screen.style.left = '0';
      screen.style.width = '100%';
      screen.style.opacity = '0';
      screen.style.visibility = 'hidden';
      screen.style.pointerEvents = 'none';
      screen.classList.add('view--hidden');
      screen.classList.remove('view--active');

      widgetAnimator.prepareWidgets(screen, 'in');
      console.log(`Prepared view: ${id}`);
    } else {
      console.warn(`View element with ID '${id}' not found during preparation.`);
    }
  });
}

// --- Event Setup ---
function setupButtonEvents(wrapper) {
  wrapper.addEventListener('click', handleButtonClick);
  wrapper.addEventListener('mousedown', () => buttonSounds.play('press'));

  const button = wrapper.querySelector('.btn-3d__button');
  if (button) {
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', 'false');
  }
}

function setupSpecialButtons() {
  Object.entries(SPECIAL_BUTTONS).forEach(([buttonId, targetViewId]) => {
    const button = document.getElementById(buttonId);
    if (button) {
      console.log(`Setting up special button: ${buttonId} -> ${targetViewId}`);
      button.addEventListener('click', () => handleSpecialButtonClick(button, targetViewId));
      button.addEventListener('mousedown', () => buttonSounds.play('press'));
    } else {
      console.warn(`Special button with ID '${buttonId}' not found in DOM.`);
    }
  });
}

// --- Event Handlers ---
function handleButtonClick() {
  if (transitionInProgress) {
    console.log('View transition already in progress, ignoring click.');
    return; 
  }
  const buttonWrapper = this;
  const buttonId = buttonWrapper.id;
  const variant = buttonWrapper.dataset.variant;
  const screenType = buttonId ? buttonId.replace('-button', '') : variant;
  const targetScreenId = `${screenType}-view`;

  console.log(`3D Button clicked: ${buttonId || variant} -> ${targetScreenId}`);

  if (buttonWrapper.classList.contains('btn-3d--active')) {
    console.log('Button already active, doing nothing.');
    return;
  }

  transitionInProgress = true; 

  const previousScreen = getActiveScreenElement();
  const targetScreen = document.getElementById(targetScreenId);

  if (!targetScreen) {
    console.error(`Target screen element #${targetScreenId} not found!`);
    transitionInProgress = false;
    return;
  }

  buttonSounds.play('confirm', 0.8);
  deactivateAllButtons();
  activateButton(buttonWrapper);
  if (variant) {
    let siblingSelector = `.btn-3d[data-variant="${variant}"]`;
    if (buttonId) {
      siblingSelector += `:not(#${buttonId})`;
    }
    document.querySelectorAll(siblingSelector).forEach(siblingWrapper => {
      activateButton(siblingWrapper);
    });
  }

  performViewTransition(previousScreen, targetScreen);
}

function handleSpecialButtonClick(button, targetViewId) {
  if (transitionInProgress) {
    console.log('View transition already in progress, ignoring click.');
    return;
  }
  console.log(`Special button clicked: ${button.id} -> ${targetViewId}`);

  const targetScreen = document.getElementById(targetViewId);
  if (!targetScreen) {
    console.error(`Target screen element #${targetViewId} for special button not found!`);
    return;
  }

  const previousScreen = getActiveScreenElement();

  if (previousScreen && previousScreen.id === targetViewId) {
    console.log('Already on the target screen, doing nothing.');
    return;
  }

  transitionInProgress = true;

  buttonSounds.play('confirm', 0.8);
  deactivateAllButtons();
  performViewTransition(previousScreen, targetScreen);
}

// --- View Transition Logic ---
function performViewTransition(oldView, newView) {
  console.log(`Transitioning from ${oldView ? oldView.id : 'none'} to ${newView.id}`);

  // Hide ALL widgets in the new view BEFORE the transition
  forceHideAllWidgetsInView(newView);

  if (oldView) {
    // Animate widgets out from current view
    widgetAnimator.animateWidgets(oldView, 'out').then(() => {
      // Once widgets are gone, switch views
      hideViewElement(oldView);
      
      // First make the view visible but keep widgets hidden
      showViewElement(newView);
      
      // Force hide widgets AGAIN to ensure they're invisible
      forceHideAllWidgetsInView(newView);
      
      // Longer delay before starting widget intro animations to ensure clean separation
      // Increased from 50ms to 200ms to ensure no overlap between transitions
      setTimeout(() => {
        // Now animate widgets in
        widgetAnimator.animateWidgets(newView, 'in').then(() => {
          transitionInProgress = false;
        });
      }, 200);
    });
  } else {
    // No previous view, just show the new one
    showViewElement(newView);
    
    // Force hide all widgets
    forceHideAllWidgetsInView(newView);
    
    // Longer delay before starting widget intro animations to ensure clean separation
    setTimeout(() => {
      widgetAnimator.animateWidgets(newView, 'in').then(() => {
        transitionInProgress = false;
      });
    }, 200);
  }
}

/**
 * Force hide all widgets in a view immediately (no animation)
 * This is a crucial function to prevent any widget visibility during transitions
 * @param {Element} view - The view containing widgets
 */
function forceHideAllWidgetsInView(view) {
  if (!view) return;
  
  const widgets = view.querySelectorAll('.widget');
  widgets.forEach(widget => {
    // Use multiple techniques to ensure widgets are truly invisible
    widget.style.opacity = '0';
    widget.style.visibility = 'hidden';
    widget.classList.remove('widget-intro', 'widget-outro');
    widget.classList.add('widget-hidden');
    
    // Remove any inline transforms or transitions that might be active
    widget.style.transition = 'none';
    
    // Force browser reflow to ensure changes are applied immediately
    void widget.offsetHeight;
  });
  
  console.log(`Forcefully hidden all widgets in ${view.id}`);
}

function showViewElement(view) {
  // First, explicitly ensure all widgets in the view are hidden
  const widgets = Array.from(view.querySelectorAll('.widget'));
  widgets.forEach(widget => {
    widget.style.opacity = '0'; // Explicitly set to 0, not 0.001
    widget.style.visibility = 'hidden';
    widget.classList.remove('widget-intro', 'widget-outro');
    widget.classList.add('widget-hidden'); // Add a class for CSS control as well
  });

  // Then show the view container
  view.style.position = 'relative';
  view.style.opacity = '1';
  view.style.visibility = 'visible';
  view.style.pointerEvents = 'auto';
  view.classList.add('view--active');
  view.classList.remove('view--hidden');
  console.log(`Showing view element: ${view.id} (with all widgets initially hidden)`);
}

function hideViewElement(view) {
  view.style.position = 'absolute';
  view.style.opacity = '0';
  view.style.visibility = 'hidden';
  view.style.pointerEvents = 'none';
  view.classList.remove('view--active');
  view.classList.add('view--hidden');
  console.log(`Hiding view element: ${view.id}`);
}

// --- Button State Helpers ---
function deactivateAllButtons() {
  const allButtonWrappers = document.querySelectorAll('.btn-3d');
  console.log(`[deactivateAllButtons] Deactivating all ${allButtonWrappers.length} 3D button wrappers.`);
  let activeCount = 0;

  allButtonWrappers.forEach(wrapper => {
    if (wrapper.classList.contains('btn-3d--active')) {
      activeCount++;
      const id = wrapper.id || wrapper.dataset.variant || 'wrapper';
      console.log(`→ Deactivating wrapper: ${id}`);
      
      wrapper.classList.remove('btn-3d--active');
      
      const innerButton = wrapper.querySelector('.btn-3d__button');
      if (innerButton) {
        innerButton.setAttribute('aria-selected', 'false');
        if (innerButton.classList.contains('btn-3d--active')) {
          innerButton.classList.remove('btn-3d--active');
        }
      }
    }
  });

  if (activeCount > 0) {
    console.log(`[deactivateAllButtons] Found and deactivated ${activeCount} active wrapper(s).`);
  } else {
    console.log('[deactivateAllButtons] No active wrappers found to deactivate.');
  }

  const stillActiveWrappers = document.querySelectorAll('.btn-3d.btn-3d--active');
  if (stillActiveWrappers.length > 0) {
    console.warn(`[deactivateAllButtons] Warning: ${stillActiveWrappers.length} wrapper(s) still active after deactivation!`);
  } else {
    console.log('[deactivateAllButtons] All wrappers successfully deactivated (verified).');
  }
}

function activateButton(wrapper) {
  const innerButton = wrapper.querySelector('.btn-3d__button');
  const id = wrapper.id || wrapper.dataset.variant || 'wrapper';

  wrapper.classList.add('btn-3d--active');
  console.log(`→ Activated wrapper: ${id}`);

  if (innerButton) {
    innerButton.setAttribute('aria-selected', 'true');
    if (innerButton.classList.contains('btn-3d--active')) {
      innerButton.classList.remove('btn-3d--active');
    }
  } else {
    console.warn(`Could not find inner .btn-3d__button for wrapper: ${id}`);
  }
  
  console.log(`[activateButton] Activated wrapper: ${id}`);
}

// --- Utility ---
function getActiveScreenElement() {
  for (const id of SCREEN_IDS) {
    const screen = document.getElementById(id);
    if (screen && 
        (screen.classList.contains('view--active') || 
         (screen.style.visibility === 'visible' && screen.style.opacity === '1'))) {
      return screen;
    }
  }      
  const activeWrapper = document.querySelector('.btn-3d.btn-3d--active');
  if (activeWrapper && activeWrapper.id) {
    const screenType = activeWrapper.id.replace('-button', '');
    return document.getElementById(`${screenType}-view`);
  }
  return null;
}


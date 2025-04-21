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

// --- Initialization ---

/**
 * Initialize the consolidated button toggle and view system.
 */
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
    const homeButton = document.getElementById('home-button');
    const homeView = document.getElementById('home-view');

    if (homeButton && homeView) {
      console.log('Activating home button and view by default');
      activateButton(homeButton); // Activate the button state
      showScreenOnly('home-view'); // Make view visible
      animateWidgetsIn(homeView); // Animate widgets in
    } else {
      console.warn('Home button or home view not found for default activation.');
    }
    console.log('Consolidated system initialized.');
  }, 100); // Small delay for safety
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
      // Hide all screens initially using styles that allow init
      screen.style.position = 'absolute';
      screen.style.top = '0';
      screen.style.left = '0';
      screen.style.width = '100%'; // Ensure it takes up space if needed
      screen.style.opacity = '0'; // Hide visually
      screen.style.visibility = 'hidden'; // Hide from interactions
      screen.style.pointerEvents = 'none';
      screen.classList.add('view--hidden'); // Add class for consistency
      screen.classList.remove('view--active');

      // Set initial state for widgets within this view
      screen.querySelectorAll('.widget').forEach(widget => {
        widget.style.opacity = '0.001'; // Use 0.001 for safety with initialization
        widget.style.visibility = 'hidden'; // Start hidden
        widget.classList.remove('widget-intro', 'widget-outro'); // Clean up classes
      });
      console.log(`Prepared view: ${id}`);
    } else {
      console.warn(`View element with ID '${id}' not found during preparation.`);
    }
  });
}

// --- Event Setup ---

/**
 * Sets up event listeners for a regular 3D button wrapper.
 * @param {Element} wrapper - The .btn-3d wrapper element.
 */
function setupButtonEvents(wrapper) {
  wrapper.addEventListener('click', handleButtonClick);
  wrapper.addEventListener('mousedown', () => buttonSounds.play('press'));

  const button = wrapper.querySelector('.btn-3d__button');
  if (button) {
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', 'false');
  }
}

/**
 * Sets up event handlers for special buttons defined in SPECIAL_BUTTONS.
 */
function setupSpecialButtons() {
  Object.entries(SPECIAL_BUTTONS).forEach(([buttonId, targetViewId]) => {
    const button = document.getElementById(buttonId);
    if (button) {
      console.log(`Setting up special button: ${buttonId} -> ${targetViewId}`);
      button.addEventListener('click', () => handleSpecialButtonClick(button, targetViewId));
      button.addEventListener('mousedown', () => buttonSounds.play('press')); // Optional sound
    } else {
      console.warn(`Special button with ID '${buttonId}' not found in DOM.`);
    }
  });
}

// --- Event Handlers ---

/**
 * Handles clicks on regular 3D buttons.
 * @this Element The clicked .btn-3d wrapper element.
 */
function handleButtonClick() {
  if (transitionInProgress) return;
  const buttonWrapper = this;
  const buttonId = buttonWrapper.id;
  const variant = buttonWrapper.dataset.variant;
  const screenType = buttonId ? buttonId.replace('-button', '') : variant; // Determine target screen type
  const targetScreenId = `${screenType}-view`;

  console.log(`3D Button clicked: ${buttonId || variant} -> ${targetScreenId}`);

  if (buttonWrapper.classList.contains('btn-3d--active')) {
    console.log('Button already active, doing nothing.');
    return; // Don't re-trigger if already active
  }

  transitionInProgress = true;
  const previousScreen = getActiveScreenElement(); // Get the actual element
  const targetScreen = document.getElementById(targetScreenId);

  if (!targetScreen) {
    console.error(`Target screen element #${targetScreenId} not found!`);
    transitionInProgress = false;
    return;
  }

  // --- Perform Transition ---
  buttonSounds.play('confirm', 0.8);
  deactivateAllButtons(); // Deactivate all 3D buttons first
  activateButton(buttonWrapper); // Activate the clicked button
  // Activate siblings if variant is used
  if (variant) {
    document.querySelectorAll(`.btn-3d[data-variant="${variant}"]:not(#${buttonId})`).forEach(activateButton);
  }

  performViewTransition(previousScreen, targetScreen);
}

/**
 * Handles clicks on special buttons.
 * @param {Element} button - The special button element that was clicked.
 * @param {string} targetViewId - The ID of the view to transition to.
 */
function handleSpecialButtonClick(button, targetViewId) {
  if (transitionInProgress) return;
  console.log(`Special button clicked: ${button.id} -> ${targetViewId}`);

  const targetScreen = document.getElementById(targetViewId);
  if (!targetScreen) {
    console.error(`Target screen element #${targetViewId} for special button not found!`);
    return;
  }

  const previousScreen = getActiveScreenElement();

  // Check if already on the target screen (e.g., clicking easter egg twice)
  if (previousScreen && previousScreen.id === targetViewId) {
      console.log('Already on the target screen, doing nothing.');
      return;
  }

  transitionInProgress = true;

  // --- Perform Transition ---
  buttonSounds.play('confirm', 0.8);
  deactivateAllButtons(); // Deactivate all 3D buttons (special button has no active state)
  performViewTransition(previousScreen, targetScreen);
}

// --- View Transition Logic ---

/**
 * Orchestrates the transition between views, including widget animations.
 * @param {Element | null} oldView - The currently active view element, or null if none.
 * @param {Element} newView - The target view element.
 */
async function performViewTransition(oldView, newView) {
  console.log(`Transitioning from ${oldView ? oldView.id : 'none'} to ${newView.id}`);

  // 1. Animate Out Old View Widgets (if an old view exists)
  if (oldView) {
    await animateWidgetsOut(oldView); // Wait for outro animations
    // Hide the old view container AFTER widgets are mostly gone
    hideViewElement(oldView);
  }

  // 2. Show New View Container
  showViewElement(newView);

  // 3. Animate In New View Widgets
  await animateWidgetsIn(newView); // Wait for intro animations

  // 4. Finalize
  console.log(`Transition complete: ${newView.id} is active.`);
  transitionInProgress = false;
}

/**
 * Makes a view element visible and interactive.
 * @param {Element} view - The view element to show.
 */
function showViewElement(view) {
  view.style.position = 'relative'; // Or 'static' depending on layout
  view.style.opacity = '1';
  view.style.visibility = 'visible';
  view.style.pointerEvents = 'auto';
  view.classList.add('view--active');
  view.classList.remove('view--hidden');
  console.log(`Showing view element: ${view.id}`);
}

/**
 * Hides a view element.
 * @param {Element} view - The view element to hide.
 */
function hideViewElement(view) {
  view.style.position = 'absolute';
  view.style.opacity = '0';
  view.style.visibility = 'hidden';
  view.style.pointerEvents = 'none';
  view.classList.remove('view--active');
  view.classList.add('view--hidden');
  console.log(`Hiding view element: ${view.id}`);
}

// --- Widget Animation Helpers ---

/**
 * Animates widgets within a view to appear (intro).
 * @param {Element} view - The view element containing widgets.
 * @returns {Promise} Resolves when all intro animations are roughly complete.
 */
function animateWidgetsIn(view) {
  return new Promise(resolve => {
    const widgets = Array.from(view.querySelectorAll('.widget'));
    if (!widgets.length) {
      console.log(`No widgets found in ${view.id} to animate in.`);
      return resolve();
    }
    console.log(`Animating in ${widgets.length} widgets for ${view.id}`);

    const shuffledWidgets = widgets.sort(() => Math.random() - 0.5);
    let maxDelay = 0;

    shuffledWidgets.forEach(widget => {
      const delay = Math.random() * WIDGET_ANIMATION_DURATION;
      maxDelay = Math.max(maxDelay, delay);

      // Ensure widget is visible before starting animation
      widget.style.opacity = '1'; // Reset from 0.001
      widget.style.visibility = 'visible';
      widget.classList.remove('widget-hidden', 'widget-outro');

      setTimeout(() => {
        widget.classList.add('widget-intro');
        
        // Clean up class after animation
        widget.addEventListener('animationend', () => {
          widget.classList.remove('widget-intro');
        }, { once: true });

      }, WIDGET_BASE_DELAY + delay);
    });

    // Resolve after the longest animation delay + animation duration
    setTimeout(resolve, WIDGET_BASE_DELAY + maxDelay + WIDGET_ANIMATION_DURATION); // Approximate completion
  });
}

/**
 * Animates widgets within a view to disappear (outro).
 * @param {Element} view - The view element containing widgets.
 * @returns {Promise} Resolves when all outro animations are roughly complete.
 */
function animateWidgetsOut(view) {
  return new Promise(resolve => {
    const widgets = Array.from(view.querySelectorAll('.widget'));
    if (!widgets.length) {
      console.log(`No widgets found in ${view.id} to animate out.`);
      return resolve();
    }
    console.log(`Animating out ${widgets.length} widgets for ${view.id}`);

    const shuffledWidgets = widgets.sort(() => Math.random() - 0.5);
    let maxDelay = 0;

    shuffledWidgets.forEach(widget => {
      const delay = Math.random() * WIDGET_ANIMATION_DURATION;
      maxDelay = Math.max(maxDelay, delay);

      widget.classList.remove('widget-hidden', 'widget-intro');

      setTimeout(() => {
        widget.classList.add('widget-outro');

        // Set back to hidden state after animation
        widget.addEventListener('animationend', () => {
          widget.classList.remove('widget-outro');
          widget.style.opacity = '0.001'; // Back to initial hidden state
          widget.style.visibility = 'hidden';
        }, { once: true });

      }, WIDGET_BASE_DELAY + delay);
    });

    // Resolve after the longest animation delay + animation duration
    setTimeout(resolve, WIDGET_BASE_DELAY + maxDelay + WIDGET_ANIMATION_DURATION); // Approximate completion
  });
}

// --- Button State Helpers ---

/**
 * Deactivates all 3D buttons.
 */
function deactivateAllButtons() {
  document.querySelectorAll('.btn-3d').forEach(wrapper => {
    wrapper.classList.remove('btn-3d--active');
    const button = wrapper.querySelector('.btn-3d__button');
    if (button) button.setAttribute('aria-selected', 'false');
  });
  console.log('Deactivated all 3D buttons.');
}

/**
 * Activates a specific 3D button.
 * @param {Element} wrapper - The .btn-3d wrapper element to activate.
 */
function activateButton(wrapper) {
  wrapper.classList.add('btn-3d--active');
  const button = wrapper.querySelector('.btn-3d__button');
  if (button) button.setAttribute('aria-selected', 'true');
  console.log(`Activated button: ${wrapper.id || wrapper.dataset.variant}`);
}

// --- Utility ---

/**
 * Gets the currently active view *element*.
 * @returns {Element | null} The active view element or null.
 */
function getActiveScreenElement() {
  // Find based on the 'view--active' class or visibility style
  for (const id of SCREEN_IDS) {
      const screen = document.getElementById(id);
      // Check multiple conditions for robustness
      if (screen && 
          (screen.classList.contains('view--active') || 
           (screen.style.visibility === 'visible' && screen.style.opacity === '1'))) {
          return screen;
      }
  }
  // Fallback: Check based on active button if the above fails
  const activeWrapper = document.querySelector('.btn-3d.btn-3d--active');
  if (activeWrapper && activeWrapper.id) {
      const screenType = activeWrapper.id.replace('-button', '');
      return document.getElementById(`${screenType}-view`);
  }
  return null; // No active screen found
}

// Self-initialize (if needed, but usually called from main.js)
// init3DButtons(); // Removed self-initialization to prevent duplicate initialization


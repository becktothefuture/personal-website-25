/**
 * 3D Button Toggle Module
 * 
 * Handles toggling between 3D buttons, allowing only one to be active at a time.
 * By default, the home-button is set to active if no other button is already active.
 * Controls visibility of corresponding screen sections.
 * Manages staggered animation of widgets when switching views.
 */

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
  const screens = ['home-view', 'portfolio-view', 'contact-view', 'about-view'];
  const missingScreens = screens.filter(id => !document.getElementById(id));
  if (missingScreens.length > 0) {
    console.warn('Missing screen elements:', missingScreens.join(', '));
  }

  // Initialize screen visibility based on active button
  updateScreenVisibility();

  // Add click handlers to all button wrappers
  buttonWrappers.forEach(wrapper => {
    wrapper.addEventListener('click', handleButtonClick);
    
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
    contact: document.getElementById('contact-view'),
    about: document.getElementById('about-view')
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
      w.style.animation = 'none';
      w.classList.remove('widget--startup');
    }
  });
}

// Show widgets with staggered animation
function animateWidgets(screenElement) {
  if (!screenElement) return;
  
  const widgets = screenElement.querySelectorAll('.widget');
  if (widgets.length === 0) return;
  
  const startTimes = new Map();
  
  // Animation speed settings
  const ANIMATION_SPEED = {
    GLOBAL_MULTIPLIER: 2.0,
    WIDGET_ANIMATION: 1.0
  };
  
  // Adjust widget animation speed based on global multiplier
  const animationSpeedMultiplier = ANIMATION_SPEED.GLOBAL_MULTIPLIER * ANIMATION_SPEED.WIDGET_ANIMATION;
  const maxStartDelay = 2000 / animationSpeedMultiplier;
  
  widgets.forEach(w => {
    if (w) {
      w.style.opacity = '0';
      w.style.animation = 'none';
      w.classList.remove('widget--startup');
      // Staggered delay for widget appearance
      startTimes.set(w, performance.now() + getRandom(100, maxStartDelay));
    }
  });
  
  function animateFrame(now) {
    let needsAnotherFrame = false;
    
    widgets.forEach(w => {
      if (!w) return;
      
      if (now >= startTimes.get(w) && !w.classList.contains('widget--startup')) {
        w.classList.add('widget--startup');
        
        // Simplified single animation with duration calculation
        const animationDuration = (1.2 / animationSpeedMultiplier).toFixed(2);
        
        w.style.animation = `widgetIntro ${animationDuration}s cubic-bezier(0.19, 1, 0.22, 1) forwards`;
      } else if (now < startTimes.get(w)) {
        needsAnotherFrame = true;
      }
    });
    
    if (needsAnotherFrame) {
      requestAnimationFrame(animateFrame);
    }
  }
  
  // Start the animation frame loop
  if (widgets.length > 0) {
    requestAnimationFrame(animateFrame);
  }
}

// Animate widgets out with staggered animation
function animateWidgetsOut(screenElement) {
  return new Promise((resolve) => {
    if (!screenElement) {
      resolve();
      return;
    }
    
    const widgets = screenElement.querySelectorAll('.widget');
    if (widgets.length === 0) {
      resolve();
      return;
    }
    
    // Animation speed settings
    const ANIMATION_SPEED = {
      GLOBAL_MULTIPLIER: 2.0,
      WIDGET_ANIMATION: 1.0,
      EXIT_SPEED_MULTIPLIER: 2.0 // Make exit animations twice as fast
    };
    
    // Track when widgets finish animating
    const startTimes = new Map();
    const animatingWidgets = new Set(widgets);
    
    // Adjust widget animation speed based on global multiplier
    const animationSpeedMultiplier = ANIMATION_SPEED.GLOBAL_MULTIPLIER * 
                                     ANIMATION_SPEED.WIDGET_ANIMATION * 
                                     ANIMATION_SPEED.EXIT_SPEED_MULTIPLIER;
    
    // Faster max delay for exit animations
    const maxExitDelay = 1000 / animationSpeedMultiplier;
    
    // Animation duration calculation - shorter for exits
    const animationDuration = (0.5 / animationSpeedMultiplier);
    
    // Calculate total animation time - with enough buffer to ensure all animations complete
    const totalAnimationTime = animationDuration * 1000 + maxExitDelay + 100;
    
    // Set up staggered start times
    widgets.forEach(w => {
      if (w) {
        // Use random delays for staggered effect but ensure they're shorter
        startTimes.set(w, performance.now() + getRandom(50, maxExitDelay));
      }
    });
    
    // Safety timeout - resolve after max expected duration
    const safetyTimeout = setTimeout(() => {
      resolve();
    }, totalAnimationTime);
    
    function animateExitFrame(now) {
      let needsAnotherFrame = false;
      
      // Process each widget that should start animating at this frame
      widgets.forEach(w => {
        if (!w || !animatingWidgets.has(w)) return;
        
        if (now >= startTimes.get(w)) {
          // Apply exit animation
          w.style.animation = `widgetOutro ${animationDuration.toFixed(2)}s cubic-bezier(0.19, 1, 0.22, 1) forwards`;
          animatingWidgets.delete(w);
        } else {
          needsAnotherFrame = true;
        }
      });
      
      // Continue animation frame loop if needed
      if (needsAnotherFrame) {
        requestAnimationFrame(animateExitFrame);
      } else {
        // All widgets have started their exit animation
        // Wait for the longest animation to complete
        setTimeout(() => {
          clearTimeout(safetyTimeout);
          resolve();
        }, animationDuration * 1000 + 50);
      }
    }
    
    // Start the animation frame loop
    if (widgets.length > 0) {
      requestAnimationFrame(animateExitFrame);
    } else {
      resolve();
    }
  });
}

// Generate random number in a range
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

// Remove the keyframe injection function as it's now in the stylesheet

// Initialize when imported
init3DButtons();

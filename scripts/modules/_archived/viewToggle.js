// viewToggle.js

// This module toggles between three views without removing them from the DOM.
// It uses CSS classes to control both visual appearance and interactivity,
// ensuring that Webflow's Lottie animations (which initialise on page load) work correctly.
// It also updates button classes to reflect the active state.

// Debounce function: limits how often a function can fire.
// Every time the debounced function is called, it resets a timer,
// ensuring that the wrapped function only runs after the specified wait time has elapsed.
function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    };
  }
  
  // Export a function to initialise the view toggling behaviour.
  export default function initViewToggle() {
    console.log("Initializing view toggle system");
    
    // Cache DOM elements for the views.
    const views = {
      home: document.getElementById('home-view'),
      contact: document.getElementById('contact-view'),
      portfolio: document.getElementById('portfolio-view')
    };
  
    // Cache DOM elements for the buttons.
    const buttons = {
      home: document.getElementById('home-button'),
      contact: document.getElementById('contact-button'),
      portfolio: document.getElementById('portfolio-button')
    };
    
    // Log if buttons and views were found
    console.log("Views found:", Object.keys(views).filter(key => views[key]));
    console.log("Buttons found:", Object.keys(buttons).filter(key => buttons[key]));
    
    // Check if all elements were found, log warnings if not
    Object.keys(views).forEach(key => {
      if (!views[key]) {
        console.warn(`View element with ID '${key}-view' not found`);
      }
    });
    
    Object.keys(buttons).forEach(key => {
      if (!buttons[key]) {
        console.warn(`Button element with ID '${key}-button' not found`);
      }
    });
  
    /**
     * Toggle the visibility of views and update active button styling.
     * @param {string} viewName - The key of the view to show ('home', 'contact', or 'portfolio').
     *
     * For the chosen view, we add the 'view--active' class (making it visible and interactive)
     * and remove 'view--hidden'. All other views receive 'view--hidden' (hiding them visually).
     *
     * Similarly, the corresponding button gets the 'btn-3d--active' class, while other buttons have it removed.
     */
    function toggleView(viewName) {
      console.log(`Toggling to ${viewName} view`);
      
      // Update view classes.
      Object.keys(views).forEach(key => {
        if (views[key]) {
          if (key === viewName) {
            views[key].classList.add('view--active');
            views[key].classList.remove('view--hidden');
            console.log(`${key} view activated`);
          } else {
            views[key].classList.remove('view--active');
            views[key].classList.add('view--hidden');
            console.log(`${key} view hidden`);
          }
        }
      });
  
      // Update button classes.
      Object.keys(buttons).forEach(key => {
        if (buttons[key]) {
          if (key === viewName) {
            buttons[key].classList.add('btn-3d--active');
            console.log(`${key} button activated`);
          } else {
            buttons[key].classList.remove('btn-3d--active');
            console.log(`${key} button deactivated`);
          }
        }
      });
    }
  
    // Create a debounced version of toggleView with a 300ms wait time.
    const debouncedToggleView = debounce(toggleView, 100);
  
    // Attach click event listeners to each button.
    // The debounced function prevents multiple rapid toggles.
    Object.keys(buttons).forEach(key => {
      if (buttons[key]) {
        console.log(`Adding click listener to ${key} button`);
        buttons[key].addEventListener('click', () => {
          console.log(`${key} button clicked`);
          debouncedToggleView(key);
        });
      }
    });
  
    // Set the initial view to home view after Webflow has loaded the page.
    // This ensures that all Lottie animations in every view are initialised on page load.
    console.log("Setting initial view to 'home'");
    toggleView('home');
  }
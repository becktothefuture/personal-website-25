/**
 * 3D Button Toggle Module
 * 
 * Handles toggling between 3D buttons, allowing only one to be active at a time.
 * By default, the home-button is set to active.
 */

export function init3DButtons() {
  const buttonWrappers = document.querySelectorAll('.btn-3D');
  
  // Set home button as active by default
  const homeButton = document.getElementById('home-button');
  if (homeButton) {
    // Find the button element inside the wrapper and add active class to it
    const homeButtonElement = homeButton.querySelector('.btn-3D__button');
    if (homeButtonElement) {
      homeButtonElement.classList.add('active');
    }
  }

  buttonWrappers.forEach(wrapper => {
    wrapper.addEventListener('click', function() {
      // Find the button element inside this wrapper
      const buttonElement = this.querySelector('.btn-3D__button');
      
      if (!buttonElement) return;
      
      // If already active, do nothing
      if (buttonElement.classList.contains('active')) return;

      // Remove 'active' from all button elements
      document.querySelectorAll('.btn-3D__button').forEach(btn => {
        btn.classList.remove('active');
      });

      // Activate the clicked one
      buttonElement.classList.add('active');
    });
  });
  
  console.log('3D button toggle initialized');
}

// Initialize immediately when imported
init3DButtons();

/**
 * 3D Button Toggle Module
 * 
 * Handles toggling between 3D buttons, allowing only one to be active at a time.
 * By default, the home-button is set to active if no other button is already active.
 */

export function init3DButtons() {
  const buttonWrappers = document.querySelectorAll('.btn-3D');
  const activeButtonExists = document.querySelector('.btn-3D__button.btn--active');
  
  // Set home button as active by default only if no active button exists yet
  if (!activeButtonExists) {
    const homeButton = document.getElementById('home-button');
    if (homeButton) {
      const homeButtonElement = homeButton.querySelector('.btn-3D__button');
      if (homeButtonElement) {
        homeButtonElement.classList.add('btn--active');
      }
    }
  }

  buttonWrappers.forEach(wrapper => {
    wrapper.addEventListener('click', function() {
      // Find the button element inside this wrapper
      const buttonElement = this.querySelector('.btn-3D__button');
      
      if (!buttonElement) return;
      
      // If already active, do nothing
      if (buttonElement.classList.contains('btn--active')) return;

      // Remove 'btn--active' from all button elements
      document.querySelectorAll('.btn-3D__button').forEach(btn => {
        btn.classList.remove('btn--active');
      });

      // Activate the clicked one
      buttonElement.classList.add('btn--active');
    });
  });
  
  console.log('3D button toggle initialized');
}

// Initialize immediately when imported
init3DButtons();

/**
 * Enhanced diffusion effect that responds subtly to mouse movement
 * while maintaining constant animation to feel alive
 */
document.addEventListener('DOMContentLoaded', () => {
  const diffusionElements = document.querySelectorAll('.diffusion-noise');
  
  // Add subtle mouse movement response without requiring hover
  document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    diffusionElements.forEach(element => {
      // Very subtle shift based on mouse position (1-3% movement)
      const shiftX = (mouseX - 0.5) * 3;
      const shiftY = (mouseY - 0.5) * 3;
      
      // Apply subtle transform based on mouse position
      element.style.transform = `translate(${shiftX}%, ${shiftY}%) scale(${1 + mouseY * 0.04})`;
    });
  });
  
  // Optional: Add randomized "life" to each diffusion element
  diffusionElements.forEach(element => {
    // Add slight random timing offset to each element to prevent uniform animation
    const randomDelay = Math.random() * -8;
    element.style.animationDelay = `${randomDelay}s`;
  });
});

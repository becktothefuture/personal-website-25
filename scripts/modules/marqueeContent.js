/**
 * Marquee Content Module
 * --------------------
 * Handles scrolling marquee text animations.
 * 
 * This module:
 * - Duplicates content within marquee elements for continuous scrolling
 * - Identifies all elements with the 'marquee' class
 * - Creates clones of the content to ensure seamless looping
 * - Works with CSS animations to create the scrolling effect
 */

console.log('Marquee Content Duplicator Initialised');

// Duplicate marquee content for continuous scrolling
export function initMarqueeContent() {
  const marqueeContents = document.querySelectorAll('.marquee-content');
  marqueeContents.forEach(container => {
    // Get all child elements of the marquee-content container
    const children = Array.from(container.children);
    
    // Clone each child and append it back to the container
    children.forEach(child => {
      const clone = child.cloneNode(true);
      container.appendChild(clone);
    });
  });
}
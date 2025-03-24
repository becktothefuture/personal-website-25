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
    const marquees = document.querySelectorAll('.marquee');
    marquees.forEach(marquee => {
      const marqueeContent = marquee.querySelector('.marquee-content');
      if (marqueeContent) {
        // Duplicate the element by cloning it and appending as a sibling.
        const clone = marqueeContent.cloneNode(true);
        marquee.appendChild(clone);
      }
    });
  }
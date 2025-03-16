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
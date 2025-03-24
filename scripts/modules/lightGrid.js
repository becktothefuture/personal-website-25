/**
 * Light Grid Module
 * 
 * Creates animated grid of circles that flicker with randomized timing.
 * This module finds elements with the class 'light-grid' and populates them
 * with animated circle elements based on data-rows and data-columns attributes.
 * 
 * @module lightGrid
 * 
 * @example
 * // HTML structure:
 * // <div class="light-grid" data-rows="5" data-columns="5"></div>
 * 
 * import { initLightGrids } from './modules/lightGrid.js';
 * initLightGrids();
 * 
 * @function initLightGrids
 * @description Initializes all light grid elements on the page by:
 *   1. Creating circle elements inside each .light-grid container based on data attributes
 *   2. Applying randomized flickering animations to each circle
 * @returns {void}
 */


console.log('Light grid module intialized');

export function initLightGrids() {
    document.querySelectorAll('.light-grid').forEach(grid => {
        const rows = parseInt(grid.getAttribute('data-rows'), 10) || 5;
        const cols = parseInt(grid.getAttribute('data-columns'), 10) || 5;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const circle = document.createElement('div');
                circle.classList.add('light-grid__circle');
                grid.appendChild(circle);
            }
        }
    });

    const dots = document.querySelectorAll('.light-grid__circle');
    const params = {
        baseDuration: 16000,  
        durationVar: 1000,   
        maxDelay: 6000       
    };

    dots.forEach(dot => {
        const duration = params.baseDuration + 
                       Math.random() * params.durationVar;
        const delay = Math.random() * params.maxDelay;
        
        dot.style.animation = 
            `flicker ${duration}ms steps(4, jump-none) ${delay}ms infinite`;
    });
}


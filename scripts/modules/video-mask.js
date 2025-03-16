console.log("Video mask initialized");
import { config } from "./config.js";


export function initVideoMask() {
    let resizeTimer;

    function updateMask() {
        const target = document.querySelector('.display__top');
        const rect = target.getBoundingClientRect();
        const borderRadius = getComputedStyle(target).borderRadius;
        
        requestAnimationFrame(() => {
            const blurOverlay = document.querySelector('.blur-overlay');
            const maskRect = document.querySelector('.mask-rect');
            
            // Update mask rectangle position and size
            maskRect.setAttribute('x', rect.x);
            maskRect.setAttribute('y', rect.y);
            maskRect.setAttribute('width', rect.width);
            maskRect.setAttribute('height', rect.height);
            maskRect.setAttribute('rx', borderRadius);
            
            // Apply mask to blur overlay
            blurOverlay.style.maskImage = 'url(#hole-mask)';
            blurOverlay.style.webkitMaskImage = 'url(#hole-mask)';
        });
    }

    // Initial update with slight delay to ensure DOM is ready
    setTimeout(updateMask, 100);

    // Update on resize with debouncing
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateMask, 100);
    });

 
}
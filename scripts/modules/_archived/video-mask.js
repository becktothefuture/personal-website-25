/**
 * Video Mask Module
 * 
 * This module creates a dynamic mask effect for video elements.
 * It tracks elements with the class 'display__top' and creates a
 * mask that matches their position, size, and border radius, 
 * applying this mask to a blur overlay.
 * 
 * Dependencies: config.js
 */

console.log("Video mask initialized");

export function initVideoMask() {
    let resizeTimer;
    const videoElements = document.querySelectorAll('.glass-video');
    
    // Apply pulsate-element class to all video elements
    videoElements.forEach(video => {
        video.classList.add('pulsate-element');
    });

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
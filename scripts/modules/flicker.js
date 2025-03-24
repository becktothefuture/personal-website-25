/**
 * Flicker Module
 * 
 * This module handles the "breathing" animation effect for widget elements.
 * It applies a consistent animation duration (3 seconds) with randomized
 * starting delays to create a natural, staggered effect across multiple
 * elements on the page.
 * 
 * The module uses CSS custom properties to control the animation timing
 * which can be targeted in the stylesheet with --breathe-duration and
 * --animation-delay variables.
 */

export function initFlicker() {
    const flickerElements = document.querySelectorAll('.widget');

    // Function to set fixed 'breathe' animation duration
    function setBreatheDuration(element) {
        const fixedDuration = 3; // Fixed duration in seconds
        element.style.setProperty('--breathe-duration', `${fixedDuration}s`);
    }

    // Function to set different animation delay for each widget
    function setAnimationDelay(element) {
        const randomDelay = Math.random() * 2; // Random delay between 0 and 2 seconds
        element.style.setProperty('--animation-delay', `${randomDelay}s`);
    }

    // Apply fixed duration and different delay to each flicker element
    flickerElements.forEach((element) => {
        setBreatheDuration(element);
        setAnimationDelay(element);
    });
}
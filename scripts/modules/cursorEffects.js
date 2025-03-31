/**
 * @module cursorEffects
 * @description Handles cursor-based animation effects on page elements, creating an interactive 3D experience.
 * The module tracks mouse position and applies rotational, perspective, and translation effects to specified 
 * DOM elements. Animation intensities can be adjusted through constants at the top of the module.
 * 
 * @requires cursorTracker - Provides mouse position tracking as percentage values
 * 
 * @constant {number} ROTATION_FACTOR - Controls the intensity of rotation effects
 * @constant {number} PERSPECTIVE_SHIFT_FACTOR - Controls the intensity of perspective shift effects
 * @constant {number} VIDEO_TRANSLATE_FACTOR - Controls the intensity of video translation effects
 * 
 * @function debounce - Limits the frequency of function calls
 * @function updateAnimations - Calculates and applies transformations based on cursor position
 * @function animationLoop - Manages the animation frame loop
 * @function initCursorEffects - Initializes the cursor effects module and starts the animation loop
 */




console.log("Cursor effects module initialised");

import { cursorXPercent, cursorYPercent } from './cursorTracker.js';

// Constants for animation intensity
const ROTATION_FACTOR = 10; // Adjust for desired rotation intensity
const PERSPECTIVE_SHIFT_FACTOR = 5; // Adjust for perspective shift intensity
const VIDEO_TRANSLATE_FACTOR = 2; // Adjust for video translation intensity

// DOM elements
let pageInner, depthWrapper, glassVideo;

// Debounce function to limit update frequency
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

function updateAnimations() {
  if (!pageInner || !depthWrapper || !glassVideo) return;

  // Calculate rotation values based on cursor position
  const rotateX = (cursorYPercent - 0.5) * 2 * ROTATION_FACTOR; // Map 0-1 to -1 to 1
  const rotateY = (cursorXPercent - 0.5) * 2 * ROTATION_FACTOR;

  // Calculate perspective origin shift based on cursor position
  const perspectiveShiftX = (cursorXPercent - 0.5) * 2 * PERSPECTIVE_SHIFT_FACTOR;
  const perspectiveShiftY = (cursorYPercent - 0.5) * 2 * PERSPECTIVE_SHIFT_FACTOR;

  // Calculate video translation based on cursor position
    const translateX = (cursorXPercent - 0.5) * 2 * VIDEO_TRANSLATE_FACTOR;
    const translateY = (cursorYPercent - 0.5) * 2 * VIDEO_TRANSLATE_FACTOR;

  // Apply transformations
  pageInner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  depthWrapper.style.perspectiveOrigin = `${50 + perspectiveShiftX}% ${50 + perspectiveShiftY}%`;
  glassVideo.style.transform = `translate(${translateX}%, ${translateY}%)`;
}

// Debounced animation update function
const debouncedUpdateAnimations = debounce(updateAnimations, 16); // ~60 FPS

function animationLoop() {
  debouncedUpdateAnimations();
  requestAnimationFrame(animationLoop);
}

export function initCursorEffects() {
  console.log("Initializing cursor effects...");

  // Get references to DOM elements
  pageInner = document.querySelector('.page__inner');
  depthWrapper = document.querySelector('.depth-wrapper');
  glassVideo = document.querySelector('.glass-video');

  if (!pageInner || !depthWrapper || !glassVideo) {
    console.error("Failed to initialize cursor effects: Missing DOM elements");
    return;
  }

  // Start animation loop
  animationLoop();

  console.log("Cursor effects initialized successfully");
}
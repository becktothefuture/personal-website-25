/**
 * Cursor Tracker Module
 * --------------------
 * Tracks cursor movements, speed, position, clicks and distance traveled.
 * 
 * This module:
 * - Calculates cursor speed in multiple units (px/s, km/h, mph)
 * - Tracks total cursor travel distance with unit conversion
 * - Maintains click count statistics
 * - Applies smooth animation to cursor positioning
 * - Uses requestAnimationFrame for optimized performance
 * - Provides minimap cursor visualization
 * - Exports cursor position data for use by other modules
 */

// ------------------------------------------------------------
// Annotations:
// This code tracks cursor movements, click counts and distance traveled.
// It uses requestAnimationFrame for continuous updates, performance.now() 
// for precise timing, and precomputed DPI for distance calculations.
// ------------------------------------------------------------

// **Constants**
const MPS_TO_KMH = 3.6;
const MPS_TO_MILES_H = 2.23694;
const CM_PER_INCH = 2.54;
const INCHES_PER_MILE = 63360;
const SMOOTH_FACTOR = 0.1; 
const SPEED_EASE_DURATION = 1; // seconds

// **DYNAMIC VARIABLES**
let cursorXPercent = 0;
let cursorYPercent = 0;

let prevMouseX = null,
    prevMouseY = null,
    prevTime = null;
let speed = 0,
    displayedSpeed = 0,
    totalDistance = 0;

    let clickCount = 0;
let speedDecayStart = null,
    initialSpeed = 0;
let smoothedSpeedKmh = 0,
    smoothedSpeedMilesH = 0;
let smoothedDistanceMeters = 0,
    smoothedDistanceInchesTotal = 0,
    smoothedDistanceMiles = 0;

// **DPI Calculation**
let dpi_x = window.devicePixelRatio ? 96 * window.devicePixelRatio : 96;
dpi_x *= 5 / 6.5; // Adjusted based on measurement

// **DOM Elements**
let miniMap, cursorDot;
let speedValueM, speedValueMiles, speedValuePx;
let clickCounterElement, distanceValueM, distanceValueMiles;
let cursorValueElement;

// Initialize DOM elements
function initializeElements() {
  // Get references to minimap and cursor dot
  miniMap = document.getElementById('mini-map');
  cursorDot = document.getElementById('cursor-dot');
  
  // Get references to the tracking display elements
  speedValueM = document.getElementById('speed-value-m');
  speedValueMiles = document.getElementById('speed-value-miles');
  speedValuePx = document.getElementById('speed-value-px');
  
  clickCounterElement = document.getElementById('click-counter');
  distanceValueM = document.getElementById('distance-value-m');
  distanceValueMiles = document.getElementById('distance-value-miles');
  
  // Get reference to cursor value element
  cursorValueElement = document.getElementById('cursor-value');

  return true;
}

/***********
 * MINIMAP *
 ***********/

function updateCursorPosition() {
  if (!cursorDot) return;
  
  // Map 0% to -50% and 100% to 50%
  const xTranslate = cursorXPercent * 100 - 50;
  const yTranslate = cursorYPercent * 100 - 50;
  
  cursorDot.style.transform = `translate(${xTranslate}%, ${yTranslate}%)`;
}

// Update cursor value display with formatted percentages
function updateCursorValueDisplay() {
  if (!cursorValueElement) return;
  
  // Format percentages to 2 decimal places
  const xFormatted = (cursorXPercent * 100).toFixed(2);
  const yFormatted = (cursorYPercent * 100).toFixed(2);
  
  // Update the element with formatted text
  cursorValueElement.textContent = `X: ${xFormatted}%, Y: ${yFormatted}%`;
}



// Mouse speed calculations
function updateMouseSpeed() {
  const currentTime = performance.now();
  // Ease-out for displayed mouse speed
  if (speed > 0) {
    displayedSpeed = speed;
    speedDecayStart = currentTime;
    initialSpeed = speed;
  } else if (displayedSpeed > 0) {
    const elapsed = (currentTime - speedDecayStart) / 1000;
    if (elapsed < SPEED_EASE_DURATION) {
      const t = elapsed / SPEED_EASE_DURATION;
      displayedSpeed = initialSpeed * (1 - t ** 3);
    } else {
      displayedSpeed = 0;
    }
  }

  // Convert pixel/s to m/s
  const speedMps = displayedSpeed / ((dpi_x / 5) * 100);
  const speedKmh = speedMps * MPS_TO_KMH;
  const speedMilesH = speedMps * MPS_TO_MILES_H;

  // Smooth mouse speed
  if (displayedSpeed > 0) {
    smoothedSpeedKmh += (speedKmh - smoothedSpeedKmh) * SMOOTH_FACTOR;
    smoothedSpeedMilesH += (speedMilesH - smoothedSpeedMilesH) * SMOOTH_FACTOR;
  } else {
    smoothedSpeedKmh = 0;
    smoothedSpeedMilesH = 0;
  }
}

// Distance calculations
function updateDistanceMetrics() {
  // Distance calculations
  const distanceInches = totalDistance / dpi_x;
  const distanceMeters = (distanceInches * CM_PER_INCH) / 100;
  const distanceMilesVal = distanceInches / INCHES_PER_MILE;

  smoothedDistanceMeters += (distanceMeters - smoothedDistanceMeters) * SMOOTH_FACTOR;
  smoothedDistanceInchesTotal += (distanceInches - smoothedDistanceInchesTotal) * SMOOTH_FACTOR;
  smoothedDistanceMiles += (distanceMilesVal - smoothedDistanceMiles) * SMOOTH_FACTOR;
}

// Update DOM elements with tracking data
function updateDebugDisplay() {
  // Update speed values
  if (speedValueM) speedValueM.textContent = smoothedSpeedKmh.toFixed(2);
  if (speedValueMiles) speedValueMiles.textContent = smoothedSpeedMilesH.toFixed(2);
  if (speedValuePx) speedValuePx.textContent = displayedSpeed.toFixed(1);
  
  // Update click counter and distance values
  if (clickCounterElement) clickCounterElement.textContent = clickCount.toString();
  if (distanceValueM) distanceValueM.textContent = smoothedDistanceMeters.toFixed(2);
  if (distanceValueMiles) distanceValueMiles.textContent = smoothedDistanceMiles.toFixed(4);
}


// **Mouse tracking – Event Handlers**
function setupEventHandlers() {
  function updateMouseMetrics(x, y, currentTime) {
    if (prevMouseX !== null && prevMouseY !== null && prevTime !== null) {
      const dx = x - prevMouseX;
      const dy = y - prevMouseY;
      const dt = (currentTime - prevTime) / 1000;

      if (dt > 0) {
        const distance = Math.hypot(dx, dy);
        speed = distance / dt;
        totalDistance += distance;
      }
    }
  }

  // Event Listeners
  document.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const currentTime = performance.now();

    // Calculate percentages
    cursorXPercent = mouseX / window.innerWidth;
    cursorYPercent = mouseY / window.innerHeight;

    updateMouseMetrics(mouseX, mouseY, currentTime);

    // Store current values for next frame
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    prevTime = currentTime;
  });

  // Touch event handlers for mobile devices
  document.addEventListener("touchmove", (e) => {
    // Prevent scrolling while tracking touch
    e.preventDefault();
    
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const touchX = touch.clientX;
      const touchY = touch.clientY;
      const currentTime = performance.now();

      // Calculate percentages
      cursorXPercent = touchX / window.innerWidth;
      cursorYPercent = touchY / window.innerHeight;

      updateMouseMetrics(touchX, touchY, currentTime);

      // Store current values for next frame
      prevMouseX = touchX;
      prevMouseY = touchY;
      prevTime = currentTime;
    }
  }, { passive: false });

  document.addEventListener("touchstart", (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const touchX = touch.clientX;
      const touchY = touch.clientY;
      
      // Set initial position but don't calculate speed yet
      prevMouseX = touchX;
      prevMouseY = touchY;
      prevTime = performance.now();
      
      // Update cursor position immediately on touch start
      cursorXPercent = touchX / window.innerWidth;
      cursorYPercent = touchY / window.innerHeight;
      
      // Count touch start as a click
      clickCount++;
    }
  });

  document.addEventListener("touchend", () => {
    // Handle touch end similar to mouseout
    speed = 0;
    prevMouseX = null;
    prevMouseY = null;
    prevTime = null;
  });

  // Reset tracking when mouse leaves window
  document.addEventListener("mouseout", () => {
    speed = 0;
    prevMouseX = null;
    prevMouseY = null;
    prevTime = null;
  });

  // Click tracking - keep the existing click handler
  document.addEventListener("click", () => clickCount++);
  // Remove duplicate touchstart click counter as we've integrated it above
}

// **Animation loop**
function animationLoop() {
  updateCursorPosition();
  updateMouseSpeed();
  updateDistanceMetrics();
  updateDebugDisplay();
  updateCursorValueDisplay(); // Add call to update cursor value display
  requestAnimationFrame(animationLoop);
}

// **Initialization**
export function initcursorTracker() {
  console.log("Initializing mouse tracker...");

  if (!initializeElements()) {
    console.error("Failed to initialize mouse tracker");
    return;
  }

  setupEventHandlers();
  animationLoop();

  console.log("Mouse tracker initialized successfully");
}

export { cursorXPercent, cursorYPercent };
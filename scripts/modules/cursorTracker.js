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
let miniMap = null, cursorDot = null;
let clickCounterElement = null, distanceValueM = null, distanceValueMiles = null;
let cursorValueElement = null;

// Initialize DOM elements
function initializeElements() {
  // Elements will be queried lazily in update functions
  return true; // Indicate successful (potential) initialization
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
  // Lazily query the element if not found yet
  if (!cursorValueElement) cursorValueElement = document.getElementById('cursor-value');
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

// Format speed values to "000.00" format, capped at 999.99
function formatSpeed(speed) {
  // Cap the speed at 999.99
  const cappedSpeed = Math.min(speed, 999.99);
  // Format as 000.00 with trailing zeros
  return cappedSpeed.toFixed(2).padStart(6, '0');
}

// Update DOM elements with tracking data
function updateDebugDisplay() {
  // Lazily query elements if not found yet
  if (!clickCounterElement) clickCounterElement = document.getElementById('click-counter');
  if (!distanceValueM) distanceValueM = document.getElementById('distance-value-m');
  if (!distanceValueMiles) distanceValueMiles = document.getElementById('distance-value-miles');

  // Update speed values with formatted values
  if (clickCounterElement) clickCounterElement.textContent = clickCount.toString();
  // Also format distance values consistently
  if (distanceValueM) distanceValueM.textContent = formatSpeed(smoothedDistanceMeters);
  if (distanceValueMiles) distanceValueMiles.textContent = formatSpeed(smoothedDistanceMiles);
}


// **Mouse tracking – Event Handlers**
function setupEventHandlers() {
  // Throttle mousemove and touchmove events
  let mouseMoveTicking = false;
  let lastMouseMoveEvent = null;
  let touchMoveTicking = false;
  let lastTouchMoveEvent = null;
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
  document.addEventListener("mousemove", e => {
    lastMouseMoveEvent = e;
    if (!mouseMoveTicking) {
      mouseMoveTicking = true;
      requestAnimationFrame(() => {
        const ev = lastMouseMoveEvent;
        const mouseX = ev.clientX;
        const mouseY = ev.clientY;
        const currentTime = performance.now();
        // Calculate percentages
        cursorXPercent = mouseX / window.innerWidth;
        cursorYPercent = mouseY / window.innerHeight;
        updateMouseMetrics(mouseX, mouseY, currentTime);
        // Store current values for next frame
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        prevTime = currentTime;
        mouseMoveTicking = false;
      });
    }
  });

  // Touch event handlers for mobile devices
  document.addEventListener("touchmove", e => {
    // Prevent scrolling while tracking touch
    e.preventDefault();
    lastTouchMoveEvent = e;
    if (!touchMoveTicking) {
      touchMoveTicking = true;
      requestAnimationFrame(() => {
        const ev = lastTouchMoveEvent;
        if (ev.touches.length > 0) {
          const touch = ev.touches[0];
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
        touchMoveTicking = false;
      });
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
  // Lazily query minimap elements if not found yet
  if (!miniMap) miniMap = document.getElementById('mini-map');
  if (!cursorDot) cursorDot = document.getElementById('cursor-dot');

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



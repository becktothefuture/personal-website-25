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
let isInitialized = false; // Flag to prevent multiple initializations

// Initialize DOM elements lazily
function ensureElementsInitialized() {
  if (!miniMap) miniMap = document.getElementById('mini-map');
  if (!cursorDot) cursorDot = document.getElementById('cursor-dot');
  if (!clickCounterElement) clickCounterElement = document.getElementById('click-counter');
  if (!distanceValueM) distanceValueM = document.getElementById('distance-value-m');
  if (!distanceValueMiles) distanceValueMiles = document.getElementById('distance-value-miles');
  if (!cursorValueElement) cursorValueElement = document.getElementById('cursor-value');
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
  // Element ensured by animationLoop
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
  // Elements ensured by animationLoop
  // Update speed values with formatted values
  if (clickCounterElement) clickCounterElement.textContent = clickCount.toString();
  // Also format distance values consistently
  if (distanceValueM) distanceValueM.textContent = formatSpeed(smoothedDistanceMeters);
  if (distanceValueMiles) distanceValueMiles.textContent = formatSpeed(smoothedDistanceMiles);
}


// **Shared Pointer Move Logic**
function handlePointerMove(x, y) {
  const currentTime = performance.now();
  
  // Calculate percentages
  cursorXPercent = x / window.innerWidth;
  cursorYPercent = y / window.innerHeight;

  // Calculate speed and distance metrics
  if (prevMouseX !== null && prevMouseY !== null && prevTime !== null) {
    const dx = x - prevMouseX;
    const dy = y - prevMouseY;
    const dt = (currentTime - prevTime) / 1000;

    if (dt > 0) {
      const distance = Math.hypot(dx, dy);
      speed = distance / dt; // Raw speed calculation
      totalDistance += distance;
    } else {
      speed = 0; // Avoid division by zero if dt is too small or zero
    }
  } else {
      speed = 0; // No previous point to calculate speed from
  }

  // Store current values for next frame/calculation
  prevMouseX = x;
  prevMouseY = y;
  prevTime = currentTime;
}

// **Mouse tracking – Event Handlers**
function setupEventHandlers() {
  let ticking = false;
  let lastEvent = null;

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (lastEvent) {
          if (lastEvent.type === 'mousemove') {
            handlePointerMove(lastEvent.clientX, lastEvent.clientY);
          } else if (lastEvent.type === 'touchmove' && lastEvent.touches.length > 0) {
            const touch = lastEvent.touches[0];
            handlePointerMove(touch.clientX, touch.clientY);
          }
          lastEvent = null; // Clear last event after processing
        }
        ticking = false;
      });
    }
    ticking = true;
  }

  // Event Listeners
  document.addEventListener("mousemove", e => {
    lastEvent = e;
    requestTick();
  });

  // Touch event handlers for mobile devices
  document.addEventListener("touchmove", e => {
    // Prevent scrolling while tracking touch
    e.preventDefault();
    lastEvent = e;
    requestTick();
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
      // Update click counter display immediately
      if (clickCounterElement) clickCounterElement.textContent = clickCount.toString();
    }
  });

  document.addEventListener("touchend", () => {
    // Handle touch end similar to mouseout
    speed = 0; // Reset speed immediately
    // Keep prevX/Y/Time for potential immediate next move, reset handled by mouseout/next move
  });

  // Reset tracking when mouse leaves window
  document.addEventListener("mouseout", (e) => {
    // Check if the mouse truly left the window, not just moving over child elements
    if (!e.relatedTarget && !e.toElement) {
        speed = 0;
        // Consider resetting prevMouseX/Y/Time here if needed, but might cause jump on re-entry
        // prevMouseX = null;
        // prevMouseY = null;
        // prevTime = null;
    }
  });

  // Click tracking
  document.addEventListener("click", () => {
      clickCount++;
      // Update click counter display immediately
      if (clickCounterElement) clickCounterElement.textContent = clickCount.toString();
  });
}


// **Animation loop**
function animationLoop() {
  // Ensure DOM elements are available
  ensureElementsInitialized();

  // Update calculations
  updateMouseSpeed(); // Updates displayedSpeed based on raw speed
  updateDistanceMetrics();

  // Update visuals
  updateCursorPosition();
  updateDebugDisplay();
  updateCursorValueDisplay(); 

  // Log cursor position
  console.log(`Cursor Position: X=${(cursorXPercent * 100).toFixed(2)}%, Y=${(cursorYPercent * 100).toFixed(2)}%`);
  
  requestAnimationFrame(animationLoop);
}

// **Initialization**
export function initcursorTracker() {
  if (isInitialized) {
      console.log("Mouse tracker already initialized.");
      return;
  }
  console.log("Initializing mouse tracker...");

  // Initial check for essential elements (optional, depends on requirements)
  // ensureElementsInitialized(); 

  setupEventHandlers();
  animationLoop();

  isInitialized = true; // Set flag
  console.log("Mouse tracker initialized successfully");
}

export { cursorXPercent, cursorYPercent };



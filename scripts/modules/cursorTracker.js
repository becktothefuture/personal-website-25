/**
 * Cursor Tracker Module
 * --------------------
 * Tracks cursor movements, clicks and distance traveled.
 *
 * This module:
 * - Tracks total cursor travel distance with unit conversion
 * - Maintains click count statistics
 * - Uses requestAnimationFrame for optimized performance
 * - Exports cursor position data for use by other modules
 */

// ------------------------------------------------------------
// Annotations:
// This code tracks cursor movements, click counts and distance traveled.
// It uses requestAnimationFrame for continuous updates, performance.now()
// for precise timing, and precomputed DPI for distance calculations.
// ------------------------------------------------------------

// **Constants**
const CM_PER_INCH = 2.54;
const INCHES_PER_MILE = 63360;

// **DYNAMIC VARIABLES**
let cursorXPercent = 0;
let cursorYPercent = 0;

let prevMouseX = null,
    prevMouseY = null,
    prevTime = null;
let totalDistance = 0;

let clickCount = 0;

let currentDistanceMeters = 0;
let currentDistanceMiles = 0;

// **DPI Calculation**
let dpi_x = window.devicePixelRatio ? 96 * window.devicePixelRatio : 96;
dpi_x *= 5 / 6.5; // Adjusted based on measurement

// **DOM Elements**
let clickCounterElement = null, distanceValueM = null, distanceValueMiles = null;
let isInitialized = false; // Flag to prevent multiple initializations

// Initialize DOM elements lazily
function ensureElementsInitialized() {
  if (!clickCounterElement) clickCounterElement = document.getElementById('click-counter');
  if (!distanceValueM) distanceValueM = document.getElementById('distance-value-m');
  if (!distanceValueMiles) distanceValueMiles = document.getElementById('distance-value-miles');
}

// Distance calculations
function updateDistanceMetrics() {
  const distanceInches = totalDistance / dpi_x;
  currentDistanceMeters = (distanceInches * CM_PER_INCH) / 100;
  currentDistanceMiles = distanceInches / INCHES_PER_MILE;
}

// Format values to "000.00" format, capped at 999.99
function formatValue(value) {
  const cappedValue = Math.min(value, 999.99);
  return cappedValue.toFixed(2).padStart(6, '0');
}

// Update DOM elements with tracking data
function updateDebugDisplay() {
  if (clickCounterElement) clickCounterElement.textContent = clickCount.toString();
  if (distanceValueM) distanceValueM.textContent = formatValue(currentDistanceMeters);
  if (distanceValueMiles) distanceValueMiles.textContent = formatValue(currentDistanceMiles);
}

// **Shared Pointer Move Logic**
function handlePointerMove(x, y) {
  const currentTime = performance.now();

  cursorXPercent = x / window.innerWidth;
  cursorYPercent = y / window.innerHeight;

  if (prevMouseX !== null && prevMouseY !== null && prevTime !== null) {
    const dx = x - prevMouseX;
    const dy = y - prevMouseY;
    const dt = (currentTime - prevTime) / 1000;

    if (dt > 0) {
      const distance = Math.hypot(dx, dy);
      totalDistance += distance;
    }
  }

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
          lastEvent = null;
        }
        ticking = false;
      });
    }
    ticking = true;
  }

  document.addEventListener("mousemove", e => {
    lastEvent = e;
    requestTick();
  });

  document.addEventListener("touchmove", e => {
    e.preventDefault();
    lastEvent = e;
    requestTick();
  }, { passive: false });

  document.addEventListener("touchstart", (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const touchX = touch.clientX;
      const touchY = touch.clientY;

      prevMouseX = touchX;
      prevMouseY = touchY;
      prevTime = performance.now();

      cursorXPercent = touchX / window.innerWidth;
      cursorYPercent = touchY / window.innerHeight;
    }
  });

  document.addEventListener("touchend", () => {
    // Handle touch end similar to mouseout
  });

  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget && !e.toElement) {
      // Consider resetting prevMouseX/Y/Time here if needed
    }
  });

  document.addEventListener("click", () => {
    clickCount++;
    if (clickCounterElement) clickCounterElement.textContent = clickCount.toString();
  });
}

// **Animation loop**
function animationLoop() {
  ensureElementsInitialized();

  updateDistanceMetrics();

  updateDebugDisplay();

  requestAnimationFrame(animationLoop);
}

// **Initialization**
export function initcursorTracker() {
  if (isInitialized) {
    return;
  }

  setupEventHandlers();
  animationLoop();

  isInitialized = true;
}

export { cursorXPercent, cursorYPercent };



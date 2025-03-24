/**
 * Mouse Tracker Module
 * --------------------
 * Tracks mouse movements, speed, position, clicks and distance traveled.
 * 
 * This module:
 * - Calculates mouse speed in multiple units (px/s, km/h, mph)
 * - Tracks total mouse travel distance with unit conversion
 * - Maintains click count statistics
 * - Applies smooth animation to cursor positioning
 * - Uses requestAnimationFrame for optimized performance
 * - Provides minimap cursor visualization
 * - Exports mouse position data for use by other modules
 */

// ------------------------------------------------------------
// Annotations:
// This code tracks mouse movements, click counts and distance traveled.
// It uses requestAnimationFrame for continuous updates, performance.now() 
// for precise timing, and precomputed DPI for distance calculations.
// ------------------------------------------------------------

// **Constants**
const MPS_TO_KMH = 3.6;
const MPS_TO_MILES_H = 2.23694;
const CM_PER_INCH = 2.54;
const INCHES_PER_MILE = 63360;
const SMOOTH_FACTOR = 0.1; // Exponential smoothing factor
const SPEED_EASE_DURATION = 1; // seconds

// **DYNAMIC VARIABLES**
let mouseXPercent = 0;
let mouseYPercent = 0;

let prevMouseX = null,
    prevMouseY = null,
    prevTime = null;
let speed = 0,
    displayedSpeed = 0,
    totalDistance = 0;
let cursorX = 0,
    cursorY = 0,
    targetCursorX = 0,
    targetCursorY = 0;
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
let mouseDebugPanel;
let miniMap, cursorDot;

// Initialize DOM elements
function initializeElements() {
  mouseDebugPanel = document.getElementById('mouse-debug');
  miniMap = document.getElementById('mini-map');
  cursorDot = document.getElementById('cursor-dot');
  
  if (!mouseDebugPanel) {
    console.warn("Mouse debug panel element not found. Mouse tracking will proceed but no debug info will be displayed.");
  }

  return true;
}

// Update cursor position
function updateCursorPosition() {
  if (!cursorDot || !miniMap) return;

  cursorX += (targetCursorX - cursorX) * 0.1;
  cursorY += (targetCursorY - cursorY) * 0.1;

  // Use transform for better performance
  cursorDot.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
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

// Update debug display
function updateDebugDisplay() {
  if (!mouseDebugPanel) return;
  
  mouseDebugPanel.innerHTML = `
    <strong>Mouse Tracker</strong><br>
    Position: ${(mouseXPercent * 100).toFixed(1)}%, ${(mouseYPercent * 100).toFixed(1)}%<br>
    Speed: ${smoothedSpeedKmh.toFixed(2)} km/h (${displayedSpeed.toFixed(1)} px/s)<br>
    Distance: ${smoothedDistanceMeters.toFixed(2)} m<br>
    Clicks: ${clickCount}
  `;
}

// **Mouse tracking – Event Handlers**
function setupEventHandlers() {
  function updateMouseMetrics(mouseX, mouseY, currentTime) {
    if (prevMouseX !== null && prevMouseY !== null && prevTime !== null) {
      const dx = mouseX - prevMouseX;
      const dy = mouseY - prevMouseY;
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
    const xPercent = mouseX / window.innerWidth;
    const yPercent = mouseY / window.innerHeight;

    // Update the exported variables
    mouseXPercent = xPercent;
    mouseYPercent = yPercent;

    // Update cursor position targets for smooth animation
    targetCursorX = mouseX;
    targetCursorY = mouseY;

    updateMouseMetrics(mouseX, mouseY, currentTime);

    // Store current values for next frame
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    prevTime = currentTime;
  });

  // Reset tracking when mouse leaves window
  document.addEventListener("mouseout", () => {
    speed = 0;
    prevMouseX = null;
    prevMouseY = null;
    prevTime = null;
  });

  // Click tracking
  document.addEventListener("click", () => clickCount++);
  document.addEventListener("touchstart", () => clickCount++);
}

// **Animation loop**
function animationLoop() {
  updateCursorPosition();
  updateMouseSpeed();
  updateDistanceMetrics();
  updateDebugDisplay();
  requestAnimationFrame(animationLoop);
}

// **Initialization**
export function initMouseTracker() {
  console.log("Initializing mouse tracker...");

  if (!initializeElements()) {
    console.error("Failed to initialize mouse tracker");
    return;
  }

  setupEventHandlers();
  animationLoop();

  console.log("Mouse tracker initialized successfully");
}

export { mouseXPercent, mouseYPercent };
/**
 * Starfield Thruster Effect Module
 * Creates a high-performance 3D starfield with scroll-based thruster acceleration
 */

// --- Performance & Physics Variables ---
const intensityMultiplier = 0.99;
const maxIntensity = 20;
const damping = 0.99;
const minShakeThreshold = 0.5;

// Module state
let state = {
  shakeIntensity: 0,
  lastScrollY: 0,
  lastTime: 0,
  scrollVelocity: 0,
  scrollAcceleration: 0,
  prevScrollVelocity: 0,
  flickerIntensity: 0,
  ticking: false,
  lastFrameTime: 0,
  frameDelta: 0,
  scrollHeight: 0,
  initialized: false
};

// DOM Elements
let elements = {
  wrapper: null,
  thruster: null,
  scrollContainer: null,
  canvas: null,
  ctx: null
};

// --- Adaptive Performance Monitoring ---
const perfMonitor = {
  fps: 120,
  frameCount: 0,
  lastCheck: performance.now(),
  lowPerformanceMode: false
};
const adaptiveSettings = {
  skipFrames: false,
  frameCounter: 0,
  cullingEnabled: true,
  batchByDepth: true,
  maxParticles: 100,
  particleReduction: 1
};

// --- Starfield Parameters ---
const numStars = 400;
const perspective = 500;
const maxDepth = 1400;
const starSpeed = 1;

// --- Use Typed Arrays for Star Data ---
let starX, starY, starZ, starActive, starColors;

// Precompute star colors (brightness range)
const presetStarColors = [];
for (let b = 200; b <= 255; b += 3) {
  presetStarColors.push(`rgb(${b}, ${b}, ${b})`);
}

// --- Lookup Tables for Alpha and Size Based on Depth ---
let alphaBySizeLookup, sizeLookup;

// --- Spatial Partitioning: Divide into a 4x4 Grid ---
const GRID_SIZE = 4;
let starsByGrid;

// --- Pre-allocate Projection Arrays ---
let projX, projY, projPrevX, projPrevY, projSize, projAlpha;

/**
 * Initialize the starfield thruster effect
 */
export function initStarfieldThruster() {
  if (state.initialized) return;
  state.initialized = true;
  
  console.log('Initializing Starfield Thruster effect');
  
  // Set up references to existing DOM elements
  elements.canvas = document.getElementById('starfield');
  elements.ctx = elements.canvas.getContext('2d', { 
    alpha: false,
    desynchronized: true  // Helps reduce latency when available
  });
  elements.wrapper = document.getElementById('wrapper');
  elements.thruster = document.getElementById('thruster');
  elements.scrollContainer = document.getElementById('scroll-container');
  
  // Check if the scroll container exists
  if (!elements.scrollContainer) {
    console.error('Scroll container element not found. Starfield Thruster initialization aborted.');
    return;
  }
  
  // Initialize Typed Arrays
  starX = new Float32Array(numStars);
  starY = new Float32Array(numStars);
  starZ = new Float32Array(numStars);
  starActive = new Uint8Array(numStars); // 1 = active
  starColors = new Array(numStars); // Pre-computed string colors
  alphaBySizeLookup = new Float32Array(maxDepth);
  sizeLookup = new Float32Array(maxDepth);
  starsByGrid = Array(GRID_SIZE * GRID_SIZE).fill().map(() => []);
  projX = new Float32Array(numStars);
  projY = new Float32Array(numStars);
  projPrevX = new Float32Array(numStars);
  projPrevY = new Float32Array(numStars);
  projSize = new Float32Array(numStars);
  projAlpha = new Float32Array(numStars);
  
  // Position scroll container in the middle on page load
  positionScrollContainer();
  
  // Initialize star system
  initStars();
  
  // Set up event listeners
  window.addEventListener('resize', handleResize);
  elements.scrollContainer.addEventListener('scroll', handleScrollEvent);
  
  // Initial canvas sizing
  resizeCanvas();
  
  // Consolidated touchmove handler to prevent pull-to-refresh and rubberbanding
  document.addEventListener('touchmove', e => {
    // Prevent multi-touch gestures that could trigger pull-to-refresh
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  
  // Start animation loop
  requestAnimationFrame(animate);
  
  console.log('Starfield Thruster initialized');
}

/**
 * Position the scroll container in the middle
 */
function positionScrollContainer() {
  const scrollHeight = elements.scrollContainer.scrollHeight;
  const middlePosition = Math.floor(scrollHeight / 2);
  elements.scrollContainer.scrollTop = middlePosition;
  state.lastScrollY = middlePosition;
}

/**
 * Initialize lookup tables for alpha and size based on depth
 */
function initLookupTables() {
  for (let z = 0; z < maxDepth; z++) {
    alphaBySizeLookup[z] = Math.min(1, 1 - (z / maxDepth) * 0.8);
    sizeLookup[z] = Math.max(0.5, 3 * (1 - z / maxDepth));
  }
}

/**
 * Update star sector
 */
function updateStarSector(i) {
  const normalizedX = (starX[i] + 1000) / 2000;
  const normalizedY = (starY[i] + 1000) / 2000;
  const gridX = Math.min(GRID_SIZE - 1, Math.floor(normalizedX * GRID_SIZE));
  const gridY = Math.min(GRID_SIZE - 1, Math.floor(normalizedY * GRID_SIZE));
  const gridIndex = gridY * GRID_SIZE + gridX;
  starsByGrid[gridIndex].push(i);
}

/**
 * Initialize stars
 */
function initStars() {
  initLookupTables();
  // Clear grid sectors
  starsByGrid.forEach(sector => sector.length = 0);
  for (let i = 0; i < numStars; i++) {
    starX[i] = (Math.random() * 2000) - 1000;
    starY[i] = (Math.random() * 2000) - 1000;
    starZ[i] = Math.random() * maxDepth;
    starActive[i] = 1;
    const colorIndex = Math.floor(Math.random() * presetStarColors.length);
    starColors[i] = presetStarColors[colorIndex];
    updateStarSector(i);
  }
}

/**
 * Handle window resize and update canvas dimensions
 */
function resizeCanvas() {
  elements.canvas.width = window.innerWidth;
  elements.canvas.height = window.innerHeight;
  elements.canvas.centerX = elements.canvas.width / 2;
  elements.canvas.centerY = elements.canvas.height / 2;
}

/**
 * Handle resize events with throttling
 */
let resizeTimeout;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCanvas, 100);
}

/**
 * Update and draw the starfield
 */
function updateAndDrawStarfield(speedMultiplier) {
  // Localize variables for faster access
  const { canvas, ctx } = elements;
  const centerX = canvas.centerX;
  const centerY = canvas.centerY;
  const viewportMinX = -20, viewportMaxX = canvas.width + 20;
  const viewportMinY = -20, viewportMaxY = canvas.height + 20;
  const cullingEnabled = adaptiveSettings.cullingEnabled;
  const batchByDepth = adaptiveSettings.batchByDepth;
  const particleReduction = adaptiveSettings.particleReduction;
  const lowPerformanceMode = perfMonitor.lowPerformanceMode;
  const skipFrames = adaptiveSettings.skipFrames;
  const depthLayers = 3;
  const moveSpeed = starSpeed * speedMultiplier;

  // Update performance monitoring each second
  perfMonitor.frameCount++;
  const now = performance.now();
  if (now - perfMonitor.lastCheck > 1000) {
    perfMonitor.fps = Math.round((perfMonitor.frameCount * 1000) / (now - perfMonitor.lastCheck));
    perfMonitor.frameCount = 0;
    perfMonitor.lastCheck = now;
    if (perfMonitor.fps < 30 && !perfMonitor.lowPerformanceMode) {
      perfMonitor.lowPerformanceMode = true;
      adaptiveSettings.skipFrames = true;
      adaptiveSettings.particleReduction = 2;
    } else if (perfMonitor.fps > 50 && perfMonitor.lowPerformanceMode) {
      perfMonitor.lowPerformanceMode = false;
      adaptiveSettings.skipFrames = false;
      adaptiveSettings.particleReduction = 1;
    }
  }

  // In low performance mode, optionally skip every other frame
  if (perfMonitor.lowPerformanceMode && adaptiveSettings.skipFrames) {
    adaptiveSettings.frameCounter++;
    if (adaptiveSettings.frameCounter % 2 !== 0) return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  starsByGrid.forEach(sector => sector.length = 0);

  // First pass: Update star positions and compute projection values
  for (let i = 0; i < numStars; i++) {
    // Optionally reduce particles in low performance mode
    if (lowPerformanceMode && i % particleReduction !== 0) continue;
    starZ[i] -= moveSpeed;
    if (starZ[i] <= 0) {
      starZ[i] = maxDepth;
      starX[i] = (Math.random() * 2000) - 1000;
      starY[i] = (Math.random() * 2000) - 1000;
      const colorIndex = Math.floor(Math.random() * presetStarColors.length);
      starColors[i] = presetStarColors[colorIndex];
    }
    const scale = perspective / starZ[i];
    projX[i] = centerX + starX[i] * scale;
    projY[i] = centerY + starY[i] * scale;
    const prevZ = starZ[i] + moveSpeed;
    const prevScale = perspective / prevZ;
    projPrevX[i] = centerX + starX[i] * prevScale;
    projPrevY[i] = centerY + starY[i] * prevScale;
    const depthIndex = Math.min(maxDepth - 1, Math.floor(starZ[i]));
    projSize[i] = sizeLookup[depthIndex];
    projAlpha[i] = alphaBySizeLookup[depthIndex];
    updateStarSector(i);
  }

  // Second pass: Batch render stars by grouping via grid sectors or depth layers
  if (batchByDepth) {
    for (let layer = 0; layer < depthLayers; layer++) {
      const depthStart = layer * (maxDepth / depthLayers);
      const depthEnd = (layer + 1) * (maxDepth / depthLayers);
      for (let gridIndex = 0; gridIndex < starsByGrid.length; gridIndex++) {
        const starsInSector = starsByGrid[gridIndex];
        if (cullingEnabled && starsInSector.length === 0) continue;
        for (let j = 0; j < starsInSector.length; j++) {
          const i = starsInSector[j];
          if (starZ[i] < depthStart || starZ[i] >= depthEnd) continue;
          if (cullingEnabled &&
              (projX[i] < viewportMinX || projX[i] > viewportMaxX ||
               projY[i] < viewportMinY || projY[i] > viewportMaxY)) continue;
          drawSingleStar(i, ctx, lowPerformanceMode); // Pass ctx and lowPerformanceMode
        }
      }
    }
  } else {
    for (let gridIndex = 0; gridIndex < starsByGrid.length; gridIndex++) {
      const starsInSector = starsByGrid[gridIndex];
      for (let j = 0; j < starsInSector.length; j++) {
        const i = starsInSector[j];
        if (cullingEnabled &&
            (projX[i] < viewportMinX || projX[i] > viewportMaxX ||
             projY[i] < viewportMinY || projY[i] > viewportMaxY)) continue;
        drawSingleStar(i, ctx, lowPerformanceMode); // Pass ctx and lowPerformanceMode
      }
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * Draw a single star (optimized for both small and regular stars)
 */
function drawSingleStar(i, ctx, lowPerformanceMode) { // Receive ctx and lowPerformanceMode
  if (projSize[i] < 1 && lowPerformanceMode) {
    ctx.globalAlpha = projAlpha[i];
    ctx.fillStyle = starColors[i];
    ctx.fillRect(projX[i] - projSize[i] / 2, projY[i] - projSize[i] / 2, projSize[i], projSize[i]);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(projPrevX[i], projPrevY[i]);
  ctx.lineTo(projX[i], projY[i]);
  ctx.strokeStyle = starColors[i];
  ctx.globalAlpha = projAlpha[i];
  ctx.lineWidth = projSize[i];
  ctx.stroke();
  ctx.beginPath();
  if (projSize[i] <= 1.5) {
    const size = projSize[i] * 1.5;
    ctx.fillRect(projX[i] - size / 2, projY[i] - size / 2, size, size);
  } else {
    ctx.arc(projX[i], projY[i], projSize[i] * 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = starColors[i];
    ctx.fill();
  }
}

/**
 * Handle scroll events with throttling
 */
let ticking = false;
let lastScrollEvent = 0;
const SCROLL_THROTTLE = 5;
function handleScrollEvent() {
  const now = performance.now();
  if (now - lastScrollEvent < SCROLL_THROTTLE) {
    if (!ticking) {
      requestAnimationFrame(() => {
        processScroll();
        ticking = false;
      });
      ticking = true;
    }
    return;
  }
  lastScrollEvent = now;
  processScroll();
}

/**
 * Process scroll movement and update state
 */
function processScroll() {
  const currentScrollY = elements.scrollContainer.scrollTop;
  const currentTime = performance.now();
  let deltaTime = currentTime - state.lastTime;
  if (deltaTime < 10) deltaTime = 10;
  const scrollHeight = elements.scrollContainer.scrollHeight;
  const viewportHeight = elements.scrollContainer.clientHeight;
  const buffer = 10;
  if (elements.scrollContainer.scrollTop <= buffer) {
    elements.scrollContainer.scrollTop = scrollHeight - viewportHeight - buffer;
    state.lastScrollY = elements.scrollContainer.scrollTop;
    state.lastTime = currentTime;
    state.shakeIntensity = 0;
    state.scrollVelocity = 0;
    state.scrollAcceleration = 0;
    state.prevScrollVelocity = 0;
    return;
  }
  if (elements.scrollContainer.scrollTop + viewportHeight >= scrollHeight - buffer) {
    elements.scrollContainer.scrollTop = buffer + 10;
    state.lastScrollY = elements.scrollContainer.scrollTop;
    state.lastTime = currentTime;
    state.shakeIntensity = 0;
    state.scrollVelocity = 0;
    state.scrollAcceleration = 0;
    state.prevScrollVelocity = 0;
    return;
  }
  const deltaY = currentScrollY - state.lastScrollY;
  const instantVelocity = Math.abs(deltaY / deltaTime * 1000);
  state.prevScrollVelocity = state.scrollVelocity;
  state.scrollVelocity = state.scrollVelocity * 0.8 + instantVelocity * 0.2;
  state.scrollAcceleration = (state.scrollVelocity - state.prevScrollVelocity) / deltaTime * 1000;
  const velocityFactor = Math.min(maxIntensity, state.scrollVelocity * intensityMultiplier);
  const accelBoost = Math.min(5, Math.abs(state.scrollAcceleration) * 0.01);
  const newIntensity = velocityFactor + accelBoost;
  state.shakeIntensity = Math.max(state.shakeIntensity, newIntensity);
  state.flickerIntensity = Math.min(1, state.scrollVelocity / 300 + Math.abs(state.scrollAcceleration) / 1000);
  state.lastScrollY = currentScrollY;
  state.lastTime = currentTime;
}

/**
 * Main animation loop using requestAnimationFrame
 */
function animate(timestamp) {
  // Localize state variables for faster access
  const { lastFrameTime, shakeIntensity, flickerIntensity } = state;

  state.frameDelta = timestamp - lastFrameTime;
  state.lastFrameTime = timestamp;
  const frameCorrection = Math.min(3, state.frameDelta / 16.67);
  const timeAdjustedDamping = Math.pow(damping, frameCorrection);
  state.shakeIntensity *= timeAdjustedDamping;
  state.flickerIntensity *= timeAdjustedDamping;
  const currentStarfieldSpeed = 1 + (shakeIntensity / maxIntensity) * 9;
  updateAndDrawStarfield(currentStarfieldSpeed * frameCorrection);
  
  // Rumble effect on content wrapper
  let wrapperTransform = 'translate3d(0, 0, 0)';
  if (shakeIntensity > minShakeThreshold) {
    const shakeFactor = shakeIntensity * frameCorrection * 0.1;
    const offsetX = (Math.random() * 2 - 1) * shakeFactor;
    const offsetY = (Math.random() * 2 - 1) * shakeFactor;
    const rotation = (Math.random() * 2 - 1) * shakeFactor * 0.2;
    wrapperTransform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${rotation}deg)`;
  }

  // Check if the wrapper element exists before modifying its style
  if (elements.wrapper) {
    elements.wrapper.style.transform = wrapperTransform;
  }
  
  // Thruster visual effect
  if (elements.thruster) { // Check if thruster element exists
    if (shakeIntensity > 0) {
      const normalizedIntensity = Math.min(1, shakeIntensity / maxIntensity);
      const hue = 270 - normalizedIntensity * 30;
      const sat = 80 - normalizedIntensity * 70;
      const lightness = 70 + normalizedIntensity * 30;
      const flickerBase = flickerIntensity * (0.6 + Math.random() * 0.4);
      const fastFlicker = Math.random() > 0.7 ? (Math.random() * 0.3) : 0;
      const flicker = flickerBase + fastFlicker;
      const glowSize = (5 + normalizedIntensity * 25) * (0.8 + flicker * 0.2);
      const glowOpacity = 0.5 + normalizedIntensity * 0.5 + flicker * 0.2;
      const scaleX = 1 + normalizedIntensity * 0.3 + flicker * 0.1;
      const scaleY = 1 + flicker * 0.05;
      elements.thruster.style.transform = `scaleX(${scaleX}) scaleY(${scaleY})`;
      elements.thruster.style.boxShadow = `0 0 ${glowSize}px ${glowSize/2}px hsla(${hue}, ${sat}%, ${lightness}%, ${glowOpacity})`;
      elements.thruster.style.backgroundColor = `hsla(${hue}, ${sat + 10}%, ${lightness - 10}%, ${0.3 + normalizedIntensity * 0.7})`;
    } else {
      elements.thruster.style.boxShadow = 'none';
      elements.thruster.style.backgroundColor = 'rgba(180, 160, 220, 0.2)';
      elements.thruster.style.transform = 'scaleX(1) scaleY(1)';
    }
  }
  
  requestAnimationFrame(animate);
}

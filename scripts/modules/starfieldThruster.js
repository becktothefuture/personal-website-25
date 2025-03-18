/**
 * Starfield Thruster Effect Module
 * Creates a high-performance 3D starfield with scroll-based thruster acceleration
 */

// Configuration
const CONFIG = {
  intensity: {
    multiplier: 0.9,
    max: 20,
    min: 1
  },
  damping: 0.98,
  star: {
    count: 800,
    perspective: 500,
    maxDepth: 1000,
    speed: 2,
    poolMultiplier: 1.5
  },
  scroll: {
    throttle: 5, // ms
    height: 10000 // Default scroll height in pixels
  }
};

// Module state
let state = {
  shakeIntensity: 0,
  lastScrollY: 0,
  lastTime: 0,
  scrollVelocity: 0,
  scrollAcceleration: 0,
  prevScrollVelocity: 0,
  flickerIntensity: 0,
  lastScrollEvent: 0,
  ticking: false,
  lastFrameTime: 0,
  frameDelta: 0,
  scrollHeight: 0,
  initialized: false
};

// DOM Elements
let elements = {
  canvas: null,
  ctx: null,
  wrapper: null, 
  thruster: null,
  scrollContainer: null
};

// Star management
let stars = [];
let starPool = [];
const starProjection = { x: 0, y: 0, prevX: 0, prevY: 0, size: 0, alpha: 0 };

/**
 * Initialize the starfield thruster effect
 */
export function initStarfieldThruster() {
  if (state.initialized) return;
  state.initialized = true;
  
  console.log('Initializing Starfield Thruster effect');
  
  // Set up references to existing DOM elements
  elements.canvas = document.getElementById('starfield');
  elements.ctx = elements.canvas.getContext('2d', { alpha: false });
  elements.wrapper = document.querySelector('.starfield-wrapper');
  elements.thruster = document.getElementById('starfield-thruster-light');
  elements.scrollContainer = document.querySelector('.scroll-container');
  
  // Set scroll container height
  setupScrollContainer();
  
  // Initialize state values
  state.lastScrollY = window.scrollY;
  state.lastTime = performance.now();
  state.lastFrameTime = performance.now();
  
  // If the user is not already in the middle of the scroll area, position them there
  positionUserInMiddle();
  
  // Initialize star system
  initStarSystem();
  
  // Set up event listeners
  window.addEventListener('scroll', handleScrollEvent);
  window.addEventListener('resize', handleResize);
  
  // Initial canvas sizing
  resizeCanvas();
  
  // Start animation loop
  requestAnimationFrame(animate);
  
  console.log('Starfield Thruster initialized');
}

/**
 * Sets up the scroll container with proper height
 */
function setupScrollContainer() {
  if (!elements.scrollContainer) {
    console.warn('Scroll container not found. Create an element with class "scroll-container"');
    return;
  }
  
  // Set height to create scrollable area
  elements.scrollContainer.style.height = `${CONFIG.scroll.height}px`;
  state.scrollHeight = CONFIG.scroll.height;
}

/**
 * Handle resize events
 */
function handleResize() {
  resizeCanvas();
  // Recalculate user position to maintain relative scroll position
  const scrollRatio = window.scrollY / state.scrollHeight;
  setupScrollContainer();
  window.scrollTo({
    top: scrollRatio * state.scrollHeight,
    behavior: 'auto'
  });
}

/**
 * Position the user in the middle of the scroll area
 */
function positionUserInMiddle() {
  const scrollHeight = elements.scrollContainer ? elements.scrollContainer.offsetHeight : 
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  
  state.scrollHeight = scrollHeight;
  
  // Only do this if the page has significant scrollable area
  if (scrollHeight > window.innerHeight * 2) {
    const middlePosition = Math.floor(scrollHeight / 2);
    window.scrollTo({
      top: middlePosition,
      behavior: 'auto'
    });
    state.lastScrollY = middlePosition;
  }
}

/**
 * Initialize star pool and star array
 */
function initStarSystem() {
  // Create star array
  stars = new Array(CONFIG.star.count);
  
  // Initialize pool
  initStarPool();
  
  // Initialize individual stars
  for (let i = 0; i < CONFIG.star.count; i++) {
    const star = getStarFromPool();
    
    // Random position
    star.x = (Math.random() * 2000) - 1000;
    star.y = (Math.random() * 2000) - 1000;
    star.z = Math.random() * CONFIG.star.maxDepth;
    
    // Precompute color
    const brightness = 200 + Math.random() * 55;
    star.color = `rgb(${brightness}, ${brightness}, ${brightness})`;
    
    stars[i] = star;
  }
}

/**
 * Create the star object pool
 */
function initStarPool() {
  const poolSize = CONFIG.star.count * CONFIG.star.poolMultiplier;
  starPool = [];
  
  for (let i = 0; i < poolSize; i++) {
    starPool.push(createStar());
  }
}

/**
 * Create a star object with default properties
 */
function createStar() {
  return {
    x: 0,
    y: 0,
    z: 0,
    prevX: 0,
    prevY: 0,
    size: 0,
    alpha: 0,
    color: 'rgb(255, 255, 255)',
    active: false
  };
}

/**
 * Get an available star from the pool
 */
function getStarFromPool() {
  for (let i = 0; i < starPool.length; i++) {
    if (!starPool[i].active) {
      starPool[i].active = true;
      return starPool[i];
    }
  }
  
  // If no available stars, create a new one
  const newStar = createStar();
  newStar.active = true;
  starPool.push(newStar);
  return newStar;
}

/**
 * Return a star to the pool
 */
function returnStarToPool(star) {
  star.active = false;
}

/**
 * Handle window resize and update canvas dimensions
 */
function resizeCanvas() {
  elements.canvas.width = window.innerWidth;
  elements.canvas.height = window.innerHeight;
  
  // Pre-calculate center coordinates for performance
  elements.canvas.centerX = elements.canvas.width / 2;
  elements.canvas.centerY = elements.canvas.height / 2;
}

/**
 * Handle scroll events with throttling
 */
function handleScrollEvent() {
  const now = performance.now();
  
  // Throttle scroll events
  if (now - state.lastScrollEvent < CONFIG.scroll.throttle) {
    if (!state.ticking) {
      requestAnimationFrame(() => {
        processScroll();
        state.ticking = false;
      });
      state.ticking = true;
    }
    return;
  }
  
  state.lastScrollEvent = now;
  processScroll();
}

/**
 * Process scroll movement and update state
 */
function processScroll() {
  const currentScrollY = window.scrollY;
  const currentTime = performance.now();
  let deltaTime = currentTime - state.lastTime;
  
  // Safety check for time delta
  if (deltaTime < 10) deltaTime = 10;
  
  // Check for scroll reset (reaching the top of the page)
  const scrollHeight = elements.scrollContainer ? elements.scrollContainer.offsetHeight : 
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  const viewportHeight = window.innerHeight;
  const buffer = 10;
  
  // Reset when reaching the top of the page
  if (window.scrollY <= buffer) {
    window.scrollTo({
      top: scrollHeight - viewportHeight,
      behavior: 'auto'
    });
    state.lastScrollY = scrollHeight - viewportHeight;
    state.lastTime = currentTime;
    state.shakeIntensity = 0;
    state.scrollVelocity = 0;
    state.scrollAcceleration = 0;
    state.prevScrollVelocity = 0;
    return;
  }
  
  // Physics-based momentum calculations
  const deltaY = currentScrollY - state.lastScrollY;
  
  // Calculate instantaneous velocity (absolute value to ignore direction)
  const instantVelocity = Math.abs(deltaY / deltaTime * 1000);
  
  // Calculate acceleration
  state.prevScrollVelocity = state.scrollVelocity;
  
  // Low-pass filter for smoother velocity
  state.scrollVelocity = state.scrollVelocity * 0.8 + instantVelocity * 0.2;
  
  // Calculate acceleration from velocity change
  state.scrollAcceleration = (state.scrollVelocity - state.prevScrollVelocity) / deltaTime * 1000;
  
  // Build speed regardless of direction
  const velocityFactor = Math.min(CONFIG.intensity.max, state.scrollVelocity * CONFIG.intensity.multiplier);
  
  // Add acceleration boost
  const accelBoost = Math.min(5, Math.abs(state.scrollAcceleration) * 0.01);
  const newIntensity = velocityFactor + accelBoost;
  
  // Only increase intensity or maintain it
  state.shakeIntensity = Math.max(state.shakeIntensity, newIntensity);
  
  // Update flicker effect
  state.flickerIntensity = Math.min(1, state.scrollVelocity / 300 + Math.abs(state.scrollAcceleration) / 1000);

  // Update state
  state.lastScrollY = currentScrollY;
  state.lastTime = currentTime;
}

/**
 * Update and render the starfield
 */
function updateAndDrawStarfield(speedMultiplier) {
  const ctx = elements.ctx;
  const canvas = elements.canvas;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Reference center coordinates
  const centerX = canvas.centerX;
  const centerY = canvas.centerY;
  
  // Calculate move speed
  const moveSpeed = CONFIG.star.speed * speedMultiplier;
  
  // First pass - update all star positions
  for (let i = 0; i < CONFIG.star.count; i++) {
    const star = stars[i];
    
    // Move star closer
    star.z -= moveSpeed;
    
    // Reset star if too close
    if (star.z <= 0) {
      // Return current star to pool
      returnStarToPool(star);
      
      // Get fresh star from pool
      const newStar = getStarFromPool();
      
      // Initialize properties
      newStar.z = CONFIG.star.maxDepth;
      newStar.x = (Math.random() * 2000) - 1000;
      newStar.y = (Math.random() * 2000) - 1000;
      
      // Precompute color
      const brightness = 200 + Math.random() * 55;
      newStar.color = `rgb(${brightness}, ${brightness}, ${brightness})`;
      
      // Replace in stars array
      stars[i] = newStar;
    }
  }
  
  // Second pass - draw all stars (batch rendering)
  for (let i = 0; i < CONFIG.star.count; i++) {
    const star = stars[i];
    
    // Project 3D to 2D
    const scale = CONFIG.star.perspective / star.z;
    starProjection.x = centerX + star.x * scale;
    starProjection.y = centerY + star.y * scale;
    
    // Calculate trail
    const prevZ = star.z + moveSpeed;
    const prevScale = CONFIG.star.perspective / prevZ;
    starProjection.prevX = centerX + star.x * prevScale;
    starProjection.prevY = centerY + star.y * prevScale;
    
    // Calculate size and alpha
    starProjection.size = Math.max(0.5, 3 * (1 - star.z / CONFIG.star.maxDepth));
    starProjection.alpha = Math.min(1, 1 - (star.z / CONFIG.star.maxDepth) * 0.8);
    
    // Draw trail
    ctx.beginPath();
    ctx.moveTo(starProjection.prevX, starProjection.prevY);
    ctx.lineTo(starProjection.x, starProjection.y);
    ctx.strokeStyle = star.color;
    ctx.globalAlpha = starProjection.alpha;
    ctx.lineWidth = starProjection.size;
    ctx.stroke();
    
    // Draw point
    ctx.beginPath();
    ctx.arc(starProjection.x, starProjection.y, starProjection.size * 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = star.color;
    ctx.fill();
  }
  
  // Reset alpha
  ctx.globalAlpha = 1;
}

/**
 * Main animation loop using requestAnimationFrame
 */
function animate(timestamp) {
  // Calculate time between frames
  state.frameDelta = timestamp - state.lastFrameTime;
  state.lastFrameTime = timestamp;
  
  // Normalize for 60fps
  const frameCorrection = state.frameDelta / 16.67;
  
  // Apply natural dampening
  const timeAdjustedDamping = Math.pow(CONFIG.damping, frameCorrection);
  state.shakeIntensity *= timeAdjustedDamping;
  state.flickerIntensity *= timeAdjustedDamping;
  
  // Calculate starfield speed (1-10 range)
  const currentStarfieldSpeed = 1 + (state.shakeIntensity / CONFIG.intensity.max) * 9;
  
  // Update starfield
  updateAndDrawStarfield(currentStarfieldSpeed * frameCorrection);

  // Apply shake effect
  if (state.shakeIntensity > CONFIG.intensity.min) {
    const shakeFactor = state.shakeIntensity * frameCorrection * 0.1;
    const offsetX = (Math.random() * 2 - 1) * shakeFactor;
    const offsetY = (Math.random() * 2 - 1) * shakeFactor;
    const rotation = (Math.random() * 2 - 1) * shakeFactor * 0.2;
    
    elements.wrapper.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${rotation}deg)`;
  } else {
    elements.wrapper.style.transform = 'translate3d(0, 0, 0)';
  }
  
  // Update thruster visual
  if (state.shakeIntensity > 0) {
    const normalizedIntensity = Math.min(1, state.shakeIntensity / CONFIG.intensity.max);
    
    // Color calculation
    const hue = 270 - normalizedIntensity * 30;
    const sat = 80 - normalizedIntensity * 70;
    const lightness = 70 + normalizedIntensity * 30;
    
    // Flicker calculation
    const flickerBase = state.flickerIntensity * (0.6 + Math.random() * 0.4);
    const fastFlicker = Math.random() > 0.7 ? (Math.random() * 0.3) : 0;
    const flicker = flickerBase + fastFlicker;
    
    // Glow effects
    const glowSize = (5 + normalizedIntensity * 25) * (0.8 + flicker * 0.2);
    const glowOpacity = 0.5 + normalizedIntensity * 0.5 + flicker * 0.2;
    
    // Scale effects
    const scaleX = 1 + normalizedIntensity * 0.3 + flicker * 0.1;
    const scaleY = 1 + flicker * 0.05;
    
    // Apply effects
    elements.thruster.style.transform = `scaleX(${scaleX}) scaleY(${scaleY})`;
    elements.thruster.style.boxShadow = `0 0 ${glowSize}px ${glowSize/2}px hsla(${hue}, ${sat}%, ${lightness}%, ${glowOpacity})`;
    elements.thruster.style.backgroundColor = `hsla(${hue}, ${sat + 10}%, ${lightness - 10}%, ${0.3 + normalizedIntensity * 0.7})`;
  } else {
    elements.thruster.style.boxShadow = 'none';
    elements.thruster.style.backgroundColor = 'rgba(180, 160, 220, 0.2)';
    elements.thruster.style.transform = 'scaleX(1) scaleY(1)';
  }

  // Continue animation loop
  requestAnimationFrame(animate);
}

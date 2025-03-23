// starfieldThruster.js

// --- Configuration Constants ---
const CONFIG = {
  intensityMultiplier: 0.99,
  maxIntensity: 20,
  damping: 0.98, // (Unused now in favor of easingRate)
  easingRate: 0.05, // New parameter for exponential easing decay
  minShakeThreshold: 0.5,
  rampDownThreshold: 0.5, 
  inactivityTimeout: 150, // Reduced from 500ms to 250ms
  numStars: 400,
  perspective: 500,
  maxDepth: 1500,
  starSpeed: 2,
  gridSize: 4,
  scrollBuffer: 10,
  scrollThrottle: 5,
  lowFPS: 30,
  highFPS: 50,
};

// --- Utility: Throttle Function ---
const throttle = (func, limit) => {
  let lastFunc, lastRan;
  return function (...args) {
    const context = this;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = performance.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (performance.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = performance.now();
        }
      }, limit - (performance.now() - lastRan));
    }
  };
};

class StarfieldThruster {
  constructor() {
    // --- State Variables ---
    this.state = {
      shakeIntensity: 0,
      lastScrollY: 0,
      lastTime: performance.now(),
      scrollVelocity: 0,
      scrollAcceleration: 0,
      prevScrollVelocity: 0,
      flickerIntensity: 0,
      initialized: false,
      lastFrameTime: performance.now(),
      frameDelta: 0,
      lastScrollActivity: performance.now(),
      thrusterActive: false,
      lastThrusterUpdate: performance.now(),
      thrusterStylesCached: false,
      currentScrollY: 0
    };

    // --- Performance Monitor ---
    this.perfMonitor = {
      fps: 120,
      frameCount: 0,
      lastCheck: performance.now(),
      lowPerformanceMode: false,
    };

    this.adaptiveSettings = {
      skipFrames: false,
      frameCounter: 0,
      cullingEnabled: true,
      batchByDepth: true,
      particleReduction: 1,
    };

    // --- Starfield Data ---
    this.starData = {
      starX: new Float32Array(CONFIG.numStars),
      starY: new Float32Array(CONFIG.numStars),
      starZ: new Float32Array(CONFIG.numStars),
      starActive: new Uint8Array(CONFIG.numStars),
      starColors: new Array(CONFIG.numStars),
      presetStarColors: [],
      alphaBySizeLookup: new Float32Array(CONFIG.maxDepth),
      sizeLookup: new Float32Array(CONFIG.maxDepth),
      starsByGrid: Array(CONFIG.gridSize * CONFIG.gridSize).fill().map(() => []),
      projX: new Float32Array(CONFIG.numStars),
      projY: new Float32Array(CONFIG.numStars),
      projPrevX: new Float32Array(CONFIG.numStars),
      projPrevY: new Float32Array(CONFIG.numStars),
      projSize: new Float32Array(CONFIG.numStars),
      projAlpha: new Float32Array(CONFIG.numStars),
    };

    // --- DOM Elements ---
    this.elements = {
      canvas: document.getElementById('starfield'),
      wrapper: document.getElementById('wrapper'),
      thruster: document.getElementById('thruster'),
      ctx: null,
    };

    // Early abort if required elements are missing
    if (!this.elements.canvas) {
      console.error('Canvas element missing. Initialization aborted.');
      return;
    }

    this.elements.ctx = this.elements.canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true,
    });
  }

  init() {
    if (this.state.initialized) return;
    this.state.initialized = true;
    console.log('Initializing Starfield Thruster effect');

    this._initPresetColors();
    this._initLookupTables();
    this._initStars();
    this._resizeCanvas();
    // Removed _positionScrollContainer() call as it's no longer needed
    this._addEventListeners();
    requestAnimationFrame((ts) => this.animate(ts));
    console.log('Starfield Thruster initialized');
  }

  // Precompute a range of star colors based on brightness
  _initPresetColors() {
    for (let b = 200; b <= 255; b += 3) {
      this.starData.presetStarColors.push(`rgb(${b}, ${b}, ${b})`);
    }
  }

  _initLookupTables() {
    for (let z = 0; z < CONFIG.maxDepth; z++) {
      this.starData.alphaBySizeLookup[z] = Math.min(1, 1 - (z / CONFIG.maxDepth) * 0.8);
      this.starData.sizeLookup[z] = Math.max(0.5, 3 * (1 - z / CONFIG.maxDepth));
    }
  }

  _initStars() {
    // Clear grid sectors
    this.starData.starsByGrid.forEach(sector => sector.length = 0);
    for (let i = 0; i < CONFIG.numStars; i++) {
      this.starData.starX[i] = (Math.random() * 2000) - 1000;
      this.starData.starY[i] = (Math.random() * 2000) - 1000;
      this.starData.starZ[i] = Math.random() * CONFIG.maxDepth;
      this.starData.starActive[i] = 1;
      const colorIndex = Math.floor(Math.random() * this.starData.presetStarColors.length);
      this.starData.starColors[i] = this.starData.presetStarColors[colorIndex];
      this._updateStarSector(i);
    }
  }

  _updateStarSector(i) {
    const normalizedX = (this.starData.starX[i] + 1000) / 2000;
    const normalizedY = (this.starData.starY[i] + 1000) / 2000;
    const gridX = Math.min(CONFIG.gridSize - 1, Math.floor(normalizedX * CONFIG.gridSize));
    const gridY = Math.min(CONFIG.gridSize - 1, Math.floor(normalizedY * CONFIG.gridSize));
    const gridIndex = gridY * CONFIG.gridSize + gridX;
    this.starData.starsByGrid[gridIndex].push(i);
  }

  _resizeCanvas() {
    const { canvas } = this.elements;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.centerX = canvas.width / 2;
    canvas.centerY = canvas.height / 2;
  }

  // _positionScrollContainer() method removed

  _addEventListeners() {
    window.addEventListener('resize', throttle(() => this._resizeCanvas(), 100));
    // Removed scroll event listener for scrollContainer
    // Prevent unwanted pull-to-refresh on touch devices
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
  }

  _processScroll(forcedScrollPosition = null) {
    // Using the global customScrollPos from the previous version
    const currentScrollY = forcedScrollPosition !== null ? forcedScrollPosition : customScrollPos;
    
    // Skip processing if scroll position hasn't changed
    if (currentScrollY === this.state.currentScrollY) {
      return false; // No scroll movement
    }
    
    // Record the current position for next comparison
    this.state.currentScrollY = currentScrollY;
    
    // When scroll happens, record the time and activate the thruster
    this.state.lastScrollActivity = performance.now();
    this.state.thrusterActive = true;
    this.state.thrusterStylesCached = false;
    
    const currentTime = performance.now();
    let deltaTime = currentTime - this.state.lastTime;
    if (deltaTime < 10) deltaTime = 10;

    const deltaY = currentScrollY - this.state.lastScrollY;
    const instantVelocity = Math.abs(deltaY / deltaTime * 1000);
    this.state.prevScrollVelocity = this.state.scrollVelocity;
    this.state.scrollVelocity = this.state.scrollVelocity * 0.8 + instantVelocity * 0.2;
    this.state.scrollAcceleration = (this.state.scrollVelocity - this.state.prevScrollVelocity) / deltaTime * 1000;
    const velocityFactor = Math.min(CONFIG.maxIntensity, this.state.scrollVelocity * CONFIG.intensityMultiplier);
    const accelBoost = Math.min(5, Math.abs(this.state.scrollAcceleration) * 0.01);
    const newIntensity = velocityFactor + accelBoost;
    this.state.shakeIntensity = Math.max(this.state.shakeIntensity, newIntensity);
    this.state.flickerIntensity = Math.min(1, this.state.scrollVelocity / 300 + Math.abs(this.state.scrollAcceleration) / 1000);
    this.state.lastScrollY = currentScrollY;
    this.state.lastTime = currentTime;
    
    return true; // Scroll movement detected and processed
  }

  _updateAndDrawStarfield(speedMultiplier, frameCorrection) {
    const { canvas, ctx } = this.elements;
    const { centerX, centerY } = canvas;
    const centerYVal = canvas.centerY;
    const viewportMargin = 20;
    const moveSpeed = CONFIG.starSpeed * speedMultiplier;
    const { cullingEnabled } = this.adaptiveSettings;
    const lowPerformance = this.perfMonitor.lowPerformanceMode;
    const particleReduction = this.adaptiveSettings.particleReduction;
    const depthLayers = 3;

    // --- Performance Monitoring ---
    this.perfMonitor.frameCount++;
    const now = performance.now();
    if (now - this.perfMonitor.lastCheck > 1000) {
      this.perfMonitor.fps = Math.round(this.perfMonitor.frameCount * 1000 / (now - this.perfMonitor.lastCheck));
      this.perfMonitor.frameCount = 0;
      this.perfMonitor.lastCheck = now;
      if (this.perfMonitor.fps < CONFIG.lowFPS && !this.perfMonitor.lowPerformanceMode) {
        this.perfMonitor.lowPerformanceMode = true;
        this.adaptiveSettings.skipFrames = true;
        this.adaptiveSettings.particleReduction = 2;
      } else if (this.perfMonitor.fps > CONFIG.highFPS && this.perfMonitor.lowPerformanceMode) {
        this.perfMonitor.lowPerformanceMode = false;
        this.adaptiveSettings.skipFrames = false;
        this.adaptiveSettings.particleReduction = 1;
      }
    }

    if (lowPerformance && this.adaptiveSettings.skipFrames && (++this.adaptiveSettings.frameCounter % 2 !== 0)) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Reset grid sectors for this frame
    this.starData.starsByGrid.forEach(sector => sector.length = 0);

    // First pass: update star positions and compute projection values
    for (let i = 0; i < CONFIG.numStars; i++) {
      if (lowPerformance && i % particleReduction !== 0) continue;
      this.starData.starZ[i] -= moveSpeed;
      if (this.starData.starZ[i] <= 0) {
        this.starData.starZ[i] = CONFIG.maxDepth;
        this.starData.starX[i] = (Math.random() * 2000) - 1000;
        this.starData.starY[i] = (Math.random() * 2000) - 1000;
        const colorIndex = Math.floor(Math.random() * this.starData.presetStarColors.length);
        this.starData.starColors[i] = this.starData.presetStarColors[colorIndex];
      }
      const scale = CONFIG.perspective / this.starData.starZ[i];
      this.starData.projX[i] = centerX + this.starData.starX[i] * scale;
      this.starData.projY[i] = centerYVal + this.starData.starY[i] * scale;
      const prevZ = this.starData.starZ[i] + moveSpeed;
      const prevScale = CONFIG.perspective / prevZ;
      this.starData.projPrevX[i] = centerX + this.starData.starX[i] * prevScale;
      this.starData.projPrevY[i] = centerYVal + this.starData.starY[i] * prevScale;
      const depthIndex = Math.min(CONFIG.maxDepth - 1, Math.floor(this.starData.starZ[i]));
      this.starData.projSize[i] = this.starData.sizeLookup[depthIndex];
      this.starData.projAlpha[i] = this.starData.alphaBySizeLookup[depthIndex];
      this._updateStarSector(i);
    }

    // Second pass: Render stars (optionally batching by depth)
    if (this.adaptiveSettings.batchByDepth) {
      for (let layer = 0; layer < depthLayers; layer++) {
        const depthStart = layer * (CONFIG.maxDepth / depthLayers);
        const depthEnd = (layer + 1) * (CONFIG.maxDepth / depthLayers);
        for (let grid = 0; grid < this.starData.starsByGrid.length; grid++) {
          const sector = this.starData.starsByGrid[grid];
          if (cullingEnabled && sector.length === 0) continue;
          for (let j = 0; j < sector.length; j++) {
            const i = sector[j];
            if (this.starData.starZ[i] < depthStart || this.starData.starZ[i] >= depthEnd) continue;
            if (cullingEnabled &&
                (this.starData.projX[i] < -viewportMargin ||
                 this.starData.projX[i] > canvas.width + viewportMargin ||
                 this.starData.projY[i] < -viewportMargin ||
                 this.starData.projY[i] > canvas.height + viewportMargin)) continue;
            this._drawStar(i, ctx, lowPerformance);
          }
        }
      }
    } else {
      for (let grid = 0; grid < this.starData.starsByGrid.length; grid++) {
        const sector = this.starData.starsByGrid[grid];
        for (let j = 0; j < sector.length; j++) {
          const i = sector[j];
          if (cullingEnabled &&
              (this.starData.projX[i] < -viewportMargin ||
               this.starData.projX[i] > canvas.width + viewportMargin ||
               this.starData.projY[i] < -viewportMargin ||
               this.starData.projY[i] > canvas.height + viewportMargin)) continue;
          this._drawStar(i, ctx, lowPerformance);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  _drawStar(i, ctx, lowPerformance) {
    const { projSize, projAlpha, projX, projY, projPrevX, projPrevY } = this.starData;
    if (projSize[i] < 1 && lowPerformance) {
      ctx.globalAlpha = projAlpha[i];
      ctx.fillStyle = this.starData.starColors[i];
      ctx.fillRect(projX[i] - projSize[i] / 2, projY[i] - projSize[i] / 2, projSize[i], projSize[i]);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(projPrevX[i], projPrevY[i]);
    ctx.lineTo(projX[i], projY[i]);
    ctx.strokeStyle = this.starData.starColors[i];
    ctx.globalAlpha = projAlpha[i];
    ctx.lineWidth = projSize[i];
    ctx.stroke();
    ctx.beginPath();
    if (projSize[i] <= 1.5) {
      const size = projSize[i] * 1.5;
      ctx.fillRect(projX[i] - size / 2, projY[i] - size / 2, size, size);
    } else {
      ctx.arc(projX[i], projY[i], projSize[i] * 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = this.starData.starColors[i];
      ctx.fill();
    }
  }

  animate(timestamp) {
    // Process scroll if there's a change
    this._processScroll();
    
    const delta = timestamp - this.state.lastFrameTime;
    const frameCorrection = Math.min(3, delta / 16.67);
    this.state.frameDelta = delta;
    this.state.lastFrameTime = timestamp;
    
    // Apply exponential easing to shake and flicker intensities for more realistic motion
    this.state.shakeIntensity *= Math.exp(-frameCorrection * CONFIG.easingRate);
    this.state.flickerIntensity *= Math.exp(-frameCorrection * CONFIG.easingRate);

    // Calculate current starfield speed based on shake intensity
    const currentSpeed = 1 + (this.state.shakeIntensity / CONFIG.maxIntensity) * 9;

    // Update custom scrollbar using the same currentSpeed
    this.scrollBarPos += currentSpeed * frameCorrection;
    const scrollbar = document.getElementById('custom-scrollbar');
    if (scrollbar) {
      const scrollBarHeight = scrollbar.offsetHeight;
      const pos = this.scrollBarPos % scrollBarHeight;
      const contents = scrollbar.querySelectorAll('.scroll-content');
      if (contents.length >= 2) {
        contents[0].style.transform = `translateY(${-pos}px)`;
        contents[1].style.transform = `translateY(${scrollBarHeight - pos}px)`;
      }
    }

    // Update debug overlay for movement speed and acceleration
    let debugStats = document.getElementById('debug-stats');
    if (!debugStats) {
      debugStats = document.createElement('div');
      debugStats.id = 'debug-stats';
      debugStats.style.position = 'fixed';
      debugStats.style.top = '0';
      debugStats.style.left = '0';
      debugStats.style.color = 'white';
      debugStats.style.fontFamily = 'monospace';
      debugStats.style.fontSize = '12px';
      debugStats.style.background = 'rgba(0, 0, 0, 0.5)';
      debugStats.style.padding = '4px';
      document.body.appendChild(debugStats);
    }
    debugStats.innerHTML = `Speed: ${currentSpeed.toFixed(2)}<br>Acceleration: ${this.state.scrollAcceleration.toFixed(2)}`;
    
    this._updateAndDrawStarfield(currentSpeed * frameCorrection, frameCorrection);

    // Update thruster effects if needed
    const timeSinceLastScroll = timestamp - this.state.lastScrollActivity;
    const isStillRampingDown = this.state.shakeIntensity > CONFIG.rampDownThreshold;
    const shouldUpdateThruster = this.state.thrusterActive || isStillRampingDown;
    
    if (shouldUpdateThruster && this.elements.thruster) {
      let transform = 'translate3d(0, 0, 0)';
      if (this.state.shakeIntensity > CONFIG.minShakeThreshold) {
        const shakeFactor = this.state.shakeIntensity * frameCorrection * 0.1;
        const offsetX = (Math.random() * 2 - 1) * shakeFactor;
        const offsetY = (Math.random() * 2 - 1) * shakeFactor;
        const rotation = (Math.random() * 2 - 1) * shakeFactor * 0.2;
        transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${rotation}deg)`;
      }
      if (this.elements.wrapper) {
        this.elements.wrapper.style.transform = transform;
      }

      if (this.state.shakeIntensity > 0) {
        const norm = Math.min(1, this.state.shakeIntensity / CONFIG.maxIntensity);
        const hue = 270 - norm * 30;
        const sat = 80 - norm * 70;
        const lightness = 70 + norm * 30;
        const flickerBase = this.state.flickerIntensity * (0.6 + Math.random() * 0.4);
        const fastFlicker = Math.random() > 0.7 ? (Math.random() * 0.3) : 0;
        const flicker = flickerBase + fastFlicker;
        const glowSize = (5 + norm * 25) * (0.8 + flicker * 0.2);
        const glowOpacity = 0.5 + norm * 0.5 + flicker * 0.2;
        const scaleX = 1 + norm * 0.3 + flicker * 0.1;
        const scaleY = 1 + flicker * 0.05;
        this.elements.thruster.style.transform = `scaleX(${scaleX}) scaleY(${scaleY})`;
        this.elements.thruster.style.boxShadow = `0 0 ${glowSize}px ${glowSize / 2}px hsla(${hue}, ${sat}%, ${lightness}%, ${glowOpacity})`;
        this.elements.thruster.style.backgroundColor = `hsla(${hue}, ${sat + 10}%, ${lightness - 10}%, ${0.3 + norm * 0.7})`;
        this.state.lastThrusterUpdate = timestamp;
      } else if (!this.state.thrusterStylesCached) {
        this.elements.thruster.style.boxShadow = 'none';
        this.elements.thruster.style.backgroundColor = 'rgba(180, 160, 220, 0.2)';
        this.elements.thruster.style.transform = 'scaleX(1) scaleY(1)';
        this.state.thrusterStylesCached = true;
        this.state.thrusterActive = false;
      }
    }
    
    if (timeSinceLastScroll > CONFIG.inactivityTimeout && this.state.shakeIntensity < CONFIG.rampDownThreshold) {
      this.state.thrusterActive = false;
      if (this.state.shakeIntensity < 0.01 && this.elements.thruster) {
        this.elements.thruster.style.boxShadow = 'none';
        this.elements.thruster.style.backgroundColor = 'rgba(180, 160, 220, 0.2)';
        this.elements.thruster.style.transform = 'scaleX(1) scaleY(1)';
        this.state.thrusterStylesCached = true;
      }
    }
    
    requestAnimationFrame((ts) => this.animate(ts));
  }
}


// Custom Scrollbar Logic
let customScrollPos = 0;
let lastRecordedScrollPos = 0;
const scrollSpeed = 0.1; // adjust this value for sensitivity

function initCustomScrollbar() {
  const scrollbar = document.getElementById('custom-scrollbar');
  if (!scrollbar) return;

  // Populate both scroll-content containers with vertical line elements
  const contents = scrollbar.querySelectorAll('.scroll-content');
  contents.forEach((content) => {
    // Clear any existing content
    content.innerHTML = '';
    // Populate with a fixed number of lines (e.g., 50 lines)
    const numLines = 50;
    for (let i = 0; i < numLines; i++) {
      const line = document.createElement('div');
      line.classList.add('line');
      content.appendChild(line);
    }
  });

  // Listen to mouse wheel events for scrolling simulation
  window.addEventListener('wheel', (e) => {
    e.preventDefault(); // prevent the native scrolling behavior
    customScrollPos += e.deltaY * scrollSpeed;
    
    // Ensure the starfield thruster gets updated when scrolling happens
    if (window.starfieldThrusterInstance) {
      window.starfieldThrusterInstance._processScroll(customScrollPos);
    }
  }, { passive: false });

  // Start the animation loop for the custom scrollbar
  requestAnimationFrame(updateCustomScrollbar);
}

function updateCustomScrollbar() {
  const scrollbar = document.getElementById('custom-scrollbar');
  if (!scrollbar) return;
  
  const contents = scrollbar.querySelectorAll('.scroll-content');
  if (contents.length !== 2) return;
  
  // Get the height of the scrollbar
  const scrollHeight = scrollbar.offsetHeight;
  
  // Calculate position based on scrolling (use modulo for looping)
  const scrollPosition = (customScrollPos % scrollHeight);
  
  // Move both content blocks to create seamless scrolling effect
  contents[0].style.transform = `translateY(${-scrollPosition}px)`;
  contents[1].style.transform = `translateY(${-scrollPosition}px)`;
  
  requestAnimationFrame(updateCustomScrollbar);
}

// Exported initialization function
export function initStarfieldThruster() {
  const starfieldThruster = new StarfieldThruster();
  // Store the instance globally so the scroll event can access it
  window.starfieldThrusterInstance = starfieldThruster;
  starfieldThruster.init();
  initCustomScrollbar();
}
export function initLightGrid(selector = '.light-grid') {
  console.log('%c[LightGrid.js] initLightGrid FUNCTION CALLED', 'color: #00ff00; font-weight: bold;');

  // New animation parameters for Nostromo-style blinking
  const MIN_ON_DURATION_MS = 400;      // Min time a light stays fully on
  const MAX_ON_DURATION_MS = 700;     // Max time a light stays fully on
  const MIN_OFF_DURATION_MS = 500;    // Min time a light stays off (minOpacity)
  const MAX_OFF_DURATION_MS = 4000;   // Max time a light stays off
  
  const FLICKER_PER_FRAME_CHANCE = 0.0002; // Reduced: Chance per frame for an "on" light to start flickering
  const FLICKER_DURATION_MS = 180;       // How long a flicker sequence lasts
  const FLICKER_INTERVAL_MS = 45;        // Time between on/off states during a flicker

  const dotSizePx = 5;       // Fixed dot size - CHANGED
  const minOpacity = 0.15;    // Base opacity for "off" or dim state
  const maxOpacity = 0.9;     // Opacity for "on" state

  class Grid {
    constructor(container) {
      this.container = container;
      console.log('%c[LightGrid.js Grid Instance] Constructor for:', 'color: #7f00ff;', container);
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'light-grid-canvas';
      
      this.dotColor = '#00ff00'; // Default fallback color, will be updated in setup

      // Ensure container can hold an absolutely positioned canvas
      if (getComputedStyle(this.container).position === 'static') {
        this.container.style.position = 'relative';
      }
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      console.log('%c[LightGrid.js Grid Instance] Canvas created and appended to:', 'color: #7f00ff;', container);

      this.cols = parseInt(container.dataset.cols, 10) || 5;
      this.rows = parseInt(container.dataset.rows, 10) || 5;
      this.dots = [];
      this.resizeObserver = null;
      this.lastTimestamp = 0; // For deltaTime calculation

      this.setup(); // Initial setup

      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          console.log('%c[LightGrid.js Grid Instance] ResizeObserver triggered for:', 'color: #7f00ff;', container);
          this.setup();
        });
        this.resizeObserver.observe(this.container);
      } else {
        window.addEventListener('resize', () => this.setup());
      }
    }

    setup() {
      // const rect = this.container.getBoundingClientRect(); // Old method
      const width = this.container.offsetWidth;
      const height = this.container.offsetHeight;
      
      console.log(`%c[LightGrid.js Grid Instance] setup() for ${this.container.id || '(no ID)'}. OffsetDims: W=${width} H=${height}`, 'color: #7f00ff;');

      // Get --color-1 from CSS custom properties
      const computedStyle = getComputedStyle(this.container);
      this.dotColor = computedStyle.getPropertyValue('--color-1').trim() || '#00ff00'; // Use fetched color or fallback to green
      if (!computedStyle.getPropertyValue('--color-1').trim()) {
        console.warn(`%c[LightGrid.js Grid Instance] --color-1 not found for ${this.container.id || '(no ID)'}. Defaulting to green.`, 'color: #ff9900;');
      }

      if (width === 0 || height === 0) {
        console.warn(`%c[LightGrid.js Grid Instance] ${this.container.id || '(no ID)'} has zero dimensions (offsetWidth/offsetHeight). Canvas will be hidden.`, 'color: #ff9900;');
        this.canvas.style.display = 'none';
        this.dots = [];
        return;
      }
      this.canvas.style.display = 'block';

      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.ctx.scale(dpr, dpr);

      this.dots = [];
      const colWidth = width / this.cols;
      const rowHeight = height / this.rows;

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const initialOffDuration = MIN_OFF_DURATION_MS + Math.random() * (MAX_OFF_DURATION_MS - MIN_OFF_DURATION_MS);
          this.dots.push({
            x: colWidth * c + (colWidth - dotSizePx) / 2,
            y: rowHeight * r + (rowHeight - dotSizePx) / 2,
            size: dotSizePx,
            
            isCurrentlyOn: false, // Start off
            onDuration: MIN_ON_DURATION_MS + Math.random() * (MAX_ON_DURATION_MS - MIN_ON_DURATION_MS),
            offDuration: initialOffDuration,
            timeInCurrentState: Math.random() * initialOffDuration, // Start at a random point in its first off-cycle

            isFlickering: false,
            flickerEndTime: 0,
            flickerNextToggleTime: 0,
            flickerIsCurrentlyOn: false
          });
        }
      }
      this.lastTimestamp = performance.now(); // Initialize for first deltaTime calculation
      console.log(`%c[LightGrid.js Grid Instance] Setup complete for ${this.container.id || '(no ID)'}. Dots: ${this.dots.length}`, 'color: #7f00ff;');
    }

    draw(timestamp) {
      if (!this.ctx || this.canvas.style.display === 'none') {
        return;
      }
      
      const deltaTime = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      if (this.dots.length === 0 && (this.canvas.width === 0 || this.canvas.height === 0)) {
          // If setup resulted in no dots (e.g. zero dimension container) and canvas is zero, skip drawing.
          return;
      }
      
      const w = this.canvas.width / (window.devicePixelRatio || 1);
      const h = this.canvas.height / (window.devicePixelRatio || 1);
      this.ctx.clearRect(0, 0, w, h);

      for (const dot of this.dots) {
        dot.timeInCurrentState += deltaTime;
        let currentDotOpacity = dot.isCurrentlyOn ? maxOpacity : minOpacity;

        if (dot.isFlickering) {
          if (timestamp >= dot.flickerEndTime) {
            dot.isFlickering = false;
            // Ensure it settles into its intended state post-flicker
            currentDotOpacity = dot.isCurrentlyOn ? maxOpacity : minOpacity;
          } else {
            if (timestamp >= dot.flickerNextToggleTime) {
              dot.flickerIsCurrentlyOn = !dot.flickerIsCurrentlyOn;
              dot.flickerNextToggleTime = timestamp + FLICKER_INTERVAL_MS;
            }
            currentDotOpacity = dot.flickerIsCurrentlyOn ? maxOpacity : minOpacity * 0.5; // Flicker can be dimmer
          }
        } else { // Not flickering
          if (dot.isCurrentlyOn) {
            if (dot.timeInCurrentState >= dot.onDuration) {
              dot.isCurrentlyOn = false;
              dot.timeInCurrentState = 0;
              dot.offDuration = MIN_OFF_DURATION_MS + Math.random() * (MAX_OFF_DURATION_MS - MIN_OFF_DURATION_MS);
              currentDotOpacity = minOpacity;
            } else {
              // Chance to start flickering while on
              if (Math.random() < FLICKER_PER_FRAME_CHANCE) {
                dot.isFlickering = true;
                dot.flickerEndTime = timestamp + FLICKER_DURATION_MS;
                dot.flickerNextToggleTime = timestamp; // Start flicker immediately
                dot.flickerIsCurrentlyOn = dot.isCurrentlyOn; // Flicker starts from current on/off state
              }
            }
          } else { // Currently off
            if (dot.timeInCurrentState >= dot.offDuration) {
              dot.isCurrentlyOn = true;
              dot.timeInCurrentState = 0;
              dot.onDuration = MIN_ON_DURATION_MS + Math.random() * (MAX_ON_DURATION_MS - MIN_ON_DURATION_MS);
              currentDotOpacity = maxOpacity;
            }
          }
        }
        
        // this.ctx.globalAlpha = currentDotOpacity; // Old
        
        this.ctx.globalAlpha = currentDotOpacity;
        this.ctx.fillStyle = this.dotColor; // Use instance-specific color
        this.ctx.beginPath();
        this.ctx.arc(dot.x + dot.size / 2, dot.y + dot.size / 2, dot.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.globalAlpha = 1; // Reset global alpha
    }

    destroy() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
      console.log('%c[LightGrid.js Grid Instance] Destroyed:', 'color: #7f00ff;', this.container);
    }
  }

  const initializeGrids = () => {
    console.log('%c[LightGrid.js] initializeGrids CALLED', 'color: #00ccff; font-weight: bold;');
    const containers = document.querySelectorAll(selector);
    if (!containers.length) {
      console.warn(`%c[LightGrid.js] NO ELEMENTS FOUND for selector "${selector}"`, 'color: #ff9900; font-weight: bold;');
      return;
    }
    console.log(`%c[LightGrid.js] Found ${containers.length} elements for "${selector}"`, 'color: #00ccff;', containers);

    // Destroy existing grids before reinitializing if any
    if (window.lightGridInstances && window.lightGridInstances.length > 0) {
        console.log(`%c[LightGrid.js] Destroying ${window.lightGridInstances.length} existing grid instances.`, 'color: #ff9900;');
        window.lightGridInstances.forEach(grid => grid.destroy());
    }
    
    window.lightGridInstances = Array.from(containers).map(container => new Grid(container));

    let animFrameId;
    function animateLoop(ts) { // ts is timestamp from requestAnimationFrame
      window.lightGridInstances.forEach(grid => grid.draw(ts));
      animFrameId = requestAnimationFrame(animateLoop);
    }
    
    if (window.lightGridGlobalAnimationId) {
        cancelAnimationFrame(window.lightGridGlobalAnimationId);
    }
    animFrameId = requestAnimationFrame(animateLoop);
    window.lightGridGlobalAnimationId = animFrameId;
    console.log(`%c[LightGrid.js] Animation loop started. Global ID: ${window.lightGridGlobalAnimationId}`, 'color: #00ccff;');
  };

  if (document.readyState === 'loading') {
    console.log('%c[LightGrid.js] DOM loading, deferring init.', 'color: #ff9900;');
    document.addEventListener('DOMContentLoaded', initializeGrids);
  } else {
    console.log('%c[LightGrid.js] DOM ready, initializing now.', 'color: #00ff00; font-weight: bold;');
    initializeGrids();
  }
}
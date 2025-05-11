/**
 * Initializes a cached, batched light grid animation on all containers matching selector.
 * Ensures the grid of dots is centered with equal margins.
 * @param {string} selector CSS selector for container elements
 */
export function initLightGrid(selector = '.light-grid') {
  const s = getComputedStyle(document.documentElement);
  const dotSize = parseFloat(s.getPropertyValue('--dot-size'));
  const spacing = parseFloat(s.getPropertyValue('--dot-spacing'));
  const minOpacity = parseFloat(s.getPropertyValue('--flash-min-opacity'));
  const maxOpacity = parseFloat(s.getPropertyValue('--flash-max-opacity'));
  const fps = parseFloat(s.getPropertyValue('--fps'));
  const multiplier = parseInt(s.getPropertyValue('--cycle-multiplier'), 10);
  const speed = parseFloat(s.getPropertyValue('--speed-multiplier')); // slowdown_multiplier
  const dotColor = s.getPropertyValue('--dot-color').trim();

  const frameDuration = 1000 / (fps > 0 ? fps : 1); // Duration of one "phase" (on or off) based on FPS
  const totalPeriod = frameDuration * 2 * multiplier * speed; // Total cycle length for the random delay

  // Create a single circle for reuse
  const circleCache = document.createElement('canvas');
  circleCache.width = circleCache.height = dotSize;
  const cc = circleCache.getContext('2d');
  if (cc) {
    cc.beginPath();
    cc.arc(dotSize / 2, dotSize / 2, dotSize / 2, 0, 2 * Math.PI);
    cc.fillStyle = dotColor;
    cc.fill();
  } else {
    console.error("Failed to get 2D context for circle cache canvas.");
    return; 
  }

  class Grid {
    constructor(container) {
      this.container = container;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'light-grid-canvas';
      this.canvas.style.backgroundColor = 'transparent';
      this.ctx = this.canvas.getContext('2d');
      container.appendChild(this.canvas);
      this.dots = [];
      this.visualWidth = 0; // For actual canvas drawing dimensions
      this.visualHeight = 0; // For actual canvas drawing dimensions
      if (!this.ctx) {
        console.error("Failed to get 2D context for grid canvas.");
      }
      this.setup();
    }

    setup() {
      if (!this.ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const style = getComputedStyle(this.container);

      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const paddingRight = parseFloat(style.paddingRight) || 0;
      const paddingTop = parseFloat(style.paddingTop) || 0;
      const paddingBottom = parseFloat(style.paddingBottom) || 0;

      // Step 1: Determine visual dimensions (post-transform) for the canvas element itself.
      const visualRect = this.container.getBoundingClientRect();
      this.visualWidth = visualRect.width;
      this.visualHeight = visualRect.height;

      this.canvas.width = this.visualWidth * dpr;
      this.canvas.height = this.visualHeight * dpr;
      this.ctx.scale(dpr, dpr);
      // Clear the canvas based on its visual size.
      this.ctx.clearRect(0, 0, this.visualWidth, this.visualHeight);

      // Step 2: Determine layout dimensions for calculating dot columns, rows, and positions.
      // These should reflect the "intended" untransformed size of the grid.
      const cssMinWidth = parseFloat(style.minWidth) || 0;
      const cssMinHeight = parseFloat(style.minHeight) || 0;
      
      const currentOffsetWidth = this.container.offsetWidth; // Element's layout width before its own transforms
      const currentOffsetHeight = this.container.offsetHeight; // Element's layout height

      // Use the maximum of the element's current layout size and its CSS min-size.
      // This allows CSS min-size to define the grid structure if offsetWidth/Height are small due to parent transforms.
      const layoutWidth = Math.max(currentOffsetWidth, cssMinWidth);
      const layoutHeight = Math.max(currentOffsetHeight, cssMinHeight);

      const contentWidthForLayout = Math.max(0, layoutWidth - paddingLeft - paddingRight);
      const contentHeightForLayout = Math.max(0, layoutHeight - paddingTop - paddingBottom);
      
      if (spacing <= 0 || dotSize <= 0 || contentWidthForLayout < dotSize || contentHeightForLayout < dotSize) {
        this.cols = 0;
        this.rows = 0;
      } else {
        this.cols = Math.max(0, Math.floor((contentWidthForLayout - dotSize) / spacing) + 1);
        this.rows = Math.max(0, Math.floor((contentHeightForLayout - dotSize) / spacing) + 1);
      }

      const gridWidth = (this.cols > 0 ? (this.cols - 1) * spacing + dotSize : 0);
      const gridHeight = (this.rows > 0 ? (this.rows - 1) * spacing + dotSize : 0);

      this.offsetX = paddingLeft + (contentWidthForLayout - gridWidth) / 2;
      this.offsetY = paddingTop + (contentHeightForLayout - gridHeight) / 2;

      this.dots.length = 0;
      if (this.cols > 0 && this.rows > 0) {
        for (let y = 0; y < this.rows; y++) {
          for (let x = 0; x < this.cols; x++) {
            const px = this.offsetX + x * spacing;
            const py = this.offsetY + y * spacing;
            const delay = Math.random() * totalPeriod;
            this.dots.push({ x: px, y: py, delay });
          }
        }
      }
    }

    draw(now) {
      if (!this.ctx || this.cols === 0 || this.rows === 0) {
        // If no columns or rows, ensure canvas is clear if it has visual dimensions
        if (this.ctx && this.visualWidth > 0 && this.visualHeight > 0) {
            this.ctx.clearRect(0, 0, this.visualWidth, this.visualHeight);
        }
        return;
      }
      const ctx = this.ctx;
      // Clear using visual dimensions of the canvas
      ctx.clearRect(0, 0, this.visualWidth, this.visualHeight);
      
      const singleCycleDuration = frameDuration * 2 * speed;
      const onDuration = frameDuration * speed;

      for (const dot of this.dots) {
        const timeInPattern = (now + dot.delay) % totalPeriod;
        const timeInSingleCycle = timeInPattern % singleCycleDuration;

        if (timeInSingleCycle < onDuration) {
          ctx.globalAlpha = maxOpacity;
        } else {
          ctx.globalAlpha = minOpacity;
        }
        ctx.drawImage(circleCache, dot.x, dot.y);
      }
    }
  }

  const gridElements = Array.from(document.querySelectorAll(selector));
  if (gridElements.length === 0) {
    console.warn(`LightGrid: No elements found with selector '${selector}'. Ensure target elements exist.`);
    return;
  }
  const grids = gridElements.map(el => new Grid(el));

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function animate(timestamp) {
    grids.forEach(g => g.draw(timestamp));
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // Debounced resize handler
  const debouncedSetup = debounce(() => {
    grids.forEach(g => g.setup());
  }, 250); // 250ms delay

  window.addEventListener('resize', debouncedSetup);
}


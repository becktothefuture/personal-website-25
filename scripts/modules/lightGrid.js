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
      this.ctx = this.canvas.getContext('2d');
      container.appendChild(this.canvas);
      this.dots = [];
      this.onDots = [];
      this.offDots = [];
      if (!this.ctx) {
        console.error("Failed to get 2D context for grid canvas.");
      }
      this.setup();
    }

    setup() {
      if (!this.ctx) return;
      const rect = this.container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.scale(dpr, dpr);

      this.cols = Math.max(0, Math.floor((this.width - dotSize) / spacing) + 1);
      this.rows = Math.max(0, Math.floor((this.height - dotSize) / spacing) + 1);

      const gridWidth = (this.cols > 0 ? (this.cols - 1) * spacing + dotSize : 0);
      const gridHeight = (this.rows > 0 ? (this.rows - 1) * spacing + dotSize : 0);

      this.offsetX = (this.width - gridWidth) / 2;
      this.offsetY = (this.height - gridHeight) / 2;

      this.dots.length = 0;
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          const px = this.offsetX + x * spacing;
          const py = this.offsetY + y * spacing;
          const delay = Math.random() * totalPeriod;
          this.dots.push({ x: px, y: py, delay });
        }
      }
    }

    draw(now) {
      if (!this.ctx || this.cols === 0 || this.rows === 0) return;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      this.onDots.length = 0;
      this.offDots.length = 0;

      for (const dot of this.dots) {
        const timeInPattern = (now + dot.delay) % totalPeriod;
        const singleCycleDuration = frameDuration * 2 * speed;
        const timeInSingleCycle = timeInPattern % singleCycleDuration;

        if (timeInSingleCycle < frameDuration * speed) {
          this.onDots.push(dot);
        } else {
          this.offDots.push(dot);
        }
      }

      ctx.globalAlpha = maxOpacity;
      for (const d of this.onDots) ctx.drawImage(circleCache, d.x, d.y);

      ctx.globalAlpha = minOpacity;
      for (const d of this.offDots) ctx.drawImage(circleCache, d.x, d.y);
    }
  }

  const gridElements = Array.from(document.querySelectorAll(selector));
  if (gridElements.length === 0) {
    console.warn(`LightGrid: No elements found with selector '${selector}'. Ensure target elements exist.`);
    return;
  }
  const grids = gridElements.map(el => new Grid(el));

  function animate(timestamp) {
    grids.forEach(g => g.draw(timestamp));
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  window.addEventListener('resize', () => grids.forEach(g => {
    g.setup();
  }));
}


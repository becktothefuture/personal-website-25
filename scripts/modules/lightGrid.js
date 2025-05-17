export function initLightGrid(selector = '.light-grid') {
  const style = getComputedStyle(document.documentElement);
  const dotSizeEm = 3; // Default dot size in em
  const minOpacity = parseFloat(style.getPropertyValue('--flash-min-opacity')) || 0.2;
  const maxOpacity = parseFloat(style.getPropertyValue('--flash-max-opacity')) || 1;
  const fps = parseFloat(style.getPropertyValue('--fps')) || 30;
  const multiplier = parseInt(style.getPropertyValue('--cycle-multiplier'), 10) || 3;
  const speed = parseFloat(style.getPropertyValue('--speed-multiplier')) || 1;
  const dotColor = style.getPropertyValue('--dot-color').trim() || '#00f';

  const frameDuration = 1000 / fps;
  const totalPeriod = frameDuration * 2 * multiplier * speed;

  class Grid {
    constructor(container) {
      this.container = container;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'light-grid-canvas';
      this.canvas.style.backgroundColor = 'transparent';
      this.ctx = this.canvas.getContext('2d');
      this.container.appendChild(this.canvas);

      // Add default values of 5 for both cols and rows if not specified
      this.cols = parseInt(container.dataset.cols, 10) || 5;
      this.rows = parseInt(container.dataset.rows, 10) || 5;
      this.dots = [];

      this.setup();
    }

    setup() {
      if (!this.ctx) {
        this.dots = [];
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = this.container.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        console.warn('LightGrid: container size is zero.');
        return;
      }

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);

      // Convert em to pixels based on container's font size
      const containerStyle = getComputedStyle(this.container);
      const fontSizePx = parseFloat(containerStyle.fontSize);
      const dotSizePx = dotSizeEm * fontSizePx;

      // Calculate the number of dots that can fit in the container
      const horizontalSpacing = rect.width / this.cols;
      const verticalSpacing = rect.height / this.rows;

      // Ensure the spacing is not less than the dot size
      const minSpacing = dotSizePx * 1.5;
      if (horizontalSpacing < minSpacing || verticalSpacing < minSpacing) {
        // Recalculate cols and rows based on minimum spacing
        const adjustedCols = Math.floor(rect.width / minSpacing);
        const adjustedRows = Math.floor(rect.height / minSpacing);
        
        if (adjustedCols > 0 && adjustedRows > 0) {
          this.cols = adjustedCols;
          this.rows = adjustedRows;
        }
      }

      this.dots = [];
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const x = (rect.width / this.cols) * col + ((rect.width / this.cols) - dotSizePx) / 2;
          const y = (rect.height / this.rows) * row + ((rect.height / this.rows) - dotSizePx) / 2;
          
          this.dots.push({
            x,
            y,
            size: dotSizePx,
            delay: Math.random() * totalPeriod,
          });
        }
      }
    }

    draw(timestamp) {
      if (!this.ctx || this.dots.length === 0) {
        this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
        return;
      }

      const ctx = this.ctx;
      const w = this.canvas.width / (window.devicePixelRatio || 1);
      const h = this.canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, w, h);

      const singleCycle = frameDuration * 2 * speed;
      const onDuration = frameDuration * speed;

      for (const dot of this.dots) {
        const time = (timestamp + dot.delay) % totalPeriod;
        const cycleTime = time % singleCycle;

        ctx.globalAlpha = cycleTime < onDuration ? maxOpacity : minOpacity;
        
        // Draw the dot directly without using a cached canvas
        ctx.beginPath();
        ctx.arc(dot.x + dot.size / 2, dot.y + dot.size / 2, dot.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  } // End of Grid class

  // Encapsulate the main initialization logic
  const initializeActualGrids = () => {
    const containers = Array.from(document.querySelectorAll(selector));
    if (!containers.length) {
      console.warn(`LightGrid: no elements found for selector "${selector}" when initialization was attempted.`);
      return;
    }

    const grids = containers.map(container => new Grid(container));

    function animate(ts = 0) {
      grids.forEach(grid => grid.draw(ts));
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => grids.forEach(g => g.setup()), 200);
    });
  }; // End of initializeActualGrids

  // Ensure DOM is ready before initializing
  if (document.readyState === 'loading') {
    // Wait for the DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', initializeActualGrids);
  } else {
    // DOM is already loaded
    initializeActualGrids();
  }
}
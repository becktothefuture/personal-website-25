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

      this.cols = parseInt(container.dataset.cols, 10) || 5;
      this.rows = parseInt(container.dataset.rows, 10) || 5;
      this.dots = [];
      this.resizeObserver = null;

      // Initial setup attempt
      this.setup();

      // Use ResizeObserver to re-run setup if container size changes
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(entries => {
          if (entries && entries.length > 0) {
            const entry = entries[0];
            // Only run setup if the container has actual dimensions
            if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
              console.log(`LightGrid: ResizeObserver detected size change for container, re-running setup.`, this.container);
              this.setup();
            }
          }
        });
        this.resizeObserver.observe(this.container);
      } else {
        console.warn('LightGrid: ResizeObserver not supported. Grid might not update correctly if container size changes dynamically after initial load.');
      }
    }

    setup() {
      const rect = this.container.getBoundingClientRect();
      console.log(`LightGrid: Running setup for container. ID: ${this.container.id || '(no ID)'}, Rect: W=${rect.width}, H=${rect.height}`);

      if (!this.ctx) {
        this.dots = [];
        console.warn(`LightGrid: No canvas context for container ID: ${this.container.id || '(no ID)'}`);
        return;
      }

      if (rect.width === 0 || rect.height === 0) {
        console.warn(`LightGrid: Container ID: ${this.container.id || '(no ID)'} has zero dimensions (W:${rect.width}, H:${rect.height}). Clearing dots and waiting for size change.`);
        this.dots = [];
        // Clear the canvas
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr; // will be 0
        this.canvas.height = rect.height * dpr; // will be 0
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      // Ensure this.canvas.width and this.canvas.height are set based on rect and dpr
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);

      const containerStyle = getComputedStyle(this.container);
      const fontSizePx = parseFloat(containerStyle.fontSize);
      const dotSizePx = dotSizeEm * fontSizePx;

      let currentCols = this.cols;
      let currentRows = this.rows;

      const minSpacing = dotSizePx * 1.5;
      if ((rect.width / currentCols) < minSpacing || (rect.height / currentRows) < minSpacing) {
        const adjustedCols = Math.max(1, Math.floor(rect.width / minSpacing));
        const adjustedRows = Math.max(1, Math.floor(rect.height / minSpacing));
        
        if (adjustedCols > 0 && adjustedRows > 0) {
          console.log(`LightGrid: Adjusting cols/rows for container ID: ${this.container.id || '(no ID)'}. Original: ${currentCols}x${currentRows}, Adjusted: ${adjustedCols}x${adjustedRows}`);
          currentCols = adjustedCols;
          currentRows = adjustedRows;
        }
      }
      
      this.dots = [];
      for (let row = 0; row < currentRows; row++) {
        for (let col = 0; col < currentCols; col++) {
          const x = (rect.width / currentCols) * col + ((rect.width / currentCols) - dotSizePx) / 2;
          const y = (rect.height / currentRows) * row + ((rect.height / currentRows) - dotSizePx) / 2;
          
          if (x + dotSizePx <= rect.width && y + dotSizePx <= rect.height && x >= 0 && y >=0) { // Ensure dot is within bounds
            this.dots.push({
              x,
              y,
              size: dotSizePx,
              delay: Math.random() * totalPeriod,
            });
          }
        }
      }
      console.log(`LightGrid: Setup complete for container ID: ${this.container.id || '(no ID)'}. Dots created: ${this.dots.length}`);
    }

    draw(timestamp) {
      if (!this.ctx) return;

      if (this.dots.length === 0) {
        // If no dots (e.g. container was 0x0), ensure canvas is clear
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.width / dpr;
        const h = this.canvas.height / dpr;
        if (w > 0 && h > 0) {
             this.ctx.clearRect(0, 0, w, h);
        }
        return;
      }

      const ctx = this.ctx;
      const dpr = window.devicePixelRatio || 1;
      const w = this.canvas.width / dpr;
      const h = this.canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      const singleCycle = frameDuration * 2 * speed;
      const onDuration = frameDuration * speed;

      for (const dot of this.dots) {
        const time = (timestamp + dot.delay) % totalPeriod;
        const cycleTime = time % singleCycle;

        ctx.globalAlpha = cycleTime < onDuration ? maxOpacity : minOpacity;
        
        ctx.beginPath();
        ctx.arc(dot.x + dot.size / 2, dot.y + dot.size / 2, dot.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    destroy() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      // Optional: remove canvas, etc.
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
      this.dots = [];
    }
  } // End of Grid class

  // Encapsulate the main initialization logic
  const initializeActualGrids = () => {
    const containers = Array.from(document.querySelectorAll(selector));
    if (!containers.length) {
      console.warn(`LightGrid: no elements found for selector "${selector}" when initialization was attempted.`);
      return []; // Return empty array
    }

    const grids = containers.map(container => new Grid(container));

    function animate(ts = 0) {
      grids.forEach(grid => grid.draw(ts));
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    // Keep window resize for global changes like font-size affecting em units
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        console.log("LightGrid: Window resize event, re-running setup for all grids.");
        grids.forEach(g => g.setup());
      }, 200);
    });
    return grids; // Return the created grids
  }; // End of initializeActualGrids

  // Ensure DOM is ready before initializing
  let initializedGrids = [];
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializedGrids = initializeActualGrids();
    });
  } else {
    initializedGrids = initializeActualGrids();
  }
  
  // Optional: return a way to access grids or re-init, though not used currently
  // return {
  //   grids: initializedGrids,
  //   reinit: initializeActualGrids // if needed
  // };
}
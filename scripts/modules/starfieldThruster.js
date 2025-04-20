/**
 * Starfield Thruster Module
 * 
 * This module renders a WebGL-based starfield animation that creates the
 * illusion of moving through space. The star movement speed is tied to
 * scroll velocity, enhancing the feeling of acceleration. Features include:
 * - WebGL-powered star rendering for performance
 * - Dynamic star movement based on scroll acceleration
 * - Adaptive performance optimization
 * - Depth-based star scaling and opacity
 * 
 * Dependencies: scrollTracker.js
 */

console.log('Starfield Thruster Module Initialized');

import { scrollTracker } from './scrollTracker.js';

/**
 * starConfig now has an optional adaptivePerformance flag
 * that, if set to true, can skip frames when speeds or star counts are huge.
 */
export const starConfig = {
  baseSpeed: 3,      
  numStars: 300,
  maxDepth: 5000,
  perspective: 500,
  fieldSize: 3000,
  pointSizeFactor: 10,
  starColor: [0.8, 1.0, 0.8],
  adaptivePerformance: false,
  accelerationMultiplier: 13  // Changed from speedMultiplier to accelerationMultiplier
};

class StarfieldThruster {
  #canvas;
  #gl;
  #program;
  #aPositionLoc;
  #uPerspectiveLoc;
  #uResolutionLoc;
  #uMaxDepthLoc;
  #uPointSizeFactorLoc;
  #uStarColorLoc;
  #resizeObserver; // Add declaration for the private field here

  #starBuffer;
  #stars;
  #lastFrameTime = performance.now();
  #resolution = [0, 0]; // Initialize to zero, will be set in #resizeCanvas
  #frameSkipCounter = 0; 

  
  // Change to track acceleration instead of speed
  extraMovement = 0;

  constructor() {
    this.#canvas = document.getElementById('starfield');
    if (!this.#canvas) {
      console.error("Canvas element #starfield not found.");
      return;
    }
    
    // Apply CSS directly to make canvas 100% of parent container
    this.#canvas.style.width = '100%';
    this.#canvas.style.height = '100%';
    
    // Create WebGL context with alpha transparency enabled
    this.#gl = this.#canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!this.#gl) {
      console.error("WebGL not supported.");
      return;
    }
    
    this.#resizeCanvas(); // Set canvas size before initializing GL
    this.#initGL();
    this.#initStars();
    
    // Create a ResizeObserver to better handle size changes
    this.#resizeObserver = new ResizeObserver(() => {
      this.#resizeCanvas();
    });
    
    // Observe the parent container
    const parent = this.#canvas.parentElement;
    if (parent) {
      this.#resizeObserver.observe(parent);
    }
    
    // Still keep the resize listener for older browsers
    window.addEventListener('resize', () => this.#resizeCanvas());

    // Listen to the normalized update event from scrollTracker and use acceleration
    scrollTracker.on("normalizedUpdate", (data) => {
      // Use acceleration instead of speed for movement
      this.extraMovement = data.normalizedAcceleration * starConfig.accelerationMultiplier;
      
      // Debug log
      if (data.normalizedAcceleration > 0.1) {
        console.log(`Starfield Movement: ${this.extraMovement.toFixed(2)} from acceleration: ${data.normalizedAcceleration.toFixed(2)}`);
      }
    });

    requestAnimationFrame(this.#animate.bind(this));
  }
  
  #initGL() {
    const gl = this.#gl;
    const vsSource = `
      attribute vec3 a_position;
      uniform float u_perspective;
      uniform vec2 u_resolution;
      uniform float u_maxDepth;
      uniform float u_pointSizeFactor;
      varying float vAlpha;

      void main() {
        
        float distFactor = clamp((-a_position.z) / u_maxDepth, 0.0, 1.0);

        
        float fadeIn = smoothstep(0.0, 0.2, distFactor);
        float fadeOut = 1.0 - smoothstep(0.8, 1.0, distFactor);
        vAlpha = fadeIn * fadeOut;

        
        float scale = u_perspective / -a_position.z;
        vec2 pos = a_position.xy * scale + u_resolution * 0.5;
        vec2 ndc = (pos / u_resolution) * 2.0 - 1.0;
        ndc.y = -ndc.y;
        gl_Position = vec4(ndc, 0.0, 1.0);
        gl_PointSize = u_pointSizeFactor * scale;
      }
    `;
    const fsSource = `
      precision mediump float;
      uniform vec3 u_starColor;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(u_starColor, vAlpha);
      }
    `;
    const vShader = this.#compileShader(gl.VERTEX_SHADER, vsSource);
    const fShader = this.#compileShader(gl.FRAGMENT_SHADER, fsSource);

    this.#program = gl.createProgram();
    gl.attachShader(this.#program, vShader);
    gl.attachShader(this.#program, fShader);
    gl.linkProgram(this.#program);

    if (!gl.getProgramParameter(this.#program, gl.LINK_STATUS)) {
      console.error("Shader link error:", gl.getProgramInfoLog(this.#program));
      return;
    }
    gl.useProgram(this.#program);

    this.#aPositionLoc = gl.getAttribLocation(this.#program, "a_position");
    this.#uPerspectiveLoc = gl.getUniformLocation(this.#program, "u_perspective");
    this.#uResolutionLoc = gl.getUniformLocation(this.#program, "u_resolution");
    this.#uMaxDepthLoc = gl.getUniformLocation(this.#program, "u_maxDepth");
    this.#uPointSizeFactorLoc = gl.getUniformLocation(this.#program, "u_pointSizeFactor");
    this.#uStarColorLoc = gl.getUniformLocation(this.#program, "u_starColor");

    this.#starBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#starBuffer);
    gl.enableVertexAttribArray(this.#aPositionLoc);
    gl.vertexAttribPointer(this.#aPositionLoc, 3, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  }
  
  #compileShader(type, source) {
    const gl = this.#gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  
  #initStars() {
    const totalFloats = starConfig.numStars * 3;
    this.#stars = new Float32Array(totalFloats);
    for (let i = 0; i < starConfig.numStars; i++) {
      this.#stars[i * 3]     = (Math.random() - 0.5) * starConfig.fieldSize;
      this.#stars[i * 3 + 1] = (Math.random() - 0.5) * starConfig.fieldSize;
      this.#stars[i * 3 + 2] = -Math.random() * starConfig.maxDepth;
    }
    this.#updateBuffer();
  }
  
  #updateBuffer() {
    const gl = this.#gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#starBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.#stars, gl.DYNAMIC_DRAW);
  }
  
  #resizeCanvas() {
    const canvas = this.#canvas;
    // Get dimensions from parent element
    const parent = canvas.parentElement;
    if (!parent) return;
    
    const displayWidth = parent.clientWidth;
    const displayHeight = parent.clientHeight;
    
    // Only update canvas dimensions if they've actually changed
    // This prevents unnecessary resets of the WebGL context
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      // Set canvas resolution to match display size
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      // Update resolution with canvas dimensions
      this.#resolution = [displayWidth, displayHeight];
      
      // Update viewport if GL is initialized
      if (this.#gl) {
        this.#gl.viewport(0, 0, displayWidth, displayHeight);
      }
      
      console.log(`Resized starfield canvas to ${displayWidth}x${displayHeight}`);
    }
  }
  
  #animate(timestamp) {
    const dt = (timestamp - this.#lastFrameTime) / 1000;
    this.#lastFrameTime = timestamp;

    
    if (starConfig.adaptivePerformance && this.#shouldSkipFrame()) {
      requestAnimationFrame(this.#animate.bind(this));
      return;
    }

    // Calculate total movement using base speed plus extra from acceleration
    const totalMovement = starConfig.baseSpeed + this.extraMovement;
    
    // Move stars based on combined movement
    for (let i = 0; i < starConfig.numStars; i++) {
      const zIdx = i * 3 + 2;
      this.#stars[zIdx] += totalMovement * dt * 50;
      if (this.#stars[zIdx] >= 0) {
        this.#stars[zIdx] -= starConfig.maxDepth;
      }
    }
    this.#updateBuffer();
    this.#drawScene();
    requestAnimationFrame(this.#animate.bind(this));
  }

  /**
   * Simple heuristic to skip frames if movement or star count is huge
   */
  #shouldSkipFrame() {
    const movementFactor = (starConfig.baseSpeed + this.extraMovement) * 0.27778;
    
    if (movementFactor > 300 || starConfig.numStars > 10000) {
      this.#frameSkipCounter = (this.#frameSkipCounter + 1) % 2;
      return this.#frameSkipCounter === 1;
    }
    return false;
  }
  
  #drawScene() {
    const gl = this.#gl;
    // Set clear color with alpha 0 (transparent)
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.#program);
    gl.uniform1f(this.#uPerspectiveLoc, starConfig.perspective);
    gl.uniform2fv(this.#uResolutionLoc, this.#resolution);
    gl.uniform1f(this.#uMaxDepthLoc, starConfig.maxDepth);
    gl.uniform1f(this.#uPointSizeFactorLoc, starConfig.pointSizeFactor);
    gl.uniform3fv(this.#uStarColorLoc, starConfig.starColor);
    gl.drawArrays(gl.POINTS, 0, starConfig.numStars);
  }

  /**
   * Re-initializes star positions with the current maxDepth
   */
  resetStars() {
    this.#initStars();
  }
}

let starfieldThrusterInstance = null;

function initStarfieldThruster() {
  if (!starfieldThrusterInstance) {
    starfieldThrusterInstance = new StarfieldThruster();
  }
  return starfieldThrusterInstance;
}

export { initStarfieldThruster };
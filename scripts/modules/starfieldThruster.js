// starfieldThruster.js
import { scrollTracker } from './scrollTracker.js';

/**
 * starConfig now has an optional adaptivePerformance flag
 * that, if set to true, can skip frames when speeds or star counts are huge.
 */
export const starConfig = {
  baseSpeed: 20,      // Default starfield speed in km/h
  numStars: 400,
  maxDepth: 1500,
  perspective: 500,
  fieldSize: 2000,
  pointSizeFactor: 13.4,
  starColor: [0.8, 1.0, 0.8],
  adaptivePerformance: true // can skip frames if star count or speeds are huge
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

  #starBuffer;
  #stars;
  #lastFrameTime = performance.now();
  #resolution = [window.innerWidth, window.innerHeight];
  #frameSkipCounter = 0; // for adaptive performance

  // extraSpeed (km/h) updated by scrollTracker
  extraSpeed = 0;

  constructor() {
    this.#canvas = document.getElementById('starfield');
    if (!this.#canvas) {
      console.error("Canvas element #starfield not found.");
      return;
    }
    this.#gl = this.#canvas.getContext('webgl');
    if (!this.#gl) {
      console.error("WebGL not supported.");
      return;
    }
    this.#initGL();
    this.#initStars();
    this.#resizeCanvas();
    window.addEventListener('resize', () => this.#resizeCanvas());

    // Subscribe to scrollTracker updates
    scrollTracker.on("update", (data) => {
      this.extraSpeed = data.velocityKMH;
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
        // distFactor in [0..1], used for fade in/out
        float distFactor = clamp((-a_position.z) / u_maxDepth, 0.0, 1.0);

        // fade in from [0..0.2], fade out from [0.8..1.0]
        float fadeIn = smoothstep(0.0, 0.2, distFactor);
        float fadeOut = 1.0 - smoothstep(0.8, 1.0, distFactor);
        vAlpha = fadeIn * fadeOut;

        // simple perspective transform
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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.#gl.viewport(0, 0, canvas.width, canvas.height);
    this.#resolution = [canvas.width, canvas.height];
  }
  
  #animate(timestamp) {
    const dt = (timestamp - this.#lastFrameTime) / 1000;
    this.#lastFrameTime = timestamp;

    // Optional performance adaptation
    if (starConfig.adaptivePerformance && this.#shouldSkipFrame()) {
      requestAnimationFrame(this.#animate.bind(this));
      return;
    }

    // starfield speed = baseSpeed + extraSpeed (km/h)
    const totalSpeed = starConfig.baseSpeed + this.extraSpeed;
    const speedMS = totalSpeed * 0.27778;
    for (let i = 0; i < starConfig.numStars; i++) {
      const zIdx = i * 3 + 2;
      this.#stars[zIdx] += speedMS * dt * 50;
      if (this.#stars[zIdx] >= 0) {
        this.#stars[zIdx] -= starConfig.maxDepth;
      }
    }
    this.#updateBuffer();
    this.#drawScene();
    requestAnimationFrame(this.#animate.bind(this));
  }

  /**
   * Simple heuristic to skip frames if speed or star count is huge
   */
  #shouldSkipFrame() {
    const speedMS = (starConfig.baseSpeed + this.extraSpeed) * 0.27778;
    // e.g., if speed is above 300 m/s or star count is above 10k, skip every other frame
    if (speedMS > 300 || starConfig.numStars > 10000) {
      this.#frameSkipCounter = (this.#frameSkipCounter + 1) % 2;
      return this.#frameSkipCounter === 1;
    }
    return false;
  }
  
  #drawScene() {
    const gl = this.#gl;
    gl.clearColor(0, 0, 0, 1);
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
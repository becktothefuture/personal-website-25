// starfieldThruster.js
import { scrollTracker } from './scrollTracker.js';

const CONFIG = {
  numStars: 400,
  baseSpeed: 2,      // Base starfield speed.
  maxDepth: 1500,    // Stars will have z from -maxDepth to 0.
  perspective: 500,  // Perspective factor.
};

class StarfieldThruster {
  // Private fields for WebGL and star data.
  #canvas;
  #gl;
  #program;
  #aPositionLocation;
  #uPerspectiveLocation;
  #uResolutionLocation;
  #starBuffer;
  #stars;            // Float32Array storing star positions [x, y, z].
  #lastFrameTime = performance.now();
  #resolution = [window.innerWidth, window.innerHeight];

  // Extra speed updated via scrollTracker events.
  extraSpeed = 0;

  constructor() {
    this.#canvas = document.getElementById('starfield');
    if (!this.#canvas) {
      console.error("Canvas element with id 'starfield' not found.");
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
    // Subscribe to scrollTracker events to update extraSpeed.
    scrollTracker.on("update", (data) => {
      this.extraSpeed = data.velocity;
    });
    requestAnimationFrame(this.#animate.bind(this));
  }
  
  // Initialize WebGL: compile shaders, link program, and set up buffer.
  #initGL() {
    const gl = this.#gl;
    // Vertex shader replicates a 2D perspective projection.
    const vsSource = `
      attribute vec3 a_position;
      uniform float u_perspective;
      uniform vec2 u_resolution;
      void main() {
        // Compute scale using the inverse of z (z is negative).
        float scale = u_perspective / -a_position.z;
        // Transform x,y using the scale and center on the canvas.
        vec2 pos = a_position.xy * scale + u_resolution * 0.5;
        // Convert pixel coordinates to normalized device coordinates.
        vec2 ndc = (pos / u_resolution) * 2.0 - 1.0;
        // Flip the y-axis.
        ndc.y = -ndc.y;
        gl_Position = vec4(ndc, 0.0, 1.0);
        gl_PointSize = 2.0;
      }
    `;
    const fsSource = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `;
    const vertexShader = this.#compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.#compileShader(gl.FRAGMENT_SHADER, fsSource);
    this.#program = gl.createProgram();
    gl.attachShader(this.#program, vertexShader);
    gl.attachShader(this.#program, fragmentShader);
    gl.linkProgram(this.#program);
    if (!gl.getProgramParameter(this.#program, gl.LINK_STATUS)) {
      console.error('Shader program failed to link: ' + gl.getProgramInfoLog(this.#program));
      return;
    }
    gl.useProgram(this.#program);
    this.#aPositionLocation = gl.getAttribLocation(this.#program, "a_position");
    this.#uPerspectiveLocation = gl.getUniformLocation(this.#program, "u_perspective");
    this.#uResolutionLocation = gl.getUniformLocation(this.#program, "u_resolution");

    // Create and set up the buffer for star positions.
    this.#starBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#starBuffer);
    gl.enableVertexAttribArray(this.#aPositionLocation);
    gl.vertexAttribPointer(this.#aPositionLocation, 3, gl.FLOAT, false, 0, 0);
  }
  
  #compileShader(type, source) {
    const gl = this.#gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compilation error: " + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  
  // Generate initial star positions.
  #initStars() {
    this.#stars = new Float32Array(CONFIG.numStars * 3);
    for (let i = 0; i < CONFIG.numStars; i++) {
      // x in [-1000, 1000]
      this.#stars[i * 3] = (Math.random() * 2000) - 1000;
      // y in [-1000, 1000]
      this.#stars[i * 3 + 1] = (Math.random() * 2000) - 1000;
      // z in [-maxDepth, 0); stars start far away and move toward 0.
      this.#stars[i * 3 + 2] = - (Math.random() * (CONFIG.maxDepth - 0.1) + 0.1);
    }
    this.#updateBuffer();
  }
  
  // Upload star data to the GPU.
  #updateBuffer() {
    const gl = this.#gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#starBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.#stars, gl.DYNAMIC_DRAW);
  }
  
  // Resize canvas and update resolution uniform.
  #resizeCanvas() {
    const canvas = this.#canvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.#gl.viewport(0, 0, canvas.width, canvas.height);
    this.#resolution = [canvas.width, canvas.height];
  }
  
  // Animation loop: update star positions based on total speed and render.
  #animate(timestamp) {
    const dt = (timestamp - this.#lastFrameTime) / 1000;
    this.#lastFrameTime = timestamp;
    // Total speed comes from baseSpeed plus extraSpeed from scrollTracker.
    const totalSpeed = CONFIG.baseSpeed + this.extraSpeed;
    
    // Update each star's z position (moving from far to near).
    for (let i = 0; i < CONFIG.numStars; i++) {
      const index = i * 3 + 2;
      this.#stars[index] += totalSpeed * dt * 50; // Factor adjusts visual speed.
      if (this.#stars[index] >= 0) {
        // Star has reached the viewer; reset it to far away.
        this.#stars[index] = -CONFIG.maxDepth;
        // Randomize x and y.
        this.#stars[i * 3] = (Math.random() * 2000) - 1000;
        this.#stars[i * 3 + 1] = (Math.random() * 2000) - 1000;
      }
    }
    this.#updateBuffer();
    this.#drawScene();
    requestAnimationFrame(this.#animate.bind(this));
  }
  
  // Render the starfield.
  #drawScene() {
    const gl = this.#gl;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.#program);
    gl.uniform1f(this.#uPerspectiveLocation, CONFIG.perspective);
    gl.uniform2fv(this.#uResolutionLocation, this.#resolution);
    gl.drawArrays(gl.POINTS, 0, CONFIG.numStars);
  }
}

// Exported initialization function.
function initStarfieldThruster() {
  new StarfieldThruster();
}

export { initStarfieldThruster };
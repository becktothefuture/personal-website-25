// ------------------------------------------------------------
// Annotations:
// This code tracks mouse movements, scroll speed, click counts,
// and distance traveled. It uses requestAnimationFrame for
// continuous updates, performance.now() for precise timing, and
// precomputed DPI for distance calculations. Conversions are
// done only as needed, and DOM updates are cached.
// ------------------------------------------------------------

// **Constants**
const MPS_TO_KMH = 3.6;
const MPS_TO_MILES_H = 2.23694;
const CM_PER_INCH = 2.54;
const INCHES_PER_MILE = 63360;
const SMOOTH_FACTOR = 0.1; // Exponential smoothing factor
const SPEED_EASE_DURATION = 1; // seconds
const BASE_ROTATION_PER_FRAME = 1;
const MAX_SPEED_KMH = 200; // Used to normalise speed scale bars

// Motor configuration
const SCROLL_CONFIG = {
	MAX_REV: 90000, // Maximum RPM
	ACCELERATION_RATE: 1.03, // How quickly it revs up
	DECELERATION_RATE: 0.95, // How quickly it revs down
	REV_THRESHOLD: 50, // Minimum RPM before stopping
	WHEEL_SENSITIVITY: 0.3, // Multiplier for wheel input
	GEAR_RATIOS: [0, 2.5, 1.8, 1.4, 1.1, 0.9], // 0 is neutral
	RPM_TO_SPEED: 0.026, // Conversion factor from RPM to speed
};


/****************************
 * // **DYNAMIC VARIABLES** *
 ****************************/


let mouseXPercent = 0;
let mouseYPercent = 0;

let prevMouseX = null,
	prevMouseY = null,
	prevTime = null;
let speed = 0,
	displayedSpeed = 0,
	totalDistance = 0;
let cursorX = 0,
	cursorY = 0,
	targetCursorX = 0,
	targetCursorY = 0;
let scrollSpeed = 0,
	displayedScrollSpeed = 0;
let clickCount = 0;
let speedDecayStart = null,
	initialSpeed = 0;
let smoothedSpeedKmh = 0,
	smoothedSpeedMilesH = 0;
let smoothedScrollKmh = 0,
	smoothedScrollMilesH = 0;
let smoothedDistanceMeters = 0,
	smoothedDistanceInchesTotal = 0,
	smoothedDistanceMiles = 0;
let prevScrollTime = null;


// Motor state variables
let currentRPM = 0;
let currentGear = 1;
let engineTemp = 0;
let normalizedRPM = 0; // New variable to map RPM to a range from 0 to 1

let rotation = 0;
let turnstyleElements;

// **DPI Calculation**
let dpi_x = window.devicePixelRatio ? 96 * window.devicePixelRatio : 96;
dpi_x *= 5 / 6.5; // Adjusted based on your measurement
const rulerLength = (5 / 2.54) * dpi_x; // 5 cm in px

// **DOM Elements for Speed**
let speedValueM,
	speedValueMiles,
	speedValuePx,
	speedScale,
	scrollValueM,
	scrollValueMiles,
	scrollValuePx,
	scrollScale,
	clickCounter,
	distanceValueM,
	distanceValueMiles,
	cursorValue,
	miniMap,
	cursorDot,
	ruler;

// Initialize DOM elements
function initializeElements() {
	const elements = {
		"speed-value-m": (el) => (speedValueM = el),
		"speed-value-miles": (el) => (speedValueMiles = el),
		"speed-value-px": (el) => (speedValuePx = el),
		"speed-scale": (el) => (speedScale = el),
		"scroll-value-m": (el) => (scrollValueM = el),
		"scroll-value-miles": (el) => (scrollValueMiles = el),
		"scroll-value-px": (el) => (scrollValuePx = el),
		"scroll-scale": (el) => (scrollScale = el),
		"click-counter": (el) => (clickCounter = el),
		"distance-value-m": (el) => (distanceValueM = el),
		"distance-value-miles": (el) => (distanceValueMiles = el),
		"cursor-value": (el) => (cursorValue = el),
		"mini-map": (el) => (miniMap = el),
		"cursor-dot": (el) => (cursorDot = el),
		ruler: (el) => (ruler = el),
	};

	let missingElements = [];

	for (const [id, setter] of Object.entries(elements)) {
		const element = document.getElementById(id);
		if (element) {
			setter(element);
		} else {
			missingElements.push(id);
		}
	}

	if (missingElements.length > 0) {
		console.warn("Missing elements:", missingElements.join(", "));
		return false;
	}

	return true;
}

// **Ruler Setup**
function setupRuler() {
	if (!ruler) return;
	ruler.style.width = `${rulerLength}px`;
	for (let i = 0; i <= 50; i++) {
		const tick = document.createElement("div");
		tick.classList.add("tick");
		tick.style.left = `${(i / 50) * 100}%`;
		tick.classList.add(i % 10 === 0 ? "long" : "short");
		ruler.appendChild(tick);
	}
}

// Smooth cursor dot position
function updateCursorPosition() {
	if (!cursorDot || !miniMap) return;

	cursorX += (targetCursorX - cursorX) * 0.1;
	cursorY += (targetCursorY - cursorY) * 0.1;

	// Use transform instead of left/top for better performance
	cursorDot.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
}

// Mouse speed calculations
function updateMouseSpeed() {
	if (!speedValueM || !speedValueMiles || !speedValuePx || !speedScale) return;

	const currentTime = performance.now();
	// Ease-out for displayed mouse speed
	if (speed > 0) {
		displayedSpeed = speed;
		speedDecayStart = currentTime;
		initialSpeed = speed;
	} else if (displayedSpeed > 0) {
		const elapsed = (currentTime - speedDecayStart) / 1000;
		if (elapsed < SPEED_EASE_DURATION) {
			const t = elapsed / SPEED_EASE_DURATION;
			displayedSpeed = initialSpeed * (1 - t ** 3);
		} else {
			displayedSpeed = 0;
		}
	}

	// Convert pixel/s to m/s
	const speedMps = displayedSpeed / ((rulerLength / 5) * 100);
	const speedKmh = speedMps * MPS_TO_KMH;
	const speedMilesH = speedMps * MPS_TO_MILES_H;

	// Smooth mouse speed
	if (displayedSpeed > 0) {
		smoothedSpeedKmh += (speedKmh - smoothedSpeedKmh) * SMOOTH_FACTOR;
		smoothedSpeedMilesH += (speedMilesH - smoothedSpeedMilesH) * SMOOTH_FACTOR;
	} else {
		smoothedSpeedKmh = 0;
		smoothedSpeedMilesH = 0;
	}

	speedValueM.textContent = smoothedSpeedKmh.toFixed(2);
	speedValueMiles.textContent = smoothedSpeedMilesH.toFixed(3);
	speedValuePx.textContent = displayedSpeed.toFixed(2);
	speedScale.style.width = `${
		Math.min(smoothedSpeedKmh / MAX_SPEED_KMH, 1) * 100
	}%`;
}

// Scroll speed calculations
function updateScrollSpeed() {
	if (!scrollValueM || !scrollValueMiles || !scrollValuePx || !scrollScale)
		return;

	// Motor-like scroll behavior
	if (scrollSpeed > SCROLL_CONFIG.REV_THRESHOLD) {
		displayedScrollSpeed = scrollSpeed;
		scrollSpeed *= SCROLL_CONFIG.DECELERATION_RATE;
	} else {
		scrollSpeed = 0;
		displayedScrollSpeed = 0;
	}

	// Convert to different units
	const scrollMps = displayedScrollSpeed * SCROLL_CONFIG.RPM_TO_SPEED;
	const scrollKmh = scrollMps * MPS_TO_KMH;
	const scrollMilesH = scrollMps * MPS_TO_MILES_H;

	// Smooth transitions
	if (displayedScrollSpeed > 0) {
		smoothedScrollKmh += (scrollKmh - smoothedScrollKmh) * SMOOTH_FACTOR;
		smoothedScrollMilesH += (scrollMilesH - smoothedScrollMilesH) * SMOOTH_FACTOR;
	} else {
		smoothedScrollKmh = 0;
		smoothedScrollMilesH = 0;
	}

	// Batch DOM updates
	requestAnimationFrame(() => {
		scrollValueM.textContent = smoothedScrollKmh.toFixed(2);
		scrollValueMiles.textContent = smoothedScrollMilesH.toFixed(3);
		scrollValuePx.textContent = displayedScrollSpeed.toFixed(2);
		scrollScale.style.width = `${
			Math.min(smoothedScrollKmh / MAX_SPEED_KMH, 1) * 100
		}%`;
	});
}

// Distance calculations
function updateDistanceMetrics() {
	if (!clickCounter || !distanceValueM || !distanceValueMiles) return;

	// Click scale
	clickCounter.textContent = clickCount.toString().padStart(3, "0");

	// Distance calculations
	const distanceInches = totalDistance / dpi_x;
	const distanceMeters = (distanceInches * CM_PER_INCH) / 100;
	const distanceMilesVal = distanceInches / INCHES_PER_MILE;

	smoothedDistanceMeters +=
		(distanceMeters - smoothedDistanceMeters) * SMOOTH_FACTOR;
	smoothedDistanceInchesTotal +=
		(distanceInches - smoothedDistanceInchesTotal) * SMOOTH_FACTOR;
	smoothedDistanceMiles +=
		(distanceMilesVal - smoothedDistanceMiles) * SMOOTH_FACTOR;

	distanceValueM.textContent = smoothedDistanceMeters.toFixed(2);
	distanceValueMiles.textContent = smoothedDistanceMiles.toFixed(3);
}

// Motor simulation
function updateMotorSimulation() {
	if (!scrollValuePx || !scrollValueM || !scrollValueMiles || !scrollScale)
		return;

	// Motor physics simulation
	if (currentRPM > SCROLL_CONFIG.REV_THRESHOLD) {
		// Apply deceleration
		currentRPM *= SCROLL_CONFIG.DECELERATION_RATE;

		// Calculate speed from RPM
		const gearRatio = SCROLL_CONFIG.GEAR_RATIOS[currentGear];
		scrollSpeed = (currentRPM * SCROLL_CONFIG.RPM_TO_SPEED) / gearRatio;

		// Cool engine
		engineTemp = Math.max(0, engineTemp - 0.1);
	} else {
		currentRPM = 0;
		scrollSpeed = 0;
	}

	// Map RPM to a range from 0 to 1
	normalizedRPM = currentRPM / SCROLL_CONFIG.MAX_REV;

	// Update display values with RPM info
	scrollValuePx.textContent = `${Math.round(currentRPM)} RPM`;
	scrollValueM.textContent = scrollSpeed.toFixed(2);
	scrollValueMiles.textContent = (scrollSpeed * 0.621371).toFixed(2);

	// Update visual feedback
	const rpmPercentage = normalizedRPM * 100;
	scrollScale.style.width = `${Math.min(rpmPercentage, 100)}%`;

	// Optional: Add redline effect
	if (currentRPM > SCROLL_CONFIG.MAX_REV * 0.8) {
		scrollScale.style.backgroundColor = "#ff4444";
	} else {
		scrollScale.style.backgroundColor = "";
	}
}

// Add new rotation update function
function updateRotation() {
	if (!turnstyleElements?.length) return;

	// STEP A: Calculate the rotation speed.
	const rpmBoost = normalizedRPM * 300;
	const rotationPerFrame = BASE_ROTATION_PER_FRAME + rpmBoost;

	rotation += rotationPerFrame;

	turnstyleElements.forEach((element) => {
		element.style.transform = `rotate(${rotation}deg)`;
	});
}

// **Mouse tracking – Event Handlers**
function setupEventHandlers() {
	// Check for required DOM elements
	if (!miniMap || !cursorDot || !cursorValue) {
		console.error("Required elements for mouse tracking not found");
		return;
	}

	// Separate update functions for better organization
	function updateCursorText(xPercent, yPercent) {
		cursorValue.textContent = `X: ${(xPercent * 100).toFixed(2)}%, Y: ${(
			yPercent * 100
		).toFixed(2)}%`;
	}

	function updateMouseMetrics(mouseX, mouseY, currentTime) {
		if (prevMouseX !== null && prevMouseY !== null && prevTime !== null) {
			const dx = mouseX - prevMouseX;
			const dy = mouseY - prevMouseY;
			const dt = (currentTime - prevTime) / 1000;

			if (dt > 0) {
				const distance = Math.hypot(dx, dy);
				speed = distance / dt;
				totalDistance += distance;
			}
		}
	}

	function updateEngineMetrics(wheelInput, currentTime) {
		const dt = (currentTime - (prevScrollTime || currentTime)) / 1000;

		if (dt > 0) {
			// Rev up the engine based on wheel input
			currentRPM = Math.min(
				currentRPM * SCROLL_CONFIG.ACCELERATION_RATE + wheelInput,
				SCROLL_CONFIG.MAX_REV
			);

			// Calculate speed based on RPM and current gear
			const gearRatio = SCROLL_CONFIG.GEAR_RATIOS[currentGear];
			scrollSpeed = (currentRPM * SCROLL_CONFIG.RPM_TO_SPEED) / gearRatio;

			// Update engine temperature simulation
			engineTemp = Math.min(
				100,
				engineTemp + (currentRPM / SCROLL_CONFIG.MAX_REV) * 0.5
			);
		}
		prevScrollTime = currentTime;
	}

	// Event Listeners
	document.addEventListener("mousemove", (e) => {
		const mouseX = e.clientX;
		const mouseY = e.clientY;
		const currentTime = performance.now();

		 // Calculate percentages
        const xPercent = mouseX / window.innerWidth;
        const yPercent = mouseY / window.innerHeight;

        // Update the exported variables
        mouseXPercent = xPercent;
        mouseYPercent = yPercent;

        // Update cursor display
        updateCursorText(xPercent, yPercent);
        updateMouseMetrics(mouseX, mouseY, currentTime);

        // Store current values for next frame
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        prevTime = currentTime;
	});

	// Reset tracking when mouse leaves window
	document.addEventListener("mouseout", () => {
		speed = 0;
		prevMouseX = null;
		prevMouseY = null;
		prevTime = null;
	});

	// Handle mouse wheel for engine simulation
	document.addEventListener("wheel", (e) => {
		const wheelInput = Math.abs(e.deltaY) * SCROLL_CONFIG.WHEEL_SENSITIVITY;
		updateEngineMetrics(wheelInput, performance.now());
	});

	// Gear shifting controls
	document.addEventListener("keydown", (e) => {
		if (e.key === "ArrowUp" && currentGear < 5) currentGear++;
		if (e.key === "ArrowDown" && currentGear > 1) currentGear--;
	});

	// Click/touch tracking
	document.addEventListener("click", () => clickCount++);
	document.addEventListener("touchstart", () => clickCount++);
}

// Add new function for rotation setup
function setupRotation() {
	turnstyleElements = document.querySelectorAll(".turnstyle");
	if (!turnstyleElements.length) {
		console.warn("No .turnstyle elements found");
		return false;
	}
	console.log(`Found ${turnstyleElements.length} turnstyle elements`);
	return true;
}

// **Initialization**
export function initMouseMonitors() {
	console.log("Initializing mouse monitors...");

	if (!initializeElements()) {
		console.error("Failed to initialize mouse monitors: missing elements");
		return;
	}

	setupRuler();
	setupRotation();
	setupEventHandlers();

	// Start animation loop
	requestAnimationFrame(function loop() {
		updateCursorPosition();
		updateMouseSpeed();
		updateScrollSpeed();
		updateDistanceMetrics();
		updateMotorSimulation();
		updateRotation();
		requestAnimationFrame(loop);
	});

	console.log("Mouse monitors initialized successfully");
}

export { mouseXPercent, mouseYPercent };

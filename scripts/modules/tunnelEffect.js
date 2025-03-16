// modules/tunnelEffect.js
console.log('Tunnel effect module initialised');

const TUNNEL_CONFIG = {
    baseSpeed: 32,  // Default animation duration in seconds
    speedMultiplier: 0.2, // How much scroll affects speed
    minSpeed: 5,  // Minimum duration (faster)
    maxSpeed: 100, // Maximum duration (slower)
    decayRate: 0.98 // Smooth decay when stopping
};

let currentSpeed = TUNNEL_CONFIG.baseSpeed;
let lastScrollTime = 0;
const viewport = document.querySelector('.viewport');

function updateAnimationSpeed() {
    document.documentElement.style.setProperty('--anim-duration', `${currentSpeed}s`);
}

function handleScroll(event) {
    const now = performance.now();
    const delta = Math.abs(event.deltaY);

    // Increase speed based on scroll movement
    currentSpeed = Math.max(
        TUNNEL_CONFIG.minSpeed,
        Math.min(TUNNEL_CONFIG.maxSpeed, currentSpeed - delta * TUNNEL_CONFIG.speedMultiplier)
    );

    lastScrollTime = now;
    updateAnimationSpeed();
}

function applyDecay() {
    const now = performance.now();
    if (now - lastScrollTime > 100) {
        currentSpeed = Math.min(TUNNEL_CONFIG.baseSpeed, currentSpeed * TUNNEL_CONFIG.decayRate);
        updateAnimationSpeed();
    }
    requestAnimationFrame(applyDecay);
}

export function initTunnelEffect() {
    document.addEventListener('wheel', handleScroll);
    applyDecay();
}
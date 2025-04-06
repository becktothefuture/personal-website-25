// This module applies/removes an Interference effect that simulates sporadic widget flickering
export function applyInterference(widget) {
    const fixedDuration = 3; // seconds for interference animation
    widget.style.setProperty('--interference-duration', `${fixedDuration}s`);
    const randomDelay = Math.random() * 2; // random delay between 0-2 seconds
    widget.style.setProperty('--interference-delay', `${randomDelay}s`);
    widget.classList.add('widget-interference');
}

export function removeInterference(widget) {
    widget.classList.remove('widget-interference');
}

// New centralized initialization function for interference
export function initInterference() {
    console.log('Interference module initialized');
    // Optionally, set default CSS variables on :root if needed.
}

/**
 * @module browserTheme
 * Browser Theme Module
 * 
 * Detects and applies browser-specific UI colors to match the native browser chrome
 * appearance in both light and dark modes. This helps create a seamless visual
 * integration between the website and the browser interface.
 *
 * Features:
 * - Detects browser type (Chrome, Safari, Firefox, Edge, Opera, Brave, Arc)
 * - Sets background color directly on .overlay__inner elements
 * - Updates meta theme-color tag to match the browser UI
 * - Automatically responds to system theme changes
 * 
 * This module self-initializes immediately upon import.
 */

console.log('Browser Theme Module: Script start');

const userAgent = navigator.userAgent.toLowerCase();
const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");

// Presets for colors applied to --browser-color
const COLOR_PRESETS = {
    chrome: { light: "#ffffff", dark: "#3c3c3c" }, // Correct dark color
    safari: { light: "#f3f3f2", dark: "#242424" },
    firefox: { light: "#f5f5f5", dark: "#2e2e2e" },
    edge: { light: "#f3f2f1", dark: "#323130" },
    opera: { light: "#fafafa", dark: "#3b3b3b" },
    brave: { light: "#ffffff", dark: "#2d2d2d" },
    arc: { light: "#e8e8e8", dark: "#292a2b" },
    default: { light: "#ffffff", dark: "#1b1c1c" } // Fallback dark color
};

// Presets for the hairline colors (optional)
const COLOR_LINE_PRESETS = {
    chrome: { light: "#e2e3e1", dark: "#444746" },
    safari: { light: "#cdcdcc", dark: "#000000" },
    firefox: { light: "#d4d4d2", dark: "#2d2d2d" },
    edge: { light: "#e2e3e1", dark: "#444746" },
    opera: { light: "#e2e3e1", dark: "#444746" },
    brave: { light: "#e2e3e1", dark: "#444746" },
    arc: { light: "#e2e3e1", dark: "#444746" },
    default: { light: "#e2e3e1", dark: "#444746" }
};

// Detect user's browser
function detectBrowser() {
    let detected = "default"; // Start with default
    if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
        detected = "brave";
    }
    // Check for Arc specifically before Chrome
    else if (userAgent.includes("arc")) {
        detected = "arc";
    }
    // Check for Edge specifically before Chrome
    else if (userAgent.includes("edg")) {
        detected = "edge";
    }
    // Check for Opera specifically before Chrome
    else if (userAgent.includes("opr") || userAgent.includes("opera")) {
        detected = "opera";
    }
    // Check for Chrome, ensuring it's not Edge, Opera, or Brave masquerading
    else if (userAgent.includes("chrome") && !userAgent.includes("edg") && !userAgent.includes("opr") && !(navigator.brave && typeof navigator.brave.isBrave === 'function')) {
        detected = "chrome";
    }
    // Check for Safari, ensuring it's not Chrome or others
    else if (userAgent.includes("safari") && !userAgent.includes("chrome") && !userAgent.includes("chromium")) {
        detected = "safari";
    }
    // Check for Firefox
    else if (userAgent.includes("firefox")) {
        detected = "firefox";
    }
    console.log(`Browser Theme Module: Detected browser as: ${detected}`);
    return detected;
}

// Apply color settings based on detected browser & theme
function applyBrowserColors(eventSource = "initial") {
    console.log(`Browser Theme Module: applyBrowserColors called from ${eventSource}`);
    const browser = detectBrowser();
    const isDark = prefersDarkMode.matches;
    const mode = isDark ? "dark" : "light";
    console.log(`Browser Theme Module: Mode detected as: ${mode}`);

    // Get color from preset
    const browserPreset = COLOR_PRESETS[browser] || COLOR_PRESETS.default;
    const linePreset = COLOR_LINE_PRESETS[browser] || COLOR_LINE_PRESETS.default;

    const browserColor = browserPreset[mode];
    const lineColor = linePreset[mode];

    console.log(`Browser Theme Module: Selected browser color for ${browser} (${mode}): ${browserColor}`);
    console.log(`Browser Theme Module: Selected line color for ${browser} (${mode}): ${lineColor}`);

    // Apply CSS custom properties to the root element with !important
    document.documentElement.style.setProperty('--browser-color', browserColor, 'important');
    document.documentElement.style.setProperty('--browser-line-color', lineColor, 'important');
    console.log(`Browser Theme Module: Set --browser-color to ${browserColor} !important`);
    console.log(`Browser Theme Module: Set --browser-line-color to ${lineColor} !important`);

    // Update or create meta theme-color tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
        console.log('Browser Theme Module: Created meta theme-color tag.');
    }
    metaThemeColor.setAttribute('content', browserColor);
    console.log(`Browser Theme Module: Updated meta theme-color to ${browserColor}`);
}

// --- Initialization --- 

// 1. Apply immediately on script load
console.log('Browser Theme Module: Applying colors on initial script execution.');
applyBrowserColors("script load");

// 2. Add listener for system theme changes
prefersDarkMode.addEventListener("change", () => applyBrowserColors("theme change"));
console.log('Browser Theme Module: Added listener for theme changes.');

// 3. Ensure application after DOM is fully loaded
function onDOMLoaded() {
    console.log('Browser Theme Module: DOMContentLoaded event fired. Applying colors again.');
    applyBrowserColors("DOMContentLoaded");
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMLoaded);
} else {
    // DOM is already ready, call the function directly (or with a tiny delay if needed)
    console.log('Browser Theme Module: DOM already loaded. Applying colors immediately.');
    onDOMLoaded(); 
}

console.log('Browser Theme Module: Initialization complete.');
console.log('Browser Theme Module: Initial Browser:', detectBrowser());
console.log('Browser Theme Module: Initial Dark Mode:', prefersDarkMode.matches);

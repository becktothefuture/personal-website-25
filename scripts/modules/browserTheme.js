console.log('Browser Theme Initialised');

const userAgent = navigator.userAgent.toLowerCase();
const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");

// Presets for colors applied to --browser-color
const COLOR_PRESETS = {
    chrome: { light: "#ffffff", dark: "#3c3c3c" },
    safari: { light: "#f3f3f2", dark: "#242424" },
    firefox: { light: "#f5f5f5", dark: "#2e2e2e" },
    edge: { light: "#f3f2f1", dark: "#323130" },
    opera: { light: "#fafafa", dark: "#3b3b3b" },
    brave: { light: "#ffffff", dark: "#2d2d2d" },
    arc: { light: "#e8e8e8", dark: "#292a2b" },
    default: { light: "#ffffff", dark: "#1b1c1c" }
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
    if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
        return "brave";
    }
    if (userAgent.includes("arc")) {
        return "arc";
    }
    if (userAgent.includes("chrome") && !userAgent.includes("edge") && !userAgent.includes("opr")) {
        return "chrome";
    }
    if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
        return "safari";
    }
    if (userAgent.includes("firefox")) {
        return "firefox";
    }
    if (userAgent.includes("edg")) {
        return "edge";
    }
    if (userAgent.includes("opera") || userAgent.includes("opr")) {
        return "opera";
    }
    return "default";
}

// Apply color settings based on detected browser & theme
function applyBrowserColors() {
    const browser = detectBrowser();
    const mode = prefersDarkMode.matches ? "dark" : "light";

    // Get color from preset
    const browserColor = (COLOR_PRESETS[browser] || COLOR_PRESETS.default)[mode];
    const lineColor = (COLOR_LINE_PRESETS[browser] || COLOR_LINE_PRESETS.default)[mode];

    // Apply to CSS variables
    document.documentElement.style.setProperty("--browser-color", browserColor);
    document.documentElement.style.setProperty("--line-color", lineColor);

    // Update <meta name="theme-color"> if it exists
    const metaThemeColor = document.getElementById('theme-color-meta');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', browserColor);
    }
}

// Initialize theme settings
export function initBrowserTheme() {
    applyBrowserColors();
    prefersDarkMode.addEventListener("change", applyBrowserColors);
}
/**
 * @module browserTheme
 * Browser Theme Module
 * 
 * Detects and applies browser-specific UI colors to match the native browser chrome
 * appearance in both light and dark modes, on desktop and mobile.
 * This helps create a seamless visual integration between the website and the browser interface.
 *
 * Features:
 * - Detects browser type (Chrome, Safari, Firefox, Edge, Opera, Brave, Arc - including mobile versions)
 * - Sets background color for in-page elements via CSS custom properties.
 * - Updates meta theme-color tag to match the browser UI, crucial for mobile browser chrome styling (title/status bars).
 * - Automatically responds to system theme changes (light/dark mode) when listener is attached by the consuming module.
 * 
 * This module NO LONGER self-initializes. Initialization is handled by main.js.
 */

console.log('Browser Theme Module: Script parsed');

const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");

// Presets for colors applied to --browser-color and meta theme-color
const COLOR_PRESETS = {
    chrome: { light: "#ffffff", dark: "#3c3c3c" }, // Correct dark color
    safari: { light: "#f3f3f2", dark: "#242424" },
    firefox: { light: "#f5f5f5", dark: "#2e2e2e" },
    edge: { light: "#f3f2f1", dark: "#323130" },
    opera: { light: "#fafafa", dark: "#3b3b3b" },
    brave: { light: "#ffffff", dark: "#2d2d2d" },
    arc: { light: "#e8e8e8", dark: "#292a2b" }, // Assuming Arc has a distinct theme
    default: { light: "#ffffff", dark: "#1b1c1c" } // Fallback dark color
};

// Presets for the hairline colors (for in-page elements)
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

// Detect user's browser, including common mobile variants
function detectBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    let detected = "default";

    if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
        detected = "brave";
    } else if (ua.includes("arc/") || ua.includes("arc-mobile")) { // More specific Arc check; "arc-mobile" is a placeholder for potential mobile UA
        detected = "arc";
    } else if (ua.includes("edg/") || ua.includes("edga/") || ua.includes("edgios/")) { // Edge (desktop), Edge Android (edga/), Edge iOS (edgios/)
        detected = "edge";
    } else if (ua.includes("opr/") || ua.includes("opera") || ua.includes("opt/")) { // Opera (desktop/mobile), Opera Touch (opt/)
        detected = "opera";
    } else if (ua.includes("firefox/") || ua.includes("fxios/")) { // Firefox (desktop/Android), Firefox iOS (fxios/)
        detected = "firefox";
    }
    // Chrome (and Chrome iOS - CriOS) must be checked after specific Chromium-based browsers
    // as their UAs might also contain "chrome".
    else if ((ua.includes("chrome/") || ua.includes("crios/")) &&
             !(ua.includes("edg/") || ua.includes("edga/") || ua.includes("edgios/")) && // Ensure not Edge
             !(ua.includes("opr/") || ua.includes("opt/")) && // Ensure not Opera
             !(navigator.brave && typeof navigator.brave.isBrave === 'function') && // Ensure not Brave
             !(ua.includes("arc/") || ua.includes("arc-mobile"))) { // Ensure not Arc
        detected = "chrome";
    }
    // Safari must be checked after Chrome/CriOS as other browser UAs (especially on iOS) contain "safari".
    else if (ua.includes("safari/") &&
             !(ua.includes("chrome/") || ua.includes("crios/")) && // Ensure not Chrome/CriOS
             !(ua.includes("chromium/")) && // Ensure not generic Chromium
             !(ua.includes("edg/") || ua.includes("edga/") || ua.includes("edgios/")) && // Ensure not Edge
             !(ua.includes("opr/") || ua.includes("opt/")) && // Ensure not Opera
             !(ua.includes("fxios/"))) { // Ensure not Firefox iOS (which also has Safari in UA)
        detected = "safari";
    }
    // If still "default", it's a less common browser or one whose UA doesn't match known patterns.
    // The COLOR_PRESETS.default will be used.
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

    // Apply CSS custom properties to the root element for in-page styling
    document.documentElement.style.setProperty('--browser-color', browserColor, 'important');
    document.documentElement.style.setProperty('--browser-line-color', lineColor, 'important');
    console.log(`Browser Theme Module: Set --browser-color to ${browserColor} !important for in-page elements.`);
    console.log(`Browser Theme Module: Set --browser-line-color to ${lineColor} !important for in-page elements.`);

    // Update or create meta theme-color tag. This is crucial for styling the browser chrome on mobile.
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
        console.log('Browser Theme Module: Created meta theme-color tag.');
    }
    metaThemeColor.setAttribute('content', browserColor);
    console.log(`Browser Theme Module: Updated meta theme-color to ${browserColor} for browser UI.`);
}

// --- Initialization REMOVED --- 
// All self-initialization logic, including direct calls to applyBrowserColors,
// prefersDarkMode.addEventListener, and DOMContentLoaded listeners, has been removed.
// main.js is now responsible for calling applyBrowserColors and setting up listeners.

export { applyBrowserColors, prefersDarkMode };

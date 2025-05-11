/**
 * Loading Text Animation Module
 * 
 * Machine-like text animation that simulates a computer processing various tasks.
 * Professional text for a design and technology-focused audience.
 * No styling is applied - uses styles from Webflow.
 */

// Configuration with text groups and animation settings
const textAnimConfig = {
  groups: [
    {
      title: "Initialising",
      messages: [
        "Parsing vectors",
        "Mounting components",
        "Scanning viewport",
        "Calibrating display",
        "Mapping inputs",
        "Checking resolution",
        "Loading typefaces"
      ],
      speed: 80 // Original: 140
    },
    {
      title: "Design System",
      messages: [
        "Setting constraints",
        "Building grid",
        "Parsing tokens",
        "Optimising contrast",
        "Loading variables",
        "Applying spacing",
        "Compiling themes"
      ],
      speed: 80 // Original: 180
    },
    {
      title: "Interface",
      messages: [
        "Crafting surfaces",
        "Rendering states",
        "Syncing microcopy",
        "Applying shadows",
        "Testing flows",
        "Mapping gestures",
        "Checking modals"
      ],
      speed: 120 // Original: 230
    },
    {
      title: "Experience",
      messages: [
        "Timing animations",
        "Setting transitions",
        "Refining feedback",
        "Smoothing scroll",
        "Calculating easing",
        "Mapping journeys",
        "Polishing details"
      ],
      speed: 80 // Original: 160
    },
    {
      title: "Launch",
      messages: [
        "Final checks",
        "Caching assets",
        "Optimising layers",
        "Preparing handoff",
        "Ready for users",
        "Interface live",
        "System online"
      ],
      speed: 40 // Original: 120
    }
  ]
};

// Module state
let textElement = null;
let currentGroupIndex = 0;
let currentMessageIndex = 0;
let activeTimer = null;
let isActive = false;

/**
 * Updates text display with the next message
 */
function updateText() {
  if (!isActive || !textElement) return;
  
  clearTimeout(activeTimer);
  
  const group = textAnimConfig.groups[currentGroupIndex];
  
  // Check if we've completed messages for this group
  if (currentMessageIndex >= group.messages.length) {
    moveToNextGroup();
    return;
  }
  
  // Simply display the text without any indicators
  const text = group.messages[currentMessageIndex];
  textElement.textContent = text;
  currentMessageIndex++;
  
  // Less randomness for more machine-like timing
  const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
  const delay = group.speed * randomFactor;
  activeTimer = setTimeout(updateText, delay);
}

/**
 * Moves to the next group of messages
 */
function moveToNextGroup() {
  currentGroupIndex++;
  currentMessageIndex = 0;
  
  // Loop back to first group when complete
  if (currentGroupIndex >= textAnimConfig.groups.length) {
    currentGroupIndex = 0;
  }
  
  // Show group title with a machine-like prefix
  const group = textAnimConfig.groups[currentGroupIndex];
  textElement.textContent = "INIT: " + group.title;
  
  // Shorter pause between groups for more machine-like feel
  activeTimer = setTimeout(updateText, 200); // Original: 600
}

/**
 * Initialize the loading text animation
 * @param {string} elementId - ID of the text element to animate (default: 'loading-text')
 */
export function initLoadingText(elementId = 'loading-text') {
  // Clean up any existing animation
  stopAnimation();
  
  // Target the text element - no styling is applied
  textElement = document.getElementById(elementId);
  
  if (!textElement) {
    console.warn(`Loading text element with ID '${elementId}' not found`);
    return false;
  }
  
  // Reset state
  currentGroupIndex = 0;
  currentMessageIndex = 0;
  isActive = true;
  
  // Start with system startup message
  textElement.textContent = "SYSTEM BOOT SEQUENCE INITIATED";
  
  // Quick transition to first group
  activeTimer = setTimeout(() => {
    if (!isActive) return; // Check if animation was stopped before this timeout
    textElement.textContent = "INIT: " + textAnimConfig.groups[0].title;
    activeTimer = setTimeout(updateText, 200); // Original: 600
  }, 267); // Original: 800
  
  // Stop animation when the page is fully loaded
  const handlePageLoad = () => {
    console.log('Loader: Page fully loaded, stopping animation.');
    stopAnimation();
    window.removeEventListener('load', handlePageLoad); // Clean up listener
  };
  window.addEventListener('load', handlePageLoad);

  return true;
}

/**
 * Stop the animation
 */
export function stopAnimation() {
  isActive = false;
  clearTimeout(activeTimer);
  if (textElement) {
    textElement.textContent = '';
  }
}

export default { initLoadingText, stopAnimation };
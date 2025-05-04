/**
 * Minimal Loader Module
 * 
 * Simple loading animation with dynamic text display that simulates 
 * computer initialization at variable speeds.
 * 
 * This script only handles text animation and targets an existing #loading-text element.
 * No DOM creation or styling is performed.
 */

// Single configuration object with message groups
const loaderConfig = {
  textGroups: [
    {
      title: "Initial System Check",
      messages: [
        "Verifying JS bundle size",
        "Compressing hero image",
        "Setting expectations"
      ],
      speed: 280,
      indicator: "dots" // Classic dots animation
    },
    {
      title: "Preparing Interface",
      messages: [
        "Generating colour tokens",
        "Polishing micro‑copy",
        "Finessing tiny details"
      ],
      speed: 950,
      indicator: "percent" // Percentage counter
    },
    {
      title: "Quality Sweep",
      messages: [
        "Reviewing component rhythm",
        "Testing type pairings",
        "Balancing contrast levels"
      ],
      speed: 1450,
      indicator: "blocks" // ASCII block animation
    },
    {
      title: "Creative Loop",
      messages: [
        "Sketching fresh variations",
        "Letting ideas breathe",
        "Listening to the whitespace"
      ],
      speed: 420,
      indicator: "spinner" // Text-based spinner
    },
    {
      title: "Technical Optimization",
      messages: [
        "Scanning dependencies",
        "Minifying resources",
        "Optimizing render pipeline",
        "Analyzing paint performance"
      ],
      speed: 120, // Super fast processing
      indicator: "none" // No animation, just rapid text changes
    }
  ]
};

// Module state
let textElement = null;
let currentGroupIndex = 0;
let currentMessageIndex = 0;
let indicatorFrame = 0;
let activeTimer = null;
let isActive = false;

/**
 * Updates text display with the next message
 */
function updateText() {
  if (!isActive || !textElement) return;
  
  clearTimeout(activeTimer);
  
  const group = loaderConfig.textGroups[currentGroupIndex];
  
  // Check if we've completed messages for this group
  if (currentMessageIndex >= group.messages.length) {
    // Move to next group immediately
    moveToNextGroup();
    return;
  }
  
  const text = group.messages[currentMessageIndex];
  
  // Choose animation style based on group indicator type
  switch(group.indicator) {
    case "dots":
      textElement.textContent = text;
      animateDots();
      break;
      
    case "percent":
      textElement.textContent = text;
      animatePercentage();
      break;
      
    case "blocks":
      textElement.textContent = text;
      animateBlocks();
      break;
      
    case "spinner":
      textElement.textContent = text;
      animateSpinner();
      break;
      
    case "none":
    default:
      // Just show the text and move quickly to next
      textElement.textContent = text;
      currentMessageIndex++;
      
      // For "none" type, use consistent speed with minimal randomness
      const delay = group.speed * (0.9 + Math.random() * 0.2);
      activeTimer = setTimeout(updateText, delay);
      break;
  }
}

/**
 * Classic dots animation (. .. ...)
 */
function animateDots() {
  if (!isActive || !textElement) return;
  
  const group = loaderConfig.textGroups[currentGroupIndex];
  const text = group.messages[currentMessageIndex];
  
  indicatorFrame = (indicatorFrame % 3) + 1;
  const dots = ' ' + '.'.repeat(indicatorFrame);
  textElement.textContent = text + dots;
  
  if (indicatorFrame === 3) {
    currentMessageIndex++;
    indicatorFrame = 0;
    activeTimer = setTimeout(updateText, 800);
  } else {
    activeTimer = setTimeout(animateDots, 300);
  }
}

/**
 * Percentage counter animation (25% 50% 75% 100%)
 */
function animatePercentage() {
  if (!isActive || !textElement) return;
  
  const group = loaderConfig.textGroups[currentGroupIndex];
  const text = group.messages[currentMessageIndex];
  
  indicatorFrame = (indicatorFrame % 4) + 1;
  const percent = ' ' + ['25%', '50%', '75%', '100%'][indicatorFrame - 1];
  textElement.textContent = text + percent;
  
  if (indicatorFrame === 4) {
    currentMessageIndex++;
    indicatorFrame = 0;
    activeTimer = setTimeout(updateText, 800);
  } else {
    activeTimer = setTimeout(animatePercentage, 400);
  }
}

/**
 * ASCII block loading animation (▓░░░, ▓▓░░, ▓▓▓░, ▓▓▓▓)
 */
function animateBlocks() {
  if (!isActive || !textElement) return;
  
  const group = loaderConfig.textGroups[currentGroupIndex];
  const text = group.messages[currentMessageIndex];
  
  indicatorFrame = (indicatorFrame % 4) + 1;
  let blocks;
  
  switch(indicatorFrame) {
    case 1: blocks = ' [▓░░░]'; break;
    case 2: blocks = ' [▓▓░░]'; break;
    case 3: blocks = ' [▓▓▓░]'; break;
    case 4: blocks = ' [▓▓▓▓]'; break;
  }
  
  textElement.textContent = text + blocks;
  
  if (indicatorFrame === 4) {
    currentMessageIndex++;
    indicatorFrame = 0;
    activeTimer = setTimeout(updateText, 900);
  } else {
    activeTimer = setTimeout(animateBlocks, 500);
  }
}

/**
 * Text spinner animation (/ - \ |)
 */
function animateSpinner() {
  if (!isActive || !textElement) return;
  
  const group = loaderConfig.textGroups[currentGroupIndex];
  const text = group.messages[currentMessageIndex];
  
  indicatorFrame = (indicatorFrame % 4) + 1;
  const spinChars = ['/', '-', '\\', '|'];
  const spinner = ' ' + spinChars[indicatorFrame - 1];
  
  textElement.textContent = text + spinner;
  
  if (indicatorFrame === 4) {
    // Complete 2 full rotations before moving on
    if (Math.random() > 0.5) {
      currentMessageIndex++;
      indicatorFrame = 0;
      activeTimer = setTimeout(updateText, 600);
    } else {
      indicatorFrame = 0;
      activeTimer = setTimeout(animateSpinner, 200);
    }
  } else {
    activeTimer = setTimeout(animateSpinner, 200);
  }
}

/**
 * Moves to the next group of messages
 */
function moveToNextGroup() {
  if (!isActive || !textElement) return;
  
  currentGroupIndex++;
  currentMessageIndex = 0;
  indicatorFrame = 0;
  
  // If we've completed all groups, loop back to first group
  // (assuming this is an infinite loop until Webflow signals completion)
  if (currentGroupIndex >= loaderConfig.textGroups.length) {
    currentGroupIndex = 0;
  }
  
  // Flash group title if available
  const group = loaderConfig.textGroups[currentGroupIndex];
  if (group.title) {
    textElement.textContent = group.title + '...';
    
    // Start next messages after showing title briefly
    activeTimer = setTimeout(updateText, 1000);
  } else {
    // Start immediately if no title
    updateText();
  }
}

/**
 * Shows the loader and begins text animation
 */
export function showLoader() {
  // Find existing loading-text element by ID - no DOM creation
  textElement = document.getElementById('loading-text');
  
  if (!textElement) {
    console.error('#loading-text element not found in DOM');
    return;
  }
  
  // Reset state
  currentGroupIndex = 0;
  currentMessageIndex = 0;
  indicatorFrame = 0;
  isActive = true;
  
  // Start with group title
  const group = loaderConfig.textGroups[currentGroupIndex];
  textElement.textContent = group.title + '...';
  
  // Start the text animation
  activeTimer = setTimeout(updateText, 1000);
}

/**
 * Hides the loader
 */
export function hideLoader() {
  // Just stop animations, don't manipulate DOM visibility
  isActive = false;
  clearTimeout(activeTimer);
  
  // Clear the text
  if (textElement) {
    textElement.textContent = '';
  }
}

// Export only what's needed
export default { showLoader, hideLoader };
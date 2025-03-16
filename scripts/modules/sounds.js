// sounds.js
// This script sets up a sound system that plays ambient noise and a low-frequency noise filter. 
// It allows the user to choose whether to enable sound or not. The system fades in the sound 
// when the user is active and fades it out after a period of inactivity. 
// The noise filter is adjusted based on the user's mouse position.

console.log("Sound system initialized");

// Core Imports
import { mouseXPercent, mouseYPercent } from './mousemonitors.js';

// Create a custom event name, so other parts of the app can listen for it
const SOUND_CHOICE_MADE = 'soundChoiceMade';

// Global Variables
let audioContext = null;
let ambientSource = null;
let noiseSource = null;
let isUserActive = false;
let idleTimeout = null;
let isSoundEnabled = false;
let animationFrameId = null;
let activityEventListeners = [];

// Configuration
const CONFIG = {
  fadeDuration: 1.2,         
  idleTimeout: 2000,       
  ambient: {
    url: "https://github.com/becktothefuture/personal-website-25/assets/ambient-sound.mp3",
    targetVolume: 0.8
  },
  noise: {
    targetVolume: 0.005,      
    minFreq: 400,            
    maxFreq: 700,
    qRange: [10, 50],
    updateInterval: 100 // ms between noise parameter updates
  }
};

// Cache DOM elements at the start
let settingsOverlay, soundToggle, soundToggleKnob, soundToggleLight, pageWrapper;

// Initialize UI references safely when DOM is ready
function initUiElements() {
  settingsOverlay = document.querySelector('.settings-overlay');
  soundToggle = document.querySelector('.sound-toggle');
  if (soundToggle) {
    soundToggleKnob = soundToggle.querySelector('.sound-toggle__knob');
    if (soundToggleKnob) {
      soundToggleLight = soundToggleKnob.querySelector('.knob-light');
    }
  }
  pageWrapper = document.querySelector('.page-wrapper');
  
  // Check if elements exist and log warning if not
  if (!settingsOverlay || !soundToggle || !soundToggleKnob || !soundToggleLight || !pageWrapper) {
    console.warn("Some UI elements for sound system not found in the DOM");
  }
}

// Audio Context Management
// The audio context is created when the user enables sound.
async function createAudioContext() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContext.suspend(); // start off suspended
    }
    return audioContext;
  } catch (error) {
    console.error("Failed to create audio context:", error);
    return null;
  }
}

// Helper for smooth volume transitions
function createFadeNode(node, targetValue) {
  if (!node || !audioContext) return;
  
  const now = audioContext.currentTime;
  node.gain.cancelScheduledValues(now);
  node.gain.setValueAtTime(node.gain.value || 0, now);
  node.gain.linearRampToValueAtTime(targetValue, now + CONFIG.fadeDuration);
}

// Set up the ambient audio track
// Returns an object { source, gainNode } if successful, null otherwise
async function setupAmbient() {
  if (!audioContext) return null;
  
  try {
    console.log("Fetching ambient sound from:", CONFIG.ambient.url);
    const response = await fetch(CONFIG.ambient.url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    console.log("Audio file fetched successfully, decoding...");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Start silent
    gainNode.gain.value = 0;
    source.start(0);
    console.log("Ambient audio source created and started");
    
    return { source, gainNode };
  } catch (error) {
    console.error("Ambient setup failed:", error);
    // Display error to help debugging
    const errorMsg = document.createElement('div');
    errorMsg.style.position = 'fixed';
    errorMsg.style.bottom = '10px';
    errorMsg.style.left = '10px';
    errorMsg.style.background = 'rgba(255,0,0,0.7)';
    errorMsg.style.color = 'white';
    errorMsg.style.padding = '10px';
    errorMsg.style.zIndex = '9999';
    errorMsg.textContent = `Audio error: ${error.message}`;
    document.body.appendChild(errorMsg);
    return null;
  }
}

// Set up the noise filter
// Returns an object { source, filter, gainNode } if successful, null otherwise
function setupNoise() {
  if (!audioContext) return null;
  
  try {
    const bufferSize = 2 * audioContext.sampleRate; 
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // Fill the noise buffer with random values in range -1 to 1
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gainNode = audioContext.createGain();

    filter.type = 'lowpass';
    filter.frequency.value = CONFIG.noise.maxFreq;
    
    source.buffer = noiseBuffer;
    source.loop = true;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Start silent
    gainNode.gain.value = 0;
    source.start(0);

    return { source, filter, gainNode };
  } catch (error) {
    console.error("Noise setup failed:", error);
    return null;
  }
}

// Activity Monitoring
// Whenever user interacts with the page, fade volumes up.
// After idleTimeout, volumes fade down. 
function handleActivity() {
  if (!isSoundEnabled || !audioContext) {
    console.log("handleActivity: Sound not enabled or context missing");
    return;
  }
  
  if (!ambientSource || !noiseSource) {
    console.log("handleActivity: Sources not ready yet");
    return;
  }

  console.log("handleActivity called, current state:", isUserActive);

  if (!isUserActive) {
    console.log("User became active, fading in sounds");
    isUserActive = true;
    createFadeNode(ambientSource.gainNode, CONFIG.ambient.targetVolume);
    createFadeNode(noiseSource.gainNode, CONFIG.noise.targetVolume);
    
    // Debug info
    console.log("Ambient target volume:", CONFIG.ambient.targetVolume);
    console.log("Noise target volume:", CONFIG.noise.targetVolume);
  }
  
  clearTimeout(idleTimeout);
  idleTimeout = setTimeout(() => {
    isUserActive = false;
    if (ambientSource && noiseSource) {
      console.log("User inactive, fading out sounds");
      createFadeNode(ambientSource.gainNode, 0);
      createFadeNode(noiseSource.gainNode, 0);
    }
  }, CONFIG.idleTimeout);
}

// Real-time Noise Parameter Updates
// Optimized to run at a specified interval rather than every frame
let lastNoiseUpdate = 0;
function updateNoiseParameters(timestamp) {
  if (!noiseSource || !audioContext) {
    animationFrameId = requestAnimationFrame(updateNoiseParameters);
    return;
  }
  
  // Only update parameters at the specified interval
  if (!lastNoiseUpdate || timestamp - lastNoiseUpdate > CONFIG.noise.updateInterval) {
    const freq = CONFIG.noise.minFreq + 
      (CONFIG.noise.maxFreq - CONFIG.noise.minFreq) * mouseYPercent;
    const q = CONFIG.noise.qRange[0] + 
      (CONFIG.noise.qRange[1] - CONFIG.noise.qRange[0]) * mouseXPercent;

    noiseSource.filter.frequency.setTargetAtTime(freq, audioContext.currentTime, 0.1);
    noiseSource.filter.Q.setTargetAtTime(q, audioContext.currentTime, 0.1);
    
    lastNoiseUpdate = timestamp;
  }
  
  animationFrameId = requestAnimationFrame(updateNoiseParameters);
}

// Clean up resources to prevent memory leaks
function cleanupAudioResources() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  // Remove activity event listeners
  activityEventListeners.forEach(({ event, handler }) => {
    document.removeEventListener(event, handler);
  });
  activityEventListeners = [];
  
  // Disconnect and clean up audio nodes
  if (ambientSource) {
    try {
      ambientSource.source.stop();
      ambientSource.gainNode.disconnect();
      ambientSource = null;
    } catch (e) {
      console.error("Error cleaning up ambient source:", e);
    }
  }
  
  if (noiseSource) {
    try {
      noiseSource.source.stop();
      noiseSource.filter.disconnect();
      noiseSource.gainNode.disconnect();
      noiseSource = null;
    } catch (e) {
      console.error("Error cleaning up noise source:", e);
    }
  }
}

// Update UI toggle state in one place to avoid repetition and bugs
function updateToggleUI(isOn) {
  if (!soundToggleKnob || !soundToggleLight) return;
  
  if (isOn) {
    soundToggleKnob.classList.remove('off');
    soundToggleKnob.classList.add('on');
    soundToggle.classList.remove('off');
    soundToggleLight.classList.add('on');
  } else {
    soundToggleKnob.classList.remove('on');
    soundToggleKnob.classList.add('off');
    soundToggle.classList.remove('on');
    soundToggleLight.classList.remove('on');
    soundToggleLight.classList.add('off');
  }
}

// Enable Sound System if user chooses "Sound ON"
async function enableSoundSystem() {
  try {
    console.log("Starting enableSoundSystem()");
    const context = await createAudioContext();
    if (!context) throw new Error("Could not create audio context");
    console.log("Audio context created and ready");

    // Clean up existing resources first to avoid duplication
    cleanupAudioResources();
    console.log("Cleaned up existing audio resources");

    // Create ambient and noise sources
    console.log("Setting up ambient source...");
    ambientSource = await setupAmbient();
    console.log("Setting up noise source...");
    noiseSource = setupNoise();
    
    if (!ambientSource || !noiseSource) {
      throw new Error("Source creation failed");
    }
    console.log("Both audio sources created successfully");

    // Continuously update noise based on mouse positions (throttled)
    animationFrameId = requestAnimationFrame(updateNoiseParameters);
    
    // Listen for user activity to fade in or out
    const events = ['mousemove', 'click', 'keydown', 'touchstart'];
    events.forEach(evt => {
      const boundHandler = handleActivity.bind(this);
      document.addEventListener(evt, boundHandler);
      activityEventListeners.push({ event: evt, handler: boundHandler });
    });

    // Force initial activity to trigger sound
    console.log("Forcing initial activity");
    isUserActive = false; // Reset to ensure the handleActivity logic runs
    handleActivity();

    console.log("Sound system successfully enabled.");
    return true;
  } catch (error) {
    console.error("Sound enable failed:", error);
    return false;
  }
}

// Handle the user's choice for SOUND ON or OFF
async function handleSoundChoice(enableSound) {
  if (enableSound) {
    try {
      console.log("User clicked Sound ON");
      
      if (!audioContext) {
        console.log("Creating new audio context");
        audioContext = await createAudioContext();
        if (!audioContext) throw new Error("Failed to create audio context");
      }
      
      console.log("Audio context state before resume:", audioContext.state);
      if (audioContext.state === 'suspended') {
        console.log("Attempting to resume audio context...");
        // Force user interaction to be registered
        await audioContext.resume().catch(err => {
          console.error("Resume error:", err);
          throw err;
        });
        console.log("Audio context resumed successfully, new state:", audioContext.state);
      }
      
      isSoundEnabled = true;
      updateToggleUI(true);

      console.log("Enabling sound system...");
      const success = await enableSoundSystem();
      console.log("Sound system enable result:", success);
      if (success) {
        console.log("Handling initial activity");
        handleActivity();
      }
    } catch (error) {
      console.error("Failed to enable sound:", error);
      isSoundEnabled = false;
      updateToggleUI(false);
    }
  } else {
    isSoundEnabled = false;
    updateToggleUI(false);
    
    if (ambientSource && noiseSource) {
      createFadeNode(ambientSource.gainNode, 0);
      createFadeNode(noiseSource.gainNode, 0);
      
      setTimeout(() => {
        if (audioContext) audioContext.suspend();
        cleanupAudioResources();
      }, CONFIG.fadeDuration * 1000);
    } else if (audioContext) {
      audioContext.suspend();
    }
  }

  // Proceed with UI changes only if elements exist
  if (settingsOverlay) {
    // Ensure the overlay is visible before applying fade-out
    settingsOverlay.style.display = 'block';
    settingsOverlay.classList.add('fade-out');
  }
  
  if (pageWrapper) {
    pageWrapper.classList.add('scale-up');
  }

  // Dispatch the event so main.js can continue
  window.dispatchEvent(new CustomEvent(SOUND_CHOICE_MADE));
}

// Toggle sound mid-session (e.g. from the floating button)
function toggleSound() {
  if (!audioContext) return;

  isSoundEnabled = !isSoundEnabled;
  updateToggleUI(isSoundEnabled);

  if (isSoundEnabled) {
    // Resume audio context - handle mobile browsers specially
    const resumePromise = audioContext.state === 'suspended' ? 
      audioContext.resume().catch(err => console.error("Failed to resume audio context:", err)) : 
      Promise.resolve();
      
    resumePromise.then(() => {
      if (ambientSource && noiseSource) {
        createFadeNode(ambientSource.gainNode, CONFIG.ambient.targetVolume);
        createFadeNode(noiseSource.gainNode, CONFIG.noise.targetVolume);
      } else {
        enableSoundSystem().then(() => {
          if (ambientSource && noiseSource) {
            createFadeNode(ambientSource.gainNode, CONFIG.ambient.targetVolume);
            createFadeNode(noiseSource.gainNode, CONFIG.noise.targetVolume);
          }
        });
      }
    });
  } else {
    if (ambientSource && noiseSource) {
      createFadeNode(ambientSource.gainNode, 0);
      createFadeNode(noiseSource.gainNode, 0);

      setTimeout(() => {
        if (audioContext) audioContext.suspend();
      }, CONFIG.fadeDuration * 1000);
    } else if (audioContext) {
      audioContext.suspend();
    }
  }
}

// Public interface: initSoundSystem()
export async function initSoundSystem() {
  console.log("Starting sound system initialization");
  
  // Initialize UI elements
  initUiElements();
  
  // Hook up the ON / OFF buttons
  const btnOn = document.querySelector('#button-sound-on');
  const btnOff = document.querySelector('#button-sound-off');

  if (btnOn) {
    btnOn.addEventListener('click', async () => {
      console.log("Sound ON button clicked");
      try {
        // Use a user gesture to create and resume the audio context
        audioContext = await createAudioContext();
        if (audioContext && audioContext.state === 'suspended') {
          console.log("Resuming audio context on click");
          await audioContext.resume();
        }
        handleSoundChoice(true);
      } catch (err) {
        console.error("Error enabling sound:", err);
      }
    });
  } else {
    console.warn("Sound ON button not found");
  }

  if (btnOff) {
    btnOff.addEventListener('click', () => handleSoundChoice(false));
  }

  // The floating toggle button (removed redundant event listener since it's already added earlier)
  // Only add the listener here, not in the global initialization
  if (soundToggle) {
    // Clear any existing listeners first to prevent duplicates
    const newToggle = soundToggle.cloneNode(true);
    if (soundToggle.parentNode) {
      soundToggle.parentNode.replaceChild(newToggle, soundToggle);
      soundToggle = newToggle;
      // Update the reference since we replaced the element
      soundToggleKnob = soundToggle.querySelector('.sound-toggle__knob');
      if (soundToggleKnob) {
        soundToggleLight = soundToggleKnob.querySelector('.knob-light');
      }
    }
    
    soundToggle.addEventListener('click', toggleSound);
  }

  // Add cleanup on page unload
  window.addEventListener('beforeunload', cleanupAudioResources);

  console.log("Sound system initialized");
  return true; // main.js can await this
}

// Export the event name in case other modules want to listen for it
export const EVENTS = {
  SOUND_CHOICE_MADE
};
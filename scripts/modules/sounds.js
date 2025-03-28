/**
 * Sound System Module
 * 
 * This module manages an interactive sound system with ambient background audio and
 * a dynamic engine sound that responds to user scrolling behavior. It includes:
 * - Ambient sound with speed-based pitch modulation
 * - Engine/rumble sounds with frequency and volume tied to scroll speed
 * - Auto-fade on user inactivity
 * - Sound toggle controls with UI interaction
 * 
 * Dependencies: scrollTracker.js
 */

// sounds.js
// This script sets up a sound system that plays ambient noise and a low-frequency rumble effect.
// The modulation previously tied to mouse position has been replaced with defaults and scroll-based modulation.
// Both sounds fade in when the user is active and fade out after inactivity.

console.log("Sound system module initialized");

// Import the scroll tracker to use the spaceship velocity for modulation
import { scrollTracker } from './scrollTracker.js';

// Create a custom event so that other parts of the app can listen for sound choice changes
const SOUND_CHOICE_MADE = 'soundChoiceMade';

// Global Variables
let audioContext = null;
let ambientSource = null;
let engineSource = null; // Renamed from noiseSource for clarity
let isUserActive = false;
let idleTimeout = null;
let isSoundEnabled = false;
let animationFrameId = null;
let activityEventListeners = [];

// Global scroll speed (in km/h) updated by scrollTracker; used to adjust sound parameters
let scrollSpeed = 0;
let engineStarted = false; // Flag to track if engine has properly started

// Configuration settings with optimized audio parameters
const CONFIG = {
  fadeDuration: 1,      // Increased for smoother transitions
  idleTimeout: 3000,      // 3 seconds idle timeout
  ambient: {
    url: "https://becktothefuture.github.io/personal-website-25/assets/ambience.mp3",
    targetVolume: 1,
    // Direct speed-based pitch shift only
    minPitch: 0.8,
    maxPitch: 4.6,
    initialFade: 1.0,
    loopOverlap: 0.5
  },
  engine: {
    minVolume: 0.05,      
    maxVolume: 1,      
    speedResponseTime: 0.1, 
    speedThreshold: 300, 
    
    // Sound characteristics - directly tied to speed
    minFreq: 100,         // Minimum frequency at zero speed
    maxFreq: 350,        // Maximum frequency at top speed
    q: 30,               
    
    // Sub-bass settings - directly tied to speed
    subFreq: 160,         // Rumble frequency - lowered for deeper sound
    minSubGain: 10,        // Increased minimum sub gain
    maxSubGain: 160,       // Increased maximum sub gain
    rampTime: 0.02,       // Shortened ramp time for quicker response
    subQ: 100             // Increased Q for a more resonant rumble
  },
  robotSpeech: {
    enabled: true,
    volume: 0.15,
    baseFrequency: 400,
    vowelModifier: 1,
    consonantModifier: 0.5,
    soundDuration: 30, // ms
    characterMappings: {
        vowels: new Set("AEIOUaeiou"),
        bilabial: new Set("MBPmbp"),
        nasals: new Set("Nn"),
        sibilants: new Set("SZszCcJj"),
        dentals: new Set("TDtd"),
        pauses: new Set(",.;:!?-")
    }
  }
};

// UI elements are now optional since we removed the controls from the DOM.
let soundToggle = document.querySelector('.sound-toggle');
let soundToggleKnob = soundToggle ? soundToggle.querySelector('.sound-toggle__knob') : null;
let soundToggleLight = soundToggleKnob ? soundToggleKnob.querySelector('.knob-light') : null;

// Add these variables for robot speech at the top with other global variables
let robotSpeechEnabled = CONFIG.robotSpeech.enabled;
let robotToggleCallback = null;
let audioInitialized = false;

// ----------------------------------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------------------------------

/**
 * Creates a fade node for smooth volume transitions.
 * @param {AudioNode} node - The audio node to apply the fade to.
 * @param {number} targetValue - The target volume value.
 * @param {number} duration - The duration of the fade in seconds.
 */
function createFadeNode(node, targetValue, duration = CONFIG.fadeDuration) {
  if (!node || !audioContext) return;
  const now = audioContext.currentTime;
  node.gain.cancelScheduledValues(now);
  
  // Avoid setting value to exactly zero (causes clicks)
  const currentValue = node.gain.value || 0.001;
  node.gain.setValueAtTime(currentValue, now);
  
  // Use exponential ramp for natural sound fade if possible
  if (currentValue > 0.01 && targetValue > 0.01) {
    node.gain.exponentialRampToValueAtTime(targetValue, now + duration);
  } else {
    // Fall back to linear ramp near zero
    node.gain.linearRampToValueAtTime(targetValue, now + duration);
  }
}

// ----------------------------------------------------------------------------------------------------
// AUDIO CONTEXT MANAGEMENT
// ----------------------------------------------------------------------------------------------------

/**
 * Creates and returns the AudioContext.
 * @returns {AudioContext} - The AudioContext object.
 */
async function createAudioContext() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContext.suspend();
    }
    return audioContext;
  } catch (error) {
    console.error("Failed to create audio context:", error);
    return null;
  }
}

// ----------------------------------------------------------------------------------------------------
// AUDIO SETUP FUNCTIONS
// ----------------------------------------------------------------------------------------------------

/**
 * Sets up the ambient audio track with anti-crackling measures.
 * @returns {object} - An object containing the audio source, gain node, and other audio processing nodes.
 */
async function setupAmbient() {
  if (!audioContext) return null;
  try {
    const response = await fetch(CONFIG.ambient.url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await audioContext.decodeAudioData(arrayBuffer);

    // Create a gain node for volume control with initial volume at 0
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Create a gain node specifically for fade in/out to prevent clicks
    const antiPopNode = audioContext.createGain();
    antiPopNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Add a compressor to prevent clipping and reduce pops
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 10;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.1;
    
    // Add a lowpass filter with a gentle slope to smooth transitions
    const smoothingFilter = audioContext.createBiquadFilter();
    smoothingFilter.type = 'lowpass';
    smoothingFilter.frequency.value = 18000; // Just below Nyquist
    smoothingFilter.Q.value = 0.5; // Gentle slope
    
    // Create source and connect nodes
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    // Connection chain with anti-pop measures
    source.connect(antiPopNode);
    antiPopNode.connect(smoothingFilter);
    smoothingFilter.connect(gainNode);
    gainNode.connect(compressor);
    compressor.connect(audioContext.destination);
    
    // Fade in very gradually from silence using exponential ramp
    source.start(0);
    const now = audioContext.currentTime;
    antiPopNode.gain.setValueAtTime(0.001, now); // Start with near-zero (can't be zero for exponential)
    antiPopNode.gain.exponentialRampToValueAtTime(1.0, now + CONFIG.ambient.initialFade);

    return { source, gainNode, antiPopNode, compressor, smoothingFilter };
  } catch (error) {
    console.error("Ambient setup failed:", error);
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = "position:fixed;bottom:10px;left:10px;background:rgba(255,0,0,0.7);color:white;padding:10px;z-index:9999;";
    errorMsg.textContent = `Audio error: ${error.message}`;
    document.body.appendChild(errorMsg);
    return null;
  }
}

/**
 * Sets up the engine sound with anti-crackling measures.
 * @returns {object} - An object containing the audio source, filter, gain node, and other audio processing nodes.
 */
function setupEngineSound() {
  if (!audioContext) return null;
  try {
    // Create a larger buffer size for smoother noise
    const bufferSize = 4 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(2, bufferSize, audioContext.sampleRate);
    
    // Generate improved pink noise for more realistic engine sound
    for (let channel = 0; channel < 2; channel++) {
      const output = noiseBuffer.getChannelData(channel);
      
      // Pink noise with better low frequency response
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
      for (let i = 0; i < bufferSize; i++) {
        // Generate white noise
        const white = Math.random() * 2 - 1;
        
        // Pink filter (Paul Kellet's refined method)
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        
        // Mix pink noise components, then amplify
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5) * 0.5;
      }
    }

    // Create the audio processing chain
    const source = audioContext.createBufferSource();
    const lowpassFilter = audioContext.createBiquadFilter();
    const gainNode = audioContext.createGain();
    const antiPopNode = audioContext.createGain();
    
    // Setup the main filter
    lowpassFilter.type = 'lowpass';
    
    // Use midpoint between minFreq and maxFreq as the default engine frequency
    const defaultFreq = (CONFIG.engine.minFreq + CONFIG.engine.maxFreq) / 2;

    lowpassFilter.frequency.value = defaultFreq;
    lowpassFilter.Q.value = CONFIG.engine.q;
    
    // Add a second filter for enhanced sub-bass
    const subBassFilter = audioContext.createBiquadFilter();
    subBassFilter.type = 'lowshelf';
    subBassFilter.frequency.value = CONFIG.engine.subFreq;
    subBassFilter.gain.value = CONFIG.engine.minSubGain;
    // Add Q value for resonance
    subBassFilter.Q.value = CONFIG.engine.subQ;
    
    // Add a bandpass filter for engine characteristics
    const bandpassFilter = audioContext.createBiquadFilter();
    bandpassFilter.type = 'bandpass';
    bandpassFilter.frequency.value = defaultFreq * 1.5;
    bandpassFilter.Q.value = 1.5;
    
    // Add compressor for dynamics control and anti-pop
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 10;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.01; 
    compressor.release.value = 0.1;
    
    // Create a stereo panner and wave shaper for distortion
    const panner = audioContext.createStereoPanner();
    panner.pan.value = 0;
    
    // Connect the processing chain
    source.buffer = noiseBuffer;
    source.loop = true;
    
    // Connection path focused on deeper, punchier engine sound
    source.connect(antiPopNode);
    antiPopNode.connect(lowpassFilter);
    lowpassFilter.connect(bandpassFilter);    
    bandpassFilter.connect(subBassFilter);
    subBassFilter.connect(gainNode);
    gainNode.connect(compressor);
    compressor.connect(panner);
    panner.connect(audioContext.destination);
    
    // Initialize all gains to near-zero (not exact zero to avoid clicks)
    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    antiPopNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    
    // Extra-smooth startup
    const now = audioContext.currentTime;
    source.start(0);
    
    // Very gradual fade-in to prevent any pops
    const startDelay = 0.5; // Wait a moment before any sound
    antiPopNode.gain.setValueAtTime(0.001, now);
    antiPopNode.gain.exponentialRampToValueAtTime(0.01, now + startDelay);
    antiPopNode.gain.exponentialRampToValueAtTime(1.0, now + startDelay + 1.0);
    
    // Wait for proper engine startup before allowing modulation
    setTimeout(() => {
      engineStarted = true;
    }, 1500);

    return {
      source,
      filter: lowpassFilter,
      bandpassFilter,
      subBassFilter,
      gainNode,
      antiPopNode,
      compressor,
      panner
    };
  } catch (error) {
    console.error("Engine sound setup failed:", error);
    return null;
  }
}

// ----------------------------------------------------------------------------------------------------
// ACTIVITY HANDLER
// ----------------------------------------------------------------------------------------------------

/**
 * Handles user activity and fades sounds in or out based on activity.
 */
function handleActivity() {
  if (!isSoundEnabled || !audioContext) return;
  if (!ambientSource || !engineSource) return;

  // Clear existing timeout
  if (idleTimeout) {
    clearTimeout(idleTimeout);
    idleTimeout = null;
  }
  
  // If not active, fade in sounds gradually
  if (!isUserActive) {
    isUserActive = true;
    
    const now = audioContext.currentTime;
    
    // Fade in ambient sound
    ambientSource.gainNode.gain.cancelScheduledValues(now);
    ambientSource.gainNode.gain.setValueAtTime(ambientSource.gainNode.gain.value || 0.001, now);
    ambientSource.gainNode.gain.exponentialRampToValueAtTime(CONFIG.ambient.targetVolume, now + CONFIG.fadeDuration);
    
    // Fade in engine to appropriate level based on current speed
    if (engineStarted) {
      const targetVolume = getEngineVolumeForSpeed(scrollSpeed);
      engineSource.gainNode.gain.cancelScheduledValues(now);
      engineSource.gainNode.gain.setValueAtTime(engineSource.gainNode.gain.value || 0.001, now);
      engineSource.gainNode.gain.exponentialRampToValueAtTime(targetVolume, now + CONFIG.fadeDuration);
    }
  }
  
  // Set timeout for inactivity with gradual fade
  idleTimeout = setTimeout(() => {
    isUserActive = false;
    
    if (ambientSource && engineSource) {
      const now = audioContext.currentTime;
      const fadeTo = 0.001;
      const fadeOutDuration = CONFIG.fadeDuration * 2; // Longer fade-out for smoother transition
      
      // Ambient fade out
      ambientSource.gainNode.gain.cancelScheduledValues(now);
      ambientSource.gainNode.gain.setValueAtTime(ambientSource.gainNode.gain.value, now);
      ambientSource.gainNode.gain.exponentialRampToValueAtTime(fadeTo, now + fadeOutDuration);
      ambientSource.gainNode.gain.setValueAtTime(0, now + fadeOutDuration + 0.01);
      
      // Engine fade out
      engineSource.gainNode.gain.cancelScheduledValues(now);
      engineSource.gainNode.gain.setValueAtTime(engineSource.gainNode.gain.value, now);
      engineSource.gainNode.gain.exponentialRampToValueAtTime(fadeTo, now + fadeOutDuration * 0.7); // Slightly faster
      engineSource.gainNode.gain.setValueAtTime(0, now + fadeOutDuration + 0.01);
    }
  }, CONFIG.idleTimeout);
}

// ----------------------------------------------------------------------------------------------------
// SOUND PARAMETER UPDATES
// ----------------------------------------------------------------------------------------------------

/**
 * Calculates the engine volume based on the current speed.
 * @param {number} speed - The current speed of the spaceship.
 * @returns {number} - The calculated engine volume.
 */
function getEngineVolumeForSpeed(speed) {
  const speedRatio = Math.min(Math.max(speed, 0) / CONFIG.engine.speedThreshold, 1.0);
  return CONFIG.engine.minVolume + (speedRatio * (CONFIG.engine.maxVolume - CONFIG.engine.minVolume));
}

/**
 * Updates the sound parameters based on the current speed.
 * @param {number} timestamp - The current timestamp.
 */
function updateSoundParameters() {
  if (!ambientSource || !engineSource || !audioContext || !isSoundEnabled || !engineStarted) {
    animationFrameId = requestAnimationFrame(updateSoundParameters);
    return;
  }

  // Get top speed from scrollTracker
  const topSpeed = scrollTracker.getConfig().topSpeed;

  // Use actual speed value directly
  const speedRatio = Math.min(Math.max(scrollSpeed, 0) / topSpeed, 1.0);
  const timeInSec = audioContext.currentTime;

  // Ambient pitch - directly proportional to speed
  const ambientPitch = CONFIG.ambient.minPitch + (speedRatio * (CONFIG.ambient.maxPitch - CONFIG.ambient.minPitch));

  // Apply to ambient pitch - direct setting
  ambientSource.source.playbackRate.setTargetAtTime(
    ambientPitch,
    timeInSec,
    CONFIG.engine.rampTime
  );

  // Only update engine parameters if user is active
  if (isUserActive) {
    // Engine volume - directly proportional to speed
    const engineVolume = CONFIG.engine.minVolume + (speedRatio * (CONFIG.engine.maxVolume - CONFIG.engine.minVolume));

    // Filter frequency - directly proportional to speed
    const filterFreq = CONFIG.engine.minFreq + (speedRatio * (CONFIG.engine.maxFreq - CONFIG.engine.minFreq));

    // Sub bass gain - directly proportional to speed (Rumble)
    const subGain = CONFIG.engine.minSubGain + (speedRatio * (CONFIG.engine.maxSubGain - CONFIG.engine.minSubGain));

    // Apply all parameters with minimal smoothing - direct reflection of speed
    engineSource.gainNode.gain.setTargetAtTime(engineVolume, timeInSec, CONFIG.engine.speedResponseTime);
    engineSource.filter.frequency.setTargetAtTime(filterFreq, timeInSec, CONFIG.engine.speedResponseTime);
    engineSource.bandpassFilter.frequency.setTargetAtTime(filterFreq * 1.5, timeInSec, CONFIG.engine.speedResponseTime);
    engineSource.subBassFilter.gain.setTargetAtTime(subGain, timeInSec, CONFIG.engine.speedResponseTime);
  }

  animationFrameId = requestAnimationFrame(updateSoundParameters);
}

// ----------------------------------------------------------------------------------------------------
// RESOURCE CLEANUP
// ----------------------------------------------------------------------------------------------------

/**
 * Cleans up audio resources.
 */
function cleanupAudioResources() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  activityEventListeners.forEach(({ event, handler }) => {
    document.removeEventListener(event, handler);
  });
  activityEventListeners = [];
  if (ambientSource) {
    try {
      ambientSource.source.stop();
      ambientSource.gainNode.disconnect();
      ambientSource = null;
    } catch (e) {
      console.error("Error cleaning up ambient source:", e);
    }
  }
  if (engineSource) {
    try {
      engineSource.source.stop();
      engineSource.filter.disconnect();
      engineSource.gainNode.disconnect();
      engineSource.panner.disconnect();
      engineSource = null;
    } catch (e) {
      console.error("Error cleaning up engine source:", e);
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// UI TOGGLE
// ----------------------------------------------------------------------------------------------------

/**
 * Updates the UI toggle state.
 * @param {boolean} isOn - Whether the sound is on or off.
 */
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
  }
}

// ----------------------------------------------------------------------------------------------------
// SOUND SYSTEM ENABLE/DISABLE
// ----------------------------------------------------------------------------------------------------

/**
 * Enables the sound system.
 */
async function enableSoundSystem() {
  try {
    const context = await createAudioContext();
    if (!context) throw new Error("Could not create audio context");

    cleanupAudioResources();
    ambientSource = await setupAmbient();
    engineSource = setupEngineSound(); // Renamed from setupNoise
    
    if (!ambientSource || !engineSource) throw new Error("Source creation failed");

    // Subscribe to scroll tracker updates for velocity only
    scrollTracker.on("update", (data) => {
      scrollSpeed = data.velocityKMH;
      // Count scrolling as activity - keeps sounds playing while scrolling
      handleActivity();
    });

    // Remove the impulse response handler - we only care about speed
    // scrollTracker.on("scroll", handleScrollImpulse); -- REMOVED

    // Start parameter update loop
    animationFrameId = requestAnimationFrame(updateSoundParameters);
    
    // Add throttled mousemove handler to ensure it doesn't cause performance issues
    let lastMouseMoveTime = 0;
    const handleMouseMove = () => {
      const now = performance.now();
      // Throttle to once every 200ms to prevent excessive calls
      if (now - lastMouseMoveTime > 200) {
        lastMouseMoveTime = now;
        handleActivity();
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    activityEventListeners.push({ event: 'mousemove', handler: handleMouseMove });
    
    // Set up other activity listeners
    const events = ['click', 'keydown', 'touchstart', 'wheel'];
    events.forEach(evt => {
      // Remove unnecessary binding as handleActivity doesn't use 'this' context
      document.addEventListener(evt, handleActivity);
      activityEventListeners.push({ event: evt, handler: handleActivity });
    });

    // Start in inactive state but trigger activity immediately
    isUserActive = false;
    engineStarted = false; // Will be set to true after proper startup
    handleActivity();
    
    return true;
  } catch (error) {
    console.error("Sound enable failed:", error);
    return false;
  }
}

/**
 * Handles the user's sound ON/OFF choice.
 * @param {boolean} enableSound - Whether to enable or disable the sound.
 */
async function handleSoundChoice(enableSound) {
  if (enableSound) {
    try {
      if (!audioContext) {
        audioContext = await createAudioContext();
        if (!audioContext) throw new Error("Failed to create audio context");
      }
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      isSoundEnabled = true;
      updateToggleUI(true);
      const success = await enableSoundSystem();
      if (success) handleActivity();
    } catch (error) {
      console.error("Failed to enable sound:", error);
      isSoundEnabled = false;
      updateToggleUI(false);
    }
  } else {
    isSoundEnabled = false;
    updateToggleUI(false);
    if (ambientSource && engineSource) {
      createFadeNode(ambientSource.gainNode, 0);
      createFadeNode(engineSource.gainNode, 0);
      setTimeout(() => {
        if (audioContext) audioContext.suspend();
        cleanupAudioResources();
      }, CONFIG.fadeDuration * 1000);
    } else if (audioContext) {
      audioContext.suspend();
    }
  }
  // Dispatch the custom event regardless of UI state.
  window.dispatchEvent(new CustomEvent(SOUND_CHOICE_MADE));
}

// ----------------------------------------------------------------------------------------------------
// FLOATING BUTTON
// ----------------------------------------------------------------------------------------------------

/**
 * Toggles the sound on or off.
 */
function toggleSound() {
  if (!audioContext) return;
  isSoundEnabled = !isSoundEnabled;
  updateToggleUI(isSoundEnabled);
  if (isSoundEnabled) {
    const resumePromise = audioContext.state === 'suspended'
      ? audioContext.resume().catch(err => console.error("Failed to resume audio context:", err))
      : Promise.resolve();
    resumePromise.then(() => {
      if (ambientSource && engineSource) {
        createFadeNode(ambientSource.gainNode, CONFIG.ambient.targetVolume);
        createFadeNode(engineSource.gainNode, CONFIG.engine.maxVolume);
      } else {
        enableSoundSystem().then(() => {
          if (ambientSource && engineSource) {
            createFadeNode(ambientSource.gainNode, CONFIG.ambient.targetVolume);
            createFadeNode(engineSource.gainNode, CONFIG.engine.maxVolume);
          }
        });
      }
    });
  } else {
    if (ambientSource && engineSource) {
      createFadeNode(ambientSource.gainNode, 0);
      createFadeNode(engineSource.gainNode, 0);
      setTimeout(() => {
        if (audioContext) audioContext.suspend();
      }, CONFIG.fadeDuration * 1000);
    } else if (audioContext) {
      audioContext.suspend();
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------------------------------------------------

/**
 * Initializes the sound system.
 */
export async function initSoundSystem() {
  try {
    // Create audio context first to make it available for all sound systems
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          // Setup click handler to resume context
          const resumeAudio = () => {
            audioContext.resume().catch(e => console.warn("Could not resume audio context:", e));
            document.removeEventListener('click', resumeAudio);
          };
          document.addEventListener('click', resumeAudio, { once: true });
        }
      } catch (error) {
        console.error("Failed to create audio context:", error);
      }
    }
    
    // UI element initialization for existing DOM elements
    const btnOn = document.querySelector('#button-sound-on');
    const btnOff = document.querySelector('#button-sound-off');

    if (btnOn) {
      btnOn.addEventListener('click', async () => {
        audioContext = await createAudioContext();
        if (audioContext && audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        handleSoundChoice(true);
      });
    }
    
    if (btnOff) {
      btnOff.addEventListener('click', () => handleSoundChoice(false));
    }
    
    // If a floating toggle exists, attach the listener.
    if (soundToggle) {
      // Avoid duplicate listeners by reassigning the element if needed.
      const newToggle = soundToggle.cloneNode(true);
      if (soundToggle.parentNode) {
        soundToggle.parentNode.replaceChild(newToggle, soundToggle);
        soundToggle = newToggle;
        soundToggleKnob = soundToggle.querySelector('.sound-toggle__knob');
        soundToggleLight = soundToggleKnob ? soundToggleKnob.querySelector('.knob-light') : null;
      }
      soundToggle.addEventListener('click', toggleSound);
    }
    
    window.addEventListener('beforeunload', cleanupAudioResources);
    audioInitialized = true;
    return true;
  } catch (error) {
    console.error("Error during sound system initialization:", error);
    return false;
  }
}

// ----------------------------------------------------------------------------------------------------
// ROBOT SPEECH FUNCTIONS
// ----------------------------------------------------------------------------------------------------

/**
 * Plays a sound for a specific character in robot speech.
 * @param {string} character - The character to generate sound for.
 */
function playRobotSpeechSound(character) {
    if (!robotSpeechEnabled || !audioContext || audioContext.state !== 'running') return;
    
    try {
        // Create oscillator and gain nodes
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Connect the nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set frequency based on character type
        let frequency = CONFIG.robotSpeech.baseFrequency;
        const charMappings = CONFIG.robotSpeech.characterMappings;
        
        if (charMappings.vowels.has(character)) {
            frequency *= CONFIG.robotSpeech.vowelModifier;
            frequency += Math.random() * 50;
        } else if (charMappings.bilabial.has(character)) {
            frequency *= CONFIG.robotSpeech.consonantModifier * 0.8;
        } else if (charMappings.nasals.has(character)) {
            frequency *= CONFIG.robotSpeech.consonantModifier * 0.9;
        } else if (charMappings.sibilants.has(character)) {
            frequency *= CONFIG.robotSpeech.consonantModifier * 1.4;
        } else if (charMappings.dentals.has(character)) {
            frequency *= CONFIG.robotSpeech.consonantModifier * 1.2;
        } else if (charMappings.pauses.has(character)) {
            frequency *= 0.5;
        } else if (character === ' ') {
            return; // No sound for spaces
        } else {
            frequency *= (0.9 + Math.random() * 0.4);
        }
        
        // Set oscillator properties
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        
        // Set envelope
        const now = audioContext.currentTime;
        gainNode.gain.value = 0;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(CONFIG.robotSpeech.volume, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + (CONFIG.robotSpeech.soundDuration / 1000));
        
        // Start and stop the oscillator with a slight buffer
        oscillator.start(now);
        oscillator.stop(now + (CONFIG.robotSpeech.soundDuration / 1000) + 0.01);
        
    } catch (error) {
        console.warn("Error playing robot speech sound:", error);
    }
}

/**
 * Initializes the robot speech audio system.
 * @returns {boolean} Whether initialization was successful.
 */
function initRobotSpeech() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error("Could not initialize audio context for robot speech:", error);
            return false;
        }
    }
    
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(e => {
            console.warn("Could not resume audio context:", e);
        });
    }
    
    return true;
}

/**
 * Plays a test sound to verify audio is working.
 */
function playTestSound() {
    if (!audioContext) {
        if (!initRobotSpeech()) return;
    }
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 440; // A note
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
        
        console.log("Test sound played");
    } catch (error) {
        console.error("Error playing test sound:", error);
    }
}

/**
 * Toggles robot speech sounds on/off.
 * @returns {boolean} The new state of robot speech (enabled/disabled).
 */
function toggleRobotSpeech() {
    robotSpeechEnabled = !robotSpeechEnabled;
    
    // Notify any registered callback about the change (for UI updates)
    if (robotToggleCallback) {
        robotToggleCallback(robotSpeechEnabled);
    }
    
    return robotSpeechEnabled;
}

/**
 * Register a callback for robot speech toggle state changes.
 * @param {Function} callback - The callback function to call when toggle state changes.
 */
function onRobotSpeechToggle(callback) {
    robotToggleCallback = callback;
}

// Export robot speech functionality
export const robotSpeech = {
    play: playRobotSpeechSound,
    toggle: toggleRobotSpeech,
    onToggle: onRobotSpeechToggle,
    isEnabled: () => robotSpeechEnabled,
    init: initRobotSpeech,
    playTestSound
};

// Export the custom event name
export const EVENTS = {
  SOUND_CHOICE_MADE
};
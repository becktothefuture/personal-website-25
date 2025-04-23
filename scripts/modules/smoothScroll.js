/**
 * Smooth Scroll Module
 * --------------------
 * Implements smooth scrolling using Lenis.js library.
 * 
 * This module:
 * - Creates a smooth scrolling experience across the site
 * - Implements vertical inverted scrolling
 * - Provides scroll events that can be consumed by other modules
 * - Optimizes performance by replacing native scroll with Lenis
 * - Integrates with scrollTracker for consistent scroll metrics
 */

import { scrollTracker } from './scrollTracker.js';

// We need to import Lenis from CDN since it's not locally available
let Lenis;

// Configuration for smooth scrolling
export const smoothScrollConfig = {
  duration: 1.2,      // Base duration of the scroll animation
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Ease out expo
  orientation: 'vertical',  // Scroll orientation
  gestureOrientation: 'vertical',
  smoothWheel: true,  // Enable smooth scrolling for mouse wheel
  smoothTouch: false, // Usually better UX to disable for touch devices
  touchMultiplier: 2, // Make touch scrolling faster than wheel
  wheelMultiplier: 1, // Wheel speed multiplier
  infinite: false,    // Disable infinite scroll
  invertScroll: true, // Enable inverted scrolling direction
};

class SmoothScroll {
  constructor() {
    this.lenis = null;
    this.isInitialized = false;
    this.rafId = null;
    this.resizeObserver = null;
    this.scrollContainer = document.documentElement;
  }

  async init() {
    // Dynamically import Lenis from CDN if not already loaded
    if (typeof Lenis === 'undefined') {
      try {
        // Import using dynamic import
        const module = await import('https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.27/dist/lenis.min.js');
        Lenis = module.default;
      } catch (error) {
        console.error('Failed to load Lenis.js from CDN:', error);
        // Fall back to creating a script tag
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.27/dist/lenis.min.js';
          script.onload = () => {
            Lenis = window.Lenis;
            resolve();
          };
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
    }

    // Initialize Lenis with our configuration
    this.lenis = new Lenis({
      duration: smoothScrollConfig.duration,
      easing: smoothScrollConfig.easing,
      orientation: smoothScrollConfig.orientation,
      gestureOrientation: smoothScrollConfig.gestureOrientation,
      smoothWheel: smoothScrollConfig.smoothWheel,
      smoothTouch: smoothScrollConfig.smoothTouch,
      touchMultiplier: smoothScrollConfig.touchMultiplier,
      // Proper way to implement inverted scrolling is with negative wheelMultiplier
      wheelMultiplier: smoothScrollConfig.invertScroll ? -smoothScrollConfig.wheelMultiplier : smoothScrollConfig.wheelMultiplier,
      infinite: smoothScrollConfig.infinite,
      direction: 'vertical', // Keep this as vertical, inversion is handled by wheelMultiplier
    });

    // Set up the animation frame loop for Lenis
    this.raf();

    // Connect with scrollTracker for consistent metrics
    this.connectToScrollTracker();
    
    // Set up resize observer for responsive adjustments
    this.setupResizeObserver();
    
    this.isInitialized = true;
    console.log('Smooth scrolling initialized with Lenis.js');
  }

  raf() {
    this.rafId = requestAnimationFrame(this.raf.bind(this));
    this.lenis?.raf(performance.now());
  }

  // Connect Lenis scroll events to scrollTracker for consistent metrics
  connectToScrollTracker() {
    if (!this.lenis) return;
    
    this.lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
      // Convert normalized velocity to acceleration for scrollTracker
      const acceleration = Math.abs(velocity) * 0.1;
      
      // Send scroll update to scrollTracker by simulating a wheel event
      // This makes sure all existing logic in scrollTracker works with Lenis
      if (typeof scrollTracker.onLenisScroll === 'function') {
        scrollTracker.onLenisScroll({
          normalizedAcceleration: acceleration, 
          normalizedSpeed: Math.abs(velocity),
          scrollY: scroll,
          maxScroll: limit,
          direction: direction,
          progress: progress
        });
      }
      
      // Also dispatch a custom event for other modules
      window.dispatchEvent(new CustomEvent('lenis:scroll', { 
        detail: {
          scrollY: scroll,
          maxScroll: limit,
          scrollVelocity: velocity,
          direction: direction,
          scrollProgress: progress
        }
      }));
    });
  }
  
  // Set up resize observer to handle container size changes
  setupResizeObserver() {
    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(entries => {
        if (this.lenis) {
          this.lenis.resize();
        }
      });
      
      this.resizeObserver.observe(document.documentElement);
    }
  }
  
  // Update Lenis configuration
  updateConfig(newConfig) {
    if (!this.lenis) return;
    
    Object.entries(newConfig).forEach(([key, value]) => {
      this.lenis[key] = value;
    });
  }

  // Destroy instance and clean up
  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
    
    this.isInitialized = false;
  }
}

// Create singleton instance
let smoothScrollInstance;

export function initSmoothScroll() {
  if (!smoothScrollInstance) {
    smoothScrollInstance = new SmoothScroll();
    smoothScrollInstance.init();
  }
  return smoothScrollInstance;
}

export default initSmoothScroll;
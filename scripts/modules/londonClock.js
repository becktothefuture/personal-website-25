console.log('London Clock Module Initialized');

let clockInterval = null;

/**
 * Updates the London clock by calculating and applying rotations for the clock hands
 */
function updateLondonClock() {
  // 1) Get current London time via timeZone
  const londonTimeString = new Date().toLocaleString("en-US", { timeZone: "Europe/London" });
  const londonTime = new Date(londonTimeString);
  
  const hours = londonTime.getHours();
  const minutes = londonTime.getMinutes();
  const seconds = londonTime.getSeconds();

  // 2) Calculate each hand's rotation:
  // Hour hand: each hour = 30°, plus a fraction for the minutes
  const hourDegrees = (hours % 12) * 30 + (minutes / 60) * 30;
  
  // Minute hand: each minute = 6°
  const minuteDegrees = minutes * 6;
  
  // Second hand: each second = 6°
  const secondDegrees = seconds * 6;

  // 3) Apply the rotations to each hand
  const hourHand = document.getElementById("hour_hand");
  const minuteHand = document.getElementById("minute_hand");
  const secondHand = document.getElementById("second_hand");
  
  // Only apply transformations if elements exist
  if (hourHand) hourHand.style.transform = `rotate(${hourDegrees}deg)`;
  if (minuteHand) minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
  if (secondHand) secondHand.style.transform = `rotate(${secondDegrees}deg)`;
}

/**
 * Initializes the London clock
 * @returns {Object} Control object with start and stop methods
 */
export function initLondonClock() {
  // Clear any existing interval to prevent duplicates
  if (clockInterval) clearInterval(clockInterval);
  
  // Update the clock once per second
  clockInterval = setInterval(updateLondonClock, 1000);
  
  // Kick things off immediately
  updateLondonClock();
  
  // Return control object
  return {
    start: () => {
      if (!clockInterval) {
        clockInterval = setInterval(updateLondonClock, 1000);
        updateLondonClock();
      }
    },
    stop: () => {
      if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
      }
    }
  };
}

export default initLondonClock;

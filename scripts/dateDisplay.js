// Function to get and display the current weekday and date
function updateDateTime() {
  const now = new Date();
  
  // Get weekday
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekday = weekdays[now.getDay()];
  const weekdayElement = document.getElementById('weekday');
  if (weekdayElement) {
    weekdayElement.textContent = `it's ${weekday}`;
  }
  
  // Get date with suffix
  const day = now.getDate();
  const daySuffix = getDaySuffix(day);
  
  // Get month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[now.getMonth()];
  
  const dateElement = document.getElementById('date');
  if (dateElement) {
    dateElement.textContent = `[${day}${daySuffix}, ${month}]`;
  }
}

// Function to get the appropriate suffix for the day (1st, 2nd, 3rd, 4th, etc.)
function getDaySuffix(day) {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Run the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', updateDateTime);

export function initDateDisplay() {
    const updateDateDisplay = () => {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const parts = fmt.formatToParts(now);
      let weekday, day, month, year;
      parts.forEach(p => {
        if (p.type === 'weekday') weekday = p.value.toLowerCase();
        if (p.type === 'day') day = parseInt(p.value);
        if (p.type === 'month') month = p.value;
        if (p.type === 'year') year = p.value;
      });
      // Helper for ordinal suffix (e.g., 1st, 2nd, 3rd, etc.)
      const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" 
                                : ["th", "st", "nd", "rd"][n % 10] || "th");
  
      const greetingEl = document.getElementById("greeting");
      const logbookEl = document.getElementById("logbook");
      if (greetingEl) greetingEl.textContent = `it's ${weekday}`;
      if (logbookEl) logbookEl.textContent = `Logbook ${ordinal(day)} ${month} ${year}`;
    };
  
    // Ensure the DOM is ready before updating
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", updateDateDisplay);
    } else {
      updateDateDisplay();
    }
  }
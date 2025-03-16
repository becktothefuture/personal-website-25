console.log("lightPath initialized");

export function initLightPath(svg, pathElement, lightsContainer) {
  // Constants



  const circleDiameter = 6;
  const circleSpacing = 12;
  const dotColor = "var(--color-3)";
  const activeDotColor = "var(--color-1)";
  const pulseFrequency =  0.05;
  const pulseIntensity = 0.9;
  const pulseDuration = 300;
  const lightGroups = 14;
  const activeLightsAtOnce = 3;
  const speed = 120;

  // Helper: Draw the SVG Path
  function drawPath() {
    const { width, height } = svg.getBoundingClientRect();
    // Add small margin to prevent edge bleeding
    const margin = 1;
    const radius = 100;
    const padding = circleDiameter / 2 + 10;
    // Constrain dimensions to prevent overflow
    const adjustedWidth = Math.min(width - margin * 2, Math.max(width - 2 * padding, 2 * radius));
    const adjustedHeight = Math.min(height - margin * 2, Math.max(height - 2 * padding, 2 * radius));

    const pathData = `
      M${padding + radius},${padding}
      h${adjustedWidth - 2 * radius}
      a${radius},${radius} 0 0 1 ${radius},${radius}
      v${Math.max(adjustedHeight - 2 * radius, 0)}
      a${radius},${radius} 0 0 1 -${radius},${radius}
      h-${Math.max(adjustedWidth - 2 * radius, 0)}
      a${radius},${radius} 0 0 1 -${radius},-${radius}
      v-${Math.max(adjustedHeight - 2 * radius, 0)}
      a${radius},${radius} 0 0 1 ${radius},-${radius}
      Z
    `;
    pathElement.setAttribute("d", pathData);
  }

  // Helper: Create Lights Along the Path
  function createLights() {
    lightsContainer.innerHTML = ""; // Clear existing lights
    const pathLength = pathElement.getTotalLength();
    const numCircles = Math.floor(pathLength / circleSpacing);
    const circles = [];

    for (let i = 0; i < numCircles; i++) {
      const pt = pathElement.getPointAtLength((i * pathLength) / numCircles);
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.classList.add("light-path__circle");
      circle.setAttribute("cx", pt.x);
      circle.setAttribute("cy", pt.y);
      circle.setAttribute("r", circleDiameter / 2);
      circle.style.fill = dotColor;
      lightsContainer.appendChild(circle);
      circles.push(circle);
    }

    animateLights(circles); // Start the animation
  }

  // Helper: Animate Lights
  function animateLights(circles) {
    let currentIndex = 0;

    function updateLights() {
      // Clear all states
      circles.forEach((circle) => {
        circle.style.fill = dotColor;
        if (Math.random() < pulseFrequency) {
          circle.style.opacity = pulseIntensity;
          setTimeout(() => {
            circle.style.opacity = 0.2;
          }, pulseDuration);
        }
      });

      // Activate light groups
      const groupSpacing = Math.floor(circles.length / lightGroups);
      for (let group = 0; group < lightGroups; group++) {
        const groupStartIndex = (currentIndex + group * groupSpacing) % circles.length;

        for (let i = 0; i < activeLightsAtOnce; i++) {
          const activeIndex = (groupStartIndex + i) % circles.length;
          circles[activeIndex].style.fill = activeDotColor;
        }
      }

      currentIndex = (currentIndex + 1) % circles.length;
      setTimeout(updateLights, speed); // Use setTimeout for consistent speed
    }

    setTimeout(updateLights, speed); // Initialize the animation loop
  }

  // Helper: Resize Handler
  function handleResize() {
    drawPath();
    createLights();
  }

  // Initialize
  drawPath();
  createLights();
  window.addEventListener("resize", handleResize);
}



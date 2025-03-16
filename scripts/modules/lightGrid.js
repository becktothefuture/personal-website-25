// Export verification
console.log('Light grid module intialized');

export function initLightGrids() {
    document.querySelectorAll('.light-grid').forEach(grid => {
        const rows = parseInt(grid.getAttribute('data-rows'), 10) || 5;
        const cols = parseInt(grid.getAttribute('data-columns'), 10) || 5;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const circle = document.createElement('div');
                circle.classList.add('light-grid__circle');
                grid.appendChild(circle);
            }
        }
    });

    const dots = document.querySelectorAll('.light-grid__circle');
    const params = {
        baseDuration: 16000,  
        durationVar: 1000,   
        maxDelay: 6000       
    };

    dots.forEach(dot => {
        const duration = params.baseDuration + 
                       Math.random() * params.durationVar;
        const delay = Math.random() * params.maxDelay;
        
        dot.style.animation = 
            `flicker ${duration}ms steps(4, jump-none) ${delay}ms infinite`;
    });
}


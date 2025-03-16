console.log("Text processor initialized");


// Utility Functions
function getRandomCharacter() {
    const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()";
    return characters.charAt(Math.floor(Math.random() * characters.length));
}

function generateRandomString(length) {
    let result = "";
    for (let i = 0; i < length; i++) {
        result += getRandomCharacter();
    }
    return result;
}



// Animation Functions
export function initProcessorAnimation1() {
    const className = '.processor1';
    const elements = document.querySelectorAll(className);
    elements.forEach((element) => {
        setInterval(() => {
            element.textContent = generateRandomString(20);
        }, 150);
    });
}

export function initProcessorAnimation2() {
    const className = '.processor2';
    const frames = [
        ".............",
        "\\\\\\\\\\\\\\\\",
        "|||||||||||||",
        "<<<<<<<<<>>>>",
        ">>>>>>>>><<<<",
        "+++++++++++++",
        "((((((((((((((",
        "))))))))))))))",
        "  /\\    /\\  ",

        " /  \\  /  \\ ",

        "/    \\/    \\",

        "\\    /\\    /",

        " \\  /  \\  / ",

        "  \\/    \\/  ",

        "  /\\    /\\  ",

        " /  \\  /  \\ ",
        "O            ",

        " O           ",

        "  O          ",

        "   O         ",

        "    O        ",

        "     O       ",

        "      O      ",

        "       O     ",

        "        O    ",

        "         O   ",

        "          O  ",

        "           O ",

        "            O",

        "           O ",

        "          O  ",
    ];
    const elements = document.querySelectorAll(className);
    elements.forEach((element) => {
        let frameIndex = 0;
        setInterval(() => {
            element.textContent = frames[frameIndex];
            frameIndex = (frameIndex + 1) % frames.length;
        }, 200);
    });
}

export function initProcessorAnimation3() {
    const className = '.processor3';
    const elements = document.querySelectorAll(className);
    elements.forEach((element) => {
        setInterval(() => {
            let str = "×××××××××××××××××";
            const pos1 = Math.floor(Math.random() * str.length);
            const pos2 = Math.floor(Math.random() * str.length);
            const pos3 = Math.floor(Math.random() * str.length);
            str = str.split("");
            str[pos1] = getRandomCharacter();
            str[pos2] = getRandomCharacter();
            str[pos3] = getRandomCharacter();
            element.textContent = str.join("");
        }, 250);
    });
}


export function initProcessorAnimation4() {
    const className = '.processor4';
    const PROCESSOR_TEXT = "Assimilating designs..., Drafting wireframes…, Pixel pushing in progress…, Strategizing user journeys…, Colour palette wrangling…, Component crafting in session…, Polishing pixels to perfection…, Icon ideation underway…, UX flowchart frenzy…, Design system architecting…, Prototyping in hyperdrive…, Typography tweaking…, Usability testing adventure…, Interface illusionist at work…, User empathy engine running…, Wireframe wizardry…, Accessibility advocating…, Sketching sleek solutions…, Feedback loop gymnastics…, Iteration initiation…, Responsive design refining…, Developer handoff magic…, Innovation incubation…, Detail detective on duty…, Experience enchantment ongoing…,";
    const elements = document.querySelectorAll(className);
    const length = PROCESSOR_TEXT.length;
    elements.forEach((element) => {
        let index = 0;
        setInterval(() => {
            const displayedText = PROCESSOR_TEXT.substring(index, index + 20);
            element.textContent = displayedText;
            index = (index + 1) % length;
        }, 250);
    });
}



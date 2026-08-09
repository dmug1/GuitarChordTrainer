// --- Chord Dictionary (Maiores, Menores, Sétimas) ---
// Frets array represents strings from Low E to High E.
// -1 means mute (X), 0 means open string (O), > 0 is the fret number.
const chords = [
    { name: "C", frets: [-1, 3, 2, 0, 1, 0] },
    { name: "A", frets: [-1, 0, 2, 2, 2, 0] },
    { name: "G", frets: [3, 2, 0, 0, 0, 3] },
    { name: "E", frets: [0, 2, 2, 1, 0, 0] },
    { name: "D", frets: [-1, -1, 0, 2, 3, 2] },
    { name: "Am", frets: [-1, 0, 2, 2, 1, 0] },
    { name: "Em", frets: [0, 2, 2, 0, 0, 0] },
    { name: "Dm", frets: [-1, -1, 0, 2, 3, 1] },
    { name: "A7", frets: [-1, 0, 2, 0, 2, 0] },
    { name: "B7", frets: [-1, 2, 1, 2, 0, 2] },
    { name: "C7", frets: [-1, 3, 2, 3, 1, 0] },
    { name: "D7", frets: [-1, -1, 0, 2, 1, 2] },
    { name: "E7", frets: [0, 2, 0, 1, 0, 0] },
    { name: "G7", frets: [3, 2, 0, 0, 0, 1] }
];

// --- Audio System (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playMetronomeTick(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'woodblock') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    } else if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    } else { // Modern Click (Default)
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    }
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

// --- SVG Diagram Generator ---
function generateChordSVG(chord) {
    const width = 120;
    const height = 140;
    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">`;
    
    // Draw 6 Strings (Vertical)
    for (let i = 0; i < 6; i++) {
        let x = 10 + (i * 20);
        svg += `<line x1="${x}" y1="30" x2="${x}" y2="130" stroke="#94a3b8" stroke-width="2"/>`;
    }
    
    // Draw Nut (Top thick line) and Frets (Horizontal)
    svg += `<line x1="10" y1="30" x2="110" y2="30" stroke="#f8fafc" stroke-width="4"/>`;
    for (let i = 1; i <= 4; i++) {
        let y = 30 + (i * 25);
        svg += `<line x1="10" y1="${y}" x2="110" y2="${y}" stroke="#475569" stroke-width="2"/>`;
    }

    // Draw fingerings, open, and mutes
    chord.frets.forEach((fret, stringIndex) => {
        let x = 10 + (stringIndex * 20);
        if (fret === -1) {
            // Muted string (X)
            svg += `<text x="${x}" y="20" fill="#ef4444" font-size="14" text-anchor="middle" font-family="sans-serif" font-weight="bold">X</text>`;
        } else if (fret === 0) {
            // Open string (O)
            svg += `<circle cx="${x}" cy="16" r="4" fill="none" stroke="#10b981" stroke-width="2"/>`;
        } else {
            // Fingered fret (Circle)
            let y = 30 + (fret * 25) - 12.5; // Center between frets
            svg += `<circle cx="${x}" cy="${y}" r="8" fill="#10b981"/>`;
        }
    });

    svg += `</svg>`;
    return svg;
}

// --- App Logic ---
let timer;
let isPlaying = false;
let currentChordIndex = -1;

// DOM Elements
const bpmSlider = document.getElementById('bpm-slider');
const bpmDisplay = document.getElementById('bpm-display');
const soundSelect = document.getElementById('sound-select');
const chordNameEl = document.getElementById('chord-name');
const chordDiagramEl = document.getElementById('chord-diagram');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnStop = document.getElementById('btn-stop');

// Update BPM UI
bpmSlider.addEventListener('input', (e) => {
    bpmDisplay.textContent = e.target.value;
    if (isPlaying) {
        // Restart timer with new BPM seamlessly
        clearInterval(timer);
        startTimer();
    }
});

function pickRandomChord() {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * chords.length);
    } while (newIndex === currentChordIndex && chords.length > 1); // Avoid repeating the exact same chord back-to-back
    currentChordIndex = newIndex;
    
    const chord = chords[currentChordIndex];
    chordNameEl.textContent = chord.name;
    chordDiagramEl.innerHTML = generateChordSVG(chord);
}

function startTimer() {
    const bpm = parseInt(bpmSlider.value);
    const msPerBeat = 60000 / bpm;
    
    timer = setInterval(() => {
        pickRandomChord();
        playMetronomeTick(soundSelect.value);
    }, msPerBeat);
}

btnStart.addEventListener('click', () => {
    if (!isPlaying) {
        isPlaying = true;
        btnStart.disabled = true;
        btnPause.disabled = false;
        btnStop.disabled = false;
        
        // Immediate first beat
        pickRandomChord();
        playMetronomeTick(soundSelect.value);
        startTimer();
    }
});

btnPause.addEventListener('click', () => {
    isPlaying = false;
    clearInterval(timer);
    btnStart.disabled = false;
    btnPause.disabled = true;
});

btnStop.addEventListener('click', () => {
    isPlaying = false;
    clearInterval(timer);
    
    btnStart.disabled = false;
    btnPause.disabled = true;
    btnStop.disabled = true;
    
    chordNameEl.textContent = "Ready?";
    chordDiagramEl.innerHTML = "";
    currentChordIndex = -1;
});
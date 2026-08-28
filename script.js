const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const levelNumEl = document.getElementById('level-num');
const coinCountEl = document.getElementById('coin-count');
const livesDisplayEl = document.getElementById('lives-display');
const buyLifeBtn = document.getElementById('buyLifeBtn');
const resetBtn = document.getElementById('resetBtn');
const audioBtn = document.getElementById('audioBtn');

// Game State
let currentLevel = 1;
let coins = 100; // Modal awal koin untuk coba fitur beli nyawa
let lives = 2;   // Mulai dari 2 agar bisa dicoba dibeli jadi 3
let soundEnabled = true;

// Grid and Arena settings
const gridSize = 6;
let cellSize = 50;

// Arrows data
let arrows = [];

// Audio Web Audio API Synthetic Sound (Tanpa file eksternal)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, type = 'sine', duration = 0.15) {
    if (!soundEnabled) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function resizeCanvas() {
    const wrapper = document.querySelector('.canvas-wrapper');
    const availableWidth = wrapper.clientWidth;
    const availableHeight = wrapper.clientHeight;
    
    const size = Math.min(availableWidth, availableHeight);
    canvas.width = size;
    canvas.height = size;
    cellSize = size / gridSize;
    draw();
}

window.addEventListener('resize', resizeCanvas);

function initLevel() {
    arrows = [];
    const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    
    let count = Math.min(6 + currentLevel * 2, 20);
    
    for (let i = 0; i < count; i++) {
        let x = Math.floor(Math.random() * (gridSize - 2)) + 1;
        let y = Math.floor(Math.random() * (gridSize - 2)) + 1;
        
        if (!arrows.some(a => a.x === x && a.y === y)) {
            arrows.push({
                x: x,
                y: y,
                dir: dirs[Math.floor(Math.random() * dirs.length)],
                color: colors[Math.floor(Math.random() * colors.length)],
                moving: false,
                vx: 0,
                vy: 0
            });
        }
    }
    updateUI();
    draw();
}

function updateUI() {
    levelNumEl.textContent = currentLevel;
    coinCountEl.textContent = coins;
    
    // Update Lives Display
    let hearts = '';
    for (let i = 0; i < 3; i++) {
        hearts += i < lives ? '❤️ ' : '🖤 ';
    }
    livesDisplayEl.textContent = hearts.trim();
    
    // Status Tombol Beli Nyawa
    if (lives >= 3 || coins < 50) {
        buyLifeBtn.style.opacity = '0.6';
    } else {
        buyLifeBtn.style.opacity = '1';
    }
}

// Beli Nyawa Function
buyLifeBtn.addEventListener('click', () => {
    if (lives < 3 && coins >= 50) {
        coins -= 50;
        lives += 1;
        playSound(600, 'triangle', 0.2);
        updateUI();
    } else if (lives >= 3) {
        alert("Nyawa Anda sudah penuh! (Maksimal 3)");
    } else {
        alert("Koin tidak cukup! Butuh 50 🪙");
    }
});

resetBtn.addEventListener('click', () => {
    playSound(300, 'sine', 0.1);
    initLevel();
});

audioBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    audioBtn.textContent = soundEnabled ? '🔊' : '🔇';
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
    }
    
    // Draw Arrows
    arrows.forEach(a => {
        const cx = (a.x + 0.5) * cellSize;
        const cy = (a.y + 0.5) * cellSize;
        const rad = cellSize * 0.35;
        
        ctx.save();
        ctx.translate(cx, cy);
        
        let angle = 0;
        if (a.dir === 'RIGHT') angle = 0;
        if (a.dir === 'DOWN') angle = Math.PI / 2;
        if (a.dir === 'LEFT') angle = Math.PI;
        if (a.dir === 'UP') angle = -Math.PI / 2;
        
        ctx.rotate(angle);
        
        // Arrow Shape
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.moveTo(rad, 0);
        ctx.lineTo(-rad * 0.6, -rad * 0.7);
        ctx.lineTo(-rad * 0.2, 0);
        ctx.lineTo(-rad * 0.6, rad * 0.7);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    });
}

// Touch & Click Event Handling
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;
    
    const gx = Math.floor(touchX / cellSize);
    const gy = Math.floor(touchY / cellSize);
    
    const clickedIndex = arrows.findIndex(a => a.x === gx && a.y === gy && !a.moving);
    if (clickedIndex !== -1) {
        checkAndMove(clickedIndex);
    }
});

function checkAndMove(index) {
    const a = arrows[index];
    let blocked = false;
    
    // Cek tabrakan di jalur panah
    arrows.forEach((other, oIdx) => {
        if (oIdx !== index) {
            if (a.dir === 'RIGHT' && other.y === a.y && other.x > a.x) blocked = true;
            if (a.dir === 'LEFT' && other.y === a.y && other.x < a.x) blocked = true;
            if (a.dir === 'DOWN' && other.x === a.x && other.y > a.y) blocked = true;
            if (a.dir === 'UP' && other.x === a.x && other.y < a.y) blocked = true;
        }
    });
    
    if (blocked) {
        // Tabrakan -> Nyawa berkurang
        playSound(150, 'sawtooth', 0.25);
        lives -= 1;
        updateUI();
        
        // Shake Canvas
        canvas.style.transform = 'translate(4px, 0)';
        setTimeout(() => canvas.style.transform = 'translate(-4px, 0)', 50);
        setTimeout(() => canvas.style.transform = 'translate(0, 0)', 100);
        
        if (lives <= 0) {
            setTimeout(() => {
                alert("Game Over! Nyawa Habis.");
                lives = 3;
                currentLevel = 1;
                initLevel();
            }, 150);
        }
    } else {
        // Berhasil Keluar
        playSound(440, 'sine', 0.15);
        arrows.splice(index, 1);
        coins += 10;
        updateUI();
        draw();
        
        if (arrows.length === 0) {
            setTimeout(() => {
                playSound(800, 'sine', 0.3);
                alert(`Selamat! Level ${currentLevel} Selesai 🎉`);
                currentLevel++;
                initLevel();
            }, 200);
        }
    }
}

// Start Game
resizeCanvas();
initLevel();

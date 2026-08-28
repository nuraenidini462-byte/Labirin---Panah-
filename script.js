const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const levelNumEl = document.getElementById('level-num');
const coinCountEl = document.getElementById('coin-count');
const livesDisplayEl = document.getElementById('lives-display');
const buyLifeBtn = document.getElementById('buyLifeBtn');
const resetBtn = document.getElementById('resetBtn');
const audioBtn = document.getElementById('audioBtn');

let currentLevel = 1;
let coins = 100;
let lives = 3;
let soundEnabled = true;

const gridSize = 6;
let cellSize = 50;

let arrows = [];

// Sound Generator
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

// Logika Level Solvable (Bisa Diselesaikan & Tidak Macet)
function initLevel() {
    arrows = [];
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    
    let occupied = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    let count = Math.min(3 + currentLevel, 8);

    for (let i = 0; i < count; i++) {
        let length = Math.floor(Math.random() * 2) + 2; // Panjang 2 - 3 kotak
        let color = colors[i % colors.length];

        for (let attempt = 0; attempt < 100; attempt++) {
            let dir = dirs[Math.floor(Math.random() * dirs.length)];
            let hx = Math.floor(Math.random() * gridSize);
            let hy = Math.floor(Math.random() * gridSize);

            // Cek apakah jalur depan kepala panah kosong ke arah luar
            let pathClearOut = true;
            let checkX = hx, checkY = hy;
            while (true) {
                if (dir === 'RIGHT') checkX++;
                if (dir === 'LEFT') checkX--;
                if (dir === 'DOWN') checkY++;
                if (dir === 'UP') checkY--;

                if (checkX < 0 || checkX >= gridSize || checkY < 0 || checkY >= gridSize) break;
                if (occupied[checkY][checkX]) {
                    pathClearOut = false;
                    break;
                }
            }

            if (!pathClearOut) continue;

            // Buat badan ular di belakang kepala
            let path = [{x: hx, y: hy}];
            let validBody = true;

            for (let len = 1; len < length; len++) {
                let bx = hx, by = hy;
                if (dir === 'RIGHT') bx = hx - len;
                if (dir === 'LEFT') bx = hx + len;
                if (dir === 'DOWN') by = hy - len;
                if (dir === 'UP') by = hy + len;

                if (bx < 0 || bx >= gridSize || by < 0 || by >= gridSize || occupied[by][bx]) {
                    validBody = false;
                    break;
                }
                path.push({x: bx, y: by});
            }

            if (validBody && !occupied[hy][hx]) {
                path.forEach(pt => occupied[pt.y][pt.x] = true);
                arrows.push({
                    dir: dir,
                    color: color,
                    path: path
                });
                break;
            }
        }
    }
    updateUI();
    draw();
}

function updateUI() {
    levelNumEl.textContent = currentLevel;
    coinCountEl.textContent = coins;
    
    let hearts = '';
    for (let i = 0; i < 3; i++) {
        hearts += i < lives ? '❤️ ' : '🖤 ';
    }
    livesDisplayEl.textContent = hearts.trim();
    
    buyLifeBtn.style.opacity = (lives >= 3 || coins < 50) ? '0.6' : '1';
}

buyLifeBtn.addEventListener('click', () => {
    if (lives < 3 && coins >= 50) {
        coins -= 50;
        lives += 1;
        playSound(600, 'triangle', 0.2);
        updateUI();
    } else if (lives >= 3) {
        alert("Nyawa sudah penuh!");
    } else {
        alert("Koin tidak cukup!");
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

// Render Tampilan Papan & Ular Panah
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Line Grid Papan
    ctx.strokeStyle = '#1e2942';
    ctx.lineWidth = 1.5;
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
    
    // Gambar Ular Memanjang + Kepala Panah Putih
    arrows.forEach(a => {
        ctx.fillStyle = a.color;
        ctx.strokeStyle = a.color;
        ctx.lineWidth = cellSize * 0.45;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 1. Badan Ular Memanjang
        if (a.path.length > 1) {
            ctx.beginPath();
            let head = a.path[0];
            ctx.moveTo((head.x + 0.5) * cellSize, (head.y + 0.5) * cellSize);
            for (let i = 1; i < a.path.length; i++) {
                let pt = a.path[i];
                ctx.lineTo((pt.x + 0.5) * cellSize, (pt.y + 0.5) * cellSize);
            }
            ctx.stroke();
        }

        // 2. Kepala Panah di Depan
        const head = a.path[0];
        const cx = (head.x + 0.5) * cellSize;
        const cy = (head.y + 0.5) * cellSize;
        const rad = cellSize * 0.35;

        ctx.save();
        ctx.translate(cx, cy);

        let angle = 0;
        if (a.dir === 'RIGHT') angle = 0;
        if (a.dir === 'DOWN') angle = Math.PI / 2;
        if (a.dir === 'LEFT') angle = Math.PI;
        if (a.dir === 'UP') angle = -Math.PI / 2;

        ctx.rotate(angle);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(rad * 0.8, 0);
        ctx.lineTo(-rad * 0.4, -rad * 0.6);
        ctx.lineTo(-rad * 0.1, 0);
        ctx.lineTo(-rad * 0.4, rad * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });
}

// Deteksi Klik / Tap Panah
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;
    
    const gx = Math.floor(touchX / cellSize);
    const gy = Math.floor(touchY / cellSize);
    
    const clickedIndex = arrows.findIndex(a => 
        a.path.some(pt => pt.x === gx && pt.y === gy)
    );

    if (clickedIndex !== -1) {
        checkAndMove(clickedIndex);
    }
});

function checkAndMove(index) {
    const a = arrows[index];
    const head = a.path[0];
    let blocked = false;

    arrows.forEach((other, oIdx) => {
        if (oIdx !== index) {
            other.path.forEach(pt => {
                if (a.dir === 'RIGHT' && pt.y === head.y && pt.x > head.x) blocked = true;
                if (a.dir === 'LEFT' && pt.y === head.y && pt.x < head.x) blocked = true;
                if (a.dir === 'DOWN' && pt.x === head.x && pt.y > head.y) blocked = true;
                if (a.dir === 'UP' && pt.x === head.x && pt.y < head.y) blocked = true;
            });
        }
    });

    if (blocked) {
        playSound(150, 'sawtooth', 0.25);
        lives -= 1;
        updateUI();

        canvas.style.transform = 'translate(5px, 0)';
        setTimeout(() => canvas.style.transform = 'translate(-5px, 0)', 50);
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
        playSound(440, 'sine', 0.15);
        arrows.splice(index, 1);
        coins += 20;
        updateUI();
        draw();

        if (arrows.length === 0) {
            setTimeout(() => {
                playSound(800, 'sine', 0.3);
                alert(`Luar Biasa! Level ${currentLevel} Selesai 🎉`);
                currentLevel++;
                initLevel();
            }, 200);
        }
    }
}

resizeCanvas();
initLevel();

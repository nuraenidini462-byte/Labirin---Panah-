const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const audioBtn = document.getElementById('audioBtn');
const buyLifeBtn = document.getElementById('buyLifeBtn');
const livesContainer = document.getElementById('lives-display');
const levelNumEl = document.getElementById('level-num');
const coinCountEl = document.getElementById('coin-count');

const GRID_SIZE = 6;
const CELL_SIZE = 50;
canvas.width = GRID_SIZE * CELL_SIZE;
canvas.height = GRID_SIZE * CELL_SIZE;

let currentLevelIndex = 0;
let lives = 3;
let coins = 0;
let isAnimating = false;
let audioMuted = false;

// Audio Synthesizer (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioMuted) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'slide') {
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'win') {
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    }
}

// Data Banyak Level
const LEVELS = [
    // Level 1
    [
        { id: 1, x: 0, y: 0, dir: 'R', length: 2 },
        { id: 2, x: 2, y: 0, dir: 'D', length: 3 },
        { id: 3, x: 5, y: 1, dir: 'U', length: 2 },
        { id: 4, x: 1, y: 3, dir: 'L', length: 2 },
        { id: 5, x: 3, y: 4, dir: 'R', length: 3 }
    ],
    // Level 2
    [
        { id: 1, x: 1, y: 0, dir: 'D', length: 4 },
        { id: 2, x: 0, y: 1, dir: 'R', length: 3 },
        { id: 3, x: 4, y: 2, dir: 'L', length: 2 },
        { id: 4, x: 2, y: 4, dir: 'U', length: 3 },
        { id: 5, x: 0, y: 5, dir: 'R', length: 4 }
    ],
    // Level 3
    [
        { id: 1, x: 0, y: 0, dir: 'D', length: 3 },
        { id: 2, x: 0, y: 3, dir: 'R', length: 4 },
        { id: 3, x: 5, y: 0, dir: 'D', length: 5 },
        { id: 4, x: 2, y: 1, dir: 'L', length: 2 },
        { id: 5, x: 1, y: 5, dir: 'R', length: 3 }
    ],
    // Level 4
    [
        { id: 1, x: 0, y: 0, dir: 'R', length: 3 },
        { id: 2, x: 3, y: 0, dir: 'D', length: 3 },
        { id: 3, x: 0, y: 2, dir: 'U', length: 2 },
        { id: 4, x: 1, y: 4, dir: 'R', length: 4 },
        { id: 5, x: 5, y: 2, dir: 'D', length: 3 },
        { id: 6, x: 2, y: 5, dir: 'L', length: 2 }
    ]
];

let arrows = [];

function loadLevel(index) {
    if (index >= LEVELS.length) {
        alert('🎉 Selamat! Anda telah menyelesaikan SEMUA level!');
        currentLevelIndex = 0;
    }
    
    levelNumEl.textContent = currentLevelIndex + 1;
    arrows = JSON.parse(JSON.stringify(LEVELS[currentLevelIndex]));
    isAnimating = false;
    draw();
}

function updateUI() {
    let hearts = '';
    for (let i = 0; i < 3; i++) {
        hearts += i < lives ? '❤️ ' : '🖤 ';
    }
    livesContainer.innerHTML = hearts;
    coinCountEl.textContent = coins;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1e3a8a';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            ctx.beginPath();
            ctx.arc(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    arrows.forEach(arrow => {
        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = '#38bdf8';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let startX = arrow.x * CELL_SIZE + CELL_SIZE / 2;
        let startY = arrow.y * CELL_SIZE + CELL_SIZE / 2;
        let endX = startX;
        let endY = startY;

        if (arrow.dir === 'R') endX += (arrow.length - 1) * CELL_SIZE;
        if (arrow.dir === 'L') endX -= (arrow.length - 1) * CELL_SIZE;
        if (arrow.dir === 'D') endY += (arrow.length - 1) * CELL_SIZE;
        if (arrow.dir === 'U') endY -= (arrow.length - 1) * CELL_SIZE;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        drawArrowHead(endX, endY, arrow.dir);
    });
}

function drawArrowHead(x, y, dir) {
    ctx.beginPath();
    const size = 10;
    if (dir === 'R') {
        ctx.moveTo(x + size, y);
        ctx.lineTo(x - size, y - size);
        ctx.lineTo(x - size, y + size);
    } else if (dir === 'L') {
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y - size);
        ctx.lineTo(x + size, y + size);
    } else if (dir === 'U') {
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.lineTo(x + size, y + size);
    } else if (dir === 'D') {
        ctx.moveTo(x, y + size);
        ctx.lineTo(x - size, y - size);
        ctx.lineTo(x + size, y - size);
    }
    ctx.closePath();
    ctx.fill();
}

canvas.addEventListener('click', (e) => {
    if (isAnimating) return;

    if (lives <= 0) {
        alert('💔 Nyawa Anda habis! Beli nyawa dengan koin atau reset level.');
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const col = Math.floor(clickX / CELL_SIZE);
    const row = Math.floor(clickY / CELL_SIZE);

    arrows.forEach((arrow, index) => {
        if (isCellInArrow(arrow, col, row)) {
            tryMoveArrow(arrow, index);
        }
    });
});

function isCellInArrow(arrow, col, row) {
    for (let i = 0; i < arrow.length; i++) {
        let cx = arrow.x;
        let cy = arrow.y;
        if (arrow.dir === 'R') cx += i;
        if (arrow.dir === 'L') cx -= i;
        if (arrow.dir === 'D') cy += i;
        if (arrow.dir === 'U') cy -= i;

        if (cx === col && cy === row) return true;
    }
    return false;
}

function tryMoveArrow(arrow, index) {
    if (isPathBlocked(arrow)) {
        lives--;
        playSound('hit');
        updateUI();

        canvas.style.transform = 'translateX(8px)';
        setTimeout(() => canvas.style.transform = 'translateX(-8px)', 50);
        setTimeout(() => canvas.style.transform = 'translateX(0)', 100);
        if (navigator.vibrate) navigator.vibrate(200);

        return;
    }

    isAnimating = true;
    coins += 10;
    playSound('slide');
    updateUI();

    let interval = setInterval(() => {
        if (arrow.dir === 'R') arrow.x += 0.4;
        if (arrow.dir === 'L') arrow.x -= 0.4;
        if (arrow.dir === 'D') arrow.y += 0.4;
        if (arrow.dir === 'U') arrow.y -= 0.4;

        draw();

        if (arrow.x < -3 || arrow.x > GRID_SIZE + 3 || arrow.y < -3 || arrow.y > GRID_SIZE + 3) {
            clearInterval(interval);
            arrows.splice(index, 1);
            isAnimating = false;
            draw();

            if (arrows.length === 0) {
                playSound('win');
                setTimeout(() => {
                    alert('🎉 Level Selesai! Lanjut ke Level Berikutnya!');
                    currentLevelIndex++;
                    loadLevel(currentLevelIndex);
                }, 150);
            }
        }
    }, 20);
}

function isPathBlocked(arrow) {
    let checkX = arrow.x;
    let checkY = arrow.y;

    if (arrow.dir === 'R') checkX += arrow.length - 1;
    if (arrow.dir === 'D') checkY += arrow.length - 1;

    while (true) {
        if (arrow.dir === 'R') checkX++;
        if (arrow.dir === 'L') checkX--;
        if (arrow.dir === 'D') checkY++;
        if (arrow.dir === 'U') checkY--;

        if (checkX < 0 || checkX >= GRID_SIZE || checkY < 0 || checkY >= GRID_SIZE) {
            return false;
        }

        for (let other of arrows) {
            if (other.id !== arrow.id && isCellInArrow(other, checkX, checkY)) {
                return true;
            }
        }
    }
}

buyLifeBtn.addEventListener('click', () => {
    if (lives >= 3) {
        alert('❤️ Nyawa Anda masih penuh!');
        return;
    }
    if (coins >= 50) {
        coins -= 50;
        lives++;
        updateUI();
        playSound('win');
    } else {
        alert('🪙 Koin tidak cukup! Butuh 50 koin untuk beli 1 nyawa.');
    }
});

audioBtn.addEventListener('click', () => {
    audioMuted = !audioMuted;
    audioBtn.textContent = audioMuted ? '🔇' : '🔊';
});

resetBtn.addEventListener('click', () => {
    lives = 3;
    updateUI();
    loadLevel(currentLevelIndex);
});

updateUI();
loadLevel(currentLevelIndex);

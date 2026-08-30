const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const levelNumEl = document.getElementById('level-num');
const coinCountEl = document.getElementById('coin-count');
const livesDisplayEl = document.getElementById('lives-display');

// Modals UI
const bgModal = document.getElementById('bgModal');
const settingsModal = document.getElementById('settingsModal');
const gameOverModal = document.getElementById('gameOverModal');

// Open/Close Buttons
document.getElementById('openBgBtn').addEventListener('click', () => bgModal.classList.remove('hidden'));
document.getElementById('closeBgBtn').addEventListener('click', () => bgModal.classList.add('hidden'));

document.getElementById('openSettingsBtn').addEventListener('click', () => settingsModal.classList.remove('hidden'));
document.getElementById('closeSettingsBtn').addEventListener('click', () => settingsModal.classList.add('hidden'));

document.getElementById('closeGameOverBtn').addEventListener('click', () => gameOverModal.classList.add('hidden'));

// Game States
let currentLevel = 187;
let coins = 460;
let lives = 3;
let isSfxOn = true;
let isMusicOn = true;
let isVibrateOn = true;

// Web Audio Synth BGM & SFX
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bgmInterval = null;

function playTone(freq, duration, type = 'sine') {
    if (!isSfxOn) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function playSound(type) {
    if (type === 'move') playTone(600, 0.08, 'triangle');
    if (type === 'hit')  playTone(120, 0.25, 'sawtooth');
    if (type === 'win')  playTone(880, 0.3, 'sine');
}

// Musik Melodi Latar
function startBGM() {
    if (bgmInterval) clearInterval(bgmInterval);
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
    let step = 0;
    bgmInterval = setInterval(() => {
        if (isMusicOn) {
            playTone(notes[step % notes.length], 0.15, 'sine');
            step++;
        }
    }, 400);
}

document.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!bgmInterval) startBGM();
}, { once: true });

function triggerVibrate() {
    if (isVibrateOn && navigator.vibrate) {
        navigator.vibrate(80);
    }
}

document.getElementById('sfxToggle').addEventListener('change', (e) => isSfxOn = e.target.checked);
document.getElementById('musicToggle').addEventListener('change', (e) => isMusicOn = e.target.checked);
document.getElementById('vibrateToggle').addEventListener('change', (e) => isVibrateOn = e.target.checked);

// Pembelian Nyawa Menggunakan Koin
function buyLivesWithCoins() {
    if (coins >= 50) {
        coins -= 50;
        lives = 3;
        updateUI();
        gameOverModal.classList.add('hidden');
        playSound('win');
    } else {
        alert("Koin Anda tidak cukup!");
    }
}

document.getElementById('buyLifeBtn').addEventListener('click', buyLivesWithCoins);
document.getElementById('buyReviveBtn').addEventListener('click', buyLivesWithCoins);

document.getElementById('giveUpBtn').addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    lives = 3;
    initLevel();
});

document.getElementById('restartLevelBtn').addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    lives = 3;
    initLevel();
});

// Ganti Warna Latar via Palet
let currentArrowColor = '#38bdf8';
document.querySelectorAll('.bg-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.bg-opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const bgClass = btn.getAttribute('data-bg');
        document.body.className = bgClass;

        const style = getComputedStyle(document.body);
        currentArrowColor = style.getPropertyValue('--arrow-color').trim();

        draw();
        bgModal.classList.add('hidden');
    });
});

// Grid & Arrow Maze Generator
let cols = 14;
let rows = 18;
let cellSize = 22;
let arrows = [];

function resizeCanvas() {
    const wrapper = document.querySelector('.canvas-wrapper');
    const cellW = wrapper.clientWidth / cols;
    const cellH = wrapper.clientHeight / rows;
    cellSize = Math.min(cellW, cellH);

    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    draw();
}

window.addEventListener('resize', resizeCanvas);

function initLevel() {
    arrows = [];
    let occupied = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

    for (let attempt = 0; attempt < 1500; attempt++) {
        let hx = Math.floor(Math.random() * cols);
        let hy = Math.floor(Math.random() * rows);

        if (occupied[hy][hx]) continue;
        let dir = dirs[Math.floor(Math.random() * dirs.length)];

        let pathClearOut = true;
        let cx = hx, cy = hy;
        while (true) {
            if (dir === 'RIGHT') cx++;
            if (dir === 'LEFT') cx--;
            if (dir === 'DOWN') cy++;
            if (dir === 'UP') cy--;

            if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) break;
            if (occupied[cy][cx]) {
                pathClearOut = false;
                break;
            }
        }

        if (!pathClearOut) continue;

        let targetLen = Math.floor(Math.random() * 6) + 3;
        let path = [{x: hx, y: hy}];
        let tempOccupied = JSON.parse(JSON.stringify(occupied));
        tempOccupied[hy][hx] = true;

        let currX = hx, currY = hy;
        let success = true;

        for (let l = 1; l < targetLen; l++) {
            let ds = (l === 1) 
                ? [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(d => {
                    if (dir === 'LEFT' && d.x === 1) return false;
                    if (dir === 'RIGHT' && d.x === -1) return false;
                    if (dir === 'UP' && d.y === 1) return false;
                    if (dir === 'DOWN' && d.y === -1) return false;
                    return true;
                })
                : [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];

            let neighbors = [];
            for (let d of ds) {
                let nx = currX + d.x, ny = currY + d.y;
                if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !tempOccupied[ny][nx]) {
                    neighbors.push({x: nx, y: ny});
                }
            }

            if (neighbors.length === 0) break;
            let nextPt = neighbors[Math.floor(Math.random() * neighbors.length)];
            path.push(nextPt);
            tempOccupied[nextPt.y][nextPt.x] = true;
            currX = nextPt.x; currY = nextPt.y;
        }

        if (success && path.length >= 2) {
            path.forEach(pt => occupied[pt.y][pt.x] = true);
            arrows.push({ dir: dir, path: path, hitHighlight: false });
        }
    }

    resizeCanvas();
    updateUI();
}

function updateUI() {
    levelNumEl.textContent = currentLevel;
    coinCountEl.textContent = coins;
    const hearts = livesDisplayEl.querySelectorAll('.heart');
    hearts.forEach((h, idx) => {
        if (idx < lives) h.classList.add('active');
        else h.classList.remove('active');
    });
}

// Draw Canvas: Panah Single Color Sesuai Tema
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    arrows.forEach(a => {
        const path = a.path;
        const head = path[0];
        const tail = path[path.length - 1];

        // Warna Panah Solid
        const drawColor = a.hitHighlight ? '#ef4444' : currentArrowColor;

        // Badan Panah
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = cellSize * 0.34;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo((head.x + 0.5) * cellSize, (head.y + 0.5) * cellSize);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo((path[i].x + 0.5) * cellSize, (path[i].y + 0.5) * cellSize);
        }
        ctx.stroke();

        // Titik Ekor Panah
        const tailCx = (tail.x + 0.5) * cellSize;
        const tailCy = (tail.y + 0.5) * cellSize;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(tailCx, tailCy, cellSize * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Kepala Panah Lancip
        const headCx = (head.x + 0.5) * cellSize;
        const headCy = (head.y + 0.5) * cellSize;
        const arrowSize = cellSize * 0.42;

        ctx.save();
        ctx.translate(headCx, headCy);

        let angle = 0;
        if (a.dir === 'RIGHT') angle = 0;
        if (a.dir === 'DOWN')  angle = Math.PI / 2;
        if (a.dir === 'LEFT')  angle = Math.PI;
        if (a.dir === 'UP')    angle = -Math.PI / 2;

        ctx.rotate(angle);

        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.moveTo(arrowSize * 0.8, 0);
        ctx.lineTo(-arrowSize * 0.4, -arrowSize * 0.55);
        ctx.lineTo(-arrowSize * 0.1, 0);
        ctx.lineTo(-arrowSize * 0.4, arrowSize * 0.55);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });
}

// Interaksi Tap Panah
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const gx = Math.floor(touchX / cellSize);
    const gy = Math.floor(touchY / cellSize);

    const clickedIdx = arrows.findIndex(a =>
        a.path.some(pt => pt.x === gx && pt.y === gy)
    );

    if (clickedIdx !== -1) {
        checkAndMove(clickedIdx);
    }
});

function checkAndMove(index) {
    const a = arrows[index];
    const head = a.path[0];
    let blocked = false;
    let blockingArrow = null;

    arrows.forEach((other, oIdx) => {
        if (oIdx !== index) {
            other.path.forEach(pt => {
                if (a.dir === 'RIGHT' && pt.y === head.y && pt.x > head.x) { blocked = true; blockingArrow = a; }
                if (a.dir === 'LEFT'  && pt.y === head.y && pt.x < head.x) { blocked = true; blockingArrow = a; }
                if (a.dir === 'DOWN'  && pt.x === head.x && pt.y > head.y) { blocked = true; blockingArrow = a; }
                if (a.dir === 'UP'    && pt.x === head.x && pt.y < head.y) { blocked = true; blockingArrow = a; }
            });
        }
    });

    if (blocked) {
        playSound('hit');
        triggerVibrate();

        if (blockingArrow) {
            blockingArrow.hitHighlight = true;
            draw();
            setTimeout(() => {
                blockingArrow.hitHighlight = false;
                draw();
            }, 300);
        }

        lives -= 1;
        updateUI();

        if (lives <= 0) {
            setTimeout(() => {
                gameOverModal.classList.remove('hidden');
            }, 350);
        }
    } else {
        playSound('move');
        arrows.splice(index, 1);
        draw();

        if (arrows.length === 0) {
            setTimeout(() => {
                playSound('win');
                coins += 20; // Tambah Koin Saat Menang
                currentLevel++;
                lives = 3;
                initLevel();
            }, 200);
        }
    }
}

initLevel();
                   

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const levelNumEl = document.getElementById('level-num');
const coinCountEl = document.getElementById('coin-count');
const livesDisplayEl = document.getElementById('lives-display');
const themeBtn = document.getElementById('themeBtn');
const audioBtn = document.getElementById('audioBtn');
const buyLifeBtn = document.getElementById('buyLifeBtn');

let currentLevel = 1;
let coins = 100;
let lives = 3;
let soundEnabled = true;

// Grid Panah
let cols = 12;
let rows = 16;
let cellSize = 25;
let arrows = [];

// Fitur 1: Palet Lukis Ganti Warna Latar Belakang
const themes = ['theme-blue', 'theme-dark', 'theme-purple', 'theme-green'];
const arrowColors = ['#38bdf8', '#60a5fa', '#c084fc', '#34d399'];
let currentThemeIdx = 0;
let arrowColor = arrowColors[0];

themeBtn.addEventListener('click', () => {
    document.body.classList.remove(themes[currentThemeIdx]);
    currentThemeIdx = (currentThemeIdx + 1) % themes.length;
    document.body.classList.add(themes[currentThemeIdx]);
    arrowColor = arrowColors[currentThemeIdx];
    playSound('move');
    draw();
});

// Fitur 2: Audio & Setting Sound
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, duration, type = 'sine') {
    if (!soundEnabled) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function playSound(type) {
    if (type === 'move') playTone(600, 0.12, 'triangle');
    if (type === 'hit')  playTone(150, 0.2, 'sawtooth');
    if (type === 'win')  playTone(800, 0.3, 'sine');
    if (type === 'buy')  playTone(1000, 0.2, 'sine');
}

audioBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    audioBtn.textContent = soundEnabled ? '🔊' : '🔇';
    audioBtn.style.opacity = soundEnabled ? '1' : '0.5';
});

// Fitur 3: Pembelian Nyawa (+1 Nyawa seharga 50 Koin)
buyLifeBtn.addEventListener('click', () => {
    if (lives >= 3) {
        alert("Nyawa Anda masih penuh (maksimal 3)!");
        return;
    }
    if (coins < 50) {
        alert("Koin tidak cukup! Butuh 50 🪙 untuk membeli nyawa.");
        return;
    }
    
    coins -= 50;
    lives += 1;
    playSound('buy');
    updateUI();
});

function resizeCanvas() {
    const wrapper = document.querySelector('.canvas-wrapper');
    const availWidth = wrapper.clientWidth;
    const availHeight = wrapper.clientHeight;

    const cellW = availWidth / cols;
    const cellH = availHeight / rows;
    cellSize = Math.min(cellW, cellH);

    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    draw();
}

window.addEventListener('resize', resizeCanvas);

// Generator Ular Panah
function initLevel() {
    arrows = [];
    
    if (currentLevel <= 2) {
        cols = 10; rows = 14;
    } else if (currentLevel <= 5) {
        cols = 12; rows = 16;
    } else {
        cols = 14; rows = 18;
    }

    let occupied = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

    for (let attempt = 0; attempt < 1200; attempt++) {
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

        let currX = hx;
        let currY = hy;
        let success = true;

        for (let l = 1; l < targetLen; l++) {
            let neighbors = [];
            let ds = [];

            if (l === 1) {
                if (dir !== 'LEFT') ds.push({x: 1, y: 0});
                if (dir !== 'RIGHT') ds.push({x: -1, y: 0});
                if (dir !== 'UP') ds.push({x: 0, y: 1});
                if (dir !== 'DOWN') ds.push({x: 0, y: -1});
            } else {
                ds = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
            }

            for (let d of ds) {
                let nx = currX + d.x;
                let ny = currY + d.y;
                if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !tempOccupied[ny][nx]) {
                    neighbors.push({x: nx, y: ny});
                }
            }

            if (neighbors.length === 0) {
                if (l < 2) success = false;
                break;
            }

            let nextPt = neighbors[Math.floor(Math.random() * neighbors.length)];
            path.push(nextPt);
            tempOccupied[nextPt.y][nextPt.x] = true;
            currX = nextPt.x;
            currY = nextPt.y;
        }

        if (success && path.length >= 2) {
            path.forEach(pt => occupied[pt.y][pt.x] = true);
            arrows.push({ dir: dir, path: path });
        }
    }

    resizeCanvas();
    updateUI();
}

function updateUI() {
    levelNumEl.textContent = currentLevel;
    coinCountEl.textContent = coins;
    
    let heartsHTML = '';
    for (let i = 0; i < 3; i++) {
        heartsHTML += i < lives ? '❤️' : '🖤';
    }
    livesDisplayEl.innerHTML = heartsHTML;
    
    // Nonaktifkan tombol beli jika koin kurang atau nyawa penuh
    buyLifeBtn.style.opacity = (lives >= 3 || coins < 50) ? '0.5' : '1';
}

// Render Panah & Titik Buntut
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    arrows.forEach(a => {
        const path = a.path;
        const head = path[0];
        const tail = path[path.length - 1];

        // Badan Panah
        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = cellSize * 0.32;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo((head.x + 0.5) * cellSize, (head.y + 0.5) * cellSize);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo((path[i].x + 0.5) * cellSize, (path[i].y + 0.5) * cellSize);
        }
        ctx.stroke();

        // Titik Ekor/Buntut
        const tailCx = (tail.x + 0.5) * cellSize;
        const tailCy = (tail.y + 0.5) * cellSize;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(tailCx, tailCy, cellSize * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Kepala Panah
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

        ctx.fillStyle = arrowColor;
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

    // Cek Tabrakan
    arrows.forEach((other, oIdx) => {
        if (oIdx !== index) {
            other.path.forEach(pt => {
                if (a.dir === 'RIGHT' && pt.y === head.y && pt.x > head.x) blocked = true;
                if (a.dir === 'LEFT'  && pt.y === head.y && pt.x < head.x) blocked = true;
                if (a.dir === 'DOWN'  && pt.x === head.x && pt.y > head.y) blocked = true;
                if (a.dir === 'UP'    && pt.x === head.x && pt.y < head.y) blocked = true;
            });
        }
    });

    if (blocked) {
        playSound('hit');
        lives -= 1;
        updateUI();

        canvas.style.transform = 'translate(6px, 0)';
        setTimeout(() => canvas.style.transform = 'translate(-6px, 0)', 50);
        setTimeout(() => canvas.style.transform = 'translate(0, 0)', 100);

        if (lives <= 0) {
            setTimeout(() => {
                alert("Game Over! Nyawa Habis. Anda bisa membeli nyawa dengan koin atau mengulang level.");
                lives = 3;
                initLevel();
            }, 150);
        }
    } else {
        playSound('move');
        arrows.splice(index, 1);
        coins += 15; // Mendapat 15 koin per panah yang sukses keluar
        updateUI();
        draw();

        if (arrows.length === 0) {
            setTimeout(() => {
                playSound('win');
                alert(`Selamat! Level ${currentLevel} Selesai 🎉`);
                currentLevel++;
                lives = 3;
                initLevel();
            }, 200);
        }
    }
}

initLevel();

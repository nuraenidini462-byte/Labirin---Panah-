const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const levelNumEl = document.getElementById('level-num');
const coinCountEl = document.getElementById('coin-count');
const livesDisplayEl = document.getElementById('lives-display');

// Modals UI
const bgModal = document.getElementById('bgModal');
const settingsModal = document.getElementById('settingsModal');
const gameOverModal = document.getElementById('gameOverModal');

document.getElementById('openBgBtn').addEventListener('click', () => bgModal.classList.remove('hidden'));
document.getElementById('closeBgBtn').addEventListener('click', () => bgModal.classList.add('hidden'));

document.getElementById('openSettingsBtn').addEventListener('click', () => settingsModal.classList.remove('hidden'));
document.getElementById('closeSettingsBtn').addEventListener('click', () => settingsModal.classList.add('hidden'));

document.getElementById('closeGameOverBtn').addEventListener('click', () => gameOverModal.classList.add('hidden'));

// Game States
let currentLevel = 1;
let coins = 100;
let lives = 3;
let isSfxOn = true;
let isMusicOn = true;
let isVibrateOn = true;
let isGameStarted = false;

// Audio System
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bgmTimer = null;

function playTone(freq, duration, type = 'square', vol = 0.05) {
    if (!isSfxOn) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function playSound(type) {
    if (type === 'move') playTone(587.33, 0.1, 'triangle', 0.1);
    if (type === 'hit')  playTone(150, 0.25, 'sawtooth', 0.12);
    if (type === 'win')  {
        playTone(523.25, 0.1, 'square', 0.1);
        setTimeout(() => playTone(659.25, 0.1, 'square', 0.1), 100);
        setTimeout(() => playTone(783.99, 0.2, 'square', 0.1), 200);
    }
}

function startCatchyBGM() {
    if (bgmTimer) clearInterval(bgmTimer);
    const melody = [
        {f: 329.63, d: 0.15}, {f: 329.63, d: 0.15}, {f: 0, d: 0.15}, {f: 329.63, d: 0.15},
        {f: 0, d: 0.15},      {f: 261.63, d: 0.15}, {f: 329.63, d: 0.2}, {f: 392.00, d: 0.3},
        {f: 196.00, d: 0.3},  {f: 261.63, d: 0.2},  {f: 196.00, d: 0.2}, {f: 164.81, d: 0.2},
        {f: 220.00, d: 0.2},  {f: 246.94, d: 0.2},  {f: 233.08, d: 0.15},{f: 220.00, d: 0.2}
    ];
    let step = 0;
    bgmTimer = setInterval(() => {
        if (isMusicOn && isGameStarted) {
            const note = melody[step % melody.length];
            if (note.f > 0) playTone(note.f, note.d, 'triangle', 0.03);
            step++;
        }
    }, 220);
}

function triggerVibrate() {
    if (isVibrateOn && navigator.vibrate) {
        navigator.vibrate(70);
    }
}

document.getElementById('sfxToggle').addEventListener('change', (e) => isSfxOn = e.target.checked);
document.getElementById('musicToggle').addEventListener('change', (e) => isMusicOn = e.target.checked);
document.getElementById('vibrateToggle').addEventListener('change', (e) => isVibrateOn = e.target.checked);

function buyLivesWithCoins() {
    if (coins >= 50) {
        coins -= 50;
        lives = 3;
        updateUI();
        gameOverModal.classList.add('hidden');
        playSound('win');
        

/**
 * Loop Sort Game Engine
 * 60 FPS Canvas Physics, Web Audio Synthesizer, Procedural Levels
 */

(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const levelBadge = document.getElementById('level-badge');
  const releaseBtn = document.getElementById('release-btn');
  const soundBtn = document.getElementById('sound-btn');
  const restartBtn = document.getElementById('restart-btn');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalStars = document.getElementById('modal-stars');
  const modalActionBtn = document.getElementById('modal-action-btn');

  // Audio Synthesizer
  let soundEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.15, vol = 0.25) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
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

  function playReleaseSound() {
    playTone(340, 'triangle', 0.08, 0.2);
  }

  function playDockSound(streak = 1) {
    const baseFreq = 440;
    const notes = [1, 1.25, 1.33, 1.5, 1.66, 2];
    const pitch = baseFreq * (notes[streak % notes.length] || 1);
    playTone(pitch, 'sine', 0.22, 0.3);
  }

  function playWinSound() {
    if (!soundEnabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => playTone(f, 'triangle', 0.3, 0.25), i * 110);
    });
  }

  function playFailSound() {
    if (!soundEnabled) return;
    [320, 280, 240].forEach((f, i) => {
      setTimeout(() => playTone(f, 'sawtooth', 0.2, 0.2), i * 120);
    });
  }

  // Palettes
  const COLORS = {
    red: { fill: '#f43f5e', glow: 'rgba(244, 63, 94, 0.5)', highlight: '#fda4af' },
    blue: { fill: '#38bdf8', glow: 'rgba(56, 189, 248, 0.5)', highlight: '#bae6fd' },
    green: { fill: '#34d399', glow: 'rgba(52, 211, 153, 0.5)', highlight: '#a7f3d0' },
    yellow: { fill: '#fbbf24', glow: 'rgba(251, 191, 36, 0.5)', highlight: '#fde68a' },
    purple: { fill: '#c084fc', glow: 'rgba(192, 132, 252, 0.5)', highlight: '#f3e8ff' }
  };

  const COLOR_KEYS = Object.keys(COLORS);

  // Level Definitions
  let currentLevel = 1;
  const maxLevels = 15;

  let queue = [];
  let trackMarbles = [];
  let dockingMarbles = [];
  let bays = [];
  let particles = [];

  let isPlaying = false;
  let isLevelWon = false;
  let isLevelFailed = false;
  let comboStreak = 0;
  let loopSpeed = 0.0022;
  const maxOnTrack = 9;

  // Track Geometry Cache
  let cx = 0, cy = 0, rx = 0, ry = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    cx = canvas.width / 2;
    cy = canvas.height / 2 + 10 * dpr;
    rx = Math.min(canvas.width * 0.36, 180 * dpr);
    ry = Math.min(canvas.height * 0.32, 160 * dpr);
  }

  // Oval track parametric curve: t in [0, 1)
  function getTrackPoint(t) {
    const angle = t * Math.PI * 2 - Math.PI / 2; // start at 12 o'clock
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle)
    };
  }

  function setupLevel(lvl) {
    currentLevel = lvl;
    levelBadge.textContent = `Level ${lvl}`;

    // Determine colors for this level
    const numColors = Math.min(5, 2 + Math.floor((lvl - 1) / 3));
    const activeColors = COLOR_KEYS.slice(0, numColors);
    const capacityPerBay = 3;

    // Build bays along the track
    bays = [];
    const step = 1 / activeColors.length;
    activeColors.forEach((colorKey, idx) => {
      const t = (0.2 + idx * step) % 1.0;
      bays.push({
        id: idx,
        colorKey,
        color: COLORS[colorKey],
        t,
        capacity: capacityPerBay,
        filled: 0
      });
    });

    // Build marble queue
    queue = [];
    activeColors.forEach(colorKey => {
      for (let i = 0; i < capacityPerBay; i++) {
        queue.push(colorKey);
      }
    });

    // Shuffle queue randomly
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    trackMarbles = [];
    dockingMarbles = [];
    particles = [];
    comboStreak = 0;
    isPlaying = true;
    isLevelWon = false;
    isLevelFailed = false;
    modalOverlay.classList.remove('active');
    loopSpeed = 0.0022 + (lvl - 1) * 0.00015;
  }

  function releaseFrontMarble() {
    if (!isPlaying || isLevelWon || isLevelFailed) return;
    if (queue.length === 0) return;

    // Check entry clearance at t = 0.0
    const entryT = 0.0;
    const hasConflict = trackMarbles.some(m => {
      const dist = Math.abs(m.t - entryT);
      return dist < 0.07 || dist > 0.93;
    });

    if (hasConflict) {
      // Small penalty or warning
      playTone(180, 'sawtooth', 0.1, 0.15);
      return;
    }

    if (trackMarbles.length >= maxOnTrack) {
      triggerFail('Track Overcrowded!');
      return;
    }

    const colorKey = queue.shift();
    trackMarbles.push({
      colorKey,
      color: COLORS[colorKey],
      t: entryT
    });

    playReleaseSound();
  }

  function spawnParticles(x, y, color) {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 2,
        color: color.fill,
        alpha: 1
      });
    }
  }

  function triggerWin() {
    isLevelWon = true;
    isPlaying = false;
    playWinSound();

    modalTitle.textContent = 'Level Complete!';
    modalDesc.textContent = `Excellent sequencing! Ready for Level ${currentLevel + 1}?`;
    modalStars.textContent = '⭐⭐⭐';
    modalActionBtn.textContent = 'Next Level';
    modalOverlay.classList.add('active');
  }

  function triggerFail(reason = 'Track Jammed!') {
    isLevelFailed = true;
    isPlaying = false;
    playFailSound();

    modalTitle.textContent = 'Loop Jammed!';
    modalDesc.textContent = reason;
    modalStars.textContent = '💀';
    modalActionBtn.textContent = 'Try Again';
    modalOverlay.classList.add('active');
  }

  function update() {
    if (!isPlaying) return;

    // Advance track marbles
    for (let i = trackMarbles.length - 1; i >= 0; i--) {
      const m = trackMarbles[i];
      m.t = (m.t + loopSpeed) % 1.0;

      // Check matching bays
      for (const bay of bays) {
        if (bay.colorKey === m.colorKey && bay.filled < bay.capacity) {
          const delta = Math.abs(m.t - bay.t);
          if (delta < 0.03 || delta > 0.97) {
            // Magnetically dock marble
            bay.filled++;
            comboStreak++;
            playDockSound(comboStreak);

            const pt = getTrackPoint(bay.t);
            spawnParticles(pt.x, pt.y, bay.color);

            // Animate docking transition
            dockingMarbles.push({
              color: m.color,
              x: pt.x,
              y: pt.y,
              targetY: pt.y + 14,
              scale: 1,
              alpha: 1
            });

            trackMarbles.splice(i, 1);
            break;
          }
        }
      }
    }

    // Check if level won
    const allFilled = bays.every(b => b.filled >= b.capacity);
    if (allFilled && queue.length === 0 && trackMarbles.length === 0) {
      triggerWin();
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.025;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;
    const marbleRadius = 13 * dpr;

    // 1. Draw Conveyor Loop Circuit
    ctx.beginPath();
    ctx.lineWidth = 14 * dpr;
    ctx.strokeStyle = '#1e293b';
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 2 * dpr;
    ctx.strokeStyle = '#38bdf8';
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Draw Docking Bays
    bays.forEach(bay => {
      const pt = getTrackPoint(bay.t);

      // Bay Outer Glow & Ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 22 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = bay.color.glow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 18 * dpr, 0, Math.PI * 2);
      ctx.lineWidth = 3 * dpr;
      ctx.strokeStyle = bay.color.fill;
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.stroke();

      // Bay Capacity Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${11 * dpr}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${bay.filled}/${bay.capacity}`, pt.x, pt.y);
    });

    // 3. Draw Track Marbles
    trackMarbles.forEach(m => {
      const pt = getTrackPoint(m.t);

      // Drop shadow
      ctx.beginPath();
      ctx.arc(pt.x, pt.y + 2 * dpr, marbleRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Marble body
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, marbleRadius, 0, Math.PI * 2);
      ctx.fillStyle = m.color.fill;
      ctx.fill();

      // Specular shine
      ctx.beginPath();
      ctx.arc(pt.x - 4 * dpr, pt.y - 4 * dpr, marbleRadius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = m.color.highlight;
      ctx.fill();
    });

    // 4. Draw Center Feeder Queue
    ctx.beginPath();
    ctx.arc(cx, cy, 38 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.lineWidth = 2 * dpr;
    ctx.strokeStyle = '#334155';
    ctx.fill();
    ctx.stroke();

    if (queue.length > 0) {
      const nextColor = COLORS[queue[0]];
      ctx.beginPath();
      ctx.arc(cx, cy, marbleRadius * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = nextColor.fill;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx - 4 * dpr, cy - 4 * dpr, marbleRadius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = nextColor.highlight;
      ctx.fill();

      // Show queue count badge
      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${10 * dpr}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${queue.length}`, cx, cy + 24 * dpr);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = `bold ${11 * dpr}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('EMPTY', cx, cy);
    }

    // 5. Draw Particles
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Input Handlers
  releaseBtn.addEventListener('click', releaseFrontMarble);
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    releaseFrontMarble();
  });

  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      releaseFrontMarble();
    }
  });

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.innerHTML = soundEnabled
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
  });

  restartBtn.addEventListener('click', () => setupLevel(currentLevel));

  modalActionBtn.addEventListener('click', () => {
    if (isLevelWon) {
      if (currentLevel < maxLevels) setupLevel(currentLevel + 1);
      else setupLevel(1);
    } else {
      setupLevel(currentLevel);
    }
  });

  window.addEventListener('resize', resize);

  // Initialize
  resize();
  setupLevel(1);
  requestAnimationFrame(loop);
})();

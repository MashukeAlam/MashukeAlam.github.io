/**
 * CargoLoop — Truck & Conveyor Color Sorting Puzzle
 * Inspired by Garawell Games' Loop Sort
 * Full cross-browser Canvas 2D engine with Web Audio, tactile feedback, and multi-level puzzles.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const levelBadge = document.getElementById('level-badge');
  const soundBtn = document.getElementById('sound-btn');
  const restartBtn = document.getElementById('restart-btn');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalStars = document.getElementById('modal-stars');
  const modalActionBtn = document.getElementById('modal-action-btn');

  // Cross-browser safe rounded rectangle drawer
  function drawRoundRect(c, x, y, w, h, r) {
    if (typeof c.roundRect === 'function') {
      c.beginPath();
      c.roundRect(x, y, w, h, r);
    } else {
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r);
      c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r);
      c.quadraticCurveTo(x, y, x + r, y);
      c.closePath();
    }
  }

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

  function playUnloadSound() {
    playTone(320, 'triangle', 0.1, 0.25);
  }

  function playDockSound(pitchMult = 1) {
    playTone(520 * pitchMult, 'sine', 0.2, 0.3);
  }

  function playTruckCompleteSound() {
    if (!soundEnabled) return;
    [440, 554, 659].forEach((f, i) => {
      setTimeout(() => playTone(f, 'triangle', 0.22, 0.25), i * 90);
    });
  }

  function playWinSound() {
    if (!soundEnabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => playTone(f, 'triangle', 0.35, 0.3), i * 110);
    });
  }

  function playFailSound() {
    if (!soundEnabled) return;
    [300, 240, 190].forEach((f, i) => {
      setTimeout(() => playTone(f, 'sawtooth', 0.25, 0.25), i * 110);
    });
  }

  // Color Definitions
  const COLOR_PALETTE = {
    red: { name: 'Red', fill: '#ef4444', top: '#f87171', border: '#b91c1c', glow: 'rgba(239, 68, 68, 0.4)' },
    blue: { name: 'Blue', fill: '#3b82f6', top: '#60a5fa', border: '#1d4ed8', glow: 'rgba(59, 130, 246, 0.4)' },
    green: { name: 'Green', fill: '#10b981', top: '#34d399', border: '#047857', glow: 'rgba(16, 185, 129, 0.4)' },
    yellow: { name: 'Yellow', fill: '#f59e0b', top: '#fbbf24', border: '#b45309', glow: 'rgba(245, 158, 11, 0.4)' }
  };

  let currentLevel = 1;
  const maxLevels = 8;

  let trucks = [];
  let beltCubes = [];
  let particles = [];
  let beltOffset = 0;
  let isPlaying = false;
  let isLevelWon = false;
  let isLevelFailed = false;

  const maxBeltCapacity = 7;
  const beltSpeed = 0.0026;

  // Geometry cache
  let cx = 0, cy = 0, rx = 0, ry = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width > 50 ? rect.width : (canvas.parentElement ? canvas.parentElement.clientWidth : 420);
    const h = rect.height > 50 ? rect.height : (canvas.parentElement ? canvas.parentElement.clientHeight : 520);

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    cx = canvas.width / 2;
    cy = canvas.height / 2;
    rx = Math.min(canvas.width * 0.25, 105 * dpr);
    ry = Math.min(canvas.height * 0.22, 90 * dpr);

    updateTruckPositions();
  }

  function getConveyorPoint(t) {
    const angle = t * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      angle
    };
  }

  // Level Setups
  function getLevelConfig(lvl) {
    if (lvl === 1) {
      // 2 Trucks: Red & Blue (Top and Bottom)
      return [
        { color: 'red', capacity: 3, initialCubes: ['blue', 'red', 'red'], t: 0.0 },
        { color: 'blue', capacity: 3, initialCubes: ['red', 'blue', 'blue'], t: 0.5 }
      ];
    } else if (lvl === 2) {
      // 3 Trucks: Red, Blue, Green
      return [
        { color: 'red', capacity: 3, initialCubes: ['green', 'blue', 'red'], t: 0.0 },
        { color: 'blue', capacity: 3, initialCubes: ['red', 'green', 'blue'], t: 0.35 },
        { color: 'green', capacity: 3, initialCubes: ['blue', 'red', 'green'], t: 0.65 }
      ];
    } else if (lvl === 3) {
      // 3 Trucks with Mystery '?' Cubes
      return [
        { color: 'red', capacity: 3, initialCubes: ['mystery:green', 'blue', 'red'], t: 0.0 },
        { color: 'blue', capacity: 3, initialCubes: ['mystery:red', 'green', 'blue'], t: 0.35 },
        { color: 'green', capacity: 3, initialCubes: ['mystery:blue', 'red', 'green'], t: 0.65 }
      ];
    } else if (lvl === 4) {
      // 4 Trucks: Red, Blue, Green, Yellow
      return [
        { color: 'red', capacity: 3, initialCubes: ['yellow', 'green', 'blue'], t: 0.0 },
        { color: 'blue', capacity: 3, initialCubes: ['red', 'yellow', 'green'], t: 0.25 },
        { color: 'green', capacity: 3, initialCubes: ['blue', 'red', 'yellow'], t: 0.5 },
        { color: 'yellow', capacity: 3, initialCubes: ['green', 'blue', 'red'], t: 0.75 }
      ];
    } else {
      // Level 5+: Mystery and Ice Cubes
      return [
        { color: 'red', capacity: 3, initialCubes: ['ice:blue', 'mystery:yellow', 'red'], t: 0.0 },
        { color: 'blue', capacity: 3, initialCubes: ['ice:green', 'mystery:red', 'blue'], t: 0.25 },
        { color: 'green', capacity: 3, initialCubes: ['ice:yellow', 'mystery:blue', 'green'], t: 0.5 },
        { color: 'yellow', capacity: 3, initialCubes: ['ice:red', 'mystery:green', 'yellow'], t: 0.75 }
      ];
    }
  }

  function setupLevel(lvl) {
    currentLevel = lvl;
    levelBadge.textContent = `Level ${lvl}`;

    const config = getLevelConfig(lvl);

    trucks = config.map((cfg, idx) => {
      const cargo = cfg.initialCubes.map(spec => {
        let isMystery = false;
        let isIce = false;
        let colorKey = spec;

        if (spec.startsWith('mystery:')) {
          isMystery = true;
          colorKey = spec.replace('mystery:', '');
        } else if (spec.startsWith('ice:')) {
          isIce = true;
          colorKey = spec.replace('ice:', '');
        }

        return {
          colorKey,
          isMystery,
          isIce,
          iceLaps: isIce ? 1 : 0
        };
      });

      return {
        id: idx + 1,
        colorKey: cfg.color,
        capacity: cfg.capacity,
        t: cfg.t,
        cargo,
        isComplete: false,
        bounce: 1.0,
        x: 0,
        y: 0,
        clickRadius: 40
      };
    });

    beltCubes = [];
    particles = [];
    isPlaying = true;
    isLevelWon = false;
    isLevelFailed = false;
    modalOverlay.classList.remove('active');

    updateTruckPositions();
  }

  function updateTruckPositions() {
    const dpr = window.devicePixelRatio || 1;
    const distanceOffset = 46 * dpr;

    trucks.forEach(truck => {
      const beltPt = getConveyorPoint(truck.t);
      const angle = truck.t * Math.PI * 2 - Math.PI / 2;

      truck.x = beltPt.x + Math.cos(angle) * distanceOffset;
      truck.y = beltPt.y + Math.sin(angle) * distanceOffset;
      truck.beltX = beltPt.x;
      truck.beltY = beltPt.y;
      truck.angle = angle;
      truck.clickRadius = 38 * dpr;
    });
  }

  function spawnParticles(x, y, colorHex) {
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: colorHex,
        alpha: 1
      });
    }
  }

  function unloadTruck(truck) {
    if (!isPlaying || isLevelWon || isLevelFailed) return;
    if (truck.cargo.length === 0) return;

    // Tactile squash & bounce animation on tap
    truck.bounce = 1.25;

    // Check if belt is completely full
    if (beltCubes.length >= maxBeltCapacity) {
      playTone(160, 'sawtooth', 0.1, 0.2);
      return;
    }

    // Unload foremost cube
    const cube = truck.cargo.pop();
    if (cube.isMystery) cube.isMystery = false;

    // Slight entry offset if another cube is near the ramp to prevent overlap
    let entryT = truck.t;
    const nearConflict = beltCubes.some(c => Math.abs(c.t - entryT) < 0.05);
    if (nearConflict) {
      entryT = (entryT + 0.04) % 1.0;
    }

    beltCubes.push({
      colorKey: cube.colorKey,
      isIce: cube.isIce,
      iceLaps: cube.iceLaps,
      t: entryT,
      lapDistance: 0
    });

    playUnloadSound();
    checkTruckCompletion(truck);
  }

  function checkTruckCompletion(truck) {
    if (truck.cargo.length === truck.capacity) {
      const allMatch = truck.cargo.every(c => c.colorKey === truck.colorKey && !c.isIce);
      if (allMatch && !truck.isComplete) {
        truck.isComplete = true;
        playTruckCompleteSound();
        spawnParticles(truck.x, truck.y, COLOR_PALETTE[truck.colorKey].fill);
      }
    } else {
      truck.isComplete = false;
    }
  }

  function triggerWin() {
    isLevelWon = true;
    isPlaying = false;
    playWinSound();

    modalTitle.textContent = 'Level Complete!';
    modalDesc.textContent = `All trucks sorted by color! Ready for Level ${currentLevel + 1}?`;
    modalStars.textContent = '⭐⭐⭐';
    modalActionBtn.textContent = 'Next Level';
    modalOverlay.classList.add('active');
  }

  function triggerFail(reason = 'Belt Full & No Matching Trucks Open!') {
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

    beltOffset = (beltOffset + 1) % 40;

    // Smooth bounce decay on trucks
    trucks.forEach(t => {
      if (t.bounce > 1.0) t.bounce += (1.0 - t.bounce) * 0.15;
    });

    // Advance cubes along conveyor
    for (let i = beltCubes.length - 1; i >= 0; i--) {
      const cube = beltCubes[i];
      cube.t = (cube.t + beltSpeed) % 1.0;
      cube.lapDistance += beltSpeed;

      // Melt ice after 1 full lap
      if (cube.isIce && cube.lapDistance >= 1.0) {
        cube.isIce = false;
        const pt = getConveyorPoint(cube.t);
        spawnParticles(pt.x, pt.y, '#bae6fd');
        playTone(600, 'sine', 0.1, 0.2);
      }

      // Check if cube matches a truck with open capacity
      if (!cube.isIce) {
        for (const truck of trucks) {
          if (truck.colorKey === cube.colorKey && truck.cargo.length < truck.capacity) {
            const diff = Math.abs(cube.t - truck.t);
            if (diff < 0.035 || diff > 0.965) {
              // Cube docks into target truck!
              truck.cargo.push({
                colorKey: cube.colorKey,
                isMystery: false,
                isIce: false
              });

              const pt = getConveyorPoint(truck.t);
              spawnParticles(pt.x, pt.y, COLOR_PALETTE[truck.colorKey].fill);
              playDockSound(1 + truck.cargo.length * 0.15);

              beltCubes.splice(i, 1);
              checkTruckCompletion(truck);
              break;
            }
          }
        }
      }
    }

    // Check Win
    const allDone = trucks.every(t => t.isComplete);
    if (allDone && beltCubes.length === 0) {
      triggerWin();
      return;
    }

    // Check Deadlock
    if (beltCubes.length >= maxBeltCapacity) {
      const canAnyCubeDock = beltCubes.some(c => {
        if (c.isIce) return true;
        const targetTruck = trucks.find(t => t.colorKey === c.colorKey);
        return targetTruck && targetTruck.cargo.length < targetTruck.capacity;
      });

      if (!canAnyCubeDock) {
        triggerFail('All open trucks are blocked!');
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;
    const cubeSize = 22 * dpr;

    // 1. Conveyor Belt Track
    ctx.beginPath();
    ctx.lineWidth = 24 * dpr;
    ctx.strokeStyle = '#1e293b';
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 2 * dpr;
    ctx.strokeStyle = '#38bdf8';
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Rollers
    const numRollers = 20;
    for (let i = 0; i < numRollers; i++) {
      const t = (i / numRollers + (beltOffset / 40) / numRollers) % 1.0;
      const pt = getConveyorPoint(t);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();
    }

    // 2. Trucks
    trucks.forEach(truck => {
      const pal = COLOR_PALETTE[truck.colorKey];

      // Connecting ramp
      ctx.beginPath();
      ctx.lineWidth = 5 * dpr;
      ctx.strokeStyle = '#334155';
      ctx.moveTo(truck.x, truck.y);
      ctx.lineTo(truck.beltX, truck.beltY);
      ctx.stroke();

      ctx.save();
      ctx.translate(truck.x, truck.y);
      ctx.scale(truck.bounce, truck.bounce);

      // Glow if truck is interactive
      if (!truck.isComplete && truck.cargo.length > 0) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 36 * dpr, 24 * dpr, 0, 0, Math.PI * 2);
        ctx.fillStyle = pal.glow;
        ctx.fill();
      }

      // Truck Platform Base
      ctx.fillStyle = '#334155';
      drawRoundRect(ctx, -28 * dpr, -18 * dpr, 56 * dpr, 36 * dpr, 6 * dpr);
      ctx.fill();

      // Truck Cab
      ctx.fillStyle = pal.fill;
      drawRoundRect(ctx, -26 * dpr, -16 * dpr, 18 * dpr, 32 * dpr, 4 * dpr);
      ctx.fill();

      // Windshield
      ctx.fillStyle = '#0f172a';
      drawRoundRect(ctx, -24 * dpr, -11 * dpr, 12 * dpr, 22 * dpr, 2 * dpr);
      ctx.fill();

      // Status indicator
      if (truck.isComplete) {
        ctx.fillStyle = '#10b981';
        ctx.font = `bold ${16 * dpr}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✔', 8 * dpr, 0);
      } else {
        ctx.fillStyle = '#f8fafc';
        ctx.font = `bold ${11 * dpr}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${truck.cargo.length}/${truck.capacity}`, 8 * dpr, 0);
      }

      // Cargo Cubes on Truck
      truck.cargo.forEach((c, idx) => {
        const cxPos = -4 * dpr + idx * (10 * dpr);
        drawCube(cxPos, 0, c, 13 * dpr);
      });

      // Tap hint badge if level 1 and truck has cargo
      if (!truck.isComplete && truck.cargo.length > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold ${9 * dpr}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('TAP', 0, -22 * dpr);
      }

      ctx.restore();
    });

    // 3. Cubes on Conveyor Loop
    beltCubes.forEach(cube => {
      const pt = getConveyorPoint(cube.t);
      drawCube(pt.x, pt.y, cube, cubeSize);
    });

    // 4. Particles
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Central Capacity Counter
    ctx.fillStyle = beltCubes.length >= maxBeltCapacity ? '#ef4444' : '#94a3b8';
    ctx.font = `bold ${11 * dpr}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`BELT: ${beltCubes.length}/${maxBeltCapacity}`, cx, cy);
  }

  function drawCube(x, y, cube, size) {
    const dpr = window.devicePixelRatio || 1;
    const half = size / 2;

    if (cube.isMystery) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(x - half, y - half, size, size);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5 * dpr;
      ctx.strokeRect(x - half, y - half, size, size);

      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${size * 0.65}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x, y);
      return;
    }

    const pal = COLOR_PALETTE[cube.colorKey] || COLOR_PALETTE.red;

    // Base
    ctx.fillStyle = pal.fill;
    ctx.fillRect(x - half, y - half, size, size);

    // Bevel top
    ctx.fillStyle = pal.top;
    ctx.fillRect(x - half, y - half, size, size * 0.35);

    // Border
    ctx.strokeStyle = pal.border;
    ctx.lineWidth = 1.5 * dpr;
    ctx.strokeRect(x - half, y - half, size, size);

    // Ice overlay
    if (cube.isIce) {
      ctx.fillStyle = 'rgba(219, 234, 254, 0.7)';
      ctx.fillRect(x - half, y - half, size, size);
      ctx.strokeStyle = '#93c5fd';
      ctx.strokeRect(x - half, y - half, size, size);

      ctx.fillStyle = '#1e3a8a';
      ctx.font = `${size * 0.55}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❄', x, y);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Pointer Interaction
  function handlePointer(clientX, clientY) {
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const clickX = (clientX - rect.left) * dpr;
    const clickY = (clientY - rect.top) * dpr;

    let clickedTruck = null;
    let minDist = Infinity;

    for (const truck of trucks) {
      const dist = Math.hypot(clickX - truck.x, clickY - truck.y);
      if (dist < truck.clickRadius + 18 * dpr && dist < minDist) {
        minDist = dist;
        clickedTruck = truck;
      }
    }

    if (clickedTruck) {
      unloadTruck(clickedTruck);
    }
  }

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    handlePointer(e.clientX, e.clientY);
  });

  // Number key shortcuts: 1, 2, 3, 4
  window.addEventListener('keydown', e => {
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= trucks.length) {
      unloadTruck(trucks[num - 1]);
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

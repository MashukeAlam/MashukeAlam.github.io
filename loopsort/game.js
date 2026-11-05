/**
 * CargoLoop (Garawell-style Loop Sort)
 * Trucks + Conveyor Loop Color Sorting Puzzle
 * Features: Truck tapping, conveyor circulation, automatic color-sorting docks,
 * ice cubes, mystery blocks, Web Audio synthesizer, and progressive levels.
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

  // Web Audio Synthesizer
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
    playTone(280, 'triangle', 0.1, 0.2);
  }

  function playDockSound(pitchMultiplier = 1) {
    playTone(520 * pitchMultiplier, 'sine', 0.2, 0.3);
  }

  function playTruckCompleteSound() {
    if (!soundEnabled) return;
    [440, 554, 659].forEach((f, i) => {
      setTimeout(() => playTone(f, 'triangle', 0.25, 0.25), i * 80);
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
    [320, 260, 200].forEach((f, i) => {
      setTimeout(() => playTone(f, 'sawtooth', 0.22, 0.25), i * 110);
    });
  }

  // Palettes
  const COLOR_PALETTE = {
    red: { fill: '#ef4444', top: '#f87171', border: '#b91c1c', light: '#fee2e2' },
    blue: { fill: '#3b82f6', top: '#60a5fa', border: '#1d4ed8', light: '#dbeafe' },
    green: { fill: '#10b981', top: '#34d399', border: '#047857', light: '#d1fae5' },
    yellow: { fill: '#f59e0b', top: '#fbbf24', border: '#b45309', light: '#fef3c7' },
    purple: { fill: '#8b5cf6', top: '#a78bfa', border: '#6d28d9', light: '#ede9fe' }
  };

  let currentLevel = 1;
  const maxLevels = 10;

  // Level State
  let trucks = [];
  let beltCubes = [];
  let particles = [];
  let beltOffset = 0;
  let isPlaying = false;
  let isLevelWon = false;
  let isLevelFailed = false;

  const maxBeltCapacity = 7;
  const beltSpeed = 0.0028;

  // Geometry cache
  let cx = 0, cy = 0, rx = 0, ry = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    cx = canvas.width / 2;
    cy = canvas.height / 2;
    rx = Math.min(canvas.width * 0.32, 160 * dpr);
    ry = Math.min(canvas.height * 0.26, 130 * dpr);

    updateTruckPositions();
  }

  // Parametric conveyor path: t in [0, 1)
  function getConveyorPoint(t) {
    const angle = t * Math.PI * 2 - Math.PI / 2; // clockwise starting top
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      angle
    };
  }

  // Level configurations
  function getLevelConfig(lvl) {
    if (lvl === 1) {
      return {
        trucks: [
          { color: 'red', capacity: 3, initialCubes: ['blue', 'red', 'red'], t: 0.25 },
          { color: 'blue', capacity: 3, initialCubes: ['red', 'blue', 'blue'], t: 0.75 }
        ]
      };
    } else if (lvl === 2) {
      return {
        trucks: [
          { color: 'red', capacity: 3, initialCubes: ['green', 'blue', 'red'], t: 0.16 },
          { color: 'blue', capacity: 3, initialCubes: ['red', 'green', 'blue'], t: 0.50 },
          { color: 'green', capacity: 3, initialCubes: ['blue', 'red', 'green'], t: 0.83 }
        ]
      };
    } else if (lvl === 3) {
      // Introduces Mystery Cube
      return {
        trucks: [
          { color: 'red', capacity: 3, initialCubes: ['mystery:green', 'blue', 'red'], t: 0.16 },
          { color: 'blue', capacity: 3, initialCubes: ['mystery:red', 'green', 'blue'], t: 0.50 },
          { color: 'green', capacity: 3, initialCubes: ['mystery:blue', 'red', 'green'], t: 0.83 }
        ]
      };
    } else if (lvl === 4) {
      // 4 Trucks with mixed loads
      return {
        trucks: [
          { color: 'red', capacity: 3, initialCubes: ['yellow', 'green', 'blue'], t: 0.125 },
          { color: 'blue', capacity: 3, initialCubes: ['red', 'yellow', 'green'], t: 0.375 },
          { color: 'green', capacity: 3, initialCubes: ['blue', 'red', 'yellow'], t: 0.625 },
          { color: 'yellow', capacity: 3, initialCubes: ['green', 'blue', 'red'], t: 0.875 }
        ]
      };
    } else if (lvl === 5) {
      // Introduces Ice Cube 🧊 (needs 1 lap to thaw)
      return {
        trucks: [
          { color: 'red', capacity: 3, initialCubes: ['ice:blue', 'red', 'green'], t: 0.16 },
          { color: 'blue', capacity: 3, initialCubes: ['ice:green', 'blue', 'red'], t: 0.50 },
          { color: 'green', capacity: 3, initialCubes: ['ice:red', 'green', 'blue'], t: 0.83 }
        ]
      };
    } else {
      // Procedural higher levels
      const colors = ['red', 'blue', 'green', 'yellow'];
      const count = 4;
      const allCubes = [];
      colors.forEach(c => {
        for (let i = 0; i < 3; i++) allCubes.push(c);
      });
      // Shuffle
      for (let i = allCubes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCubes[i], allCubes[j]] = [allCubes[j], allCubes[i]];
      }

      const generated = colors.map((c, idx) => ({
        color: c,
        capacity: 3,
        initialCubes: allCubes.splice(0, 3),
        t: (idx + 0.5) / count
      }));

      return { trucks: generated };
    }
  }

  function setupLevel(lvl) {
    currentLevel = lvl;
    levelBadge.textContent = `Level ${lvl}`;

    const config = getLevelConfig(lvl);

    trucks = config.trucks.map((cfg, idx) => {
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
        id: idx,
        colorKey: cfg.color,
        capacity: cfg.capacity,
        t: cfg.t,
        cargo, // current cubes on the truck
        isComplete: false,
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
    const distanceOffset = 68 * dpr;

    trucks.forEach(truck => {
      const beltPt = getConveyorPoint(truck.t);
      const angle = truck.t * Math.PI * 2 - Math.PI / 2;

      // Position truck slightly outside the conveyor track along normal
      truck.x = beltPt.x + Math.cos(angle) * distanceOffset;
      truck.y = beltPt.y + Math.sin(angle) * distanceOffset;
      truck.beltX = beltPt.x;
      truck.beltY = beltPt.y;
      truck.angle = angle;
      truck.clickRadius = 36 * dpr;
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

  // Tapping a truck unloads its top cube onto the belt
  function unloadTruck(truck) {
    if (!isPlaying || isLevelWon || isLevelFailed) return;
    if (truck.cargo.length === 0) return;

    // Check if belt has space
    if (beltCubes.length >= maxBeltCapacity) {
      playTone(160, 'sawtooth', 0.1, 0.2);
      return;
    }

    // Check if belt entry point is blocked
    const entryT = truck.t;
    const isEntryBlocked = beltCubes.some(c => {
      const diff = Math.abs(c.t - entryT);
      return diff < 0.08 || diff > 0.92;
    });

    if (isEntryBlocked) {
      playTone(160, 'sawtooth', 0.1, 0.2);
      return;
    }

    // Unload the top/front cube
    const cube = truck.cargo.pop();
    if (cube.isMystery) {
      cube.isMystery = false; // reveal on drop
    }

    beltCubes.push({
      colorKey: cube.colorKey,
      isIce: cube.isIce,
      iceLaps: cube.iceLaps,
      startT: entryT,
      t: entryT,
      lapDistance: 0
    });

    playUnloadSound();
    checkTruckCompletion(truck);
  }

  function checkTruckCompletion(truck) {
    // A truck is complete if it has all matching cubes of its color
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

    modalTitle.textContent = 'All Trucks Sorted!';
    modalDesc.textContent = `Clean conveyor routing! Ready for Level ${currentLevel + 1}?`;
    modalStars.textContent = '⭐⭐⭐';
    modalActionBtn.textContent = 'Next Level';
    modalOverlay.classList.add('active');
  }

  function triggerFail(reason = 'Conveyor Loop Jammed!') {
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

    // Advance cubes on the conveyor loop
    for (let i = beltCubes.length - 1; i >= 0; i--) {
      const cube = beltCubes[i];
      cube.t = (cube.t + beltSpeed) % 1.0;
      cube.lapDistance += beltSpeed;

      // Handle ice cube thawing after 1 lap
      if (cube.isIce && cube.lapDistance >= 1.0) {
        cube.isIce = false;
        const pt = getConveyorPoint(cube.t);
        spawnParticles(pt.x, pt.y, '#bae6fd');
        playTone(600, 'sine', 0.1, 0.2);
      }

      // If cube is not frozen, check if it passes a truck of its matching color
      if (!cube.isIce) {
        for (const truck of trucks) {
          if (truck.colorKey === cube.colorKey && truck.cargo.length < truck.capacity) {
            const diff = Math.abs(cube.t - truck.t);
            if (diff < 0.03 || diff > 0.97) {
              // Cube docks into the matching truck!
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

    // Check if ALL trucks are complete and belt is empty
    const allDone = trucks.every(t => t.isComplete);
    if (allDone && beltCubes.length === 0) {
      triggerWin();
      return;
    }

    // Check if belt is at capacity and NO cube can dock anywhere (deadlock)
    if (beltCubes.length >= maxBeltCapacity) {
      const canAnyCubeDock = beltCubes.some(c => {
        if (c.isIce) return true; // could thaw
        const targetTruck = trucks.find(t => t.colorKey === c.colorKey);
        return targetTruck && targetTruck.cargo.length < targetTruck.capacity;
      });

      if (!canAnyCubeDock) {
        triggerFail('No matching open trucks for remaining belt cubes!');
      }
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

  // Rendering
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;
    const cubeSize = 22 * dpr;

    // 1. Draw Conveyor Belt Track
    ctx.beginPath();
    ctx.lineWidth = 26 * dpr;
    ctx.strokeStyle = '#1e293b';
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 3 * dpr;
    ctx.strokeStyle = '#38bdf8';
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Belt motion indicator rollers
    const numRollers = 24;
    for (let i = 0; i < numRollers; i++) {
      const t = (i / numRollers + (beltOffset / 40) / numRollers) % 1.0;
      const pt = getConveyorPoint(t);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();
    }

    // 2. Draw Trucks & Parking Bays
    trucks.forEach(truck => {
      const pal = COLOR_PALETTE[truck.colorKey];

      // Draw connection ramp from truck to conveyor
      ctx.beginPath();
      ctx.lineWidth = 6 * dpr;
      ctx.strokeStyle = '#334155';
      ctx.moveTo(truck.x, truck.y);
      ctx.lineTo(truck.beltX, truck.beltY);
      ctx.stroke();

      // Draw Truck Body
      ctx.save();
      ctx.translate(truck.x, truck.y);

      // Shadow
      ctx.beginPath();
      ctx.ellipse(0, 8 * dpr, 34 * dpr, 20 * dpr, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Truck Bed Platform
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(-30 * dpr, -18 * dpr, 60 * dpr, 36 * dpr, 6 * dpr);
      ctx.fill();

      // Truck Cab (Colored)
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.roundRect(-28 * dpr, -16 * dpr, 18 * dpr, 32 * dpr, 4 * dpr);
      ctx.fill();

      // Cab Windshield
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-26 * dpr, -11 * dpr, 12 * dpr, 22 * dpr, 2 * dpr);
      ctx.fill();

      // Completion Checkmark or Capacity Counter
      if (truck.isComplete) {
        ctx.fillStyle = '#10b981';
        ctx.font = `bold ${16 * dpr}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✔', 8 * dpr, 0);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = `bold ${11 * dpr}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${truck.cargo.length}/${truck.capacity}`, 8 * dpr, 0);
      }

      // Draw Cargo Cubes on Truck
      truck.cargo.forEach((c, idx) => {
        const cxPos = -4 * dpr + idx * (10 * dpr);
        const cyPos = 0;
        drawCube(cxPos, cyPos, c, 14 * dpr);
      });

      ctx.restore();
    });

    // 3. Draw Conveyor Belt Cubes
    beltCubes.forEach(cube => {
      const pt = getConveyorPoint(cube.t);
      drawCube(pt.x, pt.y, cube, cubeSize);
    });

    // 4. Draw Particles
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Capacity indicator badge in loop center
    ctx.fillStyle = beltCubes.length >= maxBeltCapacity ? '#ef4444' : '#94a3b8';
    ctx.font = `bold ${12 * dpr}px sans-serif`;
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

    // Cube Base
    ctx.fillStyle = pal.fill;
    ctx.fillRect(x - half, y - half, size, size);

    // Cube 3D Bevel Highlight
    ctx.fillStyle = pal.top;
    ctx.fillRect(x - half, y - half, size, size * 0.35);

    // Outline
    ctx.strokeStyle = pal.border;
    ctx.lineWidth = 1.5 * dpr;
    ctx.strokeRect(x - half, y - half, size, size);

    // Ice overlay
    if (cube.isIce) {
      ctx.fillStyle = 'rgba(219, 234, 254, 0.65)';
      ctx.fillRect(x - half, y - half, size, size);
      ctx.strokeStyle = '#93c5fd';
      ctx.strokeRect(x - half, y - half, size, size);

      ctx.fillStyle = '#1e3a8a';
      ctx.font = `${size * 0.5}px sans-serif`;
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
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const clickX = (e.clientX - rect.left) * dpr;
    const clickY = (e.clientY - rect.top) * dpr;

    // Check which truck was clicked
    for (const truck of trucks) {
      const dx = clickX - truck.x;
      const dy = clickY - truck.y;
      if (Math.hypot(dx, dy) <= truck.clickRadius + 12 * dpr) {
        unloadTruck(truck);
        break;
      }
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

  resize();
  setupLevel(1);
  requestAnimationFrame(loop);
})();

/* ==========================================================================
   Ambient Animated ASCII Art Background Engine
   Zero external dependencies, high-performance canvas glyph cache,
   with full prefers-reduced-motion and battery efficiency support.
   ========================================================================== */

(function () {
  'use strict';

  function createAsciiRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    const atlas = document.createElement('canvas');
    const actx = atlas.getContext('2d');
    const slots = new Map();

    let currentSceneId = null;
    let frameFn = null;
    let meta = null;
    let cols = 200, rows = 100, cell = 1;
    let palette = null, ground = '#05080f';
    let colorBuf = null;

    let w = 0, h = 0, sw = 0, sh = 0, pw = 0, ph = 0;
    let xs = new Int32Array(0), ys = new Int32Array(0);
    let gx = new Int32Array(0), gy = new Int32Array(0);
    let last = '', full = true;
    let lastColor = null;

    let rafId = 0;
    let lastTime = 0;
    let t = 0;
    let isPlaying = false;
    let targetFps = 15;

    const env = () => ({
      paper: false,
      color: colorBuf
    });

    const font = (px) => `${px}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

    function resize() {
      const clientW = window.innerWidth || document.documentElement.clientWidth || 1200;
      const clientH = window.innerHeight || document.documentElement.clientHeight || 800;

      w = Math.max(3, (clientW * (window.devicePixelRatio || 1)) / cols);
      h = w * cell;
      sw = Math.ceil(w);
      sh = Math.ceil(h);
      pw = sw + 2;
      ph = sh + 2;

      canvas.width = Math.round(w * cols);
      canvas.height = Math.round(h * rows);
      atlas.width = pw * 32;
      atlas.height = ph * 32;

      xs = Int32Array.from({ length: cols + 1 }, (_, x) => Math.round(x * w));
      ys = Int32Array.from({ length: rows + 1 }, (_, y) => Math.round(y * h));
      gx = Int32Array.from({ length: cols }, (_, x) => Math.round(x * w + (w - sw) / 2));
      gy = Int32Array.from({ length: rows }, (_, y) => Math.round(y * h + (h - sh) / 2));

      slots.clear();
      full = true;
    }

    function glyph(code, i) {
      const key = code * 256 + i;
      let s = slots.get(key);
      if (s !== undefined) return s;

      if (slots.size >= 1024) {
        actx.clearRect(0, 0, atlas.width, atlas.height);
        slots.clear();
      }
      s = slots.size;
      const x = (s % 32) * pw + 1;
      const y = Math.floor(s / 32) * ph + 1;

      actx.font = font(w / 0.6);
      actx.textAlign = 'center';
      actx.textBaseline = 'middle';
      actx.fillStyle = palette ? (palette[i] || palette[0]) : '#64748b';
      actx.fillText(String.fromCharCode(code), x + sw / 2, y + sh / 2);
      slots.set(key, s);
      return s;
    }

    function draw() {
      if (!frameFn) return;

      const text = frameFn(t, env());
      if (ground) {
        ctx.fillStyle = ground;
      }

      if (full) {
        if (ground) {
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      for (let k = 0, x = 0, y = 0; k < text.length; k++) {
        const c = text.charCodeAt(k);
        if (c === 10) {
          x = 0;
          y++;
          continue;
        }
        const i = y * cols + x;
        if (full || c !== last.charCodeAt(k) || (colorBuf && colorBuf[i] !== lastColor[i])) {
          const x0 = xs[x], y0 = ys[y], cw = xs[x + 1] - x0, ch = ys[y + 1] - y0;
          if (!full) {
            if (ground) {
              ctx.fillRect(x0, y0, cw, ch);
            } else {
              ctx.clearRect(x0, y0, cw, ch);
            }
          }
          if (c !== 32) {
            const s = glyph(c, colorBuf ? colorBuf[i] : 0);
            ctx.drawImage(
              atlas,
              (s % 32) * pw + 1 + x0 - gx[x],
              Math.floor(s / 32) * ph + 1 + y0 - gy[y],
              cw,
              ch,
              x0,
              y0,
              cw,
              ch
            );
          }
        }
        x++;
      }

      last = text;
      if (colorBuf && lastColor) {
        lastColor.set(colorBuf);
      }
      full = false;
    }

    function tick(now) {
      if (!isPlaying) {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(tick);
      const dt = now - lastTime;
      if (dt < 1000 / targetFps - 2) return;
      lastTime = now;
      t += Math.min(dt, 100) / 1000;
      try {
        draw();
      } catch (err) {
        console.error('ASCII draw error:', err);
      }
    }

    function setScene(sceneId) {
      const scenes = window.ASCII_SCENES || {};
      const piece = scenes[sceneId] || Object.values(scenes)[0];
      if (!piece) return;

      currentSceneId = sceneId;
      meta = piece.meta;
      cols = meta.cols || 200;
      rows = meta.rows || 100;
      cell = meta.cell || 1;
      palette = meta.palette || null;
      ground = meta.ground || '#05080f';
      targetFps = meta.fps || 15;

      colorBuf = palette ? new Uint8Array(cols * rows) : null;
      lastColor = colorBuf ? new Uint8Array(cols * rows) : null;
      last = '';

      frameFn = piece.make({});
      resize();
      draw();
    }

    function shouldReduceMotion() {
      const mediaQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
      return mediaQuery && mediaQuery.matches;
    }

    function start() {
      // If user prefers reduced motion, draw single static frame and do not loop
      if (shouldReduceMotion()) {
        pause();
        draw();
        return;
      }

      if (!isPlaying) {
        isPlaying = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    }

    function pause() {
      isPlaying = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    function togglePlay() {
      if (isPlaying) pause();
      else start();
      return isPlaying;
    }

    window.addEventListener('resize', () => {
      resize();
      draw();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pause();
      } else if (!shouldReduceMotion()) {
        start();
      }
    });

    if (window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', (e) => {
          if (e.matches) {
            pause();
            draw();
          } else {
            start();
          }
        });
      }
    }

    return {
      setScene,
      draw,
      start,
      pause,
      togglePlay,
      get isPlaying() { return isPlaying; },
      get currentSceneId() { return currentSceneId; }
    };
  }

  function init() {
    const canvas = document.getElementById('ascii-bg-canvas');
    if (!canvas) return;

    const scenes = window.ASCII_SCENES || {};
    const availableKeys = Object.keys(scenes);
    if (availableKeys.length === 0) return;

    const renderer = createAsciiRenderer(canvas);
    const chosenScene = availableKeys[0];

    renderer.setScene(chosenScene);
    renderer.start();

    window.AsciiBackground = renderer;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

import { mount } from './mount.js';
import { SCENES, loadPiece } from './scenes.js';

export class AsciiScenePlayer {
  constructor(container, options = {}) {
    this.container = container;
    this.basePath = options.basePath || './pieces/';
    this.currentSceneId = options.initialScene || 'aurora-fjord';
    this.mono = Boolean(options.mono);
    this.fps = options.fps || null;
    this.isPlaying = true;
    this.stopFn = null;
    this.currentPiece = null;
    this.onSceneChange = options.onSceneChange || null;
    this.onStateChange = options.onStateChange || null;
    this.cache = new Map();
  }

  get currentScene() {
    return SCENES.find(s => s.id === this.currentSceneId) || SCENES[0];
  }

  async init() {
    await this.loadAndPlay(this.currentSceneId);
  }

  async loadAndPlay(sceneId) {
    this.currentSceneId = sceneId;
    this.stopCurrent();

    // Show lightweight loading state if container is empty
    if (!this.container.hasChildNodes()) {
      this.container.innerHTML = '<div class="ascii-loading">Loading scene...</div>';
    }

    try {
      let piece = this.cache.get(sceneId);
      if (!piece) {
        piece = await loadPiece(sceneId, this.basePath);
        this.cache.set(sceneId, piece);
      }
      this.currentPiece = piece;

      this.render();
      if (this.onSceneChange) {
        this.onSceneChange(this.currentScene);
      }
    } catch (err) {
      console.error('Failed to load ASCII scene:', sceneId, err);
      this.container.innerHTML = `<div class="ascii-error">Unable to load scene: ${sceneId}</div>`;
    }
  }

  render() {
    this.stopCurrent();
    if (!this.currentPiece) return;

    this.container.innerHTML = '';
    const meta = this.currentPiece.meta;

    // Create element
    let el;
    let pieceToMount = this.currentPiece;

    if (this.mono) {
      // In mono mode, clone piece with a monochrome palette mapping to foreground ink
      el = document.createElement('canvas');
      const ground = meta.ground || '#0a0a0c';
      el.style.backgroundColor = ground;
      el.style.width = '100%';
      el.style.display = 'block';

      // We can create a monochromatic palette version for high-res canvas rendering
      const ink = getComputedStyle(this.container).color || '#52b788';
      const monoMeta = {
        ...meta,
        palette: meta.palette ? meta.palette.map(() => ink) : undefined
      };
      pieceToMount = {
        ...this.currentPiece,
        meta: monoMeta
      };
    } else {
      el = document.createElement('canvas');
      if (meta.ground) {
        el.style.backgroundColor = meta.ground;
      }
      el.style.width = '100%';
      el.style.display = 'block';
    }

    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', meta.name || this.currentScene.name);
    el.className = 'ascii-render-canvas';
    this.container.appendChild(el);

    const fpsToUse = this.fps || meta.fps || 15;
    const effectiveFps = this.isPlaying ? fpsToUse : 0;

    this.stopFn = mount(el, pieceToMount, {
      fps: effectiveFps,
      motion: true
    });

    if (this.onStateChange) {
      this.onStateChange({
        scene: this.currentScene,
        isPlaying: this.isPlaying,
        mono: this.mono,
        fps: fpsToUse
      });
    }
  }

  stopCurrent() {
    if (typeof this.stopFn === 'function') {
      try {
        this.stopFn();
      } catch (e) {
        // silent
      }
      this.stopFn = null;
    }
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.render();
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.render();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  setMono(isMono) {
    if (this.mono === isMono) return;
    this.mono = Boolean(isMono);
    this.render();
  }

  toggleMono() {
    this.setMono(!this.mono);
    return this.mono;
  }

  setFps(fps) {
    this.fps = Number(fps);
    this.render();
  }

  next() {
    const idx = SCENES.findIndex(s => s.id === this.currentSceneId);
    const nextIdx = (idx + 1) % SCENES.length;
    return this.loadAndPlay(SCENES[nextIdx].id);
  }

  prev() {
    const idx = SCENES.findIndex(s => s.id === this.currentSceneId);
    const prevIdx = (idx - 1 + SCENES.length) % SCENES.length;
    return this.loadAndPlay(SCENES[prevIdx].id);
  }

  shuffle() {
    const available = SCENES.filter(s => s.id !== this.currentSceneId);
    const randomScene = available[Math.floor(Math.random() * available.length)] || SCENES[0];
    return this.loadAndPlay(randomScene.id);
  }

  destroy() {
    this.stopCurrent();
    this.container.innerHTML = '';
  }
}

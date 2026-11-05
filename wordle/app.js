/**
 * Wordle Engine
 * Complete implementation with daily & practice mode, stats, and sharing
 */

(function () {
  'use strict';

  const dict = window.WORDLE_DICTIONARY || { targets: ['REACT', 'SWEET', 'BRAIN', 'SHINE', 'SMART'], valid: new Set() };
  const targets = dict.targets;
  const validGuesses = dict.valid;

  // DOM Elements
  const boardEl = document.getElementById('board');
  const keyboardEl = document.getElementById('keyboard');
  const toastContainer = document.getElementById('toast-container');
  const helpModal = document.getElementById('help-modal');
  const statsModal = document.getElementById('stats-modal');
  const modeBadge = document.getElementById('mode-badge');
  const themeToggle = document.getElementById('theme-toggle');

  let mode = 'daily'; // 'daily' or 'practice'
  let targetWord = '';
  let currentRow = 0;
  let currentTile = 0;
  let isGameOver = false;
  let guesses = []; // array of strings

  // Stats
  let stats = loadStats();

  function getDailyWord() {
    const epoch = new Date(2024, 0, 1).getTime();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayIndex = Math.floor((today - epoch) / (1000 * 60 * 60 * 24));
    return {
      word: targets[dayIndex % targets.length].toUpperCase(),
      dayNumber: dayIndex
    };
  }

  function initGame() {
    boardEl.innerHTML = '';
    currentRow = 0;
    currentTile = 0;
    isGameOver = false;
    guesses = [];

    // Reset virtual keyboard keys
    document.querySelectorAll('.key').forEach(k => {
      k.removeAttribute('data-state');
    });

    if (mode === 'daily') {
      const daily = getDailyWord();
      targetWord = daily.word;
      modeBadge.textContent = 'Daily #' + daily.dayNumber;
      
      // Load stored daily state if already played today
      const stored = localStorage.getItem('wordle_daily_' + daily.dayNumber);
      if (stored) {
        try {
          const state = JSON.parse(stored);
          targetWord = state.targetWord;
          restoreGameState(state);
          return;
        } catch (e) {}
      }
    } else {
      const randomIdx = Math.floor(Math.random() * targets.length);
      targetWord = targets[randomIdx].toUpperCase();
      modeBadge.textContent = 'Practice';
    }

    createBoard();
  }

  function createBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < 6; r++) {
      const row = document.createElement('div');
      row.className = 'board-row';
      row.dataset.row = r;
      for (let c = 0; c < 5; c++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.col = c;
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  function restoreGameState(state) {
    createBoard();
    state.guesses.forEach((guess, r) => {
      guesses.push(guess);
      const rowEl = boardEl.children[r];
      const evaluation = evaluateGuess(guess, targetWord);
      for (let c = 0; c < 5; c++) {
        const tile = rowEl.children[c];
        tile.textContent = guess[c];
        tile.setAttribute('data-state', evaluation[c]);
        updateKeyboard(guess[c], evaluation[c]);
      }
    });
    currentRow = state.guesses.length;
    currentTile = 0;
    isGameOver = state.isGameOver;

    if (isGameOver) {
      setTimeout(() => openStatsModal(), 600);
    }
  }

  function saveDailyState() {
    if (mode !== 'daily') return;
    const daily = getDailyWord();
    localStorage.setItem('wordle_daily_' + daily.dayNumber, JSON.stringify({
      targetWord,
      guesses,
      isGameOver
    }));
  }

  function evaluateGuess(guess, target) {
    const res = Array(5).fill('absent');
    const targetLetters = target.split('');
    const guessLetters = guess.split('');

    // First pass: mark correct positions
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        res[i] = 'correct';
        targetLetters[i] = null; // consume
        guessLetters[i] = null;
      }
    }

    // Second pass: mark present letters
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] && targetLetters.includes(guessLetters[i])) {
        res[i] = 'present';
        targetLetters[targetLetters.indexOf(guessLetters[i])] = null; // consume
      }
    }

    return res;
  }

  function showToast(msg, duration = 1800) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  function handleKey(key) {
    if (isGameOver) return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE' || key === '⌫') {
      deleteLetter();
    } else if (/^[A-Z]$/.test(key)) {
      addLetter(key);
    }
  }

  function addLetter(letter) {
    if (currentTile >= 5) return;
    const row = boardEl.children[currentRow];
    const tile = row.children[currentTile];
    tile.textContent = letter;
    tile.setAttribute('data-state', 'filled');
    currentTile++;
  }

  function deleteLetter() {
    if (currentTile <= 0) return;
    currentTile--;
    const row = boardEl.children[currentRow];
    const tile = row.children[currentTile];
    tile.textContent = '';
    tile.removeAttribute('data-state');
  }

  function submitGuess() {
    if (currentTile < 5) {
      showToast('Not enough letters');
      shakeRow(currentRow);
      return;
    }

    const row = boardEl.children[currentRow];
    let guess = '';
    for (let i = 0; i < 5; i++) {
      guess += row.children[i].textContent;
    }

    if (!validGuesses.has(guess) && !targets.includes(guess)) {
      showToast('Not in word list');
      shakeRow(currentRow);
      return;
    }

    guesses.push(guess);
    const evaluation = evaluateGuess(guess, targetWord);

    // Animate tiles with reveal flip
    for (let i = 0; i < 5; i++) {
      const tile = row.children[i];
      const letter = guess[i];
      const state = evaluation[i];

      setTimeout(() => {
        tile.classList.add('flip');
        setTimeout(() => {
          tile.setAttribute('data-state', state);
          updateKeyboard(letter, state);
        }, 250);
      }, i * 250);
    }

    setTimeout(() => {
      checkGameEnd(guess);
    }, 5 * 250 + 200);
  }

  function shakeRow(rowIdx) {
    const row = boardEl.children[rowIdx];
    row.classList.add('shake');
    setTimeout(() => row.classList.remove('shake'), 450);
  }

  function updateKeyboard(letter, state) {
    const keyEl = document.querySelector(`.key[data-key="${letter}"]`);
    if (!keyEl) return;
    const currentState = keyEl.getAttribute('data-state');
    if (currentState === 'correct') return;
    if (currentState === 'present' && state === 'absent') return;
    keyEl.setAttribute('data-state', state);
  }

  function checkGameEnd(lastGuess) {
    if (lastGuess === targetWord) {
      isGameOver = true;
      showToast(getWinPraise(currentRow + 1));
      triggerConfetti();
      recordStats(true, currentRow + 1);
      saveDailyState();
      setTimeout(openStatsModal, 1500);
      return;
    }

    currentRow++;
    currentTile = 0;

    if (currentRow >= 6) {
      isGameOver = true;
      showToast(targetWord, 3500);
      recordStats(false, 0);
      saveDailyState();
      setTimeout(openStatsModal, 1500);
    } else {
      saveDailyState();
    }
  }

  function getWinPraise(tries) {
    const praises = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];
    return praises[tries - 1] || 'Well done!';
  }

  // Confetti
  function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      size: Math.random() * 8 + 4,
      color: ['#52b788', '#f59e0b', '#2d6a4f', '#3b82f6', '#ec4899'][Math.floor(Math.random() * 5)],
      speedY: Math.random() * 3 + 2,
      speedX: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8
    }));

    let frame = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      frame++;
      if (frame < 180) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    render();
  }

  // Stats Management
  function loadStats() {
    const def = {
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    };
    try {
      const saved = localStorage.getItem('wordle_stats');
      return saved ? Object.assign(def, JSON.parse(saved)) : def;
    } catch (e) {
      return def;
    }
  }

  function recordStats(won, tries) {
    stats.played++;
    if (won) {
      stats.wins++;
      stats.currentStreak++;
      if (stats.currentStreak > stats.maxStreak) stats.maxStreak = stats.currentStreak;
      stats.distribution[tries] = (stats.distribution[tries] || 0) + 1;
    } else {
      stats.currentStreak = 0;
    }
    localStorage.setItem('wordle_stats', JSON.stringify(stats));
  }

  function renderStats() {
    document.getElementById('stat-played').textContent = stats.played;
    const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
    document.getElementById('stat-win-rate').textContent = winRate;
    document.getElementById('stat-current-streak').textContent = stats.currentStreak;
    document.getElementById('stat-max-streak').textContent = stats.maxStreak;

    const maxCount = Math.max(...Object.values(stats.distribution), 1);
    for (let i = 1; i <= 6; i++) {
      const count = stats.distribution[i] || 0;
      const bar = document.getElementById(`dist-bar-${i}`);
      const widthPct = Math.max(7, Math.round((count / maxCount) * 100));
      bar.style.width = widthPct + '%';
      bar.textContent = count;
      if (isGameOver && guesses.length === i && guesses[guesses.length - 1] === targetWord) {
        bar.classList.add('highlight');
      } else {
        bar.classList.remove('highlight');
      }
    }
  }

  function openStatsModal() {
    renderStats();
    statsModal.classList.add('active');
  }

  function closeModals() {
    helpModal.classList.remove('active');
    statsModal.classList.remove('active');
  }

  // Sharing
  document.getElementById('share-btn').addEventListener('click', () => {
    let text = `Wordle ${mode === 'daily' ? '#' + getDailyWord().dayNumber : 'Practice'} ${guesses[guesses.length - 1] === targetWord ? guesses.length : 'X'}/6\n\n`;
    guesses.forEach(guess => {
      const evalRow = evaluateGuess(guess, targetWord);
      evalRow.forEach(state => {
        if (state === 'correct') text += '🟩';
        else if (state === 'present') text += '🟨';
        else text += '⬛';
      });
      text += '\n';
    });
    text += '\nhttps://mashukealam.github.io/wordle/';

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied result to clipboard!');
      });
    } else {
      showToast('Clipboard not supported');
    }
  });

  // Physical Keyboard Listener
  window.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toUpperCase();
    if (key === 'ENTER') handleKey('ENTER');
    else if (key === 'BACKSPACE') handleKey('BACKSPACE');
    else if (/^[A-Z]$/.test(key)) handleKey(key);
  });

  // Virtual Keyboard Listener
  keyboardEl.addEventListener('click', e => {
    const btn = e.target.closest('.key');
    if (!btn) return;
    const key = btn.getAttribute('data-key');
    handleKey(key);
  });

  // UI Event Listeners
  document.getElementById('help-btn').addEventListener('click', () => helpModal.classList.add('active'));
  document.getElementById('stats-btn').addEventListener('click', openStatsModal);
  document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', closeModals));
  window.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeModals();
  });

  modeBadge.addEventListener('click', () => {
    mode = mode === 'daily' ? 'practice' : 'daily';
    initGame();
  });

  // Theme support
  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);

  initGame();
})();

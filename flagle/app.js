/**
 * Flagle Engine
 * Complete implementation with geography calculations, tile reveals, and stats
 */

(function () {
  'use strict';

  const countries = window.COUNTRIES || [];
  if (countries.length === 0) return;

  // DOM Elements
  const flagImg = document.getElementById('flag-img');
  const tileGrid = document.getElementById('tile-grid');
  const countryInput = document.getElementById('country-input');
  const guessBtn = document.getElementById('guess-btn');
  const suggestionsList = document.getElementById('suggestions-list');
  const guessesList = document.getElementById('guesses-list');
  const modeBadge = document.getElementById('mode-badge');
  const statsModal = document.getElementById('stats-modal');
  const helpModal = document.getElementById('help-modal');

  let mode = 'daily';
  let targetCountry = null;
  let guesses = []; // array of { country, distance, bearing, proximity, isCorrect }
  let isGameOver = false;
  let maxGuesses = 6;
  let selectedSuggestionIdx = -1;

  // Geodesic math
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  function calculateBearing(lat1, lon1, lat2, lon2) {
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    let theta = Math.atan2(y, x);
    let bearing = ((theta * 180) / Math.PI + 360) % 360;

    const directions = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  function getDailyCountry() {
    const epoch = new Date(2024, 0, 1).getTime();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayIndex = Math.floor((today - epoch) / (1000 * 60 * 60 * 24));
    
    // Pick well known countries with reliable flags
    const valid = countries.filter(c => c.code && c.code.length === 2);
    return {
      country: valid[dayIndex % valid.length],
      dayNumber: dayIndex
    };
  }

  function initGame() {
    guesses = [];
    isGameOver = false;
    guessesList.innerHTML = '';
    countryInput.value = '';
    countryInput.disabled = false;
    guessBtn.disabled = false;

    // Reset 6 tiles
    tileGrid.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
      const tile = document.createElement('div');
      tile.className = 'flag-tile';
      tile.id = `flag-tile-${i}`;
      tile.textContent = i;
      tileGrid.appendChild(tile);
    }

    if (mode === 'daily') {
      const daily = getDailyCountry();
      targetCountry = daily.country;
      modeBadge.textContent = 'Daily #' + daily.dayNumber;

      // Load stored daily state
      const saved = localStorage.getItem('flagle_daily_' + daily.dayNumber);
      if (saved) {
        try {
          const state = JSON.parse(saved);
          targetCountry = state.targetCountry;
          setFlagImage(targetCountry.code);
          restoreGameState(state);
          return;
        } catch (e) {}
      }
    } else {
      const randomIdx = Math.floor(Math.random() * countries.length);
      targetCountry = countries[randomIdx];
      modeBadge.textContent = 'Practice';
    }

    setFlagImage(targetCountry.code);
  }

  function setFlagImage(code) {
    flagImg.src = `https://flagcdn.com/w640/${code}.png`;
    flagImg.alt = 'Mystery Flag';
  }

  function restoreGameState(state) {
    state.guesses.forEach((g, idx) => {
      guesses.push(g);
      renderGuessCard(g);
      revealTile(idx + 1);
    });

    isGameOver = state.isGameOver;
    if (isGameOver) {
      countryInput.disabled = true;
      guessBtn.disabled = true;
      revealAllTiles();
      setTimeout(openStatsModal, 800);
    }
  }

  function saveDailyState() {
    if (mode !== 'daily') return;
    const daily = getDailyCountry();
    localStorage.setItem('flagle_daily_' + daily.dayNumber, JSON.stringify({
      targetCountry,
      guesses,
      isGameOver
    }));
  }

  function revealTile(tileNumber) {
    const tile = document.getElementById(`flag-tile-${tileNumber}`);
    if (tile) tile.classList.add('revealed');
  }

  function revealAllTiles() {
    document.querySelectorAll('.flag-tile').forEach(t => t.classList.add('revealed'));
  }

  function submitGuess(country) {
    if (!country || isGameOver) return;

    const isCorrect = country.code === targetCountry.code;
    const distance = isCorrect ? 0 : haversineDistance(country.lat, country.lng, targetCountry.lat, targetCountry.lng);
    const bearing = isCorrect ? '🎉' : calculateBearing(country.lat, country.lng, targetCountry.lat, targetCountry.lng);
    const proximity = Math.max(0, Math.round((1 - distance / 20000) * 100));

    const guessData = {
      country,
      distance,
      bearing,
      proximity,
      isCorrect
    };

    guesses.push(guessData);
    renderGuessCard(guessData);

    // Reveal one tile
    revealTile(guesses.length);

    countryInput.value = '';
    closeSuggestions();

    if (isCorrect) {
      isGameOver = true;
      revealAllTiles();
      countryInput.disabled = true;
      guessBtn.disabled = true;
      triggerConfetti();
      recordStats(true, guesses.length);
      saveDailyState();
      setTimeout(openStatsModal, 1200);
      return;
    }

    if (guesses.length >= maxGuesses) {
      isGameOver = true;
      revealAllTiles();
      countryInput.disabled = true;
      guessBtn.disabled = true;
      recordStats(false, 0);
      saveDailyState();
      setTimeout(openStatsModal, 1200);
    } else {
      saveDailyState();
    }
  }

  function renderGuessCard(data) {
    const card = document.createElement('div');
    card.className = 'guess-card';

    const proxClass = data.isCorrect ? 'exact' : (data.proximity >= 80 ? 'warm' : '');
    const distText = data.isCorrect ? 'Correct!' : `${data.distance.toLocaleString()} km`;

    card.innerHTML = `
      <div class="guess-info">
        <span>${data.country.flag || '🏳️'}</span>
        <span>${data.country.name}</span>
      </div>
      <div class="guess-metrics">
        <span class="distance-tag">${distText}</span>
        <span class="arrow-tag">${data.bearing}</span>
        <span class="proximity-badge ${proxClass}">${data.proximity}%</span>
      </div>
    `;

    guessesList.prepend(card);
  }

  // Autocomplete Suggestions
  function handleInput(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      closeSuggestions();
      return;
    }

    const matches = countries.filter(c => c.name.toLowerCase().includes(q)).slice(0, 7);
    if (matches.length === 0) {
      closeSuggestions();
      return;
    }

    suggestionsList.innerHTML = '';
    selectedSuggestionIdx = -1;

    matches.forEach(c => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.innerHTML = `<span>${c.flag || '🏳️'}</span><span>${c.name}</span>`;
      item.addEventListener('click', () => {
        submitGuess(c);
      });
      suggestionsList.appendChild(item);
    });

    suggestionsList.style.display = 'block';
  }

  function closeSuggestions() {
    suggestionsList.style.display = 'none';
    suggestionsList.innerHTML = '';
    selectedSuggestionIdx = -1;
  }

  // Keyboard navigation for dropdown
  countryInput.addEventListener('keydown', e => {
    const items = suggestionsList.children;
    if (items.length === 0 || suggestionsList.style.display === 'none') {
      if (e.key === 'Enter') {
        const found = countries.find(c => c.name.toLowerCase() === countryInput.value.trim().toLowerCase());
        if (found) submitGuess(found);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedSuggestionIdx = (selectedSuggestionIdx + 1) % items.length;
      updateActiveSuggestion(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedSuggestionIdx = (selectedSuggestionIdx - 1 + items.length) % items.length;
      updateActiveSuggestion(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIdx >= 0 && items[selectedSuggestionIdx]) {
        items[selectedSuggestionIdx].click();
      } else {
        const found = countries.find(c => c.name.toLowerCase() === countryInput.value.trim().toLowerCase());
        if (found) submitGuess(found);
      }
    } else if (e.key === 'Escape') {
      closeSuggestions();
    }
  });

  function updateActiveSuggestion(items) {
    for (let i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', i === selectedSuggestionIdx);
    }
  }

  countryInput.addEventListener('input', e => handleInput(e.target.value));
  guessBtn.addEventListener('click', () => {
    const found = countries.find(c => c.name.toLowerCase() === countryInput.value.trim().toLowerCase());
    if (found) submitGuess(found);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrapper')) closeSuggestions();
  });

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
      if (frame < 180) requestAnimationFrame(render);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    render();
  }

  // Stats Management
  function loadStats() {
    const def = { played: 0, wins: 0, currentStreak: 0, maxStreak: 0 };
    try {
      const saved = localStorage.getItem('flagle_stats');
      return saved ? Object.assign(def, JSON.parse(saved)) : def;
    } catch (e) {
      return def;
    }
  }

  function recordStats(won) {
    const s = loadStats();
    s.played++;
    if (won) {
      s.wins++;
      s.currentStreak++;
      if (s.currentStreak > s.maxStreak) s.maxStreak = s.currentStreak;
    } else {
      s.currentStreak = 0;
    }
    localStorage.setItem('flagle_stats', JSON.stringify(s));
  }

  function openStatsModal() {
    const s = loadStats();
    document.getElementById('stat-played').textContent = s.played;
    const winRate = s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0;
    document.getElementById('stat-win-rate').textContent = winRate;
    document.getElementById('stat-current-streak').textContent = s.currentStreak;
    document.getElementById('stat-max-streak').textContent = s.maxStreak;
    document.getElementById('modal-flag-answer').textContent = targetCountry.name + ' ' + (targetCountry.flag || '');

    statsModal.classList.add('active');
  }

  function closeModals() {
    helpModal.classList.remove('active');
    statsModal.classList.remove('active');
  }

  // Sharing
  document.getElementById('share-btn').addEventListener('click', () => {
    const isWon = guesses.length > 0 && guesses[guesses.length - 1].isCorrect;
    let text = `FlagFinder ${mode === 'daily' ? '#' + getDailyCountry().dayNumber : 'Practice'} ${isWon ? guesses.length : 'X'}/6\n\n`;
    
    guesses.forEach(g => {
      if (g.isCorrect) text += '🟩🟩🟩🟩🟩 100%\n';
      else if (g.proximity >= 80) text += '🟨🟨🟨⬛⬛ ' + g.proximity + '%\n';
      else text += '⬛⬛⬛⬛⬛ ' + g.proximity + '%\n';
    });
    text += '\nhttps://mashukealam.github.io/flagle/';

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Copied score to clipboard!');
      });
    }
  });

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

  // Theme Sync
  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);

  initGame();
})();

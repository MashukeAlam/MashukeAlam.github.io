/* ==========================================================================
   Windows 7 Aero Web Mockup - Main Application Logic
   Features: Desktop, Notepad, Calculator, File Explorer, Context Menus,
             Aero Window Management, Gadgets, Virtual File System & Audio
   ========================================================================== */

// --- Audio Synthesizer (Zero-dependency Web Audio API) ---
let audioCtx = null;
let soundEnabled = true;
let masterVolume = 0.8;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
}

function playTone(freq, duration, type = 'sine', delay = 0) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    gain.gain.setValueAtTime(masterVolume * 0.15, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration);
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

// Windows 7 Iconic Startup Chime
function playStartupSound() {
  initAudio();
  const chord = [
    { f: 392.00, t: 0.0, d: 2.5 }, // G4
    { f: 523.25, t: 0.2, d: 2.8 }, // C5
    { f: 659.25, t: 0.45, d: 3.0 }, // E5
    { f: 783.99, t: 0.7, d: 3.2 }, // G5
    { f: 1046.50, t: 0.95, d: 3.5 } // C6
  ];
  chord.forEach(c => playTone(c.f, c.d, 'sine', c.t));
}

// Navigation Click Sound
function playClickSound() {
  playTone(850, 0.04, 'triangle');
}

// Notification Ding
function playDingSound() {
  playTone(660, 0.2, 'sine', 0);
  playTone(880, 0.35, 'sine', 0.1);
}

// --- Virtual File System (VFS) ---
const VFS = {
  "Computer": {
    type: "root",
    name: "Computer",
    children: ["C:", "D:"]
  },
  "C:": {
    type: "drive",
    name: "Local Disk (C:)",
    totalSpace: "120 GB",
    freeSpace: "84.2 GB",
    children: ["C:/Windows", "C:/Users", "C:/Program Files"]
  },
  "D:": {
    type: "drive",
    name: "Data (D:)",
    totalSpace: "380 GB",
    freeSpace: "260 GB",
    children: ["D:/Projects", "D:/Wallpapers"]
  },
  "C:/Windows": {
    type: "folder",
    name: "Windows",
    children: ["C:/Windows/notepad.exe", "C:/Windows/calc.exe", "C:/Windows/explorer.exe"]
  },
  "C:/Windows/notepad.exe": {
    type: "app",
    name: "notepad.exe",
    appId: "notepad",
    size: "184 KB",
    date: "7/14/2009 02:14 AM"
  },
  "C:/Windows/calc.exe": {
    type: "app",
    name: "calc.exe",
    appId: "calculator",
    size: "892 KB",
    date: "7/14/2009 02:14 AM"
  },
  "C:/Windows/explorer.exe": {
    type: "app",
    name: "explorer.exe",
    appId: "explorer",
    size: "2.8 MB",
    date: "7/14/2009 02:14 AM"
  },
  "C:/Program Files": {
    type: "folder",
    name: "Program Files",
    children: ["C:/Program Files/Accessories"]
  },
  "C:/Program Files/Accessories": {
    type: "folder",
    name: "Accessories",
    children: []
  },
  "C:/Users": {
    type: "folder",
    name: "Users",
    children: ["C:/Users/Mashuke", "C:/Users/Public"]
  },
  "C:/Users/Public": {
    type: "folder",
    name: "Public",
    children: []
  },
  "C:/Users/Mashuke": {
    type: "folder",
    name: "Mashuke",
    children: [
      "C:/Users/Mashuke/Desktop",
      "C:/Users/Mashuke/Documents",
      "C:/Users/Mashuke/Pictures",
      "C:/Users/Mashuke/Music",
      "C:/Users/Mashuke/Downloads"
    ]
  },
  "C:/Users/Mashuke/Desktop": {
    type: "folder",
    name: "Desktop",
    children: [
      "C:/Users/Mashuke/Desktop/Welcome.txt",
      "C:/Users/Mashuke/Desktop/ReadMe.txt",
      "C:/Users/Mashuke/Desktop/Projects_Shortcuts"
    ]
  },
  "C:/Users/Mashuke/Desktop/Welcome.txt": {
    type: "file",
    name: "Welcome.txt",
    size: "348 bytes",
    date: "9/23/2026 09:30 AM",
    content: "Welcome to the Windows 7 Aero Mockup!\r\n\r\nFeatures implemented:\r\n- Interactive Aero Glass with real blur & specular highlights\r\n- Full-featured Notepad with File, Edit, Format options\r\n- Standard Windows 7 Calculator with memory & arithmetic\r\n- Windows Explorer with breadcrumb navigation & folders\r\n- Desktop right-click context menu (View, Sort, New, Personalize)\r\n- Start Menu with live search\r\n- Desktop gadgets (Clock & CPU meter)\r\n\r\nEnjoy exploring this retro tribute!"
  },
  "C:/Users/Mashuke/Desktop/ReadMe.txt": {
    type: "file",
    name: "ReadMe.txt",
    size: "210 bytes",
    date: "9/23/2026 09:35 AM",
    content: "Windows 7 Mockup Quick Tips:\r\n\r\n1. Double click any icon or file to open it.\r\n2. Right click anywhere on the desktop to open the Context Menu.\r\n3. Try dragging windows to the top of the screen for Aero Snap!\r\n4. Use the Start Menu search to quickly filter apps."
  },
  "C:/Users/Mashuke/Desktop/Projects_Shortcuts": {
    type: "folder",
    name: "Projects_Shortcuts",
    children: []
  },
  "C:/Users/Mashuke/Documents": {
    type: "folder",
    name: "Documents",
    children: [
      "C:/Users/Mashuke/Documents/Architecture_Notes.txt",
      "C:/Users/Mashuke/Documents/Sprint_Goals.txt"
    ]
  },
  "C:/Users/Mashuke/Documents/Architecture_Notes.txt": {
    type: "file",
    name: "Architecture_Notes.txt",
    size: "412 bytes",
    date: "9/21/2026 11:20 AM",
    content: "Backend Architecture Principles:\r\n\r\n1. High Concurrency: Non-blocking I/O and goroutine pools.\r\n2. Fault Tolerance: Circuit breaker patterns and grace degradation.\r\n3. Microservices: Decoupled domains with gRPC communication.\r\n4. Caching: Distributed Redis cache with TTL and write-through."
  },
  "C:/Users/Mashuke/Documents/Sprint_Goals.txt": {
    type: "file",
    name: "Sprint_Goals.txt",
    size: "180 bytes",
    date: "9/22/2026 03:45 PM",
    content: "Sprint 48 Goals:\r\n- Deploy v2.4 API updates\r\n- Polish UI design systems\r\n- Optimize DB query execution plans"
  },
  "C:/Users/Mashuke/Pictures": {
    type: "folder",
    name: "Pictures",
    children: [
      "C:/Users/Mashuke/Pictures/Windows7_Wallpaper.png",
      "C:/Users/Mashuke/Pictures/Nature_Landscape.png"
    ]
  },
  "C:/Users/Mashuke/Pictures/Windows7_Wallpaper.png": {
    type: "image",
    name: "Windows7_Wallpaper.png",
    size: "1.4 MB",
    date: "7/14/2009 02:14 AM"
  },
  "C:/Users/Mashuke/Pictures/Nature_Landscape.png": {
    type: "image",
    name: "Nature_Landscape.png",
    size: "2.1 MB",
    date: "8/10/2026 10:14 AM"
  },
  "C:/Users/Mashuke/Music": {
    type: "folder",
    name: "Music",
    children: [
      "C:/Users/Mashuke/Music/Kalimba.mp3",
      "C:/Users/Mashuke/Music/Sleep Away.mp3"
    ]
  },
  "C:/Users/Mashuke/Music/Kalimba.mp3": {
    type: "audio",
    name: "Kalimba.mp3",
    size: "5.6 MB",
    date: "7/14/2009 02:14 AM"
  },
  "C:/Users/Mashuke/Music/Sleep Away.mp3": {
    type: "audio",
    name: "Sleep Away.mp3",
    size: "4.8 MB",
    date: "7/14/2009 02:14 AM"
  },
  "C:/Users/Mashuke/Downloads": {
    type: "folder",
    name: "Downloads",
    children: [
      "C:/Users/Mashuke/Downloads/installer.exe"
    ]
  },
  "C:/Users/Mashuke/Downloads/installer.exe": {
    type: "app",
    name: "installer.exe",
    appId: "about",
    size: "12.4 MB",
    date: "9/15/2026 01:10 PM"
  },
  "D:/Projects": {
    type: "folder",
    name: "Projects",
    children: [
      "D:/Projects/marshallgo.txt",
      "D:/Projects/IdealMumin.txt"
    ]
  },
  "D:/Projects/marshallgo.txt": {
    type: "file",
    name: "marshallgo.txt",
    size: "310 bytes",
    date: "8/24/2026 11:30 AM",
    content: "marshallgo: High-performance Go web framework for scalable REST APIs."
  },
  "D:/Projects/IdealMumin.txt": {
    type: "file",
    name: "IdealMumin.txt",
    size: "280 bytes",
    date: "8/24/2026 11:30 AM",
    content: "IdealMumin: React Native mobile application for prayer times and Quran."
  },
  "D:/Wallpapers": {
    type: "folder",
    name: "Wallpapers",
    children: []
  }
};

// --- Desktop Icons Definition ---
let desktopItems = [
  { id: "comp", name: "Computer", type: "system", icon: "computer", target: "Computer" },
  { id: "user", name: "Mashuke's Files", type: "system", icon: "user", target: "C:/Users/Mashuke" },
  { id: "network", name: "Network", type: "system", icon: "network", target: "network" },
  { id: "recycle", name: "Recycle Bin", type: "system", icon: "recycle", target: "recycle" },
  { id: "explorer", name: "Windows Explorer", type: "app", icon: "explorer", target: "explorer" },
  { id: "notepad", name: "Notepad", type: "app", icon: "notepad", target: "notepad" },
  { id: "calc", name: "Calculator", type: "app", icon: "calc", target: "calculator" },
  { id: "readme", name: "Welcome.txt", type: "file", icon: "file", target: "C:/Users/Mashuke/Desktop/Welcome.txt" }
];

let desktopIconSize = 'medium';
let desktopIconsVisible = true;
let selectedDesktopIcons = new Set();
let currentContextTarget = null;

// --- Window Management System ---
let highestZ = 100;
const windows = {};
let activeWindowId = null;

// Initialize Windows
function initWindows() {
  const winEls = document.querySelectorAll('.aero-window');
  winEls.forEach(win => {
    const id = win.dataset.appid;
    windows[id] = {
      el: win,
      id: id,
      isMaximized: false,
      isMinimized: false,
      prevRect: null
    };

    // Focus on click
    win.addEventListener('mousedown', () => {
      focusWindow(id);
    });

    // Make Draggable
    setupWindowDrag(win, id);
    setupWindowResize(win);
  });
}

function focusWindow(id) {
  if (!windows[id]) return;
  highestZ++;
  windows[id].el.style.zIndex = highestZ;
  activeWindowId = id;

  document.querySelectorAll('.aero-window').forEach(w => w.classList.remove('active-window'));
  windows[id].el.classList.add('active-window');

  // Update taskbar tab
  updateTaskbarActive();
}

function openWindow(id) {
  initAudio();
  playClickSound();
  if (!windows[id]) return;
  const win = windows[id];
  win.el.style.display = 'flex';
  win.isMinimized = false;
  win.el.classList.remove('minimized');
  focusWindow(id);

  // Update taskbar button
  const tab = document.getElementById(`taskbar-btn-${id}`);
  if (tab) tab.classList.add('running');
}

function closeWindow(id) {
  playClickSound();
  if (!windows[id]) return;
  const win = windows[id];
  win.el.style.display = 'none';
  win.isMinimized = false;
  win.el.classList.remove('minimized');
  
  const tab = document.getElementById(`taskbar-btn-${id}`);
  if (tab) {
    tab.classList.remove('running', 'active');
  }

  if (activeWindowId === id) {
    activeWindowId = null;
    // Find next highest window
    let nextWin = null;
    let maxZ = 0;
    Object.values(windows).forEach(w => {
      if (w.el.style.display !== 'none' && !w.isMinimized) {
        const z = parseInt(w.el.style.zIndex || 0, 10);
        if (z > maxZ) {
          maxZ = z;
          nextWin = w.id;
        }
      }
    });
    if (nextWin) focusWindow(nextWin);
  }
}

function minimizeWindow(id) {
  playClickSound();
  if (!windows[id]) return;
  const win = windows[id];
  win.isMinimized = true;
  win.el.classList.add('minimized');
  win.el.style.display = 'none';

  const tab = document.getElementById(`taskbar-btn-${id}`);
  if (tab) tab.classList.remove('active');

  if (activeWindowId === id) {
    activeWindowId = null;
  }
}

function toggleMaximize(id) {
  playClickSound();
  if (!windows[id]) return;
  const win = windows[id];
  const el = win.el;
  const maxBtn = el.querySelector('.win-btn-maximize');

  if (win.isMaximized) {
    // Restore
    el.classList.remove('maximized');
    if (win.prevRect) {
      el.style.top = win.prevRect.top;
      el.style.left = win.prevRect.left;
      el.style.width = win.prevRect.width;
      el.style.height = win.prevRect.height;
    }
    win.isMaximized = false;
    if (maxBtn) maxBtn.innerHTML = '&#9634;';
  } else {
    // Maximize
    win.prevRect = {
      top: el.style.top,
      left: el.style.left,
      width: el.style.width,
      height: el.style.height
    };
    el.classList.add('maximized');
    win.isMaximized = true;
    if (maxBtn) maxBtn.innerHTML = '&#10065;'; // Double rectangle restore
  }
}

// Window Dragging & Aero Snap
function setupWindowDrag(winEl, id) {
  const titlebar = winEl.querySelector('.window-titlebar');
  if (!titlebar) return;

  let isDragging = false;
  let startX, startY, startLeft, startTop;
  const snapPreview = document.getElementById('aero-snap-preview');

  titlebar.addEventListener('mousedown', (e) => {
    // Don't drag if clicking buttons
    if (e.target.closest('.titlebar-controls') || e.target.closest('.dropdown-menu')) return;
    
    focusWindow(id);

    // If maximized, restore on drag
    if (windows[id].isMaximized) {
      const prevW = parseInt(windows[id].prevRect.width, 10) || 500;
      toggleMaximize(id);
      winEl.style.left = `${Math.max(0, e.clientX - prevW / 2)}px`;
      winEl.style.top = `${e.clientY - 10}px`;
    }

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = winEl.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    function onMouseMove(moveEvent) {
      if (!isDragging) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      // Keep partially on screen
      newTop = Math.max(0, newTop);

      winEl.style.left = `${newLeft}px`;
      winEl.style.top = `${newTop}px`;

      // Aero Snap Preview check
      if (moveEvent.clientY <= 5) {
        snapPreview.style.display = 'block';
      } else {
        snapPreview.style.display = 'none';
      }
    }

    function onMouseUp(upEvent) {
      if (!isDragging) return;
      isDragging = false;
      snapPreview.style.display = 'none';

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // Snap trigger
      if (upEvent.clientY <= 5 && !windows[id].isMaximized) {
        toggleMaximize(id);
      }
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

// Window Resizing
function setupWindowResize(winEl) {
  const handles = winEl.querySelectorAll('.resize-handle');
  handles.forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();

      const id = winEl.dataset.appid;
      focusWindow(id);
      if (windows[id].isMaximized) return;

      const rect = winEl.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = rect.width;
      const startH = rect.height;
      const startXPos = rect.left;
      const startYPos = rect.top;

      const isN = handle.classList.contains('res-n') || handle.classList.contains('res-nw') || handle.classList.contains('res-ne');
      const isS = handle.classList.contains('res-s') || handle.classList.contains('res-sw') || handle.classList.contains('res-se');
      const isW = handle.classList.contains('res-w') || handle.classList.contains('res-nw') || handle.classList.contains('res-sw');
      const isE = handle.classList.contains('res-e') || handle.classList.contains('res-ne') || handle.classList.contains('res-se');

      function onResizeMove(moveEvent) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        if (isE) {
          winEl.style.width = `${Math.max(240, startW + dx)}px`;
        }
        if (isS) {
          winEl.style.height = `${Math.max(160, startH + dy)}px`;
        }
        if (isW) {
          const newW = startW - dx;
          if (newW >= 240) {
            winEl.style.width = `${newW}px`;
            winEl.style.left = `${startXPos + dx}px`;
          }
        }
        if (isN) {
          const newH = startH - dy;
          if (newH >= 160) {
            winEl.style.height = `${newH}px`;
            winEl.style.top = `${startYPos + dy}px`;
          }
        }
      }

      function onResizeUp() {
        document.removeEventListener('mousemove', onResizeMove);
        document.removeEventListener('mouseup', onResizeUp);
      }

      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeUp);
    });
  });
}

// Taskbar Tab Click Handling
function taskbarTabClick(id) {
  playClickSound();
  if (!windows[id]) return;
  const win = windows[id];

  if (win.el.style.display === 'none' || win.isMinimized) {
    win.el.style.display = 'flex';
    win.isMinimized = false;
    win.el.classList.remove('minimized');
    focusWindow(id);
  } else if (activeWindowId === id) {
    minimizeWindow(id);
  } else {
    focusWindow(id);
  }
}

function updateTaskbarActive() {
  document.querySelectorAll('.taskbar-tab').forEach(tab => tab.classList.remove('active'));
  if (activeWindowId) {
    const activeTab = document.getElementById(`taskbar-btn-${activeWindowId}`);
    if (activeTab) activeTab.classList.add('active');
  }
}

// Window Menubar Dropdowns
function openWindowMenu(e, menuId) {
  e.stopPropagation();
  closeAllMenus();
  const menu = document.getElementById(menuId);
  if (menu) {
    menu.classList.add('show');
  }
}

function closeAllMenus() {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
  document.querySelectorAll('.win7-context-menu').forEach(m => m.style.display = 'none');
}

// --- Desktop Icon Rendering & Selection ---
function renderDesktopIcons() {
  const container = document.getElementById('desktop-icons');
  container.innerHTML = '';
  if (!desktopIconsVisible) return;

  desktopItems.forEach(item => {
    const iconEl = document.createElement('div');
    iconEl.className = `desktop-icon ${desktopIconSize}`;
    iconEl.dataset.id = item.id;
    if (selectedDesktopIcons.has(item.id)) iconEl.classList.add('selected');

    iconEl.innerHTML = `
      <div class="desktop-icon-img">
        ${getIconSvg(item.icon)}
      </div>
      <div class="desktop-icon-label">${item.name}</div>
    `;

    // Click select
    iconEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!e.ctrlKey) {
        selectedDesktopIcons.clear();
      }
      selectedDesktopIcons.add(item.id);
      updateDesktopIconSelection();
    });

    // Double click open
    iconEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      executeDesktopItem(item);
    });

    // Right click context menu
    iconEl.addEventListener('contextmenu', (e) => {
      e.stopPropagation();
      e.preventDefault();
      selectedDesktopIcons.clear();
      selectedDesktopIcons.add(item.id);
      updateDesktopIconSelection();
      currentContextTarget = item;
      showContextMenu(e.clientX, e.clientY, 'file-context-menu');
    });

    container.appendChild(iconEl);
  });
}

function updateDesktopIconSelection() {
  const icons = document.querySelectorAll('.desktop-icon');
  icons.forEach(icon => {
    if (selectedDesktopIcons.has(icon.dataset.id)) {
      icon.classList.add('selected');
    } else {
      icon.classList.remove('selected');
    }
  });
}

function executeDesktopItem(item) {
  playClickSound();
  if (item.type === 'app') {
    openWindow(item.target);
  } else if (item.type === 'system') {
    if (item.target === 'recycle') {
      alert("Recycle Bin is currently empty.");
    } else if (item.target === 'network') {
      alert("Network: Connected to Mashuke-Network (Fast 1 Gbps).");
    } else {
      explorerNavigateTo(item.target);
      openWindow('explorer');
    }
  } else if (item.type === 'file') {
    // Open text file in Notepad
    openFileInNotepad(item.target);
  }
}

// Rubberband Selection on Desktop
function setupDesktopSelection() {
  const desktop = document.getElementById('desktop');
  const selBox = document.getElementById('selection-box');
  let isSelecting = false;
  let startX = 0, startY = 0;

  desktop.addEventListener('mousedown', (e) => {
    // Left click only
    if (e.button !== 0) return;
    if (e.target.closest('.aero-window') || e.target.closest('.desktop-icon') || e.target.closest('.gadget') || e.target.closest('.win7-context-menu')) {
      return;
    }

    selectedDesktopIcons.clear();
    updateDesktopIconSelection();
    closeAllMenus();
    closeStartMenu();
    closeFlyouts();

    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selBox.style.left = `${startX}px`;
    selBox.style.top = `${startY}px`;
    selBox.style.width = '0px';
    selBox.style.height = '0px';
    selBox.style.display = 'block';

    function onSelectMove(mEvent) {
      if (!isSelecting) return;
      const curX = mEvent.clientX;
      const curY = mEvent.clientY;

      const left = Math.min(startX, curX);
      const top = Math.min(startY, curY);
      const width = Math.abs(curX - startX);
      const height = Math.abs(curY - startY);

      selBox.style.left = `${left}px`;
      selBox.style.top = `${top}px`;
      selBox.style.width = `${width}px`;
      selBox.style.height = `${height}px`;

      // Collision detection with desktop icons
      const boxRect = { left, top, right: left + width, bottom: top + height };
      document.querySelectorAll('.desktop-icon').forEach(icon => {
        const iRect = icon.getBoundingClientRect();
        const hit = !(boxRect.right < iRect.left || boxRect.left > iRect.right || boxRect.bottom < iRect.top || boxRect.top > iRect.bottom);
        if (hit) {
          selectedDesktopIcons.add(icon.dataset.id);
        } else {
          selectedDesktopIcons.delete(icon.dataset.id);
        }
      });
      updateDesktopIconSelection();
    }

    function onSelectUp() {
      if (!isSelecting) return;
      isSelecting = false;
      selBox.style.display = 'none';
      document.removeEventListener('mousemove', onSelectMove);
      document.removeEventListener('mouseup', onSelectUp);
    }

    document.addEventListener('mousemove', onSelectMove);
    document.addEventListener('mouseup', onSelectUp);
  });

  // Desktop right-click
  desktop.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.aero-window') || e.target.closest('.desktop-icon') || e.target.closest('.gadget')) {
      return;
    }
    e.preventDefault();
    closeAllMenus();
    showContextMenu(e.clientX, e.clientY, 'desktop-context-menu');
  });
}

// Context Menu Display & Boundaries
function showContextMenu(x, y, menuId) {
  closeAllMenus();
  const menu = document.getElementById(menuId);
  if (!menu) return;

  menu.style.display = 'flex';
  const menuW = menu.offsetWidth || 180;
  const menuH = menu.offsetHeight || 220;

  // Screen clamping
  const maxX = window.innerWidth - menuW - 5;
  const maxY = window.innerHeight - menuH - 45;

  menu.style.left = `${Math.min(x, maxX)}px`;
  menu.style.top = `${Math.min(y, maxY)}px`;
}

// Desktop Context Actions
function setDesktopIconSize(size) {
  desktopIconSize = size;
  renderDesktopIcons();
  closeAllMenus();
}

function toggleDesktopIcons() {
  desktopIconsVisible = !desktopIconsVisible;
  const check = document.getElementById('ctx-show-icons-check');
  if (check) check.innerHTML = desktopIconsVisible ? '&#10003; Show desktop icons' : 'Show desktop icons';
  renderDesktopIcons();
  closeAllMenus();
}

function sortDesktopIcons(criterion) {
  playClickSound();
  if (criterion === 'name') {
    desktopItems.sort((a, b) => a.name.localeCompare(b.name));
  } else if (criterion === 'type') {
    desktopItems.sort((a, b) => a.type.localeCompare(b.type));
  }
  renderDesktopIcons();
  closeAllMenus();
}

function refreshDesktop() {
  playClickSound();
  const desktop = document.getElementById('desktop');
  desktop.style.opacity = '0.9';
  setTimeout(() => {
    desktop.style.opacity = '1';
    renderDesktopIcons();
  }, 120);
  closeAllMenus();
}

function createNewDesktopItem(type) {
  playClickSound();
  const id = `item_${Date.now()}`;
  if (type === 'folder') {
    const name = "New folder";
    desktopItems.push({
      id: id,
      name: name,
      type: "folder",
      icon: "folder",
      target: `C:/Users/Mashuke/Desktop/${name}`
    });
    VFS[`C:/Users/Mashuke/Desktop/${name}`] = {
      type: "folder",
      name: name,
      children: []
    };
  } else if (type === 'text') {
    const name = "New Text Document.txt";
    desktopItems.push({
      id: id,
      name: name,
      type: "file",
      icon: "file",
      target: `C:/Users/Mashuke/Desktop/${name}`
    });
    VFS[`C:/Users/Mashuke/Desktop/${name}`] = {
      type: "file",
      name: name,
      size: "0 bytes",
      date: new Date().toLocaleString(),
      content: ""
    };
  }
  renderDesktopIcons();
  closeAllMenus();
}

// File Context Actions
function ctxActionOpen() {
  if (currentContextTarget) {
    executeDesktopItem(currentContextTarget);
  }
  closeAllMenus();
}

function ctxActionEdit() {
  if (currentContextTarget && (currentContextTarget.type === 'file' || currentContextTarget.target.endsWith('.txt'))) {
    openFileInNotepad(currentContextTarget.target);
  }
  closeAllMenus();
}

function ctxActionDelete() {
  if (!currentContextTarget) return;
  playClickSound();
  if (confirm(`Are you sure you want to move '${currentContextTarget.name}' to the Recycle Bin?`)) {
    desktopItems = desktopItems.filter(i => i.id !== currentContextTarget.id);
    if (VFS[currentContextTarget.target]) {
      delete VFS[currentContextTarget.target];
    }
    renderDesktopIcons();
  }
  closeAllMenus();
}

function ctxActionRename() {
  if (!currentContextTarget) return;
  const newName = prompt("Enter new name:", currentContextTarget.name);
  if (newName && newName.trim()) {
    currentContextTarget.name = newName.trim();
    renderDesktopIcons();
  }
  closeAllMenus();
}

function ctxActionProperties() {
  if (!currentContextTarget) return;
  alert(`Properties of ${currentContextTarget.name}:\n\nType: ${currentContextTarget.type}\nTarget: ${currentContextTarget.target}`);
  closeAllMenus();
}

// Taskbar Context Actions
function openTaskbarContextMenu(e) {
  closeAllMenus();
  showContextMenu(e.clientX, e.clientY - 140, 'taskbar-context-menu');
}

function taskbarCascade() {
  let offset = 40;
  Object.values(windows).forEach(w => {
    if (w.el.style.display !== 'none' && !w.isMinimized) {
      w.el.style.left = `${offset}px`;
      w.el.style.top = `${offset}px`;
      offset += 30;
      focusWindow(w.id);
    }
  });
  closeAllMenus();
}

function taskbarTileHorizontal() {
  const openWins = Object.values(windows).filter(w => w.el.style.display !== 'none' && !w.isMinimized);
  if (openWins.length === 0) return;
  const h = (window.innerHeight - 40) / openWins.length;
  openWins.forEach((w, idx) => {
    w.el.style.left = '0px';
    w.el.style.top = `${idx * h}px`;
    w.el.style.width = '100vw';
    w.el.style.height = `${h}px`;
  });
  closeAllMenus();
}

function taskbarTileVertical() {
  const openWins = Object.values(windows).filter(w => w.el.style.display !== 'none' && !w.isMinimized);
  if (openWins.length === 0) return;
  const w = window.innerWidth / openWins.length;
  openWins.forEach((win, idx) => {
    win.el.style.left = `${idx * w}px`;
    win.el.style.top = '0px';
    win.el.style.width = `${w}px`;
    win.el.style.height = `${window.innerHeight - 40}px`;
  });
  closeAllMenus();
}

let allWindowsMinimized = false;
let preShowDesktopState = {};

function toggleShowDesktop() {
  playClickSound();
  if (!allWindowsMinimized) {
    preShowDesktopState = {};
    Object.values(windows).forEach(w => {
      if (w.el.style.display !== 'none' && !w.isMinimized) {
        preShowDesktopState[w.id] = true;
        minimizeWindow(w.id);
      }
    });
    allWindowsMinimized = true;
  } else {
    Object.keys(preShowDesktopState).forEach(id => {
      if (windows[id]) {
        windows[id].el.style.display = 'flex';
        windows[id].isMinimized = false;
        windows[id].el.classList.remove('minimized');
      }
    });
    allWindowsMinimized = false;
  }
}

function aeroPeekDesktop(peek) {
  const container = document.getElementById('windows-container');
  if (peek) {
    container.style.opacity = '0.15';
  } else {
    container.style.opacity = '1';
  }
}

// --- Start Menu & System Tray Flyouts ---
function toggleStartMenu(e) {
  e.stopPropagation();
  playClickSound();
  const menu = document.getElementById('start-menu');
  if (menu.style.display === 'block') {
    closeStartMenu();
  } else {
    closeAllMenus();
    closeFlyouts();
    menu.style.display = 'block';
    document.getElementById('start-search-input').focus();
  }
}

function closeStartMenu() {
  const menu = document.getElementById('start-menu');
  if (menu) menu.style.display = 'none';
}

function filterStartSearch(query) {
  const items = document.querySelectorAll('.start-item');
  const lower = query.toLowerCase().trim();
  items.forEach(item => {
    const text = item.innerText.toLowerCase();
    item.style.display = text.includes(lower) ? 'flex' : 'none';
  });
}

function executeStartSearch() {
  const input = document.getElementById('start-search-input');
  const q = input.value.toLowerCase().trim();
  if (q.includes('calc')) {
    openWindow('calculator');
  } else if (q.includes('note')) {
    openWindow('notepad');
  } else if (q.includes('explor') || q.includes('file')) {
    openWindow('explorer');
  }
  closeStartMenu();
}

function toggleAllPrograms() {
  alert("All Programs:\n- Accessories (Notepad, Calculator, Paint)\n- Maintenance\n- Startup\n- System Tools");
}

function simulateShutdown() {
  playDingSound();
  if (confirm("Do you want to shut down Windows 7?")) {
    document.body.innerHTML = `
      <div style="width:100vw; height:100vh; background:#0c1e33; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:'Segoe UI', sans-serif;">
        <h2 style="font-weight:300; margin-bottom:12px;">Shutting down...</h2>
        <p style="color:#7da2ce; font-size:12px;">Windows 7 Ultimate</p>
        <button onclick="location.reload()" style="margin-top:24px; padding:6px 16px; border-radius:3px; cursor:pointer;">Restart Mockup</button>
      </div>
    `;
  }
}

function toggleShutdownFlyout(e) {
  e.stopPropagation();
  alert("Options: Switch user | Log off | Lock | Restart | Sleep");
}

// Volume Popup
function toggleVolumeFlyout(e) {
  e.stopPropagation();
  closeAllMenus();
  closeStartMenu();
  const p = document.getElementById('volume-popup');
  p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
}

function updateVolume(val) {
  masterVolume = val / 100;
  document.getElementById('vol-label').innerText = `${val}%`;
  playTone(440, 0.05, 'sine');
}

let isMuted = false;
function toggleMute() {
  isMuted = !isMuted;
  soundEnabled = !isMuted;
  document.getElementById('vol-mute-btn').innerHTML = isMuted ? '&#128263;' : '&#128266;';
}

// Calendar Popup
let currentCalDate = new Date();
function toggleCalendarFlyout(e) {
  e.stopPropagation();
  closeAllMenus();
  closeStartMenu();
  const p = document.getElementById('calendar-popup');
  if (p.style.display === 'block') {
    p.style.display = 'none';
  } else {
    p.style.display = 'block';
    renderCalendar();
  }
}

function renderCalendar() {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  document.getElementById('cal-month-year').innerText = `${monthNames[currentCalDate.getMonth()]} ${currentCalDate.getFullYear()}`;
  
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  const firstDay = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), 1).getDay();
  const totalDays = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    grid.appendChild(empty);
  }

  const today = new Date();
  for (let day = 1; day <= totalDays; day++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'cal-day';
    dayEl.innerText = day;
    if (day === today.getDate() && currentCalDate.getMonth() === today.getMonth() && currentCalDate.getFullYear() === today.getFullYear()) {
      dayEl.classList.add('today');
    }
    grid.appendChild(dayEl);
  }
}

function calPrevMonth() {
  currentCalDate.setMonth(currentCalDate.getMonth() - 1);
  renderCalendar();
}

function calNextMonth() {
  currentCalDate.setMonth(currentCalDate.getMonth() + 1);
  renderCalendar();
}

function calGoToday() {
  currentCalDate = new Date();
  renderCalendar();
}

function closeFlyouts() {
  const vol = document.getElementById('volume-popup');
  if (vol) vol.style.display = 'none';
  const cal = document.getElementById('calendar-popup');
  if (cal) cal.style.display = 'none';
}

// --- Real-time Clock & Gadgets ---
function startClock() {
  function update() {
    const now = new Date();
    // Tray Clock
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    document.getElementById('tray-time').innerText = `${hours}:${minutes} ${ampm}`;
    document.getElementById('tray-date').innerText = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

    // Gadget Analog Clock
    const secDeg = (now.getSeconds() / 60) * 360;
    const minDeg = ((now.getMinutes() + now.getSeconds() / 60) / 60) * 360;
    const hourDeg = (((now.getHours() % 12) + now.getMinutes() / 60) / 12) * 360;

    const sHand = document.getElementById('gadget-second');
    const mHand = document.getElementById('gadget-minute');
    const hHand = document.getElementById('gadget-hour');
    if (sHand) sHand.style.transform = `rotate(${secDeg}deg)`;
    if (mHand) mHand.style.transform = `rotate(${minDeg}deg)`;
    if (hHand) hHand.style.transform = `rotate(${hourDeg}deg)`;
  }
  update();
  setInterval(update, 1000);

  // CPU / RAM Meter Fluctuation
  setInterval(() => {
    const cpu = Math.floor(10 + Math.random() * 25);
    const ram = Math.floor(40 + Math.random() * 8);

    const cpuDeg = -60 + (cpu / 100) * 120;
    const ramDeg = -60 + (ram / 100) * 120;

    const cpuNeedle = document.getElementById('cpu-needle');
    const ramNeedle = document.getElementById('ram-needle');
    const cpuLabel = document.getElementById('cpu-percent');
    const ramLabel = document.getElementById('ram-percent');

    if (cpuNeedle) cpuNeedle.style.transform = `rotate(${cpuDeg}deg)`;
    if (ramNeedle) ramNeedle.style.transform = `rotate(${ramDeg}deg)`;
    if (cpuLabel) cpuLabel.innerText = `${cpu}%`;
    if (ramLabel) ramLabel.innerText = `${ram}%`;
  }, 2000);
}

function toggleGadget(name) {
  const g = document.getElementById(`gadget-${name}`);
  if (g) g.style.display = g.style.display === 'none' ? 'block' : 'none';
}

// --- NOTEPAD IMPLEMENTATION ---
let currentNotepadPath = null;
let notepadIsWordWrap = true;

function setupNotepad() {
  const textarea = document.getElementById('notepad-textarea');
  textarea.addEventListener('input', updateNotepadStatus);
  textarea.addEventListener('click', updateNotepadStatus);
  textarea.addEventListener('keyup', updateNotepadStatus);
}

function updateNotepadStatus() {
  const textarea = document.getElementById('notepad-textarea');
  const pos = textarea.selectionStart;
  const textBefore = textarea.value.substring(0, pos);
  const lines = textBefore.split('\n');
  const ln = lines.length;
  const col = lines[lines.length - 1].length + 1;
  document.getElementById('notepad-cursor-pos').innerText = `Ln ${ln}, Col ${col}`;
}

function openFileInNotepad(filePath) {
  openWindow('notepad');
  const file = VFS[filePath];
  if (file && file.content !== undefined) {
    currentNotepadPath = filePath;
    document.getElementById('notepad-textarea').value = file.content;
    document.getElementById('notepad-window-title').innerText = `${file.name} - Notepad`;
  } else {
    document.getElementById('notepad-textarea').value = '';
    document.getElementById('notepad-window-title').innerText = `Untitled - Notepad`;
  }
  updateNotepadStatus();
}

function notepadNewFile() {
  currentNotepadPath = null;
  document.getElementById('notepad-textarea').value = '';
  document.getElementById('notepad-window-title').innerText = 'Untitled - Notepad';
  closeAllMenus();
}

function notepadOpenFilePrompt() {
  closeAllMenus();
  const path = prompt("Enter file path to open (e.g. C:/Users/Mashuke/Desktop/Welcome.txt):", "C:/Users/Mashuke/Desktop/Welcome.txt");
  if (path && VFS[path]) {
    openFileInNotepad(path);
  } else if (path) {
    alert("File not found in Virtual File System.");
  }
}

function notepadSaveFile() {
  closeAllMenus();
  playClickSound();
  const text = document.getElementById('notepad-textarea').value;
  if (currentNotepadPath && VFS[currentNotepadPath]) {
    VFS[currentNotepadPath].content = text;
    VFS[currentNotepadPath].size = `${text.length} bytes`;
    VFS[currentNotepadPath].date = new Date().toLocaleString();
    alert(`File saved to ${currentNotepadPath}`);
  } else {
    notepadSaveAsFile();
  }
}

function notepadSaveAsFile() {
  closeAllMenus();
  const name = prompt("Save As filename (e.g. MyNotes.txt):", "Notes.txt");
  if (name) {
    const fullPath = `C:/Users/Mashuke/Documents/${name}`;
    const text = document.getElementById('notepad-textarea').value;
    VFS[fullPath] = {
      type: "file",
      name: name,
      size: `${text.length} bytes`,
      date: new Date().toLocaleString(),
      content: text
    };
    if (VFS["C:/Users/Mashuke/Documents"]) {
      VFS["C:/Users/Mashuke/Documents"].children.push(fullPath);
    }
    currentNotepadPath = fullPath;
    document.getElementById('notepad-window-title').innerText = `${name} - Notepad`;
    alert(`Saved to ${fullPath}`);
    if (currentExplorerPath === "C:/Users/Mashuke/Documents") {
      explorerRenderFiles();
    }
  }
}

function notepadEdit(action) {
  closeAllMenus();
  const ta = document.getElementById('notepad-textarea');
  ta.focus();
  if (action === 'selectall') {
    ta.select();
  } else if (action === 'undo') {
    document.execCommand('undo');
  } else if (action === 'cut') {
    document.execCommand('cut');
  } else if (action === 'copy') {
    document.execCommand('copy');
  } else if (action === 'paste') {
    navigator.clipboard.readText().then(text => {
      ta.setRangeText(text);
    }).catch(() => {
      alert("Clipboard access not permitted by browser.");
    });
  } else if (action === 'delete') {
    ta.setRangeText('');
  }
  updateNotepadStatus();
}

function notepadInsertDate() {
  closeAllMenus();
  const ta = document.getElementById('notepad-textarea');
  const d = new Date().toLocaleString();
  ta.setRangeText(d);
  updateNotepadStatus();
}

function notepadToggleWordWrap() {
  closeAllMenus();
  notepadIsWordWrap = !notepadIsWordWrap;
  const ta = document.getElementById('notepad-textarea');
  ta.style.whiteSpace = notepadIsWordWrap ? 'pre-wrap' : 'pre';
  document.getElementById('notepad-wordwrap-check').innerHTML = notepadIsWordWrap ? '&#10003; Word Wrap' : 'Word Wrap';
}

let isMonospace = true;
function notepadToggleMonospace() {
  closeAllMenus();
  isMonospace = !isMonospace;
  const ta = document.getElementById('notepad-textarea');
  ta.style.fontFamily = isMonospace ? "'Consolas', monospace" : "var(--win-font)";
}

function notepadToggleStatusBar() {
  closeAllMenus();
  const sb = document.getElementById('notepad-statusbar');
  sb.style.display = sb.style.display === 'none' ? 'flex' : 'none';
  document.getElementById('notepad-statusbar-check').innerHTML = sb.style.display === 'none' ? 'Status Bar' : '&#10003; Status Bar';
}

// --- CALCULATOR IMPLEMENTATION ---
let calcCurrent = "0";
let calcPrevious = null;
let calcOperator = null;
let calcNewNumber = true;
let calcMemory = 0;

function calcUpdateDisplay() {
  document.getElementById('calc-display').innerText = calcCurrent;
}

function calcInput(digit) {
  playClickSound();
  if (calcNewNumber) {
    calcCurrent = digit === '.' ? "0." : digit;
    calcNewNumber = false;
  } else {
    if (digit === '.' && calcCurrent.includes('.')) return;
    calcCurrent = calcCurrent === "0" && digit !== '.' ? digit : calcCurrent + digit;
  }
  calcUpdateDisplay();
}

function calcOp(op) {
  playClickSound();
  if (calcOperator && !calcNewNumber) {
    calcEqual();
  }
  calcPrevious = parseFloat(calcCurrent);
  calcOperator = op;
  calcNewNumber = true;
  document.getElementById('calc-history').innerText = `${calcPrevious} ${op}`;
}

function calcEqual() {
  playClickSound();
  if (!calcOperator || calcPrevious === null) return;
  const curr = parseFloat(calcCurrent);
  let res = 0;
  switch (calcOperator) {
    case '+': res = calcPrevious + curr; break;
    case '-': res = calcPrevious - curr; break;
    case '*': res = calcPrevious * curr; break;
    case '/': 
      if (curr === 0) {
        calcCurrent = "Cannot divide by zero";
        calcUpdateDisplay();
        calcOperator = null;
        calcPrevious = null;
        calcNewNumber = true;
        return;
      }
      res = calcPrevious / curr; 
      break;
  }
  document.getElementById('calc-history').innerText = `${calcPrevious} ${calcOperator} ${curr} =`;
  calcCurrent = String(parseFloat(res.toFixed(10)));
  calcOperator = null;
  calcPrevious = null;
  calcNewNumber = true;
  calcUpdateDisplay();
}

function calcC() {
  playClickSound();
  calcCurrent = "0";
  calcPrevious = null;
  calcOperator = null;
  calcNewNumber = true;
  document.getElementById('calc-history').innerText = "";
  calcUpdateDisplay();
}

function calcCE() {
  playClickSound();
  calcCurrent = "0";
  calcNewNumber = true;
  calcUpdateDisplay();
}

function calcBackspace() {
  playClickSound();
  if (calcNewNumber) return;
  calcCurrent = calcCurrent.length > 1 ? calcCurrent.slice(0, -1) : "0";
  calcUpdateDisplay();
}

function calcNegate() {
  playClickSound();
  calcCurrent = String(-parseFloat(calcCurrent));
  calcUpdateDisplay();
}

function calcSqrt() {
  playClickSound();
  const val = parseFloat(calcCurrent);
  if (val < 0) {
    calcCurrent = "Invalid input";
  } else {
    calcCurrent = String(Math.sqrt(val));
  }
  calcNewNumber = true;
  calcUpdateDisplay();
}

function calcPercent() {
  playClickSound();
  calcCurrent = String(parseFloat(calcCurrent) / 100);
  calcNewNumber = true;
  calcUpdateDisplay();
}

function calcReciprocal() {
  playClickSound();
  const val = parseFloat(calcCurrent);
  if (val === 0) {
    calcCurrent = "Cannot divide by zero";
  } else {
    calcCurrent = String(1 / val);
  }
  calcNewNumber = true;
  calcUpdateDisplay();
}

function calcMem(op) {
  playClickSound();
  const val = parseFloat(calcCurrent);
  if (op === 'MC') calcMemory = 0;
  if (op === 'MR') { calcCurrent = String(calcMemory); calcNewNumber = true; }
  if (op === 'MS') calcMemory = val;
  if (op === 'M+') calcMemory += val;
  if (op === 'M-') calcMemory -= val;
  calcUpdateDisplay();
}

function calcCopy() {
  navigator.clipboard.writeText(calcCurrent);
  closeAllMenus();
}

function calcPaste() {
  navigator.clipboard.readText().then(t => {
    if (!isNaN(t)) {
      calcCurrent = t;
      calcUpdateDisplay();
    }
  });
  closeAllMenus();
}

function calcHistoryToggle() {
  alert("Calculation History:\n" + document.getElementById('calc-history').innerText);
  closeAllMenus();
}

// Global Keyboard bindings for Calculator when active
window.addEventListener('keydown', (e) => {
  if (activeWindowId === 'calculator') {
    if (e.key >= '0' && e.key <= '9') calcInput(e.key);
    if (e.key === '.') calcInput('.');
    if (e.key === '+') calcOp('+');
    if (e.key === '-') calcOp('-');
    if (e.key === '*') calcOp('*');
    if (e.key === '/') calcOp('/');
    if (e.key === 'Enter' || e.key === '=') calcEqual();
    if (e.key === 'Backspace') calcBackspace();
    if (e.key === 'Escape') calcC();
  }
});

// --- FILE EXPLORER IMPLEMENTATION ---
let currentExplorerPath = "Computer";
let explorerHistory = ["Computer"];
let explorerHistoryIdx = 0;
let explorerViewMode = 'icons';
let selectedExplorerItem = null;

function explorerNavigateTo(path) {
  playClickSound();
  if (!VFS[path]) {
    alert(`Path not found: ${path}`);
    return;
  }
  currentExplorerPath = path;

  // Add to history
  if (explorerHistory[explorerHistoryIdx] !== path) {
    explorerHistory = explorerHistory.slice(0, explorerHistoryIdx + 1);
    explorerHistory.push(path);
    explorerHistoryIdx = explorerHistory.length - 1;
  }
  updateExplorerNavButtons();
  explorerRenderAddressBar();
  explorerRenderFiles();
  selectedExplorerItem = null;
  updateExplorerDetails();
}

function explorerGoBack() {
  if (explorerHistoryIdx > 0) {
    explorerHistoryIdx--;
    currentExplorerPath = explorerHistory[explorerHistoryIdx];
    updateExplorerNavButtons();
    explorerRenderAddressBar();
    explorerRenderFiles();
    selectedExplorerItem = null;
    updateExplorerDetails();
  }
}

function explorerGoForward() {
  if (explorerHistoryIdx < explorerHistory.length - 1) {
    explorerHistoryIdx++;
    currentExplorerPath = explorerHistory[explorerHistoryIdx];
    updateExplorerNavButtons();
    explorerRenderAddressBar();
    explorerRenderFiles();
    selectedExplorerItem = null;
    updateExplorerDetails();
  }
}

function updateExplorerNavButtons() {
  const back = document.getElementById('exp-btn-back');
  const fwd = document.getElementById('exp-btn-forward');
  if (back) back.disabled = explorerHistoryIdx <= 0;
  if (fwd) fwd.disabled = explorerHistoryIdx >= explorerHistory.length - 1;
}

function explorerRenderAddressBar() {
  const container = document.getElementById('address-breadcrumbs');
  container.innerHTML = '';

  const parts = currentExplorerPath === "Computer" ? ["Computer"] : currentExplorerPath.split('/');
  let accumulatedPath = "";

  parts.forEach((part, idx) => {
    accumulatedPath = idx === 0 ? part : `${accumulatedPath}/${part}`;
    const targetPath = accumulatedPath;

    const crumb = document.createElement('span');
    crumb.className = 'breadcrumb-crumb';
    crumb.innerText = part;
    crumb.addEventListener('click', () => {
      explorerNavigateTo(targetPath);
    });
    container.appendChild(crumb);

    if (idx < parts.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'breadcrumb-sep';
      sep.innerText = '>';
      container.appendChild(sep);
    }
  });

  // Update Title
  const title = currentExplorerPath.split('/').pop() || "Computer";
  document.getElementById('explorer-window-title').innerText = title;
}

function explorerRenderFiles(filterQuery = "") {
  const container = document.getElementById('explorer-file-list');
  container.innerHTML = '';
  container.className = `explorer-content-view ${explorerViewMode === 'details' ? 'mode-details' : ''}`;

  const currentFolder = VFS[currentExplorerPath];
  if (!currentFolder || !currentFolder.children) return;

  let items = currentFolder.children.map(p => ({ path: p, data: VFS[p] })).filter(i => !!i.data);

  if (filterQuery) {
    items = items.filter(i => i.data.name.toLowerCase().includes(filterQuery.toLowerCase()));
  }

  document.getElementById('det-count').innerText = `${items.length} items`;

  if (explorerViewMode === 'details') {
    // Render Table Header
    const head = document.createElement('div');
    head.className = 'details-header-row';
    head.innerHTML = `
      <div class="dh-col dh-name">Name</div>
      <div class="dh-col dh-date">Date modified</div>
      <div class="dh-col dh-type">Type</div>
      <div class="dh-col dh-size">Size</div>
    `;
    container.appendChild(head);

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'details-file-row';
      row.dataset.path = item.path;
      if (selectedExplorerItem === item.path) row.classList.add('selected');

      row.innerHTML = `
        <div class="dh-col df-name">
          <div class="df-icon">${getIconSvg(getIconNameForType(item.data.type))}</div>
          <span>${item.data.name}</span>
        </div>
        <div class="dh-col df-date">${item.data.date || '-'}</div>
        <div class="dh-col df-type">${formatTypeName(item.data.type)}</div>
        <div class="dh-col df-size">${item.data.size || '-'}</div>
      `;

      row.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedExplorerItem = item.path;
        document.querySelectorAll('.details-file-row').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        updateExplorerDetails(item.data);
      });

      row.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        explorerExecuteFile(item.path, item.data);
      });

      container.appendChild(row);
    });
  } else {
    // Mode Icons
    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'explorer-item';
      itemEl.dataset.path = item.path;
      if (selectedExplorerItem === item.path) itemEl.classList.add('selected');

      itemEl.innerHTML = `
        <div class="explorer-item-icon">
          ${getIconSvg(getIconNameForType(item.data.type))}
        </div>
        <div class="explorer-item-name">${item.data.name}</div>
      `;

      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedExplorerItem = item.path;
        document.querySelectorAll('.explorer-item').forEach(r => r.classList.remove('selected'));
        itemEl.classList.add('selected');
        updateExplorerDetails(item.data);
      });

      itemEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        explorerExecuteFile(item.path, item.data);
      });

      container.appendChild(itemEl);
    });
  }
}

function explorerExecuteFile(path, data) {
  playClickSound();
  if (data.type === 'folder' || data.type === 'drive') {
    explorerNavigateTo(path);
  } else if (data.type === 'app') {
    openWindow(data.appId);
  } else if (data.type === 'file') {
    openFileInNotepad(path);
  } else if (data.type === 'image') {
    alert(`Windows Photo Viewer Mockup:\nOpening ${data.name} (${data.size})`);
  } else if (data.type === 'audio') {
    playDingSound();
    alert(`Windows Media Player Mockup:\nNow playing ${data.name}`);
  }
}

function updateExplorerDetails(data) {
  const iconBox = document.getElementById('det-preview-icon');
  const nameBox = document.getElementById('det-name');
  const metaBox = document.getElementById('det-meta');

  if (data) {
    iconBox.innerHTML = getIconSvg(getIconNameForType(data.type));
    nameBox.innerText = data.name;
    metaBox.innerText = `${formatTypeName(data.type)}  |  ${data.size || ''}`;
  } else {
    const cur = VFS[currentExplorerPath];
    iconBox.innerHTML = getIconSvg('folder');
    nameBox.innerText = cur ? cur.name : "Computer";
    metaBox.innerText = "System Directory";
  }
}

function explorerSetViewMode(mode) {
  explorerViewMode = mode;
  document.getElementById('view-mode-icons').classList.toggle('active', mode === 'icons');
  document.getElementById('view-mode-details').classList.toggle('active', mode === 'details');
  explorerRenderFiles();
}

function explorerCreateNewFolder() {
  playClickSound();
  const folderName = prompt("Enter folder name:", "New Folder");
  if (folderName && folderName.trim()) {
    const newPath = `${currentExplorerPath}/${folderName.trim()}`;
    VFS[newPath] = {
      type: "folder",
      name: folderName.trim(),
      children: [],
      date: new Date().toLocaleString()
    };
    if (VFS[currentExplorerPath] && VFS[currentExplorerPath].children) {
      VFS[currentExplorerPath].children.push(newPath);
    }
    explorerRenderFiles();
  }
}

function explorerDeleteSelected() {
  if (!selectedExplorerItem) {
    alert("Select an item to delete.");
    return;
  }
  playClickSound();
  const item = VFS[selectedExplorerItem];
  if (confirm(`Are you sure you want to permanently delete '${item.name}'?`)) {
    delete VFS[selectedExplorerItem];
    if (VFS[currentExplorerPath] && VFS[currentExplorerPath].children) {
      VFS[currentExplorerPath].children = VFS[currentExplorerPath].children.filter(p => p !== selectedExplorerItem);
    }
    selectedExplorerItem = null;
    explorerRenderFiles();
    updateExplorerDetails();
  }
}

function explorerOpenSelected() {
  if (selectedExplorerItem && VFS[selectedExplorerItem]) {
    explorerExecuteFile(selectedExplorerItem, VFS[selectedExplorerItem]);
  }
}

function explorerRefresh() {
  playClickSound();
  explorerRenderFiles();
}

function explorerOnSearch(query) {
  explorerRenderFiles(query);
}

function explorerContentClick(e) {
  if (!e.target.closest('.explorer-item') && !e.target.closest('.details-file-row')) {
    selectedExplorerItem = null;
    document.querySelectorAll('.explorer-item, .details-file-row').forEach(el => el.classList.remove('selected'));
    updateExplorerDetails();
  }
}

function explorerContentContextMenu(e) {
  e.preventDefault();
  // Explorer context menu
  showContextMenu(e.clientX, e.clientY, 'file-context-menu');
}

function explorerToggleOrganizeMenu(e) {
  e.stopPropagation();
  alert("Organize Menu:\n- Cut\n- Copy\n- Paste\n- Undo\n- Redo\n- Select all\n- Delete\n- Rename");
}

function explorerShowRecent(e) {
  e.stopPropagation();
  alert(`Recent History:\n${explorerHistory.join('\n')}`);
}

// Helpers for icon & type names
function getIconNameForType(type) {
  switch (type) {
    case 'drive': return 'drive';
    case 'folder': return 'folder';
    case 'app': return 'notepad';
    case 'image': return 'pictures';
    case 'audio': return 'music';
    case 'file': return 'file';
    default: return 'file';
  }
}

function formatTypeName(type) {
  switch (type) {
    case 'drive': return 'Local Disk Drive';
    case 'folder': return 'File folder';
    case 'app': return 'Application';
    case 'image': return 'PNG Image';
    case 'audio': return 'MP3 Audio File';
    case 'file': return 'Text Document';
    default: return 'File';
  }
}

// --- PERSONALIZATION & THEMES ---
function setWallpaperTheme(theme, el) {
  playClickSound();
  document.body.className = `theme-${theme}`;
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
}

function toggleAeroGlass(enabled) {
  document.querySelectorAll('.aero-window, .taskbar, .start-menu').forEach(el => {
    el.style.backdropFilter = enabled ? 'blur(14px) saturate(180%)' : 'none';
    el.style.webkitBackdropFilter = enabled ? 'blur(14px) saturate(180%)' : 'none';
  });
}

function toggleSoundSystem(enabled) {
  soundEnabled = enabled;
}

// --- ABOUT DIALOG ---
function showAboutDialog(appName) {
  document.getElementById('about-window-title').innerText = `About ${appName}`;
  document.getElementById('about-desc-text').innerText = `${appName} running on Windows 7 Aero Mockup. Engineered with vanilla JavaScript, modern CSS Glassmorphism, and responsive interactivity.`;
  openWindow('about');
}

// --- SVG Icons Catalog (Pure Vectors) ---
function getIconSvg(name) {
  switch (name) {
    case 'computer':
      return `<svg viewBox="0 0 48 48"><rect x="6" y="8" width="36" height="24" rx="2" fill="#e1f5fe" stroke="#0288d1" stroke-width="2"/><rect x="10" y="12" width="28" height="16" fill="#0288d1"/><rect x="20" y="32" width="8" height="6" fill="#78909c"/><rect x="14" y="38" width="20" height="3" rx="1" fill="#546e7a"/><circle cx="36" cy="35" r="1.5" fill="#00e676"/></svg>`;
    case 'user':
      return `<svg viewBox="0 0 48 48"><circle cx="24" cy="16" r="9" fill="#5c6bc0"/><path d="M10 40 c0 -9 6 -14 14 -14 s14 5 14 14 Z" fill="#3f51b5"/><circle cx="24" cy="24" r="22" fill="none" stroke="#7986cb" stroke-width="2"/></svg>`;
    case 'network':
      return `<svg viewBox="0 0 48 48"><rect x="6" y="8" width="14" height="10" rx="2" fill="#64b5f6" stroke="#1976d2" stroke-width="2"/><rect x="28" y="8" width="14" height="10" rx="2" fill="#64b5f6" stroke="#1976d2" stroke-width="2"/><rect x="17" y="30" width="14" height="10" rx="2" fill="#64b5f6" stroke="#1976d2" stroke-width="2"/><path d="M13 18 v6 h22 v-6 M24 24 v6" fill="none" stroke="#455a64" stroke-width="2"/></svg>`;
    case 'recycle':
      return `<svg viewBox="0 0 48 48"><rect x="14" y="16" width="20" height="24" rx="2" fill="#90caf9" stroke="#1565c0" stroke-width="2"/><line x1="20" y1="22" x2="20" y2="34" stroke="#1565c0" stroke-width="2"/><line x1="28" y1="22" x2="28" y2="34" stroke="#1565c0" stroke-width="2"/><path d="M10 12 h28 M20 8 h8" stroke="#1565c0" stroke-width="2" stroke-linecap="round"/></svg>`;
    case 'folder':
      return `<svg viewBox="0 0 48 48"><path d="M6 10 h12 l4 4 h20 v26 h-36 z" fill="#fbc02d" stroke="#f57f17" stroke-width="2"/><path d="M6 18 h36 v18 h-36 z" fill="#fff59d" stroke="#fbc02d" stroke-width="1.5"/></svg>`;
    case 'file':
      return `<svg viewBox="0 0 48 48"><path d="M10 6 h20 l10 10 v26 h-30 z" fill="#ffffff" stroke="#90a4ae" stroke-width="2"/><path d="M30 6 v10 h10" fill="#cfd8dc" stroke="#90a4ae" stroke-width="2"/><line x1="16" y1="20" x2="32" y2="20" stroke="#0288d1" stroke-width="2"/><line x1="16" y1="26" x2="32" y2="26" stroke="#78909c" stroke-width="2"/><line x1="16" y1="32" x2="26" y2="32" stroke="#78909c" stroke-width="2"/></svg>`;
    case 'notepad':
      return `<svg viewBox="0 0 48 48"><path d="M10 6 h20 l10 10 v26 h-30 z" fill="#f5f8fc" stroke="#3b7ab8" stroke-width="2"/><path d="M30 6 v10 h10" fill="#d0e2f2" stroke="#3b7ab8" stroke-width="2"/><line x1="16" y1="20" x2="32" y2="20" stroke="#3b7ab8" stroke-width="2"/><line x1="16" y1="26" x2="32" y2="26" stroke="#7090af" stroke-width="2"/><line x1="16" y1="32" x2="24" y2="32" stroke="#7090af" stroke-width="2"/></svg>`;
    case 'calc':
      return `<svg viewBox="0 0 48 48"><rect x="8" y="6" width="32" height="36" rx="4" fill="#37474f" stroke="#212121" stroke-width="2"/><rect x="12" y="10" width="24" height="8" rx="2" fill="#cfd8dc"/><circle cx="16" cy="24" r="2.5" fill="#90caf9"/><circle cx="24" cy="24" r="2.5" fill="#90caf9"/><circle cx="32" cy="24" r="2.5" fill="#ffab91"/><circle cx="16" cy="32" r="2.5" fill="#90caf9"/><circle cx="24" cy="32" r="2.5" fill="#90caf9"/><circle cx="32" cy="32" r="2.5" fill="#a5d6a7"/></svg>`;
    case 'explorer':
      return `<svg viewBox="0 0 48 48"><path d="M6 10 h12 l4 4 h20 v26 h-36 z" fill="#fbc02d" stroke="#f57f17" stroke-width="2"/><path d="M6 18 h36 v18 h-36 z" fill="#ffe082" stroke="#fbc02d" stroke-width="1.5"/></svg>`;
    case 'pictures':
      return `<svg viewBox="0 0 48 48"><rect x="6" y="8" width="36" height="30" rx="3" fill="#81c784" stroke="#2e7d32" stroke-width="2"/><circle cx="16" cy="18" r="4" fill="#fff59d"/><polygon points="10,34 22,20 30,30 38,22 38,34" fill="#1b5e20"/></svg>`;
    case 'music':
      return `<svg viewBox="0 0 48 48"><circle cx="16" cy="32" r="6" fill="#ba68c8"/><circle cx="34" cy="26" r="6" fill="#ba68c8"/><path d="M22 32 v-20 l18 -6 v20" fill="none" stroke="#7b1fa2" stroke-width="3"/></svg>`;
    case 'drive':
      return `<svg viewBox="0 0 48 48"><rect x="6" y="12" width="36" height="24" rx="3" fill="#eceff1" stroke="#546e7a" stroke-width="2"/><circle cx="34" cy="24" r="2.5" fill="#00e676"/><line x1="12" y1="24" x2="26" y2="24" stroke="#90a4ae" stroke-width="3"/></svg>`;
    default:
      return `<svg viewBox="0 0 48 48"><rect x="10" y="8" width="28" height="32" rx="2" fill="#fff" stroke="#999" stroke-width="2"/></svg>`;
  }
}

// --- Global Initialization ---
window.addEventListener('DOMContentLoaded', () => {
  initWindows();
  renderDesktopIcons();
  setupDesktopSelection();
  setupNotepad();
  startClock();

  // Close menus on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.win7-context-menu') && !e.target.closest('.dropdown-menu')) {
      closeAllMenus();
    }
    if (!e.target.closest('.start-menu') && !e.target.closest('.start-orb')) {
      closeStartMenu();
    }
    if (!e.target.closest('.flyout-popup') && !e.target.closest('.tray-volume') && !e.target.closest('.tray-clock')) {
      closeFlyouts();
    }
  });

  // Open Windows Explorer by default at Computer
  explorerNavigateTo('Computer');
  openWindow('explorer');

  // Open Notepad with Welcome.txt
  openFileInNotepad('C:/Users/Mashuke/Desktop/Welcome.txt');

  // Open Calculator
  openWindow('calculator');

  // Play startup sound on user interaction
  window.addEventListener('click', () => {
    if (!audioCtx) initAudio();
  }, { once: true });
});

/* ═══════════════════════════════════════════
   app.js  —  Holy Vibe
   1.  Дані
   2.  Стан
   3.  DOM
   4.  Утиліти
   5.  Стиль
   6.  Рендер вірша
   7.  Навігація
   8.  Свайп / жести
   9.  Шторка
   10. Улюблені
   11. Музика (глобальний плеєр)
   11b.Фони
   12. Налаштування
   13. Сповіщення
   14. Init
═══════════════════════════════════════════ */


/* ─────────────────────────────────────
   1. ДАНІ
───────────────────────────────────── */
const VERSES = [];

const TRACKS = [
  {
    name: "Soaking Prayer — Jesse Quinn",
    src: "https://archive.org/download/soaking-prayer-jesse-quinn/Soaking%20Prayer%20-%20Jesse%20Quinn.mp3"
  },
  {
    name: "Deep Waters — Ambient",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    name: "Evening Peace — Piano",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  }
];

const BACKGROUNDS = [
  { id: 1, url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000", speed: 15, blur: 4, opacity: 0.25 },
  { id: 2, url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=1000", speed: 25, blur: 2, opacity: 0.2 },
  { id: 3, url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1000", speed: 10, blur: 5, opacity: 0.3 },
  { id: 4, url: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=1000", speed: 20, blur: 3, opacity: 0.25 },
  { id: 5, url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1000", speed: 18, blur: 3, opacity: 0.22 },
  { id: 6, url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1000", speed: 12, blur: 6, opacity: 0.28 },
  { id: 7, url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000", speed: 30, blur: 1, opacity: 0.18 },
  { id: 8, url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1000", speed: 14, blur: 4, opacity: 0.24 }
];

BACKGROUNDS.forEach(bg => {
  if (bg.url) {
    const img = new Image();
    img.src = bg.url;
  }
});

const FONTS = {
  cormorant: "'Cormorant Garamond', serif",
  georgia:   "Georgia, serif",
  nunito:    "'Nunito', sans-serif"
};

const COLORS = {
  amber: { bg: "#080c18", text: "#f0e8d5", accent: "#c9a84c", card: "rgba(255,255,255,0.03)" },
  emerald: { bg: "#061210", text: "#e2eedd", accent: "#52b788", card: "rgba(255,255,255,0.02)" },
  sapphire: { bg: "#050b14", text: "#e0e7ff", accent: "#6366f1", card: "rgba(255,255,255,0.03)" },
  amethyst: { bg: "#0a0712", text: "#f5e6ff", accent: "#a855f7", card: "rgba(255,255,255,0.02)" }
};


/* ─────────────────────────────────────
   2. СТАН (STATE)
───────────────────────────────────── */
let currentCat = 'all';
let filteredIndexes = [];
let currentPointer = 0;

let favorites = [];
let alarms = [];
let editingAlarmId = null;

const S = {
  font: 'cormorant',
  color: 'amber',
  shadow: true,
  anim: true,
  stars: true,
  autoBg: true,
  playing: -1
};


/* ─────────────────────────────────────
   3. DOM ЕЛЕМЕНТИ
───────────────────────────────────── */
const $ = id => document.getElementById(id);

const DOM = {
  body:        document.body,
  app:         $('app'),
  scrWord:     $('scrWord'),
  scrFavs:     $('scrFavs'),
  scrMenu:     $('scrMenu'),
  scrLook:     $('scrLook'),
  navWord:     $('navWord'),
  navFavs:     $('navFavs'),
  navMenu:     $('navMenu'),
  navLook:     $('navLook'),
  cardVerse:   $('cardVerse'),
  textBlock:   $('textBlock'),
  bookRef:     $('bookRef'),
  btnFav:      $('btnFav'),
  audioEl:     $('audioEl')
};


/* ─────────────────────────────────────
   4. УТИЛІТИ
───────────────────────────────────── */
function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.innerText = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function safeGetJSON(key, def) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch(e) { return def; }
}

function safeSetJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){}
}


/* ─────────────────────────────────────
   5. СТИЛЬ ТА ОНОВЛЕННЯ ТЕМИ
───────────────────────────────────── */
function applySettingsUI() {
  const theme = COLORS[S.color] || COLORS.amber;
  const root = document.documentElement;

  root.style.setProperty('--clr-deep', theme.bg);
  root.style.setProperty('--text-primary', theme.text);
  root.style.setProperty('--clr-gold', theme.accent);
  root.style.setProperty('--card-bg', theme.card);

  DOM.body.style.fontFamily = FONTS[S.font] || FONTS.cormorant;

  DOM.cardVerse.style.textShadow = S.shadow ? '0 3px 12px rgba(0,0,0,0.8)' : 'none';
  DOM.cardVerse.style.transition = S.anim ? 'transform 0.4s ease, opacity 0.4s ease' : 'none';

  const starsContainer = $('starsContainer');
  if (starsContainer) starsContainer.style.display = S.stars ? 'block' : 'none';

  updateBgOverlay();
}

function loadSettings() {
  const loaded = safeGetJSON('hv_settings', S);
  Object.assign(S, loaded);
  favorites = safeGetJSON('hv_favs', []);
  alarms = safeGetJSON('hv_alarms', []);
  applySettingsUI();
}

function saveSettings() {
  safeSetJSON('hv_settings', S);
}


/* ─────────────────────────────────────
   6. РЕНДЕР ВІРША
───────────────────────────────────── */
function renderCurrentVerse() {
  if (filteredIndexes.length === 0) {
    DOM.textBlock.innerHTML = "Немає віршів у цій категорії";
    DOM.bookRef.innerText = "";
    DOM.btnFav.classList.remove('active');
    return;
  }

  const idx = filteredIndexes[currentPointer];
  const item = VERSES[idx];
  if (!item) return;

  DOM.textBlock.innerHTML = item.text.replace(/\n/g, '<br>');
  DOM.bookRef.innerText = `${item.book} ${item.ref}`;

  const isFav = favorites.includes(item.id);
  DOM.btnFav.classList.toggle('active', isFav);

  updateBgOverlay();
}


/* ─────────────────────────────────────
   7. НАВІГАЦІЯ ТА ЕКРАНИ
───────────────────────────────────── */
function switchScreen(target) {
  const screens = [DOM.scrWord, DOM.scrFavs, DOM.scrMenu, DOM.scrLook];
  screens.forEach(s => s && s.classList.remove('active'));
  
  const navs = [DOM.navWord, DOM.navFavs, DOM.navMenu, DOM.navLook];
  navs.forEach(n => n && n.classList.remove('active'));

  if (target === 'word' && DOM.scrWord) { DOM.scrWord.classList.add('active'); DOM.navWord.classList.add('active'); }
  if (target === 'favs' && DOM.scrFavs) { DOM.scrFavs.classList.add('active'); DOM.navFavs.classList.add('active'); renderFavList(); }
  if (target === 'menu' && DOM.scrMenu) { DOM.scrMenu.classList.add('active'); DOM.navMenu.classList.add('active'); renderMenuTracklist(); }
  if (target === 'look' && DOM.scrLook) { DOM.scrLook.classList.add('active'); DOM.navLook.classList.add('active'); }
}

if (DOM.navWord) DOM.navWord.addEventListener('click', () => switchScreen('word'));
if (DOM.navFavs) DOM.navFavs.addEventListener('click', () => switchScreen('favs'));
if (DOM.navMenu) DOM.navMenu.addEventListener('click', () => switchScreen('menu'));
if (DOM.navLook) DOM.navLook.addEventListener('click', () => switchScreen('look'));


/* ─────────────────────────────────────
   8. СВАЙПИ / ЖЕСТИ (ГОЛОВНИЙ ЕКРАН)
───────────────────────────────────── */
let touchStartX = 0;
let touchStartY = 0;

if (DOM.scrWord) {
  DOM.scrWord.addEventListener('touchstart', e => {
    if (e.target.closest('#bottomSheet') || e.target.closest('.cats-scroll')) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  DOM.scrWord.addEventListener('touchend', e => {
    if (e.target.closest('#bottomSheet') || e.target.closest('.cats-scroll')) return;
    const deltaX = e.changedTouches[0].screenX - touchStartX;
    const deltaY = e.changedTouches[0].screenY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) nextVerse();
      else prevVerse();
    }
  }, { passive: true });
}

function nextVerse() {
  if (filteredIndexes.length <= 1) return;
  if (S.anim) {
    DOM.cardVerse.style.transform = 'translateX(-30px)';
    DOM.cardVerse.style.opacity = '0';
    setTimeout(() => {
      currentPointer = (currentPointer + 1) % filteredIndexes.length;
      renderCurrentVerse();
      DOM.cardVerse.style.transform = 'translateX(30px)';
      setTimeout(() => {
        DOM.cardVerse.style.transform = 'translateX(0)';
        DOM.cardVerse.style.opacity = '1';
      }, 30);
    }, 200);
  } else {
    currentPointer = (currentPointer + 1) % filteredIndexes.length;
    renderCurrentVerse();
  }
}

function prevVerse() {
  if (filteredIndexes.length <= 1) return;
  if (S.anim) {
    DOM.cardVerse.style.transform = 'translateX(30px)';
    DOM.cardVerse.style.opacity = '0';
    setTimeout(() => {
      currentPointer = (currentPointer - 1 + filteredIndexes.length) % filteredIndexes.length;
      renderCurrentVerse();
      DOM.cardVerse.style.transform = 'translateX(-30px)';
      setTimeout(() => {
        DOM.cardVerse.style.transform = 'translateX(0)';
        DOM.cardVerse.style.opacity = '1';
      }, 30);
    }, 200);
  } else {
    currentPointer = (currentPointer - 1 + filteredIndexes.length) % filteredIndexes.length;
    renderCurrentVerse();
  }
}


/* ─────────────────────────────────────
   9. НИЖНЯ ШТОРКА ТА AI ТЛУМАЧЕННЯ
───────────────────────────────────── */
let sheetOpen = false;

if ($('btnOpenSheet')) {
  $('btnOpenSheet').addEventListener('click', () => {
    if (filteredIndexes.length === 0) return;
    sheetOpen = !sheetOpen;
    $('bottomSheet').classList.toggle('open', sheetOpen);

    if (sheetOpen) {
      const idx = filteredIndexes[currentPointer];
      const item = VERSES[idx];
      $('aiAnswer').innerText = item ? item.ai : "Тлумачення недоступне.";
    }
  });
}

if ($('sheetCloseZone')) {
  $('sheetCloseZone').addEventListener('click', () => {
    sheetOpen = false;
    $('bottomSheet').classList.remove('open');
  });
}


/* ─────────────────────────────────────
   10. УЛЮБЛЕНІ (FAVORITES)
───────────────────────────────────── */
if (DOM.btnFav) {
  DOM.btnFav.addEventListener('click', () => {
    if (filteredIndexes.length === 0) return;
    const idx = filteredIndexes[currentPointer];
    const item = VERSES[idx];
    if (!item) return;

    const fIdx = favorites.indexOf(item.id);
    if (fIdx > -1) {
      favorites.splice(fIdx, 1);
      DOM.btnFav.classList.remove('active');
      showToast('Видалено з улюблених');
    } else {
      favorites.push(item.id);
      DOM.btnFav.classList.add('active');
      showToast('Додано в улюблені');
    }
    safeSetJSON('hv_favs', favorites);
  });
}

function renderFavList() {
  const box = $('favList');
  if (!box) return;
  box.innerHTML = '';
  
  const favItems = VERSES.filter(v => favorites.includes(v.id));

  if (favItems.length === 0) {
    box.innerHTML = '<div class="notif-empty">Тут з’являться ваші улюблені вірші. Натисніть серце на головному екрані.</div>';
    return;
  }

  favItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'fav-card';
    card.innerHTML = `
      <div class="fav-text">${item.text.replace(/\n/g, '<br>')}</div>
      <div class="fav-footer">
        <div class="fav-ref">${item.book} ${item.ref}</div>
        <div class="fav-del" data-id="${item.id}">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M4.5 3.5V2a1 1 0 011-1h3a1 1 0 011 1v1.5M11 3.5v8a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 013 11.5v-8" stroke="#ff6b6b" stroke-width="1.2"/><path d="M5.5 6v4M8.5 6v4" stroke="#ff6b6b" stroke-width="1.2" stroke-linecap="round"/></svg>
        </div>
      </div>
    `;
    card.querySelector('.fav-del').addEventListener('click', (e) => {
      e.stopPropagation();
      favorites = favorites.filter(id => id !== item.id);
      safeSetJSON('hv_favs', favorites);
      renderFavList();
      renderCurrentVerse();
    });
    box.appendChild(card);
  });
}


/* ─────────────────────────────────────
   11. МУЗИКА (ГЛОБАЛЬНИЙ ПЛЕЄР)
───────────────────────────────────── */
const audioEl = DOM.audioEl;

function renderMenuTracklist() {
  const container = $('menuTracklist');
  if (!container) return;
  container.innerHTML = '';

  TRACKS.forEach((track, index) => {
    const item = document.createElement('div');
    item.className = `track-item ${S.playing === index ? 'active' : ''}`;
    item.innerHTML = `
      <div class="track-info">
        <div class="track-name">${track.name}</div>
      </div>
      <div class="track-btn">
        ${S.playing === index ? 
          '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2h3v10H3V2zm5 0h3v10H8V2z"/></svg>' : 
          '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M4 2l7 5-7 5V2z"/></svg>'}
      </div>
    `;

    item.addEventListener('click', () => toggleTrack(index));
    container.appendChild(item);
  });
}

function toggleTrack(index) {
  if (S.playing === index) {
    audioEl.pause();
    S.playing = -1;
  } else {
    S.playing = index;
    audioEl.src = TRACKS[index].src;
    audioEl.play().catch(err => {
      console.log("Audio play failed:", err);
      showToast("❌ Помилка завантаження треку");
    });

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: TRACKS[index].name,
        artist: 'Holy Vibe Player',
        album: 'Духовна атмосфера'
      });
      navigator.mediaSession.playbackState = 'playing';
    }
  }
  saveSettings();
  renderMenuTracklist();
  updatePlayerBar();
}

function updatePlayerBar() {
  const bar = $('playerBar');
  if (!bar) return;
  if (S.playing >= 0) {
    $('barTrackName').innerText = TRACKS[S.playing].name;
    bar.classList.add('active');
  } else {
    bar.classList.remove('active');
  }
}

if ($('barPlayBtn')) {
  $('barPlayBtn').addEventListener('click', () => {
    if (S.playing >= 0) {
      toggleTrack(S.playing);
    }
  });
}

if (audioEl) {
  audioEl.addEventListener('play', () => {
    if ($('barPlayBtn')) $('barPlayBtn').innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2h3v10H3V2zm5 0h3v10H8V2z"/></svg>';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  });

  audioEl.addEventListener('pause', () => {
    if ($('barPlayBtn')) $('barPlayBtn').innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M4 2l7 5-7 5V2z"/></svg>';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  });
}


/* ─────────────────────────────────────
   11b. АВТО-ФОНИ ТА КІНЕМАТОГРАФІЧНІСТЬ
───────────────────────────────────── */
function updateBgOverlay() {
  const overlay = $('bgOverlay');
  if (!overlay) return;

  if (!S.autoBg || filteredIndexes.length === 0) {
    overlay.style.backgroundImage = 'none';
    overlay.className = 'bg-overlay';
    return;
  }

  const idx = filteredIndexes[currentPointer];
  const item = VERSES[idx];
  if (!item) return;

  const bgConfig = BACKGROUNDS.find(bg => bg.id === item.id);

  if (bgConfig && bgConfig.url) {
    overlay.style.backgroundImage = `url('${bgConfig.url}')`;
    overlay.style.filter = `blur(${bgConfig.blur || 3}px)`;
    overlay.style.opacity = bgConfig.opacity || 0.2;

    overlay.className = 'bg-overlay';
    void overlay.offsetWidth; 
    
    overlay.classList.add('animated-bg');
    overlay.style.animationDuration = `${bgConfig.speed || 20}s`;
  } else {
    overlay.style.backgroundImage = 'none';
    overlay.className = 'bg-overlay';
  }
}


/* ─────────────────────────────────────
   12. НАЛАШТУВАННЯ ТА ВИГЛЯД
───────────────────────────────────── */
document.querySelectorAll('.font-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.font-opt').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    S.font = opt.dataset.font;
    saveSettings();
    applySettingsUI();
  });
});

document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    S.color = dot.dataset.color;
    saveSettings();
    applySettingsUI();
  });
});

if ($('tglShadow')) {
  $('tglShadow').addEventListener('click', () => {
    S.shadow = !S.shadow;
    $('tglShadow').classList.toggle('on', S.shadow);
    saveSettings();
    applySettingsUI();
  });
}

if ($('tglAnim')) {
  $('tglAnim').addEventListener('click', () => {
    S.anim = !S.anim;
    $('tglAnim').classList.toggle('on', S.anim);
    saveSettings();
    applySettingsUI();
  });
}

if ($('tglStars')) {
  $('tglStars').addEventListener('click', () => {
    S.stars = !S.stars;
    $('tglStars').classList.toggle('on', S.stars);
    saveSettings();
    applySettingsUI();
  });
}

if ($('tglAutoBg')) {
  $('tglAutoBg').addEventListener('click', () => {
    S.autoBg = !S.autoBg;
    $('tglAutoBg').classList.toggle('on', S.autoBg);
    saveSettings();
    applySettingsUI();
  });
}


/* ─────────────────────────────────────
   13. СЛУЖБА СПОВІЩЕНЬ (ALARM MANAGER BRIDGE)
───────────────────────────────────── */
function saveAlarms() {
  safeSetJSON('hv_alarms', alarms);
}

function syncAlarmsToAndroid() {
  if (typeof AndroidBridge !== 'undefined' && AndroidBridge.scheduleNotifications) {
    const jsonStr = JSON.stringify(alarms);
    AndroidBridge.scheduleNotifications(jsonStr);
  }
}

function renderNotifList() {
  const box = $('notifList');
  if (!box) return;
  box.innerHTML = '';

  if (alarms.length === 0) {
    box.innerHTML = '<div class="notif-empty">Немає запланованих нагадувань.</div>';
    return;
  }

  alarms.forEach(alarm => {
    const item = document.createElement('div');
    item.className = `notif-item ${alarm.active ? '' : 'disabled'}`;
    
    const timeStr = `${String(alarm.hour).padStart(2,'0')}:${String(alarm.minute).padStart(2,'0')}`;
    const daysStr = alarm.days.length === 7 ? 'Щодня' : alarm.days.length === 0 ? 'Один раз' : alarm.days.map(d => ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'][d]).join(', ');

    item.innerHTML = `
      <div class="notif-info">
        <div class="notif-time">${timeStr}</div>
        <div class="notif-days">${alarm.label} • ${daysStr}</div>
      </div>
      <div class="notif-actions">
        <div class="notif-toggle ${alarm.active ? 'on' : ''}"></div>
        <div class="notif-del-btn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M4.5 3.5V2a1 1 0 011-1h3a1 1 0 011 1v1.5M11 3.5v8a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 013 11.5v-8" stroke="rgba(255,255,255,0.4)" stroke-width="1.2"/></svg>
        </div>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.notif-toggle') || e.target.closest('.notif-del-btn')) return;
      openAlarmModal(alarm.id);
    });

    item.querySelector('.notif-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      alarm.active = !alarm.active;
      saveAlarms();
      syncAlarmsToAndroid();
      renderNotifList();
    });

    item.querySelector('.notif-del-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      alarms = alarms.filter(a => a.id !== alarm.id);
      saveAlarms();
      syncAlarmsToAndroid();
      renderNotifList();
      showToast('🗑️ Нагадування видалено');
    });

    box.appendChild(item);
  });
}

function openAlarmModal(id = null) {
  editingAlarmId = id;
  const modal = $('alarmModal');
  if (!modal) return;
  modal.style.display = 'flex';

  document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));

  if (id !== null) {
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
      $('alarmTime').value = `${String(alarm.hour).padStart(2,'0')}:${String(alarm.minute).padStart(2,'0')}`;
      $('alarmLabel').value = alarm.label || '';
      alarm.days.forEach(d => {
        const btn = document.querySelector(`.day-btn[data-day="${d}"]`);
        if (btn) btn.classList.add('active');
      });
      $('modalTitle').innerText = 'Редагувати нагадування';
    }
  } else {
    $('alarmTime').value = "08:00";
    $('alarmLabel').value = "";
    document.querySelectorAll('.day-btn').forEach(b => b.add && b.classList.add('active'));
    $('modalTitle').innerText = 'Нове нагадування';
  }
}

function closeAlarmModal() {
  if ($('alarmModal')) $('alarmModal').style.display = 'none';
  editingAlarmId = null;
}

if ($('btnNewNotif')) $('btnNewNotif').addEventListener('click', () => openAlarmModal(null));
if ($('btnCancelAlarm')) $('btnCancelAlarm').addEventListener('click', closeAlarmModal);

document.querySelectorAll('.day-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
  });
});

if ($('btnSaveAlarm')) {
  $('btnSaveAlarm').addEventListener('click', () => {
    const timeVal = $('alarmTime').value;
    if (!timeVal) return;

    const [hStr, mStr] = timeVal.split(':');
    const h = parseInt(hStr);
    const m = parseInt(mStr);

    const days = [];
    document.querySelectorAll('.day-btn').forEach(b => {
      if (b.classList.contains('active')) {
        days.push(parseInt(b.dataset.day));
      }
    });

    if (editingAlarmId !== null) {
      const alarm = alarms.find(a => a.id === editingAlarmId);
      if (alarm) {
        alarm.hour   = h;
        alarm.minute = m;
        alarm.days   = days;
        alarm.label  = $('alarmLabel').value.trim() || 'Нагадування';
        alarm.active = true;
      }
    } else {
      const newId = Date.now() % 100000;
      alarms.push({ id: newId, hour: h, minute: m, days, label: $('alarmLabel').value.trim() || 'Нагадування', active: true });
    }

    saveAlarms();
    syncAlarmsToAndroid();
    renderNotifList();
    closeAlarmModal();
    showToast('✅ Нагадування збережено');
  });
}


/* ─────────────────────────────────────
   14. INIT (ІНІЦІАЛІЗАЦІЯ)
───────────────────────────────────── */
loadSettings();

document.querySelectorAll('.font-opt').forEach(o =>
  o.classList.toggle('active', o.dataset.font === S.font));
document.querySelectorAll('.color-dot').forEach(d =>
  d.classList.toggle('active', d.dataset.color === S.color));
if ($('tglShadow')) $('tglShadow').classList.toggle('on', S.shadow);
if ($('tglAnim')) $('tglAnim').classList.toggle('on', S.anim);
if ($('tglStars')) $('tglStars').classList.toggle('on', S.stars);
if ($('tglAutoBg')) $('tglAutoBg').classList.toggle('on', S.autoBg);

updatePlayerBar();
renderNotifList();

document.querySelectorAll('.cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentCat = pill.dataset.cat;
    rebuildIndexes();
  });
});

function rebuildIndexes() {
  filteredIndexes = [];
  VERSES.forEach((v, idx) => {
    if (currentCat === 'all' || v.cat === currentCat) {
      filteredIndexes.push(idx);
    }
  });
  currentPointer = 0;
  renderCurrentVerse();
}

function fetchVerses() {
  fetch('verses.json')
    .then(res => res.json())
    .then(data => {
      if (data && data.verses) {
        VERSES.push(...data.verses);
        rebuildIndexes();
      }
    })
    .catch(err => {
      console.log("Fetch verses error:", err);
      showToast("❌ Помилка завантаження бази даних віршів");
    });
}

fetchVerses();
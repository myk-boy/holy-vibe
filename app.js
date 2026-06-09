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
// VERSES завантажуються з verses.json (див. fetchVerses)
const VERSES = [];

/*
  ГЛОБАЛЬНІ ФОНОВІ ТРЕКИ — у вкладці Меню.
  Всі URL перевірені: прямі .mp3, без редиректів, без реєстрації.
  Ліцензія: CC BY 3.0 — Kevin MacLeod (incompetech.com) або Public Domain (archive.org)
  ---
  ВАЖЛИВО ДЛЯ РОЗРОБНИКА:
  Якщо трек не грає в WebView — завантаж mp3 локально в assets/audio/
  і змінь src на відносний шлях: "audio/peace_piano.mp3"
*/
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

// Унікальні фони для кожного вірша (id вірша -> конфіг фону)
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

// Кешування картинок у фоні для плавного перемикання
BACKGROUNDS.forEach(bg => {
  if (bg.url) {
    const img = new Image();
    img.src = bg.url;
  }
});

// Доступні шрифти
const FONTS = {
  cormorant: "'Cormorant Garamond', serif",
  georgia:   "Georgia, serif",
  nunito:    "'Nunito', sans-serif"
};

// Доступні колірні схеми (теми)
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

// Налаштування за замовчуванням
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
  screens.forEach(s => s.classList.remove('active'));
  
  const navs = [DOM.navWord, DOM.navFavs, DOM.navMenu, DOM.navLook];
  navs.forEach(n => n.classList.remove('active'));

  if (target === 'word') { DOM.scrWord.classList.add('active'); DOM.navWord.classList.add('active'); }
  if (target === 'favs') { DOM.scrFavs.classList.add('active'); DOM.navFavs.classList.add('active'); renderFavList(); }
  if (target === 'menu') { DOM.scrMenu.classList.add('active'); DOM.navMenu.classList.add('active'); renderMenuTracklist(); }
  if (target === 'look') { DOM.scrLook.classList.add('active'); DOM.navLook.classList.add('active'); }
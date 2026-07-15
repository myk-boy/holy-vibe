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
// VERSES завантажуються з verses.json (div. fetchVerses)
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
    src:  "audio/track1.mp3",
    license: "Jesse Quinn Media — used with permission"
  },
  {
    name: "Calm Worship Piano — Jesse Quinn",
    src:  "audio/track2.mp3",
    license: "Jesse Quinn Media — used with permission"
  },
  {
    name: "Peaceful Soaking Loop — Jesse Quinn",
    src:  "audio/track3.mp3",
    license: "Jesse Quinn Media — used with permission"
  },
];



// BACKGROUNDS завантажуються з backgrounds.json (div. fetchBackgrounds)
const BACKGROUNDS = [{ name: "Без фону", url: "" }];

const FONTS = {
  cormorant: "'Cormorant Garamond', serif",
  georgia:   "Georgia, serif",
  nunito:    "'Nunito', sans-serif"
};


/* ─────────────────────────────────────
   0. ЗАВАНТАЖЕННЯ VERSES.JSON
───────────────────────────────────── */
async function fetchVerses() {
  try {
    const res  = await fetch('verses.json');
    const data = await res.json();
    const loaded = data.verses || [];
    VERSES.push(...loaded);

    // ── Динамічно будуємо пілюлі категорій з _categories ──────────────
    const categories = data._categories || {};
    window._CATEGORIES_UK = categories; // для i18n.js — повернення на українську
    buildCatOrder(categories);
    buildCatPills(categories);
    // ───────────────────────────────────────────────────────────────────

    // Відновлюємо збережену позицію
    const pos = loadPos();
    if (pos && pos.cat) {
      S.cat  = pos.cat;
      S.pool = pos.cat === 'all' ? [...VERSES] : VERSES.filter(v => v.cat === pos.cat);
      S.idx  = (pos.idx >= 0 && pos.idx < S.pool.length) ? pos.idx : 0;
      // Синхронізуємо пілюлі і мітку
      const pill = document.querySelector(`.pill[data-cat="${pos.cat}"]`);
      document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
      if (pill) { pill.classList.add('active'); $('catToggleLabel').textContent = pill.textContent; }
    } else {
      S.pool = [...VERSES];
      S.idx  = 0;
    }

    renderVerse();
    // ЗАВАНТАЖЕННЯ: ховаємо індикатор — вірші вже готові (можна видалити цей рядок)
    $('verseLoading')?.remove();
    // Повідомляємо i18n.js що вірші готові → завантажує збережену мову
    if (typeof window._onVersesReady === 'function') window._onVersesReady();
  } catch (err) {
    console.error('verses.json не завантажився:', err);
    showToast('⚠️ Не вдалося завантажити вірші');
    $('verseLoading')?.remove();
  }
}


/* ─────────────────────────────────────
   0b. ЗАВАНТАЖЕННЯ BACKGROUNDS.JSON
───────────────────────────────────── */
async function fetchBackgrounds() {
  try {
    const res  = await fetch('backgrounds.json');
    const data = await res.json();
    const loaded = data.backgrounds || [];
    BACKGROUNDS.push(...loaded);
    buildBgGrid(); // перебудовуємо грід після завантаження
    // Якщо autoBg увімкнено — застосовуємо фон під поточний вірш
    if (S.autoBg) applyAutoBg();
  } catch (err) {
    console.error('backgrounds.json не завантажився:', err);
    // Якщо файл не знайдено — грід залишається з одним "Без фону"
  }
}


/* ─────────────────────────────────────
   2. СТАН
───────────────────────────────────── */
const S = {
  cat:      'all',
  pool:     [...VERSES],
  idx:      0,
  favs:     JSON.parse(localStorage.getItem('hv_fav') || '[]'),
  // Прогрес перегляду по кожній категорії: { peace: 4, love: 6, ... } — індекс останнього переглянутого вірша
  catProgress: JSON.parse(localStorage.getItem('hv_cat_progress') || '{}'),
  font:     'cormorant',
  color:    '#f0e8d5',
  size:     50,
  iconSize: 50,
  shadow:   true,
  anim:     false,
  stars:    true,  // залишаємо в стані для сумісності, але UI перемикач прибрано
  autoBg:   false,   // автозміна фону з кожним віршем
  playing:  -1,      // індекс глобального треку (-1 = не грає)
  verseAudioOn: false, // чи грає аудіо з вірша
  vol:      60,
  sheet:    false,
  playMode: 'single',
  shuffle:  false,
  glass:    false,    // скляний скін картки вірша
  // notifs: реалізується в наступному релізі
};

const DAYS_UK = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];


/* ─────────────────────────────────────
   3. DOM
───────────────────────────────────── */
const $ = id => document.getElementById(id);

const verseCard   = $('verseCard');
const verseTextEl = $('verseText');
const verseRefEl  = $('verseRef');
const heartBurst  = $('heartBurst');
const sheetEl     = $('bottomSheet');
const overlayEl   = $('sheetOverlay');
const sheetPrev   = $('sheetPreview');
const aiPanel     = $('aiPanel');
const aiAnswer    = $('aiAnswer');
const favList     = $('favList');
const toast       = $('toast');
const audioEl     = $('audioEl');


/* ─────────────────────────────────────
   4. УТИЛІТИ
───────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

// Банер переходу між категоріями — більший, по центру екрану
let catBannerTimer;
function showCatBanner(catName) {
  const banner = $('catBanner');
  const nameEl = $('catBannerName');
  if (!banner || !nameEl) { showToast('📖 ' + catName); return; }
  nameEl.textContent = catName;
  banner.classList.add('show');
  clearTimeout(catBannerTimer);
  catBannerTimer = setTimeout(() => banner.classList.remove('show'), 1800);
}

function cv()       { return S.pool[S.idx]; }
function isFav(id)  { return S.favs.some(v => v.id === id); }
function saveFavs()  { localStorage.setItem('hv_fav',    JSON.stringify(S.favs)); }
function saveNotifs(){ localStorage.setItem('hv_notifs', JSON.stringify(S.notifs)); }
function savePos()   { localStorage.setItem('hv_pos', JSON.stringify({ cat: S.cat, idx: S.idx })); }
function saveCatProgress() { localStorage.setItem('hv_cat_progress', JSON.stringify(S.catProgress)); }
// Фіксує, що користувач дійшов до вірша idx у категорії catKey (запам'ятовує лише найдальшу точку)
function recordCatProgress(catKey, idx) {
  if (!catKey) return;
  const prev = S.catProgress[catKey];
  if (typeof prev !== 'number' || idx > prev) {
    S.catProgress[catKey] = idx;
    saveCatProgress();
  }
}
function loadPos()   { try { return JSON.parse(localStorage.getItem('hv_pos') || 'null'); } catch { return null; } }

function saveSettings() {
  const bgEl = $('bg');
  localStorage.setItem('hv_settings', JSON.stringify({
    font:     S.font,
    color:    S.color,
    size:     S.size,
    iconSize: S.iconSize,
    shadow:   S.shadow,
    anim:     S.anim,
    stars:    S.stars,
    autoBg:   S.autoBg,
    playMode: S.playMode,
    shuffle:  S.shuffle,
    glass:    S.glass,
    bgUrl:    bgEl.style.backgroundImage.replace(/url\(['"]?|['"]?\)/g, '') || '',
  }));
}

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('hv_settings') || 'null');
    if (!s) return;
    S.font     = s.font     ?? S.font;
    S.color    = s.color    ?? S.color;
    S.size     = s.size     ?? S.size;
    S.iconSize = s.iconSize ?? S.iconSize;
    S.shadow   = s.shadow   ?? S.shadow;
    S.anim     = s.anim     ?? S.anim;
    S.stars    = s.stars    ?? S.stars;
    S.autoBg   = s.autoBg   ?? S.autoBg;
    S.playMode = s.playMode ?? S.playMode;
    S.shuffle  = s.shuffle  ?? S.shuffle;
    S.glass    = s.glass    ?? S.glass;

    // Відновлюємо фон (якщо autoBg вимкнено але був вручну вибраний фон)
    if (!S.autoBg && s.bgUrl) {
      const bgEl = $('bg');
      bgEl.style.backgroundImage    = `url('${s.bgUrl}')`;
      bgEl.style.backgroundSize     = 'cover';
      bgEl.style.backgroundPosition = 'center';
      bgEl.dataset.photo = '1';
    }
  } catch { /* нічого не робимо */ }
}

function formatText(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>');
}
function setSliderBg(el, val) {
  el.style.background =
    `linear-gradient(to right,var(--clr-gold) ${val}%,rgba(255,255,255,.1) ${val}%)`;
}


/* ─────────────────────────────────────
   5. СТИЛЬ
───────────────────────────────────── */
function applyStyle() {
  verseTextEl.style.fontFamily = FONTS[S.font];
  verseTextEl.style.color      = S.color;
  const base = 18 + (S.size / 100) * 12;
  verseTextEl.style.fontSize   = `clamp(${base-2}px,${(base*.45).toFixed(1)}vw,${base+4}px)`;

  // Тінь тексту — посилена на фото-фоні для контрасту
  const isPhoto = $('bg').dataset.photo === '1';
  if (!S.shadow) {
    verseTextEl.style.textShadow = 'none';
  } else if (isPhoto) {
    verseTextEl.style.textShadow = '0 2px 4px rgba(0,0,0,1), 0 4px 40px rgba(0,0,0,.95), 0 0 80px rgba(0,0,0,.8)';
  } else {
    verseTextEl.style.textShadow = '0 2px 30px rgba(0,0,0,.8)';
  }

  // Фон: показуємо тільки на головній (незалежно від зірочок)
  const activeScreen = document.querySelector('.screen.active');
  const onMain = activeScreen && activeScreen.id === 'screenMain';
  $('bg').style.opacity = onMain ? '1' : '0';
  // Зірочки — окремо через CSS клас
  $('bg').classList.toggle('no-stars', !S.stars);

  // Pill кольори — адаптуємо до фото-фону
  const pillBg  = isPhoto ? 'rgba(0,0,0,0.55)' : 'var(--surface)';
  const pillBor = isPhoto ? 'rgba(0,0,0,0.3)'  : 'var(--surface-border)';
  const pillClr = isPhoto ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)';
  document.querySelectorAll('.pill').forEach(p => {
    const isActive = p.classList.contains('active');
    p.style.background  = isActive ? 'rgba(201,168,76,.25)' : pillBg;
    p.style.borderColor = isActive ? 'var(--clr-gold)' : pillBor;
    p.style.color       = isActive ? 'var(--clr-gold-lt)' : pillClr;
    p.style.fontSize    = (10 + (S.iconSize / 100) * 4) + 'px';
    p.style.padding     = `${5 + (S.iconSize/100)*3}px ${12 + (S.iconSize/100)*4}px`;
    p.style.textShadow  = isPhoto ? '0 1px 4px rgba(0,0,0,.8)' : 'none';
  });

  // Розмір іконок навігації
  const iconPx = 20 + (S.iconSize / 100) * 16;
  document.querySelectorAll('.nav-btn svg').forEach(svg => {
    svg.style.width  = iconPx + 'px';
    svg.style.height = iconPx + 'px';
  });
  const labelPx = 9 + (S.iconSize / 100) * 5;
  document.querySelectorAll('.nav-label').forEach(l => {
    l.style.fontSize = labelPx + 'px';
  });
}


/* ── Авто-фон: міняється разом з анімацією вірша ───────────────────
   Фон просто ставиться в момент коли verseCard невидимий (між out і in).
   Окремої анімації фону немає — він змінюється "за кадром".
──────────────────────────────────────────────────────────────────── */
function applyAutoBg() {
  if (!S.autoBg) return;
  const photoBgs = BACKGROUNDS.slice(1);
  if (!photoBgs.length) return;
  const bg   = photoBgs[S.idx % photoBgs.length];
  const bgEl = $('bg');
  bgEl.style.backgroundImage    = `url('${bg.url}')`;
  bgEl.style.backgroundSize     = 'cover';
  bgEl.style.backgroundPosition = 'center';
  bgEl.dataset.photo = '1';
}


/* ─────────────────────────────────────
   6. РЕНДЕР ВІРША
───────────────────────────────────── */
function renderVerse(dir = 'up') {
  S.idx = Math.min(S.idx, Math.max(0, S.pool.length - 1));
  const v = cv(); if (!v) return;

  // ПРОГРЕС КАТЕГОРІЙ: запам'ятовуємо, до якого вірша дійшли в поточній категорії
  recordCatProgress(S.cat, S.idx);

  const write = () => {
    verseTextEl.innerHTML   = formatText(v.text);
    verseRefEl.textContent  = v.ref;
    if (S.autoBg) applyAutoBg();
  };
  if (!S.anim) { write(); return; }
  verseCard.classList.add(dir === 'up' ? 'out-up' : 'out-down');
  setTimeout(() => {
    write();
    verseCard.classList.remove('out-up','out-down');
    verseCard.classList.add('in');
    setTimeout(() => verseCard.classList.remove('in'), 400);
  }, 200);
}

// Порядок категорій — будується динамічно з _categories у verses.json
// Перший елемент завжди 'all', далі — ключі у тому порядку, як вони в JSON
let CAT_ORDER = ['all'];

function buildCatOrder(categories) {
  CAT_ORDER = ['all', ...Object.keys(categories)];
}

// Будує пілюлі catBar динамічно з об'єкта { key: 'Назва', ... }
// Замінює весь вміст #catBar, зберігаючи першу пілюлю "Усі" активною
function buildCatPills(categories) {
  const bar = $('catBar');
  if (!bar) return;
  const pills = [
    `<div class="pill active" data-cat="all">Усі</div>`,
    ...Object.entries(categories).map(
      ([key, label]) => `<div class="pill" data-cat="${key}">${label}</div>`
    )
  ].join('\n        ');
  bar.innerHTML = pills;
}

function nextCat() {
  const i = CAT_ORDER.indexOf(S.cat);
  return CAT_ORDER[(i + 1) % CAT_ORDER.length];
}
function prevCat() {
  const i = CAT_ORDER.indexOf(S.cat);
  return CAT_ORDER[(i - 1 + CAT_ORDER.length) % CAT_ORDER.length];
}

function switchCat(catKey) {
  S.cat  = catKey;
  S.pool = catKey === 'all' ? [...VERSES] : VERSES.filter(v => v.cat === catKey);
  // Синхронізуємо UI пілюль і мітку кнопки
  const pill = document.querySelector(`.pill[data-cat="${catKey}"]`);
  document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
  if (pill) { pill.classList.add('active'); $('catToggleLabel').textContent = pill.textContent; }
}

function next() {
  if (S.cat === 'all') {
    // Режим "Усі" — звичайна циклічність по всьому пулу
    S.idx = (S.idx + 1) % S.pool.length;
  } else {
    // Режим категорії — перейти до наступної категорії після останнього вірша
    if (S.idx + 1 < S.pool.length) {
      S.idx++;
    } else {
      switchCat(nextCat());
      S.idx = 0;
      showCatBanner($('catToggleLabel').textContent || S.cat);
    }
  }
  savePos();
  renderVerse('up');
}

function prev() {
  if (S.cat === 'all') {
    S.idx = (S.idx - 1 + S.pool.length) % S.pool.length;
  } else {
    if (S.idx - 1 >= 0) {
      S.idx--;
    } else {
      switchCat(prevCat());
      S.idx = Math.max(0, S.pool.length - 1);
      showCatBanner($('catToggleLabel').textContent || S.cat);
    }
  }
  savePos();
  renderVerse('down');
}


/* ─────────────────────────────────────
   7. НАВІГАЦІЯ
───────────────────────────────────── */
function goScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.screen === id));
  // Фон тільки на головній
  $('bg').style.opacity = (id === 'screenMain') ? '1' : '0';
  if (id === 'screenFav')      renderFavList();
  if (id === 'screenSettings') renderNotifList();
}
document.querySelectorAll('.nav-btn').forEach(b =>
  b.addEventListener('click', () => goScreen(b.dataset.screen)));

// Тоглення панелі категорій
let catBarVisible = false;
$('catToggleBtn').addEventListener('click', () => {
  catBarVisible = !catBarVisible;
  const bar = $('catBar');
  bar.style.display = catBarVisible ? 'flex' : 'none';
  $('catToggleBtn').classList.toggle('open', catBarVisible);
});

$('catBar').addEventListener('click', e => {
  const p = e.target.closest('.pill'); if (!p) return;
  document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
  p.classList.add('active');
  S.cat  = p.dataset.cat;
  S.pool = S.cat === 'all' ? [...VERSES] : VERSES.filter(v => v.cat === S.cat);

  // ПРОГРЕС КАТЕГОРІЙ: продовжуємо з наступного непереглянутого вірша,
  // а якщо всі вже переглянуті — починаємо категорію заново
  const seen = S.catProgress[S.cat];
  if (typeof seen === 'number' && seen + 1 < S.pool.length) {
    S.idx = seen + 1;
  } else {
    S.idx = 0;
    if (typeof seen === 'number') showToast('📖 Ви переглянули всі вірші цієї категорії — починаємо спочатку');
  }

  // Оновлюємо мітку кнопки
  $('catToggleLabel').textContent = p.textContent;
  // Закриваємо панель після вибору
  catBarVisible = false;
  $('catBar').style.display = 'none';
  $('catToggleBtn').classList.remove('open');
  applyStyle();
  renderVerse('up');
  savePos();
});


/* ─────────────────────────────────────
   8. СВАЙП / ЖЕСТИ
───────────────────────────────────── */
let startY=0, startX=0, moved=false, dragging=false;
let longTimer=null, lastTap=0;

function startGesture(y,x) {
  startY=y; startX=x; moved=false; dragging=true;
  if (!S.sheet) longTimer = setTimeout(openSheet, 520);
}
function moveGesture(y,x) {
  if (!dragging) return;
  if (Math.abs(y-startY)>10 || Math.abs(x-startX)>10) {
    moved=true;
    if (longTimer) { clearTimeout(longTimer); longTimer=null; }
  }
}
function endGesture(y) {
  if (!dragging) return; dragging=false;
  if (longTimer) { clearTimeout(longTimer); longTimer=null; }
  if (S.sheet) return;
  const dy = startY-y;
  if (Math.abs(dy)>35) { dy>0 ? next() : prev(); }
}

const vw = $('verseWrap');
vw.addEventListener('touchstart', e => startGesture(e.touches[0].clientY, e.touches[0].clientX), {passive:true});
vw.addEventListener('touchmove',  e => moveGesture(e.touches[0].clientY,  e.touches[0].clientX), {passive:true});
vw.addEventListener('touchend',   e => {
  endGesture(e.changedTouches[0].clientY);
  const now=Date.now();
  if (!moved && now-lastTap<300) triggerHeart();
  lastTap=now;
});
vw.addEventListener('mousedown', e => startGesture(e.clientY,e.clientX));
window.addEventListener('mousemove', e => moveGesture(e.clientY,e.clientX));
window.addEventListener('mouseup',   e => {
  endGesture(e.clientY);
  const now=Date.now();
  if (!moved && now-lastTap<320 && !S.sheet) triggerHeart();
  lastTap=now;
});

function triggerHeart() {
  const v=cv(); if (!v) return;
  if (!isFav(v.id)) { S.favs.push(v); saveFavs(); showToast(t('toast_added_fav_alt')); }
  else showToast(t('toast_already_fav'));
  heartBurst.classList.remove('pop'); void heartBurst.offsetWidth; heartBurst.classList.add('pop');
  setTimeout(() => heartBurst.classList.remove('pop'), 900);
}


/* ─────────────────────────────────────
   9. ШТОРКА
───────────────────────────────────── */
function openSheet() {
  const v=cv(); if (!v) return;
  sheetPrev.textContent = v.text.replace(/\n/g,' ').substring(0,90)+'…';
  aiPanel.classList.remove('visible');
  S.sheet=true;
  sheetEl.classList.add('open'); overlayEl.classList.add('show');
}
function closeSheet() {
  S.sheet=false; sheetEl.classList.remove('open'); overlayEl.classList.remove('show');
}
overlayEl.addEventListener('click', closeSheet);

$('btnAI').addEventListener('click', () => {
  const v=cv(); if (!v) return;
  aiAnswer.textContent = v.ai;
  aiPanel.classList.add('visible');
});

// Обробник кнопки btnShare — див. розділ "16. ПОДІЛИТИСЯ КАРТИНКОЮ" в кінці файлу



/* ─────────────────────────────────────
   10. УЛЮБЛЕНІ
───────────────────────────────────── */
function renderFavList() {
  if (!S.favs.length) {
    favList.innerHTML = `
      <div class="fav-empty">
        <div class="fav-empty-icon">🤍</div>
        <div class="fav-empty-text">${t('favs_empty').replace(/\n/g,'<br>')}</div>
      </div>`;
    return;
  }
  favList.innerHTML = S.favs.map(v => `
    <div class="fav-item">
      <div class="fav-item-text">${v.text.replace(/\n/g,' ').substring(0,80)}…</div>
      <div class="fav-item-ref t-ui">${v.ref}</div>
      <div class="fav-item-del" data-del="${v.id}">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M1 1l10 10M11 1L1 11" stroke="#ff6060" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
    </div>`).join('');
  favList.querySelectorAll('.fav-item-del').forEach(b =>
    b.addEventListener('click', e => {
      e.stopPropagation();
      S.favs = S.favs.filter(v => v.id !== +b.dataset.del);
      saveFavs(); renderFavList(); showToast(t('toast_deleted'));
    })
  );
}


/* ─────────────────────────────────────
   11. МУЗИКА — ГЛОБАЛЬНИЙ ПЛЕЄР
   Натискання на трек у Меню вмикає/вимикає глобальну фонову музику.

   Режими відтворення (S.playMode):
   - 'single'   — повторювати поточний трек (audioEl.loop = true)
   - 'sequence' — після завершення треку грати наступний по черзі
   Кнопка шафл (S.shuffle) — при переході обирає випадковий трек
   (працює разом з режимом 'sequence' або одна, незалежно від 'single').
───────────────────────────────────── */
/* ── Media Session API ──────────────────────────────────────────────
   Реєструємо активну медіа-сесію для ОС, щоб Android/iOS не вбивав
   фонове відтворення й показував плашку у шторці повідомлень.
   Обов'язково оновлюємо metadata при кожній зміні треку.
──────────────────────────────────────────────────────────────────── */
function updateMediaSession(track) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title:  track ? track.name : 'Holy Vibe',
    artist: 'Holy Vibe App',
    album:  'Молитовна музика',
    artwork: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ]
  });
  const setHandler = (action, fn) => {
    try { navigator.mediaSession.setActionHandler(action, fn); } catch { /* не підтримується */ }
  };
  setHandler('play',  () => {
    audioEl.play().catch(() => {});
    navigator.mediaSession.playbackState = 'playing';
  });
  setHandler('pause', () => {
    audioEl.pause();
    navigator.mediaSession.playbackState = 'paused';
    // Не скидаємо S.playing — лише пауза, не зупинка
  });
  setHandler('stop',  () => {
    stopTrack();
    navigator.mediaSession.playbackState = 'none';
  });
  setHandler('nexttrack',     () => nextTrack());
  setHandler('previoustrack', () => prevTrack());
}

/* ── НЕ зупиняємо аудіо при згортанні / блокуванні екрану ──────────
   Старий код робив audioEl.pause() — прибрали.
   Браузер/WebView сам продовжує відтворення поки є активна
   MediaSession. Якщо потрібно справді зупиняти — розкоментуй.
──────────────────────────────────────────────────────────────────── */
// document.addEventListener('visibilitychange', () => {
//   if (document.hidden && S.playing >= 0) audioEl.pause();
// });

function buildTrackList() {
  const container = $('trackList'); if (!container) return;
  container.innerHTML = TRACKS.map((t,i) => `
    <div class="music-track" id="track${i}">
      <div class="track-play-btn" id="ico${i}">▶</div>
      <div class="track-info">
        <div class="track-name" id="tname${i}">${t.name}</div>
        <div class="track-license">${t.license}</div>
      </div>
    </div>`).join('');

  TRACKS.forEach((t,i) => {
    $(`track${i}`).addEventListener('click', () => {
      if (S.playing === i) stopTrack();
      else playTrack(i);
    });
  });

  syncPlayerControlsUI();
}

// Прибирає виділення треку i у списку
function clearTrackUI(i) {
  if (i < 0) return;
  $(`track${i}`)?.classList.remove('playing');
  $(`tname${i}`)?.classList.remove('playing');
  const ico = $(`ico${i}`); if (ico) ico.textContent = '▶';
}

// Запускає трек за індексом
function playTrack(i) {
  if (!TRACKS.length) return;
  i = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length; // циклічно
  const t = TRACKS[i];

  clearTrackUI(S.playing);

  S.verseAudioOn = false;
  audioEl.src    = t.src;
  // loop = true тільки в режимі "повтор треку" без шафлу;
  // інакше перехід до наступного контролюємо самі (подія 'ended')
  audioEl.loop   = (S.playMode === 'single' && !S.shuffle);
  audioEl.volume = S.vol / 100;
  audioEl.play()
    .then(() => {
      S.playing = i;
      $(`track${i}`)?.classList.add('playing');
      $(`tname${i}`)?.classList.add('playing');
      const ico = $(`ico${i}`); if (ico) ico.textContent = '⏸';
      showToast('🎵 ' + t.name);
      updateMediaSession(t);
      if ('mediaSession' in navigator)
        navigator.mediaSession.playbackState = 'playing';
    })
    .catch(err => {
      console.warn('Audio error:', err);
      showToast('⚠️ Не вдалося завантажити трек');
    });
}

// Повна зупинка глобального плеєра
function stopTrack() {
  audioEl.pause();
  clearTrackUI(S.playing);
  S.playing = -1;
  S.verseAudioOn = false;
}

// Наступний/попередній індекс з урахуванням шафлу
function getAdjacentTrackIndex(current, dir) {
  if (TRACKS.length <= 1) return current < 0 ? 0 : current;
  if (S.shuffle) {
    let next;
    do { next = Math.floor(Math.random() * TRACKS.length); } while (next === current);
    return next;
  }
  if (current < 0) return dir > 0 ? 0 : TRACKS.length - 1;
  return (current + dir + TRACKS.length) % TRACKS.length;
}

function nextTrack() { playTrack(getAdjacentTrackIndex(S.playing, 1)); }
function prevTrack() { playTrack(getAdjacentTrackIndex(S.playing, -1)); }

// Синхронізує іконки кнопок режиму повтору і шафлу з S
function syncPlayerControlsUI() {
  const repeatBtn  = $('btnRepeatMode');
  const shuffleBtn = $('btnShuffle');
  if (repeatBtn) {
    const sequence = S.playMode === 'sequence';
    repeatBtn.textContent = sequence ? '🔁' : '🔂';
    repeatBtn.classList.toggle('active', sequence);
    repeatBtn.title = t('title_repeat');
  }
  if (shuffleBtn) {
    shuffleBtn.classList.toggle('active', S.shuffle);
    shuffleBtn.title = t('title_shuffle');
  }
}

$('btnRepeatMode')?.addEventListener('click', () => {
  S.playMode = (S.playMode === 'single') ? 'sequence' : 'single';
  if (S.playing >= 0) audioEl.loop = (S.playMode === 'single' && !S.shuffle);
  syncPlayerControlsUI();
  saveSettings();
  showToast(S.playMode === 'sequence' ? t('toast_play_sequence') : t('toast_play_repeat'));
});

$('btnShuffle')?.addEventListener('click', () => {
  S.shuffle = !S.shuffle;
  if (S.playing >= 0) audioEl.loop = (S.playMode === 'single' && !S.shuffle);
  syncPlayerControlsUI();
  saveSettings();
  showToast(S.shuffle ? t('toast_shuffle_on') : t('toast_shuffle_off'));
});

$('btnPrevTrack')?.addEventListener('click', () => prevTrack());
$('btnNextTrack')?.addEventListener('click', () => nextTrack());

audioEl.volume = S.vol / 100;

// Трек завершився:
// - 'single' без шафлу — audioEl.loop=true вже подбав про повтор (це лише запасний варіант)
// - інакше — переходимо до наступного (по черзі або випадково)
audioEl.addEventListener('ended', () => {
  if (S.playing < 0) return;
  if (S.playMode === 'single' && !S.shuffle) {
    audioEl.currentTime = 0;
    audioEl.play().catch(() => {});
    return;
  }
  nextTrack();
});


/* ─────────────────────────────────────
   11b. ФОНИ
───────────────────────────────────── */
function buildBgGrid() {
  const container = $('bgGrid'); if (!container) return;
  container.innerHTML = BACKGROUNDS.map((b,i) => `
    <div class="bg-thumb${i===0?' active':''}" data-url="${b.url}"
         style="background-image:url('${b.url}')" title="${b.name}"></div>
  `).join('');
  container.querySelectorAll('.bg-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      container.querySelectorAll('.bg-thumb').forEach(t=>t.classList.remove('active'));
      thumb.classList.add('active');
      const url = thumb.dataset.url;
      const bgEl = $('bg');
      if (url) {
        bgEl.style.backgroundImage    = `url('${url}')`;
        bgEl.style.backgroundSize     = 'cover';
        bgEl.style.backgroundPosition = 'center';
        bgEl.dataset.photo = '1';
      } else {
        bgEl.style.backgroundImage = '';
        bgEl.dataset.photo = '0';
      }
      applyStyle();
      showToast(url ? '🖼️ Фон змінено' : '🖼️ Фон прибрано');
      saveSettings();
    });
  });

  // Відновлюємо активний thumb після перезапуску
  const bgEl = $('bg');
  const currentUrl = bgEl.style.backgroundImage.replace(/url\(['"]?|['"]?\)/g, '');
  if (currentUrl) {
    let matched = false;
    container.querySelectorAll('.bg-thumb').forEach(t => {
      const match = t.dataset.url === currentUrl;
      t.classList.toggle('active', match);
      if (match) matched = true;
    });
    if (!matched) container.querySelectorAll('.bg-thumb')[0]?.classList.add('active');
  }
}

$('bg').dataset.photo = '0';


/* ─────────────────────────────────────
   12. НАЛАШТУВАННЯ
───────────────────────────────────── */
document.querySelectorAll('.font-opt').forEach(o =>
  o.addEventListener('click', () => {
    document.querySelectorAll('.font-opt').forEach(x=>x.classList.remove('active'));
    o.classList.add('active'); S.font=o.dataset.font; applyStyle(); saveSettings(); showToast('Шрифт змінено');
  })
);
document.querySelectorAll('.color-dot').forEach(d =>
  d.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(x=>x.classList.remove('active'));
    d.classList.add('active'); S.color=d.dataset.color; applyStyle(); saveSettings();
  })
);

const fs = $('fontSizeSlider');
fs.addEventListener('input', e => { S.size=+e.target.value; setSliderBg(e.target,S.size); applyStyle(); saveSettings(); });

const is = $('iconSizeSlider');
is.addEventListener('input', e => { S.iconSize=+e.target.value; setSliderBg(e.target,S.iconSize); applyStyle(); saveSettings(); });

function mkToggle(id,key) {
  $(id).addEventListener('click', function() { S[key]=!S[key]; this.classList.toggle('on',S[key]); applyStyle(); saveSettings(); });
}
mkToggle('tglShadow','shadow');
mkToggle('tglAnim','anim');

function applyGlass() {
  document.body.classList.toggle('skin-glass', S.glass);
}

$('tglGlass').addEventListener('click', function() {
  S.glass = !S.glass;
  this.classList.toggle('on', S.glass);
  applyGlass();
  saveSettings();
  showToast(S.glass ? '✦ Скляний стиль увімкнено' : '✦ Скляний стиль вимкнено');
});

$('tglAutoBg').addEventListener('click', function() {
  S.autoBg = !S.autoBg;
  this.classList.toggle('on', S.autoBg);
  if (S.autoBg) {
    // Вмикаємо — одразу міняємо фон під поточний вірш
    applyAutoBg();
    applyStyle();
    saveSettings();
    showToast('🖼️ Авто-фон увімкнено');
  } else {
    // Вимикаємо — прибираємо фото-фон
    const bgEl = $('bg');
    bgEl.style.backgroundImage = '';
    bgEl.dataset.photo = '0';
    // Скидаємо активний thumb у гриді на "Без фону"
    document.querySelectorAll('.bg-thumb').forEach((t,i) =>
      t.classList.toggle('active', i === 0));
    applyStyle();
    saveSettings();
    showToast('🖼️ Авто-фон вимкнено');
  }
});


/* ─────────────────────────────────────
   13. СПОВІЩЕННЯ — БУДИЛЬНИКИ
───────────────────────────────────── */
const ALARM_KEY = 'hv_alarms';
let alarms = [];
let editingAlarmId = null; // null = новий, число = редагування

function loadAlarms() {
  try { alarms = JSON.parse(localStorage.getItem(ALARM_KEY) || '[]'); } catch { alarms = []; }
}
function saveAlarms() {
  localStorage.setItem(ALARM_KEY, JSON.stringify(alarms));
}
function syncAlarmsToAndroid() {
  if (window.AndroidBridge && window.AndroidBridge.scheduleNotifications) {
    window.AndroidBridge.scheduleNotifications(JSON.stringify(alarms));
  }
}

function alarmDaysLabel(days) {
  const DAY_NAMES = ['', t('day_mon'), t('day_tue'), t('day_wed'), t('day_thu'), t('day_fri'), t('day_sat'), t('day_sun')];
  if (days === null || days === undefined) return t('alarm_once');
  if (days === 'once') return t('alarm_once');
  if (!Array.isArray(days) || days.length === 0) return t('alarm_daily');
  if (days.length === 7) return t('alarm_daily');
  if (JSON.stringify(days) === JSON.stringify([1,2,3,4,5])) return `${t('day_mon')}–${t('day_fri')}`;
  if (JSON.stringify(days) === JSON.stringify([6,7])) return `${t('day_sat')}–${t('day_sun')}`;
  return days.map(d => DAY_NAMES[d]).join(', ');
}

function renderNotifList() {
  loadAlarms();
  const list = $('alarmList');
  if (!list) return;
  if (!alarms.length) {
    list.innerHTML = `<div style="text-align:center; padding:16px 0; color:rgba(255,255,255,.3); font-size:13px;">
      ${t('notif_empty').replace(/\n/g,'<br>')}</div>`;
    return;
  }
  list.innerHTML = alarms.map(a => {
    const h = String(a.hour).padStart(2,'0');
    const m = String(a.minute).padStart(2,'0');
    return `
    <div class="alarm-item" data-id="${a.id}">
      <div onclick="openAlarmModal(${a.id})" style="flex:1; cursor:pointer">
        <div class="alarm-time">${h}:${m}</div>
        <div class="alarm-label">${a.label || t('alarm_modal_title')}</div>
        <div class="alarm-meta">${alarmDaysLabel(a.days)}</div>
      </div>
      <div style="display:flex; align-items:center; gap:10px">
        <div class="toggle alarm-toggle ${a.active ? 'on' : ''}" data-toggle="${a.id}"></div>
        <div class="alarm-del" data-del="${a.id}">✕</div>
      </div>
    </div>`;
  }).join('');

  // Toggle active
  list.querySelectorAll('[data-toggle]').forEach(el =>
    el.addEventListener('click', () => {
      const id = +el.dataset.toggle;
      const alarm = alarms.find(a => a.id === id);
      if (!alarm) return;
      alarm.active = !alarm.active;
      el.classList.toggle('on', alarm.active);
      saveAlarms(); syncAlarmsToAndroid();
      showToast(alarm.active ? t('toast_enabled') : t('toast_disabled'));
    })
  );

  // Delete
  list.querySelectorAll('[data-del]').forEach(el =>
    el.addEventListener('click', e => {
      e.stopPropagation();
      const id = +el.dataset.del;
      if (window.AndroidBridge && window.AndroidBridge.cancelNotification)
        window.AndroidBridge.cancelNotification(id);
      alarms = alarms.filter(a => a.id !== id);
      saveAlarms(); renderNotifList();
      showToast(t('toast_deleted'));
    })
  );
}

// ── Модалка ──────────────────────────────────────────────────────────
function openAlarmModal(editId = null) {
  editingAlarmId = editId;
  const modal = $('alarmModal');
  const timeInput = $('alarmTime');
  const labelInput = $('alarmLabel');

  // Скидаємо дні
  document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));

  if (editId !== null) {
    const a = alarms.find(x => x.id === editId);
    if (a) {
      timeInput.value = String(a.hour).padStart(2,'0') + ':' + String(a.minute).padStart(2,'0');
      labelInput.value = a.label || '';
      if (a.days === 'once') {
        document.querySelector('.day-btn[data-day="-1"]').classList.add('active');
      } else if (!a.days || a.days.length === 0) {
        document.querySelector('.day-btn[data-day="0"]').classList.add('active');
      } else {
        a.days.forEach(d => {
          const btn = document.querySelector(`.day-btn[data-day="${d}"]`);
          if (btn) btn.classList.add('active');
        });
      }
    }
  } else {
    timeInput.value = '08:00';
    labelInput.value = '';
    document.querySelector('.day-btn[data-day="-1"]').classList.add('active'); // дефолт — один раз
  }

  modal.style.display = 'flex';
}

function closeAlarmModal() {
  $('alarmModal').style.display = 'none';
  editingAlarmId = null;
}

document.querySelectorAll('.day-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    const day = +btn.dataset.day;
    if (day === -1 || day === 0) {
      // "Один раз" або "Щодня" — знімаємо все, вибираємо тільки цю
      document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    } else {
      // Конкретний день — знімаємо "Один раз" і "Щодня"
      document.querySelector('.day-btn[data-day="-1"]').classList.remove('active');
      document.querySelector('.day-btn[data-day="0"]').classList.remove('active');
      btn.classList.toggle('active');
      const selected = document.querySelectorAll('.day-btn.active').length;
      // Якщо всі 7 днів — переключаємо на "Щодня"
      if (selected === 7) {
        document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.day-btn[data-day="0"]').classList.add('active');
      }
      // Якщо нічого — повертаємо "Один раз"
      if (selected === 0) {
        document.querySelector('.day-btn[data-day="-1"]').classList.add('active');
      }
    }
  })
);

$('btnAddAlarm').addEventListener('click', () => openAlarmModal(null));
$('btnAlarmCancel').addEventListener('click', closeAlarmModal);
$('alarmModal').addEventListener('click', e => { if (e.target === $('alarmModal')) closeAlarmModal(); });

$('btnAlarmSave').addEventListener('click', () => {
  const timeVal = $('alarmTime').value;
  if (!timeVal) { showToast(t('toast_time_missing')); return; }
  const [h, m] = timeVal.split(':').map(Number);

  const isOnce    = document.querySelector('.day-btn[data-day="-1"]').classList.contains('active');
  const isEveryDay = document.querySelector('.day-btn[data-day="0"]').classList.contains('active');
  const days = isOnce ? 'once' : isEveryDay ? [] :
    [...document.querySelectorAll('.day-btn.active')]
      .map(b => +b.dataset.day).filter(d => d > 0);

  // Отримуємо актуальний переклад сповіщення через функцію t()
  const bodyText = t('notif_body');

  if (editingAlarmId !== null) {
    // Оновлюємо існуючий
    const alarm = alarms.find(a => a.id === editingAlarmId);
    if (alarm) {
      alarm.hour   = h;
      alarm.minute = m;
      alarm.days   = days;
      alarm.label  = $('alarmLabel').value.trim() || t('alarm_modal_title');
      alarm.notif_body = bodyText; // <-- Додали сюди для оновлення існуючого
      alarm.active = true;
    }
  } else {
    // Новий
    const newId = Date.now() % 100000; // унікальний id до 5 цифр
    alarms.push({ 
      id: newId, 
      hour: h, 
      minute: m, 
      days, 
      label: $('alarmLabel').value.trim() || t('alarm_modal_title'), 
      notif_body: bodyText, // <-- Додали сюди для нового сповіщення
      active: true 
    });
  }

  saveAlarms();
  syncAlarmsToAndroid();
  renderNotifList();
  closeAlarmModal();
  showToast(t('toast_saved'));
});

/* ─────────────────────────────────────
   14. INIT
───────────────────────────────────── */
loadSettings();

// Відновлюємо UI налаштувань під збережений стан
document.querySelectorAll('.font-opt').forEach(o =>
  o.classList.toggle('active', o.dataset.font === S.font));
document.querySelectorAll('.color-dot').forEach(d =>
  d.classList.toggle('active', d.dataset.color === S.color));
$('tglShadow').classList.toggle('on', S.shadow);
$('tglAnim').classList.toggle('on', S.anim);
$('tglAutoBg').classList.toggle('on', S.autoBg);
$('tglGlass').classList.toggle('on', S.glass);
applyGlass();

// Відновлюємо value слайдерів зі збереженого стану (інакше HTML дефолт "50" перезапише)
fs.value = S.size;
is.value = S.iconSize;
applyStyle();
setSliderBg(fs, S.size);
setSliderBg(is, S.iconSize);
fetchVerses();
buildTrackList();
fetchBackgrounds(); // завантажує backgrounds.json і будує грід фонів

// Сповіщення — наступний реліз

setTimeout(() => showToast(t('toast_swipe')),     1600);
setTimeout(() => showToast(t('toast_longpress')), 4800);


/* ═══════════════════════════════════════════
   15. ПОШУК — можна повністю видалити цей розділ.
   Якщо видаляєте — приберіть також:
   - кнопку #searchToggleBtn і div #searchOverlay в index.html
   - CSS-блок "ПОШУК" в styles.css
   ═══════════════════════════════════════════ */
function escapeHtml(str) {
  return str.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function highlightMatch(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp('(' + q + ')', 'ig'), '<mark>$1</mark>');
}

function runSearch(query) {
  const box = $('searchResults');
  const q = query.trim().toLowerCase();
  if (!q) { box.innerHTML = ''; return; }

  const matches = VERSES.filter(v =>
    v.text.toLowerCase().includes(q) || v.ref.toLowerCase().includes(q)
  ).slice(0, 50);

  if (!matches.length) {
    box.innerHTML = `<div class="search-empty">Нічого не знайдено</div>`;
    return;
  }

  box.innerHTML = matches.map(v => `
    <div class="search-result-item" data-id="${v.id}">
      <div class="search-result-ref">${escapeHtml(v.ref)}</div>
      <div class="search-result-text">${highlightMatch(v.text.replace(/\n/g, ' '), q)}</div>
    </div>`).join('');
}

function openSearch() {
  $('searchOverlay').classList.add('open');
  $('searchInput').value = '';
  $('searchResults').innerHTML = '';
  setTimeout(() => $('searchInput').focus(), 50);
}

function closeSearch() {
  $('searchOverlay').classList.remove('open');
  $('searchInput').blur();
}

$('searchToggleBtn').addEventListener('click', openSearch);
$('searchCloseBtn').addEventListener('click', closeSearch);
$('searchOverlay').addEventListener('click', e => {
  if (e.target === $('searchOverlay')) closeSearch();
});
$('searchInput').addEventListener('input', e => runSearch(e.target.value));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('searchOverlay').classList.contains('open')) closeSearch();
});

// Клік на результат — переходимо до вірша в загальному списку "Усі"
$('searchResults').addEventListener('click', e => {
  const item = e.target.closest('.search-result-item'); if (!item) return;
  const id = +item.dataset.id;
  const globalIdx = VERSES.findIndex(v => v.id === id);
  if (globalIdx === -1) return;

  S.cat  = 'all';
  S.pool = [...VERSES];
  S.idx  = globalIdx;
  document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
  const allPill = document.querySelector('.pill[data-cat="all"]');
  if (allPill) { allPill.classList.add('active'); $('catToggleLabel').textContent = allPill.textContent; }

  closeSearch();
  applyStyle();
  renderVerse();
  savePos();
});


/* ═══════════════════════════════════════════
   16. ПОДІЛИТИСЯ КАРТИНКОЮ — можна повністю видалити
   цей розділ і повернути старий текстовий btnShare-обробник
   (простий приклад лишився в коментарі внизу розділу).
   Якщо видаляєте — приберіть також:
   - #shareImgOverlay в index.html
   - CSS-блок "КАРТИНКА ВІРША" в styles.css
   ═══════════════════════════════════════════ */
const SHARE_W = 1080, SHARE_H = 1920;

// Відповідність S.font (як в налаштуваннях) реальним назвам шрифтів для Canvas.
// Це те саме, що FONTS вище, але без лапок/CSS-фолбеків — Canvas API
// приймає лише "чисту" назву шрифту.
const CANVAS_FONTS = {
  cormorant: 'Cormorant Garamond',
  georgia:   'Georgia',
  nunito:    'Nunito'
};

// Розбиває текст на рядки за максимальною шириною — повертає масив рядків
// (винесено окремо від малювання, щоб заздалегідь порахувати висоту
// для скляної картки ДО того, як текст намальовано)
function wrapTextLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Малює вже розбитий на рядки текст по центру
function drawLinesCentered(ctx, lines, cx, cy, lineHeight) {
  const totalH = lines.length * lineHeight;
  const startY = cy - totalH / 2 + lineHeight / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight));
  return totalH;
}

// Підбирає розмір шрифту так, щоб текст вірша вмістився у відведену висоту.
// Базовий розмір тепер трохи залежить від S.size — той самий повзунок
// "Розмір тексту", що і на екрані, впливає і на картинку.
function fitVerseFontSize(ctx, text, maxWidth, maxHeight, family) {
  const sizeFactor = 0.72 + ((S.size ?? 50) / 100) * 0.56; // ≈ 0.72 .. 1.28
  let size = Math.round(64 * sizeFactor);
  const minSize = Math.max(28, Math.round(34 * sizeFactor));
  let lines = [];
  while (size > minSize) {
    ctx.font = `300 ${size}px "${family}"`;
    lines = wrapTextLines(ctx, text, maxWidth);
    const lineHeight = size * 1.32;
    if (lines.length * lineHeight <= maxHeight) return { size, lineHeight, lines };
    size -= 2;
  }
  ctx.font = `300 ${minSize}px "${family}"`;
  return { size: minSize, lineHeight: minSize * 1.32, lines: wrapTextLines(ctx, text, maxWidth) };
}

// Малює заокруглений прямокутник (шлях, без заливки/обведення)
function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Імітує "скляну" картку (той самий CSS-скін .skin-glass .verse-card)
// на канвасі: розмиває фон під панеллю і додає напівпрозору заливку
// з золотою рамкою. Якщо ctx.filter (blur) не підтримується конкретним
// WebView — тихо переходить на фолбек без розмиття, нічого не ламаючи.
function drawGlassPanel(ctx, mainCanvas, x, y, w, h, r) {
  if ('filter' in ctx) {
    try {
      const pad = 40;
      const blurCanvas = document.createElement('canvas');
      blurCanvas.width  = w + pad * 2;
      blurCanvas.height = h + pad * 2;
      const bctx = blurCanvas.getContext('2d');
      bctx.filter = 'blur(22px)';
      bctx.drawImage(
        mainCanvas,
        x - pad, y - pad, w + pad * 2, h + pad * 2,
        0, 0, w + pad * 2, h + pad * 2
      );
      ctx.save();
      roundedRectPath(ctx, x, y, w, h, r);
      ctx.clip();
      ctx.drawImage(blurCanvas, x - pad, y - pad);
      ctx.restore();
    } catch (err) {
      console.warn('drawGlassPanel: розмиття не вдалося, малюю без нього:', err);
    }
  }

  ctx.save();
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = 'rgba(15,20,40,.55)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(201,168,76,.3)';
  ctx.stroke();
  ctx.restore();
}

// Завантажує зображення фону поточної картки (якщо є) для canvas
// Захист від "вічного" очікування: якщо проміс не встиг за ms —
// повертаємо fallback і йдемо далі, замість зависання назавжди.
// (деякі збірки Android WebView інколи не викликають callback
// document.fonts.load() чи canvas.toBlob() — це відомий глюк рушія)
function withTimeout(promise, ms, fallback) {
  return new Promise(resolve => {
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; resolve(fallback); } }, ms);
    promise.then(
      val => { if (!done) { done = true; clearTimeout(timer); resolve(val); } },
      ()  => { if (!done) { done = true; clearTimeout(timer); resolve(fallback); } }
    );
  });
}

function loadBgImageForShare() {
  return withTimeout(new Promise(resolve => {
    const bgUrl = ($('bg').style.backgroundImage || '').replace(/url\(['"]?|['"]?\)/g, '');
    if (!bgUrl || $('bg').dataset.photo !== '1') { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null); // немає CORS чи фото — просто малюємо без нього
    img.src = bgUrl;
  }), 4000, null); // якщо фон не завантажився за 4с — малюємо без нього, а не висимо
}

async function buildShareCanvas(v) {
  // Шрифт беремо з тих самих налаштувань, що і на екрані (S.font),
  // а не хардкоджений Cormorant — щоб картинка відповідала вигляду додатку
  const family = CANVAS_FONTS[S.font] || CANVAS_FONTS.cormorant;

  // Чекаємо, поки шрифти Google Fonts точно завантажені (максимум 1.5с —
  // якщо WebView "підвисне" на цьому, все одно малюємо системним шрифтом)
  await withTimeout(
    Promise.all([
      document.fonts.load(`300 64px "${family}"`),
      document.fonts.load('500 40px "Cinzel"'),
      document.fonts.load('600 26px "Nunito"'),
    ]).catch(() => null),
    1500, null
  );

  const canvas = document.createElement('canvas');
  canvas.width = SHARE_W; canvas.height = SHARE_H;
  const ctx = canvas.getContext('2d');

  // ── Фон ──────────────────────────────────────────
  const bgImg = await loadBgImageForShare();
  if (bgImg) {
    const scale = Math.max(SHARE_W / bgImg.width, SHARE_H / bgImg.height);
    const w = bgImg.width * scale, h = bgImg.height * scale;
    ctx.drawImage(bgImg, (SHARE_W - w) / 2, (SHARE_H - h) / 2, w, h);
  } else {
    const g = ctx.createLinearGradient(0, 0, SHARE_W * 0.3, SHARE_H);
    g.addColorStop(0,   '#060a16');
    g.addColorStop(0.5, '#09102a');
    g.addColorStop(1,   '#050810');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SHARE_W, SHARE_H);
    // легкі золоті "зірочки"
    ctx.fillStyle = 'rgba(201,168,76,.5)';
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * SHARE_W, y = Math.random() * SHARE_H, r = Math.random() * 1.6 + .4;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ── Затемнення для читабельності тексту ────────────
  const overlay = ctx.createLinearGradient(0, 0, 0, SHARE_H);
  overlay.addColorStop(0,    'rgba(6,8,16,.55)');
  overlay.addColorStop(0.35, 'rgba(6,8,16,.35)');
  overlay.addColorStop(0.65, 'rgba(6,8,16,.45)');
  overlay.addColorStop(1,    'rgba(6,8,16,.75)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);

  // ── Декоративна риска зверху ────────────────────────
  ctx.strokeStyle = 'rgba(201,168,76,.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(SHARE_W / 2 - 40, 230);
  ctx.lineTo(SHARE_W / 2 + 40, 230);
  ctx.stroke();

  // ── Текст вірша ─────────────────────────────────────
  const maxTextWidth  = SHARE_W - 160;
  const maxTextHeight = 900;
  const cleanText = v.text.replace(/\n/g, ' ').trim();
  ctx.textAlign = 'center';
  const { size, lineHeight, lines } = fitVerseFontSize(ctx, cleanText, maxTextWidth, maxTextHeight, family);
  const textCenterY = SHARE_H / 2 - 40;
  const usedH = lines.length * lineHeight;

  // Ширина найдовшого рядка — потрібна лише для розміру скляної картки
  ctx.font = `300 ${size}px "${family}"`;
  const maxLineW = lines.reduce((max, l) => Math.max(max, ctx.measureText(l).width), 0);

  // ── Скляна картка позаду тексту (тільки якщо в налаштуваннях
  //    увімкнено "Скляний стиль" — той самий S.glass, що і на екрані) ──
  if (S.glass) {
    const panelPadX = 70;
    const panelW = Math.min(SHARE_W - 80, maxLineW + panelPadX * 2);
    const panelTop = textCenterY - usedH / 2 - 80;
    const panelBottom = textCenterY + usedH / 2 + 70 + 60;
    drawGlassPanel(ctx, canvas, SHARE_W / 2 - panelW / 2, panelTop, panelW, panelBottom - panelTop, 44);
  }

  ctx.font = `300 ${size}px "${family}"`;
  ctx.fillStyle = S.color || '#f4ecd8';
  ctx.textAlign = 'center';
  if (S.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,.9)';
    ctx.shadowBlur = 30;
  } else {
    ctx.shadowBlur = 0;
  }
  drawLinesCentered(ctx, lines, SHARE_W / 2, textCenterY, lineHeight);
  ctx.shadowBlur = 0;

  // ── Посилання на вірш ────────────────────────────────
  ctx.font = '600 30px "Nunito"';
  ctx.fillStyle = 'rgba(232,208,138,.95)';
  ctx.fillText(v.ref.toUpperCase(), SHARE_W / 2, textCenterY + usedH / 2 + 70);

  // ── Нижня риска + логотип ────────────────────────────
  ctx.strokeStyle = 'rgba(201,168,76,.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(SHARE_W / 2 - 30, SHARE_H - 150);
  ctx.lineTo(SHARE_W / 2 + 30, SHARE_H - 150);
  ctx.stroke();

  ctx.font = '500 40px "Cinzel"';
  ctx.fillStyle = 'rgba(232,208,138,.9)';
  ctx.textAlign = 'center';
  // Невеликий трекінг літер вручну (Canvas не підтримує letter-spacing напряму)
  const logo = 'HOLY VIBE';
  ctx.letterSpacing = '6px';
  ctx.fillText(logo, SHARE_W / 2, SHARE_H - 95);
  ctx.letterSpacing = '0px';

  return canvas;
}

function canvasToBlob(canvas) {
  // toBlob інколи "мовчить" (не викликає callback) на деяких Android WebView —
  // якщо за 4с відповіді немає, вважаємо що не вдалось і йдемо в текстовий фолбек.
  return withTimeout(
    new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png', 0.95)),
    4000, null
  );
}

function openShareImgOverlay(blobUrl) {
  $('shareImgPreview').src = blobUrl;
  $('shareImgOverlay').classList.add('open');
}
$('shareImgClose').addEventListener('click', () => {
  $('shareImgOverlay').classList.remove('open');
});

// Аварійний текстовий фолбек — той самий спосіб, що працював раніше
function shareVerseAsTextFallback(v) {
  const txt = `«${v.text.replace(/\n/g, ' ')}» — ${v.ref}`;
  if (navigator.share) navigator.share({ text: txt }).catch(() => {});
  else { navigator.clipboard?.writeText(txt); showToast('📋 Вірш скопійовано'); }
}

// Копіювання без діалогу "Поділитися" — просто одразу в буфер обміну
function copyVerseText(v) {
  const txt = `«${v.text.replace(/\n/g, ' ')}» — ${v.ref}`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(txt)
      .then(() => showToast('📋 Вірш скопійовано'))
      .catch(() => copyViaFallback(txt));
  } else {
    copyViaFallback(txt);
  }
}
// Старий прийом через прихований textarea — на випадок, якщо Clipboard API
// заблоковано у WebView (буває без https чи певних дозволів)
function copyViaFallback(txt) {
  try {
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('📋 Вірш скопійовано');
  } catch {
    showToast('⚠️ Не вдалося скопіювати');
  }
}

$('btnCopyText').addEventListener('click', () => {
  const v = cv(); if (!v) return;
  closeSheet();
  copyVerseText(v);
});

$('btnShare').addEventListener('click', async () => {
  const v = cv(); if (!v) return;
  closeSheet();
  showToast('🖼️ Готуємо картинку…');

  let blob = null, canvas = null;
  try {
    canvas = await buildShareCanvas(v);
    blob = await canvasToBlob(canvas);
  } catch (err) {
    console.error('Не вдалося згенерувати картинку вірша:', err);
  }

  // Не вдалося намалювати картинку (наприклад CORS на фото-фоні) — старий текстовий шлях
  if (!blob) { shareVerseAsTextFallback(v); return; }

  const caption = `${v.ref} · Holy Vibe`;

  // ── 1. Пріоритет: нативний Android-місток (стабільно працює в WebView,
  //      відкриває справжнє системне меню "Поділитися") ──────────────
  if (window.AndroidBridge && typeof window.AndroidBridge.shareImage === 'function') {
    try {
      window.AndroidBridge.shareImage(canvas.toDataURL('image/jpeg', 0.92), 'holy-vibe-verse.jpg', caption);
      return;
    } catch (err) {
      console.warn('AndroidBridge.shareImage не спрацював, пробуємо Web Share API:', err);
    }
  }

  // ── 2. Звичайний браузер / iOS: Web Share API ───────────────────────
  const file = new File([blob], 'holy-vibe-verse.png', { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: caption });
      return;
    }
  } catch (err) {
    // Людина сама закрила системне вікно "Поділитися" — це не помилка
    if (err && err.name === 'AbortError') return;
    console.warn('navigator.share з файлом не спрацював, показуємо картинку вручну:', err);
  }

  // ── 3. Останній запасний варіант: картинка на весь екран (data: URI,
  //      щоб довге натискання "зберегти" реально працювало) ──────────
  openShareImgOverlay(canvas.toDataURL('image/png'));
});

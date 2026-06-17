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
    // тост показується після завантаження мови (в i18n.js)
    // i18n: якщо активна не українська — застосовуємо переклад
    const savedLang = localStorage.getItem('hv_lang') || 'uk';
    if (savedLang !== 'uk' && window.translationCache && window.translationCache[savedLang]) {
      applyTranslation(savedLang);
    }
  } catch (err) {
    console.error('verses.json не завантажився:', err);
    showToast(t('toast_load_error'));
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
  playMode: 'single', // 'single' = повтор одного треку, 'sequence' = по черзі
  shuffle:  false,    // перемішування при переході до наступного треку
  // notifs: реалізується в наступному релізі
};

const DAYS_UK = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];


/* ─────────────────────────────────────
   3. DOM
───────────────────────────────────── */
const $ = id => document.getElementById(id);

const verseCard   = $('verseCard');
const verseBookEl = $('verseBook');
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
  const write = () => {
    verseBookEl.textContent = v.book;
    verseTextEl.innerHTML   = formatText(v.text);
    verseRefEl.textContent  = (typeof currentLang === 'undefined' || currentLang === 'uk')
      ? v.ref + ' · ' + t('translation')
      : v.ref;
    if (S.autoBg) applyAutoBg();
    // Якщо вірш має власне аудіо і глобальний плеєр не грає
    updateVerseAudio(v);
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

/*
  updateVerseAudio — автоматично вмикає аудіо з поля audio_url вірша,
  але тільки якщо глобальний плеєр (трек з Меню) зараз не грає.
  Якщо verse.audio_url відсутній — нічого не змінює.
*/
function updateVerseAudio(verse) {
  if (S.playing >= 0) return;          // глобальний плеєр активний — не чіпаємо
  if (!verse || !verse.audio_url) return; // немає аудіо у вірші
  // Грає вже цей же трек — не перезапускаємо
  if (audioEl.src === verse.audio_url && !audioEl.paused) return;
  audioEl.src    = verse.audio_url;
  audioEl.loop   = true;
  audioEl.volume = S.vol / 100;
  audioEl.play().catch(() => {}); // WebView може блокувати автоплей
  S.verseAudioOn = true;
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
  S.idx  = 0;
  // Оновлюємо мітку кнопки
  $('catToggleLabel').textContent = p.textContent;
  // Закриваємо панель після вибору
  catBarVisible = false;
  $('catBar').style.display = 'none';
  $('catToggleBtn').classList.remove('open');
  applyStyle();
  renderVerse('up');
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
  if (!isFav(v.id)) { S.favs.push(v); saveFavs(); showToast(t('toast_added_fav')); }
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

$('btnShare').addEventListener('click', () => {
  const v=cv(); if (!v) return; closeSheet();
  const txt = `«${v.text.replace(/\n/g,' ')}» — ${v.ref}`;
  if (navigator.share) navigator.share({text:txt}).catch(()=>{});
  else { navigator.clipboard?.writeText(txt); showToast(t('toast_copied')); }
});


/* ─────────────────────────────────────
   10. УЛЮБЛЕНІ
───────────────────────────────────── */
function renderFavList() {
  if (!S.favs.length) {
    favList.innerHTML = `
      <div class="fav-empty">
        <div class="fav-empty-icon">🤍</div>
        <div class="fav-empty-text">${t('favs_empty').replace('\n','<br>')}</div>
      </div>`;
    return;
  }
  favList.innerHTML = S.favs.map(v => `
    <div class="fav-item">
      <div class="fav-item-book">${v.book}</div>
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
   Якщо вірш мав своє аудіо (audio_url) — воно замовкає.

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
      showToast(t('toast_track_error'));
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
    repeatBtn.title = sequence ? 'По черзі (клік — повтор треку)' : 'Повтор треку (клік — по черзі)';
  }
  if (shuffleBtn) {
    shuffleBtn.classList.toggle('active', S.shuffle);
    shuffleBtn.title = S.shuffle ? 'Перемішування: увімкнено' : 'Перемішування: вимкнено';
  }
}

$('btnRepeatMode')?.addEventListener('click', () => {
  S.playMode = (S.playMode === 'single') ? 'sequence' : 'single';
  if (S.playing >= 0) audioEl.loop = (S.playMode === 'single' && !S.shuffle);
  syncPlayerControlsUI();
  saveSettings();
  showToast(S.playMode === 'sequence' ? '🔁 Відтворення по черзі' : '🔂 Повтор поточного треку');
});

$('btnShuffle')?.addEventListener('click', () => {
  S.shuffle = !S.shuffle;
  if (S.playing >= 0) audioEl.loop = (S.playMode === 'single' && !S.shuffle);
  syncPlayerControlsUI();
  saveSettings();
  showToast(S.shuffle ? '🔀 Перемішування увімкнено' : '🔀 Перемішування вимкнено');
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

const DAY_NAMES = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function alarmDaysLabel(days) {
  if (days === null || days === undefined) return 'Один раз';
  if (days === 'once') return 'Один раз';
  if (!Array.isArray(days) || days.length === 0) return 'Щодня';
  if (days.length === 7) return 'Щодня';
  if (JSON.stringify(days) === JSON.stringify([1,2,3,4,5])) return 'Пн–Пт';
  if (JSON.stringify(days) === JSON.stringify([6,7])) return 'Сб–Нд';
  return days.map(d => DAY_NAMES[d]).join(', ');
}

function renderNotifList() {
  loadAlarms();
  const list = $('alarmList');
  if (!list) return;
  if (!alarms.length) {
    list.innerHTML = `<div style="text-align:center; padding:16px 0; color:rgba(255,255,255,.3); font-size:13px;">${t('notif_empty').replace('\n','<br>')}</div>`;
    return;
  }
  list.innerHTML = alarms.map(a => {
    const h = String(a.hour).padStart(2,'0');
    const m = String(a.minute).padStart(2,'0');
    return `
    <div class="alarm-item" data-id="${a.id}">
      <div onclick="openAlarmModal(${a.id})" style="flex:1; cursor:pointer">
        <div class="alarm-time">${h}:${m}</div>
        <div class="alarm-label">${a.label || 'Нагадування'}</div>
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
      showToast(alarm.active ? '🔔 Увімкнено' : '🔕 Вимкнено');
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
      showToast('🗑️ Видалено');
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
  if (!timeVal) { showToast('⚠️ Вкажи час'); return; }
  const [h, m] = timeVal.split(':').map(Number);

  const isOnce    = document.querySelector('.day-btn[data-day="-1"]').classList.contains('active');
  const isEveryDay = document.querySelector('.day-btn[data-day="0"]').classList.contains('active');
  const days = isOnce ? 'once' : isEveryDay ? [] :
    [...document.querySelectorAll('.day-btn.active')]
      .map(b => +b.dataset.day).filter(d => d > 0);

  if (editingAlarmId !== null) {
    // Оновлюємо існуючий
    const alarm = alarms.find(a => a.id === editingAlarmId);
    if (alarm) {
      alarm.hour   = h;
      alarm.minute = m;
      alarm.days   = days;
      alarm.label  = $('alarmLabel').value.trim() || 'Нагадування';
      alarm.active = true;
    }
  } else {
    // Новий
    const newId = Date.now() % 100000; // унікальний id до 5 цифр
    alarms.push({ id: newId, hour: h, minute: m, days, label: $('alarmLabel').value.trim() || 'Нагадування', active: true });
  }

  saveAlarms();
  syncAlarmsToAndroid();
  renderNotifList();
  closeAlarmModal();
  showToast('✅ Нагадування збережено');
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

setTimeout(() => showToast('↑ свайп — наступний вірш'),   1600);
setTimeout(() => showToast('✦ довге натискання — тлумач'), 4800);

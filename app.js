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
    name: "Amazing Grace — Piano",
    src:  "https://archive.org/download/PianoMusic/01-Amazing%20Grace.mp3",
    license: "Public Domain / archive.org"
  },
  {
    name: "How Great Thou Art — Piano",
    src:  "https://archive.org/download/PianoMusic/05-How%20great%20thou%20art.mp3",
    license: "Public Domain / archive.org"
  },
  {
    name: "Love Lifted Me — Piano",
    src:  "https://archive.org/download/PianoMusic/07-Love%20lifted%20me.mp3",
    license: "Public Domain / archive.org"
  },
  {
    name: "Amazing Grace 2011 — Kevin MacLeod",
    src:  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Amazing%20Grace.mp3",
    license: "CC BY 3.0 — incompetech.com"
  },
  {
    name: "Peaceful Desolate — Kevin MacLeod",
    src:  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Peaceful%20Desolate.mp3",
    license: "CC BY 3.0 — incompetech.com"
  },
  {
    name: "Meditation Impromptu — Kevin MacLeod",
    src:  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2001.mp3",
    license: "CC BY 3.0 — incompetech.com"
  },
  {
    name: "Prelude in D — Kevin MacLeod",
    src:  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Prelude%20in%20D%20minor.mp3",
    license: "CC BY 3.0 — incompetech.com"
  },
  {
    name: "Because He Lives — Piano",
    src:  "https://archive.org/download/PianoMusic/02-Because%20he%20lives.mp3",
    license: "Public Domain / archive.org"
  },
];

const BACKGROUNDS = [
  { name: "Туманний ліс",  url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80" },
  { name: "Ранкове небо",  url: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80" },
  { name: "Гори у хмарах", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80" },
  { name: "Тихе озеро",    url: "https://images.unsplash.com/photo-1439853949212-36089e104e22?w=800&q=80" },
  { name: "Пшеничне поле", url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80" },
  { name: "Зоряне небо",   url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80" },
  { name: "Осінній ліс",   url: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80" },
  { name: "Захід сонця",   url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80" },
];

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
    S.pool = [...VERSES];
    renderVerse();
    showToast('📖 ' + VERSES.length + ' віршів завантажено');
  } catch (err) {
    console.error('verses.json не завантажився:', err);
    showToast('⚠️ Не вдалося завантажити вірші');
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
  anim:     true,
  stars:    true,
  playing:  -1,      // індекс глобального треку (-1 = не грає)
  verseAudioOn: false, // чи грає аудіо з вірша
  vol:      60,
  sheet:    false,
  notifs:   JSON.parse(localStorage.getItem('hv_notifs') || '[]'),
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

function cv()       { return S.pool[S.idx]; }
function isFav(id)  { return S.favs.some(v => v.id === id); }
function saveFavs() { localStorage.setItem('hv_fav',    JSON.stringify(S.favs)); }
function saveNotifs(){ localStorage.setItem('hv_notifs', JSON.stringify(S.notifs)); }

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

  // Фон: показуємо тільки на головній
  const activeScreen = document.querySelector('.screen.active');
  const onMain = activeScreen && activeScreen.id === 'screenMain';
  $('bg').style.opacity = onMain ? (S.stars ? '1' : '.25') : '0';

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


/* ─────────────────────────────────────
   6. РЕНДЕР ВІРША
───────────────────────────────────── */
function renderVerse(dir = 'up') {
  const v = cv(); if (!v) return;
  const write = () => {
    verseBookEl.textContent = v.book;
    verseTextEl.innerHTML   = formatText(v.text);
    verseRefEl.textContent  = v.ref + ' · Переклад Огієнка';
    applyStyle();
    // Якщо вірш має власне аудіо і глобальний плеєр не грає
    updateVerseAudio(v);
  };
  if (!S.anim) { write(); return; }
  verseCard.classList.add(dir === 'up' ? 'out-up' : 'out-down');
  setTimeout(() => {
    write();
    verseCard.classList.remove('out-up','out-down');
    verseCard.classList.add('in');
    setTimeout(() => verseCard.classList.remove('in'), 500);
  }, 260);
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

function next() { S.idx = (S.idx+1) % S.pool.length; renderVerse('up'); }
function prev() { S.idx = (S.idx-1+S.pool.length) % S.pool.length; renderVerse('down'); }


/* ─────────────────────────────────────
   7. НАВІГАЦІЯ
───────────────────────────────────── */
function goScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.screen === id));
  // Фон тільки на головній
  $('bg').style.opacity = (id === 'screenMain') ? (S.stars ? '1' : '.25') : '0';
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
  if (!isFav(v.id)) { S.favs.push(v); saveFavs(); showToast('♡  Додано до улюблених'); }
  else showToast('Вже в улюблених ✦');
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
$('btnChapter').addEventListener('click', () => { closeSheet(); showToast('📖 Читати розділ — незабаром…'); });
$('btnShare').addEventListener('click', () => {
  const v=cv(); if (!v) return; closeSheet();
  const txt = `«${v.text.replace(/\n/g,' ')}» — ${v.ref}`;
  if (navigator.share) navigator.share({text:txt}).catch(()=>{});
  else { navigator.clipboard?.writeText(txt); showToast('📋 Вірш скопійовано'); }
});


/* ─────────────────────────────────────
   10. УЛЮБЛЕНІ
───────────────────────────────────── */
function renderFavList() {
  if (!S.favs.length) {
    favList.innerHTML = `
      <div class="fav-empty">
        <div class="fav-empty-icon">🤍</div>
        <div class="fav-empty-text">Ще немає улюблених.<br>Двічі торкніться вірша, щоб додати.</div>
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
      saveFavs(); renderFavList(); showToast('Видалено');
    })
  );
}


/* ─────────────────────────────────────
   11. МУЗИКА — ГЛОБАЛЬНИЙ ПЛЕЄР
   Натискання на трек у Меню вмикає/вимикає глобальну фонову музику.
   Якщо вірш мав своє аудіо (audio_url) — воно замовкає.
───────────────────────────────────── */
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('pause', () => {
    audioEl.pause();
    S.playing = -1;
    S.verseAudioOn = false;
  });
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && S.playing >= 0) audioEl.pause();
});

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
      if (S.playing === i) {
        // Пауза — зупиняємо
        audioEl.pause();
        S.playing = -1;
        S.verseAudioOn = false;
        $(`track${i}`).classList.remove('playing');
        $(`tname${i}`).classList.remove('playing');
        $(`ico${i}`).textContent = '▶';
        return;
      }
      // Зупиняємо попередній
      if (S.playing >= 0) {
        $(`track${S.playing}`)?.classList.remove('playing');
        $(`tname${S.playing}`)?.classList.remove('playing');
        const pi = $(`ico${S.playing}`); if (pi) pi.textContent = '▶';
      }
      // Запускаємо новий
      S.verseAudioOn = false;
      audioEl.src    = t.src;
      audioEl.loop   = true;
      audioEl.volume = S.vol / 100;
      audioEl.play()
        .then(() => {
          S.playing = i;
          $(`track${i}`).classList.add('playing');
          $(`tname${i}`).classList.add('playing');
          $(`ico${i}`).textContent = '⏸';
          showToast('🎵 ' + t.name);
        })
        .catch(err => {
          console.warn('Audio error:', err);
          showToast('⚠️ Не вдалося завантажити трек');
        });
    });
  });
}

audioEl.volume = S.vol / 100;

// Коли трек закінчився (loop=true — не має бути, але на всяк випадок)
audioEl.addEventListener('ended', () => {
  if (S.playing >= 0) {
    $(`track${S.playing}`)?.classList.remove('playing');
    $(`tname${S.playing}`)?.classList.remove('playing');
    const pi = $(`ico${S.playing}`); if (pi) pi.textContent = '▶';
    S.playing = -1;
  }
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
      bgEl.style.backgroundImage   = `url('${url}')`;
      bgEl.style.backgroundSize    = 'cover';
      bgEl.style.backgroundPosition= 'center';
      bgEl.dataset.photo = '1';
      applyStyle();
      showToast('🖼️ Фон змінено');
    });
  });
}

$('bg').dataset.photo = '0';


/* ─────────────────────────────────────
   12. НАЛАШТУВАННЯ
───────────────────────────────────── */
document.querySelectorAll('.font-opt').forEach(o =>
  o.addEventListener('click', () => {
    document.querySelectorAll('.font-opt').forEach(x=>x.classList.remove('active'));
    o.classList.add('active'); S.font=o.dataset.font; applyStyle(); showToast('Шрифт змінено');
  })
);
document.querySelectorAll('.color-dot').forEach(d =>
  d.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(x=>x.classList.remove('active'));
    d.classList.add('active'); S.color=d.dataset.color; applyStyle();
  })
);

const fs = $('fontSizeSlider');
fs.addEventListener('input', e => { S.size=+e.target.value; setSliderBg(e.target,S.size); applyStyle(); });

const is = $('iconSizeSlider');
is.addEventListener('input', e => { S.iconSize=+e.target.value; setSliderBg(e.target,S.iconSize); applyStyle(); });

function mkToggle(id,key) {
  $(id).addEventListener('click', function() { S[key]=!S[key]; this.classList.toggle('on',S[key]); applyStyle(); });
}
mkToggle('tglShadow','shadow');
mkToggle('tglAnim','anim');
mkToggle('tglStars','stars');


/* ─────────────────────────────────────
   13. СПОВІЩЕННЯ
   УВАГА: Web Notification API у WebView (Android) показує дозвіл
   як «дозволити сповіщення для браузера», а не для додатку.
   Справжні push-сповіщення через Firebase Messaging (FCM)
   реалізуються на рівні Java/Android Studio — не тут.
   Цей блок зберігає розклад і показує UI; реальний тригер — FCM.
───────────────────────────────────── */
function renderNotifList() {
  const list = $('notifList'); if (!list) return;
  if (!S.notifs.length) {
    list.innerHTML = `<div class="notif-empty t-ui">Немає сповіщень.<br>Додай перше нижче.</div>`;
    return;
  }
  list.innerHTML = S.notifs.map((n,i) => `
    <div class="notif-item">
      <div class="notif-info">
        <div class="notif-time">${n.hour.toString().padStart(2,'0')}:${n.min.toString().padStart(2,'0')}</div>
        <div class="notif-days t-ui">${n.days.length===7?'Щодня':n.days.map(d=>DAYS_UK[d]).join(', ')}</div>
        <div class="notif-label t-ui">${n.label||'Час молитви'}</div>
      </div>
      <div class="notif-del" data-idx="${i}">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M1 1l10 10M11 1L1 11" stroke="#ff6060" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
    </div>`).join('');
  list.querySelectorAll('.notif-del').forEach(b =>
    b.addEventListener('click', () => {
      S.notifs.splice(+b.dataset.idx,1); saveNotifs(); renderNotifList(); showToast('Сповіщення видалено');
    })
  );
}

$('btnAddNotif').addEventListener('click', () => {
  $('notifEditor').classList.add('visible');
});
$('btnCancelNotif').addEventListener('click', () => {
  $('notifEditor').classList.remove('visible');
  $('notifTime').value=''; $('notifLabel').value='';
  document.querySelectorAll('.day-btn').forEach(b=>b.classList.remove('active'));
});

document.querySelector('.day-all')?.addEventListener('click', function() {
  const allActive = document.querySelectorAll('.day-btn:not(.day-all).active').length === 7;
  document.querySelectorAll('.day-btn:not(.day-all)').forEach(b =>
    b.classList.toggle('active', !allActive)
  );
});

document.querySelectorAll('.day-btn').forEach(b =>
  b.addEventListener('click', () => b.classList.toggle('active'))
);

$('btnSaveNotif').addEventListener('click', () => {
  const timeVal = $('notifTime').value;
  if (!timeVal) { showToast('⚠️ Вкажи час'); return; }
  const [hour,min] = timeVal.split(':').map(Number);
  const days = [...document.querySelectorAll('.day-btn.active')].map(b=>+b.dataset.day);
  if (!days.length) { showToast('⚠️ Вибери хоча б один день'); return; }
  const label = $('notifLabel').value || 'Час молитви';

  S.notifs.push({hour,min,days,label});
  saveNotifs();

  // Передаємо розклад у Android через JavascriptInterface (якщо підключений)
  if (window.AndroidBridge && window.AndroidBridge.scheduleNotification) {
    window.AndroidBridge.scheduleNotification(
      JSON.stringify({hour, min, days, label})
    );
    showToast('✅ Сповіщення збережено');
  } else {
    // Fallback: Web Notification (тільки коли вкладка відкрита)
    if ('Notification' in window && Notification.permission === 'granted') {
      scheduleWebNotif({hour,min,days,label});
      showToast('✅ Збережено (сповіщення тільки при відкритому додатку)');
    } else {
      showToast('✅ Розклад збережено. Push — через Android');
    }
  }

  $('notifTime').value='';
  $('notifLabel').value='';
  document.querySelectorAll('.day-btn').forEach(b=>b.classList.remove('active'));
  $('notifEditor').classList.remove('visible');
  renderNotifList();
});

// Web Notification — тільки резервний варіант (додаток має бути відкритий)
function scheduleWebNotif(n) {
  const now  = new Date();
  const next = new Date();
  next.setHours(n.hour, n.min, 0, 0);
  if (next <= now) next.setDate(next.getDate()+1);
  const delay = next - now;
  setTimeout(() => {
    if (n.days.includes(new Date().getDay())) {
      new Notification(n.label || 'Час молитви 🙏', {
        body: 'Holy Vibe чекає на тебе',
        icon: '/icon.png'
      });
    }
  }, delay);
}

// (відновлення сповіщень — в секції 14 INIT)


/* ─────────────────────────────────────
   14. INIT
───────────────────────────────────── */
applyStyle();
setSliderBg(fs, S.size);
setSliderBg(is, S.iconSize);
fetchVerses();
buildTrackList();
buildBgGrid();

// Запит дозволу Web Notifications (fallback — тільки якщо нема AndroidBridge)
if (!window.AndroidBridge && 'Notification' in window && Notification.permission === 'default') {
  setTimeout(() => {
    Notification.requestPermission();
  }, 4000);
} else if ('Notification' in window && Notification.permission === 'granted') {
  S.notifs.forEach(scheduleWebNotif);
}

setTimeout(() => showToast('↑ свайп — наступний вірш'),   1600);
setTimeout(() => showToast('✦ довге натискання — тлумач'), 4800);

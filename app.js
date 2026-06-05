/* ═══════════════════════════════════════════
   app.js  —  СЛОВО App
   Секції:
   1.  Дані (вірші + кеш тлумачень)
   2.  Стан (State)
   3.  DOM-посилання
   4.  Утиліти
   5.  Стиль вірша
   6.  Рендер вірша
   7.  Навігація
   8.  Свайп / жести
   9.  Нижня шторка
   10. Улюблені
   11. Музика
   12. Налаштування
   13. Init
═══════════════════════════════════════════ */


/* ─────────────────────────────────────
   1. ДАНІ
───────────────────────────────────── */
const VERSES = [
  {
    id: 1, book: "ПСАЛМИ",
    text: "Господь — Пастир мій,\nя не буду в недостатку.",
    ref: "Пс. 23:1", cat: "peace",
    ai: "Це не просто слова про матеріальне забезпечення. Це про стан серця, яке перестає панікувати. Коли Бог стає твоїм Пастирем — ти більше не шукаєш судомного контролю над майбутнім, ти входиш у Його абсолютну довіру. Твій дефіцит закривається Його Присутністю."
  },
  {
    id: 2, book: "ІСАЯ",
    text: "Не бійся, бо Я з тобою;\nне озирайся злякано, бо Я — Бог твій.",
    ref: "Іс. 41:10", cat: "fear",
    ai: "Страх не зникає від зміни обставин — він зникає від усвідомлення Хто поруч. Бог не каже: «Я приберу з твого життя все складне». Він каже: «Я буду тримати тебе за руку всередині цього». Коли Всемогутній тримає тебе, весь твій страх втрачає вагу."
  },
  {
    id: 3, book: "РИМЛЯН",
    text: "Усім, хто любить Бога і покликаний\nЙого постановою, усе сприяє на добро.",
    ref: "Рим. 8:28", cat: "hope",
    ai: "Навіть найбільший хаос, помилки чи болючі сезони Бог здатний переплавити на золото. Це не означає, що все, що відбувається — добре. Але це означає, що у Бога вистачить суверенної сили переплести будь-які уламки твого життя у шедевр."
  },
  {
    id: 4, book: "ВІД ІВАНА",
    text: "Мир залишаю вам, мир Мій даю вам;\nне так, як світ дає, Я даю вам.",
    ref: "Ів. 14:27", cat: "peace",
    ai: "Світ пропонує «мир» як відсутність проблем: на рахунку є гроші, навколо тиша, здоров'я в нормі. Божий мир — надприродний. Він приходить посеред шторму, коли логічно було б кричати від паніки, але всередині тебе панує незбагненна, глибока тишина Шалому."
  },
  {
    id: 5, book: "ФІЛІП'ЯНАМ",
    text: "Я все можу в Тім,\nХто мене підкріпляє — у Христі.",
    ref: "Фл. 4:13", cat: "strength",
    ai: "Цей вірш — не про супергеройську всемогутність. Павло писав це, сидячи у в'язниці. Це про надприродну здатність проходити через будь-які сезони — достаток чи злидні, тріумф чи ізоляцію — маючи внутрішнє джерело сили, яке ніколи не висихає."
  },
  {
    id: 6, book: "ПСАЛМИ",
    text: "Вгамуйтеся та знайте,\nщо Я — Бог!",
    ref: "Пс. 46:11", cat: "peace",
    ai: "В оригіналі слово «вгамуйтеся» буквально означає «опустіть руки», «перестаньте борсатися». Часто ми намагаємося самі вилікувати, витягнути та закрити всі тріщини. Бог каже: зупинись. Видихни. Дай Мені побути Богом у твоїй ситуації. Просто спостерігай."
  },
  {
    id: 7, book: "ЄРЕМІЯ",
    text: "Я знаю думки, які думаю про вас —\nдумки миру, а не на зло,\nщоб дати вам майбутнє та надію.",
    ref: "Єр. 29:11", cat: "hope",
    ai: "Ці слова були сказані народу, який перебував у жорстокому полоні. Коли тобі здається, що твоє життя на паузі або зруйноване, архітектурний план Бога щодо тебе не змінився. Його думки про тебе завжди просочені миром і відновленням. Твій фінал буде благословенним."
  },
  {
    id: 8, book: "ВІД МАТВІЯ",
    text: "Прийдіть до Мене, усі струджені\nта обтяжені — і Я заспокою вас!",
    ref: "Мт. 11:28", cat: "peace",
    ai: "Релігія та світ постійно вимагають: «відповідай критеріям, роби більше, біжи швидше». Ісус пропонує протилежне. Прийди втомленим. Прийди знесиленим. Його Присутність — це місце, де тобі не потрібно нічого доводити. Ти просто входиш у Його відпочинок."
  },
  {
    id: 9, book: "1 ІВАНА",
    text: "Бог є любов, і хто перебуває в любові,\nтой перебуває в Богові,\nі Бог перебуває в ньому.",
    ref: "1 Ів. 4:16", cat: "love",
    ai: "Любов — це не просто емоція Бога чи Його ставлення до тебе. Це Його сутність. Ти не можеш змусити Його любити тебе менше своїми помилками, і не можеш змусити любити більше своїми досягненнями. Ти просто занурюєшся в океан любові, який уже є."
  },
  {
    id: 10, book: "ПСАЛМИ",
    text: "Куштуйте і побачте,\nякий добрий Господь!\nБлаженна людина, що надію покладає на Нього.",
    ref: "Пс. 34:9", cat: "love",
    ai: "Бога неможливо зрозуміти суто теоретично, через книги чи чужі розповіді. Його потрібно «скуштувати» — пережити особисто на досвіді. Коли ти хоча б раз відчуєш Його реальну доброту у своєму житті, твій світогляд зміниться назавжди. Ти знайдеш свій безпечний якір."
  },
  {
    id: 11, book: "РИМЛЯН",
    text: "Ніщо не зможе відлучити нас\nвід любові Божої,\nщо в Христі Ісусі, Господі нашому.",
    ref: "Рим. 8:39", cat: "love",
    ai: "Між тобою і Богом немає дистанції, яку Він не міг би подолати. Твоє почуття провини, твої кризи, твій розпач чи навіть фізичні загрози — ніщо не має такої сили, щоб розірвати залізобетонний зв'язок Божої любові до тебе. Ти назавжди в безпеці."
  },
  {
    id: 12, book: "ПСАЛМИ",
    text: "Хто живе під покровом Всевишнього,\nтой під тінню Всемогутнього спочиває.",
    ref: "Пс. 91:1", cat: "fear",
    ai: "Тінь Всемогутнього — це місце повної ізоляції від стріл ворога та життєвих бур. Це не означає, що навколо немає небезпеки — це означає, що над тобою розгорнутий небесний купол. Твоє завдання — свідомо обирати залишатися в цій таємній кімнаті спілкування з Ним."
  },
  {
    id: 13, book: "ЯКОВА",
    text: "Молитва віри зцілить недужого,\nі підійме його Господь.",
    ref: "Як. 5:15", cat: "healing",
    ai: "Молитва віри — це не маніпуляція Богом, це повна капітуляція перед Його силою і згода з Його Словом. Коли твій розум каже «все скінчено», а тіло слабшає, віра дивиться на рани Христа. У Нього є сила підняти тебе з будь-якого занепаду — фізичного чи духовного."
  },
  {
    id: 14, book: "ОБ'ЯВЛЕННЯ",
    text: "Ось Я стою під дверима та стукаю.\nЯкщо хто почує Мій голос\nі відчинить двері — Я увійду до нього.",
    ref: "Об. 3:20", cat: "love",
    ai: "Творець Всесвіту ніколи не виламує двері твого серця силою. Він стоїть як Джентльмен і тихо стукає через обставини, прагнення душі, через цей самий екран. Він чекає на твій свідомий вибір відчинити засув і впустити Його у свій внутрішній світ."
  },
  {
    id: 15, book: "ІСАЯ",
    text: "Ті, хто надію покладає на Господа,\nвідновлять сили, підіймуть крила, мов орли,\nпобіжать — і не втомляться.",
    ref: "Іс. 40:31", cat: "strength",
    ai: "Людські ресурси завжди вичерпні — навіть молоді й сильні падають від утоми. Але коли ти «чекаєш на Господа», відбувається надприродний обмін: ти віддаєш Йому свою слабкість, а Він натомість вливає в тебе Свою невичерпну енергію. Ти отримуєш здатність злетіти над проблемою."
  }
];

const FONTS = {
  cormorant: "'Cormorant Garamond', serif",
  georgia:   "Georgia, serif",
  nunito:    "'Nunito', sans-serif"
};


/* ─────────────────────────────────────
   2. СТАН
───────────────────────────────────── */
const S = {
  cat:     'all',
  pool:    [...VERSES],
  idx:     0,
  favs:    JSON.parse(localStorage.getItem('slovo_fav') || '[]'),
  font:    'cormorant',
  color:   '#f0e8d5',
  size:    50,
  shadow:  true,
  anim:    true,
  stars:   true,
  playing: -1,
  vol:     60,
  sheet:   false
};


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

function cv()        { return S.pool[S.idx]; }
function isFav(id)   { return S.favs.some(v => v.id === id); }
function saveFavs()  { localStorage.setItem('slovo_fav', JSON.stringify(S.favs)); }

/* Переноси \n → <br>, але не HTML-ін'єкція */
function formatText(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>');
}

function setSliderBg(el, val) {
  el.style.background =
    `linear-gradient(to right, var(--clr-gold) ${val}%, rgba(255,255,255,.1) ${val}%)`;
}


/* ─────────────────────────────────────
   5. СТИЛЬ ВІРША
───────────────────────────────────── */
function applyStyle() {
  verseTextEl.style.fontFamily = FONTS[S.font];
  verseTextEl.style.color      = S.color;
  const base = 18 + (S.size / 100) * 12;
  verseTextEl.style.fontSize   = `clamp(${base-2}px, ${(base*.45).toFixed(1)}vw, ${base+4}px)`;
  verseTextEl.style.textShadow = S.shadow ? '0 2px 30px rgba(0,0,0,.8)' : 'none';
  $('bg').style.opacity        = S.stars  ? '1' : '.25';
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
  };

  if (!S.anim) { write(); return; }

  verseCard.classList.add(dir === 'up' ? 'out-up' : 'out-down');
  setTimeout(() => {
    write();
    verseCard.classList.remove('out-up', 'out-down');
    verseCard.classList.add('in');
    setTimeout(() => verseCard.classList.remove('in'), 500);
  }, 260);
}

function next() { S.idx = (S.idx + 1) % S.pool.length; renderVerse('up'); }
function prev() { S.idx = (S.idx - 1 + S.pool.length) % S.pool.length; renderVerse('down'); }


/* ─────────────────────────────────────
   7. НАВІГАЦІЯ
───────────────────────────────────── */
function goScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.screen === id)
  );
  if (id === 'screenFav') renderFavList();
}

document.querySelectorAll('.nav-btn').forEach(b =>
  b.addEventListener('click', () => goScreen(b.dataset.screen))
);

// Категорії
$('catBar').addEventListener('click', e => {
  const p = e.target.closest('.pill'); if (!p) return;
  document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
  p.classList.add('active');
  S.cat  = p.dataset.cat;
  S.pool = S.cat === 'all' ? [...VERSES] : VERSES.filter(v => v.cat === S.cat);
  S.idx  = 0;
  renderVerse('up');
});


/* ─────────────────────────────────────
   8. СВАЙП / ЖЕСТИ
   Розведено явно:
   • вертикальний delta > 35px → свайп
   • довге натискання (~520ms) → шторка
   • короткий клік без руху → нічого
     (шторку відкриває тільки long press)
   • подвійний тап → улюблені
───────────────────────────────────── */
let startY = 0, startX = 0, moved = false;
let longTimer = null, dragging = false;
let lastTap = 0;

const vw = $('verseWrap');

function startGesture(y, x) {
  startY = y; startX = x; moved = false; dragging = true;
  if (!S.sheet) longTimer = setTimeout(openSheet, 520);
}

function moveGesture(y, x) {
  if (!dragging) return;
  if (Math.abs(y - startY) > 10 || Math.abs(x - startX) > 10) {
    moved = true;
    if (longTimer) { clearTimeout(longTimer); longTimer = null; }
  }
}

function endGesture(y) {
  if (!dragging) return; dragging = false;
  if (longTimer) { clearTimeout(longTimer); longTimer = null; }
  if (S.sheet) return;
  const dy = startY - y;
  if (Math.abs(dy) > 35) { dy > 0 ? next() : prev(); }
}

vw.addEventListener('touchstart', e => startGesture(e.touches[0].clientY, e.touches[0].clientX), { passive: true });
vw.addEventListener('touchmove',  e => moveGesture(e.touches[0].clientY,  e.touches[0].clientX), { passive: true });
vw.addEventListener('touchend',   e => {
  endGesture(e.changedTouches[0].clientY);
  // Подвійний тап
  const now = Date.now();
  if (!moved && now - lastTap < 300) triggerHeart();
  lastTap = now;
});

// Мишка (десктоп-демо)
vw.addEventListener('mousedown', e => startGesture(e.clientY, e.clientX));
window.addEventListener('mousemove', e => moveGesture(e.clientY, e.clientX));
window.addEventListener('mouseup',   e => {
  endGesture(e.clientY);
  const now = Date.now();
  if (!moved && now - lastTap < 320 && !S.sheet) triggerHeart();
  lastTap = now;
});

function triggerHeart() {
  const v = cv(); if (!v) return;
  if (!isFav(v.id)) { S.favs.push(v); saveFavs(); showToast('♡  Додано до улюблених'); }
  else showToast('Вже в улюблених ✦');
  heartBurst.classList.remove('pop');
  void heartBurst.offsetWidth;
  heartBurst.classList.add('pop');
  setTimeout(() => heartBurst.classList.remove('pop'), 900);
}


/* ─────────────────────────────────────
   9. НИЖНЯ ШТОРКА
───────────────────────────────────── */
function openSheet() {
  const v = cv(); if (!v) return;
  sheetPrev.textContent = v.text.replace(/\n/g,' ').substring(0, 90) + '…';
  aiPanel.classList.remove('visible');
  S.sheet = true;
  sheetEl.classList.add('open');
  overlayEl.classList.add('show');
}
function closeSheet() {
  S.sheet = false;
  sheetEl.classList.remove('open');
  overlayEl.classList.remove('show');
}

overlayEl.addEventListener('click', closeSheet);

// Пояснити — миттєво з кешу
$('btnAI').addEventListener('click', () => {
  const v = cv(); if (!v) return;
  aiAnswer.textContent = v.ai;
  aiPanel.classList.add('visible');
});

// Читати розділ
$('btnChapter').addEventListener('click', () => {
  closeSheet();
  showToast('📖 Читати розділ — незабаром…');
});

// Поділитися
$('btnShare').addEventListener('click', () => {
  const v = cv(); if (!v) return;
  closeSheet();
  const txt = `«${v.text.replace(/\n/g,' ')}» — ${v.ref}`;
  if (navigator.share) {
    navigator.share({ text: txt }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(txt);
    showToast('📋 Вірш скопійовано');
  }
});


/* ─────────────────────────────────────
   10. УЛЮБЛЕНІ
───────────────────────────────────── */
function renderFavList() {
  if (!S.favs.length) {
    favList.innerHTML = `
      <div class="fav-empty">
        <div class="fav-empty-icon">🤍</div>
        <div class="fav-empty-text">Ще немає улюблених.<br>Двічі торкніться вірша,<br>щоб додати сюди.</div>
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
      saveFavs(); renderFavList();
      showToast('Видалено');
    })
  );
}


/* ─────────────────────────────────────
   11. МУЗИКА
───────────────────────────────────── */
[0, 1, 2].forEach(i => {
  $(`track${i}`).addEventListener('click', () => {
    if (S.playing === i) {
      audioEl.pause(); S.playing = -1;
      $(`track${i}`).classList.remove('playing');
      $(`tname${i}`).classList.remove('playing');
      $(`ico${i}`).textContent = '▶';
    } else {
      // Зупиняємо попередній
      if (S.playing >= 0) {
        $(`track${S.playing}`).classList.remove('playing');
        $(`tname${S.playing}`).classList.remove('playing');
        $(`ico${S.playing}`).textContent = '▶';
      }
      audioEl.src = $(`track${i}`).dataset.src;
      audioEl.volume = S.vol / 100;
      audioEl.play()
        .then(() => {
          S.playing = i;
          $(`track${i}`).classList.add('playing');
          $(`tname${i}`).classList.add('playing');
          $(`ico${i}`).textContent = '⏸';
          showToast('🎵 Відтворення…');
        })
        .catch(() => showToast('⚠️ Не вдалося завантажити трек'));
    }
  });
});

const vol = $('volSlider');
vol.addEventListener('input', e => {
  S.vol = +e.target.value;
  audioEl.volume = S.vol / 100;
  setSliderBg(e.target, S.vol);
});


/* ─────────────────────────────────────
   12. НАЛАШТУВАННЯ
───────────────────────────────────── */

// Шрифт
document.querySelectorAll('.font-opt').forEach(o =>
  o.addEventListener('click', () => {
    document.querySelectorAll('.font-opt').forEach(x => x.classList.remove('active'));
    o.classList.add('active');
    S.font = o.dataset.font;
    applyStyle();
    showToast('Шрифт змінено');
  })
);

// Колір
document.querySelectorAll('.color-dot').forEach(d =>
  d.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(x => x.classList.remove('active'));
    d.classList.add('active');
    S.color = d.dataset.color;
    applyStyle();
  })
);

// Розмір
const fs = $('fontSizeSlider');
fs.addEventListener('input', e => {
  S.size = +e.target.value;
  setSliderBg(e.target, S.size);
  applyStyle();
});

// Тогли
function mkToggle(id, key) {
  $(id).addEventListener('click', function () {
    S[key] = !S[key];
    this.classList.toggle('on', S[key]);
    applyStyle();
  });
}
mkToggle('tglShadow', 'shadow');
mkToggle('tglAnim',   'anim');
mkToggle('tglStars',  'stars');


/* ─────────────────────────────────────
   13. INIT
───────────────────────────────────── */
applyStyle();
renderVerse();
setSliderBg(vol, S.vol);
setSliderBg(fs,  S.size);

setTimeout(() => showToast('↑ свайп — наступний вірш'),   1600);
setTimeout(() => showToast('✦ довге натискання — тлумач'), 4800);

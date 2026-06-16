/* ═══════════════════════════════════════════
   i18n.js  —  Holy Vibe
   Система мовних файлів (готові переклади з папки lang/)

   Як працює тепер:
   1. При старті додатку визначаємо мову пристрою (navigator.language).
      Якщо для неї є готовий переклад — вмикаємо її автоматично.
      Якщо юзер уже колись сам обрав мову в налаштуваннях — її і
      використовуємо, навіть якщо мова пристрою інша.
   2. Файл перекладу (lang/{code}.json — те саме, що і uk.json,
      але іншою мовою) довантажується одним fetch-запитом і
      кешується в localStorage — вдруге з мережі не тягнеться.
   3. У налаштуваннях юзер може будь-коли сам перемкнути мову —
      його вибір завжди має пріоритет і запам'ятовується назавжди.

   Що перекладається:
   - Всі вірші (text, book, ref, ai) — масив "verses" у lang-файлі
   - Назви категорій — об'єкт "_categories" у lang-файлі
   - Рядки інтерфейсу — об'єкт "ui" у lang-файлі (UI_STRINGS нижче —
     це лише дефолтні українські значення для t() і запасний варіант)

   ⚠️ ШІ-переклад (Gemini) вимкнено й прибрано з ужитку —
   юзери чекали занадто довго. Весь той код залишився нижче,
   в розділі "ЗАКОНСЕРВОВАНО", про всяк випадок на майбутнє.
   Він ніде не викликається.
═══════════════════════════════════════════ */

// ─── Тут лежать готові переклади. Поклади поруч з index.html папку
//     "lang" і файли lang/en.json, lang/ru.json, lang/pl.json... —
//     кожен у тому самому форматі, що й uk.json. ────────────────────
const LANG_FOLDER = 'lang/';

// Підвищуй цю цифру, коли заливаєш ОНОВЛЕНІ переклади на гітхаб —
// це змусить додаток ігнорувати старий кеш у телефонах юзерів
// і підвантажити свіжий файл.
const LANG_CACHE_VERSION = 1;
// ────────────────────────────────────────────────────────────────────

// Поточна активна мова ('uk' = українська = оригінал, без перекладу)
let currentLang = 'uk';

// Кеш перекладів у пам'яті { 'en': { verses: [...], ui: {...}, categories:{...} }, ... }
const translationCache = {};

// Підтримувані мови.
// ready: true  → файл lang/{code}.json вже завантажений на гітхаб, мову можна вибрати
// ready: false → переклад ще не готовий, у списку мов вона не показується
// Коли заллєш черговий переклад — просто зміни йому ready на true.
const SUPPORTED_LANGUAGES = [
  { code: 'uk', name: '🇺🇦 Українська', native: 'Українська', ready: true },
  { code: 'en', name: '🇬🇧 English',    native: 'English',    ready: true },
  { code: 'pl', name: '🇵🇱 Polski',     native: 'Polski',     ready: false },
  { code: 'de', name: '🇩🇪 Deutsch',    native: 'Deutsch',    ready: true },
  { code: 'fr', name: '🇫🇷 Français',   native: 'Français',   ready: true },
  { code: 'es', name: '🇪🇸 Español',    native: 'Español',    ready: true },
  { code: 'pt', name: '🇧🇷 Português',  native: 'Português',  ready: false },
  { code: 'ro', name: '🇷🇴 Română',     native: 'Română',     ready: false },
  { code: 'ru', name: '🇷🇺 Русский',    native: 'Русский',    ready: false },
  { code: 'zh', name: '🇨🇳 中文',       native: '中文',        ready: false },
  { code: 'ar', name: '🇸🇦 العربية',    native: 'العربية',    ready: false },
  { code: 'hi', name: '🇮🇳 हिन्दी',      native: 'हिन्दी',      ready: false },
  { code: 'sw', name: '🇰🇪 Kiswahili',  native: 'Kiswahili',  ready: false },
  { code: 'it', name: '🇮🇹 Italiano', native: 'Italiano', ready: true },
  { code: 'el', name: '🇬🇷 Ελληνικά', native: 'Ελληνικά', ready: true },
];

// Лише ті мови, для яких реально є готовий файл
const READY_LANGUAGES = SUPPORTED_LANGUAGES.filter(l => l.ready).map(l => l.code);

// Рядки інтерфейсу — все що юзер бачить у тексті
const UI_STRINGS = {
  uk: {
    // Навігація
    nav_word:      'Слово',
    nav_favs:      'Улюблені',
    nav_menu:      'Меню',
    nav_settings:  'Вигляд',
    // Головний екран
    cat_all:       'Усі',
    swipe_hint:    'свайп вгору',
    translation:   'Переклад Огієнка',
    // Улюблені
    favs_title:    'Улюблені вірші',
    favs_empty:    'Ще немає улюблених.\nДвічі торкніться вірша, щоб додати.',
    // Шторка
    sheet_title:   'Цей вірш',
    btn_explain:   'Пояснити цей вірш',
    btn_share:     'Поділитися',
    ai_ref:        '✦ Духовне тлумачення',
    // Меню
    menu_logo:     'СЛОВО',
    menu_tagline:  'Просочення Живим Словом',
    music_title:   '🎵 Молитовна музика (CC)',
    donate_title:  'Підтримати проєкт ❤️',
    // Налаштування
    settings_title:     'Оформлення',
    settings_font:      'Шрифт',
    settings_font_classic: 'Класика',
    settings_font_tradition: 'Традиція',
    settings_font_modern: 'Сучасний',
    settings_size:      'Розмір тексту',
    settings_icon_size: 'Розмір іконок і навігації',
    settings_color:     'Колір тексту',
    settings_bg:        'Фон',
    settings_extra:     'Додатково',
    toggle_shadow:      'Тінь тексту',
    toggle_anim:        'Анімація переходу',
    toggle_stars:       'Зірочки на фоні',
    toggle_autobg:      'Фон змінюється з віршем',
    settings_lang:      '🌐 Мова',
    // Нагадування
    notif_title:   '🔔 Нагадування для молитви',
    notif_empty:   'Немає нагадувань.\nДодай перше нижче 🙏',
    notif_add:     '+ Додати нагадування',
    alarm_modal_title: 'Налаштування нагадування',
    alarm_label_ph:    'Ранкова молитва',
    alarm_name:        'Назва',
    alarm_time:        'Час',
    alarm_days:        'Дні тижня',
    alarm_once:        'Один раз',
    alarm_daily:       'Щодня',
    alarm_cancel:      'Скасувати',
    alarm_save:        'Зберегти 🔔',
    day_mon: 'Пн', day_tue: 'Вт', day_wed: 'Ср',
    day_thu: 'Чт', day_fri: 'Пт', day_sat: 'Сб', day_sun: 'Нд',
    // Тости
    toast_loaded:  '📖 {n} віршів завантажено',
    toast_copied:  '📋 Вірш скопійовано',
    toast_added_fav:   '🤍 Додано до улюблених',
    toast_removed_fav: 'Видалено з улюблених',
    toast_deleted:     '🗑️ Видалено',
    toast_saved:       '✅ Нагадування збережено',
    toast_enabled:     '🔔 Увімкнено',
    toast_disabled:    '🔕 Вимкнено',
    toast_shadow_off:  'Тінь вимкнена',
    toast_font_changed:'Шрифт змінено',
    toast_bg_changed:  '🖼️ Фон змінено',
    toast_bg_removed:  '🖼️ Фон прибрано',
    toast_autobg_on:   '🖼️ Авто-фон увімкнено',
    toast_autobg_off:  '🖼️ Авто-фон вимкнено',
    toast_swipe:       '↑ свайп — наступний вірш',
    toast_longpress:   '✦ довге натискання — тлумач',
    toast_translating: '🌐 Перекладаю...',
    toast_translated:  '✅ Переклад готовий!',
    toast_trans_error: '⚠️ Помилка перекладу',
    toast_time_missing:'⚠️ Вкажи час',
    // Прогрес перекладу
    trans_progress:    'Перекладаю {done} / {total} віршів...',
    trans_ui:          'Перекладаю інтерфейс...',
    trans_caching:     'Зберігаю переклад...',
  }
};

// Категорії — назви для перекладу
const CATEGORY_NAMES_UK = {
  peace:    'Мир',
  love:     'Любов',
  faith:    'Віра',
  victory:  'Перемога',
  strength: 'Сила',
  hope:     'Надія',
  healing:  'Зцілення',
  grace:    'Благодать',
  promises: 'Обітниці',
};


/* ═════════════════════════════════════════════════════════
   ЗАКОНСЕРВОВАНО — ШІ-переклад через Gemini (НЕ ВИКОРИСТОВУЄТЬСЯ)
   ═════════════════════════════════════════════════════════
   Цей блок коду (callGemini, translateVerseBatch, translateUI,
   translateCategories, translateToLanguage) ніде не викликається
   в поточній версії додатку. Залишений навмисно — раніше це була
   жива функція "перекласти мову на ходу", але вона перекладала
   903 вірші ХВИЛИНАМИ через ліміти Gemini API, тому її приховали
   від юзерів і замінили на готові lang-файли (нижче).

   Якщо колись знадобиться — досить буде:
   1. Розкоментувати викликати translateToLanguage(code) замість
      loadLanguageFile(code) у функції switchLanguage().
   2. Переконатися, що TRANSLATE_PROXY_URL ще живий (Cloudflare Worker).
───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────
   ЯДРО ПЕРЕКЛАДУ
───────────────────────────────────── */
// ─── Адреса Cloudflare Worker (проксі для Gemini) — потрібна лише
//     для коду нижче, який зараз не використовується ─────────────────
const TRANSLATE_PROXY_URL = 'https://holy-vibe-translate.nicklavigneua.workers.dev';
// ────────────────────────────────────────────────────────────────────

// Пауза між запитами, щоб не впиратися в ліміт 15 запитів/хв
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
const REQUEST_DELAY_MS = 4500; // ~13 запитів/хв — з запасом

// Викликати Gemini API через наш Cloudflare Worker (ключ ховається на сервері)
// При 429 (rate limit) — чекає і повторює, до 4 спроб
async function callGemini(prompt, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const resp = await fetch(TRANSLATE_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (resp.status === 429) {
      if (attempt < retries) {
        await sleep(15000 * (attempt + 1)); // 15с, 30с, 45с, 60с
        continue;
      }
      throw new Error('429 — забагато запитів, спробуйте через хвилину');
    }

    if (!resp.ok) throw new Error(`Помилка проксі: ${resp.status}`);
    const data = await resp.json();
    if (data.error) throw new Error(data.error);
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}

// Перекласти батч віршів ОДНИМ запитом (текст, книга, посилання, тлумачення разом)
async function translateVerseBatch(batch, langName) {
  const payload = {
    texts: batch.map(v => v.text),
    books: batch.map(v => v.book),
    refs:  batch.map(v => v.ref),
    ais:   batch.map(v => v.ai || ''),
  };

  const prompt = `You are a professional Bible translator. Translate the following JSON object from Ukrainian to ${langName}.

CRITICAL RULES:
- Return ONLY a valid JSON object with the exact same structure (keys: "texts", "books", "refs", "ais")
- Each array must have exactly ${batch.length} elements, in the same order
- Preserve \\n line breaks exactly as they are
- Keep Bible references (like "Пс. 23:1", "Ів. 3:16") in standard format for ${langName}
- If an element of "ais" is an empty string "", keep it as an empty string "" in the output
- Use a reverent, literary style appropriate for Scripture
- Do NOT add any explanation, markdown, or commentary

Input JSON:
${JSON.stringify(payload)}

Output JSON:`;

  const raw = await callGemini(prompt);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object in verse batch response');
  return JSON.parse(match[0]);
}

// Перекласти об'єкт рядків інтерфейсу
async function translateUI(targetLang, langName) {
  const uk = UI_STRINGS.uk;
  const keys = Object.keys(uk);
  const values = Object.values(uk);

  const prompt = `You are a professional translator. Translate the following JSON array of UI strings for a Bible app from Ukrainian to ${langName}.

CRITICAL RULES:
- Return ONLY a valid JSON array with exactly ${keys.length} elements
- Keep {n}, {done}, {total} placeholders exactly as they are
- Keep emoji exactly as they are
- Keep \\n exactly as they are
- Use natural, friendly tone for a mobile app
- Do NOT add explanation or markdown

Input:
${JSON.stringify(values)}

Output:`;

  const raw = await callGemini(prompt);
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array in UI response');
  const translated = JSON.parse(match[0]);

  const result = {};
  keys.forEach((k, i) => { result[k] = translated[i] ?? uk[k]; });
  return result;
}

// Перекласти назви категорій
async function translateCategories(targetLang, langName) {
  const keys = Object.keys(CATEGORY_NAMES_UK);
  const values = Object.values(CATEGORY_NAMES_UK);

  const prompt = `Translate these Bible category names from Ukrainian to ${langName}. Return ONLY a JSON array of ${keys.length} translated strings, nothing else.
Input: ${JSON.stringify(values)}
Output:`;

  const raw = await callGemini(prompt);
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return CATEGORY_NAMES_UK;
  const translated = JSON.parse(match[0]);
  const result = {};
  keys.forEach((k, i) => { result[k] = translated[i] ?? CATEGORY_NAMES_UK[k]; });
  return result;
}


/* ─────────────────────────────────────
   ГОЛОВНА ФУНКЦІЯ ПЕРЕКЛАДУ
───────────────────────────────────── */
async function translateToLanguage(langCode, onProgress) {
  // Шукаємо назву мови
  const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
  const langName = langObj ? langObj.native : langCode;

  // Перевіряємо кеш в localStorage
  const cacheKey = `hv_trans_${langCode}`;
  const partialKey = `hv_trans_partial_${langCode}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      translationCache[langCode] = JSON.parse(cached);
      return translationCache[langCode];
    } catch { /* пошкоджений кеш — перекладаємо знову */ }
  }

  // Отримуємо вірші з глобального масиву VERSES
  const verses = VERSES || [];
  const total = verses.length;
  const BATCH = 15; // менший батч — швидша і надійніша відповідь

  // Перевіряємо, чи є збережений прогрес (на випадок попередньої переривання)
  let translatedUI, translatedCats, translatedVerses = [], startIdx = 0;
  const partial = localStorage.getItem(partialKey);
  if (partial) {
    try {
      const p = JSON.parse(partial);
      translatedUI    = p.ui;
      translatedCats  = p.categories;
      translatedVerses = p.verses || [];
      startIdx = translatedVerses.length;
    } catch { /* ігноруємо пошкоджений прогрес */ }
  }

  onProgress && onProgress(0, total, 'ui');

  // 1. Перекладаємо інтерфейс (якщо ще не зроблено)
  if (!translatedUI) {
    translatedUI = await translateUI(langCode, langName);
    await sleep(REQUEST_DELAY_MS);
  }

  // 2. Перекладаємо категорії (якщо ще не зроблено)
  if (!translatedCats) {
    translatedCats = await translateCategories(langCode, langName);
    await sleep(REQUEST_DELAY_MS);
  }

  // Зберігаємо проміжний прогрес після кожного батча —
  // якщо процес переривається (помилка/закриття), наступний запуск продовжить звідси
  const savePartial = () => {
    localStorage.setItem(partialKey, JSON.stringify({
      ui: translatedUI, categories: translatedCats, verses: translatedVerses,
    }));
  };
  savePartial();
  onProgress && onProgress(startIdx, total, 'verses');

  // 3. Перекладаємо вірші батчами — по одному запиту на батч, з паузою між ними
  for (let i = startIdx; i < total; i += BATCH) {
    const batch = verses.slice(i, i + BATCH);

    const translated = await translateVerseBatch(batch, langName);

    batch.forEach((v, j) => {
      translatedVerses.push({
        id:   v.id,
        book: translated.books?.[j] || v.book,
        text: translated.texts?.[j] || v.text,
        ref:  translated.refs?.[j]  || v.ref,
        ai:   translated.ais?.[j]   ?? (v.ai || ''),
        cat:  v.cat,
        audio_url: v.audio_url,
      });
    });

    savePartial();
    onProgress && onProgress(Math.min(i + BATCH, total), total, 'verses');

    // Пауза перед наступним запитом (окрім останнього батча)
    if (i + BATCH < total) await sleep(REQUEST_DELAY_MS);
  }

  // Зберігаємо фінальний результат і прибираємо тимчасовий прогрес
  const result = {
    ui:         translatedUI,
    verses:     translatedVerses,
    categories: translatedCats,
    lang:       langCode,
    timestamp:  Date.now(),
  };

  translationCache[langCode] = result;
  localStorage.setItem(cacheKey, JSON.stringify(result));
  localStorage.removeItem(partialKey);

  return result;
}


/* ─────────────────────────────────────
   ЗАСТОСУВАННЯ ПЕРЕКЛАДУ ДО ДОДАТКУ
───────────────────────────────────── */
function applyTranslation(langCode) {
  if (langCode === 'uk') {
    // Відновлюємо оригінальні вірші
    if (window._VERSES_ORIGINAL) {
      VERSES.length = 0;
      VERSES.push(...window._VERSES_ORIGINAL);
      S.pool = S.cat === 'all' ? [...VERSES] : VERSES.filter(v => v.cat === S.cat);
    }
    // Відновлюємо оригінальні категорії
    refreshCatBar(window._CATEGORIES_UK || {}, UI_STRINGS.uk.cat_all);
    // Відновлюємо рядки UI
    applyUIStrings(UI_STRINGS.uk);

    currentLang = 'uk';
    renderVerse();
    return;
  }

  const data = translationCache[langCode];
  if (!data) return;

  // Замінюємо вірші перекладеними
  if (data.verses && data.verses.length) {
    if (!window._VERSES_ORIGINAL) {
      window._VERSES_ORIGINAL = [...VERSES];
    }
    VERSES.length = 0;
    VERSES.push(...data.verses);
    // Оновлюємо пул
    S.pool = S.cat === 'all' ? [...VERSES] : VERSES.filter(v => v.cat === S.cat);
  }

  // Оновлюємо категорії (з перекладеною назвою "Усі")
  refreshCatBar(data.categories || {}, data.ui?.cat_all);

  // Застосовуємо рядки UI
  applyUIStrings(data.ui);

  currentLang = langCode;
  renderVerse();
}

// Перебудовує пілюлі категорій з перекладеними назвами,
// відновлює активну пілюлю відповідно до S.cat і оновлює мітку кнопки
function refreshCatBar(categories, allLabel) {
  buildCatPills(categories);
  buildCatOrder(categories);

  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  const activePill = document.querySelector(`.pill[data-cat="${S.cat}"]`)
                   || document.querySelector('.pill[data-cat="all"]');

  const allPill = document.querySelector('.pill[data-cat="all"]');
  if (allPill && allLabel) allPill.textContent = allLabel;

  if (activePill) {
    activePill.classList.add('active');
    const toggleLabel = document.getElementById('catToggleLabel');
    if (toggleLabel) toggleLabel.textContent = activePill.textContent;
  }
}

// Застосовуємо рядки UI до DOM
function applyUIStrings(ui) {
  if (!ui) return;

  // Навігація
  const navLabels = document.querySelectorAll('.nav-label');
  const navKeys = ['nav_word', 'nav_favs', 'nav_menu', 'nav_settings'];
  navLabels.forEach((el, i) => { if (navKeys[i] && ui[navKeys[i]]) el.textContent = ui[navKeys[i]]; });

  // "Усі" у catBar і catToggleLabel
  const allPill = document.querySelector('.pill[data-cat="all"]');
  if (allPill && ui.cat_all) allPill.textContent = ui.cat_all;
  const toggleLabel = document.getElementById('catToggleLabel');
  if (toggleLabel && S.cat === 'all' && ui.cat_all) toggleLabel.textContent = ui.cat_all;

  // Підказка свайпу
  const swipeHint = document.querySelector('.swipe-hint-text');
  if (swipeHint && ui.swipe_hint) swipeHint.textContent = ui.swipe_hint;

  // Заголовки екранів
  const favTitle = document.querySelector('#screenFav .screen-header .t-label');
  if (favTitle && ui.favs_title) favTitle.textContent = ui.favs_title;
  const settingsTitle = document.querySelector('#screenSettings .screen-header .t-label');
  if (settingsTitle && ui.settings_title) settingsTitle.textContent = ui.settings_title;

  // Шторка
  const sheetTitle = document.querySelector('.sheet-section-title');
  if (sheetTitle && ui.sheet_title) sheetTitle.textContent = ui.sheet_title;
  const btnAI = document.querySelector('#btnAI');
  if (btnAI && ui.btn_explain) {
    const ico = btnAI.querySelector('.sheet-btn-ico');
    btnAI.textContent = ui.btn_explain;
    if (ico) btnAI.prepend(ico);
  }
  const btnShare = document.querySelector('#btnShare');
  if (btnShare && ui.btn_share) {
    const ico = btnShare.querySelector('.sheet-btn-ico');
    btnShare.textContent = ui.btn_share;
    if (ico) btnShare.prepend(ico);
  }
  const aiRef = document.querySelector('.ai-ref');
  if (aiRef && ui.ai_ref) aiRef.textContent = ui.ai_ref;

  // Банер "Нова категорія" при перемиканні
  const catBannerLabel = document.querySelector('.cat-banner-label');
  if (catBannerLabel && ui.cat_banner_label) catBannerLabel.textContent = ui.cat_banner_label;

  // Меню
  const menuLogo = document.querySelector('.menu-logo');
  if (menuLogo && ui.menu_logo) menuLogo.textContent = ui.menu_logo;
  const menuTagline = document.querySelector('.menu-tagline');
  if (menuTagline && ui.menu_tagline) menuTagline.textContent = ui.menu_tagline;
  const musicTitle = document.querySelector('.music-title');
  if (musicTitle && ui.music_title) musicTitle.textContent = ui.music_title;

  // Налаштування — заголовки блоків
  const blockTitles = document.querySelectorAll('.settings-block-title');
  const blockKeys = ['settings_font','settings_size','settings_icon_size','settings_color','settings_bg','settings_extra','settings_lang','notif_title'];
  blockTitles.forEach((el, i) => { if (blockKeys[i] && ui[blockKeys[i]]) el.textContent = ui[blockKeys[i]]; });

  // Шрифти — підписи
  const fontSpans = document.querySelectorAll('.font-opt span');
  const fontKeys = ['settings_font_classic','settings_font_tradition','settings_font_modern'];
  fontSpans.forEach((el, i) => { if (fontKeys[i] && ui[fontKeys[i]]) el.textContent = ui[fontKeys[i]]; });

  // Тогли
  const toggleRows = document.querySelectorAll('.toggle-row');
  const toggleKeys = ['toggle_shadow','toggle_anim','toggle_stars','toggle_autobg'];
  toggleRows.forEach((row, i) => {
    if (!toggleKeys[i] || !ui[toggleKeys[i]]) return;
    const toggle = row.querySelector('.toggle');
    row.textContent = ui[toggleKeys[i]];
    if (toggle) row.appendChild(toggle);
  });

  // Нагадування
  const notifAdd = document.getElementById('btnAddAlarm');
  if (notifAdd && ui.notif_add) notifAdd.textContent = ui.notif_add;

  // Зберігаємо UI для тостів і renderVerse
  window._currentUI = ui;
}

// Отримати рядок UI для поточної мови
function t(key, vars) {
  const ui = window._currentUI || UI_STRINGS.uk;
  let str = ui[key] || UI_STRINGS.uk[key] || key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
  }
  return str;
}


/* ─────────────────────────────────────
   ВИЗНАЧЕННЯ МОВИ ПРИСТРОЮ
───────────────────────────────────── */
// Бере мову з navigator.languages/navigator.language ("ru-RU" → "ru")
// і повертає першу, для якої в нас є готовий переклад.
// Якщо жодна не підходить — повертає 'uk' (оригінал, завжди доступний).
function detectDeviceLanguage() {
  const candidates = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || 'uk'];

  for (const raw of candidates) {
    const code = String(raw).toLowerCase().split('-')[0];
    if (code === 'uk') return 'uk';
    if (READY_LANGUAGES.includes(code)) return code;
  }
  return 'uk';
}

/* ─────────────────────────────────────
   ЗАВАНТАЖЕННЯ ГОТОВОГО ПЕРЕКЛАДУ З lang/{code}.json
───────────────────────────────────── */
async function loadLanguageFile(code) {
  if (code === 'uk') return null; // оригінал — окремий файл не потрібен

  // Кеш у localStorage — щоб удруге не тягнути той самий файл з мережі
  const cacheKey = `hv_trans_v${LANG_CACHE_VERSION}_${code}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      translationCache[code] = parsed;
      return parsed;
    } catch { /* пошкоджений кеш — довантажимо знову нижче */ }
  }

  const res = await fetch(`${LANG_FOLDER}${code}.json`);
  if (!res.ok) throw new Error(`lang/${code}.json не знайдено (HTTP ${res.status})`);
  const raw = await res.json();

  const data = {
    ui:         raw.ui || {},
    categories: raw._categories || {},
    verses:     raw.verses || [],
    lang:       code,
    timestamp:  Date.now(),
  };

  translationCache[code] = data;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch {
    // localStorage переповнений (буває з кількома великими мовами одразу) —
    // не критично, переклад просто підвантажиться з мережі ще раз наступного разу
  }
  return data;
}

// Гарантує, що до моменту виклику переклад для currentLang (якщо це не 'uk')
// вже лежить у translationCache. Стартує одразу при завантаженні скрипта —
// паралельно з тим, як app.js тягне verses.json — щоб не було гонки умов.
window._langReadyPromise = (async function initLanguageOnLoad() {
  const saved = localStorage.getItem('hv_lang');
  const target = saved || detectDeviceLanguage();
  currentLang = target;

  // Перший запуск — запам'ятовуємо визначену мову назавжди,
  // далі вона веде себе як ручний вибір (і не "стрибає" назад
  // до мови пристрою, якщо юзер потім сам обере щось інше)
  if (!saved) localStorage.setItem('hv_lang', target);

  if (target === 'uk') return;

  try {
    await loadLanguageFile(target);
  } catch (err) {
    console.warn(`Не вдалося завантажити мову "${target}", залишаємось на українській:`, err);
    currentLang = 'uk';
  }
})();


/* ─────────────────────────────────────
   UI: ВИБІР МОВИ В НАЛАШТУВАННЯХ
───────────────────────────────────── */
function buildLanguageSelector() {
  const container = document.getElementById('langBlock');
  if (!container) return;

  // Лише українська + мови з готовим перекладом
  const selectable = SUPPORTED_LANGUAGES.filter(l => l.ready);

  container.innerHTML = `
    <div class="settings-block-title" id="langBlockTitle">🌐 Мова</div>
    <div style="position:relative">
      <select id="langSelect" style="
        width:100%; padding:11px 14px; border-radius:10px;
        background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
        color:#f0e8d5; font-size:15px; font-family:'Nunito',sans-serif;
        appearance:none; -webkit-appearance:none; cursor:pointer;
        background-image: url('data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'12\\' height=\\'8\\' viewBox=\\'0 0 12 8\\'><path d=\\'M1 1l5 5 5-5\\' stroke=\\'%23c9a84c\\' stroke-width=\\'1.5\\' fill=\\'none\\' stroke-linecap=\\'round\\'/></svg>');
        background-repeat:no-repeat; background-position:right 14px center;">
        ${selectable.map(l =>
          `<option value="${l.code}" ${l.code === currentLang ? 'selected' : ''}>${l.name}</option>`
        ).join('')}
      </select>
    </div>

    <!-- Помилка завантаження -->
    <div id="transError" style="display:none; margin-top:10px; padding:10px 12px; background:rgba(255,60,60,.08); border:1px solid rgba(255,60,60,.2); border-radius:8px; font-family:'Nunito',sans-serif; font-size:12px; color:rgba(255,150,150,.8); line-height:1.5;"></div>
  `;

  document.getElementById('langSelect').addEventListener('change', async (e) => {
    await switchLanguage(e.target.value);
  });
}

// Юзер сам обирає мову в налаштуваннях — це завжди має пріоритет
// над автовизначенням і запам'ятовується назавжди.
async function switchLanguage(langCode) {
  const select  = document.getElementById('langSelect');
  const errorEl = document.getElementById('transError');
  if (errorEl) errorEl.style.display = 'none';

  if (langCode === 'uk') {
    localStorage.setItem('hv_lang', 'uk');
    currentLang = 'uk';
    applyTranslation('uk');
    showToast('🇺🇦 Українська');
    return;
  }

  try {
    if (!translationCache[langCode]) {
      showToast('🌐 Завантажую переклад...');
      await loadLanguageFile(langCode);
    }
    localStorage.setItem('hv_lang', langCode);
    currentLang = langCode;
    applyTranslation(langCode);
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    showToast(`✅ ${lang?.name || langCode}`);
  } catch (err) {
    console.error('Lang load error:', err);
    if (errorEl) {
      errorEl.textContent = `⚠️ Не вдалося завантажити переклад. Перевір інтернет-з'єднання і спробуй ще раз.`;
      errorEl.style.display = 'block';
    }
    if (select) select.value = currentLang; // повертаємо вибір назад
  }
}


/* ─────────────────────────────────────
   ІНІЦІАЛІЗАЦІЯ
───────────────────────────────────── */
window._currentUI = UI_STRINGS.uk;

document.addEventListener('DOMContentLoaded', () => {
  buildLanguageSelector();
});

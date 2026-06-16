/* ═══════════════════════════════════════════
   i18n.js  —  Holy Vibe
   Система автоматичного перекладу через Gemini API
   
   Як працює:
   1. Юзер вибирає мову в налаштуваннях
   2. Якщо переклад вже є в localStorage — завантажуємо миттєво
   3. Якщо немає — перекладаємо батчами через Gemini Flash
   4. Кешуємо в localStorage назавжди (до очищення браузера)
   
   Що перекладається:
   - Всі вірші (text, book, ref, ai) з verses.json
   - Рядки інтерфейсу (UI_STRINGS нижче)
═══════════════════════════════════════════ */

// ─── Адреса твого Cloudflare Worker (проксі для Gemini) ─────────────
const TRANSLATE_PROXY_URL = 'https://holy-vibe-translate.nicklavigneua.workers.dev';
// ────────────────────────────────────────────────────────────────────

// Поточна активна мова ('uk' = українська = оригінал, без перекладу)
let currentLang = 'uk';

// Кеш перекладів { 'en': { verses: [...], ui: {...} }, ... }
const translationCache = {};

// Підтримувані мови
const SUPPORTED_LANGUAGES = [
  { code: 'uk', name: '🇺🇦 Українська', native: 'Українська' },
  { code: 'en', name: '🇬🇧 English',    native: 'English' },
  { code: 'pl', name: '🇵🇱 Polski',     native: 'Polski' },
  { code: 'de', name: '🇩🇪 Deutsch',    native: 'Deutsch' },
  { code: 'fr', name: '🇫🇷 Français',   native: 'Français' },
  { code: 'es', name: '🇪🇸 Español',    native: 'Español' },
  { code: 'pt', name: '🇧🇷 Português',  native: 'Português' },
  { code: 'ro', name: '🇷🇴 Română',     native: 'Română' },
  { code: 'ru', name: '🇷🇺 Русский',    native: 'Русский' },
  { code: 'zh', name: '🇨🇳 中文',       native: '中文' },
  { code: 'ar', name: '🇸🇦 العربية',    native: 'العربية' },
  { code: 'hi', name: '🇮🇳 हिन्दी',      native: 'हिन्दी' },
  { code: 'sw', name: '🇰🇪 Kiswahili',  native: 'Kiswahili' },
];

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


/* ─────────────────────────────────────
   ЯДРО ПЕРЕКЛАДУ
───────────────────────────────────── */

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
   UI: ВИБІР МОВИ В НАЛАШТУВАННЯХ
───────────────────────────────────── */
async function buildLanguageSelector() {
  const container = document.getElementById('langBlock');
  if (!container) return;

  const savedLang = localStorage.getItem('hv_lang') || 'uk';
  currentLang = savedLang;

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
        ${SUPPORTED_LANGUAGES.map(l =>
          `<option value="${l.code}" ${l.code === savedLang ? 'selected' : ''}>${l.name}</option>`
        ).join('')}
      </select>
    </div>

    <!-- Прогрес-бар перекладу -->
    <div id="transProgress" style="display:none; margin-top:12px;">
      <div style="font-family:'Nunito',sans-serif; font-size:12px; color:rgba(255,255,255,.5); margin-bottom:6px;" id="transProgressText">Перекладаю...</div>
      <div style="height:3px; background:rgba(255,255,255,.1); border-radius:2px; overflow:hidden;">
        <div id="transProgressBar" style="height:100%; width:0%; background:linear-gradient(90deg,#c9a84c,#e8d08a); border-radius:2px; transition:width .3s;"></div>
      </div>
    </div>

    <!-- Помилка -->
    <div id="transError" style="display:none; margin-top:10px; padding:10px 12px; background:rgba(255,60,60,.08); border:1px solid rgba(255,60,60,.2); border-radius:8px; font-family:'Nunito',sans-serif; font-size:12px; color:rgba(255,150,150,.8); line-height:1.5;"></div>
  `;

  document.getElementById('langSelect').addEventListener('change', async (e) => {
    const langCode = e.target.value;
    await switchLanguage(langCode);
  });

  // Якщо збережена мова не українська — застосовуємо при запуску
  if (savedLang !== 'uk') {
    // Спочатку пробуємо готовий файл з lang/
    try {
      const resp = await fetch(`lang/${savedLang}.json`);
      if (resp.ok) {
        const raw = await resp.json();
        const data = {
          lang:       savedLang,
          ui:         raw.ui         || {},
          verses:     raw.verses     || [],
          categories: raw._categories || raw.categories || {},
        };
        translationCache[savedLang] = data;
        applyTranslation(savedLang);
        return; // готово
      }
    } catch { /* файл не знайдено */ }

    // Фолбек на кеш Gemini
    const cached = localStorage.getItem(`hv_trans_${savedLang}`);
    if (cached) {
      try {
        translationCache[savedLang] = JSON.parse(cached);
        applyTranslation(savedLang);
      } catch { /* пошкоджений кеш — залишаємо українську */ }
    }
  }
}

async function switchLanguage(langCode) {
  const progressEl  = document.getElementById('transProgress');
  const progressBar = document.getElementById('transProgressBar');
  const progressTxt = document.getElementById('transProgressText');
  const errorEl     = document.getElementById('transError');

  errorEl.style.display = 'none';

  if (langCode === 'uk') {
    localStorage.setItem('hv_lang', 'uk');
    applyTranslation('uk');
    showToast('🇺🇦 Українська');
    return;
  }

  // ── 1. Спробуємо завантажити готовий файл з папки lang/ ──────────────
  try {
    const resp = await fetch(`lang/${langCode}.json`);
    if (resp.ok) {
      const raw = await resp.json();
      // Нормалізуємо структуру: _categories → categories
      const data = {
        lang:       langCode,
        ui:         raw.ui         || {},
        verses:     raw.verses     || [],
        categories: raw._categories || raw.categories || {},
      };
      translationCache[langCode] = data;
      localStorage.setItem('hv_lang', langCode);
      applyTranslation(langCode);
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
      showToast(`${lang?.name || langCode}`);
      return;
    }
  } catch { /* файл не знайдено — йдемо до Gemini */ }

  // ── 2. Якщо вже є в кеші Gemini — застосовуємо миттєво ──────────────
  const cacheKey = `hv_trans_${langCode}`;
  if (localStorage.getItem(cacheKey)) {
    try {
      translationCache[langCode] = JSON.parse(localStorage.getItem(cacheKey));
      localStorage.setItem('hv_lang', langCode);
      applyTranslation(langCode);
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
      showToast(`${lang?.name || langCode}`);
      return;
    } catch { /* перекладаємо знову */ }
  }

  // ── 3. Перекладаємо через Gemini ─────────────────────────────────────
  // Показуємо прогрес
  progressEl.style.display = 'block';
  progressBar.style.width = '0%';
  progressTxt.textContent = 'Перекладаю інтерфейс...';

  try {
    await translateToLanguage(langCode, (done, total, stage) => {
      if (stage === 'ui') {
        progressTxt.textContent = 'Перекладаю інтерфейс...';
        progressBar.style.width = '3%';
      } else {
        const pct = Math.round(5 + (done / total) * 95);
        progressBar.style.width = pct + '%';
        progressTxt.textContent = `Перекладаю ${done} / ${total} віршів...`;
      }
    });

    progressBar.style.width = '100%';
    progressTxt.textContent = 'Готово! ✅';
    setTimeout(() => { progressEl.style.display = 'none'; }, 1500);

    localStorage.setItem('hv_lang', langCode);
    applyTranslation(langCode);
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    showToast(`✅ ${lang?.name || langCode}`);

  } catch (err) {
    console.error('Translation error:', err);
    progressEl.style.display = 'none';
    errorEl.textContent = `⚠️ Помилка: ${err.message}. Прогрес збережено — просто оберіть мову знову, переклад продовжиться з того ж місця.`;
    errorEl.style.display = 'block';
    // Повертаємо вибір на попередню мову
    document.getElementById('langSelect').value = currentLang;
  }
}


/* ─────────────────────────────────────
   ІНІЦІАЛІЗАЦІЯ
───────────────────────────────────── */
// Ініціалізуємо після завантаження сторінки
window._currentUI = UI_STRINGS.uk;

document.addEventListener('DOMContentLoaded', () => {
  buildLanguageSelector();
});

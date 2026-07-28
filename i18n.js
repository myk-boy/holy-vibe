/* ═══════════════════════════════════════════════════════════
   i18n.js  —  Holy Vibe
   Завантажує lang/{code}.json і застосовує до DOM.
   Вбудований UK словник — t() працює ОДРАЗУ при старті.
═══════════════════════════════════════════════════════════ */

/* SUPPORTED_LANGUAGES — щоб додати нову мову: додай рядок сюди
   (і поклади відповідний lang/{code}.json на GitHub). Щоб мова
   ще НЕ з'являлась користувачам (наприклад, поки переклад не
   готовий) — постав enabled: false. Вона просто не покажеться
   в селекторі й не підхопиться автовизначенням мови пристрою,
   але код для неї вже готовий на майбутнє. */
const SUPPORTED_LANGUAGES = [
  { code: 'uk', name: '🇺🇦 Українська', enabled: true  },
  { code: 'uk.hom', name: '🇺🇦 Українська. Хоменко', enabled: true  },
  { code: 'en', name: '🇬🇧 English',    enabled: true  },
  { code: 'de', name: '🇩🇪 Deutsch',    enabled: false  },
  { code: 'el', name: '🇬🇷 Ελληνικά',   enabled: false  },
];

// Мови, увімкнені для показу користувачу (enabled !== false —
// тобто мова вважається увімкненою, якщо поле взагалі не вказане).
function enabledLanguages() {
  return SUPPORTED_LANGUAGES.filter(l => l.enabled !== false);
}

let currentLang = 'uk';

/* ─── Вбудований українській словник (дефолт) ───────────
   Завдяки цьому t() повертає правильний текст ОДРАЗУ,
   ще до того як lang/uk.json завантажився асинхронно.    */
const UK_DEFAULT = {
  nav_word: "Слово", nav_favs: "Улюблені", nav_menu: "Меню", nav_settings: "Вигляд",
  cat_all: "Усі", swipe_hint: "свайп вгору", translation: "Переклад Огієнка",
  favs_title: "Улюблені вірші",
  favs_empty: "Ще немає улюблених.\nДвічі торкніться вірша, щоб додати.",
  sheet_title: "Цей вірш", btn_explain: "Пояснити цей вірш", btn_share: "Поділитися",
  ai_ref: "✦ Духовне тлумачення",
  menu_logo: "СЛОВО", menu_tagline: "Просочення Живим Словом",
  music_title: "🎵 Молитовна музика (CC)",
  donate_title: "Підтримати проєкт ❤️",
  donate_privat: "Картка ПриватБанк", donate_copy: "Скопіювати картку 🟢",
  donate_copy_alert: "Номер картки скопійовано! 👍",
  settings_title: "Оформлення", settings_font: "Шрифт",
  settings_font_classic: "Класика", settings_font_tradition: "Традиція", settings_font_modern: "Сучасний",
  settings_size: "Розмір тексту", settings_icon_size: "Розмір іконок і навігації",
  settings_color: "Колір тексту", settings_bg: "Фон", settings_extra: "Додатково",
  toggle_shadow: "Тінь тексту", toggle_anim: "Анімація переходу",
  toggle_stars: "Зірочки на фоні", toggle_autobg: "Фон змінюється з віршем",
  settings_lang: "🌐 Мова",
  notif_title: "🔔 Нагадування для молитви",
  notif_empty: "Немає нагадувань.\nДодай перше нижче 🙏",
  notif_add: "+ Додати нагадування",
  alarm_modal_title: "Налаштування нагадування", alarm_label_ph: "Ранкова молитва",
  alarm_name: "Назва", alarm_time: "Час", alarm_days: "Дні тижня",
  alarm_once: "Один раз", alarm_daily: "Щодня",
  alarm_cancel: "Скасувати", alarm_save: "Зберегти 🔔",
  day_mon: "Пн", day_tue: "Вт", day_wed: "Ср", day_thu: "Чт",
  day_fri: "Пт", day_sat: "Сб", day_sun: "Нд",
  toast_loaded: "📖 {n} віршів завантажено",
  toast_copied: "📋 Вірш скопійовано", toast_added_fav: "🤍 Додано до улюблених",
  toast_added_fav_alt: "♡ Додано до улюблених", toast_already_fav: "Вже в улюблених ✦",
  toast_removed_fav: "Видалено з улюблених", toast_deleted: "🗑️ Видалено",
  toast_saved: "✅ Нагадування збережено", toast_enabled: "🔔 Увімкнено",
  toast_disabled: "🔕 Вимкнено", toast_shadow_off: "Тінь вимкнена",
  toast_font_changed: "Шрифт змінено", toast_bg_changed: "🖼️ Фон змінено",
  toast_bg_removed: "🖼️ Фон прибрано", toast_autobg_on: "🖼️ Авто-фон увімкнено",
  toast_autobg_off: "🖼️ Авто-фон вимкнено", toast_swipe: "↑ свайп — наступний вірш",
  toast_longpress: "✦ довге натискання — тлумач", toast_time_missing: "⚠️ Вкажи час",
  toast_load_error: "⚠️ Не вдалося завантажити вірші",
  toast_track_error: "⚠️ Не вдалося завантажити трек",
  toast_play_sequence: "🔁 Відтворення по черзі", toast_play_repeat: "🔂 Повтор поточного треку",
  toast_shuffle_on: "🔀 Перемішування увімкнено", toast_shuffle_off: "🔀 Перемішування вимкнено",
  cat_banner_label: "Нова категорія",
  title_categories: "Категорії", title_prev: "Попередній трек",
  title_repeat: "Режим повтору", title_shuffle: "Перемішати", title_next: "Наступний трек",
  notif_body: "Зупинись на хвилину, прочитай вірш і помолися від серця. 🙏",
};

// _currentUI одразу містить українські рядки — t() працює з першої секунди
window._currentUI = { ...UK_DEFAULT };


/* ─────────────────────────────────────────────────────────
   ХЕЛПЕР t()
───────────────────────────────────────────────────────── */
function t(key, vars) {
  let str = (window._currentUI[key] ?? UK_DEFAULT[key]) ?? key;
  if (vars) Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
  return str;
}


/* ─────────────────────────────────────────────────────────
   ЗАВАНТАЖЕННЯ МОВИ
───────────────────────────────────────────────────────── */
async function loadLanguage(code) {
  try {
    const resp = await fetch(`lang/${code}.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    currentLang = code;

    // Для UK — мержимо з дефолтом (файл може мати більше ключів)
    // Для інших — повністю замінюємо
    window._currentUI = code === 'uk'
      ? { ...UK_DEFAULT, ...(data.ui || {}) }
      : { ...UK_DEFAULT, ...(data.ui || {}) }; // фолбек на UK якщо ключ відсутній

    localStorage.setItem('hv_lang', code);

    // Вірші: для UK не чіпаємо (вже з verses.json), для інших замінюємо
    if (code !== 'uk' && data.verses && data.verses.length) {
      if (!window._VERSES_ORIGINAL) window._VERSES_ORIGINAL = [...VERSES];
      VERSES.length = 0;
      VERSES.push(...data.verses);
      S.pool = S.cat === 'all' ? [...VERSES] : VERSES.filter(v => v.cat === S.cat);
    } else if (code === 'uk' && window._VERSES_ORIGINAL) {
      VERSES.length = 0;
      VERSES.push(...window._VERSES_ORIGINAL);
      S.pool = S.cat === 'all' ? [...VERSES] : VERSES.filter(v => v.cat === S.cat);
    }

    // Категорії
    const cats = data._categories || data.categories || {};
    refreshCatBar(cats, data.ui?.cat_all);

    // DOM
    applyI18n(window._currentUI);

    if (typeof renderVerse     === 'function') renderVerse();
    if (typeof renderFavList   === 'function') renderFavList();
    if (typeof renderNotifList === 'function') renderNotifList();

    showToast(t('toast_loaded', { n: VERSES.length }));

    // Застосунок повністю готовий (вірші + переклад інтерфейсу
    // застосовані) — можна прибирати стартовий екран (splash),
    // див. index.html / hideSplash().
    if (typeof hideSplash === 'function') hideSplash();

  } catch (err) {
    console.error('i18n: помилка завантаження', code, err);
    if (code !== 'uk') {
      await loadLanguage('uk');
    } else {
      // Навіть запасний варіант (uk) не завантажився — далі чекати
      // нічого, тож прибираємо splash, щоб не тримати користувача
      // на "вічному" екрані завантаження.
      if (typeof hideSplash === 'function') hideSplash();
    }
  }
}


/* ─────────────────────────────────────────────────────────
   ЗАСТОСУВАННЯ UI ДО DOM
───────────────────────────────────────────────────────── */
function applyI18n(ui) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (ui[key] !== undefined) el.textContent = ui[key];
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (ui[key] !== undefined) el.title = ui[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (ui[key] !== undefined) el.placeholder = ui[key];
  });
  const sel = document.getElementById('langSelect');
  if (sel) sel.value = currentLang;
}


/* ─────────────────────────────────────────────────────────
   ПІЛЮЛІ КАТЕГОРІЙ

   ВАЖЛИВО: тут ми НЕ перебудовуємо самі пілюлі (data-cat) і
   НЕ перевстановлюємо CAT_ORDER. Єдине джерело істини для
   ключів/порядку категорій — verses.json, і будує їх лише
   app.js (buildCatOrder/buildCatPills у fetchVerses()).

   Раніше ця функція викликала buildCatPills()/buildCatOrder()
   заново з даними мовного файлу — якщо категорії в lang/*.json
   хоч трохи розходились із verses.json (інший порядок, застарілий
   ключ), увесь catBar перебудовувався "криво": губився data-cat
   поточної категорії, збивався CAT_ORDER, і код відкатувався на
   пілюлю "Усі" — звідси і плутанина категорій/прогресу, і скидання
   на "Усі" після перезапуску. Тепер ми лише перекладаємо ПІДПИСИ
   на вже існуючих пілюлях, за співпадінням data-cat.
───────────────────────────────────────────────────────── */
function refreshCatBar(categories, allLabel) {
  const allPill = document.querySelector('.pill[data-cat="all"]');
  if (allPill && allLabel) allPill.textContent = allLabel;

  if (categories) {
    Object.entries(categories).forEach(([key, label]) => {
      const pill = document.querySelector(`.pill[data-cat="${key}"]`);
      if (pill) pill.textContent = label;
    });
  }

  // ВАЖЛИВО: беремо S напряму, а НЕ через window.S — S оголошено як
  // `const S = {...}` у app.js на верхньому рівні скрипта, тому воно НЕ
  // стає властивістю window (на відміну від var), і window.S завжди
  // undefined. Через це раніше activePill ніколи не знаходився за
  // поточною категорією і завжди відкатувався на пілюлю "all" — саме
  // тому підпис категорії скидався на "Усі" після перезапуску додатку.
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  const currentCat = (typeof S !== 'undefined' && S?.cat) || 'all';
  const activePill =
    document.querySelector(`.pill[data-cat="${currentCat}"]`) ||
    document.querySelector('.pill[data-cat="all"]');
  if (activePill) {
    activePill.classList.add('active');
    const lbl = document.getElementById('catToggleLabel');
    if (lbl) lbl.textContent = activePill.textContent;
  }
}


/* ─────────────────────────────────────────────────────────
   СЕЛЕКТОР МОВИ
───────────────────────────────────────────────────────── */
function buildLanguageSelector() {
  const sel = document.getElementById('langSelect');
  if (!sel) return;

  // Опції будуємо динамічно з SUPPORTED_LANGUAGES (лише enabled: true) —
  // більше НЕ треба вручну дописувати <option> в index.html при додаванні
  // мови. Вимкнені мови (enabled: false) сюди просто не потрапляють.
  sel.innerHTML = '';
  enabledLanguages().forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.code;
    opt.textContent = l.name;
    sel.appendChild(opt);
  });

  const savedLang = localStorage.getItem('hv_lang');
  const savedIsEnabled = savedLang && enabledLanguages().some(l => l.code === savedLang);
  sel.value = savedIsEnabled ? savedLang : 'uk';

  sel.addEventListener('change', async (e) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
    await loadLanguage(e.target.value);
    showToast(lang?.name || e.target.value);
  });
}


/* ─────────────────────────────────────────────────────────
   АВТОВИЗНАЧЕННЯ МОВИ ПРИСТРОЮ

   Навмисно зроблено через navigator.language, а НЕ нативний
   Android-код: WebView (Android) і WKWebView (iOS) обидва
   коректно віддають мову системи через цей JS-API. Тобто
   один і той самий код працює однаково на обох платформах —
   нічого дублювати чи переписувати нативно не треба.

   Спрацьовує лише при ПЕРШОМУ запуску, поки в localStorage
   немає збереженого вибору користувача (hv_lang). Щойно мова
   визначена — loadLanguage() сама зберігає її в localStorage
   (див. вище), і надалі застосунок завжди підхоплює саме
   збережений вибір, а не мову пристрою знову. Тобто якщо
   користувач вручну перемкне мову — автовизначення більше
   не втручається.

   Якщо мова пристрою не входить у SUPPORTED_LANGUAGES, або входить,
   але вимкнена (enabled: false) — тихо лишаємось на українській
   (дефолт, як і раніше).
───────────────────────────────────────────────────────── */
function detectDeviceLanguage() {
  const raw =
    navigator.language ||
    (navigator.languages && navigator.languages[0]) ||
    'uk';
  const short = raw.toLowerCase().split('-')[0]; // напр. 'en-US' -> 'en'
  const found = enabledLanguages().find(l => l.code === short);
  return found ? found.code : 'uk';
}


/* ─────────────────────────────────────────────────────────
   ІНІЦІАЛІЗАЦІЯ
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildLanguageSelector();

  // Якщо користувач ще ЖОДНОГО разу не обирав мову вручну — визначаємо
  // мову пристрою. Якщо вибір вже колись зберігався І ця мова досі
  // enabled — пріоритет за ним. Якщо збережена мова раптом вимкнена
  // (enabled: false) — теж падаємо назад на автовизначення.
  const savedLang = localStorage.getItem('hv_lang');
  const savedIsEnabled = savedLang && enabledLanguages().some(l => l.code === savedLang);
  const saved = savedIsEnabled ? savedLang : detectDeviceLanguage();

  // Чекаємо поки verses.json завантажиться, потім завантажуємо мову
  // _onVersesReady викликається з app.js одразу після fetchVerses
  window._onVersesReady = () => loadLanguage(saved);

  // Страховка: якщо verses вже є (напр. кеш) — запускаємо одразу
  if (window.VERSES && window.VERSES.length > 0) {
    loadLanguage(saved);
  }
});

/* ═══════════════════════════════════════════════════════════
   i18n.js  —  Holy Vibe
   Завантажує lang/{code}.json і застосовує до DOM.
   Вбудований UK словник — t() працює ОДРАЗУ при старті.
═══════════════════════════════════════════════════════════ */

const SUPPORTED_LANGUAGES = [
  { code: 'uk', name: '🇺🇦 Українська' },
  { code: 'en', name: '🇬🇧 English'    },
];

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

  } catch (err) {
    console.error('i18n: помилка завантаження', code, err);
    if (code !== 'uk') {
      await loadLanguage('uk');
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
───────────────────────────────────────────────────────── */
function refreshCatBar(categories, allLabel) {
  if (typeof buildCatPills === 'function') buildCatPills(categories);
  if (typeof buildCatOrder === 'function') buildCatOrder(categories);

  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  const allPill = document.querySelector('.pill[data-cat="all"]');
  if (allPill && allLabel) allPill.textContent = allLabel;

  const activePill =
    document.querySelector(`.pill[data-cat="${window.S?.cat}"]`) ||
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
  sel.value = localStorage.getItem('hv_lang') || 'uk';
  sel.addEventListener('change', async (e) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
    await loadLanguage(e.target.value);
    showToast(lang?.name || e.target.value);
  });
}


/* ─────────────────────────────────────────────────────────
   ІНІЦІАЛІЗАЦІЯ
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildLanguageSelector();

  const saved = localStorage.getItem('hv_lang') || 'uk';

  // Викликається з app.js одразу після того як verses.json завантажився
  window._onVersesReady = () => {
    loadLanguage(saved);
  };
});

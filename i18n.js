/* ═══════════════════════════════════════════════════════════
   i18n.js  —  Holy Vibe
   Завантажує lang/{code}.json і застосовує до DOM.
   Еталон: lang/uk.json
═══════════════════════════════════════════════════════════ */

const SUPPORTED_LANGUAGES = [
  { code: 'uk', name: '🇺🇦 Українська' },
  { code: 'en', name: '🇬🇧 English'    },
];

let currentLang = 'uk';

// Поточний ui-словник — доступний через t()
window._currentUI = {};

/* ─────────────────────────────────────────────────────────
   ЗАВАНТАЖЕННЯ МОВИ
───────────────────────────────────────────────────────── */
async function loadLanguage(code) {
  try {
    const resp = await fetch(`lang/${code}.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    currentLang       = code;
    window._currentUI = data.ui || {};
    localStorage.setItem('hv_lang', code);

    // Для UK — вірші вже завантажені з verses.json, не чіпаємо їх
    // Для інших мов — замінюємо вірші з lang файлу
    if (code !== 'uk' && data.verses && data.verses.length) {
      if (!window._VERSES_ORIGINAL) {
        window._VERSES_ORIGINAL = [...VERSES];
      }
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
    applyI18n(data.ui || {});

    if (typeof renderVerse === 'function') renderVerse();

    // Тост після завантаження — тепер _currentUI вже готовий
    if (typeof showToast === 'function' && typeof VERSES !== 'undefined') {
      showToast(t('toast_loaded', {n: VERSES.length}));
    }

  } catch (err) {
    console.error('i18n: помилка завантаження мови', code, err);
    if (code !== 'uk') await loadLanguage('uk');
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
   ХЕЛПЕР t() — для динамічних рядків в app.js
───────────────────────────────────────────────────────── */
function t(key, vars) {
  const ui  = window._currentUI || {};
  let   str = ui[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v);
    });
  }
  return str;
}

/* ─────────────────────────────────────────────────────────
   ОНОВЛЕННЯ ПІЛЮЛЬ КАТЕГОРІЙ
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
    await loadLanguage(e.target.value);
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
    showToast(lang?.name || e.target.value);
  });
}

/* ─────────────────────────────────────────────────────────
   ІНІЦІАЛІЗАЦІЯ
   Логіка: спочатку app.js завантажує verses.json і рендерить.
   Потім ми завантажуємо lang/uk.json тільки для ui рядків
   (вірші НЕ замінюємо для uk — вони вже є з verses.json).
   Якщо збережена інша мова — чекаємо і замінюємо все.
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildLanguageSelector();

  const saved = localStorage.getItem('hv_lang') || 'uk';

  const waitForVerses = (callback) => {
    if (window.VERSES && window.VERSES.length > 0) {
      callback();
    } else {
      setTimeout(() => waitForVerses(callback), 50);
    }
  };

  waitForVerses(() => {
    // Завантажуємо мовний файл
    // Для UK — тільки ui рядки (вірші вже є)
    // Для інших — і ui і вірші
    loadLanguage(saved);
  });
});

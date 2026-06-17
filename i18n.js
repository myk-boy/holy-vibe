/* ═══════════════════════════════════════════════════════════
   i18n.js  —  Holy Vibe
   Система мов: завантажує lang/{code}.json і застосовує до DOM.
   Еталон: lang/uk.json  (всі тексти — там, не в коді)
═══════════════════════════════════════════════════════════ */

const SUPPORTED_LANGUAGES = [
  { code: 'uk', name: '🇺🇦 Українська' },
  { code: 'en', name: '🇬🇧 English'    },
];

let currentLang = 'uk';

// Поточний ui-словник — доступний через t() і window._currentUI
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

    // Замінюємо вірші якщо є (для неукраїнських мов)
    if (code !== 'uk' && data.verses && data.verses.length) {
      if (!window._VERSES_ORIGINAL) {
        window._VERSES_ORIGINAL = [...VERSES];
      }
      VERSES.length = 0;
      VERSES.push(...data.verses);
      S.pool = S.cat === 'all' ? [...VERSES] : VERSES.filter(v => v.cat === S.cat);
    } else if (code === 'uk' && window._VERSES_ORIGINAL) {
      // Повертаємо оригінальні вірші
      VERSES.length = 0;
      VERSES.push(...window._VERSES_ORIGINAL);
      S.pool = S.cat === 'all' ? [...VERSES] : VERSES.filter(v => v.cat === S.cat);
    }

    // Категорії
    const cats = data._categories || data.categories || {};
    refreshCatBar(cats, data.ui?.cat_all);

    // Застосовуємо UI до DOM
    applyI18n(data.ui || {});

    if (typeof renderVerse === 'function') renderVerse();

  } catch (err) {
    console.error('i18n: помилка завантаження мови', code, err);
    if (code !== 'uk') {
      console.warn('i18n: фолбек на uk');
      await loadLanguage('uk');
    }
  }
}


/* ─────────────────────────────────────────────────────────
   ЗАСТОСУВАННЯ UI РЯДКІВ ДО DOM
───────────────────────────────────────────────────────── */
function applyI18n(ui) {
  // 1. Всі елементи з data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (ui[key] !== undefined) el.textContent = ui[key];
  });

  // 2. Title атрибути (data-i18n-title)
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (ui[key] !== undefined) el.title = ui[key];
  });

  // 3. Placeholder (data-i18n-placeholder)
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (ui[key] !== undefined) el.placeholder = ui[key];
  });

  // 3. Синхронізуємо вибір у select
  const sel = document.getElementById('langSelect');
  if (sel) sel.value = currentLang;
}


/* ─────────────────────────────────────────────────────────
   ХЕЛПЕР t() — для app.js (тости, динамічні рядки)
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
   СЕЛЕКТОР МОВИ В НАЛАШТУВАННЯХ
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
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildLanguageSelector();

  const saved = localStorage.getItem('hv_lang') || 'uk';

  if (saved !== 'uk') {
    // Чекаємо поки verses.json завантажиться (fetchVerses в app.js)
    const tryLoad = () => {
      if (window.VERSES && window.VERSES.length > 0) {
        loadLanguage(saved);
      } else {
        setTimeout(tryLoad, 100);
      }
    };
    tryLoad();
  } else {
    // Для uk теж завантажуємо — щоб мати ui рядки в window._currentUI
    const tryLoadUk = () => {
      if (window.VERSES && window.VERSES.length > 0) {
        loadLanguage('uk');
      } else {
        setTimeout(tryLoadUk, 100);
      }
    };
    tryLoadUk();
  }
});

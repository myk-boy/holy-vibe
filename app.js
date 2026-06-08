/* ═══════════════════════════════════════════
   app.js  —  ФІНАЛЬНА ЗБІРКА ДОДАТКА «СЛОВО»
═══════════════════════════════════════════ */

// 1. ГЛОБАЛЬНИЙ СТАН ДОДАТКА
const S = {
  currentVerse: null,       // Об'єкт поточного вірша {id: 1, text: "...", ref: "..."}
  currentCategory: 'all',   // Активна категорія: 'all', 'peace', 'love', 'fear', 'strength', 'hope', 'healing'
  activeScreen: 'screenMain',
  favorites: [],
  notifs: [],
  dynamicBg: false,         // Авто-зміна фонів (чекбокс сестри)
  allVerses: []              // Сюди завантажиться масив з verses.json
};

// МАСИВ ФОНІВ. 
const BACKGROUNDS_LIST = [
  'bg1.jpg', 'bg2.jpg', 'bg3.jpg', 'bg4.jpg', 'bg5.jpg', 
  'bg6.jpg', 'bg7.jpg', 'bg8.jpg', 'bg9.jpg', 'bg10.jpg', 
  'bg11.jpg', 'bg12.jpg'
];

// ПОРЯДОК КАТЕГОРІЙ ДЛЯ ЦИКЛІЧНОГО ПЕРЕХОДУ ТА СЛУЖБОВІ КЛЮЧІ
const CATEGORIES_ORDER = ['all', 'peace', 'love', 'fear', 'strength', 'hope', 'healing'];

// Словник для відображення красивих назв у тостах під час автопереходу
const CATEGORY_NAMES_UA = {
  'all': 'Усі',
  'peace': 'Мир',
  'love': 'Любов',
  'fear': 'Страх → Віра',
  'strength': 'Сила',
  'hope': 'Надія',
  'healing': 'Зцілення'
};

// Хелпер швидкого вибору елементів за ID
const $ = id => document.getElementById(id);

// Хелпер для виведення тостів (системних підказок внизу)
function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.innerText = msg;
  t.classList.add('show');
  clearTimeout(t.timer);
  t.timer = setTimeout(() => t.classList.remove('show'), 2500);
}

/* ─────────────────────────────────────
   2. ЕКРАНИ ТА НАВІГАЦІЯ В МЕНЮ
───────────────────────────────────── */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-screen');
    switchScreen(target);
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = $(screenId);
  if (target) {
    target.classList.add('active');
    S.activeScreen = screenId;
    
    if (screenId === 'screenSettings') {
      renderNotifList();
    }
    if (screenId === 'screenMain') {
      applyVerseBackground();
    }
  }
}

/* ─────────────────────────────────────
   3. СПОВІЩЕННЯ / БУДИЛЬНИК (Зв'язок з Java)
───────────────────────────────────── */
S.notifs = JSON.parse(localStorage.getItem('hv_notifs') || '[]');

function saveNotifs() { 
  localStorage.setItem('hv_notifs', JSON.stringify(S.notifs)); 
}

function setAndroidNotification(timeString) {
  if (!timeString) {
    showToast('⚠️ Будь ласка, оберіть час');
    return;
  }

  if (typeof AndroidBridge !== 'undefined' && AndroidBridge.scheduleNotification) {
    AndroidBridge.scheduleNotification(timeString);
    S.notifs = [timeString];
    saveNotifs();
    showToast(`⏰ Нагадування встановлено на ${timeString}`);
    renderNotifList();
  } else {
    S.notifs = [timeString];
    saveNotifs();
    renderNotifList();
    showToast(`🔔 В додатку сповіщення спрацює о ${timeString}`);
  }
}

function renderNotifList() {
  const container = $('notifList');
  if (!container) return;

  if (S.notifs.length === 0) {
    container.innerHTML = `
      <div class="notif-status-msg empty">
        <span>🔕 Щоденні сповіщення вимкнено</span>
      </div>`;
  } else {
    container.innerHTML = `
      <div class="notif-status-msg active">
        <span>⏰ Нагадування активне: <b>${S.notifs[0]}</b></span>
        <span class="notif-btn-clear" onclick="clearAndroidNotification()">Вимкнути</span>
      </div>`;
  }
}

function clearAndroidNotification() {
  S.notifs = [];
  saveNotifs();
  renderNotifList();
  showToast('🔕 Сповіщення скасовано');
}

/* ─────────────────────────────────────
   4. ДИНАМІЧНІ НАЛАШТУВАННЯ ТА РОЗМІРИ
───────────────────────────────────── */
function applyFontSize(value) {
  const minSize = 16, maxSize = 36;
  const calculatedSize = minSize + (value / 100) * (maxSize - minSize);
  const textEl = document.querySelector('.verse-text');
  if (textEl) textEl.style.fontSize = `${calculatedSize}px`;
}

function applyIconSize(value) {
  const minIcon = 18, maxIcon = 34;
  const calculatedIcon = minIcon + (value / 100) * (maxIcon - minIcon);

  const minFont = 9, maxFont = 15;
  const calculatedFont = minFont + (value / 100) * (maxFont - minFont);

  document.querySelectorAll('.nav-btn svg').forEach(svg => {
    svg.style.width = `${calculatedIcon}px`;
    svg.style.height = `${calculatedIcon}px`;
  });

  document.querySelectorAll('.nav-label').forEach(label => {
    label.style.fontSize = `${calculatedFont}px`;
  });
}

/* ─────────────────────────────────────
   5. СИСТЕМА ДИНАМІЧНИХ ФОНІВ (ДЛЯ СЕСТРИ)
───────────────────────────────────── */
function applyVerseBackground() {
  const mainScreen = $('screenMain');
  if (!mainScreen) return;

  if (S.dynamicBg && S.currentVerse) {
    const bgIndex = Math.abs(S.currentVerse.id) % BACKGROUNDS_LIST.length;
    const chosenBg = BACKGROUNDS_LIST[bgIndex];
    mainScreen.style.backgroundImage = `url('assets/${chosenBg}')`;
  } else {
    const savedStaticBg = localStorage.getItem('hv_static_bg') || 'bg1.jpg';
    mainScreen.style.backgroundImage = `url('assets/${savedStaticBg}')`;
  }
}

function initSettingsSystem() {
  const fontSlider = $('fontSizeSlider');
  const iconSlider = $('iconSizeSlider');
  const bgCheckbox = $('dynamicBgCheckbox');

  const savedFontSize = localStorage.getItem('hv_font_size') || '50';
  const savedIconSize = localStorage.getItem('hv_icon_size') || '50';
  
  if (fontSlider) fontSlider.value = savedFontSize;
  if (iconSlider) iconSlider.value = savedIconSize;
  
  applyFontSize(savedFontSize);
  applyIconSize(savedIconSize);

  if (fontSlider) {
    fontSlider.addEventListener('input', (e) => {
      applyFontSize(e.target.value);
      localStorage.setItem('hv_font_size', e.target.value);
    });
  }

  if (iconSlider) {
    iconSlider.addEventListener('input', (e) => {
      applyIconSize(e.target.value);
      localStorage.setItem('hv_icon_size', e.target.value);
    });
  }

  S.dynamicBg = localStorage.getItem('hv_dynamic_bg') === 'true';
  if (bgCheckbox) {
    bgCheckbox.checked = S.dynamicBg;
    bgCheckbox.addEventListener('change', (e) => {
      S.dynamicBg = e.target.checked;
      localStorage.setItem('hv_dynamic_bg', S.dynamicBg);
      applyVerseBackground();
    });
  }

  applyVerseBackground();
}

/* ─────────────────────────────────────
   6. ЛОГІКА ВІДОБРАЖЕННЯ, ПАМ'ЯТІ ТА ЦИКЛІЧНОСТІ
───────────────────────────────────── */

function displayNewVerse(verseObj, categoryKey) {
  if (!verseObj) return;

  S.currentVerse = verseObj;
  if (categoryKey) S.currentCategory = categoryKey;

  const textEl = document.querySelector('.verse-text');
  const refEl = document.querySelector('.verse-reference');

  if (textEl) textEl.innerText = verseObj.text;
  if (refEl) refEl.innerText = verseObj.ref || '';

  localStorage.setItem('hv_last_verse_id', verseObj.id);
  localStorage.setItem('hv_last_category', S.currentCategory);

  applyVerseBackground();
}

function getVersesByCurrentCategory(categoryKey) {
  if (!categoryKey || categoryKey === 'all') {
    return S.allVerses;
  }
  return S.allVerses.filter(v => v.cat === categoryKey);
}

// ГОЛОВНА ФУНКЦІЯ: Наступний вірш (Тут виправляється помилка дужок)
function navigateToNextVerse() {
  if (S.allVerses.length === 0) return;

  let currentList = getVersesByCurrentCategory(S.currentCategory);
  let currentIndex = currentList.findIndex(v => v.id === S.currentVerse.id);

  if (currentIndex !== -1 && currentIndex < currentList.length - 1) {
    displayNewVerse(currentList[currentIndex + 1]);
  } else {
    let currentCatIndex = CATEGORIES_ORDER.indexOf(S.currentCategory);
    let nextCatIndex = (currentCatIndex + 1) % CATEGORIES_ORDER.length;
    let nextCategoryKey = CATEGORIES_ORDER[nextCatIndex];

    let nextList = getVersesByCurrentCategory(nextCategoryKey);

    if (nextList.length === 0) {
      nextCategoryKey = 'all';
      nextList = S.allVerses;
    }

    const firstVerseOfNewCat = nextList[0];

    displayNewVerse(firstVerseOfNewCat, nextCategoryKey);
    updateTopMenuUI(nextCategoryKey);
    showToast(`👉 Розділ «${CATEGORY_NAMES_UA[nextCategoryKey]}»`);
  }
}

// Ручне перемикання табів користувачем
function filterCategory(categoryKey) {
  if (S.allVerses.length === 0) return;
  
  const filteredList = getVersesByCurrentCategory(categoryKey);
  if (filteredList.length > 0) {
    displayNewVerse(filteredList[0], categoryKey);
    updateTopMenuUI(categoryKey);
    showToast(`📂 Розділ: ${CATEGORY_NAMES_UA[categoryKey]}`);
  }
}

// Оновлення табів та плавний скролл
function updateTopMenuUI(activeCategoryKey) {
  document.querySelectorAll('.cat-tab').forEach(tab => tab.classList.remove('active'));
  const currentTab = $(`tab-${activeCategoryKey}`);
  if (currentTab) {
    currentTab.classList.add('active');
    currentTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

// Завантаження JSON бази даних (ТУТ БУЛА ПОМИЛКА — ВИПРАВЛЕНО)
function loadVersesDatabase() {
  fetch('verses.json')
    .then(response => response.json())
    .then(data => {
      S.allVerses = data.verses || [];
      
      if (S.allVerses.length === 0) return;

      const savedVerseId = localStorage.getItem('hv_last_verse_id');
      const savedCategory = localStorage.getItem('hv_last_category') || 'all';

      let targetVerse = null;

      if (savedVerseId) {
        targetVerse = S.allVerses.find(v => v.id === Number(savedVerseId));
      }

      if (!targetVerse) {
        targetVerse = S.allVerses[0];
        S.currentCategory = 'all';
      } else {
        S.currentCategory = savedCategory;
      }

      displayNewVerse(targetVerse, S.currentCategory);
      updateTopMenuUI(S.currentCategory);
    }) // Ось тут була пропущена закриваюча дужка перед catch!
    .catch(err => {
      console.error("Помилка завантаження бази віршів:", err);
    });
}

/* ─────────────────────────────────────
   7. СТАРТ ДОДАТКА ТА ЕКСПОРТ
───────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  renderNotifList();
  initSettingsSystem();
  loadVersesDatabase();
});

window.applyVerseBackground = applyVerseBackground;
window.displayNewVerse = displayNewVerse;
window.navigateToNextVerse = navigateToNextVerse;
window.filterCategory = filterCategory;
window.updateTopMenuUI = updateTopMenuUI;
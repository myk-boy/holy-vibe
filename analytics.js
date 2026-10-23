/* ═══════════════════════════════════════════
   analytics.js — Holy Vibe
   Розширена аналітика (Firebase Analytics).
   Підключається ЗВИЧАЙНИМ <script> ПЕРЕД app.js (без import/export):
     <script src="analytics.js"></script>
     <script src="app.js"></script>
   Усі функції глобальні — викликаються з app.js та i18n.js.
═══════════════════════════════════════════ */

// Безпечне відправлення подій: без плагіна / у браузері — просто тихо ігнорується
let _warnedNoPlugin = false;
async function logSafeEvent(eventName, params = {}) {
  try {
    const plugin = window.Capacitor?.Plugins?.FirebaseAnalytics;
    if (!plugin) {
      // Один раз попереджаємо в консоль (chrome://inspect), щоб було видно, чому подій нема
      if (!_warnedNoPlugin) { _warnedNoPlugin = true; console.warn('Analytics: плагін FirebaseAnalytics недоступний (браузер або не підключено)'); }
      return;
    }
    await plugin.logEvent({ name: eventName, params });
  } catch (e) {
    console.log(`Analytics error on [${eventName}]:`, e);
  }
}

// Властивості користувача (стан, а не клік): мова, шрифт, шафл тощо.
// Відправляємо лише ті, що змінилися з минулого разу — без зайвих викликів.
const _sentUserProps = {};
async function trackUserProps(props = {}) {
  try {
    const plugin = window.Capacitor?.Plugins?.FirebaseAnalytics;
    if (!plugin) return;
    for (const [name, value] of Object.entries(props)) {
      const v = String(value).slice(0, 36); // ліміт Firebase на значення
      if (_sentUserProps[name] === v) continue;
      _sentUserProps[name] = v;
      await plugin.setUserProperty({ name, value: v });
    }
  } catch (e) {
    console.log('Analytics user property error:', e);
  }
}

// ==========================================
// 1. МУЗИКА ТА ПЛЕЄР
// ==========================================
function trackPlayTrack(trackName) {
  logSafeEvent('play_track', { track_name: trackName });
}

function trackStopTrack(trackName) {
  logSafeEvent('stop_track', { track_name: trackName });
}

function trackShuffleToggle(isEnabled) {
  logSafeEvent('toggle_shuffle', { status: isEnabled ? 'on' : 'off' });
}

function trackRepeatMode(mode) {
  // mode: 'track_repeat' | 'playlist_repeat' | 'off'
  logSafeEvent('set_repeat_mode', { repeat_mode: mode });
}

// ==========================================
// 2. ДИЗАЙН, ФОНИ ТА СТИЛІ
// ==========================================
function trackBackgroundSelect(bgName, isDefault) {
  logSafeEvent('select_background', {
    background_name: bgName,
    is_default: isDefault ? 'yes' : 'no'
  });
}

function trackBackgroundAutoChange() {
  logSafeEvent('use_background_auto_change');
}

function trackGlassStyleToggle(isEnabled) {
  logSafeEvent('toggle_glass_style', { status: isEnabled ? 'enabled' : 'disabled' });
}

// ==========================================
// 3. ШРИФТИ ТА КОЛЬОРИ
// ==========================================
function trackFontSelect(fontName, isDefault) {
  logSafeEvent('select_font', {
    font_name: fontName,
    is_default: isDefault ? 'yes' : 'no'
  });
}

function trackFontColorChange(colorValue) {
  logSafeEvent('change_font_color', { color: colorValue });
}

// ==========================================
// 4. МОВА ДОДАТКУ
// ==========================================
function trackLanguageSelect(langCode) {
  // наприклад: 'uk', 'en'
  logSafeEvent('select_language', { language: langCode });
}

// ==========================================
// 5. ВІРШІ, КАТЕГОРІЇ ТА ВЗАЄМОДІЯ
// ==========================================
function trackCategorySelect(categoryName, source = 'pill') {
  // source: 'pill' (кнопка категорії) | 'swipe' (автоперехід свайпом)
  logSafeEvent('select_category', { category_name: categoryName, source: source });
}

function trackFavoriteAdded(categoryName, verseId) {
  logSafeEvent('add_to_favorites', {
    category_name: categoryName,
    verse_id: String(verseId)
  });
}

function trackFavoriteRemoved(categoryName, verseId) {
  logSafeEvent('remove_from_favorites', {
    category_name: categoryName,
    verse_id: String(verseId)
  });
}

function trackVerseShared(categoryName, verseId) {
  logSafeEvent('share_verse', {
    category_name: categoryName,
    verse_id: String(verseId)
  });
}

function trackAiExplanation(verseId) {
  logSafeEvent('use_ai_explanation', { verse_id: String(verseId) });
}

function trackVerseCopied(verseId) {
  logSafeEvent('copy_verse', { verse_id: String(verseId) });
}

// ==========================================
// 6. ПОШУК ТА БУДИЛЬНИКИ
// ==========================================
function trackSearchOpen() {
  logSafeEvent('search_open');
}

function trackSearchResultOpen(verseId) {
  logSafeEvent('search_result_open', { verse_id: String(verseId) });
}

function trackAlarmCreated(repeatType) {
  // repeatType: 'once' | 'daily' | 'custom_days'
  logSafeEvent('alarm_created', { repeat_type: repeatType });
}

/**
 * update-checker.js — перевіряє GitHub Releases на нову версію веб-файлів
 * і застосовує її.
 *
 * ВАЖЛИВО (виправлено): раніше bundle застосовувався (set()) у момент,
 * коли застосунок згортався у фон. Android призупиняє WebView у фоні,
 * тож нова сторінка після set() не встигала виконати JS і викликати
 * notifyAppReady() вчасно — плагін бачив "Semaphore timeout" і сам
 * відкочував застосунок назад до вбудованої версії (звідси "все як
 * раніше" і "оновлення не підтягується").
 *
 * Тепер: завантажуємо і застосовуємо оновлення одразу, поки застосунок
 * активний (на передньому плані). Буде невеликий "стрибок" екрана в
 * момент оновлення — це прийнятна ціна за те, що оновлення реально
 * працює, а не тихо відкочується щоразу.
 */
(function () {
  // МАРКЕР ЗБІРКИ — тимчасовий рядок для перевірки, чи новий файл
  // справді потрапив у APK на телефоні. Якщо цього рядка НЕМАЄ в
  // логах 🐞 — значить встановлюється старий білд, і треба шукати
  // проблему в збірці/кешуванні Android Studio, а не в коді.
  console.log('[BUILD-CHECK] update-checker.js завантажено: BUILD-MARKER-0806-2201');

  var Plugins = (window.Capacitor && window.Capacitor.Plugins) || {};
  var CapacitorUpdater = Plugins.CapacitorUpdater;
  var App = Plugins.App;
  if (!CapacitorUpdater) {
    console.warn('CapacitorUpdater недоступний — оновлення пропущено');
    return;
  }
  var RELEASES_API = 'https://api.github.com/repos/myk-boy/holy-vibe/releases/latest';
  var ASSET_NAME = 'holy-vibe-web.zip';
  var applying = false; // захист від паралельних запусків (кілька appStateChange поспіль)

  // 1. ОБОВ'ЯЗКОВО перше — без жодних умов, без очікування завантаження/мережі.
  //    Підтверджуємо плагіну, що поточний (уже застосований раніше) бандл робочий.
  //    Логуємо і успіх, і помилку — щоб точно бачити в 🐞-логах, що
  //    насправді відбувається (раніше логувалась лише помилка).
  console.log('[Updater] викликаю notifyAppReady...');
  CapacitorUpdater.notifyAppReady()
    .then(function (r) { console.log('[Updater] notifyAppReady OK', JSON.stringify(r)); })
    .catch(function (e) { console.warn('[Updater] notifyAppReady ПОМИЛКА', e); });

  async function checkDownloadAndApply() {
    if (applying) return;
    try {
      var res = await fetch(RELEASES_API);
      if (!res.ok) return;
      var release = await res.json();
      var tag = release.tag_name;
      if (!tag) return;
      var asset = (release.assets || []).find(function (a) { return a.name === ASSET_NAME; });
      if (!asset) return;
      var known = localStorage.getItem('hv_web_version');
      if (known === tag) return;

      applying = true;
      var bundle = await CapacitorUpdater.download({ version: tag, url: asset.browser_download_url });

      // КРИТИЧНО: записуємо версію в localStorage ДО виклику set(), а не
      // після. На Android set() одразу перезавантажує WebView нативно —
      // JS-контекст може обірватись ще до того, як await поверне
      // керування наступному рядку. Якщо записати "відому версію" вже
      // ПІСЛЯ set(), той рядок може ніколи не виконатись — і тоді після
      // кожного відкату застосунок знову й знову бачитиме цю ж версію
      // як "нову" й тягтиме її по колу (нескінченний цикл = таймаути
      // щохвилини, які ми бачимо в логах).
      localStorage.setItem('hv_web_version', tag);
      await CapacitorUpdater.set(bundle);
      // Після set() сторінка перезавантажується новим бандлом — той сам
      // виконає свій update-checker.js і викличе notifyAppReady() заново.
    } catch (e) {
      console.warn('Оновлення не вдалось:', e);
    } finally {
      applying = false;
    }
  }

  // Перевіряємо при старті і щоразу, коли застосунок повертається на передній план.
  checkDownloadAndApply();
  if (App && App.addListener) {
    App.addListener('appStateChange', function (state) {
      if (state.isActive) checkDownloadAndApply();
    });
  }
})();
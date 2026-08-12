/**
 * native-bridge.js — заміна window.AndroidBridge через кросплатформні
 * Capacitor-плагіни. ВАЖЛИВО: без import — цей проєкт без збірника
 * (Vite/Webpack), тому всі плагіни беремо з window.Capacitor.Plugins,
 * куди Capacitor сам їх реєструє під час запуску застосунку.
 * Підключати ПЕРЕД app.js.
 */
(function () {
  var Plugins = (window.Capacitor && window.Capacitor.Plugins) || {};
  var LocalNotifications = Plugins.LocalNotifications;
  var Share = Plugins.Share;
  var Browser = Plugins.Browser;
  var Filesystem = Plugins.Filesystem;

  // ── ID КАНАЛУ СПОВІЩЕНЬ ─────────────────────────────────────────────
  // ВАЖЛИВО: Android "заморожує" налаштування каналу (звук, важливість,
  // вібрацію) назавжди після першого createChannel() з цим id — жодні
  // подальші зміни коду це не перепишуть, доки застосунок повністю не
  // видалять. Раніше канал 'holy_vibe_prayer' був створений з sound:
  // 'default', яке Android шукає як ім'я файлу в res/raw (такого файлу
  // нема) — і тому канал "застряг" без звуку.
  // Замість того щоб змушувати видаляти застосунок щоразу, коли міняємо
  // налаштування каналу — даємо каналу НОВЕ ім'я. Android бачить, що
  // каналу з таким id ще нема, і створює його заново, вже з правильними
  // параметрами. Якщо в майбутньому знадобиться змінити канал ще раз —
  // просто підвищуйте суфікс (_v3, _v4, ...).
  var NOTIF_CHANNEL_ID = 'holy_vibe_prayer_v3';

  window.AndroidBridge = {

    playBackgroundAudio: function (url) {
      if (!window.__holyVibeAudio) window.__holyVibeAudio = new Audio();
      window.__holyVibeAudio.src = url;
      window.__holyVibeAudio.loop = true;
      window.__holyVibeAudio.play().catch(function (err) {
        console.warn('audio play failed', err);
      });
    },

    pauseBackgroundAudio: function () {
      if (window.__holyVibeAudio) window.__holyVibeAudio.pause();
    },

    shareImage: function (base64Png, fileName, caption) {
      (async function () {
        try {
          if (!Filesystem || !Share) throw new Error('Filesystem/Share plugin недоступний');
          var pureBase64 = base64Png.indexOf(',') >= 0 ? base64Png.split(',')[1] : base64Png;
          var safeName = fileName || 'holy-vibe-verse.jpg';

          var written = await Filesystem.writeFile({
            path: safeName,
            data: pureBase64,
            directory: 'CACHE',
          });

          await Share.share({
            title: caption || 'Holy Vibe',
            url: written.uri,
            dialogTitle: 'Поділитися',
          });

          window.__onShareImageResult && window.__onShareImageResult(true, null);
        } catch (e) {
          console.error('shareImage error', e);
          window.__onShareImageResult && window.__onShareImageResult(false, String(e.message || e));
        }
      })();
    },

    scheduleNotifications: function (jsonAlarms) {
      (async function () {
        try {
          if (!LocalNotifications) throw new Error('LocalNotifications plugin недоступний');
          var alarms = JSON.parse(jsonAlarms);

          var perm = await LocalNotifications.checkPermissions();
          if (perm.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }

          // КАНАЛ СПОВІЩЕНЬ — без нього Android 8+ показує сповіщення
          // тихою рядковою "шторкою", без звуку й без пробудження екрана,
          // незалежно від того, що вказано в самому сповіщенні.
          // importance: 5 = MAX (heads-up, звук, пробудження екрана).
          //
          // ВАЖЛИВО: поле sound НЕ вказуємо взагалі. Якщо його прибрати —
          // Android сам призначає каналу поточний системний звук
          // сповіщень за замовчуванням. Раніше тут стояло sound:
          // 'default' — Android сприймав це як ІМ'Я ФАЙЛУ (шукав
          // res/raw/default), не знаходив і залишав канал без звуку
          // взагалі, замість очікуваного плавного відкату на системний.
          try {
            await LocalNotifications.createChannel({
              id: NOTIF_CHANNEL_ID,
              name: 'Нагадування про молитву',
              description: 'Щоденні нагадування помолитись',
              importance: 5,
              visibility: 1,
              vibration: true,
              lights: true,
			  sound: 'notification'
            });
          } catch (chErr) {
            console.warn('createChannel error', chErr);
          }

          var toSchedule = alarms
            .filter(function (a) { return a.active !== false; })
            .map(function (a) {
              return {
                id: a.id,
                title: a.label || 'Час молитви 🙏',
                body: a.notif_body || '',
                channelId: NOTIF_CHANNEL_ID,
                // Поле sound тут стосується лише Android < 8 (на 8+ звук
                // бере з каналу вище через channelId) — так само не
                // вказуємо 'default' як ім'я файлу, щоб не ловити ту ж
                // саму помилку на старих пристроях.
                // allowWhileIdle: намагається доставити точно вчасно навіть
                // у режимі Doze (енергозбереження Android) — без цього
                // система може відкласти показ на кілька хвилин.
				sound: 'notification.wav',
                allowWhileIdle: true,
                schedule: a.days === 'once'
                  ? { at: nextTime(a.hour, a.minute) }
                  : { on: { hour: a.hour, minute: a.minute }, every: 'day' },
              };
            });
          if (toSchedule.length) {
            await LocalNotifications.schedule({ notifications: toSchedule });
          }

          var toCancel = alarms
            .filter(function (a) { return a.active === false; })
            .map(function (a) { return { id: a.id }; });
          if (toCancel.length) {
            await LocalNotifications.cancel({ notifications: toCancel });
          }
        } catch (e) {
          console.error('scheduleNotifications error', e);
        }
      })();
    },

    scheduleNotification: function (timeString) {
      var parts = timeString.split(':');
      var h = parseInt(parts[0], 10), m = parseInt(parts[1], 10);
      this.scheduleNotifications(JSON.stringify([{ id: 0, hour: h, minute: m, active: true }]));
    },

    cancelNotification: function (alarmId) {
      if (LocalNotifications) {
        LocalNotifications.cancel({ notifications: [{ id: alarmId }] });
      }
    },
  };

  function nextTime(hour, minute) {
    var d = new Date();
    d.setHours(hour, minute, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d;
  }

  if (LocalNotifications && LocalNotifications.requestPermissions) {
    LocalNotifications.requestPermissions().catch(function (e) {
      console.warn('requestPermissions error', e);
    });
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href]');
    if (!link) return;
    var url = link.getAttribute('href');
    if (!url || url.indexOf('#') === 0 || url.indexOf(location.origin) === 0) return;
    e.preventDefault();
    if (Browser) {
      Browser.open({ url: url }).catch(function (err) {
        console.warn('Не вдалось відкрити зовнішнє посилання', err);
      });
    } else {
      window.open(url, '_system');
    }
  });
})();

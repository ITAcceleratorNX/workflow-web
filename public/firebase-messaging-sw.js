// Service Worker для Web Push уведомлений
// Этот файл должен быть в папке public для доступности по URL

// Новая версия воркера начинает работать сразу и берёт открытые вкладки под себя: иначе нажатие
// на уведомление не смогло бы перевести уже открытую вкладку на его адрес. Запросы страниц воркер
// не перехватывает, поэтому больше это ничего не меняет.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

// Обработка push-событий (когда приходит уведомление с сервера)
self.addEventListener('push', (event) => {
  console.log('📬 [SW] Push event received:', event);
  
  let notificationData = {
    title: 'Новое уведомление',
    body: 'У вас новое уведомление',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'notification',
    data: {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  // Пытаемся распарсить данные из push события
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.notification?.title || data.title || notificationData.title,
        body: data.notification?.body || data.body || notificationData.body,
        icon: data.notification?.icon || data.icon || notificationData.icon,
        badge: data.notification?.badge || '/icon-192x192.png',
        tag: data.data?.type || data.tag || 'notification',
        data: data.data || {},
        requireInteraction: data.requireInteraction || false,
        vibrate: data.vibrate || [200, 100, 200],
        timestamp: Date.now()
      };
    } catch (e) {
      // Если не JSON, пытаемся как текст
      try {
        const text = event.data.text();
        if (text) {
          notificationData.body = text;
        }
      } catch (e2) {
        console.error('❌ [SW] Error parsing push data:', e2);
      }
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Обработка клика по уведомлению: открыть его адрес (`data.url` — опрос, задача…). Вкладка с этим
// адресом выходит вперёд; другая вкладка Workflow выходит вперёд и переходит на адрес; иначе —
// новое окно.
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked:', event.notification);

  event.notification.close();

  const data = event.notification.data || {};
  const target = new URL(data.url || '/', self.location.origin);
  const openWindow = () => (clients.openWindow ? clients.openWindow(target.href) : undefined);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (target.origin !== self.location.origin) return openWindow();
      const appTabs = clientList.filter((client) => new URL(client.url).origin === target.origin);
      const opened = appTabs.find((client) => client.url === target.href);
      if (opened) return opened.focus();
      const tab =
        appTabs.find((client) => client.focused) ||
        appTabs.find((client) => client.visibilityState === 'visible') ||
        appTabs[0];
      if (!tab) return openWindow();
      // navigate() есть только у вкладки под этим воркером; другой вкладке — новое окно.
      return tab
        .focus()
        .then((focused) => focused.navigate(target.href))
        .catch(openWindow);
    })
  );
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 [SW] Notification closed:', event.notification);
});


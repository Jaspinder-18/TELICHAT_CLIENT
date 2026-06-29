// Service Worker for TeliChat Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { id, title, body, type, priority, sound } = data;

    const options = {
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { id, type },
      tag: 'telichat-notification', // Collapse multiple alerts
      renotify: true,
      requireInteraction: priority === 'critical' || priority === 'high',
      actions: [
        { action: 'open', title: 'Open Chat' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Error displaying push notification:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  if (action === 'close') return;

  // Navigate & focus active tab
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find active tab
      for (const client of clientList) {
        if ('focus' in client) {
          // Send navigation instruct message to client React thread
          client.postMessage({
            action: 'NAVIGATE_NOTIFICATION',
            data: event.notification.data
          });
          return client.focus();
        }
      }
      // If no tab is open, launch a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

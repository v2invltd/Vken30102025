// This service worker handles push notifications.

self.addEventListener('push', event => {
  try {
    const data = event.data.json();
    console.log('New push notification received', data);
    const options = {
      body: data.body,
      icon: '/icon-192.png', // A path to a suitable icon
      badge: '/icon-72.png', // A smaller icon for the notification tray
      data: {
        url: self.location.origin, // Store the app's URL
      },
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (e) {
    console.error('Error handling push event:', e);
    // Fallback for plain text pushes
    const options = { body: event.data.text() };
    event.waitUntil(
      self.registration.showNotification("New Notification", options)
    );
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      // If a window is already open, focus it
      const hadWindowToFocus = clientsArr.some(windowClient => 
        windowClient.url === self.location.origin ? (windowClient.focus(), true) : false
      );
      // Otherwise, open a new window
      if (!hadWindowToFocus) {
        clients.openWindow(self.location.origin).then(windowClient => windowClient ? windowClient.focus() : null);
      }
    })
  );
});

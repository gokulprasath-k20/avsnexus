importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAzykJ69zyRapECR6OzR0KYmZEewkZ3u1A",
  authDomain: "avsnexus-c54b1.firebaseapp.com",
  projectId: "avsnexus-c54b1",
  storageBucket: "avsnexus-c54b1.firebasestorage.app",
  messagingSenderId: "637180914163",
  appId: "1:637180914163:web:447021bba468bcae444a86",
  measurementId: "G-DJCZWRLH7C"
};

// ─── Initialize Firebase ──────────────────────────────────────────────────────
try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // ─── Background messages (app not open / minimized) ───────────────────────
  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'AVS Nexus';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification.',
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      // Store the URL in data so notificationclick can open it
      data: {
        url: payload.data?.url || '/student-dashboard',
        ...payload.data,
      },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.error('[FCM SW] Failed to initialize Firebase Messaging:', error);
}

// ─── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/student-dashboard';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If app is already open, focus it and navigate
        for (const client of windowClients) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) {
              client.navigate(urlToOpen);
            }
            return;
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ─── Fetch handler (required for PWA installability) ──────────────────────────
self.addEventListener('fetch', () => {
  // No interception needed here — sw.js handles caching.
  // This listener just satisfies PWA install requirements.
});

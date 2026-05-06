importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Initialize Firebase App
// IMPORTANT: Replace these values with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAzykJ69zyRapECR6OzR0KYmZEewkZ3u1A",
  authDomain: "avsnexus-c54b1.firebaseapp.com",
  projectId: "avsnexus-c54b1",
  storageBucket: "avsnexus-c54b1.firebasestorage.app",
  messagingSenderId: "637180914163",
  appId: "1:637180914163:web:447021bba468bcae444a86",
  measurementId: "G-DJCZWRLH7C"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'AVS Nexus';
    const notificationOptions = {
      body: payload.notification?.body || 'New update available.',
      icon: '/icon-512.png',
      data: payload.data,
      badge: '/icon-512.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  // PWA requires a fetch handler to trigger the install prompt
  self.addEventListener('fetch', function(event) {
    // We don't actually need to intercept anything, just having the listener satisfies the PWA install criteria
  });
} catch (error) {
  console.error('Failed to initialize Firebase Messaging SW', error);
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.indexOf(urlToOpen) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

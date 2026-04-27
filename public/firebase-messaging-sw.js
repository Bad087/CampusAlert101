importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDkJMTseoqsNKlkVKKnF76MiqYI_xRpHVA",
  authDomain: "gen-lang-client-0941669264.firebaseapp.com",
  projectId: "gen-lang-client-0941669264",
  storageBucket: "gen-lang-client-0941669264.firebasestorage.app",
  messagingSenderId: "225907542948",
  appId: "1:225907542948:web:79e3dda54ce2a64a6b0f31"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

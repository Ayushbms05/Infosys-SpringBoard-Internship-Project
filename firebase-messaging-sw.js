/**
 * firebase-messaging-sw.js — Background push notification handler for FCM.
 *
 * This file MUST live at the root of the domain so Firebase Messaging
 * can register it as the push handler service worker.
 */

/* global importScripts, firebase */

// Import Firebase SDKs (compat versions to match the app)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize Firebase with the same config as the main app
firebase.initializeApp({
  apiKey:            'AIzaSyC_n4V2Pn1Qu61osD95XddaNuxxZSVwYbw',
  authDomain:        'infosyssb-501215.firebaseapp.com',
  projectId:         'infosyssb-501215',
  storageBucket:     'infosyssb-501215.firebasestorage.app',
  messagingSenderId: '506576411881',
  appId:             '1:506576411881:web:a50036b0c20e876505e478'
});

var messaging = firebase.messaging();

// Handle background push messages (when the app is not in the foreground)
messaging.onBackgroundMessage(function (payload) {
  var notificationTitle = payload.notification && payload.notification.title
    ? payload.notification.title
    : 'AksharGyan';
  var notificationOptions = {
    body: payload.notification && payload.notification.body
      ? payload.notification.body
      : 'You have a new notification.',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-192x192.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

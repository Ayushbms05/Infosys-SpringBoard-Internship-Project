/**
 * push-notifications.js — FCM token registration for AksharGyan PWA.
 *
 * Exposes a single function: initPushNotifications()
 *
 * Call it when you're ready to prompt the user for notification permission.
 * It will:
 *   1. Dynamically load the Firebase Messaging SDK (if not already loaded)
 *   2. Request notification permission
 *   3. Get an FCM token
 *   4. Save the token to the user's Firestore document under "fcmToken"
 *
 * Dependencies (must already be on the page):
 *   - firebase-app-compat.js   (already loaded on all pages with Firebase)
 *   - firebase-config.js       (provides the global `auth` and `db` references)
 *
 * The firebase-messaging-compat.js SDK is loaded dynamically by this file
 * so no extra <script> tag is needed in HTML files.
 */

/* global firebase, auth, db */

/**
 * Dynamically loads a script and returns a Promise that resolves when loaded.
 */
function _loadScript(src) {
  return new Promise(function (resolve, reject) {
    // Don't load if already present
    var existing = document.querySelector('script[src="' + src + '"]');
    if (existing) {
      resolve();
      return;
    }
    var script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = function () {
      reject(new Error('Failed to load script: ' + src));
    };
    document.head.appendChild(script);
  });
}

/**
 * Request notification permission, get FCM token, and save to Firestore.
 *
 * @returns {Promise<string|null>} The FCM token, or null if permission denied / error.
 */
function initPushNotifications() {
  // 1. Check browser support
  if (!('Notification' in window)) {
    console.warn('Push notifications: This browser does not support notifications.');
    return Promise.resolve(null);
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('Push notifications: Service workers not supported.');
    return Promise.resolve(null);
  }

  // 2. Dynamically load the FCM SDK
  return _loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js')
    .then(function () {
      // 3. Request permission
      return Notification.requestPermission();
    })
    .then(function (permission) {
      if (permission !== 'granted') {
        console.warn('Push notifications: Permission denied by user.');
        return null;
      }

      // 4. Register the messaging service worker and get token
      var messaging = firebase.messaging();
      return navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
        .then(function (existingReg) {
          if (existingReg) {
            return existingReg;
          }
          return navigator.serviceWorker.register('/firebase-messaging-sw.js');
        })
        .then(function (registration) {
          return messaging.getToken({
            vapidKey: '', // TODO: Add your VAPID key from Firebase Console → Cloud Messaging
            serviceWorkerRegistration: registration
          });
        });
    })
    .then(function (token) {
      if (!token) {
        return null;
      }

      console.log('Push notifications: FCM token obtained.');

      // 5. Save token to the current user's Firestore document
      var user = auth.currentUser;
      if (user) {
        return db.collection('users').doc(user.uid).update({
          fcmToken: token
        }).then(function () {
          console.log('Push notifications: Token saved to Firestore.');
          return token;
        }).catch(function (err) {
          console.error('Push notifications: Failed to save token to Firestore:', err);
          return token;
        });
      } else {
        console.warn('Push notifications: No authenticated user — token not saved.');
        return token;
      }
    })
    .catch(function (err) {
      console.error('Push notifications: Error during initialization:', err);
      return null;
    });
}

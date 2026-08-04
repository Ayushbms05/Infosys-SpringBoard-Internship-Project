/**
 * sw.js — Service Worker for AksharGyan PWA.
 *
 * Strategy:
 *   • Cache-first for static assets (HTML, CSS, JS, icons, images)
 *   • Network-first / bypass for Firebase and Google Cloud API requests
 *
 * Cache is versioned so future deploys can bust it cleanly.
 */

var CACHE_NAME = "infosyssb-cache-v5";

// Static assets to precache on install
var PRECACHE_URLS = [
  // ─── HTML shells ─────────────────────────────────────────────
  "/",
  "/index.html",
  "/login.html",
  "/register.html",
  "/dashboard.html",
  "/admin.html",
  "/assessment.html",
  "/lesson.html",

  // ─── CSS ─────────────────────────────────────────────────────
  "/style.css",

  // ─── Local JS files ──────────────────────────────────────────
  "/firebase-config.js",
  "/translations.js",
  "/auth.js",
  "/main.js",
  "/admin.js",
  "/dashboard.js",
  "/assessment.js",
  "/chat.js",
  "/analysis.js",
  "/lesson.js",
  "/game.js",
  "/celebrations.js",
  "/theme.js",
  "/tts.js",
  "/push-notifications.js",

  // ─── Icons & images ──────────────────────────────────────────
  "/favicon.svg",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png",
  "/assets/login_illustration.png",
  "/assets/register_illustration.png",

  // ─── Manifest ────────────────────────────────────────────────
  "/manifest.json",
];

// Domains / URL patterns that must NEVER be served from cache
// (Firebase auth, Firestore, Cloud APIs, Firebase SDK CDN)
var NETWORK_ONLY_PATTERNS = [
  "firebaseio.com",
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "googleapis.com/identitytoolkit",
  "www.gstatic.com/firebasejs",
  "generativelanguage.googleapis.com",
  "texttospeech.googleapis.com",
  "speech.googleapis.com",
  "fcm.googleapis.com",
  "fcmregistrations.googleapis.com",
];

// ─── INSTALL: precache static assets ───────────────────────────
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(function () {
        return self.skipWaiting();
      }),
  );
});

// ─── ACTIVATE: clean up old caches ─────────────────────────────
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (name) {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

// ─── FETCH: route requests by strategy ─────────────────────────
self.addEventListener("fetch", function (event) {
  var requestUrl = event.request.url;

  // Network-only for Firebase / Google Cloud API requests
  // Network-only for Firebase / Google Cloud API requests
  for (var i = 0; i < NETWORK_ONLY_PATTERNS.length; i++) {
    if (requestUrl.indexOf(NETWORK_ONLY_PATTERNS[i]) !== -1) {
      event.respondWith(
        fetch(event.request).catch(function () {
          return new Response(JSON.stringify({ error: "offline" }), {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "application/json" },
          });
        }),
      );
      return;
    }
  }

  // Cache-first for everything else (static assets)
  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        // Return cached version, but also update cache in background
        event.waitUntil(
          fetch(event.request)
            .then(function (networkResponse) {
              if (networkResponse && networkResponse.status === 200) {
                return caches.open(CACHE_NAME).then(function (cache) {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(function () {
              // Network unavailable — that's fine, we already served from cache
            }),
        );
        return cachedResponse;
      }

      // Not in cache — fetch from network, cache the response
      // Not in cache — fetch from network, cache the response
      return fetch(event.request)
        .then(function (networkResponse) {
          if (networkResponse && networkResponse.status === 200 && event.request.method === "GET") {
            var responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(function () {
          return new Response("Offline — this resource is not available.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" },
          });
        });
    }),
  );
});

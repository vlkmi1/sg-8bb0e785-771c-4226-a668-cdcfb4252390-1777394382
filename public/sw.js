/* eslint-disable no-restricted-globals */
const CACHE_NAME = "kaikus-v1";
const RUNTIME_CACHE = "kaikus-runtime-v1";

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/chat",
  "/generate",
  "/mobile-dashboard",
  "/tablet-dashboard",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error("[SW] Failed to cache:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response to cache
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached;
            }
            // No cache, return offline fallback
            return caches.match("/offline");
          });
        })
    );
    return;
  }

  // Static assets - Cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached version and update in background
        fetch(request)
          .then((response) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
            });
          })
          .catch(() => {
            // Network error, ignore
          });
        return cached;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, return offline page
          if (request.destination === "document") {
            return caches.match("/offline");
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable"
          });
        });
    })
  );
});

// Message event - for manual cache updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
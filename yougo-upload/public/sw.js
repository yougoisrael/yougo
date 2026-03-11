// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Yougo Service Worker — PWA offline + caching
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CACHE_NAME = "yougo-v1";
const OFFLINE_URL = "/";

// Assets to pre-cache on install
const PRE_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
];

// ── Install ──────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

// ── Activate (clean old caches) ──────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch — Network first, fall back to cache ────
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // Skip Supabase / API calls (always fresh)
  const url = event.request.url;
  if (url.includes("supabase.co") || url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return res;
      })
      .catch(() =>
        caches.match(event.request).then(r => r || caches.match(OFFLINE_URL))
      )
  );
});

// ── Push Notifications ───────────────────────────
self.addEventListener("push", event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Yougo 🍕", {
      body:  data.body  || "יש עדכון בהזמנה שלך",
      icon:  "/icon-192.png",
      badge: "/icon-192.png",
      data:  { url: data.url || "/" },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});

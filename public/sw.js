// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Yougo Service Worker v2 — Smart Cache + Push
//  Merged: DeepSeek cache strategies + original push handlers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SHELL_CACHE = 'yougo-shell-v2';
const TILE_CACHE  = 'yougo-tiles-v2';
const IMAGE_CACHE = 'yougo-images-v2';
const ALL = [SHELL_CACHE, TILE_CACHE, IMAGE_CACHE];

// ── Install ──────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => c.addAll(['/', '/manifest.json']))
      .then(() => self.skipWaiting())
  );
});

// ── Activate (clean old caches) ──────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(
        ks.filter(k => !ALL.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch — Smart strategies per resource type ───
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Map tiles → Cache First (tiles rarely change)
  if (url.hostname.includes('carto') || url.hostname.includes('tile')) {
    e.respondWith(cacheFirst(e.request, TILE_CACHE));
    return;
  }

  // Images → Stale While Revalidate
  if (/\.(png|jpg|jpeg|webp|svg|ico)$/.test(url.pathname)) {
    e.respondWith(swr(e.request, IMAGE_CACHE));
    return;
  }

  // Supabase API → Network first, fall back to cache
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // App shell (JS, CSS, pages) → Cache First
  if (e.request.mode === 'navigate' || /\.(js|css)$/.test(url.pathname)) {
    e.respondWith(cacheFirst(e.request, SHELL_CACHE));
    return;
  }
});

// ── Cache strategies ─────────────────────────────
async function cacheFirst(req, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function swr(req, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fresh  = fetch(req)
    .then(r => { if (r.ok) cache.put(req, r.clone()); return r; })
    .catch(() => {});
  return cached || fresh;
}

// ── Push Notifications ────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Yougo 🍕', {
      body:    data.body    || 'יש עדכון בהזמנה שלך',
      icon:    '/icon-192.png',
      badge:   '/icon-192.png',
      data:    { url: data.url || '/' },
      vibrate: [100, 50, 100],
    })
  );
});

// ── Notification Click ────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

const CACHE = 'rondjebull-v2';
const SHELL = ['/', '/spelers', '/spel', '/winst', '/leaderboard', '/manifest.json', '/icons/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip HMR / webpack dev channels
  if (url.pathname.startsWith('/_next/webpack') || url.pathname.includes('__next')) return;

  if (url.pathname.startsWith('/_next/static/')) {
    // Immutable hashed assets → cache-first
    e.respondWith(
      caches.match(request).then(
        (hit) => hit || fetch(request).then((res) => {
          caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        })
      )
    );
  } else {
    // Pages → network-first, cached fallback
    e.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request))
    );
  }
});

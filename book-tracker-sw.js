const CACHE_NAME = 'book-tracker-cache-v2';
const ASSETS = [
  './book-tracker.html',
  './icons/book-tracker-192.png',
  './icons/book-tracker-512.png'
];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS.map(function(u) { return new Request(u, { cache: 'reload' }); }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Network first, so a new deploy shows up on the next load. The saved copy is only
// used when offline, or when the network hasn't answered within NETWORK_TIMEOUT_MS.
self.addEventListener('fetch', function(event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  const network = fetch(req, { cache: 'no-cache' }).then(function(resp) {
    if (resp && resp.status === 200 && resp.type === 'basic') {
      const copy = resp.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(function(cache) { return cache.put(req, copy); }));
    }
    return resp;
  });

  const slowFallback = new Promise(function(resolve) {
    setTimeout(function() {
      caches.match(req).then(function(cached) { if (cached) resolve(cached); });
    }, NETWORK_TIMEOUT_MS);
  });

  event.respondWith(
    Promise.race([network, slowFallback]).catch(function() {
      return caches.match(req).then(function(cached) { return cached || Response.error(); });
    })
  );
});

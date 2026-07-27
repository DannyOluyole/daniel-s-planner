const CACHE_NAME = 'book-tracker-cache-v1';
const ASSETS = [
  './book-tracker.html',
  './icons/book-tracker-192.png',
  './icons/book-tracker-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(ASSETS); })
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

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var network = fetch(event.request).then(function(resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, copy); });
        }
        return resp;
      }).catch(function() { return cached; });
      return cached || network;
    })
  );
});

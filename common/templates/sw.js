var version = 1;
var staticCacheName = 'djangopwa-v4';

const staticAssets = [
    './',
];

self.addEventListener('install', async e => {
  const cache = await caches.open(staticCacheName);
  await cache.addAll(staticAssets);
  return self.skipWaiting();
});


self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).then(function(response){
        let clone = response.clone();
        caches.open(staticCacheName).then(function(cache) {
            if (response.status < 400 &&
                response.headers.has('content-type')) {
                cache.put(event.request, clone);
            } else {
                //console.log('  Not caching the response to', event.request.url);
            }
        });
        return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          // Return true if you want to remove this cache,
          // but remember that caches are shared across
          // the whole origin
            return cacheName !== staticCacheName
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});


var staticCacheName = 'djangopwa-v1';

const staticAssets = [
  './',
  './index.html',
  './Router.js'
];
/*self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
          '/',
          '/index.html',
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
 console.log('url',event.request.url);

 event.respondWith(
   caches.match(event.request).then(function(response) {
     return response || fetch(event.request);
   })
 );
});*/

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
                console.log('  Not caching the response to', event.request.url);
            }
        });
        return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});
/*self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});*/

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          // Return true if you want to remove this cache,
          // but remember that caches are shared across
          // the whole origin
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
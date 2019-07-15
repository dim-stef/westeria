var staticCacheName = 'djangopwa-v1';
console.log("register");
self.addEventListener('install', function(event) {
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
});
importScripts('https://www.gstatic.com/firebasejs/6.5.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/6.5.0/firebase-messaging.js');
firebase.initializeApp({
    messagingSenderId: "807145779776"
});

const messaging = firebase.messaging();

importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

var version = 13;

if (workbox) {
    workbox.setConfig({debug: false});
    workbox.routing.registerRoute(
      new RegExp('/.*'),
      new workbox.strategies.NetworkFirst({
        // Use a custom cache name.
        cacheName: 'page-cache',
          plugins: [
             new workbox.broadcastUpdate.Plugin(),
          ],
      })
    );

    workbox.routing.registerRoute(
      new RegExp('https://d3u9nsvugag1ev\\.cloudfront\\.net.*/static/.*\\.js'),
      new workbox.strategies.StaleWhileRevalidate({
          plugins: [
             new workbox.broadcastUpdate.Plugin(),
          ],
      })
    );

    workbox.routing.registerRoute(
      // Cache CSS files.
        new RegExp('https://d3u9nsvugag1ev\\.cloudfront\\.net.*/static/.*\\.css'),
      // Use cache but update in the background.
      new workbox.strategies.StaleWhileRevalidate({
        // Use a custom cache name.
          cacheName: 'css-cache',
          plugins: [
             new workbox.broadcastUpdate.Plugin(),
          ],

      })
    );

    workbox.routing.registerRoute(
      // Cache image files.
        new RegExp('https://d3u9nsvugag1ev\\.cloudfront\\.net.*/media/.*\\.(?:png|jpg|jpeg|svg|gif)'),
      // Use the cache if it's available.
      new workbox.strategies.StaleWhileRevalidate({
        // Use a custom cache name.
        cacheName: 'external-image-cache',
        plugins: [
          new workbox.expiration.Plugin({
            // Cache only 20 images.
            maxEntries: 20,
            // Cache for a maximum of a week.
            maxAgeSeconds: 7 * 24 * 60 * 60,
          })
        ],
      })
    );

    workbox.routing.registerRoute(
      // Cache image files.
        /\.(?:png|jpg|jpeg|svg|gif)$/,
      // Use the cache if it's available.
      new workbox.strategies.StaleWhileRevalidate({
        // Use a custom cache name.
        cacheName: 'image-cache',
        plugins: [
          new workbox.expiration.Plugin({
            // Cache only 20 images.
            maxEntries: 20,
            // Cache for a maximum of a week.
            maxAgeSeconds: 7 * 24 * 60 * 60,
          })
        ],
      })
    );
} else {
  console.log(`Workbox could not be loaded :(`);
}

self.addEventListener('install',  e => {
  self.skipWaiting();
});

/*var version = 1;
var staticCacheName = 'v1';

const staticAssets = [
    './',
    './index.html',
    'https://d3u9nsvugag1ev.cloudfront.net/static/css/index.css',
    'https://d3u9nsvugag1ev.cloudfront.net/static/accounts/auth.css',
    'https://d3u9nsvugag1ev.cloudfront.net/static/css/errors.css',
    'https://d3u9nsvugag1ev.cloudfront.net/static/core/css/modal.css',
    'https://d3u9nsvugag1ev.cloudfront.net/static/groups/css/creategroup.css',
    'https://d3u9nsvugag1ev.cloudfront.net/static/groups/css/index.css',
    'https://d3u9nsvugag1ev.cloudfront.net/static/groupchat/css/groupchat.css',
    'https://d3u9nsvugag1ev.cloudfront.net/static/js/csrf.js',
    'https://d3u9nsvugag1ev.cloudfront.net/static/js/app.bundle.js',
    'https://d3u9nsvugag1ev.cloudfront.net/static/logo_full.png',
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

*/
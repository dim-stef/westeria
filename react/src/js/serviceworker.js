import {precacheAndRoute} from 'workbox-precaching/precacheAndRoute.mjs';
importScripts("precache-manifest.47565e861a50e4b271a0ce24cc9d8095.js");
importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

workbox.skipWaiting();
workbox.clientsClaim();

// cache name
workbox.core.setCacheNameDetails({
    prefix: 'My-awesome-cache',
    precache: 'precache',
    runtime: 'runtime',
  });
  
// runtime cache
// 1. stylesheet
workbox.routing.registerRoute(
    new RegExp('\.css$'),
    workbox.strategies.cacheFirst({
        cacheName: 'My-awesome-cache-Stylesheets',
        plugins: [
            new workbox.expiration.Plugin({
                maxAgeSeconds: 60 * 60 * 24 * 7, // cache for one week
                maxEntries: 20, // only cache 20 request
                purgeOnQuotaError: true
            })
        ]
    })
);
// 2. images
workbox.routing.registerRoute(
    new RegExp('\.(png|svg|jpg|jpeg)$'),
    workbox.strategies.cacheFirst({
        cacheName: 'My-awesome-cache-Images',
        plugins: [
            new workbox.expiration.Plugin({
                maxAgeSeconds: 60 * 60 * 24 * 7,
                maxEntries: 50,
                purgeOnQuotaError: true
            })
        ]
    })
);

// 3. cache news articles result
workbox.routing.registerRoute(
    new RegExp('https://newsapi.org/v2/top-headlines'),
    workbox.strategies.staleWhileRevalidate({
        cacheName: 'My-awesome-cache-news-headline',
        cacheExpiration: {
            maxAgeSeconds: 60 * 30 //cache the news content for 30mn
        }
    })
);
  
workbox.precaching.precacheAndRoute([]);
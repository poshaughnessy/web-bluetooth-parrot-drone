'use strict';

console.log('Service worker startup');

const CACHE_NAME = 'webdrone-cache-v1';

self.addEventListener('install', event => {

  function onInstall () {
    return caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching pre-defined assets on installation');
        cache.addAll(
            [
              '/css/styles.css',
              '/js/drone.js',
              '/js/main.js',
              '/images/app-icon-48.png',
              '/images/app-icon-72.png',
              '/images/app-icon-96.png',
              '/images/app-icon-144.png',
              '/images/app-icon-168.png',
              '/images/app-icon-192.png'
            ]);
        }
      );
  }

  event.waitUntil(onInstall(event));
});

self.addEventListener('fetch', event => {

  // Clone so we can consume it more than once
  let fetchRequest = event.request.clone();

  // If we can fetch latest version, then do so
  return fetch(fetchRequest)
    .then(response => {

      if (!response || response.status >= 300 || response.type !== 'basic') {
        // Don't cache response if it's not within our domain or not 2xx status
        return response;
      }

      let responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(event.request, responseToCache);
          console.log('Cached response', responseToCache);
        });

      return response;
    })
    .catch(err => {

      console.log('Fetch failed, maybe we are offline, try cache', err);

      event.respondWith(
        caches.match(event.request)
          .then(response => {
              if (response) {
                console.log('Cache hit', event.request);
                return response;
              } else {
                // Offline 404
                console.log('Offline 404');
                return caches.match('offline.html');
              }
            }
          )
      );

    });

});

// Clear out old versions
self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) == -1) {
            return caches.delete(cacheName);
          }
        })
      )
    })
  );
});

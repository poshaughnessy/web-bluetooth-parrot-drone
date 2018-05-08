'use strict';

console.log('Service worker startup');

const CACHE_NAME = 'webdrone-cache-1_2';

self.addEventListener('install', event => {

  function onInstall () {
    return caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching required assets on installation');
        cache.addAll(
            [
              '/',
              '/index.html',
              '/css/styles.css',
              '/js/drone.v1.2.js',
              '/js/main.v1.2.js'
            ]);
        }
      );
  }

  event.waitUntil(onInstall(event));
});

self.addEventListener('fetch', event => {

  // If we can fetch latest version, then do so
  let responsePromise = fetch(event.request)
    .then(response => {

      if (!response || response.status >= 300 || response.type !== 'basic') {
        // Don't cache response if it's not within our domain or not 2xx status
        return response;
      }

      let responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(event.request, responseToCache);
          console.log('Cached this response', responseToCache);
        });

      return response;
    })
    .catch(err => {

      console.log('Fetch failed, maybe we are offline, try cache', err);

      return caches.match(event.request)
        .then(response => {
            if (response) {
              console.log('Cache hit', event.request);
              return response;
            } else {
              console.warn('Offline cache miss');
            }
          }
        );

    });

  event.respondWith(responsePromise);

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

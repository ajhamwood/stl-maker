var cacheName = "v1 3-1-2016";

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(cacheName)
      .then(function(cache) {
        return cache.addAll([
          "/",
          "index.html",
          "stl.js",
          "mclookup.js",
          "geom.js",
          "mcworker.js",
          "three.min.js",
          "filesaver.min.js",
          "stl.css"
        ]);
      }).then(function() { return self.skipWaiting() })
  )
});

self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request).catch(function (response) { return fetch(event.request) })
  )
});

self.addEventListener("activate", function(event) { event.waitUntil(self.clients.claim()) })
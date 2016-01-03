var cacheName = "v1.014 3-1-2016";

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
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
    }).then(function () { self.skipWaiting() })
  )
});

self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) return response;
        else return fetch(event.request)
      })
  )
});

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [cacheName];
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key, i) {
        if (cacheWhitelist.indexOf(key) === -1) return caches.delete(keyList[i]);
      }));
    }).then(function () { self.clients.claim() })
  )
})
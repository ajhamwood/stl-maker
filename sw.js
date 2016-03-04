var cacheName = "v1.108 4-3-2016";

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll([
        "/",
        "index.html",
        "js/stl.js",
        "js/mclookup.js",
        "js/geom.js",
        "js/mcworker.js",
        "vendor/three.min.js",
        "vendor/filesaver.min.js",
        "css/stl.css"
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

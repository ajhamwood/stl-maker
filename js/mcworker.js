self.importScripts("../vendor/three.min.js", "geom.js", "mclookup.js");

self.onmessage = function(evt) {
  var geom, req = self.indexedDB.open("stl", 1);
  req.onsuccess = function (e) {
    var db = this.result, tx = db.transaction("worker", "readwrite"), store = tx.objectStore("worker");
    store.openCursor().onsuccess = function (e) {
      var csr = e.target.result;
      var result = marcubes(csr.value, evt.data);
      geom = result[0];
      csr.value.count = result[1];
      csr.update(csr.value)
    }
    tx.oncomplete = function (e) {
      self.postMessage(geom, [geom]);
      close()
    }
  };
  req.onerror = close
}

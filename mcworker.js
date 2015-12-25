self.importScripts("three.min.js", "geom.js", "mclookup.js");

self.onmessage = function(evt) {
  var geom, req = self.indexedDB.open("stl", 1);
  req.onsuccess = function (e) {
    var db = this.result, tx = db.transaction("data", "readwrite"), store = tx.objectStore("data");
    store.openCursor().onsuccess = function (e) {
      var csr = e.target.result;
      var rfun = csr.value.rfun;
      if (rfun) var g = new Function("x, y, z", "return " + rfun);
      var result = marcubes(new Function("x, y, z", "return " + csr.value.fun), csr.value.r, csr.value.size, g, evt.data);
      geom = result[0];
      csr.value.count = result[1];
      csr.update(csr.value)
    }
    tx.oncomplete = function (e) {
      self.postMessage(geom, [geom]);
      close()
    }
  };
  req.onerror = function(e) {
    close()
  }
}
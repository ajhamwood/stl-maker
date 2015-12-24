importScripts("three.min.js", "geom.js", "mclookup.js");
renderer.render(scene, camera);

///ArrayBuff...///

onmessage = function(e) {
  var fun = e.data[0], d = [ e.data[1], e.data[2], e.data[3], e.data[4], e.data[5], e.data[6] ],
      size = e.data[7], rfun = e.data[8];
  var f = new Function("x, y, z", "return " + fun);
  if (rfun) var g = new Function("x, y, z", "return " + rfun);
  
  postMessage(JSON.stringify( marcubes(f, d, size, g) ));
  close()
}
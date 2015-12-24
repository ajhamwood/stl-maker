var view_angle = 45,
	aspect = width / height,
	near = 0.1,
	far = 10000;

var renderer = new THREE.WebGLRenderer({antialias: true});
var camera = new THREE.PerspectiveCamera(view_angle, aspect, near, far);
var scene = new THREE.Scene();
scene.add(camera);
camera.position.z = 120;
renderer.setSize(width, height);

var geom = {}, material;
function updateMaterial() { //#307462
  material = new THREE.MeshNormalMaterial();
  material.side = THREE.DoubleSide
}

var pointLight = new THREE.PointLight(0xffffff);
pointLight.position.x = 60;
pointLight.position.y = 50;
pointLight.position.z = 170;
scene.add(pointLight);

var sin = Math.sin, cos = Math.cos, tan = Math.tan, exp = Math.exp, pow = Math.pow, sqrt = Math.sqrt,
    abs = Math.abs, ln = Math.log, asin = Math.asin, acos = Math.acos, atan = Math.atan, pi = Math.PI;
/**
* @author alteredq / http://alteredqualia.com/
*
* Port of greggman's ThreeD version of marching cubes to Three.js
* http://webglsamples.googlecode.com/hg/blob/blob.html
*/
function marcubes(f, d, size, g) {
  var points = [], vals = [], i, j, k, x, y, z,
      vidx = 0, geom = new THREE.Geometry();
  d = [
    d[0], d[1] - d[0],
    d[2], d[3] - d[2],
    d[4], d[5] - d[4]
  ];
  for (k = 0; k < size; k++)
  for (j = 0; j < size; j++)
  for (i = 0; i < size; i++) {
    x = d[0] + d[1] * i / (size - 1);
    y = d[2] + d[3] * j / (size - 1);
    z = d[4] + d[5] * k / (size - 1);
    points.push(new THREE.Vector3(10*x, 10*y, 10*z));
    if (typeof g === "function") vals.push( Math.max(f(x, y, z), g(x, y, z)) );
    else vals.push( f(x, y, z) );
  }

  for(z = 0; z < size - 1; z++)
  for(y = 0; y < size - 1; y++)
  for(x = 0; x < size - 1; x++) {
    var p = x + size*y + size*size*z;
    var px = p + 1,
        py = p + size,
        pxy = py + 1,
        pz = p + size*size,
        pxz = px + size*size,
        pyz = py + size*size,
        pxyz = pxy + size*size;

    var val0 = vals[p],
        val1 = vals[px],
        val2 = vals[py],
        val3 = vals[pxy],
        val4 = vals[pz],
        val5 = vals[pxz],
        val6 = vals[pyz],
        val7 = vals[pxyz];

    var cubeidx = 0,
        isolvl = 0;

    if(val0 < isolvl) cubeidx |= 1;
    if(val1 < isolvl) cubeidx |= 2;
    if(val2 < isolvl) cubeidx |= 8;
    if(val3 < isolvl) cubeidx |= 4;
    if(val4 < isolvl) cubeidx |= 16;
    if(val5 < isolvl) cubeidx |= 32;
    if(val6 < isolvl) cubeidx |= 128;
    if(val7 < isolvl) cubeidx |= 64;

    var bits = THREE.edgeTable[cubeidx];
    if(bits === 0) continue;
    var m = 0.5, vlist = [];
    
    if (bits & 1) vlist[0] = points[p].clone().lerp(points[px], m = (isolvl - val0)/(val1 - val0));
    if (bits & 2) vlist[1] = points[px].clone().lerp(points[pxy], m = (isolvl - val1)/(val3 - val1));
    if (bits & 4) vlist[2] = points[py].clone().lerp(points[pxy], m = (isolvl - val2)/(val3 - val2));
    if (bits & 8) vlist[3] = points[p].clone().lerp(points[py], m = (isolvl - val0)/(val2 - val0));

    if (bits & 16) vlist[4] = points[pz].clone().lerp(points[pxz], m = (isolvl - val4)/(val5 - val4));
    if (bits & 32) vlist[5] = points[pxz].clone().lerp(points[pxyz], m = (isolvl - val5)/(val7 - val5));
    if (bits & 64) vlist[6] = points[pyz].clone().lerp(points[pxyz], m = (isolvl - val6)/(val7 - val6));
    if (bits & 128) vlist[7] = points[pz].clone().lerp(points[pyz], m = (isolvl - val4)/(val6 - val4));

    if (bits & 256) vlist[8] = points[p].clone().lerp(points[pz], m = (isolvl - val0)/(val4 - val0));
    if (bits & 512) vlist[9] = points[px].clone().lerp(points[pxz], m = (isolvl - val1)/(val5 - val1));
    if (bits & 1024) vlist[10] = points[pxy].clone().lerp(points[pxyz], m = (isolvl - val3)/(val7 - val3));
    if (bits & 2048) vlist[11] = points[py].clone().lerp(points[pyz], m = (isolvl - val2)/(val6 - val2));

    var i = 0;
    cubeidx *= 16;
    while (THREE.triTable[cubeidx + i] != -1) {
      var idx1 = THREE.triTable[cubeidx + i];
      var idx2 = THREE.triTable[cubeidx + i + 1];
      var idx3 = THREE.triTable[cubeidx + i + 2];

      geom.vertices.push(vlist[idx1].clone());
      geom.vertices.push(vlist[idx2].clone());
      geom.vertices.push(vlist[idx3].clone());
      geom.faces.push(new THREE.Face3(vidx, vidx+1, vidx+2));
      geom.faceVertexUvs[0].push([new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)]);

      vidx += 3;
      i += 3;
    }
  }
  geom.computeFaceNormals();
  return geom;
}
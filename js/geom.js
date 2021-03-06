//User functions
var sin = Math.sin, cos = Math.cos, tan = Math.tan, exp = Math.exp, pow = Math.pow, sqrt = Math.sqrt,
    abs = Math.abs, ln = Math.log, asin = Math.asin, acos = Math.acos, atan = Math.atan, pi = Math.PI;

/**
 * Based on plot_implicit function with the following notice:
 *
 * @author alteredq / http://alteredqualia.com/
 *
 * Port of greggman's ThreeD version of marching cubes to Three.js
 * http://webglsamples.googlecode.com/hg/blob/blob.html
 */
function marcubes(data, geom) {
  function lerp (u, v, alpha) {
    return [
      u[0] + ( v[0] - u[0] ) * alpha,
      u[1] + ( v[1] - u[1] ) * alpha,
      u[2] + ( v[2] - u[2] ) * alpha
    ]
  }
  var f = new Function("x, y, z", "return " + data.equation.split("=")[0]),
      r = data.range, size = parseInt(data.granularity), g, hasMask;
  if (hasMask = !!data.mask) g = new Function("x, y, z", "return " + data.mask.split("<")[0]);
  
  var inWorker;
  if (inWorker = typeof geom === "object") {
    var count = 0,
        vert = new Float32Array(geom);
  } else if (typeof geom === "undefined") {
    var geom = new THREE.Geometry(),
        vert = geom.vertices,
        face = geom.faces,
        uvs = geom.faceVertexUvs[0]
  }
  
  var prog = 0, tot = pow(size, 3), div = Math.floor(tot / 25), points = [], vals = [], i, j, k, x, y, z,
      xm = r[0], xr = r[1] - r[0], ym = r[2], yr = r[3] - r[2], zm = r[4], zr = r[5] - r[4];
  for (k = 0; k < size; k++)
  for (j = 0; j < size; j++) {
  for (i = 0; i < size; i++, prog++) {
    x = xm + xr * i / (size - 1);
    y = ym + yr * j / (size - 1);
    z = zm + zr * k / (size - 1);
    points.push([x, y, z]);
    if (hasMask) vals.push( Math.max(f(x, y, z), g(x, y, z)) );
    else vals.push( f(x, y, z) );
  }
  if (inWorker && prog % div < size) self.postMessage(prog / tot / 3)
  }

  prog = 0;
  tot = pow(size - 1, 3);
  div = Math.floor(tot / 25);
  for(z = 0; z < size - 1; z++)
  for(y = 0; y < size - 1; y++) {
  for(x = 0; x < size - 1; x++, prog++) {
    var p = x + size*y + size*size*z,
        px = p + 1,
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

    var cubeidx = 0, isolvl = 0;
    if(val0 < isolvl) cubeidx |= 1;
    if(val1 < isolvl) cubeidx |= 2;
    if(val2 < isolvl) cubeidx |= 8;
    if(val3 < isolvl) cubeidx |= 4;
    if(val4 < isolvl) cubeidx |= 16;
    if(val5 < isolvl) cubeidx |= 32;
    if(val6 < isolvl) cubeidx |= 128;
    if(val7 < isolvl) cubeidx |= 64;

    var bits = THREE.edgeTable[cubeidx], vlist = [];
    if (bits === 0) continue;
    if (bits & 1) vlist[0] = lerp(points[p], points[px], (isolvl - val0)/(val1 - val0));
    if (bits & 2) vlist[1] = lerp(points[px], points[pxy], (isolvl - val1)/(val3 - val1));
    if (bits & 4) vlist[2] = lerp(points[py], points[pxy], (isolvl - val2)/(val3 - val2));
    if (bits & 8) vlist[3] = lerp(points[p], points[py], (isolvl - val0)/(val2 - val0));
    if (bits & 16) vlist[4] = lerp(points[pz], points[pxz], (isolvl - val4)/(val5 - val4));
    if (bits & 32) vlist[5] = lerp(points[pxz], points[pxyz], (isolvl - val5)/(val7 - val5));
    if (bits & 64) vlist[6] = lerp(points[pyz], points[pxyz], (isolvl - val6)/(val7 - val6));
    if (bits & 128) vlist[7] = lerp(points[pz], points[pyz], (isolvl - val4)/(val6 - val4));
    if (bits & 256) vlist[8] = lerp(points[p], points[pz], (isolvl - val0)/(val4 - val0));
    if (bits & 512) vlist[9] = lerp(points[px], points[pxz], (isolvl - val1)/(val5 - val1));
    if (bits & 1024) vlist[10] = lerp(points[pxy], points[pxyz], (isolvl - val3)/(val7 - val3));
    if (bits & 2048) vlist[11] = lerp(points[py], points[pyz], (isolvl - val2)/(val6 - val2));
    
    var i = 0, vidx = 0;
    cubeidx <<= 4;
    while (THREE.triTable[cubeidx+i] != -1) {
      var v1 = vlist[ THREE.triTable[cubeidx+i] ],
          v2 = vlist[ THREE.triTable[cubeidx+i+1] ],
          v3 = vlist[ THREE.triTable[cubeidx+i+2] ];
      i += 3;
      if (inWorker) {
        vert[count] = v1[0];
        vert[count+1] = v1[1];
        vert[count+2] = v1[2];
        vert[count+3] = v2[0];
        vert[count+4] = v2[1];
        vert[count+5] = v2[2];
        vert[count+6] = v3[0];
        vert[count+7] = v3[1];
        vert[count+8] = v3[2];
        count += 9;
      } else {
        vert.push(new THREE.Vector3(v1[0], v1[1], v1[2]));
        vert.push(new THREE.Vector3(v2[0], v2[1], v2[2]));
        vert.push(new THREE.Vector3(v3[0], v3[1], v3[2]));
        face.push(new THREE.Face3(vidx, vidx+1, vidx+2));
        uvs.push([new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)]);
        vidx += 3
      }
    }
  }
  if (inWorker && prog % div < size) self.postMessage(1/3 + prog / tot / 3);
  }
  return inWorker ? [geom, count] : geom
}
///geom.js///
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
function updateMaterial() {
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

///stl.js///
var mouse_down = false,
    mouseX = 0,
    mouseXOnMouseDown = 0,
    mouseY = 0,
    mouseYOnMouseDown = 0,
    targetRotationX = 0,
    targetRotationOnMouseDownX = 0,
    targetRotationY = 0,
    targetRotationOnMouseDownY = 0,
    rotationSensitivity = .02,
    rotationDecay = .05,
    windowHalfX = window.innerWidth / 2,
    windowHalfY = window.innerHeight / 2;

container.appendChild(renderer.domElement);
renderer.domElement.id = "renderer";

updateMaterial();

var obj;
function create_object() {
  var objnew = new THREE.Mesh(geom, material);
  objnew.rotation.x = -Math.random();
  objnew.rotation.y = Math.random();
  objnew.rotation.z = Math.random();
  scene.add(objnew);
  if(obj) {
    objnew.rotation = obj.rotation;
    objnew.scale = obj.scale;
    scene.remove(obj);
  }
  obj = objnew;
}

function animate() {
  if(obj) {
    obj.rotation.y += (targetRotationX - obj.rotation.y) * rotationDecay;
    obj.rotation.x += (targetRotationY - obj.rotation.x) * rotationDecay;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

/*if (window.Worker) {
  var mcworker = new Worker("mcworker.js");
  mcworker.onmessage = function (e) {
    console.log(e.data);
    geom = JSON.parse(e.data);
    updateMaterial();
    create_object()
  }
}*/

/**
 * STLBinaryExporter:
 * @author kovacsv / http://kovacsv.hu/
 * @author mrdoob / http://mrdoob.com/
 * @author mudcube / http://mudcu.be/
 */
THREE.STLBinaryExporter = function () {};
THREE.STLBinaryExporter.prototype = {
  constructor: THREE.STLBinaryExporter,
  parse: function () {
    var vector = new THREE.Vector3();
    var normalMatrixWorld = new THREE.Matrix3();
    return function parse( scene ) {
      var triangles = 0;
      scene.traverse( function ( object ) {
        if ( ! ( object instanceof THREE.Mesh ) ) return;
        triangles += object.geometry.faces.length
      } );
      var offset = 80; // skip header
      var bufferLength = triangles * 2 + triangles * 3 * 4 * 4 + 80 + 4;
      var arrayBuffer = new ArrayBuffer( bufferLength );
      var output = new DataView( arrayBuffer );
      output.setUint32( offset, triangles, true ); offset += 4;
      scene.traverse( function ( object ) {
        if ( ! ( object instanceof THREE.Mesh ) ) return;
        if ( ! ( object.geometry instanceof THREE.Geometry ) ) return;
        var geometry = object.geometry;
        var matrixWorld = object.matrixWorld;
        var vertices = geometry.vertices;
        var faces = geometry.faces;
        normalMatrixWorld.getNormalMatrix( matrixWorld );
        for ( var i = 0, l = faces.length; i < l; i ++ ) {
          var face = faces[ i ];
          vector.copy( face.normal ).applyMatrix3( normalMatrixWorld ).normalize();
          output.setFloat32( offset, vector.x, true ); offset += 4; // normal
          output.setFloat32( offset, vector.y, true ); offset += 4;
          output.setFloat32( offset, vector.z, true ); offset += 4;
          var indices = [ face.a, face.b, face.c ];
          for ( var j = 0; j < 3; j ++ ) {
            vector.copy( vertices[ indices[ j ] ] ).applyMatrix4( matrixWorld );
            output.setFloat32( offset, vector.x, true ); offset += 4; // vertices
            output.setFloat32( offset, vector.y, true ); offset += 4;
            output.setFloat32( offset, vector.z, true ); offset += 4
          }
          output.setUint16( offset, 0, true ); offset += 2 // attribute byte count
        }
      } );
      return output
    }
  }()
};
function saveSTL( scene, name ){  
  var exporter = new THREE.STLBinaryExporter();
  var stlString = exporter.parse( scene );
  var blob = new Blob([stlString], {type: 'application/octet-binary'});
  saveAs(blob, name + '.stl');
}

function addEvents (obj) {
  for (var id in obj) for (var e in obj[id]) {
    var el = id ? $(id) : window, a = e.split(" "), b = a.length, c = 0;
    for (; c < b; c++) el.addEventListener(a[c], obj[id][e].bind(el), false)
  }
}
addEvents({
  "": {
    "DOMMouseScroll, onmousewheel, wheel": function (e) {
      var delta = 0;
      e = e || window.event;
      if (e.wheelDelta) {
        delta = e.wheelDelta / 120;
        if (window.opera) delta = -delta
      } else if (e.detail) delta = -e.detail / 3;
      if (delta) {
        if (delta < 0) {
          obj.scale.x *= 0.9;
          obj.scale.y *= 0.9;
          obj.scale.z *= 0.9;
        } else {
          obj.scale.x *= 10/9;
          obj.scale.y *= 10/9;
          obj.scale.z *= 10/9;
        }
      }
    },
    resize: function () {
      THREEx.WindowResize(renderer, camera);
      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;
    }
  },
  "#renderer": {
    mousedown: function (event) {
      event.preventDefault();
      mouseXOnMouseDown = event.clientX - windowHalfX;
      targetRotationOnMouseDownX = targetRotationX;
      mouseYOnMouseDown = event.clientY - windowHalfY;
      targetRotationOnMouseDownY = targetRotationY;
      mouse_down = true
    },
    mouseup: function (event) {
      event.preventDefault();
      mouse_down = false
    },
    mousemove: function (event) {
      event.preventDefault();
      if (mouse_down) {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
        targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * rotationSensitivity;
        targetRotationX = targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * rotationSensitivity
      }
    }
  },
  "#run": {
    click: function () {
      var equation = $("#equation").value,
          ls_equation = equation.split("="),
          fun = new Function("x, y, z", "return " + ls_equation[0]),
          range_fun, ls_range_equation;
      if ($("#range-eq").checked) {
        var range_equation = $("#range-equation").value,
            ls_range_equation = range_equation.split("<");
        range_fun = new Function("x, y, z", "return " + ls_range_equation[0]);
      }
      var r = [
        parseFloat($('#range_lx').value),
        parseFloat($('#range_ux').value),
        parseFloat($('#range_ly').value),
        parseFloat($('#range_uy').value),
        parseFloat($('#range_lz').value),
        parseFloat($('#range_uz').value)
      ];
      /*if (window.Worker) {
        mcworker.postMessage([ ls_equation[0], r[0], r[1], r[2], r[3], r[4], r[5], parseInt($("#size").value), ls_range_equation && ls_range_equation[0] ])
      } else {*/
        geom = marcubes(fun, r, parseInt($("#size").value), range_fun);
        updateMaterial();
        create_object()
      /*}*/
      return false
    }
  },
  "#save": {
    click: function () {
      var name = prompt("Choose filename");
      return saveSTL(scene, name)
    }
  },
  "#toggle": {
    click: function () {
      this.classList.toggle("plus");
      this.classList.toggle("minus");
      $("#navigation").classList.toggle("hide");
      $("#navigation").classList.toggle("show");
      return false;
    }
  }
});

$("#run").dispatchEvent(new Event("click"));

var THREEx = THREEx || {};
THREEx.WindowResize	= function (renderer, camera) {
  var callback	= function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", callback, false);
  return {
    stop: function () {
      window.removeEventListener("resize", callback);
    }
  };
};
THREEx.WindowResize(renderer, camera)
var view_angle = 45,
	aspect = width / height,
	near = 0.01,
	far = 1000;

var renderer = new THREE.WebGLRenderer({antialias: true});
var camera = new THREE.PerspectiveCamera(view_angle, aspect, near, far);
var scene = new THREE.Scene();
scene.add(camera);
renderer.setSize(width, height);

var geom = {}, material;
function updateMaterial() {
  material = new THREE.MeshNormalMaterial();
  material.side = THREE.DoubleSide
}

var pointLight = new THREE.PointLight(0xffffff);
pointLight.position.x = 6;
pointLight.position.y = 5;
pointLight.position.z = 17;
scene.add(pointLight);

///
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

var mcworker
if (window.Worker) {
  var req = indexedDB.open("stl", 1), db;
  req.onupgradeneeded = function (e) {
    db = e.target.result;
    var store = db.createObjectStore("data", { autoIncrement: true });
  }
  req.onsuccess = function (e) {
    db = e.target.result;
    $("#run").dispatchEvent(new Event("click"));
  }
}
function init_worker() {
  mcworker = new Worker("mcworker.js");
  mcworker.onmessage = function (e) {
    geom = new THREE.Geometry();
    var vert = new Float32Array(e.data);        
    var tx = db.transaction("data", "readwrite"), store = tx.objectStore("data");
    store.openCursor().onsuccess = function (e) {
      var csr = e.target.result, i = 0, c = 0;
      while (i < csr.value.count) {
        geom.vertices.push(
          new THREE.Vector3(vert[i++], vert[i++], vert[i++]),
          new THREE.Vector3(vert[i++], vert[i++], vert[i++]),
          new THREE.Vector3(vert[i++], vert[i++], vert[i++])
        );
        geom.faces.push(new THREE.Face3(c++, c++, c++));
        geom.faceVertexUvs[0].push([new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)])
      }
      store.clear();
    }
    tx.oncomplete = function (e) {
      geom.computeFaceNormals();
      updateMaterial();
      create_object()
    }
  }
}

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
      camera.position.z = 2*sqrt(Math.max(r[0]*r[0], r[1]*r[1]) + Math.max(r[2]*r[2], r[3]*r[3]) + Math.max(r[4]*r[4], r[5]*r[5]));
      if (window.Worker) {
        init_worker();
        var tx = db.transaction("data", "readwrite"), store = tx.objectStore("data");
        tx.oncomplete = function (e) {
          var buf = new ArrayBuffer(1024*1024*32), view = new Float32Array(buf);
          view[0] = pi;
          mcworker.postMessage(buf, [buf])
        }
        store.add({
          fun: ls_equation[0],
          r: r,
          size: parseInt($("#size").value),
          rfun: ls_range_equation ? ls_range_equation[0] : null
        })
      } else {
        geom = marcubes(fun, r, parseInt($("#size").value), range_fun);
        geom.computeFaceNormals();
        updateMaterial();
        create_object()
      }
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
function $ (sel, node, a) { return (a = [].slice.call( (node || document).querySelectorAll(sel) )).length > 1 ? a : a[0] }

var container = $("#container"),
    width = container.clientWidth,
    height = container.clientHeight;
var view_angle = 45,
	aspect = width / height,
	near = 0.01,
	far = 1000;

var renderer = new THREE.WebGLRenderer({antialias: true});
var camera = new THREE.PerspectiveCamera(view_angle, aspect, near, far);
var scene = new THREE.Scene();
scene.add(camera);
renderer.setSize(width, height);

var geom, material;
function updateMaterial() {
  material = new THREE.MeshNormalMaterial();
  material.side = THREE.DoubleSide
}

var pointLight = new THREE.PointLight(0xffffff);
pointLight.position.x = 6;
pointLight.position.y = 5;
pointLight.position.z = 17;
scene.add(pointLight);

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

function animate () {
  if(obj) {
    obj.rotation.y += (targetRotationX - obj.rotation.y) * rotationDecay;
    obj.rotation.x += (targetRotationY - obj.rotation.x) * rotationDecay;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

function getData (name) {
  var data = {
    equation: $("#equation").value,
    range: [
      parseFloat($("#range_lx").value),
      parseFloat($("#range_ux").value),
      parseFloat($("#range_ly").value),
      parseFloat($("#range_uy").value),
      parseFloat($("#range_lz").value),
      parseFloat($("#range_uz").value)
    ],
    mask: $("#mask-eq").checked ? $("#mask-equation").value : null,
    granularity: $("#granularity").value
  };
  if (typeof name !== "undefined") data.name = name;
  return data
}

var req = indexedDB.open("stl", 1), db;
req.onupgradeneeded = function (e) {
  db = e.target.result;
  db.createObjectStore("worker", { autoIncrement: true });
  var pstore = db.createObjectStore("presets", { autoIncrement: true });
  pstore.createIndex("name", "name", { unique: true })
}
req.onsuccess = function (e) {
  db = e.target.result;
  var tx = db.transaction("presets", "readwrite"), store = tx.objectStore("presets");
  store.openCursor().onsuccess = function (e) {
    function opt(n) {
      var o = $("#presets > optgroup:first-child").appendChild($("#new-preset").firstChild.cloneNode(false));
      return o.label = o.textContent = n
    }
    var csr = e.target.result;
    if (csr) {
      preset_stored[ opt(csr.value.name) ] = csr.value;
      delete preset_lib[csr.value.name];
      csr.continue()
    } else {
      for (k in preset_lib) {
        store.add(preset_lib[k]);
        preset_stored[ opt(preset_lib[k].name) ] = preset_lib[k];
        delete preset_stored[preset_lib[k].name].name;
        delete preset_lib[k]
      }
    }
  }
  tx.oncomplete = function (e) {
    $("#presets")[0].selected = true;
    $("#presets").dispatchEvent(new Event("change"));
    $("#run").dispatchEvent(new Event("click"))
  }
}

var mcworker
function init_worker() {
  mcworker = new Worker("mcworker.js");
  mcworker.onmessage = function (e) {
    geom = new THREE.Geometry();
    var vert = new Float32Array(e.data);
    var tx = db.transaction("worker", "readwrite"), store = tx.objectStore("worker");
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

var preset_prev = 0, preset_tmp = {}, preset_stored = {}, preset_lib = {
  "Kummer Quartic": {
    name: "Kummer Quartic",
    equation: "pow((x*x+y*y+z*z-1.7), 2)-(3*1.7-1)/(3-1.7)*(sqrt(2)*x-z+1)*(sqrt(2)*x+z-1)*(sqrt(2)*y-z-1)*(sqrt(2)*y+z+1)-.06=0",
    range: [-1.6,1.6,-1.6,1.6,-1.6,1.6],
    mask: "x*x+y*y+z*z-2.5<0",
    granularity: 40
  },
  "Cayley Cubic": {
    name: "Cayley Cubic",
    equation: "x*x+y*y+z*z-x*x*z+y*y*z-1.05=0",
    range: [-2.5,2.5,-2.5,2.5,-2.5,2.5],
    mask: "x*x+y*y+z*z-7<0",
    granularity: 40
  },
  "Barth Sextic": {
    name: "Barth Sextic",
    equation: "4*(x*x-z*z*(1.5+sqrt(5)/2))*(z*z-y*y*(1.5+sqrt(5)/2))*(y*y-x*x*(1.5+sqrt(5)/2))+(2+sqrt(5))*pow(x*x+y*y+z*z-1.008,2)-.05=0",
    range: [-2.1,2.1,-2.1,2.1,-2.1,2.1],
    mask: "x*x+y*y+z*z-4.4<0",
    granularity: 100
  },
  "Barth Decic": {
    name: "Barth Decic",
    equation: "8*(x*x-(3.5+1.5*sqrt(5))*y*y)*(y*y-(3.5+1.5*sqrt(5))*z*z)*(z*z-(3.5+1.5*sqrt(5))*x*x)*(x*x*x*x+y*y*y*y+z*z*z*z-2*x*x*y*y-2*x*x*z*z-2*y*y*z*z)+(5.5+2.5*sqrt(5))*pow(x*x+y*y+z*z-1.05,2)*pow(x*x+y*y+z*z-(1.5-.5*sqrt(5))-.02,2)-.005=0",
    range: [-2.5,2.5,-2.5,2.5,-2.5,2.5],
    mask: "x*x+y*y+z*z-5<0",
    granularity: 160
  }
};

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
      var data = getData(), r = data.range;
      camera.position.z = 2*sqrt(Math.max(r[0]*r[0], r[1]*r[1]) + Math.max(r[2]*r[2], r[3]*r[3]) + Math.max(r[4]*r[4], r[5]*r[5]));
      if (window.Worker) {
        init_worker();
        var tx = db.transaction("worker", "readwrite"), store = tx.objectStore("worker");
        tx.oncomplete = function (e) {
          var buf = new ArrayBuffer(1024*1024*32);
          mcworker.postMessage(buf, [buf])
        };
        store.add(data)
      } else {
        geom = marcubes(data);
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
  },
  "#presets": {
    change: function (e) {
      $("#preset-method").textContent = "Delete preset";
      if (e.target.selectedIndex === e.target.options.length - 1) {
        $("#preset-name").classList.toggle("hide");
        $("#preset-name").focus();
        preset = { equation: "", range: [-1, 1, -1, 1, -1, 1], mask: null, granularity: 40 };
        $("#mask-equation").value = "";
        $("#preset-method").textContent = "Save as preset"
      } else {
        var label = $("#presets")[preset_prev].label, preset;
        if (!(label in preset_tmp || label in preset_stored)) {
          preset_tmp[label] = getData(label);
        }
        if ($("#presets > optgroup:first-child").childNodes.length > e.target.selectedIndex) {
          preset = preset_stored[$("#presets").selectedOptions[0].label];
          preset_prev = e.target.selectedIndex
        } else {
          preset = preset_tmp[$("#presets").selectedOptions[0].label]
          preset_prev = e.target.selectedIndex
        }
      }
      $("#equation").value = preset.equation;
      $("#range_lx").value = preset.range[0];
      $("#range_ux").value = preset.range[1];
      $("#range_ly").value = preset.range[2];
      $("#range_uy").value = preset.range[3];
      $("#range_lz").value = preset.range[4];
      $("#range_uz").value = preset.range[5];
      $("#mask-eq").checked = !!preset.mask;
      $("#mask-equation").value = preset.mask;
      $("#granularity").value = preset.granularity
    }
  },
  "#preset-name": {
    blur: function (e) {
      if ($("#preset-name").value === "") {
        $("#presets")[preset_prev].selected = true;
        $("#presets").dispatchEvent(new Event("change"))
      } else {
        $("#presets > optgroup:last-child > option:last-child").label =
          $("#presets > optgroup:last-child > option:last-child").textContent = $("#preset-name").value;
        $("#presets > optgroup:last-child").appendChild($("#new-preset").firstChild.cloneNode(false));
        $("#preset-name").value = ""
        preset_prev = $("#presets").selectedIndex
      }
      $("#preset-name").classList.toggle("hide")
    },
    keyup: function (e) {
      if (e.keyCode === 27) this.blur(e)
    }
  },
  "#preset-method": {
    click: function (e) {
      var name = $("#presets").selectedOptions[0].label,
          tx = db.transaction("presets", "readwrite"), store = tx.objectStore("presets");
      if ($("#presets > optgroup:last-child > [label='" + name + "']")) {
        preset_stored[name] = getData(name);
        store.add(preset_stored[name]);
        $("#presets > optgroup:first-child").appendChild($("#presets").selectedOptions[0]);
        $("#preset-method").textContent = "Delete preset"
      } else {
        delete preset_stored[name];
        store.index("name").openCursor(IDBKeyRange.only(name)).onsuccess = function (e) {
          var csr = e.target.result;
          if (csr) store.delete(csr.primaryKey)
        };
        $("#presets").selectedOptions[0].parentNode.removeChild($("#presets").selectedOptions[0])
      }
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
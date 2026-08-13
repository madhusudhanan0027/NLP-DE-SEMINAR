/* ==========================================================================
   three-scene.js
   A floating "language network": glowing word-nodes connected by edges.
   On load the nodes drift as one loose cloud (continuous language).
   As the user scrolls toward the "Core Concept" section, the nodes
   pull apart into three distinct clusters — a literal, subject-grounded
   visualization of discourse segmentation, not a decorative sphere.
   ========================================================================== */
(function () {
  var canvas = document.getElementById('scene-canvas');
  if (!canvas) return;

  var supportsWebGL = (function () {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  })();

  if (!supportsWebGL || typeof THREE === 'undefined') {
    document.body.classList.add('no-webgl');
    return;
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 13);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var group = new THREE.Group();
  scene.add(group);

  // --- lighting ---
  var ambient = new THREE.AmbientLight(0x33415f, 1.1);
  scene.add(ambient);
  var key = new THREE.PointLight(0x4ce0e8, 2.2, 40);
  key.position.set(6, 4, 8);
  scene.add(key);
  var rim = new THREE.PointLight(0x9b6bff, 1.6, 40);
  rim.position.set(-6, -3, -6);
  scene.add(rim);

  // --- node graph data: 3 latent clusters of "words" ---
  var CLUSTER_COUNT = 3;
  var NODES_PER_CLUSTER = 10;
  var TOTAL_NODES = CLUSTER_COUNT * NODES_PER_CLUSTER;

  var clusterCenters = [
    new THREE.Vector3(-3.4, 1.4, 0),
    new THREE.Vector3(3.6, 0.2, -1),
    new THREE.Vector3(-0.6, -2.2, 1.2)
  ];
  var cloudCenter = new THREE.Vector3(0, 0, 0);

  var nodeMeta = [];
  var positions = new Float32Array(TOTAL_NODES * 3);

  for (var c = 0; c < CLUSTER_COUNT; c++) {
    for (var i = 0; i < NODES_PER_CLUSTER; i++) {
      var idx = c * NODES_PER_CLUSTER + i;
      var seedAngle = Math.random() * Math.PI * 2;
      var seedRadius = 2.6 + Math.random() * 2.4;
      var cloudPos = new THREE.Vector3(
        Math.cos(seedAngle) * seedRadius,
        (Math.random() - 0.5) * 4.2,
        Math.sin(seedAngle) * seedRadius
      );
      var localAngle = Math.random() * Math.PI * 2;
      var localRadius = 0.5 + Math.random() * 0.9;
      var clusterPos = clusterCenters[c].clone().add(new THREE.Vector3(
        Math.cos(localAngle) * localRadius,
        Math.sin(localAngle) * localRadius * 0.8,
        (Math.random() - 0.5) * 1.2
      ));
      nodeMeta.push({
        cloud: cloudPos,
        cluster: clusterPos,
        cluster_id: c,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4
      });
      positions[idx * 3] = cloudPos.x;
      positions[idx * 3 + 1] = cloudPos.y;
      positions[idx * 3 + 2] = cloudPos.z;
    }
  }

  // --- edges: connect nodes within the same cluster (sparse) ---
  var edgeGeometry = new THREE.BufferGeometry();
  var edgePositions = [];
  var edgePairs = [];
  for (var c2 = 0; c2 < CLUSTER_COUNT; c2++) {
    var base = c2 * NODES_PER_CLUSTER;
    for (var a = 0; a < NODES_PER_CLUSTER; a++) {
      var linksFrom = 1 + Math.floor(Math.random() * 2);
      for (var l = 0; l < linksFrom; l++) {
        var b = base + Math.floor(Math.random() * NODES_PER_CLUSTER);
        if (b !== base + a) edgePairs.push([base + a, b]);
      }
    }
  }
  // a few faint cross-cluster edges to represent the original connected discourse
  for (var x = 0; x < 5; x++) {
    edgePairs.push([Math.floor(Math.random() * TOTAL_NODES), Math.floor(Math.random() * TOTAL_NODES)]);
  }
  edgePairs.forEach(function () { edgePositions.push(0, 0, 0, 0, 0, 0); });
  edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
  var edgeMaterial = new THREE.LineBasicMaterial({ color: 0x4ce0e8, transparent: true, opacity: 0.18 });
  var edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  group.add(edgeLines);

  // --- node points (glowing sprites via PointsMaterial) ---
  var nodeGeometry = new THREE.BufferGeometry();
  nodeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  var nodeColors = new Float32Array(TOTAL_NODES * 3);
  var palette = [
    new THREE.Color(0x4ce0e8),
    new THREE.Color(0x9b6bff),
    new THREE.Color(0x7fe9c9)
  ];
  for (var n = 0; n < TOTAL_NODES; n++) {
    var col = palette[nodeMeta[n].cluster_id % palette.length];
    nodeColors[n * 3] = col.r;
    nodeColors[n * 3 + 1] = col.g;
    nodeColors[n * 3 + 2] = col.b;
  }
  nodeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(nodeColors, 3));

  var nodeMaterial = new THREE.PointsMaterial({
    size: 0.14,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
    depthWrite: false
  });
  var nodePoints = new THREE.Points(nodeGeometry, nodeMaterial);
  group.add(nodePoints);

  // --- ambient particle dust ---
  var DUST = 220;
  var dustGeo = new THREE.BufferGeometry();
  var dustPos = new Float32Array(DUST * 3);
  for (var d = 0; d < DUST; d++) {
    dustPos[d * 3] = (Math.random() - 0.5) * 26;
    dustPos[d * 3 + 1] = (Math.random() - 0.5) * 20;
    dustPos[d * 3 + 2] = (Math.random() - 0.5) * 18 - 4;
  }
  dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPos, 3));
  var dustMat = new THREE.PointsMaterial({ size: 0.035, color: 0x8792ac, transparent: true, opacity: 0.35, depthWrite: false });
  var dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // --- interaction state ---
  var mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
  var scrollProgress = 0; // 0 = cloud, 1 = fully clustered (segmented)

  window.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function updateScrollProgress() {
    var conceptEl = document.getElementById('concept');
    if (!conceptEl) return;
    var rect = conceptEl.getBoundingClientRect();
    var vh = window.innerHeight;
    // progress ramps from 0 (concept section below viewport) to 1 (concept section centered/above)
    var raw = 1 - (rect.top / vh);
    scrollProgress = Math.max(0, Math.min(1, raw));

    var heroRect = document.getElementById('hero') ? document.getElementById('hero').getBoundingClientRect() : null;
    var opacityFade = 1;
    if (heroRect) {
      var heroOut = Math.min(1, Math.max(0, -heroRect.top / vh));
      opacityFade = 1; // keep visible through page, just move
    }
    canvas.style.opacity = 1;
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  var clock = new THREE.Clock();
  var posAttr = nodeGeometry.getAttribute('position');
  var edgeAttr = edgeGeometry.getAttribute('position');

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    if (!reduceMotion) {
      targetRotY += (mouseX * 0.35 - targetRotY) * 0.03;
      targetRotX += (-mouseY * 0.2 - targetRotX) * 0.03;
      group.rotation.y = t * 0.045 + targetRotY;
      group.rotation.x = targetRotX * 0.5;
      dust.rotation.y = t * 0.01;
    }

    var ease = scrollProgress * scrollProgress * (3 - 2 * scrollProgress); // smoothstep
    for (var i = 0; i < TOTAL_NODES; i++) {
      var m = nodeMeta[i];
      var wob = reduceMotion ? 0 : Math.sin(t * m.speed + m.phase) * 0.06 * (1 - ease * 0.7);
      var x = THREE.MathUtils.lerp(m.cloud.x, m.cluster.x, ease) + wob;
      var y = THREE.MathUtils.lerp(m.cloud.y, m.cluster.y, ease) + wob * 0.8;
      var z = THREE.MathUtils.lerp(m.cloud.z, m.cluster.z, ease);
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;

    for (var e2 = 0; e2 < edgePairs.length; e2++) {
      var pa = edgePairs[e2][0], pb = edgePairs[e2][1];
      edgeAttr.setXYZ(e2 * 2, posAttr.getX(pa), posAttr.getY(pa), posAttr.getZ(pa));
      edgeAttr.setXYZ(e2 * 2 + 1, posAttr.getX(pb), posAttr.getY(pb), posAttr.getZ(pb));
    }
    edgeAttr.needsUpdate = true;
    edgeMaterial.opacity = 0.22 - ease * 0.1;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouseX * 0.6, 0.02);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, -mouseY * 0.4, 0.02);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();
})();

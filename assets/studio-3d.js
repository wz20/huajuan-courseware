/* huajuan-courseware Studio 3D Helper (cel-shaded hardware blocks, outlines, pulses, callout projection) */
window.Studio3D = (() => {
  function hasThree() {
    return typeof THREE !== 'undefined' && THREE.WebGLRenderer;
  }

  function createToonMesh(geometry, colorHex, opts = {}) {
    const {
      outline = true,
      outlineColor = 0x182026,
      outlineThreshold = 20,
      metalness = 0.08,
      roughness = 0.62,
      emissive = 0x000000,
      emissiveIntensity = 0,
      opacity = 1
    } = opts;

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness,
      roughness,
      emissive,
      emissiveIntensity,
      transparent: opacity < 1,
      opacity
    });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = opacity >= 0.9;
    mesh.receiveShadow = true;

    if (outline) {
      const edges = new THREE.EdgesGeometry(geometry, outlineThreshold);
      const lineMat = new THREE.LineBasicMaterial({ color: outlineColor, transparent: opacity < 1, opacity });
      const lines = new THREE.LineSegments(edges, lineMat);
      mesh.add(lines);
    }
    return mesh;
  }

  function createViewport(container, opts = {}) {
    const {
      cameraPos = [7.4, 6.2, 7.6],
      target = [0, 0.4, 0],
      fov = 38,
      onFallback = null,
      onSelectPart = null,
      showToolbar = true
    } = opts;

    if (!hasThree()) {
      onFallback?.('当前浏览器环境未启用 WebGL，已自动切换为二维原理图交互模式。');
      return null;
    }

    const canvasHost = document.createElement('div');
    canvasHost.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    container.prepend(canvasHost);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      canvasHost.remove();
      onFallback?.('WebGL 初始化受限，已切换为二维原理图模式（可正常完成全部交互与步骤）。');
      return null;
    }

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    canvasHost.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 120);

    // Balanced daylight studio rig matching warm-drafting / blueprint clarity
    const hemi = new THREE.HemisphereLight(0xfffdf8, 0x8f9aa6, 1.55);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xfff5e4, 1.65);
    keyLight.position.set(8, 13, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xcce2ff, 0.55);
    rimLight.position.set(-7, 6, -6);
    scene.add(rimLight);

    // Orbit state strictly isolated from domain model state
    const defaultTarget = new THREE.Vector3(...target);
    const defaultOffset = new THREE.Vector3(...cameraPos).sub(defaultTarget);
    const camState = {
      target: defaultTarget.clone(),
      spherical: new THREE.Spherical().setFromVector3(defaultOffset),
      defaultTarget,
      defaultSpherical: new THREE.Spherical().setFromVector3(defaultOffset),
      tween: null
    };

    function applyCamera() {
      const offset = new THREE.Vector3().setFromSpherical(camState.spherical);
      camera.position.copy(camState.target).add(offset);
      camera.lookAt(camState.target);
    }
    applyCamera();

    // Callout overlays
    const calloutSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    calloutSvg.setAttribute('class', 'st-callout-svg');
    const calloutHtml = document.createElement('div');
    calloutHtml.className = 'st-callout-layer';
    container.append(calloutSvg, calloutHtml);

    let calloutDefs = [];
    let activePartId = null;
    let showCallouts = true;

    function anchorCallouts(items) {
      calloutDefs = items || [];
      calloutHtml.replaceChildren();
      for (const item of calloutDefs) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'st-callout-pin';
        btn.dataset.partId = item.id;
        btn.innerHTML = `<span class="st-callout-dot" style="background:${item.color || '#0f766e'}"></span><span>${item.label}</span>`;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectPart?.(item.id);
        });
        calloutHtml.appendChild(btn);
        item._btn = btn;
      }
      renderOverlays();
    }

    function setActivePart(id) {
      activePartId = id;
      for (const item of calloutDefs) {
        if (item._btn) item._btn.classList.toggle('active', item.id === id);
      }
    }

    function setCalloutsVisible(visible) {
      showCallouts = !!visible;
      calloutSvg.style.display = showCallouts ? '' : 'none';
      calloutHtml.style.display = showCallouts ? '' : 'none';
    }

    function renderOverlays() {
      if (!showCallouts || !calloutDefs.length) return;
      const w = canvasHost.clientWidth || 800;
      const h = canvasHost.clientHeight || 480;
      calloutSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const lines = [];
      for (const item of calloutDefs) {
        const worldPos = item.object ? new THREE.Vector3().setFromMatrixPosition(item.object.matrixWorld) : new THREE.Vector3(...item.pos);
        if (item.offset) worldPos.add(new THREE.Vector3(...item.offset));
        const proj = worldPos.clone().project(camera);
        const visible = proj.z < 1 && proj.x > -1.05 && proj.x < 1.05 && proj.y > -1.05 && proj.y < 1.05;
        if (!item._btn) continue;
        item._btn.style.display = visible ? 'inline-flex' : 'none';
        if (!visible) continue;
        const sx = (proj.x * 0.5 + 0.5) * w;
        const sy = (-proj.y * 0.5 + 0.5) * h;
        const pinX = Math.max(66, Math.min(w - 66, sx + (item.dx || 0)));
        const pinY = Math.max(38, Math.min(h - 46, sy + (item.dy || -42)));
        item._btn.style.left = `${pinX}px`;
        item._btn.style.top = `${pinY}px`;
        const stroke = item.id === activePartId ? (item.color || '#0f766e') : 'rgba(107,101,92,0.55)';
        lines.push(`<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${pinX.toFixed(1)}" y2="${(pinY - 6).toFixed(1)}" stroke="${stroke}" stroke-width="${item.id === activePartId ? 2 : 1.3}" stroke-dasharray="4 3"/><circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="3.5" fill="${item.color || '#0f766e'}"/>`);
      }
      calloutSvg.innerHTML = lines.join('');
    }

    // Pulse beads along 3D paths
    const pulseGroup = new THREE.Group();
    scene.add(pulseGroup);
    let activePulses = [];

    function setSignalPulses(paths, { color = 0xf59e0b, speed = 1 } = {}) {
      for (const p of activePulses) {
        pulseGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      }
      activePulses = [];
      for (const def of paths || []) {
        const pts = (def.points || def).map(v => new THREE.Vector3(...v));
        if (pts.length < 2) continue;
        const curve = new THREE.CatmullRomCurve3(pts);
        const beadColor = def.color || color;
        const beadCount = def.count || 2;
        for (let i = 0; i < beadCount; i++) {
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(def.radius || 0.09, 12, 12),
            new THREE.MeshBasicMaterial({ color: beadColor })
          );
          pulseGroup.add(mesh);
          activePulses.push({ curve, mesh, offset: i / beadCount, speed: def.speed || speed });
        }
      }
    }

    // Raycasting + Drag Orbit
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const pickables = [];
    function registerPickable(obj, partId) {
      obj.userData._studioPartId = partId;
      pickables.push(obj);
    }

    let dragging = false;
    let movedDist = 0;
    let lastX = 0, lastY = 0;
    let isPan = false;

    const el = renderer.domElement;
    el.addEventListener('pointerdown', (e) => {
      dragging = true;
      movedDist = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      isPan = e.shiftKey || e.button === 1 || e.button === 2;
      el.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      movedDist += Math.hypot(dx, dy);
      camState.tween = null;
      if (isPan) {
        const panScale = camState.spherical.radius * 0.0014;
        const forward = new THREE.Vector3().subVectors(camState.target, camera.position).setY(0).normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        camState.target.addScaledVector(right, -dx * panScale);
        camState.target.addScaledVector(forward, dy * panScale);
      } else {
        camState.spherical.theta -= dx * 0.008;
        camState.spherical.phi = Math.max(0.24, Math.min(Math.PI / 2 - 0.04, camState.spherical.phi - dy * 0.007));
      }
      applyCamera();
    });
    el.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      if (movedDist < 5 && pickables.length && onSelectPart) {
        const rect = el.getBoundingClientRect();
        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);
        const hits = raycaster.intersectObjects(pickables, true);
        if (hits.length) {
          let cur = hits[0].object;
          while (cur && !cur.userData._studioPartId) cur = cur.parent;
          if (cur?.userData._studioPartId) onSelectPart(cur.userData._studioPartId);
        }
      }
    });
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      camState.tween = null;
      camState.spherical.radius = Math.max(3.8, Math.min(18, camState.spherical.radius * (1 + e.deltaY * 0.001)));
      applyCamera();
    }, { passive: false });

    function focusCamera(pos, tgt, duration = 420) {
      const endTarget = new THREE.Vector3(...tgt);
      const endSpherical = new THREE.Spherical().setFromVector3(new THREE.Vector3(...pos).sub(endTarget));
      camState.tween = {
        t0: performance.now(),
        duration,
        startTarget: camState.target.clone(),
        endTarget,
        startSph: camState.spherical.clone(),
        endSph: endSpherical
      };
    }

    function rotateBy(dTheta) {
      camState.tween = null;
      camState.spherical.theta += dTheta;
      applyCamera();
    }

    function zoomBy(factor) {
      camState.tween = null;
      camState.spherical.radius = Math.max(3.8, Math.min(18, camState.spherical.radius * factor));
      applyCamera();
    }

    function resetView() {
      const endPos = camState.defaultTarget.clone().add(new THREE.Vector3().setFromSpherical(camState.defaultSpherical));
      focusCamera([endPos.x, endPos.y, endPos.z], [camState.defaultTarget.x, camState.defaultTarget.y, camState.defaultTarget.z], 350);
    }

    function topView() {
      focusCamera([camState.defaultTarget.x, camState.defaultTarget.y + 10.5, camState.defaultTarget.z + 0.8], [camState.defaultTarget.x, camState.defaultTarget.y, camState.defaultTarget.z], 350);
    }

    // Bottom camera toolbar (never mutates experimental model)
    if (showToolbar) {
      const bar = document.createElement('div');
      bar.className = 'st-camera-bar';
      bar.innerHTML = `
        <button type="button" class="st-cam-btn" data-cam="rotL" title="左转 (Q)">↺</button>
        <button type="button" class="st-cam-btn" data-cam="rotR" title="右转 (E)">↻</button>
        <button type="button" class="st-cam-btn" data-cam="zoomOut" title="缩小">−</button>
        <button type="button" class="st-cam-btn" data-cam="zoomIn" title="放大">+</button>
        <button type="button" class="st-cam-btn" data-cam="top" title="俯视图">俯视</button>
        <button type="button" class="st-cam-btn" data-cam="pins" aria-pressed="true" title="开关标注">标注</button>
        <button type="button" class="st-cam-btn" data-cam="reset" title="复位视角">复位</button>
      `;
      bar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-cam]');
        if (!btn) return;
        const act = btn.dataset.cam;
        if (act === 'rotL') rotateBy(0.35);
        else if (act === 'rotR') rotateBy(-0.35);
        else if (act === 'zoomIn') zoomBy(0.84);
        else if (act === 'zoomOut') zoomBy(1.18);
        else if (act === 'top') topView();
        else if (act === 'reset') resetView();
        else if (act === 'pins') {
          setCalloutsVisible(!showCallouts);
          btn.setAttribute('aria-pressed', String(showCallouts));
        }
      });
      container.appendChild(bar);
    }

    function resize() {
      const w = canvasHost.clientWidth || 640;
      const h = canvasHost.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvasHost);
    resize();

    let rafId = 0;
    let disposed = false;
    function tick(now) {
      if (disposed) return;
      if (camState.tween) {
        const tw = camState.tween;
        const p = Math.min(1, (now - tw.t0) / tw.duration);
        const k = 1 - Math.pow(1 - p, 3);
        camState.target.lerpVectors(tw.startTarget, tw.endTarget, k);
        camState.spherical.radius = THREE.MathUtils.lerp(tw.startSph.radius, tw.endSph.radius, k);
        camState.spherical.phi = THREE.MathUtils.lerp(tw.startSph.phi, tw.endSph.phi, k);
        // Shortest angular lerp for theta
        let dTheta = tw.endSph.theta - tw.startSph.theta;
        while (dTheta > Math.PI) dTheta -= Math.PI * 2;
        while (dTheta < -Math.PI) dTheta += Math.PI * 2;
        camState.spherical.theta = tw.startSph.theta + dTheta * k;
        applyCamera();
        if (p >= 1) camState.tween = null;
      }
      const tSec = now * 0.001;
      for (const p of activePulses) {
        const u = (tSec * p.speed + p.offset) % 1;
        p.curve.getPointAt(u, p.mesh.position);
      }
      renderer.render(scene, camera);
      renderOverlays();
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return {
      scene,
      camera,
      renderer,
      createToonMesh,
      registerPickable,
      anchorCallouts,
      setActivePart,
      setCalloutsVisible,
      setSignalPulses,
      focusCamera,
      rotateBy,
      zoomBy,
      topView,
      resetView,
      dispose() {
        disposed = true;
        cancelAnimationFrame(rafId);
        ro?.disconnect();
        renderer.dispose();
      }
    };
  }

  return { hasThree, createToonMesh, createViewport };
})();

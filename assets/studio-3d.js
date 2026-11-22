/* huajuan-courseware Studio 3D Engine v2.5
 * Universal Technical Illustration 3D Toolkit:
 * 1. Double-layer ink rendering (Inverted-Hull outer silhouette + EdgesGeometry inner creases + soft contact shadow)
 * 2. Procedural high-DPI CanvasTexture generators (silkscreen label plates, silicon/PCB/ruler micro-grids, live 3D readouts)
 * 3. Universal geometric primitives (chamferBox, extrudePolygon, curvedTube, tracePath, pinRow)
 * 4. Cross-disciplinary high-detail 3D prefabs (circuitBoard, socketFrame, icPackage, aluUnit, registerBank, sramMatrix,
 *    dimmStick, steppedCover, passiveComponent, scientificProp)
 */
window.Studio3D = (() => {
  function hasThree() {
    return typeof THREE !== 'undefined' && !!THREE.WebGLRenderer;
  }

  // ==================== 1. PROCEDURAL CANVAS TEXTURES ====================
  function makeCanvas(w, h) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    return { canvas: c, ctx };
  }

  function wrapCanvasTexture(canvas) {
    if (!canvas || typeof THREE === 'undefined') return null;
    const tex = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }

  const textures = {
    /**
     * High-DPI silkscreen / laser-etched top label plate texture
     */
    labelPlate(opts = {}) {
      const {
        width = 512,
        height = 320,
        bg = '#1e293b',
        fg = '#f8fafc',
        accent = '#fbbf24',
        border = 'rgba(255,255,255,0.32)',
        title = '',
        subtitle = '',
        tag = '',
        footer = '',
        pin1 = false,
        grid = true,
        gridStyle = 'fine',
        lines = []
      } = opts;
      const c = makeCanvas(width, height);
      if (!c) return null;
      const { canvas, ctx } = c;

      // Base fill
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Subtle micro-grid or circuit background pattern
      if (grid) {
        ctx.strokeStyle = gridStyle === 'silicon' ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.065)';
        ctx.lineWidth = 1;
        const step = gridStyle === 'silicon' ? 24 : 32;
        for (let x = step; x < width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = step; y < height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Outer technical border frame
      if (border) {
        ctx.strokeStyle = border;
        ctx.lineWidth = 4;
        ctx.strokeRect(14, 14, width - 28, height - 28);

        // Corner calibration ticks
        ctx.fillStyle = accent;
        const m = 22, len = 18;
        ctx.fillRect(14, 14, len, 5);
        ctx.fillRect(14, 14, 5, len);
        ctx.fillRect(width - 14 - len, 14, len, 5);
        ctx.fillRect(width - 19, 14, 5, len);
        ctx.fillRect(14, height - 19, len, 5);
        ctx.fillRect(14, height - 14 - len, 5, len);
        ctx.fillRect(width - 14 - len, height - 19, len, 5);
        ctx.fillRect(width - 19, height - 14 - len, 5, len);
        void m;
      }

      // Optional Pin-1 gold orientation triangle at bottom-left
      if (pin1) {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(28, height - 28);
        ctx.lineTo(56, height - 28);
        ctx.lineTo(28, height - 56);
        ctx.closePath();
        ctx.fill();
      }

      // Top tag pill
      if (tag) {
        ctx.font = '800 22px "SF Mono", "JetBrains Mono", monospace';
        const tw = ctx.measureText(tag).width + 28;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(width - tw - 28, 28, tw, 36, 8) : ctx.rect(width - tw - 28, 28, tw, 36);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tag, width - tw / 2 - 28, 47);
      }

      // Main Title
      if (title) {
        ctx.fillStyle = fg;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '900 44px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
        ctx.fillText(title, 34, 34);
      }

      // Subtitle
      if (subtitle) {
        ctx.fillStyle = accent;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '700 25px "SF Mono", "JetBrains Mono", monospace';
        ctx.fillText(subtitle, 36, title ? 92 : 42);
      }

      // Body telemetry / specification lines
      if (lines && lines.length) {
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.88;
        ctx.font = '600 23px "SF Mono", "JetBrains Mono", monospace';
        lines.forEach((ln, idx) => {
          ctx.fillText(ln, 36, 138 + idx * 34);
        });
        ctx.globalAlpha = 1;
      }

      // Bottom footer bar
      if (footer) {
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.font = '700 20px "SF Mono", "JetBrains Mono", monospace';
        ctx.fillText(footer, width - 32, height - 26);
      }

      return wrapCanvasTexture(canvas);
    },

    /**
     * Procedural surface micro-grid (silicon wafer, PCB traces, breadboard, ruler, contour)
     */
    microGrid(opts = {}) {
      const {
        size = 512,
        bg = '#18181b',
        majorColor = 'rgba(255,255,255,0.22)',
        minorColor = 'rgba(255,255,255,0.08)',
        accentColor = '#f59e0b',
        majorDiv = 4,
        minorDiv = 16,
        style = 'silicon'
      } = opts;
      const c = makeCanvas(size, size);
      if (!c) return null;
      const { canvas, ctx } = c;

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);

      const minorStep = size / minorDiv;
      ctx.strokeStyle = minorColor;
      ctx.lineWidth = 1.2;
      for (let i = 1; i < minorDiv; i++) {
        const p = i * minorStep;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, size);
        ctx.moveTo(0, p);
        ctx.lineTo(size, p);
        ctx.stroke();
      }

      const majorStep = size / majorDiv;
      ctx.strokeStyle = majorColor;
      ctx.lineWidth = 2.4;
      for (let i = 0; i <= majorDiv; i++) {
        const p = i * majorStep;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, size);
        ctx.moveTo(0, p);
        ctx.lineTo(size, p);
        ctx.stroke();
      }

      if (style === 'silicon') {
        // Metallic micro-pads at major intersections
        ctx.fillStyle = accentColor;
        for (let r = 0; r < majorDiv; r++) {
          for (let col = 0; col < majorDiv; col++) {
            const x = col * majorStep + 10;
            const y = r * majorStep + 10;
            ctx.strokeStyle = accentColor;
            ctx.globalAlpha = 0.35;
            ctx.strokeRect(x, y, majorStep - 20, majorStep - 20);
            ctx.globalAlpha = 0.85;
            ctx.fillRect(x + 4, y + 4, 10, 10);
          }
        }
        ctx.globalAlpha = 1;
      } else if (style === 'pcb') {
        // Diagonal PCB trace lines and gold via rings
        ctx.strokeStyle = 'rgba(217, 164, 65, 0.25)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          const y = 48 + i * 76;
          ctx.beginPath();
          ctx.moveTo(24, y);
          ctx.lineTo(size * 0.45, y);
          ctx.lineTo(size * 0.58, y + 36);
          ctx.lineTo(size - 24, y + 36);
          ctx.stroke();
        }
      } else if (style === 'ruler') {
        ctx.fillStyle = majorColor;
        for (let i = 0; i <= 40; i++) {
          const x = (i / 40) * size;
          const h = i % 10 === 0 ? 28 : i % 5 === 0 ? 18 : 10;
          ctx.fillRect(x - 1, 0, 2, h);
          ctx.fillRect(x - 1, size - h, 2, h);
        }
      }

      return wrapCanvasTexture(canvas);
    },

    /**
     * Live updatable 3D surface display texture (for register cells, OLED monitors, meters)
     */
    dynamicReadout(opts = {}) {
      const width = opts.width || 256;
      const height = opts.height || 160;
      const c = makeCanvas(width, height);
      if (!c) {
        return { texture: null, canvas: null, update() {} };
      }
      const { canvas, ctx } = c;
      const texture = wrapCanvasTexture(canvas);

      function update(state = {}) {
        const bg = state.bg || opts.bg || '#14261c';
        const fg = state.fg || opts.fg || '#f8fafc';
        const accent = state.accent || opts.accent || '#4ade80';
        const active = !!state.active;
        const title = state.title ?? opts.title ?? '';
        const value = state.value ?? opts.value ?? '';
        const sub = state.sub ?? opts.sub ?? '';

        ctx.fillStyle = active ? (state.activeBg || '#064e3b') : bg;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = active ? accent : 'rgba(255,255,255,0.28)';
        ctx.lineWidth = active ? 8 : 4;
        ctx.strokeRect(6, 6, width - 12, height - 12);

        // Status indicator bar at top
        ctx.fillStyle = active ? accent : 'rgba(255,255,255,0.22)';
        ctx.fillRect(16, 16, width - 32, 10);

        ctx.fillStyle = accent;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '900 32px "SF Mono", "JetBrains Mono", monospace';
        ctx.fillText(String(title), 18, 34);

        ctx.fillStyle = fg;
        ctx.textAlign = 'right';
        ctx.font = '900 42px "SF Mono", "JetBrains Mono", monospace';
        ctx.fillText(String(value), width - 18, 72);

        if (sub) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.textAlign = 'left';
          ctx.font = '700 20px "SF Mono", "JetBrains Mono", monospace';
          ctx.fillText(String(sub), 18, height - 34);
        }
        if (texture) texture.needsUpdate = true;
      }

      update(opts);
      return { texture, canvas, update };
    }
  };

  // ==================== 2. DOUBLE-OUTLINED TOON MESH & GROUP HELPERS ====================
  function addSilhouetteHull(mesh, geometry, outlineColor, thickness, opacity) {
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox;
    if (!bb) return null;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bb.getSize(size);
    bb.getCenter(center);

    const sx = 1 + (2 * thickness) / Math.max(0.07, size.x);
    const sy = 1 + (2 * thickness) / Math.max(0.07, size.y);
    const sz = 1 + (2 * thickness) / Math.max(0.07, size.z);

    const hullMat = new THREE.MeshBasicMaterial({
      color: outlineColor,
      side: THREE.BackSide,
      transparent: opacity < 1,
      opacity: opacity < 0.85 ? 0 : opacity,
      depthWrite: opacity >= 0.85
    });
    const hull = new THREE.Mesh(geometry, hullMat);
    hull.scale.set(sx, sy, sz);
    hull.position.set(-center.x * (sx - 1), -center.y * (sy - 1), -center.z * (sz - 1));
    hull.castShadow = false;
    hull.receiveShadow = false;
    hull.userData._isSilhouetteHull = true;
    mesh.add(hull);
    return hull;
  }

  function attachTopPlate(target, texture, w, d, topY, opacity = 1) {
    if (!texture) return null;
    const plateGeo = new THREE.PlaneGeometry(w, d);
    const plateMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.52,
      metalness: 0.08,
      transparent: true,
      opacity,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.rotation.x = -Math.PI / 2;
    plate.position.y = topY + 0.004;
    plate.castShadow = false;
    plate.receiveShadow = true;
    plate.userData._isTopPlate = true;
    target.add(plate);
    return plate;
  }

  function createToonMesh(geometry, colorHex, opts = {}) {
    const {
      outline = true,
      silhouette = true,
      silhouetteThickness = 0.02,
      outlineColor = 0x182026,
      outlineThreshold = 20,
      metalness = 0.1,
      roughness = 0.58,
      emissive = 0x000000,
      emissiveIntensity = 0,
      opacity = 1,
      topTexture = null,
      topSize = null,
      isAccent = false
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
    mesh.castShadow = opacity >= 0.85;
    mesh.receiveShadow = true;
    mesh.userData._baseHex = colorHex;
    mesh.userData._isPrimaryToon = !isAccent;

    let lines = null;
    if (outline) {
      const edges = new THREE.EdgesGeometry(geometry, outlineThreshold);
      const lineMat = new THREE.LineBasicMaterial({
        color: outlineColor,
        transparent: opacity < 1,
        opacity: Math.min(1, opacity * 1.1)
      });
      lines = new THREE.LineSegments(edges, lineMat);
      lines.userData._isEdgeLine = true;
      mesh.add(lines);
    }

    let hull = null;
    if (silhouette) {
      hull = addSilhouetteHull(mesh, geometry, outlineColor, silhouetteThickness, opacity);
    }

    let plate = null;
    if (topTexture) {
      geometry.computeBoundingBox();
      const bb = geometry.boundingBox;
      const sx = topSize ? topSize[0] : (bb ? (bb.max.x - bb.min.x) * 0.92 : 1);
      const sz = topSize ? topSize[1] : (bb ? (bb.max.z - bb.min.z) * 0.92 : 1);
      const topY = bb ? bb.max.y : 0.1;
      plate = attachTopPlate(mesh, topTexture, sx, sz, topY, opacity);
    }

    mesh.userData.setOpacity = (nextOp) => {
      mat.transparent = nextOp < 1;
      mat.opacity = nextOp;
      mesh.castShadow = nextOp >= 0.85;
      if (lines) {
        lines.material.transparent = nextOp < 1;
        lines.material.opacity = Math.min(1, nextOp * 1.1);
      }
      if (hull) {
        hull.visible = nextOp >= 0.85;
        hull.material.opacity = nextOp;
      }
      if (plate) {
        plate.material.opacity = nextOp;
      }
    };

    return mesh;
  }

  function setGroupHighlight(root, isHot, opts = {}) {
    if (!root) return;
    const intensity = opts.intensity ?? 0.36;
    const scale = opts.scale ?? 1.045;
    if (opts.animateScale !== false && root.scale) {
      root.scale.setScalar(isHot ? scale : 1.0);
    }
    root.traverse?.((obj) => {
      if (obj.isMesh && obj.userData?._isPrimaryToon && obj.material?.emissive) {
        const hex = opts.colorHex ?? obj.userData._baseHex ?? 0x000000;
        obj.material.emissive.setHex(isHot ? hex : 0x000000);
        obj.material.emissiveIntensity = isHot ? intensity : 0;
      }
    });
  }

  function setGroupOpacity(root, opacity) {
    if (!root) return;
    if (typeof root.userData?.setOpacity === 'function') {
      root.userData.setOpacity(opacity);
    }
    root.traverse?.((obj) => {
      if (obj !== root && typeof obj.userData?.setOpacity === 'function') {
        obj.userData.setOpacity(opacity);
      }
    });
  }

  // ==================== 3. UNIVERSAL GEOMETRIC PRIMITIVES ====================
  const primitives = {
    /**
     * Chamfered / octagonal 3D block centered at (0,0,0) with size (w, h, d)
     */
    chamferBox(w, h, d, opts = {}) {
      const chamfer = Math.min(opts.chamfer ?? 0.08, Math.min(w, d) * 0.28);
      const hw = w / 2, hd = d / 2;
      const pts = [
        [-hw + chamfer, -hd],
        [hw - chamfer, -hd],
        [hw, -hd + chamfer],
        [hw, hd - chamfer],
        [hw - chamfer, hd],
        [-hw + chamfer, hd],
        [-hw, hd - chamfer],
        [-hw, -hd + chamfer]
      ];
      return primitives.extrudePolygon(pts, h, {
        ...opts,
        topSize: opts.topSize || [w - chamfer * 1.4, d - chamfer * 1.4]
      });
    },

    /**
     * Extrude an arbitrary 2D XZ polygon [[x, z], ...] vertically along Y to height h (centered at Y=0)
     */
    extrudePolygon(pointsXZ, h, opts = {}) {
      const shape = new THREE.Shape();
      pointsXZ.forEach(([x, z], i) => {
        // Notice: When rotating X by +PI/2, shape's (x, y) maps to (x, y_shape -> +z_world) if we map (x, -z) or rotate -PI/2
        if (i === 0) shape.moveTo(x, -z);
        else shape.lineTo(x, -z);
      });
      shape.closePath();

      const bevel = opts.bevel ?? 0.018;
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: Math.max(0.01, h - bevel * 2),
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 2,
        curveSegments: 8
      });
      geo.rotateX(-Math.PI / 2);
      geo.computeBoundingBox();
      const bb = geo.boundingBox;
      if (bb) {
        const cy = (bb.max.y + bb.min.y) / 2;
        geo.translate(0, -cy, 0);
      }

      const topTex = opts.topTexture || (opts.label ? textures.labelPlate(opts.label) : null);
      return createToonMesh(geo, opts.color ?? 0x64748b, {
        ...opts,
        topTexture: topTex
      });
    },

    /**
     * Smooth 3D curved tube / jumper wire / conduit along [[x,y,z], ...]
     */
    curvedTube(points3D, opts = {}) {
      const radius = opts.radius ?? 0.042;
      const color = opts.color ?? 0xe8692b;
      const pts = points3D.map(p => new THREE.Vector3(...p));
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(curve, opts.tubularSegments ?? 28, radius, opts.radialSegments ?? 10, false);

      const grp = new THREE.Group();
      const tube = createToonMesh(geo, color, {
        outline: false,
        silhouette: opts.silhouette !== false,
        silhouetteThickness: opts.silhouetteThickness ?? 0.016,
        outlineColor: opts.outlineColor ?? 0x182026,
        roughness: 0.42,
        metalness: 0.15,
        isAccent: opts.isAccent ?? false
      });
      grp.add(tube);

      if (opts.caps !== false && pts.length >= 2) {
        const capGeo = new THREE.CylinderGeometry(radius * 1.38, radius * 1.38, radius * 2.4, 10);
        const cStart = createToonMesh(capGeo, opts.capColor ?? 0x1e293b, { silhouetteThickness: 0.012, isAccent: true });
        cStart.position.copy(pts[0]);
        const cEnd = createToonMesh(capGeo, opts.capColor ?? 0x1e293b, { silhouetteThickness: 0.012, isAccent: true });
        cEnd.position.copy(pts[pts.length - 1]);
        grp.add(cStart, cEnd);
      }
      return grp;
    },

    /**
     * Raised 3D PCB copper trace / bus path along XZ waypoints [[x,z], ...] with metallic via rings
     */
    tracePath(pointsXZ, opts = {}) {
      const y = opts.y ?? 0.025;
      const width = opts.width ?? 0.065;
      const height = opts.height ?? 0.022;
      const color = opts.color ?? 0xd9a441;
      const vias = opts.vias !== false;

      const grp = new THREE.Group();
      for (let i = 1; i < pointsXZ.length; i++) {
        const [x0, z0] = pointsXZ[i - 1];
        const [x1, z1] = pointsXZ[i];
        const dx = x1 - x0, dz = z1 - z0;
        const len = Math.hypot(dx, dz);
        if (len < 0.001) continue;
        const seg = createToonMesh(new THREE.BoxGeometry(len + width * 0.4, height, width), color, {
          outline: false,
          silhouette: false,
          metalness: 0.55,
          roughness: 0.32,
          isAccent: true
        });
        seg.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
        seg.rotation.y = -Math.atan2(dz, dx);
        grp.add(seg);
      }

      if (vias && pointsXZ.length >= 2) {
        const viaGeo = new THREE.CylinderGeometry(width * 0.9, width * 0.9, height * 1.35, 12);
        const holeGeo = new THREE.CylinderGeometry(width * 0.36, width * 0.36, height * 1.5, 10);
        for (const [vx, vz] of [pointsXZ[0], pointsXZ[pointsXZ.length - 1]]) {
          const pad = createToonMesh(viaGeo, 0xfbbf24, { outline: false, silhouette: false, metalness: 0.65, roughness: 0.25, isAccent: true });
          pad.position.set(vx, y, vz);
          const hole = new THREE.Mesh(holeGeo, new THREE.MeshBasicMaterial({ color: 0x0f172a }));
          hole.position.set(vx, y + 0.002, vz);
          grp.add(pad, hole);
        }
      }
      return grp;
    },

    /**
     * Row of metallic IC leads (gullwing SMD leads, DIP pins, or gold contact pads)
     */
    pinRow(opts = {}) {
      const {
        count = 6,
        pitch = 0.16,
        length = 0.15,
        height = 0.12,
        thickness = 0.045,
        color = 0xdbe4ee,
        style = 'gullwing'
      } = opts;
      const grp = new THREE.Group();
      const span = (count - 1) * pitch;

      for (let i = 0; i < count; i++) {
        const offset = -span / 2 + i * pitch;
        if (style === 'gullwing') {
          const leg = new THREE.Group();
          const upper = createToonMesh(new THREE.BoxGeometry(length * 0.55, thickness * 0.7, thickness), color, {
            outline: false,
            silhouette: false,
            metalness: 0.65,
            roughness: 0.28,
            isAccent: true
          });
          upper.position.set(-length * 0.25, height * 0.45, 0);
          const vertical = createToonMesh(new THREE.BoxGeometry(thickness * 0.7, height * 0.65, thickness), color, {
            outline: false,
            silhouette: false,
            metalness: 0.65,
            roughness: 0.28,
            isAccent: true
          });
          vertical.position.set(-length * 0.5, height * 0.15, 0);
          const foot = createToonMesh(new THREE.BoxGeometry(length * 0.6, thickness * 0.7, thickness * 1.1), color, {
            outline: false,
            silhouette: false,
            metalness: 0.65,
            roughness: 0.28,
            isAccent: true
          });
          foot.position.set(-length * 0.72, -height * 0.15, 0);
          leg.add(upper, vertical, foot);
          leg.position.z = offset;
          grp.add(leg);
        } else {
          const pad = createToonMesh(new THREE.BoxGeometry(length, thickness * 0.7, thickness * 1.25), 0xeab308, {
            outline: false,
            silhouette: false,
            metalness: 0.6,
            roughness: 0.3,
            isAccent: true
          });
          pad.position.z = offset;
          grp.add(pad);
        }
      }
      return grp;
    }
  };

  // ==================== 4. CROSS-DISCIPLINARY 3D PREFAB KIT ====================
  const prefabs = {
    /**
     * Precision PCB / Package Substrate with chamfered corners, mounting holes, gold pad ring & silkscreen
     */
    circuitBoard(opts = {}) {
      const {
        w = 4.3,
        h = 0.18,
        d = 3.4,
        color = 0x165b3c,
        rimColor = 0xc79238,
        chamfer = 0.18,
        mountingHoles = true,
        goldPadRing = true,
        pin1 = true,
        title = '',
        subtitle = ''
      } = opts;
      const grp = new THREE.Group();

      const pcbTex = textures.microGrid({
        bg: '#145337',
        majorColor: 'rgba(255,255,255,0.12)',
        minorColor: 'rgba(255,255,255,0.04)',
        style: 'pcb'
      });

      const board = primitives.chamferBox(w, h, d, {
        chamfer,
        color,
        roughness: 0.62,
        metalness: 0.12,
        topTexture: pcbTex,
        silhouetteThickness: 0.024
      });
      grp.add(board);

      // Gold edge trim border
      const trim = createToonMesh(new THREE.BoxGeometry(w - 0.12, h * 0.85, d - 0.12), rimColor, {
        outline: false,
        silhouette: false,
        metalness: 0.5,
        roughness: 0.35,
        isAccent: true
      });
      trim.position.y = -0.008;
      grp.add(trim);

      // Corner mounting holes with gold copper annular rings
      if (mountingHoles) {
        const ringGeo = new THREE.CylinderGeometry(0.14, 0.14, h + 0.02, 14);
        const holeGeo = new THREE.CylinderGeometry(0.07, 0.07, h + 0.03, 12);
        const insetX = w / 2 - 0.28;
        const insetZ = d / 2 - 0.28;
        for (const [mx, mz] of [[-insetX, -insetZ], [insetX, -insetZ], [-insetX, insetZ], [insetX, insetZ]]) {
          const ring = createToonMesh(ringGeo, 0xeab308, { outline: true, silhouette: false, metalness: 0.65, roughness: 0.25, isAccent: true });
          ring.position.set(mx, 0, mz);
          const hole = new THREE.Mesh(holeGeo, new THREE.MeshBasicMaterial({ color: 0x0f172a }));
          hole.position.set(mx, 0.002, mz);
          grp.add(ring, hole);
        }
      }

      // Pin-1 Gold Orientation Triangle at front-left corner
      if (pin1) {
        const triPts = [
          [-w / 2 + 0.18, d / 2 - 0.18],
          [-w / 2 + 0.56, d / 2 - 0.18],
          [-w / 2 + 0.18, d / 2 - 0.56]
        ];
        const tri = primitives.extrudePolygon(triPts, 0.025, {
          color: 0xfacc15,
          bevel: 0.003,
          silhouette: false,
          metalness: 0.65,
          roughness: 0.25,
          isAccent: true
        });
        tri.position.y = h / 2 + 0.012;
        grp.add(tri);
      }

      // Perimeter gold LGA / edge contact pads
      if (goldPadRing) {
        const padGeoX = new THREE.BoxGeometry(0.11, 0.035, 0.18);
        const padGeoZ = new THREE.BoxGeometry(0.18, 0.035, 0.11);
        const stepX = 0.28;
        for (let x = -w / 2 + 0.72; x <= w / 2 - 0.72; x += stepX) {
          for (const zSide of [-d / 2 + 0.09, d / 2 - 0.09]) {
            const p = createToonMesh(padGeoX, 0xeab308, { outline: false, silhouette: false, metalness: 0.6, roughness: 0.3, isAccent: true });
            p.position.set(x, h / 2 + 0.01, zSide);
            grp.add(p);
          }
        }
        const stepZ = 0.28;
        for (let z = -d / 2 + 0.64; z <= d / 2 - 0.64; z += stepZ) {
          for (const xSide of [-w / 2 + 0.09, w / 2 - 0.09]) {
            const p = createToonMesh(padGeoZ, 0xeab308, { outline: false, silhouette: false, metalness: 0.6, roughness: 0.3, isAccent: true });
            p.position.set(xSide, h / 2 + 0.01, z);
            grp.add(p);
          }
        }
      }

      // Optional silkscreen header strip along back edge
      if (title || subtitle) {
        const stripTex = textures.labelPlate({
          width: 512,
          height: 96,
          bg: 'rgba(12, 46, 30, 0.92)',
          fg: '#f8fafc',
          accent: '#fbbf24',
          border: 'rgba(255,255,255,0.22)',
          title: title || 'SUBSTRATE',
          tag: subtitle || 'REV 2.0',
          grid: false
        });
        attachTopPlate(grp, stripTex, w * 0.56, 0.34, h / 2 + 0.002);
      }

      return grp;
    },

    /**
     * IC Chip / Control Module Package with gull-wing metallic leads, orientation notch & silkscreen plate
     */
    icPackage(opts = {}) {
      const {
        w = 1.4,
        h = 0.38,
        d = 1.15,
        color = 0xe8692b,
        capColor = 0x1e293b,
        title = 'IC MODULE',
        subtitle = 'CONTROL / DECODER',
        tag = 'U1',
        accent = '#fbbf24',
        pinsPerSide = 6,
        pinSides = 2,
         ridges = 0
      } = opts;
      const grp = new THREE.Group();

      // Main chamfered package body
      const body = primitives.chamferBox(w, h, d, {
        chamfer: 0.09,
        color,
        silhouetteThickness: 0.022
      });
      grp.add(body);

      // Raised silicon / ceramic die cap with laser-etched silkscreen
      const plateTex = textures.labelPlate({
        width: 512,
        height: 340,
        bg: '#1c1917',
        fg: '#fafaf9',
        accent,
        title,
        subtitle,
        tag,
        pin1: true,
        gridStyle: 'silicon'
      });
      const capH = 0.09;
      const cap = primitives.chamferBox(w * 0.82, capH, d * 0.78, {
        chamfer: 0.06,
        color: capColor,
        topTexture: plateTex,
        silhouette: false,
        isAccent: true
      });
      cap.position.y = h / 2 + capH / 2 - 0.01;
      grp.add(cap);

      // Optional micro-decoder metallic ridges
      if (ridges > 0) {
        for (let i = 0; i < ridges; i++) {
          const ry = h / 2 + capH + 0.02;
          const rz = -d * 0.26 + (i / Math.max(1, ridges - 1)) * (d * 0.52);
          const bar = createToonMesh(new THREE.BoxGeometry(w * 0.64, 0.035, 0.055), 0xfbd38d, {
            silhouette: false,
            isAccent: true
          });
          bar.position.set(0, ry, rz);
          grp.add(bar);
        }
      }

      // Metallic gull-wing leads on sides
      if (pinsPerSide > 0) {
        const pitchZ = (d * 0.74) / Math.max(1, pinsPerSide - 1);
        const leftPins = primitives.pinRow({ count: pinsPerSide, pitch: pitchZ, length: 0.14, height: h * 0.65 });
        leftPins.position.set(-w / 2, -h * 0.1, 0);
        const rightPins = primitives.pinRow({ count: pinsPerSide, pitch: pitchZ, length: 0.14, height: h * 0.65 });
        rightPins.rotation.y = Math.PI;
        rightPins.position.set(w / 2, -h * 0.1, 0);
        grp.add(leftPins, rightPins);

        if (pinSides === 4) {
          const pitchX = (w * 0.72) / Math.max(1, pinsPerSide - 1);
          const frontPins = primitives.pinRow({ count: pinsPerSide, pitch: pitchX, length: 0.14, height: h * 0.65 });
          frontPins.rotation.y = Math.PI / 2;
          frontPins.position.set(0, -h * 0.1, d / 2);
          const backPins = primitives.pinRow({ count: pinsPerSide, pitch: pitchX, length: 0.14, height: h * 0.65 });
          backPins.rotation.y = -Math.PI / 2;
          backPins.position.set(0, -h * 0.1, -d / 2);
          grp.add(frontPins, backPins);
        }
      }

      return grp;
    },

    /**
     * Iconic V-Notched Chevron Arithmetic Logic Unit (ALU) with Dual Input Ports & Live Z/N/C Flag LEDs
     */
    aluUnit(opts = {}) {
      const {
        w = 1.5,
        h = 0.44,
        d = 1.25,
        color = 0x0f766e,
        accentColor = 0x5eead4,
        title = 'ALU 算术逻辑核',
        subtitle = 'ADD · SUB · CMP · FLAGS'
      } = opts;
      const grp = new THREE.Group();
      const hw = w / 2, hd = d / 2;

      // V-shaped Chevron footprint in XZ plane (inputs enter at -Z twin legs, output exits at +Z apex)
      const chevronPts = [
        [-hw, -hd],
        [-hw * 0.22, -hd],
        [0, -hd * 0.34],
        [hw * 0.22, -hd],
        [hw, -hd],
        [hw * 0.68, hd],
        [-hw * 0.68, hd]
      ];
      const base = primitives.extrudePolygon(chevronPts, h, {
        color,
        bevel: 0.024,
        silhouetteThickness: 0.022
      });
      grp.add(base);

      // Twin input operand manifolds (OP-A & OP-B) on the two back legs
      for (const [lx, label] of [[-hw * 0.56, 'IN_A'], [hw * 0.56, 'IN_B']]) {
        const port = primitives.chamferBox(w * 0.32, 0.11, d * 0.32, {
          chamfer: 0.04,
          color: accentColor,
          silhouette: false,
          isAccent: true,
          label: {
            width: 256,
            height: 160,
            bg: '#0d4742',
            fg: '#ecfeff',
            accent: '#5eead4',
            title: label,
            subtitle: '16-BIT',
            grid: false
          }
        });
        port.position.set(lx, h / 2 + 0.045, -hd * 0.52);
        grp.add(port);
      }

      // Central silkscreen plate on the ALU combiner deck
      const deckTex = textures.labelPlate({
        width: 512,
        height: 260,
        bg: '#092e2b',
        fg: '#f0fdfa',
        accent: '#5eead4',
        title,
        subtitle,
        tag: '16b',
        gridStyle: 'silicon'
      });
      const deck = primitives.chamferBox(w * 0.86, 0.07, d * 0.46, {
        chamfer: 0.05,
        color: 0x115e59,
        topTexture: deckTex,
        silhouette: false,
        isAccent: true
      });
      deck.position.set(0, h / 2 + 0.03, hd * 0.24);
      grp.add(deck);

      // 3 Physical Status Flag Indicator LEDs (Z, N, C) along front output edge
      const flagLeds = {};
      const flagDefs = [
        { key: 'Z', x: -0.34, onHex: 0x38bdf8 },
        { key: 'N', x: 0, onHex: 0xf97316 },
        { key: 'C', x: 0.34, onHex: 0xfacc15 }
      ];
      for (const f of flagDefs) {
        const bezel = createToonMesh(new THREE.CylinderGeometry(0.11, 0.12, 0.05, 14), 0x0f172a, {
          silhouette: false,
          isAccent: true
        });
        bezel.position.set(f.x, h / 2 + 0.03, hd * 0.72);
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(0.075, 12, 12),
          new THREE.MeshStandardMaterial({
            color: 0x334155,
            emissive: 0x000000,
            emissiveIntensity: 0,
            roughness: 0.25
          })
        );
        dome.position.set(f.x, h / 2 + 0.06, hd * 0.72);
        grp.add(bezel, dome);
        flagLeds[f.key] = { dome, onHex: f.onHex };
      }

      // Metallic gull-wing leads on flanks
      const leftLeads = primitives.pinRow({ count: 5, pitch: 0.18, length: 0.13, height: h * 0.6 });
      leftLeads.position.set(-hw * 0.85, -h * 0.1, 0);
      const rightLeads = primitives.pinRow({ count: 5, pitch: 0.18, length: 0.13, height: h * 0.6 });
      rightLeads.rotation.y = Math.PI;
      rightLeads.position.set(hw * 0.85, -h * 0.1, 0);
      grp.add(leftLeads, rightLeads);

      grp.userData.setFlags = (flags = {}) => {
        for (const [k, item] of Object.entries(flagLeds)) {
          const on = !!flags[k];
          item.dome.material.color.setHex(on ? item.onHex : 0x475569);
          item.dome.material.emissive.setHex(on ? item.onHex : 0x000000);
          item.dome.material.emissiveIntensity = on ? 0.85 : 0;
        }
      };

      return grp;
    },

    /**
     * Multi-Slot Articulated Register File Bank with Live 3D Value Readouts & Physical Pop-up on Access
     */
    registerBank(opts = {}) {
      const {
        w = 1.75,
        h = 0.34,
        d = 1.02,
        color = 0x1b4d36,
        slots = [
          { id: 'PC', value: '0x00', sub: 'ADDR' },
          { id: 'IR', value: '0x1504', sub: 'INST' },
          { id: 'R0', value: '0', sub: 'ZERO' },
          { id: 'R1', value: '3', sub: 'ACC' },
          { id: 'R2', value: '0', sub: 'GPR' }
        ]
      } = opts;
      const grp = new THREE.Group();

      // Base frame chassis
      const base = primitives.chamferBox(w, h, d, {
        chamfer: 0.08,
        color,
        silhouetteThickness: 0.022
      });
      grp.add(base);

      const slotMap = {};
      const count = slots.length;
      const slotW = (w - 0.24) / count - 0.04;
      const slotD = d * 0.76;
      const slotH = 0.12;
      const startX = -(w - 0.24) / 2 + slotW / 2 + 0.02;

      slots.forEach((s, idx) => {
        const sx = startX + idx * (slotW + 0.04);
        const readout = textures.dynamicReadout({
          width: 192,
          height: 256,
          title: s.id,
          value: s.value,
          sub: s.sub || '16-BIT',
          bg: '#0f291e',
          accent: '#86efac'
        });
        const card = primitives.chamferBox(slotW, slotH, slotD, {
          chamfer: 0.03,
          color: 0x2a6f4e,
          topTexture: readout.texture,
          silhouette: false,
          isAccent: true
        });
        card.position.set(sx, h / 2 + slotH / 2 - 0.01, 0);
        grp.add(card);
        slotMap[s.id] = { card, readout, baseY: h / 2 + slotH / 2 - 0.01, meta: s };
      });

      // Gold bus header pins along front and back
      const pinsFront = primitives.pinRow({ count: 7, pitch: 0.21, style: 'pads', length: 0.08 });
      pinsFront.rotation.y = Math.PI / 2;
      pinsFront.position.set(0, -h * 0.28, d / 2 + 0.03);
      grp.add(pinsFront);

      grp.userData.updateRegisters = (values = {}, activeIds = []) => {
        const activeSet = new Set(activeIds);
        for (const [id, item] of Object.entries(slotMap)) {
          const val = values[id] !== undefined ? String(values[id]) : item.meta.value;
          const isHot = activeSet.has(id);
          item.readout.update({
            title: id,
            value: val,
            sub: item.meta.sub || '16-BIT',
            active: isHot
          });
          item.card.position.y = item.baseY + (isHot ? 0.055 : 0);
        }
      };

      return grp;
    },

    /**
     * High-Density 6T-SRAM Cache Matrix with Silicon Micro-Grid, Address Decoder Bar & 4 Cache Sets
     */
    sramMatrix(opts = {}) {
      const {
        w = 2.1,
        h = 0.3,
        d = 0.92,
        color = 0x5b21b6,
        sets = ['SET 0', 'SET 1', 'SET 2', 'SET 3'],
        title = 'L1 CACHE · 6T SRAM'
      } = opts;
      const grp = new THREE.Group();

      const chassis = primitives.chamferBox(w, h, d, {
        chamfer: 0.08,
        color,
        silhouetteThickness: 0.022
      });
      grp.add(chassis);

      // Top address decoder spine along the back edge
      const spineTex = textures.labelPlate({
        width: 512,
        height: 110,
        bg: '#2e1065',
        fg: '#f5f3ff',
        accent: '#c4b5fd',
        title,
        tag: '4-SET',
        grid: false
      });
      const spine = primitives.chamferBox(w * 0.9, 0.08, d * 0.24, {
        chamfer: 0.03,
        color: 0x3b0764,
        topTexture: spineTex,
        silhouette: false,
        isAccent: true
      });
      spine.position.set(0, h / 2 + 0.035, -d * 0.31);
      grp.add(spine);

      // 4 distinct SRAM macro banks with silicon wafer grid texture
      const bankMeshes = [];
      const bankW = (w * 0.9 - 0.15) / sets.length;
      const bankD = d * 0.56;
      const startX = -(w * 0.9) / 2 + bankW / 2;

      sets.forEach((sLabel, idx) => {
        const bx = startX + idx * (bankW + 0.05);
        const bankTex = textures.labelPlate({
          width: 240,
          height: 240,
          bg: '#3b1979',
          fg: '#ede9fe',
          accent: '#f59e0b',
          title: sLabel,
          subtitle: '6T ARRAY',
          grid: true,
          gridStyle: 'silicon'
        });
        const bank = primitives.chamferBox(bankW, 0.1, bankD, {
          chamfer: 0.03,
          color: 0x7c3aed,
          topTexture: bankTex,
          silhouette: false,
          isAccent: true
        });
        bank.position.set(bx, h / 2 + 0.045, d * 0.12);
        grp.add(bank);
        bankMeshes.push(bank);
      });

      grp.userData.setActiveSet = (setIdx) => {
        bankMeshes.forEach((b, idx) => {
          const hot = idx === setIdx;
          b.position.y = h / 2 + 0.045 + (hot ? 0.05 : 0);
          b.material.emissive?.setHex(hot ? 0xa855f7 : 0x000000);
          b.material.emissiveIntensity = hot ? 0.5 : 0;
        });
      };

      return grp;
    },

    /**
     * DIMM Memory Module Mounted in a Latching Motherboard Socket with Gull-Wing DRAM Chips
     */
    dimmStick(opts = {}) {
      const {
        w = 1.05,
        h = 0.72,
        d = 2.85,
        boardColor = 0x1d4ed8,
        chipCount = 4,
        title = 'DDR DRAM · MAIN MEMORY'
      } = opts;
      const grp = new THREE.Group();

      // Dark motherboard DIMM slot base with white retention latches at both ends
      const slotBase = primitives.chamferBox(w * 0.76, 0.24, d + 0.22, {
        chamfer: 0.05,
        color: 0x1e293b,
        silhouetteThickness: 0.02
      });
      slotBase.position.y = -0.18;
      grp.add(slotBase);

      for (const zSign of [-1, 1]) {
        const latch = primitives.chamferBox(w * 0.62, 0.34, 0.16, {
          chamfer: 0.03,
          color: 0xe2e8f0,
          silhouette: false,
          isAccent: true
        });
        latch.position.set(0, -0.05, zSign * (d / 2 + 0.12));
        grp.add(latch);
      }

      // Gold edge connector comb along bottom of memory PCB
      const goldComb = createToonMesh(new THREE.BoxGeometry(w * 0.84, 0.12, d * 0.92), 0xeab308, {
        silhouette: false,
        metalness: 0.65,
        roughness: 0.25,
        isAccent: true
      });
      goldComb.position.y = -0.02;
      grp.add(goldComb);

      // Memory PCB deck with top silkscreen and DRAM IC packages
      const memDeck = primitives.chamferBox(w, 0.26, d, {
        chamfer: 0.07,
        color: boardColor,
        silhouetteThickness: 0.022
      });
      memDeck.position.y = 0.15;
      grp.add(memDeck);

      // Top spine label
      const spineTex = textures.labelPlate({
        width: 512,
        height: 110,
        bg: '#0f172a',
        fg: '#f8fafc',
        accent: '#60a5fa',
        title,
        tag: 'DIMM_A1',
        grid: false
      });
      attachTopPlate(memDeck, spineTex, d * 0.84, w * 0.28, 0.132);
      // Rotate top spine plate to run along Z axis
      const lastChild = memDeck.children[memDeck.children.length - 1];
      if (lastChild && lastChild.userData?._isTopPlate) {
        lastChild.rotation.z = Math.PI / 2;
        lastChild.position.x = w * 0.28;
      }

      // Row of black DRAM BGA/SOJ IC chips with metallic leads
      const chipSpan = d * 0.76;
      for (let i = 0; i < chipCount; i++) {
        const cz = -chipSpan / 2 + (i / Math.max(1, chipCount - 1)) * chipSpan;
        const ic = prefabs.icPackage({
          w: w * 0.44,
          h: 0.14,
          d: (chipSpan / chipCount) * 0.72,
          color: 0x0f172a,
          capColor: 0x1e293b,
          title: `DRAM ${i}`,
          subtitle: '64M×16',
          tag: `U${i + 1}`,
          accent: '#38bdf8',
          pinsPerSide: 4
        });
        ic.position.set(-w * 0.14, 0.34, cz);
        grp.add(ic);
      }

      return grp;
    },

    /**
     * Realistic Stepped Octagonal Metallic CPU IHS Heat Spreader with Laser-Etched Markings
     */
    steppedCover(opts = {}) {
      const {
        w = 3.85,
        h = 0.16,
        d = 3.05,
        color = 0xcbd5e1,
        title = 'HUAJUAN CORE-16',
        subtitle = '16-BIT EDUCATIONAL MICROARCHITECTURE',
        tag = 'IHS',
        opacity = 0.92
      } = opts;
      const grp = new THREE.Group();

      // Lower mounting flange skirt
      const flange = primitives.chamferBox(w, h * 0.45, d, {
        chamfer: 0.22,
        color: 0x94a3b8,
        metalness: 0.42,
        roughness: 0.28,
        opacity,
        silhouette: opacity >= 0.85
      });
      grp.add(flange);

      // Raised octagonal central heat-spreader plateau with laser-etched specification plate
      const ihsTex = textures.labelPlate({
        width: 512,
        height: 360,
        bg: '#cbd5e1',
        fg: '#0f172a',
        accent: '#0f766e',
        border: 'rgba(15,23,42,0.35)',
        title,
        subtitle,
        tag,
        footer: 'LGA-EDUCATIONAL · SILICON DIE INSIDE',
        pin1: true,
        grid: false
      });

      const plateau = primitives.chamferBox(w * 0.84, h * 0.75, d * 0.82, {
        chamfer: 0.24,
        color,
        metalness: 0.38,
        roughness: 0.24,
        opacity,
        topTexture: ihsTex,
        silhouette: opacity >= 0.85
      });
      plateau.position.y = h * 0.55;
      grp.add(plateau);

      grp.userData.setOpen = (isOpen, cfg = {}) => {
        const openY = cfg.openY ?? 1.65;
        const closedY = cfg.closedY ?? 0.74;
        const openOp = cfg.openOpacity ?? 0.18;
        const closedOp = cfg.closedOpacity ?? 0.94;
        grp.position.y = isOpen ? openY : closedY;
        setGroupOpacity(grp, isOpen ? openOp : closedOp);
      };

      return grp;
    },

    /**
     * Small Passive & Board Components (smd-cap, electrolytic-cap, crystal, resistor, led)
     */
    passiveComponent(opts = {}) {
      const type = opts.type || 'smd-cap';
      const grp = new THREE.Group();

      if (type === 'smd-cap') {
        const w = opts.w ?? 0.16, h = opts.h ?? 0.08, d = opts.d ?? 0.09;
        const termGeo = new THREE.BoxGeometry(w * 0.26, h, d);
        const bodyGeo = new THREE.BoxGeometry(w * 0.52, h * 0.94, d * 0.94);
        const t1 = createToonMesh(termGeo, 0xe2e8f0, { outline: false, silhouette: false, metalness: 0.7, roughness: 0.25, isAccent: true });
        t1.position.x = -w * 0.36;
        const t2 = createToonMesh(termGeo, 0xe2e8f0, { outline: false, silhouette: false, metalness: 0.7, roughness: 0.25, isAccent: true });
        t2.position.x = w * 0.36;
        const mid = createToonMesh(bodyGeo, opts.color ?? 0xb45309, { outline: false, silhouette: false, isAccent: true });
        grp.add(t1, mid, t2);
      } else if (type === 'crystal') {
        // Metallic HC-49 stadium quartz oscillator can
        const base = primitives.chamferBox(0.52, 0.05, 0.24, { chamfer: 0.06, color: 0x94a3b8, silhouette: false, metalness: 0.65, isAccent: true });
        const canTex = textures.labelPlate({
          width: 256,
          height: 128,
          bg: '#cbd5e1',
          fg: '#0f172a',
          accent: '#eab308',
          title: opts.label || '16.0MHz',
          subtitle: 'CLK OSC',
          grid: false
        });
        const can = primitives.chamferBox(0.44, 0.16, 0.19, {
          chamfer: 0.06,
          color: 0xe2e8f0,
          topTexture: canTex,
          metalness: 0.65,
          roughness: 0.2,
          silhouetteThickness: 0.014,
          isAccent: true
        });
        can.position.y = 0.1;
        grp.add(base, can);
      } else if (type === 'electrolytic-cap') {
        const r = opts.radius ?? 0.14, h = opts.h ?? 0.34;
        const base = createToonMesh(new THREE.BoxGeometry(r * 2.1, 0.05, r * 2.1), 0x1e293b, { silhouette: false, isAccent: true });
        const body = createToonMesh(new THREE.CylinderGeometry(r, r, h, 16), opts.color ?? 0x1e3a8a, { silhouetteThickness: 0.016, isAccent: true });
        body.position.y = h / 2 + 0.025;
        const cap = createToonMesh(new THREE.CylinderGeometry(r * 0.88, r * 0.88, 0.02, 16), 0xdbe4ee, { outline: false, silhouette: false, metalness: 0.7, isAccent: true });
        cap.position.y = h + 0.03;
        grp.add(base, body, cap);
      }
      return grp;
    },

    /**
     * Cross-Disciplinary Scientific Props (gear, compass, lens, layeredStrata) for physics, geography & outdoor
     */
    scientificProp(opts = {}) {
      const type = opts.type || 'gear';
      const grp = new THREE.Group();

      if (type === 'gear') {
        const teeth = opts.teeth ?? 12;
        const rOuter = opts.radius ?? 0.65;
        const rInner = rOuter * 0.8;
        const h = opts.h ?? 0.18;
        const pts = [];
        for (let i = 0; i < teeth * 2; i++) {
          const a0 = (i / (teeth * 2)) * Math.PI * 2;
          const a1 = ((i + 0.5) / (teeth * 2)) * Math.PI * 2;
          const r = i % 2 === 0 ? rOuter : rInner;
          pts.push([Math.cos(a0) * r, Math.sin(a0) * r]);
          pts.push([Math.cos(a1) * r, Math.sin(a1) * r]);
        }
        const wheel = primitives.extrudePolygon(pts, h, { color: opts.color ?? 0xd97706, bevel: 0.015 });
        const hub = createToonMesh(new THREE.CylinderGeometry(rInner * 0.35, rInner * 0.35, h * 1.35, 16), 0x334155, { isAccent: true });
        grp.add(wheel, hub);
      } else if (type === 'compass') {
        const r = opts.radius ?? 0.7;
        const caseMesh = createToonMesh(new THREE.CylinderGeometry(r, r * 1.04, 0.16, 24), opts.color ?? 0xb45309);
        const dialTex = textures.labelPlate({
          width: 256,
          height: 256,
          bg: '#fef3c7',
          fg: '#1c1917',
          accent: '#dc2626',
          title: 'N · E · S · W',
          subtitle: opts.label || 'AZIMUTH 0°',
          grid: true
        });
        attachTopPlate(caseMesh, dialTex, r * 1.5, r * 1.5, 0.082);
        const needle = primitives.extrudePolygon([[0, -r * 0.65], [0.09, 0], [0, r * 0.65], [-0.09, 0]], 0.04, {
          color: 0xdc2626,
          bevel: 0.005,
          silhouette: false,
          isAccent: true
        });
        needle.position.y = 0.11;
        grp.add(caseMesh, needle);
      } else if (type === 'layeredStrata') {
        const layers = opts.layers || [
          { h: 0.22, color: 0x78350f, label: '基岩层 Bedrock' },
          { h: 0.2, color: 0xb45309, label: '砂岩层 Sandstone' },
          { h: 0.16, color: 0x15803d, label: '表土植被 Topsoil' }
        ];
        let y = 0;
        layers.forEach((l, idx) => {
          const w = (opts.w ?? 2.2) - idx * 0.14;
          const d = (opts.d ?? 1.6) - idx * 0.12;
          const block = primitives.chamferBox(w, l.h, d, { chamfer: 0.08, color: l.color });
          block.position.y = y + l.h / 2;
          y += l.h;
          grp.add(block);
        });
      }
      return grp;
    },

    /**
     * Universal Physics Permanent Magnet (split Red/Blue Bar Magnet or Generator Pole Shoe)
     */
    magnetPole(opts = {}) {
      const type = opts.type || 'bar';
      const grp = new THREE.Group();

      if (type === 'bar') {
        const w = opts.w ?? 0.56;
        const h = opts.h ?? 1.5;
        const d = opts.d ?? 0.56;
        const northDown = opts.northDown !== false;
        const nHex = 0xdc2626, sHex = 0x2563eb;
        const bottomHex = northDown ? nHex : sHex;
        const topHex = northDown ? sHex : nHex;
        const bottomLabel = northDown ? 'N' : 'S';
        const topLabel = northDown ? 'S' : 'N';

        const topHalf = primitives.chamferBox(w, h * 0.48, d, {
          chamfer: 0.05,
          color: topHex,
          label: {
            width: 192,
            height: 192,
            bg: topLabel === 'N' ? '#991b1b' : '#1e3a8a',
            fg: '#ffffff',
            accent: '#fbbf24',
            title: topLabel + ' 极',
            subtitle: 'MAGNET',
            grid: false
          }
        });
        topHalf.position.y = h * 0.25;

        const botHalf = primitives.chamferBox(w, h * 0.48, d, {
          chamfer: 0.05,
          color: bottomHex
        });
        botHalf.position.y = -h * 0.25;

        // Chrome divider band in the middle + front N/S badge plates
        const band = primitives.chamferBox(w * 1.03, h * 0.05, d * 1.03, {
          chamfer: 0.05,
          color: 0xe2e8f0,
          metalness: 0.65,
          roughness: 0.25,
          silhouette: false,
          isAccent: true
        });
        grp.add(topHalf, botHalf, band);

        // Front face N and S silkscreen plates so polarity is visible from side view
        for (const [py, poleTxt, bgCol] of [[h * 0.25, topLabel, topLabel === 'N' ? '#991b1b' : '#1e3a8a'], [-h * 0.25, bottomLabel, bottomLabel === 'N' ? '#991b1b' : '#1e3a8a']]) {
          const faceTex = textures.labelPlate({
            width: 160,
            height: 160,
            bg: bgCol,
            fg: '#ffffff',
            accent: '#facc15',
            title: poleTxt,
            grid: false
          });
          if (faceTex) {
            const pMesh = new THREE.Mesh(
              new THREE.PlaneGeometry(w * 0.68, h * 0.34),
              new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
            );
            pMesh.position.set(0, py, d / 2 + 0.024);
            grp.add(pMesh);
          }
        }
      } else if (type === 'poleShoe') {
        const isNorth = (opts.polarity || 'N') === 'N';
        const w = opts.w ?? 0.9, h = opts.h ?? 1.4, d = opts.d ?? 1.6;
        const color = isNorth ? 0xdc2626 : 0x2563eb;
        const bg = isNorth ? '#991b1b' : '#1e3a8a';
        const shoe = primitives.chamferBox(w, h, d, {
          chamfer: 0.1,
          color,
          label: {
            width: 256,
            height: 256,
            bg,
            fg: '#ffffff',
            accent: '#fbbf24',
            title: isNorth ? 'N 极磁靴' : 'S 极磁靴',
            subtitle: isNorth ? 'NORTH POLE' : 'SOUTH POLE',
            tag: isNorth ? 'B →' : '→ B',
            grid: false
          }
        });
        grp.add(shoe);
      }
      return grp;
    },

    /**
     * 3D Helical Copper Coil Solenoid with Acrylic Bobbin Flanges & Brass Binding Posts
     */
    coilSolenoid(opts = {}) {
      const {
        radius = 0.78,
        height = 1.45,
        turns = 7,
        wireRadius = 0.048,
        wireColor = 0xd97706,
        flangeColor = 0x334155
      } = opts;
      const grp = new THREE.Group();

      // Top and bottom bobbin flanges
      const flangeGeo = new THREE.CylinderGeometry(radius * 1.18, radius * 1.18, 0.09, 28);
      const holeGeo = new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, 0.11, 24);
      for (const yPos of [-height / 2, height / 2]) {
        const fl = createToonMesh(flangeGeo, flangeColor, { silhouetteThickness: 0.018 });
        fl.position.y = yPos;
        const hole = new THREE.Mesh(holeGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }));
        hole.position.y = yPos;
        grp.add(fl, hole);
      }

      // Translucent inner core cylinder
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.88, radius * 0.88, height, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
      );
      grp.add(core);

      // Helical copper winding tube
      const pts = [];
      const steps = turns * 20;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const ang = u * turns * Math.PI * 2;
        const y = -height * 0.44 + u * (height * 0.88);
        pts.push([Math.cos(ang) * radius, y, Math.sin(ang) * radius]);
      }
      const helix = primitives.curvedTube(pts, {
        radius: wireRadius,
        tubularSegments: turns * 16,
        radialSegments: 8,
        color: wireColor,
        caps: false,
        silhouetteThickness: 0.014
      });
      grp.add(helix);

      // Two brass binding posts at front of bottom flange
      for (const [bx, col] of [[-0.36, 0xdc2626], [0.36, 0x1e293b]]) {
        const post = createToonMesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12), 0xeab308, { silhouette: false, metalness: 0.65, isAccent: true });
        post.position.set(bx, -height / 2 + 0.1, radius * 1.12);
        const cap = createToonMesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), col, { silhouette: false, isAccent: true });
        cap.position.set(bx, -height / 2 + 0.2, radius * 1.12);
        grp.add(post, cap);
      }

      return grp;
    },

    /**
     * 3D Desktop Laboratory Analog Galvanometer / Ammeter with Live Rotating Pointer Needle
     */
    analogMeter(opts = {}) {
      const {
        w = 1.35,
        h = 1.15,
        d = 0.82,
        color = 0x1e293b,
        title = '灵敏电流计 G',
        unit = 'mA',
        maxAbs = 10
      } = opts;
      const grp = new THREE.Group();

      // Base instrument console
      const base = primitives.chamferBox(w, h * 0.32, d, { chamfer: 0.07, color });
      base.position.y = h * 0.16;
      const upper = primitives.chamferBox(w * 0.92, h * 0.72, d * 0.74, { chamfer: 0.07, color });
      upper.position.set(0, h * 0.62, -d * 0.08);
      grp.add(base, upper);

      // White dial face plate on front of upper housing
      const dialTex = textures.labelPlate({
        width: 320,
        height: 240,
        bg: '#fffbeb',
        fg: '#0f172a',
        accent: '#dc2626',
        border: '#1e293b',
        title,
        subtitle: `- ${maxAbs} .. 0 .. +${maxAbs} ${unit}`,
        tag: unit,
        grid: true
      });
      if (dialTex) {
        const face = new THREE.Mesh(
          new THREE.PlaneGeometry(w * 0.76, h * 0.52),
          new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
        );
        face.position.set(0, h * 0.65, d * 0.29 + 0.024);
        grp.add(face);
      }

      // Physical 3D rotating pointer needle pivoted at bottom center of dial
      const pivot = new THREE.Group();
      pivot.position.set(0, h * 0.46, d * 0.31 + 0.024);
      const needle = createToonMesh(new THREE.BoxGeometry(0.035, h * 0.36, 0.02), 0xdc2626, { outline: false, silhouette: false, isAccent: true });
      needle.position.y = h * 0.16;
      const hub = createToonMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), 0x0f172a, { outline: false, silhouette: false, isAccent: true });
      hub.rotation.x = Math.PI / 2;
      pivot.add(needle, hub);
      grp.add(pivot);

      // Front red & black terminal binding posts
      for (const [tx, tCol] of [[-w * 0.28, 0xdc2626], [w * 0.28, 0x0f172a]]) {
        const term = createToonMesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 12), tCol, { silhouette: false, isAccent: true });
        term.position.set(tx, h * 0.35, d * 0.34);
        grp.add(term);
      }

      grp.userData.setValue = (val = 0) => {
        const clamped = Math.max(-maxAbs, Math.min(maxAbs, val));
        // Positive current deflects needle right (-Z rotation in front view)
        pivot.rotation.z = -(clamped / Math.max(0.001, maxAbs)) * 0.85;
      };

      return grp;
    },

    /**
     * 3D Physical Vector Arrow (Shaft + Conical Head) for Force, Velocity, Current or Magnetic Field
     */
    vectorArrow3D(opts = {}) {
      const radius = opts.radius ?? 0.045;
      const len = opts.length ?? 1.0;
      const color = opts.color ?? 0xdc2626;
      const grp = new THREE.Group();

      const shaft = createToonMesh(new THREE.CylinderGeometry(radius, radius, len * 0.72, 12), color, {
        outline: false,
        silhouetteThickness: 0.012,
        isAccent: true
      });
      shaft.position.y = len * 0.36;

      const head = createToonMesh(new THREE.ConeGeometry(radius * 2.4, len * 0.28, 14), color, {
        outline: false,
        silhouetteThickness: 0.012,
        isAccent: true
      });
      head.position.y = len * 0.86;
      grp.add(shaft, head);

      grp.userData.setDirection = (dirVec, scaleLen = 1) => {
        if (scaleLen <= 0.02) {
          grp.visible = false;
          return;
        }
        grp.visible = true;
        const v = new THREE.Vector3(...dirVec).normalize();
        grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
        grp.scale.set(1, scaleLen, 1);
      };

      return grp;
    }
  };

  // ==================== 5. VIEWPORT & CAMERA CONTROLLER ====================
  function createViewport(container, opts = {}) {
    const {
      cameraPos = [7.2, 6.0, 7.4],
      target = [0, 0.35, 0],
      fov = 37,
      groundPedestal = true,
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
    const hemi = new THREE.HemisphereLight(0xfffdf8, 0x8a95a5, 1.58);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xfff5e4, 1.72);
    keyLight.position.set(8, 13, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xcce2ff, 0.62);
    rimLight.position.set(-7, 6, -6);
    scene.add(rimLight);

    // Subtle contact shadow receiver plane so the model feels grounded on the drafting table
    if (groundPedestal && THREE.ShadowMaterial) {
      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(18, 18),
        new THREE.ShadowMaterial({ opacity: 0.16 })
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -0.22;
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);
    }

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
      setGroupHighlight,
      setGroupOpacity,
      textures,
      primitives,
      prefabs,
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

  return {
    hasThree,
    createToonMesh,
    setGroupHighlight,
    setGroupOpacity,
    textures,
    primitives,
    prefabs,
    createViewport
  };
})();

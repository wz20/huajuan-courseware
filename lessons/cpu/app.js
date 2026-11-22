(() => {
  const esc = s => StudioApp.esc(s);

  const WIRE_ROUTES = {
    'cu->regs': [[-1.3, 0.55, -0.8], [-0.4, 0.55, 0.15]],
    'regs->bus': [[0.4, 0.45, 0.6], [1.7, 0.38, 1.05], [2.4, 0.4, 1.2]],
    'bus->cache': [[2.3, 0.38, 1.25], [0.5, 0.4, 1.38], [-0.8, 0.45, 1.32]],
    'cache->regs': [[-0.8, 0.45, 1.15], [-0.2, 0.5, 0.65]],
    'regs->cu': [[0.0, 0.52, 0.3], [-1.3, 0.55, -0.8]],
    'cu->alu': [[-1.1, 0.55, -0.95], [1.1, 0.55, -0.85]],
    'regs->alu': [[0.2, 0.52, 0.25], [1.2, 0.55, -0.65]],
    'alu->regs': [[1.15, 0.58, -0.5], [0.25, 0.52, 0.35]]
  };

  const state = {
    selectedPart: 'cu',
    ihsOpen: true,
    visitedParts: new Set(['cu']),
    cycleStageView: '3d', // '3d' | 'seq' | 'bits'
    progParams: { mem04: 3, opMode: 'ADD', immB: 5 },
    cycleIdx: 0,
    selectedBitField: null,
    pipeMode: 'pipelined',
    pipeFwd: true,
    pipeHighlightCycle: 5,
    cachePreset: 'seq',
    cacheStep: 0,
    cacheHistory: null
  };

  let app = null;
  let v3 = null;
  let webglFailed = false;
  let blockMeshes = {};
  let ihsMesh = null;

  function makeCacheHistory(addrs) {
    return createLessonHistory({ addrs: [...addrs] }, (s, act) => {
      if (act?.type === 'append') return { addrs: [...s.addrs, act.addr] };
      if (act?.type === 'preset') return { addrs: [...act.addrs] };
      return undefined;
    });
  }
  state.cacheHistory = makeCacheHistory([0x00, 0x04, 0x08, 0x0C, 0x00, 0x04]);

  function dispose3D() {
    if (v3) {
      v3.dispose();
      v3 = null;
      blockMeshes = {};
      ihsMesh = null;
    }
  }

  function buildCPUScene3D(container, onPick) {
    dispose3D();
    container.innerHTML = '';
    if (webglFailed) return false;

    v3 = Studio3D.createViewport(container, {
      cameraPos: [5.4, 4.95, 5.65],
      target: [0.35, 0.32, 0.2],
      onSelectPart: onPick,
      onFallback: () => {
        webglFailed = true;
      }
    });
    if (!v3) return false;

    const { scene, registerPickable, prefabs, primitives, textures } = v3;

    // ==================== LAYER 1: MOTHERBOARD & VRM / CLOCK PERIPHERALS ====================
    const moboTex = textures.microGrid({
      bg: '#102820',
      majorColor: 'rgba(255,255,255,0.08)',
      minorColor: 'rgba(255,255,255,0.03)',
      style: 'pcb'
    });
    const pcb = primitives.chamferBox(7.4, 0.14, 5.0, {
      chamfer: 0.24,
      color: 0x132e25,
      topTexture: moboTex,
      silhouetteThickness: 0.024
    });
    pcb.position.set(0.55, -0.08, 0.25);
    scene.add(pcb);

    // Motherboard VRM electrolytic capacitors & 16MHz Clock Crystal Oscillator
    for (const [cx, cz] of [[-2.75, -1.65], [-2.75, -1.15], [-2.75, -0.65]]) {
      const ecap = prefabs.passiveComponent({ type: 'electrolytic-cap', radius: 0.13, h: 0.32, color: 0x1e3a8a });
      ecap.position.set(cx, 0.0, cz);
      scene.add(ecap);
    }
    const clkCrystal = prefabs.passiveComponent({ type: 'crystal', label: '16.0MHz' });
    clkCrystal.position.set(-2.72, 0.01, 0.15);
    clkCrystal.rotation.y = Math.PI / 2;
    scene.add(clkCrystal);

    // ==================== LAYER 2: CPU LGA PACKAGE SUBSTRATE & SMD CAPACITOR RING ====================
    const substrate = prefabs.circuitBoard({
      w: 4.45,
      h: 0.16,
      d: 3.55,
      color: 0x1b5e43,
      rimColor: 0xd4a13e,
      chamfer: 0.2,
      mountingHoles: true,
      goldPadRing: true,
      pin1: true
    });
    substrate.position.set(-0.25, 0.07, 0.12);
    scene.add(substrate);

    // Perimeter SMD decoupling capacitors around the CPU substrate
    const smdCoords = [
      [-1.8, -1.45, 0], [-1.3, -1.45, 0], [0.8, -1.45, 0], [1.3, -1.45, 0],
      [-2.18, -0.4, Math.PI / 2], [-2.18, 0.5, Math.PI / 2],
      [1.68, -0.4, Math.PI / 2], [1.68, 0.5, Math.PI / 2]
    ];
    for (const [sx, sz, rotY] of smdCoords) {
      const smd = prefabs.passiveComponent({ type: 'smd-cap' });
      smd.position.set(sx, 0.18, sz);
      smd.rotation.y = rotY;
      scene.add(smd);
    }

    // ==================== LAYER 3: SILICON DIE INTERPOSER & 5 MICROARCHITECTURE UNITS ====================
    const dieTex = textures.microGrid({
      bg: '#16161d',
      majorColor: 'rgba(255,255,255,0.16)',
      minorColor: 'rgba(255,255,255,0.06)',
      accentColor: '#d97706',
      style: 'silicon'
    });
    const siliconDie = primitives.chamferBox(3.68, 0.07, 2.86, {
      chamfer: 0.12,
      color: 0x18181f,
      metalness: 0.28,
      roughness: 0.35,
      topTexture: dieTex,
      silhouetteThickness: 0.018
    });
    siliconDie.position.set(-0.25, 0.18, 0.12);
    scene.add(siliconDie);

    // Internal on-die gold micro-bus traces with vias
    const onDieBuses = [
      [[-1.35, -0.85], [-0.45, -0.85], [0.85, -0.85]],
      [[-1.35, -0.45], [-1.35, 0.25], [-0.35, 0.25]],
      [[0.95, -0.42], [0.95, 0.28], [0.25, 0.28]],
      [[-0.2, 0.55], [-0.2, 1.25], [-0.85, 1.25]]
    ];
    for (const pathPts of onDieBuses) {
      scene.add(primitives.tracePath(pathPts, { y: 0.225, width: 0.055, height: 0.02, color: 0xeab308 }));
    }

    blockMeshes = {};
    const addUnit = (id, grp, pos, baseHex) => {
      grp.position.set(...pos);
      scene.add(grp);
      registerPickable(grp, id);
      blockMeshes[id] = { grp, baseHex };
      return grp;
    };

    // 1. Control Unit (CU) IC Package with microcode decoder bars & 4-side gull-wing pins
    const cuGrp = prefabs.icPackage({
      w: 1.42,
      h: 0.36,
      d: 1.12,
      color: 0xe8692b,
      capColor: 0x1c1917,
      title: 'CU 控制单元',
      subtitle: 'DECODER · PC · IR',
      tag: 'CTRL',
      accent: '#fbbf24',
      ridges: 4,
      pinsPerSide: 5,
      pinSides: 4
    });
    addUnit('cu', cuGrp, [-1.48, 0.40, -0.92], 0xe8692b);

    // 2. Arithmetic Logic Unit (ALU) V-Notched Chevron with Dual Input Ports & Z/N/C Flag LEDs
    const aluGrp = prefabs.aluUnit({
      w: 1.46,
      h: 0.42,
      d: 1.18,
      color: 0x0f766e,
      accentColor: 0x5eead4,
      title: 'ALU 运算核',
      subtitle: 'ADD · SUB · FLAGS'
    });
    addUnit('alu', aluGrp, [1.04, 0.42, -0.88], 0x0f766e);

    // 3. Articulated Register File Bank (PC / IR / R0 / R1 / R2 live 3D cartridges)
    const regsGrp = prefabs.registerBank({
      w: 1.72,
      h: 0.32,
      d: 0.94,
      color: 0x1b4d36,
      slots: [
        { id: 'PC', value: '0x00', sub: 'ADDR' },
        { id: 'IR', value: '1504', sub: 'INST' },
        { id: 'R0', value: '0', sub: 'ZERO' },
        { id: 'R1', value: '3', sub: 'ACC' },
        { id: 'R2', value: '0', sub: 'GPR' }
      ]
    });
    addUnit('regs', regsGrp, [-0.12, 0.37, 0.35], 0x215d3f);

    // 4. L1 Cache 6T-SRAM 4-Set Matrix
    const cacheGrp = prefabs.sramMatrix({
      w: 2.06,
      h: 0.28,
      d: 0.84,
      color: 0x5b21b6,
      sets: ['SET 0', 'SET 1', 'SET 2', 'SET 3'],
      title: 'L1 CACHE · 6T SRAM'
    });
    addUnit('cache', cacheGrp, [-0.95, 0.35, 1.32], 0x6d28d9);

    // 5. External System Bus & DIMM DRAM Stick in Latching Motherboard Slot
    const busGrp = prefabs.dimmStick({
      w: 1.06,
      h: 0.72,
      d: 2.85,
      boardColor: 0x1d4ed8,
      chipCount: 4,
      title: 'DDR DRAM · MAIN MEM'
    });
    addUnit('bus', busGrp, [2.75, 0.28, 0.30], 0x2563eb);

    // Motherboard routed copper trace buses + 3D arched high-speed bus conduits (CPU <-> DRAM)
    for (let i = -2; i <= 2; i++) {
      const z0 = 0.25 + i * 0.32;
      const z1 = 0.25 + i * 0.42;
      scene.add(primitives.tracePath([
        [1.55, z0],
        [1.92, z0],
        [2.12, z1],
        [2.32, z1]
      ], { y: 0.015, width: 0.075, height: 0.025, color: 0xd9a441 }));
    }
    const addrArc = primitives.curvedTube([
      [0.72, 0.34, 0.55],
      [1.65, 0.78, 0.65],
      [2.32, 0.42, 0.65]
    ], { radius: 0.036, color: 0xf59e0b });
    const dataArc = primitives.curvedTube([
      [0.72, 0.34, 0.95],
      [1.65, 0.86, 1.12],
      [2.32, 0.42, 1.12]
    ], { radius: 0.04, color: 0x38bdf8 });
    scene.add(addrArc, dataArc);

    // ==================== LAYER 4: STEPPED OCTAGONAL METALLIC IHS HEAT SPREADER ====================
    ihsMesh = prefabs.steppedCover({
      w: 3.92,
      h: 0.18,
      d: 3.12,
      color: 0xcbd5e1,
      title: 'HUAJUAN CORE-16',
      subtitle: '16-BIT EDUCATIONAL MICROARCHITECTURE',
      tag: 'IHS',
      opacity: state.ihsOpen ? 0.16 : 0.94
    });
    ihsMesh.position.set(-0.25, state.ihsOpen ? 1.62 : 0.74, 0.12);
    scene.add(ihsMesh);

    // Bind 3D leader callouts
    v3.anchorCallouts(CPU_PARTS.map((p, idx) => ({
      id: p.id,
      label: p.name.split('（')[0],
      color: p.color,
      pos: p.pos,
      offset: idx === 3 ? [0, 0.2, 0.25] : [0, 0.45, 0],
      dx: idx === 0 ? 12 : idx === 1 ? 38 : idx === 2 ? 6 : idx === 3 ? -12 : 28,
      dy: idx === 3 ? 46 : idx === 4 ? -28 : -42
    })));

    highlightPart3D(state.selectedPart, []);
    return true;
  }

  function highlightPart3D(partId, wireNames = [], snapshot = null) {
    if (!v3) return;
    v3.setActivePart(partId);
    for (const [id, item] of Object.entries(blockMeshes)) {
      const isHot = id === partId;
      Studio3D.setGroupHighlight(item.grp, isHot, {
        colorHex: item.baseHex,
        intensity: 0.38,
        scale: 1.05
      });
    }
    if (ihsMesh && ihsMesh.userData?.setOpen) {
      ihsMesh.userData.setOpen(state.ihsOpen, { openY: 1.62, closedY: 0.74, openOpacity: 0.16, closedOpacity: 0.94 });
    }
    if (snapshot) {
      blockMeshes.alu?.grp?.userData?.setFlags?.(snapshot.flags);
      const hotRegs = partId === 'regs' ? ['R1', 'R2'] : partId === 'cu' ? ['PC', 'IR'] : [];
      blockMeshes.regs?.grp?.userData?.updateRegisters?.({
        PC: snapshot.pc,
        IR: (snapshot.irHex || '').replace(/^0x/, ''),
        R0: snapshot.regs.R0,
        R1: snapshot.regs.R1,
        R2: snapshot.regs.R2
      }, hotRegs);
    } else {
      blockMeshes.alu?.grp?.userData?.setFlags?.({ Z: 0, N: 0, C: 0 });
      blockMeshes.regs?.grp?.userData?.updateRegisters?.({
        PC: '0x00',
        IR: '1504',
        R0: 0,
        R1: state.progParams.mem04,
        R2: 0
      }, partId === 'regs' ? ['R1'] : []);
    }
    const pulses = wireNames.map(w => ({ points: WIRE_ROUTES[w], color: 0xfbbf24, count: 2, speed: 0.9 })).filter(p => p.points);
    v3.setSignalPulses(pulses);
  }

  function cpuSchematicSvg(activeId, signals = []) {
    const active = id => id === activeId;
    const stroke = id => active(id) ? '#e8692b' : 'var(--ink)';
    const sw = id => active(id) ? 2.6 : 1.4;
    const box = (id, x, y, w, h, title, fill) => `
      <g data-pip-part="${id}" style="cursor:pointer">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${active(id) ? fill : 'var(--surface-2)'}" stroke="${stroke(id)}" stroke-width="${sw(id)}"/>
        <text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="var(--ink-strong)">${esc(title)}</text>
      </g>`;
    return `<svg viewBox="0 0 220 154" style="width:100%;height:auto;display:block">
      <line x1="72" y1="32" x2="112" y2="32" stroke="var(--accent)" stroke-width="2"/>
      <line x1="42" y1="52" x2="88" y2="76" stroke="var(--secondary)" stroke-width="1.8" stroke-dasharray="3 2"/>
      <line x1="145" y1="52" x2="115" y2="76" stroke="var(--accent)" stroke-width="2"/>
      <line x1="115" y1="100" x2="115" y2="120" stroke="var(--accent)" stroke-width="2"/>
      <line x1="158" y1="90" x2="176" y2="90" stroke="#2563eb" stroke-width="2.4"/>
      ${box('cu', 10, 12, 62, 40, 'CU / PC', 'var(--sand)')}
      ${box('alu', 112, 12, 66, 40, 'ALU 运算', 'var(--mint)')}
      ${box('regs', 68, 72, 90, 32, '寄存器堆', 'var(--accent-soft)')}
      ${box('cache', 18, 114, 118, 28, 'L1 缓存 (SRAM)', 'var(--violet)')}
      ${box('bus', 174, 48, 38, 86, 'RAM', 'var(--steel)')}
      ${signals.length ? `<text x="110" y="150" text-anchor="middle" font-size="9.5" font-weight="700" font-family="monospace" fill="var(--accent)">${esc(signals.join(' · '))}</text>` : ''}
    </svg>`;
  }

  function render2DFallbackStage(vp, activeId, subtitle) {
    dispose3D();
    vp.innerHTML = `<svg viewBox="0 0 640 340" style="width:100%;height:100%">
      ${StudioSVG.flowPath({ points: [[175, 110], [320, 110]], color: '#e8692b', packetT: 0.5, packetLabel: 'Ctrl' })}
      ${StudioSVG.flowPath({ points: [[320, 130], [320, 195]], color: '#0f766e', packetT: 0.4, packetLabel: 'Data' })}
      ${StudioSVG.flowPath({ points: [[370, 210], [500, 175]], color: '#2563eb', dashed: true, packetT: 0.65, packetLabel: 'Bus' })}
      ${StudioSVG.isoBox({ id: 'cu', x: 140, y: 100, label: 'CU 控制单元', sub: 'PC / IR', fillTop: '#fcd4ad', fillLeft: '#e9b787', fillRight: '#d39a65', active: activeId === 'cu' })}
      ${StudioSVG.isoBox({ id: 'alu', x: 340, y: 95, label: 'ALU 运算器', sub: 'Z / N / C', fillTop: '#c6dfb8', fillLeft: '#9ec48b', fillRight: '#7ca768', active: activeId === 'alu' })}
      ${StudioSVG.isoBox({ id: 'regs', x: 320, y: 205, label: '寄存器堆', sub: 'R0 / R1 / R2', fillTop: '#a9c5e8', fillLeft: '#84a5cf', fillRight: '#6086b6', active: activeId === 'regs' })}
      ${StudioSVG.isoBox({ id: 'cache', x: 145, y: 220, label: 'L1 缓存', sub: 'SRAM 4-Set', fillTop: '#cbbae6', fillLeft: '#a691ca', fillRight: '#866fae', active: activeId === 'cache' })}
      ${StudioSVG.isoBox({ id: 'bus', x: 525, y: 165, label: '总线 + DRAM', sub: subtitle || '主存读写', fillTop: '#93c5fd', fillLeft: '#60a5fa', fillRight: '#3b82f6', active: activeId === 'bus' })}
    </svg>`;
    vp.querySelectorAll('[data-node-id]').forEach(g => {
      g.addEventListener('click', () => {
        state.selectedPart = g.dataset.nodeId;
        renderModule(app.activeModuleId());
      });
    });
  }

  function bindPiPClicks(partId, ctrlSignals = []) {
    app.setPiP({
      visible: true,
      title: '2D 芯片数据通路（点击部件联动）',
      html: cpuSchematicSvg(partId, ctrlSignals),
      onMount: (body) => {
        body.querySelectorAll('[data-pip-part]').forEach(node => {
          node.addEventListener('click', () => {
            const picked = node.dataset.pipPart;
            state.selectedPart = picked;
            state.visitedParts.add(picked);
            const info = CPU_PARTS.find(p => p.id === picked);
            if (info && v3) v3.focusCamera(info.camPos, info.pos, 380);
            renderModule(app.activeModuleId());
          });
        });
      }
    });
  }

  // ==================== MODULE 1: OVERVIEW (3D Architecture Explorer) ====================
  function renderOverview() {
    const part = CPU_PARTS.find(p => p.id === state.selectedPart) || CPU_PARTS[0];
    state.visitedParts.add(part.id);
    if (state.visitedParts.size >= 3) app.markComplete('overview');

    app.setKPIs([
      { label: '当前聚焦单元', value: part.name.split('（')[0], level: 'good' },
      { label: '已探查部件', value: `${state.visitedParts.size} / ${CPU_PARTS.length}` },
      { label: '顶盖剖视', value: state.ihsOpen ? '已掀开硅片' : '已盖上散热盖' }
    ]);
    app.setBannerPills([
      { text: '原型 B · 3D 硬件解剖', tone: 'mint' },
      { text: '点选芯片块或原理图框均同步联动', tone: 'sand' }
    ]);
    app.setStageViews([
      { id: 'open', label: '掀开顶盖看裸晶' },
      { id: 'closed', label: '盖上散热盖 (IHS)' }
    ], state.ihsOpen ? 'open' : 'closed', (id) => {
      state.ihsOpen = id === 'open';
      highlightPart3D(state.selectedPart, []);
      renderOverview();
    });
    app.setTransport({ show: false });

    const vp = app.viewport();
    if (!v3 && !webglFailed) {
      buildCPUScene3D(vp, (picked) => {
        state.selectedPart = picked;
        const info = CPU_PARTS.find(p => p.id === picked);
        if (info && v3) v3.focusCamera(info.camPos, info.pos, 380);
        renderOverview();
      });
    }
    if (!v3) render2DFallbackStage(vp, part.id, '2D 降级原理图');
    else highlightPart3D(part.id, ['cu->regs', 'alu->regs', 'regs->bus']);

    bindPiPClicks(part.id, ['3D 与 2D 双向同源选中']);

    app.setTabs([
      {
        label: '概览',
        render: (el) => {
          el.innerHTML = `
            <span class="st-pill mint">${esc(part.en)}</span>
            <h3 style="margin:6px 0 4px">${esc(part.name)}</h3>
            <p style="margin:0;color:var(--muted)">${esc(part.summary)}</p>
            <div class="st-callout"><b>核心职责</b>${esc(part.role)}</div>
            <div class="st-checklist">
              ${part.takeaways.map(t => `<div class="st-check-row done"><span>•</span><span>${esc(t)}</span></div>`).join('')}
            </div>
            <div class="st-pills-row" style="margin-top:4px">
              ${CPU_PARTS.map(p => `<button type="button" class="st-btn ${p.id === part.id ? 'primary' : ''}" data-pick-btn="${p.id}">${esc(p.name.split('（')[0])}</button>`).join('')}
            </div>`;
          el.querySelectorAll('[data-pick-btn]').forEach(b => {
            b.addEventListener('click', () => {
              state.selectedPart = b.dataset.pickBtn;
              const info = CPU_PARTS.find(p => p.id === state.selectedPart);
              if (info && v3) v3.focusCamera(info.camPos, info.pos, 380);
              renderOverview();
            });
          });
        }
      },
      {
        label: '总线与引脚',
        html: `
          <h4 style="margin:0 0 6px">${esc(part.name)} 关键连接</h4>
          <table class="st-trace-table" style="border:1px solid var(--line);border-radius:8px;overflow:hidden">
            <thead><tr><th>通道</th><th>连接方向</th><th>传输内容</th></tr></thead>
            <tbody>
              ${part.pinout.map(([a, b, c]) => `<tr><td><b>${esc(a)}</b></td><td>${esc(b)}</td><td style="white-space:normal">${esc(c)}</td></tr>`).join('')}
            </tbody>
          </table>`
      },
      {
        label: '规格参数',
        html: `
          <h4 style="margin:0 0 6px">芯片架构关键指标</h4>
          <dl class="st-kv-grid">
            ${Object.entries(part.specs).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}
          </dl>`
      }
    ]);

    app.setCodePanel({ visible: false });
    app.setBottomDock({ mode: 'modules' });
  }

  // ==================== MODULE 2: INSTRUCTION CYCLE (B+D: Code Chips + 3D + Timing Sequence + 16-bit Decoder) ====================
  function renderCycle() {
    const run = buildExecutionTrace(state.progParams);
    const idx = Math.max(0, Math.min(run.cycles.length - 1, state.cycleIdx));
    state.cycleIdx = idx;
    const cur = run.cycles[idx];
    if (idx === run.cycles.length - 1) app.markComplete('cycle');

    app.setKPIs([
      { label: '当前节拍', value: cur.cycle },
      { label: 'PC 程序指针', value: cur.snapshot.pc },
      { label: 'IR 指令码', value: cur.snapshot.irHex },
      { label: 'R1 / R2', value: `${cur.snapshot.regs.R1} / ${cur.snapshot.regs.R2}`, level: cur.snapshot.flags.N ? 'warn' : 'good' },
      { label: '标志 Z · N · C', value: `${cur.snapshot.flags.Z} · ${cur.snapshot.flags.N} · ${cur.snapshot.flags.C}`, level: cur.snapshot.flags.N ? 'warn' : cur.snapshot.flags.Z ? 'mint' : undefined }
    ]);

    app.setBannerPills([
      { text: '原型 B + D · 实操指令跟踪', tone: 'steel' },
      { text: `RAM[0x04]=${cur.snapshot.mem['0x04']} · RAM[0x08]=${cur.snapshot.mem['0x08']}`, tone: 'sand' }
    ]);

    app.setStageViews([
      { id: '3d', label: '3D 芯片信号流' },
      { id: 'seq', label: '硬件信号时序图' },
      { id: 'bits', label: '16位机器码解码' }
    ], state.cycleStageView, (vId) => {
      state.cycleStageView = vId;
      if (vId !== '3d') dispose3D();
      renderCycle();
    });

    app.setTransport({
      canBack: idx > 0,
      canNext: idx < run.cycles.length - 1,
      onBack: () => { state.cycleIdx = Math.max(0, idx - 1); renderCycle(); },
      onNext: () => {
        if (state.cycleIdx < run.cycles.length - 1) { state.cycleIdx++; renderCycle(); return true; }
        return false;
      },
      onStepPlay: () => {
        if (state.cycleIdx < run.cycles.length - 1) { state.cycleIdx++; renderCycle(); return true; }
        return false;
      },
      onTogglePlay: () => {}
    });

    const vp = app.viewport();
    if (state.cycleStageView === '3d') {
      if (!v3 && !webglFailed) {
        buildCPUScene3D(vp, (picked) => {
          state.selectedPart = picked;
          renderCycle();
        });
      }
      if (!v3) render2DFallbackStage(vp, cur.activePart, cur.stage);
      else highlightPart3D(cur.activePart, cur.activeWires, cur.snapshot);
      bindPiPClicks(cur.activePart, cur.ctrlSignals);
    } else if (state.cycleStageView === 'seq') {
      app.setPiP({ visible: false });
      const curInstCycles = run.cycles.filter(c => c.instLine === cur.instLine);
      const actors = [
        { id: 'pc', label: 'PC 计数器' },
        { id: 'bus', label: '三总线/RAM' },
        { id: 'cache', label: 'L1 缓存' },
        { id: 'cu', label: 'CU 控制单元' },
        { id: 'alu', label: 'ALU 运算' },
        { id: 'regs', label: '寄存器 R0-R2' }
      ];
      const bands = curInstCycles.map(c => ({ title: `${c.cycle} · ${c.stage}`, events: c.seqEvents }));
      const activeBand = curInstCycles.findIndex(c => c.id === cur.id);
      const activeEvId = cur.seqEvents[0]?.id;
      StudioSVG.renderSequenceDiagram(vp, {
        actors,
        bands,
        activeStep: activeBand,
        activeEventId: activeEvId,
        onSelectEvent: (evId) => {
          const hit = curInstCycles.find(c => c.seqEvents.some(e => e.id === evId));
          if (hit) { state.cycleIdx = hit.no - 1; renderCycle(); }
        }
      });
    } else {
      app.setPiP({ visible: false });
      vp.innerHTML = `<div style="padding:22px 24px;height:100%;overflow:auto;display:flex;flex-direction:column;gap:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <small style="color:var(--muted);font-weight:700">当前指令 16-bit 机器码解构</small>
            <h2 class="mono" style="margin:2px 0;font-size:22px">${esc(cur.asm)} → ${cur.enc.hex}</h2>
          </div>
          <span class="st-pill violet mono">BIN: ${cur.enc.bin.replace(/(.{4})/g, '$1 ').trim()}</span>
        </div>
        <div id="cpu-bitfield-host"></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">
          ${cur.enc.fields.map(f => `
            <div style="padding:10px 12px;border-radius:10px;border:1.5px solid var(--line-strong);background:var(--surface)">
              <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);font-weight:700">
                <span>${esc(f.name)} (${f.bits} bit)</span>
                <span class="mono">${esc(f.value)}</span>
              </div>
              <div class="mono" style="font-size:18px;font-weight:800;margin:4px 0;color:var(--ink-strong)">${esc(f.mean)}</div>
              <div style="font-size:12px;color:var(--muted)">${esc(f.desc)}</div>
            </div>`).join('')}
        </div>
      </div>`;
      const host = document.getElementById('cpu-bitfield-host');
      if (host) {
        StudioSVG.renderBitfieldBar(host, {
          fields: cur.enc.fields,
          activeField: state.selectedBitField,
          onSelect: (f) => { state.selectedBitField = f.name; renderCycle(); }
        });
      }
    }

    app.setTabs([
      {
        label: '微周期步骤',
        html: `
          <div class="st-pills-row">
            <span class="st-pill mint">${esc(cur.cycle)}</span>
            <span class="st-pill sand">${esc(cur.stage)}</span>
          </div>
          <h3 style="margin:4px 0">${esc(cur.asm)}</h3>
          <p style="margin:0">${esc(cur.explain)}</p>
          <div class="st-callout"><b>验证挑战题</b>点下面代码里的 <code>ADD</code> 切换成 <code>SUB</code>，把 <code>[0x04]</code> 保持 <code>3</code>，单步跑完第 2 条指令看看 <b>N（负标志）</b> 什么时候亮起？</div>
          <div class="st-diff-list">
            ${cur.diffs.map(d => `<div class="st-diff-item"><span class="st-diff-badge ${d.kind === 'add' ? 'add' : 'chg'}">${d.kind === 'add' ? '+' : '~'}</span><span>${esc(d.text)}</span></div>`).join('')}
          </div>`
      },
      {
        label: '寄存器与内存快照',
        html: `
          <h4 style="margin:0 0 6px">当前芯片锁存器快照</h4>
          <dl class="st-kv-grid">
            <dt>PC</dt><dd>${cur.snapshot.pc}</dd>
            <dt>MAR / MDR</dt><dd>${cur.snapshot.mar} / ${cur.snapshot.mdr}</dd>
            <dt>IR</dt><dd>${cur.snapshot.irHex} (${esc(cur.snapshot.ir)})</dd>
            <dt>R0 / R1 / R2</dt><dd>${cur.snapshot.regs.R0} / ${cur.snapshot.regs.R1} / ${cur.snapshot.regs.R2}</dd>
            <dt>Z / N / C</dt><dd>Z=${cur.snapshot.flags.Z} · N=${cur.snapshot.flags.N} · C=${cur.snapshot.flags.C}</dd>
            <dt>RAM [0x04]/[0x08]</dt><dd>${cur.snapshot.mem['0x04']} / ${cur.snapshot.mem['0x08']}</dd>
          </dl>`
      }
    ]);

    app.setCodePanel({
      visible: true,
      title: '点击高亮参数改写微程序',
      lines: [
        `0x00: LOAD  R1, [0x04={{mem04:${state.progParams.mem04}}}]`,
        `0x02: {{opMode:${state.progParams.opMode}}}  R1, #{{immB:${state.progParams.immB}}}`,
        `0x04: SUB   R2, R1, #2`,
        `0x06: STORE R2, [0x08]  // -> ${run.finalSnapshot.mem['0x08']}`
      ],
      activeLine: cur.instLine,
      monitor: `[${cur.cycle}] ${cur.info} | R1=${cur.snapshot.regs.R1}, R2=${cur.snapshot.regs.R2}, Z=${cur.snapshot.flags.Z}, N=${cur.snapshot.flags.N}`,
      onParamClick: (key) => {
        if (key === 'mem04') state.progParams.mem04 = state.progParams.mem04 === 3 ? 6 : state.progParams.mem04 === 6 ? 9 : 3;
        else if (key === 'opMode') state.progParams.opMode = state.progParams.opMode === 'ADD' ? 'SUB' : 'ADD';
        else if (key === 'immB') state.progParams.immB = state.progParams.immB === 5 ? 3 : state.progParams.immB === 3 ? 9 : 5;
        state.cycleIdx = 0;
        renderCycle();
      },
      onStep: () => {
        state.cycleIdx = (state.cycleIdx + 1) % run.cycles.length;
        renderCycle();
      },
      onRun: () => {
        state.cycleIdx = run.cycles.length - 1;
        app.markComplete('cycle');
        renderCycle();
      }
    });

    app.setBottomDock({
      mode: 'trace',
      traces: run.cycles,
      activeTraceId: cur.id,
      onTraceClick: (traceId) => {
        const hit = run.cycles.findIndex(c => c.id === traceId);
        if (hit >= 0) { state.cycleIdx = hit; renderCycle(); }
      }
    });
  }

  // ==================== MODULE 3: 5-STAGE PIPELINE & HAZARDS (Archetype A: Flow & Bottleneck Comparison) ====================
  function renderPipeline() {
    dispose3D();
    app.setPiP({ visible: false });
    app.setCodePanel({ visible: false });

    const sim = simulatePipeline({ mode: state.pipeMode, forwarding: state.pipeFwd });
    state.pipeHighlightCycle = Math.max(1, Math.min(sim.totalCycles, state.pipeHighlightCycle));
    if (state.pipeMode === 'pipelined' && state.pipeFwd) app.markComplete('pipeline');

    app.setKPIs([
      { label: '执行架构', value: sim.mode === 'sequential' ? '顺序非流水' : sim.forwarding ? '流水线 + 旁路' : '流水线 (无旁路)' },
      { label: '总周期 Cycles', value: `${sim.totalCycles} 拍`, level: sim.totalCycles <= 9 ? 'good' : sim.totalCycles <= 14 ? 'warn' : 'bad' },
      { label: '气泡停顿 Stalls', value: `${sim.stallCycles} 拍`, level: sim.stallCycles <= 1 ? 'good' : 'bad' },
      { label: 'CPI / 加速比', value: `${sim.cpi} / ${sim.speedup}×`, level: sim.speedup >= 2 ? 'good' : undefined }
    ]);

    app.setBannerPills([
      { text: '原型 A · 流水线时空吞吐对比', tone: 'mint' },
      { text: '点击下方周期或切换旁路对比加速效果', tone: 'steel' }
    ]);

    app.setStageViews([
      { id: 'seq', label: '1. 顺序执行 (20 拍)' },
      { id: 'nofwd', label: '2. 流水线无旁路 (14 拍)' },
      { id: 'fwd', label: '3. 流水线+数据旁路 (9 拍)' }
    ], sim.mode === 'sequential' ? 'seq' : sim.forwarding ? 'fwd' : 'nofwd', (id) => {
      if (id === 'seq') { state.pipeMode = 'sequential'; state.pipeFwd = false; }
      else if (id === 'nofwd') { state.pipeMode = 'pipelined'; state.pipeFwd = false; }
      else { state.pipeMode = 'pipelined'; state.pipeFwd = true; }
      state.pipeHighlightCycle = 1;
      renderPipeline();
    });

    app.setTransport({
      canBack: state.pipeHighlightCycle > 1,
      canNext: state.pipeHighlightCycle < sim.totalCycles,
      onBack: () => { state.pipeHighlightCycle--; renderPipeline(); },
      onNext: () => { if (state.pipeHighlightCycle < sim.totalCycles) { state.pipeHighlightCycle++; renderPipeline(); return true; } return false; },
      onStepPlay: () => { if (state.pipeHighlightCycle < sim.totalCycles) { state.pipeHighlightCycle++; renderPipeline(); return true; } return false; },
      onTogglePlay: () => {}
    });

    const stageColor = {
      IF: ['#dbeafe', '#1e40af'],
      ID: ['#fef3c7', '#92400e'],
      EX: ['#dcfce7', '#166534'],
      MEM: ['#ede9fe', '#5b21b6'],
      WB: ['#fce7f3', '#9d174d'],
      STALL: ['#fee2e2', '#b91c1c']
    };

    const vp = app.viewport();
    const cols = sim.totalCycles;
    const cellW = Math.max(36, Math.min(48, Math.floor(680 / cols)));
    const leftX = 148, topY = 58, rowH = 54;
    const svgW = leftX + cols * cellW + 30;
    const svgH = topY + sim.rows.length * rowH + 64;

    let cellsSvg = '';
    for (let c = 1; c <= cols; c++) {
      const cx = leftX + (c - 1) * cellW;
      const isCur = c === state.pipeHighlightCycle;
      cellsSvg += `<rect x="${cx}" y="22" width="${cellW - 4}" height="${sim.rows.length * rowH + 34}" rx="6" fill="${isCur ? 'var(--accent-soft)' : 'transparent'}" stroke="${isCur ? 'var(--accent)' : 'none'}" stroke-width="1.4"/>`;
      cellsSvg += `<text x="${cx + (cellW - 4) / 2}" y="42" text-anchor="middle" font-size="11" font-weight="800" font-family="monospace" fill="${isCur ? 'var(--accent)' : 'var(--muted)'}">C${c}</text>`;
    }

    sim.rows.forEach((row, rIdx) => {
      const ry = topY + rIdx * rowH;
      cellsSvg += `<text x="12" y="${ry + 24}" font-size="12" font-weight="700" font-family="monospace" fill="var(--ink-strong)">${esc(row.id)}: ${esc(row.text)}</text>`;
      row.cells.forEach((st, cIdx) => {
        if (!st) return;
        const cx = leftX + cIdx * cellW;
        const [bg, fg] = stageColor[st] || ['#eee', '#333'];
        cellsSvg += `
          <g data-pipe-cycle="${cIdx + 1}" style="cursor:pointer">
            <rect x="${cx + 1}" y="${ry + 6}" width="${cellW - 6}" height="32" rx="6" fill="${bg}" stroke="${fg}" stroke-width="${st === 'STALL' ? 1.8 : 1.3}" ${st === 'STALL' ? 'stroke-dasharray="3 2"' : ''}/>
            <text x="${cx + (cellW - 6) / 2 + 1}" y="${ry + 26}" text-anchor="middle" font-size="11" font-weight="800" font-family="monospace" fill="${fg}">${st === 'STALL' ? '气泡' : st}</text>
          </g>`;
      });
    });

    const activeAtC = sim.rows.map(r => ({ inst: r.id, stage: r.cells[state.pipeHighlightCycle - 1] })).filter(x => x.stage);
    vp.innerHTML = `<div style="width:100%;height:100%;overflow:auto;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
      <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;max-height:100%;display:block">
        ${cellsSvg}
        ${sim.forwarding && sim.mode === 'pipelined' ? `<text x="14" y="${svgH - 12}" font-size="11.5" font-weight="700" fill="var(--good)">✓ 数据旁路激活：I2 的 EX 仍等 I1 读出内存（1 拍 Load-Use 气泡），I3 与 I4 由 EX→EX 直通零等待</text>` : ''}
      </svg>
    </div>`;
    vp.querySelectorAll('[data-pipe-cycle]').forEach(el => {
      el.addEventListener('click', () => { state.pipeHighlightCycle = Number(el.dataset.pipeCycle); renderPipeline(); });
    });

    app.setTabs([
      {
        label: '架构对比与瓶颈',
        html: `
          <h3 style="margin:0 0 6px">${sim.mode === 'sequential' ? '无流水线基准 (20 拍)' : sim.forwarding ? '5 级流水线 + 数据旁路 (9 拍)' : '5 级流水线 · 无旁路 (14 拍)'}</h3>
          <p style="margin:0;color:var(--muted)">${esc(sim.summary)}</p>
          <div class="st-callout ${sim.forwarding ? 'good' : 'warn'}">
            <b>周期 C${state.pipeHighlightCycle} 同时工作的部件</b>
            ${activeAtC.length ? activeAtC.map(a => `${a.inst} 处于 ${a.stage}`).join(' · ') : '空闲'}
          </div>
          <div class="st-diff-list">
            <div class="st-diff-item"><span class="st-diff-badge chg">~</span><span>相对非流水耗时：20 拍 → ${sim.totalCycles} 拍（提速 ${sim.speedup}×）</span></div>
            <div class="st-diff-item"><span class="st-diff-badge ${sim.forwarding ? 'add' : 'chg'}">${sim.forwarding ? '+' : '~'}</span><span>硬件旁路状态：${sim.forwarding ? 'EX/MEM 与 ALU 输出直连旁路开启' : '未连旁路，必须等写回 WB'}</span></div>
          </div>`
      },
      {
        label: '数据依赖表',
        html: sim.hazards.length ? sim.hazards.map(h => `
          <div class="st-diff-item" style="flex-direction:column;gap:2px">
            <b>${esc(h.pair)} 共用寄存器 ${esc(h.reg)}</b>
            <span style="color:var(--muted)">${esc(h.resolvedBy)}</span>
          </div>`).join('') : '<p>顺序执行下前一条指令已完全结束，无并发冒险，代价是硬件部件 80% 时间空转。</p>'
      }
    ]);

    app.setBottomDock({
      mode: 'stepper',
      steps: Array.from({ length: sim.totalCycles }, (_, i) => ({ label: `C${i + 1}` })),
      currentStep: state.pipeHighlightCycle - 1,
      onStepClick: (idx) => { state.pipeHighlightCycle = idx + 1; renderPipeline(); }
    });
  }

  // ==================== MODULE 4: L1 CACHE HIT vs THRASHING (Reversible History + Bitfield Split) ====================
  function renderCache() {
    dispose3D();
    app.setPiP({ visible: false });
    app.setCodePanel({ visible: false });

    const hist = state.cacheHistory.read();
    const sim = simulateCacheAccess(hist.addrs);
    const stepIdx = Math.max(0, Math.min(sim.events.length - 1, state.cacheStep));
    state.cacheStep = stepIdx;
    const ev = sim.events[stepIdx];
    if (hist.addrs.includes(0x10) && sim.hitRate === 0) app.markComplete('cache');
    else if (sim.hits >= 2) app.markComplete('cache');

    app.setKPIs([
      { label: '命中率 Hit Rate', value: `${sim.hitRate}% (${sim.hits}/${sim.events.length})`, level: sim.hitRate > 0 ? 'good' : 'bad' },
      { label: '当前访问', value: `${ev.addrHex} (${ev.hit ? 'L1 命中' : 'Cache 缺失'})`, level: ev.hit ? 'good' : 'bad' },
      { label: '本次延迟', value: `${ev.latency} cycles`, level: ev.hit ? 'good' : 'warn' },
      { label: '平均访问耗时', value: `${sim.avgLatency} cycles` }
    ]);

    app.setBannerPills([
      { text: '原型 A + D · 4 行直接映射 L1 缓存', tone: 'violet' },
      { text: '命中 = 4 cycles · DRAM 缺失 = 100 cycles', tone: 'sand' }
    ]);

    app.setStageViews([
      { id: 'seq', label: '预设① 顺序扫描（高命中）' },
      { id: 'thrash', label: '预设② 同索引跨步（0% 抖动）' }
    ], state.cachePreset, (pId) => {
      state.cachePreset = pId;
      const addrs = pId === 'seq' ? [0x00, 0x04, 0x08, 0x0C, 0x00, 0x04] : [0x00, 0x10, 0x00, 0x10, 0x00, 0x10];
      state.cacheHistory.act({ type: 'preset', addrs });
      state.cacheStep = 0;
      renderCache();
    });

    app.setTransport({
      canBack: stepIdx > 0,
      canNext: stepIdx < sim.events.length - 1,
      onBack: () => { state.cacheStep = Math.max(0, stepIdx - 1); renderCache(); },
      onNext: () => { if (state.cacheStep < sim.events.length - 1) { state.cacheStep++; renderCache(); return true; } return false; },
      onStepPlay: () => { if (state.cacheStep < sim.events.length - 1) { state.cacheStep++; renderCache(); return true; } return false; },
      onTogglePlay: () => {}
    });

    const vp = app.viewport();
    vp.innerHTML = `<div style="padding:16px 20px;height:100%;overflow:auto;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <small style="color:var(--muted);font-weight:700">第 ${ev.step} 次访存 · 8 位地址按 Tag / Index / Offset 拆解</small>
          <div class="mono" style="font-size:19px;font-weight:800">${ev.addrHex} (二进制 ${ev.bin}) → 映射到 Set ${ev.index}</div>
        </div>
        <div class="st-pills-row">
          ${[0x00, 0x04, 0x08, 0x10].map(a => `<button type="button" class="st-btn" data-add-addr="${a}">+ 访问 0x${a.toString(16).toUpperCase().padStart(2, '0')}</button>`).join('')}
        </div>
      </div>
      <div id="cpu-cache-bits"></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
        ${ev.cacheSnapshot.map(line => {
          const hitRow = line.index === ev.index;
          return `<div style="padding:10px 12px;border-radius:10px;border:2px solid ${hitRow ? (ev.hit ? 'var(--good)' : 'var(--bad)') : 'var(--line-strong)'};background:${hitRow ? (ev.hit ? 'var(--good-bg)' : 'var(--bad-bg)') : 'var(--surface)'}">
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800">
              <span>Set ${line.index}</span>
              <span>${line.valid ? '有效 V=1' : '空行 V=0'}</span>
            </div>
            <div class="mono" style="font-size:16px;font-weight:800;margin:6px 0 2px">${line.valid ? `Tag = ${line.tag}` : '— 空 —'}</div>
            <div class="mono" style="font-size:11.5px;color:var(--muted)">${line.blockAddr !== null ? `主存块 0x${line.blockAddr.toString(16).toUpperCase().padStart(2, '0')}..` : '等待填入'}</div>
          </div>`;
        }).join('')}
      </div>
      <svg viewBox="0 0 640 132" style="width:100%;max-height:122px;display:block">
        ${StudioSVG.flowPath({ points: [[154, 64], [248, 64]], color: ev.hit ? '#16a34a' : '#dc2626', packetT: ev.hit ? 0.5 : 0.48, packetLabel: ev.hit ? 'Hit 4拍' : 'Miss!' })}
        ${StudioSVG.flowPath({ points: [[390, 64], [484, 64]], color: '#dc2626', dashed: true, active: !ev.hit, packetT: ev.hit ? null : 0.5, packetLabel: ev.hit ? '' : 'RAM 100拍' })}
        ${StudioSVG.isoBox({ x: 84, y: 64, w: 128, d: 66, h: 18, label: 'CPU 请求', sub: ev.addrHex, fillTop: '#fcd4ad', fillLeft: '#e9b787', fillRight: '#d39a65', active: true })}
        ${StudioSVG.isoBox({ x: 320, y: 64, w: 128, d: 66, h: 18, label: 'L1 Set ' + ev.index, sub: 'Tag=' + ev.tag, fillTop: ev.hit ? '#c6dfb8' : '#cbbae6', fillLeft: '#9ec48b', fillRight: '#7ca768', active: true })}
        ${StudioSVG.isoBox({ x: 556, y: 64, w: 128, d: 66, h: 18, label: '主存 DRAM', sub: '100 cycles', fillTop: '#a9c5e8', fillLeft: '#84a5cf', fillRight: '#6086b6', active: !ev.hit })}
      </svg>
    </div>`;

    const bitsHost = document.getElementById('cpu-cache-bits');
    if (bitsHost) StudioSVG.renderBitfieldBar(bitsHost, { fields: ev.bitfields });

    vp.querySelectorAll('[data-add-addr]').forEach(b => {
      b.addEventListener('click', () => {
        const addr = Number(b.dataset.addAddr);
        state.cacheHistory.act({ type: 'append', addr });
        state.cacheStep = state.cacheHistory.read().addrs.length - 1;
        renderCache();
      });
    });

    app.setTabs([
      {
        label: '命中/缺失诊断',
        html: `
          <span class="st-pill ${ev.hit ? 'good' : 'bad'}">${ev.hit ? 'L1 Cache Hit (4 周期)' : ev.evicted ? 'Conflict Miss 冲突替换 (100 周期)' : 'Cold Miss 冷缺失 (100 周期)'}</span>
          <h3 style="margin:6px 0">${esc(ev.addrHex)} 映射结果</h3>
          <p style="margin:0">${esc(ev.reason)}</p>
          <div class="st-callout ${ev.hit ? 'good' : 'warn'}"><b>为什么会发生“0% 命中抖动”？</b>因为 <code>0x00</code> (0000 00 00) 和 <code>0x10</code> (0001 00 00) 中间两位 <b>Index 全是 00</b>！每次交替访问，哪怕 Set 1/2/3 都空着，它们俩也会死磕同一行 <b>Set 0</b> 并反复互相踢出。</div>
          <div class="st-pills-row">
            <button type="button" class="st-btn" id="cache-hist-back" ${state.cacheHistory.canBack ? '' : 'disabled'}>撤销一次追加访问</button>
          </div>`
      }
    ]);
    document.getElementById('cache-hist-back')?.addEventListener('click', () => {
      state.cacheHistory.back();
      state.cacheStep = Math.max(0, state.cacheHistory.read().addrs.length - 1);
      renderCache();
    });

    app.setBottomDock({
      mode: 'stepper',
      steps: sim.events.map(e => ({ label: `${e.addrHex} (${e.hit ? '✓' : '✕'})` })),
      currentStep: stepIdx,
      onStepClick: (i) => { state.cacheStep = i; renderCache(); }
    });
  }

  function renderModule(modId) {
    if (modId === 'overview') renderOverview();
    else if (modId === 'cycle') renderCycle();
    else if (modId === 'pipeline') renderPipeline();
    else if (modId === 'cache') renderCache();
  }

  app = StudioApp.mount(config, {
    onSelectModule: (modId) => {
      if (modId === 'pipeline' || modId === 'cache') dispose3D();
      renderModule(modId);
    },
    onReset: (modId) => {
      if (modId === 'overview') {
        state.selectedPart = 'cu';
        state.ihsOpen = true;
        v3?.resetView();
      } else if (modId === 'cycle') {
        state.progParams = { mem04: 3, opMode: 'ADD', immB: 5 };
        state.cycleIdx = 0;
        state.cycleStageView = '3d';
      } else if (modId === 'pipeline') {
        state.pipeMode = 'pipelined';
        state.pipeFwd = true;
        state.pipeHighlightCycle = 1;
      } else if (modId === 'cache') {
        state.cachePreset = 'seq';
        state.cacheHistory.reset();
        state.cacheStep = 0;
      }
      renderModule(modId);
    },
    onSchemeChange: () => {
      renderModule(app.activeModuleId());
    },
    onKey: (action) => {
      if (action === 'rotL') v3?.rotateBy(0.32);
      else if (action === 'rotR') v3?.rotateBy(-0.32);
      else if (action === 'next' || action === 'prev') {
        const mod = app.activeModuleId();
        if (mod === 'cycle') {
          const max = buildExecutionTrace(state.progParams).cycles.length - 1;
          state.cycleIdx = Math.max(0, Math.min(max, state.cycleIdx + (action === 'next' ? 1 : -1)));
          renderCycle();
        } else if (mod === 'pipeline') {
          const max = simulatePipeline({ mode: state.pipeMode, forwarding: state.pipeFwd }).totalCycles;
          state.pipeHighlightCycle = Math.max(1, Math.min(max, state.pipeHighlightCycle + (action === 'next' ? 1 : -1)));
          renderPipeline();
        } else if (mod === 'cache') {
          const max = state.cacheHistory.read().addrs.length - 1;
          state.cacheStep = Math.max(0, Math.min(max, state.cacheStep + (action === 'next' ? 1 : -1)));
          renderCache();
        }
      }
    }
  });
})();

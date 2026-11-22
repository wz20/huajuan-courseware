(() => {
  const esc = s => StudioApp.esc(s);

  const state = {
    selectedPart: 'coil',
    lenz: {
      poleDown: 'N',
      turns: 40,
      speed: 2,
      stepIdx: 1
    },
    rails: {
      B: 1.0,
      L: 0.5,
      v: 4.0,
      R: 1.5,
      r: 0.5,
      stepIdx: 1
    },
    gen: {
      N: 10,
      B: 1.0,
      S: 0.2,
      omega: 5,
      RTotal: 10,
      stepIdx: 2, // Start at 90° Peak Plane or 0° Neutral Plane
      stageView: '3d' // '3d' | 'wave'
    },
    grid: {
      inputMode: 'AC',
      P0_kW: 100,
      U1_kV: 2.0,
      ratioStepUp: 10,
      RLine: 20
    }
  };

  let app = null;
  let v3 = null;
  let v3Mode = null; // 'lenz' | 'rails' | 'generator'
  let webglFailed = false;
  let sceneRefs = {};

  function dispose3D() {
    if (v3) {
      v3.dispose();
      v3 = null;
      v3Mode = null;
      sceneRefs = {};
    }
  }

  // ==================== 2D SCHEMATIC PIP FOR MODULE 1 (LENZ) ====================
  function lenzSchematicSvg(st) {
    const isDown = st.velocityDir === 'down';
    const isUp = st.velocityDir === 'up';
    const topColor = st.poleDown === 'N' ? '#2563eb' : '#dc2626';
    const botColor = st.poleDown === 'N' ? '#dc2626' : '#2563eb';
    const topText = st.poleDown === 'N' ? 'S' : 'N';
    const botText = st.poleDown;
    const magY = st.step === 0 ? 12 : st.step === 2 ? 48 : 30;
    const needleAng = Math.max(-42, Math.min(42, st.current_mA * 3.2));

    return `<svg viewBox="0 0 220 150" style="width:100%;height:auto;display:block">
      <!-- Bar Magnet -->
      <g transform="translate(46, ${magY})">
        <rect x="0" y="0" width="28" height="20" rx="3" fill="${topColor}" stroke="#1c1917" stroke-width="1.5"/>
        <rect x="0" y="20" width="28" height="20" rx="3" fill="${botColor}" stroke="#1c1917" stroke-width="1.5"/>
        <text x="14" y="14" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${topText}</text>
        <text x="14" y="34" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${botText}</text>
      </g>
      ${isDown ? `<text x="24" y="46" font-size="14" font-weight="900" fill="#16a34a">↓v</text>` : ''}
      ${isUp ? `<text x="24" y="46" font-size="14" font-weight="900" fill="#d97706">↑v</text>` : ''}
      <!-- Solenoid Coil -->
      <rect x="38" y="72" width="44" height="52" rx="6" fill="var(--sand)" stroke="#1c1917" stroke-width="1.8"/>
      <line x1="38" y1="84" x2="82" y2="84" stroke="#b45309" stroke-width="2"/>
      <line x1="38" y1="98" x2="82" y2="98" stroke="#b45309" stroke-width="2"/>
      <line x1="38" y1="112" x2="82" y2="112" stroke="#b45309" stroke-width="2"/>
      <text x="60" y="138" text-anchor="middle" font-size="9.5" font-weight="700" fill="var(--ink)">N=${st.turns}匝</text>
      <!-- Wires to Galvanometer -->
      <path d="M82,82 L156,82 M82,114 L156,114" stroke="#1c1917" stroke-width="1.6" fill="none"/>
      <!-- Galvanometer G -->
      <circle cx="168" cy="98" r="26" fill="var(--surface-2)" stroke="#1c1917" stroke-width="1.8"/>
      <text x="168" y="116" text-anchor="middle" font-size="10" font-weight="800" fill="var(--ink)">G (mA)</text>
      <line x1="168" y1="102" x2="${(168 + 18 * Math.sin((needleAng * Math.PI) / 180)).toFixed(1)}" y2="${(102 - 18 * Math.cos((needleAng * Math.PI) / 180)).toFixed(1)}" stroke="#dc2626" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="168" cy="102" r="2.5" fill="#1c1917"/>
    </svg>`;
  }

  // ==================== 3D SCENE 1: LENZ'S LAW WORKBENCH ====================
  function ensureLenzScene3D(container, st) {
    if (webglFailed) return false;
    if (!v3 || v3Mode !== 'lenz') {
      dispose3D();
      container.innerHTML = '';
      v3 = Studio3D.createViewport(container, {
        cameraPos: [4.8, 3.8, 5.2],
        target: [0.25, 0.65, 0],
        onSelectPart: (id) => {
          state.selectedPart = id;
          renderLenz();
        },
        onFallback: () => { webglFailed = true; }
      });
      if (!v3) return false;
      v3Mode = 'lenz';

      const { scene, prefabs, primitives, textures, registerPickable } = v3;

      // Optical bench table base with ruler grid
      const benchTex = textures.microGrid({
        bg: '#1c2430',
        majorColor: 'rgba(255,255,255,0.14)',
        minorColor: 'rgba(255,255,255,0.05)',
        style: 'ruler'
      });
      const bench = primitives.chamferBox(6.4, 0.18, 4.0, {
        chamfer: 0.2,
        color: 0x1e293b,
        topTexture: benchTex
      });
      bench.position.set(0.25, -0.09, 0);
      scene.add(bench);

      // 1. Multi-turn Helical Copper Solenoid
      const coil = prefabs.coilSolenoid({
        radius: 0.78,
        height: 1.38,
        turns: 7,
        wireRadius: 0.048,
        wireColor: 0xd97706
      });
      coil.position.set(-0.95, 0.72, 0);
      scene.add(coil);
      registerPickable(coil, 'coil');

      // 2. Center-Zero Galvanometer Console on the right
      const meter = prefabs.analogMeter({
        w: 1.48,
        h: 1.25,
        d: 0.88,
        color: 0x0f172a,
        title: '灵敏电流计 G',
        unit: 'mA',
        maxAbs: 20
      });
      meter.position.set(1.65, 0.0, 0);
      scene.add(meter);
      registerPickable(meter, 'meter');

      // Connecting 3D curved jumper cables between coil binding posts and galvanometer
      const wireRed = primitives.curvedTube([
        [-1.31, 0.14, 0.86],
        [-0.1, 0.42, 1.15],
        [1.23, 0.42, 0.32]
      ], { radius: 0.036, color: 0xdc2626 });
      const wireBlue = primitives.curvedTube([
        [-0.59, 0.14, 0.86],
        [0.45, 0.25, 0.92],
        [2.05, 0.42, 0.32]
      ], { radius: 0.036, color: 0x2563eb });
      scene.add(wireRed, wireBlue);

      // Velocity & Induced Force 3D Vector Arrows
      const velArrow = prefabs.vectorArrow3D({ length: 0.85, radius: 0.045, color: 0x16a34a });
      const forceArrow = prefabs.vectorArrow3D({ length: 0.85, radius: 0.048, color: 0x9333ea });
      scene.add(velArrow, forceArrow);

      sceneRefs = { coil, meter, velArrow, forceArrow, magnet: null, poleDown: null };
    }

    // Rebuild or reposition bar magnet if polarity changed
    if (!sceneRefs.magnet || sceneRefs.poleDown !== st.poleDown) {
      if (sceneRefs.magnet) v3.scene.remove(sceneRefs.magnet);
      const magnet = v3.prefabs.magnetPole({
        type: 'bar',
        w: 0.56,
        h: 1.42,
        d: 0.56,
        northDown: st.poleDown === 'N'
      });
      v3.scene.add(magnet);
      v3.registerPickable(magnet, 'magnet');
      sceneRefs.magnet = magnet;
      sceneRefs.poleDown = st.poleDown;
    }

    sceneRefs.magnet.position.set(-0.95, st.magnetY + 0.65, 0);
    sceneRefs.meter.userData.setValue(st.current_mA);

    // Update 3D vector arrows (Velocity v & Ampere Repulsion/Attraction Force F)
    if (st.velocityDir === 'down') {
      sceneRefs.velArrow.position.set(-1.68, st.magnetY + 0.95, 0);
      sceneRefs.velArrow.userData.setDirection([0, -1, 0], 1.0);
      sceneRefs.forceArrow.position.set(-0.22, st.magnetY + 0.45, 0);
      sceneRefs.forceArrow.userData.setDirection([0, 1, 0], 1.0);
    } else if (st.velocityDir === 'up') {
      sceneRefs.velArrow.position.set(-1.68, st.magnetY + 0.35, 0);
      sceneRefs.velArrow.userData.setDirection([0, 1, 0], 1.0);
      sceneRefs.forceArrow.position.set(-0.22, st.magnetY + 0.95, 0);
      sceneRefs.forceArrow.userData.setDirection([0, -1, 0], 1.0);
    } else {
      sceneRefs.velArrow.userData.setDirection([0, 1, 0], 0);
      sceneRefs.forceArrow.userData.setDirection([0, 1, 0], 0);
    }

    v3.anchorCallouts([
      { id: 'magnet', label: `条形磁铁 (${st.poleDown}极朝下)`, color: '#dc2626', pos: [-0.95, st.magnetY + 1.35, 0], dx: -26, dy: -36 },
      { id: 'coil', label: `螺线管 (${st.turns}匝)`, color: '#d97706', pos: [-0.95, 0.55, 0.85], dx: -18, dy: 42 },
      { id: 'meter', label: `电流计 (${st.needleDeflect})`, color: '#0f766e', pos: [1.65, 1.15, 0], dx: 24, dy: -36 }
    ]);
    v3.setActivePart(state.selectedPart);

    // Animate current pulse beads when induced current is non-zero
    if (Math.abs(st.current_mA) > 0.01) {
      const forward = st.current_mA > 0;
      const pts = [[-1.31, 0.14, 0.86], [-0.1, 0.42, 1.15], [1.23, 0.42, 0.32]];
      v3.setSignalPulses([{
        points: forward ? pts : [...pts].reverse(),
        color: 0xfacc15,
        count: 3,
        speed: Math.min(2.2, 0.6 + Math.abs(st.current_mA) * 0.12)
      }]);
    } else {
      v3.setSignalPulses([]);
    }
    return true;
  }

  function renderLenz() {
    const sim = simulateLenzLaw(state.lenz);
    const cur = sim.current;
    if (cur.step === 2 || cur.step === 4) app.markComplete('lenz');

    app.setKPIs([
      { label: '穿过磁通量 Φ', value: `${cur.flux_mWb} mWb`, level: cur.step === 2 ? 'warn' : undefined },
      { label: '变化率 ΔΦ/Δt', value: `${cur.dFluxRate} mWb/s`, level: cur.dFluxRate === 0 ? 'warn' : 'good' },
      { label: '感应电动势 E', value: `${cur.emf_V} V`, level: cur.emf_V > 0 ? 'good' : undefined },
      { label: '电流计读数 I', value: cur.needleDeflect, level: cur.current_mA === 0 ? 'warn' : 'good' }
    ]);

    app.setBannerPills([
      { text: '必修三/选修二核心 · 楞次定律（来拒去留 · 增反减同）', tone: 'sand' },
      { text: `当前状态：${cur.title}`, tone: cur.current_mA === 0 ? 'violet' : 'mint' }
    ]);

    app.setStageViews([], '', null);

    app.setTransport({
      canBack: cur.step > 0,
      canNext: cur.step < sim.stages.length - 1,
      onBack: () => { state.lenz.stepIdx = Math.max(0, cur.step - 1); renderLenz(); },
      onNext: () => {
        if (state.lenz.stepIdx < sim.stages.length - 1) {
          state.lenz.stepIdx++;
          renderLenz();
          return true;
        }
        return false;
      },
      onStepPlay: () => {
        if (state.lenz.stepIdx < sim.stages.length - 1) {
          state.lenz.stepIdx++;
          renderLenz();
          return true;
        }
        return false;
      },
      onTogglePlay: () => {}
    });

    const vp = app.viewport();
    if (!ensureLenzScene3D(vp, cur)) {
      vp.innerHTML = `<div style="padding:20px">${lenzSchematicSvg(cur)}</div>`;
    }

    app.setPiP({
      visible: true,
      title: '2D 电磁感应回路同步图',
      html: lenzSchematicSvg(cur)
    });

    app.setTabs([
      {
        label: '楞次判向步骤',
        html: `
          <span class="st-pill ${cur.dFluxRate === 0 ? 'warn' : 'good'}">${esc(cur.ruleTag)}</span>
          <h3 style="margin:6px 0">${esc(cur.title)}</h3>
          <dl class="st-kv-grid">
            <dt>① 原磁场 B原 方向</dt><dd>${esc(cur.bOrigDir)}</dd>
            <dt>② 磁通量 Φ 变化</dt><dd>${esc(cur.fluxTrend)}</dd>
            <dt>③ 感应磁场 B感 方向</dt><dd>${esc(cur.bIndDir)}</dd>
            <dt>④ 线圈上端等效磁极</dt><dd>${esc(cur.coilTopPole)}</dd>
            <dt>⑤ 磁铁所受安培力</dt><dd>${esc(cur.forceOnMagnet)}</dd>
          </dl>
          <div class="st-callout ${cur.step === 2 ? 'warn' : 'good'}">
            <b>高考易错点警示</b>
            在第 3 步“线圈正中心悬停”时，磁通量达到最大值 <code>Φ = 8.8 mWb</code>，但因为速度 <code>v = 0</code>，<b>磁通量变化率 ΔΦ/Δt = 0</b>，所以感应电流严格为 <b>0 mA</b>！
          </div>`
      },
      {
        label: '四步判向口诀',
        html: `
          <h4 style="margin:0 0 6px">楞次定律标准解题四步法</h4>
          <div class="st-diff-list">
            <div class="st-diff-item"><span class="st-diff-badge add">1</span><span>明确原磁场 <b>B原</b> 的方向（N 极向下则 B原 向下）</span></div>
            <div class="st-diff-item"><span class="st-diff-badge add">2</span><span>判断磁通量 <b>Φ</b> 是增大还是减小</span></div>
            <div class="st-diff-item"><span class="st-diff-badge chg">3</span><span>按<b>“增反减同”</b>确定感应电流磁场 <b>B感</b> 的方向</span></div>
            <div class="st-diff-item"><span class="st-diff-badge add">4</span><span>用<b>安培定则（右手螺旋定则）</b>判定感应电流流向</span></div>
          </div>`
      }
    ]);

    app.setCodePanel({
      visible: true,
      title: '点击参数芯片改写实验条件',
      lines: [
        `const poleDown = "{{poleDown:${cur.poleDown}极朝下}}"; // 点击翻转 N/S 极`,
        `const N_turns  = {{turns:${cur.turns}}} 匝, speed = {{speed:${cur.speed}}} m/s;`,
        `const E = N * |ΔΦ/Δt| = ${cur.emf_V} V -> I = ${cur.current_mA} mA;`
      ],
      activeLine: 3,
      monitor: `[步骤 ${cur.step + 1}/5] ${cur.actionLabel} | Φ=${cur.flux_mWb}mWb, ΔΦ/Δt=${cur.dFluxRate}mWb/s, 指针:${cur.needleDeflect}`,
      onParamClick: (key) => {
        if (key === 'poleDown') state.lenz.poleDown = state.lenz.poleDown === 'N' ? 'S' : 'N';
        else if (key === 'turns') state.lenz.turns = state.lenz.turns === 40 ? 80 : state.lenz.turns === 80 ? 20 : 40;
        else if (key === 'speed') state.lenz.speed = state.lenz.speed >= 4 ? 1 : state.lenz.speed + 1;
        renderLenz();
      },
      onStep: () => {
        state.lenz.stepIdx = (state.lenz.stepIdx + 1) % sim.stages.length;
        renderLenz();
      },
      onRun: () => {
        state.lenz.stepIdx = 2; // Jump to the famous Center Zero-Current state
        renderLenz();
      }
    });

    app.setBottomDock({
      mode: 'stepper',
      steps: sim.stages.map(s => ({ label: s.title })),
      currentStep: cur.step,
      onStepClick: (idx) => { state.lenz.stepIdx = idx; renderLenz(); }
    });
  }

  // ==================== 3D SCENE 2: PARALLEL RAILS CUTTING FLUX (E = BLv) ====================
  function ensureRailsScene3D(container, sim) {
    if (webglFailed) return false;
    if (!v3 || v3Mode !== 'rails') {
      dispose3D();
      container.innerHTML = '';
      v3 = Studio3D.createViewport(container, {
        cameraPos: [4.6, 4.3, 5.1],
        target: [0.1, 0.3, 0],
        onFallback: () => { webglFailed = true; }
      });
      if (!v3) return false;
      v3Mode = 'rails';

      const { scene, prefabs, primitives, textures } = v3;

      const base = primitives.chamferBox(6.6, 0.16, 4.0, {
        chamfer: 0.2,
        color: 0x1e293b,
        topTexture: textures.microGrid({ bg: '#192230', style: 'ruler' })
      });
      base.position.set(0.1, -0.08, 0);
      scene.add(base);

      // Two parallel brushed-steel guide rails (M-N and P-Q)
      const railGeo = new THREE.BoxGeometry(4.4, 0.1, 0.12);
      const railBack = v3.createToonMesh(railGeo, 0xcbd5e1, { metalness: 0.55, roughness: 0.25 });
      railBack.position.set(0.25, 0.06, -1.05);
      const railFront = v3.createToonMesh(railGeo, 0xcbd5e1, { metalness: 0.55, roughness: 0.25 });
      railFront.position.set(0.25, 0.06, 1.05);
      scene.add(railBack, railFront);

      // Left closing bridge + external load resistor R + Voltmeter V
      const leftWire = v3.createToonMesh(new THREE.BoxGeometry(0.1, 0.1, 2.2), 0xd97706);
      leftWire.position.set(-1.92, 0.06, 0);
      scene.add(leftWire);

      const loadResistor = prefabs.icPackage({
        w: 0.62,
        h: 0.26,
        d: 0.96,
        color: 0xb45309,
        title: '外电阻 R',
        subtitle: 'LOAD',
        tag: 'R',
        pinsPerSide: 3
      });
      loadResistor.position.set(-1.92, 0.2, 0);
      scene.add(loadResistor);

      const voltmeter = prefabs.analogMeter({
        w: 1.15,
        h: 0.95,
        d: 0.72,
        color: 0x0f172a,
        title: '路端电压表 V',
        unit: 'V',
        maxAbs: 8
      });
      voltmeter.position.set(-1.95, 0.0, -1.55);
      scene.add(voltmeter);

      // Uniform vertical magnetic field B arrow grid (pointing downward -Y)
      for (let gx = -1.0; gx <= 1.4; gx += 0.8) {
        for (let gz = -0.65; gz <= 0.65; gz += 0.65) {
          const bArr = prefabs.vectorArrow3D({ length: 0.95, radius: 0.025, color: 0x38bdf8 });
          bArr.position.set(gx, 1.05, gz);
          bArr.userData.setDirection([0, -1, 0], 0.9);
          scene.add(bArr);
        }
      }

      // Sliding golden-copper conductor bar ab
      const barGrp = new THREE.Group();
      const barRod = primitives.chamferBox(0.22, 0.18, 2.46, {
        chamfer: 0.04,
        color: 0xf59e0b,
        label: {
          width: 128,
          height: 360,
          bg: '#78350f',
          fg: '#fef3c7',
          accent: '#facc15',
          title: 'a',
          footer: 'b',
          grid: false
        }
      });
      barRod.position.y = 0.18;
      barGrp.add(barRod);

      // 3D Vector Arrows attached to conductor bar: Velocity v (+X), Current I (-Z: b->a), Ampere Force F_amp (-X)
      const vArr = prefabs.vectorArrow3D({ length: 0.95, radius: 0.045, color: 0x16a34a });
      vArr.position.set(0.15, 0.22, 0);
      const iArr = prefabs.vectorArrow3D({ length: 0.95, radius: 0.042, color: 0xea580c });
      iArr.position.set(0, 0.34, 0.45);
      const fArr = prefabs.vectorArrow3D({ length: 0.95, radius: 0.048, color: 0xdc2626 });
      fArr.position.set(-0.15, 0.22, 0);
      barGrp.add(vArr, iArr, fArr);
      scene.add(barGrp);

      sceneRefs = { barGrp, vArr, iArr, fArr, voltmeter };
    }

    const bx = sim.currentStep.barX;
    sceneRefs.barGrp.position.x = bx;
    sceneRefs.voltmeter.userData.setValue(sim.U);

    sceneRefs.vArr.userData.setDirection([1, 0, 0], Math.min(1.4, sim.v / 3.5));
    sceneRefs.iArr.userData.setDirection([0, 0, -1], Math.min(1.3, sim.I / 1.2));
    sceneRefs.fArr.userData.setDirection([-1, 0, 0], Math.min(1.4, sim.FAmp / 0.6));

    v3.anchorCallouts([
      { id: 'bar', label: `导体棒 ab (v=${sim.v}m/s →)`, color: '#16a34a', pos: [bx, 0.42, 0], dx: 24, dy: -42 },
      { id: 'famp', label: `← 安培力 F安=${sim.FAmp}N`, color: '#dc2626', pos: [bx - 0.65, 0.28, 0.4], dx: -32, dy: 38 },
      { id: 'load', label: `外电阻 R=${sim.R}Ω (U=${sim.U}V)`, color: '#d97706', pos: [-1.92, 0.45, 0], dx: -16, dy: -36 }
    ]);

    if (sim.I > 0.01) {
      // Counter-clockwise current loop: b(+Z) -> a(-Z) -> left rail(-Z) -> R -> front rail(+Z)
      v3.setSignalPulses([{
        points: [
          [bx, 0.18, 1.05],
          [bx, 0.18, -1.05],
          [-1.92, 0.18, -1.05],
          [-1.92, 0.18, 1.05],
          [bx, 0.18, 1.05]
        ],
        color: 0xfacc15,
        count: 4,
        speed: Math.min(2.0, 0.5 + sim.I * 0.4)
      }]);
    } else {
      v3.setSignalPulses([]);
    }
    return true;
  }

  function renderRails() {
    const sim = simulateRailCutting(state.rails);
    if (sim.stepIdx === sim.timeSteps.length - 1) app.markComplete('rails');

    app.setKPIs([
      { label: '动生电动势 E=BLv', value: `${sim.E} V`, level: 'good' },
      { label: '路端电压 U=IR', value: `${sim.U} V`, level: 'warn' },
      { label: '回路电流 I', value: `${sim.I} A` },
      { label: '安培阻力 F安=BIL', value: `${sim.FAmp} N`, level: 'bad' },
      { label: '功率 P机 = P电', value: `${sim.PMech} W`, level: 'good' }
    ]);

    app.setBannerPills([
      { text: '高考压轴模型 · 双轨切割磁感线', tone: 'sand' },
      { text: `累计通过电荷量 q = ΔΦ/(R+r) = ${sim.currentStep.charge_C} C`, tone: 'mint' }
    ]);

    app.setStageViews([], '', null);
    app.setPiP({ visible: false });

    app.setTransport({
      canBack: sim.stepIdx > 0,
      canNext: sim.stepIdx < sim.timeSteps.length - 1,
      onBack: () => { state.rails.stepIdx = Math.max(0, sim.stepIdx - 1); renderRails(); },
      onNext: () => {
        if (state.rails.stepIdx < sim.timeSteps.length - 1) {
          state.rails.stepIdx++;
          renderRails();
          return true;
        }
        return false;
      },
      onStepPlay: () => {
        if (state.rails.stepIdx < sim.timeSteps.length - 1) {
          state.rails.stepIdx++;
          renderRails();
          return true;
        }
        return false;
      },
      onTogglePlay: () => {}
    });

    const vp = app.viewport();
    ensureRailsScene3D(vp, sim);

    app.setTabs([
      {
        label: '矢量与能量守恒',
        html: `
          <span class="st-pill good">P机械 (${sim.PMech} W) === P焦耳热 (${sim.PElec} W)</span>
          <h3 style="margin:6px 0">导体棒 ab 受力与电路分析</h3>
          <dl class="st-kv-grid">
            <dt>感应电流方向</dt><dd>${esc(sim.currentDir)}</dd>
            <dt>安培力 F安 方向</dt><dd>${esc(sim.ampForceDir)}</dd>
            <dt>电源电动势 E</dt><dd>${sim.E} V（导体棒相当于内阻 r=${sim.r}Ω 的电源）</dd>
            <dt>电压表读数 U</dt><dd>${sim.U} V（测外电阻 R 两端路端电压，U &lt; E）</dd>
            <dt>外力功率 → 电热</dt><dd>外电阻发热 ${sim.PExt} W + 棒内阻发热 ${(sim.PElec - sim.PExt).toFixed(3)} W</dd>
          </dl>
          <div class="st-callout warn">
            <b>高考必考辨析：电压表测的是 U 还是 E？</b>
            切割磁感线的导体棒 ab 本身是<b>含内阻 r = ${sim.r} Ω 的电源</b>！并联在导轨两端的电压表测的是外电路电阻 R 的<b>路端电压 U = ${sim.U} V</b>，绝不是总电动势 E = ${sim.E} V！
          </div>`
      }
    ]);

    app.setCodePanel({
      visible: true,
      title: '点击参数芯片验证 E=BLv 与 F安=B²L²v/(R+r)',
      lines: [
        `const B = {{B:${sim.B}}} T, L = 0.5 m, v = {{v:${sim.v}}} m/s;`,
        `const R = {{R:${sim.R}}} Ω, r = 0.5 Ω; // 总电阻 ${sim.RTotal} Ω`,
        `const E = B*L*v = ${sim.E} V, U = ${sim.U} V, F_amp = ${sim.FAmp} N;`
      ],
      activeLine: 3,
      monitor: `[t=${sim.currentStep.time_s}s] 位移 Δx=${sim.currentStep.dx_m}m | ΔΦ=${sim.currentStep.dPhi_Wb}Wb | 感应电荷量 q=${sim.currentStep.charge_C}C`,
      onParamClick: (key) => {
        if (key === 'B') state.rails.B = state.rails.B === 1.0 ? 2.0 : state.rails.B === 2.0 ? 0.5 : 1.0;
        else if (key === 'v') state.rails.v = state.rails.v >= 6 ? 2 : state.rails.v + 2;
        else if (key === 'R') state.rails.R = state.rails.R === 1.5 ? 3.5 : 1.5;
        renderRails();
      },
      onStep: () => {
        state.rails.stepIdx = (state.rails.stepIdx + 1) % sim.timeSteps.length;
        renderRails();
      },
      onRun: () => {
        state.rails.stepIdx = sim.timeSteps.length - 1;
        renderRails();
      }
    });

    app.setBottomDock({
      mode: 'stepper',
      steps: sim.timeSteps.map(t => ({ label: `t=${t.time_s}s (q=${t.charge_C}C)` })),
      currentStep: sim.stepIdx,
      onStepClick: (idx) => { state.rails.stepIdx = idx; renderRails(); }
    });
  }

  // ==================== 3D SCENE 3: AC GENERATOR & NEUTRAL PLANE ====================
  function ensureGeneratorScene3D(container, sim) {
    if (webglFailed) return false;
    if (!v3 || v3Mode !== 'generator') {
      dispose3D();
      container.innerHTML = '';
      v3 = Studio3D.createViewport(container, {
        cameraPos: [4.7, 3.6, 5.2],
        target: [0, 0.55, 0.2],
        onFallback: () => { webglFailed = true; }
      });
      if (!v3) return false;
      v3Mode = 'generator';

      const { scene, prefabs, primitives, textures } = v3;

      const base = primitives.chamferBox(6.4, 0.16, 4.2, {
        chamfer: 0.2,
        color: 0x1e293b,
        topTexture: textures.microGrid({ bg: '#192230', style: 'pcb' })
      });
      base.position.set(0, -0.08, 0.2);
      scene.add(base);

      // Left North Pole Shoe (Red) & Right South Pole Shoe (Blue)
      const nShoe = prefabs.magnetPole({ type: 'poleShoe', polarity: 'N', w: 0.95, h: 1.45, d: 1.75 });
      nShoe.position.set(-2.05, 0.72, -0.15);
      const sShoe = prefabs.magnetPole({ type: 'poleShoe', polarity: 'S', w: 0.95, h: 1.45, d: 1.75 });
      sShoe.position.set(2.05, 0.72, -0.15);
      scene.add(nShoe, sShoe);

      // Horizontal Magnetic Flux Lines (N -> S along +X)
      for (const yPos of [0.42, 0.75, 1.08]) {
        const bLine = prefabs.vectorArrow3D({ length: 2.6, radius: 0.018, color: 0x38bdf8 });
        bLine.position.set(-1.3, yPos, -0.15);
        bLine.userData.setDirection([1, 0, 0], 1.0);
        scene.add(bLine);
      }

      // Rotating Rectangular Armature Coil Pivot (rotates around Z axis: θ=0 is vertical Neutral Plane ⊥ B!)
      const armaturePivot = new THREE.Group();
      armaturePivot.position.set(0, 0.75, -0.15);

      // At θ=0 (Neutral Plane), coil plane is in YZ plane (normal along X, parallel to B!)
      // Side ab at top (+Y), side cd at bottom (-Y)
      const sideAB = primitives.curvedTube([[0, 0.65, -0.68], [0, 0.65, 0.68]], { radius: 0.06, color: 0xf97316, caps: true });
      const sideCD = primitives.curvedTube([[0, -0.65, -0.68], [0, -0.65, 0.68]], { radius: 0.06, color: 0x14b8a6, caps: true });
      const backBar = primitives.curvedTube([[0, -0.65, -0.68], [0, 0.65, -0.68]], { radius: 0.048, color: 0xd97706, caps: false });
      const frontBar1 = primitives.curvedTube([[0, 0.65, 0.68], [0, 0.14, 0.68]], { radius: 0.048, color: 0xd97706, caps: false });
      const frontBar2 = primitives.curvedTube([[0, -0.65, 0.68], [0, -0.14, 0.68]], { radius: 0.048, color: 0xd97706, caps: false });
      armaturePivot.add(sideAB, sideCD, backBar, frontBar1, frontBar2);
      scene.add(armaturePivot);

      // Coaxial Gold Slip Rings (铜滑环) & Dark Carbon Brushes (电刷) at front (+Z)
      const ringGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 20);
      for (const rz of [0.75, 1.02]) {
        const ring = v3.createToonMesh(ringGeo, 0xeab308, { metalness: 0.65, roughness: 0.25 });
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, 0.75, rz);
        scene.add(ring);
        const brush = primitives.chamferBox(0.22, 0.18, 0.16, { chamfer: 0.03, color: 0x334155 });
        brush.position.set(0.32, 0.75, rz);
        scene.add(brush);
      }

      // External AC Meter on front-right
      const acMeter = prefabs.analogMeter({
        w: 1.35,
        h: 1.05,
        d: 0.76,
        color: 0x0f172a,
        title: '交变电动势 e(t)',
        unit: 'V',
        maxAbs: 20
      });
      acMeter.position.set(1.75, 0.0, 1.25);
      scene.add(acMeter);

      sceneRefs = { armaturePivot, acMeter };
    }

    const cur = sim.current;
    // Rotate armature around Z axis: θ=0° is vertical (Neutral Plane ⊥ B), θ=90° is horizontal (Peak Plane ∥ B)
    sceneRefs.armaturePivot.rotation.z = -cur.angleRad;
    sceneRefs.acMeter.userData.setValue(cur.emf);

    v3.anchorCallouts([
      { id: 'n', label: 'N 极磁靴 (B →)', color: '#dc2626', pos: [-2.05, 1.48, -0.15], dx: -16, dy: -32 },
      { id: 'coil', label: `电枢线圈 (θ=${cur.angleDeg}° · ${cur.isNeutralPlane ? '中性面' : cur.isPeakPlane ? '峰值面' : '切割中'})`, color: '#f97316', pos: [0, 1.42, -0.15], dx: 0, dy: -38 },
      { id: 'meter', label: `瞬时电动势 e=${cur.emf}V`, color: '#0f766e', pos: [1.75, 1.05, 1.25], dx: 18, dy: -32 }
    ]);
    return true;
  }

  function renderGenerator() {
    const sim = simulateACGenerator(state.gen);
    const cur = sim.current;
    if (cur.step >= 4) app.markComplete('generator');

    app.setKPIs([
      { label: '转角 θ (自中性面)', value: `${cur.angleDeg}°`, level: cur.isNeutralPlane ? 'warn' : 'good' },
      { label: '磁通量 Φ=BS·cosθ', value: `${cur.flux} Wb`, level: cur.isNeutralPlane ? 'good' : undefined },
      { label: '瞬时电动势 e=Em·sinθ', value: `${cur.emf} V`, level: cur.isPeakPlane ? 'good' : cur.isNeutralPlane ? 'warn' : undefined },
      { label: '峰值 Em / 有效值 E', value: `${sim.Em} / ${sim.ERms} V` }
    ]);

    app.setBannerPills([
      { text: cur.planeType, tone: cur.isNeutralPlane ? 'sand' : cur.isPeakPlane ? 'mint' : 'steel' },
      { text: cur.dirChangeNotice, tone: cur.isNeutralPlane ? 'violet' : 'mint' }
    ]);

    app.setStageViews([
      { id: '3d', label: '3D 发电机旋转剖面' },
      { id: 'wave', label: 'Φ(θ) 与 e(θ) 正交波形图' }
    ], state.gen.stageView, (vId) => {
      state.gen.stageView = vId;
      if (vId !== '3d') dispose3D();
      renderGenerator();
    });

    app.setPiP({ visible: false });

    app.setTransport({
      canBack: cur.step > 0,
      canNext: cur.step < sim.frames.length - 1,
      onBack: () => { state.gen.stepIdx = Math.max(0, cur.step - 1); renderGenerator(); },
      onNext: () => {
        if (state.gen.stepIdx < sim.frames.length - 1) {
          state.gen.stepIdx++;
          renderGenerator();
          return true;
        }
        return false;
      },
      onStepPlay: () => {
        if (state.gen.stepIdx < sim.frames.length - 1) {
          state.gen.stepIdx++;
          renderGenerator();
          return true;
        }
        return false;
      },
      onTogglePlay: () => {}
    });

    const vp = app.viewport();
    if (state.gen.stageView === '3d') {
      ensureGeneratorScene3D(vp, sim);
    } else {
      dispose3D();
      vp.innerHTML = `<div style="padding:18px 22px;height:100%;overflow:auto;display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <small style="color:var(--muted);font-weight:700">磁通量 Φ(θ)=BS·cosθ 与 感应电动势 e(θ)=NBSω·sinθ 的 90° 相位差</small>
            <div class="mono" style="font-size:18px;font-weight:800">当前角度 θ = ${cur.angleDeg}° · ${esc(cur.planeType)}</div>
          </div>
          <span class="st-pill ${cur.isNeutralPlane ? 'warn' : 'good'}">Φ = ${cur.flux} Wb · e = ${cur.emf} V</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px">
          <div style="padding:12px;border-radius:10px;border:1.5px solid var(--line-strong);background:var(--surface)">
            ${StudioSVG.renderMiniPlot({ values: sim.fluxCurve, min: -sim.PhiMax, max: sim.PhiMax, color: '#2563eb', label: `磁通量 Φ(θ) [峰值 ±${sim.PhiMax} Wb]` })}
          </div>
          <div style="padding:12px;border-radius:10px;border:1.5px solid var(--line-strong);background:var(--surface)">
            ${StudioSVG.renderMiniPlot({ values: sim.emfCurve, min: -sim.Em, max: sim.Em, color: '#ea580c', label: `感应电动势 e(θ) [峰值 ±${sim.Em} V]` })}
          </div>
        </div>
        <div class="st-callout ${cur.isNeutralPlane ? 'warn' : 'good'}">
          <b>为什么 Φ 与 e 总是“此消彼长”？</b>
          因为 <code>e(t) = -N · dΦ/dt</code> 是磁通量曲线的<b>斜率（导数）</b>！在中性面（0°/180°）余弦曲线处于波峰/波谷，切线水平（斜率为 0 → e = 0）；在 90°/270° 余弦曲线过零点最陡峭，切线斜率最大（|e| = Em）！
        </div>
      </div>`;
    }

    app.setTabs([
      {
        label: '中性面 vs 峰值面',
        html: `
          <span class="st-pill ${cur.isNeutralPlane ? 'warn' : cur.isPeakPlane ? 'good' : 'steel'}">${esc(cur.planeType)}</span>
          <h3 style="margin:6px 0">θ = ${cur.angleDeg}° 瞬时物理量</h3>
          <p style="margin:0">${esc(cur.keyPoint)}</p>
          <dl class="st-kv-grid">
            <dt>瞬时磁通量 Φ</dt><dd>${cur.flux} Wb (最大 Φm = ${sim.PhiMax} Wb)</dd>
            <dt>磁通变化率 ΔΦ/Δt</dt><dd>${cur.dFluxRate} Wb/s</dd>
            <dt>瞬时电动势 e</dt><dd>${cur.emf} V (峰值 Em = ${sim.Em} V)</dd>
            <dt>有效值 E / I</dt><dd>E = Em/√2 = ${sim.ERms} V · I = ${sim.IRms} A</dd>
          </dl>`
      }
    ]);

    app.setCodePanel({
      visible: true,
      title: '点击参数芯片修改发电机匝数 N 与角速度 ω',
      lines: [
        `const N = {{N:${sim.N}}} 匝, B = 1.0 T, S = 0.2 m², ω = {{omega:${sim.omega}}} rad/s;`,
        `const Em = N*B*S*ω = ${sim.Em} V, E_rms = Em/√2 = ${sim.ERms} V;`,
        `const e(${cur.angleDeg}°) = Em * sin(${cur.angleDeg}°) = ${cur.emf} V;`
      ],
      activeLine: 3,
      monitor: `[θ=${cur.angleDeg}°] ${cur.planeType} | Φ=${cur.flux}Wb, e=${cur.emf}V | ${cur.dirChangeNotice}`,
      onParamClick: (key) => {
        if (key === 'N') state.gen.N = state.gen.N === 10 ? 20 : 10;
        else if (key === 'omega') state.gen.omega = state.gen.omega === 5 ? 10 : 5;
        renderGenerator();
      },
      onStep: () => {
        state.gen.stepIdx = (state.gen.stepIdx + 1) % sim.frames.length;
        renderGenerator();
      },
      onRun: () => {
        // Toggle between Neutral Plane (0°) and Peak Plane (90°)
        state.gen.stepIdx = state.gen.stepIdx === 0 ? 2 : 0;
        renderGenerator();
      }
    });

    app.setBottomDock({
      mode: 'stepper',
      steps: sim.frames.map(f => ({ label: `${f.angleDeg}°${f.isNeutralPlane ? '(中性面)' : f.isPeakPlane ? '(峰值)' : ''}` })),
      currentStep: cur.step,
      onStepClick: (idx) => { state.gen.stepIdx = idx; renderGenerator(); }
    });
  }

  // ==================== MODULE 4: IDEAL TRANSFORMER & HIGH-VOLTAGE GRID ====================
  function renderTransformer() {
    dispose3D();
    const sim = simulatePowerGrid(state.grid);
    app.markComplete('transformer');

    app.setKPIs([
      { label: '输入电源模式', value: sim.inputMode === 'AC' ? `交变 AC ${sim.U1_kV} kV` : '稳恒直流 DC', level: sim.inputMode === 'DC' ? 'bad' : 'good' },
      { label: '升压输出 U2', value: `${sim.U2_kV} kV (${sim.ratioStepUp}×)`, level: sim.U2_kV > 0 ? 'good' : 'bad' },
      { label: '输电线电流 I线', value: `${sim.ILine_A} A` },
      { label: '线损功率 ΔP=I²R', value: `${sim.PLoss_kW} kW (${sim.lossPercent}%)`, level: sim.lossPercent <= 5 ? 'good' : 'bad' }
    ]);

    app.setBannerPills([
      { text: '远距离高压输电定量对比', tone: 'sand' },
      { text: sim.inputMode === 'DC' ? '★ 直流电不能用变压器变压（ΔΦ/Δt=0）' : `相比不升压直供，线损降低为 1/${sim.lossReductionFactor}`, tone: sim.inputMode === 'DC' ? 'violet' : 'mint' }
    ]);

    app.setStageViews([
      { id: 'high', label: '预设① 10倍高压输电（0.5% 极低线损）' },
      { id: 'low', label: '预设② 不升压低压直供（50% 严重发热）' },
      { id: 'dc', label: '预设③ 稳恒直流输入（副线圈 0V 陷阱）' }
    ], sim.inputMode === 'DC' ? 'dc' : sim.ratioStepUp > 1 ? 'high' : 'low', (pId) => {
      if (pId === 'high') { state.grid.inputMode = 'AC'; state.grid.ratioStepUp = 10; }
      else if (pId === 'low') { state.grid.inputMode = 'AC'; state.grid.ratioStepUp = 1; }
      else { state.grid.inputMode = 'DC'; state.grid.ratioStepUp = 10; }
      renderTransformer();
    });

    app.setPiP({ visible: false });
    app.setTransport({ canBack: false, canNext: false, onBack: () => {}, onNext: () => false, onTogglePlay: () => {} });

    const vp = app.viewport();
    const isDC = sim.inputMode === 'DC';
    vp.innerHTML = `<div style="padding:18px 22px;height:100%;overflow:auto;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <small style="color:var(--muted);font-weight:700">发电厂总输出 P0 = ${sim.P0_kW} kW · 远距离输电线总电阻 R线 = ${sim.RLine} Ω</small>
          <div class="mono" style="font-size:18px;font-weight:800">${esc(sim.diagnosis)}</div>
        </div>
      </div>
      <svg viewBox="0 0 640 156" style="width:100%;max-height:150px;display:block">
        ${StudioSVG.flowPath({ points: [[148, 76], [244, 76]], color: isDC ? '#dc2626' : '#0f766e', packetT: 0.5, packetLabel: isDC ? 'DC 恒磁通' : `${sim.U2_kV}kV / ${sim.ILine_A}A` })}
        ${StudioSVG.flowPath({ points: [[384, 76], [482, 76]], color: isDC ? '#94a3b8' : (sim.lossPercent > 20 ? '#dc2626' : '#16a34a'), dashed: isDC, active: !isDC, packetT: isDC ? null : 0.55, packetLabel: isDC ? '' : `实得 ${sim.PDelivered_kW}kW` })}
        ${StudioSVG.isoBox({ x: 84, y: 74, w: 124, d: 64, h: 20, label: '升压变压器', sub: `n2/n1 = ${sim.ratioStepUp}×`, fillTop: '#fcd4ad', fillLeft: '#e9b787', fillRight: '#d39a65', active: true })}
        ${StudioSVG.isoBox({ x: 318, y: 74, w: 128, d: 64, h: 20, label: `输电线 R=${sim.RLine}Ω`, sub: `发热 ΔP=${sim.PLoss_kW}kW`, meter: Math.min(1, sim.lossPercent / 60), fillTop: sim.lossPercent > 20 ? '#fecaca' : '#c6dfb8', fillLeft: '#9ec48b', fillRight: '#7ca768', active: !isDC })}
        ${StudioSVG.isoBox({ x: 554, y: 74, w: 124, d: 64, h: 20, label: '降压与城市用户', sub: `${sim.PDelivered_kW} kW`, fillTop: '#a9c5e8', fillLeft: '#84a5cf', fillRight: '#6086b6', active: !isDC && sim.PDelivered_kW > 0 })}
      </svg>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        <div style="padding:10px 12px;border-radius:10px;border:1.5px solid var(--line-strong);background:var(--surface)">
          <div style="font-size:12px;color:var(--muted);font-weight:700">① 升压后输电电压 U2</div>
          <div class="mono" style="font-size:19px;font-weight:800;margin:4px 0">${sim.U2_kV} kV</div>
          <div style="font-size:11.5px;color:var(--muted)">U2 = (n2/n1)·U1 = ${sim.ratioStepUp} × ${sim.U1_kV} kV</div>
        </div>
        <div style="padding:10px 12px;border-radius:10px;border:1.5px solid var(--line-strong);background:var(--surface)">
          <div style="font-size:12px;color:var(--muted);font-weight:700">② 输电线电流 I线 = P0/U2</div>
          <div class="mono" style="font-size:19px;font-weight:800;margin:4px 0">${sim.ILine_A} A</div>
          <div style="font-size:11.5px;color:var(--muted)">线压降 ΔU = I线·R线 = ${sim.voltageDrop_V} V</div>
        </div>
        <div style="padding:10px 12px;border-radius:10px;border:1.5px solid ${sim.lossPercent > 20 ? 'var(--bad)' : 'var(--good)'};background:${sim.lossPercent > 20 ? 'var(--bad-bg)' : 'var(--good-bg)'}">
          <div style="font-size:12px;font-weight:800">③ 焦耳热损耗 ΔP = I线²·R线</div>
          <div class="mono" style="font-size:19px;font-weight:800;margin:4px 0">${sim.PLoss_kW} kW (${sim.lossPercent}%)</div>
          <div style="font-size:11.5px">用户到账功率：<b>${sim.PDelivered_kW} kW</b></div>
        </div>
      </div>
    </div>`;

    app.setTabs([
      {
        label: '高压输电公式链',
        html: `
          <span class="st-pill ${isDC ? 'bad' : sim.lossPercent <= 5 ? 'good' : 'warn'}">${isDC ? '直流互感失效' : `线损占比 ${sim.lossPercent}%`}</span>
          <h3 style="margin:6px 0">为什么必须用高压输电？</h3>
          <div class="st-diff-list">
            <div class="st-diff-item"><span class="st-diff-badge add">1</span><span>输送功率一定时，输电电流 <code>I线 = P0 / U2</code> 与电压成反比</span></div>
            <div class="st-diff-item"><span class="st-diff-badge chg">2</span><span>线上热损耗 <code>ΔP = I线²·R线 = (P0/U2)²·R线</code> 与电压平方成反比</span></div>
            <div class="st-diff-item"><span class="st-diff-badge add">3</span><span>电压升高 <b>k 倍</b> → 电流降为 <b>1/k</b> → 线损骤降为 <b>1/k²</b>！</span></div>
          </div>`
      }
    ]);

    app.setCodePanel({
      visible: true,
      title: '点击参数芯片切换 AC/DC、升压比与输电线电阻',
      lines: [
        `const mode = "{{inputMode:${sim.inputMode}}}", P0 = 100 kW, U1 = 2.0 kV;`,
        `const k_stepUp = {{ratio:${sim.ratioStepUp}}}x, R_line = {{RLine:${sim.RLine}}} Ω;`,
        `const I_line = ${sim.ILine_A} A -> ΔP_loss = I²*R = ${sim.PLoss_kW} kW (${sim.lossPercent}%);`
      ],
      activeLine: 3,
      monitor: sim.diagnosis,
      onParamClick: (key) => {
        if (key === 'inputMode') state.grid.inputMode = state.grid.inputMode === 'AC' ? 'DC' : 'AC';
        else if (key === 'ratio') state.grid.ratioStepUp = state.grid.ratioStepUp === 10 ? 1 : state.grid.ratioStepUp === 1 ? 20 : 10;
        else if (key === 'RLine') state.grid.RLine = state.grid.RLine === 20 ? 40 : 20;
        renderTransformer();
      },
      onStep: () => {
        state.grid.ratioStepUp = state.grid.ratioStepUp === 1 ? 10 : 1;
        state.grid.inputMode = 'AC';
        renderTransformer();
      },
      onRun: () => {
        state.grid.inputMode = 'AC';
        state.grid.ratioStepUp = 10;
        renderTransformer();
      }
    });

    app.setBottomDock({ mode: 'modules' });
  }

  function renderModule(modId) {
    app.stopPlay();
    if (modId === 'lenz') renderLenz();
    else if (modId === 'rails') renderRails();
    else if (modId === 'generator') renderGenerator();
    else if (modId === 'transformer') renderTransformer();
  }

  app = StudioApp.mount(config, {
    onSelectModule: (modId) => renderModule(modId),
    onReset: (modId) => {
      state.lenz = { poleDown: 'N', turns: 40, speed: 2, stepIdx: 1 };
      state.rails = { B: 1.0, L: 0.5, v: 4.0, R: 1.5, r: 0.5, stepIdx: 1 };
      state.gen = { N: 10, B: 1.0, S: 0.2, omega: 5, RTotal: 10, stepIdx: 2, stageView: '3d' };
      state.grid = { inputMode: 'AC', P0_kW: 100, U1_kV: 2.0, ratioStepUp: 10, RLine: 20 };
      renderModule(modId);
    },
    onKey: (action) => {
      const m = app.activeModuleId();
      if (m === 'lenz') {
        if (action === 'next' && state.lenz.stepIdx < 4) { state.lenz.stepIdx++; renderLenz(); }
        else if (action === 'prev' && state.lenz.stepIdx > 0) { state.lenz.stepIdx--; renderLenz(); }
      } else if (m === 'rails') {
        if (action === 'next' && state.rails.stepIdx < 3) { state.rails.stepIdx++; renderRails(); }
        else if (action === 'prev' && state.rails.stepIdx > 0) { state.rails.stepIdx--; renderRails(); }
      } else if (m === 'generator') {
        if (action === 'next' && state.gen.stepIdx < 8) { state.gen.stepIdx++; renderGenerator(); }
        else if (action === 'prev' && state.gen.stepIdx > 0) { state.gen.stepIdx--; renderGenerator(); }
      }
    }
  });
})();

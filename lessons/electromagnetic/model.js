// Pure High School Physics Electromagnetism Engine (zero DOM / Three.js dependencies)

const EM_PARTS = [
  {
    id: 'magnet',
    name: '永磁体与原磁场 B原',
    en: 'Permanent Magnet · Primary Flux Φ',
    color: '#dc2626',
    role: '提供穿过闭合回路的外部磁感线（原磁场 B原）',
    summary: '磁铁外部磁感线从 N 极出发回到 S 极；靠近线圈时磁感线变密（磁通量 Φ 增大），远离时变疏（磁通量 Φ 减小）。'
  },
  {
    id: 'coil',
    name: '多匝闭合螺线管 / 电枢线圈',
    en: 'N-Turn Solenoid & Armature Coil',
    color: '#d97706',
    role: '感受磁通量变化或切割磁感线，产生感应电动势 E',
    summary: '根据法拉第电磁感应定律 E = N·|ΔΦ/Δt|，感应电动势大小不取决于 Φ 有多大，而取决于 Φ 变得有多快以及匝数 N。'
  },
  {
    id: 'meter',
    name: '零刻度居中灵敏电流计 G',
    en: 'Center-Zero Galvanometer & Load R',
    color: '#0f766e',
    role: '实时检验感应电流的大小与流向翻转',
    summary: '电流从正接线柱流入时指针向右偏，从负接线柱流入时向左偏；无磁通量变化（ΔΦ/Δt = 0）时指针严格指零。'
  }
];

/**
 * Module 1: Lenz's Law & Faraday's Flux Change Rate (来拒去留 · 增反减同)
 */
function simulateLenzLaw(params = {}) {
  const poleDown = params.poleDown === 'S' ? 'S' : 'N';
  const turns = Math.max(10, Math.min(100, Number(params.turns) || 40));
  const speed = Math.max(1, Math.min(5, Number(params.speed) || 2));
  const stepIdx = Math.max(0, Math.min(4, Math.round(Number(params.stepIdx) || 0)));

  // Primary magnetic field direction inside coil: N pole facing down (-Y) points 'down', S pole facing down points 'up'
  const bOrigDir = poleDown === 'N' ? '向下 (↓)' : '向上 (↑)';
  const scaleFactor = (turns / 40) * (speed / 2);

  const rawStages = [
    {
      step: 0,
      id: 'far',
      title: '高处静止待命',
      actionLabel: '静止于线圈上方 (v = 0)',
      magnetY: 1.92,
      velocityDir: 'none',
      flux_mWb: 1.2,
      dFluxRate: 0,
      fluxTrend: '不变 (ΔΦ = 0)',
      ruleTag: '无磁通量变化 → 无感应电流'
    },
    {
      step: 1,
      id: 'insert',
      title: '加速向下插入（来拒）',
      actionLabel: `向下插入线圈 (v = ${speed} m/s ↓)`,
      magnetY: 1.05,
      velocityDir: 'down',
      flux_mWb: 5.6,
      dFluxRate: +(4.4 * (speed / 2)).toFixed(2),
      fluxTrend: '增大 (ΔΦ > 0 · 增反)',
      ruleTag: '增反：B感 与 B原 反向，同名磁极相斥（来拒）'
    },
    {
      step: 2,
      id: 'center',
      title: '线圈正中心悬停（极值零流）',
      actionLabel: '停在线圈中心静止 (v = 0)',
      magnetY: 0.48,
      velocityDir: 'none',
      flux_mWb: 8.8,
      dFluxRate: 0,
      fluxTrend: 'Φ 最大但 ΔΦ/Δt = 0',
      ruleTag: '高考核心陷阱：Φ 最大但变化率为 0 → E = 0, I = 0！'
    },
    {
      step: 3,
      id: 'extract',
      title: '向上加速拔出（去留）',
      actionLabel: `向上拔出线圈 (v = ${speed} m/s ↑)`,
      magnetY: 1.18,
      velocityDir: 'up',
      flux_mWb: 4.2,
      dFluxRate: +(-4.6 * (speed / 2)).toFixed(2),
      fluxTrend: '减小 (ΔΦ < 0 · 减同)',
      ruleTag: '减同：B感 与 B原 同向，异名磁极相吸（去留）'
    },
    {
      step: 4,
      id: 'fast_insert',
      title: '高速插入冲击（2倍速对比）',
      actionLabel: `高速插入 (v = ${Math.min(10, speed * 1.5).toFixed(1)} m/s ↓)`,
      magnetY: 0.88,
      velocityDir: 'down',
      flux_mWb: 7.2,
      dFluxRate: +(6.6 * (speed / 2)).toFixed(2),
      fluxTrend: '剧烈增大 (ΔΦ/Δt 加倍)',
      ruleTag: '法拉第定律 E = N·ΔΦ/Δt：运动越快、匝数越多，偏转越剧烈'
    }
  ];

  const polaritySign = poleDown === 'N' ? 1 : -1;
  const stages = rawStages.map(st => {
    // Induced EMF in Volts (E = N * dPhi/dt * 1e-3, scaled for classroom galvanometer readout)
    const emf_V = +(Math.abs(st.dFluxRate) * (turns / 40) * 1.2).toFixed(2);
    // Current sign depends on both flux change sign and magnet pole orientation
    const rawSign = st.dFluxRate === 0 ? 0 : (st.dFluxRate > 0 ? 1 : -1) * polaritySign;
    const current_mA = +(rawSign * emf_V * 2.5).toFixed(2);

    let bIndDir = '无 (0)';
    let coilTopPole = '无极性';
    let forceOnMagnet = '0 N（无电磁作用力）';
    if (st.dFluxRate > 0) {
      // 增反 (opposes B_orig) & 来拒 (top pole matches poleDown to repel approaching magnet)
      bIndDir = poleDown === 'N' ? '向上 (↑ · 与 B原 反向)' : '向下 (↓ · 与 B原 反向)';
      coilTopPole = `${poleDown} 极（同名相斥）`;
      forceOnMagnet = '向上排斥力 F安 ↑（阻碍插入 · 来拒）';
    } else if (st.dFluxRate < 0) {
      // 减同 (aligns with B_orig) & 去留 (top pole opposite to poleDown to attract leaving magnet)
      bIndDir = poleDown === 'N' ? '向下 (↓ · 与 B原 同向)' : '向上 (↑ · 与 B原 同向)';
      const oppPole = poleDown === 'N' ? 'S' : 'N';
      coilTopPole = `${oppPole} 极（异名相吸）`;
      forceOnMagnet = '向下吸引力 F安 ↓（阻碍拔出 · 去留）';
    }

    return {
      ...st,
      poleDown,
      turns,
      speed,
      bOrigDir,
      bIndDir,
      coilTopPole,
      forceOnMagnet,
      emf_V,
      current_mA,
      needleDeflect: current_mA === 0 ? '指零 (0 mA)' : current_mA > 0 ? `右偏 (+${current_mA} mA)` : `左偏 (${current_mA} mA)`
    };
  });

  return {
    poleDown,
    turns,
    speed,
    scaleFactor,
    stepIdx,
    stages,
    current: stages[stepIdx]
  };
}

/**
 * Module 2: Motional EMF on Parallel Rails (导体棒切割磁感线 E = BLv 与安培力能量守恒)
 */
function simulateRailCutting(params = {}) {
  const B = Math.max(0.2, Math.min(3.0, Number(params.B) || 1.0));
  const L = Math.max(0.2, Math.min(2.0, Number(params.L) || 0.5));
  const v = Math.max(0, Math.min(10.0, Number(params.v) ?? 4.0));
  const R = Math.max(0.5, Math.min(10.0, Number(params.R) || 1.5));
  const r = Math.max(0.1, Math.min(5.0, Number(params.r) ?? 0.5));
  const stepIdx = Math.max(0, Math.min(3, Math.round(Number(params.stepIdx) || 0)));

  const E = +(B * L * v).toFixed(3);
  const RTotal = +(R + r).toFixed(3);
  const I = +(E / RTotal).toFixed(3);
  // Terminal voltage across external resistor R (高考核心：电压表测路端电压 U = IR，不是 E)
  const U = +(I * R).toFixed(3);
  // Ampere braking force F_amp = B * I * L = B^2 * L^2 * v / (R + r)
  const FAmp = +(B * I * L).toFixed(3);
  // Mechanical pulling power required for constant velocity v: P_mech = F_amp * v
  const PMech = +(FAmp * v).toFixed(3);
  // Total electrical Joule heating power: P_elec = I^2 * (R + r)
  const PElec = +(I * I * RTotal).toFixed(3);
  const PExt = +(I * I * R).toFixed(3);

  const timeSteps = [0, 0.25, 0.5, 0.75].map((dt, idx) => {
    const dx = +(v * dt).toFixed(2);
    const dPhi = +(B * L * dx).toFixed(3);
    // Induced charge q = I * dt = ΔΦ / (R + r)
    const charge_C = +(dPhi / RTotal).toFixed(3);
    return {
      step: idx,
      time_s: dt,
      barX: +(-1.1 + idx * 0.75).toFixed(2),
      dx_m: dx,
      dPhi_Wb: dPhi,
      charge_C
    };
  });

  return {
    B,
    L,
    v,
    R,
    r,
    RTotal,
    E,
    I,
    U,
    FAmp,
    PMech,
    PElec,
    PExt,
    powerDiff: Math.abs(PMech - PElec),
    currentDir: v > 0 ? 'b → a（右手定则：手心向上迎 B，拇指向右指 v，四指指向 a）' : '无电流 (v = 0)',
    ampForceDir: v > 0 ? '水平向左 ←（左手定则：与运动速度 v 反向，阻碍相对运动）' : '0 N',
    stepIdx,
    timeSteps,
    currentStep: timeSteps[stepIdx]
  };
}

/**
 * Module 3: AC Generator & Sinusoidal Alternating Current (中性面 vs 峰值面 · e = NBSω·sinθ)
 */
function simulateACGenerator(params = {}) {
  const N = Math.max(1, Math.min(100, Number(params.N) || 10));
  const B = Math.max(0.2, Math.min(3.0, Number(params.B) || 1.0));
  const S = Math.max(0.05, Math.min(1.0, Number(params.S) || 0.2));
  const omega = Math.max(1, Math.min(20, Number(params.omega) || 5));
  const RTotal = Math.max(1, Math.min(50, Number(params.RTotal) || 10));
  const stepIdx = Math.max(0, Math.min(8, Math.round(Number(params.stepIdx) || 0)));

  const PhiMax = +(B * S).toFixed(4);
  const Em = +(N * B * S * omega).toFixed(3);
  const ERms = +(Em / Math.SQRT2).toFixed(3);
  const IRms = +(ERms / RTotal).toFixed(3);

  const anglesDeg = [0, 45, 90, 135, 180, 225, 270, 315, 360];
  const frames = anglesDeg.map((deg, idx) => {
    const rad = (deg * Math.PI) / 180;
    const cosV = Math.abs(Math.cos(rad)) < 1e-9 ? 0 : Math.cos(rad);
    const sinV = Math.abs(Math.sin(rad)) < 1e-9 ? 0 : Math.sin(rad);
    const flux = +(PhiMax * cosV).toFixed(4);
    const dFluxRate = +(-PhiMax * omega * sinV).toFixed(4);
    const emf = +(Em * sinV).toFixed(3);
    const current = +(emf / RTotal).toFixed(3);
    const isNeutralPlane = deg % 180 === 0;
    const isPeakPlane = deg % 180 === 90;

    let planeType = '过渡切割位置';
    let keyPoint = '磁通量 Φ 与瞬时电动势 e 均处于非零过渡值。';
    if (isNeutralPlane) {
      planeType = '中性面（线圈 ⊥ 磁感线）';
      keyPoint = '磁通量 |Φ| 最大，但导体边速度平行于磁感线不切割，瞬时电动势 e = 0 V，电流方向在此刻反转！';
    } else if (isPeakPlane) {
      planeType = '峰值面（线圈 ∥ 磁感线）';
      keyPoint = '磁通量 Φ = 0，但导体边垂直切割磁感线，磁通量变化率 |ΔΦ/Δt| 最大，瞬时电动势达到峰值 |e| = Em！';
    }

    return {
      step: idx,
      angleDeg: deg,
      angleRad: +rad.toFixed(4),
      flux,
      dFluxRate,
      emf,
      current,
      isNeutralPlane,
      isPeakPlane,
      planeType,
      keyPoint,
      dirChangeNotice: isNeutralPlane ? '★ 电流方向在此位置发生翻转（1 周期换向 2 次）' : (sinV > 0 ? '正半周（a→b→c→d）' : '负半周（d→c→b→a）')
    };
  });

  // High-resolution curves for StudioSVG.renderMiniPlot (25 points from 0..360 deg)
  const fluxCurve = [];
  const emfCurve = [];
  for (let i = 0; i <= 24; i++) {
    const r = (i / 24) * Math.PI * 2;
    fluxCurve.push(+(PhiMax * Math.cos(r)).toFixed(4));
    emfCurve.push(+(Em * Math.sin(r)).toFixed(3));
  }

  return {
    N,
    B,
    S,
    omega,
    RTotal,
    PhiMax,
    Em,
    ERms,
    IRms,
    stepIdx,
    frames,
    current: frames[stepIdx],
    fluxCurve,
    emfCurve
  };
}

/**
 * Module 4: Ideal Transformer & High-Voltage Long-Distance Power Transmission
 */
function simulatePowerGrid(params = {}) {
  const inputMode = params.inputMode === 'DC' ? 'DC' : 'AC';
  const P0_kW = Math.max(10, Math.min(1000, Number(params.P0_kW) || 100));
  const U1_kV = Math.max(0.5, Math.min(20, Number(params.U1_kV) || 2.0));
  const ratioStepUp = Math.max(1, Math.min(50, Number(params.ratioStepUp) || 10));
  const RLine = Math.max(1, Math.min(100, Number(params.RLine) || 20));

  if (inputMode === 'DC') {
    return {
      inputMode: 'DC',
      P0_kW,
      U1_kV,
      ratioStepUp,
      RLine,
      U2_kV: 0,
      ILine_A: 0,
      voltageDrop_V: 0,
      PLoss_kW: 0,
      lossPercent: 0,
      PDelivered_kW: 0,
      baselineLoss_kW: 0,
      lossReductionFactor: 0,
      diagnosis: '稳恒直流电输入原线圈时，铁芯中磁通量 Φ 恒定不变（ΔΦ/Δt = 0），副线圈不产生互感电动势，输出电压 U2 = 0 V！'
    };
  }

  const U2_kV = +(U1_kV * ratioStepUp).toFixed(2);
  // I_line = P0 (W) / U2 (V) = P0_kW / U2_kV (A)
  const ILine_A = +(P0_kW / U2_kV).toFixed(2);
  const voltageDrop_V = +(ILine_A * RLine).toFixed(1);
  const rawPLoss_kW = +((ILine_A * ILine_A * RLine) / 1000).toFixed(3);
  const PLoss_kW = Math.min(P0_kW, rawPLoss_kW);
  const lossPercent = +((PLoss_kW / P0_kW) * 100).toFixed(2);
  const PDelivered_kW = +(P0_kW - PLoss_kW).toFixed(3);

  // Baseline without step-up transformer (ratio = 1, U2 = U1)
  const baseI_A = P0_kW / U1_kV;
  const baselineLoss_kW = +((baseI_A * baseI_A * RLine) / 1000).toFixed(3);
  const lossReductionFactor = +(ratioStepUp * ratioStepUp).toFixed(0);

  return {
    inputMode: 'AC',
    P0_kW,
    U1_kV,
    ratioStepUp,
    RLine,
    U2_kV,
    ILine_A,
    voltageDrop_V,
    PLoss_kW,
    rawPLoss_kW,
    lossPercent,
    PDelivered_kW,
    baselineLoss_kW,
    lossReductionFactor,
    diagnosis: `升压倍数 k = ${ratioStepUp} 倍（${U1_kV} kV → ${U2_kV} kV），输电线电流降为 1/${ratioStepUp}（${ILine_A} A），线损发热功率 ΔP = I²R 骤降为原来的 1/${lossReductionFactor}（仅 ${lossPercent}%）！`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EM_PARTS,
    simulateLenzLaw,
    simulateRailCutting,
    simulateACGenerator,
    simulatePowerGrid
  };
}

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  simulateLenzLaw,
  simulateRailCutting,
  simulateACGenerator,
  simulatePowerGrid
} = require('./model.js');

test('楞次定律：线圈中心磁通量最大处感应电流为0，插入与拔出电流反向且极性反转生效', () => {
  const center = simulateLenzLaw({ poleDown: 'N', turns: 40, speed: 2, stepIdx: 2 }).current;
  assert.equal(center.flux_mWb, 8.8);
  assert.equal(center.dFluxRate, 0);
  assert.equal(center.emf_V, 0);
  assert.equal(center.current_mA, 0);

  const insertN = simulateLenzLaw({ poleDown: 'N', turns: 40, speed: 2, stepIdx: 1 }).current;
  const extractN = simulateLenzLaw({ poleDown: 'N', turns: 40, speed: 2, stepIdx: 3 }).current;
  const insertS = simulateLenzLaw({ poleDown: 'S', turns: 40, speed: 2, stepIdx: 1 }).current;
  const insertN80 = simulateLenzLaw({ poleDown: 'N', turns: 80, speed: 2, stepIdx: 1 }).current;

  assert.equal(insertN.current_mA > 0, true);
  assert.equal(extractN.current_mA < 0, true);
  assert.equal(insertS.current_mA, -insertN.current_mA);
  assert.equal(insertN80.emf_V, +(insertN.emf_V * 2).toFixed(2));
});

test('导体棒切割磁感线：E=BLv、路端电压 U=IR 及机械功率等于总电热功率', () => {
  const sim = simulateRailCutting({ B: 1.0, L: 0.5, v: 4.0, R: 1.5, r: 0.5, stepIdx: 2 });
  // E = 1.0 * 0.5 * 4.0 = 2.0 V
  assert.equal(sim.E, 2.0);
  // I = 2.0 / (1.5 + 0.5) = 1.0 A
  assert.equal(sim.I, 1.0);
  // U = I * R = 1.5 V (< E = 2.0 V)
  assert.equal(sim.U, 1.5);
  // F_amp = B * I * L = 0.5 N
  assert.equal(sim.FAmp, 0.5);
  // P_mech = F_amp * v = 2.0 W === P_elec = I^2 * (R+r) = 2.0 W
  assert.equal(sim.PMech, 2.0);
  assert.equal(sim.PElec, 2.0);
  assert.equal(sim.powerDiff < 1e-6, true);
  // Charge q = ΔΦ / (R+r) at t = 0.5s (dx = 2.0m, ΔΦ = 1.0 Wb -> q = 0.5 C)
  assert.equal(sim.currentStep.charge_C, 0.5);
});

test('交流发电机：中性面磁通量最大而电动势为0，峰值面磁通量为0而电动势最大', () => {
  const gen0 = simulateACGenerator({ N: 10, B: 1.0, S: 0.2, omega: 5, stepIdx: 0 });
  const gen90 = simulateACGenerator({ N: 10, B: 1.0, S: 0.2, omega: 5, stepIdx: 2 });
  const gen180 = simulateACGenerator({ N: 10, B: 1.0, S: 0.2, omega: 5, stepIdx: 4 });

  // Neutral plane (0 deg): Phi = BS = 0.2 Wb, e = 0 V
  assert.equal(gen0.current.isNeutralPlane, true);
  assert.equal(gen0.current.flux, 0.2);
  assert.equal(gen0.current.emf, 0);

  // Peak plane (90 deg): Phi = 0 Wb, e = NBSw = 10 * 1.0 * 0.2 * 5 = 10 V
  assert.equal(gen90.current.isPeakPlane, true);
  assert.equal(gen90.current.flux, 0);
  assert.equal(gen90.current.emf, 10.0);

  // Neutral plane (180 deg): Phi = -0.2 Wb, e = 0 V
  assert.equal(gen180.current.isNeutralPlane, true);
  assert.equal(gen180.current.flux, -0.2);
  assert.equal(gen180.current.emf, 0);
});

test('理想变压器与高压输电：升压10倍线损降为1/100，直流输入副线圈零输出', () => {
  const lowV = simulatePowerGrid({ inputMode: 'AC', P0_kW: 100, U1_kV: 2.0, ratioStepUp: 1, RLine: 20 });
  const highV = simulatePowerGrid({ inputMode: 'AC', P0_kW: 100, U1_kV: 2.0, ratioStepUp: 10, RLine: 20 });
  const dcTrap = simulatePowerGrid({ inputMode: 'DC', P0_kW: 100, U1_kV: 2.0, ratioStepUp: 10, RLine: 20 });

  // At 2 kV (ratio=1), I = 50 A, P_loss = 50^2 * 20 = 50 kW (50% loss!)
  assert.equal(lowV.ILine_A, 50);
  assert.equal(lowV.PLoss_kW, 50);

  // At 20 kV (ratio=10), I = 5 A, P_loss = 5^2 * 20 = 0.5 kW (0.5% loss -> 1/100 of 50 kW!)
  assert.equal(highV.U2_kV, 20);
  assert.equal(highV.ILine_A, 5);
  assert.equal(highV.PLoss_kW, 0.5);
  assert.equal(highV.lossPercent, 0.5);
  assert.equal(lowV.PLoss_kW / highV.PLoss_kW, 100);

  // DC input produces 0 V output
  assert.equal(dcTrap.U2_kV, 0);
  assert.equal(dcTrap.PDelivered_kW, 0);
});

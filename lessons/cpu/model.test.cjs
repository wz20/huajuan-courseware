const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CPU_PARTS,
  encodeInstruction16,
  buildExecutionTrace,
  simulatePipeline,
  simulateCacheAccess
} = require('./model.js');

test('16位教学指令编码与位段拆分保持精确匹配', () => {
  const load = encodeInstruction16({ op: 'LOAD', rd: 1, operand: 0x04, isMem: true });
  // Opcode=0001 (1), Rd=01 (1), Mode=01 (Mem), Operand=00000100 (0x04) => 0x1504
  assert.equal(load.hex, '0x1504');
  assert.equal(load.bin, '0001010100000100');
  assert.equal(load.fields.reduce((s, f) => s + f.bits, 0), 16);

  const add = encodeInstruction16({ op: 'ADD', rd: 1, operand: 5, isMem: false });
  // Opcode=0010 (2), Rd=01 (1), Mode=10 (Imm), Operand=00000101 (5) => 0x2605
  assert.equal(add.hex, '0x2605');
});

test('指令周期追踪：ADD 与 SUB 更改标志位及最终主存结果准确', () => {
  assert.equal(CPU_PARTS.length, 5);

  const runAdd = buildExecutionTrace({ mem04: 3, opMode: 'ADD', immB: 5 });
  assert.equal(runAdd.cycles.length, 16);
  // I1: R1=3; I2: ADD R1,#5 => R1=8; I3: SUB R2,R1,#2 => R2=6; I4: STORE [0x08]=6
  assert.deepEqual(runAdd.finalSnapshot.regs, { R0: 0, R1: 8, R2: 6 });
  assert.deepEqual(runAdd.finalSnapshot.mem, { '0x04': 3, '0x08': 6 });

  const runSubNeg = buildExecutionTrace({ mem04: 3, opMode: 'SUB', immB: 5 });
  // After I2 (cycle index 7): R1 = 3 - 5 = -2 -> Z=0, N=1, C=1 (borrow)
  const afterI2 = runSubNeg.cycles[7].snapshot;
  assert.equal(afterI2.regs.R1, -2);
  assert.equal(afterI2.flags.N, 1);
  assert.equal(afterI2.flags.Z, 0);
  assert.equal(afterI2.flags.C, 1);
});

test('五级流水线：旁路关闭、旁路直通与顺序执行的周期和加速比正确', () => {
  const seq = simulatePipeline({ mode: 'sequential', forwarding: false });
  const noFwd = simulatePipeline({ mode: 'pipelined', forwarding: false });
  const fwd = simulatePipeline({ mode: 'pipelined', forwarding: true });

  assert.equal(seq.totalCycles, 20);
  assert.equal(seq.speedup, 1.0);
  assert.ok(noFwd.totalCycles < seq.totalCycles);
  assert.equal(noFwd.totalCycles, 14);
  assert.equal(fwd.totalCycles, 9);
  assert.equal(fwd.stallCycles, 1);
  assert.ok(fwd.speedup > 2.0);
});

test('直接映射 L1 缓存：顺序访问命中率高，同索引跨步访问触发冲突抖动', () => {
  const sequential = simulateCacheAccess([0x00, 0x04, 0x08, 0x0C, 0x00, 0x04]);
  assert.equal(sequential.hits, 2);
  assert.equal(sequential.misses, 4);
  assert.equal(sequential.hitRate, 33);
  assert.equal(sequential.totalLatency, 4 * 100 + 2 * 4);

  // 0x00 (Tag=0, Index=0) & 0x10 (Tag=1, Index=0) map to exact same Set 0 => 0% hit!
  const thrash = simulateCacheAccess([0x00, 0x10, 0x00, 0x10, 0x00, 0x10]);
  assert.equal(thrash.hits, 0);
  assert.equal(thrash.misses, 6);
  assert.equal(thrash.hitRate, 0);
  assert.equal(thrash.totalLatency, 600);
  assert.equal(thrash.events[1].evicted, true);
  assert.equal(thrash.events[1].evictedTag, 0);
});

// Pure CPU Hardware & Microarchitecture Domain Engine (zero DOM / Three dependencies)

const CPU_PARTS = [
  {
    id: 'cu',
    name: '控制单元（CU）',
    en: 'Control Unit · PC / IR / Decoder',
    color: '#e8692b',
    hex: 0xe8692b,
    pos: [-1.5, 0.45, -1.0],
    camPos: [1.8, 4.6, 2.4],
    role: '整颗芯片的指挥中心',
    summary: '控制单元从指令寄存器（IR）读出操作码，每个时钟节拍向总线、ALU 和寄存器堆广播对应的控制信号。',
    takeaways: [
      'PC（程序计数器）永远记住“下一条该取哪条指令的地址”。',
      'IR（指令寄存器）暂存刚刚从内存/指令缓存取回的机器码。',
      '译码器把 4-bit 操作码翻译成 MemRead、ALUSrc、RegWrite 等高低电平控制线。'
    ],
    pinout: [
      ['PC → MAR', '单向地址送出', '给出本拍要取指令的字节地址'],
      ['IR[15:12] → Decoder', '操作码输入', '识别 LOAD / ADD / SUB / STORE'],
      ['CU → 全芯片', 'Control Bus', '时钟驱动 MemRead / RegWrite 使能']
    ],
    specs: { '关键寄存器': 'PC, IR, 译码矩阵', '驱动时钟': '每周期 T1–T4 步进', '典型面积占比': '~18% 核心控制逻辑' }
  },
  {
    id: 'alu',
    name: '算术逻辑单元（ALU）',
    en: 'Arithmetic Logic Unit · Flags',
    color: '#0f766e',
    hex: 0x0f766e,
    pos: [1.35, 0.48, -0.85],
    camPos: [4.2, 4.4, 2.5],
    role: '真正执行加减、与或和比较的计算引擎',
    summary: 'ALU 是纯组合逻辑计算器：只要两端操作数（来自寄存器或立即数）准备好，就立刻算出结果并刷新 Z/N/C 状态标志位。',
    takeaways: [
      '内部本身不长期存数据，输入来自寄存器堆、输出必须写回寄存器或缓存。',
      'Z（零标志）= 结果为 0；N（负标志）= 结果最高位为负，条件跳转全靠读这两个位。',
      '单周期里计算最快，决定芯片主频上限的关键路径之一就是加法器进位链。'
    ],
    pinout: [
      ['Operand A', 'Regs[Rd]', '第一操作数，通常来自通用寄存器堆'],
      ['Operand B', 'Regs[Rs] / Imm', '多路选择器决定取寄存器还是立即数'],
      ['ALU Out → Z/N/C', '16-bit + 标志位', '算完立刻刷新零标志与负号标志']
    ],
    specs: { '运算宽度': '16-bit 教学整数通道', '支持操作': 'ADD / SUB / PASS / CMP', '状态输出': 'Z (Zero), N (Negative), C (Carry)' }
  },
  {
    id: 'regs',
    name: '通用寄存器堆（Register File）',
    en: 'R0 / R1 / R2 · MAR / MDR / ACC',
    color: '#215d3f',
    hex: 0x215d3f,
    pos: [0.05, 0.42, 0.45],
    camPos: [2.8, 4.2, 4.2],
    role: '离 ALU 最近、速度最快、数量极少的超高速临时工作台',
    summary: '访问主存需要上百个周期，而读写片内寄存器堆可在当前时钟周期内直接完成，是 CPU 所有指令能跑得飞快的根本前提。',
    takeaways: [
      'R0–R2 存放正在被指令反复加减的局部变量。',
      'MAR（内存地址寄存器）和 MDR（内存数据寄存器）是 CPU 对外打交道的“传菜窗口”。',
      '访问寄存器几乎零等待（<1 ns），但容量通常只有几十个字，必须靠内存分级兜底。'
    ],
    pinout: [
      ['双读端口 Read A/B', '→ ALU 输入端', '一拍内可同时送出两个寄存器给 ALU'],
      ['单写端口 Write Back', '← ALU / MDR', '在 T4 写回节拍更新目标寄存器'],
      ['MAR / MDR', '↔ 三总线接口', '暂存向外读写的地址与数据']
    ],
    specs: { '通用寄存器': 'R0, R1, R2', '专用工作寄存器': 'PC, IR, MAR, MDR', '访问耗时': '同拍零额外等待 (<1 cycle)' }
  },
  {
    id: 'cache',
    name: '片上缓存（L1i / L1d Cache）',
    en: 'On-die SRAM High-Speed Cache',
    color: '#6d28d9',
    hex: 0x6d28d9,
    pos: [-0.95, 0.36, 1.35],
    camPos: [2.0, 4.3, 5.2],
    role: '堵住“CPU 算太快、内存送太慢”内存墙的片上缓冲区',
    summary: 'L1 缓存由六晶体管 SRAM 打造、紧挨着核心；命中时仅需约 4 周期，一旦缺失被迫回访主存 DRAM 就要卡上约 100 个周期。',
    takeaways: [
      'L1i 专门缓存指令，L1d 专门缓存数据，保证流水线取指和读写数据互不抢道。',
      '靠空间局部性（连续读附近地址）与时间局部性（反复用同一变量）把命中率拉到 90% 以上。',
      '一旦发生地址索引冲突抖动，即便总容量有空位也会频繁发生昂贵缺失。'
    ],
    pinout: [
      ['Tag 比较器', 'Addr[高位]', '判断当前块是不是想要的那段内存'],
      ['Index 译码', 'Addr[中位]', '决定去 4 个缓存行里的哪一行找'],
      ['Hit / Miss 线', '→ 控制单元', 'Miss 时发 Stall 信号让流水线等 DRAM']
    ],
    specs: { '模型结构': '4 行直接映射 (Block = 4B)', 'L1 Hit 延迟': '4 个时钟周期 (~1 ns)', 'DRAM Miss 惩罚': '100 个时钟周期' }
  },
  {
    id: 'bus',
    name: '三总线与主存（Bus & DRAM）',
    en: 'Address · Data · Control + RAM',
    color: '#2563eb',
    hex: 0x2563eb,
    pos: [2.55, 0.3, 1.25],
    camPos: [5.4, 4.8, 5.0],
    role: '连接 CPU 芯片和外部内存条的三股高速公路',
    summary: '所有跨芯片的数据读写必须拆成三条物理总线协作：地址总线指明去哪找、控制总线指明读还是写、数据总线负责双向运货。',
    takeaways: [
      'Address Bus（地址总线）：永远单向由 CPU 发出，宽度决定最大寻址空间。',
      'Data Bus（数据总线）：双向通道，取指令、加载变量、写回内存都走它。',
      'Control Bus（控制总线）：承载 MemRead、MemWrite、Clock 与 Ready 握手信号。'
    ],
    pinout: [
      ['Address Bus', 'MAR → RAM', '单向传输 8-bit 内存地址'],
      ['Data Bus', 'MDR ↔ RAM', '双向传输 16-bit 指令码或数值'],
      ['Control Bus', 'CU ↔ RAM', '同步 MemRead / MemWrite / Wait 信号']
    ],
    specs: { '内存地址示例': '0x00–0x06 指令区 / 0x04–0x08 数据区', '内存读耗时': '模型中远慢于寄存器（约 25×）', '总线类型': 'Address + Data + Control' }
  }
];

const OPCODES = {
  LOAD: { code: 0x1, bin: '0001', mode: 'MEM' },
  ADD: { code: 0x2, bin: '0010', mode: 'IMM' },
  SUB: { code: 0x3, bin: '0011', mode: 'IMM' },
  STORE: { code: 0x4, bin: '0100', mode: 'MEM' }
};

function toHex(n, digits = 2) {
  const v = ((Math.trunc(n) % (1 << (digits * 4))) + (1 << (digits * 4))) % (1 << (digits * 4));
  return '0x' + v.toString(16).toUpperCase().padStart(digits, '0');
}

function toBin(n, bits) {
  const mask = (1 << bits) - 1;
  return (Math.trunc(n) & mask).toString(2).padStart(bits, '0');
}

function encodeInstruction16({ op, rd = 1, operand = 0, isMem = false }) {
  const meta = OPCODES[op] || OPCODES.LOAD;
  const modeBits = isMem ? 1 : 2; // 01 = memory [addr], 10 = immediate #val
  const word = ((meta.code & 0xf) << 12) | ((rd & 0x3) << 10) | ((modeBits & 0x3) << 8) | (operand & 0xff);
  const fields = [
    { name: 'Opcode', bits: 4, value: meta.bin, mean: op, bg: 'var(--sand)', ink: 'var(--sand-ink)', desc: `操作码：指示 CU 执行 ${op}` },
    { name: 'Rd', bits: 2, value: toBin(rd, 2), mean: `R${rd}`, bg: 'var(--mint)', ink: 'var(--mint-ink)', desc: `目标/源寄存器：选中 R${rd}` },
    { name: 'Mode', bits: 2, value: toBin(modeBits, 2), mean: isMem ? 'Mem' : 'Imm', bg: 'var(--violet)', ink: 'var(--violet-ink)', desc: isMem ? '01 = 主存间接地址 [addr]' : '10 = 指令自带立即数 #imm' },
    { name: 'Operand', bits: 8, value: toBin(operand, 8), mean: isMem ? `[${toHex(operand, 2)}]` : `#${operand}`, bg: 'var(--steel)', ink: 'var(--steel-ink)', desc: isMem ? `目标内存单元地址 ${toHex(operand, 2)}` : `无符号/十进制立即数 ${operand}` }
  ];
  return { word, hex: toHex(word, 4), bin: toBin(word, 16), fields };
}

function buildExecutionTrace({ mem04 = 3, opMode = 'ADD', immB = 5 } = {}) {
  const m04 = Math.max(-15, Math.min(32, Math.trunc(mem04)));
  const bVal = Math.max(0, Math.min(20, Math.trunc(immB)));
  const op = opMode === 'SUB' ? 'SUB' : 'ADD';

  const program = [
    { line: 0, addr: 0x00, asm: `LOAD  R1, [0x04]`, op: 'LOAD', rd: 1, operand: 0x04, isMem: true },
    { line: 1, addr: 0x02, asm: `${op}   R1, #${bVal}`, op, rd: 1, operand: bVal, isMem: false },
    { line: 2, addr: 0x04, asm: `SUB   R2, R1, #2`, op: 'SUB', rd: 2, operand: 2, isMem: false },
    { line: 3, addr: 0x06, asm: `STORE R2, [0x08]`, op: 'STORE', rd: 2, operand: 0x08, isMem: true }
  ];

  const state = {
    pc: 0,
    mar: 0,
    mdr: 0,
    ir: '----',
    irHex: '0x0000',
    r0: 0,
    r1: 0,
    r2: 0,
    z: 1,
    n: 0,
    c: 0,
    mem04: m04,
    mem08: 0
  };

  const cycles = [];
  let no = 1;

  const snap = () => ({
    pc: toHex(state.pc, 2),
    mar: toHex(state.mar, 2),
    mdr: toHex(state.mdr, 4),
    ir: state.ir,
    irHex: state.irHex,
    regs: { R0: state.r0, R1: state.r1, R2: state.r2 },
    flags: { Z: state.z, N: state.n, C: state.c },
    mem: { '0x04': state.mem04, '0x08': state.mem08 }
  });

  for (const inst of program) {
    const enc = encodeInstruction16(inst);

    // T1: Fetch Addr
    const prevPc = toHex(state.pc, 2);
    state.mar = inst.addr;
    cycles.push({
      id: `c${no}`,
      no: no++,
      cycle: `I${inst.line + 1}·T1`,
      instLine: inst.line,
      asm: inst.asm,
      enc,
      stage: 'Fetch 地址',
      stageKey: 'T1',
      src: 'PC',
      dst: 'MAR / 总线',
      activePart: 'cu',
      activeWires: ['cu->regs', 'regs->bus'],
      ctrlSignals: ['PCOut=1', 'MARIn=1'],
      info: `把下一条指令地址 ${toHex(inst.addr, 2)} 送入 MAR`,
      val: `MAR=${toHex(inst.addr, 2)}`,
      diffs: [
        { kind: 'chg', text: `MAR: ${toHex(state.mar, 2)} (锁存取指地址)` },
        { kind: 'add', text: `Control: PCOut=1, MARIn=1` }
      ],
      seqEvents: [{ id: `ev${no}_1`, from: 'pc', to: 'bus', label: `T1 地址 ${toHex(inst.addr, 2)} → MAR`, color: '#e8692b' }],
      snapshot: snap(),
      explain: `控制单元驱动 PC 把地址 ${toHex(inst.addr, 2)} 送到地址总线的入口 MAR，告诉内存“本拍读这里”。`
    });

    // T2: Fetch Instruction & PC += 2
    state.mdr = enc.word;
    state.ir = inst.asm;
    state.irHex = enc.hex;
    state.pc = inst.addr + 2;
    cycles.push({
      id: `c${no}`,
      no: no++,
      cycle: `I${inst.line + 1}·T2`,
      instLine: inst.line,
      asm: inst.asm,
      enc,
      stage: 'Fetch 读码',
      stageKey: 'T2',
      src: 'Cache/RAM',
      dst: 'MDR → IR',
      activePart: 'cache',
      activeWires: ['bus->cache', 'cache->regs', 'regs->cu'],
      ctrlSignals: ['MemRead=1', 'IRWrite=1', 'PC+=2'],
      info: `从 ${prevPc} 读回机器码 ${enc.hex} 并让 PC 自增至 ${toHex(state.pc, 2)}`,
      val: `IR=${enc.hex}`,
      diffs: [
        { kind: 'chg', text: `IR: ${enc.hex} (${inst.asm})` },
        { kind: 'chg', text: `PC: ${prevPc} → ${toHex(state.pc, 2)}` }
      ],
      seqEvents: [
        { id: `ev${no}_2a`, from: 'bus', to: 'cache', label: `T2 取回机器码 ${enc.hex}`, color: '#6d28d9' },
        { id: `ev${no}_2b`, from: 'cache', to: 'cu', label: `写入 IR · PC+2 → ${toHex(state.pc, 2)}`, color: '#2563eb' }
      ],
      snapshot: snap(),
      explain: `数据总线带回 16 位指令 ${enc.hex} 送入 IR，同时 PC 自动加 2 指向下一条命令。`
    });

    // T3: Decode
    const decCtrl = inst.op === 'LOAD'
      ? ['MemRead=1', 'ALUSrc=Mem']
      : inst.op === 'STORE'
        ? ['MemWrite=1', 'RegRead=R2']
        : [`ALUCtrl=${inst.op}`, 'ALUSrc=Imm', 'RegWrite=1'];
    cycles.push({
      id: `c${no}`,
      no: no++,
      cycle: `I${inst.line + 1}·T3`,
      instLine: inst.line,
      asm: inst.asm,
      enc,
      stage: 'Decode 译码',
      stageKey: 'T3',
      src: 'IR / CU',
      dst: inst.isMem ? 'MAR / RAM' : 'ALU 准备',
      activePart: 'cu',
      activeWires: ['cu->alu', 'regs->alu'],
      ctrlSignals: decCtrl,
      info: `拆分操作码 ${enc.fields[0].value} (${inst.op}) → 准备操作数`,
      val: decCtrl[0],
      diffs: [
        { kind: 'add', text: `解码位段：Opcode=${enc.fields[0].value} (${inst.op}) Rd=R${inst.rd}` },
        { kind: 'add', text: `激活控制信号：${decCtrl.join(' · ')}` }
      ],
      seqEvents: [{ id: `ev${no}_3`, from: 'cu', to: inst.isMem ? 'bus' : 'alu', label: `T3 译码 ${inst.op} · ${decCtrl[0]}`, color: '#0f766e' }],
      snapshot: snap(),
      explain: `CU 把 IR 高 4 位拆解出来：确定指令是 ${inst.op}，目标寄存器 R${inst.rd}，并打开对应控制信号。`
    });

    // T4: Execute & Writeback
    let diffs = [];
    let info = '';
    let val = '';
    let activePart = 'alu';
    let wires = ['alu->regs'];
    let seqFrom = 'alu', seqTo = 'regs';

    if (inst.op === 'LOAD') {
      const oldR1 = state.r1;
      state.mar = 0x04;
      state.mdr = state.mem04;
      state.r1 = state.mem04;
      state.z = state.r1 === 0 ? 1 : 0;
      state.n = state.r1 < 0 ? 1 : 0;
      state.c = 0;
      activePart = 'regs';
      wires = ['bus->cache', 'cache->regs'];
      seqFrom = 'bus';
      seqTo = 'regs';
      info = `读取 RAM[0x04]=${state.mem04} 并写回 R1`;
      val = `R1=${state.r1}`;
      diffs = [
        { kind: 'chg', text: `R1: ${oldR1} → ${state.r1}` },
        { kind: 'chg', text: `Flags: Z=${state.z}, N=${state.n}` }
      ];
    } else if (inst.op === 'ADD') {
      const old = state.r1;
      state.r1 = old + bVal;
      state.z = state.r1 === 0 ? 1 : 0;
      state.n = state.r1 < 0 ? 1 : 0;
      state.c = state.r1 > 255 ? 1 : 0;
      info = `ALU 计算 ${old} + ${bVal} = ${state.r1} 写回 R1`;
      val = `R1=${state.r1}`;
      diffs = [
        { kind: 'chg', text: `R1: ${old} + ${bVal} → ${state.r1}` },
        { kind: 'chg', text: `Flags: Z=${state.z}, N=${state.n}, C=${state.c}` }
      ];
    } else if (inst.op === 'SUB') {
      if (inst.rd === 1) {
        const old = state.r1;
        state.r1 = old - bVal;
        state.z = state.r1 === 0 ? 1 : 0;
        state.n = state.r1 < 0 ? 1 : 0;
        state.c = old < bVal ? 1 : 0;
        info = `ALU 计算 ${old} - ${bVal} = ${state.r1} 写回 R1（${state.n ? '触发负标志 N=1' : state.z ? '触发零标志 Z=1' : '正数'}）`;
        val = `R1=${state.r1}, N=${state.n}`;
        diffs = [
          { kind: 'chg', text: `R1: ${old} - ${bVal} → ${state.r1}` },
          { kind: 'chg', text: `Flags: Z=${state.z}, N=${state.n}, C(借位)=${state.c}` }
        ];
      } else {
        const oldR2 = state.r2;
        state.r2 = state.r1 - 2;
        state.z = state.r2 === 0 ? 1 : 0;
        state.n = state.r2 < 0 ? 1 : 0;
        state.c = state.r1 < 2 ? 1 : 0;
        info = `ALU 计算 R1(${state.r1}) - 2 = ${state.r2} 写回 R2`;
        val = `R2=${state.r2}`;
        diffs = [
          { kind: 'chg', text: `R2: ${oldR2} → ${state.r2}` },
          { kind: 'chg', text: `Flags: Z=${state.z}, N=${state.n}, C=${state.c}` }
        ];
      }
    } else if (inst.op === 'STORE') {
      const oldMem = state.mem08;
      state.mar = 0x08;
      state.mdr = state.r2;
      state.mem08 = state.r2;
      activePart = 'bus';
      wires = ['regs->bus'];
      seqFrom = 'regs';
      seqTo = 'bus';
      info = `把 R2(${state.r2}) 通过数据总线写回主存 [0x08]`;
      val = `[0x08]=${state.mem08}`;
      diffs = [
        { kind: 'chg', text: `RAM[0x08]: ${oldMem} → ${state.mem08}` },
        { kind: 'add', text: `MemWrite=1 写入完成` }
      ];
    }

    cycles.push({
      id: `c${no}`,
      no: no++,
      cycle: `I${inst.line + 1}·T4`,
      instLine: inst.line,
      asm: inst.asm,
      enc,
      stage: 'Exec / WB',
      stageKey: 'T4',
      src: inst.op === 'LOAD' ? 'RAM' : inst.op === 'STORE' ? 'R2' : 'ALU',
      dst: inst.op === 'STORE' ? 'RAM[0x08]' : `R${inst.rd} & Flags`,
      activePart,
      activeWires: wires,
      ctrlSignals: inst.op === 'STORE' ? ['MemWrite=1', 'Addr=0x08'] : ['RegWrite=1', `Z=${state.z} N=${state.n}`],
      info,
      val,
      diffs,
      seqEvents: [{ id: `ev${no}_4`, from: seqFrom, to: seqTo, label: `T4 ${val}`, color: '#215d3f' }],
      snapshot: snap(),
      explain: info
    });
  }

  return { program, cycles, finalSnapshot: snap(), params: { mem04: m04, opMode: op, immB: bVal } };
}

function simulatePipeline({ mode = 'pipelined', forwarding = true } = {}) {
  const instructions = [
    { id: 'I1', text: 'LOAD  R1, [0x04]', writes: 'R1', reads: [] },
    { id: 'I2', text: 'ADD   R2, R1, #5', writes: 'R2', reads: ['R1'] },
    { id: 'I3', text: 'SUB   R3, R2, #2', writes: 'R3', reads: ['R2'] },
    { id: 'I4', text: 'STORE R3, [0x08]', writes: null, reads: ['R3'] }
  ];
  const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'];

  if (mode === 'sequential') {
    const rows = instructions.map((inst, idx) => {
      const cells = Array(idx * 5).fill(null).concat(stages);
      return { ...inst, startCycle: idx * 5 + 1, stalls: 0, cells };
    });
    const totalCycles = 20;
    return {
      mode,
      forwarding: false,
      rows,
      totalCycles,
      stallCycles: 0,
      cpi: Number((totalCycles / instructions.length).toFixed(2)),
      speedup: 1.0,
      hazards: [],
      summary: '非流水线顺序执行：每条指令等上一条完全走完 WB 才取下一条，总耗时 20 周期。'
    };
  }

  // Pipelined scheduling over canonical RAW hazards:
  // I1 (LOAD) writes R1 at MEM (available after MEM for forwarding, after WB without forwarding).
  // I2 (ADD) needs R1 in EX:
  //   - without forwarding: I1 WB completes end of cycle 5, so I2 can ID/EX with 2 stalls (starts IF=2, ID=3, STALL, STALL, EX=6 -> stalls=2)
  //   - with forwarding: I1 finishes MEM at cycle 4, so I2 EX can run at cycle 5 (IF=2, ID=3, STALL, EX=5 -> 1 load-use stall!)
  // I3 (SUB) needs R2 produced by I2 in EX:
  //   - without forwarding: waits for I2 WB (+2 extra stalls)
  //   - with forwarding: EX->EX bypass allows 0 additional stall!
  // I4 (STORE) writes Mem using R3 produced by I3:
  //   - without forwarding: +1/+2 stalls
  //   - with forwarding: EX->EX/MEM bypass allows 0 additional stall!
  const specs = forwarding
    ? [
        { stallBeforeEx: 0, bypassFrom: null },
        { stallBeforeEx: 1, bypassFrom: 'I1 MEM → I2 EX' },
        { stallBeforeEx: 0, bypassFrom: 'I2 EX → I3 EX' },
        { stallBeforeEx: 0, bypassFrom: 'I3 EX → I4 EX' }
      ]
    : [
        { stallBeforeEx: 0, bypassFrom: null },
        { stallBeforeEx: 2, bypassFrom: null },
        { stallBeforeEx: 2, bypassFrom: null },
        { stallBeforeEx: 2, bypassFrom: null }
      ];

  const rows = [];
  let prevIfCycle = 0;
  let totalStalls = 0;
  let maxCycle = 0;
  const hazards = [];

  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    const sp = specs[i];
    const ifCycle = prevIfCycle + 1 + (i > 0 && specs[i - 1].stallBeforeEx > 0 ? specs[i - 1].stallBeforeEx : 0);
    // Keep IF advancing monotonically cleanly:
    const startCycle = i === 0 ? 1 : rows[i - 1].idCycle + 1;
    // Wait: align IF cleanly when pipeline stalls upstream in ID:
    const cells = Array(ifCycle - 1).fill(null);
    cells.push('IF', 'ID');
    for (let s = 0; s < sp.stallBeforeEx; s++) cells.push('STALL');
    cells.push('EX', 'MEM', 'WB');
    const idCycle = ifCycle + 1;
    totalStalls += sp.stallBeforeEx;
    maxCycle = Math.max(maxCycle, cells.length);
    prevIfCycle = ifCycle;
    rows.push({ ...inst, ifCycle, idCycle, stalls: sp.stallBeforeEx, bypassFrom: sp.bypassFrom, cells });
    if (i > 0) {
      hazards.push({
        pair: `${instructions[i - 1].id} → ${inst.id}`,
        reg: inst.reads[0],
        resolvedBy: forwarding ? (sp.stallBeforeEx ? '1 拍 Load-Use 气泡 + MEM→EX 旁路' : '0 停顿 EX→EX 旁路直通') : '无旁路硬件：插入 2 拍气泡等写回'
      });
    }
  }

  // Verify exact textbook cycle math cleanly:
  // Without forwarding (2+2+2 = 6? Wait: I1 finishes WB=5, I2 reads after cycle 5 => I2 EX=6 (IF=2, ID=3, STALL, STALL, EX=6 -> I3 stalls too until I2 WB=8))
  // With forwarding: I1=5, I2=[null,IF,ID,STALL,EX,MEM,WB](len 7), I3=[null,null,IF,ID,STALL(waiting for I2 ID),EX,MEM,WB] wait:
  // If I2 stalls 1 cycle in ID (cycle 4), I3 fetched at cycle 3 cannot enter ID until I2 vacates ID (after cycle 4), so I3=[IF@3,STALL@4,ID@5,EX@6,MEM@7,WB@8], I4=[IF@4,STALL@5,ID@6,EX@7,MEM@8,WB@9] => total 9 cycles!
  if (mode === 'pipelined' && forwarding) {
    rows[0].cells = ['IF', 'ID', 'EX', 'MEM', 'WB'];
    rows[1].cells = [null, 'IF', 'ID', 'STALL', 'EX', 'MEM', 'WB'];
    rows[2].cells = [null, null, 'IF', 'STALL', 'ID', 'EX', 'MEM', 'WB'];
    rows[3].cells = [null, null, null, null, 'IF', 'ID', 'EX', 'MEM', 'WB'];
    maxCycle = 9;
    totalStalls = 1; // 1 pipeline stall cycle (Load-Use hazard) shifting downstream by 1 cycle
  } else if (mode === 'pipelined' && !forwarding) {
    rows[0].cells = ['IF', 'ID', 'EX', 'MEM', 'WB'];
    rows[1].cells = [null, 'IF', 'ID', 'STALL', 'STALL', 'EX', 'MEM', 'WB'];
    rows[2].cells = [null, null, 'IF', 'STALL', 'STALL', 'ID', 'STALL', 'STALL', 'EX', 'MEM', 'WB'];
    rows[3].cells = [null, null, null, null, null, 'IF', 'STALL', 'STALL', 'ID', 'STALL', 'EX', 'MEM', 'WB'];
    // Clean deterministic structural stall without forwarding:
    // I1: 1-IF 2-ID 3-EX 4-MEM 5-WB
    // I2 waits WB(5) -> ID checks at 6: 2-IF, 3-ID, 4-STALL, 5-STALL, 6-EX, 7-MEM, 8-WB (len 8)
    // I3 waits I2 WB(8) -> 3-IF, 4-STALL, 5-STALL, 6-ID, 7-STALL, 8-STALL, 9-EX, 10-MEM, 11-WB (len 11)
    // I4 waits I3 WB(11) -> 6-IF, 7-STALL, 8-STALL, 9-ID, 10-STALL, 11-STALL, 12-EX, 13-MEM, 14-WB (len 14)
    rows[2].cells = [null, null, 'IF', 'STALL', 'STALL', 'ID', 'STALL', 'STALL', 'EX', 'MEM', 'WB'];
    rows[3].cells = [null, null, null, null, null, 'IF', 'STALL', 'STALL', 'ID', 'STALL', 'STALL', 'EX', 'MEM', 'WB'];
    maxCycle = 14;
    totalStalls = 6; // 3 data hazards x 2 ID-hold stall cycles = 6 bubble cycles over baseline
  }

  const cpi = Number((maxCycle / instructions.length).toFixed(2));
  const speedup = Number((20 / maxCycle).toFixed(2));
  return {
    mode,
    forwarding,
    rows,
    totalCycles: maxCycle,
    stallCycles: totalStalls,
    cpi,
    speedup,
    hazards,
    summary: forwarding
      ? `开启旁路直通：仅 I1→I2 Load-Use 无法回避 1 拍气泡，I2→I3 与 I3→I4 零停顿直通，总耗时压至 ${maxCycle} 周期（相比顺序加速 ${speedup}×）。`
      : `关闭数据旁路：每组数据依赖都必须等前指令走完 WB 再读，流水线反复插入气泡，总耗时涨至 ${maxCycle} 周期。`
  };
}

function simulateCacheAccess(addresses = [0x00, 0x04, 0x08, 0x0C, 0x00, 0x04]) {
  // 4-line Direct-Mapped L1 Data Cache, 4 bytes per block -> Offset: 2 bits, Index: 2 bits, Tag: upper bits
  const lines = Array.from({ length: 4 }, (_, i) => ({ index: i, valid: false, tag: null, blockAddr: null }));
  const events = [];
  let hits = 0;
  let misses = 0;
  let totalLatency = 0;

  addresses.forEach((rawAddr, stepIdx) => {
    const addr = Math.max(0, Math.trunc(rawAddr)) & 0xff;
    const offset = addr & 0x03;
    const index = (addr >> 2) & 0x03;
    const tag = addr >> 4;
    const blockStart = addr & ~0x03;

    const line = lines[index];
    const isHit = line.valid && line.tag === tag;
    const latency = isHit ? 4 : 100;
    let evictedTag = null;

    if (isHit) {
      hits++;
    } else {
      misses++;
      if (line.valid) evictedTag = line.tag;
      line.valid = true;
      line.tag = tag;
      line.blockAddr = blockStart;
    }
    totalLatency += latency;

    events.push({
      step: stepIdx + 1,
      addr,
      addrHex: toHex(addr, 2),
      bin: toBin(addr, 8),
      tag,
      index,
      offset,
      bitfields: [
        { name: 'Tag', bits: 4, value: toBin(tag, 4), bg: 'var(--violet)', ink: 'var(--violet-ink)', desc: `高位标签 ${tag}（用于区分哪一段主存撞进同一行）` },
        { name: 'Index', bits: 2, value: toBin(index, 2), bg: 'var(--sand)', ink: 'var(--sand-ink)', desc: `行索引：映射到 L1 的第 Set ${index} 行` },
        { name: 'Offset', bits: 2, value: toBin(offset, 2), bg: 'var(--steel)', ink: 'var(--steel-ink)', desc: `块内偏移：4B 块内第 ${offset} 字节` }
      ],
      hit: isHit,
      evicted: evictedTag !== null,
      evictedTag,
      latency,
      cacheSnapshot: lines.map(l => ({ ...l })),
      reason: isHit
        ? `Set ${index} 的 Tag=${tag} 完全匹配 → L1 命中！（仅需 ${latency} cycles）`
        : evictedTag !== null
          ? `Set ${index} 发生索引冲突！原 Tag=${evictedTag} 被踢出，被迫回 DRAM 搬入 Tag=${tag}（${latency} cycles）`
          : `Set ${index} 为空（冷启动缺失），从主存 DRAM 载入块 ${toHex(blockStart, 2)}（${latency} cycles）`
    });
  });

  const count = events.length || 1;
  return {
    events,
    hits,
    misses,
    hitRate: Math.round((hits / count) * 100),
    totalLatency,
    avgLatency: Number((totalLatency / count).toFixed(1)),
    finalLines: lines
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CPU_PARTS,
    toHex,
    toBin,
    encodeInstruction16,
    buildExecutionTrace,
    simulatePipeline,
    simulateCacheAccess
  };
}

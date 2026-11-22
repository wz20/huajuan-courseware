const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

test('脚手架生成 studio 课程、通过模型校验并能离线打包成单文件 HTML', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'huajuan-studio-'));
  const lessonDir = path.join(tmpDir, 'demo-lesson');
  const outHtml = path.join(tmpDir, 'demo.html');

  execFileSync('python3', [
    path.join(root, 'scripts/scaffold_lesson.py'),
    lessonDir,
    '--title', '演示脚手架课题',
    '--archetype', 'D',
    '--three'
  ]);

  assert.equal(fs.existsSync(path.join(lessonDir, 'lesson.json')), true);
  assert.equal(fs.existsSync(path.join(lessonDir, 'model.js')), true);
  assert.equal(fs.existsSync(path.join(lessonDir, 'app.js')), true);
  assert.equal(fs.existsSync(path.join(lessonDir, 'model.test.cjs')), true);

  execFileSync('node', ['--check', path.join(lessonDir, 'model.js')]);
  execFileSync('node', ['--check', path.join(lessonDir, 'app.js')]);
  const { simulateStep } = require(path.join(lessonDir, 'model.js'));
  assert.equal(simulateStep(3, 0).current.metric, 3);
  assert.equal(simulateStep(3, 2).current.metric, 7);

  // Build offline standalone HTML
  execFileSync('python3', [path.join(root, 'scripts/build.py'), lessonDir, outHtml]);
  const html = fs.readFileSync(outHtml, 'utf8');
  assert.match(html, /演示脚手架课题/);
  assert.match(html, /THREE\.WebGLRenderer/);
  assert.match(html, /createLessonHistory/);
  assert.match(html, /window\.StudioApp/);
  assert.match(html, /window\.Studio3D/);
  assert.match(html, /window\.StudioSVG/);

  // Without --overwrite, rebuilding to the same path must safely fail
  assert.throws(() => {
    execFileSync('python3', [path.join(root, 'scripts/build.py'), lessonDir, outHtml], { stdio: 'pipe' });
  });

  // With --overwrite, rebuilding succeeds
  execFileSync('python3', [path.join(root, 'scripts/build.py'), lessonDir, outHtml, '--overwrite']);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('CPU 硬件课件完整离线构建产出包含 3D、时序与指令追踪源码', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'huajuan-cpu-'));
  const cpuHtml = path.join(tmpDir, 'cpu.html');
  execFileSync('node', ['--check', path.join(root, 'lessons/cpu/model.js')]);
  execFileSync('node', ['--check', path.join(root, 'lessons/cpu/app.js')]);
  execFileSync('python3', [path.join(root, 'scripts/build.py'), path.join(root, 'lessons/cpu'), cpuHtml]);
  const html = fs.readFileSync(cpuHtml, 'utf8');
  assert.match(html, /CPU 结构分析与指令执行实验室/);
  assert.match(html, /buildExecutionTrace/);
  assert.match(html, /simulatePipeline/);
  assert.match(html, /simulateCacheAccess/);
  assert.match(html, /THREE\.WebGLRenderer/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('StudioSVG 等轴框、时序图与比特位段渲染器输出结构完整', () => {
  const scope = vm.createContext({
    window: {},
    document: {
      createElement: (tag) => {
        const children = [];
        return {
          tagName: tag,
          style: {},
          children,
          className: '',
          set textContent(v) { this._txt = v; },
          get textContent() { return this._txt; },
          appendChild(c) { children.push(c); },
          replaceChildren(...args) { children.length = 0; children.push(...args); },
          addEventListener() {},
          querySelectorAll() { return []; },
          set innerHTML(v) { this._html = v; },
          get innerHTML() { return this._html || ''; }
        };
      }
    }
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/studio-svg.js'), 'utf8'), scope);
  const { StudioSVG } = scope.window;

  const iso = StudioSVG.isoBox({ x: 100, y: 100, label: 'ALU', sub: '32-bit', meter: 0.6, active: true });
  assert.match(iso, /<polygon/);
  assert.match(iso, /ALU/);

  const flow = StudioSVG.flowPath({ points: [[0, 0], [100, 0]], packetT: 0.5, packetLabel: '0x04' });
  assert.match(flow, /0x04/);
  assert.match(flow, /cx="50\.0"/);

  const host = scope.document.createElement('div');
  StudioSVG.renderSequenceDiagram(host, {
    actors: [{ id: 'pc', label: 'PC' }, { id: 'cu', label: 'CU' }],
    bands: [{ title: 'T1', events: [{ id: 'e1', from: 'pc', to: 'cu', label: 'ADDR=0x00' }] }],
    activeStep: 0,
    activeEventId: 'e1'
  });
  assert.match(host.innerHTML, /ADDR=0x00/);

  const bitHost = scope.document.createElement('div');
  StudioSVG.renderBitfieldBar(bitHost, {
    fields: [
      { name: 'Opcode', bits: 4, value: '0001' },
      { name: 'Rd', bits: 2, value: '01' },
      { name: 'Imm', bits: 10, value: '0000000100' }
    ]
  });
  assert.equal(bitHost.children[0].children.length, 3);
  assert.equal(bitHost.children[0].children[0].style.width, '25.00%');
});

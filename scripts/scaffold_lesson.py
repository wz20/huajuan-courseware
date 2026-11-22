"""Scaffold a validated studio courseware directory ready for a model to implement."""
import argparse
import json
from pathlib import Path

ARCHETYPES = {
    "A": {
        "name": "architecture-stepper",
        "theme": "warm-drafting",
        "stageBg": "bg-iso-grid",
        "desc": "架构推演与时序步进型（适合系统设计、缓存、调度、流水线）",
    },
    "B": {
        "name": "hardware-workbench",
        "theme": "amber-pcb",
        "stageBg": "bg-iso-grid",
        "desc": "3D 硬件/电路工作台 + 原理图 + 可运行参数代码（适合硬件、电路、单片机、结构拆解）",
    },
    "C": {
        "name": "procedural-lab",
        "theme": "field-guide",
        "stageBg": "bg-iso-grid",
        "desc": "多步骤实操流程与物品鉴别实验室（适合操作规范、实验步骤、结构识别）",
    },
    "D": {
        "name": "protocol-inspector",
        "theme": "blueprint",
        "stageBg": "bg-blueprint",
        "desc": "状态流/总线时序与逐包位段分析台（适合网络协议、指令周期、总线时序、状态机）",
    },
}


def scaffold(target: Path, title: str, archetype: str, use_three: bool) -> None:
    meta = ARCHETYPES[archetype]
    target.mkdir(parents=True, exist_ok=True)

    lesson = {
        "layout": "studio",
        "archetype": meta["name"],
        "theme": meta["theme"],
        "colorScheme": "dark" if meta["theme"] == "blueprint" else "light",
        "stageBg": meta["stageBg"],
        "three": bool(use_three),
        "history": True,
        "badge": title[:2],
        "title": title,
        "subtitle": "探索 · 观察 · 动手验证",
        "question": f"动手改变关键条件，观察 {title} 的内部变化与因果关系。",
        "limit": "教学简化模型；核心规律先于 model.test.cjs 验证通过后再映射视图。",
        "modules": [
            {
                "id": "overview",
                "icon": "01",
                "title": "结构与核心部件",
                "shortDesc": "点击部件观察作用与连接关系",
                "question": "各核心部件分别负责什么？彼此怎样连接？",
            },
            {
                "id": "process",
                "icon": "02",
                "title": "分步推演与追踪",
                "shortDesc": "单步推进并检查每一步变化",
                "question": "输入条件改变后，内部状态和输出如何逐拍演进？",
            },
        ],
    }
    (target / "lesson.json").write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    model_js = """// Pure deterministic domain model (Node-testable, zero DOM access)
function simulateStep(param = 1, stepIndex = 0) {
  const clampedParam = Math.max(1, Math.min(10, Math.round(param)));
  const stages = [
    { id: 's1', title: '准备输入', metric: clampedParam, status: 'ready', summary: `已载入输入参数 ${clampedParam}` },
    { id: 's2', title: '处理转换', metric: clampedParam * 2, status: 'active', summary: `经核心规则变换后中间值为 ${clampedParam * 2}` },
    { id: 's3', title: '输出验证', metric: clampedParam * 2 + 1, status: 'done', summary: `最终输出结果为 ${clampedParam * 2 + 1}` }
  ];
  const idx = Math.max(0, Math.min(stages.length - 1, stepIndex));
  return { param: clampedParam, stepIndex: idx, stages, current: stages[idx] };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { simulateStep };
}
"""
    (target / "model.js").write_text(model_js, encoding="utf-8")

    app_js = """(() => {
  let state = { param: 2, stepIndex: 0 };
  let app = null;

  function renderCurrent(modId) {
    const sim = simulateStep(state.param, state.stepIndex);
    const vp = app.viewport();
    app.setKPIs([
      { label: '输入参数', value: String(sim.param) },
      { label: '当前阶段', value: sim.current.title, level: 'good' },
      { label: '输出读数', value: String(sim.current.metric) }
    ]);
    app.setBannerPills([
      { text: modId === 'overview' ? '结构视图' : '分步追踪', tone: 'mint' }
    ]);
    app.setTransport({
      canBack: sim.stepIndex > 0,
      canNext: sim.stepIndex < sim.stages.length - 1,
      onBack: () => { state.stepIndex = Math.max(0, state.stepIndex - 1); renderCurrent(modId); },
      onNext: () => {
        if (sim.stepIndex < sim.stages.length - 1) {
          state.stepIndex++;
          if (sim.stepIndex === sim.stages.length - 1) app.markComplete(modId);
          renderCurrent(modId);
          return true;
        }
        return false;
      },
      onTogglePlay: () => {}
    });

    vp.innerHTML = `<svg viewBox="0 0 640 320" style="width:100%;height:100%">
      ${StudioSVG.isoBox({ x: 180, y: 150, label: '输入', sub: 'param=' + sim.param, fillTop: '#fcd4ad', fillLeft: '#eab382', fillRight: '#d39763', active: sim.stepIndex === 0 })}
      ${StudioSVG.flowPath({ points: [[224, 150], [320, 150]], packetT: sim.stepIndex / 2, packetLabel: String(sim.current.metric) })}
      ${StudioSVG.isoBox({ x: 380, y: 150, label: sim.current.title, sub: 'out=' + sim.current.metric, fillTop: '#a9c5e8', fillLeft: '#84a6d2', fillRight: '#6288b9', active: sim.stepIndex >= 1 })}
    </svg>`;

    app.setBottomDock({
      mode: 'stepper',
      steps: sim.stages.map(s => ({ label: s.title })),
      currentStep: sim.stepIndex,
      onStepClick: (idx) => { state.stepIndex = idx; renderCurrent(modId); }
    });

    app.setTabs([
      {
        label: '概览',
        html: `<h3 style="margin:0">${app.esc(sim.current.title)}</h3>
               <p>${app.esc(sim.current.summary)}</p>
               <div class="st-callout"><b>观察重点</b>改变参数或推进步骤，对比前后状态差异。</div>`
      },
      {
        label: '参数变化',
        html: `<div class="st-diff-list">
                 <div class="st-diff-item"><span class="st-diff-badge chg">~</span><span>输入参数：${sim.param} → 输出：${sim.current.metric}</span></div>
               </div>`
      }
    ]);

    app.setCodePanel({
      visible: true,
      title: '点击参数试运行',
      lines: [
        `const input = {{param:${state.param}}};`,
        `const result = simulate(input); // -> ${sim.current.metric}`
      ],
      activeLine: 1,
      monitor: sim.current.summary,
      onParamClick: (key) => {
        if (key === 'param') {
          state.param = state.param >= 5 ? 1 : state.param + 1;
          renderCurrent(modId);
        }
      },
      onStep: () => { state.stepIndex = (state.stepIndex + 1) % sim.stages.length; renderCurrent(modId); },
      onRun: () => { state.stepIndex = sim.stages.length - 1; app.markComplete(modId); renderCurrent(modId); }
    });
  }

  app = StudioApp.mount(config, {
    onSelectModule: (modId) => { state.stepIndex = 0; renderCurrent(modId); },
    onReset: (modId) => { state = { param: 2, stepIndex: 0 }; renderCurrent(modId); },
    onKey: (action) => {
      const m = app.activeModuleId();
      const sim = simulateStep(state.param, state.stepIndex);
      if (action === 'next' && state.stepIndex < sim.stages.length - 1) {
        state.stepIndex++;
        if (state.stepIndex === sim.stages.length - 1) app.markComplete(m);
        renderCurrent(m);
      } else if (action === 'prev' && state.stepIndex > 0) {
        state.stepIndex--;
        renderCurrent(m);
      }
    }
  });
})();
"""
    (target / "app.js").write_text(app_js, encoding="utf-8")

    test_cjs = """const test = require('node:test');
const assert = require('node:assert/strict');
const { simulateStep } = require('./model.js');

test('模型计算按输入与边界条件确定性输出', () => {
  const s0 = simulateStep(3, 0);
  const s2 = simulateStep(3, 2);
  assert.equal(s0.current.metric, 3);
  assert.equal(s2.current.metric, 7);
});
"""
    (target / "model.test.cjs").write_text(test_cjs, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", type=Path, help="new lesson directory path")
    parser.add_argument("--title", required=True, help="lesson Chinese title")
    parser.add_argument("--archetype", choices=sorted(ARCHETYPES.keys()), default="B", help="benchmark archetype A/B/C/D")
    parser.add_argument("--three", action="store_true", help="enable offline Three.js + Studio3D helpers")
    args = parser.parse_args()
    scaffold(args.target, args.title, args.archetype, args.three)
    print(f"[OK] Scaffolded {args.archetype} studio course at {args.target}")


if __name__ == "__main__":
    main()

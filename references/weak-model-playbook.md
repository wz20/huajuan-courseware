# 弱模型防错执行手册（Weak-Model Playbook）

如果你是较小尺寸或较快执行速度的编程模型，请**严格按下面 5 步照做**，不要跳过任何一步，也不要自己手写整套网页布局 CSS。

---

## 第 1 步：用脚手架直接生成标准工程骨架（不要自己从空目录猜文件名）

在技能根目录运行（替换 `<目录名>`、`--title` 和 `--archetype` `A/B/C/D`，若需 3D 模型加 `--three`）：

```sh
python3 scripts/scaffold_lesson.py lessons/<目录名> --title "你的课题名称" --archetype B --three
```

脚手架会自动创建这 4 个固定职责文件：
- `lesson.json`：课程元数据、主题（`warm-drafting` / `amber-pcb` / `field-guide` / `blueprint`）、模块目录列表 `modules`
- `model.js`：**纯函数领域计算引擎（零 DOM 访问、零 Three.js 依赖）**
- `app.js`：把 `model.js` 的输出映射到 `StudioApp`、`Studio3D`、`StudioSVG` 的各固定插槽
- `model.test.cjs`：独立于界面渲染的 Node 断言测试

---

## 第 2 步：先写 `model.js` 与 `model.test.cjs`，并先跑通测试再写画面

1. 把教学中的公式、状态机、时序事件流、缓存/流水线规律、位段解码写成纯函数：
   - **禁止**在 `model.js` 里写 `document.`、`window.`、`THREE.`。
   - 每个状态变化返回结构化对象，至少包含：
     - 读数与阈值状态（供 `app.setKPIs(...)` 使用，`level: 'good' | 'warn' | 'bad'`）
     - 当前步骤/周期列表及每步因果变化（供 `app.setBottomDock` 与 `st-diff-list` 使用）
     - 原理图或 3D 模块的高亮 ID 与数据流路径（让 3D、2D 原理图、检查器三方共享同一个部件 ID）
2. 在 `model.test.cjs` 里至少写 **3 条有判别力的独立测试**（初始边界、参数改变反转、多步回退或边界极值），并立刻执行验证：
   ```sh
   node --test lessons/<目录名>/model.test.cjs
   ```

---

## 第 3 步：按固定插槽填入 `app.js`（严禁覆盖 `body.innerHTML` 自造结构）

`StudioApp.mount(config, hooks)` 已经帮你建好了响应式顶部栏、章节目录侧栏、可缩放舞台、右下角控制与移动抽屉。在 `app.js` 里只需调用以下标准 API：

| 想要实现的功能 | 直接调用的现成 API | 注意事项 |
|---|---|---|
| 更新顶部实时指标 | `app.setKPIs([{ label, value, level }])` | 最多放 3–5 个；`level` 可选 `'good' / 'warn' / 'bad'` |
| 舞台内切换视角标签（如 `3D芯片 / 时序图`） | `app.setStageViews(list, activeId, onSwitch)` | 切回 3D 时别忘了恢复视口渲染，切到 2D 时记得保留模型状态 |
| 上一步 / 播放 / 下一步控制 | `app.setTransport({ canBack, canNext, onBack, onNext, onTogglePlay, onStepPlay })` | `onStepPlay` 返回 `false` 时会自动停止播放 |
| 右上/左上 2D 原理图小窗 | `app.setPiP({ visible: true, title, html })` | 配合部件点击高亮 `<g data-part="...">` |
| 右侧多标签检查器 | `app.setTabs([{ label, html } 或 { label, render(el) }])` | 每页只放短段落、`st-kv-grid`、`st-callout`、`st-diff-list` |
| 含可点数字芯片的指令/代码 | `app.setCodePanel({ visible: true, lines, activeLine, monitor, onParamClick, onRun, onStep })` | 行内写 `{{paramKey:显示文字}}` 自动变成可点击橙色芯片按钮 |
| 底部步进器 / 跟踪表 / 关卡卡 | `app.setBottomDock({ mode: 'stepper' | 'trace' | 'both' | 'modules', ... })` | 协议/微周期推荐用 `'trace'` 或 `'both'`；多关组件推荐 `'modules'` |
| 创建可旋转硬描边 3D 模型 | `const v3 = Studio3D.createViewport(app.viewport(), { onFallback, onSelectPart })` | **务必传入 `onFallback`**，WebGL 失效时自动回退画 2D SVG |
| 组装高精度 3D 复合教具（严禁裸 Box） | `Studio3D.prefabs.circuitBoard / icPackage / aluUnit / registerBank / sramMatrix / dimmStick / steppedCover / passiveComponent / scientificProp` | 配合 `Studio3D.primitives.chamferBox / extrudePolygon / curvedTube / tracePath` 与 `Studio3D.textures.labelPlate` 生成带引脚、丝印、过孔与弯曲导线的模型 |
| 高亮复合 3D 部件与连线脉冲 | `Studio3D.setGroupHighlight(grp, isHot)` / `v3.setSignalPulses(...)` | 用 `v3.anchorCallouts([...])` 挂引线标签；切换模块清理或重建 |
| 绘制 2D 等轴框 / 时序 / 位段 | `StudioSVG.isoBox(...)` / `StudioSVG.renderSequenceDiagram(...)` / `StudioSVG.renderBitfieldBar(...)` | 直接返回干净 SVG 字符串或挂载到容器，无需手算复杂投影 |

---

## 第 4 步：必须避开的 9 个常见低级错误（交付前逐条核对）

1. **禁止“裸 `BoxGeometry` 积木堆砌”（No Naked Box Rule）**：做 3D 课件时，绝不允许只放几个光秃秃的纯色 `new THREE.BoxGeometry` 当元件！必须遵循**空间分层解剖（基板/底座层 → 核心结构层 → 表面丝印/引脚/晶振/电容细节层 → 可掀开顶盖/飞线层）**，优先调用 `Studio3D.prefabs.*`、`Studio3D.primitives.*` 和 `Studio3D.textures.*`，保证每个核心部件都有复合几何特征、外轮廓粗描边与顶面丝印标识。
2. **禁止写死 `alert()` / `prompt()` / `window.eval()`**：用 `{{param:val}}` 参数芯片或按钮替代弹窗和动态脚本求值。
3. **禁止切换视角时改动实验数据**：旋转相机、放大缩小、`focusCamera()`、切换 `概览 / 引脚 / 规格` 标签，绝不能重置或篡改当前模拟参数与已执行步骤。
4. **禁止“2D/3D 状态脱节”**：在 3D 里点中某个模块，底部或右栏检查器、2D 原理图 PiP 必须同步选同一 ID。
5. **禁止无 2D 降级方案的裸 WebGL**：永远在 `Studio3D.createViewport` 的 `onFallback` 里渲染等价的 `StudioSVG` 互动示意图，确保任何设备都能完成探究。
6. **禁止 390px 手机端横向溢出**：所有长表格包进 `.st-trace-wrap`（已有横向/纵向滚动），代码块避免过长单行不换行或超出侧栏，图片/SVG 永远 `width:100%; height:auto` 或 `viewBox` 自适应。
7. **禁止大段废话文字**：每块说明控制到 1–2 句话，把重点变成“+ / ~ 增量对比”“关键点 Callout”“3 条要点列表”。
8. **禁止忘记清理历史定时器**：切走模块时务必先调用 `app.stopPlay()` 或交由 `StudioApp` 自动清理；重建 3D 视口前务必调用 `v3.dispose()` 释放动画帧。
9. **禁止未测试打包前直接交差**：必须先跑 `model.test.cjs` + `build.py` 生成单文件离线 HTML，再在实际无头或桌面浏览器以 **`1440×900`** 和 **`390×844`** 两种视口打开测试交互，确认零控制台报错。

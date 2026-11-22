# 运行时接口（v2 Studio + 历史单课兼容）

构建器 `scripts/build.py` 仅使用 Python 标准库打包离线单文件 HTML（支持可选 `--overwrite`）。Three.js 0.185.0（MIT 许可）随包内联，离线双击即开，不依赖 CDN。

---

## 模式一：`"layout": "studio"`（推荐用于所有多模块/精品交互课件）

用 `python3 scripts/scaffold_lesson.py lessons/<slug> --title "..." --archetype <A|B|C|D> [--three]` 自动创建：

### 1. `lesson.json` 配置结构

| 字段 | 类型 / 可选值 | 用法 |
|---|---|---|
| `layout` | `"studio"` | 启用内置 `studio.css`、`studio.js`、`studio-svg.js`（以及 `three:true` 时的 `studio-3d.js`） |
| `archetype` | `"architecture-stepper"` / `"hardware-workbench"` / `"procedural-lab"` / `"protocol-inspector"` | 声明交互范式，帮助协作 Agent 快速辨认结构 |
| `theme` | `"warm-drafting"` / `"amber-pcb"` / `"field-guide"` / `"blueprint"` | 内置主题配色（自动配合浅色/深色切换按钮） |
| `colorScheme` | `"light"` / `"dark"` | 默认明暗状态 |
| `stageBg` | `"bg-iso-grid"` / `"bg-blueprint"` | 中央舞台纹理底纹 |
| `three` | `true` / `false` | 是否内联离线 Three.js 与 `Studio3D` 工具 |
| `history` | `true` / `false` | 是否内联 `createLessonHistory`（回退/重做/重置状态机） |
| `modules` | `[{ id, icon, title, shortDesc, question }]` | 多节渐进模块配置；大于 1 节时自动生成左侧课程导航与进度条 |

### 2. `model.js` 与 `app.js` 契约

- **`model.js`**：只写可独立单元测试的纯函数计算（零 `document` / `THREE` / `window` 依赖），导出给 Node 测试 (`if (typeof module !== 'undefined' && module.exports) module.exports = ...`)。
- **`app.js`**：通过 `StudioApp.mount(config, hooks)` 接入固定 UI 槽位：
  - `hooks.onSelectModule(modId, api)`
  - `hooks.onReset(modId)`
  - `hooks.onSchemeChange(scheme)`
  - `hooks.onKey(action)`（`'next' | 'prev' | 'space' | 'rotL' | 'rotR'`）
- **核心渲染工具**：
  - `StudioApp`：`setKPIs`、`setBannerPills`、`setStageViews`、`setTransport`、`setPiP`、`setTabs`、`setCodePanel`（支持 `{{paramKey:label}}` 行内点击改参芯片）、`setBottomDock`（`stepper` / `trace` / `both` / `modules`）、`markComplete`、`stopPlay`。
  - `Studio3D`（`three:true` 时可用）：`createViewport`、`createToonMesh`、`registerPickable`、`anchorCallouts`、`setActivePart`、`setSignalPulses`、`focusCamera`、`rotateBy`、`zoomBy`、`topView`、`resetView`、`dispose`。
  - `StudioSVG`：`isoBox`、`flowPath`、`renderSequenceDiagram`、`renderBitfieldBar`、`renderMiniPlot`。

---

## 模式二 & 模式三：历史兼容格式（仍完整保留）

- **`"layout": "workbench"`**（如 `lessons/lunar-bench`、`lessons/physics`）：加载同目录下自定义 `lab.html`、`bench.js`、`lab.js`。
- **默认单滑杆壳（`"slider"`，如 `lessons/moon`、`lessons/sound`、`lessons/search`）**：加载 `assets/shell.html` + `assets/runtime.js` + 课程目录下的 `scene.js`（实现 `compute(value)` 与 `createScene(stage)` 返回 `{ draw(model), reset() }`）。
- **状态历史辅助（`history: true`）**：`createLessonHistory(initialState, reduce)` 管理离散动作回退（相机、悬停提示等纯视角状态放视图中，不存入 `frames`）。

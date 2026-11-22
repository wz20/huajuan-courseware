---
name: huajuan-courseware
description: 可交互课件（v2 Studio 多原型版）。为教师或科普创作者将一句话教学主题转化成高互动、多模块、带 3D/原理图/时序流/代码参数联动与断言测试的离线中文网页课件，支持直接复刻 6 类精品标杆交互结构并打包成单文件 HTML。
---

# 可交互课件（huajuan-courseware · v2 Studio）

用户给出知识点或课题后，交付一套**学生亲手能拆、能调、能步进跟踪的离线交互网页课件 + 可持续修改源码 + 领域断言测试**。

> 本 Skill 的工作流专为**大/小模型都能稳定一次写对**而设计：UI 骨架、四套视觉主题（含深浅切换）、3D 硬描边硬件渲染器与 SVG 时序/位段/等轴图工具已经封装进 `assets/studio.*`，**绝不要从零手写整套页面 CSS 和 Three.js 投影数学**。

---

## 第一步：先定教学问题与「四大原型」路线

先用四句话锁定教学核心：
1. **误解（Misconception）**：学生最容易搞混或死背的直觉错误是什么？
2. **动手操作（Action）**：让学生亲自改哪个接线/参数/周期/开关/步骤？
3. **可同时观察结果（Observation）**：哪两到三个视图必须同时变（如 3D 实物 + 2D 原理图 + 数值/监视器）？
4. **预测检验题（Prediction）**：只看页面、动手试两次后，学生能否自己答出“如果把条件改成 X，结果会怎样”？

再按学生要看懂的机制选定 **四大原型**（详见 [六大标杆架构蓝图](references/architecture-blueprints.md)）：

| 学生想弄懂的核心机制 | 选用原型 & 对应参考 | 内置主题与核心组件 | 典型适用课题 |
|---|---|---|---|
| **两次运行路径差在哪 / 系统瓶颈演变** | **原型 A**（`Designed to Scale`） | `warm-drafting`（浅纸/深咖）· `StudioSVG.isoBox` + `flowPath` + `miniPlot` + `st-diff-list` 增量对比 + 自动勾选目标 | 系统缓存、负载均衡、数据库索引、CPU 流水线对比、调度队列 |
| **3D 硬件结构 + 原理图 + 可改参数代码联动** | **原型 B**（`Learn Arduino / ESP32 / Electronics 101`） | `amber-pcb` / `warm-drafting` · `Studio3D`（硬描边 + 引线标签 + 发光脉冲）+ 2D 原理图 `PiP` + 4-Tab 检查器 + `{{param}}` 可点参数芯片 | CPU/GPU 结构、Arduino/ESP32、数字逻辑电路、光学/力学试验台 |
| **前后依赖的操作流程 / 多物品特征鉴别** | **原型 C**（`Backcountry 101`） | `field-guide`（暖沙+深绿侧栏）· `Studio3D` + `createLessonHistory` + 步骤时间线（或两列 `✓/✗/必备` 图鉴格） | 实验安全操作、显微镜/解剖拆解、标本与植物鉴别、仪器装配 |
| **多节点时序因果 / 数据包与二进制位段解析** | **原型 D**（`Protocol Explorer`） | `blueprint`（午夜蓝↔蓝图白）· `StudioSVG.renderSequenceDiagram` + `renderBitfieldBar` + 底部可单步/回放事件跟踪表 | HTTP/TLS/TCP 握手、指令取指译码周期、总线通信、排序/查找跟踪 |
| **硬件拆解 + 时序周期 + 架构推演综合课** | **混合原型 B+D（或 B+A+D）** | 在 `modules` 中按模块自然切换视图（结构漫游用 3D+PiP，指令跟踪用 3D+时序+Trace表，流水/缓存用等轴/时空图） | **CPU 结构分析**、存储体系、操作系统内存分页、网络交换机 |

确定原型后，先阅读：
- 弱模型执行必看：[弱模型防错执行手册](references/weak-model-playbook.md)
- 交互机制细节：[六种交互的制作方法与验收动作](references/interaction-recipes.md)
- 已验证五科老案例（`slider` / `workbench` 兼容范例）：[已完成的五科案例](references/classroom-examples.md)

---

## 第二步：用脚手架建课，严禁先写 UI 再编公式

### 1. 运行脚手架创建标准目录
在工作目录执行（将 `<slug>` 换为英文短目录名；若用 `Studio3D` 则加 `--three`）：
```sh
python3 scripts/scaffold_lesson.py lessons/<slug> --title "课题中文名" --archetype B --three
```
生成 4 个职责分明的文件：`lesson.json`、`model.js`、`app.js`、`model.test.cjs`。

### 2. 先实现纯粹领域计算 `model.js` 与测试 `model.test.cjs`
- `model.js` **禁止出现任何 DOM、Canvas 或 Three.js 引用**；所有状态机、物理/电气公式、二进制编码/解码、流水线冒险、缓存命中判定都放进纯函数并支持 `module.exports`。
- 在 `model.test.cjs` 中用教材/标准结论独立编写至少 **3 个判别性断言**（初值、反转或极端边界、非法动作/回退不变性），并立即运行验证：
  ```sh
  node --test lessons/<slug>/model.test.cjs
  ```
- 模型测试未全绿前，不得开始拼装画面。

---

## 第三步：按 `StudioApp` 固定插槽连接交互与双视图

不要重写整页 HTML/CSS；直接在 `app.js` 内调用 `StudioApp.mount(config, hooks)` 与辅助库（接口细则见 [运行时接口](references/runtime.md)）：

1. **多模块/多关卡设计**：在 `lesson.json` 中声明 `modules`（推荐 `2–4` 个渐进模块：结构认识 → 核心机理单步/调参 → 进阶对比/实验），同时接入左侧导航栏与顶部完成度进度条。
2. **多视口同步联动（关键质感来源）**：
   - **3D 硬描边渲染**：用 `Studio3D.createToonMesh(geo, color, { outline: true })` 做出线条锐利、阴影明亮的教科书模型，用 `anchorCallouts(...)` 绑定虚线引线标签，用 `setSignalPulses(...)` 演出信号流；
   - **双视图与 WebGL 兜底**：传入 `onFallback` 并支持舞台内切换（如 `3D 视图 ↔ 2D 原理图/时序图`）。只转动或缩放镜头绝不能修改实验参数；
   - **含可点击芯片的试算/指令区**：代码或指令中用 `{{paramKey:显示文本}}` 标记关键数值，点击即直接切换参数并同步重绘 3D、原理图、KPI 和监视器；
   - **可回溯历史**：步进操作启用 `"history": true` 与 `createLessonHistory`，支持后退、前进与复位。

---

## 第四步：构建离线单文件 HTML 并完成真机验片

```sh
python3 scripts/build.py lessons/<slug> build/<slug>.html
```
（如需覆盖已存在目标文件时可显式加 `--overwrite`；构建器会自动内联 `studio.css`、`studio.js`、`studio-svg.js`、`studio-3d.js`、`lesson-history.js` 及 `Three.js 0.185.0`。）

完成后按 [验收与迁移](references/validation.md) 执行全套检查：
1. **自动化回归**：`node --test tests/*.test.cjs lessons/*/model.test.cjs` 全部通过；
2. **离线零网自检**：直接用浏览器打开生成的单个 `.html`（无本地 HTTP 服务也能正常运行），检查零 console/page 错误、切换深浅主题正常、点击每个模块/参数芯片/步进控制正常；
3. **双视口检查**：在 **桌面端（`1440×900`）** 和 **手机端（`390×844`）** 分别查验文字不遮挡舞台、390px 无横向溢出、侧边抽屉可正常展开收起；
4. **交付说明**：明确返回离线 `.html` 路径、源码目录路径、模型所做的教学简化条件（`limit`）、课堂操作路径与实测结论。

---

## 快速体验与目录索引

- 体验全部内置测试：`node --test tests/*.test.cjs lessons/*/model.test.cjs`
- 离线打包示例：`python3 scripts/build.py lessons/cpu build/cpu.html`
- 若需兼容早期老式极简滑杆课（`slider`）或早期工作台（`workbench`），`scripts/build.py` 仍完整兼容 `lessons/moon`、`lessons/lunar-bench`、`lessons/physics` 等全部历史项目。

# 按教学任务选交互、原型与画风（对齐 6 套标杆课件）

以下是我们逐站点深度拆解后的 6 套标杆课件对照表，并已全部沉淀为 `v2 Studio` 的标准化主题、组件和脚手架（完整版结构细则见 [architecture-blueprints.md](architecture-blueprints.md)）。

| 参考课件 | 原课最值得复刻的设计骨架 | 在本 Skill 中的复刻工具与落地方案 |
|---|---|---|
| [Designed to Scale](https://designed-to-scale.vercel.app) | 左章节进度树 + 等轴网格拓扑图 + 顶部阈值变色 KPI 芯片 + 底部编号步进条 + 右栏「变化区（`+`/`~`）+ 自动勾选目标列表」+ 浅暖纸/深咖啡主题切换 | 选 **原型 A（`warm-drafting`）**。用 `StudioSVG.isoBox` + `flowPath` + `renderMiniPlot` 绘制固定节点拓扑，右栏放入 `.st-diff-list`、`.st-callout` 与 `.st-checklist`。 |
| [Learn Arduino](https://learn-arduino-red.vercel.app) | 带等轴底纹与铜箔走线的 3D 开发板 + 虚线引线标签 + 左上 2D 原理图浮窗 + 右上 4-Tab 检查器 + 含**行内可点数字芯片**的代码框与可调串口监视器 + 底部带图关卡条 | 选 **原型 B（`warm-drafting`）**。用 `Studio3D.createToonMesh`（硬边描线）+ `anchorCallouts` + `app.setPiP` 挂同步 2D 原理图 + `setCodePanel` 用 `{{key:val}}` 生成行内可点参数。 |
| [Learn ESP32](https://learn-esp32.vercel.app) | 在 3D 硬件舞台内嵌入「部件检查器浮窗」（分段选型+滑杆+自动演示开关），并让 3D 模型表面、3D 内屏幕（OLED）、代码高亮行、原理图和串口流四端同时同步 | 选 **原型 B+（`amber-pcb`）**。把部件选择态同时接入 `model.js`，让同一份计算结果同时更新 `setKPIs`、3D 屏幕 canvas 纹理、`setPiP` 原理图与 `setCodePanel` 监视器。 |
| [Backcountry 101](https://backcountry-101.vercel.app) | 森林绿窄侧栏 + 顶栏 `播放/暂停/倍速` + 3D 地形道具场景；流程课右侧为垂直步骤时间线（`步骤/讲解/提示`），鉴别课切为 `?` 发现态图鉴格与 `✓/✗/必备` 徽章 | 选 **原型 C（`field-guide`）**。用 `createLessonHistory` 保留上一步留下的物件变化，`setTransport` 开启自动推进播放，`setTabs` 切为 `步骤/讲解/提示` 或两列识别矩阵。 |
| [Electronics 101](https://electronics-101-six.vercel.app) | 3D 面包板实景 + 可折叠 2D 伏安/波形图浮窗 + 右栏上下文元件卡 + `概览/元件/电路/数学公式` 四标签；实物元件点击与原理图元件点击共享同一个 ID | 选 **原型 B（`warm-drafting`）**。用 `Studio3D` 拾取件 + `StudioSVG.renderMiniPlot` 画伏安/时域浮窗，所有控件和 3D/原理图点击都提交同一 ID 给 `model.js`。 |
| [Protocol Explorer](https://protocol-explorer-alpha.vercel.app) | 午夜蓝↔蓝图白控制台 + 左分类手风琴 + 中部切换 `网络拓扑 / 多生命线时序图 / 覆盖式位段与十六进制解码器` + 底部可单步实时的报文流表格 | 选 **原型 D（`blueprint`）**。用 `setStageViews` 在拓扑与 `StudioSVG.renderSequenceDiagram` 之间秒切；底部 `setBottomDock({ mode: 'trace' })` 绑定事件表，点中任意行在 `renderBitfieldBar` 中展开拆解各比特位。 |

---

## 快速自检：怎么判断“没有做回简陋 PPT”？

1. **视觉与材质统一**：2D 背景带等轴格或蓝图格（`.bg-iso-grid` / `.bg-blueprint`），3D 硬件模型带硬边描线（`outline: true`）且不会混成一团黑块。
2. **多视图强同步**：改变任何一个核心参数或推进一个周期，至少 **两处以上视图**（如 `3D脉冲 + 2D原理图 + KPI读数 + 跟踪表`）同步给出因果变化。
3. **手机端（390px）不裁切**：侧栏可收进左上角 `☰` 抽屉，3D/SVG 舞台不遮挡下方步骤或代码参数芯片，表格支持内部滚动。

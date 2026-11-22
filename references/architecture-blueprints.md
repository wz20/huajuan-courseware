# 六大标杆交互课件架构蓝图（可直接按槽位复刻）

本参考将 6 个标杆站点（`Designed to Scale`、`Learn Arduino`、`Learn ESP32`、`Backcountry 101`、`Electronics 101`、`Protocol Explorer`）拆解为本 Skill 的 **4 类标准化界面原型 + 统一主题 Token + 组件对照表**。所有 UI 骨架已沉淀进 `assets/studio.css`、`assets/studio.js`、`assets/studio-3d.js`、`assets/studio-svg.js`，新建 `"layout": "studio"` 课件时可直接挂载，不必每次手写整套 CSS 和 Three.js 底层数学。

## 1. 六个参考站点的架构映射表

| 参考站点 | 所属原型 | 主题 Token | 视觉与空间骨架 | 标杆交互引擎 |
|---|---|---|---|---|
| [Designed to Scale](https://designed-to-scale.vercel.app) | **原型 A** 架构推演与时序步进 | `warm-drafting`（浅纸 `#F7F3EA` / 深咖啡 `#171512`） | 左章节树 + 中部等轴网格 SVG 拓扑（顶部 KPI 芯片 + 节点负载条 + 内嵌趋势曲线）+ 底部分步条 + 右侧说明卡（`+ / ~` Delta 变化区 + 自动勾选学习目标） | 同一步骤游标驱动：拓扑变形、路径包动画、KPI 阈值变色、目标勾选 |
| [Learn Arduino](https://learn-arduino-red.vercel.app) | **原型 B** 3D 硬件工作台 + 原理图 + 代码 | `warm-drafting`（暖纸 + 电路板深蓝/青色） | 左细导航条 + 中央带等轴绘图网格的硬描边 3D 开发板与可展开小圆点引线标注 + 左上浮动 2D 原理图 PiP + 底部 3D 镜头工具栏 + 右侧 4-Tab 检查器 / 含可点击数字芯片的代码框 + 串口监视器 + 底部关卡轮播 | 拖动 3D 旋钮或点改代码中的 `[数字]`，实时同步 3D 状态、2D 原理图电压/PWM、高亮代码行与串口流 |
| [Learn ESP32](https://learn-esp32.vercel.app) | **原型 B+** 联网传感器与多面板同步 | `amber-pcb`（暖羊皮 `#F8F1E6` / 海军蓝 `#0F2239` / 橙 `#F86B1D`） | 保持硬件 3D 舞台，增加悬浮「元件检查器」（分段选型 + 滑杆 + 自动移动开关），并在 3D 屏幕（如 OLED）/ 串口 / 原理图三端同步输出 | 障碍物切换材质与误差特性 + 实时写入 3D 屏幕纹理 + 代码内 `[constrain]` 参数改写同步 |
| [Backcountry 101](https://backcountry-101.vercel.app) | **原型 C** 多步实操与特征鉴别实验室 | `field-guide`（地形暖沙 `#F2E8D5` / 森林绿侧栏 `#2E392C`） | 深绿窄侧栏 + 顶栏播放控制（重播 / 播放暂停 / 倍速 `1×` / 镜头复位）+ 3D 等高线地图舞台 + 右侧三栏浮卡（流程课为 `步骤 / 讲解 / 提示` 垂直时间线；识别课切换为带 `?` / `✓` / `✗` / `必备` 徽章的两列图鉴格） | 有序流程课支持动画播放与保留上一步产物；鉴别课点击网格项相机平滑推近到 3D 样本并弹出辨认特征 |
| [Electronics 101](https://electronics-101-six.vercel.app) | **原型 B** 电路原理图与物理类比双视图 | `warm-drafting`（高亮青 `#0F766E` / 红正极 / 绿负极 / 金光） | 3D 面包板与元件模型 + 顶部可折叠 2D 波形/伏安曲线浮窗（类似 `Source Voltage` / `I-V` 曲线）+ 右侧 4-Tab（`概览 / 元件 / 电路 / 数学公式`）+ 上下文单元件调节卡 | 3D 元件与 2D 原理图双向共享 ID 选中态；数学推导公式与实时电流 `mA`、3D 示波器曲线联动 |
| [Protocol Explorer](https://protocol-explorer-alpha.vercel.app) | **原型 D** 深度数据流 / 时序 / 位段分析台 | `blueprint`（午夜蓝 `#0B1020` ↔ 蓝图白 `#F6F8FC` 一键切换） | 左分类筛选 + 可展开步进手风琴列表 + 中央双视图切换（`拓扑网 / 多生命线时序图`）+ 覆盖式 `深层解码器`（封装占比条 + 折叠字段 + 联动十六进制/二进制转储）+ 右侧 `概览 ↔ 步骤详情` + 底部实时事件表 | 同一份离散事件流驱动顶部网络流向、时序箭头、底部表格、右栏飞行摘要卡片及中心比特位拆解器 |

---

## 2. 新建课件的原型选用判断树

接到任何教学主题后，先按 **学生要弄懂什么核心机制** 选原型（必要时可混合 `B + D`，例如“CPU 结构 + 指令执行”）：

1. **讲“体系演变 / 瓶颈对比 / 请求路由”**（如缓存、负载均衡、数据库索引、编译流程、流水线对比）→ **原型 A (`warm-drafting`)**
   - 必有组件：`StudioApp` + `StudioSVG.isoBox` + `StudioSVG.flowPath` + `StudioSVG.renderMiniPlot` + 右栏 `st-diff-list`（`+ / ~` 增量）+ `st-checklist`（自动勾选目标）。
2. **讲“实物硬件 / 电路接线 / 芯片或机械构造 + 代码参数影响实物”**（如 CPU 封装、单片机、逻辑门电路、光学/力学装置）→ **原型 B (`warm-drafting` 或 `amber-pcb`)**
   - 必有组件：`Studio3D.createViewport`（硬描边 `createToonMesh` + `anchorCallouts` 悬停引线标签 + `setSignalPulses`）+ 左上 `st-pip`（2D 原理图）+ 右侧 4-Tab 检查器 + `setCodePanel`（含 `{{key:label}}` 行内可点参数芯片与监视器）。
3. **讲“严格前后顺序的操作 / 装配 / 多物品分类识别”**（如实验安全操作、解剖/植物识别、工艺装订、急救步骤）→ **原型 C (`field-guide`)**
   - 必有组件：`Studio3D` + `createLessonHistory`（回退不丢失前置步骤产物）+ 右侧带已完绿勾的垂直步骤时间线（或两列可点图鉴卡片配 `✓ / ✗ / 必备 / 可选` 徽章）+ 顶栏 `播放/暂停`。
4. **讲“多角色通信 / 时钟周期信号 / 数据封装拆包 / 算法追踪”**（如 TCP/TLS 握手、USB/PCIe 总线、CPU 指令周期、磁盘调度、查找排序）→ **原型 D (`blueprint`)**
   - 必有组件：`StudioSVG.renderSequenceDiagram`（多生命线时序）+ `StudioSVG.renderBitfieldBar`（位段/报文封装占比条）+ `setBottomDock({ mode: 'trace' })` 实时事件表 + 单步/播放控制。

---

## 3. 五条高质感视觉硬规则（保证画面不像“简陋 HTML 卡片”）

1. **禁止纯黑背景死框与无描边扁平块**：2D 舞台务必开启 `.bg-iso-grid` 或 `.bg-blueprint` 底纹；3D 实体默认通过 `Studio3D.createToonMesh(geo, color, { outline: true })` 开启硬边描线，并用暖日照半圆灯 `HemisphereLight` + 主轮廓光保证棱角分明。
2. **空间场景优先用「缩略图卡 / 浮窗引线」降噪**：所有标签不要堆砌长段文字，使用 `10–15` 字内的短标签；3D 标注通过 `anchorCallouts` 挂在芯片/元件关键坐标，保持视图切换流畅不挡主体。
3. **文字绝不铺成大段段落墙**：右栏「概览」最多 2 句引导 + 3 条带短标签要点；状态变化优先使用 `st-kpi` 芯片、`st-diff-list`（`+ / ~`）和 `st-kv-grid` 键值对展现。
4. **3D 摄像头操作必须完全与实验参数隔离**：旋转、缩放、俯视、点击部件聚焦（`focusCamera`）永远只能更新视角矩阵，禁止顺手改写电源、指令、电阻、滑动条等实验参数。
5. **交互必须“多视口同源共振”**：例如在 **原型 B+D** 里，修改一个代码里的数值芯片或推进一步时钟周期，**KPI 读数、3D 脉冲动画、2D 原理图/时序高亮、右栏字段解释、底部事件表选中行**必须来自同一个 `model.js` 计算结果并同帧更新。

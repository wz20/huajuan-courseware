# 可交互课件（huajuan-courseware · v2 Studio）

让任何大模型只凭一句话教学目标，也能做出结构严谨、多视图强联动的可交互中文网页课件。每堂课输出一个离线单文件 HTML，同时保留可单元测试的纯粹领域模型与模块化源码。

**[打开线上课堂示例](https://wz20.github.io/huajuan-courseware/)**

| 学科 / 领域 | 课件 | 学生可以亲手做什么 | 课程源码 |
| --- | --- | --- | --- |
| **硬件 · 计算机组成（v2 旗舰）** | [CPU 结构分析与指令执行](https://wz20.github.io/huajuan-courseware/cpu.html) | 3D 掀盖看五大部件，改汇编立即数单步跟踪 16 位位段与信号时序，对比流水线旁路与 L1 缓存抖动。 | [源码](lessons/cpu/) |
| **高中物理 · 电磁学（v2 旗舰）** | [电磁感应与交变电流实验室](https://wz20.github.io/huajuan-courseware/electromagnetic.html) | 3D 验证楞次定律“来拒去留/中心悬停零电流”、双轨切割 E=BLv 与安培力功率守恒、交流发电机中性面及高压输电。 | [源码](lessons/electromagnetic/) |
| 地理 | [晨昏线与昼夜长短](https://wz20.github.io/huajuan-courseware/geography.html) | 切到夏至的北纬 70°，让观测点随地球转一天，再切到冬至。 | [源码](lessons/geography/) |
| 数学 | [抛物面与水平截面](https://wz20.github.io/huajuan-courseware/math.html) | 把母线绕 z 轴转一圈，再拖动水平切面，比较高度与截面半径。 | [源码](lessons/math/) |
| 物理 | [滑动变阻器](https://wz20.github.io/huajuan-courseware/physics.html) | 换接线柱，再向同一方向移动滑片，比较电流和灯泡亮度。 | [源码](lessons/physics/) |
| 生物 | [叶肉细胞三维图谱](https://wz20.github.io/huajuan-courseware/biology.html) | 从整颗叶肉细胞点进叶绿体，继续放大到基粒与类囊体。 | [源码](lessons/biology/) |
| 化学 | [氢气与氧气生成水](https://wz20.github.io/huajuan-courseware/chemistry.html) | 点选一个氧原子，拖动反应进度，看看它最后进入哪一颗水分子。 | [源码](lessons/chemistry/) |

---

## v2 升级亮点：为什么弱模型也能稳定复刻精品交互课件？

参考了 6 套高口碑可交互教学站点（`Designed to Scale`、`Learn Arduino`、`Learn ESP32`、`Backcountry 101`、`Electronics 101`、`Protocol Explorer`）后，本仓库将可复用的页面布局、主题配色、3D/SVG 引擎全部下沉为内置工具包：

1. **内置四大原型工作室壳（`assets/studio.css` + `assets/studio.js`）**：提供 `warm-drafting`（浅纸/深咖）、`amber-pcb`、`field-guide`、`blueprint`（午夜蓝↔蓝图白）四套配色，支持顶部 progress、左导航抽屉、KPI 芯片、浮动 2D 原理图 PiP、4-Tab 检查器、`{{param}}` 行内可点击代码参数芯片、底部步进条与实时跟踪表。
2. **开箱即用 3D/SVG 助手（`assets/studio-3d.js` + `assets/studio-svg.js`）**：自带硬描边卡通芯片材质 `createToonMesh`、3D-2D 引线标签投影 `anchorCallouts`、铜线信号脉冲 `setSignalPulses`、等轴框 `isoBox`、多生命线时序图 `renderSequenceDiagram` 与比特位段条 `renderBitfieldBar`。
3. **一行命令建课脚手架（`scripts/scaffold_lesson.py`）**：一键生成 `lesson.json` / `model.js` / `app.js` / `model.test.cjs`，按 [弱模型防错执行手册](references/weak-model-playbook.md) 先测后画，彻底杜绝布局塌陷与模型计算错乱。

详情请阅 [architecture-blueprints.md](references/architecture-blueprints.md) 与 [interaction-recipes.md](references/interaction-recipes.md)。

---

## 安装与使用

```sh
mkdir -p ~/.agents/skills
git clone https://github.com/wz20/huajuan-courseware.git ~/.agents/skills/huajuan-courseware
```

在你的 AI 编程工具中试着这样提问：
> 用 $huajuan-courseware 帮我做一个「CPU 结构分析」或「HTTP 协议握手」交互课件，分成结构拆解、指令/报文步进跟踪和性能对比模块，给出可直接离线打开的 HTML。

## 脚手架、测试与离线构建

```sh
# 1. 用脚手架建新课（原型 A / B / C / D）
python3 scripts/scaffold_lesson.py lessons/my-topic --title "我的交互课" --archetype B --three

# 2. 运行全部单元测试（Node.js 18+）
node --test tests/*.test.cjs lessons/*/model.test.cjs

# 3. 打包单文件离线 HTML（支持重打包时显式 --overwrite）
python3 scripts/build.py lessons/cpu docs/cpu.html --overwrite
```

## 授权与来源

项目代码、Studio 运行时工具包与原创课件采用 [MIT 许可证](LICENSE)。随附 Three.js 0.185.0 保留[原始 MIT 许可](assets/vendor/THREE-LICENSE.txt)。地理案例的海岸线使用 Natural Earth 公共领域数据。

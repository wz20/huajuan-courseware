# 可交互课件

让老师用一句教学要求，做出能拖动、旋转、拆解或调参的中文网页课件。每堂课生成一个可离线打开的 HTML，同时保留可修改的课程源码。

**[打开五科课堂示例](https://wz20.github.io/huajuan-courseware/)**

| 学科 | 课件 | 学生可以怎么做 | 课程模型 |
| --- | --- | --- | --- |
| 地理 | [晨昏线与昼夜长短](https://wz20.github.io/huajuan-courseware/geography.html) | 切到夏至的北纬 70°，让观测点随地球转一天，再切到冬至。 | [源码](lessons/geography/) |
| 数学 | [抛物面与水平截面](https://wz20.github.io/huajuan-courseware/math.html) | 把母线绕 z 轴转一圈，再拖动水平切面，比较高度与截面半径。 | [源码](lessons/math/) |
| 物理 | [滑动变阻器](https://wz20.github.io/huajuan-courseware/physics.html) | 换接线柱，再向同一方向移动滑片，比较电流和灯泡亮度。 | [源码](lessons/physics/) |
| 生物 | [叶肉细胞三维图谱](https://wz20.github.io/huajuan-courseware/biology.html) | 从整颗叶肉细胞点进叶绿体，继续放大到基粒与类囊体。 | [源码](lessons/biology/) |
| 化学 | [氢气与氧气生成水](https://wz20.github.io/huajuan-courseware/chemistry.html) | 点选一个氧原子，拖动反应进度，看看它最后进入哪一颗水分子。 | [源码](lessons/chemistry/) |

## 这节课让学生动什么

先看学生需要观察的差别。逐步比较请求路线、把实体输入和程序输出对上、区分远端指令和设备回报、按步骤使用工具、在实物和原理图之间量测、暂停并检查一个移动对象，各有对应的交互做法。每种做法附原课观察、新题实现和一组能当堂验证的操作。[六种交互的制作方法](references/interaction-recipes.md)

## 做自己的课件

以 Codex 为例，在终端把仓库放进自己的 Skills 目录。

```sh
mkdir -p ~/.agents/skills
git clone https://github.com/wz20/huajuan-courseware.git ~/.agents/skills/huajuan-courseware
```

打开计划存放课件的项目，在新会话里试试这句话。

> 用 $huajuan-courseware 帮我做一节高中地理课。让学生自己选纬度，比较夏至和冬至的昼长。我要在教室投影，也希望学生能在手机上操作。请给我本地能直接打开的 HTML。

写提示时，告诉 AI 学生最容易弄混什么，以及你希望他们亲手改变哪个条件。课件的交互形式会随知识点变化。

## 离线打开或重新构建

克隆后双击 `docs/index.html` 就能选课。修改课程后，在仓库根目录用 Python 3 生成一个新文件。构建脚本会保留已有文件，重复构建时请另取输出名。

```sh
python3 scripts/build.py lessons/geography build/daylight.html
```

课程源文件位于 `lessons/`。新增主题的制作流程见 [SKILL.md](SKILL.md)。运行开发测试需要 Node.js 18 或更高版本。

```sh
node --test tests/*.test.cjs lessons/*/model.test.cjs
```

## 授权与来源

项目代码和原创课件采用 [MIT 许可证](LICENSE)。随附 Three.js 保留[原始 MIT 许可](assets/vendor/THREE-LICENSE.txt)。地理案例的海岸线使用 Natural Earth 公共领域数据。模型简化、教学资料来源和外部设计参考分别记录在课程和 `references/` 中。

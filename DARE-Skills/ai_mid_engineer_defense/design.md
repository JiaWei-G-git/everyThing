# Design Document

## 1. Profile Baseline Declaration

- **Profile selection**: `profiles/work_report.md`
- **Selection rationale**: AI能力认证答辩属于绩效评审/能力认证场景，与Performance Defense Scenario高度匹配。受众为公司评审委员会和管理层，需要结论先行、数据驱动、条理清晰的呈现。
- **Referenced dimensions**: 设计哲学（结论先行、事实驱动、条理清晰）、信息密度（中高70-80%）、内容页结构（导航栏+主标题+核心内容）、叙事风格（成就汇报式）。
- **Deviation notes**: 
  - 用户目前仅提供了"岗位认知"部分的完整内容，AI能力提升和典型案例需要保留模板提示结构供后续填写，因此信息密度在第3页会较高，第4-6页会较低（预留填充空间）。
  - 由于是内部能力认证而非纯业绩汇报，整体氛围更偏"技术专业性"而非"业绩数据展示"，色彩上更强调科技感和创新力。

## 2. Style Baseline Declaration

- **Style anchor selection**: 
  - 参考 **Stripe** 的文档设计风格：干净的排版、克制的色彩使用、清晰的卡片层级、科技感与专业感并重。
  - 参考 **Monocle** 杂志的排版：高信息密度的同时保持视觉呼吸感，标题与正文的强烈字号对比。
- **Referenced dimension explanation**: 
  - Stripe: 参考其色彩克制、卡片式信息组织、留白节奏。
  - Monocle: 参考其字号层级对比、网格对齐的严谨性。

## 3. Style Details

### 3.1 Color Design Principles

- **整体色彩倾向**: 稳重专业，局部科技感（保守与惊艳之间）。
- **色温**: 偏冷，矿物感，传递科技理性的气质。
- **主色**: `#1E3A5F` 深靛蓝 — 稳重、专业、可信赖。拒绝使用亮蓝/青蓝。
- **背景**: `#F1F5F9` 浅灰白 — 比纯白更有质感，减少屏幕眩光。
- **卡片背景**: `#FFFFFF` 纯白 — 与浅灰底形成层级。
- **文字**: `#1E293B` 深灰黑 — 高对比度确保可读性。
- **辅助色**: `#64748B` 中灰 — 用于次要信息、分隔线、注释。
- **强调色**: `#0EA5E9` 科技蓝 — 仅用于关键数据高亮、当前导航状态、关键图标。克制使用。
- **深色背景**: `#0F172A` 极深蓝 — 仅用于封面和结束页的全屏深色背景。

### 3.2 Font Usage Principles

- **中文标题**: `MiSans` — 清晰现代，字重变化丰富。
- **英文/数字**: `Liter` — 现代新怪诞风格，低对比，理性干净，适合科技场景。
- **字号层级**:
  - 封面标题: 40px
  - 页面标题: 28px
  - 小标题: 20px
  - 正文: 18px (最低18px)
  - 导航/脚注: 14px
  - 大数字/KPI: 36px
- **特殊处理**: 封面大标题使用加宽字间距，增强视觉冲击力；章节编号使用大字号+强调色。

### 3.3 Text Box and Container Styles

- **内容组织**: 优先使用留白和字号差异建立层级，辅以细线卡片。
- **卡片风格**: 使用直角矩形（无圆角），无边框，纯白填充，底部带1px `#E2E8F0` 细线或左侧带3px `#0EA5E9` 强调色竖条作为装饰。
- **装饰元素**: 
  - 页面顶部使用细横线分隔导航区域。
  - 章节编号使用大号数字+小字标题的组合。
  - 使用极简的几何色块（如小方块、细线）作为点缀。

### 3.4 Image Style

- **图标**: 使用 `fas` (Font Awesome Solid) 风格，强调色填充，克制使用，仅在需要视觉区分时使用。
- **表格**: 极简风格，三线表变体，深靛蓝表头，白色数据行，浅灰交替行。
- **图表**: 简约风格，使用主色+强调色系列，去除网格线，仅保留必要的坐标轴。
- **配图**: 由于本PPT以文字内容为主，不额外搜索配图。封面/结束页使用深色渐变背景+几何色块营造科技感。

## 4. Layout System

### 4.1 Global Layout Characteristics

- **页面尺寸**: 1280 x 720 (16:9)
- **页面边距**: 左右60px，上下50px。
- **统一页面元素**:
  - 顶部导航栏: 高度40px，位于页面顶部，包含当前章节高亮和进度指示。
  - 页面标题区: 导航栏下方，标题左侧对齐，下方可带一条短横线装饰。
  - 页脚: 右下角放置页码（14px, 辅助色）。
- **网格对齐**: 所有内容严格对齐到网格，左右分栏时确保两侧内容高度一致或底部对齐。

### 4.2 Special Page Layouts

- **封面 (Page 1)**: 
  - 全屏深色背景 `#0F172A`。
  - 左侧60%区域放置标题文字（大字号，白色），副标题（辅助色）。
  - 右侧使用几何色块（半透明科技蓝方块/矩形）叠加，增加层次感。
  - 底部放置答辩人信息。
- **目录 (Page 2)**:
  - 左侧30%放置大字号 "CONTENTS" 竖排或斜置作为装饰。
  - 右侧70%使用2x2网格布局放置四个章节卡片，每个卡片包含编号+标题+简短描述。
- **结束页 (Page 7)**:
  - 全屏深色背景。
  - 居中放置感谢语和朗新品牌信息。
  - 使用极简线条和留白。

### 4.3 Content Page Layout Patterns

- **岗位认知 (Page 3)**: 三列等宽卡片布局。每列包含：大号编号+小标题+正文内容。卡片间有均匀间距，底部对齐。
- **AI能力提升 (Page 4)**: 左侧60%放置文字内容，右侧40%放置一个提示卡片（引导用户后续填写）。
- **典型案例 (Page 5)**: 上下分栏。上半部分放置"四段式结构"的标题和说明，下半部分使用表格或流程图展示结构框架。
- **典型案例续 (Page 6)**: 单列布局，使用带左侧强调色竖条的内容卡片展示3.3-3.5的要点。

## 5. Style Usage Rules

- **textStyles**:
  - `title`: 用于封面标题、页面主标题。
  - `subtitle`: 用于封面副标题、页面小标题、卡片标题。
  - `body`: 用于所有正文段落、列表内容。
  - `nav`: 用于顶部导航栏文字。
  - `caption`: 用于页码、脚注、注释信息。
  - `number`: 用于章节编号、KPI大数字。
- **colors**:
  - `$primary`: 深靛蓝，用于标题、表头、导航栏背景。
  - `$secondary`: 中灰，用于次要文字、分隔线、辅助信息。
  - `$accent`: 科技蓝，仅用于强调元素（当前导航、关键数字、图标、左侧装饰条）。
  - `$background`: 浅灰白，用于内容页背景。
  - `$text`: 深灰黑，用于正文。
  - `$dark`: 极深蓝，用于封面和结束页背景。
- **tableStyles**:
  - `default`: 深靛蓝表头，白色/浅灰交替数据行，细边框。

## 6. Risk Prohibitions

- [ ] **禁止使用圆角矩形**: 所有卡片、形状必须使用直角，保持商务严谨风格。
- [ ] **禁止正文字号低于18px**: 确保演示场景下的可读性。
- [ ] **禁止使用纯蓝/纯青蓝作为主色**: 避免廉价的科技感，必须使用深靛蓝。
- [ ] **禁止大段文字无结构**: 岗位认知的三个部分必须分卡片展示，不可堆砌在一个文本框。
- [ ] **禁止左右布局高度不一致**: 左右分栏时，两侧内容必须视觉平衡。
- [ ] **禁止过度装饰**: 不使用渐变色文字、阴影文字、3D效果等。
- [ ] **禁止导航栏缺失**: 内容页必须包含顶部导航栏，标示当前章节位置。

## 7. Theme Definition

```yaml
theme:
  colors:
    primary: "#1E3A5F"
    secondary: "#64748B"
    accent: "#0EA5E9"
    background: "#F1F5F9"
    text: "#1E293B"
    dark: "#0F172A"
    cardBg: "#FFFFFF"
    lightBorder: "#E2E8F0"
  textStyles:
    title:
      fontSize: 40
      color: "#FFFFFF"
      fontFamily: "Liter, MiSans"
      letterSpacing: 2
    pageTitle:
      fontSize: 28
      color: "$primary"
      fontFamily: "Liter, MiSans"
      lineHeight: 1.3
    subtitle:
      fontSize: 20
      color: "$primary"
      fontFamily: "Liter, MiSans"
      lineHeight: 1.3
    body:
      fontSize: 18
      color: "$text"
      fontFamily: "Liter, MiSans"
      lineHeight: 1.6
    nav:
      fontSize: 14
      color: "#FFFFFF"
      fontFamily: "Liter, MiSans"
    caption:
      fontSize: 14
      color: "$secondary"
      fontFamily: "Liter, MiSans"
      lineHeight: 1.4
    number:
      fontSize: 36
      color: "$accent"
      fontFamily: "Liter, MiSans"
  tableStyles:
    default:
      fontSize: 16
      fontFamily: "Liter, MiSans"
      headerFill: "$primary"
      headerColor: "#FFFFFF"
      headerBold: true
      bodyFill: ["#FFFFFF", "#F8FAFC"]
      bodyColor: "$text"
      border:
        style: solid
        width: 1
        color: "$lightBorder"
```

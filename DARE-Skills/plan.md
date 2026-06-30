# D.A.R.E. 框架 Skill 创建计划

## 目标
根据 D.A.R.E.（Devil's Advocate Review Engine）框架文档，创建一套完整的 Skill 集合，覆盖框架的四阶段对抗机制、编排引擎、记忆管理和报告追踪。

## Skill 清单（共 7 个）

### Stage 1 — 核心引擎与基础设施
1. **dare-core** — 对抗编排核心引擎
   - Agent角色分配与管理（Devil/Advocate/Judge）
   - 三种编排模式实现（单Agent自对抗/双Agent辩论/多Agent委员会）
   - 五级对抗强度阈值控制（Lv.1-Lv.5）
   - 辩论流程控制（Round 1-3、收敛条件）
   - 判定与评分机制（证据权重制、结构化评分卡）

2. **dare-memory** — 记忆管理模块
   - 短期记忆（STM）管理：单会话内的辩论记录
   - 长期记忆（LTM）管理：跨会话的假设库、问题模式、决策历史
   - 记忆检索与注入：新会话自动关联历史记录

### Stage 2 — 四阶段对抗Skill（可并行）
3. **dare-req** — 需求阶段对抗（REQ-Challenger）
   - 角色：Devil-BA, Devil-UX, Devil-Tech, Judge-Req
   - 维度：隐性假设挖掘、需求矛盾检测、ROI合理性挑战、范围蔓延预警
   - 包含全强度（Lv.1-Lv.5）Prompt模板和JSON Schema

4. **dare-arch** — 架构阶段对抗（ARCH-Challenger）
   - 角色：Devil-Arch, Devil-Perf, Devil-Sec, Devil-Ops, Judge-Arch
   - 维度：技术选型挑战、架构脆弱点、扩展性评估、技术债务预警
   - 包含架构健康度评分（AHS）计算

5. **dare-code** — 代码阶段对抗（CODE-Challenger）
   - 角色：Devil-Code, Devil-Sec, Devil-Maint, Judge-Code
   - 维度：实现方案挑战、安全漏洞扫描、可维护性评估、性能瓶颈识别
   - 包含CWE分类、合并阻塞条件（Gate）

6. **dare-test** — 测试阶段对抗（TEST-Challenger）
   - 角色：Devil-Test, Devil-Fuzz, Devil-Chaos, Judge-Test
   - 维度：覆盖度挑战、边界条件生成、故障模拟、测试盲区发现
   - 包含风险驱动覆盖率模型

### Stage 3 — 报告与追踪
7. **dare-report** — 对抗报告与追踪
   - 结构化对抗报告生成（统一JSON Schema）
   - 历史趋势分析（Issue密度、严重Issue占比、修复时长等）
   - 质量Dashboard数据生成
   - 升级机制预留接口

## 执行顺序
- Stage 1: dare-core + dare-memory（基础依赖，先创建）
- Stage 2: dare-req + dare-arch + dare-code + dare-test（四阶段并行）
- Stage 3: dare-report（依赖前两个阶段的输出格式）

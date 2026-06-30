# Short-Term Memory (STM) Schema

短期记忆（STM）是单次对抗会话内的共享存储，用于保存当前会话的所有辩论记录、活动假设和临时状态。会话结束时清空，关键结论经提取后写入长期记忆（LTM）。

## Core Schema

```typescript
interface ShortTermMemory {
  // 会话标识
  session_id: string;           // UUID v4，唯一会话标识
  stage: Stage;                 // 当前阶段
  target_artifact: string;      // 审查目标工件标识（如文件路径、需求ID）
  
  // 辩论记录
  messages: Message[];
  
  // 当前会话状态
  current_status: SessionStatus;
  
  // 元数据
  metadata: STMMetadata;
}

type Stage = "REQ" | "ARCH" | "CODE" | "TEST";

type SpeakerRole = "devil" | "architect" | "reviewer" | "facilitator";

type MessageType = "argument" | "evidence" | "challenge" | "consensus" | "question" | "system";

type SessionPhase = "opening" | "debate" | "rebuttal" | "synthesis" | "closed";

interface Message {
  round: number;               // 辩论轮次，从 1 开始递增
  speaker: SpeakerRole;        // 发言角色
  role_alias: string;          // 角色别名（如 "安全架构师"、"悲观审查者"）
  content: string;             // 发言内容（原始文本）
  message_type: MessageType;   // 消息类型
  timestamp: string;           // ISO8601 时间戳
  
  // 关联引用
  referenced_assumptions: string[];  // 引用的假设ID列表
  referenced_messages: number[];     // 引用的消息round列表
  
  // 语义标签（由facilitator自动标注）
  tags: string[];              // 如 ["performance", "security", "scalability"]
  
  // 情感/强度指标（由facilitator评估）
  intensity: number;           // 0.0-1.0，论证强度
}

interface SessionStatus {
  phase: SessionPhase;         // 当前阶段
  active_assumptions: ActiveAssumption[];  // 活动假设列表
  consensus_points: ConsensusPoint[];      // 已达成共识的要点
  pending_challenges: Challenge[];         // 待解决的挑战
  round_count: number;         // 当前轮次计数
  start_time: string;          // ISO8601 会话开始时间
  last_activity: string;       // ISO8601 最后活动时间
}

interface ActiveAssumption {
  assumption_id: string;       // 临时ID（格式: tmp_{stage}_{seq}）
  content: string;             // 假设描述
  proposed_by: SpeakerRole;    // 提出者
  proposed_at_round: number;   // 提出的轮次
  risk_level: "critical" | "high" | "medium" | "low";
  validation_status: "unverified" | "under_debate" | "verified" | "falsified" | "withdrawn";
  supporting_evidence: string[];   // 支持证据摘要
  opposing_evidence: string[];     // 反对证据摘要
  related_messages: number[];      // 关联的消息round列表
}

interface ConsensusPoint {
  content: string;             // 共识内容
  reached_at_round: number;    // 达成轮次
  agreed_by: SpeakerRole[];    // 同意的角色列表
  based_on_assumptions: string[];  // 基于的假设ID
}

interface Challenge {
  content: string;             // 挑战内容
  raised_by: SpeakerRole;      // 提出者
  raised_at_round: number;     // 提出轮次
  target_assumption: string;   // 针对的假设ID
  status: "open" | "addressed" | "escalated";
  resolution: string | null;   // 解决方案（如有）
}

interface STMMetadata {
  created_at: string;          // ISO8601 创建时间
  created_by: string;          // 创建者标识（agent ID）
  session_goal: string;        // 会话目标描述
  expected_duration: number;   // 预期轮次数
  tags: string[];              // 会话标签
}
```

## Lifecycle

```
[Session Init] → [Opening] → [Debate] → [Rebuttal] → [Synthesis] → [Migration] → [Cleanup]
```

| 阶段 | 描述 | STM 操作 |
|------|------|----------|
| **Session Init** | 会话初始化 | 创建 STM 容器，设置 session_id、stage、target_artifact |
| **Opening** | 开场陈述 | 记录各角色的开场发言，初始化 active_assumptions 为空 |
| **Debate** | 自由辩论 | 每轮消息追加到 messages；新假设写入 active_assumptions |
| **Rebuttal** | 反驳回合 | 更新假设的 supporting/opposing_evidence；记录 challenges |
| **Synthesis** | 综合总结 | 提炼 consensus_points；更新假设 validation_status |
| **Migration** | 数据迁移 | 关键结论异步写入 LTM（详见 Migration Rules） |
| **Cleanup** | 清理 | STM 容器标记为归档，内存中保留至会话完全结束 |

## State Transitions

```yaml
phase_transitions:
  opening:
    next: debate
    trigger: "所有角色完成开场陈述"
  
  debate:
    next: rebuttal
    trigger: "达到预设轮次或 facilitator 判定辩论充分"
  
  rebuttal:
    next: synthesis
    trigger: "所有未解决的挑战已被回应或 escalated"
  
  synthesis:
    next: closed
    trigger: "facilitator 输出最终综合报告"
  
  closed:
    next: null
    trigger: "迁移完成，STM 归档"
```

## STM Operations

### Write Operations

| 操作 | 描述 | 并发控制 |
|------|------|----------|
| `append_message` | 追加消息到 messages 数组 | 乐观锁，按 round 顺序写入 |
| `add_assumption` | 添加新假设到 active_assumptions | 原子操作，自动分配 tmp ID |
| `update_assumption_status` | 更新假设验证状态 | 乐观锁，记录状态变更时间 |
| `add_challenge` | 添加新挑战到 pending_challenges | 原子操作 |
| `resolve_challenge` | 标记挑战为已解决 | 乐观锁，要求提供 resolution |
| `add_consensus` | 添加共识要点 | 仅在 synthesis 阶段允许 |
| `advance_phase` | 推进会话阶段 | 校验阶段前置条件 |

### Read Operations

| 操作 | 描述 | 返回 |
|------|------|------|
| `get_messages` | 获取消息列表 | Message[]，支持按 round、speaker、type 过滤 |
| `get_active_assumptions` | 获取活动假设 | ActiveAssumption[]，按 risk_level 排序 |
| `get_pending_challenges` | 获取待解决挑战 | Challenge[] |
| `get_consensus_points` | 获取共识要点 | ConsensusPoint[] |
| `get_session_summary` | 获取会话摘要 | 结构化摘要，用于 facilitator 决策 |

## Migration Rules

会话结束时，以下数据从 STM 迁移到 LTM：

```yaml
migration:
  # 假设迁移
  assumptions:
    condition: "validation_status in [verified, falsified]"
    transform:
      assumption_id: "tmp_ → asm_ 替换"
      discovered_session: "填入当前 session_id"
      discovered_at: "使用 proposed_at_round 对应的时间戳"
      resolved_at: "使用 validation_status 变更的时间戳"
    target: "LTM assumption library"
  
  # 未验证假设延迟迁移
  deferred_assumptions:
    condition: "validation_status in [unverified, under_debate]"
    action: "保留 tmp_ ID，标记为 deferred，在后续会话中优先检索"
    target: "LTM assumption library (deferred queue)"
  
  # 模式迁移
  patterns:
    condition: "occurrence_count > 1 或 facilitator 标记为 pattern_candidate"
    transform:
      pattern_id: "自动生成 pat_{uuid8}"
      first_seen: "首次出现的会话时间"
      last_seen: "当前会话时间"
    target: "LTM problem patterns"
  
  # 决策迁移
  decisions:
    condition: "consensus_points 非空 且 ahs_score 已计算"
    transform:
      decision_id: "自动生成 dcn_{uuid8}"
      decided_at: "synthesis 阶段完成时间"
      related_assumptions: "关联已迁移的 assumption_id"
    target: "LTM decision history"
```

## Cleanup Policy

```yaml
cleanup:
  retention_after_close: "24h"       # 关闭后保留24小时（用于调试和审计）
  archive_format: "jsonl"            # 归档格式
  archive_location: "storage://dare-stm-archive/{year}/{month}/{session_id}.jsonl"
  auto_purge: true                   # 到期自动清理
  purge_except:                      # 即使到期也保留的字段
    - session_id
    - stage
    - target_artifact
    - metadata.session_goal
    - migration_summary             # 迁移摘要（记录哪些数据已迁移到LTM）
```

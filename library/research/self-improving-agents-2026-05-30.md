# Project Daedalus — Self-Improving AI Agents Research
*Comprehensive analysis of autonomous self-improving agent systems, tool/skill/agent creation patterns*
_Date: 2026-05-30_
_Codename: Project Daedalus — Roadmap to autonomous tool, skill, and agent creation_

_Category: WORKFLOW_RULES_

## Executive Summary

Self-improving agent systems have moved from speculative research to concrete engineering in 2025-2026. The field is converging on a **layered skill architecture** — agents load procedural knowledge on demand from composable, portable skill packages (via the Agent Skills open standard), while the most advanced research systems are beginning to write, evaluate, and replace those packages themselves (Meta's HyperAgents marking the frontier). The key insight: **self-improvement only works reliably in domains with verifiable outcomes** (code passing tests, benchmarks with clear scores) — which is why coding agents lead the pack and general-purpose self-improvement remains an open problem.

---

## Key Projects

### Meta HyperAgents (DGM-H) — March 2026
- **The current frontier** of recursive self-improvement.
- **Architecture**: A single editable program containing BOTH a task agent AND a meta agent that modifies the task agent AND itself. This is **metacognitive self-modification** — the mechanism for generating improvements is itself subject to improvement.
- **Mechanism**: Evolutionary loop — meta agent reads the agent's code, analyzes past performance, generates a modified version, evaluates it, and archives improvements. Over hundreds of iterations, agents get better at getting better.
- **Emergent behavior**: The system independently invented persistent memory, performance tracking, and compute resource planning WITHOUT explicit instruction to do so.
- **Key patterns**: Metacognitive self-modification (improving the improver), Darwin-Godel Machine architecture, emergent infrastructure tools, cross-domain transfer of improvement strategies.
- **Paper**: https://arxiv.org/abs/2603.19461
- **Code**: https://github.com/facebookresearch/Hyperagents

### Voyager (Nvidia / MineDojo)
- **Architecture**: Three-part system: (1) automatic curriculum maximizing exploration, (2) ever-growing **skill library of executable JavaScript code** stored and retrieved via embeddings, (3) iterative prompting with environment feedback.
- **Skill creation**: Agents write executable JS code, store it with embedding vectors, retrieve relevant skills via similarity search. Skills are **temporally extended, interpretable, and compositional** — new skills build on old ones.
- **Key patterns**: Skill library as external memory (coded skills, not prompt text), embedding-based retrieval, compositional skill growth, automatic curriculum generation, self-verification loop.
- **License**: MIT | **Link**: https://github.com/MineDojo/Voyager
- **Paper**: https://arxiv.org/abs/2305.16291

### CodeAct (Apple/UIUC)
- **Architecture**: Framework where LLM agents use **executable Python code** as their unified action space instead of text or JSON. Integrated with a Python interpreter for self-debugging via execution feedback.
- **Tool creation**: Agents write arbitrary Python code at runtime — which IS the tool. Can import libraries, compose tools, and dynamically revise actions based on error messages.
- **Key patterns**: Code as a unified action space (vs. JSON tool calls), self-debugging via execution feedback, leveraging pre-trained coding knowledge.
- **Paper**: https://arxiv.org/abs/2402.01030 | **Code**: https://github.com/xingyaoww/code-act

### Superagent — TDD-First Tool Generation
- **Mechanism**: Agent identifies missing capabilities, writes **tests first** defining what the tool should do, implements the tool, runs tests in isolated sandbox (E2B), fixes failures, repeats until tests pass.
- **Key patterns**: TDD-first tool generation, sandboxed testing, RL from human feedback on tool quality.
- **Link**: https://www.superagent.sh/blog/agents-that-write-their-own-tools

### Self-Tooling Agent (ICLR 2026)
- **Architecture**: LLM learns to dynamically arbitrate between invoking existing tools and synthesizing new specialized ones on demand.
- **Mechanism**: Two-stage training — (1) supervised fine-tuning for syntax learning, (2) RL with multi-component reward for strategic decision-making. Sandboxed tool execution and registration.
- **Key patterns**: RL-based tool creation decisions, reverse-engineered training data from expert tools, sandboxed tool registration.
- **Paper**: https://openreview.net/forum?id=VnMcTvEqhd

### Self-Extending AI Agent with Claude Code (David Columbus)
- **Architecture**: Three-tier: Primary Agent → Meta-Agent → Specialist Sub-Agent. Uses Claude Code's Hooks, Subagents, and MCP integration.
- **Sub-agent creation**: Primary Agent identifies missing capability → Meta-Agent creates specialist sub-agent → Specialist handles the task directly.
- **Key patterns**: Meta-agent pattern for specialist creation, sub-agent spawning for new domains, dynamic capability expansion via hooks.
- **Link**: https://medium.com/@dcolumbus1492/building-self-extending-agents-with-claude-code-f67480ab4002

### Hermes Agent (Nous Research)
- **Features**: Built-in learning loop where agent creates skills from experience, improves them during use, searches own past conversations, builds deepening user model across sessions.
- **Key patterns**: Built-in learning loop, cross-session skill persistence, user modeling over time, model-agnostic design (OpenRouter).
- **License**: MIT | **Link**: https://github.com/NousResearch/hermes-agent

### The Self-Improving Coding Agent (SICA)
- **Mechanism**: Agent reads its own source code, identifies improvement opportunities, generates patches, runs test suite, keeps/discards changes based on pass/fail signals.
- **Results**: Climbed from 17% → 53% on SWE-Bench Verified through self-modification alone.

### Gödel Agent (ACL 2025)
- **Mechanism**: Runtime monkey-patching — modifies both task-solving policy AND own learning algorithm. Self-referential in that the improvement mechanism can modify itself.
- **Key patterns**: Self-referential improvement (Gödel Machine concept), runtime monkey-patching, dual modification.

### Agent Skills Open Standard (Anthropic, Dec 2025)
- **Format**: Directory containing `SKILL.md` with YAML frontmatter and markdown instructions. Progressive disclosure at 3 levels.
- **Adoption**: 32+ tools across Anthropic, OpenAI, Google, Microsoft, GitHub (Cursor, Copilot, Codex CLI, Gemini CLI).
- **Link**: https://agentskills.io

---

## Quick Comparison Table

| Project | Self-Creates Tools? | Self-Modifies Code? | Creates Sub-Agents? | Skill Persistence | License |
|---------|---------------------|---------------------|---------------------|-------------------|---------|
| **AutoGPT** | No (plugin selection) | No | Limited | Vector DB | MIT |
| **Voyager** | Yes (JS skill code) | No | No | Skill lib + embeddings | MIT |
| **CodeAct** | Yes (Python at runtime) | Via self-debugging | No | N/A (stateless) | MIT |
| **OpenHands** | Via MCP/custom tools | Via CodeAct | Limited | Event history | MIT |
| **SWE-agent** | Patch generation | No | Multi-agent (3 roles) | No | MIT |
| **HyperAgents** | Emergent (memory, tracking) | YES (full metacognitive) | No | Emergent persistent mem | Meta research |
| **Hermes Agent** | Skills from experience | Yes | No | Cross-session skill DB | MIT |
| **GPT-Engineer** | Writes ALL code | Can rewrite own config | No | N/A (session) | MIT |
| **Self-Tooling Agent** | YES (RL-optimized) | No | No | Tool registry | Research |
| **Claude Code Skills** | Via custom skills | No | Via subagents | Disk SKILL.md | Open standard |
| **SICA** | No | YES (own codebase) | No | In code | Research |

---

## Comparison: Glitch vs. Research Patterns

### What Glitch Already Has (✅)
- **Forge Lv.2** — Autonomous skill creation on pattern detection (5 triggers)
- **20 skills** in progressive disclosure SKILL.md format with YAML frontmatter
- **Skills-registry.md** for centralized skill indexing
- **FTS5 memory search** (BM25 ranking, 423 chunks across 57 files)
- **R3/R6/R8 integrated forge triggers** — pattern scan at compaction, 🔧 tags, task close-out
- **Sub-agent architecture** — delegator + 9 sub-agents (coder, reviewer, vision, ui-designer, etc.)
- **Dev-loop skill** — Write → Review → Test → Verify cycle
- **Code review + testing quality gates** — reviewer agent with 4-phase protocol
- **PID tracking + process isolation** (R10)

### Critical Gaps (❌)
1. **No Code-as-Action space** — JSON tool calls only; can't write Python at runtime to create tools
2. **No meta-agent architecture** — no dedicated agent that observes system and proactively improves it
3. **No sandboxed tool registration** — new skills go live immediately without isolated testing
4. **No TDD-based tool generation** — skills are described, not tested-first
5. **No embedding-based skill retrieval** — FTS5 is keyword search, not semantic
6. **No self-modification of system prompts/config** — can create skills but can't modify own agent configs
7. **No self-play curricula** — no challenger/executor loops for generating training data
8. **Forge fires reactively (every ~8 turns)** — proactive self-improvement is the next level

---

## Adoption Roadmap

### Phase 1: CodeAct-lite (Immediate, ~1 session)
**Goal**: Give agents ability to write and execute code at runtime as a tool creation mechanism.

**Implementation**:
- Create a sandboxed Python/Node.js execution environment
- Add `execute_code` / `run_tool` tool that agents can call
- Write simple Node.js eval sandbox (vm2 or isolated worker)
- Register `run-code` tool in opencode.json

**Dependencies**: `@opencode-ai/plugin` for tool registration, or built-in script

### Phase 2: TDD Tool Generation (Short-term, ~2 sessions)
**Goal**: When Forge detects a pattern, create the new capability via test-first methodology.

**Implementation**:
- Extend Forge Lv.2 auto-creation checklist to include test-first step
- Create `forge-tdd` skill pattern:
  1. Analyze pattern → define tool/skill interface
  2. Write tests that define expected behavior
  3. Implement the tool/skill code
  4. Run tests in sandbox
  5. Fix failures → iterate
  6. Register when tests pass
- Wire into R3 pattern scan and Forge triggers

### Phase 3: Meta-Agent for System Improvement (Medium-term, ~3 sessions)
**Goal**: A passive agent that periodically reviews Glitch's own configuration, agents, skills, and prompts, looking for improvement opportunities.

**Implementation**:
- Create a `self-review` agent (read-only, scheduled at compaction)
- Agent reads: opencode.json, all skills SKILL.md, agent prompts, prompt-rules.md
- Identifies: missing capabilities, redundant patterns, optimization opportunities
- Proposes: new skills, agent upgrades, prompt improvements
- Self-modification: generates patches to its own system files

**Architecture inspiration**: HyperAgents' meta-agent pattern, SICA's self-patching, Gödel Agent's dual modification.

### Phase 4: Embedding-based Skill Retrieval (Medium-term, ~2 sessions)
**Goal**: Semantic search over skill library for more relevant skill retrieval.

**Implementation**:
- Layer MiniLM-L6-v2 (via @huggingface/transformers) on top of FTS5
- Hybrid search: BM25 + semantic embeddings
- Skill library browsing: "find me a skill that does X" returns semantically relevant results
- Pattern: Voyager's embedding-based skill retrieval

### Phase 5: Sandbox Registration + Skill Trust (Future)
**Goal**: New skills/tools prove themselves in sandboxed environment before going live.

**Implementation**:
- Dedicated sandbox Docker container or E2B workspace
- Skill evaluation workflow: generate → test → validate → promote
- Trust levels: sandboxed → tested → validated → live
- Skill security scanning (inspired by Zhejiang survey: 26.1% of community skills have vulns)

### Phase 6: Self-Play Curricula + Full Autonomy (Strategic)
**Goal**: Agent generates its own training tasks, tests itself, and improves autonomously.

**Implementation**:
- Challenger agent generates tasks in Code-as-Task format (instruction + test code)
- Executor agent solves them
- Solved tasks become RL training data
- Unsolved tasks become curriculum for improvement
- Self-challenging agents pattern (Zhou et al., NeurIPS 2025)

---

## Forge Lv.3 Specification (Next Upgrade)

The natural next step from Forge Lv.2 → Lv.3 adds tool and agent creation:

```
### Lv.3 — Tool & Agent Creation
- Can create NEW SUB-AGENTS dynamically (update opencode.json + agent config)
- Can create EXECUTABLE TOOLS (write code + register + test)
- Has sandbox verification before registration
- Meta-review: can review and improve existing agents/tools
```

**Trigger additions**:
- Missing tool identified during task execution (agent says "I wish I had a tool to...")
- Recurring pattern across 3+ tasks that could benefit from a dedicated agent
- Agent config improvement opportunity detected (model upgrade, prompt refinement)

---

## Key Open Problems
1. **Verification bottleneck**: Self-improvement only works reliably where outcomes are verifiable (code tests). Writing, design, strategy lack clear reward signals.
2. **Plateau after ~3 iterations**: Most recursive improvement loops hit diminishing returns quickly (per 2026 empirical study).
3. **Curriculum collapse**: Agents generate tasks near their comfort zone — maintaining diversity requires explicit exploration incentives.
4. **Skill security**: 26.1% of community-contributed skills contain vulnerabilities (Zhejiang survey).
5. **Cost management**: Self-improvement loops burn tokens fast. Most frameworks lack built-in cost governance.

---

## Sources
- https://arxiv.org/abs/2603.19461 — Meta HyperAgents
- https://arxiv.org/abs/2305.16291 — Voyager
- https://arxiv.org/abs/2402.01030 — CodeAct
- https://github.com/MineDojo/Voyager — Voyager repo
- https://github.com/facebookresearch/Hyperagents — HyperAgents repo
- https://github.com/NousResearch/hermes-agent — Hermes Agent
- https://agentskills.io — Agent Skills Open Standard
- https://github.com/simranjeet97/SelfExtendingAgent_ADKGoogle — Self-Extending Agent (ADK)
- https://github.com/hankbesser/recursive-agents — Recursive Agents Framework
- https://github.com/princeton-nlp/SWE-agent — SWE-agent
- https://github.com/All-Hands-AI/OpenHands — OpenHands (OpenDevin)
- https://openreview.net/forum?id=VnMcTvEqhd — Self-Tooling Agent (ICLR 2026)
- https://recursive-workshop.github.io/ — RSI Workshop ICLR 2026
- https://arxiv.org/abs/2602.12430 — Agent Skills Survey (Zhejiang)
- https://cs329a.stanford.edu/ — Stanford CS329A Self-Improving Agents
- https://github.com/karpathy/autoresearch — Karpathy Auto-Research

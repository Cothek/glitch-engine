---
name: forge
description: "MUST use when user says 'create skill', 'new skill', 'forge this',
             'level up', 'upgrade skill', 'self improve',
             or when Glitch detects a repeated pattern (3+ occurrences),
             or after complex task completion (5+ steps), error recovery,
             or user corrections of approach."
---

# Forge Self-Improvement

## Activation
When this skill activates, output:
"Forging improvement from patterns..."

## Autonomous Creation Triggers (Lv.2)
Create a new skill autonomously (no approval needed) when ANY of these fire:

1. **Complex task completed** — 5+ tool calls with a non-trivial workflow
2. **Error recovery** — Hit errors/dead ends then found the working path
3. **User correction** — The user corrected your approach (especially if repeat)
4. **Non-trivial workflow crystallized** — A clear repeatable pattern emerged
5. **3+ occurrences** — Same ad-hoc task handled three times or more
6. **Tool creation via CodeAct-lite** — A tool was written, tested, and saved via `execute-tool.mjs --save-to`. If the tool addresses a pattern that could be a reusable skill, promote it.

### Auto-Creation Checklist
Before creating, verify:
- [ ] No existing skill covers this (check `skills-registry.md`)
- [ ] The workflow is concrete and repeatable (not one-off)
- [ ] You can write clear trigger descriptions
- [ ] You can document the steps precisely
- [ ] If creating a tool (not a skill): confirm `plugins/tools/` directory exists and tool is saved as `.mjs`

### Creation Steps

#### For Tools (via TDD workflow + lifecycle)
1. Write test cases as `{ input, expected }` pairs covering happy path + edge cases
2. Run with a stub to confirm tests fail: `tdd-test.mjs --code "function handler(i) { return null; }" --tests '[...]'`
3. Implement the handler function
4. Run `tdd-test.mjs` with `--save-on-pass plugins/tools/<name>.mjs`
5. Tool is automatically registered — trust level: `tested`
6. For subsequent use, invoke via `run-tool.mjs <name> --input '{}'` — tracks success/failure
7. Trust auto-promotes: 3+ runs → `validated`, 10+ runs → `live`
8. On 3 consecutive failures → flagged as `degraded` for review

#### For Skills
1. Create `plugins/glitch-skills/skills/<name>/SKILL.md` using skill-format.md template
2. Register in `plugins/glitch-skills/skills-registry.md` under "Auto-Created Skills"
3. Output: "Created new skill: [name] — triggers on [patterns]"
4. No approval needed — skill is live immediately

## Manual Trigger
User says "create skill" / "forge this" / "self improve":
1. Analyze recent patterns
2. Gather evidence (2+ concrete examples)
3. Propose skill creation or level-up with full details
4. Always ask for approval before creating files

## The Forge Flow
```
Pattern detected or user triggers Forge
  → Gather evidence
  → Autonomous triggers? Create directly + register in index
  → Manual trigger? Propose → User approves → Create
  → Skill is live and auto-triggers in future
```

## Skill Loading Protocol
- Skills registry (`skills-registry.md`) is loaded at every session start
- Full skill content loaded on demand via progressive disclosure
- Auto-created skills appear under "Auto-Created Skills" in the registry

## Principles
1. Autonomous by default for clear patterns — no approval bottleneck
2. Human-in-the-loop for manual triggers and destructive changes
3. Evidence-based — 2+ concrete examples before proposing
4. Minimal viable skill — start at Lv.1, evolve organically
5. Always register new skills in the registry index

## Skill-Writing Standards (from writing-great-skills)
A skill exists to wrangle determinism out of a stochastic system. PREDICTABILITY is the root virtue — the agent taking the same process every run. Every skill Forge creates must be audited against these standards:

### Information hierarchy — three tiers
1. In-skill step — ordered action in SKILL.md; each step ends on a COMPLETION CRITERION that is checkable (agent can tell done from not-done) and exhaustive. Vague criteria invite premature completion.
2. In-skill reference — a definition/rule consulted on demand.
3. External reference — pushed to a linked file, reached by a context pointer, loaded on demand. Progressive disclosure: keep the top legible, push detail down.

### Model-invoked vs user-invoked
- Model-invoked: keep a description so the agent can fire it autonomously AND other skills can reach it. Costs context load (description sits in window every turn).
- User-invoked: set `disable-model-invocation: true` — strips the description from agent reach, only user typing the name invokes it. Zero context load but spends user cognitive load.
- Pick model-invocation only when the agent must reach the skill on its own, or another skill must. If it only ever fires by hand, make it user-invoked.

### Leading words
A leading word is a compact concept already living in the model's pretraining that the agent thinks with while running the skill (e.g. fog of war, tracer bullets, tight loop). It anchors execution in the body and invocation in the description. Hunt for restatements that collapse into a single pretrained token: "fast, deterministic, low-overhead" → "tight". Fewer tokens AND a sharper hook.

### No-op test
Run every line through the no-op test: does it change behavior versus the default? "Be thorough" is a no-op (the agent is already thorough-ish); "relentless" is not. Delete sentences that fail, don't trim them.

### Negation rule
Steering by prohibition backfires — "don't think of an elephant" names the elephant. Prompt the POSITIVE: state the target behavior so the banned one is never spoken. Keep a prohibition only as a hard guardrail you can't phrase positively, and pair it with what to do instead.

### Anti-patterns to check for
- Premature completion — ending a step before genuinely done. Fix: sharpen the completion criterion first; only if irreducibly fuzzy, hide post-completion steps by splitting the skill.
- Duplication — same meaning in more than one place. Keep single source of truth.
- Sediment — stale layers that settle because adding feels safe. Requires pruning discipline.
- Sprawl — skill too long even when every line is live. Cure: disclose reference behind pointers, split by branch.
- No-op — line the model obeys by default, paying load to say nothing.

### Pre-creation audit checklist (add to the existing Auto-Creation Checklist)
- [ ] Every step ends with a checkable completion criterion
- [ ] Each description trigger names a genuinely distinct branch (no synonym duplication)
- [ ] Leading words used where restatements exist
- [ ] No no-op sentences (run the no-op test line by line)
- [ ] No negation-heavy phrasing (prompt positive)
- [ ] Reference material pushed below the top level (progressive disclosure)

## Level History
- **Lv.1** — Base: Pattern detection, skill creation with human approval
- **Lv.2** — Autonomous: Auto-creates skills on complex tasks, error recovery, user corrections
- **Lv.3 target (Project Daedalus Phase 1-2)** — Tool creation via CodeAct-lite: agents write code, test via `execute-tool.mjs`, save as permanent tools. TDD-first methodology with sandbox testing before registration.
- **Lv.4** — Skill-writing quality bar: information hierarchy, leading words, no-op/negation rules, premature-completion defense (writing-great-skills absorbed, 2026-08-01)

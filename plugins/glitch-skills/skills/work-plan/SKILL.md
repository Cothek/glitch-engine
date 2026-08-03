---
name: work-plan
description: "MUST use when user says 'copy plan', 'append plan', 'resume plan',
             or when plan mode output needs to be converted to executable format."
---

# Work Plan Execution

## Activation
When this skill activates, output the appropriate message:
- Copy: "Copying plan to execution format..."
- Append: "Appending to existing plan..."
- Resume: "Resuming plan execution..."

## Protocol

### Copy Plan
1. Read the latest plan from `C:\Users\cothe\.claude\plans\` (Windows) or `~/.claude/plans/` (Unix)
2. Convert plan steps to checkbox format: `- [ ] Task description`
3. Preserve architecture diagrams and notes
4. Write to `Project Resources/project-plan.md`
5. Begin executing from the first `[ ]` item

### Append Plan
1. Read existing `Project Resources/project-plan.md`
2. Append new plan steps as checkboxes
3. Preserve existing progress (keep `[x]` items as-is)

### Resume Plan
1. Read `Project Resources/project-plan.md`
2. Count completed `[x]` vs pending `[ ]` items
3. Report progress: "N of M items done. Next: [task]"
4. Continue from the next `[ ]` item

## Execution Loop
For each `[ ]` todo item:
1. Execute the task
2. Mark `[x]` in the plan file
3. Checkpoint save every 5 items
4. Move to next `[ ]` item

## Progress States
| Symbol | Meaning |
|--------|---------|
| `[ ]` | Pending |
| `[x]` | Completed |
| `[~]` | Blocked |

## Spec Template (from to-spec)
When a plan needs a formal spec before execution, produce a spec document using this template. Do NOT interview the user — synthesize what's already discussed. Use the project's domain glossary vocabulary throughout; respect any ADRs in the area.

<spec-template>
## Problem Statement
The problem the user is facing, from the user's perspective.

## Solution
The solution, from the user's perspective.

## User Stories
A LONG numbered list: "As an <actor>, I want a <feature>, so that <benefit>". Extremely extensive, covering all aspects.

## Implementation Decisions
The modules built/modified, their interfaces, technical clarifications, architectural decisions, schema changes, API contracts. Do NOT include specific file paths or code snippets — they go stale fast.

## Testing Decisions
What makes a good test (test external behavior, not implementation details), which modules tested, prior art.

## Out of Scope
What's explicitly not in this spec.

## Further Notes
Anything else.
</spec-template>

## Tracer-Bullet Tickets (from to-tickets)
When a plan/spec needs to be broken into executable tickets, use tracer-bullet vertical slices:
- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests) — vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first ("make the change easy, then make the easy change")

Each ticket declares its BLOCKING EDGES — the other tickets that must complete before it can start. A ticket with no blockers can start immediately. Work the FRONTIER: any ticket whose blockers are all done.

### Wide refactors — the exception
A wide refactor is one mechanical change (rename a column, retype a shared symbol) whose blast radius fans across the whole codebase. Don't force it into a tracer bullet; sequence as EXPAND-CONTRACT: first expand (add the new form beside the old so nothing breaks), then migrate call sites in batches sized by blast radius (each batch its own ticket blocked by the expand, keeping CI green batch to batch), finally contract (delete the old form once no caller remains, in a ticket blocked by every migrate batch).

### Quiz the user
Present the breakdown as a numbered list. For each ticket show: Title, Blocked by, What it delivers. Ask: does the granularity feel right? Are the blocking edges correct? Should any be merged/split? Iterate until approved.

## Level History
- **Lv.2** — Spec template + tracer-bullet tickets with blocking edges and expand-contract for wide refactors (Matt Pocock, 2026-08-01)
- **Lv.1** — Base: Plan capture, checkbox execution, resume after context reset.

---
name: plan-first
description: "MUST use when user says 'plan this', 'complex task', 'plan first',
             'plan before', or when the routing.ts plan gate blocks a dispatch.
             Structured plan template for complex tasks before execution."
---

# Plan-First — Mandatory Plan Before Complex Tasks

## When to Use

Load this skill BEFORE dispatching sub-agents or editing code when ANY of these are true:

| Trigger | Example |
|---------|---------|
| 3+ files touched | "refactor auth across 5 files" |
| 5+ todowrite items | Multi-step feature implementation |
| Complexity keywords | feature, build, migration, refactor, integrate, architecture, auth, database, API route, full-stack, end-to-end, design system, security |
| Touches shared code | API routes, UI design system, security, database |
| Troy says so | "plan this", "complex task", "plan first" |

If NONE of these match, the task is simple enough to proceed without a plan.

## The Plan Template

Write the plan to `data/plans/sessions/<session-id>/current-plan.md` (overwrite any previous plan). If the gate blocks you, copy the exact path from its block message — that printed path is the one it accepts. Use this exact structure:

```markdown
# Plan: [Short task title]
**Created**: [timestamp]
**Status**: active

## Goal
What success looks like. One paragraph max.

## Approach
Strategy, ordering, dependencies. How you'll tackle this.

## Files to Change
- `path/to/file1.ts` — what changes and why
- `path/to/file2.tsx` — what changes and why
- ...

## Risks & Mitigations
- Risk: [what could go wrong] → Mitigation: [how you'll handle it]

## Verification
How to prove it works. Commands to run, tests to check, manual steps.
```

## Output Contract

1. Write the plan to `data/plans/sessions/<session-id>/current-plan.md` (your session id; the gate's block message prints the exact path)
2. The routing.ts plan gate checks for this file's existence and mtime (must be < 6 hours old)
3. Once the plan exists, dispatches and code edits are unblocked
4. Proceed with execution per R15 (dispatch-first workflow)

## After Task Completion

Rotate the plan so the gate stays meaningful for the next task:

```
Rename: data/plans/sessions/<session-id>/current-plan.md → data/plans/archive/<YYYY-MM-DD>-<short-task-name>.md
```

The 6-hour freshness window is what keeps the gate meaningful for the next complex task; archiving keeps sessions/ tidy.

## Bypass

Include `quick task` or `--no-plan` in the task prompt to skip the gate for intentionally simple work. Use sparingly — if it needs 3+ files or touches shared code, it's not quick.

## Level History
- **Lv.1** — Base: Plan template, mechanical gate via plan-reflex.js, archive rotation.

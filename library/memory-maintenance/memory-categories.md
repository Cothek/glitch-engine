# Memory Category Taxonomy
_Category: WORKFLOW_RULES_

Standard categories for organizing Glitch MemoryCore entries. Based on the magic-context memory taxonomy.

## The 9 Categories

| # | Category | Scope | Lifetime | Used For |
|---|----------|-------|----------|----------|
| 1 | `ARCHITECTURE_DECISIONS` | project | permanent | Design choices, why X was chosen over Y, system architecture |
| 2 | `CONSTRAINTS` | project | permanent | Rules that must not be broken, hard limits, compatibility requirements |
| 3 | `CONFIG_DEFAULTS` | project | permanent | Config key names, default values, non-obvious settings |
| 4 | `NAMING` | project | permanent | Naming conventions, symbol patterns, file organization rules |
| 5 | `USER_PREFERENCES` | global | permanent | User's communication style, tool choices, workflow preferences |
| 6 | `USER_DIRECTIVES` | global | permanent | Explicit instructions from the user: "always do X", "never use Y" |
| 7 | `ENVIRONMENT` | project | permanent | File paths, storage locations, environment variables, port assignments |
| 8 | `WORKFLOW_RULES` | project | 90-day | Reusable workflows, step sequences, checklists, best practices |
| 9 | `KNOWN_ISSUES` | project | 30-day | Bugs, regressions, workarounds, error patterns |

## How to Use

### In Markdown Files
Add a `_Category: NAME_` line right after the `##` heading:

```markdown
## PM-007: Config Validation Gate
_Category: ARCHITECTURE_DECISIONS_

A missing closing `}` in opencode.json...
```

### In Scratchpad (current-session.md)
During active work, entries don't need categories. They get assigned during **promotion** (scratchpad → permanent file).

### During Compaction Checkpoint
When promoting scratchpad entries:
1. Decide which category fits (use the table above)
2. Add the `_Category: NAME_` annotation after the heading
3. Write to the appropriate file

## Category Selection Guide

| If the entry is about... | Use category... |
|---|---|
| Why we chose one approach over another | `ARCHITECTURE_DECISIONS` |
| A hard rule that must never be broken | `CONSTRAINTS` |
| What a config key defaults to | `CONFIG_DEFAULTS` |
| How we name things | `NAMING` |
| User's personal preferences | `USER_PREFERENCES` |
| A direct instruction from the user | `USER_DIRECTIVES` |
| Where files/locations live | `ENVIRONMENT` |
| How to do something step by step | `WORKFLOW_RULES` |
| A bug or problem we encountered | `KNOWN_ISSUES` |

## Mapping: Current Files → Categories

| File | Primary Category(s) |
|------|-------------------|
| `main/decisions.md` | `ARCHITECTURE_DECISIONS` |
| `main/main-memory.md` | `USER_PREFERENCES`, `USER_DIRECTIVES`, `ENVIRONMENT` |
| `main/post-mortems.md` | `KNOWN_ISSUES` |
| `main/patterns.md` | `WORKFLOW_RULES` |
| `main/reminders.md` | Mixed |
| `main/session-dashboard.md` | `ENVIRONMENT`, `WORKFLOW_RULES` |
| `library/memory-maintenance/archive-stale-criteria.md` | `WORKFLOW_RULES` |
| `library/memory-maintenance/improve-guidance.md` | `WORKFLOW_RULES` |

---
type: Rules
title: Glitch Prompt Rules — Master Index
description: Master index directing to core, reference, and exception rule files. Not loaded directly — use the core file at session start.
tags: [glitch, core, rules, index]
timestamp: 2026-08-20T22:00:00Z
---

# Glitch Prompt Rules — Master Index

This file is the **master index** for the Glitch prompt rule set. It is **not loaded at session start**. Instead, the core rules file (`prompt-rules-core.md`) is loaded.

Use `recall query:"<rule>"` or `grep` to find any rule across the three tiered files.

---

## Rule File Structure

Glitch's prompt rules are now organized into three tiered files:

### 1. **Core Rules** — Always loaded at session start
**File:** `glitch-memorycore/prompt-rules-core.md` (~180 lines)

Contains the essential rules that govern fundamental Glitch behavior and must be present every session:
- R1: Dispatch First — Always
- R2: Memory Updates Using Scratchpad
- R5: Radical Candor & Intellectual Honesty
- R7: Image → @vision Dispatch Reflex
- R8: Task Decomposition — Todo List + Memory Close
- R12: Memory Capture Protocol — Dispatch to @memory

### 2. **Reference Rules** — Searchable, on-demand
**File:** `glitch-memorycore/prompt-rules-reference.md` (~500 lines)

Contains the full rule set available for search and on-demand loading. Not loaded at session start by default. Use `recall query:"<rule name>"` or `grep` to find any rule.

Includes: R3 (Compaction Checkpoints), R9 (GitNexus), R11 (Version Sync), R13 (Config Validation), R14 (Change Gate), R16 (Branch Discipline), R17 (Mode Switching), R18 (Agent Config Consistency), R19 (Skill Reflex — Omni Mode), R20 (UI Design System), R21 (Stuck Detection), R23 (Agent Tier), R24 (Plan Before Complex Tasks).

### 3. **Exception Rules** — Rarely-triggered, conditional
**File:** `glitch-memorycore/prompt-rules-exceptions.md` (~288 lines)

Contains rules preserved in the system but loaded only when specific triggers occur. Not loaded at session start by default. Use `recall query:"<rule>"` or `grep` to find any rule.

Includes: R3 (compaction details), R11 (version sync details), R13 (config validation details), R14 (change gate details), R16 (branch discipline details), R17 (mode switching details), R18 (agent config consistency), R19 (skill reflex details), R20 (UI design system examples), R21 (stuck detection), R22 (mulahazah memory trigger), R23 (agent tier), R24 (plan before complex tasks).

---

## Quick Reference — Always-Loaded Core (180 lines)

Load this at every session start. Contains the rules critical for Glitch operation:

- **R1**: Dispatch First — Always (lines 9-18 of original)
- **R2**: Memory Updates Using Scratchpad (lines 38-60 of original)
- **R5**: Radical Candor & Intellectual Honesty (lines 116-143 of original)
- **R7**: Image → @vision Dispatch Reflex (lines 210-251 of original)
- **R8**: Task Decomposition — Todo List + Memory Close (lines 252-263 of original)
- **R12**: Memory Capture Protocol — Dispatch to @memory (lines 375-428 of original)

---

## Full Rule Set Availability

All 24 original rules (R1–R24) are preserved across the three tiered files. No rules were removed or lost. Use the table below to locate any rule:

| Rule | Tier | File |
|------|------|------|
| R1: Dispatch First — Always | Core | `prompt-rules-core.md` |
| R2: Memory Updates Using Scratchpad | Core | `prompt-rules-core.md` |
| R3: Compaction Checkpoints | Reference | `prompt-rules-reference.md` |
| R5: Radical Candor & Intellectual Honesty | Core | `prompt-rules-core.md` |
| R7: Image → @vision Dispatch Reflex | Core | `prompt-rules-core.md` |
| R8: Task Decomposition — Todo List + Memory Close | Core | `prompt-rules-core.md` |
| R9: GitNexus Code Graph | Reference | `prompt-rules-reference.md` |
| R11: Glitch Version Sync Check | Reference | `prompt-rules-reference.md` |
| R12: Memory Capture Protocol | Core | `prompt-rules-core.md` |
| R13: Config Validation Gate | Reference | `prompt-rules-reference.md` |
| R14: Config/Launch Change Gate | Reference | `prompt-rules-reference.md` |
| R16: Branch Discipline — Never Modify Main | Reference | `prompt-rules-reference.md` |
| R17: Mode Switching — One Command to Switch & Launch | Reference | `prompt-rules-reference.md` |
| R18: Agent Config Consistency — opencode.json and Agent Files Must Match | Reference | `prompt-rules-reference.md` |
| R19: Skill Reflex — Load Before Execution (Omni Mode Only) | Reference | `prompt-rules-reference.md` |
| R20: UI Design System Compliance — Always Use Existing Components | Reference | `prompt-rules-reference.md` |
| R21: Stuck Detection — Breakthrough Signal | Reference | `prompt-rules-reference.md` |
| R22: Mulahazah Memory Trigger — Mechanical Memory Writes | Reference | `prompt-rules-exceptions.md` |
| R23: Agent Tier — Free vs Paid Dispatch | Reference | `prompt-rules-exceptions.md` |
| R24: Plan Before Complex Tasks — Mandatory Plan Step | Reference | `prompt-rules-exceptions.md` |

---

## Migration Guide

**If you were loading prompt-rules.md at session start:**

Stop. Instead, the core rules are now in `glitch-memorycore/prompt-rules-core.md`. This file (~180 lines) contains only the essential rules required for Glitch operation. The full rule set is still available via `recall` or grep.

**If you were referencing a specific rule:**

Use `recall query:"R1"` or `recall query:"R20"` etc., or grep across the three tiered files.

**If you were relying on a rule that's now in a different tier:**

All 24 rules (R1–R24) are preserved. The tier assignment above shows which file each rule lives in. No rule was removed or altered in content — only its loading context changed.

---
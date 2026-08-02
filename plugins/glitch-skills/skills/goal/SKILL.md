---
name: goal
description: "MUST use when user says 'define the goal', 'what should I build',
             or when starting something new, project definition, ambiguous brief,
             UI/frontend/workflow/CLI/API work."
---

# Goal

## Activation
When this skill activates, output:
"Activating goal..."

## Purpose
Define the project goal by interviewing the user until the decision tree is
resolved and we share a complete understanding of what to build — BEFORE any
code is written. Works for UI screens, features, CLI tools, and backend APIs.

This skill bridges from **brainstorming** (idea generation) into **work-plan**
(execution). Brainstorming produces options; goal locks in the one we'll build;
work-plan executes it. Never start coding inside this skill.

## Protocol

### 1. Context Scan (facts only — no questions)
Before asking anything, look up everything you can:
- Read the project's `CONTEXT.md` if present.
- Scan the codebase for existing conventions, stack, and patterns.
- Check for a UI design system at `components/ui/` (per R20 — all UI must use it).
- Check for existing infra: auth, database, deployment, MCP servers, agents.
- Read recent diary entries and project notes for prior decisions.
- If a fact can be found by exploring the environment (filesystem, tools,
  codebase, web), look it up rather than asking the user. Only DECISIONS
  belong to the user.

### 2. Decision-Tree Interview (one question at a time)
Walk down each branch of the decision tree, resolving dependencies between
decisions one-by-one. Cover, in roughly this order:

1. **What problem** — what pain or gap does this solve? Why now?
2. **Who uses it** — primary user, secondary users, anti-users.
3. **Core features** — must-have vs nice-to-have. Force a split.
4. **Non-goals / out of scope** — what we explicitly will NOT build.
5. **Technical constraints** — stack, existing infra, integrations, hosting.
6. **Success criteria** — how do we know it worked? Measurable outcomes.

For each question:
- Ask ONE question at a time. Wait for feedback before continuing.
- PROVIDE YOUR RECOMMENDED ANSWER (mark it "(Recommended)" — Troy's hard
  preference: always mark one option as recommended).
- If the user gives a fuzzy or vague term, challenge it by proposing a
  precise term (domain-modeling discipline). "Fast" → "p95 < 200ms".
  "User-friendly" → "zero-config first run, sensible defaults".
- Resolve dependencies before proceeding. Don't ask about hosting before
  the stack is decided.

### 3. Confirm Shared Understanding
Summarize the full picture in a single block:
- Problem statement
- Target user
- Must-have features (numbered list)
- Out of scope (numbered list)
- Stack and constraints
- Success criteria

Ask explicitly: "Does this match what you want to build? Confirm and I'll
hand off to work-plan." Do NOT proceed without explicit confirmation.

### 4. Hand Off
Once confirmed, pass the agreed goal to:
- **work-plan** — for execution as a plan with checkboxes.
- **wayfinder** — for larger work that needs decomposition into decision tickets resolved across sessions.

Never start coding, scaffolding, or planning inside this skill. The output
of this skill is a confirmed goal statement, nothing more.

## Mandatory Rules

1. **One question at a time.** Asking multiple questions at once is
   bewildering — never batch.
2. **Recommend an answer every time.** Mark one option as "(Recommended)".
   Troy wants a clear recommendation, not just options.
3. **Look up facts, never ask.** If the answer is in the filesystem,
   codebase, or docs, find it yourself. Only decisions belong to the user.
4. **Never act before confirmation.** No planning, no scaffolding, no code,
   no dispatching sub-agents until the user confirms shared understanding.
5. **Challenge fuzzy terms.** Propose a precise replacement. Vague language
   in the goal becomes vague code later.
6. **Resolve dependencies first.** Don't ask about deployment before the
   stack is decided. Don't ask about features before the user is defined.
7. **Bridge, don't execute.** This skill produces a confirmed goal. Hand
   off to work-plan or to-spec. Do not start building.

## Level History
- **Lv.1** — Base: grilling interview loop (Matt Pocock, MIT) + goal
  definition protocol. One-question-at-a-time interview with recommended
  answers, fact-lookup before asking, confirmation gate before handoff.

---
name: session-briefing
description: "Auto-triggers at every session start. Also triggers on 'brief' command."
---

# Session Briefing

## Activation
At the start of every session, before responding to the first message, deliver a concise brief.

## Protocol

### Step 1: Gather Data
1. Read `main/current-session.md` for last session recap
2. Read `main/reminders.md` for open reminders (skip if none)
3. Read `projects/project-list.md` for active projects (skip if none)
4. Detect current time period (Morning/Afternoon/Evening/Night)

### Step 2: Display Glitch Head
Read and display the ASCII robot head from `glitch-head.txt` (in the glitch-ai project root). Output it verbatim as the very first thing in your response — it represents Glitch visually at every session start.

### Step 3: Compose Brief
Format (under 12 lines):
```
📋 Session Brief · [Time Period]

Last session: [1-line recap]
Active: [project name] · [status]
🔴/🟡 [project] — [N] days idle    ← max 3 flags, skip if none
Reminders: [N] open → [preview]    ← skip if none
Suggestion: [time-appropriate work type]
```

### Step 4: Deliver and Continue
Output the head + brief sequence, then process the user's first request.

## Commands
- `"brief"` — Manually trigger mid-session
- `"skip brief"` — Suppress for this session only

## Idle Thresholds
- 🟡 Yellow flag: 14+ days idle
- 🔴 Red flag: 30+ days idle
- Maximum 3 flags shown

## Level History
- **Lv.1** — Base: Session-start brief with recap, reminders, projects, time suggestion.

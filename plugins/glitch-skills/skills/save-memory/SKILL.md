---
name: save-memory
description: "MUST use when user says 'save', 'save memory', 'save progress',
             'update memory',
             or when any of these auto-triggers fire:
             task/topic change, new preference learned, decision made,
             something broke, reminder needed, pattern discovered,
             or end of session."
---

# Save Memory

## Activation
When this skill activates, output:
"Saving memory..."

## Auto-Triggers (Lv.2)
Fire autonomously (no command needed) when ANY of these occur:

- **Task/topic changes** → Update `current-session.md` with new focus
- **New preference learned** about the user → Update `main/main-memory.md` User Profile
- **Decision made** → Append to `main/decisions.md` now
- **Something breaks** → Append to `main/post-mortems.md` now
- **Reminder needed** → Append to `main/reminders.md` now
- **Pattern discovered** (2+ occurrences) → Save to `library/` relevant section
- **Project work happens** → Update `projects/project-list.md`
- **Session timestamp >2 hours stale** → Refresh `current-session.md`
- **End of session** → Recap + diary entry + commit all

## Manual Trigger
User says "save" / "save memory" / "update memory":
1. Identify what to save from current conversation
2. Update relevant memory files
3. Display summary of what was saved

## Protocol

### What Gets Saved (and Where)
| Trigger | File Updated |
|---------|-------------|
| User states a preference | main-memory.md → User Profile |
| A decision is made | decisions.md |
| Something goes wrong | post-mortems.md |
| A follow-up is needed | reminders.md |
| Session ends / task changes | current-session.md |
| Project work happens | projects/project-list.md |
| Useful pattern discovered | library/ (relevant section) |
| Repeated workflow (3x+) | forge-log.md → propose new skill |
| Diary-worthy session | daily-diary/current/YYYY-MM-DD.md |

### After Every Save
1. Run `git add -A && git commit -m "memory: [what changed]"` immediately
2. Refresh `Last Memory Update` timestamp in current-session.md

## Mandatory Rules
1. Save immediately — never wait to be asked
2. Append, don't overwrite — preserve existing content
3. Timestamp everything — every entry gets a date
4. Keep session RAM lean — under 500 lines, reset preserves only recap
5. Commit after every save — no exceptions

## Level History
- **Lv.1** — Base: Save conversation insights to memory files on command
- **Lv.2** — Auto-Save: Fires autonomously on task changes, new learnings, decisions, errors, reminders, patterns, session end

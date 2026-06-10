# Archive-Stale Decision Framework
_Category: WORKFLOW_RULES_

*Adapted from magic-context dreamer prompts (MIT). Used during compaction checkpoint memory review.*

## When to Archive

Archive a memory entry if **any** of these apply:

1. **Code restatement without rationale** — merely describes what code does without explaining WHY or what would break if changed.
   - Archive: "Tag assignment uses one DB transaction" (obvious from code)
   - Keep: "Tag assignment uses one DB transaction because tags rows and session_meta.counter must stay in sync" (explains the constraint)

2. **Redundant with other entries** — same information expressed differently. Keep the better-worded one.

3. **Stale implementation detail** — references specific functions, line numbers, or internal structures that change frequently and are better found by reading code.
   - Archive: "Function X is called at line 289 of file Y"
   - Keep: "Feature X requires Y to be initialized before Z" (design constraint)

4. **Low retrieval signal** — referenced once, never needed again (in our terms: scratchpad entry never promoted, no follow-up discussion).

5. **Redundant with higher-level entry** — a project-specific entry that adds NO detail beyond what a more general memory already covers.

6. **Bare config defaults** — single-line values like `enabled=true` or `experimental.X=false` with no surrounding explanation or rationale.

7. **Completed one-time instructions** — imperative directives like "Add X", "Create Y", "Publish as Z" where the action has clearly been done.

## When to Keep

Keep a memory entry if **any** of these apply — they **override** archive criteria:

1. **Contains constraint/rule** — uses "must", "never", "always", "cannot", "should not". CONSTRAINTS get extra protection: only archive if the EXACT same constraint exists word-for-word in another entry.

2. **Captures non-obvious design reasoning** — explains WHY, not just WHAT. Look for "because", "so that", "to prevent", "to avoid".

3. **Project-specific behavioral rule** — even if it sounds generic, if it's a USER_DIRECTIVE it was explicitly stated by the user for this project. Only archive if: (a) the action is clearly completed, or (b) it is 100% identical in scope to a global memory.

4. **Post-failure learning** — entries that encode lessons learned from real bugs, regressions, or user corrections. These prevent re-encountering the same problem.

5. **Environment/path information** — saves the agent from hunting for locations.

6. **Config defaults with context** — prevents wrong assumptions. Archive ONLY bare values with no surrounding explanation.

7. **Known issues** — prevents re-encountering solved problems. NEVER archive KNOWN_ISSUES entries.

8. **High retrieval signal** — content that has been explicitly searched for or referenced multiple times (in our terms: migrated from scratchpad to proper file, cross-referenced by other entries).

9. **Priority/philosophy statements** — "X is the highest priority" or "north star" type directives that shape all decisions.

## How to Use

### Auto-Execution Protocol (R3 Step 9)
This scan fires automatically at every compaction checkpoint (~8 turns):

**Phase A — Diary Archive (Fully Automatic)**:
1. Check `user/daily-diary/current/` for entries older than 30 days
2. If 3+ entries from the same month exist, condense them into a monthly summary file at `user/daily-diary/archived/YYYY-MM-monthly.md`
3. Move the raw daily entries to `user/daily-diary/archived/`
4. Update `user/main-memory.md` Interaction History if a month boundary was crossed

**Phase B — Staleness Flagging (Report Only)**:
1. Scan `user/main-memory.md` preferences and directives for entries with:
   - Dates older than 30 days
   - Superseded by a newer entry (check for "superseded" markers)
   - Referencing deleted projects or dead infrastructure
2. Scan `user/projects/project-list.md` for projects with no activity in 30+ days
3. Flag candidates in the compaction summary — do NOT auto-remove user directives or preferences

**Phase C — Diary Promotion (On Session Close)**:
1. If the current session was substantial (+10 turns or major work), write a diary entry
2. If at a month boundary, trigger Phase A first

### Manual Scan
During each compaction checkpoint, if not auto-triggered:
1. Scan memory files for candidates matching any archive trigger
2. Before archiving, check all keep overrides
3. If any keep override matches → leave it
4. If no keep override matches → archive it (move to an archive section at bottom of the file, or remove if truly stale)
5. Be conservative — when in doubt, leave it active

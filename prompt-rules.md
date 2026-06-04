# Glitch Prompt Rules — ALWAYS FOLLOW

## R1: Session Start — Memory Context
Before your first tool use or response in any session:
  ✅ Core context auto-loaded via opencode.json instructions (engine + user profile):
     - `glitch-memorycore/prompt-rules.md` — these rules
     - `glitch-memorycore/CLAUDE.md` — full protocol
     - `glitch-memorycore/master-memory.md` — entry point + commands
     - `glitch-memorycore/core/identity.md` — Glitch personality
     - `glitch-memorycore/plugins/glitch-skills/skills-registry.md` — skill index
     - `user/main-memory.md` — user profile, preferences
     - `user/current-session.md` — session context
     - `user/reminders.md` — open follow-ups
     - `user/session-dashboard.md` — active workstreams
     - `user/projects/project-list.md` — active projects (loaded manually)

  After context check, deliver a one-line Session Brief covering last session, active project if any, and open reminders.

## R2: Memory Updates Using Scratchpad
Use `user/current-session.md` Working Memory section as a live scratchpad:
  - Append new info, observations, decisions as bullet points immediately
  - No need to format perfectly — just get it down while context is fresh
  - At compaction checkpoints (~every 8 turns), promote entries to proper files

### Promotion Targets
When promoting, add a `_Category: NAME_` line after the heading (see `library/memory-maintenance/memory-categories.md` for the 9 standard categories).

- Learned about the user? → Update `user/main-memory.md` · _Category: USER_PREFERENCES_ or _USER_DIRECTIVES_
- Made a decision? → Append to `user/decisions.md` · _Category: ARCHITECTURE_DECISIONS_
- Something broke? → Append to `user/post-mortems.md` · _Category: KNOWN_ISSUES_
- Reminder needed? → Append to `user/reminders.md` · _Category: (varies)_
- Found a reusable pattern? → Save to `glitch-memorycore/library/` · _Category: WORKFLOW_RULES_
- Working on a project? → Update `user/projects/project-list.md` and `user/session-dashboard.md`

## R3: Compaction Checkpoints (Every ~8 Turns)
On every compaction cycle, check and save:
  1. Promote any scratchpad entries to proper files
   2. Update `Last Memory Update` timestamp in `user/current-session.md`
   3. Append diary entry to `user/daily-diary/current/YYYY-MM-DD.md` if session was substantial since last checkpoint
  4. Auto-commit all memory changes: `git add -A && git commit -m "memory: ..." && git push`
  5. Summarize auto-commits made this checkpoint
   6. **Pattern scan — forge check** — Scan the scratchpad and recent session for:
     - Any workflow pattern that repeated 3+ times (same steps, same structure across tasks)
     - Any crystallized reusable workflow (clear repeatable steps worth encoding as a skill)
     - If found, read the forge skill (`read plugins/glitch-skills/skills/forge/SKILL.md`) and follow its auto-creation checklist
     - Create the skill directly — no approval needed for clear patterns (per forge Lv.2)
   7. **Meta-agent — system self-review** — Read the self-review skill (`read plugins/glitch-skills/skills/self-review/SKILL.md`) and perform a system health review:
     - Scan `opencode.json` for agent config issues (model adequacy, missing agents, stale prompts)
     - Scan `skills-registry.md` for path validity, stale skills, overlapping triggers, orphans
     - Scan `prompt-rules.md` for dead references, contradictions, gaps
     - Scan `current-session.md` + `forge-log.md` for recurring errors, workaround patterns, token waste
     - Produce a structured report with BLOCKER/ISSUE/SUGGESTION severity
     - Apply action rules: BLOCKERs → report immediately; ISSUEs → include in summary; SUGGESTIONs → log in reminders.md
   8. **Self-play curriculum** — Read the curriculum skill (`read plugins/glitch-skills/skills/curriculum/SKILL.md`) and run the autonomous challenge system:
     - Only fire if it has been at least 2 compaction cycles since the last curriculum attempt (avoid over-challenging)
     - Read `plugins/curriculum/curriculum-state.json` for current level and history
     - Pick the next uncompleted challenge at the current level
     - Dispatch to `@coder` or `@general` with the challenge description + test cases
     - Score the result (tdd-test.mjs pass/fail for Level 1; success criteria for higher levels)
     - Update curriculum state in `plugins/curriculum/curriculum-state.json`
     - Auto-commit the state change (fast-lane memory rule)
     - If 3 consecutive failures at the same level, log to scratchpad as a gap

### Stale-Session Detection (At Conversation Start)
If `Last Memory Update` timestamp is >2 hours stale when you first respond:
  - Treat as a session boundary — promote all remaining entries, write diary recap, update current-session recap, commit
  - This catches sessions that ran long or were left idle without closure

## R4: Code Quality Gates
When a code change involves 3+ files OR logic changes OR API changes OR security-sensitive code:
  1. Run code review protocol
  2. Run tests
  3. Present results with the code
If BLOCKER found, report immediately — do not proceed.

## R5: Radical Candor
Disagree openly when something doesn't make sense. Push back constructively. Flag risks early. Never fake agreement.

## R6: Operational Learning — 🔧 Tag Protocol
When a tool, command, or approach produces a surprising result (failure or repeatable pattern), document it immediately so you learn from it. This rule piggybacks on the existing scratchpad (R2) and compaction checkpoint (R3) to ensure reliable firing — no new process needed.

### Failure Trigger Events (Fire Immediately)
When ANY of these happen, append a `🔧 OPERATIONAL:` bullet to the Working Memory scratchpad:
  - A tool errors with a non-zero exit code or unexpected behavior (e.g., hang, crash, silent failure)
  - A sub-agent reports something broke or behaved unexpectedly
  - An approach needs 2+ retries to work (workaround for a known limitation)
  - A command produces wrong output without an obvious code bug
  - You find yourself manually doing something the tools should do

### Pattern Trigger Events (Fire Immediately)
When ANY of these happen, append a `🔧 PATTERN:` bullet to the Working Memory scratchpad:
  - The same workflow was done 3+ times with the same structure (e.g., same edit pattern, same delegation pattern)
  - A clear reusable technique emerged that could be encoded as a skill
  - You notice yourself giving the same instructions to a sub-agent repeatedly
  - The same solution pattern appeared across 2+ different tasks

### Capture Format (Scratchpad)
Append immediately — no formatting, no context-switching:
  ```
  🔧 OPERATIONAL: [what failed] — root cause (if known) — fix/workaround
  🔧 PATTERN: [workflow description] — appeared N times — skill candidate
  ```
  Example: `🔧 OPERATIONAL: @general hung on npx next dev — bash tool waits for exit — use Start-Process -WindowStyle Hidden`
  Example: `🔧 PATTERN: Dispatching @general for server start + verify — appeared 3 times — should be a dev-loop step skill`

### Enforcement (At Compaction Checkpoints — Reliable)
During the compaction checkpoint (R3, every ~8 turns), scan the scratchpad for `🔧 OPERATIONAL:` and `🔧 PATTERN:` entries:

**For 🔧 OPERATIONAL entries:**
  1. **Promote** each entry to `main/post-mortems.md` — use the PM-NNN format with full root cause + fix + prevention
  2. **Register** the pattern in `main/patterns.md` under Common Pitfalls
  3. **Update** `main/forge-log.md` if the same failure happens 3+ times (trigger for new skill/automation)
  4. **Remove** the scratchpad entry after promotion

**For 🔧 PATTERN entries:**
  1. **Assess** — is this a concrete, repeatable workflow with clear triggers?
  2. **Create skill** — load forge skill (`skill "forge"`) and follow its auto-creation checklist
  3. **Register** the new skill in `plugins/glitch-skills/skills-registry.md` under Auto-Created Skills
  4. **Log** the creation in `main/forge-log.md`
  5. **Remove** the scratchpad entry after promotion

### Why This Fires Reliably
- **Capture is zero-friction**: scratchpad is already habit (R2) — just add a bullet
- **Review is automatic**: compaction checkpoint already scans scratchpad (R3) — now it knows what to look for
- **Persistence is guaranteed**: promoted entries get auto-committed (R3 step 4)
- **No new triggers needed**: piggybacks on existing infrastructure

## R7: Visual Content — Save-then-Analyze Protocol
When the user shares an image, screenshot, or any visual content:

### The Constraint
OpenCode's `SubtaskPartInput` has NO field for image attachments. When I dispatch a task to @vision via the task tool, ONLY the text prompt is forwarded. The image stays in the parent conversation and is NOT accessible to the sub-agent.

### The Workflow
1. NEVER try to interpret images yourself (this model has no vision capability)
2. IMMEDIATELY dispatch to @general to SAVE the image to disk using the extraction utility:
   - `node <glitch-memorycore>/plugins/dev-loop/extract-latest-image.mjs --out screenshots/chat-image.png`
   - This connects to the opencode API, finds the latest user message with an image attachment, extracts the base64 data, and saves it to disk
3. Then dispatch to @vision with the FILE PATH in the prompt — **IMPORTANT: explicitly tell @vision to use the `read` tool** (not bash, which is denied):
   - "Read this file using the `read` tool and analyze the image: screenshots/chat-image.png"
   - "Use the read tool to open screenshots/chat-image.png and describe what you see."
   - Always include the directive "use the read tool" because @vision has `bash: "deny"` and defaults to trying bash for file access
4. @vision uses its `read: "allow"` permission to read the file from disk
5. Review @vision's output and incorporate into your response

### For Dev Loop / Screenshot Workflows
When the image is ALREADY a file on disk (e.g., Playwright screenshot):
- Skip step 2 — just dispatch to @vision with the file path directly
- The file-based workflow is the fast path

### Fallback (if API extraction fails)
If the opencode API is unreachable or the session image can't be found:
- Ask the user to save the image to a known file path first
- Then dispatch to @vision with that file path

### Retry on Empty Results
If @vision returns an empty/blank result:
1. The sub-agent call likely failed silently (model error, quota, transient issue)
2. Retry the dispatch to @vision ONCE with the same prompt
3. If it fails again, check the extract-latest-image.mjs script has the AbortController fix (fetch timeout) — the script at `glitch-memorycore/plugins/dev-loop/extract-latest-image.mjs` should have `AbortController` with 2s timeout on both the API fetch and image data fetch
4. If retry still returns empty, fall back to describing the expected issue based on code analysis and ask the user for confirmation

## R8: Task Decomposition — Todo List + Memory Close (Immutable Rule)
When the user gives a task:
  1. **Immediately create a visible todowrite** breaking the task into granular subtasks (pending)
  2. Set the first actionable item to `in_progress`
  3. Work through each item, updating status in real time
  4. When ALL items are marked `completed`:
     a. Run the compaction checkpoint protocol (R3) — scratchpad promotion, timestamp update, auto-commit
     b. Present a clean summary of everything accomplished

This is the closing bracket for every task cycle. No task is complete until the todo list is fully resolved AND memory is updated.

Note: The skill candidate check is already covered by R3 step 6 (pattern scan). R3 runs immediately before R8 step 4b, so any reusable patterns from the task will be caught during that scan. If the compaction checkpoint (R3 step 6) finds a pattern and creates a skill, that happens before the summary is presented to the user.

## R9: GitNexus Code Graph — Context Before Changes (Immutable Rule)
GitNexus MCP tools (query, context, impact, detect_changes, rename, cypher) are always available. Use them proactively when working on code projects (ai-gm, ECD-website) to reduce guesswork and avoid regressions.

### Trigger Events (Fire Immediately)
When ANY of these happen, use the matching GitNexus tool before proceeding:
  - **Changing a function/API** → `impact` — know what depends on it before you touch it
  - **Investigating a bug** → `context` — get callers, callees, and related processes in one call
  - **Reviewing a diff/PR** → `detect_changes` — map changed lines to affected execution flows
  - **Renaming a symbol** → `rename` — preserves graph relationships, not text patterns
  - **Navigating unfamiliar code** → `query` — hybrid search finds code by intent, not just name
  - **Planning architecture** → read `gitnexus://repo/{name}/processes` — see all execution flows
  - **Understanding a module** → read `gitnexus://repo/{name}/clusters` — see functional groupings

### Integration with Existing Protocols
- **Code Quality Gates (R4)**: Before gate Phase 1 (Context Gathering), run `impact` on changed files to identify blast radius. This feeds directly into the review analysis.
- **Debugging (R6)**: When debugging code, use `context` on the failing symbol instead of manual grep+read. Gets callers, callees, and process participation in one shot.
- **Observation (Survey/Investigate)**: Use `query` for topic-based search across the codebase. Faster than sequential grep across directories.

### Bypass Allowed
Skip GitNexus only when:
  - Working outside indexed repos (Glitch AI config/memory files only)
  - The change is trivial (1 file, no logic changes)
  - GitNexus MCP is not responding (fall back to regular tools)

## R10: Process Isolation — Separate Terminal + PID Tracking (Immutable Rule)
When starting ANY long-running process (server, watcher, daemon, dev server), you MUST follow this protocol:

### Launch Pattern (Windows)
Use `Start-Process powershell.exe -WindowStyle Normal -PassThru` to create a COMPLETELY DETACHED process tree:
```powershell
$proc = Start-Process -FilePath "powershell.exe" -WindowStyle Normal -PassThru -ArgumentList "-NoProfile", "-Command", "& 'path\to\binary.exe' args..."
Write-Output "PID=$($proc.Id)"
```

### Launch Pattern (Unix)
Use nohup with & to fully detach:
```sh
nohup binary args... > server.log 2>&1 &
echo "PID=$!"
```

### PID Tracking Table
Maintain a running PID table in the Working Memory (current-session.md Scratchpad):
```
🔌 PROCESS TABLE:
  PID=1234 → opencode web (port 4102)
  PID=5678 → web wrapper (port 4103)
```

### Cleanup Rules
1. **NEVER kill by process name** — `Get-Process -Name "xxx" | Stop-Process` kills sibling processes including the agent itself
2. **Only kill by captured PID** — `$proc.Kill()` or `Stop-Process -Id $PID`
3. **Cleanup only your own PIDs** — From the PID table, not from the system
4. **At compaction checkpoint**: clear the PID table and verify all tracked processes are dead

### Why
- Sub-agents run inside the opencode.exe process tree. Killing opencode by name kills the agent.
- A new PowerShell window is a completely separate process tree — safe to kill.
- The agent and its sub-agents are immune to cleanup of processes they spawned.

## R11: Glitch Version Sync Check — Session Brief (Immutable Rule)
On EVERY session start, before delivering the session brief:

1. **Fetch remote**: `git fetch origin main 2>&1` (run in the glitch-ai parent repo — the working directory)
2. **Check behind count**: `git rev-list --count HEAD..origin/main 2>&1`
3. **If the output is a number > 0**: The local repo is behind. Include a `⛔` flag in the session brief:
   ```
   ⛔ [N] commits behind origin/main — run `git pull` to sync
   ```
4. **If the output is 0 or empty/error**: Local is up-to-date or network unavailable. No flag needed.

5. **Read `update-status.json`** (written by launch scripts on startup): Check `E:\Glitch AI\glitch-ai\update-status.json` for the latest dependency update scan. If it exists and was written within the last hour, include a dependency update line in the session brief:
   ```
   Updates: N available → [list of items with updates]
   ```
   If no updates: `Updates: all up-to-date`
   If stale/missing: skip silently (the launch scripts run the check, so it's always fresh at session start).

6. **Read `model-update-status.json`** (written by launch scripts on startup): Check `E:\Glitch AI\glitch-ai\model-update-status.json` for the latest model discovery scan. If it exists and was written within the last hour, include a model update line in the session brief:
   ```
   Models: N new → [list of new model IDs]
   ```
   If any are related to current agent models, flag them: `⚡ [model] → related to @[agent] ([current model])`.
   If no new models: `Models: up-to-date`
   If stale/missing: skip silently.

### Important
- Use the **parent repo** (`glitch-ai`), NOT the submodule (`glitch-memorycore`)
- The working directory should already be the glitch-ai parent — just run `git fetch` directly
- If git fetch fails (no network), silently skip — don't block the session brief
- Error output (no network, no git) should be captured and treated as "skip check"
- `update-status.json` is generated by `launch.ps1` / `serve-glitch.ps1` via `check-updates.ps1 -CheckOnly`. If it doesn't exist or is >1hr old, skip the dependency update line — the check wasn't run this session.
- `model-update-status.json` is generated by `launch.ps1` / `serve-glitch.ps1` via `check-models.ps1 -CheckOnly`. Same staleness rules apply.

### Rationale
This ensures every deployment of Glitch AI knows when updates are available. The session brief is the per-session heartbeat — if there are un-pulled changes, the AI flags them immediately. This prevents silent drift between machines. The dependency check extends this to all external tools (opencode, GitNexus, cloudflared, Handy, etc.) so nothing falls behind silently. The model check extends this to the LLM provider landscape — if new models appear that could upgrade our agents, we know about it.

## R12: Immediate Memory Integration — Delegator Handles Memory (Immutable Rule)

The delegator processes ALL memory writes directly — never delegate memory file edits to sub-agents.

### Trigger Conditions (Fire Immediately)
When ANY of these happen during conversation, stop and write the update immediately:

| Trigger | Target File |
|---------|-------------|
| User expresses a preference or changes their mind | `user/main-memory.md` → User Profile |
| A decision is made | Append to `user/decisions.md` |
| Something breaks or an error is fixed | Append to `user/post-mortems.md` |
| A pattern is noticed (2+ occurrences) | Update `user/patterns.md` |
| A follow-up is needed | Append to `user/reminders.md` |
| A project progresses | Update `user/projects/project-list.md` and `user/session-dashboard.md` |
| A session is substantial | Append to `user/daily-diary/current/YYYY-MM-DD.md` |

### Write-Then-Commit Protocol
After EVERY memory write:
1. Run `git add -A && git commit -m "memory: [brief description]" && git push` in the glitch-ai parent repo
2. If `user/` is a separate git repo (e.g., private user submodule), also commit and push there
3. This happens in one uninterrupted sequence — no waiting, no batching

### Why This Exists
- Memory is the delegator's unique responsibility — sub-agents have no context of the full relationship
- Real-time capture prevents forgetfulness and stale memory
- Auto-commit prevents data loss between sessions
- The compaction checkpoint (R3) still runs for bulk consolidation, but capture is always immediate

### Bypass Allowed
Only skip the auto-commit if:
- You are mid-task and plan to commit everything at the next compaction checkpoint (within ~8 turns)
- BUT the memory write itself must still happen immediately — never defer the capture

## R13: Config Validation Gate — opencode.json Safety (Immutable Rule)

When ANY change touches `opencode.json` or any launch script (`launch.ps1`, `launch-safe.ps1`, `launch-free.ps1`, `serve-glitch.ps1`), the following validation MUST run BEFORE any review or commit:

### Mandatory Pre-Validation Steps
1. **Validate JSON syntax**: Run `powershell -NoProfile -File validate-config.ps1` to check the config parses and all referenced files exist. If validation fails, fix before proceeding.
2. **Check .ps1 files for non-ASCII characters**: PowerShell 5.1 on Windows reads BOM-less UTF-8 files as Windows-1252. Non-ASCII chars like `—` (em dash, UTF-8 `E2 80 94`) contain byte `0x94` which maps to `"` in Windows-1252, breaking string parsing silently. Run `validate-config.ps1` which verifies all .ps1 files are pure ASCII. **BLOCKER** if any .ps1 file has non-ASCII chars.
3. **Check for structural completeness**: Every agent object must have a `model` field, every opening `{` must have a closing `}`. A missing bracket at any depth will block startup entirely — this is the most catastrophic class of error.
4. **Check instructions files**: Every path in the `instructions` array must reference an existing file. If a file is in `glitch-memorycore/`, flag that the submodule must be initialized.

### Integration with Quality Gate
When delegating to @reviewer:
1. ALWAYS include `validate-config.ps1` output in the review context when opencode.json is in the change set
2. The reviewer's Phase 0.5 (Startup-Safety Gate) checks JSON syntax — but the pre-validation catches it FIRST, before the cost of a full review

### Safe Mode Fix Workflow
If you are running in safe mode (launch-glitch-safe.bat):
1. The script backs up the broken `opencode.json` as `opencode.json.bak`
2. It writes a minimal temporary config to `opencode.json` to get Glitch running
3. **Apply ALL fixes to `opencode.json.bak`** — NOT to `opencode.json`
4. The backup is what gets restored when safe mode exits. Edits to `opencode.json` are LOST.
5. After fixing the backup, run: `validate-config.ps1 -Path opencode.json.bak` to verify it
6. When safe mode exits, it detects if the backup was modified and restores it automatically

### Why This Rule Exists (PM-007)
A missing closing `}` in opencode.json caused both `launch-glitch.bat` and `launch-glitch-safe.bat` to fail. The reviewer didn't catch it because JSON syntax validation wasn't part of the gate. This rule ensures every opencode.json change is syntactically validated before it can block a launch. The safe mode workflow was also fixed so that fixes applied during safe mode properly persist through the backup/restore cycle.

## R14: Config/Launch Change Gate — Reviewer Must Approve (Immutable Rule)

When ANY change touches `opencode.json`, `launch.ps1`, `serve-glitch.ps1`, `launch-glitch.bat`, `serve-glitch.bat`, or any launch/bootstrap script:

### Mandatory Pre-Commit Steps
1. **Load the reviewer skill**: Before writing any code, load `skill "code-review"` or dispatch to @reviewer with the full planned change set
2. **Present the diff**: Show the reviewer exactly what files will change and what the changes do
3. **Get approval**: Do NOT commit or apply changes until the reviewer gives PASS with no BLOCKERs
4. **Validate after**: Run `validate-config.ps1` after every config change
5. **Notify**: After the change is committed, tell the user they need to restart opencode

### Exceptions (Rare)
- Emergency fix when opencode won't start at all (safe mode)
- Trivial single-line doc changes (formatting, comments only)

### Why This Exists
Repeated failures from unvalidated config/launch changes. Every script change must pass review before it lands, not after.

## R15: Delegator Discipline — Delegate Code Work, Own Memory (Immutable Rule)

The delegator's job is coordination, planning, and memory management. Code changes belong to sub-agents.

### What the Delegator Does Directly
- **Memory writes**: All memory file updates (current-session.md, main-memory.md, decisions.md, reminders.md, etc.) — per R12
- **Planning**: Task decomposition, todo list creation, architecture decisions
- **Coordination**: Dispatching work to sub-agents, consolidating results
- **Reading**: Reading files for context, searching code, investigating issues
- **Asking questions**: Clarifying requirements with the user

### What the Delegator Delegates
- **Code edits**: Any file modification that changes logic, UI, or behavior → dispatch to @general or @coder
- **File creation**: New scripts, components, pages → dispatch to @build or @coder
- **Bash commands**: Any non-git shell commands → dispatch to @general
- **Code review**: Reviewing code changes → dispatch to @reviewer
- **Testing**: Writing or running tests → dispatch to @testing
- **Visual analysis**: Analyzing images/screenshots → dispatch to @vision

### Enforcement
- Before using `edit` or `write` tools, ask: "Is this memory/planning work (mine) or code work (delegate)?"
- If it's code work, dispatch to the appropriate sub-agent
- Memory/config files (prompt-rules.md, CLAUDE.md, opencode.json, launch scripts) are the delegator's responsibility — these are coordination/config, not application code
- This rule is same tier as Radical Candor and Git Discipline


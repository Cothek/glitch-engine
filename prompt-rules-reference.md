---
type: Rules
title: Glitch Prompt Rules — Reference (On-Demand)
description: Full rule set — available for search and on-demand loading. Not loaded at session start by default.
tags: [glitch, core, rules, reference]
timestamp: 2026-08-20T22:00:00Z
---

# Glitch Prompt Rules — Reference (On-Demand)

This file contains the complete Glitch prompt rule set. It is **not loaded at session start** by default but remains fully searchable via the `recall` tool or `grep`. Load it on-demand when a specific rule context is needed.

Use `recall query:"<rule name or keyword>"` to find any rule in this file.

---

## R3: Compaction Checkpoints (Every ~8 Turns)

**First action at every compaction checkpoint:**

```bash
node scripts/run-compaction.mjs
```

This script handles the automatable infrastructure (timestamp update, diary staleness check, curriculum status, git status) and produces a visible checklist of what still needs AI judgment. Heavy checks (image GC, data audit, data review, memory index) are throttled to once per 24h by the script itself — they report "skipped" when not due; no action needed from the AI.

After running the script, work through any remaining items:

### Required (always do):

1. **Promote** any scratchpad entries to proper files (if any exist)
2. **Append** diary entry if session was substantial (+10 turns or major work)
3. **Auto-commit**: Dispatch to @general to execute `git add -A && git commit -m "memory: compaction YYYY-MM-DD" && git push` (no direct bash) — ONLY if the script's git status shows dirty files. If clean, skip the dispatch entirely.
4. **Run Step 6 — Pattern scan**: Scan scratchpad + recent session for 3x+ repeated workflows or crystallized patterns. If found, read forge skill and create skill.
5. **Run Step 7 — Self-review**: Read `read plugins/glitch-skills/skills/self-review/SKILL.md` and perform a system health review (opencode.json, skills-registry, prompt-rules, performance). Produce BLOCKER/ISSUE/SUGGESTION report.
5.5 **Run Skill improvement review**: Read `user/pending-skill-improvements.md`. For each skill with 2+ pending entries or 1 high-significance entry, load the skill file, generate candidate diff(s) incorporating the proposed fixes, and present to the user for approval. If approved, dispatch the appropriate agent to apply the changes and update the entry status to "applied". If the user is not available (end of session), leave entries as `pending` for next session.

### Throttled (steps 6-9 run every 3rd compaction OR once per day, whichever first — the compaction.js plugin omits them from the prompt on light cycles, so only act on them if they appear in the injected prompt):

- **Step 8 — Curriculum**: Read the curriculum skill and run the next challenge. Only if 2+ compaction cycles since last attempt.
- **Step 9 — Staleness**: Phase B (scan main-memory.md for stale refs), Phase C (promote diary if substantial).

**Why this exists**: The previous 9-step protocol relied entirely on active recall — steps 6-9 had no visible trigger and were frequently skipped (self-review and curriculum never fired in 18+ days). The script provides a visible, repeatable trigger that eliminates the recall problem. It handles the automatable infrastructure; the AI handles the judgment calls. Step 5.5 closes the feedback loop — user corrections during sessions now have a structural path to durable skill improvements. (2026-08-18: steps 6-9 throttled to every 3rd cycle / daily to cut token waste — self-review, curriculum, and skill review were running ~13x/day at ~7K tokens per prompt injection.)

### Stale-Session Detection (At Conversation Start)

If `Last Memory Update` timestamp is >2 hours stale when you first respond:
- Treat as a session boundary — promote all remaining entries, write diary recap, update current-session recap, commit
- **Touch-timestamp catch-up**: Dispatch @memory to update timestamps on all active user files (`current-session.md`, `main-memory.md`, `decisions.md`, `patterns.md`, `post-mortems.md`, `reminders.md`, `project-list.md`, `session-dashboard.md`, `forge-log.md`). This prevents mass-stale timestamps like the current 22-day gap.
- This catches sessions that ran long or were left idle without closure

## R9: GitNexus Code Graph — Context Before Changes (Immutable Rule)

**NOTE (2026-08-02):** GitNexus MCP is NOT currently configured in any opencode.json. This rule applies when the MCP server is available (e.g., in indexed repos ai-gm/ECD-website with MCP wired). Otherwise fall back to standard tools.

GitNexus MCP tools (query, context, impact, detect_changes, rename, cypher) are used when the MCP server is available and configured (e.g., in indexed repos ai-gm/ECD-website with MCP wired). Otherwise fall back to regular grep/glob/read. Use them proactively when working on code projects (ai-gm, ECD-website) to reduce guesswork and avoid regressions.

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

## R11: Glitch Version Sync Check — Session Brief (Immutable Rule)

**Note**: The entry point scripts (`launch-unified.mjs`, `glitch.mjs`, `serve.mjs`) check for glitch-ai repo updates at startup. When updates are found, a gated prompt asks the user to apply (default: yes) and the script restarts itself to run the updated code. This R11 check is a fallback for sessions launched directly (e.g., running `opencode.exe` manually) or when the startup sync was skipped/failed.

On EVERY session start, before delivering the session brief:

1. **Fetch remote**: `git fetch origin main 2>&1` (run in the glitch-ai parent repo — the working directory)
2. **Check behind count**: `git rev-list --count HEAD..origin/main 2>&1`
3. **If the output is a number > 0**: The local repo is behind. Include a `⛔` flag in the session brief:
   ```
   ⛔ [N] commits behind origin/main — startup sync was skipped/failed on launch; run `git pull` to sync
   ```
4. **If the output is 0 or empty/error**: Local is up-to-date or network unavailable. No flag needed.

5. **Read `update-status.json`** (written by launch scripts on startup): Check `data/update-status.json` for the latest dependency update scan. If it exists and was written within the last hour, include a dependency update line in the session brief:
   ```
   Updates: N available → [list of items with updates]
   ```
   If no updates: `Updates: all up-to-date`
   If stale/missing: skip silently (the launch scripts run the check, so it's always fresh at session start).

6. **Read `user/` repo behind count**: `cd user && git fetch origin main 2>&1 && git rev-list --count HEAD..origin/main 2>&1`. If the result is a number > 0, include a user memory flag in the session brief:
   ```
   User Memory: [N] commits behind origin — run `scripts/sync-user.ps1 -Pull` to sync
   ```
   If output is 0 or empty/error: skip. If `user/.git` doesn't exist (no separate repo): skip.

7. **Read `model-update-status.json`** (written by launch scripts on startup): Check `data/model-update-status.json` for the latest model discovery scan. If it exists and was written within the last hour, include a model update line in the session brief:
   ```
   Models: N new → [list of new model IDs]
   ```
   If any are related to current agent models, flag them: `⚡ [model] → related to @[agent] ([current model])`.
   If no new models: `Models: up-to-date`
   If stale/missing: skip silently.

### Important

- Use the **parent repo** (`glitch-ai`), NOT the submodule (`glitch-memorycore`)
- The `user/` directory is a separate nested git repo with its own remote (`Cothek/glitch-user-troy`). Check it separately in step 6.
- The working directory should already be the glitch-ai parent — just run `git fetch` directly
- If git fetch fails (no network), silently skip — don't block the session brief
- Error output (no git, no network) should be captured and treated as "skip check"
- `data/update-status.json` is generated by `launch-unified.mjs` / `serve.mjs` / `glitch.mjs` via `check-updates.ps1 -CheckOnly`. If it doesn't exist or is >1hr old, skip the dependency update line — the check wasn't run this session.
- `data/model-update-status.json` is generated by `launch-unified.mjs` / `serve.mjs` / `glitch.mjs` via `check-models.ps1 -CheckOnly`. Same staleness rules apply.

### Rationale

This ensures every deployment of Glitch AI knows when updates are available. The session brief is the per-session heartbeat — if there are un-pulled changes, the AI flags them immediately. This prevents silent drift between machines. The dependency check extends this to all external tools (opencode, GitNexus, cloudflared, Handy, etc.) so nothing falls behind silently. The model check extends this to the LLM provider landscape — if new models appear that could upgrade our agents, we know about it.

## R13: Config Validation Gate — opencode.json Safety (Immutable Rule)

When ANY change touches `opencode.json` or any launch script (`launch.mjs`, `launch-safe.mjs`, `launch-free.mjs`, `serve.mjs`), the following validation MUST run BEFORE any review or commit.

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

When ANY change touches `opencode.json`, `launch.mjs`, `serve.mjs`, `launch-glitch.bat`, `serve-glitch.bat`, or any launch/bootstrap script:

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

## R16: Branch Discipline — Never Modify Main Directly (Immutable Rule)

Main is the stable launch branch. All **Glitch core code** changes go through feature branches.

### Scope: What Counts as "Glitch Core Code"

This rule applies ONLY to files that affect Glitch's ability to start and run:
- `opencode.json` and `config/opencode-*.json` templates
- `glitch-memorycore/` engine files (prompt-rules.md, glitch.md, skills)
- `scripts/launch*.mjs`, `scripts/serve.mjs`, `scripts/switch-branch.ps1`
- `.opencode/agents/*.md` (agent definitions)
- `launch-glitch*.bat`, `serve-glitch.bat` (Windows)
- `launch-glitch*.sh`, `serve-glitch.sh` (Mac/Linux)
- `validate-config.ps1`

**Everything else** (external projects, user memory files, the website, non-core scripts) can be edited directly on any branch without restriction.

### The Workflow

```
main (stable)  ←  develop (active)  ←  feature/xxx (experiments)
      ↑                                  |
      └── only merge when confirmed ──────┘
```

### Hard Rules

1. **Never make changes to Glitch core files directly on main**. Main is updated only via merge from develop.
2. **All core code work starts with a branch switch** — if currently on main, switch to develop or a feature branch before any core file edits.
3. **Troy always launches from main** — the main branch's config is always valid. develop and feature branches may have work-in-progress configs that won't parse.

### Branch Management Tool

Use `.\scripts\switch-branch.ps1` for all branch operations:
- `-Branch <name>` — switch with auto-stash + config validation
- `-Create <name> [-From <source>]` — new branch from develop (default) or other source
- `-Merge <branch> -Message <msg>` — merge a branch into current (requires message)
- `-List` — show all branches
- `-Force` — skip config validation (use when switching to a broken branch to fix it)

### Merge Protocol

- Only merge when Troy explicitly says to merge
- Merging develop into main requires confirmation (it makes changes permanent)
- Merges use `--no-ff` to preserve branch history
- Always push after merge

### Enforcement

- If on main, before any Glitch core file edit, propose switching to develop or a feature branch
- If the target branch has a broken config and you're switching to fix it, use `-Force` to skip validation
- This rule applies only to Glitch core files (see Scope above). Non-core files can be edited freely on any branch.
- This rule is same tier as R10 (Process Isolation) and R13 (Config Validation Gate)

## R17: Mode Switching — One Command to Switch & Launch (Immutable Rule)

When the user asks to switch Glitch modes (e.g., "switch to normal mode", "start in free mode", "go to local mode", "start in safe mode"), execute this pattern immediately.

### The Pattern

```
User says: "switch to <mode>" or "start in <mode>" or "go to <mode>"
    ↓
I run: node scripts/glitch.mjs <mode>
    ↓
Script handles: switch config → kill old OpenCode → launch new mode in new window
    ↓
I confirm: "Switched to <mode> and launched in new window"
```

### Valid Modes

| Mode | Command | Description |
|------|---------|-------------|
| normal | `node scripts/glitch.mjs normal` | Full featured with paid models |
| free | `node scripts/glitch.mjs free` | Free models only (OpenCode Zen, NVIDIA, OpenRouter) |
| local | `node scripts/glitch.mjs local` | Local models via LM Studio |
| safe | `node scripts/glitch.mjs safe` | Minimal config for troubleshooting |

### Status Check

If user asks "what mode am I in?" or "current mode":
```
I run: node scripts/switch-mode.mjs --status
```

### Key Points

- **No manual steps** — the script handles config switch, process kill, and detached launch
- **Cross-platform** — Windows (cmd.exe), macOS (osascript), Linux (gnome-terminal/xterm/nohup)
- **Mode marker** — script updates `data/backups/.last-mode` automatically
- **If already in that mode** — script restarts the session (useful for config changes)

### Trigger Phrases (Fire Immediately)

- "switch to normal/free/local/safe mode"
- "start in normal/free/local/safe mode"  
- "go to normal/free/local/safe mode"
- "change to normal/free/local/safe mode"
- "launch in normal/free/local/safe mode"
- "what mode am I in?" / "current mode" / "mode status"

### Execution

Dispatch to @general to run the command (Glitch has bash:deny, so bash commands go through @general).

## R18: Agent Config Consistency — opencode.json and Agent Files Must Match (Immutable Rule)

When an agent is defined in BOTH `opencode.json` AND `.opencode/agents/<name>.md`:

### Hard Rules

1. **The inline definition in opencode.json takes precedence** over the file definition for top-level fields (model, mode, permission, prompt). The agent file's `name`, `description`, and example blocks are independently useful.
2. **Critical fields MUST match** — if `model` differs between opencode.json and the agent file, the active model (opencode.json) may not have the capabilities the file's prompt assumes (e.g., vision, tool access).
3. **When changing either location, check the other** — a model upgrade in opencode.json without updating the agent file creates silent drift.

### Enforcement

- When reviewing agent config changes: compare opencode.json `agent.vision.model` vs `.opencode/agents/vision.md` frontmatter `model`.
- If they differ and the agent needs a specific capability (vision, large context), flag it as a BLOCKER.
- At self-review (R3 step 7): scan for all agents defined in both locations and report any mismatches.

### Why This Exists

A 3-way model mismatch was found for @vision (opencode.json: `nemotron-3-ultra-free`, agent file: `minimax-m3-free`, paid fallback: `qwen3.6-plus`). The active model may not support image input, effectively breaking @vision's core function. No previous rule caught this.

### Exception

- If the agent file intentionally documents a "proposed upgrade" model while opencode.json has the current model, add a comment in the agent file frontmatter: `# planned_upgrade: provider/model-name`.

## R19: Skill Reflex — Load Before Execution (Omni Mode Only)

**Scope: Applies ONLY when running as `glitch-omni` agent (direct execution mode, `task: deny`). Does NOT apply in default Glitch mode where delegation to sub-agents is the primary workflow.**

When in Omni mode, before ANY delegation-domain task (code, design, review, test, security, debug, refactor, image, write), the following reflex fires.

### ⚡ THE REFLEX (Execute in Order, No Skipping)

**Step 1 — Check available_skills for matching trigger:**

Scan the Trigger Matrix below. If the task matches any skill's trigger keywords, that skill MUST be loaded first via `skill("name")`.

**Step 2 — Load the skill:**

Call `skill("name")` and wait for the full skill content to load. Do not proceed until loaded.

**Step 3 — Execute following the skill's protocol:**

Use the loaded skill's workflow, checklists, and standards for the task.

**Step 4 — Log if no skill matched:**

If no skill trigger matches, add `🔧 OPERATIONAL: No skill matched for [task description] — executed without skill` to scratchpad.

### Trigger Matrix (Skill → When to Load)

| Skill | Trigger Keywords / Task Types |
|-------|-------------------------------|
| `code-review` | "review", "quality gate", "check this", 3+ files, logic/API/security changes |
| `testing` | "write tests", "test coverage", "TDD", "add tests", "run tests" |
| `ui-craft` | "design", "UI", "component", "page", "screen", "layout", "make it look" |
| `ui-design` | "improve UI", "design this", "visual design", "frontend changes" |
| `security-testing` | "security audit", "pentest", "vulnerability", "OWASP", "hack my app" |
| `image-generation` | "generate image", "create artwork", "make a picture", "draw" |
| `gitnexus` | "impact", "blast radius", "what depends on", "trace call", "architecture map" |
| `refactoring` | "refactor", "clean up", "simplify", "improve code" |
| `debugging` | "debug", "bug", "crashed", "not working", error output |
| `dev-loop` | "build feature", "autonomous mode", "end-to-end implementation" |
| `observation` | "survey", "investigate", "refine code", "audit" |
| `forge` | "create skill", "forge this", pattern detected 3x+ |
| `work-plan` | "copy plan", "append plan", "resume plan" |
| `auto-commit` | "commit", "save changes", "git commit" |
| `post-mortem` | failure detected, 🔧 tag, "post-mortem" |
| `save-memory` | task change, decision, error, reminder, session end |
| `session-briefing` | session start, "brief" |
| `image-prompt` | "create prompt", "midjourney prompt" |
| `song-creation` | "create album", "create song", "muse this" |
| `interactive-story` | "new adventure", "save adventure", "load adventure" |
| `mulahazah` | auto-triggers via hook |
| `adapt` | "adapt", "responsive", "mobile", "tablet", "desktop" |
| `animate` | "animate", "motion", "animation" |
| `audit` | "audit", "a11y", "performance", "technical audit" |
| `brandkit` | "brand assets", "brand identity", "logo", "visual identity" |
| `brief` | "brief", "design brief" |
| `clarify` | "UX copy", "buttons", "errors", "empty states", "form hints" |
| `colorize` | "colorize", "introduce color", "accent color" |
| `critique` | "critique", "UX review", "hierarchy", "clarity" |
| `delight` | "delight", "micro-interaction", "joy" |
| `distill` | "distill", "strip to essence", "cut sections" |
| `extract` | "extract", "component", "tokens", "magic values" |
| `finalize` | "finalize", "pre-ship", "finish bar" |
| `harden` | "harden", "error states", "edge cases", "when things go wrong" |
| `heuristic` | "heuristic", "Nielsen", "design laws", "scorecard" |
| `imagegen-frontend-web` | "website images", "landing page images", "design comps" |
| `imagegen-frontend-mobile` | "mobile screens", "app screens", "mobile UI" |
| `tokens` | "tokens", "token spine", "design tokens" |
| `typeset` | "typeset", "typography", "fonts", "scale", "hierarchy" |
| `unhappy` | "unhappy", "loading", "empty", "error", "partial", "offline states" |
| `writing` | "write", "draft", "document", "remove AI telltales" |

### Integration with R8 (Todo List)

When creating a todowrite (R8), for each subtask:
1. Add a `skill` field with the matching skill name (or `null` if none)
2. Add a `type` field: `CODE`, `DESIGN`, `REVIEW`, `TEST`, `SECURITY`, `DEBUG`, `REFACTOR`, `PLAN`, `IMAGE`, `WRITE`, `MEMORY`, `CONFIG`, `GIT`, `READ`
3. First action for each subtask = load the skill (if any) then execute

### Example todowrite with skills:

```json
{
  "todos": [
    {"content": "Review auth.ts changes", "status": "pending", "priority": "high", "skill": "code-review", "type": "REVIEW"},
    {"content": "Write tests for formula-validator", "status": "pending", "priority": "high", "skill": "testing", "type": "TEST"},
    {"content": "Design SettingsPanel UI", "status": "pending", "priority": "medium", "skill": "ui-craft", "type": "DESIGN"},
    {"content": "Security scan on new API route", "status": "pending", "priority": "high", "skill": "security-testing", "type": "SECURITY"}
  ]
}
```

### Enforcement (At Compaction Checkpoints — R3)

During the compaction checkpoint (R3, every ~8 turns), scan completed tasks since last checkpoint:

1. For each completed task: did it match a skill trigger? Was the skill loaded?
2. If missed: log `🔧 OPERATIONAL: Missed skill [name] for [task] — add to reflex` to scratchpad
3. If pattern (3+ misses of same skill): create a skill-router rule or update this trigger matrix

### Why This Rule Exists

In Omni mode, there are no sub-agents to provide specialized methodology. Skills are the ONLY portable methodology layer. Without this reflex, Omni mode reverts to ad-hoc execution with no quality gates, no design standards, no review protocol — exactly the failure mode that delegation was designed to prevent. This rule makes skill usage as automatic as the R7 vision reflex.

## R20: UI Design System Compliance — Always Use Existing Components (Immutable Rule)

Before ANY UI/frontend change in ANY project, you MUST check whether that project has a UI design system and use it.

### Mandatory Pre-Code Check

1. **Scan the project** for a UI design system:
   - Check `components/ui/` for base primitives (Button, Input, Dialog, DropdownMenu, etc.)
   - Check for shadcn/ui patterns (Radix primitives, variants maps, cn() utility)
   - Check for a `.ui-craft/` or design system configuration file
2. **If a design system exists**: ALL UI elements you create or modify MUST use components from that system. No exceptions.
3. **If no design system exists**: Follow the project's existing styling conventions (Tailwind classes, CSS modules, styled-components, etc.) consistently.

### Hard Rules

1. **Never use raw HTML elements** (`<button>`, `<input>`, `<select>`) when a design system equivalent (Button, Input, Select) exists in `components/ui/`.
2. **Never use inline SVGs** for icons when a project uses lucide-react or another icon library consistently.
3. **Never use nonexistent component variants** — if the Button component defines variants `primary`, `secondary`, `outline`, `ghost`, `danger`, do NOT use `"destructive"` or any other string that doesn't match.
4. **When a design system component exists but doesn't perfectly match your use case**, use it as a base and extend with `className` — do not build a replacement from scratch.
5. **Apply this to ALL projects**, not just the current one. Before any UI work in any codebase, scan for `components/ui/` first.

### Enforcement

- **Self-review**: Before presenting any UI change, check that every element used a design system component when one was available.
- **At reviewer gate**: The reviewer will flag raw HTML elements in UI code as MAJOR findings when design system equivalents exist.
- **Violation logging**: If caught using a raw `<button>` or `<input>` when a design system component exists, log `🔧 FAILURE: R20 violation — [what was used] instead of [design system component]` to the scratchpad.

### Examples of Past Violations (ai-gm project)

These real examples show what NOT to do:
- Raw `<button>` with custom Tailwind classes instead of `Button` component (creature-tree.tsx "Create New" and "Add all" buttons, confirm-dialog.tsx action buttons)
- Raw `<input>` with `bg-slate-800 border-slate-600` instead of `Input` component (creature-tree.tsx name input)
- Nonexistent variant `"destructive"` instead of `"danger"` on a delete button (confirm-dialog.tsx)
- Inline SVG `<path>` elements instead of lucide-react `Plus` icon (creature-tree.tsx)

## R21: Stuck Detection — Breakthrough Signal

The `stuck-detector.js` plugin monitors tool call patterns and writes `data/.stuck-signal.json` when it detects:
- Same tool called 3+ times with similar arguments (tool repetition)
- 3+ consecutive errors (error cascade)
- Same bash command repeated 2+ times (command repetition)

### When you see `data/.stuck-signal.json` exists:

1. Read the signal file to understand why you were flagged as stuck
2. Load `skill("breakthrough")` immediately
3. Delete the signal file
4. Reframe the problem using a different approach

### Important

The stuck detector is a safety net, not a judgment. If it fires, it means you're repeating yourself — take it as a signal to step back, not as criticism.

## R22: Mulahazah Memory Trigger — Mechanical Memory Writes (Immutable Rule)

The `mulahazah.js` plugin observes every tool call and writes a per-session flag `data/MEMORY_TRIGGER_FLAG.<sessionID>` when memory should be recorded. This converts the memory update protocol from a behavioral rule into a mechanical one. The plugin also injects the `[MEMORY TRIGGER PENDING]` directive into the message stream via the transform hook when it fires — the model does not need to actively poll for it, but MAY check for the flag defensively. Only the parent/dispatcher session (the one that can call `task()`) should ever act on it; sub-agents must NOT attempt dispatch (handled by sub-agent prompts).

### When the Flag Fires

The plugin writes the flag when ANY of these conditions are met:
- **15 minutes** have elapsed since the last write with **≥1 tool call** since then (heartbeat — also captures session-end state when a session goes quiet: it fires once at the 15-min mark, then stops until new activity)
- **1M new tokens** (input + output + reasoning) have accumulated since the last write (token burst — catches token-heavy sessions under the 15-min window)
- A **trigger phrase** is detected in tool args: "remember that", "i prefer", "from now on", "always do", "never do", "i want", "make sure to", "don't forget"

A 5-minute cooldown prevents phrase-trigger spam between triggers. Both the heartbeat and token-burst paths reset their window on every trigger, so they never double-fire.

> **2026-08-19**: The 200-call / 4-hour thresholds (2026-08-18) are REPLACED by the 15-min heartbeat + 1M-token-burst model (heartbeat interval set to 15 min per Troy 2026-08-19). The heartbeat guarantees a per-session cadence (~every 15 min of activity) without counting calls; the token burst catches heavy-compute sessions early. Trigger phrases still fire immediately — preferences and decisions are captured in real time; only routine session observations are batched. glitch-omni sessions (task: deny, self-fulfilling) are now flag-capable via DB agent detection.

### Auto-Dispatch Protocol

**At the start of every response, BEFORE any other action:**

1. **Check for the flag:** Read `data/MEMORY_TRIGGER_FLAG.<sessionID>` (substitute your current session ID)
2. **If the flag exists:**
   a. Read its contents (a summary of tool calls and session duration)
   b. Dispatch to `@memory` with the summary and the directive: "Record this session's observations to memory. Include any preferences, decisions, or lessons learned."
   c. After @memory confirms, **delete the flag file** to prevent re-processing
3. **If the flag does not exist:** proceed with normal response logic

### Why This Rule Exists

- The memory update protocol (R12) is behavioral — it relies on the model remembering to write
- Behavioral rules fail under output budget pressure (per the 2026-07-27 directive)
- Mechanical triggers via plugins are more reliable than memory tests
- This mirrors the R7 vision-dispatch pattern: plugin writes flag, model reads and acts

### Relationship to R12

R12 says "memory writes happen in real time for every trigger." R22 makes that mechanical. Both rules apply — R22 is the enforcement mechanism for R12's behavioral intent.

## R23: Agent Tier — Free vs Paid Dispatch (Immutable Rule)

Controls which sub-agents Glitch dispatches: free agents vs paid agents. This is a RUNTIME DELEGATION PREFERENCE ONLY. It does NOT change opencode.json, does NOT kill/restart anything, and does NOT switch Glitch modes. Mode switching is R17's job (`switch to free mode` = restart with new config). Tier switching is this rule's job (`switch to free agents` = just dispatch differently).

### Trigger Phrases (Fire Immediately, Do NOT Confuse with R17)

- "switch to free agents", "switch to paid agents"
- "use free agents", "use paid agents", "use the free agents", "use the paid agents"
- "start using free agents", "start using paid agents"
- "go to free agents", "go to paid agents"
- "we're on paid agents", "we're on free agents"
- "switch agents to paid", "switch agents to free"

### The Pattern

```
User says: a trigger phrase above
    ↓
I run: node scripts/set-agent-tier.mjs <tier>  (via @general or @general-paid)
    ↓
NO glitch.mjs, NO restart, NO config edit
    ↓
I confirm: "Agent tier set to free/paid — dispatching <tier> agents from now on."
```

### Dispatch Tables

**Tier = free** (current default behavior):
@general, @coder, @explore, @reviewer, @testing, @vision, @ui-designer, @memory, @pentester. Free first, paid fallback only on free failure or quota exhaustion.

**Tier = paid**:
@general-paid, @coder-paid, @explore-paid, @reviewer-paid, @testing-paid, @vision-paid, @ui-designer-paid, @memory-paid, @pentester-paid as the PRIMARY dispatch target. Do not attempt the free agent first. Fall back to free only if the paid agent fails with a model/API error.

### Persistence

The tier is stored in `data/agent-tier.json` and read at session start (R1). It survives restarts.

### Status Check

If the user asks "what agents are we on?" or "are we on free or paid agents?", run:
```
node scripts/set-agent-tier.mjs --status
```

### Clarifying Note

"switch to free mode" (R17) and "switch to free agents" (R23) are DIFFERENT. R17 restarts Glitch with a new config. R23 only changes dispatch targets. When in doubt, do NOT run glitch.mjs for an agents request, and do NOT change agent-tier for a mode request.

## R24: Plan Before Complex Tasks — Mandatory Plan Step (Immutable Rule)

BEFORE any task() dispatch or multi-file edit on a complex task, write a plan to `data/plans/current-plan.md` using the plan-first skill template. Then dispatch.

### Complexity Trigger Matrix (ANY match → mandatory plan)

1. **3+ files touched**, or **5+ todowrite items**
2. **Keywords in task**: feature, build, migration, refactor, integrate, architecture, auth, database, API route, full-stack, end-to-end, design system, security
3. **Touches shared code**: API routes, security, shared utilities, or a UI design system
4. **Troy says**: "plan this", "complex task", "plan first", "plan before"

### The Mandate

1. Load `skill("plan-first")` to get the plan template
2. Write the plan to `data/plans/current-plan.md` with these sections:
   - **Goal** — what success looks like
   - **Approach** — strategy, ordering, dependencies
   - **Files to change** — explicit list with what changes and why
   - **Risks & mitigations** — what could go wrong, how to handle it
   - **Verification** — how to prove it works (commands, tests, manual steps)
3. Once the plan file exists, proceed with dispatches and code edits per R15

### Mechanical Enforcement

`plan-reflex.js` throws on complex task dispatches or code file edits without a valid plan marker (file must exist and be < 6 hours old). This is the same pattern as dispatch-reflex.js, the mechanical enforcement for R15's dispatch-first workflow.

### Bypass

Include `quick task` or `--no-plan` in the task prompt to skip the gate for intentionally simple work. This is a conscious bypass — use it only when the task is genuinely simple despite matching a trigger.

### After Completion

Rotate the plan to `data/plans/archive/<timestamp>-<task>.md` so the gate stays meaningful for the next complex task.

### Why This Rule Exists

Glitch jumps straight from receiving a task to dispatching sub-agents without an up-front planning step. For complex work, this leads to missed files, wrong ordering, and rework. A 2-minute plan prevents hours of backtracking.

---
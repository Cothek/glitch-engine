# Memory Core Repo — Purpose & Boundaries

This repo is the **search + skills + plugin engine** for Glitch. It is vendored as a submodule at `glitch-pi/glitch-memorycore/` and is one of three repos in the system (glitch / user / memory core, see the root `AGENTS.md` in glitch-pi).

## Belongs here

- Search/embed tooling (`plugins/embed-search/`)
- Skills source of truth (`plugins/glitch-skills/skills/`) — `.pi/skills/` in glitch-pi is generated from here at launch; never edit the generated copy
- Core engine source (`core/`), library, docs

## Never belongs here

- User memory files (main-memory, decisions, diaries; that is the user repo)
- Runtime state, logs, PID files, session data
- Project-specific config for glitch-pi

## Hygiene rules

- Branch discipline: no core edits on `main` (R16). Use feature branches.
- Skills added here must be referenced by routing or an agent profile, otherwise `repo-hygiene.mjs` flags them as orphaned.
- Run `node ../scripts/repo-hygiene.mjs` (report-only) before releases.

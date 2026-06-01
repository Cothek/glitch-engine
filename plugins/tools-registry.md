# Tools Registry — Glitch CodeAct Tools
*Index of executable tools created via CodeAct-lite with lifecycle tracking*

**Created by**: Forge Lv.3+ or manual agent creation
**Location**: `plugins/tools/<name>.mjs`
**Created via**: `node plugins/dev-loop/tdd-test.mjs --code "..." --tests '[...]' --save-on-pass plugins/tools/<name>.mjs`
**Run via**: `node plugins/dev-loop/run-tool.mjs <name> --input '{}'`

## Trust Levels

Every tool has a lifecycle state tracked in `plugins/tools/tool-stats.json`:

| Level | Requirement | Privileges |
|-------|-------------|------------|
| `sandboxed` | File exists in plugins/tools/ | Can be used, warnings shown |
| `tested` | Passed TDD tests via `--save-on-pass` | Default for new TDD-created tools |
| `validated` | 3+ successful runtime executions | Recommended for general use |
| `live` | 10+ successful runtime executions | Full trust, used as standard tool |
| `degraded` | 3+ consecutive failures | Flagged for review |

**Promotion is automatic** — `run-tool.mjs` tracks success count and promotes tools that prove reliable.

## Registered Tools

| Tool | Trust Level | Runs | Description | Created |
|------|-------------|------|-------------|---------|
| _(none yet — first tool created automatically during dev loop)_ | | | | |

## How Tools Are Created (TDD Workflow)

Tools go through a formal lifecycle:

1. **Identify** — Agent notices a missing capability or recurring pattern
2. **Test first** — Write test cases as `{ input, expected }` pairs
3. **Implement** — Write `function handler(input) { ... }`
4. **Validate** — `tdd-test.mjs --tests '[...]' --code "..."` → all pass
5. **Save** — `--save-on-pass plugins/tools/<name>.mjs` → auto-assigned `tested` trust level
6. **Use** — `run-tool.mjs <name> --input '{}'` → tracks success/failure
7. **Promote** — After 3+ successful runs → `validated`. After 10+ → `live`.

## Invocation

```bash
# Run a tool (with lifecycle tracking)
node plugins/dev-loop/run-tool.mjs double-array --input '[1, 2, 3]'

# List all tools and their trust levels
node plugins/dev-loop/run-tool.mjs --list

# Quick test (without lifecycle tracking)
node plugins/dev-loop/execute-tool.mjs --file plugins/tools/double-array.mjs --input '[1, 2, 3]'
```

## Tool Format

Each tool is a `.mjs` file exporting a `handler` function:

```js
function handler(input) {
  // input: what the agent passes
  // return: what the agent needs
  return result;
}
```

Simple, stateless, single-purpose. If a tool needs imports, use standard ESM `import` syntax.

## Rollback

Since tools are version-controlled in git, rollback is handled by standard git revert:
```bash
git revert HEAD -- plugins/tools/<name>.mjs
```

Stats file (`tool-stats.json`) is also git-tracked for recovery.

# Git Operations — Reusable Patterns

## Submodule Workflow
When making changes to glitch-memorycore (a submodule of glitch-ai):
1. Make changes in the submodule directory (`glitch-memorycore/`)
2. Commit and push from inside the submodule
3. Then commit and push the parent repo to update the submodule pointer

```powershell
# Inside submodule
cd glitch-memorycore
git add -A && git commit -m "..." && git push

# Inside parent repo
cd ..
git add -A && git commit -m "chore: update submodule pointer" && git push
```

## Memory-Only Fast Lane
Memory-only changes (diary, decisions, reminders, preferences, dashboard, current-session, patterns, post-mortems) auto-commit without approval:
```powershell
git add -A && git commit -m "memory: brief description" && git push
```

## Checking Behind Count
Detect if local is behind remote:
```powershell
git fetch origin main
git rev-list --count HEAD..origin/main  # Returns 0 if up-to-date
```

## Credential Setup
Git uses PAT stored in Windows Credential Manager. Remote URLs embed the username:
```
https://cothek@github.com/Cothek/repo-name.git
```
This ensures GCM auto-selects without prompting.

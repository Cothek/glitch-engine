# Process Isolation — Long-Running Processes in opencode

## The Problem
Sub-agents run inside the opencode.exe process tree. Killing opencode by name kills the agent.
Commands like `npm run dev` or `node server.js` that don't return quickly will hang the sub-agent.

## Windows Solution
Use `Start-Process` with a **new PowerShell window** — completely detached process tree:

```powershell
$proc = Start-Process -FilePath "powershell.exe" -WindowStyle Normal -PassThru `
  -ArgumentList "-NoProfile", "-Command", "& 'path\to\binary.exe' args..."
Write-Output "PID=$($proc.Id)"
```

## Unix Solution
```sh
nohup binary args... > server.log 2>&1 &
echo "PID=$!"
```

## PID Tracking
Maintain a PID table in current-session.md Working Memory:
```
🔌 PROCESS TABLE:
  PID=1234 → description (port XXXX)
```

## Cleanup Rules
- NEVER kill by process name (`Stop-Process -Name "xxx"`) — kills sibling processes including the agent
- Only kill by captured PID (`Stop-Process -Id $PID`)
- Cleanup only your own PIDs from the table

## Do NOT
- Run long-running commands directly in a sub-agent — they will hang until timeout
- Use `Get-Process -Name | Stop-Process` — this kills opencode.exe

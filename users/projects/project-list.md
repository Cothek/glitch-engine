---
type: ProjectList
title: Project List
description: Active and completed projects tracked by Glitch.
tags: [projects, tracking]
timestamp: 2026-09-08T00:00:00Z
---

# Project List

## glitch-trader

_Status: Active (Paper-Trading)_
_Category: TRADING_SYSTEM_

### 2026-09-07 — FIRST PAPER-TRADING RUN STARTED

- Engine running (polling loop active)
- Web app running (port 3000, responding 200)
- Engine API (port 4120) required separate uvicorn process — `main.py` is a pure polling loop, does not start FastAPI
- API server started separately to enable engine communication

**Next Steps**: Verify API connectivity, confirm polling data flow, monitor paper-trade execution cycle.

### 2026-09-07: glitch-trader FIRST PAPER-TRADING RUN IS LIVE. All 3 components running: engine (polling loop, 5-min interval), web app (http://localhost:3000), engine API (http://localhost:4120, 200 OK). Active LLM provider: opencode-go/deepseek-v4-flash.

Note: the engine API needed a separate uvicorn process (main.py is a pure polling loop, doesn't start FastAPI). Module path is engine.api.__main__:app. Fixed a module path issue during startup.

Note: engine only trades during market hours (9:30-15:55 ET); polls every 5 min; dashboard may show initial data until first cycle completes.

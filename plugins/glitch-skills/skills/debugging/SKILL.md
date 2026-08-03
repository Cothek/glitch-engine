---
name: debugging
description: "MUST use when user says 'debug', 'something broke', 'it crashed',
              'bug', 'error at', 'not working', 'doesn't work', 'trace this',
              'find the issue', 'why is', or when a command/process fails unexpectedly,
              error output is shown, or investigation of runtime behavior is needed."
---

# Debugging — Root Cause Analysis Workflow

## Activation
When this skill activates, output:
"Running debug protocol..."

## Protocol

### Phase 1: Reproduce & Scope
1. If error output exists → capture full error message + traceback
2. If bug report → clarify: what happened vs what should have happened
3. If flaky/intermittent → identify reproduction steps and frequency
4. Scope the problem: compilation error? runtime crash? wrong output? perf?

### Phase 2: Gather Evidence
1. Check recent git log (`git log --oneline -10`) — did something change?
2. Check git diff to see what's uncommitted
3. **Run GitNexus `context` on the failing symbol** — returns callers, callees, process participation in one call. Replaces manual sequential grep+read for dependency tracing.
4. Read the file + surrounding context (imports, dependents from GitNexus result)
5. Check dependency versions if applicable

### Phase 3: Hypothesis-Driven Search
1. Form a hypothesis matching the symptom
2. Trace the data/call flow from entry to failure point
3. Check null/edge cases, type mismatches, off-by-one, race conditions
4. Add targeted debug output OR use language-appropriate debugging tools
5. Verify hypothesis with minimal reproduction

### Phase 4: Fix & Verify
1. Apply minimal fix (change only what's necessary)
2. Verify with existing tests
3. Create a regression test if none exists for this path
4. Run full test suite / build before marking done

### Phase 5: Close the Loop
1. Log root cause and fix in session context
2. If the pattern looks repeatable → suggest post-mortem
3. If you had to learn something new → save to library

## Escalation
```
Phase 2 stalls → Investigate (observation skill)
Phase 3 fails → Full audit (observation skill)
Repeat bug in same area → Create post-mortem
```

## Diagnosing-Bugs Doctrine (from diagnosing-bugs)

### Phase 1 — Build a feedback loop (THIS IS THE SKILL)
The tight pass/fail signal for the bug is the skill. Everything else is mechanical. If you have a loop that goes red on THIS bug, you will find the cause. If you don't, no amount of staring at code will save you. Spend disproportionate effort here. Refuse to give up.

Ways to construct one, in roughly this order:
1. Failing test at whatever seam reaches the bug (unit, integration, e2e)
2. Curl/HTTP script against a running dev server
3. CLI invocation with a fixture input, diffing stdout against a known-good snapshot
4. Headless browser script (Playwright/Puppeteer) — drives UI, asserts on DOM/console/network
5. Replay a captured trace (network request/payload/event log) through the code path in isolation
6. Throwaway harness — minimal subset of the system exercising the bug path with one function call
7. Property/fuzz loop — 1000 random inputs, look for the failure mode
8. Bisection harness — automate "boot at state X, check, repeat" so you can `git bisect run`
9. Differential loop — same input through old vs new version, diff outputs
10. HITL bash script — last resort, drive a human with a structured loop

Tighten the loop: faster? sharper signal (assert the specific symptom, not "didn't crash")? more deterministic (pin time, seed RNG, isolate fs, freeze network)? A 30-second flaky loop is barely better than none; a 2-second deterministic one is a debugging superpower.

For non-deterministic bugs: goal is a higher reproduction rate, not a clean repro. Loop the trigger 100x, parallelise, add stress, inject sleeps. A 50%-flake bug is debuggable; 1% is not.

### Completion criterion — a tight red-capable loop
Phase 1 is done when you can name ONE command (script path, test invocation, curl) you have ALREADY run at least once, that is:
- Red-capable — drives the actual bug path and asserts the user's exact symptom (can go red on this bug, green once fixed)
- Deterministic — same verdict every run
- Fast — seconds, not minutes
- Agent-runnable — unattended

If you catch yourself reading code to build a theory before this command exists, STOP — jumping straight to a hypothesis is the exact failure this prevents. No red-capable command, no Phase 2.

### Phase 2 — Reproduce + minimise
Run the loop, watch it go red. Confirm it produces the failure the USER described (not a different nearby failure). Capture the exact symptom. Then minimise: shrink the repro to the smallest scenario that still goes red, cutting inputs/callers/config/data one at a time, re-running after each cut. Done when every remaining element is load-bearing.

### Phase 3 — Hypothesise
Generate 3-5 RANKED hypotheses before testing any. Each must be falsifiable: "If <X> is the cause, then <changing Y> will make the bug disappear / <changing Z> will make it worse." If you can't state the prediction, it's a vibe — discard it. Show the ranked list to the user before testing (they often re-rank instantly). Don't block on it if the user is AFK.

### Phase 4 — Instrument
Each probe maps to a specific prediction. Change ONE variable at a time. Tool preference: debugger/REPL first (one breakpoint beats ten logs), then targeted logs at boundaries that distinguish hypotheses. Never "log everything and grep". Tag every debug log with a unique prefix like `[DEBUG-a4f2]` so cleanup is a single grep. For perf regressions: establish a baseline measurement first, then bisect — measure first, fix second.

### Phase 5 — Fix + regression test
Write the regression test BEFORE the fix — but only if there's a correct seam (one that exercises the real bug pattern at the call site). If no correct seam exists, that itself is the finding — flag it. If a seam exists: turn the minimised repro into a failing test, watch it fail, apply the fix, watch it pass, re-run the Phase 1 loop against the original scenario.

### Phase 6 — Cleanup + post-mortem
Required before done: original repro no longer reproduces; regression test passes (or absence of seam documented); all `[DEBUG-...]` instrumentation removed; throwaway prototypes deleted; the correct hypothesis stated in the commit/PR message. Then ask: what would have prevented this bug? If the answer involves architectural change, hand off to the refactoring/observation skill.

## Mandatory Rules
1. Always reproduce or confirm the error before fixing
2. Change one variable at a time — never shotgun fix
3. Never delete code you don't understand
4. Always run tests after fixing
5. If stuck >10 min, escalate or ask for fresh eyes

## Level History
- **Lv.1** — Base: Structured 5-phase root cause analysis protocol.
- **Lv.2** — Diagnosing-bugs doctrine: feedback-loop-first, ranked falsifiable hypotheses, tagged debug logs, regression-test-before-fix (Matt Pocock, 2026-08-01)

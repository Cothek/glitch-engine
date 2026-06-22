---
type: SkillIndex
title: Skills Registry
description: Index of all registered skills (23) and agent definitions (18) with trigger descriptions and model assignments.
tags: [glitch, skills, registry]
timestamp: 2026-06-17T00:00:00Z
---

# Skills Registry — Glitch Skill Index
*Auto-loaded at session start. Progressive disclosure: index only, full content loaded on demand.*

## Registered Skills (27)

| Skill | Description | Trigger |
|-------|-------------|---------|
| auto-commit | Structured git commits with TECHNICAL CHANGES + SESSION CONTEXT | "commit", "save changes", "git commit", Vigilant mode |
| forge | Self-improvement — pattern detection, skill creation, leveling | "create skill", "forge this", 3+ pattern repeats |
| image-prompt | Midjourney/NijiJourney composition-aware prompt generation | "create a prompt", "midjourney prompt", "image prompt" |
| imagegen-frontend-web | Image-generation for premium, conversion-aware website design reference images. Generates one horizontal image per section. | "generate website images", "create landing page images", "design website comps", "website design references" |
| imagegen-frontend-mobile | Image-generation for premium mobile app and mobile-site design reference images. Platform-aware for iOS, Android, mobile-web. | "generate mobile screens", "create app screen images", "design mobile comps", "mobile UI reference" |
| brandkit | Image-generation for premium brand identity comps: logo lockups, color studies, material swatches, brand pattern tiles, and visual identity boards. | "generate brand assets", "create brand identity comps", "design brand kit", "brand design references" |
| interactive-story | Visual Novel RPG with world generation and persistence | "new adventure", "save adventure", "load adventure" |
| mulahazah | Hook-based behavioral observation, persistent rules | Auto-triggers via hook on every tool call |
| observation | 4-tier code awareness: Survey, Investigate, Refine, Audit | "survey project", "investigate", "refine code", "audit" |
| post-mortem | Failure analysis — structured root cause documentation with action items | Loaded when 🔧 tag or failure detected, "post-mortem" |
| save-memory | Auto-saves memory on task changes, new learnings, decisions, errors — commits immediately | Auto-triggers on task changes, decisions, errors, session end; also "save", "update memory" |
| session-briefing | Delivers context brief at session start | Auto-triggers at session start, "brief" |
| song-creation | Visual-to-musical storytelling, Suno-ready lyrics | "create album", "create song", "muse this" |
| work-plan | Plan capture → checkbox execution → per-task commits | "copy plan", "append plan", "resume plan" |
| debugging | Root cause analysis — reproduce, evidence, fix, verify | "debug", "bug", "it crashed", "not working", error output |
| dev-loop | Autonomous dev loop: Write → Review → Build → Interact → Verify → Iterate | "build this feature", "run the dev loop", "autonomous mode", implementing features end-to-end |
| code-review | Systematic 5-axis review (correctness/security/readability/architecture/performance) — severity-rated, dead code hunting, dependency discipline, "demand evidence" rule, honesty directives. Lv.4 quality gate. | "review this", "code review", "check this PR", "review changes", "quality gate" |
| testing | Test writing & TDD — framework detection, pattern matching, edge case coverage, flaky test detection, coverage analysis, agent-specific testing. Lv.2 quality gate companion. | "write tests", "add tests", "test coverage", "run tests", "test this", "missing tests", "TDD" |
| refactoring | Behavior-preserving code improvement, atomic changes | "refactor", "clean this up", "simplify this", "improve this code" |
| brainstorming | Idea generation & concept development via structured phases | "brainstorm", "think of ideas", "what if", "ideate", "bounce ideas" |
| ui-craft | Design taste skill — anti-slop rules, motion system, layout/typography/color patterns, Design System Map, Brief Inference, image strategy, 22 domain references. Augmented with taste-skill patterns (Jun 2026). | "make this not look AI-generated", "design taste", "craft", motion/animation work |
| ui-design | Senior UI/visual design — award-winning perspective, creative execution — now upgraded with anti-slop + motion system + UI Craft integration | "make this look better", "improve the UI", "design this", UI/frontend changes |
| gitnexus | Code knowledge graph — query, context, impact, detect_changes, rename, cypher MCP tools | "impact", "blast radius", "what depends on", "trace this call", "graph query", "architecture map", before significant code changes |
| self-review | Meta-agent for system self-review — scans opencode.json, skills registry, prompt rules, and performance patterns for improvement opportunities at compaction checkpoints | Auto-fires at R3 step 7, "self review", "system health", "audit config", "check agents", "meta review" |
| curriculum | Self-play curriculum — generates leveled challenges (tool creation, tool chains, system improvement, memory consolidation, meta), dispatches attempts, scores results, progresses autonomously | Auto-fires at R3 step 8, "curriculum", "self-play", "challenge me", "run curriculum", "what can I learn" |
| security-testing | Structured penetration testing methodology — OWASP Top 10, API security, auth testing, dependency scanning, secret detection, severity-rated reporting | "security audit", "pentest", "penetration test", "scan for vulnerabilities", "security testing", "hack my app", "find security issues", OWASP |

## Auto-Created Skills
*Skills created autonomously by Forge Lv.2+ will appear here automatically.*

| Skill | Description | Trigger |
|-------|-------------|---------|
| senior-developer | Full-stack implementation patterns — server actions, Next.js conventions, data layer design, state handling. Auto-created by Lv.2 Forge (2026-05-23) | Building features, implementing workflows, server actions, full-stack work |

## Agent Files (Auto-Discovered by OpenCode)
*Agent definitions in `.opencode/agents/` — loaded automatically, no manual invocation needed.*

### Free Agents (Try First)
| Agent | File | Model | Purpose |
|-------|------|-------|---------|
| @general | `opencode.json` | deepseek-v4-flash-free | General-purpose — bash, file ops, simple edits, standard code |
| @explore | `opencode.json` | deepseek-v4-flash-free | Codebase research — read-only, find files, search code |
| @plan | `opencode.json` | deepseek-v4-flash-free | Architecture & planning — reason without executing code |
| @build | `opencode.json` | deepseek-v4-flash-free | Code scaffolding — generates code from prompts |
| @coder | `.opencode/agents/coder.md` | nemotron-3-ultra-free | Senior full-stack engineer — production code, typed, all states handled |
| @ui-designer | `.opencode/agents/ui-designer.md` | nemotron-3-ultra-free | Senior UI designer — shadcn/ui, Radix, Tailwind v4, anti-slop rules |
| @reviewer | `.opencode/agents/reviewer.md` | nemotron-3-ultra-free | Independent code quality gate — read-only, severity-rated reports |
| @testing | `.opencode/agents/testing.md` | nemotron-3-ultra-free | Test writer — TDD, framework detection, edge case coverage |
| @vision | `.opencode/agents/vision.md` | nemotron-3-ultra-free | Image/visual content analysis — uses read tool, bash: deny |
| @pentester | `.opencode/agents/pentester.md` | nemotron-3-ultra-free | Application security tester — OWASP Top 10, API testing, tool-based scanning, structured reporting |
| @glitch-omni | `.opencode/agents/glitch-omni.md` | deepseek-v4-flash | Direct-execution variant — no delegation, does everything itself. Alternative primary for Normal mode. |

### Paid Agents (Fallback When Free Fails)
| Agent | File | Model | Purpose |
|-------|------|-------|---------|
| @general-paid | `.opencode/agents/general-paid.md` | deepseek-v4-flash | General-purpose paid fallback — when @general exhausts free quota |
| @explore-paid | `.opencode/agents/explore-paid.md` | deepseek-v4-flash | Codebase research paid fallback — when @explore fails |
| @plan-paid | `.opencode/agents/plan-paid.md` | deepseek-v4-flash | Planning paid fallback — when @plan exhausts free quota |
| @build-paid | `.opencode/agents/build-paid.md` | deepseek-v4-flash | Scaffolding paid fallback — when @build exhausts free quota |
| @coder-paid | `.opencode/agents/coder-paid.md` | kimi-k2.6 | Senior full-stack engineer paid fallback |
| @ui-designer-paid | `.opencode/agents/ui-designer-paid.md` | kimi-k2.6 | Senior UI designer paid fallback |
| @reviewer-paid | `.opencode/agents/reviewer-paid.md` | qwen3.6-plus | Independent code quality gate paid fallback |
| @testing-paid | `.opencode/agents/testing-paid.md` | kimi-k2.6 | Test writer paid fallback |
| @vision-paid | `.opencode/agents/vision-paid.md` | qwen3.6-plus | Image/visual content analysis paid fallback |
| @pentester-paid | `.opencode/agents/pentester-paid.md` | kimi-k2.6 | Application security tester paid fallback — OWASP Top 10, API testing, tool-based scanning |

### Free→Paid Fallback Model Chains
| Free Model | Paid Fallback | Agents Using |
|------------|--------------|-------------|
| deepseek-v4-flash-free | deepseek-v4-flash (same family) | @general, @explore, @plan, @build |
| nemotron-3-ultra-free | qwen3.6-plus (same family) | @reviewer, @vision |
| nemotron-3-ultra-free | kimi-k2.6 (cross-family) | @coder, @ui-designer, @testing, @pentester |

---

**Total: 27 skills + 21 agent definitions** — Last updated: 2026-06-21

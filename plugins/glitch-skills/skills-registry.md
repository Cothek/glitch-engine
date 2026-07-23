---
type: SkillIndex
title: Skills Registry
description: Index of all registered skills (28) and agent definitions (18) with trigger descriptions and model assignments.
tags: [glitch, skills, registry]
timestamp: 2026-07-17T00:00:00Z
---

# Skills Registry — Glitch Skill Index
*Auto-loaded at session start. Progressive disclosure: index only, full content loaded on demand.*

## Registered Skills (32)

| Skill | Description | Trigger |
|-------|-------------|---------|
| auto-commit | Structured git commits with TECHNICAL CHANGES + SESSION CONTEXT | "commit", "save changes", "git commit", Vigilant mode |
| forge | Self-improvement — pattern detection, skill creation, leveling, accumulated feedback → level-up | "create skill", "forge this", 3+ pattern repeats, accumulated user feedback |
| image-generation | Image generation via local ComfyUI — prompt pipeline, SDXL, MCP-based tool calls | "generate an image", "make a picture", "draw something", "create artwork", ComfyUI setup |
| image-prompt | Midjourney/NijiJourney composition-aware prompt generation | "create a prompt", "midjourney prompt", "image prompt" |
| imagegen-frontend-web | Image-generation for premium, conversion-aware website design reference images. Generates one horizontal image per section. | "generate website images", "create landing page images", "design website comps", "website design references" |
| imagegen-frontend-mobile | Image-generation for premium mobile app and mobile-site design reference images. Platform-aware for iOS, Android, mobile-web. | "generate mobile screens", "create app screen images", "design mobile comps", "mobile UI reference" |
| brandkit | Image-generation for premium brand identity comps: logo lockups, color studies, material swatches, brand pattern tiles, and visual identity boards. | "generate brand assets", "create brand identity comps", "design brand kit", "brand design references" |
| interactive-story | Visual Novel RPG with world generation and persistence | "new adventure", "save adventure", "load adventure" |
| mulahazah | Hook-based behavioral observation, persistent rules | Auto-triggers via hook on every tool call |
| observation | 4-tier code awareness: Survey, Investigate, Refine, Audit | "survey project", "investigate", "refine code", "audit" |
| post-mortem | Failure analysis — structured root cause documentation with action items | Loaded when 🔧 tag or failure detected, "post-mortem" |
| save-memory | Memory writing methodology for @memory agent — file map, append formats, category taxonomy, format rules. @memory loads this on activation. | Loaded by @memory agent on dispatch only. Not used by Glitch directly. |
| session-briefing | Delivers context brief at session start | Auto-triggers at session start, "brief" |
| song-creation | Visual-to-musical storytelling, Suno-ready lyrics | "create album", "create song", "muse this" |
| work-plan | Plan capture → checkbox execution → per-task commits | "copy plan", "append plan", "resume plan" |
| debugging | Root cause analysis — reproduce, evidence, fix, verify | "debug", "bug", "it crashed", "not working", error output |
| dev-loop | Autonomous dev loop: Write → Select (PPT) → Review → Security Scan → Build → Interact → Verify → Iterate — with multi-candidate generation, continuous scoring, and VOC progress monitoring | "build this feature", "run the dev loop", "autonomous mode", implementing features end-to-end |
| code-review | Systematic 5-axis review (correctness/security/readability/architecture/performance) — severity-rated, dead code hunting, dependency discipline, "demand evidence" rule, honesty directives. Lv.5 quality gate — now with continuous scoring, repeated evaluation (K=3), criteria ensemble, multi-candidate PPT comparison, and VOC progress tracking. | "review this", "code review", "check this PR", "review changes", "quality gate" |
| testing | Test writing & TDD — framework detection, pattern matching, edge case coverage, flaky test detection, coverage analysis, agent-specific testing. Lv.2 quality gate companion. | "write tests", "add tests", "test coverage", "run tests", "test this", "missing tests", "TDD" |
| refactoring | Behavior-preserving code improvement, atomic changes | "refactor", "clean this up", "simplify this", "improve this code" |
| brainstorming | Idea generation and concept development — 4-phase protocol with mode branching (feature, problem, design, strategy), active sparring, and bridge to the goal skill | "brainstorm", "think of ideas", "what if", "ideate", "bounce ideas", "spitball", "explore options", "generate ideas" |
| breakthrough | Overcome hard problems — reframe, check assumptions, research, simplify, lateral thinking. Use when debugging isn't working and you need a new angle. | "breakthrough", "stuck", "hard problem", "can't figure out", "going in circles", "not working and I don't know why", "need a fresh perspective" |
| ui-craft | Design taste skill — anti-slop rules, motion system, layout/typography/color patterns, Design System Map, Brief Inference, image strategy, 22 domain references. Augmented with taste-skill patterns (Jun 2026). | "make this not look AI-generated", "design taste", "craft", motion/animation work |
| ui-design | Senior UI/visual design — award-winning perspective, creative execution — now upgraded with anti-slop + motion system + UI Craft integration | "make this look better", "improve the UI", "design this", UI/frontend changes |
| verifier | General-purpose verification framework — continuous scoring, repeated evaluation, criteria decomposition, Probabilistic Pivot Tournament (PPT) for multi-candidate selection, ring pass for positional bias cancellation, VOC progress monitoring. Based on arXiv:2607.05391v1. | "verify", "verifier", "continuous scoring", "compare candidates", "pick best", "PPT", "ring pass", "select best solution", "multi-candidate", "progress monitoring", "VOC", verification-focused evaluation tasks |
| gitnexus | Code knowledge graph — query, context, impact, detect_changes, rename, cypher MCP tools | "impact", "blast radius", "what depends on", "trace this call", "graph query", "architecture map", before significant code changes |
| self-review | Meta-agent for system self-review — scans opencode.json, skills registry, prompt rules, and performance patterns for improvement opportunities at compaction checkpoints | Auto-fires at R3 step 7, "self review", "system health", "audit config", "check agents", "meta review" |
| curriculum | Self-play curriculum — generates leveled challenges (tool creation, tool chains, system improvement, memory consolidation, meta), dispatches attempts, scores results, progresses autonomously | Auto-fires at R3 step 8, "curriculum", "self-play", "challenge me", "run curriculum", "what can I learn" |
| security-testing | Structured penetration testing methodology -- OWASP Top 10, API security, auth testing, dependency scanning, secret detection, severity-rated reporting | "security audit", "pentest", "penetration test", "scan for vulnerabilities", "security testing", "hack my app", "find security issues", OWASP |
| goal | Project goal definition — asks clarifying questions to figure out what you're actually building before writing any code. Works for UI screens, features, CLI tools, and backend APIs. | "define the goal", "what should I build", ambiguous brief, starting something new, project definition, UI/frontend/workflow/CLI/API work |
| writing | Remove AI telltales from written communication - no em dashes, no filler words (delve/leverage/utilize), direct openings, contractions, active voice, sentence variety, specificity over abstraction | "write", "draft", "document", "remove AI telltales", "no AI tells", "writing style", any text generation |

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
| @coder | `.opencode/agents/coder.md` | nemotron-3-ultra-free | Senior full-stack engineer — production code, typed, all states handled |
| @ui-designer | `.opencode/agents/ui-designer.md` | nemotron-3-ultra-free | Senior UI designer — shadcn/ui, Radix, Tailwind v4, anti-slop rules |
| @reviewer | `.opencode/agents/reviewer.md` | nemotron-3-ultra-free | Independent code quality gate — read-only, severity-rated reports |
| @testing | `.opencode/agents/testing.md` | nemotron-3-ultra-free | Test writer — TDD, framework detection, edge case coverage |
| @vision | `.opencode/agents/vision.md` | mimo-v2.5-free | Image/visual content analysis — uses read tool, bash: deny |
| @vision-alt | `.opencode/agents/vision-alt.md` | qwen/qwen3.5-122b-a10b | Fallback image analysis — different model, same protocol. Used when @vision fails with model/API errors |
| @pentester | `.opencode/agents/pentester.md` | nemotron-3-ultra-free | Application security tester — OWASP Top 10, API testing, tool-based scanning, structured reporting |
| @glitch-omni | `.opencode/agents/glitch-omni.md` | deepseek-v4-flash | Direct-execution variant — no delegation, does everything itself. Alternative primary for Normal mode. |
| @memory | `.opencode/agents/memory.md` | opencode/deepseek-v4-flash-free | Memory writer — reads and appends to `user/*.md` files only. Loads save-memory skill. |

### Paid Agents (Fallback When Free Fails)
| Agent | File | Model | Purpose |
|-------|------|-------|---------|
| @general-paid | `.opencode/agents/general-paid.md` | deepseek-v4-flash | General-purpose paid fallback — when @general exhausts free quota |
| @explore-paid | `.opencode/agents/explore-paid.md` | deepseek-v4-flash | Codebase research paid fallback — when @explore fails |
| @plan-paid | `.opencode/agents/plan-paid.md` | deepseek-v4-flash | Planning paid fallback — when @plan exhausts free quota |
| @coder-paid | `.opencode/agents/coder-paid.md` | qwen3.7-plus | Senior full-stack engineer paid fallback |
| @ui-designer-paid | `.opencode/agents/ui-designer-paid.md` | qwen3.7-plus | Senior UI designer paid fallback |
| @reviewer-paid | `.opencode/agents/reviewer-paid.md` | qwen3.6-plus | Independent code quality gate paid fallback |
| @testing-paid | `.opencode/agents/testing-paid.md` | qwen3.7-plus | Test writer paid fallback |
| @vision-paid | `.opencode/agents/vision-paid.md` | qwen3.6-plus | Image/visual content analysis paid fallback |
| @memory-paid | `.opencode/agents/memory-paid.md` | deepseek-v4-flash | Memory writer paid fallback — when @memory quota is exhausted |
| @pentester-paid | `.opencode/agents/pentester-paid.md` | qwen3.7-plus | Application security tester paid fallback — OWASP Top 10, API testing, tool-based scanning |

### Free→Paid Fallback Model Chains
| Free Model | Paid Fallback | Agents Using |
|------------|--------------|-------------|
| deepseek-v4-flash-free | deepseek-v4-flash (same family) | @general, @explore, @plan |
| nemotron-3-ultra-free | qwen3.6-plus (same family) | @reviewer |
| mimo-v2.5-free | qwen3.6-plus (cross-family) | @vision |
| nemotron-3-ultra-free | qwen3.7-plus (cross-family) | @coder, @ui-designer, @testing, @pentester |
| deepseek-v4-flash-free (free) | deepseek-v4-flash (same family) | @memory |

---

**Total: 29 skills + 22 agent definitions** — Last updated: 2026-07-17

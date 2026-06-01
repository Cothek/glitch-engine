# Glitch Skills Plugin

Auto-triggered skills for Glitch, the user's AI companion.

## Active Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| save-memory | "save", "save progress" | Persists conversation insights to memory files |
| auto-commit | "commit", "save changes" | Structured git commits with session context |
| work-plan | "copy plan", "resume plan" | Plan execution with checkbox tracking |
| session-briefing | Session start, "brief" | Auto-delivers context brief at session start |
| observation | "survey", "investigate", "refine", "audit" | 4-tier code awareness system |
| image-prompt | "create a prompt", "midjourney prompt" | Composition-aware image prompt generation |
| song-creation | "create album", "create song" | Visual-to-musical storytelling |
| interactive-story | "new adventure", "load adventure" | Visual Novel RPG |
| post-mortem | Failure signals, "post-mortem" | Failure learning log |
| forge | "create skill", "forge this", "self improve" | Self-improvement through pattern detection |
| mulahazah | Tool calls, "/continuous-improvement" | Behavioral learning through observation |

## Adding New Skills
1. Create a new folder: `skills/[skill-name]/`
2. Create `SKILL.md` inside with YAML frontmatter + protocol
3. Done — skill auto-activates based on description field

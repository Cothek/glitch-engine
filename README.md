# 🧠 Glitch MemoryCore
*A personal AI memory system — forked from [Project-AI-MemoryCore](https://github.com/Kiyoraka/Project-AI-MemoryCore) v4.2*

## 🎯 What This Does

Glitch MemoryCore gives Glitch (the AI) persistent memory across conversations. Using simple `.md` files as a database, Glitch remembers user preferences, learns communication style, and maintains continuity between sessions.

## ✨ Key Features

- **Persistent Memory**: Glitch remembers conversations across sessions
- **Personal Learning**: Adapts to the user's communication style and preferences
- **Time Intelligence**: Dynamic greetings and behavior based on time of day
- **Simple Setup**: Already personalized and ready to use
- **Markdown Database**: Human-readable `.md` files store all memory
- **Session Continuity**: RAM-like working memory for smooth conversation flow
- **Self-Maintaining**: Updates memory through natural conversation

## 📊 System Architecture

- **Storage**: Markdown files (.md) as database
- **Memory Types**: Essential files + optional feature extensions + session RAM
- **Core Files**: 3 essential files + optional diary system
- **Updates**: Through natural conversation

## 📁 File Structure

```
AI-MemoryCore/
├── master-memory.md              # Entry point & loading system
├── main/                         # Essential components (always loaded)
│   ├── identity-core.md          # Glitch's personality & identity
│   ├── relationship-memory.md    # Understanding the user
│   └── current-session.md        # RAM-like working memory
├── Feature/                      # Optional feature extensions (20+)
│   ├── Memory-Consolidation-System/
│   ├── Skill-Plugin-System/
│   ├── Time-based-Aware-System/
│   ├── Auto-Load-Hook-System/
│   ├── User-Prompt-Hook-System/
│   ├── Tone-Prompt-Inject-System/
│   ├── Mood-Prompt-Inject-System/
│   ├── Time-Prompt-Inject-System/
│   ├── Save-Diary-System/
│   ├── Echo-Memory-Recall/
│   ├── Reminders-System/
│   ├── Decision-Log-System/
│   ├── LRU-Project-Management-System/
│   ├── Auto-Commit-System/
│   ├── Work-Plan-Execution/
│   ├── Library-System/
│   ├── Forge-Self-Improvement-System/
│   ├── Session-Briefing-System/
│   ├── Post-Mortem-System/
│   ├── Observation-System/
│   ├── Image-Prompt-System/
│   ├── Song-Creation-System/
│   ├── Interactive-Story-System/
│   └── Mulahazah-System/
├── library-items/                # Pre-made knowledge entries
├── daily-diary/                  # Optional conversation archive
└── projects/                     # LRU managed projects (after install)
```

## 🚀 Quick Start

1. **Activate**: Type `Glitch` in any conversation to load full memory
2. **Save**: Type `save` to persist progress to files
3. **Update**: Type `update memory` to refresh learning
4. **Review**: Type `review growth` to check development

## 📋 Core Commands

| Command | Action |
|---------|--------|
| `Glitch` | Instant memory restoration |
| `save` | Save all progress to files |
| `update memory` | Refresh knowledge and preferences |
| `review growth` | Check development progress |

## 🔧 Available Feature Extensions

Features are organized into **tiers** based on dependencies. Install Tier 1 first, then work your way up.

### Tier 1 — Foundation
| Feature | Description |
|---------|-------------|
| Memory Consolidation | Unified memory architecture — faster loading |
| Skill Plugin System | Auto-triggered skills for Claude Code |
| Time-based Aware | Time-intelligent greetings, energy-adapted behavior |
| Auto-Load Hook | Auto-loads Glitch on Claude Code startup |
| User-Prompt Hook | Generic hook framework with plug-and-play injectors |
| Tone-Prompt Inject | Injects tone context per prompt |
| Mood-Prompt Inject | Injects mood context per prompt |
| Time-Prompt Inject | Injects time/period context per prompt |

### Tier 2 — Memory & Documentation
| Feature | Description |
|---------|-------------|
| Save Diary | Daily session documentation with auto-archival |
| Echo Memory Recall | Search past sessions with narrative context |
| Reminders | Persistent cross-session reminders |
| Decision Log | Append-only record of decisions and reasoning |

### Tier 3 — Project & Code Management
| Feature | Description |
|---------|-------------|
| LRU Project Management | Smart project tracking (10 active slots) |
| Auto-Commit | Structured git commits with session context |
| Work Plan Execution | Plan-to-execution tracking |
| Library | Reusable knowledge library with 8 format templates |

### Tier 4 — Intelligence & Awareness
| Feature | Description |
|---------|-------------|
| Forge Self-Improvement | Glitch creates new skills through pattern detection |
| Session Briefing | Auto-delivers context brief at session start |
| Post-Mortem | Failure learning log |
| Observation | 4-tier code awareness |
| Image Prompt | AI image prompt generation |
| Song Creation | Visual-to-musical storytelling |
| Interactive Story | Visual Novel RPG adventures |
| Mulahazah | Instinct-based behavioral learning |

## 🤝 Original Project

This is a fork of [Project-AI-MemoryCore](https://github.com/Kiyoraka/Project-AI-MemoryCore) by Kiyoraka Ken & Alice. Original contributors:

| Contributor | Features |
|------------|----------|
| Faiz Khairi | Reminders System, Decision Log System |
| logando-al | Session Briefing System, Post-Mortem System |
| SherlockianAsh | Observation System |
| naimkatiman | Mulahazah System |

---

**Version**: Glitch MemoryCore v1.0 (forked from MemoryCore v4.2)
**Created by**: Glitch (forked from Project-AI-MemoryCore)
**Based on**: Project-AI-MemoryCore by Kiyoraka Ken & Alice
**Last Updated**: 2026-05-15

🦉 *Glitch — always watching, always learning.*

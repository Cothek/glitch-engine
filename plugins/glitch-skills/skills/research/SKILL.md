---
name: research
description: "MUST use when user says 'research', 'investigate', 'look up',
             'find the facts', 'primary sources', or when delegating reading
             legwork to a background agent."
---

# Research

## Activation
When this skill activates, output:
"Activating research..."

## Purpose
Investigate a question against high-trust PRIMARY sources and capture the
findings as a cited Markdown file in the repo. Use when the user wants a
topic researched, docs/API facts gathered, or reading legwork delegated to
a background agent.

## Protocol
1. Spin up a BACKGROUND agent to do the research so you keep working while
   it reads.
2. Its job: investigate the question against primary sources — official
   docs, source code, specs, first-party APIs — NOT secondary write-ups.
   Follow every claim back to the source that owns it.
3. Write the findings to a single Markdown file, citing each claim's source.
4. Save it where the repo already keeps such notes; match the existing
   convention; if none, put it somewhere sensible and say where.

## Glitch Integration
This formalizes our @explore agent usage. Dispatch @explore (or
@explore-paid if free fails) as the background agent. The cited findings
file feeds into the wayfinder skill (research tickets) and the goal skill
(facts before decisions). Research feeds thinking, it doesn't replace it.

## Mandatory Rules
1. Primary sources only — official docs, source code, specs, first-party
   APIs. No secondary write-ups, no blog summaries, no Stack Overflow.
2. Cite every claim — every factual statement gets a source link.
3. Background agent — dispatch and keep working; do not block on the read.
4. Save as a single cited Markdown file — one file per research question,
   citations inline.
5. **Completion criterion**: findings file exists at the chosen path with at
   least one citation per claim.

## Level History
- **Lv.1** — Base: background-agent research against primary sources with
  citation.

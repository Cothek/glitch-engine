# Memory Search Integration Guide

## Overview
An FTS5 full-text search index over all Glitch MemoryCore markdown files.
Run by the delegator or called by sub-agents to find relevant memory content.

## Usage

### Index (delegator only — rebuild the search index)
```bash
node index-memory.mjs
```
Safe to run anytime — incremental, only updates changed chunks.
Auto-runs at compaction checkpoint. Re-run if memory files are heavily modified.

**Flags:**
- `--embeddings` — also compute and store MiniLM-L6-v2 embeddings (required for hybrid search)

```bash
node index-memory.mjs --embeddings
```

### Search (sub-agents)
```bash
node search-memory.mjs --query "natural language query" --limit 10
```
Returns ranked results with BM25 scoring. Higher score = better match.

**Flags:**
- `-q` / `--query` — search terms (FTS5 syntax: AND, OR, phrases, prefixes)
- `-l` / `--limit` — max results (default 10)
- `--json` — machine-readable JSON output
- `--hybrid` — hybrid BM25 + embedding search (Reciprocal Rank Fusion). Requires embeddings to be indexed first.
- `--embeddings-only` — pure semantic search (no keyword matching). Requires `--hybrid`.

## FTS5 Query Syntax
- Simple words: `memory`
- Phrase: `"memory update protocol"`
- AND/OR: `delegator AND agent`, `free OR paid`
- NOT: `decision NOT deprecated`
- Prefix: `model*`
- NEAR: `NEAR(agent, task, 3)`

## Integration Pattern for Sub-agents
When you need to find relevant memory context, run:
```bash
node <path-to>/plugins/embed-search/search-memory.mjs -q "your query" --json
```
Parse the JSON results. Top results are most relevant. Use the `file_path` and `section_heading` to read the full context from disk.

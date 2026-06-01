# Memory Improvement Guidance
_Category: WORKFLOW_RULES_

*Adapted from magic-context dreamer prompts (MIT). Use when promoting scratchpad entries to proper memory files.*

## Core Principle

Write in **present-tense operational language**: "X does Y" not "we changed X to do Y."

## Good vs Bad Examples

### ✅ Good
```
Category: CONFIG_DEFAULTS
execute_threshold_percentage defaults to 65 and accepts a scalar or
{ default, <model-key> } map for per-model overrides.
```

### ❌ Bad
```
We changed the execute threshold to be configurable in the session where
we were working on per-model thresholds. It was originally hardcoded at
65% but now accepts either a number or a map.
```

## Rewrite Rules

When moving content from scratchpad → proper memory file:

1. **Present tense, operational voice**
   - ✗ "X was changed to do Y"
   - ✓ "X does Y"

2. **Keep file paths, function names, config keys verbatim**
   - Don't paraphrase technical identifiers
   - Backtick-wrapped: `execute_threshold_percentage`

3. **Drop commit hashes** — unless the hash itself is the point of the memory

4. **Drop temporal context**
   - ✗ "in this session", "after the refactor", "we decided to"
   - ✓ Just state the current state

5. **Drop redundant qualifiers**
   - ✗ "It's important to note that..."
   - ✗ "We determined that..."
   - Just state the fact

6. **One fact per entry**
   - If a scratchpad bullet has two distinct facts, split into separate entries
   - ✗ "PM-009 is fixed by skipping free model AND the zombie session bug was reported"
   - ✓ Two entries: (1) "PM-009: free model AI_APICallError — workaround: skip @general, use @general-paid." (2) "Bug #29952 — task tool zombie session, assigned @jlongster."

7. **Include rationale, not just state**
   - ✗ "Server uses port 3000"
   - ✓ "Server uses port 3000 to avoid conflict with the dev server on 4200"

## Quick Checklist

- [ ] Present tense?
- [ ] File paths/code keys verbatim?
- [ ] No temporal language?
- [ ] One fact per entry?
- [ ] Includes WHY, not just WHAT?
- [ ] Terse but complete?

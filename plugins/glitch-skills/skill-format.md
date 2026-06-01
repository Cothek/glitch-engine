# Skill Format Template
*Permanent reference for creating new skills.*

## Structure

```markdown
---
name: skill-name
description: "MUST use when user says 'trigger phrase', 'another trigger',
             or when [specific context condition]."
---

# Skill Name

## Activation
When this skill activates, output:
"Activating skill-name..."

## Protocol
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Mandatory Rules
1. [Rule 1]
2. [Rule 2]

## Level History
- **Lv.1** — Base: [Description of base capability]
```

## Trigger Description Tips
- Use `"MUST use when..."` for strong activation
- List specific trigger phrases the user might say
- Include contextual conditions (not just phrases)
- Be specific enough to avoid false activations
- Be broad enough to catch all relevant situations

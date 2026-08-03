---
name: refactoring
description: "MUST use when user says 'refactor', 'clean this up', 'simplify this',
              'restructure', 'extract this', 'rename', 'reduce duplication',
              'improve this code', 'make this better', 'modernize this',
              'break this apart', 'untangle this',
              or when improving existing code without changing external behavior."
---

# Refactoring — Behavior-Preserving Code Improvement

## Activation
When this skill activates, output:
"Running refactoring protocol..."

## Protocol

### Phase 1: Understand Before Touching
1. Read the code fully — understand what it does, not just what it says
2. Read the test file if it exists
3. **Run GitNexus `context` on the symbol(s) being refactored** — see all callers, callees, and process participation. Use `impact` to evaluate blast radius before making changes.
4. Identify the external contract (public API, function signatures, I/O)
5. Run existing tests to establish baseline

### Phase 2: Identify Refactoring Targets
Scan for:
- **Duplication** — same logic in 2+ places → extract
- **Long functions** — >20 lines → extract helper(s)
- **Deep nesting** — >3 levels → early return, guard clauses, extract
- **God objects/classes** — too many responsibilities → split
- **Poor naming** — doesn't reveal intent → rename (keep one level of indirection)
- **Dead code** — unused params/vars/functions → remove
- **Mutation overload** — state changes scattered → centralize
- **Mixed abstraction levels** — low-level details mixed with high-level logic → extract

### Phase 3: Apply Changes (One Step at a Time)
For each refactoring:
1. Identify one atomic change
2. Apply it
3. Run tests / build
4. If it passes → commit ("refactor: ...")
5. Move to next atomic change
6. If tests fail → revert the single change and retry

### Phase 4: Verify
1. Full test suite pass
2. No behavior change (identical outputs for identical inputs)
3. Document any API changes that affect callers

## Safe Refactoring Patterns (Precedence Order)
```
Rename → Extract → Inline → Move → Split → Restructure
(Safer → Riskier — prefer lower-risk patterns)
```

## Anti-Patterns (Never Do)
- Mixing refactoring with feature work in the same change
- Rewriting from scratch when incremental works
- "I'll fix the tests later"
- Refactoring without tests (unless trivial rename)

## Mandatory Rules
1. Never change external behavior — preserve the contract
2. One atomic change between test runs
3. Run tests after every single change
4. If no tests exist, add characterization tests first
5. Commit after each successful atomic change
6. Revert on red — never pile on fixes

## Deep-Module Design (from codebase-design)

### The vocabulary (use these terms exactly)
- **Module** — anything with an interface and an implementation. Scale-agnostic: a function, class, package, or tier-spanning slice. Avoid: unit, component, service.
- **Interface** — everything a caller must know to use the module correctly: type signature, invariants, ordering constraints, error modes, required config, performance characteristics. Avoid: API, signature (too narrow).
- **Implementation** — what's inside a module. Distinct from Adapter (a thing that satisfies an interface at a seam).
- **Depth** — leverage at the interface: amount of behavior a caller can exercise per unit of interface they must learn. Deep = lots of behavior behind a small interface. Shallow = interface nearly as complex as the implementation (avoid).
- **Seam** — a place where you can alter behavior without editing in that place; where a module's interface lives.
- **Leverage** — what callers get from depth: more capability per unit of interface learned. One implementation pays back across N call sites and M tests.
- **Locality** — what maintainers get from depth: change, bugs, knowledge, verification concentrate in one place. Fix once, fixed everywhere.

### The deletion test
Imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep. Apply this to anything you suspect is shallow.

### Principles
- Depth is a property of the interface, not the implementation. A deep module can be internally composed of small, mockable, swappable parts — they just aren't part of the interface.
- The interface is the test surface. Callers and tests cross the same seam. If you want to test past the interface, the module is probably the wrong shape.
- One adapter means a hypothetical seam. Two adapters means a real one. Don't introduce a seam unless something actually varies across it.
- Accept dependencies, don't create them (inject the gateway, don't `new` it inside).
- Return results, don't produce side effects.
- Small surface area. Fewer methods = fewer tests needed.

### Deepening opportunities
When refactoring, look for: modules that are shallow (interface nearly as complex as implementation), pure functions extracted just for testability where the real bugs hide in how they're called (no locality), tightly-coupled modules leaking across seams, untested or hard-to-test modules. Deepening a module pays off by making future changes to it easier.

## Level History
- **Lv.1** — Base: 4-phase refactoring protocol with atomic change discipline.
- **Lv.2** — Deep-module design: depth/seam/leverage/locality vocabulary, deletion test, testability principles (Matt Pocock, 2026-08-01).

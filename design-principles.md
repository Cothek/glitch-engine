# Global UI Design Principles

Universal design rules that apply to ALL projects, regardless of project-specific design systems.

## 1. Responsive & Accessible Foundation

- All interfaces must be responsive across mobile (<768px), tablet (768-1024px), and desktop (>1024px) breakpoints.
- Use semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<header>`, `<footer>`) for accessibility.
- All interactive elements must be keyboard-navigable and have visible focus states.
- Color contrast ratios must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).
- Never disable default browser focus outlines — if custom focus styles are used, they must be equally visible.

## 2. Layout & Spacing

- Use a consistent 4px spacing grid (Tailwind's default scale: `p-1` = 4px, `p-2` = 8px, `p-4` = 16px, etc.).
- Avoid luxury padding, soft oversized margins, or marketing-style white space in functional UIs.
- Cards, panels, and containers must use consistent corner radii — pick one (`rounded-sm` or `rounded-md` max) and use it everywhere.
- Maintain consistent horizontal padding between card headers and their body content.

## 3. Typography

- Use `font-mono` for: computational values, code blocks, database keys, action buttons, tracking values, telemetry data.
- Use `font-sans` for: explanatory text, labels, descriptions, form inputs, metadata.
- Establish a clear font-weight hierarchy: `font-bold` for values/numbers, `font-medium` for labels, normal weight for body text.

## 4. Color & Visual Style

- Flat colors only — no `bg-gradient-*`, no `drop-shadow` on UI elements, no skeuomorphic textures.
- Simple `shadow-sm` or `shadow-md` if depth is necessary (e.g., modals, elevated cards).
- Use accent colors sparingly — reserved for data visualization, primary actions, and status indicators.
- Backgrounds should be dark (slate/zinc) with light text by default for developer-oriented UIs.

## 5. Interactive Elements

- All interactive state transitions (hover, focus, active) must complete within 150-200ms.
- Use consistent easing: `cubic-bezier(0.16, 1, 0.3, 1)` for UI transitions.
- Button press effects: `active:scale-[0.97]` or `active:scale-[0.98]` for tactile feedback.
- Disabled states: `opacity-50 pointer-events-none`.
- Never use `animate-pulse` on error or warning states — it causes cognitive fatigue during extended debugging.

## 6. Cards & Containers

- Cards should have a header with a dark background (`bg-[#020617]`), a body with a slightly lighter panel background.
- Card borders must be subtle (`1px`), using a muted border color.
- Card headers and bodies must maintain consistent horizontal padding.
- Never use fixed heights on cards that contain dynamic content — let them expand naturally.

## 7. Forms & Inputs

- Input fields must have consistent height (`h-10` or `py-2`), border styles, and focus indicators.
- Labels must be positioned above inputs, not as placeholders.
- Error states must be visually distinct (red border + error text below the field).
- Form validation feedback must be real-time where possible.

## 8. Per-Project Design Systems

Before making any UI changes in a project:

1. Check for a `design/` folder or `design-system.*` file at the project root.
2. If found, read those files — they contain project-specific tokens, component patterns, and constraints.
3. If no project design system exists, fall back to these global principles.
4. Project-specific rules ALWAYS override these global principles where they conflict.

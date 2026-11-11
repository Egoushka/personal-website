---
name: hrabovskyi.online
description: Portfolio, blog and product site for small tools that make AI agents checkable. Dark first, one amber colour, data shown as data.
colors:
  background: "#0a0b0d"         # dark is the default theme
  foreground: "#f2f4f6"         # 18.2:1 on background
  card: "#111215"
  muted: "#16181b"
  muted-foreground: "#98a0a8"   # 7.4:1, metadata, descriptions, labels
  accent: "#1c1e22"             # hover and current surfaces, not a colour
  border: "#23262b"             # decorative: cards, rules, table lines
  input: "#5b616a"              # 3.1:1, the edge of every control
  brand: "#f2a03d"              # 9.2:1, links, the current item, focus
  brand-foreground: "#0a0b0d"
  success: "#4ade80"
  warning: "#f2a03d"
  info: "#60a5fa"
  caution: "#f87171"
  light-background: "#ffffff"
  light-foreground: "#0d0e10"   # 19.1:1
  light-muted-foreground: "#5b6169"  # 6.2:1
  light-border: "#e4e6ea"
  light-brand: "#a85d08"        # 5.1:1
typography:
  body:    { fontFamily: "Inter", fontSize: "16px", fontWeight: 400, lineHeight: "24px" }
  label:   { fontFamily: "Inter", fontSize: "12px", fontWeight: 500, lineHeight: "16px" }
  ui:      { fontFamily: "Inter", fontSize: "14px", fontWeight: 500, lineHeight: "20px" }
  figure:  { fontFamily: "ui-monospace", fontSize: "28px", fontWeight: 600, lineHeight: "32px" }
  heading: { fontFamily: "Bricolage Grotesque", fontSize: "30px", fontWeight: 600, lineHeight: "36px" }
  display: { fontFamily: "Bricolage Grotesque", fontSize: "60px", fontWeight: 600, lineHeight: 1.05 }
rounded: { sm: "6px", md: "8px", lg: "10px", xl: "14px", pill: "999px" }
spacing: { 1: "4px", 2: "8px", 3: "12px", 4: "16px", 6: "24px", 8: "32px" }
components:
  button-primary: { backgroundColor: "{colors.foreground}", textColor: "{colors.background}", rounded: "{rounded.md}", height: "36px" }
  link: { textColor: "{colors.brand}" }
  badge: { height: "24px", padding: "4px 10px", rounded: "{rounded.md}", typography: "{typography.label}" }
---

# hrabovskyi.online design

This file is the design contract for agents. `.claude/rules/styling.md` gives the implementation rules, and `app/globals.css` holds the tokens. When they disagree with this file, the CSS and the rules file win, and this file must be updated in the same PR. The `ui-design` skill reads this file before any change to how the site looks.

## Overview

A personal product site. It shows working tools and their live numbers rather than a CV. It is dark first, calm and precise, and uses one colour. Its loudest elements are real figures and product names.

## Colors

- The frontmatter holds the dark set, which is the default. The `light-*` keys are the light set, with the same roles. A stored `data-theme` wins; otherwise the OS decides.
- `brand` (amber) is the only colour. It is used for links, the current item and focus. Status colours always sit beside a word or a shape, never alone.
- `accent` is a hover and current surface, not a hue. `border` is decorative; `input` is the edge of every control at 3:1 or more.
- The contrast ratios next to each token in `globals.css` are floors.

## Typography

- Inter (`font-sans`) is used for all text. Bricolage Grotesque (`font-display`) is for page titles only, and never below about 26 px. Monospace (the system face) is for figures, paths, hashes and code only.
- There are three weight jobs: body at 400, UI and labels at 500, and emphasis (figures, product names, headings) at 600 or heavier.
- Labels are in sentence case, not ALL CAPS with tracking.

## Layout

- Widths come from `lib/layout.ts`: pages are `max-w-7xl` and docs are `max-w-[90rem]`, with one gutter. Prose stops at `max-w-2xl` to `3xl`.
- Spacing is on a 4 px grid: tight inside a group, generous between groups. Panels in a row size to their content, so no panel ends in a blank strip.

## Elevation & Depth

Flat surfaces separated by tone (`background`, `card`, `muted`) and hairline `border`. Shadows, where used, are soft and from one vocabulary.

## Shapes

`--radius` is 10 px, with `sm`, `md` and `xl` derived from it. Pills are fully rounded only when the controls around them are not.

## Components

- shadcn/ui on Tailwind v4 (ADR 0007), copied into `components/ui/`. Interface icons come from Lucide paths in `components/ui/icons.tsx`.
- Focus is a visible 2 px `ring`. Targets are 24 × 24 px or larger. `prefers-reduced-motion` stops every animation.
- Badges and status chips are 24 px or taller, with 4 px vertical padding.

## Do's and Don'ts

- Do make the number a page exists to show the loudest thing in its tile: bold, tabular and mono, with its label smaller and muted.
- Do underline a linked figure on hover and focus only, or with a faint dotted line.
- Don't put coloured `border-left` rails on list items, cards or callouts. Separate items with space and type.
- Don't set a secondary call to action as a heavy, saturated accent block.
- Don't use template chrome: an eyebrow above every heading, a "→" on every link, or " · " joining meta on every line.
- Don't stagger a rise entrance on every panel. Use one authored moment per page.

## Kept on purpose

Decisions Yehor approved. A refinement may not weaken any of them (`ui-design` critique gate, row R1). Add an entry, dated, when he approves something specific, and never delete one: record a reversal as a new entry.

- 2026-11-11 (PR #87, mission-control round 2, 56f4e24): liked overall. It is the reference identity for refinements of that direction.
- 2026-11-11 (PR #87, 56f4e24): KPI figures are bold mono (600) and the loudest thing in their tile. The ccaaeb4 tuning pass made them thin and underlined, and he rejected it ("bold was nice").
- 2026-11-11 (PR #87, 56f4e24): status pills have height: 24 px or more with vertical padding. The 22 px version was cramped.
- 2026-11-11 (PR #87, ccaaeb4): list items carry no coloured left rails ("ugly").
- 2026-11-11 (PR #87, 56f4e24): the heavy solid green "How partnering works" button was too much. Secondary calls to action stay out of a full accent fill.
- 2026-11-11 (PR #87, round 1): Ledger and Editorial were rejected as generic, static and CV-first. Window was the most adequate.
- 2026-11-11 (PR #87, blocks): the movable-blocks canvas belongs in a hidden "flying website" easter egg, not the main UI.
- ADR 0007: shadcn/ui on Tailwind v4, with tokens in `app/globals.css`.
- `.claude/rules/styling.md`: dark is the default; amber `brand` is the one colour; Inter for text and Bricolage Grotesque for titles only.

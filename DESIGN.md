---
name: hrabovskyi.online
description: Portfolio, blog and product site for small tools that make AI agents checkable. Dark first, mission-control: bold mono figures, key-cap buttons, one green-teal accent, data shown as data.
colors:
  background: "oklch(0.165 0.008 255)"   # n1, dark is the default theme
  card: "oklch(0.19 0.008 255)"          # n2
  muted: "oklch(0.225 0.009 255)"        # n3
  accent: "oklch(0.255 0.01 255)"        # n4, hover and current surfaces, not a colour
  border: "oklch(0.32 0.012 255)"        # n6, decorative: cards, rules, table lines
  input: "oklch(0.58 0.012 255)"         # n9, the edge of every control, over 3:1
  muted-foreground: "oklch(0.79 0.008 255)"  # n11, 10.0:1, metadata and labels
  foreground: "oklch(0.955 0.004 255)"   # n12, 16.9:1
  brand: "oklch(0.74 0.14 165)"          # a9, links, the current item, focus
  brand-foreground: "oklch(0.165 0.008 255)"  # 8.0:1 on brand
  brand-text: "oklch(0.82 0.11 165)"     # a11, 10.7:1
  success: "oklch(0.78 0.15 152)"
  warning: "oklch(0.82 0.13 80)"
  info: "oklch(0.76 0.12 250)"
  caution: "oklch(0.74 0.15 25)"
  light-background: "oklch(0.992 0.002 255)"
  light-foreground: "oklch(0.21 0.012 255)"   # 17.3:1
  light-muted-foreground: "oklch(0.47 0.012 255)"  # 6.7:1
  light-border: "oklch(0.88 0.008 255)"
  light-brand: "oklch(0.52 0.16 165)"    # a9, white on it 4.8:1
  light-brand-text: "oklch(0.47 0.15 165)"  # 5.8:1
typography:
  body:    { fontFamily: "Inter", fontSize: "16px", fontWeight: 400, lineHeight: "24px" }
  label:   { fontFamily: "Inter", fontSize: "12px", fontWeight: 500, lineHeight: "16px" }
  ui:      { fontFamily: "Inter", fontSize: "14px", fontWeight: 500, lineHeight: "20px" }
  figure:  { fontFamily: "ui-monospace", fontSize: "32px", fontWeight: 650, lineHeight: "36px" }
  heading: { fontFamily: "Bricolage Grotesque", fontSize: "30px", fontWeight: 600, lineHeight: "36px" }
  display: { fontFamily: "Bricolage Grotesque", fontSize: "60px", fontWeight: 600, lineHeight: 1.05 }
rounded: { sm: "6px", md: "8px", lg: "10px", xl: "14px", pill: "999px" }
spacing: { 1: "4px", 2: "8px", 3: "12px", 4: "16px", 6: "24px", 8: "32px" }
components:
  key-primary: { backgroundColor: "{colors.brand}", textColor: "{colors.brand-foreground}", rounded: "{rounded.md}", height: "36px" }
  key: { backgroundColor: "{colors.card}", textColor: "{colors.foreground}", rounded: "{rounded.md}", height: "36px" }
  link: { textColor: "{colors.brand-text}" }
  chip: { height: "26px", padding: "4px 10px", rounded: "{rounded.md}", typography: "{typography.label}" }
---

# hrabovskyi.online design

This file is the design contract for agents. `.claude/rules/styling.md` gives the implementation rules, and `app/globals.css` holds the tokens. When they disagree with this file, the CSS and the rules file win, and this file must be updated in the same PR. The `ui-design` skill reads this file before any change to how the site looks.

## Overview

A personal product site. It shows working tools and their live numbers rather than a CV. It is dark first, calm and precise, and uses one accent colour (green-teal, hue 165). Its loudest elements are real figures and product names.

## Colors

- The frontmatter holds the dark set, which is the default. The `light-*` keys are the light set, with the same roles. A stored `data-theme` wins; otherwise the OS decides.
- Tokens are OKLCH: twelve neutral steps (n1 page to n12 ink) and an accent ramp (a3 to a11). Light and dark use the same names, in the Radix 12-step roles. `brand` (green-teal) is the only colour. It is used for links, the current item and focus. Status colours always sit beside a word or a shape, never alone.
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
- Status chips are about 26 px tall with semibold labels. The primary button is a solid key-cap with a lit top edge and a 1 px press; a secondary call to action is a neutral key.
- Panels (`.pn`) have a head, a body and a foot, and size to their content. Live figures read `status.json` and fall back to a dated static value, so the page is complete without JS.

## Do's and Don'ts

- Do mark anything not measured live as "simulated" or give it its read date.
- Do make the number a page exists to show the loudest thing in its tile: bold (about 650), tabular and mono at about 32 px, with its label smaller and muted.
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
- 2026-11-11 (PR #87 port, this PR): the mission-control direction is live on the site. KPI figures are bold (about 650), mono, about 32 px, with no always-on underline. Status chips are about 26 px with semibold labels. The primary button is a solid key-cap with a lit edge and a 1 px press, and "How partnering works" is a neutral key.
- 2026-11-11 (this PR): no green left rails on list items; one Lucide icon per partner channel; no 01-04 numbers; no blank strips in panels; no eyebrows, no staggered rise, minimal arrows and " · " joins.
- 2026-11-11 (this PR): Inter for text, Bricolage Grotesque for titles only (never below about 26 px), system mono for figures, paths and hashes. Spacing base is 4 px. Pulses stop under prefers-reduced-motion. No horizontal scroll at 375. The site shows no location.
- 2026-11-11 (this PR): the Blocks canvas is not the main UI and the prototype's "Tune this page" dialog is not ported.
- ADR 0007: shadcn/ui on Tailwind v4, with tokens in `app/globals.css`.
- `.claude/rules/styling.md`: dark is the default; the green-teal `brand` is the one colour; Inter for text and Bricolage Grotesque for titles only.

## Changelog

- 2026-11-11: this PR supersedes the content of #89 (merged, its branch deleted). The hex tokens and the amber `brand` there are replaced by the OKLCH mission-control tokens above. The 2026-11-11 Kept-on-purpose entries from #89 are unchanged, and the "24 px or more" chip height is now about 26 px.

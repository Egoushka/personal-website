# Design brief — hrabovskyi.online

For anyone picking this site up cold. Everything below is a real constraint of the
running system, not a preference. Where something is negotiable it says so.

Rewritten 2026-08-01, after the third design. The two before it are worth knowing
about because their remains are in the git history and in the ADRs: **Marginalia**
(a rail layout, `45b726b`) and **the Balance** (a double-entry trial balance as the
home page, `6285ffd`). Both were coherent. Both were abandoned within weeks. The
diagnosis, which took a full grilling session to reach, is in
[ADR 0002](adr/0002-keep-the-computed-figures-drop-the-ledger.md): the structure was
never the problem, **the voice was**. Both redesigns changed the structure and kept
the voice, so both failed the same way.

---

## What the site is

The personal site of a backend-first .NET developer in Kyiv. Its job, in order:

1. Let a stranger work out who this is and reach the writing in about eight seconds.
2. Get the posts read to the end.
3. Stay out of the way.

It is **not** a shop, a SaaS landing page, a product hub, or a portfolio for visual
work. There is nothing to convert. The only calls to action are *read the post*,
*read the CV*, *email me*.

**It is also never going to become an application.** No auth, no accounts, no
billing, no database. Products get their own subdomains and their own runtimes; this
site links to them. That is a decision, not an omission — see
[ADR 0001](adr/0001-the-site-is-never-the-app.md).

The glossary for everything below — Post, Project, Topic, Reading, Product — is
[CONTEXT.md](../CONTEXT.md). Use those words.

---

## Voice

**Warm, direct, first person. Curious rather than authoritative.** Admits failure
early and plainly — the flagship post is about a deploy pipeline that was silently
dead for 51 days, and that is the register itself, not an exception to it.

Reference: Julia Evans, with some of Amos's edge. Not Dan Luu's flatness, and **not**
the austere accounting voice this site carried until 2026-08.

The owner's own calibration line, which every other sentence on the site should sound
like it came from the same person as:

> Hey — I'm Yehor. A .NET dev who just likes building interesting things. Some of it
> worked, some of it didn't. Both are here.

Rules:

- Contractions. "I'm", "didn't", "it's".
- Short sentences are fine. Fragments are fine. A shrug at the end of a paragraph is fine.
- "I broke it" comes before "here's how I fixed it".
- No emoji, no stacked exclamation marks, no "let's build something amazing".
- No swearing. The audience includes hiring managers at financial institutions.
- **English is the author's second language.** Copy gets a grammar pass; it does not
  get a personality pass. Fix the tense, keep the shrug.
- Every figure stays computed (below). Warmth is the job of the words, precision is
  the job of the numbers, and neither one covers for the other. This is what keeps an
  informal voice from reading as an unserious one.

---

## The one rule that outlived two redesigns

**No figure on this site is typed by hand if the build can count it.**

[lib/readings.ts](../lib/readings.ts) counts post totals, word counts, lines of code
and CSS, and project totals from `content/posts`, `lib/site.ts` and the source tree, on every
build. Any page printing a figure imports it from there rather than restating it, so a
page and a claim cannot drift.

Figures that genuinely cannot be counted from this repo — Chronicle's archive size,
Baseline's behaviour — live in `Project.readings` and **each one names its source**. A
number with no provenance is the exact failure this discipline exists to catch; it is
how an earlier version printed a 79-day silence that had never happened.

What went **with** the ledger and must not come back: claims, a balance column, an
`--open` colour for things that do not balance, and **expiry dates that strike a page
through in public**. There is deliberately no publishing cadence and no success
criterion for this site. A machine that renders its own staleness, owned by someone
who has declined to commit to a cadence, only ever advertises abandonment.

---

## Hard constraints — these break the build or the deploy

The site is **statically exported** (`output: "export"`) and served as flat files by
Caddy behind Traefik behind Cloudflare. There is no Node runtime in production.

| Constraint | Consequence for design |
|---|---|
| **No server.** No server actions, middleware, ISR, `revalidate`, rewrites, redirects or `headers` in `next.config`. | Redirects for moved routes live in [deploy/Caddyfile](../deploy/Caddyfile). There are seven of them and they are load-bearing. |
| **Client components are allowed, sparingly** — each one justified; the current list and reasons are in [CLAUDE.md](../CLAUDE.md). | Each must render something true before JS runs, or nothing. The filters server-render the full list and only ever remove or reorder rows; with scripting off their controls are hidden. No relative dates, no `Date.now()` or `Math.random()` in render. |
| **One global stylesheet**, [app/globals.css](../app/globals.css). No Tailwind, no CSS modules, no CSS-in-JS. The only inline style sets a custom property for data-driven geometry, read by a class. | Deliver CSS as plain class names and custom properties that drop into that file. |
| **Self-hosted fonts only**, via `next/font/google`. | You may change the typefaces, but they must load through `next/font`. Never add a `<link>` to fonts.googleapis.com — it puts a render-blocking cross-origin request on the critical path and loses the `size-adjust` fallback metric that keeps CLS at 0. |
| **`next/image` optimization is off.** | Plain `<img>`, or `next/image` with `unoptimized`. |
| **A strict CSP** — `script-src 'self'`, no `'unsafe-eval'`. | No CDN scripts, no external stylesheets, no remote fonts, no third-party embeds, no eval. The one embed, comments, is first-party at `/c/` ([ADR 0005](adr/0005-comments-are-a-bounded-exception.md)). |
| **`trailingSlash: true`.** | Every internal link carries the slash. A link to `/writing` costs a redirect. |
| **OG images via `next/og`.** | Satori supports **flexbox only — no CSS grid** — and caps the bundle at 500 KB. Its colours are hard-coded in [lib/og.tsx](../lib/og.tsx); keep them in step with the tokens by hand. |

---

## Accessibility invariants — regressions, already fixed once

Non-negotiable. Each was a real failure that got repaired.

- **`:focus-visible` must stay visible.** Never `outline: none` without a replacement of at least equal clarity.
- **Every page needs `<main id="main">`** — the skip link targets it.
- **Interactive targets stay ≥24×24 px** (WCAG 2.5.8).
- **Use `--rule-firm`, not `--rule`**, on anything whose border is the only boundary of a control. `--rule` is a decorative hairline; `--rule-firm` clears the WCAG 1.4.11 floor of 3:1. That distinction is the accessibility contract in this system.
- **Anything animated needs a `prefers-reduced-motion` escape.**
- **Both themes ship.** Any new colour needs a value in both.
- **Animating an SVG `<g>` uses the `translate` property, never `transform`.** A node's position is a `transform` *attribute*; animating that property replaces the position and collapses every node onto the origin.

Lighthouse on mobile was **Perf 99 · A11y 100 · Best Practices 100 · SEO 100** before
this rewrite. That is the bar; a redesign shipping at 92 accessibility is a regression.

---

## Design tokens

Seven colours, from `:root` in [app/globals.css](../app/globals.css). Cool near-black
by default, true white in light, one amber accent that means **link**, and one warning
colour that means only "this broke".

```css
/* dark — the default */
--paper:     #0A0B0D;
--ink:       #F2F4F6;   /* 18.2:1 on --paper */
--ink-2:     #98A0A8;   /*  7.4:1 */
--rule:      #1E2126;   /* decorative hairline only */
--rule-firm: #5B616A;   /*  3.1:1 — every control edge */
--accent:    #F2A03D;   /*  9.2:1 — links, and only links */
--warn:      #E2725B;   /*  5.6:1 — only ever "this broke" */

/* light */
--paper: #FFFFFF;  --ink: #0D0E10;   /* 19.1:1 */
--ink-2: #5B6169;  /* 6.2:1 */
--rule:  #E9EBEE;  --rule-firm: #8A9099;  /* 3.3:1 */
--accent: #A85D08; /* 5.1:1 */
--warn:  #A63B22;  /* 5.9:1 */
```

Those ratios are computed, not estimated. They are floors a replacement has to clear.
Raised surfaces (`--surface`, `--surface-2`) are mixed from `--ink` and `--paper`, so a
theme change carries them.

Two webfonts: **Inter** for everything read (body, h3, labels), **Bricolage Grotesque**
for display (h1, h2, list titles) and never below about 26px — smaller, it is a grotesk
beside a grotesk and a second download for nothing. Figures, rails and code use the
system monospace with no webfont; figures need `font-variant-numeric: tabular-nums`.
Type sizes come from one fluid modular scale (`--step-*`), used only through the
`--fs-*` aliases.

---

## Pages

`/` · `/writing/` · `/writing/[slug]/` · `/topics/[topic]/` · `/projects/` ·
`/projects/[slug]/` · `/about/` · `/cv/` · `/skills/` · `/journey/` · feeds · the 404

- **`/` (home)** — greeting and email, a proof row of things a stranger can check, the live instrument panel, then latest writing, running projects and topics.
- **`/writing/[slug]/`** — the page that matters most and has the most machinery: a contents list with the reader's position, numbered section permalinks, Copy on each code block, Shiki with separate light and dark themes, the project it is about, related post, lazy-loaded comments. Long-form reading is the primary job.
- **`/topics/[topic]/`** — gathers posts, projects **and jobs** for one topic. `Job.topics[]` is what makes this more than a tag page: it can show that a technology was used in paid work, not just in a side project. Generated only for topics something actually references; below two items it is `noindex`.
- **`/cv/`** — must print to exactly **one A4 page**. Verified by rendering, not by eye; see below.
- **`/about/`** — absorbed `/now/`, `/uses/` and `/links/`; ends in "Working with me" (`#contact`).
- **`/skills/`** is reached from About and the CV; **`/journey/`** from the footer. Neither is in the nav.

The primary nav is **Writing · Projects · About · CV**, with search (⌘K / Ctrl+K) and
the theme toggle beside it. The CV is in the nav because the home page advertises
contract work, and the CV is what a buyer forwards.

---

## Verifying the CV print sheet

`npm run smoke` prints `/cv/` to A4 in Chromium and fails unless it is one page. The
page count depends on the platform — the same build has printed one page on macOS and
two on Linux, which is what CI runs — so trust CI's result, or run the smoke in
`mcr.microsoft.com/playwright:v1.56.1-jammy`. To look at the sheet yourself, serve the
build (`npm run serve:prod`) and print to PDF:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --no-pdf-header-footer --print-to-pdf=/tmp/cv.pdf http://127.0.0.1:8080/cv/
```

If it grows past a single sheet again, cut in this order:

1. GlobalLogic, LetsData and Atlas drop to title + dates only (already the case, via `resumeCompact`).
2. No role prints more than three bullets; from the third role down, two. (Already the case.)
3. Skills to 9.5pt. (Spent.)
4. Body from 10.5pt to 10pt. **Not below 10pt.** (Spent.)
5. `@page` margin to 13mm. (Spent.)
6. Next lever, unspent: drop the Projects section to one project.

Do not shrink line-height below 1.38 and do not drop the masthead rule.

---

## Repo facts

- Next.js 16 App Router, React 19, TypeScript. `@/*` maps to the repo root.
- The gate is `npm run validate && npm run typecheck && npm test && npm run build && npm run check`;
  CI adds `caddy-test`, the Playwright + axe smoke and a lychee link check. No ESLint.
- **Push to `main` publishes the live site.** Work on a branch.
- Posts are `content/posts/*.md`; the filename is the slug. Frontmatter is `title, date, description, topics`, plus optional `spanDays`, `updated` and `correction`.
- **Topics are a closed vocabulary** in [lib/topics.ts](../lib/topics.ts). Adding one means editing that file.
- **A Caddyfile change ships with the deploy**: `rsync --inplace` (it is a single-file bind mount, so a normal rsync gives it a new inode the container never sees), after which Caddy's `--watch` loads it. There is no reload step.

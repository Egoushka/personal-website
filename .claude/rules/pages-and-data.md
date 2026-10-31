---
paths:
  - "app/**"
  - "components/**"
  - "lib/site.ts"
  - "lib/dates.ts"
  - "lib/metadata.ts"
  - "lib/readings.ts"
  - "lib/layout.ts"
  - "lib/icons.ts"
  - "scripts/readings.mjs"
  - "tests/**"
---

## Where things live

- **`<Shell current?>`** ([Shell.tsx](components/Shell.tsx)) wraps every page: header and
  footer outside the one `<main id="main">`; `width="wide"` for the docs. Nav:
  **Writing · Projects · Docs · About · CV**; Skills is linked from About and the CV.
  Every page's metadata comes from
  `pageMetadata()` ([lib/metadata.ts](lib/metadata.ts)); posts and projects pass
  `ownCard: true` to keep their own `opengraph-image`. Every `<Link>` but the primary nav
  and the home CTA sets `prefetch={false}`: prefetch fetched other routes' payloads on
  every scroll of a list.
- **Content is data** in [lib/site.ts](lib/site.ts): projects, jobs, skills, uses,
  `site.timezone`, optional `site.engagement`. Home lists running projects that are not
  side projects, plus side projects with `featured: true`. `Project.writeup` names a
  published post (validated).
- **Dates**: `Job.start`/`Job.end` are `"YYYY-MM"`, end inclusive, `null` = present.
  [lib/dates.ts](lib/dates.ts) is the only parser; add helpers there. Absolute dates
  only — no "N days ago".
- **Readings are computed** ([lib/readings.ts](lib/readings.ts), ADR 0002). A figure the
  build cannot count names its source (`Project.readings`), and its `ref` when that is a
  file in a public repository (`npm run readings`). Nothing renders its own staleness.
- **JSON-LD** ([JsonLd.tsx](components/JsonLd.tsx)): every graph carries the Person
  (`@id …/#person`); `knowsAbout` comes from `skills` in `lib/site.ts`. Feeds carry full
  HTML bodies with absolute links.
- `/status.json` is written on the box by cron (homelab-gitops);
  `tests/fixtures/status.json` is a complete document for local runs.

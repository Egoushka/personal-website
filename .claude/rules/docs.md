---
paths:
  - "content/docs/**"
  - "docs/project-docs.md"
  - "lib/doc*"
  - "lib/docs.ts"
  - "components/DocView.tsx"
  - "components/docs/**"
  - "scripts/docs.mjs"
  - "app/docs/**"
---

## Docs

A project's docs are written in **its own repository** and copied here at a commit
([ADR 0006](docs/adr/0006-docs-are-written-where-the-code-is.md)): `content/docs/<project>/`
holds the copy, `content/docs/sources.json` says from where. Never edit the copy — change
the docs in the tool's repo, then `npm run docs:pull`. What that directory must look like
is [docs/project-docs.md](docs/project-docs.md): flat, `.md` only; `title` (≤ 48),
`description` (≤ 160), a unique integer `order`, an optional `section` from the closed
list in `lib/doc-check.mjs` (Get started, Guides, Concepts, Reference, Project), and
`cyrillic` once a page has Cyrillic; `index.md` first, no `# heading`. The rules live in
`lib/doc-check.mjs`, shared by `npm run validate` and `npm run docs:check`.
The site renders them as a docs site (`components/DocView.tsx`): the sidebar groups
pages by section, Previous/Next follow it, and `/docs/` lists every project with docs.
GitHub's `> [!NOTE]` alert syntax renders as a callout (`lib/callouts.mjs`), a fence
takes a `title="…"`, and `##`/`###` fill "On this page". Relative links to other pages
stay on the site; links to other repo files go to GitHub at the pinned commit
(`lib/doc-links.mjs`). Tables go through `lib/tables.ts`: each sits in a focusable
scroll region, and one with a cell over 60 characters is a "text table" that stacks
into labelled cards below 700px. A "Status" column of works / partial / not yet gets a
shape (● ◐ ○) as well as the word.

---
paths:
  - "content/posts/**"
  - "content/methods/**"
  - "content/drafts/**"
  - "docs/writing/**"
  - "docs/adr/**"
  - "lib/posts.ts"
  - "lib/methods.ts"
  - "lib/topics.ts"
  - "lib/lang.ts"
  - "lib/markdown.mjs"
  - "lib/figure*"
  - "lib/post-kinds.mjs"
  - "lib/drafts.mjs"
  - "lib/evidence.mjs"
  - "lib/feed.ts"
  - "components/Figure*"
  - "components/figure-island.ts"
  - "components/Prose.tsx"
  - "scripts/validate-content.mjs"
  - "scripts/evidence.mjs"
  - "scripts/new-post.mjs"
  - "app/writing/**"
  - "app/methods/**"
  - "app/topics/**"
---

## Posts, figures, methods, topics

- **Posts**: `content/posts/<slug>.md`, frontmatter `title`, `date` (quoted `YYYY-MM-DD`,
  not future), `description`, `topics`, optional `spanDays`, `updated`, `correction`
  (needs `updated`; both for factual changes only), and `cyrillic` (`"uk"`/`"ru"`,
  required once the title or prose has Cyrillic; never guessed — `ок` is both).
  [lib/lang.ts](lib/lang.ts) marks those runs with `lang`, `Project.cyrillic` does it per
  term for project text, and `npm run check` fails on unmarked Cyrillic. [lib/markdown.mjs](lib/markdown.mjs)
  parses for both `lib/posts.ts` and the validator, so word counts and heading ids
  (`rehype-slug`, `github-slugger`) cannot disagree. Code blocks: Shiki ([lib/highlight.ts](lib/highlight.ts)).
- **Figures in posts** (ADR 0010): a ` ```chart ` or ` ```diagram ` fence with one JSON object, and
  `![alt](/img/<name>.png "caption")`. The contract and limits are in [lib/figures.mjs](lib/figures.mjs),
  read by the validator, `Prose` and the feeds alike (docs/writing/README.md has the fields).
  `Prose` is async and takes `figures` (the post page only; docs keep those fences as code):
  charts are laid out in [lib/figure-layout.ts](lib/figure-layout.ts), diagrams by elkjs at
  build time, and [components/Figure.tsx](components/Figure.tsx) draws both as SVG on the
  server. The feeds carry the caption and the data table or edge list, no SVG. A chart's
  numbers are claims for `npm run evidence`. Images must be sources in `assets/images/`
  (the CSP serves nothing else) and render through `Picture`, with their size reserved.
- **Methods**: `content/methods/<slug>.md` ([ADR 0008](docs/adr/0008-methods-are-earned-by-two-projects.md)),
  read by [lib/methods.ts](lib/methods.ts), at `/methods/` (linked from About as "How I work")
  and `/methods/<slug>/`. `projects` (two or more) is what a project page's "Methods it
  follows" reads, and `posts` what a post's line under it reads: never copy either into
  `lib/site.ts`. Not in the feeds; in the sitemap and search. The rules are in the validator.
- **Topics**: [lib/topics.ts](lib/topics.ts) is the one closed vocabulary for posts,
  projects and jobs; keep its `export const TOPICS = {` / `} as const satisfies` markers
  (the validator slices between them). A hub with < 2 items is `noindex` and out of the
  sitemap (`app/sitemap.ts` and `app/topics/[topic]/page.tsx` both hold the threshold);
  `/notes/` follows the same rule (`app/notes/page.tsx`).
## Publishing

Posts follow [docs/writing/README.md](docs/writing/README.md): a `kind` (finding,
incident, build, note — a short post, ADR 0009), a `project` when the post is about one (a project's write-up must
name it), a one-sentence thesis and an evidence pack before any prose. Drafts live in `content/drafts/` (not built, gitignored: the repo is public); moving one
to `content/posts/` is a deliberate, reviewed act. `/post` writes drafts only; `/review-post` critiques before
shipping. No CMS: an editor plus `/post`, or GitHub's web editor as a PR that adds the
post to `content/posts/` (ADR 0004). Comments are Remark42 at `/c/`, lazy-loaded, a bounded
exception to ADR 0001 (ADR 0005).

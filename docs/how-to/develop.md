# Develop

How to run, check and extend the site locally. The rules that break the build if ignored are in [CLAUDE.md](../../CLAUDE.md).

## Stack

- **Next.js 16** App Router, `output: 'export'` (static HTML, no Node runtime in prod)
- **TypeScript**, React 19
- **Markdown blog** — drop a `.md` in `content/posts/`, it appears automatically
- **shadcn/ui on Tailwind CSS v4** ([ADR 0007](../adr/0007-the-site-is-built-on-shadcn-ui-and-tailwind.md)):
  shadcn/ui's tokens over the site's palette — cool near-black dark theme by default,
  white light theme, one amber accent — with Inter and Bricolage Grotesque. See
  [docs/DESIGN-BRIEF.md](../DESIGN-BRIEF.md).
- **Project docs** written in each project's repository and copied here at a commit,
  rendered as a docs site under `/docs/` ([ADR 0006](../adr/0006-docs-are-written-where-the-code-is.md),
  [docs/project-docs.md](../project-docs.md)).
- **Pagefind** for search, indexed from `out/` after the build
- **Caddy** serving the files over plain HTTP. TLS is terminated upstream, at
  Cloudflare and the edge Traefik.

## Develop

```bash
npm ci
npm run dev          # http://localhost:3000 (search does not work here: see below)
```

Checks, in the order CI runs them:

```bash
npm run validate     # post frontmatter, topics, internal and #fragment links
npm run typecheck
npm test             # unit tests, tests/**/*.test.ts
npm run build        # -> ./out, then Pagefind indexes it
npm run check        # assertions over ./out
npm run caddy-test   # serves ./out through deploy/Caddyfile and tests redirects, headers, 404s
npm run smoke        # Playwright + axe in Chromium against http://localhost:8080
```

**Production-like local server.** `npm run serve:prod` runs `./out` behind the real
`deploy/Caddyfile` in the Caddy image (Docker required) at <http://127.0.0.1:8080>:
the real CSP, headers, redirects and 404s. Set `SITE_PORT` for another port and
`CADDY_IMAGE` to pin the image (default `caddy:2-alpine`). It replaces its container on
every call; run it again after every build, because the old container keeps the
deleted `out/` mounted. Search only works here, not under `npm run dev`: `/pagefind/`
is written into `out/` by the build.

`npm run smoke` needs `npx playwright install chromium` once. It takes `BASE_URL`,
`SMOKE_WIDTHS` (default `375`) and `STATUS_FIXTURE` (default
`tests/fixtures/status.json`, served with `generated` set to now).

## Project layout

```
app/                  routes (App Router)
  page.tsx            home
  writing/            index + writing/[slug]/ post pages
  notes/              the posts of kind `note` alone; each note's page is under writing/
  topics/[topic]/     one page per topic — posts, projects and jobs for it
  projects/           index + projects/[slug]/
  about/              about, what I'm doing now, and "Working with me" (#contact)
  cv/                 prints to one A4 page; no checked-in cv.pdf, so it cannot go stale
  skills/             what I work with, with the measured share of editor time
  journey/            the roles on a time axis, gaps included
  not-found.tsx       the 404 page
  feed.xml/ atom.xml/ feed.json/   RSS, Atom, JSON Feed: static route handlers (lib/feed.ts)
  opengraph-image.tsx cards for home, and under writing/[slug]/ and projects/[slug]/
  sitemap.ts robots.ts manifest.ts icon.svg apple-icon.png
components/           Shell, Nav, Footer, PageHead, Byline, PostList, PostFilter,
                      ProjectFilter, PostEnhancements, Comments, Search, ThemeToggle,
                      Panel, UsesStatus, Measured, SkillsBoard, Journey, PrintCv,
                      Icon, Picture, JsonLd
content/posts/*.md    published posts
content/drafts/       drafts. Not built, not tracked: the repo is public, drafts stay local.
lib/site.ts           site content: projects, jobs, skills, uses, links
lib/topics.ts         the one topic vocabulary — posts, projects and jobs reference it
lib/readings.ts       every counted figure, computed at build time
lib/posts.ts          build-time post loader; lib/markdown.mjs parses for it and the validator
lib/metadata.ts       pageMetadata(), every page's title, canonical and card
lib/dates.ts          the only date parser ("YYYY-MM" job dates)
lib/status.ts         useStatus(): the /status.json fetch and its freshness rule
lib/og.tsx            the shared OG card
scripts/              validator, image optimiser, check-build, smoke, caddy-test, serve-prod
tests/                unit tests (node:test) and tests/fixtures/status.json
deploy/               Caddyfile. The compose file and the pull script live in
                      homelab-gitops on the VPS, not here.
docs/adr/             the decisions that are hard to reverse, and why
docs/writing/         the post framework: kinds, skeletons, the evidence pack
content/docs/         projects' docs, copied from their repos at a commit (ADR 0006)
```

Routes that moved are redirected in `deploy/Caddyfile`, because a static export cannot
redirect: `/posts/*` → `/writing/*`, `/tags/*` → `/topics/*`, `/blog/` → `/writing/`,
`/resume/` → `/cv/`, `/now/`, `/uses/` and `/links/` → `/about/`.

## Add a blog post

Every post follows [the post framework](../writing/README.md): a kind (`finding`,
`incident`, `build` or `note`), the project it is about, a one-sentence thesis, and an
evidence pack that sources every figure before the prose is written.

```bash
npm run new -- finding my-post      # the draft from its skeleton, and its evidence pack
npm run evidence -- my-post         # every figure in the post has a source
npm run validate -- --drafts        # the publishing gate, over the drafts too
```

The `/post` skill walks through it and `/review-post` critiques the result. When it
is ready, move `content/drafts/my-post.md` to `content/posts/` on a branch. The
frontmatter, including the optional `spanDays`, `updated`/`correction` and
`cyrillic`, is in [the framework's reference](../writing/README.md#frontmatter).

`topics` is a **closed vocabulary** — `npm run validate` fails on anything not in
`lib/topics.ts`. Adding a topic means editing that file. A post appears on `/writing/`,
at `/writing/my-post/` and on each of its topics' pages on the next build.

From a phone: GitHub's web editor, as a pull request that adds the post to
`content/posts/`. The repo is public, so the pull request is readable before it merges.
There is no CMS ([ADR 0004](../adr/0004-the-cms-is-removed.md)).


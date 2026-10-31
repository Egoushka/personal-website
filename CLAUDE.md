# CLAUDE.md

Portfolio + blog for hrabovskyi.online: Next.js 16 App Router, React 19, TypeScript,
**statically exported**, served by Caddy on a Hetzner VPS behind Cloudflare. [docs/how-to/develop.md](docs/how-to/develop.md)
covers setup and [docs/explanation/deploy.md](docs/explanation/deploy.md) deploy and DNS; this file covers what breaks if ignored. Code comments
state the current constraint and why; history belongs in commits and [ADRs](docs/adr/).

## Commands

```bash
npm ci
npm run dev          # http://localhost:3000 — no search: /pagefind/ exists only after a build
npm run validate     # frontmatter, topics, internal and #fragment links in content/posts and content/methods
npm run validate -- --drafts   # the same over content/drafts (local: drafts are gitignored)
npm run new -- <kind> <slug>   # a draft from its skeleton, and its evidence pack
npm run evidence -- <slug>     # every figure the post states has a source in its pack
npm run evidence -- <slug> --verify   # and each source a machine can open bears out its row (network)
npm run readings               # each reading's `ref` holds its value at its commit; `-- --latest` warns on drift (network)
npm run docs:pull -- <project> [ref]   # copy a tool's docs from its repo at a commit (ADR 0006)
npm run docs:verify            # the copies match their commits byte for byte (network; CI runs it)
npm run docs:check -- <dir>    # a tool's docs directory against the contract, before it is pushed
npm run typecheck    # tsc --noEmit
npm test             # node:test over tests/**/*.test.ts; add tests/<area>.test.ts
npm run build        # images -> next build -> pagefind; static export to ./out
npm run check        # assertions over ./out
npm run serve:prod   # ./out behind deploy/Caddyfile in Docker on http://127.0.0.1:8080
npm run caddy-test   # redirects, cards, 404s, CSP and cache headers, against serve:prod
npm run smoke        # Playwright + axe against BASE_URL (default http://localhost:8080)
```

Before pushing: `npm run validate && npm run typecheck && npm test && npm run build && npm run check`.

**The repo is public.** Enable the hooks once per clone: `lefthook install` (it runs
agent-checks and the scripts in `.githooks/`), and copy `.private-terms.example` to `.private-terms` (gitignored). They block
private terms in files and commit messages, run betterleaks, and require a GitHub noreply
address; CI's `secrets` job checks the same. The origin IP, employer internals and local
paths never go in a file, a commit message or a PR.
No ESLint. **Test the build the way production serves it**: `serve:prod` (`SITE_PORT`,
`CADDY_IMAGE`) has the real CSP, headers, redirects and 404s; `python3 -m http.server`
has none. Re-run it after every build — the container keeps the deleted `out/` mounted.
`BASE_URL=https://hrabovskyi.online npm run caddy-test` tests the live site.

CI ([ci.yml](.github/workflows/ci.yml)), every PR and every branch but `main`: validate
→ typecheck → test → build → check → caddy validate → caddy-test → smoke → lychee.
Post-build steps run even after one fails, so one red run lists every failing gate.

## Hard constraint: `output: "export"`

No Node runtime in production. No server actions, middleware, ISR, `revalidate`, or
rewrites/redirects/`headers` in `next.config` — those go in [deploy/Caddyfile](deploy/Caddyfile).
Route handlers (the feeds) and `opengraph-image.tsx` need `export const dynamic =
"force-static"`; `next/og` is flexbox only, 500 KB max. No runtime env vars: `SITE_URL`
is read once at build in `lib/site.ts`. `images.unoptimized`. `trailingSlash: true`, so
internal links carry the slash (`/writing/foo/`). Every dynamic segment has
`generateStaticParams` (see [app/writing/[slug]/page.tsx](app/writing/[slug]/page.tsx)).

## Caddy, Cloudflare, deploy

- **A push to `main` is a live deploy** ([deploy.yml](.github/workflows/deploy.yml)): CI
  minus smoke, `X-Site-Rev` stamped, the build (with the stamped Caddyfile) published to
  the `deploy-site` release, which the box pulls every 2 min and installs in three passes
  (homelab-gitops `host/website-pull.sh`: `/_next/` additive → Caddyfile in place → the
  rest with `--delete`), a wait for the live `build.txt`, optional Cloudflare purge, then
  `caddy-test` live. Get explicit approval before pushing to `main`.
- Nothing here reaches the VPS: no SSH key, no deploy user. **No `caddy reload` or
  `docker compose up -d`** — Caddy `--watch` reloads within a second, and a file that
  fails to load keeps the old config. The pull writes the Caddyfile in place: it is a
  single-file bind mount.

Area rules load on demand from [.claude/rules/](.claude/rules/): client components, pages and data, posts and figures, docs, styling, Caddy and Cloudflare.

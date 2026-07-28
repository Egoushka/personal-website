# CLAUDE.md

Personal portfolio + blog for hrabovskyi.online. Next.js 16 App Router + React 19 +
TypeScript, **statically exported** and served by Caddy on a Hetzner VPS.

README.md covers setup, deploy secrets and DNS. This file covers the constraints that
break things if ignored.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # frontmatter + internal-link gate on content/posts/*.md
npm run typecheck  # tsc --noEmit
npm run build      # static export -> ./out  (the real verification step)
```

CI runs `validate → typecheck → build → caddy validate → lychee` on every PR and branch
([.github/workflows/ci.yml](.github/workflows/ci.yml)), and the same chain runs before the
deploy job touches the VPS. Run `npm run validate && npm run typecheck && npm run build`
locally before pushing.

No tests and no ESLint config. **`npm run build` is the gate** — it type-checks and renders
every route, so a broken component or a bad `content/posts/*.md` fails there. Run it after
any change. To check the built output like production:

```bash
cd out && python3 -m http.server 4321
```

`node_modules/` is not checked in; `npm install` first in a fresh clone.

## Hard constraint: `output: "export"` (next.config.mjs)

Production is plain files behind a file server. There is no Node runtime. So:

- No server actions, middleware, ISR, `revalidate`, rewrites, redirects, or `headers` in
  `next.config` (headers must go in [deploy/Caddyfile](deploy/Caddyfile)).
- **Route handlers DO work** — GET only, rendered to a static file at build. That is how
  `app/feed.xml/`, `app/atom.xml/` and `app/feed.json/` work. They need
  `export const dynamic = "force-static"`. Never `force-dynamic` — it hard-errors the build.
- **Metadata image routes (`opengraph-image.tsx`, `icon.tsx`) also work**, and also need
  an explicit `export const dynamic = "force-static"`, or the build fails with
  *"export const dynamic … not configured on route"*. `next/og` only supports flexbox — no
  CSS grid — and caps the bundle at 500 KB.
- No runtime env vars — anything dynamic must be resolved at build time.
- `next/image` optimization is off (`images.unoptimized`). Plain `<img>` or unoptimized `next/image` only.
- `trailingSlash: true`. Internal links must carry the slash: `/blog/`, `/posts/foo/`.
  A link to `/blog` costs a redirect and breaks under the static file server.
- Every dynamic segment needs `generateStaticParams` — see [app/posts/[slug]/page.tsx](app/posts/[slug]/page.tsx).

Node APIs (`fs`, `path` in [lib/posts.ts](lib/posts.ts)) are fine because they run at build time
in server components only. Never import `lib/posts.ts` from a client component.

## Where things live

- **Site content is data, not JSX.** Projects, experience, skills, homelab entries, links
  all live in [lib/site.ts](lib/site.ts) as typed exports. Components in `components/` map over
  them and are ~20–30 lines each. Adding a project = edit `lib/site.ts`, not `Projects.tsx`.
- **Blog posts** are `content/posts/*.md` with frontmatter `title, date (YYYY-MM-DD),
  description, tags`. [lib/posts.ts](lib/posts.ts) reads them at build time; the filename is the slug.
  Nothing to register.
- **Fonts are self-hosted by `next/font/google`** in [app/layout.tsx](app/layout.tsx), exposed as
  `--font-sans` / `--font-mono` and consumed by `--sans` / `--mono` in `globals.css`. Do not
  add a `<link>` to fonts.googleapis.com — it puts a render-blocking cross-origin request
  back on the critical path and loses the `size-adjust` fallback that keeps CLS at 0.
- **All styling is one global stylesheet**, [app/globals.css](app/globals.css) — CSS variables at `:root`,
  plain class names (`.wrap`, `.card`, `.section-label`). No Tailwind, no CSS modules, no
  styled-components. Match the existing dark terminal-minimal palette; don't introduce a
  styling system. **No inline `style={{}}`** — add a class instead.
- **Accessibility invariants** — these were failures that got fixed; don't regress them:
  `:focus-visible` must stay visible (never `outline: none` without a replacement); every
  page needs `<main id="main">` for the skip link; interactive targets stay ≥24×24px
  (WCAG 2.5.8); `--border-strong` (not `--border`) on anything whose border is the only
  boundary of a control; anything animated needs a `prefers-reduced-motion` escape.
- `@/*` path alias maps to the repo root.
- `app/sitemap.ts` and `app/robots.ts` generate `/sitemap.xml` and `/robots.txt` at build.

## Deploy — push to main is a live deploy

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds and `rsync --delete`s `out/` to the VPS on every
push to `main`, then `docker compose up -d`. Pushing to `main` publishes the site. Get
explicit approval before pushing; don't touch `deploy/` or the workflow casually.

The container Caddy ([deploy/Caddyfile](deploy/Caddyfile)) is **plain HTTP on :80**, published to the
tailnet at `100.64.0.2:8090`. TLS, the public hostname and the `www` redirect belong to the
edge — do not add `tls`, a hostname block, or a redirect to `deploy/Caddyfile`.

**The edge is Traefik, not Caddy.** `/opt/stacks/headscale/Caddyfile` is dead config; no
such container runs. Routing lives in `/opt/stacks/pangolin/config/traefik/dynamic_config.yml`
(`watch: true`, so edits apply live).

**A Caddyfile change needs `rsync --inplace` and an explicit `caddy reload`.** It is a
single-file bind mount, so a normal rsync gives it a new inode the container never sees,
and `docker compose up -d` is a no-op when the compose spec has not changed.

**Cloudflare is in front of all of it** (`server: cloudflare` on every live response), which
the README's DNS section previously did not say. It rewrites `robots.txt`, can strip or add
response headers, and gates AI crawlers via AI Crawl Control. See
the Deploy section of [README.md](README.md) before debugging anything header- or
crawler-related.


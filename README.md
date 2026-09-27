# hrabovskyi.online

Personal portfolio + blog for **Yehor Hrabovskyi**. Next.js (App Router,
TypeScript), exported to a static site and served by a container Caddy on a Hetzner
VPS, behind an edge Traefik and Cloudflare.

## Stack

- **Next.js 16** App Router, `output: 'export'` (static HTML, no Node runtime in prod)
- **TypeScript**, React 19
- **Markdown blog** — drop a `.md` in `content/posts/`, it appears automatically
- One hand-written stylesheet, `app/globals.css`: cool near-black dark theme by default,
  white light theme, one amber accent, Inter and Bricolage Grotesque. See
  [docs/DESIGN-BRIEF.md](docs/DESIGN-BRIEF.md).
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
content/drafts/       drafts. Not built. Moving a file out of here is deliberate.
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
deploy/               Caddyfile, deploy.sh, prelive-guard.sh. The compose file lives in
                      homelab-gitops on the VPS, not here.
docs/adr/             the decisions that are hard to reverse, and why
```

Routes that moved are redirected in `deploy/Caddyfile`, because a static export cannot
redirect: `/posts/*` → `/writing/*`, `/tags/*` → `/topics/*`, `/blog/` → `/writing/`,
`/resume/` → `/cv/`, `/now/`, `/uses/` and `/links/` → `/about/`.

## Add a blog post

Draft in `content/drafts/` (the `/post` skill does this), then move the file to
`content/posts/my-post.md` when it is ready:

```md
---
title: "My post"
date: "2026-06-10"
description: "One-line summary for the list and the meta description. Max 160 chars."
topics: ["infrastructure", "debugging"]
---

Body in Markdown. Fenced code blocks are highlighted at build time.
```

Optional frontmatter: `spanDays` (how many days the piece is about), and `updated`
(quoted date, not before `date`) with an optional `correction` note, which requires
`updated`. Use `updated`/`correction` for factual changes only, not for rewording.

`topics` is a **closed vocabulary** — `npm run validate` fails on anything not in
`lib/topics.ts`. Adding a topic means editing that file. A post appears on `/writing/`,
at `/writing/my-post/` and on each of its topics' pages on the next build.

From a phone: GitHub's web editor, as a pull request against `content/drafts/`. There
is no CMS ([ADR 0004](docs/adr/0004-the-cms-is-removed.md)).

## Deploy

One path: a push to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml).
Only `main` deploys, and a running deploy is never cancelled.

1. **Gate** — `npm ci`, validate, typecheck, test, build, check, `caddy validate`,
   caddy-test, lychee. Nothing has reached the box yet.
2. **Stamp** — the commit SHA replaces `__DEPLOY_REV__` in the Caddyfile's
   `X-Site-Rev` header.
3. **Sync, three passes** — `out/_next/` without `--delete` (pages cached at the edge
   still need the old chunks); the Caddyfile with `--inplace` (it is a single-file bind
   mount, and a renamed file is a new inode the container never sees); then the rest of
   `out/` with `--delete`, except `/_next/` and `/status.json`.
4. **Purge** — the Cloudflare cache, only if both `CF_ZONE_ID` and `CF_PURGE_TOKEN`
   secrets exist. Without them HTML updates when the edge copy expires (`s-maxage=600`).
5. **Verify** — `caddy-test` against the live site, after waiting up to 60 s for
   `X-Site-Rev` to name this commit.

Old `/_next/` chunks accumulate. Dispatch the workflow with `full: true` to prune them
after the purge.

The deploy key logs in as `webdeploy`, whose only command is
`rrsync -wo /opt/stacks/website` (forced in its `authorized_keys`): remote paths are
relative to that directory, and a write-only rsync is all it can do — no shell, no
docker. Caddy runs with `--watch` (homelab-gitops `website/compose.yaml`) and reloads
about a second after the Caddyfile changes; a file that fails to load leaves the old
config running, which is why the gate validates and tests it. There is no
`caddy reload` or `docker compose up -d` step, and none is possible with this key.

**By hand:** `./deploy/deploy.sh` runs the same gate, sync and live check (no purge).
It needs GNU rsync 3 (`brew install rsync` on macOS) and refuses to run with `SITE_URL`
set or with uncommitted changes.

**Probe:** [.github/workflows/probe.yml](.github/workflows/probe.yml) runs caddy-test
against the live site every six hours (and on dispatch) and fails if `/status.json` is
older than 48 hours. GitHub emails the failure.

**Dependabot** opens one grouped PR per week for npm and one for GitHub Actions.

### One-time setup

1. **Create a deploy key** (locally — keep the private key out of git):

   ```bash
   ssh-keygen -t ed25519 -f deploy_key -N "" -C "github-actions-deploy"
   ```

2. **Authorize it on the VPS**, as root, into `webdeploy`'s keys (never root's own):

   ```bash
   printf 'restrict,command="/usr/bin/rrsync -wo /opt/stacks/website" %s\n' "$(cat deploy_key.pub)" \
     > /home/webdeploy/.ssh/authorized_keys
   ```

3. **Pin the host key:** `ssh-keyscan -t ed25519 <origin-ip>`.

4. **Repo secrets** (Settings → Secrets and variables → Actions):

   | Secret | Value |
   |--------|-------|
   | `DEPLOY_SSH_KEY` | the private `deploy_key` |
   | `DEPLOY_KNOWN_HOSTS` | the `ssh-keyscan` line |
   | `PRELIVE_SSH_KEY` | the prelive key (see Prelive) |
   | `CF_ZONE_ID`, `CF_PURGE_TOKEN` | optional: zone id and a Zone → Cache Purge token |

The repository is private on GitHub Free, so environments and branch protection are
unavailable and a workflow on any branch can read these secrets.

To rotate a key, replace its line in `authorized_keys` and the matching secret. Keep a
copy of the private key in Vaultwarden.

### Hosting and DNS

The container Caddy (`/opt/stacks/website`) serves `:80` on the tailnet at
`100.64.0.2:8090` and prelive's `:81` at `100.64.0.2:8091`. It is plain HTTP; nothing
here issues a certificate.

**The public edge is Traefik, not Caddy.** `/opt/stacks/headscale/Caddyfile` is dead
config; no container runs it. Routing lives in
`/opt/stacks/pangolin/config/traefik/dynamic_config.yml` (`watch: true`, so edits apply
live):

```yaml
website-router:
  rule: "Host(`hrabovskyi.online`) || Host(`www.hrabovskyi.online`)"
  service: website-service      # -> http://100.64.0.2:8090
```

Umami is routed from the same file (`/s/script.js` and `/api/send` to `umami:3000`), so
the tracker is first-party. The tracker derives its endpoint from its script's path, so
it may post to `/s/api/send` instead; check in DevTools that pageviews reach Umami.

**Cloudflare is in front** (`server: cloudflare` on every live response), so the browser
terminates TLS at Cloudflare. Before debugging anything header- or crawler-related:

- **Headers can be added, stripped or overridden at the edge.** Set each security header
  in exactly one place — browsers intersect duplicate CSP headers.
- **Caching** — the Caddyfile sends `s-maxage` for HTML, feeds and icons, and a cache rule
  ("Respect origin Cache-Control") plus Browser Cache TTL = Respect Existing Headers make
  the edge honour it. Only `/_next/static/*` is `immutable`.
- **Cloudflare injects a managed `robots.txt` block** ahead of the site's own rules,
  disallowing `GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot` and others, with
  `Content-Signal: ai-train=no`.
- **AI Crawl Control** allows retrieval bots (OAI-SearchBot, ChatGPT-User, PerplexityBot,
  Claude-SearchBot) and blocks training crawlers (GPTBot, CCBot, ClaudeBot, Bytespider,
  Amazonbot, Google-CloudVertexBot, FacebookBot). **Do not test it with `curl -A`**:
  Cloudflare verifies bots by source IP, so a spoofed user-agent gets a 403 that looks
  exactly like a block. Use the AI Crawl Control counters.
- **Email Obfuscation is off**, so `mailto:` links work without JavaScript.
- `www.hrabovskyi.online` answers **302** from Cloudflare; the request never reaches the
  origin.

### Live state (`/status.json`)

The generator lives in homelab-gitops (`scripts/gen-status.sh`, run every ten minutes by
`host/cron.d/website-status`), not here. It writes `/status.json` next to the site, and
the deploy never overwrites it:

```
# on the VPS; the Wakapi key is read from its SQLite, so there is nothing to pass
/opt/stacks/scripts/gen-status.sh /opt/stacks/website/site/status.json
```

Aggregates only — container count, unhealthy count, uptime, hours coded in the last 30
days with the top language and editor as shares, and the NuGet download count. Never
service names, versions, ports or project names: the busiest project is an employer's
codebase and this document is public.

The browser reads it through `useStatus()` (`lib/status.ts`), which treats a document
that is missing, older than 48 hours, or malformed as absent. What each consumer does:

- **The home panel (`components/Panel.tsx`) always renders.** Before the fetch settles —
  which is also what the static HTML, crawlers and readers without JavaScript get — it
  says where the figures come from. On failure it says the box is not reporting. A
  document missing an optional half gets a line naming what is absent. Its height is
  reserved by measured bands in `globals.css`; re-measure them when the figures, their
  source text or the type scale change.
- **`UsesStatus` (`/about/`) and `Measured` (the CV) render nothing** without a
  valid document.

Local builds have no `/status.json`; `tests/fixtures/status.json` is a complete one for
tests and the smoke run.

## Prelive

A full build on the same box and the same Caddy container as production, served from a
second root (`/srv-prelive`, the `:81` block) and published to the **tailnet only**: no
public DNS, no edge route, nothing to crawl. Open <http://100.64.0.2:8091/> from a
tailnet device.

[.github/workflows/prelive.yml](.github/workflows/prelive.yml) runs on manual dispatch
and on every pull request from this repository (not forks, not Dependabot): validate →
typecheck → build → `caddy validate` → a dry-run guard → rsync `out/` to
`/opt/stacks/website/prelive/`. The runner cannot reach the tailnet, so there is no
live check.

- **Its own key.** Prelive deploys with `PRELIVE_SSH_KEY`, never the production key, and
  fails at its first step until that secret exists. Create it like the deploy key, forced
  to the prelive root:

  ```
  restrict,command="/usr/bin/rrsync -wo /opt/stacks/website/prelive" <pubkey>
  ```

  in `webdeploy`'s `authorized_keys`. Before the real sync, the same rsync runs with
  `--dry-run --itemize-changes` and `deploy/prelive-guard.sh` stops the job if it would
  touch `site/`, a `Caddyfile`, a top-level `status.json` or a dotfile — the signs of a
  key set up with the wrong root, where `--delete` would destroy production.
- **`SITE_URL`.** The build sets it to the prelive origin, and `lib/site.ts` reads it once.
  Canonicals, feeds, the sitemap, the OG cards and the URL each comment thread is keyed by
  follow it — a prelive build with the production URL would post test comments into the
  live thread.
- **`noindex`.** A prelive build puts `Disallow: /` in `robots.txt` and a
  `noindex, nofollow` meta on every page; the `:81` block adds `X-Robots-Tag`.
- **It never ships `deploy/Caddyfile`.** That file carries the production `:80` block, so
  syncing it from a branch would change the live config before a merge. Prelive only
  validates it; it reaches the box with the next production deploy.

The mount and the published port are in homelab-gitops `website/compose.yaml`
(`./prelive:/srv-prelive:ro`, `100.64.0.2:8091:81`), which this repo does not own.

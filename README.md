# hrabovskyi.online

Personal portfolio + blog for **Yehor Hrabovskyi**. Next.js (App Router,
TypeScript), exported to a static site and self-hosted behind Caddy on a Hetzner
VPS.

## Stack

- **Next.js 16** App Router, `output: 'export'` (static HTML, no Node runtime in prod)
- **TypeScript**, React 19
- **Markdown blog** — drop a `.md` in `content/posts/`, it appears automatically
- One hand-written stylesheet, `app/globals.css`. Warm paper, one amber accent, two
  faces, both themes. See [docs/DESIGN-BRIEF.md](docs/DESIGN-BRIEF.md).
- **Caddy** reverse proxy with automatic HTTPS

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
```

## Project layout

```
app/                  routes (App Router)
  page.tsx            home
  writing/            index + writing/[slug]/ post pages (static-generated)
  topics/[topic]/     one page per topic — posts, projects AND jobs for it
  projects/           index + projects/[slug]/
  skills/             what I work with, with the measured share of editor time
  journey/            the roles on a time axis, gaps included
  lab/                unlinked prototypes. Not in the nav, not in the sitemap.
  about/              about, what I'm doing now, and the whole stack
  cv/                 /cv/ — prints to exactly one A4 page. No checked-in cv.pdf
                      on purpose, so it can never go stale.
  links/              everywhere else I am
  sitemap.ts          /sitemap.xml
  robots.ts           /robots.txt
components/           Nav, Footer, PageHead, PostList, ProjectFilter, TopicMap,
                      SkillsBoard, Journey, Panel, Icon, Search, UsesStatus,
                      JsonLd, Picture
content/posts/*.md    posts (frontmatter: title, date, description, topics)
content/drafts/       drafts. Not built. Moving a file out of here is deliberate.
lib/site.ts           site content (projects, experience, uses, links)
lib/topics.ts         THE vocabulary — posts, projects and jobs all reference it
lib/readings.ts       every counted figure, computed at build time
lib/posts.ts          build-time markdown loader
app/feed.xml/         RSS 2.0   ┐ static route handlers, built from lib/feed.ts
app/atom.xml/         Atom 1.0  ├ (GET only — that is all output: "export" supports)
app/feed.json/        JSON Feed ┘
app/icon.svg          favicon; app/apple-icon.png is the 180×180 iOS home-screen icon
app/manifest.ts       /manifest.webmanifest
public/admin/         Sveltia CMS at /admin/ — see "Editing" below
lib/og.tsx            shared OG card, rendered by the opengraph-image.tsx routes
components/JsonLd.tsx Person/WebSite/BlogPosting/BreadcrumbList/ProfilePage structured data
docs/adr/             the decisions that are hard to reverse, and why
deploy/               Caddyfile + deploy.sh. The stack definition (compose.yaml)
                      is owned by the /opt/stacks GitOps repo on the VPS, not here.
```

Routes moved on 2026-08 (`/posts/*` → `/writing/*`, `/tags/*` → `/topics/*`,
`/blog/` → `/writing/`, `/resume/` → `/cv/`, `/now/` and `/uses/` → `/about/`). A
static export cannot redirect, so the old URLs are handled in `deploy/Caddyfile`.

## Add a blog post

Create `content/posts/my-post.md`:

```md
---
title: "My post"
date: "2026-06-10"
description: "One-line summary for the list and the meta description. Max 160 chars."
topics: ["infrastructure", "debugging"]
---

Body in Markdown. Code blocks get syntax highlighting.
```

`topics` is a **closed vocabulary** — `npm run validate` fails on anything not in
`lib/topics.ts`, which is how you avoid one post saying `ci-cd` and the next saying
`cicd` until there are two hubs of one post each. Adding a topic means editing that
file *and* `public/admin/config.yml`.

It shows up on `/writing/` and at `/writing/my-post/` on the next build, and on a
page for each of its topics.

## Deploy

There are **two** deploy paths, and a push to `main` runs both.

| | Path 1 — the VPS (origin) | Path 2 — Cloudflare Pages (mirror) |
|---|---|---|
| Workflow | [.github/workflows/deploy.yml](.github/workflows/deploy.yml) | [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) |
| Serves | container Caddy on the Hetzner box | Cloudflare's own network |
| Headers, redirects | [deploy/Caddyfile](deploy/Caddyfile) | [deploy/pages/_headers](deploy/pages/_headers), [deploy/pages/_redirects](deploy/pages/_redirects) |
| What the apex points at | this, today | nothing, until you point it |
| Survives the box being down | no | yes |

The second path exists because the first one ends at a single machine that also runs
every other self-hosted thing here. Without it the commercial front of this site goes
down with the test lab. It is a **failover, not a migration**: the VPS stays the origin,
and switching is one DNS change.

**Turning path 2 on** — it is gated off so a push cannot fail in red for a deploy that
was never configured:

1. Create the Pages project (any name; the default the workflow expects is
   `hrabovskyi-online`, override it with the repo variable `CLOUDFLARE_PAGES_PROJECT`).
2. Add repo secrets `CLOUDFLARE_API_TOKEN` (scope: Cloudflare Pages → Edit) and
   `CLOUDFLARE_ACCOUNT_ID`.
3. Set the repo **variable** `DEPLOY_CLOUDFLARE_PAGES` to `true`.

**Keep the two in step.** Caddy gets its headers and redirects from the Caddyfile; Pages
gets them from `_headers` and `_redirects`, which are copied into `out/` by the workflow
rather than living in `public/`. The redirects are not optional on either: `/posts/*` was
the canonical address of everything published here and is still in feed readers, and
without the `Content-Type: image/png` line every social scraper rejects the OG cards,
which `next/og` writes as extensionless files. A rule added to one file and not the other
is a bug that only appears on whichever path you are not looking at.

**Analytics does not follow the mirror.** `/s/script.js` and `/api/send` are first-party
only because the edge Traefik routes them to the Umami container; on Pages there is no
such route and the tracker is silently dead. That is acceptable for a failover — it is
the one thing on the page nobody is there for — but it is worth knowing before debugging
it a second time.

### Path 1 — the VPS

The site exports to static files served by a small internal Caddy
(`/opt/stacks/website`) bound to the tailnet at `100.64.0.2:8090`.

**The public edge is Traefik, not Caddy.** `/opt/stacks/headscale/Caddyfile` still exists
and still contains an `hrabovskyi.online` block, but **no `headscale-caddy` container is
running** — that file is dead config. Real routing lives in
`/opt/stacks/pangolin/config/traefik/dynamic_config.yml`, which has `watch: true`, so
edits apply without a restart:

```yaml
website-router:
  rule: "Host(`hrabovskyi.online`) || Host(`www.hrabovskyi.online`)"
  service: website-service      # -> http://100.64.0.2:8090
```

Analytics is routed from the same file: `/s/script.js` and `/api/send` go to `umami:3000`
over the shared `edge` network, so the tracker is first-party.

**DNS — note that Cloudflare is in front.** Live responses carry `server: cloudflare`
and a `cf-ray` header, so the browser terminates TLS at Cloudflare, not at the edge
Traefik. That has consequences worth knowing before you debug anything:

- **Response headers can be added, stripped or overridden at the Cloudflare edge.** Set
  each security header in exactly one place — duplicated CSP headers get intersected by
  browsers.
- **HTML caching** — `deploy/Caddyfile` now sends `s-maxage` for HTML, feeds and the
  icons, so Cloudflare can cache pages instead of returning `cf-cache-status: DYNAMIC`
  on every request. Only `/_next/static/*` is `immutable`.
- **Cloudflare injects a managed `robots.txt` block** ahead of this app's own rules,
  disallowing `GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot` and others, and setting
  `Content-Signal: ai-train=no`.
- **AI Crawl Control** (Security → AI Crawl Control) decides which AI crawlers get through.
  Retrieval/search bots are allowed — OAI-SearchBot, ChatGPT-User, PerplexityBot,
  Claude-SearchBot (which is actively crawling and transferring bytes) — while training
  crawlers are blocked: GPTBot, CCBot, ClaudeBot, Bytespider, Amazonbot,
  Google-CloudVertexBot, FacebookBot.
  **Beware of testing this with `curl -A`**: Cloudflare verifies bots by source IP, so a
  spoofed user-agent from any other address is correctly rejected with a 403. That looks
  identical to the crawler being blocked and is not. Use the AI Crawl Control request
  counters instead.
- **Email Obfuscation is now off.** It used to rewrite `mailto:` links into
  `/cdn-cgi/l/email-protection` plus a decode script, which broke the contact path
  entirely without JavaScript and hid the address from crawlers.
- **A cache rule** ("Respect origin Cache-Control") and **Browser Cache TTL = Respect
  Existing Headers** make the edge honour the origin instead of returning
  `cf-cache-status: DYNAMIC` on every HTML request and rewriting `max-age`.
- `www.hrabovskyi.online` answers **302**. The edge Caddy block above says `permanent`
  (301), so the 302 is **Cloudflare's** redirect, not Caddy's — the request never reaches
  the origin.

The original single-layer setup was: A records `@` and `www` → the VPS, with Caddy issuing
the Let's Encrypt cert once DNS resolved. That still describes the origin; it is no longer
the whole path.

### Live state on /about/

`scripts/gen-status.sh` runs from cron **on the VPS** and writes `/status.json` next to the
site. `components/UsesStatus.tsx` fetches it in the browser and renders nothing if it is
missing or older than 48 hours, so the page never claims live state it does not have.

It publishes aggregates only — container count, unhealthy count, uptime, and, when
`WAKAPI_API_KEY` is set in the cron environment, hours coded in the last 30 days with the
top language and editor as shares. Never service names, versions, ports or project names:
the busiest project is an employer's codebase and this document is public.

```
WAKAPI_API_KEY=... WAKAPI_URL=http://wakapi:3000 \
  /opt/stacks/website/gen-status.sh /opt/stacks/website/site/status.json
```

**Ship a build:**

```bash
./deploy/deploy.sh   # builds ./out, rsyncs to the VPS, brings Caddy up
```

Or manually:

```bash
npm run build                                   # -> ./out
rsync -avz --delete out/  root@<origin-ip>:/opt/stacks/website/site/
rsync -avz deploy/Caddyfile root@<origin-ip>:/opt/stacks/website/
ssh root@<origin-ip> 'cd /opt/stacks/website && docker compose up -d'
```

The container Caddy is plain HTTP — TLS is terminated at the edge Traefik (and in front of
that, Cloudflare). Nothing here issues a certificate.

`docker compose up -d` alone will **not** apply a Caddyfile change: the compose spec is
unchanged so the container is not recreated, and the file is a single-file bind mount that
rsync re-creates with a new inode. Hence `rsync --inplace` plus an explicit `caddy reload`
in both `deploy.sh` and the workflow.

## Continuous deployment (GitHub Actions)

`.github/workflows/deploy.yml` runs on every push to `main` (and on manual dispatch):
`npm ci` → `validate` → `typecheck` → `build` → `caddy validate` → rsync `out/` to the
VPS → `docker compose up -d` → verify `/`, `/writing/` and `/feed.xml` return 200. The
runner reaches the VPS over SSH on port 22.

`.github/workflows/ci.yml` runs the same checks on branches and PRs, plus an offline
link check, so failures surface before anything reaches `main`.

> **The host moved once.** Deploys targeted a previous address until 2026-07-28; it still answered
> ping but had port 22 closed, so nothing had deployed since
> **2026-06-06** — see [the post](https://hrabovskyi.online/writing/silent-deploys/).
> The workflow now targets `<origin-ip>`, both secrets have been rotated, and
> deploys run green. The steps below are the runbook for the next rotation.

### One-time setup

1. **Create a dedicated deploy key** (locally — keep the private key out of git):

   ```bash
   ssh-keygen -t ed25519 -f deploy_key -N "" -C "github-actions-deploy"
   ```

2. **Authorize it on the VPS:**

   ```bash
   ssh-copy-id -i deploy_key.pub root@<origin-ip>
   # or: cat deploy_key.pub | ssh root@<origin-ip> 'cat >> ~/.ssh/authorized_keys'
   ```

3. **Pin the VPS host key** (so the runner won't trust-on-first-use):

   ```bash
   ssh-keyscan -t ed25519 <origin-ip>
   ```

4. **Add two repo secrets** (GitHub → repo → Settings → Secrets and variables →
   Actions → New repository secret):

   | Secret | Value |
   |--------|-------|
   | `DEPLOY_SSH_KEY` | full contents of the private `deploy_key` file |
   | `DEPLOY_KNOWN_HOSTS` | the line printed by `ssh-keyscan` in step 3 |

5. **DNS** (once): A records `@` and `www` → `<origin-ip>`.

Then push to `main` and watch the run under the repo's **Actions** tab. After
the first successful deploy, Caddy issues the certificate and the site is live
at <https://hrabovskyi.online>.

> Tip: store the deploy private key in Vaultwarden as a backup. To rotate, drop
> the old line from the VPS `~/.ssh/authorized_keys` and repeat with a new key.



## Editing (`/admin/`)

[Sveltia CMS](https://sveltiacms.app). A static SPA that talks to the GitHub API
directly — it never touches the build, and `output: "export"` is unaffected.
Saving commits to `main`, which triggers the normal deploy.

**Signing in needs no OAuth app and no worker.** Click **Sign In Using Access
Token**; it links to GitHub's token page with the right scopes pre-selected.
Generate a fine-grained PAT scoped to `Egoushka/personal-website` with
**Contents: Read and write**, and paste it in. The token is stored in your
browser's localStorage and never reaches this repo, the server, or CI.

That is deliberately the whole setup. The alternative — a GitHub OAuth app plus a
Cloudflare Worker — means one more deployed service and a client secret to store,
to replace a button that already works.

Rotate by deleting the token on GitHub; the CMS then just asks for a new one.

The editor mirrors `scripts/validate-content.mjs`, including the closed tag
vocabulary and the 160-character description limit, so mistakes surface before
they become a commit. CI is still the real gate.

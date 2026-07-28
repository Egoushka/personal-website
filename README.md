# hrabovskyi.online

Personal portfolio + blog for **Yehor Hrabovskyi**. Next.js (App Router,
TypeScript), exported to a static site and self-hosted behind Caddy on a Hetzner
VPS.

## Stack

- **Next.js 16** App Router, `output: 'export'` (static HTML, no Node runtime in prod)
- **TypeScript**, React 19
- **Markdown blog** — drop a `.md` in `content/posts/`, it appears automatically
- Custom dark terminal-minimal design in `app/globals.css`
- **Caddy** reverse proxy with automatic HTTPS

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
```

## Project layout

```
app/                 routes (App Router)
  page.tsx           home
  blog/page.tsx      blog index
  posts/[slug]/      dynamic post pages (static-generated)
  sitemap.ts         /sitemap.xml
  robots.ts          /robots.txt
components/           Nav, Hero, About, Projects, Experience, Homelab, Contact, Footer
content/posts/*.md    blog posts (frontmatter: title, date, description, tags)
lib/site.ts           site content (projects, experience, skills, homelab)
lib/posts.ts          build-time markdown loader
public/cv.pdf         ⚠️ STILL A PLACEHOLDER — 3.2 KB, ReportLab-generated, no real content.
                      The hero's "Download CV" button points at it. Replace it.
app/feed.xml/         RSS 2.0   ┐ static route handlers, built from lib/feed.ts
app/atom.xml/         Atom 1.0  ├ (GET only — that is all output: "export" supports)
app/feed.json/        JSON Feed ┘
app/icon.svg          favicon; app/apple-icon.png is the 180×180 iOS home-screen icon
app/manifest.ts       /manifest.webmanifest
deploy/               Caddyfile + deploy.sh. The stack definition (compose.yaml)
                      is owned by the /opt/stacks GitOps repo on the VPS, not here.
```

## Add a blog post

Create `content/posts/my-post.md`:

```md
---
title: "My post"
date: "2026-06-10"
description: "One-line summary for the list + meta tags."
tags: ["topic"]
---

Body in Markdown. Code blocks get syntax highlighting.
```

It shows up on `/blog` and at `/posts/my-post/` on the next build.

## Deploy

The site exports to static files served by a small internal Caddy
(`/opt/stacks/website`) bound to the tailnet at `100.64.0.2:8090`. The public
edge `headscale-caddy` terminates TLS and reverse-proxies `hrabovskyi.online`
to it — the same pattern as the `.internal` services, but public.

**One-time, on the VPS** — add this to `/opt/stacks/headscale/Caddyfile`, then
`docker exec headscale-caddy caddy reload --config /etc/caddy/Caddyfile`:

```
hrabovskyi.online {
	reverse_proxy 100.64.0.2:8090
}
www.hrabovskyi.online {
	redir https://hrabovskyi.online{uri} permanent
}
```

**DNS — note that Cloudflare is in front.** Live responses carry `server: cloudflare`
and a `cf-ray` header, so the browser terminates TLS at Cloudflare, not at
`headscale-caddy`. That has consequences worth knowing before you debug anything:

- **Response headers can be added, stripped or overridden at the Cloudflare edge.** Set
  each security header in exactly one place — duplicated CSP headers get intersected by
  browsers.
- **HTML caching** — `deploy/Caddyfile` now sends `s-maxage` for HTML, feeds and the
  icons, so Cloudflare can cache pages instead of returning `cf-cache-status: DYNAMIC`
  on every request. Only `/_next/static/*` is `immutable`; `cv.pdf` deliberately is not,
  because it is replaced in place.
- **Cloudflare injects a managed `robots.txt` block** ahead of this app's own rules,
  disallowing `GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot` and others, and setting
  `Content-Signal: ai-train=no`.
- **WAF rules are evaluated before `robots.txt`.** As of 2026-07-28, `OAI-SearchBot`,
  `ChatGPT-User` and `PerplexityBot` get **403**, while Googlebot, bingbot, DuckDuckBot
  and the social unfurlers get 200. Change this under
  **Security → Bots → AI Crawl Control** if you want to be citable in AI answers.
- **Email Obfuscation (Scrape Shield) rewrites `mailto:` links** into
  `/cdn-cgi/l/email-protection` and injects a decode script, so the contact links do not
  work without JavaScript.
- `www.hrabovskyi.online` answers **302**. The edge Caddy block above says `permanent`
  (301), so the 302 is **Cloudflare's** redirect, not Caddy's — the request never reaches
  the origin.

The original single-layer setup was: A records `@` and `www` → the VPS, with Caddy issuing
the Let's Encrypt cert once DNS resolved. That still describes the origin; it is no longer
the whole path.

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

The container Caddy is plain HTTP — TLS is terminated at the edge `headscale-caddy`
(and in front of that, Cloudflare). Nothing here issues a certificate.

## Continuous deployment (GitHub Actions)

`.github/workflows/deploy.yml` runs on every push to `main` (and on manual dispatch):
`npm ci` → `validate` → `typecheck` → `build` → `caddy validate` → rsync `out/` to the
VPS → `docker compose up -d` → verify `/`, `/blog/` and `/feed.xml` return 200. The
runner reaches the VPS over SSH on port 22.

`.github/workflows/ci.yml` runs the same checks on branches and PRs, plus an offline
link check, so failures surface before anything reaches `main`.

> **The host moved.** Deploys targeted `37.27.211.58` until 2026-07-28; that address
> still answers ping but has port 22 closed, so nothing had deployed since
> **2026-06-06**. The workflow now targets `<origin-ip>`. Re-do steps 2–4 below —
> the deploy key is not in the new box's `authorized_keys` and `DEPLOY_KNOWN_HOSTS`
> is pinned to the old host key.

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


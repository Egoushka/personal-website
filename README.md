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
public/cv.pdf         downloadable CV (replace with your own)
deploy/               Caddyfile, docker-compose.yml, deploy.sh
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
(`/opt/stacks/website`) bound to the tailnet at `100.64.0.4:8090`. The public
edge `headscale-caddy` terminates TLS and reverse-proxies `hrabovskyi.online`
to it — the same pattern as the `.internal` services, but public.

**One-time, on the VPS** — add this to `/opt/stacks/headscale/Caddyfile`, then
`docker exec headscale-caddy caddy reload --config /etc/caddy/Caddyfile`:

```
hrabovskyi.online {
	reverse_proxy 100.64.0.4:8090
}
www.hrabovskyi.online {
	redir https://hrabovskyi.online{uri} permanent
}
```

**One-time DNS:** at the registrar for `hrabovskyi.online`, add A records
`@` and `www` → `37.27.211.58`. Caddy issues the Let's Encrypt cert
automatically once DNS resolves.

**Ship a build:**

```bash
./deploy/deploy.sh   # builds ./out, rsyncs to the VPS, brings Caddy up
```

Or manually:

```bash
npm run build                                   # -> ./out
rsync -avz --delete out/  root@37.27.211.58:/opt/stacks/website/site/
rsync -avz deploy/Caddyfile deploy/docker-compose.yml root@37.27.211.58:/opt/stacks/website/
ssh root@37.27.211.58 'cd /opt/stacks/website && docker compose up -d'
```

HTTPS is issued automatically on first run — watch `docker compose logs -f caddy`.

## Continuous deployment (GitHub Actions)

`.github/workflows/deploy.yml` builds and deploys on every push to `main`
(and on manual dispatch): `npm ci` → `npm run build` → rsync `out/` to the VPS →
`docker compose up -d`. The runner reaches the VPS over SSH (port 22 is already
open in the Hetzner firewall).

### One-time setup

1. **Create a dedicated deploy key** (locally — keep the private key out of git):

   ```bash
   ssh-keygen -t ed25519 -f deploy_key -N "" -C "github-actions-deploy"
   ```

2. **Authorize it on the VPS:**

   ```bash
   ssh-copy-id -i deploy_key.pub root@37.27.211.58
   # or: cat deploy_key.pub | ssh root@37.27.211.58 'cat >> ~/.ssh/authorized_keys'
   ```

3. **Pin the VPS host key** (so the runner won't trust-on-first-use):

   ```bash
   ssh-keyscan -t ed25519 37.27.211.58
   ```

4. **Add two repo secrets** (GitHub → repo → Settings → Secrets and variables →
   Actions → New repository secret):

   | Secret | Value |
   |--------|-------|
   | `DEPLOY_SSH_KEY` | full contents of the private `deploy_key` file |
   | `DEPLOY_KNOWN_HOSTS` | the line printed by `ssh-keyscan` in step 3 |

5. **DNS** (once): A records `@` and `www` → `37.27.211.58`.

Then push to `main` and watch the run under the repo's **Actions** tab. After
the first successful deploy, Caddy issues the certificate and the site is live
at <https://hrabovskyi.online>.

> Tip: store the deploy private key in Vaultwarden as a backup. To rotate, drop
> the old line from the VPS `~/.ssh/authorized_keys` and repeat with a new key.


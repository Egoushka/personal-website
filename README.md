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

The site exports to static files and is served by a self-contained Caddy stack
on the VPS (`/opt/stacks/website`), independent of the internal `headscale-caddy`.

**One-time DNS:** at the registrar for `hrabovskyi.online`, add A records
`@` and `www` → `37.27.211.58`.

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

---
paths:
  - "deploy/**"
  - ".github/workflows/**"
  - "scripts/caddy-test.sh"
  - "scripts/serve-prod.sh"
  - "scripts/smoke.mjs"
  - "next.config.*"
---

## Caddy, Cloudflare, deploy (continued)

- The Caddyfile is plain HTTP: `:80` production, `:81` prelive, one shared `(site)`
  snippet — never let them drift. No `tls`, hostname or www redirect (the edge is Traefik,
  `/opt/stacks/pangolin/config/traefik/dynamic_config.yml`). Each header in one place;
  never add `'unsafe-eval'` or an origin to the CSP; the one origin it names is the Umami
  dashboard in `frame-ancestors`, for its heatmaps.
- **Header matchers that name files carry `file`**, or a 404 inherits them (`/404.html`
  served as `image/png`; missing chunks pinned `immutable` for a year). `@html` matches
  directories and is the exception. OG cards are extensionless, so a new card route needs
  its path in `@ogimages`; `lib/og.tsx` colours are hard-coded copies of the tokens.
- **Redirects** (`/posts/*`, `/tags/*`, `/blog/`, `/resume/`, `/now/`, `/uses/`, `/links/`)
  are `handle` blocks with `redir * <to> permanent`: bare `redir` sorts after `try_files`,
  and without `*` the target parses as a matcher.
- **Prelive** ([prelive.yml](.github/workflows/prelive.yml)), every same-repo PR: builds with
  `SITE_URL=http://100.64.0.2:8091` and publishes `out/` to the `deploy-prelive` release,
  which the box mirrors into the prelive root; never ships the Caddyfile. `probe.yml`
  checks the live site and `/status.json` every 6 h. The manual path is re-running
  `deploy.yml` from the Actions tab. Compose, cron, the pull script and the Remark42
  container belong to homelab-gitops.

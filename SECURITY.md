# Security policy

## Reporting a vulnerability

Use GitHub private vulnerability reporting on this repository (Security tab → "Report a
vulnerability"). Don't open a public issue. Expect an acknowledgement within 7 days.

## Scope notes

This is the source of <https://hrabovskyi.online>, a static export served by Caddy behind
Cloudflare. There is no server code in production except Remark42 comments at `/c/`.
Report anything that gets script past the Content Security Policy in `deploy/Caddyfile`,
a way to reach the origin server around Cloudflare, a way to reach a tailnet-only
`*.lab.` service from the internet, or a path for a pull request to publish to the
`deploy-site` or `deploy-prelive` releases.

## Supported versions

Only the live site and the latest commit on `main`.

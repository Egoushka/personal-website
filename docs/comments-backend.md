# Comments backend — what runs on the box

The site side is built and verified. This is the half that lives on the VPS
and in a GitHub OAuth app, which is yours to run: it needs a client secret,
and secrets do not pass through here.

## Why Remark42 and not a drop-in

Every hosted option is refused by this site's own CSP, and not awkwardly:

```
script-src 'self'    → Giscus / utterances / Disqus scripts never load
connect-src 'self'   → and could not call home if they did
```

That is the policy working. So the comment service runs on the box and is
served **first-party** at `/c/` on hrabovskyi.online — the same trick Umami
already uses at `/s/script.js`, for the same reason. Third-party origins stay
at zero.

Remark42 carries GitHub sign-in, threads, voting and a moderation UI in one
container.

## 1. GitHub OAuth app

Create one at <https://github.com/settings/developers> → **New OAuth App**.

| Field | Value |
|---|---|
| Application name | hrabovskyi.online comments |
| Homepage URL | `https://hrabovskyi.online` |
| Authorization callback URL | `https://hrabovskyi.online/c/auth/github/callback` |

The callback **must** be under `/c/` on the public domain, not the container's
address. Note the client ID and generate a secret.

## 2. The stack

In `/opt/stacks/comments/compose.yaml` — a new stack in the GitOps repo, with
the secret SOPS-encrypted like every other one, never in the compose file:

```yaml
services:
  remark42:
    image: umputun/remark42:latest
    restart: unless-stopped
    environment:
      - REMARK_URL=https://hrabovskyi.online/c
      - SITE=hrabovskyi
      - SECRET=${REMARK_SECRET}
      - AUTH_GITHUB_CID=${GITHUB_CID}
      - AUTH_GITHUB_CSEC=${GITHUB_CSEC}
      - AUTH_ANON=false
      - ADMIN_SHARED_ID=github_<your-github-id>
      - EMOJI=true
      - NOTIFY_ADMIN=telegram
    volumes:
      - ./var:/srv/var
```

`./var` is not optional — the container exits on boot without it, with
`ERROR: /srv/var doesn't exist`. That is how it fails; it does not start and
then lose data quietly.

`REMARK_URL` must be the public `/c` URL. It is what the widget checks against
and what the OAuth callback is built from.

## 3. Traefik route

Route `hrabovskyi.online/c/*` to the remark42 container, in
`/opt/stacks/pangolin/config/traefik/dynamic_config.yml` (`watch: true`, so it
applies live).

**Do not strip the `/c` prefix.** Remark42 is configured to live at that path
and builds its own URLs from `REMARK_URL`.

### The one that will bite you

**`/c/*` must NOT receive the site's `Content-Security-Policy` header.**

The widget renders itself in an iframe, and `frame-ancestors 'none'` is
enforced on *the framed response*. Put the site's CSP on `/c/` and the browser
refuses the widget's own iframe:

```
Framing 'https://hrabovskyi.online/' violates the following
Content-Security-Policy directive: "frame-ancestors 'none'".
```

This is not theoretical — it is what happened the first time it was wired up
locally. Since `/c/` is a Traefik route to another container rather than a
path served by the site's Caddy, it should inherit nothing by default. Verify
rather than assume:

```bash
curl -sSI https://hrabovskyi.online/c/web/embed.js | grep -i content-security
```

That must print nothing. The page itself keeps its CSP, which now carries
`frame-src 'self'` so it may frame a widget from its own origin.

## 4. Verify

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://hrabovskyi.online/c/web/embed.js
curl -sS "https://hrabovskyi.online/c/api/v1/config?site=hrabovskyi"
```

Then open a post and check the thread loads, sign-in reaches GitHub and comes
back, and the console is clean.

## What was verified here, and what was not

Verified locally against a real Remark42 container behind a proxy carrying
this site's production CSP: `embed.js`, `iframe.html`, `remark.mjs`,
`remark.css`, `/api/v1/config`, `/auth/status` and the thread query
`/api/v1/find` all returned 200; the iframe mounted same-origin; CLS stayed at
0.0003, unchanged from before.

Not verified, because it needs your secret: the GitHub sign-in round trip.

## Known gaps

- **The widget does not match the site palette.** It ships its own light and
  dark themes and follows the site's toggle, but the accent inside the iframe
  is Remark42's teal rather than the amber. Fixing it means overriding CSS
  inside the iframe — possible, since it is same-origin, and fragile across
  upgrades. Left alone deliberately.
- **Moderation is a standing chore.** GitHub sign-in makes drive-by spam
  unlikely, not impossible. `NOTIFY_ADMIN` is set to Telegram above so new
  comments reach you rather than waiting to be discovered.
- **Data protection.** Storing commenters' GitHub IDs and text is personal
  data. A line in a privacy note saying what is stored, where it runs and how
  to have it deleted is the honest minimum, and this site has no privacy page
  yet.

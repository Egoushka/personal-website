# Comments are a bounded exception to ADR 0001

Status: accepted

[ADR 0001](./0001-the-site-is-never-the-app.md) says this site has no server, no
session and no database. Comments need all three, and they stay: Remark42, self-hosted,
served first-party at `/c/` on this origin through the edge. Its script is served from
`/c/` and the widget renders in an iframe from `/c/`, so the CSP needs no third-party
origin (`frame-src 'self'`).

This is an exception, not a precedent. Its bounds:

- **Remark42 only, at `/c/`.** Its identity (GitHub sign-in), moderation and vote counts
  live in Remark42's own container, run from homelab-gitops. None of it is
  reimplemented in this repo, and nothing else on the site gains a session.
- **No credential may be stored on this origin.** The site's own code holds none, and
  nothing is added that would; sign-in belongs to Remark42.
- **The image is pinned** by version or digest in homelab-gitops, and its `./var` is
  backed up — owner actions, since this repo does not own that container.
- **The widget loads lazily.** `components/Comments.tsx` server-renders the section
  heading and loads the widget only when the section comes within 800 px of the
  viewport (a `#comments` link triggers the same), so a reader who never reaches the
  end of a post never loads it. If the backend is unreachable it says so rather than
  leaving a hole.

`Cross-Origin-Opener-Policy` stays `same-origin`. If GitHub sign-in breaks under it,
the fix is `same-origin-allow-popups`, and nothing looser.

The cost accepted is one stateful service behind a static site. If Remark42 is down,
a post loses its comments and nothing else.

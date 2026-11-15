# The site may be an application

Status: accepted, 2026-11-15. Supersedes [ADR 0001](./0001-the-site-is-never-the-app.md). Partly supersedes [ADR 0004](./0004-the-cms-is-removed.md) and generalises the bound of [ADR 0005](./0005-comments-are-a-bounded-exception.md).

[ADR 0001](./0001-the-site-is-never-the-app.md) kept this site a set of flat files: no
server, no session, no database, nothing it hosts. It protected a two-hours-a-week
budget and a career-sized breach risk. Since then the goal has moved. The site is meant
to earn, and to make the owner's voice a guide in the tech world. The traffic data of
2026-11-15 shows readers who play with the page and leave: nothing invites them back,
and the offers are almost invisible. A static brochure cannot fix that.

The owner decided on 2026-11-15 that the site may be an application: a server,
sessions, a database, an admin. Architecture: a following ADR (0012). Nothing here
says how.

## What is lifted

- **Server and Node runtime** are allowed for `/api` and `/admin`. Public pages stay static.
- **An owner editor** is allowed (ADR 0004 partly superseded). Git stays the source of truth for content.
- **Sessions only via OIDC (Pocket ID), no credential stored in the browser.** This is ADR 0005's bound made general.
- **"Not a product, never hosts one" and "Ecosystem is not a thing"** (CONTEXT.md) are lifted. The site may be the hub and host offers.
- **Each page gets a job and a success metric**, kept private (owner-only) and never shown publicly.
- **The 2 h/week budget** is the owner's own time. Agents maintain the site behind gates.
- **Strict CSP stays**, except the payment provider's origin once payments ship.
- **The Lighthouse bar stays for public pages** and exempts `/admin`.
- **Code PRs merge when green.** Publishing a post stays a manual, reviewed act; the owner agreed to that explicitly.
- **English is no longer the only language**, decided per post.

## Audience

The primary visitor for now is a client or a buyer; the goal is income. Second, and as
important: authority in the tech world. The owner wants his voice to become a guide, the
site is the leverage, so it has to be really great. Hiring managers remain a secondary
audience.

## What stays

Computed figures ([ADR 0002](./0002-keep-the-computed-figures-drop-the-ledger.md)),
docs written where the code is ([ADR 0006](./0006-docs-are-written-where-the-code-is.md)),
methods earned by two projects ([ADR 0008](./0008-methods-are-earned-by-two-projects.md)),
drafts becoming posts only by a reviewed act, and the kept-on-purpose ledger in
DESIGN.md.

## Why

ADR 0001's reason survives as a guard, not a ban: a breach on the owner's domain is
still a career event. That is why sessions come only from the identity provider, no
credential lives in the browser, and the strict CSP stays.

## Cost accepted

An application on the personal domain has to be kept correct, patched and backed up,
which the static site never needed. The guards above, and agents behind gates, are how
that cost is paid. Until ADR 0012 lands, CLAUDE.md's static-export constraint holds as
written for all code.

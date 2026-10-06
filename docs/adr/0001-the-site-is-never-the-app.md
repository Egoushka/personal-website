# The site is never the app

Status: accepted. Partly superseded by [ADR 0010](./0010-posts-may-carry-interactive-figures.md): post figures may be interactive; everything else here stands.

The long-term intention is several products — dashboards, a knowledge base, a personal
CRM, possibly SaaS — reachable from one place, eventually with shared sign-in and
billing. The obvious path is to grow this repo into the platform that hosts them.

We are not doing that. Every Product gets its own subdomain, its own repo, its own
runtime and its own deploy. This Site stays a statically-exported set of flat files
with no server, no session, no database, and links out. Shared identity, when it is
ever justified, is an identity provider bought or self-hosted at its own subdomain,
of which this Site is at most another client — it is not a feature of this repo.

Why: the Site's job is to still be correct, fast and unbreached after years of
neglect, at a maintenance budget of about two hours a week. A static file server
meets that; an application with auth and billing does not, and a credential breach on
the personal domain of a fintech engineer is a career event rather than a bug. The
cost accepted is that nothing on the Site can ever be personalised or interactive
beyond what a browser does on its own.

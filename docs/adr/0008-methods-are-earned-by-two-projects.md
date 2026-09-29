# Methods are earned by two projects

Status: accepted

The writing framework names three kinds of page — Post, Docs and Method — and
until now built two. A Method is how I work, and a page about how someone works
is the easiest page on a personal site to write and the hardest to believe: a
list of principles is a manifesto, and nobody can check a manifesto.

So a method gets a page only when two or more projects do the same thing, and
the page links where each of them did it. One project's lesson is a post. The
index at `/methods/`, linked from `/about/` as "How I work", is assembled from
those pages, the method more projects follow first.

What a method is:

- `content/methods/<slug>.md`, tracked, rendered at `/methods/<slug>/`.
  Frontmatter: `title` (the rule, in sentence case, an imperative or a plain
  claim), `description` (≤ 160 characters), `lastReviewed` (`YYYY-MM-DD`),
  `projects` (two or more slugs from `lib/site.ts`), `posts` (the published
  posts that tell the stories behind it, possibly none) and `topics`
  (`lib/topics.ts`).
- Four `##` sections, in order, each renamed to what it says: the rule in one
  paragraph; where it came from, one short paragraph per project linking the
  post, docs or project page that shows it; what it costs; when I break it.
- It is not a post. It has no date and no kind, it is kept current rather than
  corrected, and it stays out of `feed.xml`, `atom.xml` and `feed.json`, which
  carry dated writing; it is in the sitemap and in search. It never retells a
  post: it states the rule and links the stories.
- `projects` is the one field that ties a method to a project, as `project` is
  for a post. A project's page lists the methods that name it, read from the
  methods and never from `lib/site.ts`; a post named in `posts` ends with one
  line linking the method.

What enforces it: `npm run validate` fails a method with fewer than two
projects, a project that is not in `lib/site.ts`, a `posts` entry that is not
published, a body that is not four sections with prose in each, a "where it
came from" that does not link each of its projects (its page, its docs, or a
post about it), a `TODO`, or a slug a post already has, since the two would
share one evidence pack. The evidence gate applies as it does to a post:
`npm run evidence -- <slug>` reads the method, and every figure it states needs
a row. A `lastReviewed` older than 180 days is a warning to me and nothing
more: the page prints the date, never an age, because ADR 0002's objection to a
site that renders its own staleness stands.

Rejected: a fourth post `kind`, which would put a living page in the feeds with
a publication date it does not have, under rules that allow only corrections;
entries in `lib/site.ts`, which have no room for four sections and their links;
and one long "How I work" page, which is the manifesto again, with nothing for
a post to link to and one review date for every rule.

The cost accepted: a third kind of content, with its own directory, loader,
validator rules and two routes, at a budget of about two hours a week (ADR
0001). Two projects is a low bar that a coincidence can clear; the review, not
the validator, decides whether two projects really do the same thing. And as
with the docs route (ADR 0006), `/methods/<slug>/` generates no page without a
method, which a static export refuses, so while the route exists at least one
method must.

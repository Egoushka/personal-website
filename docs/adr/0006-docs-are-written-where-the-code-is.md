# Docs are written where the code is, and copied here at a commit

Status: accepted

A project on this site can have docs: what the tool does, how to run it, and how
we know each part works. They are written in the tool's own repository — the
chargehand guide lives in `docs/guide/` of chargehand — and this site renders a
copy at `/projects/<project>/docs/`. They are never written here.

Why: this site's own copy about its projects has had to be corrected three times,
and docs written beside a project instead of beside its code drift the day they
are written: nothing makes a change to the code also change a page in another
repository. Written in the tool's repository, the docs change in the pull request
that changes the tool, under that repository's review and hooks. And at about two
hours a week (ADR 0001), a second place to maintain the same facts is a place that
goes stale.

How:

- `npm run docs:pull -- <project> [ref]` resolves the ref to a commit, copies the
  docs directory's markdown into `content/docs/<project>/`, and records the repo,
  path, ref, commit and date in `content/docs/sources.json`. The docs directory is
  flat and markdown only.
- The build reads only the copy, so it stays offline and a build is a function of
  this repository. Links from the docs to other files in the tool's repository go to
  GitHub **at the pinned commit**, never to a branch, so they show what the docs were
  written against.
- `npm run docs:verify`, in CI, fails when the copy differs from its commit by a
  byte, and when a link into the tool's repository names a file or heading that does
  not exist at that commit. `npm run validate` checks, offline, each page's
  frontmatter and the links between pages.
- Every docs page says which commit it is a copy of, and when it was pulled.
- One route, `app/projects/[slug]/docs/[[...page]]`, renders every page. With
  `output: "export"` a route that generates no pages fails the build, so while that
  route exists at least one project must have docs.

The cost accepted: a release of the tool does not update its docs here until
someone pulls, so the site can show docs one commit behind. It says which commit,
and that is the point — docs that do not say which version they describe are the
docs nobody trusts. Editing the copy here is never the fix; verify fails on it.

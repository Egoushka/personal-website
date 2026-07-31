# Content stays in git; the CMS edits files

Status: accepted

A CMS is required — hand-editing markdown and typed TypeScript exports is not the
authoring experience the owner wants. A database-backed CMS (Directus, Payload, Sanity)
was the obvious answer and was rejected, because it moves content out of the repository
and that kills three working things: the `post` and `review-post` skills, which write
and critique markdown in `content/drafts/`, and `npm run validate`, the frontmatter and
internal-link gate that runs in CI on every push.

So: content remains markdown and typed exports **in the repository**, and the CMS is a
git-based one that reads and writes those same files through the GitHub API or the
local filesystem. There is no database, no admin login exposed on the internet, and no
runtime — the site stays statically exported, so [ADR 0001](./0001-the-site-is-never-the-app.md) holds unchanged.

The cost accepted is that the authoring UI is bounded by what a git-based CMS can do:
no server-side validation, no workflow states beyond `content/drafts/` versus
`content/posts/`, and saves are commits, so they are slower than a database write. In
exchange every edit stays diffable, reviewable in a pull request, and recoverable from
git history — and the site cannot be taken down by the CMS being down.

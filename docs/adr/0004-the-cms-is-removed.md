# The CMS is removed

Status: accepted. Supersedes [ADR 0003](./0003-content-stays-in-git-the-cms-edits-files.md).

ADR 0003 kept content in git and added Sveltia CMS at `/admin/` to edit it. The first
half stands; the CMS goes. It was a 2.2 MB vendored bundle served from this origin, a
fine-grained GitHub token with write access held in a browser's localStorage, and a
second copy of the validator's rules in `public/admin/config.yml` that every new topic
had to be added to by hand. It was not used enough to be worth any of that.

Content stays in git, as markdown and typed exports. Authoring is an editor plus the
`/post` skill, which writes to `content/drafts/`. From a phone, edits go through
GitHub's web editor as a pull request against `content/drafts/`. `npm run validate` in
CI remains the gate, and moving a draft into `content/posts/` remains a deliberate,
reviewed act.

What went: `public/admin/`, the `cms:vendor` build step, the `@sveltia/cms` dependency,
the `/admin/` Caddyfile matcher and its `robots.txt` line. The CSP did not change.

The cost accepted is that there is no form-based editor; every change is a text edit
and a commit. [ADR 0001](./0001-the-site-is-never-the-app.md) holds unchanged.

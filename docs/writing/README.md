# The post framework

How a post on hrabovskyi.online gets written, checked and shipped. It exists
because this site's copy has had to be corrected three times, and a post is the
one thing here that never expires (ADR 0002): what ships is what stays. Most of
it is enforced — by `npm run validate`, `npm run evidence` and the `/post` and
`/review-post` skills — and the rest is what `/review-post` reads for.

## Three kinds of page

| | What it is | Where | Changes |
|---|---|---|---|
| **Post** | A dated story with a finding | `/writing/<slug>/` | Only by correction (`updated` + `correction`) |
| **Docs** | How to use one tool, versioned with it | `/projects/<slug>/docs/` | With each release of the tool |
| **Methods** | How I work, where two or more projects do it the same way | `/methods/<slug>/` | Kept current, dated "last reviewed" |

Docs are written in the tool's own repository and the site renders a copy at a
pinned commit ([ADR 0006](../adr/0006-docs-are-written-where-the-code-is.md)), so
they cannot drift from the code. Writing them, mind the phone: a table cell over 60
characters turns the table into stacked cards below 700px, so a table is for short
facts and a paragraph of evidence belongs in prose (`lib/tables.ts`). Methods are planned, not built; a lesson becomes
a Method once it has repeated in a second project, not before. A post never explains how to use a tool — it links
the docs — and a post never restates a Method; it tells the story that made one.

## A post starts as one sentence

Before any prose: the thesis, one sentence, in the evidence pack's `Thesis:`
line. If it takes two sentences it is two posts. If it has no number or no
surprise in it, it is not a post yet.

## Kinds

Every post declares one in its frontmatter (`kind:`), and the kind decides its
shape and what the review asks of it. Each has a skeleton in
[`templates/`](templates/); `npm run new -- <kind> <slug>` starts a draft from it.

**`finding`** — a measured result is the point. It opens on the number and on why
it should not be true, shows how it was counted well enough to repeat, says what
the number means and what it changed. Examples: [attest](../../content/posts/attest.md),
[chronicle](../../content/posts/chronicle.md), [synapse](../../content/posts/synapse.md).

**`incident`** — something broke. It opens on the moment it was found and the
damage in one line, then what should have happened, what happened instead, and
above all **why nothing showed it**: that is the part a reader takes home. It ends
on what I got wrong. Examples: [silent-deploys](../../content/posts/silent-deploys.md),
[dns-is-not-access-control](../../content/posts/dns-is-not-access-control.md).

**`build`** — why a thing I built is shaped the way it is. This is how a tool is
introduced on this site: never "Introducing X", always the question it exists to
answer or the thing it refuses to do. The problem, measured; the shape of it; the
decisions that cost something, each with what was rejected and the price; and what
exists and what does not. The how-to is its docs' job. Examples:
[oura-platform](../../content/posts/oura-platform.md), [homelab](../../content/posts/homelab.md).

**`note`** — one finding, short on purpose: 300–700 words, where `/post` asks
1,000–1,800 of the other kinds, so a gotcha or a number that should not be true
ships without padding. It opens on the number or the surprise, shows the evidence
— the command and its real output, or the file at its commit — and ends on what it
does not tell you, in a paragraph or one short section. It owes the same evidence
pack and validator as any post; past 800 words the validator warns that it has
outgrown the kind. No `##` heading, or one over that last part: two draw a
contents list. Lists and feeds label it "Note", [`/notes/`](../../app/notes/page.tsx)
lists the notes alone, and its address is `/writing/<slug>/` like every post
([ADR 0009](../adr/0009-a-note-is-a-short-post.md)).

Every kind ends by saying what it does not know or has not built — "What it does
not tell you", "What I have not solved", "What I got wrong". It is what makes the
rest believable, and a reader who can check will look for it.

`project:` names the project in `lib/site.ts` a post is about, when it is about
one. It is the one field that ties a post to a project — `writeup` in
`lib/site.ts` only picks which post leads — so a project's write-up must name that
project, and the validator fails it otherwise.

## The evidence pack

`content/drafts/<slug>.evidence.md`: the thesis, and every figure the post states
with where it came from. Local only — `content/drafts/` is gitignored, because a
source may name a private repo.

Drafts and packs live in the main checkout's `content/drafts/`, whichever
worktree runs `new`, `evidence` or `validate` (`lib/drafts.mjs`). Removing a
worktree deletes its ignored files without a word, and a pack has to outlive
the branch that used it: a correction starts from the pack, months after the
post ships. Because every draft in flight is in that one folder,
`npm run validate -- --draft <slug>` checks one; `--drafts` checks them all.

```md
Thesis: Chronicle's semantic search lost to grep before it tied.

| Claim | Value | Source |
|---|---|---|
| first eval run, 37 questions | 48.2% vs 62.8% | chronicle-archive@89b4e20, CLAUDE.md |
| after the recall fixes | 63.5% vs 62.8% | Egoushka/chronicle@741dbb1:README.md#L157-158 |
| the margin it tied by | 0.7 points | = 63.5 - 62.8 |
```

- `npm run evidence -- <slug> --init` starts a pack; run on an existing post, it
  writes a row per figure the post states, every source a TODO.
- `npm run evidence -- <slug>` fails on a figure in the title, description or
  prose that no row covers, on a row whose source is empty or a TODO, and on a
  missing thesis. It warns on a figure in the pack the post no longer states.
- `npm run evidence -- <slug> --verify` does that, then opens every source a
  machine can open and checks the row's Value against it. Each row reports `ok`,
  `MISSING <number>`, `DERIVED MISMATCH`, `FETCH FAILED <reason>` or
  `skipped (not machine-checkable)`; any but the last fails it. A draft is not
  ready until it passes.
- A source is something a stranger could check with access: a commit, a file at
  a commit, a URL, a command and its output. "I remember" is not one.
- The script reads digits. A number written as a word ("fifty-one"), a quoted
  error string and a claim about a person are claims too, and the review reads
  those.

`--verify` opens two kinds of source. **A file at a commit** is written
`owner/repo@<sha>:path`, anywhere in the Source cell: a 7 to 40 character sha, then
optionally `#L12` or `#L12-40`. Every number in the Value must be in that file, or
in those lines, as a whole number: `681,331` is `681331`, `−0.021` is `-0.021` and
`0.950` is `0.95`; a `$`, `%`, `×` or unit is not part of a number, and there is no
`5` in `0.5`. A public repository is read from raw.githubusercontent.com, without a
token. A private one is read from its clone, named in `content/drafts/.evidence-repos.json`,
which is gitignored with the drafts and, like them, sits in the main checkout, so every
worktree reads the same one:

```json
{ "Egoushka/chronicle": "/absolute/path/to/its/clone" }
```

**A derived figure**, a ratio or difference the post works out, gets a row whose
Source is its formula: `=`, then arithmetic over literal numbers — digits, `.`,
`+ - * /`, parentheses and spaces, nothing else. Its operands have rows of their
own, from the same run, sample or question set. The formula must give the Value's
first number to the decimal places the Value writes: `1.28×` takes
`= 0.257 / 0.201`, and `28%` takes `= (0.257 / 0.201 - 1) * 100`.

Every other source is listed as skipped. A commit message, a URL or a command's
output is still a source; a reader checks it, and `/review-post` does.

## Readings

A project page's "By the numbers" is the project's `readings` in `lib/site.ts`, and
every reading names its source. When the source is a file in a public repository,
the reading carries it as `ref` too, in the same syntax and on the reading's own
line:

```ts
{ label: "Archive", value: "681,331 messages · 487 chats", source: "counted, not sampled", ref: "Egoushka/chronicle@741dbb1:README.md#L16" },
```

`npm run validate` fails a malformed ref. `npm run readings` opens every ref and
fails where the value's numbers are not in it. `npm run readings -- --latest` also
follows the lines each ref names to the repository's default branch, and warns
`DRIFT` where a number is no longer in them: the reading still holds at its commit,
but the page may have gone stale. Change the value and the ref together. Like
`--verify`, it reads the network or a clone, so the build never runs it.

## Titles, descriptions, headings

- The title states the finding, in sentence case: a number, or a surprise. Never
  "Introducing", never a question the post then answers.
- The description is at most 160 characters, reads as a feed summary on its own,
  and carries the searchable phrasing when the title is stylistic.
- `##` headings become the table of contents once there are two. The skeletons'
  headings are prompts: rename each to what its section actually says. A note's
  skeleton has none.

## Voice

Read [homelab](../../content/posts/homelab.md) and
[silent-deploys](../../content/posts/silent-deploys.md) first; they are the
reference, not this list.

- First person, past tense, specific: "I went to add a security header and found…",
  never "Developers often encounter…".
- A real thing that happened, with real numbers, output and file paths. A story
  with a lesson, not a tutorial.
- The lesson is earned at the end, not announced at the start. No "In this post".
- Short paragraphs. Lists only for what is genuinely a list.
- Admit what was hard or embarrassing. "It still took fifty-one days to notice" is
  the strongest line on the site because it costs something.

## Never

- **Invent a detail.** A gap stays a `TODO:`; the validator fails a published post
  that still has one.
- **Write about the current employer's internals.** A post that named an internal
  job and its blast radius was taken down for exactly that.
- **Leak a private term.** The hooks and CI's `secrets` job block the ones in
  `.private-terms`; a pull request is public the moment it opens, drafts included.

## From draft to live

1. `npm run new -- <kind> <slug>` — the draft from its skeleton, and an empty pack.
2. Fill the pack first: the thesis, then every figure with its source.
3. Write the draft (`/post` does this with you), renaming every skeleton heading
   and replacing every `TODO:`.
4. `npm run evidence -- <slug> --verify` and `npm run validate -- --draft <slug>`
   until neither reports an error.
5. `/review-post`, in a fresh session or by an agent that did not write the draft,
   then a voice pass with `stop-slop`.
6. Move the file to `content/posts/` on a branch and open a pull request: CI runs
   every gate, and prelive publishes a preview on the tailnet.
7. Merge. The deploy is the merge.
8. If the post changes what a project page says, change `lib/site.ts` in the same
   pull request.
9. A LinkedIn version with `linkedin-post`, from the same pack, linking the post.

## Several posts at once

For posts whose thesis, kind, project and topics are already agreed, each with a
brief in `content/drafts/prompts/`, the saved workflow
[`post-batch`](../../.claude/workflows/post-batch.js) does steps 1 to 5 above, all
but the voice pass, in one command from a Claude Code session in the main checkout:

```js
Workflow({ name: "post-batch", args: [
  { brief: "07-my-finding.md", slug: "my-finding", kind: "finding",
    project: "chronicle", topics: ["postgres"], thesis: "The one sentence already agreed." },
] })
```

`project` is `null` for a post about no project; bad args stop the run before any
agent starts. Each post gets up to three agents, and its review starts as soon as
its own draft is done. An author sets up the worktree as the brief says, fills the
pack first, writes the draft and runs the checks. A reviewer that did not write it
applies `/review-post`, traces every derived figure to its formula and every claim
the evidence script cannot read to the pack, looks for anything private, and edits
nothing. A fixer applies only the must-fix findings: a claim it cannot source
becomes a `TODO:` or is cut. Each post comes back as a report: paths, check output,
the `TODO:`s left, the claims to confirm, the review and what was fixed, and a
publish or not-yet verdict with its reason.

It cannot ask anything mid-run, which is why it is only for agreed posts: what only
I know stays a `TODO:` or a question in the report, and a post still being agreed
starts with `/post`. Nothing is committed, pushed or moved to `content/posts/`; the
voice pass and steps 6 to 9 stay mine.

## Frontmatter

```md
---
title: "Sentence case, the finding, ideally with its number"
date: "YYYY-MM-DD"
description: "At most 160 characters: the meta description and the feed summary"
kind: finding            # finding | incident | build | note
project: "chronicle"     # a slug from lib/site.ts, when the post is about one
topics: ["retrieval"]    # lib/topics.ts only; a new topic is added there, on purpose
---
```

Optional, and only when true: `spanDays` (how many days the piece is about),
`updated` with an optional `correction` (a factual change to a published post,
never a rewording), and `cyrillic: "uk"` or `"ru"` when the title or prose has
Cyrillic words. The slug is the filename, lowercase kebab-case; it becomes the URL
and never changes once published.

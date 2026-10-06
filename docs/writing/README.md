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
facts and a paragraph of evidence belongs in prose (`lib/tables.ts`). A lesson becomes
a Method once it has repeated in a second project, not before ([Methods](#methods), below). A post never explains how to use a tool — it links
the docs — and a post never restates a Method; it tells the story that made one.

## Methods

A method is how I work, earned by two or more projects doing the same thing
([ADR 0008](../adr/0008-methods-are-earned-by-two-projects.md)). It lives in
`content/methods/<slug>.md`, tracked, and renders at `/methods/<slug>/`;
`/methods/` lists them, the one more projects follow first, and `/about/` links
there as "How I work". It is not a post: no date, no kind, no comments, not in
the feeds. It is kept current, and `lastReviewed` says when it was last checked
against its projects.

```md
---
title: "A check that can fail silently eventually will"   # the rule: an imperative or a plain claim
description: "At most 160 characters"
lastReviewed: "YYYY-MM-DD"
projects: ["homelab-gitops", "chronicle"]   # two or more slugs from lib/site.ts
posts: ["silent-deploys"]                  # published posts that tell its stories; [] when none does yet
topics: ["ci-cd"]                           # lib/topics.ts only
---
```

The body is four `##` sections, in this order, each renamed to what it says:

1. **The rule**, in one paragraph.
2. **Where it came from**: one short paragraph per project, each linking the
   post, docs page or project page that shows it. A method never retells a
   post; it links it.
3. **What it costs.** Every method has a price; name it.
4. **When I break it**: the honesty section, like a post's last section.

`npm run validate` fails a method with fewer than two projects, a project slug
that is not in `lib/site.ts`, a `posts` slug with no `content/posts/` file, a
body that is not four sections with prose in each, a "where it came from" that
does not link one of its projects (its page, its docs, or a published post
about it), a `TODO`, or a slug a post already has. It warns when `lastReviewed`
is more than 180 days old; the page prints the date, never an age (ADR 0002).

The evidence gate applies as it does to a post: every figure a method states
needs a row in `content/drafts/<slug>.evidence.md`, and
`npm run evidence -- <slug>` reads `content/methods/<slug>.md` when no draft or
post has that slug.

`projects` is the one field that ties a method to a project: a project's page
lists the methods that name it, and a post in `posts` ends with one line
linking the method.

## A post starts as one sentence

Before any prose: the thesis, one sentence, in the evidence pack's `Thesis:`
line. If it takes two sentences it is two posts. If it has no number or no
surprise in it, it is not a post yet.

## Kinds

Every post declares one in its frontmatter (`kind:`), and the kind decides its
shape and what the review asks of it. Every kind opens on a moment and puts its
checkable detail in a closing `## Receipts` (see
[What makes a post readable](#what-makes-a-post-readable)). Each has a skeleton in
[`templates/`](templates/); `npm run new -- <kind> <slug>` starts a draft from it.

**`finding`** — a measured result is the point. It opens on the moment I looked
at it and what I expected, gives the number early after that and why it should not
be true, tells what I did about it in the order it happened, says what the number
means and what it changed. How it was counted, well enough to repeat, is in Receipts. Examples: [attest](../../content/posts/attest.md),
[chronicle](../../content/posts/chronicle.md), [synapse](../../content/posts/synapse.md).

**`incident`** — something broke. It opens on the moment it was found, then what I
did next and why that was not enough, the damage in one line, what should have
happened, what happened instead, and above all **why nothing showed it**: that is
the part a reader takes home. It ends on what I got wrong, then Receipts. Examples: [silent-deploys](../../content/posts/silent-deploys.md),
[dns-is-not-access-control](../../content/posts/dns-is-not-access-control.md).

**`build`** — why a thing I built is shaped the way it is. This is how a tool is
introduced on this site: never "Introducing X", always the question it exists to
answer or the thing it refuses to do. It may open on the moment that made it worth building. The problem, measured; the shape of it; the
decisions that cost something, each with what was rejected and the price; and what
exists and what does not. The how-to is its docs' job. Examples:
[oura-platform](../../content/posts/oura-platform.md), [homelab](../../content/posts/homelab.md).

**`note`** — one finding, short on purpose: 300–700 words, where `/post` asks
1,000–1,800 of the other kinds, so a gotcha or a number that should not be true
ships without padding. It opens on the number or the surprise, with what I expected beside it, shows the evidence
— the command and its real output, or the file at its commit — and ends on what it
does not tell you, in a paragraph or one short section. It owes the same evidence
pack and validator as any post; past 800 words the validator warns that it has
outgrown the kind. No `##` heading, or one over that last part: two draw a
contents list. Lists and feeds label it "Note", [`/notes/`](../../app/notes/page.tsx)
lists the notes alone, and its address is `/writing/<slug>/` like every post
([ADR 0009](../adr/0009-a-note-is-a-short-post.md)).

Every kind ends its story by saying what it does not know or has not built — "What
it does not tell you", "What I have not solved", "What I got wrong" — and then
lists its receipts. It is what makes the rest believable, and a reader who can
check will look for it. A note has no Receipts section: its evidence is the body.

`project:` names the project in `lib/site.ts` a post is about, when it is about
one. It is the one field that ties a post to a project — `writeup` in
`lib/site.ts` only picks which post leads — so a project's write-up must name that
project, and the validator fails it otherwise.

## What makes a post readable

The complaint that started this: a post read as a report, so it got scrolled, not
read. A post is a story a reader outside the field can follow, and the evidence
sits behind it.

- **The moment first.** Open on what was in front of me, what I expected, what I
  was about to do and what made me stop and look. Not a number, not a definition.
- **Discoveries in order.** Each one makes the previous plan not enough. The reader
  learns things when I did.
- **Plain words for the first two-thirds.** A reader who has never used the tool
  can follow the story. Jargon, flags and output belong to the last third or to
  Receipts.
- **What I expected and what I did about it.** A result without the expectation it
  broke, and the move I made next, is just a result.
- **Receipts at the end.** A closing `## Receipts`: one line per figure, the figure
  and then the command, or the file at its commit. Checkable detail there is not
  in the way of the story.
- **Only what happened.** A scene, feeling or motive comes from the evidence pack
  or from what Yehor said when `/post` interviewed him; a gap stays a `TODO:`.

Length is 700–1,100 words, receipts included, and one table at most. A figure is not
a table and is not counted as one, and its JSON is not counted as words. The
validator warns under 300 words, and past 800 for a note.

## Figures

A post may carry a chart, a diagram and images, drawn and animated by the site
([ADR 0010](../adr/0010-posts-may-carry-interactive-figures.md)). A figure is one
fenced block with one JSON object in it, so in any other markdown renderer it is
code and the post still reads. The validator checks every block before a build;
`npm run validate` names the body line and the field.

**When to use one.** When the reader should compare or follow, and prose makes them
hold it in their head: four scores against four, a request that crosses three
services. Not to decorate, and not for a table of one row. A figure repeats what the
text says and adds the shape; it never carries a claim the text does not. Every
number in a chart is a figure the post states, so it needs a source in the evidence
pack like any other (`npm run evidence` reads the blocks too). Numbers come from a
cited source, never from memory or a model.

**A chart.**

````md
```chart
{
  "type": "bar",
  "title": "Recall by segment size",
  "x": { "label": "Events per segment" },
  "y": { "label": "Recall", "unit": "%" },
  "series": [
    { "name": "chronicle", "points": [["15", 73.2], ["20", 71.6], ["30", 71.1]] }
  ],
  "caption": "Swept on 46 eval threads.",
  "source": "Egoushka/chronicle@3f2a1b9:docs/eval.md#L10-L18"
}
```
````

`type` is `bar` or `line`. `title` (at most 80 characters) and `caption` (at most
200) are plain text and required; the caption says what the reader should take from
it. `y.unit` is `%`, `ms`, `s`, `$`, `x` or left out. `series` holds 1 to 4 series
of 2 to 24 `[x label, value]` points: x labels are strings of at most 24
characters, unique within a series, and values are finite numbers (a bar chart
cannot go below zero, and its axis starts there). `source` is optional and takes the
form of an evidence source, `owner/repo@sha:path#L1-L9`; the page links it. More
than one series gets a legend that toggles them.

**A diagram.**

````md
```diagram
{
  "title": "How a run is checked",
  "direction": "right",
  "nodes": [
    { "id": "worker", "label": "Worker", "kind": "service" },
    { "id": "judge", "label": "Support judge", "kind": "step" }
  ],
  "edges": [ { "from": "worker", "to": "judge", "label": "claims" } ],
  "caption": "Each claim is judged against the text it cites."
}
```
````

`direction` is `right` or `down`. 2 to 24 nodes, each with a unique `id` of
lowercase letters, digits and hyphens, a `label` (at most 32 characters) and a
`kind`: `service`, `store`, `external`, `user` or `step`, each drawn as its own shape.
An edge joins two ids (never a node to itself) and may carry a `label` of at most 30
characters. The site lays the diagram out; it takes no coordinates.

**An image.** Standard markdown, `![alt text](/img/<name>.png "Caption")`. The alt
text is required and says what the image shows or proves. The title becomes the
caption. `/img/<name>.png` is the name of a file in `assets/images/` (`.png`, `.jpg`
or `.jpeg`), which `npm run images` optimizes and sizes so the page does not shift;
an address anywhere else would be blocked by the CSP.

**Rules for all of them.** JSON only: no comments, and an unknown key is an error.
Every figure has a text alternative the site writes itself, a chart's data table and a
diagram's list of connections, under the figure and in the feeds. Feeds carry that
and the caption, never a script. Figures are for posts; a project's docs are copied
from its repository and keep to code, tables and callouts.

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
- Short paragraphs. Lists only for what is genuinely a list; Receipts is one.
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
3. Write the draft (`/post` does this with you, after interviewing me for the
   moment), renaming every skeleton heading and replacing every `TODO:`.
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
I know, above all the moment the post opens on, stays a `TODO:` and its interview questions go in the report, and a post still being agreed
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

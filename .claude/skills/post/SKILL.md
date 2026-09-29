---
name: post
description: Draft a new blog post for hrabovskyi.online into content/drafts/, following the post framework in docs/writing/README.md — a kind, a thesis and an evidence pack before any prose. Use when the user wants to write, draft, or start a post. Never writes to content/posts/ — publishing is a separate, reviewed step.
---

# Draft a post

The rules live in [docs/writing/README.md](../../../docs/writing/README.md). Read it
first, every time; this file is the procedure, not the rules. Write to
`content/drafts/`, **never** `content/posts/` — moving a file there is the user's
decision, not yours.

## 1. Agree the post before writing it

Settle three things with the user and say each back in one line:

- **The thesis**, in one sentence. If it takes two, propose two posts.
- **The kind**: `finding`, `incident`, `build` or `note`. The README says what each
  owes. One finding that would have to be padded to reach a post's length is a `note`.
- **The project**: a slug from `lib/site.ts`, or none.

A post that introduces a tool is a `build` post that opens on the question the tool
answers or the thing it refuses to do — never "Introducing X". How to use the tool
is its docs' job.

## 2. Start it

```bash
npm run new -- <kind> <slug>
```

That writes `content/drafts/<slug>.md` from the kind's skeleton, dated today, and an
empty evidence pack beside it. The slug becomes the URL and never changes once
published.

## 3. The evidence pack, before the prose

Fill `content/drafts/<slug>.evidence.md`: the `Thesis:` line, then one row for every
figure the post will state, each with a source a stranger could check with access —
a commit, a file at a commit, a URL, a command and its output. Read every source
yourself. Ask the user for what only they know and record the answer as its source
("Yehor, 2026-09-29"). A figure without a source does not go in the post.

## 4. Write the draft

- Read `content/posts/homelab.md` and `content/posts/silent-deploys.md` for the voice.
- Rename every skeleton heading to what its section says; replace every `TODO:`.
- Keep the kind's last section: what it does not tell you, has not built, or got wrong.
- Topics from `lib/topics.ts` only. A genuinely new topic is added there with a
  `name`, `kind` and `blurb` like its neighbours, and you say so.
- At least one internal link with a trailing slash; 1,000–1,800 words, or 300–700
  for a `note`, whose skeleton has no headings (it may take one, over its last part).
- No `# heading` in the body: the page renders the title as the `<h1>`.
- Cyrillic words need `cyrillic: "uk"` or `"ru"`. Ask which; `ок` and `ага` are both.

## Hard rules

- **Never invent a detail.** A number, error message or timeline you do not have
  stays a `TODO:` and goes in your summary. A fabricated specific is worse than an
  admitted gap: the site is read by people who can check, and the validator fails a
  published post that still has a `TODO`.
- **Nothing about the current employer's internal systems.** A post that named an
  internal job and its blast radius was taken down for exactly that.

## 5. Check it

```bash
npm run evidence -- <slug>
npm run validate -- --draft <slug>
```

Neither may report an error. Warnings about length or links are the user's call.

## Finish by

Telling the user plainly which claims came from sources you read, which are still
`TODO:`, and which you inferred and they must verify. Then suggest `/review-post`.

---
name: post
description: Draft a new blog post for hrabovskyi.online into content/drafts/. Use when the user wants to write, draft, or start a post. Never writes to content/posts/ — publishing is a separate, reviewed step.
---

# Draft a post

Write to `content/drafts/<slug>.md`. **Never** `content/posts/` — that directory is
published output, and moving a file into it is the user's decision, not yours.

## Before writing

Read both published posts first. They are the voice reference, not this file:

- `content/posts/homelab.md`
- `content/posts/silent-deploys.md`

Then read `lib/tags.ts`. Tags are a closed vocabulary; `npm run validate` fails on
anything outside it. If the post genuinely needs a new tag, add it there with a
`label` and `description` and say so — don't quietly invent one.

## The voice, from those two posts

- **First person, past tense, specific.** "I went to add a security header and found…"
  not "Developers often encounter…".
- **A real thing that happened**, with real numbers, real command output, real file
  paths. Both existing posts are war stories with a lesson, not tutorials.
- **The lesson is earned at the end**, not announced at the start. No "In this post
  we will explore".
- **Short paragraphs.** Em dashes. No bullet-point padding; lists only for things
  that are genuinely a list.
- **Admits what was hard or embarrassing.** "it still took fifty-one days to notice"
  is the strongest line in that post because it costs something.

## Frontmatter

```md
---
title: "Sentence-case, specific, ideally with a number or a surprise"
date: "YYYY-MM-DD"
description: "≤160 chars — this is the meta description AND the feed summary"
tags: ["from lib/tags.ts only"]
---
```

Slug = filename, lowercase kebab-case. It becomes the URL and cannot change later
without breaking links.

## Hard rules

- **Never invent detail.** If you don't know the real error message, the real
  number, or the real timeline, leave a `TODO:` marker and say so in your summary.
  A fabricated specific is worse than an admitted gap — this site is read by people
  who can check.
- **Do not write about the current employer's internal systems.** A post naming an
  internal job class and an incident's blast radius was removed from this site for
  exactly that reason.
- No `# heading` in the body — the page renders an `<h1>` from the title.
- At least one internal link (`/posts/…/`, `/uses/`, `/about/`), with a trailing
  slash. `npm run validate` warns without one.
- Aim 1,000–1,800 words. Under 300 the validator warns.

## Finish by

1. Running `npm run validate` — it checks drafts too once they move, but run it to
   catch frontmatter shape early.
2. Telling the user, plainly: what you invented nothing about, what is a `TODO:`,
   and which claims they need to verify because you inferred them.

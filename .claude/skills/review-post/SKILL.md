---
name: review-post
description: Critique a draft or published post before it ships — evidence, what its kind owes, voice, SEO, accessibility — against the post framework in docs/writing/README.md. Use when the user asks to review, check, or improve a post.
---

# Review a post

Adversarial read. The goal is to find what is wrong, not to praise.

Report findings as a list, most serious first. If something is genuinely fine, say
so in one line and move on — don't pad.

## 1. Factual risk — highest priority

Run `npm run evidence -- <slug> --verify` first and report its result: the summary
lines, every MISSING, DERIVED MISMATCH and FETCH FAILED row, and how many rows it
skipped. A post with no pack has had no fact check: say so before anything else, and
offer `npm run evidence -- <slug> --init`, which writes a row per figure to source.
The script reads digits only, and opens only `owner/repo@<sha>:path` sources and `=`
formulas; the skipped rows are yours to check by hand.

- **Any specific that could be checked and found false.** Numbers, dates, error
  strings, command output, repo contents, employer names.
- **Derived figures.** Every ratio, difference or percentage the post works out
  states its formula in the pack, and both operands come from the same run, sample
  or question set. Two numbers from different runs are a new claim, not arithmetic.
- **What the script cannot see.** Sweep the numbers written as words, the quoted
  strings, the claims about a person, and every "every", "never", "always" and "all"
  against the pack. Each needs a row that bears it out, or it goes.
- Claims about the author's own history. This site has already shipped two of
  these wrong: an experience section whose employer name and dates disagreed
  with LinkedIn, and project blurbs
  describing a "Jira tool" whose repo contains a `.gitignore` and nothing else.
- Anything about the current employer's internals. Flag it hard.

For each: quote the line, say what would falsify it, and say how to check.

## 2. What its kind owes

The `kind` in the frontmatter says what the post promised (docs/writing/README.md):

- **finding**: the number within the first two paragraphs; the method told well
  enough to repeat; what the number changed.
- **incident**: the moment it was found; the root cause with real output; **why
  nothing showed it**; the fix and how it is known to hold; what I got wrong.
- **build**: opens on the question the thing answers or what it refuses to do, not
  its name; each decision with what was rejected and the price; what exists and what
  does not. It links docs rather than explaining how to use the tool.
- **every kind** ends on what it does not know or has not built, and names its
  `project` when it is about one.

## 3. Voice

Compare against `content/posts/homelab.md` and `content/posts/silent-deploys.md`.
Flag: passive constructions, "In this post we will", tutorial register, hedging,
bullet lists standing in for prose, a lesson stated before it was earned.

## 4. Structure and SEO

- Title: specific, ideally a number or a surprise. Searchable phrasing in the
  `description` even when the title is stylistic.
- `description` ≤ 160 chars and readable as a standalone feed summary.
- `##` headings that would make a useful table of contents — they become one.
- At least one internal link with a trailing slash.
- Topics from `lib/topics.ts` only.
- `updated` / `correction` only for a factual change to a published post, never for
  rewording; `correction` requires `updated`, and neither belongs on a draft.

## 5. Accessibility

- Every image has meaningful `alt` (or `alt=""` if genuinely decorative).
- Code blocks carry a language so Shiki highlights them and the block gets a header —
  and the language is one `lib/highlight.ts` loads (bash, yaml, json, csharp,
  typescript, sql), or it silently renders as plain text.
- No "click here" link text.
- Cyrillic words carry `cyrillic: "uk"` or `"ru"` in the frontmatter, and it is the
  right one — `npm run validate` only checks that it exists.

## Finish by

Running `npm run validate` — with `-- --drafts` for a draft — and reporting the
actual output. Then state clearly whether you would publish it as-is.

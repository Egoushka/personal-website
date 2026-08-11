---
name: review-post
description: Critique a draft or published post before it ships — voice, factual risk, SEO, accessibility. Use when the user asks to review, check, or improve a post.
---

# Review a post

Adversarial read. The goal is to find what is wrong, not to praise.

Report findings as a list, most serious first. If something is genuinely fine, say
so in one line and move on — don't pad.

## 1. Factual risk — highest priority

- **Any specific that could be checked and found false.** Numbers, dates, error
  strings, command output, repo contents, employer names.
- Claims about the author's own history. This site has already shipped two of
  these wrong: an experience section saying "2023 — present · Boerse Stuttgart Digital" when
  LinkedIn showed a different employer *and* different dates, and project blurbs
  describing a "Jira tool" whose repo contains a `.gitignore` and nothing else.
- Anything about the current employer's internals. Flag it hard.

For each: quote the line, say what would falsify it, and say how to check.

## 2. Voice

Compare against `content/posts/homelab.md` and `content/posts/silent-deploys.md`.
Flag: passive constructions, "In this post we will", tutorial register, hedging,
bullet lists standing in for prose, a lesson stated before it was earned.

## 3. Structure and SEO

- Title: specific, ideally a number or a surprise. Searchable phrasing in the
  `description` even when the title is stylistic.
- `description` ≤ 160 chars and readable as a standalone feed summary.
- `##` headings that would make a useful table of contents — they become one.
- At least one internal link with a trailing slash.
- Topics from `lib/topics.ts` only.

## 4. Accessibility

- Every image has meaningful `alt` (or `alt=""` if genuinely decorative).
- Code blocks carry a language so Shiki highlights them — and the language is in
  `lib/highlight.ts`, or it silently renders as plain text.
- No "click here" link text.

## Finish by

Running `npm run validate` and reporting the actual output. Then state clearly
whether you would publish it as-is.

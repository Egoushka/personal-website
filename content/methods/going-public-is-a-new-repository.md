---
title: "Going public is a new repository, not a setting"
description: "A private repository keeps every old commit and pull request, and going public shows them all. Mine start over instead, and the old one stays private."
lastReviewed: "2026-09-29"
projects: ["oura-platform", "oura-mcp-app"]
posts: ["making-a-repo-public"]
topics: ["ci-cd", "infrastructure"]
---

## Publish a cleaned copy, not the old repository

A private repository remembers everything: every commit, every draft, every pull request, every old version of every file. Switching it to public shows all of that, not just today's files. So I do not switch it. I publish a cleaned copy as a new repository with a new history, and the old one stays private.

## Three repositories that started over

The first commit in the public [Oura Platform](/projects/oura-platform/) repository, dated 2026-09-28, is titled "chore: first public commit", and its message says it was published from a cleaned tree and that the development history stays private ([oldest commit](https://github.com/Egoushka/oura-platform/commit/97de07b)). The [Oura MCP App](/projects/oura-mcp-app/) repository begins the same way on the same day ([oldest commit](https://github.com/Egoushka/oura-mcp-app/commit/f759a06)).

This site's repository is the one that taught me. Rewriting it in place would have left 26 pull requests pointing at the old history, so it became a new repository too. [The story](/writing/making-a-repo-public/) is a post, and its [source](https://github.com/Egoushka/personal-website/blob/dceb85b36e604118c23e12866c4f4e7178536cb3/content/posts/making-a-repo-public.md?plain=1#L45-L47) has the count.

## The old history stays behind

The new repository has no past. Anyone reading the two Oura repositories sees a history that begins on 2026-09-28; what came before it stays in the private one. On this site the 26 pull requests stayed in the archive.

It is also work. The copy needs its own checks before the first push: every author address, a denylist run over every file and message, and a secret scanner over the history. The site's post lists them ([the checks](https://github.com/Egoushka/personal-website/blob/dceb85b36e604118c23e12866c4f4e7178536cb3/content/posts/making-a-repo-public.md?plain=1#L79)).

The cleaning is also only as good as its list. The site's post says the denylist finds what I thought to write a pattern for, and a private detail I never listed would pass ([the post](https://github.com/Egoushka/personal-website/blob/dceb85b36e604118c23e12866c4f4e7178536cb3/content/posts/making-a-repo-public.md?plain=1#L63-L64)).

## When I break it

The site's post ends on the condition: if the pull-request count is above zero and the history needs rewriting, I make a new repository. With no pull requests to leave behind, rewriting in place is an option; the checks above still apply.

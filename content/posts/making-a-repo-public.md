---
title: "Making this repo public would have published my server's address in 203 commits"
date: "2026-09-29"
description: "Flipping a private repo to public publishes its history, not just its head. Mine held my server's address in 203 of 219 commits. The fix was a new repository."
kind: incident
topics: ["ci-cd", "infrastructure"]
---

This site's private repository held my server's real address in 203 of its 219 commits. The count is one loop over the history: for every commit, does its tree contain the address? The files at the head did not. The loop prints a count, not the matches, so the address never reaches a terminal or a log.

```bash
# address.pat holds one line: the address, as a regex
$ for c in $(git rev-list main); do
    git grep -q -E -f address.pat "$c" && echo x
  done | wc -l
203
$ git rev-list --count main
219
```

203 out of 219 commits.

The same history carried my personal email address as the author of 166 of those commits, a draft I had not decided to publish, a post I had taken down, and thirty files of audit notes. A visibility toggle would have published all of it at once.

## What the switch would have published

A repository's visibility applies to everything in it. The head is what I look at every day; the history is what `git clone` downloads. Anyone who cloned the repo after the flip would have had every one of those 219 trees.

The address lived in four files for most of that time: the README, the deploy script and the deploy workflow in 203 commits each, and the preview workflow in 128. An audit plan quoted it in 114 more. It entered history on 2026-07-28, in a commit titled “Audit fixes … deploy repair”. It left the tree on 2026-09-27, when the box started pulling each build from a GitHub release instead of accepting an SSH push. So by the time of the rewrite, the head was clean of it. Any check that only read the files would have passed.

I ran the rest of the denylist the same way, one pattern at a time, printing only the pattern's line number and a count. Four of its 22 patterns matched. Beyond the address, one more term that only the deploy workflow used sat in it on 203 commits, and two more patterns matched every one of the 219.

The email was the smallest of these: it is on this site's contact line already.

## Why a private repo never showed it

A private repository has one reader. Everything in it is written for that reader, including the things that should never have a second one: the real address in a deploy script, a draft half-finished, an audit's working notes. Each was fine while I was the only reader. I could have changed the audience in one click without looking at the history at all.

Nothing in the private repository was looking, either. It had no denylist hook, no noreply check and no secret scan: all three arrived in the baseline commit of the public one. The denylist hook I added checks each new commit, and would never have read the 219 behind it.

## Why not force-push a cleaned history

The obvious fix is to rewrite the history in place and force-push. On GitHub that is not enough. GitHub's own page on [removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) lists where rewritten commits stay reachable, and one entry is "through any pull requests that reference them". Removing those references is a request to GitHub Support, not something the owner can do.

The old repository had 26 pull requests. Each one pins the commits it was opened with. A cleaned `main` in the same repository would have left 26 doors to the old history, public the moment the setting changed.

So I did not change the setting. The old repository became the archive: it keeps its 219 commits and its 26 pull requests, and it stays private. The public one is a new repository, created at 02:22 on 2026-09-29 (UTC+3), whose history was rewritten before its first push.

## What I rewrote, and what I refused to

The new history has 181 commits: 180 carried over from the archive and one new one on top, `chore(repo): the baseline for going public`. Thirty-nine commits did not make it across. Twenty-nine of them were the audit notes. The other ten were seven draft commits, a handoff document for picking the work up in a new session, and two merges. Across the whole history, 38 paths exist only in the archive: the 30 audit files, the handoff, six drafts and the taken-down post.

The commits that stayed kept their subjects and dates; the address was rewritten out of their trees, and my email out of their author and committer fields. The draft that was still in the tree left it, and `content/drafts/` became gitignored, which is why this post was drafted in a folder the repository cannot see.

What I refused to do was keep the old repository's URL. It would have been the easy path, and the one path that leaves 26 pull requests pointing at the old history.

The first deploy from the public repository ran on the baseline commit and succeeded. The box pulls the site from a release, not from the repository, so nothing on it had to change.

## Checking the new one

I can only call the new repository clean within a scope. On 2026-09-29, over all 194 commits the public repository had, the denylist matched zero trees and zero commit messages, and `git grep` never exited with an error. There are zero identities that are not a GitHub noreply address. `gitleaks` scanned 172 commits and found nothing.

The denylist finds what I thought to write a pattern for. A private detail I never listed would pass all four checks.

## The guard, and how it failed both ways

The guard that should catch the next leak is a denylist: a gitignored file of extended regexes, one per line, that a `pre-commit` hook runs over the whole index and a `commit-msg` hook runs over the message. It sits next to `gitleaks` and a noreply check on author and committer, and a CI job runs those two over the full history on every pull request. The repository also has secret scanning with push protection, a ruleset on the default branch, and private vulnerability reporting.

The same denylist runs in [chargehand](/projects/chargehand/)'s repository, and it had already failed open there. Its changelog says: a malformed pattern made `git grep` exit 128, "which the `pre-commit` hook read as 'no match' and let the commit through". A broken guard and a satisfied guard produced the same result, which is the [silent-deploys](/writing/silent-deploys/) bug again, one layer down. The fix landed at 01:30, fifty-two minutes before this repository was created, and this site's hook was written with the check from the start: exit 1 is no match, anything above 1 blocks the commit. A self-test builds a throwaway repository and asserts the hook blocks a malformed pattern.

By 05:02 the same morning it had failed the other way. A heading in chargehand's docs produced an anchor containing `ask-` followed by a long hyphenated run, and the pattern for API keys, `sk-[A-Za-z0-9_-]{16,}`, read it as one. The fix was to reword the heading. That is the right trade for a denylist: a false alarm costs one reworded line, a miss costs a published secret. It still cried wolf, and the hook's own error message has to tell me not to reach for `--no-verify`.

## What I got wrong

The address was in the history because I put it there to fix something, and I never went back once the fix stopped needing it. I kept it because the repository was private, and then the repository stopped being private.

I also trusted the head. The files at the head were clean for two days and the history was not, and I had not built a single check that read further back than the files.

The checks I would run next time, before touching the setting: every author and committer address, the denylist over every tree and every commit message with the matches counted rather than printed, `gitleaks` over the history, the drafts folder, and the count of pull requests. If that count is above zero and the history needs rewriting, I make a new repository.

[The last exposure I wrote about was through a DNS name](/writing/dns-is-not-access-control/). This one was through history, and the fix was a new repository, not a setting.

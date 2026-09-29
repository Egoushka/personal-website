---
title: "A check that can fail silently eventually will"
description: "In three of my projects, a check that never ran, or could not run, looked like one that passed. A check counts once I have watched it fail."
lastReviewed: "2026-09-29"
projects: ["homelab-gitops", "chronicle", "chargehand"]
posts: ["silent-deploys"]
topics: ["ci-cd", "debugging"]
---

## A check counts once I have watched it fail

A check that does not run looks, from outside, like a check that passed: nothing turns red. I trust a check once I have seen it fail. It tests the outcome I care about, such as the live page or the blocked commit. An error inside it counts as a failure. And a test breaks the thing on purpose and expects the check to go red, so the day the check can no longer fail, that test goes red.

## Three projects where failure looked like success

In my [homelab](/projects/homelab-gitops/), this site's deploy said success while nothing had deployed for fifty-one days: three separate bugs, and not one of them turned anything red ([the story](/writing/silent-deploys/)). Since then the deploy ends on the live site: it waits until the site names the new build, then tests it there.

In [Chronicle](/projects/chronicle/), the rule that stops a segment splitting when a reply points back into it never ran. The worker built every event with `reply_to_id=None`, so none of the 7.9% of messages that carry a reply ever reached it. Its list of hard-won facts has it in one line: "A rule with no caller looks exactly like a rule that works" ([fact 48](https://github.com/Egoushka/chronicle/blob/741dbb1f5ec6ce64fd9d45df6d647b45f062e8ac/CLAUDE.md?plain=1#L507-L512)). The same release fixed `make eval`, which had been a silent no-op: `eval/` is a directory, and without `.PHONY` make took the target for up to date, did nothing and exited 0 ([0.2.0](https://github.com/Egoushka/chronicle/blob/741dbb1f5ec6ce64fd9d45df6d647b45f062e8ac/CHANGELOG.md#020---2026-09-29)). An integration test now fails if the reply rule goes dark.

In [chargehand](/projects/chargehand/), the pre-commit hook that keeps private terms out of a public repository failed open. A malformed pattern made `git grep` exit 128, which means it could not search, and the hook read that as "no match" and let the commit through. The hook now treats any exit above 1 as a failure and blocks the commit, and a test plants a broken pattern to prove it ([0.4.0](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/CHANGELOG.md#security)).

## The test that breaks a check is bigger than the check

Watching a check fail takes a second piece of code whose one job is to break things, and that code is the bigger of the two. chargehand's denylist hook is a 44-line script, and its tests are 95 lines. Chronicle's reply rule had a unit test from the first commit, and the fix changed neither the rule nor the test: the bug was a caller that passed `None`. The test that notices a missing caller runs the worker against a throwaway PostgreSQL database, to guard a two-line fix.

Failing closed has its own price. A malformed line in chargehand's denylist blocks every commit, including the ones it has nothing to say about, until I fix the list.

And checking the outcome takes longer than checking the step. This site's deploy waits up to six minutes for the live site to name the new build, and then tests it.

## Three checks that can still fail without a sound

Two deliberate regressions went through chargehand's prompt CI. A better score now blocks the first; the second still passes, and [its docs](/projects/chargehand/docs/prompt-ci/#what-it-has-missed) say so. A ruleset on `main` still requires the gate for every prompt change.

Chronicle has no alert for a source that stops sending. In June my location and photo backups stopped reporting, and nothing on the box failed, so nothing fired. The only signal is still `doctor`'s warning for a source with nothing in 90 days, and [its status page](/projects/chronicle/docs/status/#what-is-not-built) lists the alert as not built.

And the script that checks this page's figures reads digits, so it cannot see that "fifty-one", above, is a number; a reviewer has to.

---
title: "My agent orchestrator lost its first blind test, 0.333 to 0.667"
date: "2026-09-29"
description: "A plain agent session beat my orchestrator in a blind test. The fix cost 28% more until an ablation found why; splitting cost 1.53× for 2% more quality."
kind: finding
project: "chargehand"
topics: ["architecture", "mcp"]
---

[chargehand](/projects/chargehand/) is my orchestrator for coding agents. It takes a question about a codebase, turns it into a typed task, runs it on agent sessions that can only read, and returns an answer, over the CLI, HTTP or MCP, in which every claim cites a file at a pinned commit. The first time I measured it against a plain single OpenCode session on the same model, the plain session won, 0.667 to 0.333, judged blind.

That should not happen. Underneath, chargehand runs the same kind of session. What it adds is structure: a task spec, a result contract, a resolver that checks every citation. Structure is not supposed to make the answer worse.

## One question, three pairs, a blind judge

The phase 3 exit check was small. One reference read-only question about a private repository at a pinned commit. The first version, v0, against a plain OpenCode session: same day, same model, same OpenCode build, same commit, three pairs, alternating which arm ran first.

A model judge compared each pair blind, checking claims against the repository, on three criteria: is it correct, is it complete, do its citations resolve. It saw which answer came from which arm only after every pair was scored. A win counts 1, a tie 0.5, a loss 0, averaged over the three criteria and the three pairs.

The scoring makes the result easy to read. Two indistinguishable systems both score 0.5. v0 scored 0.333 because it tied on correctness, tied on citations and lost on completeness, in all three pairs.

Everything else looked fine:

| | v0 | plain session |
|---|---|---|
| cost per run | $0.199 (+ ~$0.0004 intake) | $0.205 |
| wall time | 155 s | 122 s |
| cited lines that resolve | 50/50 | 75/75 |
| blind score | 0.333 | 0.667 |

v0 matched the plain session on correctness and on cost, and said less. The exit bar was to win or tie on both correct and complete in 2 of 3 pairs. It managed 0 of 3.

## It read the files, then left them out

The diagnosis ruled out the obvious suspects first. Both arms explored alike: calls, cache reads and output tokens were within about 10% of each other. Intake kept the question whole instead of splitting it. v0's open questions were real unknowns.

The difference was in the answer. v0 read files and then left them out, and it merged several stacks into one claim. Its own prompts asked for that. The worker prompt capped the summary at 120 words, and the preset asked for "the smallest set of files that answers the task".

Each line reads as a sensible default on its own. Together they asked for a short answer about the few files that mattered most, and the judge ruled against it on completeness in all three pairs.

## The fix won the quality back and cost 28% more

Pull request #19 changed the worker prompt to 0.3.0: cover the whole task, one claim per item, cite every file you relied on, no word cap on the summary. It also changed the preset blocks from "prefer the smallest set of files" to "read every file the task needs".

I reran the same question on 2026-09-27: same model, three pairs, alternating order. The repository commit differed in one way only: it dropped the encrypted env files, because workers now refuse a checkout that tracks them.

| | v0 + #19 | plain session |
|---|---|---|
| claims per run | 16, 17, 17 (6–9 before) | |
| blind score | 0.556 | 0.444 |
| judge 1–5, correct / complete | 5.0 / 4.7 | 5.0 / 4.0 |
| cost per run | $0.257 | $0.201 |
| cost ratio per pair | 1.48×, 1.19×, 1.19× | 1× |
| worker calls per run | 13, 11, 11 | 9, 10, 7 |
| wall time | 150 s | 118 s |

No answer on either side had a false claim, and completeness decided every pair. The quality half of the exit now passed, 2 of 3. The cost half failed: v0 cost 28% more, because it read more. In pair 1 it pulled 351k cached input tokens against the plain session's 222k. Quality per dollar came out about even. The exit still did not hold.

The tempting reading was that completeness costs tokens, and a more complete answer is worth 28%. But #19 had changed two things at once, and only one of them was about completeness.

## The cost was in the read scope, not the fix

The failure had been about files read and then left out. The rules in the worker prompt, one claim per item and cite what you relied on, should fix that on their own. "Read every file the task needs" was a separate instruction, and it looked like the source of the extra reading.

So I ran the ablation the same day: worker prompt 0.3.0 unchanged, and the preset back to "read the files that answer the task". Same question, commit, model and procedure, with a fresh plain arm.

| | v0, narrower read scope | plain session |
|---|---|---|
| cost per run | $0.223 | $0.222 |
| cost ratio per pair | 1.19×, 0.85×, 1.02× | 1× |
| worker calls per run | 8, 7, 10 | 7, 8, 7 |
| claims per run | 17, 21, 17 | |
| blind score | 0.611 | 0.389 |
| judge 1–5, correct / complete | 5.0 / 4.3 | 5.0 / 3.3 |

Quality passed 3 of 3, better than the rerun. The cost gap closed to 0.6%, or $0.0013 a run, on the benchmark file's unrounded means. The plain arm alone ranged from $0.189 to $0.254 across its three pairs, so a gap of $0.0013 is noise. Against the letter of the exit, "costs no more", it is still a miss by $0.0013 on three pairs, and the benchmark file says so. The narrower read scope shipped as #25.

Had I stopped at the rerun, the 28% would have read as the price of completeness. The ablation put it on the instruction to read more, which #19 had bundled with the instructions that fixed the answer.

## Splitting cost 1.53× for 2% more

The other thing chargehand adds is splitting. Intake can break a read-only question into 2 to 4 subtasks, run them as separate nodes and merge their results without another model call. The phase 4 exit measured whether that pays.

Three breadth-first questions on the same private repository, each spanning 3 independent areas. Intake chose to split in 6 of 6 runs, 3 nodes each. The plain arm was again a single OpenCode session with the same model, build agent and read-only ruleset. Two repetitions, alternating order, a small model for both arms. The judge scored each answer 1–5 on correct and complete; the score is their sum over 10.

| | split | plain session |
|---|---|---|
| cost per run | $0.00754 | $0.00492 |
| cost ratio per task | 1.62×, 1.51×, 1.63× | 1× |
| wall time | 123 s | 73 s |
| cited lines that resolve | 99/99 | 112/112 |
| blind score | 0.967 | 0.950 |
| quality per dollar | 128 | 193 |

The split cost 1.53× overall and scored 1.02× the plain answer. Forking kept the session setup cheap: sibling nodes read 4,878 of the first node's ~5.2k prefix tokens from cache on their first call. The extra cost came from each node exploring on its own.

On cost alone, a split needed about 1.5× the plain answer's quality to win on quality per dollar. The plain session scored 0.950, and 1.5× of that is above the top of the scale. On these questions a split could not have won.

[ADR 0017](/projects/chargehand/docs/decisions/) records the conclusion: intake should choose to split only when one session cannot cover the parts, not merely because a question spans several areas. I wrote that conclusion into the decision record and not yet into the prompt: intake prompt 0.3.0 still says to split when a read-only request asks about 2 to 4 separate areas.

## What it does not tell you

These are engineering checks, not a study. Phase 3 is three pairs on one question on one repository. Phase 4 is two repetitions on three questions, on a small model. The judge was blind, but it was a model. The plain arm's own cost ranged from $0.189 to $0.254 on a single question, so a cost difference of a few percent is invisible at three pairs.

"Resolve" means less than it sounds. chargehand's resolver checks that a cited path and line range exist at the commit. It does not yet check that the cited lines support the claim; that is planned for [0.8](/projects/chargehand/docs/capabilities/). The docs say "citations checked" for that reason, never more. The judge did check claims against the repository, but it sampled citations rather than reading every one.

Three pairs cannot say anything about orchestration in general. On this question, the machinery around the agent took two prompt changes and three runs to match a plain session on cost. Splitting has not earned its cost on any question I measured. Even [prompt CI](/projects/chargehand/docs/prompt-ci/), the gate meant to stop prompt regressions, let both planted ones through on its first run; that belongs in another post.

A plain session is what anyone would run instead of chargehand. It is the right baseline because it is the cheapest honest alternative, and on the first try it won.

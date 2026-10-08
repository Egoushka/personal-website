---
title: "My orchestrator lost its first blind test, 0.333 to 0.667"
date: "2026-09-29"
updated: "2026-09-29"
description: "A plain agent session beat the orchestrator I built. The fix cost 28% more until an ablation showed the cost was one instruction, not the fix."
kind: finding
project: "chargehand"
topics: ["architecture", "mcp"]
---

Before the first blind run, I just wanted the result.

What was being tested was [chargehand](/projects/chargehand/), a program I built that takes a question about a codebase, hands it to AI coding agents that can only read, and returns an answer in which every claim points at a file. The test was one question answered twice: once by chargehand, once by a plain agent session with nothing built around it. A judge, another model, saw the two answers without knowing which was which. Three pairs, alternating which side ran first.

The score came in at 0.333. The plain session got 0.667. I did nothing with it in that moment. I knew it could be better.

## What the score was made of

The judge marked each pair on three things: is the answer correct, is it complete, do its citations hold up. A win counts 1, a tie 0.5, a loss 0, so two systems that cannot be told apart both score 0.5. Mine tied on correct and on citations and lost on complete, in all three pairs. It cost about what the plain session did, $0.199 a run against $0.205, and all 50 of its citations pointed at a real line. It was accurate and it said less.

The bar in the [benchmark file](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/benchmarks.md) was to win or tie on both correct and complete in 2 of 3 pairs. It managed 0 of 3.

## It read the files, then left them out

Both sides had explored the code alike: calls, reading and output were within about 10% of each other. So the gap was not effort. It was in what reached the answer. My agent read files and then dropped them from what it wrote, and it merged several separate stacks into one claim.

My own prompts had asked for that. The worker's instructions capped its summary at 120 words, and the preset told it to read "the smallest set of files that answers the task". Each rule sounds sensible alone. Together they asked for a short answer about a few files, and the judge marked it down on completeness every time.

## The fix worked, and cost 28% more

Pull request #19 rewrote both. Cover the whole task, one claim per item, cite every file you relied on, no word cap; and read every file the task needs. I reran the same question on 2026-09-27. Answers went from 6–9 claims to 16–17. The score flipped to 0.556 against 0.444, and the quality bar passed.

The cost did not. chargehand now cost $0.257 a run against $0.201, 28% more. In the first pair it pulled 351k cached input tokens against the plain session's 222k.

One reading was that completeness costs tokens, and 28% was the price of a complete answer. But #19 had changed two things at once: the rules that fixed the answer, and the instruction to read more. Only the first was about what the answer had left out.

## The ablation

The same day I put the read-scope instruction back to "read the files that answer the task" and kept the rest of #19. Same question, a fresh plain session, three more pairs.

The cost gap closed to 0.6%, or $0.0013 a run, while the plain session alone ranged from $0.189 to $0.254 across its three pairs. Quality passed 3 of 3, better than the rerun, at 0.611 against 0.389. The narrower read scope shipped as #25.

| Run | chargehand score | plain score | chargehand cost | plain cost |
|---|---|---|---|---|
| First blind run | 0.333 | 0.667 | $0.199 | $0.205 |
| With #19 | 0.556 | 0.444 | $0.257 | $0.201 |
| Ablation | 0.611 | 0.389 | $0.223 | $0.222 |

Each row has its own plain run. Had I stopped at the rerun, the 28% would have read as the price of completeness. It was the price of one instruction. Against the letter of the bar, "costs no more", the ablation still misses by $0.0013, and the benchmark file says so.

That is what the plain session is for. Without it running the same question on the same day, I would have had a score and no way to say whether it was good, or which change bought what. The machinery around an agent has to earn its cost against the agent alone, and the first time it did not.

## What three pairs cannot tell you

Every run here is three pairs on one question about one repository, judged by a model, so a cost gap of a few percent is invisible when the plain session's own cost swings that much. "Citations checked" means the resolver confirms the cited path and line range exist at the commit; it does not yet check that the lines support the claim, which is planned for [0.8](/projects/chargehand/docs/capabilities/). Three pairs say nothing about orchestration in general. On this question, matching a plain session took two prompt changes and three rounds of runs.

## Receipts

Each line links the file at commit b566890. Prompt changes are in chargehand's pull requests; the decision records are [on this site](/projects/chargehand/docs/decisions/).

- Blind score 0.333 against 0.667, three pairs, alternating order, win 1, tie 0.5, loss 0: [the phase 3 table](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/benchmarks.md#L95-L104)
- Cost per run $0.199 against $0.205, citations that resolve 50 of 50: [same table](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/benchmarks.md#L100-L102)
- Quality bar 2 of 3 pairs, result 0 of 3: [the paragraph under it](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/benchmarks.md#L106-L108)
- Explored within about 10%, summary capped at 120 words, "the smallest set of files that answers the task": [the diagnosis](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/benchmarks.md#L112-L116)
- Fix #19, worker prompt 0.3.0, rerun on 2026-09-27: [the rerun heading](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/benchmarks.md#L110)
- Claims per run 16, 17, 17 against 6–9 before: [the rerun table](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/benchmarks.md#L122-L131)
- Rerun score 0.556 against 0.444, cost $0.257 against $0.201, 28% more, worked out from the two costs: [the rerun table](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/benchmarks.md#L124-L135)
- 351k against 222k cached input tokens in the first pair: [the rerun paragraph](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/benchmarks.md#L133-L137)
- Ablation cost $0.223 against $0.222, score 0.611 against 0.389, quality bar 3 of 3: [the ablation table](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/benchmarks.md#L147-L158)
- Gap 0.6%, $0.0013, plain session $0.189 to $0.254: [the ablation paragraph](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/benchmarks.md#L157-L160)
- Read-scope fix shipped as #25: chargehand commit c84ed91
- The resolver checks that a cited path exists; the support check is planned for 0.8: [capabilities](/projects/chargehand/docs/capabilities/) and [the roadmap](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/ROADMAP.md#L25-L27)

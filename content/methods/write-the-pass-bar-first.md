---
title: "Write down what counts as a pass before you see the result"
description: "Once I have seen a number, I can find a reason it counts. So the pass bar goes in a file first. Chronicle and Trader did; the price is a bar that can be wrong."
lastReviewed: "2026-09-29"
projects: ["chronicle", "trader"]
posts: ["chronicle-vs-grep"]
topics: ["retrieval", "python"]
---

## Decide what a pass is before the number exists

When I have seen a result, I can always find a reason it counts as good. So before I run a measurement I write down what a pass looks like and how the score is worked out, in a file that will be there afterwards. If the run misses, I write down the miss next to the number. I would rather be told no by my own bar than yes by one I moved.

## Two projects that wrote the bar first

[Chronicle](/projects/chronicle/) is a search over my old chat history, and the question was whether it beats plain `grep`. The bar was in the code on 2026-07-28: a memory system that cannot beat ripgrep on the owner's own questions is not earning its complexity, scored by whether the right messages come back and never by a model's opinion ([evaluate.py](https://github.com/Egoushka/chronicle/blob/741dbb1f5ec6ce64fd9d45df6d647b45f062e8ac/chronicle/evaluate.py?plain=1#L6-L7)). The first score came on 2026-09-26. The README also tells you to write the questions from memory, not by browsing the archive, because a question written after reading its answer is one you already know is findable ([README](https://github.com/Egoushka/chronicle/blob/741dbb1f5ec6ce64fd9d45df6d647b45f062e8ac/README.md?plain=1#L147-L148)). The full story of what went wrong with the scoring is [a post](/writing/chronicle-vs-grep/).

[Trader](/projects/trader/) is a trading-research project, and its page states the whole method: hypotheses registered before the data was touched, a cost model every strategy has to pass through, and phase gates that cannot be skipped. Six were registered and none survived ([the page](https://github.com/Egoushka/personal-website/blob/dceb85b36e604118c23e12866c4f4e7178536cb3/lib/site.ts?plain=1#L485-L487)). Its repository is private, so the page is what you can check.

## A bar can be wrong, and it is slower than looking

Chronicle's bar was incomplete. It said grep must be beaten, but not how grep's search words would be chosen, so words from the answers leaked in. Taking them out moved grep's score by 14 points, from 68.4% to 54.2%, and touched no search code ([README](https://github.com/Egoushka/chronicle/blob/741dbb1f5ec6ce64fd9d45df6d647b45f062e8ac/README.md?plain=1#L150-L155)).

A bar can also just be wrong. chargehand's cost bar for one phase was "costs no more" than a plain agent session. It came out $0.0013 higher over three pairs, while the plain session alone varied between $0.189 and $0.254 from pair to pair. The benchmarks file records that as a miss, not a pass ([benchmarks](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/benchmarks.md?plain=1#L158-L160), [chargehand](/projects/chargehand/)).

And it is slower. Trader's page says it was built in the order that makes the answer trustworthy, not the order that reaches a chart fastest.

## When I break it

I break it by leaving a hole, not by choice. Chronicle's keyword rule was written down only after the scores had moved, and the question set is not in the public repository, so nobody else can rerun it. When a run shows a hole in the bar I add a line to the bar and say so; I do not move the number the bar asks for.

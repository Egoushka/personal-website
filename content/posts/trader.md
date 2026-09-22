---
title: "I spent three months building a trading system. It told me no."
date: "2026-09-22"
description: "Two strategies, pre-registered and tested properly. Both rejected — including one that looked profitable. The machinery that says no is the product."
topics: ["python", "architecture"]
---

For the last few months I have been building a systematic crypto trading
system: software that decides when to buy and sell, tests those decisions
against historical data, and would eventually place orders without me.

It has never placed an order. No real money has gone near it.

That is not because it is unfinished. It is because the testing framework
rejected both strategies I built it to test, and one of them looked like it
was working.

This post is about why I believe the rejection.

## The plan, written before the results

The project has seven phases and each one has a gate. Before running anything
I wrote down two hypotheses, the data windows, how many variations I was
allowed to try, and — this is the important part — **what result would count
as a failure**.

That last one does the heavy lifting. If you decide what success looks like
after you have seen the numbers, you will always find success, because you
will move the line. Writing it down first turns a judgement call into
arithmetic.

I am at the end of phase three. Both hypotheses are dead.

## The strategy that looked like it worked

The first was trend-following: buy what is going up, sell what is going down,
using moving averages to decide which is which. It is the oldest idea in
systematic trading, and I tested it on Bitcoin, which trends hard.

It returned a **Sharpe ratio of +0.486** on data it had never seen.

Sharpe ratio is return divided by volatility — how much you made per unit of
nerve required. Positive is good. Roughly 0.5 on out-of-sample data is the
sort of number people put in a pitch deck.

I rejected it.

## Why a good number can still be noise

Here is the problem. I did not test one configuration. I tested twelve — 
different lookback windows, different speeds.

If you try twelve variations of a coin-flipping strategy, the best of the
twelve will look good. Not because it is good, but because you took the
maximum of twelve random draws. The more things you try, the better your best
result looks, and none of that improvement is real.

The **deflated Sharpe ratio** corrects for exactly this. It asks: given that
you tried twelve configurations, on this much data, with returns this skewed,
how impressive is 0.486 really?

Mine did not clear the threshold. So the number is consistent with luck, and
I do not get to keep it.

The same strategy on Ethereum returned **−0.238**, which needed no correction
at all.

## Checking that the machine can say no

Before trusting any of this I ran a strategy I knew was bad through the same
pipeline. If a framework cannot reject garbage, its approvals are worthless.

It came back with a Sharpe of **−0.429** and a **probability of backtest
overfitting of 0.817**.

That second number is worth explaining. Split the history into chunks. Pick
the best configuration using some chunks, then check how it ranks on the
others. Repeat. PBO is how often your winner lands in the bottom half when
tested on data it did not choose itself.

At 0.817, five times out of six. That is what overfitting looks like when you
measure it rather than squint at a chart.

Watching the framework produce 0.817 for a strategy I knew was junk is why I
believe the 0.486 rejection.

## Three bugs, all flattering

Three things were wrong in my code, and every one of them made results look
better than reality.

The worst: my orders were filling at the price of the bar that triggered them.
The signal said buy based on a candle closing at a certain price — and the
order executed at that same closing price. In real trading you find out the
candle closed *after* it closed, and you buy at whatever comes next. I was
buying in the past. The fix was a deliberate one-bar delay, and the returns
fell.

The other two were timing: jitter in funding timestamps, and lag in the
exchange's own clock. Fixed by rounding and by stamping with a neutral clock
rather than trusting theirs.

None of them raised an error. They made results better, and better results do
not get investigated — which is the same shape as [the deploy that reported
success for fifty-one days](/writing/silent-deploys/).

## The pairs that no longer exist

I built my list of tradeable instruments from Binance's live symbols: 859 of
them. Then I pulled the historical archive: **989**.

The gap is **13.8%** — pairs that traded for a while and were removed.

If you build a universe from today's list, you have quietly restricted
yourself to the instruments that survived. That is a fact you only know
afterwards, and your strategy would not have known it at the time. It makes
every backtest look better than the real thing.

I put the dead symbols back. The results got worse. That is what putting them
back is for.

## The fees nobody quotes

The other thing that killed the second strategy was not statistics, it was
arithmetic.

A conservative cost model — fees, spread, market impact, funding — puts a year
of 252 round trips at a **34% annual drag**.

Not 3.4%. Thirty-four.

Every edge has to clear that bar before it is an edge, and most published
results are quoted before costs. The second hypothesis, harvesting funding
payments, turned out to be weaker than assumed anyway: the pattern runs with
the market rather than against it, and it collapsed in 2022. I suspended it
rather than killing it, pending a narrower test. One is dead; the other is
parked with a written condition.

## What I would say now

I had the category wrong at the start. I thought of this as a step toward
income. It is not. It is a high-variance research project, and the first year
or two is tuition.

Moving it out of the income column in my own planning made the phase gates
easier to enforce, because nothing depends on passing them.

And the thing I actually built is not a strategy. It is a machine that catches
lookahead, survivorship, multiple testing and fee drag — and I have now
watched it reject something I wanted to believe in, twice.

Most people who build one of these never find out whether it would have. Mine
has. That is the only reason I would trust it if it ever says yes.

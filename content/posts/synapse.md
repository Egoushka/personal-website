---
title: "My AI's memory has never forgotten anything, and that is the problem"
date: "2026-09-22"
description: "A count of my agent's memory found 5,357 stored facts, not one ever marked wrong, and three contradictory claims about one server."
kind: finding
project: "synapse"
topics: ["architecture", "retrieval", "postgres"]
---

My assistant has a memory. Facts about my work, my infrastructure, my
projects, written down over months so it does not have to be told the same
thing twice.

Last week it told me something confidently wrong about my own server. I went
looking for where it got that, and found something worse than a bad fact.

**Nothing in that memory has ever been marked wrong. Not once, in 5,357
facts.**

This post is about what I found, and the thing I am building because of it.

## What "memory" means here

When people say an AI has memory they usually mean one of two things: a longer
conversation window, or a database of statements it can search.

Mine is the second. Each stored item is a claim — a sentence asserting
something is true — with tags and a timestamp. When I ask a question, relevant
claims are retrieved and put in front of the model.

The whole design is about getting things *back*. Every benchmark in this space
measures recall: did the system find the right fact?

None of them measure whether the fact is still true.

## The count

I ran a census over every bank of claims:

```
bank             claims   derived   single-source
personal           2844       226            2760
computer           1448       222            1415
...
TOTAL              5357       628            5197

backend state: valid=5357
```

Every one marked `valid`.

The storage layer has the columns for it — there is a state, a reason for
invalidation, a timestamp for when it happened. Nothing has ever written to
them.

And **97%** of those claims have been asserted exactly once and never
corroborated. **99.8%** are more than thirty days old. So the store is almost
entirely made of things somebody said once, a long time ago, that nothing has
ever revisited.

## Three claims about one server

Here is the concrete damage. Three claims, from the same document, all stored,
all live, all retrieved together:

```
"Hetzner raised cloud prices on 15 June 2026, CX53 €22.49 → €29.49"
"Yehor's VPS costs approximately €32/month, including €29.49 for CX53..."
"Downgrade to CX43 would save €13.50/month but was rejected..."
```

Look at what those three actually are.

The first is **an event**. It happened on a date and it will never stop having
happened.

The second is **a current state**. It is true today and becomes false the
moment I resize that machine.

The third is **a closed decision**. It is finished business, relevant only if
somebody asks why the server is the size it is.

They are stored identically. They are retrieved identically. Nothing in the
system knows that one of them can never go stale, one of them goes stale on a
Tuesday, and one of them should almost never surface at all.

It gets worse: all three are tagged with the names of the alternatives that
review *rejected*. Those tags exist because the conversation mentioned them.
Now they are indexed as though they were my infrastructure, one hop away from
any question about what I run.

## This is not my setup being careless

The backend I use leads the recall benchmarks and documents having no eviction
at all as a deliberate design choice. It is doing exactly what it says.

The research is blunter than the tools. One 2026 paper argues that production
failures in these systems are predominantly *forgetting* failures rather than
recall failures — while the benchmarks measure only recall. Another tested six
memory agents across four models and found frequent reuse of invalid memories
and failure to reconcile evolving ones, with only marginal improvement from
any of them.

Nobody has solved this. More tellingly, nobody publishes the number. I have
never seen one of these systems report what fraction of its store is stale,
and having now measured mine, I understand the reluctance.

## What I am building

Synapse is a control plane. It stores no knowledge of its own — it governs
claims that live in other systems, deciding which are still true, which have
been superseded, and which should stop being recalled.

Drop its database and you lose decisions, never knowledge. That constraint is
the whole design. The moment it starts storing what it governs, it becomes
another memory database, and the world does not need a tenth one.

It does no embedding and no similarity search. That is the backend's job.

The flow is a nightly pass, off the critical path. It reads claims and
produces findings. Findings fork: the mechanical ones apply themselves, the
ones that needed judgement become a proposal that waits for me. Read-only
checkers — [the chat archive](/writing/chronicle/), the infrastructure repo, a
ticket tracker — return a verdict and a reference, never the underlying
content. A system that reads
your messages to check a fact is a system that has a copy of your messages.

## Four rules, enforced by the database

The failure this exists to fix is policy written as prose that the engine
quietly ignores. So the rules are database constraints, not application code:

1. Identity claims are never automatically superseded, on any path.
2. A protected scope cannot be unprotected by editing policy.
3. Anything a model judged waits for a human.
4. A finding marked "flag" never modifies anything.

Rule three is the one I expect to resent. Model-judged supersession measures
around 78–85% accurate, so roughly one proposal in five is wrong, and at my
volume that is a queue to work through.

But the alternative is a system that silently deletes things I believe, at
four-fifths accuracy, and the failure mode of *that* is that I cannot tell
which fifth it got wrong.

Nothing is ever hard-deleted. Supersession is reversible. When you are
building an eviction system on top of your own memory, undo is not a feature,
it is the precondition for switching it on.

## What I have not solved

Classification — deciding whether a claim is an event, a current state, an
identity fact or a closed decision. Everything turns on that call, and right
now a model makes it with permission to say "I don't know".

Abstaining is correct. A classifier that guesses on the hard ones poisons the
store it was meant to clean. But a system that abstains too often is a review
queue with extra steps, and I do not yet know which one I have built.

That rate is the first real gate.

## Go and count

If you run an assistant with persistent memory, do the census tonight. How
many facts? How many have ever been marked wrong? What share was asserted once
and never seen again?

I expect most people find what I found — not through carelessness, but because
every one of these systems is built and benchmarked around getting things
back, and none of them is built around letting things go.

A memory that never forgets is not a memory. It is a pile.

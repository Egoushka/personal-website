---
title: "My search scored 48.2% on its first eval. Then I found the scoreboard was wrong twice."
date: "2026-09-29"
description: "Chronicle scored 48.2% on its first eval and tied grep after the fixes. A fair grep, scored the same way, made it 71.1% against 54.2%."
kind: finding
project: "chronicle"
topics: ["retrieval", "python"]
---

The first time I scored Chronicle against `ripgrep`, it found 48.2% of the
evidence on 37 of my own questions. After the fixes, on the same questions,
it found 63.5% and grep found 62.8%.

Chronicle is hybrid retrieval over
[segments rather than messages](/writing/chronicle/): an embedding model and a
lexical branch, their ranks fused. Grep is a regex over a text dump. I had
written the warning into the harness myself: Letta scored 74.0% on LoCoMo with
a filesystem and grep, beating Mem0's 68.5%, and a memory system that cannot
beat grep on its owner's questions has not earned its complexity. That was the
bar.

Three days later it led by 16.9 points, on a larger set and a stricter grep.
The search fixes brought it level. Fixing how I scored it changed the verdict
after that.

## How it was scored

Each question carries its gold evidence: the ids of the one to four messages
that answer it. An assistant drafted the first 37 from what its memory had
recorded me remembering, for me to audit, and located the evidence with SQL
over the raw text, never with Chronicle's own `/recall`. Nobody browsed the
archive first, because a question you write after reading the answer is one
you already know is findable. The set held 28 lookups, 7 first mentions and 2
questions about how something changed over time.

The score is evidence recall: the share of gold ids a system returns. No
language model grades anything. Both sides get the same budget of 200 event
ids per question. Before that cap, Chronicle answered with up to 20 whole
segments, about 260 ids at ~13 events each, against grep's 20 lines. The
same commit fixed a second harness bug: first-mention questions sent the whole
sentence to the api, which lemmatised every word and matched almost anything.
Both fixes landed with the questions, before the first run.

`make eval-homelab` runs it on the box that holds the archive. It dumps every
event to text inside the database container, runs the comparison in a
throwaway container that has ripgrep and can reach the api, and deletes the
dump on exit.

## Fixing the search

The embedding model never changed. What I fixed were places where search did
something other than what I believed it did.

| step | overall | lookup |
|---|---|---|
| first run | 48.2% | 40.5% |
| short segments un-hidden, first mention fixed | 55.0% | 45.8% |
| tier-2 sources, one enrichment batch | 52.3% | 42.3% |
| lexical branch revived, the question's own date window | 63.5% | 57.1% |

The substance filter let a short segment through only if it was one message
over 80 characters. It hid 2,812 two-message segments however long they were:
525 of them held 200+ characters, and 5 of the 57 gold messages sat in them. I
had tuned that filter to drop bursts of filler, and it dropped the short
exchanges that matter most.

The lexical branch ANDed every word of a natural-language question and matched
zero segments on 27 of 28 lookups. Every lookup ran on the embeddings alone,
and the misses were the questions naming a rare entity, which dense retrieval
ranked anywhere from 51st to 1,574th. The branch now ORs the question's terms
that occur in under 5% of segments and weights them by IDF, in 8 ms.

Most lookups also name their own date: late 2024, summer 2025. Search ignored
it. A single named year, season or month now becomes a window with generous
margins.

Enrichment went the other way. One batch of model-extracted facts took the
score from 55.0% to 52.3%, so it stays off until an A/B says otherwise.

I also tried searching the archive's other spellings of a question's terms,
the Russian and Ukrainian forms of the same word. It fixed none of the 8
remaining misses, left recall at 63.5%, and took `/recall` from 0.10 s to
0.39 s. I reverted it the same day.

That left 63.5% against 62.8%, and the README said Chronicle was level with
grep.

## The scoreboard, wrong twice

The first error was in p@1: whether the top result holds the answer. The
harness flattened Chronicle's ranked segments into one list of event ids and
asked whether the first event was gold. With about 13 events in a segment,
that came out false almost every time, even when the right segment ranked
first. On 17 lookups, scored by event: 11.8%. Scored by segment: 29.4%, with
retrieval unchanged.

That bug never touched the headline, because the overall figure is recall over
the flattened ids and p@1 sits in its own column. It made the top result look
2.5 times worse than it was. It was also the mistake I built the index to
avoid: judging a system in a unit it does not serve.

The second error touched the headline. Someone who had already seen the gold
wrote grep's keywords. The comment the harness now carries gives the plain
case: "which street?" becomes a grep for the street's name. That grades grep
on an answer it found before it searched. Chronicle only ever got the
question.

The next run had 71 questions: the original 37 and a second, independent set
of 34, after dropping 2 near-duplicates. With the leaked answer words, grep
scored 68.4%. Held to the question's own words (stems, other spellings, the
Russian or Ukrainian form of the same word) it scored 54.2%. The answer words
had been worth 14 points to grep.

Chronicle scored 71.1% on the same 71.

## What the number means

Against a fair grep, Chronicle leads by 16.9 points: 71.1% against 54.2%, and
67.0% against 41.8% on lookups. Its top result holds the answer for 36.2% of
lookups, grep's for 4.3%. An assistant that reads the first hit feels that
gap most.

```chart
{
  "type": "bar",
  "title": "Evidence recall on the 71 questions",
  "x": { "label": "Question group" },
  "y": { "label": "Evidence recall", "unit": "%" },
  "series": [
    { "name": "Chronicle", "points": [["Overall", 71.1], ["Lookups", 67.0]] },
    { "name": "grep, the question's own words", "points": [["Overall", 54.2], ["Lookups", 41.8]] }
  ],
  "caption": "Both systems get the same budget of 200 event ids per question. Grep is held to the question's own words."
}
```

On the 37 questions, the retrieval fixes moved Chronicle 15.3 points, from
48.2% to 63.5%. On the 71, the keyword rule moved grep 14.2 points, from 68.4%
to 54.2%, and touched no retrieval code. Different question sets, so these are
not a like-for-like comparison, but the second change came from the scoreboard
alone.

I trust the 68.4% most. It is grep with the answer's words, its upper bound on
these questions, and Chronicle still beats it. My keyword rule cannot explain
that result away.

The remaining misses are vocabulary mismatch: the answer uses none of the
question's words, through paraphrase or another script's spelling. Neither
system handles those yet.

## What changed because of it

The keyword rule now lives where the harness defines a question: grep gets the
question's own words and nothing from the answer. I tried a lint for it and
dropped it. Prefix, transliteration and skeleton matching still flagged 24 of
142 keywords on the cleaned set, all legitimate synonyms, and CI cannot read
the question set anyway.

The harness scores p@1 per group, in each system's own unit: an event for
grep, a segment for Chronicle, both cut to the same 200-event budget.

The roadmap goal said Chronicle had to beat ripgrep by 10+ points on my own
questions, measured honestly. Release 0.3.0 marked it done, and the
[project page](/projects/chronicle/) states the 71-question result with the
68.4% beside it.

## What it does not tell you

It is one archive, mine, and 71 questions about it. The first 37 came from an
assistant's memory of what I remembered, so they lean towards what was worth
recording. The question set is not in the public repository, so nobody else
can rerun it.

Grep's score depends on who writes its keywords. 54.2% is grep under my rule.
A careful person who had not seen the answers might write better keywords, and
I have not measured that.

On the original 37, first mentions scored 100% on both systems and
change-over-time questions 25% on both, so lookups are where the two systems
differ.
Two change-over-time questions cannot tell you anything on their own.

The harness had other bugs. `make eval` did nothing at all: `eval/` is a
directory, and the target was not `.PHONY`. The 2026-09-26 run went through
`make eval-homelab`, so it cost no numbers, but it has the shape of
[fifty-one days of green deploys](/writing/silent-deploys/): a check that runs
nothing looks exactly like a check that passed.

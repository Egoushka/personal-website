---
title: "Two thirds of my chat archive is the word \"ок\""
date: "2026-09-22"
description: "I built a searchable store over seven years of my own messages. The hard part was not the database — it was what not to index."
topics: ["python", "retrieval"]
---

Chronicle is a search index over my own life. Seven years of Telegram
messages, plus my editor hours, my calendar and my location history, in one
store that my assistant can query.

I built it because I kept asking questions nothing could answer. What was I
working on the week that conversation happened? When did we actually decide
that? Every one of those is a question about a moment in time, and the answer
was spread across four apps that do not know about each other.

This is about the mistake I nearly made building it, which is the same mistake
most people make: indexing everything, because you have everything.

## The obvious build

Take the archive, cut it into chunks, turn each chunk into a vector, put the
vectors in a database. Ask a question, get the nearest chunks back. That is
retrieval-augmented generation and it is a weekend of work.

I had already done it once, actually — an earlier stack that embedded every
Telegram message into Qdrant. It worked in the sense that it ran. It just was
not very good, and I did not understand why until I counted.

## What is actually in an archive

Before rebuilding I ran one pass over the real corpus. No embedding, just
counting.

**681,331 messages, across 487 chats, from 457 people**, starting 30 December
2018.

| | |
|---|---|
| under 20 characters | **65.0%** (442,954) |
| under 60 characters | **94.0%** |
| over 200 characters | **1.5%** |

Two thirds of everything I have ever typed to another person is under twenty
characters. `ок`. `ага`. `+1`. `да`. `😂`.

That is not a quirk of my messaging. That is what conversation is — mostly
acknowledgement, with occasional content.

## Why indexing them makes search worse, not just dearer

This is the part I had wrong, and it is worth being precise about.

A vector index answers one question: what is near this? Every piece of text
becomes a point in space, and similar text lands near similar text.

Now put 442,954 near-identical embeddings of "ок" into that space. They form a
dense clump. And because they mean almost nothing, they are not far from
anything — they sit near every query you could ask.

So every search drags some of them back. They are not merely useless results;
they take the places that would have gone to the **1.5%** of messages that
carry an actual proposition.

The naive index is not a cheaper, worse version of the good index. It is an
index with permanent fog in it. More compute does not clear the fog, because
the fog is the data.

## The fix was the unit, not the database

My first instinct was that I had picked the wrong vector store. I had not. I
had picked the wrong **thing to index**.

Nobody searches for a message. People search for something that *happened* — a
decision, an argument, the evening a plan was agreed. That is a dozen messages
between two people over forty minutes, most of which are `ок`.

So Chronicle groups messages into **segments** before anything is indexed,
clustering them by gaps in time, with the gap threshold fitted per
conversation. 681,000 messages become roughly 50,000 segments. The segment is
what gets embedded; the individual messages stay in the store and stay
addressable, they are just not what the index is made of.

The index came out about **eleven times smaller**, and retrieval got *better*.

I expected a trade — index less, save money, retrieve worse. That is not what
happens, and the reason is the fog. Removing the acknowledgements removes the
thing that was crowding every result.

## Somebody already measured this

I would not have trusted my own result on its own. It turns out SeCom (ICLR
2025) measured retrieval quality by choice of unit on conversational data, and
the ordering is unambiguous:

```
segment-level   71.57   <- what this builds
turn-level      65.58
session-level   63.16
summaries       53.87-56.25   <- worst
```

Read the last line twice. **Summarising the conversation and embedding the
summary scores worse than embedding the raw turns.** That is the first thing
most people build — it was the first thing I reached for — and it is the worst
option measured. Do not build a summary pyramid.

Their conversational turns average about thirty tokens. Mine are five to ten.
Whatever case there is for aggregating, it is stronger on my data than on
theirs.

## It is not a Telegram tool

The message count makes people assume this is a chat search box. It is not.

There are **18 adapters** feeding one timeline, in three tiers:

- **core** — Telegram, editor hours, location, calendar. The archive is worth
  having with only these.
- **behaviour** — finances, music, git, tickets. What I *did*, rather than
  what I said.
- **artifact** — photos, documents, mail, notes, bookmarks. Things I made,
  saved, or was sent.

All of them normalise to one `Event` shape. Which means "what was I working on
the week that conversation happened" is a join on time, because the editor
hours and the messages are rows in the same store.

That question is the reason the project exists. Everything above is what it
took to make it answerable.

## Why Postgres

It runs on Postgres with pgvector, on
[the same box as everything else I self-host](/writing/homelab/), and serves
the assistant over MCP rather than presenting a search box.

The reason is structure. Every real query is a similarity search *with a
filter* — this conversation, that year, those people, this source. In a
dedicated vector database that structure lives in a payload beside the vector.
In Postgres it is columns, the filter is `WHERE`, and the vector index sits on
a table I can join against all eighteen adapters.

One database, one backup, one thing to upgrade.

## Where it runs, and why that is the point

There is no sharing, no export, no accounts, and no way in from outside my own
network.

The archive is seven years of conversations with people who never agreed to be
in anybody's product. Running it on hardware I own is not a preference, it is
the condition that makes building it reasonable at all.

## If you are building one

Two things, in order.

**Count before you embed.** One pass over your corpus, no models involved.
Find out what share of it is acknowledgement, signature block, quoted reply,
automated notification. I would bet most personal archives are worse than
mine.

**Then question your unit**, and be suspicious if the answer is "whatever the
export handed me". Mine handed me messages. Messages are not what anyone is
looking for, and no amount of reranking downstream repairs a unit chosen
wrong at the start.

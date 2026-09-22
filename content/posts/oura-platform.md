---
title: "My ring knows how I slept. It will not tell me why."
date: "2026-09-22"
description: "Pulling my own Oura data into a database I control, so it can be joined against the things the ring never sees — calendar, training, the air in the room."
topics: ["dotnet", "postgres", "self-hosting"]
---

I wear an Oura ring. It measures sleep, heart rate and temperature, and gives
me a score each morning.

The app is good at showing me last night. It cannot answer any of the
questions I actually have, because all of them involve something the ring
cannot see.

So I am keeping a copy of my own measurements in a database I control.

## The questions

Does my resting heart rate rise in weeks with more meetings?

Does sleep quality track training, or is that something I tell myself?

What does the CO₂ level in the bedroom do to deep sleep?

Every one of those is a **join**. Ring data on one side, something else on the
other — a calendar, a training log, a sensor. None of that is in Oura's app,
and no consumer health app will ever add it, because the other half of each
question lives inside a different company's product.

The ring is not the problem. A consumer app is a read-only view of your own
measurements, shaped for a daily glance, and the glance is all you get.

## The shape of it

A small .NET service pulls documents out of Oura's API and writes them into
Postgres on [the same box as everything else I self-host](/writing/homelab/).
Two processes, one database, Docker Compose, no Kubernetes.

That is the whole architecture and it is deliberately dull. The interesting
part is one decision inside it.

## Store the raw document first

There is a table called `oura_raw`. It holds every document the API returns,
exactly as returned, keyed by type and id.

Everything else is a **projection** built from that table:

| Table | What is in it |
|---|---|
| `oura_raw` | Every document, verbatim |
| `daily` | One row per day — scores, HRV, resting HR, temperature, SpO₂, steps |
| `sleep_series` | Five-minute HRV and heart-rate arrays per night |
| `hypnogram` | One row per five-minute sleep phase |
| `hr_samples` | Daytime heart rate, sparse by design |

The tempting build is to parse on the way in and store only the tidy `daily`
row, because that is the one you query.

The problem arrives the first time you parse something wrong — and you will,
because a field is null in a way you did not expect, or quietly changes type.
Now the fix requires re-downloading your own history from an API that
rate-limits you and may no longer serve the window you need.

Keeping the raw document means a parsing bug costs a **re-projection** rather
than a **re-download**. The extra storage is rounding error.

That same key is what makes writes safe to repeat. The history walk and the
scheduled poll overlap, the API hands back a day already stored, and the write
becomes a no-op instead of a duplicate row.

## Two jobs that look like one

The **history walk** goes back through the archive once. Paginated, resumable,
repeatable. Resumable is not optional: it will fail somewhere in 2024, and
"start again from the beginning" is how this kind of project dies.

The **poll** runs on a schedule and fetches only what is new. It knows nothing
about the history walk.

Built as one component, they become a job that re-fetches four years every
night.

## What "working" means for OAuth

The ring's API uses OAuth, so the service holds a token that expires.

Getting a token is an afternoon. The part that matters is the refresh running
unattended, and I did not consider this piece finished until I had watched it
renew without me. A token that works on the day you wire it up is not an
integration; it is a demo with a fuse on it.

## What exists and what does not

Working: the authentication, the storage, the history walk, the scheduled
poll. The database fills itself and stays correct.

Not built: the dashboards, the webhooks that would let Oura push instead of
being polled, and the MCP server that would let my assistant query any of it.

So right now it is a database nothing reads from. That is a strange place to
stop, and it is the right one — a dashboard over a history walk with gaps in
it is worse than no dashboard. It is a chart that looks authoritative and is
wrong in a way nobody checks. [The last thing I trusted that reported
success](/writing/silent-deploys/) had been shipping nothing for fifty-one
days.

## The part I do not know yet

Whether any of it correlates.

It is entirely possible that resting heart rate has nothing to do with my
calendar, that the training log explains nothing, and that all of this
produces a flat line.

I would still rather know than keep assuming there is something to find
because an app shows me a score every morning.

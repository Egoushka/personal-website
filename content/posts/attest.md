---
title: "The library rejected all 36 million valid Hungarian tax numbers"
date: "2026-09-22"
description: "I needed to check whether an ID number was well formed. The package that did it had 197 defects, and the worst could never be right for any input."
topics: ["dotnet"]
---

Most countries give people and companies an identification number — a tax ID,
a national ID, a VAT number. Most of those numbers have a built-in check
digit: one digit computed from the others, so a typo can be caught without
asking anyone.

If you take those numbers in a form, you want to check that before you store
it. It is a small job, and there is a package for it.

I installed the package. It rejected valid numbers.

This is what was underneath, and why I ended up maintaining a fork of it.

## The bug worth the whole post

Hungary first, because it is the cleanest bug I have ever read.

A Hungarian tax number ends in a check digit computed from the digits before
it. Each digit gets multiplied by a weight, the products are summed, and the
result modulo 11 gives the expected final digit.

The library summed the **characters** instead of the digits.

In code, the character `'0'` is the number 48, `'1'` is 49, and so on. So
every digit in the calculation was 48 too big. Across the nine weighted
positions that adds a constant:

```
48 × (1+2+…+9) = 2160
```

The check runs modulo 11, and 2160 mod 11 is **4**.

So the computed check digit was always the correct one plus four. It could
never equal the correct one. Not usually wrong — *never right*, for any input,
by arithmetic.

There are exactly **36,363,636** valid Hungarian tax identifiers. The library
accepted none of them.

I like this bug because the proof is shorter than the fix.

## What else was under there

Hungary was not alone. Going country by country against the rules the issuing
authorities publish turned up **197 defects**, over three passes, every one
confirmed by running the code rather than reading it.

**22 of the 87 validators crashed** instead of returning an answer — on empty
input, on a short string, on a letter where a digit belonged. Not "returned
invalid". Threw an exception. A form using this for validation would show a
user a stack trace for typing one character too few.

**Mexico and South Africa could never validate anything**, because a date
helper always returned false.

**Malaysia, Canada and San Marino had their checks inverted** — so they
accepted everything, including an empty string, and rejected the real formats.
That is worse than crashing. A validator that accepts empty input is not a
broken feature, it is a safety check that is silently switched off.

And then the one that explains how all of it survived:

**The test data was fiction.** The Thai tax-code tests used a Swedish personal
number. The only Cyprus national-ID test used a Czech birth number, copied
from the Czech file.

Both passed. For years.

That is the whole mechanism. The tests were green, so nobody looked — and they
were green because they asserted that the wrong country's number had the wrong
country's shape.

## Fork or patch

The original had had no release in a long time. Issues open, no commits, no
replies.

So: carry a patched private copy forever, or fork it properly and put my name
on it.

I forked it, and it was the right call for a reason I did not expect. I
thought I was inheriting 87 countries of coverage — which is real, and is the
part I could not have written in a week. What I actually inherited was a list
of things that were wrong, which is a curriculum you cannot buy.

I would have written a worse library. I would have done the fifteen countries
I needed, with a shared "weighted modulo" helper that mostly worked, and
shipped the same class of bug. Because the original was not written by someone
careless. It was written by someone who did the common cases and then ran out
of real numbers to test against. The fiction in the test data is what running
out looks like from the inside.

The test suite went from **586 cases to 4,212**. Every validator has one now.

## Answering a tracker I do not own

Twelve issues were open on the original. Ten report a real defect; the other
two ask whether anyone is still maintaining it.

All ten are now answered — the Dutch VAT format that changed in 2020, a
Belgian check number below ten, Finnish separators introduced in 2023, the
printed form of the Swiss number, an Indian validator crashing on a letter,
the Indian tax number that replaced another in 2017, a French number truncated
to nine characters, and several South American ones.

Each is asserted using the reporter's own value. If somebody spent the time to
file a bug with a real number in it, that number belongs in the test suite.

## What it does not tell you

This matters more than anything above.

The library checks that a number is **well formed** — right shape for that
country, carrying the check digit the authority publishes. It runs locally and
makes no network call, so it is cheap enough to run on every keystroke.

It cannot tell you the number is **real**. A VAT number can be perfectly well
formed and belong to nobody, or have been cancelled last week. For EU VAT,
only the European Commission's VIES service knows.

The two work together: reject the malformed ones instantly with no network
call, and ask VIES about the ones that survive.

Being clear about that line is most of what makes this honest. "We validate
VAT numbers" is a sentence worth distrusting — including when I say it, unless
I tell you which half I mean.

## It fails in public

This one is published. If I have a check digit wrong, somebody's signup form
rejects a real customer and the bug report has my name on it. That is a
different kind of pressure from anything else I have built, including
[the homelab](/writing/homelab/), and it changed how I wrote the tests: as
though a stranger would read them, because a stranger might.

Which is why a change in verdict is never a patch release here. A minor
version can change the answer for numbers you already stored, and the
changelog says which ones, in both directions, every release. There is a
migration document listing every verdict that differs from the original —
including numbers that used to be accepted and now are not, which is the
direction that breaks people.

And the known-issues file lists **33 entries**: 19 genuine remaining gaps,
almost all of them check digits no authority publishes, and 14 that were
investigated and closed as decided rather than pending.

A library that lists what it still gets wrong is more useful than one that
implies it gets everything right. The second kind is the one you find out
about in production.

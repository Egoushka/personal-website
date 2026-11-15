# What counts as a human visitor

Umami counts every session. Raw counts on this site are mostly bots, so
[scripts/weekly-report.mjs](../../scripts/weekly-report.mjs) reports a "human" count next to the raw one.
This page is the definition and the data it rests on (Umami 3.4.0, queried 2026-11-15, whole weeks Mon 2026-09-14 to Sun 2026-11-08, UTC).

## Definition

A session is human when both hold:

1. **Not a headless fingerprint**: its screen is not `800x600` (the default viewport of headless Chrome and of crawlers that give none) and its browser is not empty.
2. **It shows life**: two or more pageviews, or any custom event at least one second after the session's first hit.

Scroll events are kept, but only with the one-second rule: on a short page in an 800x600 viewport `scroll-50` fires at 0 s, and the CN/SG/HK sessions fire `scroll-50` within 0.2 s of landing (6 of 6, median 17 ms).

A fourth group is reported apart and never counted as human: **single hits**, one pageview and nothing else, not headless, not from CN, SG or HK. Most are probably real readers who left (13 of the 60 in the week of 2026-11-09 came from Hacker News), but nothing separates them from a quiet bot.

## Evidence

Sessions by class, 8 whole weeks (379 sessions):

| Class | Sessions | Share |
|---|---|---|
| Headless fingerprint | 64 | 17% |
| Instant event only (event under 1 s, one page) | 10 | 3% |
| Single hit, no signal | 209 (97 from CN/SG/HK) | 55% |
| Human | 96 (0 from CN/SG/HK) | 25% |

- No session from CN, SG or HK is human. Of 103 such sessions in the last 28 days, 97 fired no event and 6 fired one within 0.2 s of landing. The wave is one burst: 70 of the 83 single-hit sessions in the week of 2026-11-02 are from those three countries.
- Human sessions look like readers: 36 of the last 60 days' US, DE and PL sessions with an event had it after dwell; `theme-toggle` events come on average 38 s after the first hit, `cv-save-pdf` after 520 s, `outbound` after 40 min (the session had been open a long time, so it was a person with a tab).
- `800x600` is where headless crawling shows: 52 of 56 such sessions in 60 days are outside CN/SG/HK, 42 of them in the US, and their event timing is the 0 s scroll above.

Weekly split (humans / raw):

| Week | Raw | Humans | Headless | Single hits |
|---|---|---|---|---|
| 2026-09-14 | 9 | 3 | 4 | 2 |
| 2026-09-21 | 21 | 17 | 1 | 3 |
| 2026-09-28 | 26 | 18 | 1 | 7 |
| 2026-10-05 | 20 | 8 | 1 | 11 |
| 2026-10-12 | 23 | 11 | 1 | 11 |
| 2026-10-19 | 5 | 1 | 2 | 2 |
| 2026-10-26 | 58 | 6 | 21 | 31 |
| 2026-11-02 | 90 | 5 | 0 | 85 |
| 2026-11-09 | 127 | 27 | 33 | 67 |

## Limits

- The owner's own visits are in the human count. They come from Ukraine, and the report shows "outside UA" separately.
- A one-page reader who scrolls at once is not counted: the definition is a lower bound. The single-hit column is the upper edge.
- Screen size and browser are sent by the client, so a bot that fakes them passes. Nothing here stops that; revisit the rule if the weekly split shifts without a new source.
- Umami already drops requests whose user agent `isbot` recognises (`DISABLE_BOT_CHECK` is not set). The rest use ordinary Chrome user agents, so a user-agent filter at ingest would not catch them.

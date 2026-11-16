---
title: "Jellyfin's /Persons query: 55 seconds at 20,000 rows, 48 milliseconds after one change"
date: "2026-11-16"
description: "A teardown of one Jellyfin query that compares every row with every other row. Measured on my machine, with the same output and a patch I have not sent."
kind: finding
topics: ["dotnet", "efcore", "debugging"]
---

This is the first of a series where I read one query in a popular .NET project, measure it, and write down what I found and what the number doesn't tell you. I'm Yehor, a .NET dev ([about](/about/)). Jellyfin is a good place to start: open source, EF Core on SQLite, and code that's easy to follow. Nothing here is a complaint about its maintainers. I'm reading their code because they wrote it in the open.

TODO: Yehor, the interview. What did you expect before you measured, what did you do when you saw the number, what surprised you? Replace this line with your answers, or cut it.

## The query that checks every pair

Jellyfin's people page calls `GET /Persons`. Behind it, the `Peoples` table has one row per name and role, so someone who acts and directs is in it twice. The repository collapses that to one row per name, keeping the lowest id per lowercased name:

```csharp
dbQuery = candidates
    .Where(p => !candidates.Any(other => other.Name.ToLower() == p.Name.ToLower() && other.Id < p.Id))
    .OrderBy(e => e.Name.ToLower());
```

Read it as a question asked once per row: is there any other row with the same lowercased name and a smaller id? If not, the row stays.

There is an index on `Name`. But the question is about `lower(Name)`, and an index on the plain name can't answer that. So SQLite goes through the rows with a smaller id, for every row. SQLite's own plan says it: `SEARCH p0 USING INDEX sqlite_autoindex_Peoples_1 (Id<?)`. That's a range over ids, not a lookup by name. The work is roughly rows × rows ÷ 2.

## The number

I called the repository's `GetPeople` with a page size of 100, against tables of three sizes. Medians, in milliseconds:

| Rows | Current | One grouped pass | Ratio |
|---|---|---|---|
| 1,000 | 141.7 | 3.1 | 45.7× |
| 5,000 | 3,752.7 | 10.3 | 364.3× |
| 20,000 | 55,379.5 | 47.7 | 1,161× |

Five times the rows cost 26.5 times the time. Four times the rows more cost 14.8 times. Pure squaring would be 25 and 16. At 20,000 rows one page takes 55.4 seconds.

## The change

```csharp
var firstIds = candidates
    .GroupBy(e => e.Name.ToLower())
    .Select(g => g.Min(e => e.Id));
dbQuery = candidates
    .Where(p => firstIds.Contains(p.Id))
    .OrderBy(e => e.Name.ToLower());
```

One pass: group by the lowercased name, take the smallest id in each group, keep those rows. It's the same question answered once instead of once per row.

Faster is cheap if the answer changed, so I paged through the whole result with both versions at 1,000 and at 5,000 rows and hashed every name and role. The hashes match. Jellyfin's existing people tests pass with the change, plus two I added for the case-only collapse and for paging, 24 in all. The patch is in this repo, not in Jellyfin. I haven't sent it anywhere. That's for its maintainers to want.

## What it doesn't tell you

The table is generated: names like `Person 000123`, each under one to three roles, one row in five differing only by case. I didn't measure a real library, and I don't know how many rows real libraries reach. The shape is what I trust, not the 55 seconds.

It's one machine, shared with other jobs. The grouped version at 20,000 rows ran from 39.7 to 86.1 milliseconds across five runs, so I quote medians, and I ran the slow version three times at that size, not five.

I timed the page query, not the whole endpoint, and only the case with no content restrictions on the user. Whether grouping is the fix Jellyfin would pick, or a stored lowercase name with its own index, is theirs to say. I didn't try the second.

## Receipts

- Machine: AMD Ryzen 9 5900X, 24 logical cores, Linux, .NET SDK 10.0.404, runtime 10.0.15, EF Core and Microsoft.Data.Sqlite 10.0.14. [environment.txt](https://github.com/Egoushka/personal-website/blob/post/teardown-jellyfin-people/evidence/jellyfin-persons/results/environment.txt)
- Code read: `jellyfin/jellyfin` master at `2953ed6`, `Jellyfin.Server.Implementations/Item/PeopleRepository.cs`, `GetPeople`.
- Benchmark and setup, including the by-name `Person` items `/Persons` requires and the `ANALYZE` Jellyfin runs: `evidence/jellyfin-persons/Program.cs` in the post's branch of this repo.
- Timings: `dotnet PeopleBench.dll time <rows> <runs>`, output in `time-baseline.txt` and `time-fix.txt`.
- Page hashes, the generated SQL and SQLite's plans: `dump-*.txt`, `query-*.sql`, `plan-*.txt`, made by `capture.sh`.
- The patch: `evidence/jellyfin-persons/upstream/0001-Collapse-people-by-name-with-one-grouped-pass.patch`.

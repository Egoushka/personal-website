---
title: "Jellyfin's /Persons query: 55 seconds at 20,000 rows, 48 milliseconds after one change"
date: "2026-11-16"
description: "One Jellyfin EF Core query on SQLite compares every row with every other row. Measured on my machine, same output with one change, and a patch I have not sent."
kind: finding
topics: ["dotnet", "efcore", "debugging"]
---

TODO: Yehor, the opening moment. What did you expect before you measured, what did you do when you saw the number, what surprised you? Replace this line with your answers; the post does not invent a scene.

The query behind Jellyfin's `/Persons` endpoint asks, for every row, whether any other row has the same name. On a generated table of 20,000 rows, one page of 100 took 55.4 seconds on my machine. I'm Yehor, a .NET dev ([about](/about/)); this is what I measured, how, and what it doesn't tell you. It's no complaint about Jellyfin's maintainers: the code is public, which is why anyone can check it.

## The query that checks every pair

Jellyfin's people page calls `GET /Persons`. Behind it, the `Peoples` table has one row per name and role, so someone who acts and directs is in it twice. The repository collapses that to one row per name, keeping the lowest id per lowercased name:

```csharp
dbQuery = candidates
    .Where(p => !candidates.Any(other => other.Name.ToLower() == p.Name.ToLower() && other.Id < p.Id))
    .OrderBy(e => e.Name.ToLower());
```

Read it as a question asked once per row: is there any other row with the same lowercased name and a smaller id? If not, the row stays.

There is an index on `Name`. But the question is about `lower(Name)`, and an index on the plain name can't answer a question about the lowercased one, the same way a phone book sorted by surname can't find you by the lowercase of it. So SQLite goes through the rows with a smaller id, for every row. Its own plan says so: `SEARCH p0 USING INDEX sqlite_autoindex_Peoples_1 (Id<?)`. That's a range over ids, not a lookup by name, so the work should grow roughly with the square of the row count.

## The number

I called the repository's `GetPeople` the way `/Persons` does, with a page size of 100, the total count on and the by-name item check set, against tables of three sizes. Medians, in milliseconds:

| Rows | Current | One grouped pass | Ratio |
|---|---|---|---|
| 1,000 | 141.7 | 3.1 | 45.7× |
| 5,000 | 3,752.7 | 10.3 | 364.3× |
| 20,000 | 55,379.5 | 47.7 | 1,161× |

Going from 1,000 to 5,000 rows is 5 times the rows and cost 26.5 times the time. Going from 5,000 to 20,000 is 4 times the rows and cost 14.8 times. Pure squaring would give 25 and 16, so it's close to quadratic. At 20,000 rows one page takes 55.4 seconds.

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

A faster query is worthless if it returns something different, so I paged through the whole result with both versions at 1,000 and at 5,000 rows and hashed every name and role, with the total count off for that comparison. The hashes match. Jellyfin's existing people tests pass with the change, plus two I added for the case-only collapse and for paging, 24 in all. The patch is in this repo, not in Jellyfin. I haven't sent it anywhere. That's for its maintainers to want.

## What it doesn't tell you

The table is generated: names like `Person 000123`, each under one to three roles, one row in five differing only by case. I didn't measure a real library, and I don't know how many rows real libraries reach. The shape is what I trust, not the 55 seconds.

It's one machine, shared with other jobs. The grouped version at 20,000 rows ran from 39.7 to 86.1 milliseconds across five runs, so I quote medians, and I ran the slow version three times at that size, not five.

I timed the repository call, not the whole endpoint, and only the case with no content restrictions on the user. Whether grouping is the fix Jellyfin would pick, or a stored lowercase name with its own index, is theirs to say. I didn't try the second.

## Receipts

- Machine: AMD Ryzen 9 5900X, 24 logical cores, Linux, .NET SDK 10.0.404, runtime 10.0.15, EF Core and Microsoft.Data.Sqlite 10.0.14. [environment.txt](https://github.com/Egoushka/personal-website/blob/779f9fb/evidence/jellyfin-persons/results/environment.txt)
- Code read: `jellyfin/jellyfin` master at `2953ed6`, `Jellyfin.Server.Implementations/Item/PeopleRepository.cs`, `GetPeople`.
- Benchmark and setup, including the by-name `Person` items `/Persons` requires and the `ANALYZE` Jellyfin runs: [Program.cs](https://github.com/Egoushka/personal-website/blob/779f9fb/evidence/jellyfin-persons/Program.cs) in this repo at `779f9fb`.
- Timings: `dotnet PeopleBench.dll time <rows> <runs>`, output in [time-baseline.txt](https://github.com/Egoushka/personal-website/blob/779f9fb/evidence/jellyfin-persons/results/time-baseline.txt) and [time-fix.txt](https://github.com/Egoushka/personal-website/blob/779f9fb/evidence/jellyfin-persons/results/time-fix.txt).
- Page hashes, the generated SQL and SQLite's plans: `dump-*.txt`, `query-*.sql` and `plan-*.txt` in the [results folder](https://github.com/Egoushka/personal-website/tree/779f9fb/evidence/jellyfin-persons/results), made by `capture.sh`.
- The patch: [0001-Collapse-people-by-name-with-one-grouped-pass.patch](https://github.com/Egoushka/personal-website/blob/2455c35/evidence/jellyfin-persons/upstream/0001-Collapse-people-by-name-with-one-grouped-pass.patch).

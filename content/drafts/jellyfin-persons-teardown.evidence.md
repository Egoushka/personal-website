# Evidence: jellyfin-persons-teardown

Thesis: Jellyfin's /Persons name-collapse query checks every row against every other row, so one page took 55.4 s at 20,000 rows on my machine, and a grouped rewrite gives the same output in 47.7 ms.

| Claim | Value | Source |
|---|---|---|
| code read: Jellyfin master commit, 2026-11-14 | 2953ed6 | https://github.com/jellyfin/jellyfin/commit/2953ed632c9277351483eff04f87a8276390691c |
| the NOT EXISTS with lower(Name) and Id comparison | lower, Id | jellyfin/jellyfin@2953ed632c9277351483eff04f87a8276390691c:Jellyfin.Server.Implementations/Item/PeopleRepository.cs#L55 |
| the index is on the plain Name column | Name | jellyfin/jellyfin@2953ed632c9277351483eff04f87a8276390691c:src/Jellyfin.Database/Jellyfin.Database.Implementations/ModelConfiguration/PeopleConfiguration.cs#L16 |
| SQLite plan range scans ids | Id<? | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/plan-baseline.txt#L3 |
| baseline median, 1,000 rows | 141.7 | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/time-baseline.txt#L1 |
| baseline median, 5,000 rows | 3,752.7 | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/time-baseline.txt#L2 |
| baseline median, 20,000 rows | 55,379.5 | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/time-baseline.txt#L3 |
| grouped median, 1,000 rows | 3.1 | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/time-fix.txt#L1 |
| grouped median, 5,000 rows | 10.3 | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/time-fix.txt#L2 |
| grouped median, 20,000 rows | 47.7 | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/time-fix.txt#L3 |
| grouped range at 20,000 rows | 39.7 to 86.1 | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/time-fix.txt#L3 |
| ratio at 1,000 rows | 45.7× | = 141.7 / 3.1 |
| ratio at 5,000 rows | 364.3× | = 3752.7 / 10.3 |
| ratio at 20,000 rows | 1,161× | = 55379.5 / 47.7 |
| time growth for 5x the rows | 26.5 times | = 3752.7 / 141.7 |
| time growth for 4x the rows | 14.8 times | = 55379.5 / 3752.7 |
| rows growth 1,000 to 5,000 | 5 | = 5000 / 1000 |
| rows growth 5,000 to 20,000 | 4 | = 20000 / 5000 |
| pure squaring for 5x | 25 | = 5 * 5 |
| pure squaring for 4x | 16 | = 4 * 4 |
| title: seconds, rounded | 55 | = 55379.5 / 1000 |
| title: milliseconds, rounded | 48 | = 47.7 + 0 |
| baseline at 20,000 rows in seconds | 55.4 | = 55379.5 / 1000 |
| page size | 100 | evidence/jellyfin-persons/Program.cs (Limit = 100), Egoushka/personal-website@779f9fb |
| runs at 1,000 and 5,000 rows | 5 | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/time-baseline.txt#L2 |
| runs of the baseline at 20,000 rows | 3 | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/time-baseline.txt#L3 |
| pages hashed identical at 1,000 rows | 510 rows | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/dump-baseline.txt#L2 |
| pages hashed identical at 5,000 rows | 2,501 rows | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/dump-baseline.txt#L4 |
| fix hashes equal baseline at 1,000 rows | DD6346B2 | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/dump-fix.txt#L2 |
| fix hashes equal baseline at 5,000 rows | F83D5C0B | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/dump-fix.txt#L4 |
| Jellyfin people tests pass with the patch, 2 of them new | 24 | command: dotnet test tests/Jellyfin.Server.Implementations.Tests --filter "FullyQualifiedName~PeopleRepository|FullyQualifiedName~PeopleUpdate" on the patched checkout, output "Passed! Passed: 24" (Yehor can rerun; patch at evidence/jellyfin-persons/upstream) |
| data shape: one to three roles, one row in five differs by case | 1 to 3, one in five | evidence/jellyfin-persons/Program.cs (rng.Next(3), rng.Next(5) == 0), Egoushka/personal-website@779f9fb |
| machine | Ryzen 9 5900X, 24, 10.0.404, 10.0.15, 10.0.14 | Egoushka/personal-website@779f9fb:evidence/jellyfin-persons/results/environment.txt |
| Jellyfin runs ANALYZE | ANALYZE | jellyfin/jellyfin@2953ed632c9277351483eff04f87a8276390691c:src/Jellyfin.Database/Jellyfin.Database.Providers.Sqlite/SqliteDatabaseProvider.cs#L261 |

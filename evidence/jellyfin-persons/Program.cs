using System.Diagnostics;
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;
using Emby.Server.Implementations.Data;
using Jellyfin.Data.Enums;
using Jellyfin.Database.Implementations;
using Jellyfin.Database.Implementations.Entities;
using Jellyfin.Database.Implementations.Locking;
using Jellyfin.Database.Providers.Sqlite;
using Jellyfin.Server.Implementations.Item;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

// Dump mode: `dotnet run -c Release -- dump <rows>` prints the SQL and the first 100 names, then times 5 calls.
if (args.Length > 0 && args[0] == "dump")
{
    var b = new PeopleBench { Rows = int.Parse(args[1]) };
    b.Setup();
    b.PrintSqlAndChecksum();
    return;
}

// Time mode: `dotnet run -c Release -- time <rows> <runs>` times one warm-up and <runs> calls of the page-100 query.
// BenchmarkDotNet's default job rebuilds the project in a child process, which for a patched checkout means
// a build of the wrong checkout; this mode measures the assembly it was started from.
if (args.Length > 0 && args[0] == "time")
{
    var b = new PeopleBench { Rows = int.Parse(args[1]) };
    b.Setup();
    b.GetPeople_Page100();
    var times = new List<double>();
    for (var i = 0; i < int.Parse(args[2]); i++)
    {
        var sw = Stopwatch.StartNew();
        b.GetPeople_Page100();
        times.Add(sw.Elapsed.TotalMilliseconds);
    }

    times.Sort();
    Console.WriteLine($"rows={args[1]} runs={times.Count} median_ms={times[times.Count / 2]:F1} min_ms={times[0]:F1} max_ms={times[^1]:F1} all_ms={string.Join(",", times.Select(t => t.ToString("F1")))}");
    return;
}

// Plan mode: `dotnet run -c Release -- plan <rows> "<sql>"` prints SQLite's query plan; @personType is bound.
if (args.Length > 0 && args[0] == "plan")
{
    var b = new PeopleBench { Rows = int.Parse(args[1]) };
    b.Setup();
    b.PrintPlan(args[2]);
    return;
}

BenchmarkSwitcher.FromAssembly(typeof(PeopleBench).Assembly).Run(args);

[MemoryDiagnoser]
[SimpleJob(warmupCount: 1, iterationCount: 5, invocationCount: 1, launchCount: 1)]
public class PeopleBench
{
    private SqliteConnection _connection;
    private DbContextOptions<JellyfinDbContext> _options;
    private PeopleRepository _repository;

    [Params(1_000, 5_000, 20_000)]
    public int Rows { get; set; }

    private JellyfinDbContext NewContext() => new(
        _options,
        NullLogger<JellyfinDbContext>.Instance,
        new SqliteDatabaseProvider(new Mock<IApplicationPaths>().Object, NullLogger<SqliteDatabaseProvider>.Instance),
        new NoLockBehavior(NullLogger<NoLockBehavior>.Instance));

    [GlobalSetup]
    public void Setup()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        var builder = new DbContextOptionsBuilder<JellyfinDbContext>().UseSqlite(_connection);
        if (Environment.GetEnvironmentVariable("PEOPLEBENCH_SQL") == "1")
        {
            builder.LogTo(Console.WriteLine, [RelationalEventId.CommandExecuted]);
        }

        _options = builder.Options;

        using (var ctx = NewContext())
        {
            ctx.Database.EnsureCreated();

            // Deterministic library: each person appears under 1 to 3 roles (Actor, Director, Writer),
            // as in the Peoples table, which has one row per (Name, PersonType). Rows is the row count.
            var rng = new Random(42);
            string[] types = ["Actor", "Director", "Writer"];
            var made = 0;
            var person = 0;
            while (made < Rows)
            {
                var name = $"Person {person++:D6}";
                var roles = 1 + rng.Next(3);
                for (var r = 0; r < roles && made < Rows; r++, made++)
                {
                    // About one in five rows differs only in case, the case-only duplicates the query collapses.
                    var n = rng.Next(5) == 0 ? name.ToUpperInvariant() : name;
                    ctx.Peoples.Add(new People { Id = new Guid(made + 1, 0, 0, new byte[8]), Name = n, PersonType = types[r] });
                }
            }

            ctx.SaveChanges();

            // GET /Persons sets MustHaveItem, so every distinct name also gets the by-name Person item the library keeps.
            var personType = new ItemTypeLookup().BaseItemKindNames[BaseItemKind.Person];
            var item = 0;
            foreach (var name in ctx.Peoples.Select(p => p.Name).Distinct().ToList())
            {
                ctx.BaseItems.Add(new BaseItemEntity { Id = new Guid(++item, 1, 0, new byte[8]), Name = name, Type = personType });
            }

            ctx.SaveChanges();
        }

        // Jellyfin runs ANALYZE on its database (SqliteDatabaseProvider.AnalyzeAsync); without statistics SQLite
        // picks a different index for the by-name item lookup, so the benchmark has to have them too.
        using (var analyze = _connection.CreateCommand())
        {
            analyze.CommandText = "ANALYZE";
            analyze.ExecuteNonQuery();
        }

        var factory = new Mock<IDbContextFactory<JellyfinDbContext>>();
        factory.Setup(f => f.CreateDbContext()).Returns(NewContext);
        _repository = new PeopleRepository(factory.Object, new ItemTypeLookup(), new Mock<IItemQueryHelpers>().Object);
    }

    [GlobalCleanup]
    public void Cleanup() => _connection.Dispose();

    // What GET /Persons?limit=100 runs when no user filter applies: no ItemId, so the name-collapse branch.
    [Benchmark]
    public int GetPeople_Page100() => _repository.GetPeople(new InternalPeopleQuery { Limit = 100, MustHaveItem = true }).Items.Count;

    [Benchmark]
    public int GetPeople_Page100_NoCount() => _repository.GetPeople(new InternalPeopleQuery { Limit = 100, MustHaveItem = true, EnableTotalRecordCount = false }).Items.Count;

    public void PrintPlan(string sql)
    {
        using var cmd = _connection.CreateCommand();
        cmd.CommandText = "EXPLAIN QUERY PLAN " + sql;
        cmd.Parameters.AddWithValue("@personType", new ItemTypeLookup().BaseItemKindNames[BaseItemKind.Person]);
        cmd.Parameters.AddWithValue("@p", 100);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            Console.WriteLine($"{reader.GetInt32(0)} {reader.GetInt32(1)} {reader.GetString(3)}");
        }
    }

    public void PrintSqlAndChecksum()
    {
        var r = _repository.GetPeople(new InternalPeopleQuery { Limit = 100, MustHaveItem = true });
        var sw = Stopwatch.StartNew();
        for (var i = 0; i < 5; i++)
        {
            _repository.GetPeople(new InternalPeopleQuery { Limit = 100, MustHaveItem = true });
        }

        Console.WriteLine($"rows={Rows} total={r.TotalRecordCount} page={r.Items.Count} avg_ms={sw.Elapsed.TotalMilliseconds / 5:F1}");
        Console.WriteLine("first: " + string.Join(",", r.Items.Take(5).Select(p => p.Name + "/" + p.Type)));
        var all = new List<string>();
        for (var start = 0; start < r.TotalRecordCount; start += 100)
        {
            all.AddRange(_repository.GetPeople(new InternalPeopleQuery { Limit = 100, MustHaveItem = true, StartIndex = start, EnableTotalRecordCount = false }).Items.Select(p => p.Name + "/" + p.Type));
        }

        Console.WriteLine($"all pages: {all.Count} rows, sha256 " + Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(string.Join("|", all)))));
        Console.WriteLine("checksum: " + Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(string.Join("|", r.Items.Select(p => p.Name + "/" + p.Type))))));
    }
}

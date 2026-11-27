---
title: "Commit the answer, not the prompt: a lock file for model-written C#"
date: "2026-11-27"
description: "implock: a C# method signature and doc comment are the spec, a model writes the body once, and a committed lock file keeps it, so a build never calls a model."
kind: build
project: "implock"
topics: ["dotnet", "architecture"]
searchTitle: "implock: a lock file for model-written C# method bodies"
---

When a model writes a method body, what belongs in version control: the prompt, or the answer? The prompt is short and cheap to keep, but ask again and you get a different body, and nothing records what the model was shown. The answer is the code that ships. implock commits the answer and keeps the spec in the source next to it.

## What the spec is

A bodiless partial method marked `[Implement]` is the spec: its signature, its XML doc comment and optional named tests.

```csharp
/// <summary>Counts the words in the text. Words are separated by one or more spaces.</summary>
[Implock.Implement("counts: WordCount(\"a  b c\") == 3", "empty: WordCount(\"\") == 0")]
public static partial int WordCount(string text);
```

`implock generate` pipes a prompt built from that spec to a model command you name and reads the body from its output. It refuses a body that does not parse or that leaves the generated file with compile errors. What passes goes into `implement.lock`, a plain-text file you read in a diff and commit like any other.

## What the build does

A Roslyn source generator, a compiler plug-in that adds code at build time, reads the lock and emits the body. It never reads a model. There is no API client, no network code and no key anywhere in it.

The link between spec and body is a hash: SHA-256 over the normalized signature, doc comment and attribute arguments. Edit the spec and the stored entry no longer matches, and the compiler says so: IMPL001 for a missing entry, IMPL002 for a stale one, IMPL003 for an orphan, IMPL004 for a lock that is malformed or a body that does not parse. A stale spec fails the build, so it cannot ship with yesterday's body.

## Decisions that cost something

**The model is a command, not a library.** Whatever reads stdin and writes a body to stdout works; the default is `claude -p`. The price: no streaming, no retries, no token counts, and every provider quirk is yours to wrap.

**A plain-text lock instead of generated `.cs` files.** The lock is deterministic, so a diff shows exactly which body changed. The price is that you read bodies in a lock file, not in the file where the method lives.

**Verification means it compiles.** A body that compiles can still be wrong. For that gap there is `implock report`: it takes your hand-written body and the generated one, draws inputs for every parameter by class (empty, whitespace, small, large, negative and so on), runs both, and lists the classes where your original rejects and the generated body accepts. These are the places the model is looser than you were. The price: it handles only static, non-generic methods whose parameters are string, int, long, double, bool or char, and finding nothing proves nothing, since it sees only the classes and the seed it reaches.

On the sample pair in the repo, the original rejects a whitespace-only title and the generated body does not. The report lists 3 of 48 input classes as looser, 0 as stricter, 0 as different. For an identical pair it finds 0 looser classes, a case a test covers. That pair is planted by me to check the tool, not a model's real mistake. The tool's job is to catch that kind of difference; I have no count yet of how often a real model produces it.

## What exists and what does not

The repo has 97 automated tests, all passing. It needs the .NET 10 SDK, and it is not on NuGet, so today you clone and build.

Project loading reads the `.cs` files of one directory. A spec whose signature uses a type from a project reference, or from a framework such as ASP.NET Core, cannot be locked yet, and `generate` refuses it with exit code 2.

The bodies in the sample lock came from a scripted stand-in command, not a real model. A lock written by a real model, and a count of how often its bodies differ from a hand-written one, would be the next thing to learn.

Code: [github.com/Egoushka/implock](https://github.com/Egoushka/implock), MIT. More under [.NET](/topics/dotnet/).

## Receipts

- Automated tests: 97, 0 failed. `dotnet test -c Release` at commit ae87abb of Egoushka/implock.
- 3 looser input classes of 48 explored, 0 stricter, 0 differing: `implock report --original samples/report/Original.cs --generated samples/report/Generated.cs --method ReportSample.Slugs.Slug`, same commit.
- 0 looser classes for an identical pair: `ReportTests` in `tests/Implock.Cli.Tests`.
- Diagnostics IMPL001 to IMPL004, SHA-256 spec hash, default model command `claude -p`, exit code 2 for a refused spec: README of the repo at the same commit.

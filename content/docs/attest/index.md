---
title: "Overview"
description: "What Attest validates, how a value becomes a verdict, what it leaves to other tools, and where the library stands at 1.2.1."
order: 1
section: "Get started"
---

Attest checks whether a national identification number, a tax identification number, a VAT number
or a postal code is well formed for one of 87 countries, against the rule that country publishes.
It is a C# library: it runs in-process, makes no network call, and answers every call with a
result rather than an exception. It ships on nuget.org as two packages, `Attest` and
`Attest.DataAnnotations`.

Attest started as a fork of [CountryValidator](https://github.com/anghelvalentin/CountryValidator)
1.1.3. Three repair waves fixed 197 defects in it (52, 80 and 65), each against the rule the
issuing authority publishes; [CHANGELOG.md](../../CHANGELOG.md) lists them one by one. The 87 is
the country table in [CountryValidator.cs](../../Attest/CountryValidator.cs): one validator for
every member of `Country` except `XX`.

## Who it is for

.NET developers who take these numbers on a form, in an import or in a batch of rows, and want to
reject the malformed ones before they are stored or sent on to a registry.

## How a value becomes a verdict

`CountryValidator` holds one validator per country, built once per process. You call one of its
five methods, or `Validate` with an `IdentifierKind`, and pass the value and a `Country`. The
country's class in `Attest.Countries` does the work. A typical method,
[BelgiumValidator.cs](../../Attest/CountriesValidators/BelgiumValidator.cs) for one:

1. drops separators and punctuation, keeping letters and ASCII digits;
2. removes a printed prefix such as `BE` from the start of the value;
3. checks the shape against an anchored pattern of `[0-9]` and letter classes;
4. checks field ranges, such as a birth date, a region code or a holder type;
5. computes the check digit, where the authority publishes the algorithm.

You get a `ValidationResult` back: `IsValid`, and when it is false, an `ErrorMessage` for a
developer to read. When the country has no rule for what you asked, the answer is `Not supported`,
and `Supports(country, kind)` tells that apart from a wrong value.
[How a country's rule is modelled](rules.md) has the detail.

## What it does not do

- **It does not tell you a number is registered.** A well-formed VAT number can belong to nobody.
  For EU VAT that answer comes from the European Commission's VIES service, and the README points
  to [vies-dotnet-api](https://github.com/zapadi/vies-dotnet) for it
  ([README](../../README.md#what-this-checks-and-what-it-does-not)).
- **It does not invent a check digit.** Where the authority publishes no algorithm, the validator
  checks the format and the field ranges, and the gap is written down in
  [KNOWN-ISSUES.md](../../KNOWN-ISSUES.md) ([AGENTS.md](../../AGENTS.md), rule 1).
- **It does not pick a side** when a country issues one number to people and companies alike.
  `IdentifierResult.IsAmbiguous` says so, and you decide
  ([IdentifierResult.cs](../../Attest/IdentifierResult.cs)).
- **Its messages are not for end users.** `ErrorMessage` is an English string, not localised and
  not meant for the person whose number it is, and there is no error code
  ([ValidationResult.cs](../../Attest/ValidationResult.cs)).
- **It sends, stores and logs nothing.** No network, no files, nothing kept after a call
  ([SECURITY.md](../../SECURITY.md)).

## Where it stands

- **1.2.1 is the latest release**, on nuget.org for both packages
  ([CHANGELOG.md](../../CHANGELOG.md#121)). The commits on `main` after the `v1.2.1` tag change
  CI, Dependabot and repository files, not the library, so this guide describes 1.2.1.
- **4,212 tests pass** with `dotnet test Attest.Tests/Attest.Tests.csproj`. CI builds with
  warnings as errors, runs the tests, packs both packages, and compiles a .NET Framework 4.7.2 and
  a netstandard2.0 consumer against what it packed ([ci.yml](../../.github/workflows/ci.yml)).
- **25 of the 435 country and kind pairs have no rule** (87 countries, five kinds each).
  [The reference](reference.md#kinds-with-no-rule) lists them.
- **33 known weaknesses** are written down in [KNOWN-ISSUES.md](../../KNOWN-ISSUES.md): 19 open
  gaps, almost all of them check digits no authority publishes, 12 decided against, and 2 settled
  as not defects.
- **The newest minor is the supported line.** Fixes ship forward and are not backported
  ([README](../../README.md#install)).
- **License:** Apache 2.0 ([LICENSE](../../LICENSE)); the original work is Anghel Valentin's
  ([NOTICE](../../NOTICE)).

[Status and evidence](status.md) gives each of these with the test or file behind it.

## Where to go next

- [Quickstart](quickstart.md): install the package and validate one number, end to end.
- [Validate identifiers](validating.md): methods and kinds, input, results, countries with no rule,
  numbers that serve two roles.
- [Validate model properties](data-annotations.md): the five DataAnnotations attributes.
- [Upgrade and re-check stored numbers](upgrading.md): why a minor release can change verdicts,
  and moving from CountryValidator.
- [How a country's rule is modelled](rules.md): the classes, the normaliser, and the invariants
  the tests enforce.
- [Reference](reference.md): every public type and member, and every country class.
- [Status and evidence](status.md): what works, what is partial, what is not built.

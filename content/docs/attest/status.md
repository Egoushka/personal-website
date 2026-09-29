---
title: "Status and evidence"
description: "What works, what is partial and what is not built, each with the test or file behind it, and where other documents in the repository disagree with the code."
order: 8
section: "Project"
---

Each row names its evidence. `works` means a test in this repository covers it and passes: the
suite is 4,212 tests, all passing with `dotnet test Attest.Tests/Attest.Tests.csproj` at 1.2.1.
`partial` means part of it is missing, or nothing in the repository tests it. `not yet` means it is
not built. No test calls the network or a registry.

## Status

| Capability | Status | Evidence |
|---|---|---|
| Rules for 87 countries, one class and one test file each | works | [CountriesValidators](../../Attest.Tests/CountriesValidators/) |
| Every method answers rather than throws | works | [UnicodeDigitSweepTests](../../Attest.Tests/UnicodeDigitSweepTests.cs), [ValidatorClassSweepTests](../../Attest.Tests/ValidatorClassSweepTests.cs) |
| The verdict does not depend on the thread culture | works | [CultureSweepTests](../../Attest.Tests/CultureSweepTests.cs) |
| A prefix is stripped from the start only | works | [PrefixStripTests](../../Attest.Tests/PrefixStripTests.cs) |
| Digits outside 0-9 are rejected, never parsed | works | [IdExtensionsTests](../../Attest.Tests/IdExtensionsTests.cs), [UnicodeDigitSweepTests](../../Attest.Tests/UnicodeDigitSweepTests.cs) |
| No culture-sensitive construct in shipped source | works | [SourceConventionSweepTests](../../Attest.Tests/SourceConventionSweepTests.cs) |
| Asking by category, with ambiguity reported | works | [CountryValidatorKindsTests](../../Attest.Tests/CountryValidatorKindsTests.cs), [NigeriaValidatorTests](../../Attest.Tests/CountriesValidators/NigeriaValidatorTests.cs) |
| `Supports` agrees with the README's country table | works | [ReadmeTableTests](../../Attest.Tests/ReadmeTableTests.cs) |
| Every open upstream bug report answered | works | [UpstreamReportTests](../../Attest.Tests/UpstreamReportTests.cs) |
| The DataAnnotations attributes | works | [DataAnnotationsTests](../../Attest.Tests/DataAnnotationsTests.cs) |
| Every public member documented | works | [ci.yml](../../.github/workflows/ci.yml), [Directory.Build.props](../../Directory.Build.props) |
| A rule for all five kinds in every country | partial | [CountryValidator.cs](../../Attest/CountryValidator.cs), [ReadmeTableTests](../../Attest.Tests/ReadmeTableTests.cs) |
| The `netstandard2.0` build | partial | [ci.yml](../../.github/workflows/ci.yml), [Attest.PackageConsumer](../../Attest.PackageConsumer/) |
| A cited source beside every rule | partial | [CONTRIBUTING.md](../../CONTRIBUTING.md), [CountriesValidators](../../Attest/CountriesValidators/) |
| One validator shared across threads | partial | [CountryValidator.cs](../../Attest/CountryValidator.cs) |
| Check digits no authority publishes | not yet | [KNOWN-ISSUES.md](../../KNOWN-ISSUES.md) |
| Regex timeouts and input length limits | not yet | [SECURITY.md](../../SECURITY.md) |
| Benchmarks | not yet | [Attest.sln](../../Attest.sln) |

## What the rows that work rest on

- **87 countries.** `CountryValidator.Load()` registers one class per `Country` member except `XX`,
  and `Attest.Tests/CountriesValidators` holds 88 test files: one per country and
  `CountryValidatorTests` for the facade.
- **Never throws.** `UnicodeDigitSweepTests` runs every `Country` member through the five named
  methods and `Validate` with non-ASCII digits, `null`, `""`, whitespace, punctuation and letters.
  `ValidatorClassSweepTests` calls the 87 classes directly, including every extra public method
  that takes a string, and fails a rejection that gives no reason.
- **Culture.** `CultureSweepTests` asks every country the same questions under the invariant,
  `tr-TR` and `az-AZ` cultures, and checks 14 lowercase values that must stay valid in all three.
- **Prefixes.** `PrefixStripTests` has 39 rows. Each asserts the bare value, the prefixed value in
  both cases, the prefix spliced inside the value and the prefix as a suffix.
- **Source conventions.** `SourceConventionSweepTests` reads both packages' source, comments
  stripped, for `\d`, `char.IsDigit`, `ToUpper()` and `StartsWith` or `EndsWith` without a
  `StringComparison`.
- **Ambiguity.** `CountryValidatorKindsTests` covers Armenia and the Russian sole trader against a
  Russian company, `NigeriaValidatorTests` Nigeria's TINs, and
  [PeruValidatorTests](../../Attest.Tests/CountriesValidators/PeruValidatorTests.cs) the Peruvian
  RUC types.
- **Upstream reports.** `UpstreamReportTests` asserts ten CountryValidator issues, numbers 9, 10,
  13, 14, 15, 19, 21, 22, 24 and 27, each with the value its reporter wrote.
- **Attributes.** `DataAnnotationsTests` checks all five for a valid and an invalid value, `null`,
  a non-string, the member name, the recorded reason and a reused context.
- **Documentation.** `CS1591` is not suppressed, and CI builds with `-warnaserror`, so a public
  member without an XML comment fails the build.

[How a country's rule is modelled](rules.md#the-invariants-and-the-tests-that-hold-them) explains
why each of these exists.

## What is partial

### A rule for all five kinds in every country

25 of the 435 country and kind pairs have no rule. For those, `Supports` is false and every value
answers `Not supported`; the [reference](reference.md#kinds-with-no-rule) lists them. Nine are VAT
numbers and eight company numbers. Each of the 12 classes gives the same reason in a doc comment,
that the country has no published rule for the kind. Only Pakistan's gap has an entry saying what
was checked: the FBR publishes no format or check digit for its National Tax Number or its sales
tax registration number ([KNOWN-ISSUES.md](../../KNOWN-ISSUES.md#pakistan)).

### The netstandard2.0 build

`Attest.Tests` targets `net9.0`, so every test runs against the `net8.0` build. The
`netstandard2.0` build is compiled, not tested: CI builds a `net472` and `netstandard2.0` project
against the packages it has just packed, which proves that they resolve, including the dependency
`Attest.DataAnnotations` declares for `netstandard2.0` alone
([ci.yml](../../.github/workflows/ci.yml)).

### A cited source beside every rule

Every rule change must cite a published source beside the code
([CONTRIBUTING.md](../../CONTRIBUTING.md), rule 1). The rules inherited from CountryValidator did
not all get one: 60 of the 87 files in `Attest/CountriesValidators` contain a URL, and 27 contain
none. `grep -LE 'http|www\.' Attest/CountriesValidators/*.cs` lists them.

### One validator shared across threads

`CountryValidator` builds its table once, and its documentation says nothing in it holds state
([CountryValidator.cs](../../Attest/CountryValidator.cs)). No test calls it from several threads at
once.

## What is not built

### Check digits no authority publishes

[KNOWN-ISSUES.md](../../KNOWN-ISSUES.md) holds 33 entries under 26 country headings: 19 marked
*Not fixed*, 12 *Won't fix* and 2 *Settled*. 1.2.0's changelog counts sixteen of the 19 open ones
as check digits the issuing authority does not publish
([CHANGELOG.md](../../CHANGELOG.md#120)): Armenia's TIN, Nigeria's NIN and TINs, and the 15-digit
UAE identity number among them. For those numbers the validator checks the format and the field
ranges only. They stay closed until a source appears, because a guessed algorithm rejects real
numbers ([CONTRIBUTING.md](../../CONTRIBUTING.md#where-to-start)).

The *Won't fix* and *Settled* entries are decisions, not work waiting: the sources were read and
argue against the change, or the behaviour is what the country publishes.

### Regex timeouts and input length limits

None of the 249 `Regex.IsMatch` calls in `Attest` sets a match timeout, and no entry point caps the
length of its input. [SECURITY.md](../../SECURITY.md) knows of no input that makes a pattern slow,
and treats one that takes longer than milliseconds as worth reporting.

### Benchmarks

The solution holds the library, the attributes and the tests ([Attest.sln](../../Attest.sln)). No
benchmark project exists, so this guide states no timing or throughput figure.

## Where other documents disagree with the code

This guide follows the code at 1.2.1. These statements elsewhere in the repository were true once
and are not now:

- **Validator classes that throw.** [CONTRIBUTING.md](../../CONTRIBUTING.md) rule 4 and
  [SECURITY.md](../../SECURITY.md) say eleven classes still throw `NotSupportedException` for a kind
  with no rule, and that `Supports` depends on the throw. Since 1.1.0 each class declares those
  kinds in `UnsupportedKinds`, `Supports` reads the declaration, and no class throws:
  `new MonacoValidator().ValidateIndividualTaxCode(x)` answers `Not supported`
  ([IdValidationAbstract.cs](../../Attest/IdValidationAbstract.cs),
  [ValidatorClassSweepTests](../../Attest.Tests/ValidatorClassSweepTests.cs)). CHANGELOG.md and
  MIGRATION.md agree with the code.
- **The supported versions.** SECURITY.md lists 1.0.x as the supported line. The README says the
  newest minor is, and the latest release is 1.2.1.
- **Counts in CONTRIBUTING.md.** It gives the suite as 3,765 cases and KNOWN-ISSUES.md as 48
  entries across 29 headings. The suite is 4,212 tests, as the README says, and KNOWN-ISSUES.md has
  33 entries under 26 headings.
- **[docs/adding-a-country.md](../adding-a-country.md).** It says `Country` members carry no
  explicit values; each one has a value ([Country.cs](../../Attest/Country.cs)). It says `^\d{11}$`
  is safe after the normaliser and that `BelgiumValidator` uses it; `\d` anywhere in shipped source
  fails `SourceConventionSweepTests`, and `BelgiumValidator` uses `[0-9]{11}`. It says
  KNOWN-ISSUES.md still lists the Unicode digit mismatch for about 70 validators, and that Belarus
  strips the Cyrillic UNP label from anywhere in the value; neither is true now. Its Peru example asserts that
  `10054148289` is unambiguous; since 1.2.0 it is ambiguous
  ([PeruValidatorTests](../../Attest.Tests/CountriesValidators/PeruValidatorTests.cs)).
- **The issue chooser.** [config.yml](../../.github/ISSUE_TEMPLATE/config.yml) says around 60
  validators check less than their country publishes. KNOWN-ISSUES.md has 33 entries across 26
  countries.

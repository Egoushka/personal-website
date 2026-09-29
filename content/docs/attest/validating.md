---
title: "Validate identifiers"
description: "Pick a method or a kind, pass the value as printed, read the result, and handle countries with no rule and numbers that serve two roles."
order: 3
section: "Guides"
---

Every call makes the same few choices: which method or kind, what the input may look like, how to
read the answer, and what to do when a country has no rule or issues one number for two roles.
This page takes them in that order. The examples assume `using Attest;` and one
`var validator = new CountryValidator();`.

## Pick a method or a kind

| Number | `CountryValidator` method | Country class method | Kind |
|---|---|---|---|
| national identity number | `ValidateNationalIdentityCode` | `ValidateNationalIdentity` | `PersonalId` |
| a person's tax number | `ValidateIndividualTaxCode` | `ValidateIndividualTaxCode` | `PersonalTaxCode` |
| company registration number | `ValidateEntity` | `ValidateEntity` | `CompanyNumber` |
| VAT registration number | `ValidateVAT` | `ValidateVAT` | `Vat` |
| postal code | `ValidateZIPCode` | `ValidatePostalCode` | `PostalCode` |

Use a named method when you know what the field holds. Use `Validate` with an `IdentifierKind`
when the question is a category, such as "any business identifier this country issues"; see
[Ask by category](#ask-by-category).

60 of the 87 country classes do not override `ValidateNationalIdentity`, so it applies the
personal tax code rule ([IdValidationAbstract.cs](../../Attest/IdValidationAbstract.cs)), and
`PersonalId` and `PersonalTaxCode` give the same answer there. Belgium is one: its national
register number is both. The other 27 override it with a separate number, such as Armenia's
ten-digit public services number next to its eight-digit TIN
([ArmeniaValidator.cs](../../Attest/CountriesValidators/ArmeniaValidator.cs)).

## Pass the value as it is printed

You do not need to clean the input first.

- **Separators and punctuation are dropped.** `IdExtensions.RemoveSpecialCharacthers` keeps
  letters of any script and the digits 0-9 and drops everything else, so `93.05.18-223.61` and
  `93051822361` are the same input. All 87 validator files call it, 276 times in all. The
  misspelling is public API and stays ([CONTRIBUTING.md](../../CONTRIBUTING.md), rule 5).
- **A digit outside 0-9 is rejected, never parsed.** Arabic-Indic, Devanagari and fullwidth digits
  become `U+FFFD`, which no format check accepts. They are not dropped either: dropping one would
  validate the digits that remain ([IdExtensionsTests](../../Attest.Tests/IdExtensionsTests.cs)).
- **A printed prefix is stripped from the start only, in either case.** `PL8567346215` and
  `pl8567346215` are valid Polish VAT numbers; `85PL67346215` is not. Some prefixes are not the
  ISO code: Greece prints `EL`, Monaco files under `FR`, a Belarusian UNP carries `UNP`, and an
  Austrian company number `FN` ([PrefixStripTests](../../Attest.Tests/PrefixStripTests.cs),
  39 rows). The label spelt in Cyrillic is stripped too
  ([BelarusValidator.cs](../../Attest/CountriesValidators/BelarusValidator.cs)).
- **Case is folded with the invariant culture.** A lowercase value gets the same verdict on a
  `tr-TR` or `az-AZ` thread as anywhere else ([CultureSweepTests](../../Attest.Tests/CultureSweepTests.cs)).
- **`null`, an empty string and whitespace** return a result with `IsValid` false.

One method keeps its separator: `UnitedStatesValidator.ValidatePostalCode` trims the value instead
of normalising it, because the hyphen or space is part of ZIP+4. It accepts `12345`, `12345-6789`
and `12345 6789` ([UnitedStatesValidator.cs](../../Attest/CountriesValidators/UnitedStatesValidator.cs)).

## Read the result

A named method returns a `ValidationResult` with two properties:

- `IsValid`, the verdict.
- `ErrorMessage`, `null` when the value is valid, otherwise why it was rejected: `Invalid
  checksum.` for a well-formed value whose check digit does not match, `Invalid format. The code
  must have this format …` with an example of the right shape, `Invalid length`, `Invalid date`,
  `Not supported`, or a country's own reason such as `Invalid taxpayer type`.

There is no error code, and the message is not localised or meant for the person whose number it
is ([ValidationResult.cs](../../Attest/ValidationResult.cs)). Log it; branch on `IsValid`. The
[reference](reference.md#validationresult) lists the messages and the factories behind them.

## Tell a missing rule from a wrong value

A kind the country has no rule for answers `Not supported`, for every value. So does a `Country`
with no validator, such as `Country.XX`
([CountryValidatorTests](../../Attest.Tests/CountriesValidators/CountryValidatorTests.cs)). Ask
before you read a rejection as "this number is wrong":

```csharp title="Check for a rule before reporting a wrong number"
if (!validator.Supports(country, IdentifierKind.Vat))
{
    // No rule for this country: say nothing about the number itself.
}
else if (!validator.ValidateVAT(value, country).IsValid)
{
    // A malformed or mistyped VAT number.
}
```

`Supports` is false for a kind with no rule and for an unregistered country. Given a combination
such as `IdentifierKind.Business`, it is true only when every kind in it has a rule
([CountryValidator.cs](../../Attest/CountryValidator.cs)). `CountryValidator.IsCountrySupported`
and `CountryValidator.SupportedCountries` answer at the country level. The
[reference](reference.md#kinds-with-no-rule) lists the 25 pairs with no rule.

## Ask by category

`Validate(value, country, kinds)` asks whether the value is valid as any of `kinds`, which
defaults to `IdentifierKind.Any`. It returns an `IdentifierResult`:

| Property | Holds |
|---|---|
| `IsValid` | whether the value matched at least one requested kind |
| `Requested` | the kinds you asked for |
| `Matched` | every kind the value is valid as, requested or not |
| `Details` | the `ValidationResult` of each kind evaluated |
| `IsAmbiguous` | whether it matched a personal and a business kind |

`Validate` evaluates all four personal and business kinds whatever you ask for, because that is
the only way to know whether a match is ambiguous, and adds `PostalCode` when you include it. A
kind with no rule shows `Not supported` in `Details` and never matches
([CountryValidator.cs](../../Attest/CountryValidator.cs)).

`PostalCode` is outside `Any`: a postal code identifies a place, not a person or a company.
`Validate("1000", Country.BE)` is invalid, and `Validate("1000", Country.BE,
IdentifierKind.PostalCode)` is valid
([CountryValidatorKindsTests](../../Attest.Tests/CountryValidatorKindsTests.cs)).

## Handle a number that serves two roles

`IsAmbiguous` is true when the value matched at least one personal kind and at least one business
kind. It happens in two ways
([IdentifierResult.cs](../../Attest/IdentifierResult.cs)):

- **One number for both.** Armenia's eight-digit TIN and Nigeria's TINs are issued to people and
  companies alike and record neither
  ([CountryValidatorKindsTests](../../Attest.Tests/CountryValidatorKindsTests.cs),
  [NigeriaValidatorTests](../../Attest.Tests/CountriesValidators/NigeriaValidatorTests.cs)).
- **A sole trader's VAT number.** In Russia, Peru, Indonesia and Ukraine a sole trader files VAT
  under a personal number, so that number is a personal tax code and a VAT number at once
  ([PeruValidatorTests](../../Attest.Tests/CountriesValidators/PeruValidatorTests.cs)).

Where the number does record its holder, the personal and business methods reject each other's
numbers: Peru's RUC prefix, Andorra's NRT letter, Iceland's 40 added to the day for an
organisation, Thailand's agency digits, and Russia's ten-digit company INN against the
twelve-digit personal one ([CONTRIBUTING.md](../../CONTRIBUTING.md), rule 7). In Peru, 10, 15 and
17 mark a person and 20 a legal entity
([PeruValidator.cs](../../Attest/CountriesValidators/PeruValidator.cs)).
`ValidateIndividualTaxCode("7707083893", Country.RU)` is invalid, while
`Validate("7707083893", Country.RU, IdentifierKind.Business)` is valid and not ambiguous.

> [!TIP]
> If you asked for one category only, decide what an ambiguous match is worth to you. The country
> cannot tell the two readings apart, so the library does not either.

## Call a country's class directly

Each country has a public class in `Attest.Countries`, if you want to skip the dispatch:

```csharp title="One country's class"
using Attest.Countries;

bool valid = new BelgiumValidator().ValidateVAT("BE0428759497").IsValid;
```

The classes keep the same contract: every method answers rather than throws, for any input
([ValidatorClassSweepTests](../../Attest.Tests/ValidatorClassSweepTests.cs)), and a kind with no
rule answers `Not supported`. Two names differ from the facade: `ValidateNationalIdentity` and
`ValidatePostalCode`. Seventeen classes add methods of their own, such as
`UnitedStatesValidator.ValidateSSN` and `RussiaValidator.ValidateOGRN`. Class names do not always
follow the English country name (`KazahstanValidator`, `CzechValidator`); the
[reference](reference.md#country-and-the-country-classes) maps every code to its class.

## Validate many values

Construct one `CountryValidator` and reuse it. The country table is built once per process, and
the class's own documentation says nothing in it holds state
([CountryValidator.cs](../../Attest/CountryValidator.cs)). No test in the repository calls it from
several threads at once. There is no batch method: loop, and keep one result per row.

```csharp title="One validator, many rows"
var validator = new CountryValidator();
var rows = new[] { (Country.BE, "BE0428759497"), (Country.PL, "85PL67346215") };

foreach (var (country, vat) in rows)
{
    ValidationResult result = validator.ValidateVAT(vat, country);
    Console.WriteLine($"{country} {vat}: {(result.IsValid ? "valid" : result.ErrorMessage)}");
}
```

```text title="Output"
BE BE0428759497: valid
PL 85PL67346215: Invalid format. The code must have this format 1234567890
```

> [!WARNING]
> No regular expression in the library sets a match timeout, and no entry point caps the length of
> its input ([SECURITY.md](../../SECURITY.md)). If you validate untrusted values in bulk, bound
> their length before you call.

A minor release can change verdicts. If you store what you validated, re-check it when you
upgrade: [Upgrade and re-check stored numbers](upgrading.md).

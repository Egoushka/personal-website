---
title: "How a country's rule is modelled"
description: "One class per country, five methods, a shared normaliser, how gaps and ambiguity are represented, and the tests that hold every validator to one contract."
order: 6
section: "Concepts"
---

A country's rules live in one class, and every class answers the same five questions the same way.
This page is the shape of that class, the path a value takes through it, and the tests that keep
all 87 of them to one contract. It is also where to start before
[adding or fixing a country](#adding-or-fixing-a-country).

## One class per country

Each country is a public class in `Attest.Countries` that derives from `IdValidationAbstract`
([IdValidationAbstract.cs](../../Attest/IdValidationAbstract.cs)). The base class declares:

- `CountryCode`, the alpha-2 code, which the constructor sets;
- four abstract methods, `ValidateIndividualTaxCode`, `ValidateEntity`, `ValidateVAT` and
  `ValidatePostalCode`, and a virtual `ValidateNationalIdentity` that defers to
  `ValidateIndividualTaxCode` unless the class overrides it;
- an internal `UnsupportedKinds`, the kinds the country has no rule for.

`CountryValidator` builds a dictionary of the 87 classes once, in its static constructor, keyed by
`Country`; `XX` has no entry ([CountryValidator.cs](../../Attest/CountryValidator.cs)). Every
public member goes through it: the five named methods, `Validate`, `Supports`,
`IsCountrySupported` and `SupportedCountries`. The five attributes call the named methods.

## From a string to a verdict

Belgium's VAT method shows the usual order
([BelgiumValidator.cs](../../Attest/CountriesValidators/BelgiumValidator.cs)):

```csharp title="BelgiumValidator.ValidateVAT"
public override ValidationResult ValidateVAT(string id)
{
    id = id.RemoveSpecialCharacthers();
    id = id.StripPrefix("BE");

    if (id.Length == 9)
    {
        id = id.PadLeft(10, '0');
    }

    if (!Regex.IsMatch(id, @"^[0-1]?[0-9]{9}$"))
    {
        return ValidationResult.InvalidFormat("1234567890");
    }

    var isValid = 97 - int.Parse(id.Substring(0, 8)) % 97 == int.Parse(id.Substring(8, 2));
    return isValid ? ValidationResult.Success() : ValidationResult.InvalidChecksum();
}
```

1. **Normalise.** `RemoveSpecialCharacthers` keeps letters of any script and the digits 0-9, drops
   separators and punctuation, turns `null` into an empty string, and replaces any other decimal
   digit with `U+FFFD` ([IdExtensions.cs](../../Attest/IdExtensions.cs)). Letters of every script
   survive because a Belarusian UNP is printed with Cyrillic look-alikes, which `BelarusValidator`
   maps to the Latin letters they resemble, such as a Cyrillic ES to a Latin C, not to their
   sounds ([CONTRIBUTING.md](../../CONTRIBUTING.md), rule 5).
2. **Strip the prefix.** The internal `StripPrefix` removes a printed code from the start of the
   value only, ignoring case, with an ordinal comparison. It has 56 call sites in 47 classes.
3. **Check the shape.** Patterns are anchored and use `[0-9]`, never `\d`: .NET's `\d` matches every
   Unicode decimal digit, and `int.Parse` accepts only ASCII (rule 6). A mismatch returns
   `InvalidFormat` with an example, and the example must be a value the rule accepts
   ([ValidationResult.cs](../../Attest/ValidationResult.cs)).
4. **Check the fields.** Dates, region codes, holder types and reserved ranges, reported as
   `InvalidDate()` or `Invalid` with a reason.
5. **Check the digit.** A mismatch is `InvalidChecksum()`, the answer for a value that was mistyped
   rather than made up.

The failure reason is part of the answer: a wrong length is `InvalidLength`, not
`InvalidChecksum` ([CONTRIBUTING.md](../../CONTRIBUTING.md#what-a-good-change-looks-like)).

## Kinds, and methods that share a rule

`IdentifierKind` is a flags enum with one bit per method: `PersonalId`, `PersonalTaxCode`,
`CompanyNumber`, `Vat` and `PostalCode`. `Person` and `Business` combine the first two and the
next two, and `Any` combines those four. `PostalCode` stays outside `Any` because it identifies a
place ([IdentifierKind.cs](../../Attest/IdentifierKind.cs)).

Where a country issues one number for two purposes, one method calls the other. Belgium's
`ValidateEntity` returns `ValidateVAT`, because the enterprise number is both. 60 of the 87 classes
leave `ValidateNationalIdentity` to the base class, so it applies the personal tax code rule; the
other 27 override it. A delegation that is deliberate says so in a doc comment with its source,
because a bare one-line delegation reads like an unfinished stub
([adding-a-country.md](../adding-a-country.md#2-write-the-validator)).

## Holder types and ambiguity

When the number records who holds it, the personal and business methods reject each other's
numbers. Four countries the library once called indistinguishable were defects of this kind, each
a `ValidateEntity` that delegated to `ValidateIndividualTaxCode`: Peru's RUC prefix, Andorra's NRT
letter, Iceland's 40 added to the day for an organisation, and Thailand's agency digits. Russia had
both of its INN algorithms behind one method that accepted either
([CONTRIBUTING.md](../../CONTRIBUTING.md), rule 7).

When the number does not record it, both methods accept it and the result says so. `IsAmbiguous`
is computed, not declared: it is true when `Matched` holds a personal kind and a business kind
([IdentifierResult.cs](../../Attest/IdentifierResult.cs)), which is why `Validate` evaluates all
four whatever you ask for. Armenia and Nigeria issue one number for both roles; in Russia, Peru,
Indonesia and Ukraine a sole trader files VAT under a personal number. The class carries the
source that says the number has no holder field, as
[ArmeniaValidator.cs](../../Attest/CountriesValidators/ArmeniaValidator.cs) cites the OECD sheet.

## Kinds with no rule

A class lists the kinds it has no rule for in `UnsupportedKinds`, and its methods for those kinds
return `Invalid("Not supported")`. `Supports` and `Validate` read the list; the named methods reach
the class, which answers `Not supported` itself. 12 classes declare 25 pairs between them, listed
in the [reference](reference.md#kinds-with-no-rule).

Until 1.1.0, eleven classes threw `NotSupportedException` instead, and the facade turned the throw
into `Not supported`. The throw was the only signal `Supports` had, and it escaped to anyone who
called a class directly ([IdValidationAbstract.cs](../../Attest/IdValidationAbstract.cs),
[CHANGELOG.md](../../CHANGELOG.md#110)). The facade still catches `NotSupportedException` and
`NotImplementedException` from a class; no class throws either now
([ValidatorClassSweepTests](../../Attest.Tests/ValidatorClassSweepTests.cs)).

> [!NOTE]
> CONTRIBUTING.md rule 4 and SECURITY.md still describe the throwing mechanism. The code,
> CHANGELOG.md and MIGRATION.md describe the one above; see
> [where the documents disagree](status.md#where-other-documents-disagree-with-the-code).

## When no check digit is published

The class checks what is published, the length, the character set and the field ranges, and
leaves the digit alone ([AGENTS.md](../../AGENTS.md), rule 1). A guessed algorithm rejects real
numbers, and nobody reports that rejection.

Armenia is the pattern ([ArmeniaValidator.cs](../../Attest/CountriesValidators/ArmeniaValidator.cs)).
Its ten-digit public services number is checked for the day offset by sex, the month shifted by
century, a date that exists, a serial from 001 to 999, and no three sixes in a row. Its tenth digit
is not checked: law HO-288-N leaves that calculation to an authority that does not publish it. The
eight-digit TIN is checked for its length, because its check digit is unpublished too.

The gap then goes into [KNOWN-ISSUES.md](../../KNOWN-ISSUES.md) under the country, with what was
searched. 19 entries are open, and 1.2.0's changelog counts sixteen of them as check digits the
issuing authority does not publish ([CHANGELOG.md](../../CHANGELOG.md#120)). Where sources
contradict each other, the widest reading wins, so a change cannot reject a number any source
endorses: Bolivia's NIT length is the example
([KNOWN-ISSUES.md](../../KNOWN-ISSUES.md#bolivia)).

## The invariants, and the tests that hold them

| Invariant | Held by |
|---|---|
| no method throws, through the facade | [UnicodeDigitSweepTests](../../Attest.Tests/UnicodeDigitSweepTests.cs) |
| no method throws, on the classes themselves | [ValidatorClassSweepTests](../../Attest.Tests/ValidatorClassSweepTests.cs) |
| the verdict does not depend on the thread culture | [CultureSweepTests](../../Attest.Tests/CultureSweepTests.cs) |
| a prefix counts only at the start | [PrefixStripTests](../../Attest.Tests/PrefixStripTests.cs) |
| no `\d`, `char.IsDigit`, `ToUpper()` or bare `StartsWith` | [SourceConventionSweepTests](../../Attest.Tests/SourceConventionSweepTests.cs) |
| the normaliser keeps its contract | [IdExtensionsTests](../../Attest.Tests/IdExtensionsTests.cs) |
| the README table matches `Supports` | [ReadmeTableTests](../../Attest.Tests/ReadmeTableTests.cs) |
| every public member is documented | CS1591 with `-warnaserror` in [ci.yml](../../.github/workflows/ci.yml) |

- `UnicodeDigitSweepTests` runs every `Country` member through the five named methods and
  `Validate`, with Arabic-Indic, Devanagari, fullwidth, Tamil and mixed digits, and with `null`,
  `""`, `"   "`, `"---"` and `"abc"`.
- `ValidatorClassSweepTests` calls all 87 classes directly, the five methods and every other public
  method that takes a string, and fails a rejection that carries no message.
- `CultureSweepTests` asks every country the same questions under the invariant, `tr-TR` and
  `az-AZ` cultures and fails if an answer moves.
- `SourceConventionSweepTests` reads the shipped source of both packages with comments stripped. It
  found the culture-sensitive `EndsWith` in `PeruValidator` that every behavioural sweep missed.

AGENTS.md rule 5 asks contributors not to weaken these: each defect they catch shipped once.

## Adding or fixing a country

[docs/adding-a-country.md](../adding-a-country.md) walks through it, and
[CONTRIBUTING.md](../../CONTRIBUTING.md) gives each rule with the defect that produced it. In
short:

1. Find the rule and cite it beside the code: the issuing authority, the OECD TIN sheet, or
   python-stdnum, trusted in that order.
2. Write `Attest/CountriesValidators/<Country>Validator.cs`, deriving from `IdValidationAbstract`.
   Override `ValidateNationalIdentity` or say in a doc comment why the fallback is right.
3. Register it: a `Country` member and one line in `CountryValidator.Load()`, plus a row in the
   README table, which `ReadmeTableTests` checks.
4. Write `Attest.Tests/CountriesValidators/<Country>ValidatorTests.cs`. Every number asserted valid
   has a check digit you computed, or is a published example you cite; each theory has `null`,
   `""`, a garbage row and a wrong-check-digit row.
5. Put what you could not source into KNOWN-ISSUES.md, and do not edit CHANGELOG.md.
6. Say the release class: a moved verdict makes it at least a minor
   ([AGENTS.md](../../AGENTS.md#before-you-open-a-pull-request)).

> [!IMPORTANT]
> Four points in adding-a-country.md have drifted from the code; follow the code.
>
> - `Country` members carry explicit values. A new country takes the next free number wherever
>   its code sorts ([Country.cs](../../Attest/Country.cs)).
> - `\d` fails the build anywhere in shipped source, so write `[0-9]` even after the normaliser.
>   `BelgiumValidator` uses `[0-9]{11}`.
> - A kind with no rule goes into `UnsupportedKinds` and answers `Invalid("Not supported")`. It is
>   never thrown.
> - Its Peru example asserts that `10054148289` is unambiguous. Since 1.2.0 that personal RUC
>   matches `PersonalTaxCode | Vat` and is ambiguous
>   ([PeruValidatorTests](../../Attest.Tests/CountriesValidators/PeruValidatorTests.cs)).

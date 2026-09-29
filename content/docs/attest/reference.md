---
title: "Reference"
description: "Every public type and member: the packages, CountryValidator, the result types, IdentifierKind, the helpers, the attributes and all 87 country classes."
order: 7
section: "Reference"
---

## Packages

| Package | Namespaces | Dependencies |
|---|---|---|
| `Attest` | `Attest`, `Attest.Countries` | none |
| `Attest.DataAnnotations` | `Attest.DataAnnotations` | `Attest`, and one more on `netstandard2.0` |

Both target `netstandard2.0` and `net8.0`. On `netstandard2.0`, `Attest.DataAnnotations` also
depends on `System.ComponentModel.Annotations` 4.7.0; on `net8.0` those types are in the framework
([Attest.csproj](../../Attest/Attest.csproj),
[Attest.DataAnnotations.csproj](../../Attest.DataAnnotations/Attest.DataAnnotations.csproj)). Both
ship XML documentation and a symbol package, and the version is the git tag
([Directory.Build.props](../../Directory.Build.props), [RELEASING.md](../../RELEASING.md)).

## CountryValidator

```csharp title="CountryValidator's public members"
public class CountryValidator : ICountryValidator
{
    public ValidationResult ValidateNationalIdentityCode(string ssn, Country country);
    public ValidationResult ValidateIndividualTaxCode(string ssn, Country country);
    public ValidationResult ValidateEntity(string vat, Country country);
    public ValidationResult ValidateVAT(string vat, Country country);
    public ValidationResult ValidateZIPCode(string zip, Country country);
    public IdentifierResult Validate(string value, Country country, IdentifierKind kinds = IdentifierKind.Any);
    public bool Supports(Country country, IdentifierKind kind);
    public static bool IsCountrySupported(Country country);
    public static List<string> SupportedCountries { get; }
}
```

| Member | Answers |
|---|---|
| `ValidateNationalIdentityCode` | a national identity number |
| `ValidateIndividualTaxCode` | a natural person's tax code |
| `ValidateEntity` | a company or organisation identifier |
| `ValidateVAT` | a VAT number, with or without its prefix |
| `ValidateZIPCode` | a postal code |
| `Validate` | whether the value is any of `kinds` |
| `Supports` | whether the country has a rule for every kind in `kind` |
| `IsCountrySupported` | whether the country has a validator at all |
| `SupportedCountries` | the alpha-2 codes of the 87 countries |

The five named methods return `Not supported` for a country with no validator and for a kind with
no rule, and none of them throws. `Validate` returns an
[IdentifierResult](#identifierkind-and-identifierresult). Construct one `CountryValidator` and keep
it: the country table is built once per process
([CountryValidator.cs](../../Attest/CountryValidator.cs)).

`ICountryValidator` declares the seven instance members, so you can substitute your own in a test;
the two static members are not on it ([ICountryValidator.cs](../../Attest/ICountryValidator.cs)).

## ValidationResult

A sealed class with two read-only properties: `IsValid`, and `ErrorMessage`, which is `null` when
the value is valid. The validators build it with these factories
([ValidationResult.cs](../../Attest/ValidationResult.cs)):

| Factory | `ErrorMessage` |
|---|---|
| `Success()` | `null` |
| `InvalidChecksum()` | `Invalid checksum.` |
| `InvalidFormat(format)` | `Invalid format. The code must have this format {format}` |
| `InvalidLength()` | `Invalid length` |
| `InvalidDate()` | `Invalid date` |
| `Invalid(message)` | the message |

`{format}` is an example of the right shape, such as `12345678901`, and it is always a value the
rule accepts. `Invalid("Not supported")` is the answer for a kind with no rule and for a country
with no validator. Other `Invalid` messages are a country's own, such as `Invalid taxpayer type`
from `PeruValidator` or `Invalid campus` from `UnitedStatesValidator.ValidateEntity`.

The messages are English, not localised, and meant for a developer's log, not for the person whose
number it is. There is no error code.

## IdentifierKind and IdentifierResult

`IdentifierKind` is a flags enum ([IdentifierKind.cs](../../Attest/IdentifierKind.cs)):

| Member | Value | Means |
|---|---|---|
| `PersonalId` | 1 | a natural person's national identity number |
| `PersonalTaxCode` | 2 | a natural person's tax identification number |
| `CompanyNumber` | 4 | a company's or other legal entity's registration number |
| `Vat` | 8 | a VAT registration number |
| `PostalCode` | 16 | a postal code; not part of `Any` |
| `Person` | 3 | `PersonalId` and `PersonalTaxCode` |
| `Business` | 12 | `CompanyNumber` and `Vat` |
| `Any` | 15 | `Person` and `Business`; the default for `Validate` |

`IdentifierResult` is sealed, and only `Validate` creates one
([IdentifierResult.cs](../../Attest/IdentifierResult.cs)):

| Property | Type | Holds |
|---|---|---|
| `Requested` | `IdentifierKind` | the kinds you asked about |
| `Matched` | `IdentifierKind` | every kind the value is valid as, requested or not |
| `Details` | `IReadOnlyDictionary<IdentifierKind, ValidationResult>` | each evaluated kind's result |
| `IsValid` | `bool` | whether `Matched` and `Requested` share a kind |
| `IsAmbiguous` | `bool` | whether it matched a personal and a business kind |

`Details` always holds the four personal and business kinds, and `PostalCode` when you asked for
it. A kind with no rule is `Not supported` there and never in `Matched`.

## Kinds with no rule

25 of the 435 country and kind pairs have no rule, in 12 countries. `Supports` is false for each,
and each method answers `Not supported`. The source is each class's `UnsupportedKinds`, and
[ReadmeTableTests](../../Attest.Tests/ReadmeTableTests.cs) checks the README's country table
against `Supports`.

| Code | Class | No rule for |
|---|---|---|
| AE | `UnitedArabEmiratesValidator` | `PersonalTaxCode`, `CompanyNumber`, `Vat`, `PostalCode` |
| BH | `BahrainValidator` | `CompanyNumber`, `Vat` |
| CN | `ChinaValidator` | `Vat` |
| CU | `CubaValidator` | `CompanyNumber`, `Vat` |
| GT | `GuatemalaValidator` | `PersonalId`, `PersonalTaxCode` |
| HK | `HongKongValidator` | `CompanyNumber`, `Vat`, `PostalCode` |
| KR | `KoreaValidator` | `CompanyNumber`, `Vat` |
| MC | `MonacoValidator` | `PersonalId`, `PersonalTaxCode`, `CompanyNumber` |
| MU | `MauritiusValidator` | `PostalCode` |
| PK | `PakistanValidator` | `CompanyNumber`, `Vat` |
| US | `UnitedStatesValidator` | `Vat` |
| UZ | `UzbekistanValidator` | `CompanyNumber`, `Vat` |

By kind: `Vat` 9, `CompanyNumber` 8, `PersonalTaxCode` 3, `PostalCode` 3, `PersonalId` 2.

## IdExtensions

Public extension methods the country classes share
([IdExtensions.cs](../../Attest/IdExtensions.cs)):

| Method | Does |
|---|---|
| `RemoveSpecialCharacthers(this string)` | the normaliser every validator calls first |
| `CheckLuhnDigit(this string)` | whether the last digit is the Luhn digit of the rest |
| `Mod(this int, int)` | the remainder, never negative |
| `Sum(this string, int[], int start = 0)` | the weighted sum of the digits |
| `Slice(this string, int)` | `Substring` from an index |
| `Slice(this string, int, int)` | `Substring` of a length from an index |
| `ToDigitEnumerable(this int)` | the decimal digits, most significant first |
| `ToInt(this char)` | an ASCII digit's value |
| `Translit(this string)` | obsolete; transliterates Cyrillic |

`RemoveSpecialCharacthers` keeps letters of any script and the digits 0-9, drops everything else,
turns `null` into `""`, and replaces any other decimal digit with `U+FFFD`
([How a country's rule is modelled](rules.md#from-a-string-to-a-verdict)).

The rest are helpers for the validators, and they assume input a validator has already checked:
`Sum` reads as many characters as there are weights, and `ToInt` does not check that its character
is a digit. `Translit` is marked `[Obsolete]`; nothing in the library calls it, and it goes in the
next major version. `StripPrefix`, `IsAsciiDigits` and `IsAsciiDigit` are internal.

## DataAnnotations attributes

| Attribute | Calls |
|---|---|
| `SSNAttribute` | `ValidateNationalIdentityCode` |
| `PersonTINAttribute` | `ValidateIndividualTaxCode` |
| `CompanyTINAttribute` | `ValidateEntity` |
| `VATAttribute` | `ValidateVAT` |
| `ZipCodeAttribute` | `ValidateZIPCode` |

All five are sealed `ValidationAttribute`s for properties and parameters, in the
`Attest.DataAnnotations` namespace. Each has one constructor, `(Country countryCode)`, which throws
`ArgumentNullException` for a value that is not a defined `Country`, and a settable `CountryCode`.
`null` passes, a value that is not a string fails, and Attest's reason goes to
`validationContext.Items["Error"]`
([SSNAttribute.cs](../../Attest.DataAnnotations/SSNAttribute.cs) and its four siblings).
[Validate model properties](data-annotations.md) shows them in use.

## Country and the country classes

`Country` is an enum of ISO 3166-1 alpha-2 codes: `XX = 0` for unknown, then the 87 supported codes
in alphabetical order with the values 1 to 87. Every value is written out, and a new country takes
the next free number wherever its code sorts, so a stored integer keeps its meaning
([Country.cs](../../Attest/Country.cs)). `XX` has no validator.

Each supported code has one class in `Attest.Countries`, deriving from `IdValidationAbstract`
([IdValidationAbstract.cs](../../Attest/IdValidationAbstract.cs)):

```csharp title="IdValidationAbstract's public members"
public abstract class IdValidationAbstract
{
    public string CountryCode { get; protected set; }
    public virtual ValidationResult ValidateNationalIdentity(string ssn);
    public abstract ValidationResult ValidateIndividualTaxCode(string id);
    public abstract ValidationResult ValidateEntity(string id);
    public abstract ValidationResult ValidateVAT(string vatId);
    public abstract ValidationResult ValidatePostalCode(string postalCode);
}
```

`ValidateNationalIdentity` calls `ValidateIndividualTaxCode` unless the class overrides it, and 27
of the 87 do. Seventeen classes have public methods beyond these five, each taking one string:

| Class | Methods beyond the five |
|---|---|
| `ArgentinaValidator` | `ValidateCBU` |
| `AustraliaValidator` | `ValidateABN`, `ValidateACN`, `ValidateTFN` |
| `AustriaValidator` | `CalculateChecksumTaxCode` |
| `BulgariaValidator` | `BgForeignerPhysicalPerson`, `BgMiscellaneousVatNumber` |
| `CostaRicaValidator` | `ValidateCPF`, `ValidateResident` |
| `DominicanRepublicValidator` | `ValidateNCF` |
| `EcuadorValidator` | `Checksum`, `ValidateCI` |
| `GuatemalaValidator` | `CalculateChecksum` |
| `LuxembourgValidator` | `ValidateNaturalPersons`, `ValidateResident` |
| `MauritiusValidator` | `CalculateChecksum` |
| `NetherlandsValidator` | `ValidateOnderwijsnummer` |
| `PortugalValidator` | `CheckSum`, `ValidateBilhetedeIdentidade`, `ValidateCartaoCidadao` |
| `RussiaValidator` | `ValidateBIK`, `ValidateOGRN`, `ValidateOGRNIP` |
| `SpainValidator` | `ValidateSpanishID` |
| `TaiwanValidator` | `ValidateLocalSSN`, `ValidateResidentSSN` |
| `UnitedKingdomValidator` | `ValidateNHS` |
| `UnitedStatesValidator` | `ValidateITIN`, `ValidateSSN` |

The methods named `Validate…` return a `ValidationResult`. The checksum helpers return a number or
a character, and Bulgaria's two, which are static, return a `bool`. None of them throws on `null`,
empty or garbage input ([ValidatorClassSweepTests](../../Attest.Tests/ValidatorClassSweepTests.cs)).

Every class, by code, as registered in `CountryValidator`
([CountryValidator.cs](../../Attest/CountryValidator.cs)):

| Code | Class |
|---|---|
| AD | `AndorraValidator` |
| AE | `UnitedArabEmiratesValidator` |
| AL | `AlbaniaValidator` |
| AM | `ArmeniaValidator` |
| AR | `ArgentinaValidator` |
| AT | `AustriaValidator` |
| AU | `AustraliaValidator` |
| AZ | `AzerbaijanValidator` |
| BA | `BosniaValidator` |
| BE | `BelgiumValidator` |
| BG | `BulgariaValidator` |
| BH | `BahrainValidator` |
| BO | `BoliviaValidator` |
| BR | `BrazilValidator` |
| BY | `BelarusValidator` |
| CA | `CanadaValidator` |
| CH | `SwitzerlandValidator` |
| CL | `ChileValidator` |
| CN | `ChinaValidator` |
| CO | `ColombiaValidator` |
| CR | `CostaRicaValidator` |
| CU | `CubaValidator` |
| CY | `CyprusValidator` |
| CZ | `CzechValidator` |
| DE | `GermanyValidator` |
| DK | `DenmarkValidator` |
| DO | `DominicanRepublicValidator` |
| EC | `EcuadorValidator` |
| EE | `EstoniaValidator` |
| ES | `SpainValidator` |
| FI | `FinlandValidator` |
| FO | `FaroeIslandsValidator` |
| FR | `FranceValidator` |
| GB | `UnitedKingdomValidator` |
| GE | `GeorgiaValidator` |
| GR | `GreeceValidator` |
| GT | `GuatemalaValidator` |
| HK | `HongKongValidator` |
| HR | `CroatiaValidator` |
| HU | `HungaryValidator` |
| ID | `IndonesiaValidator` |
| IE | `IrelandValidator` |
| IL | `IsraelValidator` |
| IN | `IndiaValidator` |
| IS | `IcelandValidator` |
| IT | `ItalyValidator` |
| JP | `JapanValidator` |
| KR | `KoreaValidator` |
| KZ | `KazahstanValidator` |
| LT | `LithuaniaValidator` |
| LU | `LuxembourgValidator` |
| LV | `LatviaValidator` |
| MC | `MonacoValidator` |
| MD | `MoldovaValidator` |
| ME | `MontenegroValidator` |
| MK | `MacedoniaValidator` |
| MT | `MaltaValidator` |
| MU | `MauritiusValidator` |
| MX | `MexicoValidator` |
| MY | `MalaysiaValidator` |
| NG | `NigeriaValidator` |
| NL | `NetherlandsValidator` |
| NO | `NorwayValidator` |
| NZ | `NewZealandValidator` |
| PE | `PeruValidator` |
| PH | `PhilippinesValidator` |
| PK | `PakistanValidator` |
| PL | `PolandValidator` |
| PT | `PortugalValidator` |
| PY | `ParaguayValidator` |
| RO | `RomaniaValidator` |
| RS | `SerbiaValidator` |
| RU | `RussiaValidator` |
| SE | `SwedenValidator` |
| SI | `SloveniaValidator` |
| SK | `SlovakiaValidator` |
| SM | `SanMarinoValidator` |
| SV | `ElSalvadorValidator` |
| TH | `ThailandValidator` |
| TR | `TurkeyValidator` |
| TW | `TaiwanValidator` |
| UA | `UkraineValidator` |
| US | `UnitedStatesValidator` |
| UY | `UruguayValidator` |
| UZ | `UzbekistanValidator` |
| VE | `VenezuelaValidator` |
| ZA | `SouthAfricaValidator` |

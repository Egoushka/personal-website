---
title: "Quickstart"
description: "Install the package, validate one national ID, tell a missing rule from a wrong value, and ask for any business identifier without naming the method."
order: 2
section: "Get started"
---

You create a console app, add the `Attest` package, and validate a Belgian national register
number twice: once as the identity card prints it, once with a wrong last digit. Then you ask
whether a country has a rule at all, and ask for any business identifier without naming the
method. The output on this page is from Attest 1.2.1.

## Prerequisites

- A .NET SDK that can create a console app.
- Access to nuget.org.

The package targets `netstandard2.0` and `net8.0`
([Attest.csproj](../../Attest/Attest.csproj)). A project on .NET 8 or later gets the `net8.0`
build; an older one that implements .NET Standard 2.0 gets the other.

## Create a project

```bash title="Create a console app and add the package"
dotnet new console -n AttestDemo
cd AttestDemo
dotnet add package Attest
```

`Attest` has no dependencies of its own ([Attest.csproj](../../Attest/Attest.csproj)).

## Validate one national ID

Replace the contents of `Program.cs`:

```csharp title="Program.cs"
using Attest;

var validator = new CountryValidator();

// A Belgian national register number, written the way the identity card prints it.
ValidationResult id = validator.ValidateNationalIdentityCode("93.05.18-223.61", Country.BE);
Console.WriteLine($"valid: {id.IsValid}");

// The same number with its last digit changed.
ValidationResult typo = validator.ValidateNationalIdentityCode("93051822360", Country.BE);
Console.WriteLine($"valid: {typo.IsValid}, reason: {typo.ErrorMessage}");
```

```bash title="Run it"
dotnet run
```

```text title="Output"
valid: True
valid: False, reason: Invalid checksum.
```

The dots and the dash are dropped before any check runs, so the printed form and the bare
`93051822361` are the same input. Belgium's check number is 97 minus the first nine digits mod 97:
930518223 mod 97 is 36, and 97 − 36 = 61, the last two digits. For people born from 2000 on, a
`2` goes in front of the nine digits first
([BelgiumValidator.cs](../../Attest/CountriesValidators/BelgiumValidator.cs)).

`ErrorMessage` is `null` when the value is valid. When it is not, the message says why, in English,
for a developer reading a log.

> [!IMPORTANT]
> Branch on `IsValid`, not on the text of `ErrorMessage`. The message is not localised and not
> meant to be shown to the person whose number it is
> ([ValidationResult.cs](../../Attest/ValidationResult.cs)). The
> [reference](reference.md#validationresult) lists the messages.

The call never throws. `null`, an empty string, punctuation or digits from another script come
back as a result with `IsValid` false ([UnicodeDigitSweepTests](../../Attest.Tests/UnicodeDigitSweepTests.cs)).

## Tell a missing rule from a wrong value

Add these lines to the end of `Program.cs`, then run it again:

```csharp title="Program.cs, appended"
// Attest has no VAT rule for the United States.
Console.WriteLine($"rule for US VAT: {validator.Supports(Country.US, IdentifierKind.Vat)}");
Console.WriteLine($"reason: {validator.ValidateVAT("123456789", Country.US).ErrorMessage}");
```

```text title="New output"
rule for US VAT: False
reason: Not supported
```

A kind with no rule reports every value invalid, and that is not a verdict on the value. Ask
`Supports` before you read a rejection as "this number is wrong". 25 of the 435 country and kind
pairs have no rule; the [reference](reference.md#kinds-with-no-rule) lists them.

## Ask for any business identifier

Add these lines and run it again:

```csharp title="Program.cs, appended"
// Any business identifier Belgium issues, without naming the method.
IdentifierResult business = validator.Validate("0428759497", Country.BE, IdentifierKind.Business);
Console.WriteLine($"valid: {business.IsValid}, matched: {business.Matched}, ambiguous: {business.IsAmbiguous}");

// Armenia issues one number to people and companies alike.
IdentifierResult armenian = validator.Validate("02618169", Country.AM, IdentifierKind.Business);
Console.WriteLine($"valid: {armenian.IsValid}, matched: {armenian.Matched}, ambiguous: {armenian.IsAmbiguous}");
```

```text title="New output"
valid: True, matched: Business, ambiguous: False
valid: True, matched: PersonalTaxCode, Business, ambiguous: True
```

`IdentifierKind.Business` is `CompanyNumber | Vat`, so the enum prints the Belgian match as
`Business`: Belgium's enterprise number is its company number and its VAT number at once.
Armenia's eight-digit TIN carries no holder type ("No meaning is given to the numbers", in the
OECD sheet that [ArmeniaValidator.cs](../../Attest/CountriesValidators/ArmeniaValidator.cs) cites),
so it matches a personal tax code as well, and `IsAmbiguous` says so instead of guessing.

## Next steps

- [Validate identifiers](validating.md): which method or kind to use, what the input may look
  like, and how to read every part of the result.
- [Validate model properties](data-annotations.md): the same checks as attributes on a model.
- [Reference](reference.md): every public type and member.

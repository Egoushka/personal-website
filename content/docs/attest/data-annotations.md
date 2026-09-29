---
title: "Validate model properties"
description: "The five DataAnnotations attributes: what each one calls, how null and non-strings are handled, where the reason goes, and what to do when the country varies."
order: 4
section: "Guides"
---

`Attest.DataAnnotations` wraps five of `CountryValidator`'s methods as validation attributes, so a
model property or an action parameter is checked wherever DataAnnotations runs. Each attribute is
the same forty lines with one call swapped
([DataAnnotationsTests](../../Attest.Tests/DataAnnotationsTests.cs)), so everything below applies
to all five.

## Install

```bash title="Add the attributes package"
dotnet add package Attest.DataAnnotations
```

It brings `Attest` with it. On `netstandard2.0` it also depends on
`System.ComponentModel.Annotations` 4.7.0; on `net8.0` those types are in the framework and it adds
nothing else ([Attest.DataAnnotations.csproj](../../Attest.DataAnnotations/Attest.DataAnnotations.csproj)).

## The five attributes

| Attribute | Calls | For |
|---|---|---|
| `SSNAttribute` | `ValidateNationalIdentityCode` | a national identity number |
| `PersonTINAttribute` | `ValidateIndividualTaxCode` | a person's tax number |
| `CompanyTINAttribute` | `ValidateEntity` | a company registration number |
| `VATAttribute` | `ValidateVAT` | a VAT registration number |
| `ZipCodeAttribute` | `ValidateZIPCode` | a postal code |

Each takes the `Country` whose rule to apply, and goes on a property or a parameter. In C# you can
leave off the suffix: `[VAT(Country.BE)]`. The source is one file per attribute in
[Attest.DataAnnotations](../../Attest.DataAnnotations/).

## Annotate a model

```csharp title="Supplier.cs"
using System.ComponentModel.DataAnnotations;
using Attest;
using Attest.DataAnnotations;

public class Supplier
{
    [Required]
    public string Name { get; set; }

    [VAT(Country.BE)]
    public string VatNumber { get; set; }
}
```

```csharp title="Validate a supplier"
using System.ComponentModel.DataAnnotations;
using DataAnnotationsResult = System.ComponentModel.DataAnnotations.ValidationResult;

var supplier = new Supplier { Name = "Example", VatNumber = "BE0428759498" };
var results = new List<DataAnnotationsResult>();

bool valid = Validator.TryValidateObject(
    supplier, new ValidationContext(supplier), results, validateAllProperties: true);

Console.WriteLine($"valid: {valid}");
foreach (DataAnnotationsResult result in results)
{
    Console.WriteLine($"{string.Join(",", result.MemberNames)}: {result.ErrorMessage}");
}
```

```text title="Output"
valid: False
VatNumber: The field VatNumber is invalid.
```

Pass `validateAllProperties: true`. Without it, `Validator.TryValidateObject` checks `[Required]`
only, and the supplier above passes.

The message is `ValidationAttribute`'s own, built from the display name, and it does not include
Attest's reason. Set `ErrorMessage` to change it:
`[VAT(Country.BE, ErrorMessage = "{0} is not a Belgian VAT number.")]` reports
`VatNumber is not a Belgian VAT number.`

> [!WARNING]
> `Attest` and `System.ComponentModel.DataAnnotations` both define a `ValidationResult`. A file
> that imports both namespaces and names the type does not compile (CS0104). Alias one of them, as
> [DataAnnotationsTests.cs](../../Attest.Tests/DataAnnotationsTests.cs) does:
> `using DataAnnotationsResult = System.ComponentModel.DataAnnotations.ValidationResult;`

## What an attribute does with a value

- **`null` passes.** Whether the member is required stays `[Required]`'s decision, so an optional
  annotated property stays optional.
- **A value that is not a string fails.** It does not throw.
- **A string goes to the method in the table above.** A valid one passes. An invalid one fails
  with the message above, naming the member.
- **Attest's reason goes to `validationContext.Items["Error"]`**, overwriting what was there, so
  one context reused for a second value does not throw.

[DataAnnotationsTests](../../Attest.Tests/DataAnnotationsTests.cs) checks each of these against
all five attributes, and that each attribute agrees with the method it wraps.

## Read Attest's reason

The attribute writes the reason to the context it is given. `Validator.TryValidateProperty` passes
yours:

```csharp title="Read the reason for one property"
var context = new ValidationContext(supplier) { MemberName = nameof(Supplier.VatNumber) };
var propertyResults = new List<DataAnnotationsResult>();

Validator.TryValidateProperty(supplier.VatNumber, context, propertyResults);
Console.WriteLine($"reason: {context.Items["Error"]}");
```

```text title="Output"
reason: Invalid checksum.
```

`Validator.TryValidateObject` gives each property a context of its own, with a copy of your
`Items`, so after it the reason is not in the context you passed. When you need the reason for
every field, call `CountryValidator` directly. The reason is for your logs either way: it is not
localised and not meant for the person whose number it is
([ValidationResult.cs](../../Attest/ValidationResult.cs)).

## When the country comes from the data

An attribute's arguments are fixed at compile time, so `[VAT(Country.BE)]` cannot follow a country
chosen per record. Implement `IValidatableObject` and call `CountryValidator`:

```csharp title="Customer.cs"
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Attest;
using DataAnnotationsResult = System.ComponentModel.DataAnnotations.ValidationResult;

public sealed class Customer : IValidatableObject
{
    private static readonly CountryValidator Countries = new CountryValidator();

    public Country Country { get; set; }

    public string VatNumber { get; set; }

    public IEnumerable<DataAnnotationsResult> Validate(ValidationContext validationContext)
    {
        if (VatNumber == null || !Countries.Supports(Country, IdentifierKind.Vat))
        {
            yield break;
        }

        if (!Countries.ValidateVAT(VatNumber, Country).IsValid)
        {
            yield return new DataAnnotationsResult("Enter a valid VAT number.", new[] { nameof(VatNumber) });
        }
    }
}
```

This version says nothing when the country has no VAT rule, rather than rejecting the value.
Decide what your form should do there; see
[Tell a missing rule from a wrong value](validating.md#tell-a-missing-rule-from-a-wrong-value).

## On an ASP.NET Core action

The README's example puts an attribute on an action parameter
([README](../../README.md#using-data-annotations)):

```csharp title="An annotated action parameter"
[HttpPost]
public IActionResult ValidateSSN([Required, SSNAttribute(Country.US)] string ssn)
{
    if (!ModelState.IsValid)
    {
        return BadRequest();
    }

    return Ok();
}
```

## The country argument

- **An undefined value throws.** `new VATAttribute((Country)9999)` throws `ArgumentNullException`,
  which is an `ArgumentException`, from the constructor.
- **`Country.XX` does not throw.** It is a defined member, so the constructor accepts it, but no
  validator is registered for it ([CountryValidator.cs](../../Attest/CountryValidator.cs)).

> [!WARNING]
> A property annotated with `Country.XX` rejects every value other than `null`, with the reason
> `Not supported`.

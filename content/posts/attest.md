---
title: "A request to check a Belgian tax ID led me to a package with 197 defects"
date: "2026-09-22"
updated: "2026-09-29"
description: "A request at work to check a Belgian tax ID led to a package with 197 defects. One rejected all 36,363,636 valid Hungarian tax numbers. I forked it as Attest."
kind: finding
project: "attest"
topics: ["dotnet"]
---

At work I got a request to check a Belgian tax ID. An existing package did that, and it was wrong: not only for Belgium.

A tax ID usually ends in a check digit: one digit worked out from the others, so a typo can be caught without asking anyone. A package that checks them is a small thing to depend on. When it is wrong, the person who typed a correct number is told it is not.

I wanted to ship quality and present something to the world, so I did not stop at one country. I went through the package country by country, against the rules the issuing authorities publish, and confirmed each defect by running the code. The count came to 197, in a package that covers 87 countries.

## Hungary: wrong for every input

The worst was Hungary. A Hungarian personal tax number has ten digits, and the last is the check digit. You multiply each of the first nine digits by its position, 1 to 9, add the products up, and keep the remainder after dividing by 11.

The package did that sum on characters instead of digits. A computer stores the character `'0'` as the number 48, `'1'` as 49, and so on, so every digit went into the sum 48 too big. The positions 1 to 9 add up to 45, which made the sum off by 48 × 45 = 2,160. Divided by 11, 2,160 leaves a remainder of 4. The check digit the package computed was always the right one plus four, wrapping past 10 back to 0, so it could never equal the real one.

That check is wrong for every input, by arithmetic. There are exactly 36,363,636 valid Hungarian personal tax numbers, and the package accepted none of them. The proof is shorter than the fix.

## It was not alone

22 of the 87 validators crashed instead of answering, on empty input, on a short string, on a letter where a digit belonged. A form that relied on them could show a user a stack trace for typing one character too few.

Mexico and South Africa could never validate anything, because a date helper always returned false. Malaysia, Canada and San Marino had their checks inverted, so they accepted everything, the empty string included, and rejected the real formats. Belgium rejected every number whose check number is below ten, roughly 9% of all Belgian numbers.

## Why the tests said nothing

The tests were green. The Thai tax-code tests used a Swedish personal number. The only Cyprus national-ID test used a Czech birth number copied from the Czech file. Both passed for years, so nothing pointed at the code.

## Forking it

The original's last release was in November 2021. It had twelve open issues: ten reported a defect and two were questions. I forked it as Attest, and each of the ten is now a test that uses the reporter's own number. The test suite went from 586 cases to 4,212, and every validator has tests.

## What it does not tell you

Attest checks that a number is well formed: the right shape, carrying the check digit the authority publishes. It cannot tell you the number is registered, because a VAT number can be well formed and belong to nobody. For EU VAT only the European Commission's VIES service knows, so the two work together: reject the malformed ones here, and ask VIES about the rest. What I have not fixed is written down in a known-issues file of 33 entries, 19 of them gaps that are still open, almost all check digits no authority publishes.

## Try it

```bash
dotnet add package Attest
```

```csharp
using Attest;

var validator = new CountryValidator();

ValidationResult result = validator.ValidateIndividualTaxCode("93051822361", Country.BE);
if (!result.IsValid)
{
    Console.WriteLine(result.ErrorMessage);
}
```

That is a Belgian number, and it passes. The [Attest project page](/projects/attest/) has the rest, and the [quickstart](/projects/attest/docs/quickstart/) walks through this call in a new console app.

## Receipts

Attest at commit ff0e530 unless another is named.

- 197 defects fixed, 87 countries — Egoushka/attest@ff0e530:Attest/Attest.csproj#L5
- Upstream sums the characters — Egoushka/attest@7ccf7b8:CountryValidator/CountriesValidators/HungaryValidator.cs#L86, tag `upstream-1.1.3`, the untouched upstream release
- Attest sums the digits — Egoushka/attest@ff0e530:Attest/CountriesValidators/HungaryValidator.cs#L112
- The weights are 1 to 9, which add up to 45 — Egoushka/attest@ff0e530:README.md#L49
- 48 and 2,160, remainder 4 — Egoushka/attest@ff0e530:README.md#L49, and my arithmetic: 48 × 45 = 2160, 2160 mod 11 = 4
- 36,363,636 valid numbers — Egoushka/attest@ff0e530:README.md#L48, an enumeration of the whole space
- 22 of 87 crashed — Egoushka/attest@ff0e530:CHANGELOG.md#L398, first repair wave
- Mexico, South Africa, Malaysia, Canada, San Marino — Egoushka/attest@ff0e530:README.md#L54
- Belgium, roughly 9% — Egoushka/attest@ff0e530:CHANGELOG.md#L256
- Thai and Cyprus test data — Egoushka/attest@ff0e530:README.md#L57
- Last upstream release, November 2021 — Egoushka/attest@ff0e530:MIGRATION.md#L3
- Twelve open issues, ten defects — Egoushka/attest@ff0e530:README.md#L59
- 586 to 4,212 test cases — Egoushka/attest@ff0e530:README.md#L68
- 33 known-issues entries, 19 still open — Egoushka/attest@ff0e530:README.md#L69
- The call in "Try it" — Egoushka/attest@ff0e530:README.md#L79, run against a source build of that commit on .NET 10, which printed `valid: True`

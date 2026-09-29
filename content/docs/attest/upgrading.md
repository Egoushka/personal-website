---
title: "Upgrade and re-check stored numbers"
description: "Why a minor release can change verdicts, which releases did, how to find the stored values that move, and how to move from CountryValidator."
order: 5
section: "Guides"
---

Attest answers yes or no about real people's and companies' numbers. A release that corrects a rule
therefore changes answers for values you may already have accepted and stored. This page says
which releases did that, and how to find the values that move before your users do.

## A verdict change is never a patch

The version number tells you what can change ([RELEASING.md](../../RELEASING.md#versioning)):

| Change | Version |
|---|---|
| the public API changes shape | major |
| a verdict changes for any input | minor |
| nothing a caller can observe | patch |

A corrected rule is a minor release even when the new answer is the right one: code that stored
numbers under the old rule sees some of them rejected under the new one. RELEASING.md's worked
example is Russia, where splitting the ten-digit company INN from the twelve-digit personal one
broke code that used `ValidateIndividualTaxCode` as "is this any INN". The one soft edge is a
method that used to throw and now answers `Not supported`; that ships as a patch.

So a patch upgrade changes no verdict, and a minor one may. Read the changelog section of every
minor you cross.

## What each release changed

| Release | Verdicts | Changelog |
|---|---|---|
| 1.2.1 | unchanged | [1.2.1](../../CHANGELOG.md#121) |
| 1.2.0 | changed in both directions | [1.2.0](../../CHANGELOG.md#120) |
| 1.1.0 | changed in both directions | [1.1.0](../../CHANGELOG.md#110) |
| 1.0.1 | unchanged | [1.0.1](../../CHANGELOG.md#101) |
| 1.0.0 | first release as Attest | [1.0.0](../../CHANGELOG.md#100) |

**1.2.0** moves answers for India, Indonesia, Peru, Ukraine, Bolivia, Thailand, Iceland, Armenia,
the Faroe Islands and Taiwan, and for no other country. Newly accepted: every Indian GSTIN, which
had been reported invalid; an Indonesian NIK used as a sole proprietor's NPWP; a Peruvian personal
RUC asked about as a VAT number; Taiwan's Unified Business Number. Newly rejected: dates that do
not exist in Armenian and Faroese personal numbers, an Icelandic kennitala with century digit 8, a
Thai personal number beginning 601, and an Indian PAN with the `0000` serial, among others. The
changelog gives an example input for each. 1.2.0 also reports `IsAmbiguous` for sole traders in
Peru, Indonesia and Ukraine, as it already did for Russia, and marks `IdExtensions.Translit`
obsolete.

**1.1.0** closes two classes of defect. Values with a lowercase `i` that were rejected on a `tr-TR`
or `az-AZ` thread, such as the Dutch postcode `1234ij` and the Inverness postcode `IV1 1AA`, now
pass everywhere. Values with the country's letters inside them rather than in front, such as
`85PL67346215`, which used to normalise to the valid Polish NIP `8567346215`, are now rejected; 40
validators did that. Separately, `Country` members gained explicit values equal to the ones the
compiler was assigning, so a stored integer means the same country as before.

**1.2.1** and **1.0.1** change package metadata and documentation only.

## Re-check what you stored

1. Read the changelog section of each minor release between your version and the new one. Each
   lists the values that now pass and the values that now fail.
2. Run your validation over the values you have stored twice, once on the old version and once on
   the new, and write each verdict out. Two builds of the same small program, each pinned to one
   package version, do it.
3. Diff the two outputs. Decide what to do about the values that now fail before you ship the
   upgrade, not after: they passed only because of a defect
   ([MIGRATION.md](../../MIGRATION.md#suggested-upgrade-path)).

> [!CAUTION]
> A new version run over stored numbers can reject values you accepted and acted on. Find them with
> the diff and decide what happens to them before the new version runs in production.

## Coming from CountryValidator

Attest is a fork of CountryValidator 1.1.3, and [MIGRATION.md](../../MIGRATION.md) is the full
account of what changes. The mechanical part is three steps
([MIGRATION.md](../../MIGRATION.md#the-swap)):

1. Swap the packages:

   ```bash title="Swap the packages"
   dotnet remove package CountryValidator
   dotnet add package Attest
   ```

   If you use the attributes, swap `CountryValidator.DataAnnotations` for
   `Attest.DataAnnotations` the same way.
2. Replace `CountryValidation` with `Attest` across the solution: the namespaces are `Attest` and
   `Attest.Countries`. Class and method names are unchanged.
3. Delete the `try`/`catch` blocks around validator calls. Nothing throws now.

The target frameworks are `netstandard2.0` and `net8.0`; `netstandard2.1` and `net48` were
dropped. A .NET Framework project gets the `netstandard2.0` build: CI compiles a `net472` consumer
against the packed packages ([Attest.PackageConsumer](../../Attest.PackageConsumer/)).

Two changes do not show up as compile errors ([MIGRATION.md](../../MIGRATION.md#the-package-and-namespace-names)):

- **`IdValidationAbstract.CountryCode` was static.** Every validator's constructor wrote it, so it
  held whichever validator was built last. It is an instance property now.
- **`[CompanyTIN]` never ran.** Its constructor threw every time. It works now, so properties that
  carry it start being validated.

The verdicts that change against CountryValidator run to two tables. The one to read before you
upgrade anything that stores what it validated is
[Numbers that were accepted and now fail](../../MIGRATION.md#numbers-that-were-accepted-and-now-fail):
Thailand, San Marino and Malaysia used to accept almost any input, the empty string included. The
tag `upstream-1.1.3` marks the baseline, so you can diff any validator yourself.

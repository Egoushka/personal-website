# Order form: EF Core and SQL Server Query Review

DRAFT, not legal advice, not yet read by a lawyer. Square brackets are to be filled in.

**Order number:** [YYYY-NNN]  **Date:** [date]

## 1. Parties

- **Author:** [Yehor Hrabovskyi, FOP, registration details, address, bank details]
- **Customer:** [legal name, address, VAT number, contact person]

## 2. What the Customer buys

A written review of one application's database access, with these deliverables:

1. A report with at least 10 numbered findings. Each finding states an id, a severity, the evidence (query text, plan or timing, code location), the effort and the fix.
2. The findings as a CSV file.
3. Patches for the top three findings, as diffs against the branch the Customer names.
4. A 60-minute debrief call.
5. Written answers to questions about the report for 30 days after delivery.

A "finding" means a numbered item with all five of the fields above, for the application and database named in clause 3.

## 3. Scope

- Application: [name, repository, branch, commit]. About 100,000 lines of C# at most.
- Database: [one SQL Server database, version]
- In scope: EF Core usage, SQL Server behaviour as the application sees it, reliability around the database (retries, transactions, idempotent writes, migration safety).
- Out of scope: fixes beyond the top three patches, retainers, on-call, architecture, security, front-end, infrastructure and cloud cost review, databases other than SQL Server, any promise of a performance gain.
- Access: read-only access to code, plus a staging copy or anonymized query statistics. No production write access. No production data containing personal data.

## 4. Timeline

Delivery within 10 working days from the day the Author confirms that access works. The debrief takes place within [5] working days after delivery. The Customer's delay in giving access or answers moves the date by the same number of days.

## 5. Price and payment

- Fee: **1,500 USD**, flat. [Excludes VAT; VAT or reverse charge treatment: lawyer and accountant to confirm wording.]
- 50% (750 USD) due on signing, 50% (750 USD) due on delivery of the report.
- Payment by bank transfer (SWIFT) in USD or EUR on invoice, or Payoneer if the Author agrees. Bank charges: [each side pays its own bank / the Customer covers the sender's charges]. Due [10] days after the invoice date.

## 6. Refund

If the delivered report has fewer than 10 findings as defined in clause 2, the Author refunds the full fee within [14] days of the Customer's written request made within [14] days of delivery. The refund is the Customer's only remedy for the count. The Author gives no guarantee of performance gains.

## 7. Cancellation

Before the Author receives access, the Customer may cancel and the deposit is refunded in full. After access is given, the deposit stays with the Author.

## 8. Confidentiality and data

The mutual NDA signed before access applies. The Author deletes the Customer's material within 30 days after delivery, and confirms it in writing on request.

## 9. Right to decline

The Author may decline or end an engagement before access is given if it would conflict with an existing obligation, and refunds any deposit. No reason beyond that statement is owed.

## 10. General terms

The general terms in `terms.md` apply and form part of this order. If they conflict, this order form wins.

**Signed:** Author [name, date]  Customer [name, date]

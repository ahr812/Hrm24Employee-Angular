# Fish24 deferred work

## Internal formal invoice exports

The following specialized export remains intentionally deferred until an authoritative sample file and field contract are supplied:

- خروجی تفصیلی مشتریان

The specialized «خروجی فاکتور» is implemented from `InvoiceExportSample.xlsx`: it exports the 45-column accounting schema using the applied main filters. «خروجی سند حسابداری» is implemented from `VoucherExportSample.xlsx` as a plain 16-column, two-row-per-credit-invoice workbook. «خروجی تفصیلی مشتریان» stays visible in the invoice-list toolbar, clearly marked as not yet implemented, and does not create a substitute file.

The current sample-only invoice ownership associations are deterministic demonstration data, not verified historical ownership: `22561 → 1001`, `22562 → 1002`, `22563 → 1007`, `22564 → 1001`, `22565 → 1002`, and `00022343 → 1007`. Production/API data must provide its own authoritative employer relationship and must not use this fixture strategy.

## VAT lifecycle for formal invoices

VAT is included in the authoritative transaction gross amount for newly issued transaction-backed invoices. Issuance stores an immutable financial snapshot containing gross, base, tax-and-duty, combined VAT rate and the applicable VAT-setting reference. Later VAT edits, activation changes or deletion do not recalculate an issued invoice.

A VAT setting cannot be edited or deleted when an existing current or legacy formal invoice falls inside its current inclusive date range. Deactivation remains allowed and only changes whether that setting applies to future issuance. Document-pricing receipt recalculation remains a separate contract and is not changed by this rule.

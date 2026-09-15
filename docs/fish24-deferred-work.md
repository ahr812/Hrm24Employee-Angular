# Fish24 deferred work

## Internal formal invoice exports

The following specialized exports are intentionally deferred until authoritative sample files and field contracts are supplied:

- خروجی سند حسابداری
- خروجی تفصیلی مشتریان

The specialized «خروجی فاکتور» is implemented from `InvoiceExportSample.xlsx`: it exports the 45-column accounting schema using the applied main filters. The two remaining deferred actions stay visible in the invoice-list toolbar, clearly marked as not yet implemented, and do not create substitute files.

The current sample-only invoice ownership associations are deterministic demonstration data, not verified historical ownership: `22561 → 1001`, `22562 → 1002`, `22563 → 1007`, `22564 → 1001`, `22565 → 1002`, and `00022343 → 1007`. Production/API data must provide its own authoritative employer relationship and must not use this fixture strategy.

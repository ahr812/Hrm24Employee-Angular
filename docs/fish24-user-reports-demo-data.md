# Fish24 user reports demonstration data

The user-reports dashboard uses a deterministic, in-memory demonstration seed for visual review. It is not verified historical activity and is never persisted or sent to an API.

## Rolling seed

- The seed captures the Tehran preview clock once when the report dataset is initialized.
- Jalali day, Saturday-based week, month and year bounds come from the shared report-calendar helpers.
- Stable IDs make initialization idempotent during navigation; a full refresh creates one fresh dataset relative to that session date.
- Registration fixtures cover current and previous day, week, month and year boundaries. Natural overlap between periods is retained.
- A person has one business-user identity. `workplaceIds` can contain multiple company/workplace memberships, so report totals still count that person once.

## Upload and distribution scenarios

The rolling uploads contain paid/active, paid/expired, paid/access-disabled and unpaid records. Every upload uses a small valid PDF Blob and stores `Blob.size` as its byte count. Seeded paid records create preview receipts directly and do not invoke payment, create wallet transactions or change wallet balances.

The five older preview sends (`2001`, `2002`, `2003`, `2004`, `2006`) previously lacked upload facts. They now use explicitly generated demonstration PDFs, actual byte sizes and demo upload dates equal to their existing distribution dates. Those timestamps are coherent mock metadata, not verified historical upload times.

The dashboard aggregates these shared business-user and distribution sources. KPI totals and chart series remain calculated values; no displayed total is seeded directly.

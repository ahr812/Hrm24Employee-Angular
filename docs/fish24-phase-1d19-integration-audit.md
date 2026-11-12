# Fish24 Phase 1D.19 integration audit

Baseline: `956ab572a20de5cf3e3c43f6bb03362b650379ea` (main).
Completed 2026-11-12. Frontend acceptance is agent-owned per user instruction. Backend acceptance remains separate. This is a regression audit with representative UI journeys, not a claim that every possible CRUD input was manually exercised.

## Corrections

- Fixed responsive user-report coverage: resizing desktop to mobile retained a 725px chart in a roughly 298px card. An explicit single-column grid and shrinkable child now contain it. Verified direct load and resize in compiled production output.
- Added accessible names and checked/pressed state to theme/color controls.
- Corrected FAQ pricing text to pages × (selected-plan page price + SMS page price), with immutable issued receipts. Financial logic unchanged.
- Added isolated combined Fish24 tests. Seed test now compares additions with pre-seed population instead of counts coupled to other fixture suites.
- Ignored temporary browser/server files.

## Verification matrix

| Area | Verification and result |
|---|---|
| Regression | Real Karma/Chrome Headless 157: **253/253 PASS**, evidence/phase-1d19/runtime-tests.log |
| Build | Production build after corrections: **PASS**, production-build.log |
| Login | Preview mobile/code authentication succeeded on local dev and compiled production output; login-success.png |
| Users → sends | Employer 1001 action yielded 3 sends; receipt 2001 showed stored 780,000 rial. Changed employer persisted on refresh; clearing main filters persisted |
| Users → transactions | 5 records for employer 1001. Zero header-search matches did not alter debit 1,875,000 / credit 3,250,000 / balance 1,375,000 rial |
| Invoices | 6 invoices / 552,696,000 rial. Main mobile filter yielded 2 / 639,000 despite zero header-search matches. Refresh restored main filter and cleared header search |
| Specialized Excel | Actual full/filtered downloads reopened: invoice 45 columns, voucher 16, customer 16. Voucher full debit/credit both 552,696,000; filtered both 639,000. Text invoice 00022343 retained; customer codes numeric. No styles/formulas/merges/extra sheets |
| Ordinary Excel | Actual sends (3), transactions (5), invoices (6/2), FAQ (5) reopened. Multiline formula-looking FAQ text remained literal |
| Column selection | FAQ last remaining column could not be hidden; one selected question column survived refresh; actual export had 1 column/4 rows. Defaults restored |
| FAQ | Required empty question rejected; test item with Persian order 3 and multiline literal content saved/exported |
| Staff/VAT/pricing/SMS/news/categories/comments/geography | Direct-route smoke and combined runtime regressions passed; routes.json and DOM files. Not a claim of browser CRUD on every module |
| Financial invariants | Included runtime tests passed: immutable snapshots, used-tariff protection, payment/permission contracts. No external payment performed |
| Tickets | Production UI reply → referral → close → reopen → employer view passed. Shared reply visible; closed reply/referral blocked; referral audit hidden from employer. 142-byte PDF downloaded |
| Roles/badges | Internal parent/submenu badge changed with ticket state. Support Excel absent; Sales Excel present |
| Reports | Four dashboards captured at 390/768/1440 in both themes. Positive SVG marks and page bounds measured. Corrected users and stable desktop financial/ticket final captures supersede intermediate images |
| Periods | Only employer registration changed to year; refresh preserved year/month/month/month. Restored month afterward |
| RTL tooltip | Actual mouse hover on mobile opened title/value within 62×69px background; users-mobile-tooltip.png |
| Console | No errors observed after production UI journeys |

Evidence: `docs/evidence/phase-1d19/`. `workbook-verification.json` records eleven inspected downloads and headers. `inspect_exports.py` reproduces those assertions while files remain in Downloads. A twelfth workbook, `fish24-faqs (2).xlsx`, was separately reopened: one question column, four rows.

## Evidence interpretation and limitations

- Use filenames containing `final` for corrected users and stable desktop financial/ticket captures. `users-390-final.png` is dark mobile. Earlier `users-390-fixed.png` still contained the previous bundle and is NOT acceptance evidence. Initial contact sheets remain diagnostic.
- Original sample XLSX files were unavailable at previously supplied desktop paths. This audit verifies the approved implemented schemas, regression expectations and actual exported headers/values; no fresh comparison with unavailable reference files is claimed.
- The unrelated full legacy suite has the existing Savings import blocker. The committed audit config executes Fish24 suites without compiling that suite. Savings code untouched.
- Browser screenshot capture occasionally timed out; successful captures were saved and inspected. Testing compiled production output removed HMR/stale-component ambiguity.
- Demo records and dev role selection remain in memory. No backend durability, real SMS, banking or production security acceptance implied.
- Discounts/coupons, reconciliation, impersonation, unspecified newsletter/messaging, extra KPIs and backend permissions remain deferred. No new module started.

## Acceptance

Frontend integration regression accepted by the agent based on this coverage and the corrected defects. User manual testing is no longer a release gate. Backend integration will have separate verification.

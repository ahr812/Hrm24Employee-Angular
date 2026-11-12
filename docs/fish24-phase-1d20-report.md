# Phase 1D.20 — Subscribers

Baseline: `1efd4f75fcb298f2128840530adbc77f1d3d160b`.
Completed: 2026-11-13.

User-approved scope: shared newsletter subscribers, only a list and Excel, exactly name/mobile/email. Sending remains deferred.

- Added `/fish24/internal/subscribers`, menu link and permission guard.
- Read directly from shared user records with `newsletterEmail === true`; no new fixture identities or consent values introduced.
- Selected columns persist independently; last column cannot be hidden. Header searches combine with AND and Persian digit normalization; sorting has three states. Pagination clamps safely after membership changes.
- Excel uses all subscribed users in source order and selected columns, ignoring header searches, sorting and current page. Mobiles remain text.
- Existing internal viewing and Admin/Sales export convention preserved; export method rejects Support even when called directly.

## Verification

- Combined Fish24 Karma/Chrome Headless 157: **260/260 PASS**, including seven new subscriber tests.
- Production build: PASS. Angular application and test compilation succeeded.
- Browser: initial empty list; activated newsletter preference through existing user 1001 edit form; saved user appeared immediately via sidebar navigation.
- Header search with zero table matches did not suppress Excel data.
- Actual downloaded full and mobile-only workbooks reopened with openpyxl: exact headers/values, mobile stored as text, no formulas or styles. Evidence: `evidence/phase-1d20/workbooks.json`.
- Last visible column protected; mobile-only selection restored on refresh; defaults restored.
- Support Excel absent; Sales Excel present. External-role guard covered by runtime tests.
- Widths 390/768/1440: no page-level horizontal overflow measured. Light/Dark and desktop/mobile screenshots inspected. Table has its own horizontal scrollbar.
- Full-page screenshot capture produced an incorrect offset in mobile captures; viewport captures were used for the final mobile evidence instead. This was not reproduced in actual DOM layout or viewport screenshots.
- Browser console errors: none observed.

The displayed demonstration subscription was enabled through the UI for this audit only. It is not a persistent fixture change. On refresh, the initial subscriber list remains empty until existing user preferences are edited. No backend persistence or email delivery was added.

Frontend verified by the agent; no manual user approval gate.

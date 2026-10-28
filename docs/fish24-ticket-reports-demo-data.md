# Fish24 ticket reports preview data

Phase 1D.16 reads every metric from `Fish24TicketPreviewService`; there is no reporting-only copy of ticket state.

The shared preview source keeps tickets `3001`–`3004` unchanged, including the established employer demo ticket `3004` and its exact PDF attachment. It also creates five deterministic rolling MOCK tickets (`3005`–`3009`) once per preview dataset. Their Jalali dates cover the current month, the complete previous month, and the equivalent period in the previous year. They use the existing demonstration employers `1001` and `1002`, all three recipient departments, and all three current statuses. Navigation does not recreate or duplicate them.

These rolling records are presentation/test fixtures only. They are not verified customer history and must not be reused as a production-data migration strategy.

Focused verification:

`node node_modules/@angular/cli/bin/ng.js test --configuration=ticket-reports --watch=false --progress=false`

# Fish24 general reports preview data

Phase 1D.17 aggregates shared News, News Comment and Internal SMS preview services. It does not maintain report-local copies.

Three rolling MOCK news records (`403`–`405`) cover active current/previous-month news and an inactive current-month news item. Timestamped engagement fixtures reconcile exactly with existing aggregate counters: news `401` has 248 views and 12 likes; news `402` has 91 views and 4 likes. The shared event source therefore contains 339 view and 16 like events with stable IDs. Internal preview navigation never records engagement. Deleting a news item removes its associated engagement fixtures under the existing deletion contract.

Six rolling manual SMS fixtures (`5004`–`5009`) add current/previous-month coverage across Administrator, Sales and Support. Every record represents one recipient; OTP and automatic document notifications are outside this source.

At verification date 1405/08/06, monthly current/previous values are: active news 1/1, views 200/80, likes 8/4 and manual SMS 4/2. Current comment snapshot is 2 approved and 1 unapproved.

Focused tests: `node node_modules/@angular/cli/bin/ng.js test --configuration=general-reports --watch=false --progress=false`

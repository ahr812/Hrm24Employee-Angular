# Fish24 deferred work

## Shared ticket preview contract

Employer and internal ticket screens use one in-memory preview source. Internal Administrator, Sales and Support share full visibility; employer access is restricted by the authenticated employer id at service and route-view boundaries. The lifecycle is «نیاز به بررسی» for creation/employer reply/referral, «جواب داده شده» for an internal reply, and «بسته شده» until either side reopens it. Department referral is limited to management, sales and support and its audit history is internal-only. Replies require text; each submitted message accepts up to five image/PDF/Word/Excel/ZIP files of at most 10 MB each. Selected Blob bytes are held only in current browser memory, are not persisted, uploaded, scanned or delivered to a backend, and user-created attachments disappear after refresh.

Ticket `3004` is an explicit deterministic demonstration fixture for preview employer `user-1` (علی احمدی، `09123456789`). It contains an employer request, an internal Support reply and a small valid PDF attachment whose bytes are initialized from source on every application start. Its reappearance after refresh demonstrates fixture initialization only; it does not imply persistence for user-created tickets or attachments.

## Internal news preview contract

News and categories share one in-memory Signal source. News stores stable category IDs and may belong to multiple categories; displayed category names and distinct counts are always derived from those relationships. Linked categories cannot be deleted even when every linked news item is inactive. Deactivation removes a category from new assignments without deleting or deactivating existing news, and an existing inactive relationship is preserved during unrelated edits unless the editor explicitly removes it. News deletion removes the authoritative record and therefore all of its category relationships.

Rich content is edited with the MIT-licensed Tiptap 3 editor and its official ProseMirror-based extensions for headings, lists, links, images, tables, alignment, direction, history and formatting. Angular renders previews through its normal sanitized `[innerHTML]` path; executable elements, event handlers and unsafe URL schemes are also removed before saving. Main, category and embedded images are validated as JPG/PNG/WebP up to 5 MB and represented as browser-memory data URLs when selected. These previews, newly created records and selected bytes do not persist across a full refresh and are not uploaded or published.

News comments now use one in-memory Signal source keyed by stable news ID. The three neutral records are explicit demonstration fixtures covering approved-without-response, approved-with-response and unapproved states; they are not production identities. Only approved comments and their optional single plain-text staff response appear in the internal news preview, and derived news counts include distinct approved comments only. Unapproval hides but does not delete the comment or response, so reapproval restores both. News deletion cascades only its dependent preview comments. Public submission, persistence, threaded replies, rich-text replies and notifications remain unimplemented.

## Internal sent-SMS history

The user intends to revisit this read-only page later. Delivery-status display and resend functionality remain deferred candidates and require future business decisions; no placeholder action or column is included now.

## Internal formal invoice exports

All three specialized invoice-list exports are implemented from their supplied reference samples. «خروجی فاکتور» uses the exact 45-column schema. «خروجی سند حسابداری» uses the exact 16-column schema and creates one balanced two-row voucher for every invoice in the applied main-filter results, regardless of transaction direction or provenance. «خروجی تفصیلی مشتریان» uses the exact 16-column customer schema and exports one current employer profile per distinct employer in first-occurrence order. Specialized exports ignore column selection, header searches, table sorting and pagination.

The current sample-only invoice ownership associations are deterministic demonstration data, not verified historical ownership: `22561 → 1001`, `22562 → 1002`, `22563 → 1007`, `22564 → 1001`, `22565 → 1002`, and `00022343 → 1007`. Production/API data must provide its own authoritative employer relationship and must not use this fixture strategy.

The demo fixture reconciliation is also not a claim about historical financial facts. Invoice `22561` was corrected from a gross of `267,000` to its linked transaction amount of `250,000` rial, with a persisted year-1405 demo VAT snapshot of 10% (`base 227,273`, `tax 22,727`, setting `5`). Invoice `22562` was corrected from `534,000` to `500,000` rial with the same demo snapshot (`base 454,545`, `tax 45,455`, setting `5`). Their transaction amounts, transaction IDs and wallet balances were not changed. The linked tracking fields now contain deterministic numeric demo values `014101` and `014096`; these are sample identifiers, not bank references.

Invoices `22563`, `22564` and `22565` have explicit demo credit provenance stored on the invoice because no authoritative related transaction exists in the fixtures. This provenance does not create wallet activity or a transaction association. Legacy invoice `00022343` remains explicitly credit-eligible with no tracking value. Production/API invoices must provide authoritative provenance; there is no runtime rule that upgrades unknown invoices to credit.

## VAT lifecycle for formal invoices

VAT is included in the authoritative transaction gross amount for newly issued transaction-backed invoices. Issuance stores an immutable financial snapshot containing gross, base, tax-and-duty, combined VAT rate and the applicable VAT-setting reference. Later VAT edits, activation changes or deletion do not recalculate an issued invoice.

The corrected demo snapshots above are persisted fixture values. Reads, refreshes, exports and later VAT activation changes do not recalculate them.

A VAT setting cannot be edited or deleted when an existing current or legacy formal invoice falls inside its current inclusive date range. Deactivation remains allowed and only changes whether that setting applies to future issuance. Document-pricing receipt recalculation remains a separate contract and is not changed by this rule.

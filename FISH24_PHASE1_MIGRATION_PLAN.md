# FISH24 PHASE 1 MIGRATION PLAN

## 1. Current Repository Assessment

The repository is a single Angular 19 application with a protected/public route shell, a signal-based organization context, and an HRM24-oriented demo auth flow. This was verified from the actual source in:

- [src/app/app.routes.ts](src/app/app.routes.ts)
- [src/app/core/auth/auth.guard.ts](src/app/core/auth/auth.guard.ts)
- [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts)
- [src/app/core/organization/organization.service.ts](src/app/core/organization/organization.service.ts)
- [src/app/app.component.ts](src/app/app.component.ts)
- [src/app/shared/layout/sidebar/sidebar.component.ts](src/app/shared/layout/sidebar/sidebar.component.ts)

Confirmed current architecture:
- Angular standalone route loading with auth and guest guards.
- Shared shell with sticky header, fixed right sidebar, mobile nav, org context bar, global search, theme support, and toast infrastructure.
- Organization context implemented through a signal service and localStorage, but with HRM24 semantics.
- Authentication and session behavior are demo-oriented and not a final Fish24 authentication contract.
- The app’s current navigation and page model are HRM24 employee-oriented and must be treated as visual/architectural foundation rather than final Fish24 business behavior.

## 2. Files That Must Remain Stable

These must remain stable because they define the valid shell and integration backbone for the Fish24 migration:

- [src/app/app.component.ts](src/app/app.component.ts)
- [src/app/app.routes.ts](src/app/app.routes.ts)
- [src/app/core/auth/auth.guard.ts](src/app/core/auth/auth.guard.ts)
- [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts)
- [src/app/core/organization/organization.service.ts](src/app/core/organization/organization.service.ts)
- [src/app/shared/layout/header/header.component.ts](src/app/shared/layout/header/header.component.ts)
- [src/app/shared/layout/sidebar/sidebar.component.ts](src/app/shared/layout/sidebar/sidebar.component.ts)
- [src/app/shared/layout/org-context-bar/org-context-bar.component.ts](src/app/shared/layout/org-context-bar/org-context-bar.component.ts)
- [src/app/shared/layout/layout.service.ts](src/app/shared/layout/layout.service.ts)
- [src/app/shared/layout/theme.service.ts](src/app/shared/layout/theme.service.ts)
- [src/app/shared/ui/toast/toast.component.ts](src/app/shared/ui/toast/toast.component.ts)
- [src/app/shared/ui/global-search/global-search.component.ts](src/app/shared/ui/global-search/global-search.component.ts)

These are the shell, route, guard, and theme primitives that Fish24 must preserve without replacing the Angular foundation.

## 3. HRM24-Specific Areas To Be Migrated

These areas are currently HRM24-specific or demo-oriented and should be treated as migration targets rather than final Fish24 logic:

- [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts)
- [src/app/core/data/employee-data.service.ts](src/app/core/data/employee-data.service.ts)
- [src/app/core/search/search.service.ts](src/app/core/search/search.service.ts)
- [src/app/shared/layout/sidebar/sidebar.component.ts](src/app/shared/layout/sidebar/sidebar.component.ts)
- [src/app/features/dashboard/dashboard.component.ts](src/app/features/dashboard/dashboard.component.ts)
- [src/app/features/payslip/payslip.component.ts](src/app/features/payslip/payslip.component.ts)
- [src/app/features/tasks/tasks.component.ts](src/app/features/tasks/tasks.component.ts)
- [src/app/features/documents/documents.component.ts](src/app/features/documents/documents.component.ts)

These should not be mistaken for final Fish24 business behavior. They provide the current UX baseline but require Fish24 semantics.

## 4. Proposed Fish24 Architecture

Recommended architecture boundaries:

- Identity and access shell
  - global Fish24 user identity
  - role/capability model
  - active context concept
- Employer and business-relationship layer
  - employer capability
  - company/workshop relationship
  - active company/workshop context
  - personal user context
- Documents and distribution
  - personal documents
  - employer-issued documents
  - document status and expiration
  - PDF distribution flow
- Financial and operational services
  - wallet
  - transactions
  - invoices
  - pricing
  - discounts
- Support and administration
  - dashboard
  - reports
  - user management
  - ticketing
  - notifications
  - settings

The recommended Angular pattern is:

- Feature page/component
- Fish24 domain service or facade
- Data-access interface/repository boundary
- Temporary mock adapter (for now)
- Future HTTP/API adapter (later)

This keeps mock implementations replaceable without rewriting screens, while respecting the existing signal-based architecture and shared shell.

## 5. Proposed Role & Permission Model

The role model must be capability-aware rather than single-role-only.

- Super Admin
  - administrative power over current Fish24 admin pages
  - NOT automatically assumed to have direct Employer or Employee panel access without explicit requirement
  - access to admin surfaces remains subject to future permission definition
- Sales Expert
  - access to currently confirmed administration pages for sales/support panel
- Support Expert
  - excludes Financial Management, Financial Reports, Discount Management, Pricing Management, Site Settings, and Geographic Areas
  - still has access to the remaining confirmed support/admin pages
- Employer
  - manages company/workshop entities
  - owns outgoing document workflows
  - has wallet/invoice/ticket/notification responsibilities
- Employee
  - primary landing experience: My Documents
  - may also have profile and notification views

Permissions must be structured at multiple levels:
- route-level
- menu-level
- page-level
- action-level

The architecture should support capability checks such as:
- view reports
- manage users
- manage pricing
- send SMS
- distribute document
- view transactions
- enter user account (NOT YET SPECIFIED)

## 6. Permission Matrix

Module-level matrix:

- Dashboard
  - Super Admin: Yes
  - Sales: Yes
  - Support: Yes
  - Employer: Yes
  - Employee: No
- General Reports
  - Super Admin: Yes
  - Sales: Yes
  - Support: Yes
  - Employer: NOT YET SPECIFIED
  - Employee: No
- User Reports
  - Super Admin: Yes
  - Sales: Yes
  - Support: Yes
  - Employer: No
  - Employee: No
- Ticket Reports
  - Super Admin: Yes
  - Sales: Yes
  - Support: Yes
  - Employer: NOT YET SPECIFIED
  - Employee: No
- Financial Reports
  - Super Admin: Yes
  - Sales: Yes
  - Support: No
  - Employer: No
  - Employee: No
- User Management
  - Super Admin: Yes
  - Sales: Yes
  - Support: Yes
  - Employer: No
  - Employee: No
- Financial Management
  - Super Admin: Yes
  - Sales: Yes
  - Support: No
  - Employer: Limited to own wallet/invoice context only
  - Employee: No
- Discount Management
  - Super Admin: Yes
  - Sales: Yes
  - Support: No
  - Employer: No
  - Employee: No
- Pricing Management
  - Super Admin: Yes
  - Sales: Yes
  - Support: No
  - Employer: No
  - Employee: No
- Site Settings
  - Super Admin: Yes
  - Sales: Yes
  - Support: No
  - Employer: No
  - Employee: No
- Geographic Areas
  - Super Admin: Yes
  - Sales: Yes
  - Support: No
  - Employer: No
  - Employee: No
- Employer Panel
  - Super Admin: NOT YET SPECIFIED
  - Sales: NOT YET SPECIFIED
  - Support: NOT YET SPECIFIED
  - Employer: Yes
  - Employee: No
- Employee Panel
  - Super Admin: NOT YET SPECIFIED
  - Sales: No
  - Support: No
  - Employer: No
  - Employee: Yes

The permissions model must remain capable of distinguishing general, user, ticket, and financial reporting permissions rather than treating all reports as one boolean.

## 7. Proposed Routing Map

Current → Future:

- /login → /auth/login
- /register → /auth/register
- /forgot-password → /auth/forgot-password
- /dashboard → admin or employer dashboard depending active business context; employee does not need a generic dashboard landing route
- /payslip → Fish24 document-related area, possibly repurposed for document distribution or personal document views
- /documents → shared document domain, later split by role behavior if needed
- /tickets → shared ticket domain; may remain shared or split by role-specific page behavior
- /profile → shared profile domain; role-specific page behavior may differ but underlying domain can remain shared
- /notifications → shared notification domain; may be role-aware in display and actions
- /comparison, /calendar, /training, /attendance, /leave, /advance, /loan, /savings, /missions, /evaluation, /tasks, /surveys, /knowledge, /chat → these are current HRM24 feature routes and should be reviewed individually before any Fish24 route mapping; they are not automatically equivalent to Fish24 feature names

The route migration must be additive and conservative. Do not finalize role-duplicated routes like /admin/tickets and /employer/tickets until the domain is validated for sharing or separation.

## 8. Layout Migration Strategy

Desktop:
- Keep the fixed header, main app shell, and right-side sidebar pattern from the existing Angular shell.
- Replace HRM24 labels and menu items with Fish24 role-aware modules.
- Preserve RTL, dark mode, border, cards, spacing, and responsive shell layout.

Mobile:
- Keep the existing mobile/tablet navigation behavior.
- Adapt to Fish24 employee/employer/admin navigation patterns while preserving the responsive structure.
- Ensure the user can reach the primary employee landing experience: My Documents.

Global shell behavior:
- Keep global search, toasts, theme switcher, notifications, and app-wide status patterns.
- Do not replace shell logic with a new framework or CSS stack.

## 9. Company/Workshop Context Strategy

The existing organization context service can be reused as an architectural pattern, but not as a direct Fish24 Company/Workshop equivalent.

Required concept separation:

- User Identity
  - one global Fish24 user identified by a unique mobile number
- Employer Relationship
  - the user’s employer capability/business role
- Company / Workshop
  - business entities managed by an employer
- Active Company/Workshop Context
  - the currently selected business context for a page that requires one
- Personal User Context
  - the same user’s personal documents and identity without dependency on the active employer workshop

This distinction is critical because a user may receive documents from Employer A, Employer B, and Employer C while still remaining the same global Fish24 user identity.

## 10. User Identity Strategy

This section must use the corrected Fish24 identity principle:

Global Mobile-Number Identity

The critical rule is:
- A mobile number is globally unique across Fish24 regardless of role.
- One mobile number represents one Fish24 user identity.
- That user may have multiple roles and business relationships.
- The same user may receive documents from multiple employers.
- The same user may simultaneously act as employer and employee.

This means the frontend should not assume one employee identity belongs to exactly one employer or one workshop.

## 11. PDF Workflow Architecture

Architecture only; not a parser implementation.

Confirmed workflow:
1. Upload PDF
2. Process every page independently
3. Detect mobile marker on each page
4. Validate exactly one valid mobile marker per page
5. Validate no duplicate mobile number across the entire uploaded PDF
6. Display page-by-page processing result
7. Reject the entire PDF if any page contains an error
8. Require re-upload of corrected PDF
9. If fully valid, continue to later distribution stages

Confirmed prohibition:
- No partial distribution of invalid PDFs.
- No manual override or skip of invalid pages.
- No UI behavior beyond the validated page result and rejection flow.

NOT YET SPECIFIED:
- audit history
- status tracking
- later distribution stages beyond the validation gate

## 12. API-Ready Data Access Strategy

Use a layered pattern so mock implementations can be replaced later without rewriting screens:

- Feature page
- Fish24 domain service or facade
- Repository/data-access interface
- Temporary mock adapter
- Future HTTP/API adapter

Examples of future Fish24 service boundaries:
- document service
- distribution service
- wallet service
- invoice service
- permissions service
- company/workshop service
- notification service
- ticket service

The mock adapter may temporarily use local data and should never be coupled directly to page logic. The goal is clean future API integration without creating speculative backend contracts.

## 13. Branding Migration

Branding should be done conservatively and selectively.

Files likely to require Fish24 branding preparation:
- [src/index.html](src/index.html)
- [src/app/app.component.ts](src/app/app.component.ts)
- [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts)
- [src/app/shared/layout/header/header.component.ts](src/app/shared/layout/header/header.component.ts)
- [src/app/shared/layout/sidebar/sidebar.component.ts](src/app/shared/layout/sidebar/sidebar.component.ts)
- [src/app/features/auth/login/login.component.ts](src/app/features/auth/login/login.component.ts)
- [src/app/features/profile/profile.component.ts](src/app/features/profile/profile.component.ts)

Safe branding changes:
- product title
- labels and navigation text
- metadata and headers
- user-visible copy

Unsafe or risky changes:
- localStorage keys
- authentication/session semantics
- underlying technical identifiers not related to display
- manufacturing business logic under the banner of rebranding

## 14. Components To Reuse

High-confidence reusable components:
- [src/app/shared/layout/header/header.component.ts](src/app/shared/layout/header/header.component.ts)
- [src/app/shared/layout/sidebar/sidebar.component.ts](src/app/shared/layout/sidebar/sidebar.component.ts)
- [src/app/shared/layout/org-context-bar/org-context-bar.component.ts](src/app/shared/layout/org-context-bar/org-context-bar.component.ts)
- [src/app/shared/ui/toast/toast.component.ts](src/app/shared/ui/toast/toast.component.ts)
- [src/app/shared/ui/global-search/global-search.component.ts](src/app/shared/ui/global-search/global-search.component.ts)
- [src/app/shared/ui/icon/icon.component.ts](src/app/shared/ui/icon/icon.component.ts)
- [src/app/shared/ui/theme-switcher/theme-switcher.component.ts](src/app/shared/ui/theme-switcher/theme-switcher.component.ts)
- [src/app/shared/ui/notification-modal/notification-modal.component.ts](src/app/shared/ui/notification-modal/notification-modal.component.ts)

These components already align with the project’s current RTL, dark mode, and responsive design language and should be reused before inventing new form or UI primitives.

## 15. Components That May Need To Be Added Later

These should be treated as future Fish24 additions, not current requirements:
- role shell or layout variants
- Fish24 document upload wizard
- PDF validation result screen
- permission gate / access guard abstraction
- role-aware navigation config
- admin data-list foundation
- employer dashboard summary widgets
- employee My Documents page shell
- wallet and invoice pages
- ticket detail and notification screens

These are not yet required to start the migration foundation.

## 16. Existing Components That Should Eventually Be Retired

Only if clearly HRM24-specific and no longer used by Fish24:
- [src/app/core/data/employee-data.service.ts](src/app/core/data/employee-data.service.ts)
- HRM24 employee management assumptions embedded in [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts)
- current HRM24 navigation semantics in [src/app/shared/layout/sidebar/sidebar.component.ts](src/app/shared/layout/sidebar/sidebar.component.ts)

These should be retired or heavily re-scoped only after Fish24 business domains are defined and validated. They should not be deleted prematurely during Phase 1.

## 17. Migration Risks

The biggest risks in this migration are:

- over-assuming role access across Employer and Employee panels
- forcing every role to a dashboard landing route
- collapsing report permissions into one boolean flag
- duplicate route creation before a domain-level sharing decision
- conflating user identity with employer/company relationship
- incorrectly treating employee ownership as one company or one workshop
- modifying auth logic before a dedicated authentication migration phase
- treating localStorage as a substitute for Fish24 business persistence
- allowing the shell to drift away from the existing Angular architecture
- creating speculative PDF, payment, or SMS workflows before the confirmed requirements are ready

## 18. Recommended Implementation Order

1. Freeze the existing route shell and Angular layout foundation.
2. Define Fish24 role and capability boundaries without major auth rewrites.
3. Create role-aware navigation configuration in a conservative, additive way.
4. Separate user identity, employer relationship, and company/workshop context in the domain model.
5. Add Fish24 domain interfaces and data access boundaries.
6. Prepare branding labels and app-level naming changes.
7. Add role and permission infrastructure without touching business workflows.
8. Design the PDF validation stage only as a wizard skeleton, not a parser.
9. Keep HRM24 pages operational while Fish24 pages are gradually introduced.
10. Only after route and domain boundaries are validated, begin detailed feature implementations.

## 19. Files Proposed For Modification In Phase 1

The only files proposed for safe Phase 1 foundation changes are:

- [src/app/app.routes.ts](src/app/app.routes.ts)
- [src/app/core/auth/auth.guard.ts](src/app/core/auth/auth.guard.ts)
- [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts)
- [src/app/core/organization/organization.service.ts](src/app/core/organization/organization.service.ts)
- [src/app/shared/layout/sidebar/sidebar.component.ts](src/app/shared/layout/sidebar/sidebar.component.ts)
- [src/app/shared/layout/header/header.component.ts](src/app/shared/layout/header/header.component.ts)
- [src/app/shared/layout/org-context-bar/org-context-bar.component.ts](src/app/shared/layout/org-context-bar/org-context-bar.component.ts)
- [src/app/app.component.ts](src/app/app.component.ts)
- [src/index.html](src/index.html)

These changes are limited to shell, branding, routing config, role context, and safe domain scaffolding.

## 20. Files Explicitly NOT To Modify Yet

These should remain untouched during Phase 1 unless a separate implementation request specifically authorizes them:

- [src/app/features](src/app/features)
- [src/app/core/data/employee-data.service.ts](src/app/core/data/employee-data.service.ts)
- [src/app/core/chat/chat.service.ts](src/app/core/chat/chat.service.ts)
- [src/app/core/search/search.service.ts](src/app/core/search/search.service.ts)
- [src/app/shared/ui](src/app/shared/ui)
- [src/app/core/services](src/app/core/services)
- [src/app/features/auth](src/app/features/auth) beyond minimal branding or shell navigation preparation
- all final Fish24 business pages and workflow screens
- backend/API integration points
- payment, SMS, PDF parsing, and database-related implementation

No detailed business pages or backend work should begin in this Phase 1 foundation pass.

## 21. PHASE 1 MINIMAL IMPLEMENTATION PROPOSAL

This section proposes the SMALLEST safe set of actual code changes needed to begin Fish24 migration without premature feature implementation.

### 21.1 Proposed modification: Fish24 domain type definitions

- File path: [src/app/core](src/app/core)
- Why it needs modification: the repository has HRM24-oriented session and organization structures, but Fish24 needs explicit domain separation for identity, employer relationships, company/workshop context, and personal documents.
- What will change: add Fish24 domain interfaces and lightweight type definitions for user identity, employer relationship, company/workshop, active context, personal document context, and role-capability metadata.
- What will remain unchanged: no detailed business pages, no database schema, no backend API contract, no PDF parsing, no payment integration.
- Risk level: LOW

Recommended new file(s):
- src/app/core/fish24/models/fish24-user.model.ts
- src/app/core/fish24/models/fish24-context.model.ts
- src/app/core/fish24/models/fish24-role.model.ts

### 21.2 Proposed modification: role and capability definitions

- File path: [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts)
- Why it needs modification: the current auth service hardcodes HRM24 role semantics and localStorage session storage. It must be kept stable for the shell, but the Fish24 role/capability model should be defined separately so the app can evolve without redrawing auth logic.
- What will change: introduce a Fish24 role capability definition layer and a role permission enum/shape, without replacing the existing auth guard/session logic.
- What will remain unchanged: current login/session behavior, guard logic, and authentication flow remains intact unless a dedicated auth migration phase is later approved.
- Risk level: MEDIUM

Recommended new file(s):
- src/app/core/fish24/permissions/fish24-permissions.ts
- src/app/core/fish24/permissions/role-capabilities.ts

### 21.3 Proposed modification: permission infrastructure

- File path: [src/app/core](src/app/core)
- Why it needs modification: Fish24 needs explicit handling for general/user/ticket/financial reports and support restrictions, not a single boolean summary.
- What will change: add permission definitions and a lightweight check utility that can evaluate page and action access for Admin, Sales, Support, Employer, and Employee.
- What will remain unchanged: no final route permission enforcement for every page; no backend authorization logic; no production security implementation.
- Risk level: LOW

Recommended new file(s):
- src/app/core/fish24/permissions/permission-checks.ts
- src/app/core/fish24/permissions/fish24-permission-map.ts

### 21.4 Proposed modification: role-aware navigation configuration

- File path: [src/app/shared/layout/sidebar/sidebar.component.ts](src/app/shared/layout/sidebar/sidebar.component.ts)
- Why it needs modification: the current sidebar is HRM24-specific and assumes a single employee-centric navigation pattern.
- What will change: convert the sidebar to a role-aware navigation configuration layer that can determine visible entries by role and context, while preserving the existing responsive shell structure.
- What will remain unchanged: the layout shell, sidebar mechanics, mobile behavior, icon system, and drawer logic.
- Risk level: MEDIUM

Recommended new file(s):
- src/app/shared/layout/navigation/fish24-nav.config.ts
- src/app/shared/layout/navigation/nav-item.model.ts

### 21.5 Proposed modification: branding preparation

- File path: [src/index.html](src/index.html)
- Why it needs modification: Fish24 branding needs preparation without broad rebranding of technical identifiers or business logic.
- What will change: update product title, metadata, visible labels, and safe user-facing strings while avoiding destructive renames in service logic or storage keys.
- What will remain unchanged: technical identifiers, localStorage keys, auth/session architecture, business logic semantics.
- Risk level: LOW

### 21.6 Proposed modification: API-ready data boundaries

- File path: [src/app/core](src/app/core)
- Why it needs modification: Fish24 must not lock pages to localStorage or mock arrays in a way that makes future API work expensive.
- What will change: create repository-like interfaces and placeholder adapters for documents, notifications, tickets, wallet, prices, and company/workshop data so the mock layer is isolated.
- What will remain unchanged: no HTTP implementation, no API contract, no backend deployment, no database migration.
- Risk level: LOW

Recommended new file(s):
- src/app/core/fish24/repositories/document-repository.interface.ts
- src/app/core/fish24/repositories/notification-repository.interface.ts
- src/app/core/fish24/repositories/company-repository.interface.ts

### 21.7 Explicitly not recommended in Phase 1

These should not be implemented yet:
- authentication redesign in [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts)
- PDF parsing or validation service beyond the domain contract
- payment flow or wallet calculations
- SMS integration
- backend or API implementation
- employee/company deletion or destructive route replacement
- detailed Fish24 pages

Risk level: HIGH if attempted prematurely.

### 21.8 New files recommended for creation

- src/app/core/fish24/models/fish24-user.model.ts
- src/app/core/fish24/models/fish24-context.model.ts
- src/app/core/fish24/models/fish24-role.model.ts
- src/app/core/fish24/permissions/fish24-permissions.ts
- src/app/core/fish24/permissions/role-capabilities.ts
- src/app/core/fish24/permissions/permission-checks.ts
- src/app/core/fish24/permissions/fish24-permission-map.ts
- src/app/shared/layout/navigation/fish24-nav.config.ts
- src/app/shared/layout/navigation/nav-item.model.ts
- src/app/core/fish24/repositories/document-repository.interface.ts
- src/app/core/fish24/repositories/notification-repository.interface.ts
- src/app/core/fish24/repositories/company-repository.interface.ts

These are intentionally small, additive, and safe. They support Fish24 foundations without forcing destructive changes to the rest of the application.

---

This concludes the corrected Phase 1 migration plan and the conservative minimal implementation proposal. No source code has been modified. Please wait for explicit implementation approval before beginning any actual code changes.

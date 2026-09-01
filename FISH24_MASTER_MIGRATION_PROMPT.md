# FISH24 — MASTER MIGRATION & IMPLEMENTATION CONTRACT
## Phase 1: Controlled Migration Foundation

You are working inside an EXISTING Angular 19 project.

This repository was originally implemented as an HRM24 employee panel, but it is now being migrated into a new production application called:

**English name:** Fish24  
**Persian name:** فیش24

Fish24 is NOT a new experimental product.

Fish24 is an existing, active, nationwide production system with real users and established business rules.

The current production Fish24 system is implemented using Razor Pages and C# and is not API-based.

We are migrating its frontend experience to this Angular 19 application.

The existing Angular project is the NEW visual and architectural baseline.

The existing production Fish24 application is the BUSINESS BEHAVIOR baseline.

These two sources have different responsibilities:

- Existing Angular HRM24 project:
  - design language
  - UX patterns
  - responsive behavior
  - RTL behavior
  - layout structure
  - component conventions
  - theme system
  - Angular architecture

- Existing Fish24 production system:
  - business rules
  - workflows
  - fields
  - permissions
  - financial behavior
  - PDF processing behavior
  - user relationships
  - existing features

Never confuse these responsibilities.

The final result must be:

**EXISTING FISH24 BUSINESS + NEW ANGULAR DESIGN SYSTEM**

NOT:

**OLD FISH24 VISUAL DESIGN COPIED INTO ANGULAR**

and NOT:

**HRM24 BUSINESS LOGIC RENAMED TO FISH24**

---

# 1. ABSOLUTE SAFETY RULE

This is a production-system migration.

There is effectively no tolerance for careless behavioral changes.

Never:

- invent business rules
- silently remove functionality
- simplify an existing workflow without instruction
- merge two business concepts merely because they look similar
- reinterpret existing permissions
- invent API contracts
- invent database structures
- assume mock HRM24 data represents Fish24
- blindly rename HRM24 concepts into Fish24 concepts
- redesign unrelated parts of the project
- introduce a new UI framework
- replace established project infrastructure without strong necessity
- perform broad refactors merely for code cleanliness

If business behavior is not explicitly known, preserve a placeholder architecture and mark it as unresolved rather than inventing behavior.

Use:

`NOT YET SPECIFIED`

when necessary.

---

# 2. SOURCE-OF-TRUTH PRIORITY

When decisions conflict, use this priority order:

1. Explicit Fish24 business requirements provided during this migration
2. Existing production Fish24 behavior
3. Existing Angular repository architecture
4. Existing Angular design system and UX patterns
5. Existing mock HRM24 business implementation
6. Developer assumptions

Developer assumptions have the LOWEST priority.

---

# 3. EXISTING ANGULAR ARCHITECTURE THAT MUST BE PRESERVED

The repository has already been analyzed.

Its baseline architecture includes:

- Angular 19
- Standalone Components
- Lazy-loaded routes using `loadComponent`
- Angular Router
- `authGuard`
- `guestGuard`
- signal-based state
- feature pages under `src/app/features`
- shared UI/layout under `src/app/shared`
- domain services under `src/app/core`
- Tailwind CSS
- CSS theme variables/tokens
- RTL-first Persian UI
- light/dark/system theme modes
- custom SVG icon registry
- custom modal patterns
- toast infrastructure
- Chart.js wrapper
- existing responsive shell
- fixed desktop sidebar
- mobile/tablet-specific navigation behavior
- local Vazirmatn font assets

Do NOT replace these foundations.

Do NOT introduce:

- Angular Material
- PrimeNG
- Bootstrap
- DaisyUI
- shadcn
- another icon framework
- another CSS framework
- another state-management library

unless explicitly requested later.

---

# 4. VISUAL PRESERVATION CONTRACT

The existing Angular project is the design reference.

New Fish24 pages must look as though they have always belonged to the same product family.

Preserve:

- typography
- spacing philosophy
- border-radius vocabulary
- shadows
- surface hierarchy
- card appearance
- border usage
- form field patterns
- focus states
- button styling
- modal behavior
- toast behavior
- navigation behavior
- responsive breakpoints
- desktop/mobile density
- animation style
- dark mode
- RTL behavior
- icon style
- loading/empty/error states

Do NOT copy the visual appearance of the old Razor Pages Fish24 screenshots.

Those screenshots are BUSINESS REFERENCES, not DESIGN REFERENCES.

Use the old Fish24 screenshots to extract:

- pages
- features
- fields
- actions
- statuses
- workflows
- relationships
- permissions

Then represent them using the new Angular design language.

---

# 5. PRODUCT DEFINITION

Fish24 is an online employee payslip/document distribution platform.

Its primary purpose is:

- online distribution of employee payslips
- PDF-based payroll document delivery
- reducing the operational and financial cost of payslip distribution

Typical customers include:

- companies
- HR departments
- HR specialists
- business owners
- organizations that need to distribute employee payroll documents

The core product must remain Persian-first and RTL-first.

---

# 6. CONFIRMED SYSTEM ROLES

There are currently five major roles:

1. Super Admin
2. Sales Expert
3. Support Expert
4. Employer / Customer
5. Employee

Important:

A `User` and a `Role` are NOT the same concept.

A user may have multiple business relationships or capabilities.

The frontend architecture must therefore not assume one permanent role equals one unique account.

---

# 7. GLOBAL USER IDENTITY RULE

This is a CRITICAL Fish24 rule.

A mobile number uniquely identifies a user across the ENTIRE Fish24 platform.

Mobile numbers are globally unique.

A duplicate user account with the same mobile number must not conceptually exist.

For example:

`0912XXXXXXX`

represents one global Fish24 user.

That user may simultaneously:

- act as an Employer
- receive personal payslips as an Employee
- receive payslips from multiple employers
- have other permitted system roles

Therefore never model the frontend conceptually as:

- EmployerUser
- EmployeeUser

being completely separate identities.

Think instead in terms of:

`User`
+
`Roles`
+
`Business Relationships`
+
`Received Documents`

Do not create or alter the backend database in this phase.

This is only the frontend domain model direction.

---

# 8. MULTI-EMPLOYER EMPLOYEE RELATIONSHIP

An employee is NOT owned exclusively by one employer.

A single mobile number may receive payslips from:

- Employer A
- Employer B
- Employer C
- etc.

Therefore:

`Employee -> Employer`

must NOT be assumed to be a one-to-one relationship.

A user may receive documents from multiple employers.

This also means an Employer may receive a personal payslip himself.

Example:

A company CEO is registered as an Employer.

Another Employer sends a payslip to the CEO's mobile number.

The CEO must still be able to see that received document inside:

**اسناد شخصی من**

without creating another account.

---

# 9. EMPLOYEE LOGIN RULE

Do NOT assume an employee account disappears when documents expire.

Confirmed behavior:

- once a mobile number has a valid Fish24 user account, that account persists
- expiration of all payslips does NOT delete the account
- expiration does NOT permanently disable the account
- the user may still log in
- the user may simply have no currently available document to view
- if a new payslip is later distributed to that mobile number, it becomes available through the same account

However:

A mobile number that has never been defined as a Fish24 user cannot simply enter the system as an unknown user.

Do not invent further authentication behavior until explicitly specified.

---

# 10. CORE PDF DISTRIBUTION BUSINESS RULE

PDF distribution is the central Fish24 workflow.

Each uploaded PDF may contain multiple pages.

Each PDF page must represent exactly ONE employee payslip/document.

Employee recognition is performed from text contained inside each PDF page.

The required marker format is conceptually:

`Mobile 09191239004`

Meaning:

- exact keyword: `Mobile`
- followed by a space
- followed by the employee mobile number

The marker may appear ANYWHERE on the PDF page.

Its physical position is irrelevant.

The system must inspect every page independently.

Do not implement PDF parsing yet unless explicitly instructed.

But architecture and UI naming must respect this workflow.

---

# 11. PDF PAGE VALIDATION RULES

Each page must contain exactly ONE valid employee mobile marker.

Confirmed validation behavior:

### Valid page

Exactly one valid mobile marker is found.

Result:

`Page N -> Mobile Number`

### Error: no mobile marker

If no valid marker is found:

`Page N -> Error`

### Error: multiple mobile markers

Each page may belong to only one employee.

If more than one valid mobile marker exists on a page:

`Page N -> Error`

### Error: duplicate mobile within the PDF

A mobile number may occur only ONCE in the entire uploaded PDF.

If the same mobile number appears on more than one PDF page:

the uploaded document is invalid.

---

# 12. ALL-OR-NOTHING PDF VALIDATION

This is another CRITICAL business rule.

After processing, the Employer must be shown a page-by-page analysis result.

Conceptually:

Page 1 -> 0912...
Page 2 -> 0935...
Page 3 -> Error
Page 4 -> 0910...

If even ONE page has an error:

THE ENTIRE PDF IS REJECTED.

The Employer cannot continue the distribution workflow.

The Employer must:

1. correct the original PDF
2. upload the corrected PDF again
3. allow the system to process it again

Do NOT create a UI that allows the Employer to manually override or skip invalid pages unless this is explicitly required later.

Do NOT allow partial distribution of a PDF containing invalid pages.

---

# 13. SUCCESSFUL PDF PROCESSING

When all pages are valid:

the workflow may continue to later stages such as:

- employee resolution
- pricing
- hosting
- payment
- distribution
- SMS notification

The precise final sequence will be specified later.

Do NOT invent the missing steps.

Prepare the frontend structure so the PDF upload process can become a multi-step Wizard.

Use reusable step-oriented architecture rather than implementing everything inside one giant component.

---

# 14. EMPLOYEE ACCOUNT CREATION DURING DISTRIBUTION

During document distribution:

each mobile number represents the target employee user.

If required by the existing backend business logic:

a user/account may be created or resolved based on that mobile number.

After successful distribution, an SMS may be sent informing the employee that a payslip/document has been delivered.

Do NOT implement the backend account-creation mechanism in this phase.

Do NOT invent SMS provider integration.

Only preserve the workflow concept.

---

# 15. PRICING — HIGH-LEVEL RULE ONLY

Pricing details are NOT finalized for migration yet.

The current conceptual cost is based on:

- hosting cost per payslip
- SMS cost
- taxes / statutory charges
- number of employees

The exact formula will be specified during implementation of the financial/distribution workflow.

Therefore:

DO NOT hardcode a pricing formula now.

DO NOT create speculative financial calculations.

Create interfaces/placeholder models only if required for UI composition.

---

# 16. CURRENT BACKEND REALITY

The production Fish24 application currently uses:

- C#
- Razor Pages
- existing production database
- server-side application logic

It is NOT currently API-based.

After the Angular frontend reaches sufficient maturity:

APIs will be implemented based on:

- existing Fish24 business logic
- existing database
- existing production behavior

Therefore the Angular application must be API-READY but must NOT invent APIs.

---

# 17. API-READY FRONTEND RULE

The existing Angular HRM24 template currently contains significant mock/localStorage behavior.

Do NOT copy that pattern into Fish24 business services as if it were final architecture.

For Fish24 features, use an abstraction that makes future API integration straightforward.

Recommended conceptual separation:

Feature Component
↓
Feature Facade / Domain Service
↓
Data Access Interface / Repository-like boundary
↓
Temporary Mock Adapter NOW
↓
HTTP/API Adapter LATER

Do NOT overengineer this.

Do NOT introduce unnecessary enterprise libraries.

Use Angular-native patterns and the project's existing signal-based service style.

The main goal is:

**mock implementation must be replaceable without rewriting page components.**

---

# 18. ROLE-BASED ACCESS CONTROL

Authorization must be treated at multiple levels.

Do NOT implement authorization only by hiding Sidebar items.

The future architecture must support:

- route-level access
- menu-level access
- page-level access
- action-level access

Examples of action-level access:

- create
- edit
- deactivate
- send SMS
- view transactions
- manage pricing
- enter customer account
- distribute document
- manage discount

Do not fully implement backend authorization now.

But frontend permissions must be structured centrally rather than scattered through random template conditions.

---

# 19. CONFIRMED SALES EXPERT ACCESS

The Sales Expert has access to ALL currently identified administration pages from the existing Sales/Support Fish24 panel.

These include the confirmed functional groups:

- Dashboard
- Reports
- User Management
- Financial Management
- Tickets and Messages
- Discount Management
- Pricing Management
- News Management
- Site Settings
- Geographic Areas
- related current pages inside those modules

Do NOT remove any currently existing Fish24 functionality during migration.

---

# 20. CONFIRMED SUPPORT EXPERT RESTRICTIONS

Support Expert DOES NOT have access to:

- Financial Management
- Discount Management
- Pricing Management
- Financial Reports
- Site Settings
- Geographic Areas

Support may access the remaining applicable pages available in the current Sales/Support panel.

Do not infer additional restrictions unless explicitly specified later.

---

# 21. SUPER ADMIN ACCESS

Super Admin has access to everything available to Sales and Support.

Additional Super Admin-specific pages also exist or will be introduced.

Those extra pages will be specified during implementation.

Do NOT invent them now.

The architecture must allow new Super Admin-only features to be added cleanly later.

---

# 22. CURRENT ADMINISTRATIVE FEATURE INVENTORY

The following current Fish24 features must be preserved functionally during migration.

Visual design must be rebuilt according to the Angular template.

## Dashboard

Administrative dashboard.

Final metrics will be specified during page implementation.

## Reports

Confirmed areas include:

- General Statistics
- Financial Statistics
- User Statistics
- Ticket Statistics

Financial Reports must respect Support access restrictions.

## User Management

Existing user management includes:

- user listing
- filtering/search
- user information
- company information
- mobile number
- user type/role
- account status
- expiration-related information
- OTP-related information
- row-level user actions

Current user actions include business capabilities such as:

- edit
- approval/rejection-related actions
- send SMS
- view distributions
- view transactions
- assign coupon
- view coupons
- register employer notes
- enter user account / impersonation-like behavior
- deactivate account

Do NOT implement all these actions in Phase 1.

But preserve them in the migration inventory.

## Financial Management

Existing functional areas include:

- distributions / publish records
- transactions
- invoices
- tax/value-added settings

Transaction functionality includes financial summaries and manual transaction capabilities.

Exact fields and behavior will be implemented page-by-page.

## Tickets and Messages

Existing areas include:

- ticket list
- ticket detail/view
- message list
- sent SMS list

Existing ticket statuses include concepts such as:

- needs review
- answered
- closed

Exact translations/status model will be finalized during implementation.

## Discount Management

Existing discount systems include:

- quantity/count-based discounts
- coupon discounts
- timed discounts

Do not collapse these into one generic discount screen unless explicitly approved.

## Pricing Management

Existing pricing management includes:

- pricing periods
- start/end dates
- multiple price definitions
- active/inactive management
- creation/edit flows

Exact price structure will be specified later.

## News Management

Existing functionality includes:

- news list
- news view
- news categories
- news category create/edit
- news comments

## FAQ

Existing FAQ management must remain.

## Subscribers

Existing subscriber management must remain.

## Geographic Areas

Existing geographic management includes:

- Provinces
- Counties
- Cities

Support does not have access to this area.

## Site Settings

Existing site settings functionality must remain.

Exact internal pages/settings will be specified later.

---

# 23. EMPLOYER PANEL — CONFIRMED NAVIGATION / FEATURES

The Employer panel currently includes:

- Dashboard
- Profile
- Change Fixed Password
- Wallet
- Companies / Workshops
- Sent Payslips and Documents
- Invoices
- Covered Employees
- Tickets
- Employee Notifications
- My Personal Documents
- System Training
- Logout

Preserve these business capabilities.

---

# 24. EMPLOYER DASHBOARD

The current Employer dashboard represents meaningful business metrics.

Known metric concepts include:

- number of workshops
- total employees
- blocked employees
- number of uploaded/sent files
- total distributed pages
- hosting volume
- total documents
- paid/unpaid-related document metrics
- ticket-status metrics

Do not hardcode final dashboard cards yet.

The exact new dashboard design will be implemented later using the existing Angular card/chart design patterns.

---

# 25. COMPANIES / WORKSHOPS

An Employer may manage multiple Companies / Workshops.

Do NOT assume one Employer equals one Company.

The system needs to support a structure conceptually like:

Employer
├── Workshop A
├── Workshop B
└── Workshop C

Employees and distributed documents may be associated with a selected workshop/company.

This organizational context must influence future route/page design where appropriate.

Do NOT redesign the entire application around this yet.

Prepare the domain cleanly.

---

# 26. COVERED EMPLOYEES

Employer functionality includes management/viewing of covered employees.

Known concepts include:

- selecting/filtering by company or workshop
- employee mobile
- employee name
- employee status
- blocked employees
- ticket permission/status concepts
- employee-level actions
- possible group operations

Exact actions will be specified when implementing the page.

Do not invent them now.

---

# 27. SENT PAYSLIPS / DOCUMENTS

This is a core Employer feature.

Existing document records include business concepts such as:

- creation/send date
- document title
- workshop/company
- financial amount
- status
- hosting
- expiration
- actions

There are filters related to dates and organization/workshop.

The UI must eventually support starting:

**ارسال سند جدید**

which enters the multi-step PDF workflow.

---

# 28. WALLET

Employer has a Wallet.

Known concepts include:

- wallet balance
- wallet charging
- predefined charge amounts
- custom charge amount
- online payment
- minimum charge restrictions
- tax/value-added cost
- transaction history

Do not implement final calculations until specified.

---

# 29. EMPLOYER INVOICES

Employer has an invoice list.

Known invoice concepts include:

- invoice identifier/number
- title
- issue date
- amount
- document/view action

Exact invoice behavior will be implemented later.

---

# 30. EMPLOYEE NOTIFICATION FEATURE

Employer can send business notifications/messages to Employees.

This is NOT the same thing as the Angular application's UI notification/toast system.

Treat these as two separate concepts:

1. Application/System UI Notifications
2. Employer-to-Employee Business Notifications

Never merge them.

Employer notification flow includes organization/workshop context and historical sent messages.

Exact sending behavior will be specified later.

---

# 31. EMPLOYER TICKETS

Employer has ticket-related functionality involving employees/support workflows.

Do not assume the ticket model yet.

Preserve:

- ticket listing
- statuses
- sender/owner context
- detail/view flow

Detailed business rules will be specified later.

---

# 32. EMPLOYER PERSONAL DOCUMENTS

An Employer may also receive personal payroll documents.

Therefore:

**اسناد شخصی من**

must remain available independently from the Employer's own outgoing company distributions.

This is required because a user can simultaneously be:

- Employer
- document recipient

Do not hide personal documents merely because the active role is Employer.

---

# 33. EMPLOYEE PANEL

The Employee panel is intentionally simpler.

Confirmed navigation:

- My Documents
- Profile
- Notifications
- Logout

Do not unnecessarily expose administrative UI patterns to Employee users.

Use the existing Angular mobile-first navigation behavior where appropriate.

---

# 34. EMPLOYEE MY DOCUMENTS

This is the Employee's primary page.

Known document concepts include:

- document title
- date
- employer/company
- expiration date
- download action

Employee may receive documents from multiple Employers.

Therefore filters and empty states must never assume a single employer.

---

# 35. EMPLOYEE BUSINESS NOTIFICATIONS

Employee can view notifications/messages sent by Employers.

Known concepts include:

- sender company/employer
- message
- date/time

Again:

these are business messages, not application toast notifications.

---

# 36. EMPLOYEE PROFILE

Known profile concepts include:

- mobile number
- employee/user name
- identity-related data
- fixed password/PIN change functionality

Do not finalize authentication behavior until implementation details are provided.

---

# 37. ROUTING PRINCIPLE

Do NOT immediately create five completely duplicated frontend applications.

The preferred direction is one Angular application with shared infrastructure and role-aware feature access.

However:

do not over-consolidate pages that have different business behavior.

Use shared shell/components where appropriate.

Possible conceptual route areas may eventually resemble:

- `/admin/...`
- `/sales/...`
- `/support/...`
- `/employer/...`
- `/employee/...`

But DO NOT finalize this route scheme until you inspect the existing routing architecture and determine the least disruptive integration.

Before changing routes:

1. inspect `src/app/app.routes.ts`
2. inspect auth guards
3. inspect layout behavior
4. inspect navigation components
5. determine how existing protected/public route structure works
6. provide your proposed route migration map

Do NOT directly rewrite routes without reporting the migration map first.

---

# 38. ACTIVE ROLE / MULTI-ROLE PRINCIPLE

Because a single User may have more than one business capability, architecture must not assume:

`User -> exactly one role forever`

Prepare for a concept such as:

- authenticated user
- assigned roles/capabilities
- active workspace/context

Do NOT invent a final role-switching UX yet.

If a role switcher is not currently specified:

mark it:

`NOT YET SPECIFIED`

Do not create one automatically.

---

# 39. ORGANIZATION CONTEXT

The current Angular template already has an organization context pattern.

Study whether that pattern can be adapted cleanly for Fish24 Company/Workshop context.

DO NOT blindly rename HRM24 Organization to Fish24 Workshop.

First inspect:

- organization service
- org context bar
- layout dependencies
- existing signals
- related UI

Then determine:

- what is reusable
- what needs modification
- what must be replaced

Visual consistency is more important than preserving obsolete HRM24 terminology.

---

# 40. SHARED COMPONENT RULE

Before creating any new component:

search the repository for an existing visual pattern.

For example:

Before building:

- modal
- toast
- card
- form
- chart
- navigation
- loading indicator
- empty state
- confirmation dialog
- icon

inspect existing implementations first.

Reuse the existing visual vocabulary.

However:

do NOT force unrelated business pages into the same component merely to reduce file count.

---

# 41. TABLE / DATA-LIST RULE

The existing project does not currently have a strong centralized generic table component.

Fish24 administration will need many data-heavy pages.

Do NOT immediately install or create a giant enterprise data-grid framework.

Instead:

1. inspect existing card/data/table patterns
2. determine common needs across Fish24 admin pages
3. propose a lightweight reusable Fish24 data-list/table foundation only if it clearly reduces duplication
4. keep it compatible with:
   - RTL
   - mobile
   - dark mode
   - filters
   - pagination
   - row actions
   - status chips
   - empty states
   - loading states

Do not implement this abstraction in Phase 1 unless necessary.

---

# 42. MOBILE RESPONSIVENESS

Mobile is a first-class target.

Every future page must eventually be reviewed at:

- small mobile
- normal mobile
- tablet
- desktop

Avoid desktop-only tables that simply overflow horizontally without a deliberate UX decision.

Administrative data-heavy pages may require responsive transformation.

Do not choose the final table/mobile solution globally before seeing real page requirements.

---

# 43. RTL RULE

Persian / RTL is the default.

Use LTR selectively for machine-oriented data such as:

- mobile numbers
- OTP
- monetary numeric strings where required
- technical identifiers
- codes

Do not place the entire component in LTR just because it contains numeric data.

Preserve intentional mixed-direction behavior.

---

# 44. DARK MODE

Dark mode must remain functional.

Every new structural component must be compatible with the existing token/theme architecture.

Do not hardcode light-only colors.

Do not create parallel Fish24-only color logic unless branding requirements later require specific additions.

---

# 45. BRANDING

The application identity must move from HRM24 to Fish24.

But do NOT perform uncontrolled search-and-replace.

Before changing branding:

identify every occurrence of:

- HRM24
- existing logo assets
- product title
- metadata
- page titles
- auth text
- header labels
- footer references
- localStorage keys
- mock-domain terminology

Classify each occurrence as:

1. visual branding
2. business/domain code
3. storage key
4. routing dependency
5. unrelated historical artifact

Only then modify safe branding occurrences.

Do NOT rename internal technical identifiers unnecessarily if doing so creates migration risk.

---

# 46. LOCAL STORAGE WARNING

Current HRM24 code uses localStorage for several behaviors.

Do NOT automatically reuse old keys for Fish24 domain data.

Do NOT store production-sensitive Fish24 information in localStorage simply because the HRM24 demo did.

Current localStorage usage must be classified into:

- UI preference
- safe client preference
- mock business data
- authentication mock
- temporary development behavior

Safe examples such as theme preferences may remain.

Business persistence must eventually move to APIs.

---

# 47. AUTHENTICATION

Existing HRM24 authentication is demo-oriented.

Fish24 authentication will be adapted later according to existing production behavior and future APIs.

In Phase 1:

- preserve routing stability
- preserve auth shell
- preserve guard architecture where reusable
- do not hardcode final Fish24 authentication rules
- do not invent token structures
- do not invent refresh token flows
- do not implement fake production security

Prepare the codebase for future auth migration.

---

# 48. NO BACKEND IMPLEMENTATION NOW

Do NOT create:

- ASP.NET API
- database migrations
- SQL schema
- authentication server
- PDF parser service
- SMS service
- payment gateway integration

inside this Angular migration phase.

Those systems will be addressed separately.

The frontend may define interfaces required for controlled mock rendering.

---

# 49. DO NOT IMPLEMENT ALL PAGES NOW

This is extremely important.

This Master Prompt does NOT authorize you to build the entire Fish24 application immediately.

We will migrate the product page-by-page.

Trying to generate every page now would create:

- visual drift
- incorrect business behavior
- speculative forms
- incorrect permissions
- inconsistent components
- migration risk

Therefore Phase 1 is FOUNDATION ONLY.

---

# 50. PHASE 1 — EXACT SCOPE

Your task now is to prepare the repository for Fish24 without implementing detailed business pages.

Phase 1 includes:

### A. Re-scan the current repository

Inspect the real source again.

Do not rely only on this prompt.

### B. Create a migration impact map

Identify:

- what can stay unchanged
- what needs branding changes
- what is HRM24-specific
- what should become Fish24 shared infrastructure
- what must be removed later
- what must NOT be touched yet

### C. Design the role/access architecture

Propose the cleanest Angular-native approach for:

- Super Admin
- Sales
- Support
- Employer
- Employee

including future action-level permission capability.

Do not overengineer.

### D. Design the conceptual Fish24 domain boundaries

At minimum consider:

- Identity
- Roles/Permissions
- Companies/Workshops
- Employees/User Relationships
- Documents
- PDF Distribution
- Hosting
- Wallet
- Transactions
- Invoices
- Tickets
- Business Notifications
- Pricing
- Discounts
- Reports
- News
- Geographic Data
- Site Settings

This does NOT mean creating every folder immediately.

### E. Propose the routing migration

Show:

- current route
- future Fish24 route/area
- whether existing component remains
- whether page will later be replaced
- permission requirement

Do not implement route destruction before presenting this.

### F. Propose shared layout migration

Explain how:

- Header
- Sidebar
- mobile navigation
- organization context
- profile menu
- global search
- notifications
- theme switcher

should behave in Fish24.

### G. Branding migration plan

List exact files that need Fish24 branding changes.

### H. Mock/API-ready architecture proposal

Explain how new Fish24 feature services will avoid tight coupling to localStorage.

### I. Risk list

Identify files or systems where migration could easily break:

- routing
- guards
- layout
- theme
- mobile navigation
- shared services
- localStorage behavior
- auth
- print/PDF utilities
- global styles

---

# 51. REQUIRED OUTPUT BEFORE MAKING CHANGES

Before editing source code, return a report titled:

# FISH24 PHASE 1 MIGRATION PLAN

The report must contain:

## 1. Current Repository Assessment

Short confirmation of what you verified from source.

## 2. Files That Must Remain Stable

List actual paths.

## 3. HRM24-Specific Areas To Be Migrated

List actual paths.

## 4. Proposed Fish24 Architecture

Use actual proposed folders/classes/services.

## 5. Proposed Role & Permission Model

Include:

- Super Admin
- Sales
- Support
- Employer
- Employee

## 6. Permission Matrix

At least module-level access.

Do not invent unresolved permissions.

## 7. Proposed Routing Map

Current → Future.

## 8. Layout Migration Strategy

Desktop + Mobile.

## 9. Company/Workshop Context Strategy

Explain reuse/adaptation of existing organization context.

## 10. User Identity Strategy

Explicitly explain global unique mobile identity and multi-role behavior.

## 11. PDF Workflow Architecture

Architecture only.

No PDF parser implementation.

## 12. API-Ready Data Access Strategy

Show how temporary mocks can later be replaced by HTTP APIs.

## 13. Branding Migration

Actual files to update.

## 14. Components To Reuse

Actual source paths.

## 15. Components That May Need To Be Added Later

Do NOT implement speculative components.

## 16. Existing Components That Should Eventually Be Retired

Only if clearly HRM24-specific.

## 17. Migration Risks

Be specific.

## 18. Recommended Implementation Order

Give a controlled sequential plan.

## 19. Files Proposed For Modification In Phase 1

Exact paths only.

## 20. Files Explicitly NOT To Modify Yet

Exact paths or areas.

---

# 52. STOP CONDITION

After producing the `FISH24 PHASE 1 MIGRATION PLAN`:

STOP.

Do NOT modify source code yet.

Wait for explicit approval and the next implementation instruction.

Do NOT treat this prompt itself as approval to make changes.

---

# 53. FUTURE PAGE IMPLEMENTATION PROTOCOL

For every Fish24 page we implement later, follow this sequence:

1. inspect old Fish24 page/screenshots/business behavior
2. identify all fields
3. identify all filters
4. identify all statuses
5. identify all row actions
6. identify all validations
7. identify role permissions
8. identify empty/loading/error states
9. find closest existing Angular visual patterns
10. propose the new page structure
11. implement only after requirements are sufficiently known
12. validate responsive behavior
13. validate RTL
14. validate dark mode
15. validate routing
16. run build/type checks

Never start by blindly copying HTML from the old system.

---

# 54. CHANGE DISCIPLINE

When implementation begins later:

keep changes small and reviewable.

Prefer:

- one infrastructure concern at a time
- one page or closely related workflow at a time
- explicit validation after each phase

Avoid:

- massive repository rewrites
- unrelated cleanups
- opportunistic refactors
- renaming dozens of unrelated files
- dependency upgrades during migration
- Angular version changes
- Tailwind version changes

unless specifically required.

---

# 55. COMPILATION REQUIREMENT

Whenever code modification is eventually authorized:

before declaring the task complete:

- ensure Angular templates compile
- run the appropriate build
- resolve TypeScript errors introduced by your changes
- verify route imports
- verify standalone component imports
- check obvious dark mode regressions
- check obvious RTL regressions
- check mobile/desktop layout assumptions

Do not modify unrelated existing warnings unless they block the requested work.

---

# 56. FINAL MENTAL MODEL

You are not building Fish24 from scratch.

You are performing a controlled migration:

OLD FISH24
↓
Business Rules
Workflows
Permissions
Data Meaning
Production Behavior

+

ANGULAR HRM24 TEMPLATE
↓
Visual Language
Architecture
Responsive UX
RTL
Theme
Reusable UI Infrastructure

=

NEW FISH24 ANGULAR FRONTEND

Business fidelity and migration safety are more important than developer convenience.

Visual consistency with the Angular baseline is more important than copying the old Fish24 appearance.

Unknown behavior must remain unknown until specified.

Never invent production behavior.

---

# BEGIN NOW

Perform the Phase 1 repository analysis.

Return only:

# FISH24 PHASE 1 MIGRATION PLAN

with the 20 required sections above.

Do not modify any source file yet.
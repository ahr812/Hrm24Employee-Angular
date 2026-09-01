# PROJECT BLUEPRINT

## 1. Architecture Overview

This project is an Angular 19 standalone application bootstrapped from [src/main.ts](src/main.ts), configured in [src/app/app.config.ts](src/app/app.config.ts), and routed through [src/app/app.routes.ts](src/app/app.routes.ts).

Key architecture patterns found in source:
- Standalone component architecture throughout the app
- Lazy-loaded feature routes via `loadComponent`
- Auth gating via `authGuard` and `guestGuard` in [src/app/core/auth/auth.guard.ts](src/app/core/auth/auth.guard.ts)
- Shared shell architecture in [src/app/app.component.ts](src/app/app.component.ts)
- Feature pages under [src/app/features](src/app/features)
- Shared UI/layout primitives under [src/app/shared](src/app/shared)
- Service-layer state and local persistence under [src/app/core](src/app/core)

Important finding:
- There is no backend API client layer or interceptor in the repository source.
- The app is mostly a localStorage-backed demo/HR-template front-end shell rather than a real API-integrated product.

## 2. Folder/File Structure

Primary structure:
- Root config: [package.json](package.json), [angular.json](angular.json), [tailwind.config.js](tailwind.config.js), [tsconfig.json](tsconfig.json), [tsconfig.app.json](tsconfig.app.json), [tsconfig.spec.json](tsconfig.spec.json)
- App shell: [src/app/app.component.ts](src/app/app.component.ts), [src/app/app.routes.ts](src/app/app.routes.ts), [src/styles.scss](src/styles.scss)
- Feature pages: [src/app/features](src/app/features)
- Shared layout/UI: [src/app/shared](src/app/shared)
- Domain service layer: [src/app/core](src/app/core)
- Public assets: [public](public)
- Global index: [src/index.html](src/index.html)

Representative folders:
- Auth: [src/app/core/auth](src/app/core/auth)
- Organization and employee data: [src/app/core/organization](src/app/core/organization), [src/app/core/data](src/app/core/data)
- Search and notifications: [src/app/core/search](src/app/core/search), [src/app/core/notifications](src/app/core/notifications)
- Feature pages: [src/app/features](src/app/features)

## 3. Application Shell

The app shell is defined in [src/app/app.component.ts](src/app/app.component.ts).

Shell structure:
- Sticky header with logo and action buttons
- Secondary org context bar below the header
- Fixed right sidebar with collapsible behavior
- Main content area with `router-outlet`
- Global overlays for:
  - offline banner
  - VPN banner
  - toast notifications
  - global search modal

The shell is clearly built for a Persian employee panel and not a generic starter app.

## 4. Routing Map

Main routes are defined in [src/app/app.routes.ts](src/app/app.routes.ts).

Public/auth routes:
- `/login`
- `/register`
- `/forgot-password`

Protected routes:
- `/dashboard`
- `/tasks`
- `/missions`
- `/documents`
- `/evaluation`
- `/evaluation/form/:type/:id`
- `/evaluation/analytics`
- `/training`
- `/attendance`
- `/leave`
- `/payslip`
- `/payslip/:id`
- `/loan`
- `/advance`
- `/savings`
- `/chat`
- `/reminders`
- `/surveys`
- `/notifications`
- `/knowledge`
- `/comparison`
- `/calendar`
- `/tickets`
- `/tickets/:id`
- `/profile`
- `/help`

Error routes:
- `/error`
- wildcard not-found route

Auth gating is applied to most feature routes via [src/app/core/auth/auth.guard.ts](src/app/core/auth/auth.guard.ts).

## 5. Layout System

Layout logic is split across:
- [src/app/app.component.ts](src/app/app.component.ts)
- [src/app/shared/layout/layout.service.ts](src/app/shared/layout/layout.service.ts)
- [src/app/shared/layout/header/header.component.ts](src/app/shared/layout/header/header.component.ts)
- [src/app/shared/layout/sidebar/sidebar.component.ts](src/app/shared/layout/sidebar/sidebar.component.ts)
- [src/app/shared/layout/org-context-bar/org-context-bar.component.ts](src/app/shared/layout/org-context-bar/org-context-bar.component.ts)

Observed behavior:
- Desktop: fixed right sidebar + main content and margin adjustment
- Tablet/mobile: bottom-tab-like nav pattern using grid tiles
- Sticky top shell with org bar and header for identity context
- Content areas rely on utility spacing and card grouping
- Sidebar opening state is managed by a signal-based layout service

## 6. Component Inventory

Reusable shared components identified:
- Header: [src/app/shared/layout/header/header.component.ts](src/app/shared/layout/header/header.component.ts)
- Sidebar: [src/app/shared/layout/sidebar/sidebar.component.ts](src/app/shared/layout/sidebar/sidebar.component.ts)
- Org context bar: [src/app/shared/layout/org-context-bar/org-context-bar.component.ts](src/app/shared/layout/org-context-bar/org-context-bar.component.ts)
- Toast: [src/app/shared/ui/toast/toast.component.ts](src/app/shared/ui/toast/toast.component.ts)
- Notification modal: [src/app/shared/ui/notification-modal/notification-modal.component.ts](src/app/shared/ui/notification-modal/notification-modal.component.ts)
- Global search: [src/app/shared/ui/global-search/global-search.component.ts](src/app/shared/ui/global-search/global-search.component.ts)
- Icon registry: [src/app/shared/ui/icon/icon.component.ts](src/app/shared/ui/icon/icon.component.ts)
- Chart wrapper: [src/app/shared/ui/charts/chart.component.ts](src/app/shared/ui/charts/chart.component.ts)
- Theme switcher: [src/app/shared/ui/theme-switcher/theme-switcher.component.ts](src/app/shared/ui/theme-switcher/theme-switcher.component.ts)
- Profile menu: [src/app/shared/layout/header/profile-menu/profile-menu.component.ts](src/app/shared/layout/header/profile-menu/profile-menu.component.ts)

Feature pages are rich and page-local, such as:
- Dashboard: [src/app/features/dashboard/dashboard.component.ts](src/app/features/dashboard/dashboard.component.ts)
- Training: [src/app/features/training/training.component.ts](src/app/features/training/training.component.ts)
- Payslip detail: [src/app/features/payslip/payslip-detail/payslip-detail.component.ts](src/app/features/payslip/payslip-detail/payslip-detail.component.ts)
- Tickets: [src/app/features/tickets/tickets.component.ts](src/app/features/tickets/tickets.component.ts)

The repo does not expose a central generic button/table/input library; instead, it composes UI within feature pages and shared patterns.

## 7. Design System

The design system is Tailwind-first with CSS tokens in [src/styles.scss](src/styles.scss) and theme extension in [tailwind.config.js](tailwind.config.js).

Visible design patterns:
- Rounded cards with subtle shadows and borders
- Light gray/slate surfaces with soft elevation
- Blue primary accent by default
- Transparent hover states and primary color tints
- Form controls with border + focus ring states
- Modal overlays with centered panels and scale/fade animations
- Utility-based styling rather than component-library abstractions

## 8. Typography

Typography is anchored by Vazirmatn.

Evidence:
- [src/index.html](src/index.html)
- [src/styles.scss](src/styles.scss)

Observed behavior:
- Persian UI default, RTL text layout
- Font-face declarations for regular and bold weights
- Numeric values sometimes forced to LTR using `dir-ltr` or `dir="ltr"`
- Headings and emphasis are created in component templates, not via a central type-token file

## 9. Color/Theme System

Theme configuration is in:
- [src/styles.scss](src/styles.scss)
- [src/app/shared/layout/theme.service.ts](src/app/shared/layout/theme.service.ts)
- [tailwind.config.js](tailwind.config.js)

Theme model:
- Modes: `light`, `dark`, `system`
- Colors: `blue`, `green`, `purple`, `orange`
- Tailwind uses CSS variables defined on `:root` and `.dark`
- `data-theme` is applied to `document.documentElement`

Color tokens include:
- background
- foreground
- surface
- border
- muted
- success
- warning
- danger
- info
- primary

## 10. RTL Strategy

RTL is handled intentionally at the root:
- [src/index.html](src/index.html) sets `lang="fa" dir="rtl"`
- [src/styles.scss](src/styles.scss) includes `.dir-ltr`
- [src/app/app.component.ts](src/app/app.component.ts) uses `dir="rtl"` on the sidebar wrapper

Important behavior:
- The application is Persian-first and right-aligned by default.
- Some internal values are intentionally LTR, especially:
  - phone numbers
  - OTP fields
  - money values
  - personnel codes
- This is not accidental; the project intentionally uses `dir="ltr"` and `dir-ltr` for data-heavy numeric fields.

## 11. Responsive Strategy

Responsive behavior is implemented with utility classes and a few component-level media queries.

Evidence:
- [src/app/shared/layout/sidebar/sidebar.component.ts](src/app/shared/layout/sidebar/sidebar.component.ts)
- [src/app/app.component.ts](src/app/app.component.ts)
- [src/app/features/dashboard/dashboard.component.ts](src/app/features/dashboard/dashboard.component.ts)
- [src/app/features/payslip/payslip-detail/payslip-detail.component.ts](src/app/features/payslip/payslip-detail/payslip-detail.component.ts)

Observed mobile/desktop behavior:
- Desktop split with fixed sidebar and main content
- Tablet/mobile different navigation pattern with card tiles
- Stack cards in columns on smaller screens
- Most content uses `md:` and `lg:` breakpoints to preserve density and readability

## 12. Forms

Forms are mostly template-driven and implemented with Angular `FormsModule`.

Examples:
- Login: [src/app/features/auth/login/login.component.ts](src/app/features/auth/login/login.component.ts)
- Register: [src/app/features/auth/register/register.component.ts](src/app/features/auth/register/register.component.ts)
- Forgot password: [src/app/features/auth/forgot-password/forgot-password.component.ts](src/app/features/auth/forgot-password/forgot-password.component.ts)
- Training admin forms: [src/app/features/training/training.component.ts](src/app/features/training/training.component.ts)

Form conventions:
- Rounded-xl inputs, bordered surfaces, faint ring on focus
- Icons inside inputs
- Validation text with red tone
- Buttons with primary action styling and disabled states
- Input alignment often respects the Persian RTL UX while numeric fields move to LTR

## 13. Tables

No centralized reusable generic table component was found in the shared UI infrastructure.

What exists instead:
- Card-based layout for summaries and metrics
- Dense “data blocks” and grid sections for payroll details
- Table-like presentation in [src/app/features/payslip/payslip-detail/payslip-detail.component.ts](src/app/features/payslip/payslip-detail/payslip-detail.component.ts)

Conclusion:
- NOT DETERMINED FROM SOURCE: a generic table abstraction component.
- Reuse existing card/grid patterns instead of inventing a new table framework.

## 14. Modals/Dialogs

Modals are custom overlay components and not native HTML dialogs.

Examples:
- Notification modal: [src/app/shared/ui/notification-modal/notification-modal.component.ts](src/app/shared/ui/notification-modal/notification-modal.component.ts)
- Global search: [src/app/shared/ui/global-search/global-search.component.ts](src/app/shared/ui/global-search/global-search.component.ts)
- Org dropdown: [src/app/shared/layout/org-context-bar/org-context-bar.component.ts](src/app/shared/layout/org-context-bar/org-context-bar.component.ts)

Pattern:
- dark backdrop
- centered content card
- border + shadow
- scale/fade animation
- close button
- escape key handling

## 15. Notifications

Notifications use multiple mechanisms:
- Toast service: [src/app/shared/ui/toast/toast.service.ts](src/app/shared/ui/toast/toast.service.ts)
- Toast UI: [src/app/shared/ui/toast/toast.component.ts](src/app/shared/ui/toast/toast.component.ts)
- Push notification service: [src/app/core/notifications/push-notification.service.ts](src/app/core/notifications/push-notification.service.ts)
- Notification settings modal: [src/app/shared/ui/notification-modal/notification-modal.component.ts](src/app/shared/ui/notification-modal/notification-modal.component.ts)

Behavior:
- toasts auto-dismiss after 3 seconds
- success and error variants
- notification permission support is optional and browser-based

## 16. Charts

The chart wrapper is in [src/app/shared/ui/charts/chart.component.ts](src/app/shared/ui/charts/chart.component.ts).

It uses Chart.js via `Chart` from `chart.js/auto`.

Examples of usage:
- Dashboard analytics: [src/app/features/dashboard/dashboard.component.ts](src/app/features/dashboard/dashboard.component.ts)
- Comparison and analytics pages are likely using the same pattern via feature components

Visual conventions:
- bordered cards with chart canvas area
- dark-friendly tooltip/legend colors
- Persian label callbacks and RTL tooltip behavior

## 17. PDF/Export

PDF/export behavior is in:
- [src/app/features/payslip/payslip-detail/payslip-detail.component.ts](src/app/features/payslip/payslip-detail/payslip-detail.component.ts)
- [src/app/core/training/certificate-pdf.service.ts](src/app/core/training/certificate-pdf.service.ts)

Libraries found:
- jsPDF
- html2canvas
- jspdf-autotable exists in [package.json](package.json), but no direct active implementation was found in source

Real patterns:
- html2canvas + jsPDF export for payslips and certificates
- `window.print()` support
- CSS `@media print` overrides in [src/app/app.component.ts](src/app/app.component.ts) and [src/styles.scss](src/styles.scss)

## 18. Icons

The icon system is custom and centralized in [src/app/shared/ui/icon/icon.component.ts](src/app/shared/ui/icon/icon.component.ts).

Pattern:
- single SVG component
- `name` input chooses a specific icon path set
- stroke-based SVG with currentColor
- no dependency on a third-party icon library

This is the project baseline and should be preserved unless there is a very explicit requirement to change it.

## 19. Assets

Assets are referenced directly from public and other static folders, including:
- [public](public)
- [src/index.html](src/index.html)
- [src/app/shared/layout/header/header.component.ts](src/app/shared/layout/header/header.component.ts)
- [src/app/shared/layout/header/profile-menu/profile-menu.component.ts](src/app/shared/layout/header/profile-menu/profile-menu.component.ts)

Observed conventions:
- logo references such as `images/logofull.svg`
- avatar images such as `images/avatar3.jpg`
- local font files through CSS `@font-face`

## 20. Services/Data Flow

Core data flow is signal-based and mostly local to the browser.

Examples:
- Auth: [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts)
- Org context: [src/app/core/organization/organization.service.ts](src/app/core/organization/organization.service.ts)
- Employee/master data: [src/app/core/data/employee-data.service.ts](src/app/core/data/employee-data.service.ts)
- Search: [src/app/core/search/search.service.ts](src/app/core/search/search.service.ts)
- Theme: [src/app/shared/layout/theme.service.ts](src/app/shared/layout/theme.service.ts)

Typical flow:
- component reads a signal value
- service computes or persists local data
- UI renders from computed state
- browser localStorage is the primary persistence layer

## 21. Authentication/Authorization

Authentication and route guarding are defined in:
- [src/app/core/auth/auth.guard.ts](src/app/core/auth/auth.guard.ts)
- [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts)

Observed behavior:
- session stored in `localStorage`
- demo user login flow with OTP-like validation for mobile login
- protected route gating via `authGuard`
- guest-only routes via `guestGuard`
- auth status computed from session expiration

## 22. State Management

Angular signals are the primary state solution.

Evidence:
- [src/app/shared/layout/theme.service.ts](src/app/shared/layout/theme.service.ts)
- [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts)
- [src/app/core/search/search.service.ts](src/app/core/search/search.service.ts)
- [src/app/core/data/employee-data.service.ts](src/app/core/data/employee-data.service.ts)

No NgRx, Redux, or centralized store library is present.

## 23. Mock vs Real Data

This project is demo/mock data heavy.

Examples:
- Auth user fixtures in [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts)
- Organization list in [src/app/core/organization/organization.service.ts](src/app/core/organization/organization.service.ts)
- Employee data in [src/app/core/data/employee-data.service.ts](src/app/core/data/employee-data.service.ts)
- Training and certificate defaults in [src/app/core/training/training.service.ts](src/app/core/training/training.service.ts)

This is a functioning front-end shell and business-domain mock, not a real backend-integrated enterprise app.

## 24. Existing Reusable Infrastructure

The strongest reusable infrastructure is:
- Angular standalone component pattern
- app shell and layout system
- Tailwind utility system with theme tokens
- Authentication/session model
- icon registry
- chart wrapper
- toast + modal + search patterns
- dark/light theme service
- RTL-first UX language

These are the correct baseline pieces to preserve.

## 25. Important Constraints

Important constraints visible in the source:
- Persian/RTL-first product language
- Angular 19 standalone base architecture
- Tailwind-based design system
- localStorage-backed mock services rather than API layer
- no major external UI library (Material, Bootstrap, PrimeNG, DaisyUI, shadcn, etc.)
- use of custom shared UI patterns instead of new generic components

## 26. Potential Risks

Potential risks for future work:
- visual drift if new apps invent a different spacing/color vocabulary
- RTL regressions if new pages assume LTR for labels or numbers
- mock-data assumptions if new features incorrectly expect real API integration
- lack of a central generic table/form component means future pages should reuse patterns rather than create new primitives

## 27. Recommended Reuse Strategy

Recommended approach for future app implementation:
1. Keep the shell and navigation system intact from [src/app/app.component.ts](src/app/app.component.ts), [src/app/shared/layout/sidebar/sidebar.component.ts](src/app/shared/layout/sidebar/sidebar.component.ts), and [src/app/shared/layout/header/header.component.ts](src/app/shared/layout/header/header.component.ts)
2. Reuse Tailwind tokens and theme vars from [src/styles.scss](src/styles.scss)
3. Reuse the signal-based service pattern from [src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts) and [src/app/shared/layout/theme.service.ts](src/app/shared/layout/theme.service.ts)
4. Reuse the modal, toast, chart, and search patterns as the app’s UX baseline
5. Preserve Persian/RTL behavior and use LTR carefully only for numeric and machine-oriented fields
6. Add new business features by composing cards, grids, forms, and panels already used by the template
7. Do not replace the overall UI language just because a new business domain is being implemented

## Final conclusion

This repository is best described as a Persian HR employee-panel template / shell / design system baseline. It is a strong foundation for a later application with different business requirements, but it must remain visually and structurally within the same family of experience.

This project should be treated as a design-language and architecture baseline, not a blank canvas.

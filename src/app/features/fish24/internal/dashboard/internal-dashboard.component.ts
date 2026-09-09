import { Component, computed, inject } from '@angular/core';
import { Fish24RolePreviewService } from '../../../../core/fish24/dev/fish24-role-preview.service';
import { Fish24RoleId } from '../../../../core/fish24/models/fish24-role.model';
import { Fish24PermissionService } from '../../../../core/fish24/permissions/fish24-permission.service';
import { Fish24Permission, FISH24_PERMISSIONS } from '../../../../core/fish24/permissions/fish24-permissions';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

interface InternalDashboardArea {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly permission: Fish24Permission;
  readonly group: 'report' | 'communication' | 'financial' | 'operation';
}

interface InternalDashboardSummary {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly icon: string;
}

const INTERNAL_ROLE_LABELS: Readonly<Partial<Record<Fish24RoleId, string>>> = {
  'super-admin': 'مدیر اصلی سامانه',
  'sales-expert': 'کارشناس فروش',
  'support-expert': 'کارشناس پشتیبانی'
};

const INTERNAL_ROLE_IDS: readonly Fish24RoleId[] = [
  'super-admin',
  'sales-expert',
  'support-expert'
];

const INTERNAL_DASHBOARD_AREAS: readonly InternalDashboardArea[] = [
  {
    id: 'general-reports',
    label: 'گزارشات عمومی',
    description: 'دسترسی به حوزه گزارشات عمومی سامانه',
    icon: 'bar-chart-2',
    permission: FISH24_PERMISSIONS.generalReports,
    group: 'report'
  },
  {
    id: 'user-reports',
    label: 'گزارشات کاربران',
    description: 'دسترسی به حوزه گزارشات کاربران',
    icon: 'users',
    permission: FISH24_PERMISSIONS.userReports,
    group: 'report'
  },
  {
    id: 'ticket-reports',
    label: 'گزارشات تیکت‌ها',
    description: 'دسترسی به حوزه گزارشات تیکت‌ها',
    icon: 'ticket',
    permission: FISH24_PERMISSIONS.ticketReports,
    group: 'report'
  },
  {
    id: 'financial-reports',
    label: 'گزارشات مالی',
    description: 'دسترسی به حوزه گزارشات مالی',
    icon: 'trending-up',
    permission: FISH24_PERMISSIONS.financialReports,
    group: 'financial'
  },
  {
    id: 'user-management',
    label: 'سیستم کاربران',
    description: 'دسترسی به حوزه مدیریت کاربران',
    icon: 'users',
    permission: FISH24_PERMISSIONS.userManagement,
    group: 'operation'
  },
  {
    id: 'financial-management',
    label: 'مدیریت مالی',
    description: 'دسترسی به حوزه عملیات مالی',
    icon: 'banknote',
    permission: FISH24_PERMISSIONS.financialManagement,
    group: 'financial'
  },
  {
    id: 'tickets-messages',
    label: 'تیکت‌ها و پیام‌ها',
    description: 'دسترسی به حوزه تیکت‌ها و پیام‌ها',
    icon: 'message-circle',
    permission: FISH24_PERMISSIONS.ticketsMessages,
    group: 'communication'
  },
  {
    id: 'discount-management',
    label: 'مدیریت تخفیفات',
    description: 'دسترسی به حوزه مدیریت تخفیفات',
    icon: 'star',
    permission: FISH24_PERMISSIONS.discountManagement,
    group: 'financial'
  },
  {
    id: 'pricing-management',
    label: 'قیمت‌گذاری',
    description: 'دسترسی به حوزه مدیریت قیمت‌گذاری',
    icon: 'credit-card',
    permission: FISH24_PERMISSIONS.pricingManagement,
    group: 'financial'
  },
  {
    id: 'news-management',
    label: 'مدیریت اخبار',
    description: 'دسترسی به حوزه مدیریت اخبار',
    icon: 'book-open',
    permission: FISH24_PERMISSIONS.newsManagement,
    group: 'communication'
  },
  {
    id: 'faq-management',
    label: 'سوالات متداول',
    description: 'دسترسی به حوزه سوالات متداول',
    icon: 'help-circle',
    permission: FISH24_PERMISSIONS.faqManagement,
    group: 'communication'
  },
  {
    id: 'subscriber-management',
    label: 'مشترکین',
    description: 'دسترسی به حوزه مدیریت مشترکین',
    icon: 'mail',
    permission: FISH24_PERMISSIONS.subscriberManagement,
    group: 'communication'
  },
  {
    id: 'site-settings',
    label: 'تنظیمات سایت',
    description: 'دسترسی به حوزه تنظیمات سایت',
    icon: 'settings',
    permission: FISH24_PERMISSIONS.siteSettings,
    group: 'operation'
  },
  {
    id: 'geographic-management',
    label: 'مناطق جغرافیایی',
    description: 'دسترسی به حوزه مدیریت مناطق جغرافیایی',
    icon: 'map-pin',
    permission: FISH24_PERMISSIONS.geographicManagement,
    group: 'operation'
  }
];

@Component({
  selector: 'app-internal-dashboard',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-4 animate-fade-in-up sm:space-y-5" dir="rtl">
      @if (hasInternalDashboardAccess()) {
        <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-w-0 items-center gap-3 sm:gap-4">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
              <ui-icon name="dashboard" [size]="29" class="text-primary"></ui-icon>
            </div>
            <div class="min-w-0">
              <h1 class="text-2xl font-bold text-primary sm:text-3xl">داشبورد عملیات فیش۲۴</h1>
              <p class="mt-0.5 text-sm leading-6 text-muted sm:mt-1 sm:text-base">نمای دسترسی حوزه‌های داخلی بر اساس مجوزهای نقش فعال</p>
            </div>
          </div>

          <div class="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <ui-icon name="shield" [size]="17" class="text-primary"></ui-icon>
            <span class="text-xs font-bold text-muted">نقش فعال:</span>
            <span class="text-xs font-extrabold text-foreground dark:text-slate-100">{{ activeRoleLabel() }}</span>
          </div>
        </header>

        <section class="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4" aria-label="خلاصه دسترسی‌های داشبورد">
          @for (summary of summaries(); track summary.id) {
            <article class="min-w-0 rounded-2xl border border-border border-t-4 border-t-primary bg-surface p-3 shadow-sm dark:border-slate-700 dark:border-t-primary dark:bg-slate-800 sm:p-4">
              <div class="flex items-center gap-2">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ui-icon [name]="summary.icon" [size]="19"></ui-icon>
                </div>
                <p class="text-2xl font-black leading-none text-foreground dark:text-slate-100 sm:text-3xl" dir="ltr">{{ summary.value }}</p>
              </div>
              <p class="mt-2 text-xs font-bold leading-5 text-muted sm:text-sm">{{ summary.label }}</p>
            </article>
          }
        </section>

        <section class="rounded-2xl border border-border bg-surface p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="internal-areas-title">
          <div class="flex items-start gap-3 border-b border-border pb-3 dark:border-slate-700">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ui-icon name="layout-dashboard" [size]="20"></ui-icon>
            </div>
            <div class="min-w-0">
              <h2 id="internal-areas-title" class="text-base font-extrabold text-foreground dark:text-slate-100 sm:text-lg">حوزه‌های عملیاتی در دسترس</h2>
              <p class="mt-0.5 text-xs leading-5 text-muted sm:text-sm">این فهرست مستقیماً از مجوزهای نقش فعال محاسبه می‌شود.</p>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-4">
            @for (area of visibleAreas(); track area.id) {
              <article class="flex min-h-32 min-w-0 flex-col rounded-xl border border-border bg-background/60 p-3 dark:border-slate-700 dark:bg-slate-900/40 sm:min-h-36 sm:p-4">
                <div class="flex items-start gap-2.5">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ui-icon [name]="area.icon" [size]="19"></ui-icon>
                  </div>
                  <h3 class="pt-1 text-xs font-extrabold leading-5 text-foreground dark:text-slate-100 sm:text-sm">{{ area.label }}</h3>
                </div>
                <p class="mt-2 text-[11px] font-medium leading-5 text-muted sm:text-xs">{{ area.description }}</p>
                <span class="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[10px] font-bold text-success">
                  <ui-icon name="check-circle" [size]="12"></ui-icon>
                  دسترسی فعال
                </span>
              </article>
            }
          </div>
        </section>

        <aside class="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs font-medium leading-6 text-muted dark:bg-primary/10 sm:px-4 sm:text-sm">
          <ui-icon name="info" [size]="17" class="mt-1 shrink-0 text-primary"></ui-icon>
          <p>آمار عملیاتی و میانبر صفحات پس از تعریف منبع داده و پیاده‌سازی مسیرهای داخلی نمایش داده خواهند شد.</p>
        </aside>
      } @else {
        <section class="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="internal-dashboard-unavailable-title">
          <ui-icon name="shield-alert" [size]="38" class="mx-auto text-muted"></ui-icon>
          <h1 id="internal-dashboard-unavailable-title" class="mt-3 text-xl font-extrabold text-foreground dark:text-slate-100">داشبورد داخلی در دسترس نیست</h1>
          <p class="mt-2 text-sm leading-6 text-muted">این صفحه برای نقش‌های داخلی فیش۲۴ نمایش داده می‌شود.</p>
        </section>
      }
    </div>
  `
})
export class InternalDashboardComponent {
  private readonly permissionService = inject(Fish24PermissionService);
  private readonly previewRoleService = inject(Fish24RolePreviewService);

  readonly activeRoles = computed(() => this.previewRoleService.getPreviewRoles());

  readonly hasInternalDashboardAccess = computed(() => {
    const roles = this.activeRoles();
    return roles.some(role => INTERNAL_ROLE_IDS.includes(role))
      && this.permissionService.hasPermission(roles, FISH24_PERMISSIONS.dashboard);
  });

  readonly activeRoleLabel = computed(() => this.activeRoles()
    .map(role => INTERNAL_ROLE_LABELS[role])
    .filter((label): label is string => Boolean(label))
    .join('، '));

  readonly visibleAreas = computed(() => {
    const roles = this.activeRoles();
    return INTERNAL_DASHBOARD_AREAS.filter(area => this.permissionService.hasPermission(roles, area.permission));
  });

  readonly summaries = computed<readonly InternalDashboardSummary[]>(() => {
    const areas = this.visibleAreas();
    const reports = areas.filter(area => area.group === 'report' || area.id === 'financial-reports').length;
    const communication = areas.filter(area => area.group === 'communication').length;
    const financial = areas.filter(area => area.group === 'financial').length;
    const summaries: InternalDashboardSummary[] = [
      {
        id: 'available-areas',
        label: 'حوزه عملیاتی در دسترس',
        value: this.toPersianDigits(areas.length),
        icon: 'layout-dashboard'
      },
      {
        id: 'available-reports',
        label: 'گروه گزارش در دسترس',
        value: this.toPersianDigits(reports),
        icon: 'bar-chart-2'
      },
      {
        id: 'communication-tools',
        label: 'حوزه ارتباطی در دسترس',
        value: this.toPersianDigits(communication),
        icon: 'message-circle'
      }
    ];

    if (financial > 0) {
      summaries.push({
        id: 'financial-areas',
        label: 'حوزه مالی در دسترس',
        value: this.toPersianDigits(financial),
        icon: 'banknote'
      });
    }

    return summaries;
  });

  private toPersianDigits(value: number): string {
    return String(value).replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
  }
}

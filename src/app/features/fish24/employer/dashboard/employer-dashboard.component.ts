import { Component } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

interface EmployerDashboardMetric {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly unit?: string;
}

@Component({
  selector: 'app-employer-dashboard',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-6 sm:space-y-8 animate-fade-in-up" dir="rtl">
      <header class="flex items-center gap-4">
        <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <ui-icon name="dashboard" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl sm:text-3xl font-bold text-primary">داشبورد کارفرما</h1>
          <p class="mt-1 text-sm sm:text-base text-muted">نمای کلی اطلاعات کارفرما</p>
        </div>
      </header>

      <section class="space-y-3" aria-labelledby="employer-overview-title">
        <div>
          <h2 id="employer-overview-title" class="text-lg sm:text-xl font-bold text-foreground dark:text-slate-100">نمای کلی</h2>
          <p class="mt-1 text-sm text-muted">وضعیت کارگاه‌ها و کارکنان</p>
        </div>

        <div class="grid grid-cols-3 gap-2 sm:gap-4">
          @for (metric of overviewMetrics; track metric.id) {
            <article class="min-w-0 rounded-2xl border border-border border-t-4 border-t-primary bg-surface p-3 sm:p-5 shadow-sm dark:border-slate-700 dark:border-t-primary dark:bg-slate-800">
              <div class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ui-icon [name]="metric.icon" [size]="22"></ui-icon>
              </div>
              <p class="mt-4 break-words text-2xl sm:text-3xl font-extrabold leading-none text-foreground dark:text-slate-100">
                {{ metric.value }}
              </p>
              <p class="mt-2 text-xs sm:text-sm leading-5 text-muted">{{ metric.label }}</p>
            </article>
          }
        </div>
      </section>

      <section class="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="employer-documents-title">
        <div class="mb-4 sm:mb-5 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ui-icon name="folder-open" [size]="22"></ui-icon>
          </div>
          <div>
            <h2 id="employer-documents-title" class="text-lg sm:text-xl font-bold text-foreground dark:text-slate-100">اسناد و میزبانی</h2>
            <p class="mt-0.5 text-xs sm:text-sm text-muted">خلاصه فایل‌ها و اسناد ارسالی</p>
          </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border dark:border-slate-700 dark:bg-slate-700">
          @for (metric of documentMetrics; track metric.id) {
            <article class="min-w-0 bg-background/80 p-3 sm:p-4 dark:bg-slate-900/50">
              <div class="flex items-center gap-2 text-primary">
                <ui-icon [name]="metric.icon" [size]="24"></ui-icon>
                <span class="text-xs sm:text-sm leading-5 text-muted">{{ metric.label }}</span>
              </div>
              <p class="mt-3 break-words text-xl sm:text-2xl font-extrabold leading-tight text-foreground dark:text-slate-100">
                @if (metric.unit) {
                  <span class="inline-flex items-baseline gap-1" dir="ltr">
                    <span>{{ metric.value }}</span>
                    <span class="text-xs sm:text-sm font-bold text-muted">{{ metric.unit }}</span>
                  </span>
                } @else {
                  {{ metric.value }}
                }
              </p>
            </article>
          }
        </div>
      </section>

      <section class="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="employer-tickets-title">
        <div class="mb-4 sm:mb-5 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ui-icon name="ticket" [size]="22"></ui-icon>
          </div>
          <div>
            <h2 id="employer-tickets-title" class="text-lg sm:text-xl font-bold text-foreground dark:text-slate-100">وضعیت تیکت‌ها</h2>
            <p class="mt-0.5 text-xs sm:text-sm text-muted">خلاصه تیکت‌های کارکنان</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 sm:gap-4">
          <article class="flex items-center justify-between gap-4 rounded-xl bg-primary p-4 sm:p-5 text-white shadow-lg shadow-primary/15">
            <div class="min-w-0">
              <p class="text-xs sm:text-sm text-white/80">{{ ticketTotal.label }}</p>
              <p class="mt-2 text-3xl sm:text-4xl font-extrabold leading-none">{{ ticketTotal.value }}</p>
            </div>
            <ui-icon [name]="ticketTotal.icon" [size]="38" class="shrink-0 text-white/75"></ui-icon>
          </article>

          <div class="grid grid-cols-3 gap-2 sm:gap-3">
            @for (metric of ticketStatusMetrics; track metric.id) {
              <article class="min-w-0 rounded-xl border border-border bg-background/80 p-3 sm:p-4 text-center dark:border-slate-700 dark:bg-slate-900/50">
                <ui-icon [name]="metric.icon" [size]="20" class="mx-auto text-primary"></ui-icon>
                <p class="mt-2 text-xl sm:text-2xl font-extrabold leading-none text-foreground dark:text-slate-100">{{ metric.value }}</p>
                <p class="mt-2 text-[11px] sm:text-xs leading-5 text-muted">{{ metric.label }}</p>
              </article>
            }
          </div>
        </div>
      </section>

      <section aria-labelledby="employer-dashboard-training">
        <div class="relative overflow-hidden flex items-center gap-4 rounded-2xl border border-primary/30 bg-gradient-to-l from-primary/20 via-primary/10 to-surface p-5 sm:p-6 shadow-sm dark:to-slate-800">
          <div class="absolute -left-8 -bottom-10 w-32 h-32 rounded-full bg-primary/10" aria-hidden="true"></div>
          <div class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <ui-icon name="graduation-cap" [size]="28"></ui-icon>
          </div>
          <div class="relative min-w-0">
            <h2 id="employer-dashboard-training" class="text-lg sm:text-xl font-extrabold text-foreground dark:text-slate-100">آموزش سامانه</h2>
            <p class="mt-1 text-sm leading-6 text-muted">راهنمای استفاده از سامانه</p>
          </div>
        </div>
      </section>
    </div>
  `
})
export class EmployerDashboardComponent {
  // Presentation-only placeholders; each value remains independent until API contracts are defined.
  readonly overviewMetrics: readonly EmployerDashboardMetric[] = [
    { id: 'workshops', label: 'تعداد کارگاه‌ها', value: '۳', icon: 'briefcase' },
    { id: 'employees', label: 'تعداد کل کارکنان', value: '۲۴۸', icon: 'users' },
    { id: 'blocked-employees', label: 'تعداد کارکنان مسدود شده', value: '۱۲', icon: 'lock' }
  ];

  readonly documentMetrics: readonly EmployerDashboardMetric[] = [
    { id: 'sent-files', label: 'تعداد فایل‌های ارسالی', value: '۸۷', icon: 'folder-open' },
    { id: 'sent-pages', label: 'تعداد کل صفحات ارسالی', value: '۱٬۶۴۰', icon: 'file-text' },
    { id: 'hosting-volume', label: 'حجم کل میزبانی', value: '۸۴۲', unit: 'MB', icon: 'cloud' },
    { id: 'documents', label: 'تعداد کل اسناد', value: '۱٬۲۹۰', icon: 'inbox' },
    { id: 'paid-documents', label: 'تعداد اسناد پرداخت شده', value: '۹۳۴', icon: 'check-circle' },
    { id: 'unpaid-documents', label: 'تعداد اسناد پرداخت نشده', value: '۳۵۶', icon: 'alert-circle' }
  ];

  readonly ticketTotal: EmployerDashboardMetric = {
    id: 'employee-tickets',
    label: 'تعداد تیکت‌های کارکنان',
    value: '۴۷',
    icon: 'ticket'
  };

  readonly ticketStatusMetrics: readonly EmployerDashboardMetric[] = [
    { id: 'waiting-tickets', label: 'تعداد در انتظار پاسخ', value: '۶', icon: 'clock' },
    { id: 'answered-tickets', label: 'تعداد پاسخ داده شده', value: '۲۸', icon: 'message-circle' },
    { id: 'closed-tickets', label: 'تعداد بسته شده', value: '۱۳', icon: 'check-circle' }
  ];
}

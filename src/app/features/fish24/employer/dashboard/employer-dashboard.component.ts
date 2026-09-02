import { Component } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

interface EmployerDashboardMetric {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly icon: string;
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

      <section aria-labelledby="employer-dashboard-summary">
        <h2 id="employer-dashboard-summary" class="sr-only">خلاصه اطلاعات کارفرما</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (metric of metrics; track metric.id) {
            <article class="min-w-0 flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ui-icon [name]="metric.icon" [size]="24"></ui-icon>
              </div>
              <div class="min-w-0">
                <p class="text-sm leading-6 text-muted">{{ metric.label }}</p>
                <p class="mt-1 break-words text-xl sm:text-2xl font-extrabold leading-tight text-foreground dark:text-slate-100">
                  {{ metric.value }}
                </p>
              </div>
            </article>
          }
        </div>
      </section>

      <section aria-labelledby="employer-dashboard-training">
        <div class="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 dark:bg-primary/10">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
            <ui-icon name="graduation-cap" [size]="25"></ui-icon>
          </div>
          <div class="min-w-0">
            <h2 id="employer-dashboard-training" class="text-base sm:text-lg font-bold text-foreground dark:text-slate-100">
              آموزش سامانه
            </h2>
            <p class="mt-1 text-sm leading-6 text-muted">راهنمای استفاده از سامانه</p>
          </div>
        </div>
      </section>
    </div>
  `
})
export class EmployerDashboardComponent {
  // Presentation-only placeholders; each value remains independent until API contracts are defined.
  readonly metrics: readonly EmployerDashboardMetric[] = [
    { id: 'workshops', label: 'تعداد شرکت‌ها / کارگاه‌ها', value: '۳', icon: 'briefcase' },
    { id: 'employees', label: 'تعداد کارکنان', value: '۲۴۸', icon: 'users' },
    { id: 'blocked-employees', label: 'کارکنان مسدود', value: '۷', icon: 'lock' },
    { id: 'files', label: 'تعداد فایل‌ها', value: '۱۲۶', icon: 'folder-open' },
    { id: 'pages', label: 'تعداد صفحات', value: '۱٬۸۴۰', icon: 'file-text' },
    { id: 'hosting-cost', label: 'هزینه میزبانی', value: '۲٬۴۵۰٬۰۰۰ تومان', icon: 'cloud' },
    { id: 'paid-documents', label: 'اسناد پرداخت‌شده', value: '۱٬۷۱۲', icon: 'check-circle' },
    { id: 'unpaid-documents', label: 'اسناد پرداخت‌نشده', value: '۱۲۸', icon: 'alert-circle' },
    { id: 'tickets', label: 'تیکت‌ها', value: '۵', icon: 'ticket' }
  ];
}

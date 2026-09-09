import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

interface EmployerTrainingTopic {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly route?: string;
}

@Component({
  selector: 'app-employer-training',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-4 animate-fade-in-up sm:space-y-5" dir="rtl">
      <header class="flex items-center gap-3 sm:gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
          <ui-icon name="graduation-cap" [size]="29" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">آموزش سامانه</h1>
          <p class="mt-0.5 text-sm leading-6 text-muted sm:mt-1 sm:text-base">راهنمای دسترسی به بخش‌های اصلی پنل کارفرمای فیش۲۴</p>
        </div>
      </header>

      <section class="rounded-2xl border border-primary/25 bg-primary/5 p-4 dark:border-primary/30 dark:bg-primary/10 sm:p-5" aria-labelledby="document-guidance-title">
        <div class="flex items-start gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <ui-icon name="file-text" [size]="20"></ui-icon>
          </div>
          <div class="min-w-0 flex-1">
            <h2 id="document-guidance-title" class="text-base font-extrabold text-foreground dark:text-slate-100 sm:text-lg">راهنمای ارسال و بررسی فایل</h2>
            <ul class="mt-2 grid gap-x-6 gap-y-1.5 text-xs font-medium leading-6 text-foreground dark:text-slate-200 sm:grid-cols-2 sm:text-sm">
              @for (rule of documentGuidance; track rule) {
                <li class="flex items-start gap-2">
                  <ui-icon name="check-circle" [size]="15" class="mt-1 shrink-0 text-primary"></ui-icon>
                  <span>{{ rule }}</span>
                </li>
              }
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="training-topics-title">
        <div class="mb-3 flex items-center gap-2">
          <ui-icon name="book-open" [size]="20" class="text-primary"></ui-icon>
          <h2 id="training-topics-title" class="text-lg font-extrabold text-foreground dark:text-slate-100 sm:text-xl">راهنمای بخش‌ها</h2>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          @for (topic of topics; track topic.id) {
            <article class="flex min-h-36 flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:min-h-40">
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ui-icon [name]="topic.icon" [size]="21"></ui-icon>
                </div>
                <div class="min-w-0">
                  <h3 class="text-sm font-extrabold text-foreground dark:text-slate-100 sm:text-base">{{ topic.title }}</h3>
                  <p class="mt-1 text-xs font-medium leading-6 text-muted sm:text-sm">{{ topic.description }}</p>
                </div>
              </div>

              @if (topic.route) {
                <a [routerLink]="topic.route" class="mt-auto inline-flex min-h-10 w-fit items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25">
                  رفتن به بخش
                  <ui-icon name="chevron-left" [size]="17"></ui-icon>
                </a>
              } @else {
                <p class="mt-auto flex items-start gap-1.5 border-t border-border pt-3 text-xs font-semibold leading-5 text-muted dark:border-slate-700">
                  <ui-icon name="info" [size]="15" class="mt-0.5 shrink-0"></ui-icon>
                  این مرحله از جریان ارسال سند باز می‌شود.
                </p>
              }
            </article>
          }
        </div>
      </section>

      <aside class="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-label="راهنمای هویت کاربر">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ui-icon name="fingerprint" [size]="20"></ui-icon>
        </div>
        <p class="text-xs font-medium leading-6 text-foreground dark:text-slate-200 sm:text-sm">
          شماره موبایل هویت اصلی کاربر در فیش۲۴ است و یک کاربر می‌تواند اسناد خود را از چند کارفرما دریافت کند.
        </p>
      </aside>
    </div>
  `
})
export class EmployerTrainingComponent {
  readonly documentGuidance: readonly string[] = [
    'فایل PDF می‌تواند چندصفحه‌ای باشد.',
    'هر صفحه یک فیش یا سند است.',
    'هر صفحه باید دقیقاً یک شماره موبایل معتبر داشته باشد.',
    'وجود خطا در هر صفحه باعث رد کل فایل می‌شود.',
    'پس از اصلاح، فایل باید دوباره بارگذاری شود.'
  ];

  readonly topics: readonly EmployerTrainingTopic[] = [
    {
      id: 'profile',
      title: 'تکمیل پروفایل',
      description: 'مشاهده و تکمیل اطلاعات پروفایل کارفرما',
      icon: 'user',
      route: '/fish24/employer/profile'
    },
    {
      id: 'companies',
      title: 'شرکت‌ها و کارگاه‌ها',
      description: 'مدیریت شرکت‌ها و کارگاه‌های ثبت‌شده',
      icon: 'briefcase',
      route: '/fish24/employer/companies'
    },
    {
      id: 'employees',
      title: 'کارکنان تحت پوشش',
      description: 'مشاهده و مدیریت کارکنان تحت پوشش',
      icon: 'users',
      route: '/fish24/employer/employees'
    },
    {
      id: 'send-document',
      title: 'ارسال فیش و سند',
      description: 'آغاز جریان ارسال فیش یا سند جدید',
      icon: 'file-text',
      route: '/fish24/employer/documents/new'
    },
    {
      id: 'review-document',
      title: 'بررسی فایل',
      description: 'بررسی فایل پس از تکمیل اطلاعات سند و انتخاب PDF انجام می‌شود.',
      icon: 'clipboard-check'
    },
    {
      id: 'wallet',
      title: 'کیف پول',
      description: 'مشاهده موجودی و افزایش اعتبار کیف پول',
      icon: 'wallet',
      route: '/fish24/employer/wallet'
    },
    {
      id: 'invoices',
      title: 'فاکتورها',
      description: 'مشاهده فهرست فاکتورها',
      icon: 'file-text',
      route: '/fish24/employer/invoices'
    },
    {
      id: 'tickets',
      title: 'تیکت‌ها',
      description: 'مشاهده و پیگیری تیکت‌ها',
      icon: 'ticket',
      route: '/fish24/employer/tickets'
    },
    {
      id: 'notifications',
      title: 'اطلاع‌رسانی کارکنان',
      description: 'ارسال و مشاهده اطلاع‌رسانی‌های کارکنان',
      icon: 'bell',
      route: '/fish24/employer/employee-notifications'
    }
  ];
}

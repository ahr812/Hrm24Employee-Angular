import { Component } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

interface ReceivedNotification {
  readonly id: number;
  readonly senderDisplayName: string;
  readonly message: string;
  readonly createdAt: string;
}

const RECEIVED_NOTIFICATIONS: readonly ReceivedNotification[] = [
  { id: 1, senderDisplayName: 'مجموعه نمونه سپهر', message: 'فیش حقوق این ماه برای شما صادر شده است. لطفاً برای مشاهده جزئیات به بخش اسناد من مراجعه کنید.', createdAt: '۱۴۰۵/۰۶/۰۸' },
  { id: 2, senderDisplayName: 'کارگاه آزمایشی باران', message: 'همکار گرامی، اطلاعات سند جدید شما ثبت شد. در صورت نیاز به پیگیری، موضوع را از مسیر رسمی مجموعه دنبال کنید.', createdAt: '۱۴۰۵/۰۵/۲۹' },
  { id: 3, senderDisplayName: 'شرکت نمایشی نارنج', message: 'زمان‌بندی پرداخت دوره جاری به‌روزرسانی شده است.', createdAt: '۱۴۰۵/۰۴/۲۰' }
];

@Component({
  selector: 'app-my-notifications',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
      <header class="flex min-w-0 items-center gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
          <ui-icon name="bell" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">اطلاع‌رسانی‌های من</h1>
          <p class="mt-1 text-sm text-muted sm:text-base">پیام‌های دریافتی شما از شرکت‌ها و کارگاه‌ها</p>
        </div>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="my-notifications-list-title">
        <div class="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4 dark:border-slate-700">
          <div class="flex min-w-0 items-center gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon name="bell" [size]="20"></ui-icon></div><h2 id="my-notifications-list-title" class="text-lg font-bold text-foreground dark:text-slate-100">فهرست اطلاع‌رسانی‌ها</h2></div>
          <span class="shrink-0 text-xs font-semibold text-muted">{{ notifications.length }} پیام</span>
        </div>
        <div class="space-y-3">
          @for (notification of notifications; track notification.id) {
            <article class="min-w-0 rounded-xl border border-border bg-background/60 p-4 dark:border-slate-700 dark:bg-slate-900/45 sm:p-5">
              <div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h3 class="min-w-0 break-words text-base font-extrabold leading-7 text-primary">{{ notification.senderDisplayName }}</h3>
                <time class="shrink-0 text-xs font-semibold text-muted" dir="ltr">{{ notification.createdAt }}</time>
              </div>
              <p class="mt-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-8 text-foreground dark:text-slate-200">{{ notification.message }}</p>
            </article>
          }
        </div>
      </section>
    </div>
  `
})
export class MyNotificationsComponent {
  readonly notifications = RECEIVED_NOTIFICATIONS;
}

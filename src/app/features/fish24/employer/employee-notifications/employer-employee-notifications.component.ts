import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EscToCloseDirective } from '../../../../shared/directives/esc-to-close.directive';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { EmployerEmployeeNotificationsService } from './employer-employee-notifications.service';

type WorkplaceFilter = 'all' | `${number}`;

@Component({
  selector: 'app-employer-employee-notifications',
  standalone: true,
  imports: [FormsModule, EscToCloseDirective, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
      <header class="flex min-w-0 items-center gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
          <ui-icon name="bell" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">اطلاع‌رسانی کارکنان</h1>
          <p class="mt-1 text-sm text-muted sm:text-base">مدیریت پیام‌های ارسالی برای کارکنان و محل‌های کار</p>
        </div>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="employee-notification-filter-title">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon name="search" [size]="20"></ui-icon></div>
          <div><h2 id="employee-notification-filter-title" class="text-lg font-bold text-foreground dark:text-slate-100">جستجوی اطلاع‌رسانی‌ها</h2><p class="mt-0.5 text-xs text-muted">فهرست را بر اساس شرکت یا کارگاه محدود کنید.</p></div>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_auto_auto] md:items-end">
          <div>
            <label for="employee-notification-workplace-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">شرکت / کارگاه</label>
            <select id="employee-notification-workplace-filter" name="notificationWorkplaceFilter" [ngModel]="selectedWorkplaceFilter()" (ngModelChange)="selectedWorkplaceFilter.set($event)" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="all">همه شرکت‌ها و کارگاه‌ها</option>
              @for (workplace of workplaces; track workplace.id) { <option [value]="workplace.id">{{ workplace.name }}</option> }
            </select>
          </div>
          <button type="button" (click)="showAll()" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"><ui-icon name="list-check" [size]="18"></ui-icon>مشاهده همه</button>
          <button type="button" (click)="applyFilter()" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30"><ui-icon name="search" [size]="18"></ui-icon>جستجو</button>
        </div>
      </section>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="employee-notification-list-title">
        <div class="mb-4 flex flex-col gap-3 border-b border-border pb-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon name="bell" [size]="21"></ui-icon></div>
            <div><h2 id="employee-notification-list-title" aria-live="polite" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">لیست اطلاع‌رسانی‌ها (شامل {{ formatNumber(filteredNotifications().length) }} رکورد)</h2><p class="mt-0.5 text-xs text-muted">اطلاع‌رسانی‌های ثبت‌شده قابل ویرایش یا حذف نیستند.</p></div>
          </div>
          <button type="button" (click)="openCreateModal()" class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto"><ui-icon name="plus" [size]="18"></ui-icon>جدید</button>
        </div>

        @if (filteredNotifications().length > 0) {
          <div class="hidden overflow-hidden rounded-xl border border-border dark:border-slate-700 lg:block">
            <table class="w-full table-fixed text-sm">
              <thead class="bg-background/80 dark:bg-slate-900/60"><tr><th class="w-20 px-3 py-3 text-right text-xs font-bold text-muted">شناسه</th><th class="w-64 px-3 py-3 text-right text-xs font-bold text-muted">گیرنده</th><th class="px-3 py-3 text-right text-xs font-bold text-muted">متن پیام</th><th class="w-40 px-3 py-3 text-right text-xs font-bold text-muted">تاریخ ایجاد</th></tr></thead>
              <tbody class="divide-y divide-border dark:divide-slate-700">
                @for (notification of filteredNotifications(); track notification.id) {
                  <tr class="transition-colors hover:bg-primary/5 dark:hover:bg-primary/10">
                    <td class="px-3 py-3 font-bold text-foreground dark:text-slate-200" dir="ltr">{{ notification.id }}</td>
                    <td class="break-words px-3 py-3 font-bold leading-6 text-foreground dark:text-slate-100">{{ notification.recipientDisplayName }}</td>
                    <td class="break-words px-3 py-3 text-sm leading-7 text-foreground dark:text-slate-200">{{ notification.message }}</td>
                    <td class="whitespace-nowrap px-3 py-3 text-muted" dir="ltr">{{ notification.createdAt }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="space-y-3 lg:hidden">
            @for (notification of filteredNotifications(); track notification.id) {
              <article class="rounded-xl border border-border bg-background/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div class="flex items-start justify-between gap-3"><h3 class="min-w-0 break-words text-base font-extrabold leading-6 text-foreground dark:text-slate-100">{{ notification.recipientDisplayName }}</h3><span class="shrink-0 text-xs font-bold text-muted" dir="ltr">#{{ notification.id }}</span></div>
                <p class="mt-3 break-words whitespace-pre-wrap text-sm leading-7 text-foreground dark:text-slate-200">{{ notification.message }}</p>
                <dl class="mt-3 border-t border-border pt-3 dark:border-slate-700"><div class="flex items-center justify-between gap-3"><dt class="text-xs text-muted">تاریخ ایجاد</dt><dd class="text-xs font-semibold text-muted" dir="ltr">{{ notification.createdAt }}</dd></div></dl>
              </article>
            }
          </div>
        } @else {
          <div class="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center dark:border-slate-600 dark:bg-slate-900/40"><ui-icon name="inbox" [size]="34" class="mx-auto text-muted opacity-70"></ui-icon><p class="mt-3 text-sm font-bold text-foreground dark:text-slate-200">اطلاع‌رسانی مطابق فیلتر انتخاب‌شده پیدا نشد.</p></div>
        }
      </section>

      @if (createModalOpen()) {
        <div appEscToClose (escPressed)="closeCreateModal()" (click)="closeCreateModal()" class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fade-in" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="new-employee-notification-title" aria-describedby="new-employee-notification-warning" (click)="$event.stopPropagation()" class="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in dark:border-slate-700 dark:bg-slate-800">
            <div class="flex items-center justify-between gap-3 border-b border-border p-4 dark:border-slate-700 sm:p-5"><h2 id="new-employee-notification-title" class="text-lg font-bold text-foreground dark:text-slate-100">ارسال اطلاع‌رسانی جدید</h2><button type="button" (click)="closeCreateModal()" aria-label="بستن" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 dark:hover:bg-slate-700"><ui-icon name="x" [size]="18"></ui-icon></button></div>
            <form (ngSubmit)="submitCreate()" novalidate>
              <div class="space-y-4 p-4 sm:p-5">
                <p id="new-employee-notification-warning" class="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/10 p-3 text-sm font-semibold leading-6 text-warning"><ui-icon name="alert-triangle" [size]="18" class="mt-0.5 shrink-0"></ui-icon><span>پس از ارسال این اطلاع‌رسانی امکان ویرایش آن وجود نخواهد داشت. لطفاً پیش از ثبت، متن و گیرنده را بررسی کنید.</span></p>
                <div>
                  <label for="new-employee-notification-workplace" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">شرکت / کارگاه</label>
                  <select id="new-employee-notification-workplace" name="newNotificationWorkplace" [(ngModel)]="createWorkplaceId" autofocus [attr.aria-invalid]="showWorkplaceError()" [attr.aria-describedby]="showWorkplaceError() ? 'new-notification-workplace-error' : null" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"><option value="">انتخاب شرکت یا کارگاه</option>@for (workplace of workplaces; track workplace.id) { <option [value]="workplace.id">{{ workplace.name }}</option> }</select>
                  @if (showWorkplaceError()) { <p id="new-notification-workplace-error" role="alert" class="mt-1.5 text-xs font-medium text-danger">شرکت یا کارگاه را انتخاب کنید.</p> }
                </div>
                <div>
                  <label for="new-employee-notification-message" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">پیام</label>
                  <textarea id="new-employee-notification-message" name="newNotificationMessage" [(ngModel)]="createMessage" rows="6" [attr.aria-invalid]="showMessageError()" [attr.aria-describedby]="showMessageError() ? 'new-notification-message-error' : null" class="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-7 text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" placeholder="پیام اطلاع‌رسانی را وارد کنید"></textarea>
                  @if (showMessageError()) { <p id="new-notification-message-error" role="alert" class="mt-1.5 text-xs font-medium text-danger">پیام را وارد کنید.</p> }
                </div>
              </div>
              <div class="flex flex-col-reverse gap-2 border-t border-border p-4 dark:border-slate-700 sm:flex-row sm:justify-end sm:p-5"><button type="button" (click)="closeCreateModal()" class="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">انصراف</button><button type="submit" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto"><ui-icon name="send" [size]="17"></ui-icon>ثبت</button></div>
            </form>
          </section>
        </div>
      }
    </div>
  `
})
export class EmployerEmployeeNotificationsComponent {
  private readonly notificationService = inject(EmployerEmployeeNotificationsService);
  private readonly toast = inject(ToastService);
  private readonly numberFormatter = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });

  readonly notifications = this.notificationService.notifications;
  readonly workplaces = this.notificationService.workplaces;
  readonly selectedWorkplaceFilter = signal<WorkplaceFilter>('all');
  readonly appliedWorkplaceFilter = signal<WorkplaceFilter>('all');
  readonly createModalOpen = signal(false);
  readonly createAttempted = signal(false);
  createWorkplaceId = '';
  createMessage = '';

  readonly filteredNotifications = computed(() => {
    const workplace = this.appliedWorkplaceFilter();
    return this.notifications().filter((notification) => workplace === 'all' || notification.workplaceId === Number(workplace));
  });

  applyFilter(): void {
    this.appliedWorkplaceFilter.set(this.selectedWorkplaceFilter());
  }

  showAll(): void {
    this.selectedWorkplaceFilter.set('all');
    this.appliedWorkplaceFilter.set('all');
  }

  openCreateModal(): void {
    this.createWorkplaceId = '';
    this.createMessage = '';
    this.createAttempted.set(false);
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
    this.createWorkplaceId = '';
    this.createMessage = '';
    this.createAttempted.set(false);
  }

  showWorkplaceError(): boolean {
    return this.createAttempted() && this.createWorkplaceId.length === 0;
  }

  showMessageError(): boolean {
    return this.createAttempted() && this.createMessage.trim().length === 0;
  }

  submitCreate(): void {
    this.createAttempted.set(true);
    if (this.showWorkplaceError() || this.showMessageError()) return;

    const created = this.notificationService.createWorkplaceNotification(Number(this.createWorkplaceId), this.createMessage);
    if (!created) return;

    this.closeCreateModal();
    this.toast.show('اطلاع‌رسانی در نسخه نمایشی ثبت شد.', 'success');
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EscToCloseDirective } from '../../../../shared/directives/esc-to-close.directive';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface EmployerCompanyOption {
  readonly id: number;
  readonly name: string;
}

interface CoveredEmployeeRecord {
  readonly id: number;
  readonly companyWorkshopId: number;
  readonly companyWorkshopName: string;
  readonly mobile: string;
  readonly name?: string | null;
  readonly isBlocked: boolean;
  readonly hasTicketAccess: boolean;
}

type CompanyFilter = 'all' | `${number}`;
type BlockedFilter = 'all' | 'active' | 'blocked';
type TicketFilter = 'all' | 'allowed' | 'denied';
type GroupAction = '' | 'block' | 'unblock' | 'ticket-deny' | 'ticket-allow';
type MutableEmployeeField = 'isBlocked' | 'hasTicketAccess';

interface PendingStateAction {
  readonly recordIds: readonly number[];
  readonly field: MutableEmployeeField;
  readonly value: boolean;
  readonly title: string;
  readonly actionLabel: string;
  readonly description: string;
  readonly isGroup: boolean;
}

@Component({
  selector: 'app-employer-employees',
  standalone: true,
  imports: [FormsModule, EscToCloseDirective, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
      <header class="flex min-w-0 items-center gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
          <ui-icon name="users" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">کارکنان تحت پوشش</h1>
          <p class="mt-1 text-sm text-muted sm:text-base">مدیریت وضعیت دسترسی کارکنان تحت پوشش</p>
        </div>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="covered-employee-filters-title">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ui-icon name="sliders" [size]="20"></ui-icon>
          </div>
          <div>
            <h2 id="covered-employee-filters-title" class="text-lg font-bold text-foreground dark:text-slate-100">فیلتر کارکنان</h2>
            <p class="mt-0.5 text-xs text-muted">فیلترها به‌صورت هم‌زمان روی فهرست اعمال می‌شوند.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label for="covered-company-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">شرکت / کارگاه</label>
            <select
              id="covered-company-filter"
              name="coveredCompanyFilter"
              [ngModel]="companyFilter()"
              (ngModelChange)="onCompanyFilterChange($event)"
              class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="all">همه شرکت‌ها و کارگاه‌ها</option>
              @for (company of companyOptions; track company.id) {
                <option [value]="company.id">{{ company.name }}</option>
              }
            </select>
          </div>

          <div>
            <label for="covered-blocked-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">وضعیت فعالیت</label>
            <select
              id="covered-blocked-filter"
              name="coveredBlockedFilter"
              [ngModel]="blockedFilter()"
              (ngModelChange)="onBlockedFilterChange($event)"
              class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="all">همه</option>
              <option value="active">فعال</option>
              <option value="blocked">مسدود</option>
            </select>
          </div>

          <div>
            <label for="covered-ticket-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">دسترسی تیکت</label>
            <select
              id="covered-ticket-filter"
              name="coveredTicketFilter"
              [ngModel]="ticketFilter()"
              (ngModelChange)="onTicketFilterChange($event)"
              class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="all">همه</option>
              <option value="allowed">تیکت مجاز</option>
              <option value="denied">تیکت غیرمجاز</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <button
            type="button"
            (click)="showAllRecords()"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">
            <ui-icon name="list-check" [size]="18"></ui-icon>
            مشاهده همه
          </button>
        </div>
      </section>

      <section id="covered-employee-results" class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="covered-employee-list-title">
        <div class="flex flex-col gap-4 border-b border-border pb-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ui-icon name="users" [size]="21"></ui-icon>
            </div>
            <div class="min-w-0">
              <h2 id="covered-employee-list-title" aria-live="polite" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">
                لیست کارکنان (شامل {{ formatNumber(filteredRecords().length) }} رکورد)
              </h2>
              <p class="mt-0.5 text-xs text-muted">نتایج مطابق فیلترهای فعلی نمایش داده می‌شوند.</p>
            </div>
          </div>

          <div class="w-full lg:max-w-sm">
            <label for="covered-employee-search" class="sr-only">جستجوی کارکنان</label>
            <div class="relative">
              <ui-icon name="search" [size]="18" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
              <input
                id="covered-employee-search"
                name="coveredEmployeeSearch"
                type="search"
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchChange($event)"
                aria-controls="covered-employee-results"
                autocomplete="off"
                class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                placeholder="جستجو...">
            </div>
          </div>
        </div>

        <div class="my-4 flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-3 dark:border-slate-700 dark:bg-slate-900/40 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-sm font-bold text-foreground dark:text-slate-200">عملیات گروهی</p>
            <p class="mt-0.5 text-xs text-muted" aria-live="polite">{{ formatNumber(selectedCount()) }} رکورد انتخاب شده</p>
          </div>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(12rem,1fr)_auto]">
            <div>
              <label for="covered-group-action" class="sr-only">انتخاب عملیات گروهی</label>
              <select
                id="covered-group-action"
                name="coveredGroupAction"
                [ngModel]="selectedGroupAction()"
                (ngModelChange)="selectedGroupAction.set($event)"
                [disabled]="selectedCount() === 0"
                class="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                <option value="" disabled>انتخاب عملیات گروهی</option>
                <option value="block">مسدود کردن</option>
                <option value="unblock">بازگشت از انسداد</option>
                <option value="ticket-deny">تیکت غیرمجاز</option>
                <option value="ticket-allow">تیکت مجاز</option>
              </select>
            </div>
            <button
              type="button"
              (click)="requestGroupAction()"
              [disabled]="selectedCount() === 0 || selectedGroupAction() === ''"
              class="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-45">
              اعمال
            </button>
          </div>
        </div>

        @if (filteredRecords().length > 0) {
          <div class="hidden overflow-hidden rounded-xl border border-border dark:border-slate-700 lg:block">
            <table class="w-full table-fixed text-sm">
              <thead class="bg-background/80 dark:bg-slate-900/60">
                <tr>
                  <th class="w-12 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      [checked]="allVisibleSelected()"
                      [indeterminate]="someVisibleSelected()"
                      (change)="toggleSelectAll($any($event.target).checked)"
                      aria-label="انتخاب همه کارکنان قابل مشاهده"
                      class="h-4 w-4 rounded border-border text-primary focus:ring-primary/30">
                  </th>
                  <th class="w-16 px-3 py-3 text-right text-xs font-bold text-muted">شناسه</th>
                  <th class="w-[28%] px-3 py-3 text-right text-xs font-bold text-muted">نام شرکت یا کارگاه</th>
                  <th class="w-32 px-3 py-3 text-right text-xs font-bold text-muted">موبایل پرسنل</th>
                  <th class="w-[32%] px-3 py-3 text-right text-xs font-bold text-muted">نام پرسنل</th>
                  <th class="w-44 px-3 py-3 text-right text-xs font-bold text-muted">وضعیت</th>
                  <th class="w-40 px-3 py-3 text-center text-xs font-bold text-muted">عملیات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border dark:divide-slate-700">
                @for (record of filteredRecords(); track record.id) {
                  <tr class="transition-colors hover:bg-primary/5 dark:hover:bg-primary/10">
                    <td class="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        [checked]="isSelected(record.id)"
                        (change)="toggleRecordSelection(record.id, $any($event.target).checked)"
                        [attr.aria-label]="'انتخاب رکورد ' + record.id"
                        class="h-4 w-4 rounded border-border text-primary focus:ring-primary/30">
                    </td>
                    <td class="px-3 py-3 font-bold text-foreground dark:text-slate-200"><span dir="ltr">{{ record.id }}</span></td>
                    <td class="px-3 py-3 font-bold leading-6 text-foreground dark:text-slate-100">{{ record.companyWorkshopName }}</td>
                    <td class="px-3 py-3 font-semibold text-foreground dark:text-slate-200"><span class="inline-block" dir="ltr">{{ record.mobile }}</span></td>
                    <td class="px-3 py-3">
                      @if (record.name) {
                        <span class="font-bold text-foreground dark:text-slate-100">{{ record.name }}</span>
                      } @else {
                        <span class="text-xs font-bold leading-5 text-danger">کارمند پروفایلش را تکمیل نکرده</span>
                      }
                    </td>
                    <td class="px-3 py-3">
                      <div class="flex flex-wrap gap-1.5">
                        <span [class]="record.isBlocked
                          ? 'inline-flex rounded-full bg-danger/15 px-2.5 py-1 text-xs font-bold text-danger'
                          : 'inline-flex rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success'">
                          {{ record.isBlocked ? 'مسدود' : 'فعال' }}
                        </span>
                        <span [class]="record.hasTicketAccess
                          ? 'inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary'
                          : 'inline-flex rounded-full bg-warning/15 px-2.5 py-1 text-xs font-bold text-warning'">
                          {{ record.hasTicketAccess ? 'تیکت مجاز' : 'تیکت غیرمجاز' }}
                        </span>
                      </div>
                    </td>
                    <td class="px-3 py-3">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          (click)="requestBlockedChange(record)"
                          [attr.aria-label]="blockedActionLabel(record) + ' ' + employeeReference(record)"
                          [title]="blockedActionLabel(record)"
                          [class]="record.isBlocked
                            ? actionButtonClass('success')
                            : actionButtonClass('danger')">
                          <ui-icon [name]="record.isBlocked ? 'check-circle' : 'lock'" [size]="17"></ui-icon>
                        </button>
                        <button
                          type="button"
                          (click)="requestTicketChange(record)"
                          [attr.aria-label]="ticketActionLabel(record) + ' ' + employeeReference(record)"
                          [title]="ticketActionLabel(record)"
                          [class]="record.hasTicketAccess
                            ? actionButtonClass('warning')
                            : actionButtonClass('primary')">
                          <ui-icon name="ticket" [size]="17"></ui-icon>
                        </button>
                        <button
                          type="button"
                          (click)="openNotificationModal(record)"
                          [attr.aria-label]="'ارسال اطلاع رسانی به کارمند ' + employeeReference(record)"
                          title="ارسال اطلاع رسانی به کارمند"
                          [class]="actionButtonClass('primary')">
                          <ui-icon name="bell" [size]="17"></ui-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="space-y-3 lg:hidden">
            @for (record of filteredRecords(); track record.id) {
              <article class="rounded-xl border border-border bg-background/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div class="flex items-start gap-3">
                  <input
                    type="checkbox"
                    [checked]="isSelected(record.id)"
                    (change)="toggleRecordSelection(record.id, $any($event.target).checked)"
                    [attr.aria-label]="'انتخاب رکورد ' + record.id"
                    class="mt-1 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary/30">
                  <div class="min-w-0 flex-1">
                    @if (record.name) {
                      <h3 class="break-words text-base font-extrabold leading-6 text-foreground dark:text-slate-100">{{ record.name }}</h3>
                    } @else {
                      <h3 class="text-sm font-extrabold leading-6 text-danger">کارمند پروفایلش را تکمیل نکرده</h3>
                    }
                    <p class="mt-1 break-words text-sm font-semibold text-muted">{{ record.companyWorkshopName }}</p>
                  </div>
                  <span class="shrink-0 text-xs font-bold text-muted" dir="ltr">#{{ record.id }}</span>
                </div>

                <dl class="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface p-3 dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-2">
                  <div>
                    <dt class="text-[11px] text-muted">موبایل پرسنل</dt>
                    <dd class="mt-1 text-sm font-bold text-foreground dark:text-slate-200" dir="ltr">{{ record.mobile }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] text-muted">وضعیت</dt>
                    <dd class="mt-1 flex flex-wrap gap-1.5">
                      <span [class]="record.isBlocked
                        ? 'inline-flex rounded-full bg-danger/15 px-2.5 py-1 text-xs font-bold text-danger'
                        : 'inline-flex rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success'">
                        {{ record.isBlocked ? 'مسدود' : 'فعال' }}
                      </span>
                      <span [class]="record.hasTicketAccess
                        ? 'inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary'
                        : 'inline-flex rounded-full bg-warning/15 px-2.5 py-1 text-xs font-bold text-warning'">
                        {{ record.hasTicketAccess ? 'تیکت مجاز' : 'تیکت غیرمجاز' }}
                      </span>
                    </dd>
                  </div>
                </dl>

                <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    (click)="requestBlockedChange(record)"
                    [class]="mobileActionButtonClass(record.isBlocked ? 'success' : 'danger')">
                    <ui-icon [name]="record.isBlocked ? 'check-circle' : 'lock'" [size]="17"></ui-icon>
                    {{ blockedActionLabel(record) }}
                  </button>
                  <button
                    type="button"
                    (click)="requestTicketChange(record)"
                    [class]="mobileActionButtonClass(record.hasTicketAccess ? 'warning' : 'primary')">
                    <ui-icon name="ticket" [size]="17"></ui-icon>
                    {{ ticketActionLabel(record) }}
                  </button>
                  <button
                    type="button"
                    (click)="openNotificationModal(record)"
                    [attr.aria-label]="'ارسال اطلاع رسانی به کارمند ' + employeeReference(record)"
                    [class]="mobileActionButtonClass('primary')">
                    <ui-icon name="bell" [size]="17"></ui-icon>
                    اطلاع‌رسانی
                  </button>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center dark:border-slate-600 dark:bg-slate-900/40">
            <ui-icon name="inbox" [size]="34" class="mx-auto text-muted opacity-70"></ui-icon>
            <p class="mt-3 text-sm font-bold text-foreground dark:text-slate-200">کارمندی مطابق فیلترهای انتخاب‌شده پیدا نشد.</p>
          </div>
        }
      </section>

      @if (pendingAction(); as action) {
        <div
          appEscToClose
          (escPressed)="closeStateConfirmation()"
          (click)="closeStateConfirmation()"
          class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          role="presentation">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="covered-state-confirm-title"
            aria-describedby="covered-state-confirm-description"
            (click)="$event.stopPropagation()"
            class="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in dark:border-slate-700 dark:bg-slate-800">
            <div class="p-5 text-center">
              <div [class]="isDangerousAction(action)
                ? 'mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger'
                : 'mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success'">
                <ui-icon [name]="action.field === 'isBlocked' ? 'lock' : 'ticket'" [size]="25"></ui-icon>
              </div>
              <h2 id="covered-state-confirm-title" class="mt-3 text-lg font-bold text-foreground dark:text-slate-100">{{ action.title }}</h2>
              <p id="covered-state-confirm-description" class="mt-2 text-sm leading-6 text-muted">{{ action.description }}</p>
            </div>
            <div class="flex flex-col-reverse gap-2 border-t border-border p-4 dark:border-slate-700 sm:flex-row sm:justify-end">
              <button
                type="button"
                (click)="closeStateConfirmation()"
                class="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">
                انصراف
              </button>
              <button
                type="button"
                (click)="confirmStateAction()"
                [class]="isDangerousAction(action)
                  ? 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-danger px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-danger/25 sm:w-auto'
                  : 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-success/25 sm:w-auto'">
                {{ action.actionLabel }}
              </button>
            </div>
          </section>
        </div>
      }

      @if (notificationRecord(); as record) {
        <div
          appEscToClose
          (escPressed)="closeNotificationModal()"
          (click)="closeNotificationModal()"
          class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="covered-notification-title"
            (click)="$event.stopPropagation()"
            class="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in dark:border-slate-700 dark:bg-slate-800">
            <div class="flex items-center justify-between gap-3 border-b border-border p-4 dark:border-slate-700 sm:p-5">
              <h2 id="covered-notification-title" class="text-lg font-bold text-foreground dark:text-slate-100">اطلاع رسانی به کارمند</h2>
              <button
                type="button"
                (click)="closeNotificationModal()"
                aria-label="بستن"
                class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 dark:hover:bg-slate-700">
                <ui-icon name="x" [size]="18"></ui-icon>
              </button>
            </div>

            <form (ngSubmit)="submitNotification()" novalidate>
              <div class="space-y-4 p-4 sm:p-5">
                <div class="rounded-xl border border-border bg-background/70 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                  <p class="text-xs text-muted">گیرنده</p>
                  @if (record.name) {
                    <p class="mt-1 text-sm font-bold text-foreground dark:text-slate-100">{{ record.name }}</p>
                  } @else {
                    <p class="mt-1 text-sm font-bold text-danger">کارمند پروفایلش را تکمیل نکرده</p>
                  }
                  <p class="mt-1 text-sm font-semibold text-muted" dir="ltr">{{ record.mobile }}</p>
                </div>

                <div>
                  <label for="covered-notification-text" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">متن</label>
                  <textarea
                    id="covered-notification-text"
                    name="coveredNotificationText"
                    [(ngModel)]="notificationText"
                    rows="5"
                    required
                    autofocus
                    [attr.aria-invalid]="showNotificationError()"
                    [attr.aria-describedby]="showNotificationError() ? 'covered-notification-error' : null"
                    class="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-7 text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="متن اطلاع‌رسانی را وارد کنید"></textarea>
                  @if (showNotificationError()) {
                    <p id="covered-notification-error" role="alert" class="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-danger">
                      <ui-icon name="alert-circle" [size]="14" class="mt-0.5 shrink-0"></ui-icon>
                      متن اطلاع‌رسانی را وارد کنید.
                    </p>
                  }
                </div>
              </div>

              <div class="flex flex-col-reverse gap-2 border-t border-border p-4 dark:border-slate-700 sm:flex-row sm:justify-end sm:p-5">
                <button
                  type="button"
                  (click)="closeNotificationModal()"
                  class="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">
                  انصراف
                </button>
                <button
                  type="submit"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto">
                  <ui-icon name="send" [size]="17"></ui-icon>
                  ارسال
                </button>
              </div>
            </form>
          </section>
        </div>
      }
    </div>
  `
})
export class EmployerEmployeesComponent {
  private readonly toastService = inject(ToastService);
  private readonly numberFormatter = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });

  readonly companyOptions: readonly EmployerCompanyOption[] = [
    { id: 201, name: 'مجموعه نمونه سپهر' },
    { id: 202, name: 'مجموعه آزمایشی باران' },
    { id: 203, name: 'مجموعه نمایشی نارنج' }
  ];

  readonly records = signal<readonly CoveredEmployeeRecord[]>([
    { id: 1001, companyWorkshopId: 201, companyWorkshopName: 'مجموعه نمونه سپهر', mobile: '09120001001', name: 'آرمان نمونه', isBlocked: false, hasTicketAccess: true },
    { id: 1002, companyWorkshopId: 201, companyWorkshopName: 'مجموعه نمونه سپهر', mobile: '09120001002', name: null, isBlocked: false, hasTicketAccess: false },
    { id: 1003, companyWorkshopId: 202, companyWorkshopName: 'مجموعه آزمایشی باران', mobile: '09120001003', name: 'بهار آزمایشی', isBlocked: true, hasTicketAccess: false },
    { id: 1004, companyWorkshopId: 202, companyWorkshopName: 'مجموعه آزمایشی باران', mobile: '09120001001', name: 'آرمان نمونه', isBlocked: false, hasTicketAccess: true },
    { id: 1005, companyWorkshopId: 203, companyWorkshopName: 'مجموعه نمایشی نارنج', mobile: '09120001004', name: 'کیان نمایشی', isBlocked: false, hasTicketAccess: true },
    { id: 1006, companyWorkshopId: 203, companyWorkshopName: 'مجموعه نمایشی نارنج', mobile: '09120001005', name: null, isBlocked: true, hasTicketAccess: true }
  ]);

  readonly companyFilter = signal<CompanyFilter>('all');
  readonly blockedFilter = signal<BlockedFilter>('all');
  readonly ticketFilter = signal<TicketFilter>('all');
  readonly searchQuery = signal('');
  readonly selectedIds = signal<ReadonlySet<number>>(new Set<number>());
  readonly selectedGroupAction = signal<GroupAction>('');
  readonly pendingAction = signal<PendingStateAction | null>(null);
  readonly notificationRecord = signal<CoveredEmployeeRecord | null>(null);
  readonly notificationSubmissionAttempted = signal(false);
  notificationText = '';

  readonly filteredRecords = computed(() => {
    const company = this.companyFilter();
    const blocked = this.blockedFilter();
    const ticket = this.ticketFilter();
    const query = this.searchQuery().trim().toLocaleLowerCase('fa-IR');

    return this.records().filter((record) => {
      const matchesCompany = company === 'all' || record.companyWorkshopId === Number(company);
      const matchesBlocked = blocked === 'all'
        || (blocked === 'active' && !record.isBlocked)
        || (blocked === 'blocked' && record.isBlocked);
      const matchesTicket = ticket === 'all'
        || (ticket === 'allowed' && record.hasTicketAccess)
        || (ticket === 'denied' && !record.hasTicketAccess);
      const searchableText = `${record.id} ${record.name ?? ''} ${record.mobile} ${record.companyWorkshopName}`.toLocaleLowerCase('fa-IR');
      const matchesQuery = query.length === 0 || searchableText.includes(query);

      return matchesCompany && matchesBlocked && matchesTicket && matchesQuery;
    });
  });

  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly allVisibleSelected = computed(() => {
    const visible = this.filteredRecords();
    return visible.length > 0 && visible.every((record) => this.selectedIds().has(record.id));
  });
  readonly someVisibleSelected = computed(() => {
    const visible = this.filteredRecords();
    const selectedVisibleCount = visible.filter((record) => this.selectedIds().has(record.id)).length;
    return selectedVisibleCount > 0 && selectedVisibleCount < visible.length;
  });

  onCompanyFilterChange(value: CompanyFilter): void {
    this.companyFilter.set(value);
    this.clearSelection();
  }

  onBlockedFilterChange(value: BlockedFilter): void {
    this.blockedFilter.set(value);
    this.clearSelection();
  }

  onTicketFilterChange(value: TicketFilter): void {
    this.ticketFilter.set(value);
    this.clearSelection();
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.clearSelection();
  }

  showAllRecords(): void {
    this.companyFilter.set('all');
    this.blockedFilter.set('all');
    this.ticketFilter.set('all');
    this.searchQuery.set('');
    this.clearSelection();
  }

  isSelected(recordId: number): boolean {
    return this.selectedIds().has(recordId);
  }

  toggleRecordSelection(recordId: number, checked: boolean): void {
    const nextSelection = new Set(this.selectedIds());
    checked ? nextSelection.add(recordId) : nextSelection.delete(recordId);
    this.selectedIds.set(nextSelection);
  }

  toggleSelectAll(checked: boolean): void {
    const visibleIds = this.filteredRecords().map((record) => record.id);
    this.selectedIds.set(checked ? new Set(visibleIds) : new Set<number>());
  }

  requestBlockedChange(record: CoveredEmployeeRecord): void {
    const shouldBlock = !record.isBlocked;
    const label = shouldBlock ? 'مسدود کردن' : 'بازگشت از انسداد';
    this.pendingAction.set({
      recordIds: [record.id],
      field: 'isBlocked',
      value: shouldBlock,
      title: 'تغییر وضعیت کارمند',
      actionLabel: label,
      description: `آیا از ${label} ${this.employeeReference(record)} اطمینان دارید؟`,
      isGroup: false
    });
  }

  requestTicketChange(record: CoveredEmployeeRecord): void {
    const shouldAllow = !record.hasTicketAccess;
    const label = shouldAllow ? 'تیکت مجاز' : 'تیکت غیرمجاز';
    this.pendingAction.set({
      recordIds: [record.id],
      field: 'hasTicketAccess',
      value: shouldAllow,
      title: 'تغییر دسترسی تیکت',
      actionLabel: label,
      description: `آیا از تغییر دسترسی ${this.employeeReference(record)} به «${label}» اطمینان دارید؟`,
      isGroup: false
    });
  }

  requestGroupAction(): void {
    const action = this.selectedGroupAction();
    const recordIds = Array.from(this.selectedIds());

    if (!action || recordIds.length === 0) {
      return;
    }

    const definitions: Record<Exclude<GroupAction, ''>, Pick<PendingStateAction, 'field' | 'value' | 'actionLabel'>> = {
      block: { field: 'isBlocked', value: true, actionLabel: 'مسدود کردن' },
      unblock: { field: 'isBlocked', value: false, actionLabel: 'بازگشت از انسداد' },
      'ticket-deny': { field: 'hasTicketAccess', value: false, actionLabel: 'تیکت غیرمجاز' },
      'ticket-allow': { field: 'hasTicketAccess', value: true, actionLabel: 'تیکت مجاز' }
    };
    const definition = definitions[action];
    const formattedCount = this.formatNumber(recordIds.length);

    this.pendingAction.set({
      recordIds,
      field: definition.field,
      value: definition.value,
      title: 'تأیید عملیات گروهی',
      actionLabel: definition.actionLabel,
      description: `عملیات «${definition.actionLabel}» برای ${formattedCount} رکورد انتخاب‌شده اعمال شود؟`,
      isGroup: true
    });
  }

  closeStateConfirmation(): void {
    this.pendingAction.set(null);
  }

  confirmStateAction(): void {
    const action = this.pendingAction();

    if (!action) {
      return;
    }

    const targetIds = new Set(action.recordIds);
    this.records.update((records) => records.map((record) => targetIds.has(record.id)
      ? { ...record, [action.field]: action.value }
      : record));
    this.pendingAction.set(null);
    this.clearSelection();
    this.toastService.show(`عملیات «${action.actionLabel}» به‌صورت محلی اعمال شد.`, 'success');
  }

  openNotificationModal(record: CoveredEmployeeRecord): void {
    this.notificationText = '';
    this.notificationSubmissionAttempted.set(false);
    this.notificationRecord.set(record);
  }

  closeNotificationModal(): void {
    this.notificationRecord.set(null);
    this.notificationText = '';
    this.notificationSubmissionAttempted.set(false);
  }

  showNotificationError(): boolean {
    return this.notificationSubmissionAttempted() && this.notificationText.trim().length === 0;
  }

  submitNotification(): void {
    this.notificationSubmissionAttempted.set(true);

    if (this.showNotificationError()) {
      return;
    }

    this.closeNotificationModal();
    this.toastService.show('متن اطلاع‌رسانی در نسخه نمایشی بررسی شد.', 'success');
  }

  blockedActionLabel(record: CoveredEmployeeRecord): string {
    return record.isBlocked ? 'بازگشت از انسداد' : 'مسدود کردن';
  }

  ticketActionLabel(record: CoveredEmployeeRecord): string {
    return record.hasTicketAccess ? 'تیکت غیرمجاز' : 'تیکت مجاز';
  }

  employeeReference(record: CoveredEmployeeRecord): string {
    return record.name?.trim() || record.mobile;
  }

  isDangerousAction(action: PendingStateAction): boolean {
    return (action.field === 'isBlocked' && action.value)
      || (action.field === 'hasTicketAccess' && !action.value);
  }

  actionButtonClass(tone: 'primary' | 'success' | 'warning' | 'danger'): string {
    const toneClasses = {
      primary: 'border-primary/30 text-primary hover:bg-primary/10 focus:ring-primary/25',
      success: 'border-success/30 text-success hover:bg-success/10 focus:ring-success/25',
      warning: 'border-warning/30 text-warning hover:bg-warning/10 focus:ring-warning/25',
      danger: 'border-danger/30 text-danger hover:bg-danger/10 focus:ring-danger/25'
    };
    return `inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 ${toneClasses[tone]}`;
  }

  mobileActionButtonClass(tone: 'primary' | 'success' | 'warning' | 'danger'): string {
    const toneClasses = {
      primary: 'border-primary/30 text-primary hover:bg-primary/10 focus:ring-primary/25',
      success: 'border-success/30 text-success hover:bg-success/10 focus:ring-success/25',
      warning: 'border-warning/30 text-warning hover:bg-warning/10 focus:ring-warning/25',
      danger: 'border-danger/30 text-danger hover:bg-danger/10 focus:ring-danger/25'
    };
    return `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus:outline-none focus:ring-2 ${toneClasses[tone]}`;
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  private clearSelection(): void {
    this.selectedIds.set(new Set<number>());
    this.selectedGroupAction.set('');
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { EscToCloseDirective } from '../../../../shared/directives/esc-to-close.directive';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { Fish24RolePreviewService } from '../../../../core/fish24/dev/fish24-role-preview.service';
import { Fish24RoleId } from '../../../../core/fish24/models/fish24-role.model';
import { Fish24PermissionService } from '../../../../core/fish24/permissions/fish24-permission.service';
import { FISH24_PERMISSIONS } from '../../../../core/fish24/permissions/fish24-permissions';

type UserCapability = Fish24RoleId;
type RoleFilter = 'all' | UserCapability;
type ActiveFilter = 'all' | 'active' | 'inactive';
type Rank = 1 | 2 | 3 | 4 | 5;
type RankFilter = 'all' | Rank;
type EmployerApprovalFilter = 'all' | EmployerApprovalState;
type DocumentActivityFilter = 'all' | 'sent' | 'not-sent';
type UserType = 'حقیقی' | 'حقوقی';
type EmployerApprovalState = 'pending' | 'approved' | 'rejected';
type ConfirmationActionType = 'activation' | 'employer-approval' | 'enter-user-account';

interface BusinessUserRecord {
  readonly id: number;
  readonly mobile: string;
  readonly joinedAt: string;
  readonly fullName: string | null;
  readonly nationalId: string | null;
  readonly companyName: string;
  readonly email?: string;
  readonly birthDate?: string;
  readonly description?: string;
  readonly roles: readonly UserCapability[];
  readonly userType: UserType;
  readonly hasFreeCredit: boolean;
  readonly freeCreditExpiresAt: string | null;
  readonly rank: Rank;
  readonly lastOtpAt: string | null;
  readonly otpCount: number;
  readonly hasSentDocuments: boolean;
  readonly isActive: boolean;
  readonly employerApproval?: EmployerApprovalState;
}

interface RoleFilterOption {
  readonly id: RoleFilter;
  readonly label: string;
}

interface PendingConfirmation {
  readonly type: ConfirmationActionType;
  readonly userId: number;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly targetEmployerApproval?: EmployerApprovalState;
}

interface DeferredAction {
  readonly label: string;
  readonly hiddenForSupport?: boolean;
  readonly employerOnly?: boolean;
}

type GroupSmsAudience = 'search-results' | 'all';

const INTERNAL_ROLE_IDS: readonly Fish24RoleId[] = [
  'super-admin',
  'sales-expert',
  'support-expert'
];

const ROLE_LABELS: Readonly<Record<UserCapability, string>> = {
  'super-admin': 'مدیر سامانه',
  'sales-expert': 'کارشناس فروش',
  'support-expert': 'کارشناس پشتیبانی',
  employer: 'کارفرما',
  employee: 'کارمند'
};

const DEFERRED_ACTIONS: readonly DeferredAction[] = [
  { label: 'لیست ارسال‌ها', hiddenForSupport: true },
  { label: 'لیست تراکنش‌ها', hiddenForSupport: true },
  { label: 'تخصیص کوپن', hiddenForSupport: true },
  { label: 'لیست کوپن‌ها', hiddenForSupport: true },
  { label: 'ثبت نظر کارفرما', employerOnly: true }
];

@Component({
  selector: 'app-internal-users',
  standalone: true,
  imports: [EscToCloseDirective, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-4 animate-fade-in-up sm:space-y-5" dir="rtl">
      @if (hasUserManagementAccess()) {
        <header class="flex min-w-0 items-center gap-3 sm:gap-4">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
            <ui-icon name="users" [size]="29" class="text-primary"></ui-icon>
          </div>
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-primary sm:text-3xl">فهرست کاربران</h1>
            <p class="mt-0.5 text-sm leading-6 text-muted sm:mt-1 sm:text-base">مشاهده و مدیریت هویت‌های سراسری کاربران فیش۲۴</p>
          </div>
        </header>

        <section class="rounded-2xl border border-border bg-surface p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="internal-user-filters-title">
          <div class="mb-3 flex items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ui-icon name="sliders" [size]="19"></ui-icon>
            </div>
            <div>
              <h2 id="internal-user-filters-title" class="text-base font-extrabold text-foreground dark:text-slate-100 sm:text-lg">فیلتر کاربران</h2>
              <p class="mt-0.5 text-xs text-muted">فیلتر فهرست بر اساس مشخصات قطعی کاربر</p>
            </div>
          </div>

          <form class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" (submit)="applySearch($event)">
            <div>
              <label for="internal-user-role-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">نقش</label>
              <select
                id="internal-user-role-filter"
                [value]="roleFilter()"
                (change)="onRoleFilterChange($event)"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                @for (role of roleOptions; track role.id) {
                  <option [value]="role.id">{{ role.label }}</option>
                }
              </select>
            </div>

            <div>
              <label for="internal-user-rank-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">رتبه</label>
              <select id="internal-user-rank-filter" [value]="rankFilter()" (change)="onRankFilterChange($event)" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                <option value="all">لطفا رتبه را انتخاب کنید</option>
                @for (rank of rankOptions; track rank) {<option [value]="rank">{{ formatNumber(rank) }}</option>}
              </select>
            </div>

            <div>
              <label for="internal-user-name-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">نام</label>
              <input id="internal-user-name-filter" type="search" autocomplete="off" [value]="nameDraft()" (input)="onTextFilterInput($event, 'name')" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" placeholder="نام">
            </div>

            <div>
              <label for="internal-user-mobile-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">موبایل</label>
              <input id="internal-user-mobile-filter" type="search" inputmode="numeric" autocomplete="off" dir="ltr" [value]="mobileDraft()" (input)="onTextFilterInput($event, 'mobile')" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" placeholder="موبایل">
            </div>

            <div>
              <label for="internal-user-company-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">نام شرکت</label>
              <input id="internal-user-company-filter" type="search" autocomplete="off" [value]="companyDraft()" (input)="onTextFilterInput($event, 'company')" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" placeholder="نام شرکت">
            </div>

            <div>
              <label for="internal-user-approval-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">تأیید کارفرما</label>
              <select id="internal-user-approval-filter" [value]="employerApprovalFilter()" (change)="onEmployerApprovalFilterChange($event)" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                <option value="all">مشاهده همه</option>
                <option value="approved">تایید شده</option>
                <option value="rejected">تایید نشده</option>
                <option value="pending">در انتظار تایید</option>
              </select>
            </div>

            <div>
              <label for="internal-user-active-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">وضعیت کاربر</label>
              <select
                id="internal-user-active-filter"
                [value]="activeFilter()"
                (change)="onActiveFilterChange($event)"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                <option value="all">مشاهده همه</option>
                <option value="active">فقط کاربران فعال</option>
                <option value="inactive">فقط کاربران غیر فعال</option>
              </select>
            </div>

            <div>
              <label for="internal-user-document-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">وضعیت ارسال سند</label>
              <select id="internal-user-document-filter" [value]="documentActivityFilter()" (change)="onDocumentActivityFilterChange($event)" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                <option value="all">مشاهده همه</option>
                <option value="sent">فقط سند ارسال کرده ها</option>
                <option value="not-sent">فقط بدون سند ها</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2 sm:col-span-2 xl:col-span-4 xl:justify-self-end">
              <button type="submit" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">
                <ui-icon name="search" [size]="17"></ui-icon>
                جستجو
              </button>
              <button type="button" (click)="showAll()" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                مشاهده همه
              </button>
            </div>
          </form>
        </section>

        <section class="rounded-2xl border border-border bg-surface p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="internal-user-list-title">
          <div class="flex flex-col gap-3 border-b border-border pb-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="internal-user-list-title" class="text-base font-extrabold text-foreground dark:text-slate-100 sm:text-lg" aria-live="polite">
                فهرست کاربران ({{ formatNumber(filteredUsers().length) }} رکورد)
              </h2>
              <p class="mt-0.5 text-xs leading-5 text-muted">هر موبایل فقط یک هویت سراسری دارد؛ نقش‌های هم‌زمان در همان ردیف نمایش داده می‌شوند.</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              @if (canExportUsers()) {
                <button id="business-users-excel-export" type="button" (click)="exportFilteredUsers()" class="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-success/35 px-3 text-xs font-bold text-success transition-colors hover:bg-success/10 focus:outline-none focus:ring-2 focus:ring-success/25">
                  <ui-icon name="download" [size]="16"></ui-icon>خروجی Excel
                </button>
              }
              <button type="button" (click)="openCreateUser()" class="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-success px-3 text-xs font-bold text-white transition-colors hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-success/25">
                <ui-icon name="plus" [size]="16"></ui-icon>کارمند جدید
              </button>
              <button type="button" (click)="openGroupSms()" class="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/25">
                <ui-icon name="message-square" [size]="16"></ui-icon>ارسال پیامک گروهی
              </button>
            </div>
          </div>

          @if (filteredUsers().length > 0) {
            <div class="mt-3 hidden rounded-xl border border-border dark:border-slate-700 lg:block">
              <table class="w-full table-fixed text-[10px] xl:text-xs">
                <thead class="bg-background/80 dark:bg-slate-900/60">
                  <tr>
                    <th class="w-[11%] px-1.5 py-2.5 text-right font-bold text-muted">شناسه / عضویت</th>
                    <th class="w-[10%] px-1.5 py-2.5 text-right font-bold text-muted">نقش</th>
                    <th class="w-[18%] px-1.5 py-2.5 text-right font-bold text-muted">نام و موبایل</th>
                    <th class="w-[14%] px-1.5 py-2.5 text-right font-bold text-muted">نام شرکت</th>
                    <th class="w-[9%] px-1.5 py-2.5 text-right font-bold text-muted">نوع / رتبه</th>
                    <th class="w-[13%] px-1.5 py-2.5 text-right font-bold text-muted">اعتباری / انقضاء</th>
                    <th class="w-[19%] px-1.5 py-2.5 text-right font-bold text-muted">وضعیت / OTP</th>
                    <th class="w-[6%] px-1 py-2.5 text-center font-bold text-muted">عملیات</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border dark:divide-slate-700">
                  @for (user of filteredUsers(); track user.id) {
                    <tr class="transition-colors hover:bg-primary/5 dark:hover:bg-primary/10">
                      <td class="px-1.5 py-2.5 align-top"><p class="font-bold text-foreground dark:text-slate-200" dir="ltr">{{ user.id }}</p><p class="mt-1 font-semibold text-muted">{{ user.joinedAt }}</p></td>
                      <td class="break-words px-1.5 py-2.5 align-top"><div class="flex flex-wrap gap-1">@for (role of user.roles; track role) {<span class="rounded-full bg-primary/10 px-1.5 py-0.5 font-bold text-primary">{{ roleLabel(role) }}</span>}</div></td>
                      <td class="break-words px-1.5 py-2.5 align-top">
                        <div class="flex items-start gap-1">
                          @if (isEmployerApprovalPending(user)) {
                            <span title="در انتظار تأیید کارفرما" aria-label="در انتظار تأیید کارفرما" class="inline-flex shrink-0 text-warning"><ui-icon name="alert-triangle" [size]="14"></ui-icon></span>
                          }
                        @if (user.fullName) {
                          <span class="font-bold text-foreground dark:text-slate-100">{{ user.fullName }}</span>
                        } @else {
                          <span class="text-xs font-bold leading-5 text-danger">کاربر پروفایلش را تکمیل نکرده</span>
                        }
                        </div>
                        <p class="mt-1 break-all font-semibold text-muted" dir="ltr">{{ user.mobile }}</p>
                      </td>
                      <td class="break-words px-1.5 py-2.5 align-top font-semibold text-foreground dark:text-slate-200">{{ user.companyName }}</td>
                      <td class="px-1.5 py-2.5 align-top"><p class="font-semibold text-foreground dark:text-slate-200">{{ user.userType }}</p><p class="mt-1 text-muted">رتبه: <strong class="text-foreground dark:text-slate-100">{{ formatNumber(user.rank) }}</strong></p></td>
                      <td class="px-1.5 py-2.5 align-top"><p><span class="text-muted">اعتباری:</span> <strong [class]="user.hasFreeCredit ? 'text-success' : 'text-muted'">{{ user.hasFreeCredit ? 'بله' : 'خیر' }}</strong></p><p class="mt-1 break-words text-foreground dark:text-slate-200"><span class="text-muted">انقضاء:</span> {{ user.freeCreditExpiresAt || '' }}</p></td>
                      <td class="px-1.5 py-2.5 align-top"><span [class]="statusClass(user.isActive)">{{ user.isActive ? 'فعال' : 'غیرفعال' }}</span><p class="mt-1 break-words text-foreground dark:text-slate-200"><span class="text-muted">آخرین OTP:</span> {{ user.lastOtpAt || '' }}</p><p class="mt-1 text-foreground dark:text-slate-200"><span class="text-muted">تعداد OTP:</span> {{ formatNumber(user.otpCount) }}</p></td>
                      <td class="px-1 py-2.5 text-center align-top">
                        <button type="button" (click)="openOperations(user)" [attr.aria-label]="'عملیات کاربر ' + user.mobile" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25">
                          <ui-icon name="sliders" [size]="15"></ui-icon>
                          <span class="sr-only">عملیات</span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="mt-3 space-y-2.5 lg:hidden">
              @for (user of filteredUsers(); track user.id) {
                <article class="rounded-xl border border-border bg-background/55 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="flex items-start gap-1.5 font-bold text-foreground dark:text-slate-100">
                        @if (isEmployerApprovalPending(user)) {
                          <span title="در انتظار تأیید کارفرما" aria-label="در انتظار تأیید کارفرما" class="mt-0.5 inline-flex shrink-0 text-warning"><ui-icon name="alert-triangle" [size]="16"></ui-icon></span>
                        }
                        <span>{{ user.fullName || 'کاربر پروفایلش را تکمیل نکرده' }}</span>
                      </p>
                      <p class="mt-1 text-sm font-semibold text-muted" dir="ltr">{{ user.mobile }}</p>
                    </div>
                    <span [class]="statusClass(user.isActive)">{{ user.isActive ? 'فعال' : 'غیرفعال' }}</span>
                  </div>

                  <dl class="mt-3 grid grid-cols-2 gap-2 border-y border-border py-2.5 text-xs dark:border-slate-700">
                    <div>
                      <dt class="text-muted">عضویت</dt>
                      <dd class="mt-1 font-bold text-foreground dark:text-slate-200">{{ user.joinedAt }}</dd>
                    </div>
                    <div>
                      <dt class="text-muted">نام شرکت</dt>
                      <dd class="mt-1 min-h-4 font-bold text-foreground dark:text-slate-200">{{ user.companyName }}</dd>
                    </div>
                    <div>
                      <dt class="text-muted">نوع</dt>
                      <dd class="mt-1 font-bold text-foreground dark:text-slate-200">{{ user.userType }}</dd>
                    </div>
                    <div>
                      <dt class="text-muted">رتبه</dt>
                      <dd class="mt-1 font-bold text-foreground dark:text-slate-200">{{ formatNumber(user.rank) }}</dd>
                    </div>
                    <div>
                      <dt class="text-muted">اعتباری</dt>
                      <dd class="mt-1 font-bold" [class.text-success]="user.hasFreeCredit" [class.text-muted]="!user.hasFreeCredit">{{ user.hasFreeCredit ? 'بله' : 'خیر' }}</dd>
                    </div>
                    <div>
                      <dt class="text-muted">وضعیت کارفرما</dt>
                      <dd class="mt-1">
                        @if (hasEmployerCapability(user)) {
                          <span [class]="approvalClass(user.employerApproval)">{{ employerApprovalLabel(user.employerApproval) }}</span>
                        } @else {
                          <span class="font-bold text-muted">—</span>
                        }
                      </dd>
                    </div>
                  </dl>

                  <details class="border-b border-border py-2.5 text-xs dark:border-slate-700">
                    <summary class="cursor-pointer font-bold text-primary">جزئیات عملیاتی</summary>
                    <dl class="mt-2 grid grid-cols-2 gap-2">
                      <div><dt class="text-muted">کد ملی</dt><dd class="mt-1 font-bold text-foreground dark:text-slate-200" dir="ltr">{{ user.nationalId || '—' }}</dd></div>
                      <div><dt class="text-muted">انقضاء اعتبار</dt><dd class="mt-1 min-h-4 font-bold text-foreground dark:text-slate-200">{{ user.freeCreditExpiresAt || '' }}</dd></div>
                      <div><dt class="text-muted">آخرین OTP</dt><dd class="mt-1 min-h-4 font-bold text-foreground dark:text-slate-200">{{ user.lastOtpAt || '' }}</dd></div>
                      <div><dt class="text-muted">تعداد OTP</dt><dd class="mt-1 font-bold text-foreground dark:text-slate-200">{{ formatNumber(user.otpCount) }}</dd></div>
                    </dl>
                  </details>

                  <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div class="flex flex-wrap gap-1">@for (role of user.roles; track role) {<span class="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{{ roleLabel(role) }}</span>}</div>
                    <button type="button" (click)="openOperations(user)" [attr.aria-label]="'عملیات کاربر ' + user.mobile" class="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-primary/30 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25">
                      <ui-icon name="sliders" [size]="15"></ui-icon>
                      عملیات
                    </button>
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="mt-3 rounded-xl border border-dashed border-border bg-background/50 p-8 text-center dark:border-slate-600 dark:bg-slate-900/30">
              <ui-icon name="search" [size]="30" class="mx-auto text-muted"></ui-icon>
              <p class="mt-2 text-sm font-bold text-foreground dark:text-slate-200">کاربری مطابق فیلترها پیدا نشد.</p>
            </div>
          }
        </section>

        @if (isCreateUserOpen()) {
          <div appEscToClose (escPressed)="closeCreateUser()" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 pt-5 backdrop-blur-sm sm:items-center sm:pt-3" (click)="closeCreateUser()">
            <section role="dialog" aria-modal="true" aria-labelledby="internal-create-user-title" class="my-auto w-full max-w-3xl rounded-2xl border border-border bg-surface shadow-2xl dark:border-slate-700 dark:bg-slate-800" (click)="$event.stopPropagation()">
              <div class="flex items-center justify-between border-b border-border p-4 dark:border-slate-700">
                <h2 id="internal-create-user-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">ایجاد کاربر</h2>
                <button type="button" (click)="closeCreateUser()" aria-label="بستن ایجاد کاربر" class="rounded-lg p-2 text-muted hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 dark:hover:bg-slate-700"><ui-icon name="x" [size]="19"></ui-icon></button>
              </div>

              <form class="p-4 sm:p-5" (submit)="createEmployee($event)" novalidate>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label for="new-employee-full-name" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">نام کامل</label>
                    <input id="new-employee-full-name" type="text" autocomplete="name" [value]="newEmployeeName()" (input)="newEmployeeName.set(inputValue($event))" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                  </div>
                  <div>
                    <label for="new-employee-mobile" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">موبایل</label>
                    <input id="new-employee-mobile" type="text" inputmode="numeric" maxlength="11" autocomplete="tel" dir="ltr" [value]="newEmployeeMobile()" (input)="onNewEmployeeNumericInput($event, 'mobile')" [attr.aria-invalid]="createUserAttempted() && !isNewEmployeeMobileValid()" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                    @if (createUserAttempted() && !isNewEmployeeMobileValid()) {<p role="alert" class="mt-1.5 text-xs font-semibold text-danger">{{ newEmployeeMobileError() }}</p>}
                  </div>
                  <div>
                    <label for="new-employee-national-id" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">کد ملی</label>
                    <input id="new-employee-national-id" type="text" inputmode="numeric" maxlength="10" autocomplete="off" dir="ltr" [value]="newEmployeeNationalId()" (input)="onNewEmployeeNumericInput($event, 'nationalId')" [attr.aria-invalid]="createUserAttempted() && !isNewEmployeeNationalIdValid()" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                    @if (createUserAttempted() && !isNewEmployeeNationalIdValid()) {<p role="alert" class="mt-1.5 text-xs font-semibold text-danger">کد ملی باید دقیقاً ۱۰ رقم باشد.</p>}
                  </div>
                  <div>
                    <label for="new-employee-email" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">ایمیل</label>
                    <input id="new-employee-email" type="email" autocomplete="email" dir="ltr" [value]="newEmployeeEmail()" (input)="newEmployeeEmail.set(inputValue($event))" [attr.aria-invalid]="createUserAttempted() && !isNewEmployeeEmailValid()" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                    @if (createUserAttempted() && !isNewEmployeeEmailValid()) {<p role="alert" class="mt-1.5 text-xs font-semibold text-danger">ایمیل واردشده معتبر نیست.</p>}
                  </div>
                  <div>
                    <label for="new-employee-birth-date" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">تاریخ تولد</label>
                    <input id="new-employee-birth-date" type="text" autocomplete="off" dir="ltr" [value]="newEmployeeBirthDate()" (input)="newEmployeeBirthDate.set(inputValue($event))" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                  </div>
                  <div class="sm:col-span-2">
                    <label for="new-employee-description" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">توضیحات</label>
                    <textarea id="new-employee-description" rows="3" [value]="newEmployeeDescription()" (input)="newEmployeeDescription.set(inputValue($event))" class="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"></textarea>
                  </div>
                </div>

                <div class="mt-5 flex border-t border-border pt-4 dark:border-slate-700">
                  <button type="submit" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-success px-5 text-sm font-bold text-white hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-success/25"><ui-icon name="check" [size]="17"></ui-icon>ثبت کاربر</button>
                </div>
              </form>
            </section>
          </div>
        }

        @if (isGroupSmsOpen()) {
          <div appEscToClose (escPressed)="closeGroupSms()" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 pt-5 backdrop-blur-sm sm:items-center sm:pt-3" (click)="closeGroupSms()">
            <section role="dialog" aria-modal="true" aria-labelledby="internal-group-sms-title" class="my-auto w-full max-w-3xl rounded-2xl border border-border bg-surface shadow-2xl dark:border-slate-700 dark:bg-slate-800" (click)="$event.stopPropagation()">
              <div class="flex items-center justify-between border-b border-border p-4 dark:border-slate-700">
                <h2 id="internal-group-sms-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">ارسال پیامک به کارفرما</h2>
                <button type="button" (click)="closeGroupSms()" aria-label="بستن ارسال پیامک گروهی" class="rounded-lg p-2 text-muted hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 dark:hover:bg-slate-700"><ui-icon name="x" [size]="19"></ui-icon></button>
              </div>

              <form class="p-4 sm:p-5" (submit)="submitGroupSms($event)" novalidate>
                <label for="group-sms-message" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">متن</label>
                <textarea id="group-sms-message" rows="3" [value]="groupSmsMessage()" (input)="groupSmsMessage.set(inputValue($event))" [attr.aria-invalid]="groupSmsAttempted() && !groupSmsMessage().trim()" class="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"></textarea>
                @if (groupSmsAttempted() && !groupSmsMessage().trim()) {<p role="alert" class="mt-1.5 text-xs font-semibold text-danger">متن پیامک را وارد کنید.</p>}

                <fieldset class="mt-4 space-y-2 border-b border-border pb-4 dark:border-slate-700">
                  <label class="flex cursor-pointer items-center gap-2 text-sm font-bold text-foreground dark:text-slate-200">
                    <input type="radio" name="group-sms-audience" value="search-results" [checked]="groupSmsAudience() === 'search-results'" (change)="groupSmsAudience.set('search-results')" class="h-4 w-4 accent-primary">
                    ارسال به نتایج جستجو
                  </label>
                  <label class="flex cursor-pointer items-center gap-2 text-sm font-bold text-foreground dark:text-slate-200">
                    <input type="radio" name="group-sms-audience" value="all" [checked]="groupSmsAudience() === 'all'" (change)="groupSmsAudience.set('all')" class="h-4 w-4 accent-primary">
                    ارسال به همه
                  </label>
                </fieldset>

                <div class="mt-4 flex">
                  <button type="submit" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/25"><ui-icon name="check" [size]="17"></ui-icon>ارسال</button>
                </div>
              </form>
            </section>
          </div>
        }

        @if (operationsUser(); as user) {
          <div appEscToClose (escPressed)="closeOperations()" class="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:items-center" (click)="closeOperations()">
            <section role="dialog" aria-modal="true" aria-labelledby="internal-user-operations-title" class="my-auto w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl dark:border-slate-700 dark:bg-slate-800" (click)="$event.stopPropagation()">
              <div class="flex items-start justify-between gap-3 border-b border-border p-4 dark:border-slate-700">
                <div>
                  <h2 id="internal-user-operations-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">عملیات کاربر</h2>
                  <p class="mt-1 text-sm font-semibold text-muted" dir="ltr">{{ user.mobile }}</p>
                </div>
                <button type="button" (click)="closeOperations()" aria-label="بستن عملیات" class="rounded-lg p-2 text-muted hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 dark:hover:bg-slate-700"><ui-icon name="x" [size]="19"></ui-icon></button>
              </div>

              <div class="p-4">
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button type="button" (click)="openEdit(user)" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 px-3 text-sm font-bold text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25">
                    <ui-icon name="edit" [size]="17"></ui-icon>
                    ویرایش
                  </button>
                  <button type="button" (click)="requestActivationChange(user)" [class]="user.isActive ? 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-danger/30 px-3 text-sm font-bold text-danger hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger/25' : 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-success/30 px-3 text-sm font-bold text-success hover:bg-success/10 focus:outline-none focus:ring-2 focus:ring-success/25'">
                    <ui-icon [name]="user.isActive ? 'lock' : 'check-circle'" [size]="17"></ui-icon>
                    {{ user.isActive ? 'غیرفعال کردن' : 'فعال کردن' }}
                  </button>
                  @if (hasEmployerCapability(user)) {
                    <button type="button" (click)="requestEmployerApprovalChange(user)" [class]="user.employerApproval !== 'approved' ? 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:col-span-2' : 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-warning/40 px-3 text-sm font-bold text-warning hover:bg-warning/10 focus:outline-none focus:ring-2 focus:ring-warning/25 sm:col-span-2'">
                      <ui-icon [name]="user.employerApproval !== 'approved' ? 'check-circle' : 'x'" [size]="17"></ui-icon>
                      {{ user.employerApproval !== 'approved' ? 'تأیید کارفرما' : 'عدم تأیید کارفرما' }}
                    </button>
                  }
                  <button type="button" (click)="openDirectSms(user)" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 px-3 text-sm font-bold text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25">
                    <ui-icon name="message-square" [size]="17"></ui-icon>
                    ارسال پیامک
                  </button>
                  <button type="button" (click)="requestEnterUserAccount(user)" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-success/30 px-3 text-sm font-bold text-success hover:bg-success/10 focus:outline-none focus:ring-2 focus:ring-success/25">
                    <ui-icon name="login" [size]="17"></ui-icon>
                    ورود به حساب کاربری
                  </button>
                </div>

                <div class="mt-4 border-t border-border pt-4 dark:border-slate-700">
                  <p class="mb-2 text-xs font-bold text-muted">عملیات مراحل بعد</p>
                  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    @for (action of visibleDeferredActions(user); track action.label) {
                      <button type="button" disabled aria-disabled="true" [attr.title]="action.label + ' نیازمند تعریف جریان تجاری است'" class="flex min-h-14 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background/60 px-2 text-xs font-bold text-muted opacity-75 dark:border-slate-700 dark:bg-slate-900/40">
                        <span>{{ action.label }}</span>
                        <span class="text-[9px] text-primary">در مرحله بعد</span>
                      </button>
                    }
                  </div>
                </div>
              </div>
            </section>
          </div>
        }

        @if (directSmsUser(); as user) {
          <div appEscToClose (escPressed)="closeDirectSms()" class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm" (click)="closeDirectSms()">
            <section role="dialog" aria-modal="true" aria-labelledby="internal-direct-sms-title" class="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl dark:border-slate-700 dark:bg-slate-800" (click)="$event.stopPropagation()">
              <div class="flex items-start justify-between gap-3 border-b border-border p-4 dark:border-slate-700">
                <div>
                  <h2 id="internal-direct-sms-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">ارسال پیامک</h2>
                  <p class="mt-1 text-xs leading-5 text-muted">گیرنده: {{ user.fullName || 'کاربر پروفایلش را تکمیل نکرده' }}</p>
                  <p class="text-sm font-bold text-foreground dark:text-slate-200" dir="ltr">{{ user.mobile }}</p>
                </div>
                <button type="button" (click)="closeDirectSms()" aria-label="بستن ارسال پیامک" class="rounded-lg p-2 text-muted hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 dark:hover:bg-slate-700"><ui-icon name="x" [size]="19"></ui-icon></button>
              </div>
              <form class="p-4" (submit)="submitDirectSms($event)" novalidate>
                <label for="internal-direct-sms-message" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">متن</label>
                <textarea id="internal-direct-sms-message" rows="4" [value]="directSmsMessage()" (input)="directSmsMessage.set(inputValue($event))" [attr.aria-invalid]="directSmsAttempted() && !directSmsMessage().trim()" class="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"></textarea>
                @if (directSmsAttempted() && !directSmsMessage().trim()) {<p role="alert" class="mt-1.5 text-xs font-semibold text-danger">متن پیامک را وارد کنید.</p>}
                <div class="mt-4 flex flex-col-reverse gap-2 border-t border-border pt-4 dark:border-slate-700 sm:flex-row sm:justify-end">
                  <button type="button" (click)="closeDirectSms()" class="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:bg-background dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">انصراف</button>
                  <button type="submit" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/25"><ui-icon name="check" [size]="17"></ui-icon>ارسال</button>
                </div>
              </form>
            </section>
          </div>
        }

        @if (editingUser(); as user) {
          <div appEscToClose (escPressed)="closeEdit()" class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-3 pt-6 backdrop-blur-sm sm:items-center sm:pt-3" (click)="closeEdit()">
            <section role="dialog" aria-modal="true" aria-labelledby="internal-user-edit-title" class="my-auto w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl dark:border-slate-700 dark:bg-slate-800" (click)="$event.stopPropagation()">
              <div class="flex items-start justify-between gap-3 border-b border-border p-4 dark:border-slate-700">
                <div>
                  <h2 id="internal-user-edit-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">ویرایش اطلاعات کاربر</h2>
                  <p class="mt-1 text-xs leading-5 text-muted">موبایل و نقش‌ها در این مرحله قابل تغییر نیستند.</p>
                </div>
                <button type="button" (click)="closeEdit()" aria-label="بستن ویرایش" class="rounded-lg p-2 text-muted hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 dark:hover:bg-slate-700"><ui-icon name="x" [size]="19"></ui-icon></button>
              </div>

              <form class="space-y-4 p-4" (submit)="saveEdit($event)" novalidate>
                <div>
                  <label for="internal-edit-mobile" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">شماره موبایل</label>
                  <input id="internal-edit-mobile" type="text" [value]="user.mobile" readonly aria-readonly="true" dir="ltr" class="h-11 w-full cursor-not-allowed rounded-xl border border-border bg-background/60 px-3 text-sm font-bold text-muted outline-none dark:border-slate-600 dark:bg-slate-900/60">
                </div>

                <div>
                  <label for="internal-edit-name" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">نام و نام خانوادگی</label>
                  <input id="internal-edit-name" type="text" [value]="editName()" (input)="onEditNameInput($event)" [attr.aria-invalid]="editAttempted() && !isEditNameValid()" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                  @if (editAttempted() && !isEditNameValid()) {
                    <p role="alert" class="mt-1.5 text-xs font-semibold text-danger">نام و نام خانوادگی را وارد کنید.</p>
                  }
                </div>

                <div>
                  <label for="internal-edit-national-id" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">کد ملی</label>
                  <input id="internal-edit-national-id" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="10" autocomplete="off" dir="ltr" [value]="editNationalId()" (input)="onEditNationalIdInput($event)" [attr.aria-invalid]="editAttempted() && !isEditNationalIdValid()" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                  @if (editAttempted() && !isEditNationalIdValid()) {
                    <p role="alert" class="mt-1.5 text-xs font-semibold text-danger">{{ editNationalIdError() }}</p>
                  }
                </div>

                <div>
                  <p class="mb-1.5 text-sm font-bold text-foreground dark:text-slate-200">نقش‌ها</p>
                  <div class="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background/60 px-3 py-2 dark:border-slate-600 dark:bg-slate-900/60">
                    @for (role of user.roles; track role) {<span class="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{{ roleLabel(role) }}</span>}
                  </div>
                </div>

                <div class="flex flex-col-reverse gap-2 border-t border-border pt-4 dark:border-slate-700 sm:flex-row sm:justify-end">
                  <button type="button" (click)="closeEdit()" class="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:bg-background dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">انصراف</button>
                  <button type="submit" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30"><ui-icon name="save" [size]="17"></ui-icon>ذخیره تغییرات</button>
                </div>
              </form>
            </section>
          </div>
        }

        @if (pendingConfirmation(); as confirmation) {
          <div appEscToClose (escPressed)="cancelConfirmation()" class="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm" (click)="cancelConfirmation()">
            <section role="alertdialog" aria-modal="true" aria-labelledby="internal-user-confirm-title" aria-describedby="internal-user-confirm-message" class="w-full max-w-md rounded-2xl border border-border bg-surface p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800" (click)="$event.stopPropagation()">
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning"><ui-icon name="alert-triangle" [size]="21"></ui-icon></div>
                <div>
                  <h2 id="internal-user-confirm-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">{{ confirmation.title }}</h2>
                  <p id="internal-user-confirm-message" class="mt-2 text-sm leading-7 text-muted">{{ confirmation.message }}</p>
                </div>
              </div>
              <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" (click)="cancelConfirmation()" class="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:bg-background dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">انصراف</button>
                <button type="button" (click)="confirmPendingAction()" class="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">{{ confirmation.confirmLabel }}</button>
              </div>
            </section>
          </div>
        }
      } @else {
        <section class="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="user-management-unavailable-title">
          <ui-icon name="shield-alert" [size]="38" class="mx-auto text-muted"></ui-icon>
          <h1 id="user-management-unavailable-title" class="mt-3 text-xl font-extrabold text-foreground dark:text-slate-100">مدیریت کاربران در دسترس نیست</h1>
          <p class="mt-2 text-sm leading-6 text-muted">نقش فعال مجوز مدیریت کاربران را ندارد.</p>
        </section>
      }
    </div>
  `
})
export class InternalUsersComponent {
  private readonly permissionService = inject(Fish24PermissionService);
  private readonly previewRoleService = inject(Fish24RolePreviewService);
  private readonly toastService = inject(ToastService);

  readonly deferredActions = DEFERRED_ACTIONS;
  readonly rankOptions: readonly Rank[] = [1, 2, 3, 4, 5];
  readonly roleOptions: readonly RoleFilterOption[] = [
    { id: 'all', label: 'لطفا نقش را انتخاب کنید' },
    { id: 'employer', label: 'کارفرما' },
    { id: 'employee', label: 'کارمند' }
  ];

  readonly users = signal<readonly BusinessUserRecord[]>([
    {
      id: 1001,
      mobile: '09121234567',
      joinedAt: '۱۴۰۳/۰۲/۱۸',
      fullName: 'مریم احمدی',
      nationalId: '0012345678',
      companyName: 'مجموعه نمونه سپهر',
      roles: ['employer', 'employee'],
      userType: 'حقوقی',
      hasFreeCredit: false,
      freeCreditExpiresAt: null,
      rank: 1,
      lastOtpAt: '۱۴۰۵/۰۶/۱۹ - ۱۰:۳۵',
      otpCount: 1,
      hasSentDocuments: true,
      isActive: true,
      employerApproval: 'approved'
    },
    {
      id: 1002,
      mobile: '09129876543',
      joinedAt: '۱۴۰۳/۰۵/۰۹',
      fullName: 'رضا کریمی',
      nationalId: '1234567890',
      companyName: 'شرکت راهکار نوین',
      roles: ['employer'],
      userType: 'حقوقی',
      hasFreeCredit: true,
      freeCreditExpiresAt: '۱۴۰۵/۱۲/۲۹',
      rank: 2,
      lastOtpAt: '۱۴۰۵/۰۶/۱۸ - ۰۹:۲۰',
      otpCount: 4,
      hasSentDocuments: true,
      isActive: true,
      employerApproval: 'pending'
    },
    {
      id: 1003,
      mobile: '09350000001',
      joinedAt: '۱۴۰۳/۰۶/۲۱',
      fullName: null,
      nationalId: null,
      companyName: '',
      roles: ['employee'],
      userType: 'حقیقی',
      hasFreeCredit: false,
      freeCreditExpiresAt: null,
      rank: 3,
      lastOtpAt: null,
      otpCount: 0,
      hasSentDocuments: false,
      isActive: true
    },
    {
      id: 1007,
      mobile: '09123334455',
      joinedAt: '۱۴۰۳/۰۷/۱۲',
      fullName: 'حامد اکبری',
      nationalId: '0098765432',
      companyName: 'کارگاه توسعه پارس',
      roles: ['employer'],
      userType: 'حقوقی',
      hasFreeCredit: true,
      freeCreditExpiresAt: '۱۴۰۶/۰۱/۳۱',
      rank: 4,
      lastOtpAt: null,
      otpCount: 0,
      hasSentDocuments: false,
      isActive: false,
      employerApproval: 'rejected'
    }
  ]);

  readonly nameDraft = signal('');
  readonly mobileDraft = signal('');
  readonly companyDraft = signal('');
  readonly nameQuery = signal('');
  readonly mobileQuery = signal('');
  readonly companyQuery = signal('');
  readonly roleFilter = signal<RoleFilter>('all');
  readonly rankFilter = signal<RankFilter>('all');
  readonly activeFilter = signal<ActiveFilter>('all');
  readonly employerApprovalFilter = signal<EmployerApprovalFilter>('all');
  readonly documentActivityFilter = signal<DocumentActivityFilter>('all');
  readonly isCreateUserOpen = signal(false);
  readonly createUserAttempted = signal(false);
  readonly newEmployeeName = signal('');
  readonly newEmployeeMobile = signal('');
  readonly newEmployeeNationalId = signal('');
  readonly newEmployeeEmail = signal('');
  readonly newEmployeeBirthDate = signal('');
  readonly newEmployeeDescription = signal('');
  readonly isGroupSmsOpen = signal(false);
  readonly groupSmsAttempted = signal(false);
  readonly groupSmsMessage = signal('');
  readonly groupSmsAudience = signal<GroupSmsAudience>('search-results');
  readonly directSmsUserId = signal<number | null>(null);
  readonly directSmsMessage = signal('');
  readonly directSmsAttempted = signal(false);
  readonly operationsUserId = signal<number | null>(null);
  readonly editingUserId = signal<number | null>(null);
  readonly editName = signal('');
  readonly editNationalId = signal('');
  readonly editNationalIdHadNonDigit = signal(false);
  readonly editAttempted = signal(false);
  readonly pendingConfirmation = signal<PendingConfirmation | null>(null);

  readonly activeRoles = computed(() => this.previewRoleService.getPreviewRoles());

  readonly hasUserManagementAccess = computed(() => {
    const roles = this.activeRoles();
    return roles.some(role => INTERNAL_ROLE_IDS.includes(role))
      && this.permissionService.hasPermission(roles, FISH24_PERMISSIONS.userManagement);
  });

  readonly isSuperAdminView = computed(() => this.activeRoles().includes('super-admin'));
  readonly isSupportView = computed(() => !this.isSuperAdminView() && this.activeRoles().includes('support-expert'));
  readonly canExportUsers = computed(() => this.isSuperAdminView() || this.activeRoles().includes('sales-expert'));

  readonly filteredUsers = computed(() => {
    const name = this.normalizeSearchValue(this.nameQuery().trim());
    const mobile = this.normalizeSearchValue(this.mobileQuery().trim());
    const company = this.normalizeSearchValue(this.companyQuery().trim());
    const role = this.roleFilter();
    const rank = this.rankFilter();
    const active = this.activeFilter();
    const approval = this.employerApprovalFilter();
    const documentActivity = this.documentActivityFilter();

    return this.users().filter(user => {
      const matchesName = !name || this.normalizeSearchValue(user.fullName ?? '').includes(name);
      const matchesMobile = !mobile || this.normalizeSearchValue(user.mobile).includes(mobile);
      const matchesCompany = !company || this.normalizeSearchValue(user.companyName).includes(company);
      const matchesRole = role === 'all' || user.roles.includes(role);
      const matchesRank = rank === 'all' || user.rank === rank;
      const matchesActive = active === 'all'
        || (active === 'active' ? user.isActive : !user.isActive);
      const matchesApproval = approval === 'all' || user.employerApproval === approval;
      const matchesDocumentActivity = documentActivity === 'all'
        || (documentActivity === 'sent' ? user.hasSentDocuments : !user.hasSentDocuments);
      return matchesName && matchesMobile && matchesCompany && matchesRole
        && matchesRank && matchesActive && matchesApproval && matchesDocumentActivity;
    });
  });

  readonly operationsUser = computed(() => this.findUser(this.operationsUserId()));
  readonly editingUser = computed(() => this.findUser(this.editingUserId()));
  readonly directSmsUser = computed(() => this.findUser(this.directSmsUserId()));

  onTextFilterInput(event: Event, field: 'name' | 'mobile' | 'company'): void {
    const value = (event.target as HTMLInputElement).value;
    if (field === 'name') {
      this.nameDraft.set(value);
    } else if (field === 'mobile') {
      this.mobileDraft.set(value);
    } else {
      this.companyDraft.set(value);
    }
  }

  applySearch(event: Event): void {
    event.preventDefault();
    this.nameQuery.set(this.nameDraft().trim());
    this.mobileQuery.set(this.mobileDraft().trim());
    this.companyQuery.set(this.companyDraft().trim());
  }

  onRoleFilterChange(event: Event): void {
    this.roleFilter.set((event.target as HTMLSelectElement).value as RoleFilter);
  }

  onActiveFilterChange(event: Event): void {
    this.activeFilter.set((event.target as HTMLSelectElement).value as ActiveFilter);
  }

  onRankFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.rankFilter.set(value === 'all' ? 'all' : Number(value) as Rank);
  }

  onEmployerApprovalFilterChange(event: Event): void {
    this.employerApprovalFilter.set((event.target as HTMLSelectElement).value as EmployerApprovalFilter);
  }

  onDocumentActivityFilterChange(event: Event): void {
    this.documentActivityFilter.set((event.target as HTMLSelectElement).value as DocumentActivityFilter);
  }

  showAll(): void {
    this.nameDraft.set('');
    this.mobileDraft.set('');
    this.companyDraft.set('');
    this.nameQuery.set('');
    this.mobileQuery.set('');
    this.companyQuery.set('');
    this.roleFilter.set('all');
    this.rankFilter.set('all');
    this.activeFilter.set('all');
    this.employerApprovalFilter.set('all');
    this.documentActivityFilter.set('all');
  }

  exportFilteredUsers(): void {
    if (!this.canExportUsers()) {
      return;
    }

    const headers = [
      'شناسه', 'عضویت', 'نقش', 'نام و نام خانوادگی', 'نام شرکت', 'موبایل',
      'نوع', 'اعتباری', 'رتبه', 'وضعیت', 'انقضاء', 'آخرین OTP', 'تعداد OTP'
    ];
    const rows = this.filteredUsers().map(user => [
      String(user.id),
      user.joinedAt,
      user.roles.map(role => this.roleLabel(role)).join('، '),
      user.fullName ?? '',
      user.companyName,
      user.mobile,
      user.userType,
      user.hasFreeCredit ? 'بله' : 'خیر',
      String(user.rank),
      user.isActive ? 'فعال' : 'غیرفعال',
      user.freeCreditExpiresAt ?? '',
      user.lastOtpAt ?? '',
      String(user.otpCount)
    ]);
    const tableHeader = headers.map(header => `<th>${this.escapeSpreadsheetHtml(header)}</th>`).join('');
    const tableRows = rows.map(row => `<tr>${row.map(value => `<td style="mso-number-format:'\\@'">${this.escapeSpreadsheetHtml(value)}</td>`).join('')}</tr>`).join('');
    const workbook = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"></head><body><table><thead><tr>${tableHeader}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
    const blob = new Blob([`\uFEFF${workbook}`], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = 'fish24-business-users.xls';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
    this.toastService.show(`${this.formatNumber(rows.length)} رکورد فیلترشده برای Excel آماده شد.`, 'success');
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  openCreateUser(): void {
    this.resetNewEmployeeForm();
    this.isCreateUserOpen.set(true);
  }

  closeCreateUser(): void {
    this.isCreateUserOpen.set(false);
    this.createUserAttempted.set(false);
  }

  onNewEmployeeNumericInput(event: Event, field: 'mobile' | 'nationalId'): void {
    const input = event.target as HTMLInputElement;
    const maximumLength = field === 'mobile' ? 11 : 10;
    const value = this.normalizeDigits(input.value).slice(0, maximumLength);
    input.value = value;
    if (field === 'mobile') {
      this.newEmployeeMobile.set(value);
    } else {
      this.newEmployeeNationalId.set(value);
    }
  }

  isNewEmployeeMobileValid(): boolean {
    const mobile = this.newEmployeeMobile();
    return /^09\d{9}$/.test(mobile) && !this.users().some(user => user.mobile === mobile);
  }

  newEmployeeMobileError(): string {
    const mobile = this.newEmployeeMobile();
    if (!/^09\d{9}$/.test(mobile)) {
      return 'موبایل باید ۱۱ رقم و با ۰۹ شروع شود.';
    }
    return 'این موبایل قبلاً به‌عنوان هویت کاربر ثبت شده است.';
  }

  isNewEmployeeNationalIdValid(): boolean {
    const nationalId = this.newEmployeeNationalId();
    return !nationalId || /^\d{10}$/.test(nationalId);
  }

  isNewEmployeeEmailValid(): boolean {
    const email = this.newEmployeeEmail().trim();
    return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  createEmployee(event: Event): void {
    event.preventDefault();
    this.createUserAttempted.set(true);

    if (!this.isNewEmployeeMobileValid() || !this.isNewEmployeeNationalIdValid() || !this.isNewEmployeeEmailValid()) {
      return;
    }

    const nextId = Math.max(...this.users().map(user => user.id)) + 1;
    const fullName = this.newEmployeeName().trim();
    this.users.update(users => [
      ...users,
      {
        id: nextId,
        mobile: this.newEmployeeMobile(),
        joinedAt: this.currentJalaliDate(),
        fullName: fullName || null,
        nationalId: this.newEmployeeNationalId() || null,
        companyName: '',
        email: this.newEmployeeEmail().trim() || undefined,
        birthDate: this.newEmployeeBirthDate().trim() || undefined,
        description: this.newEmployeeDescription().trim() || undefined,
        roles: ['employee'],
        userType: 'حقیقی',
        hasFreeCredit: false,
        freeCreditExpiresAt: null,
        rank: 1,
        lastOtpAt: null,
        otpCount: 0,
        hasSentDocuments: false,
        isActive: true
      }
    ]);
    this.closeCreateUser();
    this.toastService.show('کارمند جدید فقط در پیش‌نمایش فعلی ثبت شد.', 'success');
  }

  openGroupSms(): void {
    this.groupSmsMessage.set('');
    this.groupSmsAudience.set('search-results');
    this.groupSmsAttempted.set(false);
    this.isGroupSmsOpen.set(true);
  }

  closeGroupSms(): void {
    this.isGroupSmsOpen.set(false);
    this.groupSmsAttempted.set(false);
  }

  submitGroupSms(event: Event): void {
    event.preventDefault();
    this.groupSmsAttempted.set(true);
    if (!this.groupSmsMessage().trim()) {
      return;
    }

    this.closeGroupSms();
    this.toastService.show('ارسال واقعی انجام نشد؛ پیامک فقط در پیش‌نمایش بررسی شد.');
  }

  openOperations(user: BusinessUserRecord): void {
    this.operationsUserId.set(user.id);
  }

  closeOperations(): void {
    this.operationsUserId.set(null);
  }

  openDirectSms(user: BusinessUserRecord): void {
    this.closeOperations();
    this.directSmsUserId.set(user.id);
    this.directSmsMessage.set('');
    this.directSmsAttempted.set(false);
  }

  closeDirectSms(): void {
    this.directSmsUserId.set(null);
    this.directSmsAttempted.set(false);
  }

  submitDirectSms(event: Event): void {
    event.preventDefault();
    this.directSmsAttempted.set(true);
    const message = this.directSmsMessage().trim();
    this.directSmsMessage.set(message);
    if (!this.directSmsUser() || !message) {
      return;
    }

    this.closeDirectSms();
    this.toastService.show('ارسال واقعی انجام نشد؛ پیامک مستقیم فقط در پیش‌نمایش بررسی شد.');
  }

  requestEnterUserAccount(user: BusinessUserRecord): void {
    this.closeOperations();
    this.pendingConfirmation.set({
      type: 'enter-user-account',
      userId: user.id,
      title: 'ورود به حساب کاربری',
      message: `ورود بدون رمز به حساب ${user.fullName || user.mobile} به قرارداد امن سمت سرور، ثبت رویداد و امکان بازگشت به حساب مدیریتی نیاز دارد. در این نسخه هیچ نشست یا توکنی تغییر نمی‌کند.`,
      confirmLabel: 'تأیید پیش‌نمایش'
    });
  }

  openEdit(user: BusinessUserRecord): void {
    this.closeOperations();
    this.editingUserId.set(user.id);
    this.editName.set(user.fullName ?? '');
    this.editNationalId.set(user.nationalId ?? '');
    this.editNationalIdHadNonDigit.set(false);
    this.editAttempted.set(false);
  }

  closeEdit(): void {
    this.editingUserId.set(null);
    this.editAttempted.set(false);
    this.editNationalIdHadNonDigit.set(false);
  }

  onEditNameInput(event: Event): void {
    this.editName.set((event.target as HTMLInputElement).value);
  }

  onEditNationalIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;
    const normalizedValue = this.normalizeDigits(rawValue).slice(0, 10);
    this.editNationalIdHadNonDigit.set(/[^0-9۰-۹٠-٩]/.test(rawValue));
    this.editNationalId.set(normalizedValue);
    input.value = normalizedValue;
  }

  isEditNameValid(): boolean {
    return this.editName().trim().length > 0;
  }

  isEditNationalIdValid(): boolean {
    return !this.editNationalIdHadNonDigit() && /^\d{10}$/.test(this.editNationalId());
  }

  editNationalIdError(): string {
    return this.editNationalIdHadNonDigit()
      ? 'کد ملی فقط باید شامل اعداد باشد.'
      : 'کد ملی باید دقیقاً ۱۰ رقم باشد.';
  }

  saveEdit(event: Event): void {
    event.preventDefault();
    this.editAttempted.set(true);
    const user = this.editingUser();
    const trimmedName = this.editName().trim();
    this.editName.set(trimmedName);

    if (!user || !this.isEditNameValid() || !this.isEditNationalIdValid()) {
      return;
    }

    this.updateUser(user.id, current => ({
      ...current,
      fullName: trimmedName,
      nationalId: this.editNationalId()
    }));
    this.closeEdit();
    this.toastService.show('اطلاعات کاربر در پیش‌نمایش به‌روزرسانی شد.', 'success');
  }

  requestActivationChange(user: BusinessUserRecord): void {
    this.closeOperations();
    this.pendingConfirmation.set({
      type: 'activation',
      userId: user.id,
      title: user.isActive ? 'تأیید غیرفعال‌سازی کاربر' : 'تأیید فعال‌سازی کاربر',
      message: user.isActive
        ? 'آیا از غیرفعال‌سازی این کاربر در پیش‌نمایش اطمینان دارید؟ وضعیت تأیید کارفرما تغییر نخواهد کرد.'
        : 'آیا از فعال‌سازی این کاربر در پیش‌نمایش اطمینان دارید؟ وضعیت تأیید کارفرما تغییر نخواهد کرد.',
      confirmLabel: user.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'
    });
  }

  requestEmployerApprovalChange(user: BusinessUserRecord): void {
    if (!this.hasEmployerCapability(user)) {
      return;
    }

    const targetEmployerApproval: EmployerApprovalState = user.employerApproval === 'approved' ? 'rejected' : 'approved';
    const isApproval = targetEmployerApproval === 'approved';
    this.closeOperations();
    this.pendingConfirmation.set({
      type: 'employer-approval',
      userId: user.id,
      title: isApproval ? 'تأیید کارفرما' : 'عدم تأیید کارفرما',
      message: isApproval
        ? 'آیا از تأیید قابلیت کارفرما برای این کاربر اطمینان دارید؟ وضعیت فعال یا غیرفعال کاربر تغییر نخواهد کرد.'
        : 'آیا از عدم تأیید قابلیت کارفرما برای این کاربر اطمینان دارید؟ وضعیت فعال یا غیرفعال کاربر تغییر نخواهد کرد.',
      confirmLabel: isApproval ? 'تأیید کارفرما' : 'عدم تأیید کارفرما',
      targetEmployerApproval
    });
  }

  cancelConfirmation(): void {
    this.pendingConfirmation.set(null);
  }

  confirmPendingAction(): void {
    const confirmation = this.pendingConfirmation();
    const user = confirmation ? this.findUser(confirmation.userId) : null;
    if (!confirmation || !user) {
      this.cancelConfirmation();
      return;
    }

    if (confirmation.type === 'activation') {
      this.updateUser(user.id, current => ({ ...current, isActive: !current.isActive }));
      this.toastService.show('وضعیت فعالیت کاربر در پیش‌نمایش تغییر کرد.', 'success');
    } else if (confirmation.type === 'employer-approval' && this.hasEmployerCapability(user) && confirmation.targetEmployerApproval) {
      this.updateUser(user.id, current => ({
        ...current,
        employerApproval: confirmation.targetEmployerApproval
      }));
      this.toastService.show('وضعیت تأیید کارفرما در پیش‌نمایش تغییر کرد.', 'success');
    } else if (confirmation.type === 'enter-user-account') {
      this.toastService.show('ورود واقعی انجام نشد و نشست مدیریتی بدون تغییر باقی ماند.');
    }

    this.cancelConfirmation();
  }

  hasEmployerCapability(user: BusinessUserRecord): boolean {
    return user.roles.includes('employer');
  }

  isEmployerApprovalPending(user: BusinessUserRecord): boolean {
    return this.hasEmployerCapability(user) && user.employerApproval === 'pending';
  }

  visibleDeferredActions(user: BusinessUserRecord): readonly DeferredAction[] {
    return this.deferredActions.filter(action => {
      const allowedForRole = !action.hiddenForSupport || !this.isSupportView();
      const applicableToUser = !action.employerOnly || this.hasEmployerCapability(user);
      return allowedForRole && applicableToUser;
    });
  }

  roleLabel(role: UserCapability): string {
    return ROLE_LABELS[role];
  }

  employerApprovalLabel(state: EmployerApprovalState | undefined): string {
    if (state === 'approved') return 'تأیید شده';
    if (state === 'rejected') return 'تأیید نشده';
    return 'در انتظار تأیید';
  }

  statusClass(isActive: boolean): string {
    return isActive
      ? 'inline-flex whitespace-nowrap rounded-full bg-success/15 px-2 py-1 text-[10px] font-bold text-success sm:text-xs'
      : 'inline-flex whitespace-nowrap rounded-full bg-danger/15 px-2 py-1 text-[10px] font-bold text-danger sm:text-xs';
  }

  approvalClass(state: EmployerApprovalState | undefined): string {
    if (state === 'approved') {
      return 'inline-flex whitespace-nowrap rounded-full bg-success/15 px-2 py-1 text-[10px] font-bold text-success sm:text-xs';
    }
    return state === 'rejected'
      ? 'inline-flex whitespace-nowrap rounded-full bg-danger/15 px-2 py-1 text-[10px] font-bold text-danger sm:text-xs'
      : 'inline-flex whitespace-nowrap rounded-full bg-warning/15 px-2 py-1 text-[10px] font-bold text-warning sm:text-xs';
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('fa-IR').format(value);
  }

  private findUser(userId: number | null): BusinessUserRecord | null {
    if (userId === null) {
      return null;
    }
    return this.users().find(user => user.id === userId) ?? null;
  }

  private updateUser(userId: number, update: (user: BusinessUserRecord) => BusinessUserRecord): void {
    this.users.update(users => users.map(user => user.id === userId ? update(user) : user));
  }

  private resetNewEmployeeForm(): void {
    this.newEmployeeName.set('');
    this.newEmployeeMobile.set('');
    this.newEmployeeNationalId.set('');
    this.newEmployeeEmail.set('');
    this.newEmployeeBirthDate.set('');
    this.newEmployeeDescription.set('');
    this.createUserAttempted.set(false);
  }

  private currentJalaliDate(): string {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  }

  private normalizeSearchValue(value: string): string {
    return value
      .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
      .toLocaleLowerCase('fa-IR');
  }

  private normalizeDigits(value: string): string {
    return this.normalizeSearchValue(value).replace(/\D/g, '');
  }

  private escapeSpreadsheetHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

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
type EmployerApprovalState = 'pending' | 'approved';
type ConfirmationActionType = 'activation' | 'employer-approval';

interface InternalUserRecord {
  readonly id: number;
  readonly mobile: string;
  readonly fullName: string | null;
  readonly nationalId: string | null;
  readonly roles: readonly UserCapability[];
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
}

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

const DEFERRED_ACTIONS: readonly string[] = [
  'ارسال پیامک',
  'ارسال‌ها',
  'تراکنش‌ها',
  'کوپن',
  'نظرات',
  'ورود به حساب کاربر'
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
            <h1 class="text-2xl font-bold text-primary sm:text-3xl">مدیریت کاربران</h1>
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
              <p class="mt-0.5 text-xs text-muted">جستجو بر اساس موبایل، نام یا کد ملی</p>
            </div>
          </div>

          <form class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(14rem,1.5fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_auto]" (submit)="applySearch($event)">
            <div>
              <label for="internal-user-search" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">جستجو</label>
              <div class="relative">
                <ui-icon name="search" [size]="18" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                <input
                  id="internal-user-search"
                  type="search"
                  autocomplete="off"
                  [value]="searchDraft()"
                  (input)="onSearchDraftInput($event)"
                  class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="موبایل، نام یا کد ملی">
              </div>
            </div>

            <div>
              <label for="internal-user-role-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">نقش / قابلیت</label>
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
              <label for="internal-user-active-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">وضعیت کاربر</label>
              <select
                id="internal-user-active-filter"
                [value]="activeFilter()"
                (change)="onActiveFilterChange($event)"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2 md:self-end">
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
          <div class="flex flex-col gap-2 border-b border-border pb-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="internal-user-list-title" class="text-base font-extrabold text-foreground dark:text-slate-100 sm:text-lg" aria-live="polite">
                فهرست کاربران ({{ formatNumber(filteredUsers().length) }} رکورد)
              </h2>
              <p class="mt-0.5 text-xs leading-5 text-muted">هر موبایل فقط یک هویت سراسری دارد؛ نقش‌های هم‌زمان در همان ردیف نمایش داده می‌شوند.</p>
            </div>
            <span class="inline-flex w-fit items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-[10px] font-bold text-warning sm:text-xs">
              <ui-icon name="info" [size]="13"></ui-icon>
              داده نمایشی و حافظه‌ای
            </span>
          </div>

          @if (filteredUsers().length > 0) {
            <div class="mt-3 hidden overflow-visible rounded-xl border border-border dark:border-slate-700 lg:block">
              <table class="w-full table-fixed text-sm">
                <thead class="bg-background/80 dark:bg-slate-900/60">
                  <tr>
                    <th class="w-14 px-2 py-3 text-right text-xs font-bold text-muted">شناسه</th>
                    <th class="w-32 px-2 py-3 text-right text-xs font-bold text-muted">موبایل</th>
                    <th class="w-[17%] px-2 py-3 text-right text-xs font-bold text-muted">نام و نام خانوادگی</th>
                    <th class="w-28 px-2 py-3 text-right text-xs font-bold text-muted">کد ملی</th>
                    <th class="w-[20%] px-2 py-3 text-right text-xs font-bold text-muted">نقش‌ها</th>
                    <th class="w-24 px-2 py-3 text-right text-xs font-bold text-muted">وضعیت کاربر</th>
                    <th class="w-28 px-2 py-3 text-right text-xs font-bold text-muted">وضعیت کارفرما</th>
                    <th class="w-24 px-2 py-3 text-center text-xs font-bold text-muted">عملیات</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border dark:divide-slate-700">
                  @for (user of filteredUsers(); track user.id) {
                    <tr class="transition-colors hover:bg-primary/5 dark:hover:bg-primary/10">
                      <td class="px-2 py-3 font-bold text-foreground dark:text-slate-200" dir="ltr">{{ user.id }}</td>
                      <td class="px-2 py-3 font-semibold text-foreground dark:text-slate-200" dir="ltr">{{ user.mobile }}</td>
                      <td class="px-2 py-3">
                        @if (user.fullName) {
                          <span class="font-bold text-foreground dark:text-slate-100">{{ user.fullName }}</span>
                        } @else {
                          <span class="text-xs font-bold leading-5 text-danger">کاربر پروفایلش را تکمیل نکرده</span>
                        }
                      </td>
                      <td class="px-2 py-3 font-semibold text-foreground dark:text-slate-200" dir="ltr">{{ user.nationalId || '—' }}</td>
                      <td class="px-2 py-3"><div class="flex flex-wrap gap-1">@for (role of user.roles; track role) {<span class="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{{ roleLabel(role) }}</span>}</div></td>
                      <td class="px-2 py-3"><span [class]="statusClass(user.isActive)">{{ user.isActive ? 'فعال' : 'غیرفعال' }}</span></td>
                      <td class="px-2 py-3">
                        @if (hasEmployerCapability(user)) {
                          <span [class]="approvalClass(user.employerApproval)">{{ employerApprovalLabel(user.employerApproval) }}</span>
                        } @else {
                          <span class="text-muted">—</span>
                        }
                      </td>
                      <td class="px-2 py-3 text-center">
                        <button type="button" (click)="openOperations(user)" [attr.aria-label]="'عملیات کاربر ' + user.mobile" class="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/30 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25">
                          <ui-icon name="sliders" [size]="15"></ui-icon>
                          عملیات
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
                      <p class="font-bold text-foreground dark:text-slate-100">{{ user.fullName || 'کاربر پروفایلش را تکمیل نکرده' }}</p>
                      <p class="mt-1 text-sm font-semibold text-muted" dir="ltr">{{ user.mobile }}</p>
                    </div>
                    <span [class]="statusClass(user.isActive)">{{ user.isActive ? 'فعال' : 'غیرفعال' }}</span>
                  </div>

                  <dl class="mt-3 grid grid-cols-2 gap-2 border-y border-border py-2.5 text-xs dark:border-slate-700">
                    <div>
                      <dt class="text-muted">کد ملی</dt>
                      <dd class="mt-1 font-bold text-foreground dark:text-slate-200" dir="ltr">{{ user.nationalId || '—' }}</dd>
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
                    {{ user.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی' }}
                  </button>
                  @if (canApproveEmployer(user)) {
                    <button type="button" (click)="requestEmployerApproval(user)" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:col-span-2">
                      <ui-icon name="check-circle" [size]="17"></ui-icon>
                      تأیید کارفرما
                    </button>
                  }
                </div>

                <div class="mt-4 border-t border-border pt-4 dark:border-slate-700">
                  <p class="mb-2 text-xs font-bold text-muted">عملیات مراحل بعد</p>
                  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    @for (action of deferredActions; track action) {
                      <button type="button" disabled aria-disabled="true" class="flex min-h-14 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background/60 px-2 text-xs font-bold text-muted opacity-75 dark:border-slate-700 dark:bg-slate-900/40">
                        <span>{{ action }}</span>
                        <span class="text-[9px] text-primary">در مرحله بعد</span>
                      </button>
                    }
                  </div>
                </div>
              </div>
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
  readonly roleOptions: readonly RoleFilterOption[] = [
    { id: 'all', label: 'همه نقش‌ها' },
    { id: 'employer', label: 'کارفرما' },
    { id: 'employee', label: 'کارمند' },
    { id: 'super-admin', label: 'مدیر سامانه' },
    { id: 'sales-expert', label: 'کارشناس فروش' },
    { id: 'support-expert', label: 'کارشناس پشتیبانی' }
  ];

  readonly users = signal<readonly InternalUserRecord[]>([
    {
      id: 1001,
      mobile: '09121234567',
      fullName: 'مریم احمدی',
      nationalId: '0012345678',
      roles: ['employer', 'employee'],
      isActive: true,
      employerApproval: 'approved'
    },
    {
      id: 1002,
      mobile: '09129876543',
      fullName: 'رضا کریمی',
      nationalId: '1234567890',
      roles: ['employer'],
      isActive: true,
      employerApproval: 'pending'
    },
    {
      id: 1003,
      mobile: '09350000001',
      fullName: null,
      nationalId: null,
      roles: ['employee'],
      isActive: true
    },
    {
      id: 1004,
      mobile: '09910000002',
      fullName: 'سارا محمدی',
      nationalId: '0456789123',
      roles: ['support-expert'],
      isActive: true
    },
    {
      id: 1005,
      mobile: '09210000003',
      fullName: 'علی مرادی',
      nationalId: '0789456123',
      roles: ['sales-expert'],
      isActive: false
    },
    {
      id: 1006,
      mobile: '09190000004',
      fullName: 'نگار رضایی',
      nationalId: '0567891234',
      roles: ['super-admin'],
      isActive: true
    }
  ]);

  readonly searchDraft = signal('');
  readonly searchQuery = signal('');
  readonly roleFilter = signal<RoleFilter>('all');
  readonly activeFilter = signal<ActiveFilter>('all');
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

  readonly filteredUsers = computed(() => {
    const query = this.normalizeSearchValue(this.searchQuery().trim());
    const role = this.roleFilter();
    const active = this.activeFilter();

    return this.users().filter(user => {
      const matchesSearch = !query || [user.mobile, user.fullName ?? '', user.nationalId ?? '']
        .some(value => this.normalizeSearchValue(value).includes(query));
      const matchesRole = role === 'all' || user.roles.includes(role);
      const matchesActive = active === 'all'
        || (active === 'active' ? user.isActive : !user.isActive);
      return matchesSearch && matchesRole && matchesActive;
    });
  });

  readonly operationsUser = computed(() => this.findUser(this.operationsUserId()));
  readonly editingUser = computed(() => this.findUser(this.editingUserId()));

  onSearchDraftInput(event: Event): void {
    this.searchDraft.set((event.target as HTMLInputElement).value);
  }

  applySearch(event: Event): void {
    event.preventDefault();
    this.searchQuery.set(this.searchDraft().trim());
  }

  onRoleFilterChange(event: Event): void {
    this.roleFilter.set((event.target as HTMLSelectElement).value as RoleFilter);
  }

  onActiveFilterChange(event: Event): void {
    this.activeFilter.set((event.target as HTMLSelectElement).value as ActiveFilter);
  }

  showAll(): void {
    this.searchDraft.set('');
    this.searchQuery.set('');
    this.roleFilter.set('all');
    this.activeFilter.set('all');
  }

  openOperations(user: InternalUserRecord): void {
    this.operationsUserId.set(user.id);
  }

  closeOperations(): void {
    this.operationsUserId.set(null);
  }

  openEdit(user: InternalUserRecord): void {
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

  requestActivationChange(user: InternalUserRecord): void {
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

  requestEmployerApproval(user: InternalUserRecord): void {
    if (!this.canApproveEmployer(user)) {
      return;
    }

    this.closeOperations();
    this.pendingConfirmation.set({
      type: 'employer-approval',
      userId: user.id,
      title: 'تأیید کارفرما',
      message: 'آیا از تأیید قابلیت کارفرما برای این کاربر اطمینان دارید؟ وضعیت فعال یا غیرفعال کاربر تغییر نخواهد کرد.',
      confirmLabel: 'تأیید کارفرما'
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
    } else if (this.canApproveEmployer(user)) {
      this.updateUser(user.id, current => ({ ...current, employerApproval: 'approved' }));
      this.toastService.show('وضعیت تأیید کارفرما در پیش‌نمایش تغییر کرد.', 'success');
    }

    this.cancelConfirmation();
  }

  canApproveEmployer(user: InternalUserRecord): boolean {
    return this.hasEmployerCapability(user) && user.employerApproval === 'pending';
  }

  hasEmployerCapability(user: InternalUserRecord): boolean {
    return user.roles.includes('employer');
  }

  roleLabel(role: UserCapability): string {
    return ROLE_LABELS[role];
  }

  employerApprovalLabel(state: EmployerApprovalState | undefined): string {
    return state === 'approved' ? 'تأیید شده' : 'در انتظار تأیید';
  }

  statusClass(isActive: boolean): string {
    return isActive
      ? 'inline-flex whitespace-nowrap rounded-full bg-success/15 px-2 py-1 text-[10px] font-bold text-success sm:text-xs'
      : 'inline-flex whitespace-nowrap rounded-full bg-danger/15 px-2 py-1 text-[10px] font-bold text-danger sm:text-xs';
  }

  approvalClass(state: EmployerApprovalState | undefined): string {
    return state === 'approved'
      ? 'inline-flex whitespace-nowrap rounded-full bg-success/15 px-2 py-1 text-[10px] font-bold text-success sm:text-xs'
      : 'inline-flex whitespace-nowrap rounded-full bg-warning/15 px-2 py-1 text-[10px] font-bold text-warning sm:text-xs';
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('fa-IR').format(value);
  }

  private findUser(userId: number | null): InternalUserRecord | null {
    if (userId === null) {
      return null;
    }
    return this.users().find(user => user.id === userId) ?? null;
  }

  private updateUser(userId: number, update: (user: InternalUserRecord) => InternalUserRecord): void {
    this.users.update(users => users.map(user => user.id === userId ? update(user) : user));
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
}

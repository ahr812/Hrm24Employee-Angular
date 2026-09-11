import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EscToCloseDirective } from '../../../../shared/directives/esc-to-close.directive';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { Fish24RoleId } from '../../../../core/fish24/models/fish24-role.model';
import { Fish24RolePreviewService } from '../../../../core/fish24/dev/fish24-role-preview.service';
import { Fish24PermissionService } from '../../../../core/fish24/permissions/fish24-permission.service';
import { FISH24_PERMISSIONS } from '../../../../core/fish24/permissions/fish24-permissions';

type InternalRole = Extract<Fish24RoleId, 'super-admin' | 'sales-expert' | 'support-expert'>;
type StatusFilter = 'all' | 'active' | 'inactive';
type RoleFilter = 'all' | InternalRole;

interface InternalStaffRecord {
  readonly id: number;
  readonly fullName: string;
  readonly mobile: string;
  readonly role: InternalRole;
  readonly isActive: boolean;
}

const ROLE_LABELS: Readonly<Record<InternalRole, string>> = {
  'super-admin': 'مدیر سامانه',
  'sales-expert': 'کارشناس فروش',
  'support-expert': 'کارشناس پشتیبانی'
};

@Component({
  selector: 'app-internal-staff',
  standalone: true,
  imports: [EscToCloseDirective, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-4 animate-fade-in-up sm:space-y-5" dir="rtl">
      <header class="flex min-w-0 items-center gap-3 sm:gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
          <ui-icon name="shield" [size]="29" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">فهرست کاربران داخلی</h1>
          <p class="mt-0.5 text-sm leading-6 text-muted sm:mt-1 sm:text-base">مدیریت هویت‌های عملیاتی فیش۲۴؛ ویژه مدیر سامانه</p>
        </div>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="internal-staff-filters-title">
        <h2 id="internal-staff-filters-title" class="mb-3 text-base font-extrabold text-foreground dark:text-slate-100 sm:text-lg">فیلتر کاربران داخلی</h2>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label for="internal-staff-search" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">نام یا موبایل</label>
            <input id="internal-staff-search" type="search" autocomplete="off" [value]="searchQuery()" (input)="searchQuery.set(inputValue($event))" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          </div>
          <div>
            <label for="internal-staff-role" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">نقش داخلی</label>
            <select id="internal-staff-role" [value]="roleFilter()" (change)="onRoleFilterChange($event)" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="all">همه نقش‌ها</option>
              <option value="super-admin">مدیر سامانه</option>
              <option value="sales-expert">کارشناس فروش</option>
              <option value="support-expert">کارشناس پشتیبانی</option>
            </select>
          </div>
          <div>
            <label for="internal-staff-status" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">وضعیت</label>
            <select id="internal-staff-status" [value]="statusFilter()" (change)="onStatusFilterChange($event)" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="all">مشاهده همه</option>
              <option value="active">فقط کاربران فعال</option>
              <option value="inactive">فقط کاربران غیر فعال</option>
            </select>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-border bg-surface p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="internal-staff-list-title">
        <div class="border-b border-border pb-3 dark:border-slate-700">
          <h2 id="internal-staff-list-title" class="text-base font-extrabold text-foreground dark:text-slate-100 sm:text-lg">فهرست کاربران داخلی ({{ formatNumber(filteredStaff().length) }} رکورد)</h2>
        </div>

        @if (filteredStaff().length) {
          <div class="mt-3 hidden rounded-xl border border-border dark:border-slate-700 md:block">
            <table class="w-full table-fixed text-xs lg:text-sm">
              <thead class="bg-background/80 dark:bg-slate-900/60">
                <tr>
                  <th class="w-[28%] px-2 py-3 text-right font-bold text-muted">نام و نام خانوادگی</th>
                  <th class="w-[22%] px-2 py-3 text-right font-bold text-muted">موبایل</th>
                  <th class="w-[22%] px-2 py-3 text-right font-bold text-muted">نقش داخلی</th>
                  <th class="w-[14%] px-2 py-3 text-right font-bold text-muted">وضعیت</th>
                  <th class="w-[14%] px-2 py-3 text-center font-bold text-muted">عملیات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border dark:divide-slate-700">
                @for (user of filteredStaff(); track user.id) {
                  <tr class="hover:bg-primary/5 dark:hover:bg-primary/10">
                    <td class="break-words px-2 py-3 font-bold text-foreground dark:text-slate-100">{{ user.fullName }}</td>
                    <td class="break-all px-2 py-3 font-semibold text-foreground dark:text-slate-200" dir="ltr">{{ user.mobile }}</td>
                    <td class="break-words px-2 py-3 font-semibold text-foreground dark:text-slate-200">{{ roleLabel(user.role) }}</td>
                    <td class="px-2 py-3"><span [class]="statusClass(user.isActive)">{{ user.isActive ? 'فعال' : 'غیرفعال' }}</span></td>
                    <td class="px-2 py-3 text-center"><button type="button" (click)="openOperations(user)" [attr.aria-label]="'عملیات کاربر داخلی ' + user.mobile" class="inline-flex min-h-9 items-center justify-center rounded-lg border border-primary/30 px-2 text-xs font-bold text-primary hover:bg-primary/10"><ui-icon name="sliders" [size]="15"></ui-icon><span class="sr-only">عملیات</span></button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="mt-3 space-y-2.5 md:hidden">
            @for (user of filteredStaff(); track user.id) {
              <article class="rounded-xl border border-border bg-background/55 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <div class="flex items-start justify-between gap-3"><div><p class="font-bold text-foreground dark:text-slate-100">{{ user.fullName }}</p><p class="mt-1 text-sm font-semibold text-muted" dir="ltr">{{ user.mobile }}</p></div><span [class]="statusClass(user.isActive)">{{ user.isActive ? 'فعال' : 'غیرفعال' }}</span></div>
                <div class="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 dark:border-slate-700"><span class="text-xs font-bold text-foreground dark:text-slate-200">{{ roleLabel(user.role) }}</span><button type="button" (click)="openOperations(user)" [attr.aria-label]="'عملیات کاربر داخلی ' + user.mobile" class="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-primary/30 px-3 text-xs font-bold text-primary hover:bg-primary/10"><ui-icon name="sliders" [size]="15"></ui-icon>عملیات</button></div>
              </article>
            }
          </div>
        } @else {
          <div class="py-10 text-center text-sm font-semibold text-muted">کاربر داخلی مطابق فیلترها یافت نشد.</div>
        }
      </section>

      @if (operationsUser(); as user) {
        <div appEscToClose (escPressed)="closeOperations()" class="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:items-center" (click)="closeOperations()">
          <section role="dialog" aria-modal="true" aria-labelledby="internal-staff-operations-title" class="my-auto w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl dark:border-slate-700 dark:bg-slate-800" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between gap-3 border-b border-border p-4 dark:border-slate-700"><div><h2 id="internal-staff-operations-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">عملیات کاربر داخلی</h2><p class="mt-1 text-sm font-semibold text-muted">{{ user.fullName }}</p></div><button type="button" (click)="closeOperations()" aria-label="بستن عملیات کاربر داخلی" class="rounded-lg p-2 text-muted hover:bg-background dark:hover:bg-slate-700"><ui-icon name="x" [size]="19"></ui-icon></button></div>
            <div class="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
              <button type="button" (click)="previewEdit(user)" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 px-3 text-sm font-bold text-primary hover:bg-primary/10"><ui-icon name="edit" [size]="17"></ui-icon>ویرایش</button>
              <button type="button" (click)="requestActivation(user)" [class]="user.isActive ? 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-danger/30 px-3 text-sm font-bold text-danger hover:bg-danger/10' : 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-success/30 px-3 text-sm font-bold text-success hover:bg-success/10'"><ui-icon [name]="user.isActive ? 'lock' : 'check-circle'" [size]="17"></ui-icon>{{ user.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی' }}</button>
            </div>
          </section>
        </div>
      }

      @if (activationUser(); as user) {
        <div appEscToClose (escPressed)="cancelActivation()" class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm" (click)="cancelActivation()">
          <section role="alertdialog" aria-modal="true" aria-labelledby="internal-staff-confirm-title" class="w-full max-w-md rounded-2xl border border-border bg-surface p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800" (click)="$event.stopPropagation()">
            <h2 id="internal-staff-confirm-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">{{ user.isActive ? 'تأیید غیرفعال‌سازی' : 'تأیید فعال‌سازی' }}</h2>
            <p class="mt-2 text-sm leading-7 text-muted">این تغییر فقط در پیش‌نمایش فعلی اعمال می‌شود. آیا ادامه می‌دهید؟</p>
            <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" (click)="cancelActivation()" class="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200">انصراف</button><button type="button" (click)="confirmActivation()" class="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white">تأیید</button></div>
          </section>
        </div>
      }
    </div>
  `
})
export class InternalStaffComponent {
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly previewRoleService = inject(Fish24RolePreviewService);
  private readonly permissionService = inject(Fish24PermissionService);

  readonly staff = signal<readonly InternalStaffRecord[]>([
    { id: 2001, fullName: 'علی رضایی', mobile: '09190000004', role: 'super-admin', isActive: true },
    { id: 2002, fullName: 'سارا مرادی', mobile: '09210000003', role: 'sales-expert', isActive: false },
    { id: 2003, fullName: 'رضا کریمی', mobile: '09910000002', role: 'support-expert', isActive: true }
  ]);
  readonly searchQuery = signal('');
  readonly roleFilter = signal<RoleFilter>('all');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly operationsUserId = signal<number | null>(null);
  readonly activationUserId = signal<number | null>(null);
  readonly hasAccess = computed(() => this.permissionService.hasPermission(this.previewRoleService.getPreviewRoles(), FISH24_PERMISSIONS.internalUserManagement));

  private readonly enforceAccess = effect(() => {
    if (!this.hasAccess()) {
      void this.router.navigate(['/fish24/internal/users']);
    }
  });

  readonly filteredStaff = computed(() => {
    const query = this.normalizeSearchValue(this.searchQuery().trim());
    return this.staff().filter(user => {
      const matchesQuery = !query || this.normalizeSearchValue(`${user.fullName} ${user.mobile}`).includes(query);
      const matchesRole = this.roleFilter() === 'all' || user.role === this.roleFilter();
      const matchesStatus = this.statusFilter() === 'all' || (this.statusFilter() === 'active' ? user.isActive : !user.isActive);
      return matchesQuery && matchesRole && matchesStatus;
    });
  });
  readonly operationsUser = computed(() => this.findUser(this.operationsUserId()));
  readonly activationUser = computed(() => this.findUser(this.activationUserId()));

  inputValue(event: Event): string { return (event.target as HTMLInputElement).value; }
  onRoleFilterChange(event: Event): void { this.roleFilter.set((event.target as HTMLSelectElement).value as RoleFilter); }
  onStatusFilterChange(event: Event): void { this.statusFilter.set((event.target as HTMLSelectElement).value as StatusFilter); }
  roleLabel(role: InternalRole): string { return ROLE_LABELS[role]; }
  formatNumber(value: number): string { return new Intl.NumberFormat('fa-IR').format(value); }
  statusClass(isActive: boolean): string { return isActive ? 'inline-flex rounded-full bg-success/15 px-2 py-1 text-[10px] font-bold text-success sm:text-xs' : 'inline-flex rounded-full bg-danger/15 px-2 py-1 text-[10px] font-bold text-danger sm:text-xs'; }
  openOperations(user: InternalStaffRecord): void { this.operationsUserId.set(user.id); }
  closeOperations(): void { this.operationsUserId.set(null); }
  previewEdit(_user: InternalStaffRecord): void { this.closeOperations(); this.toastService.show('فرم ویرایش کاربر داخلی تا دریافت مرجع معتبر تکمیل نخواهد شد.'); }
  requestActivation(user: InternalStaffRecord): void { this.closeOperations(); this.activationUserId.set(user.id); }
  cancelActivation(): void { this.activationUserId.set(null); }
  confirmActivation(): void {
    const user = this.activationUser();
    if (!user) return;
    this.staff.update(items => items.map(item => item.id === user.id ? { ...item, isActive: !item.isActive } : item));
    this.cancelActivation();
    this.toastService.show('وضعیت کاربر داخلی در پیش‌نمایش تغییر کرد.', 'success');
  }
  private findUser(id: number | null): InternalStaffRecord | null { return id === null ? null : this.staff().find(user => user.id === id) ?? null; }
  private normalizeSearchValue(value: string): string { return value.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).toLocaleLowerCase('fa-IR'); }
}

import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EscToCloseDirective } from '../../../../shared/directives/esc-to-close.directive';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { Fish24RoleId } from '../../../../core/fish24/models/fish24-role.model';
import { Fish24RolePreviewService } from '../../../../core/fish24/dev/fish24-role-preview.service';
import { Fish24PermissionService } from '../../../../core/fish24/permissions/fish24-permission.service';
import { FISH24_PERMISSIONS } from '../../../../core/fish24/permissions/fish24-permissions';
import { InternalListColumn, InternalListColumnSearches, InternalListSort, filterByInternalListColumns, nextInternalListSort, sortInternalListRows } from '../../../../shared/ui/data-list/internal-list.model';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { PlainXlsxService } from '../../../../shared/ui/data-list/plain-xlsx.service';

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

interface InternalStaffMainFilters {
  readonly query: string;
  readonly role: RoleFilter;
  readonly status: StatusFilter;
}

const ROLE_LABELS: Readonly<Record<InternalRole, string>> = {
  'super-admin': 'مدیر سامانه',
  'sales-expert': 'کارشناس فروش',
  'support-expert': 'کارشناس پشتیبانی'
};

const INTERNAL_STAFF_COLUMNS: readonly InternalListColumn<InternalStaffRecord>[] = [
  { id: 'fullName', label: 'نام و نام خانوادگی', value: user => user.fullName, minWidth: '13rem' },
  { id: 'mobile', label: 'موبایل', value: user => user.mobile, exportValue: user => user.mobile, minWidth: '10rem', ltr: true },
  { id: 'role', label: 'نقش داخلی', value: user => ROLE_LABELS[user.role], minWidth: '11rem' },
  { id: 'isActive', label: 'وضعیت', value: user => user.isActive ? 'فعال' : 'غیرفعال', minWidth: '8rem' }
];

const INTERNAL_STAFF_LIST_ID = 'internal-staff';

const INTERNAL_STAFF_FILTER_DEFAULTS: InternalStaffMainFilters = {
  query: '',
  role: 'all',
  status: 'all'
};

function validateInternalStaffFilters(value: unknown): InternalStaffMainFilters | null {
  if (typeof value !== 'object' || value === null) return null;
  const filters = value as Partial<Record<keyof InternalStaffMainFilters, unknown>>;
  const roleValues: readonly RoleFilter[] = ['all', 'super-admin', 'sales-expert', 'support-expert'];
  const statusValues: readonly StatusFilter[] = ['all', 'active', 'inactive'];
  return {
    query: typeof filters.query === 'string' ? filters.query : '',
    role: roleValues.includes(filters.role as RoleFilter) ? filters.role as RoleFilter : 'all',
    status: statusValues.includes(filters.status as StatusFilter) ? filters.status as StatusFilter : 'all'
  };
}

@Component({
  selector: 'app-internal-staff',
  standalone: true,
  imports: [FormsModule, EscToCloseDirective, IconComponent],
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
            <input id="internal-staff-search" type="search" autocomplete="off" [value]="searchQuery()" (input)="onSearchQueryInput($event)" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          </div>
          <div>
            <label for="internal-staff-role" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">نقش داخلی</label>
            <select id="internal-staff-role" [ngModel]="roleFilter()" (ngModelChange)="onRoleFilterChange($event)" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="all">همه نقش‌ها</option>
              <option value="super-admin">مدیر سامانه</option>
              <option value="sales-expert">کارشناس فروش</option>
              <option value="support-expert">کارشناس پشتیبانی</option>
            </select>
          </div>
          <div>
            <label for="internal-staff-status" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">وضعیت</label>
            <select id="internal-staff-status" [ngModel]="statusFilter()" (ngModelChange)="onStatusFilterChange($event)" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="all">مشاهده همه</option>
              <option value="active">فقط کاربران فعال</option>
              <option value="inactive">فقط کاربران غیر فعال</option>
            </select>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-border bg-surface p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="internal-staff-list-title">
        <div class="flex flex-col gap-3 border-b border-border pb-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="internal-staff-list-title" class="text-base font-extrabold text-foreground dark:text-slate-100 sm:text-lg">فهرست کاربران داخلی ({{ formatNumber(tableStaff().length) }} رکورد)</h2>
          <div class="flex flex-wrap items-center gap-2">
            <div class="relative">
              <button id="internal-staff-columns-button" type="button" (click)="columnChooserOpen.set(!columnChooserOpen())" [attr.aria-expanded]="columnChooserOpen()" aria-controls="internal-staff-columns-panel" class="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-bold text-foreground hover:bg-background dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"><ui-icon name="sliders" [size]="16"></ui-icon>انتخاب ستون‌ها</button>
              @if (columnChooserOpen()) {
                <div id="internal-staff-columns-panel" class="absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-border bg-surface p-3 shadow-xl dark:border-slate-600 dark:bg-slate-800">
                  <p class="mb-2 text-xs font-extrabold text-foreground dark:text-slate-100">ستون‌های قابل نمایش</p>
                  @for (column of columns; track column.id) {
                    <label class="flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-semibold text-foreground hover:bg-background dark:text-slate-200 dark:hover:bg-slate-700"><input type="checkbox" [attr.data-column-toggle]="column.id" [checked]="isColumnVisible(column.id)" [disabled]="isOnlyVisibleColumn(column.id)" (change)="toggleColumn(column.id, $event)" class="h-4 w-4 accent-primary">{{ column.label }}</label>
                  }
                  <button type="button" (click)="restoreDefaultColumns()" class="mt-2 min-h-9 w-full rounded-lg border border-primary/30 px-2 text-xs font-bold text-primary hover:bg-primary/10">بازگردانی ستون‌های پیش‌فرض</button>
                </div>
              }
            </div>
            <button id="internal-staff-excel-export" type="button" (click)="exportStaff()" class="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-success/35 px-3 text-xs font-bold text-success hover:bg-success/10"><ui-icon name="download" [size]="16"></ui-icon>خروجی Excel</button>
          </div>
        </div>

        @if (filteredStaff().length) {
          <div id="internal-staff-table-scroll" class="mt-3 max-w-full overflow-x-auto rounded-xl border border-border dark:border-slate-700">
            <table class="w-max min-w-full text-xs lg:text-sm">
              <thead class="bg-background/80 dark:bg-slate-900/60">
                <tr>
                  @for (column of visibleColumns(); track column.id) {
                    <th class="px-2 py-2 text-right align-top font-bold text-muted" [style.min-width]="column.minWidth">
                      <button type="button" (click)="cycleSort(column.id)" [attr.aria-label]="sortAriaLabel(column)" class="flex min-h-7 w-full items-center justify-between gap-2 text-right font-bold hover:text-primary focus:outline-none focus:text-primary"><span>{{ column.label }}</span><span class="text-sm text-primary" aria-hidden="true">{{ sortIndicator(column.id) }}</span></button>
                      <input type="search" autocomplete="off" [attr.data-column-search]="column.id" [attr.aria-label]="'جستجو در ستون ' + column.label" [value]="columnSearches()[column.id] || ''" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" (input)="setColumnSearch(column.id, inputValue($event))" class="mt-1.5 h-8 w-full rounded-lg border border-border bg-surface px-2 text-[11px] font-normal text-foreground outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" placeholder="جستجو">
                    </th>
                  }
                  <th class="sticky left-0 z-10 min-w-24 bg-background/95 px-2 py-2 text-center font-bold text-muted dark:bg-slate-900">عملیات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border dark:divide-slate-700">
                @for (user of tableStaff(); track user.id) {
                  <tr class="hover:bg-primary/5 dark:hover:bg-primary/10">
                    @for (column of visibleColumns(); track column.id) {
                      <td class="break-words px-2 py-3 font-semibold text-foreground dark:text-slate-200" [attr.data-column-cell]="column.id" [style.min-width]="column.minWidth" [attr.dir]="column.ltr ? 'ltr' : null">@if (column.id === 'isActive') {<span [class]="statusClass(user.isActive)">{{ user.isActive ? 'فعال' : 'غیرفعال' }}</span>} @else { {{ displayColumnValue(column, user) }} }</td>
                    }
                    <td class="sticky left-0 z-[1] bg-surface px-2 py-3 text-center dark:bg-slate-800"><button type="button" (click)="openOperations(user)" [attr.aria-label]="'عملیات کاربر داخلی ' + user.mobile" class="inline-flex min-h-9 items-center justify-center rounded-lg border border-primary/30 px-2 text-xs font-bold text-primary hover:bg-primary/10"><ui-icon name="sliders" [size]="15"></ui-icon><span class="sr-only">عملیات</span></button></td>
                  </tr>
                }
                @if (!tableStaff().length) {
                  <tr><td [attr.colspan]="visibleColumns().length + 1" class="px-4 py-8 text-center text-sm font-semibold text-muted">رکوردی مطابق جستجوی ستون‌ها یافت نشد.</td></tr>
                }
              </tbody>
            </table>
          </div>

          <div class="hidden">
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
  private readonly listPreferences = inject(InternalListPreferencesService);
  private readonly xlsxService = inject(PlainXlsxService);
  private readonly restoredMainFilters = this.listPreferences.loadFilters(
    INTERNAL_STAFF_LIST_ID,
    INTERNAL_STAFF_FILTER_DEFAULTS,
    validateInternalStaffFilters
  );

  readonly staff = signal<readonly InternalStaffRecord[]>([
    { id: 2001, fullName: 'علی رضایی', mobile: '09190000004', role: 'super-admin', isActive: true },
    { id: 2002, fullName: 'سارا مرادی', mobile: '09210000003', role: 'sales-expert', isActive: false },
    { id: 2003, fullName: 'رضا کریمی', mobile: '09910000002', role: 'support-expert', isActive: true }
  ]);
  readonly columns = INTERNAL_STAFF_COLUMNS;
  readonly defaultColumnIds = INTERNAL_STAFF_COLUMNS.map(column => column.id);
  readonly selectedColumnIds = signal<readonly string[]>(this.listPreferences.load(INTERNAL_STAFF_LIST_ID, this.defaultColumnIds, this.defaultColumnIds));
  readonly columnSearches = signal<InternalListColumnSearches>({});
  readonly tableSort = signal<InternalListSort>({ columnId: null, direction: null });
  readonly columnChooserOpen = signal(false);
  readonly visibleColumns = computed(() => this.columns.filter(column => this.selectedColumnIds().includes(column.id)));
  readonly searchQuery = signal(this.restoredMainFilters.query);
  readonly roleFilter = signal<RoleFilter>(this.restoredMainFilters.role);
  readonly statusFilter = signal<StatusFilter>(this.restoredMainFilters.status);
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
  readonly columnFilteredStaff = computed(() => filterByInternalListColumns(this.filteredStaff(), this.columns, this.selectedColumnIds(), this.columnSearches()));
  readonly tableStaff = computed(() => sortInternalListRows(this.columnFilteredStaff(), this.columns, this.tableSort()));
  readonly operationsUser = computed(() => this.findUser(this.operationsUserId()));
  readonly activationUser = computed(() => this.findUser(this.activationUserId()));

  inputValue(event: Event): string { return (event.target as HTMLInputElement).value; }
  setColumnSearch(columnId: string, value: string): void { this.columnSearches.update(searches => ({ ...searches, [columnId]: value })); }
  cycleSort(columnId: string): void { this.tableSort.update(current => nextInternalListSort(current, columnId)); }
  sortIndicator(columnId: string): string { const sort = this.tableSort(); return sort.columnId !== columnId ? '↕' : sort.direction === 'asc' ? '↑' : '↓'; }
  sortAriaLabel(column: InternalListColumn<InternalStaffRecord>): string {
    const sort = this.tableSort();
    const state = sort.columnId !== column.id ? 'بدون مرتب‌سازی' : sort.direction === 'asc' ? 'صعودی' : 'نزولی';
    return `${column.label}؛ وضعیت ${state}. تغییر مرتب‌سازی`;
  }
  isColumnVisible(columnId: string): boolean { return this.selectedColumnIds().includes(columnId); }
  isOnlyVisibleColumn(columnId: string): boolean { return this.isColumnVisible(columnId) && this.selectedColumnIds().length === 1; }
  toggleColumn(columnId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.selectedColumnIds();
    const next = checked ? [...current, columnId] : current.filter(id => id !== columnId);
    if (!next.length) return;
    this.selectedColumnIds.set(this.listPreferences.save(INTERNAL_STAFF_LIST_ID, next, this.defaultColumnIds));
    if (!checked) {
      this.columnSearches.update(searches => ({ ...searches, [columnId]: '' }));
      if (this.tableSort().columnId === columnId) this.tableSort.set({ columnId: null, direction: null });
    }
  }
  restoreDefaultColumns(): void {
    this.selectedColumnIds.set(this.listPreferences.reset(INTERNAL_STAFF_LIST_ID, this.defaultColumnIds, this.defaultColumnIds));
    this.columnSearches.set({});
    this.tableSort.set({ columnId: null, direction: null });
  }
  displayColumnValue(column: InternalListColumn<InternalStaffRecord>, user: InternalStaffRecord): string {
    const value = column.value(user);
    return value === null || value === undefined ? '' : String(value);
  }
  exportStaff(): void {
    const exportColumns = this.visibleColumns();
    const rows = this.filteredStaff().map(user => exportColumns.map(column => column.exportValue ? column.exportValue(user) : this.toExportCell(column.value(user))));
    this.xlsxService.export('fish24-internal-staff.xlsx', exportColumns.map(column => column.label), rows);
    this.toastService.show(`${this.formatNumber(rows.length)} رکورد فیلترشده برای Excel آماده شد.`, 'success');
  }
  onSearchQueryInput(event: Event): void {
    this.searchQuery.set(this.inputValue(event));
    this.persistMainFilters();
  }
  onRoleFilterChange(value: RoleFilter): void {
    this.roleFilter.set(value);
    this.persistMainFilters();
  }
  onStatusFilterChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.persistMainFilters();
  }
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
  private persistMainFilters(): void {
    const filters: InternalStaffMainFilters = {
      query: this.searchQuery(),
      role: this.roleFilter(),
      status: this.statusFilter()
    };
    const isDefault = Object.entries(filters).every(([key, value]) =>
      value === INTERNAL_STAFF_FILTER_DEFAULTS[key as keyof InternalStaffMainFilters]
    );
    if (isDefault) {
      this.listPreferences.resetFilters(INTERNAL_STAFF_LIST_ID);
    } else {
      this.listPreferences.saveFilters(INTERNAL_STAFF_LIST_ID, filters);
    }
  }
  private findUser(id: number | null): InternalStaffRecord | null { return id === null ? null : this.staff().find(user => user.id === id) ?? null; }
  private normalizeSearchValue(value: string): string { return value.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).toLocaleLowerCase('fa-IR'); }
  private toExportCell(value: string | number | boolean | null | undefined): string | number | null { return value === null || value === undefined ? null : typeof value === 'number' ? value : String(value); }
}

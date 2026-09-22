import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Fish24RolePreviewService } from '../../../../core/fish24/dev/fish24-role-preview.service';
import { normalizeFish24Digits, normalizeJalaliDate } from '../../../../core/fish24/financial/fish24-financial-preview.service';
import { InternalListColumn, InternalListColumnSearches, InternalListSort, filterByInternalListColumns, nextInternalListSort, sortInternalListRows } from '../../../../shared/ui/data-list/internal-list.model';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { PlainXlsxService } from '../../../../shared/ui/data-list/plain-xlsx.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { InternalSentSmsRecord, InternalSmsHistoryPreviewService } from './internal-sms-history-preview.service';

export interface InternalSmsFilters {
  readonly employerId: string;
  readonly mobile: string;
  readonly fromDate: string;
  readonly toDate: string;
}

export const INTERNAL_SMS_LIST_ID = 'internal-sent-sms-history';
export const INTERNAL_SMS_FILTER_DEFAULTS: InternalSmsFilters = { employerId: 'all', mobile: '', fromDate: '', toDate: '' };
export const INTERNAL_SMS_COLUMNS: readonly InternalListColumn<InternalSentSmsRecord>[] = [
  { id: 'id', label: 'شناسه', value: row => row.id, exportValue: row => row.id, minWidth: '7rem', ltr: true },
  { id: 'date', label: 'تاریخ', value: row => row.sentAt, exportValue: row => row.sentAt, minWidth: '9rem', ltr: true },
  { id: 'mobile', label: 'شماره موبایل', value: row => row.mobile, exportValue: row => row.mobile, minWidth: '10rem', ltr: true },
  { id: 'name', label: 'نام کارفرما', value: row => row.employerName, minWidth: '12rem' },
  { id: 'company', label: 'نام شرکت کارفرما', value: row => row.employerCompanyName, minWidth: '15rem' },
  { id: 'message', label: 'متن پیام', value: row => row.message, minWidth: '28rem' }
];

export function validateInternalSmsFilters(value: unknown): InternalSmsFilters | null {
  if (typeof value !== 'object' || value === null) return null;
  const item = value as Partial<InternalSmsFilters>;
  const normalizeDate = (candidate: unknown) => typeof candidate === 'string' && candidate ? normalizeJalaliDate(candidate) ?? '' : '';
  return {
    employerId: typeof item.employerId === 'string' ? item.employerId : 'all',
    mobile: typeof item.mobile === 'string' ? normalizeFish24Digits(item.mobile).replace(/\D/g, '').slice(0, 11) : '',
    fromDate: normalizeDate(item.fromDate),
    toDate: normalizeDate(item.toDate)
  };
}

export function filterInternalSmsHistory(rows: readonly InternalSentSmsRecord[], filters: InternalSmsFilters): readonly InternalSentSmsRecord[] {
  return rows.filter(row =>
    (filters.employerId === 'all' || row.employerId === filters.employerId)
    && (!filters.mobile || row.mobile.includes(filters.mobile))
    && (!filters.fromDate || row.sentAt >= filters.fromDate)
    && (!filters.toDate || row.sentAt <= filters.toDate)
  );
}

@Component({
  selector: 'app-internal-sms-history',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-4 animate-fade-in-up sm:space-y-5" dir="rtl">
      <header class="flex min-w-0 items-center gap-3 sm:gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14"><ui-icon name="message-square" [size]="28" class="text-primary"></ui-icon></div>
        <div><h1 class="text-2xl font-bold text-primary sm:text-3xl">مدیریت پیامک‌های ارسالی</h1><p class="mt-0.5 text-sm text-muted">تاریخچه مشترک پیامک‌های ثبت‌شده در پیش‌نمایش پنل داخلی</p></div>
      </header>

      <section class="card p-3 sm:p-5" aria-labelledby="sms-filter-title">
        <div class="mb-3 flex items-center gap-2"><ui-icon name="search" [size]="19" class="text-primary"></ui-icon><h2 id="sms-filter-title" class="text-lg font-extrabold">جستجو</h2></div>
        <form class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-4" (submit)="applyFilters($event)">
          <div><label for="sms-employer" class="label">کارفرما</label><select id="sms-employer" [(ngModel)]="draft.employerId" name="employer" class="input"><option value="all">همه کارفرماها</option>@for (employer of employers(); track employer.id) {<option [value]="employer.id">{{ employer.label }}</option>}</select></div>
          <div><label for="sms-mobile" class="label">شماره موبایل</label><input id="sms-mobile" [(ngModel)]="draft.mobile" name="mobile" inputmode="numeric" maxlength="11" dir="ltr" class="input text-left"></div>
          <div><label for="sms-from" class="label">از تاریخ</label><input id="sms-from" [(ngModel)]="draft.fromDate" name="from" placeholder="1405/01/01" dir="ltr" class="input text-left"></div>
          <div><label for="sms-to" class="label">تا تاریخ</label><input id="sms-to" [(ngModel)]="draft.toDate" name="to" placeholder="1405/12/29" dir="ltr" class="input text-left"></div>
          <div class="grid grid-cols-2 gap-2 sm:col-span-2 xl:col-span-4 xl:justify-self-end"><button type="submit" class="primary"><ui-icon name="search" [size]="16"></ui-icon>جستجو</button><button type="button" (click)="showAll()" class="secondary">مشاهده همه</button></div>
        </form>
        @if (filterError()) {<p role="alert" class="mt-3 rounded-xl bg-danger/10 p-3 text-sm font-bold text-danger">{{ filterError() }}</p>}
      </section>

      <section class="card overflow-hidden" aria-labelledby="sms-list-title">
        <div class="flex flex-col gap-3 border-b border-border p-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <h2 id="sms-list-title" class="text-lg font-extrabold">لیست پیام کوتاه ({{ number(filteredRows().length) }} رکورد)</h2>
          <div class="flex flex-wrap gap-2"><button type="button" (click)="columnChooserOpen.set(!columnChooserOpen())" class="toolbar"><ui-icon name="sliders" [size]="16"></ui-icon>انتخاب ستون</button>@if (canExport()) {<button type="button" (click)="exportRows()" class="toolbar text-success"><ui-icon name="download" [size]="16"></ui-icon>Excel</button>}</div>
        </div>
        @if (columnChooserOpen()) {<div class="border-b border-border bg-background/60 p-3 dark:border-slate-700 dark:bg-slate-900/30"><div class="flex flex-wrap gap-2">@for (column of columns; track column.id) {<label class="column-choice"><input type="checkbox" [checked]="visible(column.id)" [disabled]="onlyVisible(column.id)" (change)="toggleColumn(column.id, $event)" class="accent-primary">{{ column.label }}</label>}<button type="button" (click)="restoreColumns()" class="px-3 py-2 text-xs font-bold text-primary">بازگردانی ستون‌های پیش‌فرض</button></div></div>}
        <div class="max-w-full overflow-x-auto">
          <table class="w-full min-w-max text-sm"><thead class="bg-background/80 dark:bg-slate-900/60"><tr>@for (column of visibleColumns(); track column.id) {<th class="px-2 py-3 text-right font-bold text-muted" [style.min-width]="column.minWidth"><button type="button" (click)="sort(column.id)" class="flex w-full items-center justify-between gap-2"><span>{{ column.label }}</span><span>{{ sortMark(column.id) }}</span></button></th>}</tr><tr>@for (column of visibleColumns(); track column.id) {<th class="px-2 pb-2"><input type="search" [value]="columnSearches()[column.id] || ''" (input)="searchColumn(column.id, value($event))" [attr.aria-label]="'جستجو در ستون ' + column.label" class="h-9 w-full rounded-lg border border-border bg-surface px-2 text-xs outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-800"></th>}</tr></thead>
            <tbody class="divide-y divide-border dark:divide-slate-700">@for (row of pageRows(); track row.id) {<tr class="hover:bg-primary/5">@for (column of visibleColumns(); track column.id) {<td class="px-2 py-3 align-top" [style.min-width]="column.minWidth" [attr.dir]="column.ltr ? 'ltr' : null">@if (column.id === 'message') {<div class="max-w-[36rem] whitespace-normal break-words leading-7">{{ row.message }}</div>} @else { {{ cell(column, row) }} }</td>}</tr>} @if (!pageRows().length) {<tr><td [attr.colspan]="visibleColumns().length" class="px-4 py-10 text-center font-semibold text-muted">رکوردی مطابق فیلترها پیدا نشد.</td></tr>}</tbody>
          </table>
        </div>
        <div class="flex items-center justify-between border-t border-border p-3 text-sm dark:border-slate-700"><span>صفحه {{ number(currentPage()) }} از {{ number(pageCount()) }}</span><div class="flex gap-2"><button type="button" class="secondary" [disabled]="currentPage() <= 1" (click)="page.set(currentPage() - 1)">قبلی</button><button type="button" class="secondary" [disabled]="currentPage() >= pageCount()" (click)="page.set(currentPage() + 1)">بعدی</button></div></div>
      </section>
    </div>
  `,
  styles: [`
    .card{border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));color:rgb(var(--color-foreground));box-shadow:0 1px 3px rgb(15 23 42/.08)}.label{display:block;margin-bottom:.375rem;font-size:.8rem;font-weight:700}.input{width:100%;min-height:2.75rem;border:1px solid rgb(var(--color-border));border-radius:.75rem;padding-inline:.75rem;color:rgb(var(--color-foreground));background:rgb(var(--color-background));outline:none}.input:focus{border-color:rgb(var(--color-primary));box-shadow:0 0 0 2px rgb(var(--color-primary)/.15)}.primary,.secondary,.toolbar{display:inline-flex;min-height:2.5rem;align-items:center;justify-content:center;gap:.4rem;border-radius:.75rem;padding-inline:.85rem;font-size:.8rem;font-weight:700}.primary{background:rgb(var(--color-primary));color:white}.secondary,.toolbar{border:1px solid rgb(var(--color-border))}.secondary:disabled{opacity:.45}.column-choice{display:flex;align-items:center;gap:.5rem;border:1px solid rgb(var(--color-border));border-radius:.5rem;padding:.5rem .75rem;font-size:.75rem;font-weight:700;background:rgb(var(--color-surface))}
  `]
})
export class InternalSmsHistoryComponent {
  private readonly history = inject(InternalSmsHistoryPreviewService);
  private readonly roles = inject(Fish24RolePreviewService);
  private readonly preferences = inject(InternalListPreferencesService);
  private readonly xlsx = inject(PlainXlsxService);
  private readonly toast = inject(ToastService);
  private readonly restoredPreference = this.preferences.loadFilters(INTERNAL_SMS_LIST_ID, INTERNAL_SMS_FILTER_DEFAULTS, validateInternalSmsFilters);
  private readonly restored: InternalSmsFilters = {
    ...this.restoredPreference,
    employerId: this.restoredPreference.employerId === 'all' || this.history.records().some(record => record.employerId === this.restoredPreference.employerId) ? this.restoredPreference.employerId : 'all'
  };

  readonly columns = INTERNAL_SMS_COLUMNS;
  readonly defaultColumns = INTERNAL_SMS_COLUMNS.map(column => column.id);
  readonly selectedColumns = signal<readonly string[]>(this.preferences.load(INTERNAL_SMS_LIST_ID, this.defaultColumns, this.defaultColumns));
  readonly visibleColumns = computed(() => this.columns.filter(column => this.selectedColumns().includes(column.id)));
  readonly columnSearches = signal<InternalListColumnSearches>({});
  readonly tableSort = signal<InternalListSort>({ columnId: null, direction: null });
  readonly columnChooserOpen = signal(false);
  readonly filterError = signal('');
  readonly page = signal(1);
  readonly pageSize = 10;
  draft: InternalSmsFilters = { ...this.restored };
  readonly applied = signal<InternalSmsFilters>(this.restored);
  readonly employers = computed(() => Array.from(new Map(this.history.records().map(record => [record.employerId, { id: record.employerId, label: record.employerCompanyName ? `${record.employerName} — ${record.employerCompanyName}` : record.employerName }])).values()));
  readonly filteredRows = computed(() => filterInternalSmsHistory(this.history.records(), this.applied()));
  readonly tableRows = computed(() => sortInternalListRows(filterByInternalListColumns(this.filteredRows(), this.columns, this.selectedColumns(), this.columnSearches()), this.columns, this.tableSort()));
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.tableRows().length / this.pageSize)));
  readonly currentPage = computed(() => Math.min(this.page(), this.pageCount()));
  readonly pageRows = computed(() => this.tableRows().slice((this.currentPage() - 1) * this.pageSize, this.currentPage() * this.pageSize));
  readonly canExport = computed(() => this.history.canExport(this.roles.getPreviewRoles()));

  applyFilters(event: Event): void {
    event.preventDefault();
    const normalized = validateInternalSmsFilters(this.draft)!;
    if ((this.draft.fromDate && !normalized.fromDate) || (this.draft.toDate && !normalized.toDate) || (normalized.fromDate && normalized.toDate && normalized.fromDate > normalized.toDate)) { this.filterError.set('بازه تاریخ معتبر نیست.'); return; }
    const applied = {
      ...normalized,
      employerId: normalized.employerId === 'all' || this.employers().some(employer => employer.id === normalized.employerId) ? normalized.employerId : 'all'
    };
    this.draft = { ...applied }; this.applied.set(applied); this.preferences.saveFilters(INTERNAL_SMS_LIST_ID, applied); this.filterError.set(''); this.page.set(1);
  }
  showAll(): void { this.draft = { ...INTERNAL_SMS_FILTER_DEFAULTS }; this.applied.set(INTERNAL_SMS_FILTER_DEFAULTS); this.preferences.resetFilters(INTERNAL_SMS_LIST_ID); this.filterError.set(''); this.page.set(1); }
  visible(id: string): boolean { return this.selectedColumns().includes(id); }
  onlyVisible(id: string): boolean { return this.visible(id) && this.selectedColumns().length === 1; }
  toggleColumn(id: string, event: Event): void { const checked = (event.target as HTMLInputElement).checked; const next = checked ? [...this.selectedColumns(), id] : this.selectedColumns().filter(item => item !== id); if (!next.length) return; this.selectedColumns.set(this.preferences.save(INTERNAL_SMS_LIST_ID, next, this.defaultColumns)); if (!checked) this.searchColumn(id, ''); }
  restoreColumns(): void { this.selectedColumns.set(this.preferences.reset(INTERNAL_SMS_LIST_ID, this.defaultColumns, this.defaultColumns)); this.columnSearches.set({}); this.tableSort.set({ columnId: null, direction: null }); }
  searchColumn(id: string, query: string): void { this.columnSearches.update(searches => ({ ...searches, [id]: query })); this.page.set(1); }
  sort(id: string): void { this.tableSort.update(current => nextInternalListSort(current, id)); this.page.set(1); }
  sortMark(id: string): string { const sort = this.tableSort(); return sort.columnId !== id ? '↕' : sort.direction === 'asc' ? '↑' : '↓'; }
  value(event: Event): string { return (event.target as HTMLInputElement).value; }
  cell(column: InternalListColumn<InternalSentSmsRecord>, row: InternalSentSmsRecord): string { return String(column.value(row) ?? ''); }
  number(value: number): string { return new Intl.NumberFormat('fa-IR').format(value); }
  exportRows(): void {
    if (!this.history.canExport(this.roles.getPreviewRoles())) { this.toast.show('نقش پشتیبانی مجوز خروجی Excel تاریخچه پیامک را ندارد.', 'error'); return; }
    const columns = this.visibleColumns();
    const rows = this.filteredRows().map(record => columns.map(column => column.exportValue ? column.exportValue(record) : column.value(record) == null ? null : String(column.value(record))));
    this.xlsx.export('fish24-internal-sms-history.xlsx', columns.map(column => column.label), rows);
    this.toast.show(`${this.number(rows.length)} پیامک فیلترشده برای Excel آماده شد.`, 'success');
  }
}

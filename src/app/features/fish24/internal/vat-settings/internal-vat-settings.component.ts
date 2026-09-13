import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Fish24FinancialPreviewService, VatSettingDraft, VatSettingRecord, normalizeFish24Digits } from '../../../../core/fish24/financial/fish24-financial-preview.service';
import { InternalListColumn, InternalListColumnSearches, InternalListSort, filterByInternalListColumns, nextInternalListSort, sortInternalListRows } from '../../../../shared/ui/data-list/internal-list.model';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { PlainXlsxService } from '../../../../shared/ui/data-list/plain-xlsx.service';
import { EscToCloseDirective } from '../../../../shared/directives/esc-to-close.directive';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface VatMainFilters { readonly title: string; readonly inactiveOnly: boolean; }

const LIST_ID = 'internal-vat-settings';
const FILTER_DEFAULTS: VatMainFilters = { title: '', inactiveOnly: false };
const COLUMNS: readonly InternalListColumn<VatSettingRecord>[] = [
  { id: 'id', label: 'شناسه', value: row => row.id, minWidth: '6rem', ltr: true },
  { id: 'createdAt', label: 'تاریخ ایجاد', value: row => row.createdAt, minWidth: '9rem', ltr: true },
  { id: 'title', label: 'عنوان', value: row => row.title, minWidth: '12rem' },
  { id: 'startDate', label: 'تاریخ شروع', value: row => row.startDate, minWidth: '9rem', ltr: true },
  { id: 'endDate', label: 'تاریخ پایان', value: row => row.endDate, minWidth: '9rem', ltr: true },
  { id: 'taxPercent', label: 'درصد مالیات', value: row => row.taxPercent, exportValue: row => row.taxPercent, minWidth: '8rem' },
  { id: 'dutyPercent', label: 'درصد عوارض', value: row => row.dutyPercent, exportValue: row => row.dutyPercent, minWidth: '8rem' },
  { id: 'totalPercent', label: 'جمع ارزش افزوده', value: row => row.taxPercent + row.dutyPercent, exportValue: row => row.taxPercent + row.dutyPercent, minWidth: '10rem' },
  { id: 'isActive', label: 'وضعیت', value: row => row.isActive ? 'فعال' : 'غیرفعال', minWidth: '7rem' }
];

function validateFilters(value: unknown): VatMainFilters | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Partial<VatMainFilters>;
  return {
    title: typeof candidate.title === 'string' ? candidate.title : '',
    inactiveOnly: typeof candidate.inactiveOnly === 'boolean' ? candidate.inactiveOnly : false
  };
}

@Component({
  selector: 'app-internal-vat-settings',
  standalone: true,
  imports: [FormsModule, EscToCloseDirective, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-4 animate-fade-in-up sm:space-y-5" dir="rtl">
      <header class="flex min-w-0 items-center gap-3 sm:gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14"><ui-icon name="calculator" [size]="28" class="text-primary"></ui-icon></div>
        <div class="min-w-0"><h1 class="text-2xl font-bold text-primary sm:text-3xl">مدیریت تنظیمات ارزش افزوده</h1><p class="mt-0.5 text-sm text-muted">مدیریت بازه‌های مالیات و عوارض فاکتورها</p></div>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="vat-filter-title">
        <div class="mb-3 flex items-center gap-3"><div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon name="sliders" [size]="19"></ui-icon></div><h2 id="vat-filter-title" class="text-base font-extrabold text-foreground dark:text-slate-100 sm:text-lg">جستجو</h2></div>
        <form class="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(18rem,1fr)_auto_auto]" (submit)="applyFilters($event)">
          <div><label for="vat-title-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">عنوان</label><input id="vat-title-filter" type="search" autocomplete="off" [value]="titleDraft()" (input)="titleDraft.set(inputValue($event))" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"></div>
          <label class="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200"><input type="checkbox" [checked]="inactiveDraft()" (change)="inactiveDraft.set(checkboxValue($event))" class="h-4 w-4 accent-primary">غیرفعال</label>
          <div class="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1"><button type="submit" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white"><ui-icon name="search" [size]="17"></ui-icon>جستجو</button><button type="button" (click)="showAll()" class="h-11 rounded-xl border border-border px-4 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200">مشاهده همه</button></div>
        </form>
      </section>

      <section class="rounded-2xl border border-border bg-surface shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="vat-list-title">
        <div class="flex flex-col gap-3 border-b border-border p-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><h2 id="vat-list-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">تنظیمات ارزش افزوده ({{ formatNumber(filteredRows().length) }} رکورد)</h2><p class="mt-1 text-xs text-muted">اثر تغییرات بلافاصله بر همه فاکتورهای دارای تاریخ صدور در بازه محاسبه می‌شود.</p></div>
          <div class="flex flex-wrap gap-2"><button type="button" (click)="openCreate()" class="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white"><ui-icon name="plus" [size]="17"></ui-icon>جدید</button><button type="button" (click)="columnChooserOpen.set(!columnChooserOpen())" class="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200"><ui-icon name="sliders" [size]="16"></ui-icon>انتخاب ستون</button><button type="button" (click)="exportRows()" class="inline-flex min-h-10 items-center gap-2 rounded-xl border border-success/30 px-3 text-sm font-bold text-success"><ui-icon name="download" [size]="16"></ui-icon>Excel</button></div>
        </div>

        @if (columnChooserOpen()) {
          <div class="border-b border-border bg-background/60 p-3 dark:border-slate-700 dark:bg-slate-900/30"><div class="flex flex-wrap gap-2">@for (column of columns; track column.id) {<label class="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"><input type="checkbox" [checked]="isColumnVisible(column.id)" [disabled]="isOnlyVisibleColumn(column.id)" (change)="toggleColumn(column.id, $event)" class="accent-primary">{{ column.label }}</label>}<button type="button" (click)="restoreColumns()" class="rounded-lg px-3 py-2 text-xs font-bold text-primary">بازگردانی ستون‌های پیش‌فرض</button></div></div>
        }

        <div class="max-w-full overflow-x-auto">
          <table class="min-w-max w-full text-sm">
            <thead class="bg-background/80 dark:bg-slate-900/60"><tr>@for (column of visibleColumns(); track column.id) {<th class="px-2 py-3 text-right font-bold text-muted" [style.min-width]="column.minWidth"><button type="button" (click)="cycleSort(column.id)" [attr.aria-label]="sortAriaLabel(column)" class="flex w-full items-center justify-between gap-2 text-right"><span>{{ column.label }}</span><span aria-hidden="true">{{ sortIndicator(column.id) }}</span></button></th>}<th class="sticky left-0 min-w-28 bg-background/95 px-2 py-3 text-center font-bold text-muted dark:bg-slate-900">عملیات</th></tr><tr>@for (column of visibleColumns(); track column.id) {<th class="px-2 pb-2"><input type="search" [attr.aria-label]="'جستجو در ستون ' + column.label" [value]="columnSearches()[column.id] || ''" (input)="setColumnSearch(column.id, inputValue($event))" class="h-9 w-full rounded-lg border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"></th>}<th class="sticky left-0 bg-background/95 dark:bg-slate-900"></th></tr></thead>
            <tbody class="divide-y divide-border dark:divide-slate-700">@for (row of tableRows(); track row.id) {<tr class="hover:bg-primary/5 dark:hover:bg-primary/10">@for (column of visibleColumns(); track column.id) {<td class="px-2 py-3 text-foreground dark:text-slate-200" [style.min-width]="column.minWidth" [attr.dir]="column.ltr ? 'ltr' : null">@if (column.id === 'isActive') {<span [class]="statusClass(row.isActive)">{{ row.isActive ? 'فعال' : 'غیرفعال' }}</span>} @else if (isPercentColumn(column.id)) { {{ formatPercent(numberValue(column, row)) }} } @else { {{ displayValue(column, row) }} }</td>}<td class="sticky left-0 bg-surface px-2 py-3 text-center dark:bg-slate-800"><div class="flex justify-center gap-2"><button type="button" (click)="openEdit(row)" [attr.aria-label]="'ویرایش ' + row.title" class="rounded-lg border border-primary/30 p-2 text-primary hover:bg-primary/10"><ui-icon name="edit" [size]="16"></ui-icon></button><button type="button" (click)="requestToggle(row)" [attr.aria-label]="(row.isActive ? 'غیرفعال‌سازی ' : 'فعال‌سازی ') + row.title" [class]="row.isActive ? 'rounded-lg border border-danger/30 p-2 text-danger hover:bg-danger/10' : 'rounded-lg border border-success/30 p-2 text-success hover:bg-success/10'"><ui-icon [name]="row.isActive ? 'lock' : 'check-circle'" [size]="16"></ui-icon></button></div></td></tr>} @if (!tableRows().length) {<tr><td [attr.colspan]="visibleColumns().length + 1" class="px-4 py-10 text-center font-semibold text-muted">رکوردی مطابق فیلترها پیدا نشد.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      @if (formOpen()) {
        <div appEscToClose (escPressed)="closeForm()" class="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:items-center" (click)="closeForm()">
          <section role="dialog" aria-modal="true" aria-labelledby="vat-form-title" class="my-auto max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl dark:border-slate-700 dark:bg-slate-800" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between border-b border-border p-4 dark:border-slate-700"><h2 id="vat-form-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">{{ editingId() === null ? 'ایجاد تنظیمات ارزش افزوده' : 'ویرایش تنظیمات ارزش افزوده' }}</h2><button type="button" (click)="closeForm()" class="rounded-lg p-2 text-muted" aria-label="بستن"><ui-icon name="x" [size]="19"></ui-icon></button></div>
            <form class="p-4" (submit)="save($event)">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="sm:col-span-2"><label class="field-label" for="vat-title">عنوان</label><input id="vat-title" [value]="draft().title" (input)="updateDraft('title', inputValue($event))" class="field-input">@if (fieldError('title')) {<p class="field-error">{{ fieldError('title') }}</p>}</div>
                <div><label class="field-label" for="vat-start">تاریخ شروع</label><input id="vat-start" inputmode="numeric" dir="ltr" placeholder="1405/01/01" [value]="draft().startDate" (input)="updateDate('startDate', $event)" class="field-input text-left">@if (fieldError('startDate')) {<p class="field-error">{{ fieldError('startDate') }}</p>}</div>
                <div><label class="field-label" for="vat-end">تاریخ پایان</label><input id="vat-end" inputmode="numeric" dir="ltr" placeholder="1405/12/29" [value]="draft().endDate" (input)="updateDate('endDate', $event)" class="field-input text-left">@if (fieldError('endDate')) {<p class="field-error">{{ fieldError('endDate') }}</p>}</div>
                <div><label class="field-label" for="vat-tax">درصد مالیات</label><input id="vat-tax" inputmode="decimal" dir="ltr" [value]="draft().taxPercent" (input)="updatePercent('taxPercent', $event)" class="field-input text-left">@if (fieldError('taxPercent')) {<p class="field-error">{{ fieldError('taxPercent') }}</p>}</div>
                <div><label class="field-label" for="vat-duty">درصد عوارض</label><input id="vat-duty" inputmode="decimal" dir="ltr" [value]="draft().dutyPercent" (input)="updatePercent('dutyPercent', $event)" class="field-input text-left">@if (fieldError('dutyPercent')) {<p class="field-error">{{ fieldError('dutyPercent') }}</p>}</div>
                <div class="sm:col-span-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm font-bold text-primary">جمع ارزش افزوده: {{ combinedPreview() }}</div>
                @if (fieldError('totalPercent')) {<p class="field-error sm:col-span-2">{{ fieldError('totalPercent') }}</p>}
                <div class="sm:col-span-2"><label class="field-label" for="vat-description">توضیحات</label><textarea id="vat-description" rows="3" [value]="draft().description" (input)="updateDraft('description', inputValue($event))" class="field-input h-auto py-3"></textarea></div>
              </div>
              @if (conflictError()) {<div role="alert" class="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm font-bold leading-6 text-danger">{{ conflictError() }}</div>}
              <div class="mt-5 flex flex-col-reverse gap-2 border-t border-border pt-4 dark:border-slate-700 sm:flex-row sm:justify-end"><button type="button" (click)="closeForm()" class="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200">انصراف</button><button type="submit" class="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white">{{ editingId() === null ? 'ثبت' : 'ویرایش' }}</button></div>
            </form>
          </section>
        </div>
      }

      @if (toggleTarget(); as row) {
        <div appEscToClose (escPressed)="cancelToggle()" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm" (click)="cancelToggle()"><section role="alertdialog" aria-modal="true" aria-labelledby="vat-toggle-title" class="w-full max-w-md rounded-2xl border border-border bg-surface p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800" (click)="$event.stopPropagation()"><h2 id="vat-toggle-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">تأیید {{ row.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی' }}</h2><p class="mt-2 text-sm leading-7 text-muted">با این تغییر، ارزش افزوده همه فاکتورهای صادرشده در بازه {{ row.startDate }} تا {{ row.endDate }} دوباره از مبلغ پایه محاسبه می‌شود. آیا ادامه می‌دهید؟</p>@if (conflictError()) {<p role="alert" class="mt-3 rounded-xl bg-danger/10 p-3 text-sm font-bold text-danger">{{ conflictError() }}</p>}<div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" (click)="cancelToggle()" class="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200">انصراف</button><button type="button" (click)="confirmToggle()" class="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white">تأیید</button></div></section></div>
      }
    </div>
  `,
  styles: [`
    .field-label { display: block; margin-bottom: .375rem; font-size: .875rem; font-weight: 700; color: rgb(var(--color-foreground)); }
    .field-input { width: 100%; min-height: 2.75rem; border: 1px solid rgb(var(--color-border)); border-radius: .75rem; padding-inline: .75rem; color: rgb(var(--color-foreground)); background: rgb(var(--color-background)); outline: none; }
    .field-input:focus { border-color: rgb(var(--color-primary)); box-shadow: 0 0 0 2px rgb(var(--color-primary) / .15); }
    .field-error { margin-top: .375rem; font-size: .75rem; font-weight: 700; color: rgb(var(--color-danger)); }
  `]
})
export class InternalVatSettingsComponent {
  private readonly financial = inject(Fish24FinancialPreviewService);
  private readonly preferences = inject(InternalListPreferencesService);
  private readonly xlsx = inject(PlainXlsxService);
  private readonly toast = inject(ToastService);
  private readonly restored = this.preferences.loadFilters(LIST_ID, FILTER_DEFAULTS, validateFilters);

  readonly columns = COLUMNS;
  readonly defaultColumnIds = COLUMNS.map(column => column.id);
  readonly selectedColumnIds = signal<readonly string[]>(this.preferences.load(LIST_ID, this.defaultColumnIds, this.defaultColumnIds));
  readonly visibleColumns = computed(() => this.columns.filter(column => this.selectedColumnIds().includes(column.id)));
  readonly columnSearches = signal<InternalListColumnSearches>({});
  readonly tableSort = signal<InternalListSort>({ columnId: null, direction: null });
  readonly columnChooserOpen = signal(false);
  readonly titleDraft = signal(this.restored.title);
  readonly inactiveDraft = signal(this.restored.inactiveOnly);
  readonly titleFilter = signal(this.restored.title);
  readonly inactiveOnly = signal(this.restored.inactiveOnly);
  readonly filteredRows = computed(() => {
    const title = normalizeFish24Digits(this.titleFilter()).trim().toLocaleLowerCase('fa-IR');
    return this.financial.vatSettings().filter(row => (!title || normalizeFish24Digits(row.title).toLocaleLowerCase('fa-IR').includes(title)) && (!this.inactiveOnly() || !row.isActive));
  });
  readonly columnFilteredRows = computed(() => filterByInternalListColumns(this.filteredRows(), this.columns, this.selectedColumnIds(), this.columnSearches()));
  readonly tableRows = computed(() => sortInternalListRows(this.columnFilteredRows(), this.columns, this.tableSort()));
  readonly formOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly draft = signal<VatSettingDraft>(this.emptyDraft());
  readonly fieldErrors = signal<Readonly<Record<string, string>>>({});
  readonly conflictError = signal('');
  readonly toggleId = signal<number | null>(null);
  readonly toggleTarget = computed(() => this.financial.vatSettings().find(row => row.id === this.toggleId()) ?? null);
  readonly combinedPreview = computed(() => {
    const tax = this.previewPercent(this.draft().taxPercent);
    const duty = this.previewPercent(this.draft().dutyPercent);
    return tax === null || duty === null ? '—' : this.formatPercent(tax + duty);
  });

  applyFilters(event: Event): void { event.preventDefault(); this.titleFilter.set(this.titleDraft().trim()); this.inactiveOnly.set(this.inactiveDraft()); this.persistFilters(); }
  showAll(): void { this.titleDraft.set(''); this.inactiveDraft.set(false); this.titleFilter.set(''); this.inactiveOnly.set(false); this.preferences.resetFilters(LIST_ID); }
  inputValue(event: Event): string { return (event.target as HTMLInputElement | HTMLTextAreaElement).value; }
  checkboxValue(event: Event): boolean { return (event.target as HTMLInputElement).checked; }
  setColumnSearch(id: string, value: string): void { this.columnSearches.update(searches => ({ ...searches, [id]: value })); }
  cycleSort(id: string): void { this.tableSort.update(sort => nextInternalListSort(sort, id)); }
  sortIndicator(id: string): string { const sort = this.tableSort(); return sort.columnId !== id ? '↕' : sort.direction === 'asc' ? '↑' : '↓'; }
  sortAriaLabel(column: InternalListColumn<VatSettingRecord>): string { return `مرتب‌سازی ستون ${column.label}`; }
  isColumnVisible(id: string): boolean { return this.selectedColumnIds().includes(id); }
  isOnlyVisibleColumn(id: string): boolean { return this.isColumnVisible(id) && this.selectedColumnIds().length === 1; }
  toggleColumn(id: string, event: Event): void { const next = this.checkboxValue(event) ? [...this.selectedColumnIds(), id] : this.selectedColumnIds().filter(item => item !== id); if (!next.length) return; this.selectedColumnIds.set(this.preferences.save(LIST_ID, next, this.defaultColumnIds)); if (!this.checkboxValue(event)) { this.setColumnSearch(id, ''); if (this.tableSort().columnId === id) this.tableSort.set({ columnId: null, direction: null }); } }
  restoreColumns(): void { this.selectedColumnIds.set(this.preferences.reset(LIST_ID, this.defaultColumnIds, this.defaultColumnIds)); this.columnSearches.set({}); this.tableSort.set({ columnId: null, direction: null }); }
  displayValue(column: InternalListColumn<VatSettingRecord>, row: VatSettingRecord): string { return String(column.value(row) ?? ''); }
  numberValue(column: InternalListColumn<VatSettingRecord>, row: VatSettingRecord): number { return Number(column.value(row)); }
  isPercentColumn(id: string): boolean { return id === 'taxPercent' || id === 'dutyPercent' || id === 'totalPercent'; }
  formatNumber(value: number): string { return new Intl.NumberFormat('fa-IR').format(value); }
  formatPercent(value: number): string { return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 4 }).format(value)}٪`; }
  statusClass(active: boolean): string { return active ? 'inline-flex rounded-full bg-success/15 px-2 py-1 text-xs font-bold text-success' : 'inline-flex rounded-full bg-danger/15 px-2 py-1 text-xs font-bold text-danger'; }
  exportRows(): void { const columns = this.visibleColumns(); const rows = this.filteredRows().map(row => columns.map(column => column.exportValue ? column.exportValue(row) : String(column.value(row) ?? ''))); this.xlsx.export('fish24-vat-settings.xlsx', columns.map(column => column.label), rows); this.toast.show(`${this.formatNumber(rows.length)} رکورد فیلترشده برای Excel آماده شد.`, 'success'); }

  openCreate(): void { this.editingId.set(null); this.draft.set(this.emptyDraft()); this.fieldErrors.set({}); this.conflictError.set(''); this.formOpen.set(true); }
  openEdit(row: VatSettingRecord): void { this.editingId.set(row.id); this.draft.set({ title: row.title, startDate: row.startDate, endDate: row.endDate, taxPercent: String(row.taxPercent), dutyPercent: String(row.dutyPercent), description: row.description, isActive: row.isActive }); this.fieldErrors.set({}); this.conflictError.set(''); this.formOpen.set(true); }
  closeForm(): void { this.formOpen.set(false); this.fieldErrors.set({}); this.conflictError.set(''); }
  updateDraft(field: keyof VatSettingDraft, value: string | boolean): void { this.draft.update(current => ({ ...current, [field]: value })); this.fieldErrors.update(errors => { const next = { ...errors }; delete next[field]; delete next['totalPercent']; return next; }); this.conflictError.set(''); }
  updateDate(field: 'startDate' | 'endDate', event: Event): void { const input = event.target as HTMLInputElement; const digits = normalizeFish24Digits(input.value).replace(/\D/g, '').slice(0, 8); const formatted = digits.length <= 4 ? digits : digits.length <= 6 ? `${digits.slice(0, 4)}/${digits.slice(4)}` : `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`; input.value = formatted; this.updateDraft(field, formatted); }
  updatePercent(field: 'taxPercent' | 'dutyPercent', event: Event): void { const input = event.target as HTMLInputElement; const normalized = normalizeFish24Digits(input.value).replace(/٫|,/g, '.').replace(/[^\d.]/g, ''); const firstDot = normalized.indexOf('.'); const value = firstDot < 0 ? normalized : normalized.slice(0, firstDot + 1) + normalized.slice(firstDot + 1).replace(/\./g, ''); input.value = value; this.updateDraft(field, value); }
  fieldError(field: string): string { return this.fieldErrors()[field] ?? ''; }
  save(event: Event): void { event.preventDefault(); const result = this.financial.saveVatSetting(this.draft(), this.editingId()); this.fieldErrors.set(result.fieldErrors); if (result.conflict) { this.conflictError.set(`این بازه با تنظیم فعال «${result.conflict.title}» از ${result.conflict.startDate} تا ${result.conflict.endDate} هم‌پوشانی دارد. هیچ تغییری اعمال نشد.`); return; } if (!result.ok) return; this.closeForm(); this.toast.show('تنظیمات ارزش افزوده و فاکتورهای مرتبط با موفقیت بازمحاسبه شدند.', 'success'); }
  requestToggle(row: VatSettingRecord): void { this.toggleId.set(row.id); this.conflictError.set(''); }
  cancelToggle(): void { this.toggleId.set(null); this.conflictError.set(''); }
  confirmToggle(): void { const row = this.toggleTarget(); if (!row) return; const result = this.financial.toggleVatSetting(row.id); if (result.conflict) { this.conflictError.set(`فعال‌سازی ممکن نیست؛ بازه با تنظیم فعال «${result.conflict.title}» هم‌پوشانی دارد. هیچ تغییری اعمال نشد.`); return; } this.cancelToggle(); this.toast.show('وضعیت تنظیم و مالیات فاکتورهای بازه با موفقیت به‌روزرسانی شد.', 'success'); }

  private emptyDraft(): VatSettingDraft { return { title: '', startDate: '', endDate: '', taxPercent: '', dutyPercent: '', description: '', isActive: true }; }
  private previewPercent(value: string): number | null { const parsed = Number(normalizeFish24Digits(value).replace(/٫|,/g, '.')); return value.trim() && Number.isFinite(parsed) ? parsed : null; }
  private persistFilters(): void { const filters = { title: this.titleFilter(), inactiveOnly: this.inactiveOnly() }; if (!filters.title && !filters.inactiveOnly) this.preferences.resetFilters(LIST_ID); else this.preferences.saveFilters(LIST_ID, filters); }
}

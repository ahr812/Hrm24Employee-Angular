import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DocumentPricingDraft,
  DocumentPricingPriceField,
  DocumentPricingRecord,
  Fish24DocumentPricingPreviewService
} from '../../../../core/fish24/financial/fish24-document-pricing-preview.service';
import { normalizeFish24Digits } from '../../../../core/fish24/financial/fish24-financial-preview.service';
import { EscToCloseDirective } from '../../../../shared/directives/esc-to-close.directive';
import {
  InternalListColumn,
  InternalListColumnSearches,
  InternalListSort,
  filterByInternalListColumns,
  nextInternalListSort,
  sortInternalListRows
} from '../../../../shared/ui/data-list/internal-list.model';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { PlainXlsxService } from '../../../../shared/ui/data-list/plain-xlsx.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface PricingMainFilters { readonly inactiveOnly: boolean; }
interface PricingInput { readonly key: DocumentPricingPriceField; readonly label: string; }

const LIST_ID = 'internal-pricing-settings';
const FILTER_DEFAULTS: PricingMainFilters = { inactiveOnly: false };
const COLUMNS: readonly InternalListColumn<DocumentPricingRecord>[] = [
  { id: 'id', label: 'شناسه', value: row => row.id, minWidth: '6rem', ltr: true },
  { id: 'startDate', label: 'تاریخ شروع', value: row => row.startDate, minWidth: '9rem', ltr: true },
  { id: 'endDate', label: 'تاریخ پایان', value: row => row.endDate, minWidth: '9rem', ltr: true },
  { id: 'page1', label: 'صفحه ۱ماهه', value: row => row.pagePricesRial[1], exportValue: row => row.pagePricesRial[1], minWidth: '9rem' },
  { id: 'page3', label: 'صفحه ۳ماهه', value: row => row.pagePricesRial[3], exportValue: row => row.pagePricesRial[3], minWidth: '9rem' },
  { id: 'page6', label: 'صفحه ۶ماهه', value: row => row.pagePricesRial[6], exportValue: row => row.pagePricesRial[6], minWidth: '9rem' },
  { id: 'page12', label: 'صفحه ۱ساله', value: row => row.pagePricesRial[12], exportValue: row => row.pagePricesRial[12], minWidth: '9rem' },
  { id: 'sms', label: 'هزینه پیامک', value: row => row.smsUnitPriceRial, exportValue: row => row.smsUnitPriceRial, minWidth: '9rem' },
  { id: 'postal', label: 'هزینه پست', value: row => row.postalUnitPriceRial, exportValue: row => row.postalUnitPriceRial, minWidth: '9rem' },
  { id: 'isActive', label: 'وضعیت', value: row => row.isActive ? 'فعال' : 'غیرفعال', minWidth: '7rem' }
];

function validateFilters(value: unknown): PricingMainFilters | null {
  if (typeof value !== 'object' || value === null) return null;
  return { inactiveOnly: typeof (value as Partial<PricingMainFilters>).inactiveOnly === 'boolean' ? (value as Partial<PricingMainFilters>).inactiveOnly! : false };
}

@Component({
  selector: 'app-internal-pricing',
  standalone: true,
  imports: [FormsModule, EscToCloseDirective, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-4 animate-fade-in-up sm:space-y-5" dir="rtl">
      <header class="flex min-w-0 items-center gap-3 sm:gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14"><ui-icon name="tag" [size]="28" class="text-primary"></ui-icon></div>
        <div class="min-w-0"><h1 class="text-2xl font-bold text-primary sm:text-3xl">مدیریت قیمت‌گذاری</h1><p class="mt-0.5 text-sm text-muted">تعرفه‌های ریالی خدمات فیش ۲۴</p></div>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="pricing-filter-title">
        <div class="mb-3 flex items-center gap-3"><div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon name="search" [size]="19"></ui-icon></div><h2 id="pricing-filter-title" class="text-base font-extrabold text-foreground dark:text-slate-100 sm:text-lg">جستجو</h2></div>
        <form class="flex flex-col gap-3 sm:flex-row sm:items-end" (submit)="applyFilters($event)">
          <label class="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200"><input type="checkbox" [checked]="inactiveDraft()" (change)="inactiveDraft.set(checkboxValue($event))" class="h-4 w-4 accent-primary">غیرفعال</label>
          <div class="grid grid-cols-2 gap-2 sm:flex"><button type="submit" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white"><ui-icon name="search" [size]="17"></ui-icon>جستجو</button><button type="button" (click)="showAll()" class="h-11 rounded-xl border border-border px-4 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200">مشاهده همه</button></div>
        </form>
      </section>

      <section class="rounded-2xl border border-border bg-surface shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="pricing-list-title">
        <div class="flex flex-col gap-3 border-b border-border p-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><h2 id="pricing-list-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">لیست قیمت‌گذاری ({{ formatNumber(filteredRows().length) }} رکورد)</h2><p class="mt-1 text-xs text-muted">مبالغ به ریال هستند؛ تغییر معتبر، رسیدهای داخلی وابسته را بازمحاسبه می‌کند.</p></div>
          <div class="flex flex-wrap gap-2"><button type="button" (click)="openCreate()" class="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white"><ui-icon name="plus" [size]="17"></ui-icon>جدید</button><button type="button" (click)="columnChooserOpen.set(!columnChooserOpen())" class="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200"><ui-icon name="sliders" [size]="16"></ui-icon>انتخاب ستون</button><button type="button" (click)="exportRows()" class="inline-flex min-h-10 items-center gap-2 rounded-xl border border-success/30 px-3 text-sm font-bold text-success"><ui-icon name="download" [size]="16"></ui-icon>Excel</button></div>
        </div>

        @if (columnChooserOpen()) {
          <div class="border-b border-border bg-background/60 p-3 dark:border-slate-700 dark:bg-slate-900/30"><div class="flex flex-wrap gap-2">@for (column of columns; track column.id) {<label class="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"><input type="checkbox" [checked]="isColumnVisible(column.id)" [disabled]="isOnlyVisibleColumn(column.id)" (change)="toggleColumn(column.id, $event)" class="accent-primary">{{ column.label }}</label>}<button type="button" (click)="restoreColumns()" class="rounded-lg px-3 py-2 text-xs font-bold text-primary">بازگردانی ستون‌های پیش‌فرض</button></div></div>
        }

        <div class="max-w-full overflow-x-auto">
          <table class="min-w-max w-full text-sm">
            <thead class="bg-background/80 dark:bg-slate-900/60"><tr>@for (column of visibleColumns(); track column.id) {<th class="px-2 py-3 text-right font-bold text-muted" [style.min-width]="column.minWidth"><button type="button" (click)="cycleSort(column.id)" class="flex w-full items-center justify-between gap-2 text-right" [attr.aria-label]="'مرتب‌سازی ستون ' + column.label"><span>{{ column.label }}</span><span aria-hidden="true">{{ sortIndicator(column.id) }}</span></button></th>}<th class="sticky left-0 min-w-28 bg-background/95 px-2 py-3 text-center font-bold text-muted dark:bg-slate-900">عملیات</th></tr><tr>@for (column of visibleColumns(); track column.id) {<th class="px-2 pb-2"><input type="search" [attr.aria-label]="'جستجو در ستون ' + column.label" [value]="columnSearches()[column.id] || ''" (input)="setColumnSearch(column.id, inputValue($event))" class="h-9 w-full rounded-lg border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"></th>}<th class="sticky left-0 bg-background/95 dark:bg-slate-900"></th></tr></thead>
            <tbody class="divide-y divide-border dark:divide-slate-700">@for (row of tableRows(); track row.id) {<tr class="hover:bg-primary/5 dark:hover:bg-primary/10">@for (column of visibleColumns(); track column.id) {<td class="px-2 py-3 text-foreground dark:text-slate-200" [style.min-width]="column.minWidth" [attr.dir]="column.ltr ? 'ltr' : null">@if (column.id === 'isActive') {<span [class]="statusClass(row.isActive)">{{ row.isActive ? 'فعال' : 'غیرفعال' }}</span>} @else if (isPriceColumn(column.id)) { {{ formatRial(numberValue(column, row)) }} } @else { {{ displayValue(column, row) }} }</td>}<td class="sticky left-0 bg-surface px-2 py-3 text-center dark:bg-slate-800"><div class="flex justify-center gap-2"><button type="button" (click)="openEdit(row)" [attr.aria-label]="'ویرایش تعرفه ' + row.id" class="rounded-lg border border-primary/30 p-2 text-primary hover:bg-primary/10"><ui-icon name="edit" [size]="16"></ui-icon></button><button type="button" (click)="requestToggle(row)" [attr.aria-label]="(row.isActive ? 'غیرفعال‌سازی ' : 'فعال‌سازی ') + row.id" [class]="row.isActive ? 'rounded-lg border border-danger/30 p-2 text-danger hover:bg-danger/10' : 'rounded-lg border border-success/30 p-2 text-success hover:bg-success/10'"><ui-icon [name]="row.isActive ? 'lock' : 'check-circle'" [size]="16"></ui-icon></button></div></td></tr>} @if (!tableRows().length) {<tr><td [attr.colspan]="visibleColumns().length + 1" class="px-4 py-10 text-center font-semibold text-muted">رکوردی مطابق فیلترها پیدا نشد.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      @if (formOpen()) {
        <div appEscToClose (escPressed)="closeForm()" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm" (click)="closeForm()">
          <section role="dialog" aria-modal="true" aria-labelledby="pricing-form-title" class="my-auto max-h-[calc(100vh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl dark:border-slate-700 dark:bg-slate-800" (click)="$event.stopPropagation()">
            <div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface p-4 dark:border-slate-700 dark:bg-slate-800"><h2 id="pricing-form-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">{{ editingId() === null ? 'ایجاد قیمت‌گذاری' : 'ویرایش قیمت‌گذاری' }}</h2><button type="button" (click)="closeForm()" class="rounded-lg p-2 text-muted" aria-label="بستن"><ui-icon name="x" [size]="19"></ui-icon></button></div>
            <form class="p-4 sm:p-5" (submit)="save($event)">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label class="field-label" for="pricing-start">تاریخ شروع</label><input id="pricing-start" inputmode="numeric" dir="ltr" placeholder="1405/01/01" [value]="draft().startDate" (input)="updateDate('startDate', $event)" class="field-input text-left">@if (fieldError('startDate')) {<p class="field-error">{{ fieldError('startDate') }}</p>}</div>
                <div><label class="field-label" for="pricing-end">تاریخ پایان</label><input id="pricing-end" inputmode="numeric" dir="ltr" placeholder="1405/12/29" [value]="draft().endDate" (input)="updateDate('endDate', $event)" class="field-input text-left">@if (fieldError('endDate')) {<p class="field-error">{{ fieldError('endDate') }}</p>}</div>
              </div>
              @for (group of inputGroups; track group.title) {
                <fieldset class="mt-5 rounded-xl border border-border p-3 dark:border-slate-700 sm:p-4"><legend class="px-2 text-sm font-extrabold text-primary">{{ group.title }}</legend><div class="grid grid-cols-1 gap-4 sm:grid-cols-2">@for (input of group.inputs; track input.key) {<div><label class="field-label" [for]="'pricing-' + input.key">{{ input.label }}</label><input [id]="'pricing-' + input.key" inputmode="numeric" dir="ltr" [value]="draft()[input.key]" (input)="updatePrice(input.key, $event)" class="field-input text-left">@if (fieldError(input.key)) {<p class="field-error">{{ fieldError(input.key) }}</p>}</div>}</div></fieldset>
              }
              <label class="mt-5 flex cursor-pointer items-center gap-2 rounded-xl border border-border p-3 text-sm font-bold text-foreground dark:border-slate-700 dark:text-slate-200"><input type="checkbox" [checked]="draft().isActive" (change)="updateActive($event)" class="h-4 w-4 accent-primary">این بازه فعال باشد</label>
              @if (mutationError()) {<div role="alert" class="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm font-bold leading-6 text-danger">{{ mutationError() }}</div>}
              <div class="mt-5 flex flex-col-reverse gap-2 border-t border-border pt-4 dark:border-slate-700 sm:flex-row sm:justify-end"><button type="button" (click)="closeForm()" class="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200">انصراف</button><button type="submit" class="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white">{{ editingId() === null ? 'ثبت' : 'ویرایش' }}</button></div>
            </form>
          </section>
        </div>
      }

      @if (toggleTarget(); as row) {
        <div appEscToClose (escPressed)="cancelToggle()" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm" (click)="cancelToggle()"><section role="alertdialog" aria-modal="true" aria-labelledby="pricing-toggle-title" class="w-full max-w-md rounded-2xl border border-border bg-surface p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800" (click)="$event.stopPropagation()"><h2 id="pricing-toggle-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">تأیید {{ row.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی' }}</h2><p class="mt-2 text-sm leading-7 text-muted">رسیدهای داخلی وابسته با حفظ تاریخ، تعداد صفحه، پلن و انتخاب پیامک بازمحاسبه می‌شوند. هیچ برداشت یا بازپرداختی انجام نمی‌شود.</p>@if (mutationError()) {<p role="alert" class="mt-3 rounded-xl bg-danger/10 p-3 text-sm font-bold text-danger">{{ mutationError() }}</p>}<div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" (click)="cancelToggle()" class="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200">انصراف</button><button type="button" (click)="confirmToggle()" class="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white">تأیید</button></div></section></div>
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
export class InternalPricingComponent {
  private readonly pricing = inject(Fish24DocumentPricingPreviewService);
  private readonly preferences = inject(InternalListPreferencesService);
  private readonly xlsx = inject(PlainXlsxService);
  private readonly toast = inject(ToastService);
  private readonly restored = this.preferences.loadFilters(LIST_ID, FILTER_DEFAULTS, validateFilters);

  readonly columns = COLUMNS;
  readonly inputGroups: readonly { title: string; inputs: readonly PricingInput[] }[] = [
    { title: 'هزینه‌های عمومی', inputs: [{ key: 'smsUnitPriceRial', label: 'هزینه ارسال هر SMS' }, { key: 'postalUnitPriceRial', label: 'هزینه ارسال پستی' }] },
    { title: 'قیمت هر صفحه (ریال)', inputs: this.durationInputs('page') },
    { title: 'قیمت هر فایل (ریال)', inputs: this.durationInputs('file') },
    { title: 'قیمت هر پرسنل (ریال)', inputs: this.durationInputs('personnel') }
  ];
  readonly defaultColumnIds = COLUMNS.map(column => column.id);
  readonly selectedColumnIds = signal<readonly string[]>(this.preferences.load(LIST_ID, this.defaultColumnIds, this.defaultColumnIds));
  readonly visibleColumns = computed(() => this.columns.filter(column => this.selectedColumnIds().includes(column.id)));
  readonly columnSearches = signal<InternalListColumnSearches>({});
  readonly tableSort = signal<InternalListSort>({ columnId: null, direction: null });
  readonly columnChooserOpen = signal(false);
  readonly inactiveDraft = signal(this.restored.inactiveOnly);
  readonly inactiveOnly = signal(this.restored.inactiveOnly);
  readonly filteredRows = computed(() => this.pricing.pricingSettings().filter(row => !this.inactiveOnly() || !row.isActive));
  readonly columnFilteredRows = computed(() => filterByInternalListColumns(this.filteredRows(), this.columns, this.selectedColumnIds(), this.columnSearches()));
  readonly tableRows = computed(() => sortInternalListRows(this.columnFilteredRows(), this.columns, this.tableSort()));
  readonly formOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly draft = signal<DocumentPricingDraft>(this.emptyDraft());
  readonly fieldErrors = signal<Readonly<Record<string, string>>>({});
  readonly mutationError = signal('');
  readonly toggleId = signal<number | null>(null);
  readonly toggleTarget = computed(() => this.pricing.pricingSettings().find(row => row.id === this.toggleId()) ?? null);

  applyFilters(event: Event): void { event.preventDefault(); this.inactiveOnly.set(this.inactiveDraft()); this.persistFilters(); }
  showAll(): void { this.inactiveDraft.set(false); this.inactiveOnly.set(false); this.preferences.resetFilters(LIST_ID); }
  inputValue(event: Event): string { return (event.target as HTMLInputElement).value; }
  checkboxValue(event: Event): boolean { return (event.target as HTMLInputElement).checked; }
  setColumnSearch(id: string, value: string): void { this.columnSearches.update(searches => ({ ...searches, [id]: value })); }
  cycleSort(id: string): void { this.tableSort.update(sort => nextInternalListSort(sort, id)); }
  sortIndicator(id: string): string { const sort = this.tableSort(); return sort.columnId !== id ? '↕' : sort.direction === 'asc' ? '↑' : '↓'; }
  isColumnVisible(id: string): boolean { return this.selectedColumnIds().includes(id); }
  isOnlyVisibleColumn(id: string): boolean { return this.isColumnVisible(id) && this.selectedColumnIds().length === 1; }
  toggleColumn(id: string, event: Event): void { const checked = this.checkboxValue(event); const next = checked ? [...this.selectedColumnIds(), id] : this.selectedColumnIds().filter(item => item !== id); if (!next.length) return; this.selectedColumnIds.set(this.preferences.save(LIST_ID, next, this.defaultColumnIds)); if (!checked) { this.setColumnSearch(id, ''); if (this.tableSort().columnId === id) this.tableSort.set({ columnId: null, direction: null }); } }
  restoreColumns(): void { this.selectedColumnIds.set(this.preferences.reset(LIST_ID, this.defaultColumnIds, this.defaultColumnIds)); this.columnSearches.set({}); this.tableSort.set({ columnId: null, direction: null }); }
  displayValue(column: InternalListColumn<DocumentPricingRecord>, row: DocumentPricingRecord): string { return String(column.value(row) ?? ''); }
  numberValue(column: InternalListColumn<DocumentPricingRecord>, row: DocumentPricingRecord): number { return Number(column.value(row)); }
  isPriceColumn(id: string): boolean { return ['page1', 'page3', 'page6', 'page12', 'sms', 'postal'].includes(id); }
  formatNumber(value: number): string { return new Intl.NumberFormat('fa-IR').format(value); }
  formatRial(value: number): string { return `${this.formatNumber(value)} ریال`; }
  statusClass(active: boolean): string { return active ? 'inline-flex rounded-full bg-success/15 px-2 py-1 text-xs font-bold text-success' : 'inline-flex rounded-full bg-danger/15 px-2 py-1 text-xs font-bold text-danger'; }
  exportRows(): void { const columns = this.visibleColumns(); const rows = this.filteredRows().map(row => columns.map(column => column.exportValue ? column.exportValue(row) : String(column.value(row) ?? ''))); this.xlsx.export('fish24-pricing-settings.xlsx', columns.map(column => column.label), rows); this.toast.show(`${this.formatNumber(rows.length)} رکورد فیلترشده برای Excel آماده شد.`, 'success'); }

  openCreate(): void { this.editingId.set(null); this.draft.set(this.emptyDraft()); this.fieldErrors.set({}); this.mutationError.set(''); this.formOpen.set(true); }
  openEdit(row: DocumentPricingRecord): void { this.editingId.set(row.id); this.draft.set({ startDate: row.startDate, endDate: row.endDate, smsUnitPriceRial: String(row.smsUnitPriceRial), postalUnitPriceRial: String(row.postalUnitPriceRial), page1Rial: String(row.pagePricesRial[1]), page3Rial: String(row.pagePricesRial[3]), page6Rial: String(row.pagePricesRial[6]), page12Rial: String(row.pagePricesRial[12]), file1Rial: String(row.filePricesRial[1]), file3Rial: String(row.filePricesRial[3]), file6Rial: String(row.filePricesRial[6]), file12Rial: String(row.filePricesRial[12]), personnel1Rial: String(row.personnelPricesRial[1]), personnel3Rial: String(row.personnelPricesRial[3]), personnel6Rial: String(row.personnelPricesRial[6]), personnel12Rial: String(row.personnelPricesRial[12]), isActive: row.isActive }); this.fieldErrors.set({}); this.mutationError.set(''); this.formOpen.set(true); }
  closeForm(): void { this.formOpen.set(false); this.fieldErrors.set({}); this.mutationError.set(''); }
  updateDate(field: 'startDate' | 'endDate', event: Event): void { const input = event.target as HTMLInputElement; const digits = normalizeFish24Digits(input.value).replace(/\D/g, '').slice(0, 8); const value = digits.length <= 4 ? digits : digits.length <= 6 ? `${digits.slice(0, 4)}/${digits.slice(4)}` : `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`; input.value = value; this.updateDraft(field, value); }
  updatePrice(field: DocumentPricingPriceField, event: Event): void { const input = event.target as HTMLInputElement; const value = normalizeFish24Digits(input.value); input.value = value; this.updateDraft(field, value); }
  updateActive(event: Event): void { this.draft.update(current => ({ ...current, isActive: this.checkboxValue(event) })); this.mutationError.set(''); }
  fieldError(field: string): string { return this.fieldErrors()[field] ?? ''; }
  save(event: Event): void { event.preventDefault(); const result = this.pricing.savePricing(this.draft(), this.editingId()); this.fieldErrors.set(result.fieldErrors); if (!result.ok) { this.mutationError.set(this.resultError(result)); return; } this.closeForm(); this.toast.show('تنظیم قیمت‌گذاری ذخیره و رسیدهای داخلی وابسته بازمحاسبه شد.', 'success'); }
  requestToggle(row: DocumentPricingRecord): void { this.toggleId.set(row.id); this.mutationError.set(''); }
  cancelToggle(): void { this.toggleId.set(null); this.mutationError.set(''); }
  confirmToggle(): void { const row = this.toggleTarget(); if (!row) return; const result = this.pricing.togglePricing(row.id); if (!result.ok) { this.mutationError.set(this.resultError(result)); return; } this.cancelToggle(); this.toast.show('وضعیت قیمت‌گذاری و رسیدهای داخلی وابسته به‌روزرسانی شد.', 'success'); }

  private updateDraft(field: keyof DocumentPricingDraft, value: string): void { this.draft.update(current => ({ ...current, [field]: value })); this.fieldErrors.update(errors => { const next = { ...errors }; delete next[field]; return next; }); this.mutationError.set(''); }
  private persistFilters(): void { const filters = { inactiveOnly: this.inactiveOnly() }; if (!filters.inactiveOnly) this.preferences.resetFilters(LIST_ID); else this.preferences.saveFilters(LIST_ID, filters); }
  private resultError(result: ReturnType<Fish24DocumentPricingPreviewService['savePricing']>): string { if (result.conflict) return `این بازه با قیمت‌گذاری فعال شماره ${result.conflict.id} از ${result.conflict.startDate} تا ${result.conflict.endDate} هم‌پوشانی دارد. هیچ تغییری اعمال نشد.`; if (result.orphanedReceipt) return `تغییر رد شد؛ رسید ${result.orphanedReceipt.id} با تاریخ ${result.orphanedReceipt.issueDate} بدون قیمت‌گذاری فعال می‌ماند.`; return Object.keys(result.fieldErrors).length ? '' : 'تغییر قابل اعمال نیست.'; }
  private durationInputs(prefix: 'page' | 'file' | 'personnel'): readonly PricingInput[] { const labels = { page: 'صفحه', file: 'فایل', personnel: 'پرسنل' }; return ([1, 3, 6, 12] as const).map(months => ({ key: `${prefix}${months}Rial` as DocumentPricingPriceField, label: `قیمت هر ${labels[prefix]} با میزبانی ${months === 12 ? 'یک‌ساله' : `${months} ماهه`}` })); }
  private emptyDraft(): DocumentPricingDraft { return { startDate: '', endDate: '', smsUnitPriceRial: '', postalUnitPriceRial: '', page1Rial: '', page3Rial: '', page6Rial: '', page12Rial: '', file1Rial: '', file3Rial: '', file6Rial: '', file12Rial: '', personnel1Rial: '', personnel3Rial: '', personnel6Rial: '', personnel12Rial: '', isActive: true }; }
}

import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { compareFormalNumbers, Fish24InternalInvoicePreviewService, InternalFormalInvoiceListItem, normalizedFormalNumber } from '../../../../core/fish24/financial/fish24-internal-invoice-preview.service';
import { normalizeFish24Digits, normalizeJalaliDate } from '../../../../core/fish24/financial/fish24-financial-preview.service';
import { EscToCloseDirective } from '../../../../shared/directives/esc-to-close.directive';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { InternalListColumn, InternalListColumnSearches, InternalListSort, filterByInternalListColumns, nextInternalListSort, sortInternalListRows } from '../../../../shared/ui/data-list/internal-list.model';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { PlainXlsxService } from '../../../../shared/ui/data-list/plain-xlsx.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { buildInvoiceExportRows, INVOICE_EXPORT_HEADERS } from './invoice-export';

type UserTypeFilter = 'all' | 'حقیقی' | 'حقوقی';
interface InvoiceFilters { readonly mobile: string; readonly fromDate: string; readonly toDate: string; readonly fromNumber: string; readonly toNumber: string; readonly userType: UserTypeFilter; }

const LIST_ID = 'internal-formal-invoices';
const FILTER_DEFAULTS: InvoiceFilters = { mobile: '', fromDate: '', toDate: '', fromNumber: '', toNumber: '', userType: 'all' };
const COLUMNS: readonly InternalListColumn<InternalFormalInvoiceListItem>[] = [
  { id: 'number', label: 'ملخی', value: row => row.formalInvoiceNumber, compare: (left, right) => compareFormalNumbers(left.formalInvoiceNumber, right.formalInvoiceNumber), minWidth: '9rem', ltr: true },
  { id: 'date', label: 'تاریخ', value: row => row.issueDate, minWidth: '9rem', ltr: true },
  { id: 'mobile', label: 'موبایل', value: row => row.mobile, minWidth: '10rem', ltr: true },
  { id: 'name', label: 'نام', value: row => row.name, minWidth: '11rem' },
  { id: 'company', label: 'نام شرکت', value: row => row.companyName, minWidth: '14rem' },
  { id: 'type', label: 'نوع', value: row => row.userType, minWidth: '8rem' },
  { id: 'title', label: 'عنوان', value: row => row.title, minWidth: '15rem' },
  { id: 'amount', label: 'مبلغ', value: row => row.amountRial, exportValue: row => row.amountRial, minWidth: '11rem' }
];

function validateStoredFilters(value: unknown): InvoiceFilters | null {
  if (typeof value !== 'object' || value === null) return null;
  const item = value as Partial<InvoiceFilters>;
  const date = (candidate: unknown) => typeof candidate === 'string' && candidate ? normalizeJalaliDate(candidate) ?? '' : '';
  const number = (candidate: unknown) => typeof candidate === 'string' && candidate ? normalizedFormalNumber(candidate) ?? '' : '';
  return {
    mobile: typeof item.mobile === 'string' ? normalizeFish24Digits(item.mobile).replace(/\D/g, '').slice(0, 11) : '',
    fromDate: date(item.fromDate), toDate: date(item.toDate), fromNumber: number(item.fromNumber), toNumber: number(item.toNumber),
    userType: item.userType === 'حقیقی' || item.userType === 'حقوقی' ? item.userType : 'all'
  };
}

@Component({
  selector: 'app-internal-invoices', standalone: true, imports: [FormsModule, EscToCloseDirective, IconComponent],
  template: `
  <div class="mx-auto max-w-[95%] space-y-4 animate-fade-in-up sm:space-y-5" dir="rtl">
    <header class="flex min-w-0 items-center gap-3"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10"><ui-icon name="file-text" [size]="25" class="text-primary"></ui-icon></div><div><h1 class="text-2xl font-bold text-primary sm:text-3xl">لیست فاکتورها</h1><p class="text-sm text-muted">فهرست فاکتورهای رسمی شماره‌دار، شامل سوابق سازگار قدیمی</p></div></header>

    <section class="card p-3 sm:p-5" aria-labelledby="invoice-filter-title">
      <div class="mb-3 flex items-center gap-2"><ui-icon name="search" [size]="19" class="text-primary"></ui-icon><h2 id="invoice-filter-title" class="text-lg font-extrabold">جستجو</h2></div>
      <form class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" (submit)="applyFilters($event)">
        <div><label class="label">موبایل</label><input [(ngModel)]="draft.mobile" name="mobile" inputmode="numeric" dir="ltr" class="input text-left"></div>
        <div><label class="label">از تاریخ</label><input [(ngModel)]="draft.fromDate" name="fromDate" dir="ltr" placeholder="1405/01/01" class="input text-left"></div>
        <div><label class="label">تا تاریخ</label><input [(ngModel)]="draft.toDate" name="toDate" dir="ltr" placeholder="1405/12/29" class="input text-left"></div>
        <div><label class="label">از شماره ملخی</label><input [(ngModel)]="draft.fromNumber" name="fromNumber" inputmode="numeric" dir="ltr" class="input text-left"></div>
        <div><label class="label">تا شماره ملخی</label><input [(ngModel)]="draft.toNumber" name="toNumber" inputmode="numeric" dir="ltr" class="input text-left"></div>
        <div><label class="label">نوع کاربر</label><select [(ngModel)]="draft.userType" name="userType" class="input"><option value="all">حقیقی و حقوقی</option><option value="حقیقی">حقیقی</option><option value="حقوقی">حقوقی</option></select></div>
        <div class="grid grid-cols-2 gap-2 sm:col-span-2 xl:col-span-3 2xl:col-span-6 2xl:justify-self-end"><button type="submit" class="primary"><ui-icon name="search" [size]="16"></ui-icon>جستجو</button><button type="button" (click)="showAll()" class="secondary">مشاهده همه</button></div>
      </form>
      @if (filterError()) {<p role="alert" class="mt-3 rounded-xl bg-danger/10 p-3 text-sm font-bold text-danger">{{ filterError() }}</p>}
    </section>

    <section aria-label="خلاصه مبلغ فاکتورها">
      <div class="summary text-success"><span>جمع مبلغ فاکتورهای نتایج اصلی</span><strong>{{ money(summary().amount) }}</strong></div>
    </section>

    <section class="card overflow-hidden" aria-labelledby="invoice-list-title">
      <div class="flex flex-col gap-3 border-b border-border p-3 dark:border-slate-700 sm:p-5"><div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 id="invoice-list-title" class="text-lg font-extrabold">لیست فاکتورها ({{ number(filteredRows().length) }} رکورد)</h2><div class="flex flex-wrap gap-2"><button type="button" (click)="columnChooserOpen.set(!columnChooserOpen())" class="toolbar"><ui-icon name="sliders" [size]="16"></ui-icon>انتخاب ستون</button><button type="button" (click)="exportRows()" class="toolbar text-success"><ui-icon name="download" [size]="16"></ui-icon>Excel</button></div></div><div class="flex flex-wrap gap-2" aria-label="خروجی‌های تخصصی فاکتورها"><button type="button" (click)="exportInvoices()" class="toolbar text-success"><ui-icon name="download" [size]="16"></ui-icon>خروجی فاکتور</button>@for (label of deferredExports; track label) {<button type="button" (click)="showDeferredExport(label)" class="toolbar flex-wrap"><span>{{ label }}</span><span class="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] text-warning">هنوز پیاده‌سازی نشده</span></button>}</div></div>
      @if (columnChooserOpen()) {<div class="border-b border-border bg-background/60 p-3 dark:border-slate-700 dark:bg-slate-900/30"><div class="flex flex-wrap gap-2">@for (column of columns; track column.id) {<label class="column-choice"><input type="checkbox" [checked]="visible(column.id)" [disabled]="onlyVisible(column.id)" (change)="toggleColumn(column.id, $event)" class="accent-primary">{{ column.label }}</label>}<button type="button" (click)="restoreColumns()" class="px-3 py-2 text-xs font-bold text-primary">بازگردانی ستون‌های پیش‌فرض</button></div></div>}
      <div class="max-h-[58vh] max-w-full overflow-auto"><table class="w-full min-w-max text-sm"><thead class="sticky top-0 z-20 bg-background/95 dark:bg-slate-900/95"><tr>@for (column of visibleColumns(); track column.id) {<th class="px-2 py-3 text-right font-bold text-muted" [style.min-width]="column.minWidth"><button type="button" (click)="sort(column.id)" class="flex w-full items-center justify-between gap-2"><span>{{ column.label }}</span><span>{{ sortMark(column.id) }}</span></button></th>}<th class="sticky left-0 min-w-36 bg-background/95 px-2 py-3 text-center font-bold text-muted dark:bg-slate-900/95">عملیات</th></tr><tr>@for (column of visibleColumns(); track column.id) {<th class="px-2 pb-2"><input type="search" [value]="columnSearches()[column.id] || ''" (input)="searchColumn(column.id, value($event))" [attr.aria-label]="'جستجو در ستون ' + column.label" class="h-9 w-full rounded-lg border border-border bg-surface px-2 text-xs outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-800"></th>}<th class="sticky left-0 bg-background/95 dark:bg-slate-900/95"></th></tr></thead>
        <tbody class="divide-y divide-border dark:divide-slate-700">@for (row of pageRows(); track row.sourceIdentity) {<tr class="hover:bg-primary/5">@for (column of visibleColumns(); track column.id) {<td class="px-2 py-3" [style.min-width]="column.minWidth" [attr.dir]="column.ltr ? 'ltr' : null">@if (column.id === 'amount') { {{ money(row.amountRial) }} } @else { {{ cell(column, row) }} }</td>}<td class="sticky left-0 bg-surface px-2 py-3 dark:bg-slate-800"><div class="flex justify-center gap-1"><button class="op text-primary" type="button" title="مشاهده فاکتور" (click)="viewInvoice(row)"><ui-icon name="eye" [size]="15"></ui-icon></button><button class="op text-primary" type="button" title="ارسال پیامک" (click)="openSms(row)"><ui-icon name="message-circle" [size]="15"></ui-icon></button>@if (row.deletionEligible) {<button class="op text-danger" type="button" title="حذف فاکتور" (click)="pendingDelete.set(row)"><ui-icon name="trash-2" [size]="15"></ui-icon></button>}</div></td></tr>} @if (!pageRows().length) {<tr><td [attr.colspan]="visibleColumns().length + 1" class="px-4 py-10 text-center font-semibold text-muted">رکوردی مطابق فیلترها پیدا نشد.</td></tr>}</tbody></table></div>
      <div class="flex items-center justify-between gap-3 border-t border-border p-3 text-sm dark:border-slate-700"><span>صفحه {{ number(page()) }} از {{ number(pageCount()) }}</span><div class="flex gap-2"><button class="secondary" type="button" [disabled]="page() <= 1" (click)="page.set(page() - 1)">قبلی</button><button class="secondary" type="button" [disabled]="page() >= pageCount()" (click)="page.set(page() + 1)">بعدی</button></div></div>
    </section>

    @if (smsInvoice()) {<div appEscToClose (escPressed)="smsInvoice.set(null)" class="modal" (click)="smsInvoice.set(null)"><section role="dialog" aria-modal="true" class="dialog max-w-lg" (click)="$event.stopPropagation()"><div class="dialog-head"><h2 class="text-lg font-extrabold">ارسال پیامک مستقیم</h2><button type="button" (click)="smsInvoice.set(null)" aria-label="بستن"><ui-icon name="x" [size]="19"></ui-icon></button></div><div class="space-y-3 p-4"><p class="text-sm text-muted">گیرنده: {{ smsInvoice()!.name || 'نام ناموجود' }} — <span dir="ltr">{{ smsInvoice()!.mobile }}</span></p><textarea [(ngModel)]="smsText" rows="4" class="input h-auto py-3" aria-label="متن پیامک"></textarea><button type="button" class="primary" (click)="sendSms()">بررسی ارسال</button></div></section></div>}
    @if (unavailableInvoice()) {<div appEscToClose (escPressed)="unavailableInvoice.set(null)" class="modal" (click)="unavailableInvoice.set(null)"><section role="dialog" aria-modal="true" class="dialog max-w-md p-4" (click)="$event.stopPropagation()"><h2 class="text-lg font-extrabold">نمایش فاکتور در دسترس نیست</h2><p class="mt-2 text-sm leading-7 text-muted">این رکورد تاریخی شماره رسمی دارد و در فهرست حفظ شده است، اما قرارداد کافی برای نمایش محتوای اصلی آن با قالب فعلی وجود ندارد.</p><button class="secondary mt-4" type="button" (click)="unavailableInvoice.set(null)">بستن</button></section></div>}
    @if (pendingDelete()) {<div appEscToClose (escPressed)="pendingDelete.set(null)" class="modal" (click)="pendingDelete.set(null)"><section role="alertdialog" aria-modal="true" class="dialog max-w-md p-4" (click)="$event.stopPropagation()"><h2 class="text-lg font-extrabold">تأیید حذف فاکتور رسمی</h2><p class="mt-2 text-sm leading-7 text-muted">فقط ارتباط فاکتور تراکنش دستی حذف می‌شود. تراکنش، مبلغ، زمان، وضعیت و مانده کیف پول بدون تغییر می‌مانند.</p><div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button class="secondary" type="button" (click)="pendingDelete.set(null)">انصراف</button><button class="danger" type="button" (click)="confirmDelete()">حذف فاکتور</button></div></section></div>}
  </div>`,
  styles: [`
    .card{border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));color:rgb(var(--color-foreground));box-shadow:0 1px 3px rgb(15 23 42/.08)}.label{display:block;margin-bottom:.375rem;font-size:.8rem;font-weight:700}.input{width:100%;min-height:2.75rem;border:1px solid rgb(var(--color-border));border-radius:.75rem;padding-inline:.75rem;color:rgb(var(--color-foreground));background:rgb(var(--color-background));outline:none}.input:focus{border-color:rgb(var(--color-primary));box-shadow:0 0 0 2px rgb(var(--color-primary)/.15)}.primary,.secondary,.danger,.toolbar{display:inline-flex;min-height:2.5rem;align-items:center;justify-content:center;gap:.4rem;border-radius:.75rem;padding-inline:.85rem;font-size:.8rem;font-weight:700}.primary{background:rgb(var(--color-primary));color:white}.danger{background:rgb(var(--color-danger));color:white}.secondary,.toolbar{border:1px solid rgb(var(--color-border))}.secondary:disabled{opacity:.45}.summary{display:flex;min-height:6.5rem;flex-direction:column;justify-content:center;border:1px solid rgb(var(--color-border));border-radius:1rem;padding:1rem;background:rgb(var(--color-surface));box-shadow:0 1px 3px rgb(15 23 42/.08)}.summary span{font-size:.8rem;font-weight:700}.summary strong{margin-top:.35rem;font-size:1.1rem}.summary small{margin-top:.25rem;color:rgb(var(--color-muted));font-size:.7rem}.column-choice{display:flex;align-items:center;gap:.5rem;border:1px solid rgb(var(--color-border));border-radius:.5rem;padding:.5rem .75rem;font-size:.75rem;font-weight:700;background:rgb(var(--color-surface))}.op{display:inline-flex;height:2rem;width:2rem;align-items:center;justify-content:center;border:1px solid currentColor;border-radius:.5rem}.modal{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgb(0 0 0/.6);padding:.75rem;backdrop-filter:blur(4px)}.dialog{width:100%;max-height:calc(100vh - 1.5rem);overflow:auto;border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));color:rgb(var(--color-foreground));box-shadow:0 20px 50px rgb(0 0 0/.25)}.dialog-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgb(var(--color-border));padding:1rem}@media(max-width:420px){.modal{align-items:flex-end}.dialog{border-bottom-left-radius:0;border-bottom-right-radius:0}}
  `]
})
export class InternalInvoicesComponent {
  private readonly service = inject(Fish24InternalInvoicePreviewService); private readonly preferences = inject(InternalListPreferencesService);
  private readonly xlsx = inject(PlainXlsxService); private readonly toast = inject(ToastService); private readonly router = inject(Router);
  private readonly restored = this.preferences.loadFilters(LIST_ID, FILTER_DEFAULTS, validateStoredFilters);
  readonly columns = COLUMNS; readonly defaultColumns = COLUMNS.map(column => column.id);
  readonly deferredExports = ['خروجی سند حسابداری', 'خروجی تفصیلی مشتریان'] as const;
  readonly selectedColumns = signal<readonly string[]>(this.preferences.load(LIST_ID, this.defaultColumns, this.defaultColumns));
  readonly visibleColumns = computed(() => this.columns.filter(column => this.selectedColumns().includes(column.id)));
  readonly columnSearches = signal<InternalListColumnSearches>({}); readonly tableSort = signal<InternalListSort>({ columnId: null, direction: null }); readonly columnChooserOpen = signal(false);
  draft: InvoiceFilters = { ...this.restored }; readonly applied = signal<InvoiceFilters>(this.restored); readonly filterError = signal(''); readonly page = signal(1); readonly pageSize = 10;
  readonly filteredRows = computed(() => this.service.invoices().filter(row => this.matches(row, this.applied())));
  readonly summary = computed(() => ({ amount: this.filteredRows().reduce((total, row) => total + row.amountRial, 0) }));
  readonly tableRows = computed(() => sortInternalListRows(filterByInternalListColumns(this.filteredRows(), this.columns, this.selectedColumns(), this.columnSearches()), this.columns, this.tableSort()));
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.tableRows().length / this.pageSize)));
  readonly pageRows = computed(() => { const page = Math.min(this.page(), this.pageCount()); return this.tableRows().slice((page - 1) * this.pageSize, page * this.pageSize); });
  readonly smsInvoice = signal<InternalFormalInvoiceListItem | null>(null); smsText = ''; readonly unavailableInvoice = signal<InternalFormalInvoiceListItem | null>(null); readonly pendingDelete = signal<InternalFormalInvoiceListItem | null>(null);

  applyFilters(event: Event): void { event.preventDefault(); if ((this.draft.fromDate && !normalizeJalaliDate(this.draft.fromDate)) || (this.draft.toDate && !normalizeJalaliDate(this.draft.toDate)) || (this.draft.fromNumber && !normalizedFormalNumber(this.draft.fromNumber)) || (this.draft.toNumber && !normalizedFormalNumber(this.draft.toNumber))) { this.filterError.set('تاریخ یا شماره ملخی واردشده معتبر نیست.'); return; } const normalized = validateStoredFilters(this.draft)!; if (normalized.fromDate && normalized.toDate && normalized.fromDate > normalized.toDate || normalized.fromNumber && normalized.toNumber && compareFormalNumbers(normalized.fromNumber, normalized.toNumber) > 0) { this.filterError.set('بازه جستجو معتبر نیست.'); return; } this.filterError.set(''); this.draft = { ...normalized }; this.applied.set(normalized); this.preferences.saveFilters(LIST_ID, normalized); this.page.set(1); }
  showAll(): void { this.draft = { ...FILTER_DEFAULTS }; this.applied.set(FILTER_DEFAULTS); this.preferences.resetFilters(LIST_ID); this.filterError.set(''); this.page.set(1); }
  visible(id: string): boolean { return this.selectedColumns().includes(id); } onlyVisible(id: string): boolean { return this.visible(id) && this.selectedColumns().length === 1; }
  toggleColumn(id: string, event: Event): void { const checked = (event.target as HTMLInputElement).checked; const next = checked ? [...this.selectedColumns(), id] : this.selectedColumns().filter(item => item !== id); if (!next.length) return; this.selectedColumns.set(this.preferences.save(LIST_ID, next, this.defaultColumns)); if (!checked) this.searchColumn(id, ''); }
  restoreColumns(): void { this.selectedColumns.set(this.preferences.reset(LIST_ID, this.defaultColumns, this.defaultColumns)); this.columnSearches.set({}); this.tableSort.set({ columnId: null, direction: null }); }
  searchColumn(id: string, query: string): void { this.columnSearches.update(searches => ({ ...searches, [id]: query })); this.page.set(1); } sort(id: string): void { this.tableSort.update(current => nextInternalListSort(current, id)); this.page.set(1); }
  sortMark(id: string): string { const sort = this.tableSort(); return sort.columnId !== id ? '↕' : sort.direction === 'asc' ? '↑' : '↓'; } value(event: Event): string { return (event.target as HTMLInputElement).value; }
  cell(column: InternalListColumn<InternalFormalInvoiceListItem>, row: InternalFormalInvoiceListItem): string { const value = column.value(row); return value === null || value === undefined || value === '' ? 'ناموجود' : String(value); }
  money(value: number): string { return `${new Intl.NumberFormat('fa-IR').format(value)} ریال`; } number(value: number): string { return new Intl.NumberFormat('fa-IR').format(value); }
  exportRows(): void { const columns = this.visibleColumns(); const rows = this.filteredRows().map(row => columns.map(column => column.exportValue ? column.exportValue(row) : column.value(row) == null ? null : String(column.value(row)))); this.xlsx.export('fish24-formal-invoices.xlsx', columns.map(column => column.label), rows); this.toast.show(`${this.number(rows.length)} فاکتور شماره‌دار برای Excel آماده شد.`, 'success'); }
  exportInvoices(): void { const rows = buildInvoiceExportRows(this.filteredRows()); this.xlsx.export('fish24-invoice-export.xlsx', INVOICE_EXPORT_HEADERS, rows); this.toast.show(`${this.number(rows.length)} فاکتور با قالب تخصصی آماده شد.`, 'success'); }
  showDeferredExport(label: typeof this.deferredExports[number]): void { this.toast.show(`${label} هنوز پیاده‌سازی نشده است؛ قالب خروجی منتظر فایل نمونه مرجع است.`, 'error'); }
  viewInvoice(row: InternalFormalInvoiceListItem): void { if (row.printableInvoiceId !== null) void this.router.navigate(['/fish24/employer/invoices', row.printableInvoiceId, 'print']); else this.unavailableInvoice.set(row); }
  openSms(row: InternalFormalInvoiceListItem): void { this.smsText = ''; this.smsInvoice.set(row); }
  sendSms(): void { if (!this.smsText.trim()) { this.toast.show('متن پیامک نمی‌تواند خالی باشد.', 'error'); return; } this.toast.show('ارسال واقعی انجام نشد؛ پیامک مستقیم فقط در پیش‌نمایش بررسی شد.', 'success'); this.smsInvoice.set(null); }
  confirmDelete(): void { const invoice = this.pendingDelete(); if (!invoice) return; const result = this.service.deleteManualInvoice(invoice.sourceIdentity); this.toast.show(result.ok ? 'فاکتور تراکنش دستی حذف شد؛ اطلاعات مالی تراکنش و کیف پول تغییر نکرد.' : 'حذف این فاکتور مجاز نیست.', result.ok ? 'success' : 'error'); this.pendingDelete.set(null); }
  private matches(row: InternalFormalInvoiceListItem, filter: InvoiceFilters): boolean { return (!filter.mobile || row.mobile.includes(filter.mobile)) && (!filter.fromDate || row.issueDate >= filter.fromDate) && (!filter.toDate || row.issueDate <= filter.toDate) && (!filter.fromNumber || compareFormalNumbers(row.formalInvoiceNumber, filter.fromNumber) >= 0) && (!filter.toNumber || compareFormalNumbers(row.formalInvoiceNumber, filter.toNumber) <= 0) && (filter.userType === 'all' || row.userType === filter.userType); }
}

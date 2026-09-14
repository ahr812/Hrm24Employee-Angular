import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Fish24DocumentDistributionPreviewService, Fish24DocumentSend } from '../../../../core/fish24/financial/fish24-document-distribution-preview.service';
import { InternalDocumentReceipt } from '../../../../core/fish24/financial/fish24-document-pricing-preview.service';
import { normalizeFish24Digits, normalizeJalaliDate } from '../../../../core/fish24/financial/fish24-financial-preview.service';
import { EscToCloseDirective } from '../../../../shared/directives/esc-to-close.directive';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { InternalListColumn, InternalListColumnSearches, InternalListSort, filterByInternalListColumns, nextInternalListSort, sortInternalListRows } from '../../../../shared/ui/data-list/internal-list.model';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { PlainXlsxService } from '../../../../shared/ui/data-list/plain-xlsx.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface SendFilters { readonly employerId: string; readonly mobile: string; readonly sendId: string; readonly fromDate: string; readonly toDate: string; }
type SendAction = 'pay' | 'delete' | 'access';
interface PendingAction { readonly kind: SendAction; readonly sendId: string; }

const LIST_ID = 'internal-document-sends';
const FILTER_DEFAULTS: SendFilters = { employerId: 'all', mobile: '', sendId: '', fromDate: '', toDate: '' };
const COLUMNS: readonly InternalListColumn<Fish24DocumentSend>[] = [
  { id: 'createdAt', label: 'تاریخ', value: row => row.createdAt, minWidth: '9rem', ltr: true },
  { id: 'id', label: 'شماره', value: row => row.id, minWidth: '8rem', ltr: true },
  { id: 'mobile', label: 'موبایل', value: row => row.employerMobile, minWidth: '10rem', ltr: true },
  { id: 'name', label: 'نام', value: row => row.employerName, minWidth: '11rem' },
  { id: 'company', label: 'شرکت', value: row => row.companyName, minWidth: '13rem' },
  { id: 'title', label: 'عنوان', value: row => row.title, minWidth: '15rem' },
  { id: 'amount', label: 'مبلغ', value: row => row.paidAmountRial ?? 0, exportValue: row => row.paidAmountRial ?? 0, minWidth: '10rem' },
  { id: 'paid', label: 'پرداخت', value: row => row.isPaid ? 'بله' : 'خیر', minWidth: '7rem' },
  { id: 'expiresAt', label: 'انقضاء', value: row => row.expiresAt, minWidth: '9rem', ltr: true },
  { id: 'months', label: 'ماه', value: row => row.durationMonths, exportValue: row => row.durationMonths, minWidth: '6rem' },
  { id: 'type', label: 'نوع', value: row => row.userType, minWidth: '7rem' },
  { id: 'credit', label: 'اعتباری', value: row => row.hasFreeCredit ? 'بله' : 'خیر', minWidth: '7rem' },
  { id: 'pages', label: 'صفحات', value: row => row.pageCount, exportValue: row => row.pageCount, minWidth: '7rem' },
  { id: 'sms', label: 'پیامک', value: row => row.smsEnabled ? 'بله' : 'خیر', minWidth: '7rem' }
];

function validateFilters(value: unknown): SendFilters | null {
  if (typeof value !== 'object' || value === null) return null;
  const item = value as Partial<SendFilters>;
  const date = (candidate: unknown) => typeof candidate === 'string' && (!candidate || normalizeJalaliDate(candidate)) ? candidate : '';
  return {
    employerId: typeof item.employerId === 'string' ? item.employerId : 'all',
    mobile: typeof item.mobile === 'string' ? normalizeFish24Digits(item.mobile).replace(/\D/g, '').slice(0, 11) : '',
    sendId: typeof item.sendId === 'string' ? normalizeFish24Digits(item.sendId).trim() : '',
    fromDate: date(item.fromDate), toDate: date(item.toDate)
  };
}

@Component({
  selector: 'app-internal-sends',
  standalone: true,
  imports: [FormsModule, EscToCloseDirective, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-4 animate-fade-in-up sm:space-y-5" dir="rtl">
      <header class="flex min-w-0 items-center gap-3 sm:gap-4"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14"><ui-icon name="send" [size]="28" class="text-primary"></ui-icon></div><div><h1 class="text-2xl font-bold text-primary sm:text-3xl">لیست ارسال‌ها</h1><p class="mt-0.5 text-sm text-muted">مدیریت پرداخت و دسترسی اسناد ارسالی</p></div></header>

      <section class="rounded-2xl border border-border bg-surface p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="send-filter-title">
        <div class="mb-3 flex items-center gap-3"><div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon name="search" [size]="19"></ui-icon></div><h2 id="send-filter-title" class="text-base font-extrabold text-foreground dark:text-slate-100 sm:text-lg">جستجو</h2></div>
        <form class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-5" (submit)="applyFilters($event)">
          <div><label class="field-label" for="send-employer">کارفرما</label><select id="send-employer" [(ngModel)]="draft.employerId" name="employer" class="field-input"><option value="all">همه کارفرماها</option>@for (employer of employers(); track employer.id) {<option [value]="employer.id">{{ employer.name }}</option>}</select></div>
          <div><label class="field-label" for="send-mobile">موبایل</label><input id="send-mobile" [(ngModel)]="draft.mobile" name="mobile" inputmode="numeric" dir="ltr" maxlength="11" class="field-input text-left"></div>
          <div><label class="field-label" for="send-id">شناسه ارسال</label><input id="send-id" [(ngModel)]="draft.sendId" name="sendId" dir="ltr" class="field-input text-left"></div>
          <div><label class="field-label" for="send-from">از تاریخ</label><input id="send-from" [(ngModel)]="draft.fromDate" name="from" dir="ltr" placeholder="1405/01/01" class="field-input text-left"></div>
          <div><label class="field-label" for="send-to">تا تاریخ</label><input id="send-to" [(ngModel)]="draft.toDate" name="to" dir="ltr" placeholder="1405/12/29" class="field-input text-left"></div>
          <div class="grid grid-cols-2 gap-2 sm:col-span-2 xl:col-span-5 xl:justify-self-end"><button type="submit" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white"><ui-icon name="search" [size]="17"></ui-icon>جستجو</button><button type="button" (click)="showAll()" class="h-11 rounded-xl border border-border px-4 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200">مشاهده همه</button></div>
        </form>
        @if (filterError()) {<p role="alert" class="mt-3 rounded-xl bg-danger/10 p-3 text-sm font-bold text-danger">{{ filterError() }}</p>}
      </section>

      <section class="rounded-2xl border border-border bg-surface shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="send-list-title">
        <div class="flex flex-col gap-3 border-b border-border p-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:p-5"><h2 id="send-list-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">لیست ارسال‌ها ({{ number(filteredRows().length) }} رکورد)</h2><div class="flex flex-wrap gap-2"><button type="button" (click)="columnChooserOpen.set(!columnChooserOpen())" class="toolbar-button"><ui-icon name="sliders" [size]="16"></ui-icon>انتخاب ستون</button><button type="button" (click)="exportRows()" class="toolbar-button text-success"><ui-icon name="download" [size]="16"></ui-icon>Excel</button></div></div>
        @if (columnChooserOpen()) {<div class="border-b border-border bg-background/60 p-3 dark:border-slate-700 dark:bg-slate-900/30"><div class="flex flex-wrap gap-2">@for (column of columns; track column.id) {<label class="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold dark:border-slate-600 dark:bg-slate-800"><input type="checkbox" [checked]="visible(column.id)" [disabled]="onlyVisible(column.id)" (change)="toggleColumn(column.id, $event)" class="accent-primary">{{ column.label }}</label>}<button type="button" (click)="restoreColumns()" class="px-3 py-2 text-xs font-bold text-primary">بازگردانی ستون‌های پیش‌فرض</button></div></div>}
        <div class="max-w-full overflow-x-auto">
          <table class="w-full min-w-max text-sm"><thead class="bg-background/80 dark:bg-slate-900/60"><tr>@for (column of visibleColumns(); track column.id) {<th class="px-2 py-3 text-right font-bold text-muted" [style.min-width]="column.minWidth"><button type="button" (click)="sort(column.id)" class="flex w-full items-center justify-between gap-2"><span>{{ column.label }}</span><span>{{ sortMark(column.id) }}</span></button></th>}<th class="sticky left-0 min-w-28 bg-background/95 px-2 py-3 text-center font-bold text-muted dark:bg-slate-900">عملیات</th></tr><tr>@for (column of visibleColumns(); track column.id) {<th class="px-2 pb-2"><input type="search" [value]="columnSearches()[column.id] || ''" (input)="searchColumn(column.id, value($event))" [attr.aria-label]="'جستجو در ستون ' + column.label" class="h-9 w-full rounded-lg border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"></th>}<th class="sticky left-0 bg-background/95 dark:bg-slate-900"></th></tr></thead>
            <tbody class="divide-y divide-border dark:divide-slate-700">@for (row of tableRows(); track row.id) {<tr class="hover:bg-primary/5">@for (column of visibleColumns(); track column.id) {<td class="px-2 py-3 text-foreground dark:text-slate-200" [style.min-width]="column.minWidth" [attr.dir]="column.ltr ? 'ltr' : null">@if (column.id === 'amount') { {{ money(receipt(row)?.breakdown?.totalRial ?? 0) }} } @else if (column.id === 'paid') {<span [class]="row.isPaid ? badge('success') : badge('danger')">{{ row.isPaid ? 'بله' : 'خیر' }}</span>} @else if (column.id === 'sms') {<span [class]="badge('success')">بله</span>} @else { {{ cell(column, row) }} }</td>}<td class="sticky left-0 bg-surface px-2 py-3 text-center dark:bg-slate-800"><div class="flex justify-center gap-1"><button type="button" (click)="openReceipt(row)" class="op text-primary" title="جزئیات رسید"><ui-icon name="eye" [size]="16"></ui-icon></button><button type="button" (click)="download(row)" class="op text-primary" title="دانلود فایل"><ui-icon name="download" [size]="16"></ui-icon></button>@if (!row.isPaid) {<button type="button" (click)="request('pay', row)" class="op text-success" title="تأیید پرداخت"><ui-icon name="credit-card" [size]="16"></ui-icon></button><button type="button" (click)="request('delete', row)" class="op text-danger" title="حذف"><ui-icon name="trash-2" [size]="16"></ui-icon></button>} @else {<button type="button" (click)="request('access', row)" [class]="row.employeeAccessActive ? 'op text-warning' : 'op text-success'" [title]="row.employeeAccessActive ? 'غیرفعال کردن' : 'فعال کردن'"><ui-icon [name]="row.employeeAccessActive ? 'lock' : 'check-circle'" [size]="16"></ui-icon></button>}</div></td></tr>} @if (!tableRows().length) {<tr><td [attr.colspan]="visibleColumns().length + 1" class="px-4 py-10 text-center font-semibold text-muted">رکوردی مطابق فیلترها پیدا نشد.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      @if (receiptModal(); as detail) {<div appEscToClose (escPressed)="receiptModal.set(null)" class="modal" (click)="receiptModal.set(null)"><section role="dialog" aria-modal="true" aria-labelledby="receipt-title" class="dialog max-w-lg" (click)="$event.stopPropagation()"><div class="dialog-head"><h2 id="receipt-title" class="text-lg font-extrabold">جزئیات رسید شماره {{ detail.send.id }}</h2><button type="button" (click)="receiptModal.set(null)" aria-label="بستن"><ui-icon name="x" [size]="19"></ui-icon></button></div><dl class="grid grid-cols-2 gap-3 p-4 text-sm"><div><dt>تاریخ صدور</dt><dd>{{ detail.receipt.issueDate }}</dd></div><div><dt>تعرفه</dt><dd>{{ detail.receipt.appliedPricingId }}</dd></div><div><dt>مدت</dt><dd>{{ detail.receipt.durationMonths }} ماه</dd></div><div><dt>صفحات</dt><dd>{{ detail.receipt.pageCount }}</dd></div><div><dt>هزینه صفحات</dt><dd>{{ money(detail.receipt.breakdown.pageChargeRial) }}</dd></div><div><dt>هزینه پیامک</dt><dd>{{ money(detail.receipt.breakdown.smsChargeRial) }}</dd></div><div class="col-span-2 rounded-xl bg-primary/10 p-3 font-extrabold text-primary"><dt>مبلغ فعلی رسید</dt><dd class="mt-1">{{ money(detail.receipt.breakdown.totalRial) }}</dd>@if (detail.send.paidAmountRial !== null) {<p class="mt-2 text-xs">مبلغ ثبت‌شده در تراکنش اصلی: {{ money(detail.send.paidAmountRial) }}</p>}</div></dl></section></div>}
      @if (pending(); as action) {<div appEscToClose (escPressed)="pending.set(null)" class="modal" (click)="pending.set(null)"><section role="alertdialog" aria-modal="true" class="dialog max-w-md p-4" (click)="$event.stopPropagation()"><h2 class="text-lg font-extrabold">{{ actionTitle(action) }}</h2><p class="mt-2 text-sm leading-7 text-muted">{{ actionMessage(action) }}</p><div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" (click)="pending.set(null)" class="secondary">انصراف</button><button type="button" (click)="confirmAction()" class="primary">تأیید</button></div></section></div>}
    </div>
  `,
  styles: [`
    .field-label{display:block;margin-bottom:.375rem;font-size:.875rem;font-weight:700;color:rgb(var(--color-foreground))}.field-input{width:100%;height:2.75rem;border:1px solid rgb(var(--color-border));border-radius:.75rem;padding-inline:.75rem;color:rgb(var(--color-foreground));background:rgb(var(--color-background));outline:none}.field-input:focus{border-color:rgb(var(--color-primary));box-shadow:0 0 0 2px rgb(var(--color-primary)/.15)}.toolbar-button{display:inline-flex;min-height:2.5rem;align-items:center;gap:.4rem;border:1px solid rgb(var(--color-border));border-radius:.75rem;padding-inline:.75rem;font-size:.75rem;font-weight:700}.op{display:inline-flex;height:2rem;width:2rem;align-items:center;justify-content:center;border:1px solid currentColor;border-radius:.5rem}.modal{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgb(0 0 0/.6);padding:.75rem;backdrop-filter:blur(4px)}.dialog{width:100%;overflow:hidden;border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));color:rgb(var(--color-foreground));box-shadow:0 20px 50px rgb(0 0 0/.25)}.dialog-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgb(var(--color-border));padding:1rem}.dialog dt{font-size:.75rem;color:rgb(var(--color-muted))}.dialog dd{margin-top:.25rem;font-weight:700}.primary,.secondary{min-height:2.75rem;border-radius:.75rem;padding-inline:1rem;font-size:.875rem;font-weight:700}.primary{background:rgb(var(--color-primary));color:white}.secondary{border:1px solid rgb(var(--color-border))}
  `]
})
export class InternalSendsComponent {
  private readonly service = inject(Fish24DocumentDistributionPreviewService);
  private readonly preferences = inject(InternalListPreferencesService);
  private readonly xlsx = inject(PlainXlsxService);
  private readonly toast = inject(ToastService);
  private readonly restoredPreference = this.preferences.loadFilters(LIST_ID, FILTER_DEFAULTS, validateFilters);
  private readonly restored: SendFilters = {
    ...this.restoredPreference,
    employerId: this.restoredPreference.employerId === 'all' || this.service.sends().some(send => send.employerId === this.restoredPreference.employerId)
      ? this.restoredPreference.employerId : 'all'
  };
  readonly columns: readonly InternalListColumn<Fish24DocumentSend>[] = COLUMNS.map(column => column.id === 'amount'
    ? { ...column, value: row => this.receipt(row)?.breakdown.totalRial ?? 0, exportValue: row => this.receipt(row)?.breakdown.totalRial ?? 0 }
    : column);
  readonly defaultColumns = this.columns.map(column => column.id);
  readonly selectedColumns = signal<readonly string[]>(this.preferences.load(LIST_ID, this.defaultColumns, this.defaultColumns));
  readonly visibleColumns = computed(() => this.columns.filter(column => this.selectedColumns().includes(column.id)));
  readonly columnSearches = signal<InternalListColumnSearches>({});
  readonly tableSort = signal<InternalListSort>({ columnId: null, direction: null });
  readonly columnChooserOpen = signal(false);
  readonly filterError = signal('');
  draft: SendFilters = { ...this.restored };
  readonly applied = signal<SendFilters>(this.restored);
  readonly employers = computed(() => Array.from(new Map(this.service.sends().map(send => [send.employerId, { id: send.employerId, name: send.employerName }])).values()));
  readonly filteredRows = computed(() => this.service.sends().filter(row => {
    const filter = this.applied();
    return (filter.employerId === 'all' || row.employerId === filter.employerId) && (!filter.mobile || row.employerMobile.includes(filter.mobile)) && (!filter.sendId || row.id.includes(filter.sendId)) && (!filter.fromDate || row.createdAt >= filter.fromDate) && (!filter.toDate || row.createdAt <= filter.toDate);
  }));
  readonly tableRows = computed(() => sortInternalListRows(filterByInternalListColumns(this.filteredRows(), this.columns, this.selectedColumns(), this.columnSearches()), this.columns, this.tableSort()));
  readonly pending = signal<PendingAction | null>(null);
  readonly receiptModal = signal<{ send: Fish24DocumentSend; receipt: InternalDocumentReceipt } | null>(null);

  applyFilters(event: Event): void { event.preventDefault(); const normalized = validateFilters(this.draft); if (!normalized || (normalized.fromDate && normalized.toDate && normalized.fromDate > normalized.toDate)) { this.filterError.set('بازه تاریخ معتبر نیست.'); return; } this.filterError.set(''); this.draft = { ...normalized }; this.applied.set(normalized); this.preferences.saveFilters(LIST_ID, normalized); }
  showAll(): void { this.draft = { ...FILTER_DEFAULTS }; this.applied.set(FILTER_DEFAULTS); this.filterError.set(''); this.preferences.resetFilters(LIST_ID); }
  visible(id: string): boolean { return this.selectedColumns().includes(id); }
  onlyVisible(id: string): boolean { return this.visible(id) && this.selectedColumns().length === 1; }
  toggleColumn(id: string, event: Event): void { const checked = (event.target as HTMLInputElement).checked; const next = checked ? [...this.selectedColumns(), id] : this.selectedColumns().filter(value => value !== id); if (!next.length) return; this.selectedColumns.set(this.preferences.save(LIST_ID, next, this.defaultColumns)); if (!checked) this.searchColumn(id, ''); }
  restoreColumns(): void { this.selectedColumns.set(this.preferences.reset(LIST_ID, this.defaultColumns, this.defaultColumns)); this.columnSearches.set({}); this.tableSort.set({ columnId: null, direction: null }); }
  searchColumn(id: string, query: string): void { this.columnSearches.update(searches => ({ ...searches, [id]: query })); }
  sort(id: string): void { this.tableSort.update(sort => nextInternalListSort(sort, id)); }
  sortMark(id: string): string { const sort = this.tableSort(); return sort.columnId !== id ? '↕' : sort.direction === 'asc' ? '↑' : '↓'; }
  value(event: Event): string { return (event.target as HTMLInputElement).value; }
  cell(column: InternalListColumn<Fish24DocumentSend>, row: Fish24DocumentSend): string { return String(column.value(row) ?? ''); }
  receipt(row: Fish24DocumentSend): InternalDocumentReceipt | null { return this.service.receiptFor(row.id); }
  money(value: number): string { return `${new Intl.NumberFormat('fa-IR').format(value)} ریال`; }
  number(value: number): string { return new Intl.NumberFormat('fa-IR').format(value); }
  badge(tone: 'success' | 'danger'): string { return `inline-flex rounded-full px-2 py-1 text-xs font-bold ${tone === 'success' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`; }
  request(kind: SendAction, row: Fish24DocumentSend): void { this.pending.set({ kind, sendId: row.id }); }
  openReceipt(send: Fish24DocumentSend): void { const receipt = this.receipt(send); if (!receipt) { this.toast.show('رسید این ارسال در دسترس نیست.', 'error'); return; } this.receiptModal.set({ send, receipt }); }
  download(send: Fish24DocumentSend): void { if (!send.sourceFile) { this.toast.show('فایل اصلی این ارسال در وضعیت نمایشی در دسترس نیست.', 'error'); return; } const url = URL.createObjectURL(send.sourceFile); const anchor = document.createElement('a'); anchor.href = url; anchor.download = send.sourceFileName; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
  actionTitle(action: PendingAction): string { const send = this.service.findSend(action.sendId); if (action.kind === 'pay') return 'تأیید پرداخت'; if (action.kind === 'delete') return 'حذف ارسال پرداخت‌نشده'; return send?.employeeAccessActive ? 'غیرفعال کردن دسترسی' : 'فعال کردن دسترسی'; }
  actionMessage(action: PendingAction): string { if (action.kind === 'pay') return 'مبلغ رسید از کیف پول کارفرما کسر، تراکنش ثبت و سند توزیع می‌شود. آیا ادامه می‌دهید؟'; if (action.kind === 'delete') return 'ارسال و رسید داخلی مرتبط حذف می‌شوند. این عملیات فقط برای ارسال پرداخت‌نشده مجاز است.'; return 'وضعیت دسترسی کارکنان به این سند تغییر می‌کند؛ پرداخت و تراکنش قبلی بدون تغییر می‌مانند.'; }
  confirmAction(): void { const action = this.pending(); if (!action) return; if (action.kind === 'pay') { const result = this.service.confirmPayment(action.sendId); this.toast.show(result.ok ? (result.existing ? 'این ارسال قبلاً پرداخت شده است؛ برداشت تکراری انجام نشد.' : 'پرداخت ثبت و سند توزیع شد.') : this.paymentError(result.error), result.ok ? 'success' : 'error'); } else if (action.kind === 'delete') { this.toast.show(this.service.deleteUnpaid(action.sendId) ? 'ارسال پرداخت‌نشده و رسید آن حذف شدند.' : 'حذف این ارسال مجاز نیست.', this.service.findSend(action.sendId) ? 'error' : 'success'); } else { const send = this.service.findSend(action.sendId); const ok = send ? this.service.setEmployeeAccess(send.id, !send.employeeAccessActive) : false; this.toast.show(ok ? 'دسترسی کارکنان به‌روزرسانی شد.' : 'تغییر دسترسی مجاز نیست.', ok ? 'success' : 'error'); } this.pending.set(null); }
  exportRows(): void { const columns = this.visibleColumns(); const rows = this.filteredRows().map(row => columns.map(column => column.id === 'amount' ? this.receipt(row)?.breakdown.totalRial ?? 0 : column.exportValue ? column.exportValue(row) : String(column.value(row) ?? ''))); this.xlsx.export('fish24-document-sends.xlsx', columns.map(column => column.label), rows); this.toast.show(`${this.number(rows.length)} رکورد برای Excel آماده شد.`, 'success'); }
  private paymentError(error: string | undefined): string { if (error === 'insufficient-funds') return 'موجودی کیف پول کافی نیست؛ هیچ تغییری اعمال نشد.'; if (error === 'invalid-distribution') return 'اطلاعات توزیع کامل نیست؛ هیچ تغییری اعمال نشد.'; return 'پرداخت انجام نشد.'; }
}

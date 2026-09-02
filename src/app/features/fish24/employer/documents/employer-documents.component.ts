import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

type DocumentStatus = 'توزیع‌شده';
type DocumentHostingLabel = '1 ماهه' | '12 ماهه' | 'منقضی';
type DocumentDateBasis = 'expiration' | 'sent';

interface EmployerDocumentRecord {
  readonly id: number;
  readonly sentAt: string;
  readonly title: string;
  readonly companyId: number;
  readonly companyName: string;
  readonly amountRial: number;
  readonly status: DocumentStatus;
  readonly hostingLabel: DocumentHostingLabel;
  readonly expiresAt: string;
}

interface EmployerDocumentCompanyOption {
  readonly id: number;
  readonly name: string;
}

interface EmployerDocumentFilterForm {
  companyId: string;
  fromDate: string;
  toDate: string;
  dateBasis: DocumentDateBasis;
}

@Component({
  selector: 'app-employer-documents',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
            <ui-icon name="file-text" [size]="30" class="text-primary"></ui-icon>
          </div>
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-primary sm:text-3xl">فیش‌ها و اسناد ارسالی</h1>
            <p class="mt-1 text-sm text-muted sm:text-base">مدیریت و مشاهده اسناد ارسال‌شده</p>
          </div>
        </div>

        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-describedby="employer-new-document-status"
          class="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-primary/85 px-5 py-2.5 text-sm font-bold text-white opacity-85 shadow-lg shadow-primary/15 sm:w-auto">
          <ui-icon name="send" [size]="19"></ui-icon>
          ارسال سند جدید
          <span id="employer-new-document-status" class="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">به‌زودی</span>
        </button>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="employer-document-search-title">
        <div class="mb-4 flex items-center gap-3 border-b border-border pb-4 dark:border-slate-700">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ui-icon name="search" [size]="21"></ui-icon>
          </div>
          <div>
            <h2 id="employer-document-search-title" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">جستجوی اسناد</h2>
            <p class="mt-0.5 text-xs text-muted sm:text-sm">فهرست را بر اساس شرکت یا کارگاه و بازه تاریخ محدود کنید.</p>
          </div>
        </div>

        <form (ngSubmit)="applyFilters()" novalidate>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label for="employer-document-company" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">شرکت یا کارگاه</label>
              <select
                id="employer-document-company"
                name="documentCompany"
                [(ngModel)]="filterForm.companyId"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                <option value="all">همه شرکت‌ها و کارگاه‌ها</option>
                @for (company of companyOptions; track company.id) {
                  <option [value]="company.id">{{ company.name }}</option>
                }
              </select>
            </div>

            <div>
              <label for="employer-document-from-date" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">از تاریخ</label>
              <div class="relative">
                <ui-icon name="calendar" [size]="18" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                <input
                  id="employer-document-from-date"
                  name="documentFromDate"
                  type="date"
                  [(ngModel)]="filterForm.fromDate"
                  class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              </div>
            </div>

            <div>
              <label for="employer-document-to-date" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">تا تاریخ</label>
              <div class="relative">
                <ui-icon name="calendar" [size]="18" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                <input
                  id="employer-document-to-date"
                  name="documentToDate"
                  type="date"
                  [(ngModel)]="filterForm.toDate"
                  class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              </div>
            </div>
          </div>

          <fieldset class="mt-4 rounded-xl border border-border bg-background/60 p-3 dark:border-slate-700 dark:bg-slate-900/40">
            <legend class="px-1 text-sm font-bold text-foreground dark:text-slate-200">مبنای جستجوی تاریخ</legend>
            <div class="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6">
              <label class="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground dark:text-slate-200">
                <input
                  type="radio"
                  name="documentDateBasis"
                  value="expiration"
                  [(ngModel)]="filterForm.dateBasis"
                  class="h-4 w-4 border-border text-primary focus:ring-primary/25 dark:border-slate-600 dark:bg-slate-900">
                جستجو بر اساس تاریخ انقضا
              </label>
              <label class="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground dark:text-slate-200">
                <input
                  type="radio"
                  name="documentDateBasis"
                  value="sent"
                  [(ngModel)]="filterForm.dateBasis"
                  class="h-4 w-4 border-border text-primary focus:ring-primary/25 dark:border-slate-600 dark:bg-slate-900">
                جستجو بر اساس تاریخ ارسال
              </label>
            </div>
          </fieldset>

          <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              (click)="showAllDocuments()"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">
              <ui-icon name="list-check" [size]="18"></ui-icon>
              مشاهده همه
            </button>
            <button
              type="submit"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/15 transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto">
              <ui-icon name="search" [size]="18"></ui-icon>
              جستجو
            </button>
          </div>
        </form>
      </section>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="employer-document-list-title">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ui-icon name="file-text" [size]="21"></ui-icon>
          </div>
          <div>
            <h2 id="employer-document-list-title" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">فهرست اسناد</h2>
            <p class="mt-0.5 text-xs text-muted sm:text-sm">اطلاعات ارسال، میزبانی و انقضای اسناد</p>
          </div>
        </div>

        @if (filteredDocuments().length > 0) {
          <div class="hidden overflow-hidden rounded-xl border border-border dark:border-slate-700 xl:block">
            <table class="w-full table-fixed text-[11px] 2xl:text-xs">
              <thead class="bg-background/80 dark:bg-slate-900/60">
                <tr>
                  <th class="w-14 px-2 py-3 text-right font-bold text-muted">شناسه</th>
                  <th class="w-24 px-2 py-3 text-right font-bold text-muted">تاریخ ارسال</th>
                  <th class="px-2 py-3 text-right font-bold text-muted">عنوان سند</th>
                  <th class="px-2 py-3 text-right font-bold text-muted">شرکت / کارگاه</th>
                  <th class="w-28 px-2 py-3 text-right font-bold text-muted">مبلغ/ریال</th>
                  <th class="w-24 px-2 py-3 text-right font-bold text-muted">وضعیت</th>
                  <th class="w-20 px-2 py-3 text-right font-bold text-muted">میزبانی</th>
                  <th class="w-24 px-2 py-3 text-right font-bold text-muted">انقضا</th>
                  <th class="w-28 px-2 py-3 text-right font-bold text-muted">عملیات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border dark:divide-slate-700">
                @for (document of filteredDocuments(); track document.id) {
                  <tr class="transition-colors hover:bg-primary/5 dark:hover:bg-primary/10">
                    <td class="px-2 py-3 font-bold text-foreground dark:text-slate-200"><span dir="ltr">{{ document.id }}</span></td>
                    <td class="whitespace-nowrap px-2 py-3 text-muted"><span dir="ltr">{{ formatDate(document.sentAt) }}</span></td>
                    <td class="px-2 py-3 font-bold leading-5 text-foreground dark:text-slate-100">{{ document.title }}</td>
                    <td class="px-2 py-3 leading-5 text-foreground dark:text-slate-200">{{ document.companyName }}</td>
                    <td class="whitespace-nowrap px-2 py-3 font-bold text-foreground dark:text-slate-200">{{ formatAmount(document.amountRial) }}</td>
                    <td class="px-2 py-3">
                      <span class="inline-flex items-center rounded-full bg-success/15 px-2 py-1 font-bold text-success">{{ document.status }}</span>
                    </td>
                    <td class="px-2 py-3">
                      <span [class]="hostingClass(document)">{{ document.hostingLabel }}</span>
                    </td>
                    <td class="whitespace-nowrap px-2 py-3" [class.text-danger]="isExpiredHosting(document)" [class.font-bold]="isExpiredHosting(document)" [class.text-muted]="!isExpiredHosting(document)">
                      <span dir="ltr">{{ formatDate(document.expiresAt) }}</span>
                    </td>
                    <td class="px-2 py-3">
                      <span
                        role="status"
                        aria-label="عملیات این سند در این مرحله تعریف نشده است"
                        class="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-border px-2 py-1.5 font-bold text-muted dark:border-slate-600">
                        <ui-icon name="info" [size]="14"></ui-icon>
                        در دسترس نیست
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="space-y-3 xl:hidden">
            @for (document of filteredDocuments(); track document.id) {
              <article class="rounded-xl border border-border bg-background/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="break-words text-base font-extrabold leading-6 text-foreground dark:text-slate-100">{{ document.title }}</h3>
                    <p class="mt-1 text-xs leading-5 text-muted">{{ document.companyName }}</p>
                  </div>
                  <span class="inline-flex shrink-0 items-center rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">{{ document.status }}</span>
                </div>

                <dl class="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-3 dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-3">
                  <div>
                    <dt class="text-[11px] text-muted">شناسه</dt>
                    <dd class="mt-1 text-sm font-bold text-foreground dark:text-slate-200" dir="ltr">{{ document.id }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] text-muted">تاریخ ارسال</dt>
                    <dd class="mt-1 text-sm font-bold text-foreground dark:text-slate-200" dir="ltr">{{ formatDate(document.sentAt) }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] text-muted">مبلغ/ریال</dt>
                    <dd class="mt-1 whitespace-nowrap text-sm font-bold text-foreground dark:text-slate-200">{{ formatAmount(document.amountRial) }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] text-muted">میزبانی</dt>
                    <dd class="mt-1"><span [class]="hostingClass(document)">{{ document.hostingLabel }}</span></dd>
                  </div>
                  <div>
                    <dt class="text-[11px] text-muted">انقضا</dt>
                    <dd class="mt-1 text-sm" [class.text-danger]="isExpiredHosting(document)" [class.font-bold]="isExpiredHosting(document)" [class.text-foreground]="!isExpiredHosting(document)" [class.dark:text-slate-200]="!isExpiredHosting(document)" dir="ltr">{{ formatDate(document.expiresAt) }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] text-muted">عملیات</dt>
                    <dd class="mt-1">
                      <span role="status" aria-label="عملیات این سند در این مرحله تعریف نشده است" class="inline-flex cursor-not-allowed items-center gap-1 text-xs font-bold text-muted">
                        <ui-icon name="info" [size]="13"></ui-icon>
                        در دسترس نیست
                      </span>
                    </dd>
                  </div>
                </dl>
              </article>
            }
          </div>
        } @else {
          <div class="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center dark:border-slate-600 dark:bg-slate-900/40">
            <ui-icon name="inbox" [size]="34" class="mx-auto text-muted opacity-70"></ui-icon>
            <p class="mt-3 text-sm font-bold text-foreground dark:text-slate-200">سندی مطابق فیلترهای انتخاب‌شده پیدا نشد.</p>
            <p class="mt-1 text-xs leading-5 text-muted">برای مشاهده همه اسناد، فیلترها را بازنشانی کنید.</p>
          </div>
        }
      </section>
    </div>
  `
})
export class EmployerDocumentsComponent {
  private readonly amountFormatter = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });

  readonly companyOptions: readonly EmployerDocumentCompanyOption[] = [
    { id: 101, name: 'مجموعه نمونه سپهر' },
    { id: 102, name: 'مجموعه آزمایشی باران' },
    { id: 103, name: 'مجموعه نمایشی نارنج' }
  ];

  readonly documents = signal<readonly EmployerDocumentRecord[]>([
    {
      id: 2001,
      sentAt: '2026-04-10',
      title: 'گزارش پرداخت فروردین',
      companyId: 101,
      companyName: 'مجموعه نمونه سپهر',
      amountRial: 340_000,
      status: 'توزیع‌شده',
      hostingLabel: '1 ماهه',
      expiresAt: '2026-05-10'
    },
    {
      id: 2002,
      sentAt: '2026-05-18',
      title: 'صورت‌حساب دوره‌ای کارکنان',
      companyId: 102,
      companyName: 'مجموعه آزمایشی باران',
      amountRial: 785_000,
      status: 'توزیع‌شده',
      hostingLabel: '12 ماهه',
      expiresAt: '2027-05-18'
    },
    {
      id: 2003,
      sentAt: '2025-11-07',
      title: 'گزارش تسویه پاییز',
      companyId: 101,
      companyName: 'مجموعه نمونه سپهر',
      amountRial: 420_000,
      status: 'توزیع‌شده',
      hostingLabel: 'منقضی',
      expiresAt: '2025-12-07'
    },
    {
      id: 2004,
      sentAt: '2026-06-22',
      title: 'خلاصه پرداخت خرداد',
      companyId: 103,
      companyName: 'مجموعه نمایشی نارنج',
      amountRial: 610_000,
      status: 'توزیع‌شده',
      hostingLabel: '1 ماهه',
      expiresAt: '2026-07-22'
    },
    {
      id: 2005,
      sentAt: '2026-07-14',
      title: 'گزارش تجمیعی تابستان',
      companyId: 102,
      companyName: 'مجموعه آزمایشی باران',
      amountRial: 925_000,
      status: 'توزیع‌شده',
      hostingLabel: '12 ماهه',
      expiresAt: '2027-07-14'
    }
  ]);

  filterForm: EmployerDocumentFilterForm = this.createDefaultFilterForm();

  readonly appliedCompanyId = signal('all');
  readonly appliedFromDate = signal('');
  readonly appliedToDate = signal('');
  readonly appliedDateBasis = signal<DocumentDateBasis>('expiration');

  readonly filteredDocuments = computed(() => {
    const companyId = this.appliedCompanyId();
    const fromDate = this.appliedFromDate();
    const toDate = this.appliedToDate();
    const dateBasis = this.appliedDateBasis();

    return this.documents().filter((document) => {
      const selectedDate = dateBasis === 'sent' ? document.sentAt : document.expiresAt;
      const matchesCompany = companyId === 'all' || String(document.companyId) === companyId;
      const matchesFromDate = fromDate.length === 0 || selectedDate >= fromDate;
      const matchesToDate = toDate.length === 0 || selectedDate <= toDate;

      return matchesCompany && matchesFromDate && matchesToDate;
    });
  });

  applyFilters(): void {
    this.appliedCompanyId.set(this.filterForm.companyId);
    this.appliedFromDate.set(this.filterForm.fromDate);
    this.appliedToDate.set(this.filterForm.toDate);
    this.appliedDateBasis.set(this.filterForm.dateBasis);
  }

  showAllDocuments(): void {
    this.filterForm = this.createDefaultFilterForm();
    this.appliedCompanyId.set('all');
    this.appliedFromDate.set('');
    this.appliedToDate.set('');
    this.appliedDateBasis.set('expiration');
  }

  formatAmount(amount: number): string {
    return `${this.amountFormatter.format(amount)} ریال`;
  }

  formatDate(value: string): string {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return value.replaceAll('-', '/').replace(/[0-9]/g, (digit) => persianDigits[Number(digit)]);
  }

  isExpiredHosting(document: EmployerDocumentRecord): boolean {
    return document.hostingLabel === 'منقضی';
  }

  hostingClass(document: EmployerDocumentRecord): string {
    return this.isExpiredHosting(document)
      ? 'inline-flex items-center rounded-full bg-danger/15 px-2 py-1 text-xs font-bold text-danger'
      : 'inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary';
  }

  private createDefaultFilterForm(): EmployerDocumentFilterForm {
    return {
      companyId: 'all',
      fromDate: '',
      toDate: '',
      dateBasis: 'expiration'
    };
  }
}

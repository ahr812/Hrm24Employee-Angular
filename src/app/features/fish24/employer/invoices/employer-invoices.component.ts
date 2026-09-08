import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

interface EmployerInvoiceRecord {
  readonly id: number;
  readonly title: 'فاکتور شارژ کیف پول';
  readonly invoiceNumber: string;
  readonly issuedAt: string;
  readonly amountRial: number;
}

@Component({
  selector: 'app-employer-invoices',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
      <header class="flex min-w-0 items-center gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
          <ui-icon name="file-text" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">لیست فاکتورها</h1>
          <p class="mt-1 text-sm text-muted sm:text-base">مشاهده فاکتورهای صادرشده</p>
        </div>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="employer-invoice-search-title">
        <div class="mb-4 flex items-center gap-3 border-b border-border pb-4 dark:border-slate-700">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ui-icon name="search" [size]="21"></ui-icon>
          </div>
          <div>
            <h2 id="employer-invoice-search-title" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">جستجوی فاکتورها</h2>
            <p class="mt-0.5 text-xs text-muted sm:text-sm">جستجو بر اساس عنوان یا شماره فاکتور</p>
          </div>
        </div>

        <div class="max-w-xl">
          <label for="employer-invoice-search" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">جستجو</label>
          <div class="relative">
            <ui-icon name="search" [size]="18" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
            <input
              id="employer-invoice-search"
              name="invoiceSearch"
              type="search"
              [ngModel]="searchQuery()"
              (ngModelChange)="onSearchChange($event)"
              aria-controls="employer-invoice-results"
              autocomplete="off"
              class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="جستجو...">
          </div>
        </div>
      </section>

      <section id="employer-invoice-results" class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="employer-invoice-list-title">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ui-icon name="file-text" [size]="21"></ui-icon>
          </div>
          <div>
            <h2 id="employer-invoice-list-title" aria-live="polite" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">
              لیست فاکتورها (شامل {{ formatNumber(filteredInvoices().length) }} رکورد)
            </h2>
            <p class="mt-0.5 text-xs text-muted sm:text-sm">نتایج مطابق جستجوی فعلی نمایش داده می‌شوند.</p>
          </div>
        </div>

        @if (filteredInvoices().length > 0) {
          <div class="hidden overflow-hidden rounded-xl border border-border dark:border-slate-700 lg:block">
            <table class="w-full table-fixed text-sm">
              <thead class="bg-background/80 dark:bg-slate-900/60">
                <tr>
                  <th class="px-4 py-3 text-right font-bold text-muted">عنوان</th>
                  <th class="w-52 px-4 py-3 text-right font-bold text-muted">شماره فاکتور</th>
                  <th class="w-36 px-4 py-3 text-right font-bold text-muted">تاریخ صدور</th>
                  <th class="w-44 px-4 py-3 text-right font-bold text-muted">مبلغ/ریال</th>
                  <th class="w-28 px-4 py-3 text-center font-bold text-muted">عملیات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border dark:divide-slate-700">
                @for (invoice of pagedInvoices(); track invoice.id) {
                  <tr class="transition-colors hover:bg-primary/5 dark:hover:bg-primary/10">
                    <td class="px-4 py-4 font-bold text-foreground dark:text-slate-100">{{ invoice.title }}</td>
                    <td class="px-4 py-4 font-semibold text-foreground dark:text-slate-200" dir="ltr">{{ invoice.invoiceNumber }}</td>
                    <td class="whitespace-nowrap px-4 py-4 text-muted" dir="ltr">{{ invoice.issuedAt }}</td>
                    <td class="whitespace-nowrap px-4 py-4 font-bold text-foreground dark:text-slate-200">{{ formatAmount(invoice.amountRial) }}</td>
                    <td class="px-4 py-4 text-center">
                      <span
                        role="status"
                        title="عملیات فاکتور در مرحله بعد تکمیل می‌شود."
                        aria-label="عملیات فاکتور در مرحله بعد تکمیل می‌شود"
                        class="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-border bg-background p-2 text-muted dark:border-slate-600 dark:bg-slate-900">
                        <ui-icon name="file-text" [size]="18"></ui-icon>
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="space-y-3 lg:hidden">
            @for (invoice of pagedInvoices(); track invoice.id) {
              <article class="rounded-xl border border-border bg-background/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-[11px] text-muted">عنوان</p>
                    <h3 class="mt-1 break-words text-base font-extrabold leading-6 text-foreground dark:text-slate-100">{{ invoice.title }}</h3>
                  </div>
                  <span
                    role="status"
                    title="عملیات فاکتور در مرحله بعد تکمیل می‌شود."
                    aria-label="عملیات فاکتور در مرحله بعد تکمیل می‌شود"
                    class="inline-flex shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-border bg-surface p-2 text-muted dark:border-slate-600 dark:bg-slate-800">
                    <ui-icon name="file-text" [size]="18"></ui-icon>
                  </span>
                </div>

                <dl class="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface p-3 dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-3">
                  <div>
                    <dt class="text-[11px] text-muted">شماره فاکتور</dt>
                    <dd class="mt-1 break-all text-sm font-bold text-foreground dark:text-slate-200" dir="ltr">{{ invoice.invoiceNumber }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] text-muted">تاریخ صدور</dt>
                    <dd class="mt-1 text-sm font-bold text-foreground dark:text-slate-200" dir="ltr">{{ invoice.issuedAt }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] text-muted">مبلغ/ریال</dt>
                    <dd class="mt-1 whitespace-nowrap text-sm font-bold text-foreground dark:text-slate-200">{{ formatAmount(invoice.amountRial) }}</dd>
                  </div>
                  <div class="sm:hidden">
                    <dt class="text-[11px] text-muted">عملیات</dt>
                    <dd class="mt-1 text-xs font-bold text-muted">در مرحله بعد تکمیل می‌شود</dd>
                  </div>
                </dl>
              </article>
            }
          </div>

          <nav class="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-border pt-5 dark:border-slate-700" aria-label="صفحه‌بندی فاکتورها">
            <button
              type="button"
              (click)="goToPage(1)"
              [disabled]="currentPage() === 1"
              class="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              اولین
            </button>

            @for (page of pageNumbers(); track page) {
              <button
                type="button"
                (click)="goToPage(page)"
                [attr.aria-current]="currentPage() === page ? 'page' : null"
                [attr.aria-label]="'صفحه ' + formatNumber(page)"
                [class]="currentPage() === page
                  ? 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-primary px-3 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30'
                  : 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'">
                {{ formatNumber(page) }}
              </button>
            }

            <button
              type="button"
              (click)="goToPage(totalPages())"
              [disabled]="currentPage() === totalPages()"
              class="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              آخرین
            </button>
          </nav>
        } @else {
          <div class="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center dark:border-slate-600 dark:bg-slate-900/40">
            <ui-icon name="inbox" [size]="34" class="mx-auto text-muted opacity-70"></ui-icon>
            <p class="mt-3 text-sm font-bold text-foreground dark:text-slate-200">فاکتوری مطابق جستجوی شما پیدا نشد.</p>
            <p class="mt-1 text-xs leading-5 text-muted">عبارت جستجو را تغییر دهید یا پاک کنید.</p>
          </div>
        }
      </section>
    </div>
  `
})
export class EmployerInvoicesComponent {
  private readonly numberFormatter = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });

  readonly invoices: readonly EmployerInvoiceRecord[] = [
    { id: 1, title: 'فاکتور شارژ کیف پول', invoiceNumber: 'INV-DEMO-101', issuedAt: '1405/06/17', amountRial: 267_000 },
    { id: 2, title: 'فاکتور شارژ کیف پول', invoiceNumber: 'INV-DEMO-205', issuedAt: '1405/05/29', amountRial: 534_000 },
    { id: 3, title: 'فاکتور شارژ کیف پول', invoiceNumber: 'INV-DEMO-318', issuedAt: '1405/04/11', amountRial: 712_000 },
    { id: 4, title: 'فاکتور شارژ کیف پول', invoiceNumber: 'INV-DEMO-426', issuedAt: '1405/03/23', amountRial: 389_000 },
    { id: 5, title: 'فاکتور شارژ کیف پول', invoiceNumber: 'INV-DEMO-539', issuedAt: '1405/02/08', amountRial: 845_000 }
  ];

  readonly pageSize = 2;
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);

  readonly filteredInvoices = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase('fa-IR');

    if (!query) {
      return this.invoices;
    }

    return this.invoices.filter((invoice) =>
      invoice.title.toLocaleLowerCase('fa-IR').includes(query)
      || invoice.invoiceNumber.toLocaleLowerCase('fa-IR').includes(query)
    );
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredInvoices().length / this.pageSize)));

  readonly pagedInvoices = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.filteredInvoices().slice(startIndex, startIndex + this.pageSize);
  });

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    const safePage = Math.min(Math.max(page, 1), this.totalPages());
    this.currentPage.set(safePage);
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  formatAmount(amount: number): string {
    return `${this.numberFormatter.format(amount)} ریال`;
  }
}

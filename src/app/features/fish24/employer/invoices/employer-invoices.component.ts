import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { EMPLOYER_INVOICE_PREVIEWS } from './employer-invoice-preview.data';

@Component({
  selector: 'app-employer-invoices',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] animate-fade-in-up" dir="rtl">
      <section id="employer-invoice-results" class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="employer-invoice-list-title">
        <div class="mb-5 flex flex-col gap-4 border-b border-border pb-5 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ui-icon name="file-text" [size]="24"></ui-icon>
            </div>
            <div class="min-w-0">
              <h1 id="employer-invoice-list-title" aria-live="polite" class="text-xl font-bold text-primary sm:text-2xl">
                لیست فاکتورها (شامل {{ formatNumber(filteredInvoices().length) }} رکورد)
              </h1>
              <p class="mt-0.5 text-xs text-muted sm:text-sm">مشاهده فاکتورهای صادرشده</p>
            </div>
          </div>

          <div class="w-full lg:max-w-sm">
            <label for="employer-invoice-search" class="sr-only">جستجو بر اساس عنوان یا شماره فاکتور</label>
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
                @for (invoice of filteredInvoices(); track invoice.id) {
                  <tr class="transition-colors hover:bg-primary/5 dark:hover:bg-primary/10">
                    <td class="px-4 py-4 font-bold text-foreground dark:text-slate-100">{{ invoice.title }}</td>
                    <td class="px-4 py-4 text-right font-semibold text-foreground dark:text-slate-200"><span class="inline-block" dir="ltr">{{ invoice.invoiceNumber }}</span></td>
                    <td class="whitespace-nowrap px-4 py-4 text-right text-muted"><span class="inline-block" dir="ltr">{{ invoice.issuedAt }}</span></td>
                    <td class="whitespace-nowrap px-4 py-4 font-bold text-foreground dark:text-slate-200">{{ formatAmount(invoice.amountRial) }}</td>
                    <td class="px-4 py-4 text-center">
                      <a
                        [routerLink]="['/fish24/employer/invoices', invoice.id, 'print']"
                        target="_blank"
                        rel="noopener"
                        [attr.aria-label]="'مشاهده و چاپ فاکتور شماره ' + invoice.invoiceNumber"
                        title="مشاهده و چاپ فاکتور"
                        class="inline-flex items-center justify-center rounded-lg border border-primary/30 bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <ui-icon name="file-text" [size]="18"></ui-icon>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="space-y-3 lg:hidden">
            @for (invoice of filteredInvoices(); track invoice.id) {
              <article class="rounded-xl border border-border bg-background/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-[11px] text-muted">عنوان</p>
                    <h3 class="mt-1 break-words text-base font-extrabold leading-6 text-foreground dark:text-slate-100">{{ invoice.title }}</h3>
                  </div>
                  <a
                    [routerLink]="['/fish24/employer/invoices', invoice.id, 'print']"
                    target="_blank"
                    rel="noopener"
                    [attr.aria-label]="'مشاهده و چاپ فاکتور شماره ' + invoice.invoiceNumber"
                    title="مشاهده و چاپ فاکتور"
                    class="inline-flex shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <ui-icon name="file-text" [size]="18"></ui-icon>
                  </a>
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
                </dl>
              </article>
            }
          </div>
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

  readonly invoices = EMPLOYER_INVOICE_PREVIEWS;
  readonly searchQuery = signal('');

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

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  formatAmount(amount: number): string {
    return `${this.numberFormatter.format(amount)} ریال`;
  }
}

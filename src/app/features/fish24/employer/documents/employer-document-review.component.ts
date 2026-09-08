import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EscToCloseDirective } from '../../../../shared/directives/esc-to-close.directive';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import {
  DOCUMENT_PAGE_ERROR_LABELS,
  EmployerDocumentWorkflowService
} from './employer-document-workflow.service';

@Component({
  selector: 'app-employer-document-review',
  standalone: true,
  imports: [IconComponent, EscToCloseDirective],
  template: `
    @if (reviewState(); as state) {
      <div class="mx-auto max-w-5xl space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
        <header class="flex items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
            <ui-icon name="clipboard-check" [size]="30" class="text-primary"></ui-icon>
          </div>
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-primary sm:text-3xl">مشاهده و تایید نهایی</h1>
            <p class="mt-1 break-words text-sm font-bold text-foreground dark:text-slate-200 sm:text-base">{{ state.documentTitle }}</p>
          </div>
        </header>

        <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="document-review-summary-title">
          <div class="flex flex-col gap-4 border-b border-border pb-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="document-review-summary-title" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">خلاصه بررسی سند</h2>
              <p class="mt-1 text-xs leading-5 text-muted">نتیجه فعلی پیش‌نمایش رابط کاربری است و محتوای PDF به‌صورت واقعی پردازش نشده است.</p>
            </div>
            <span class="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              <ui-icon name="file-text" [size]="15"></ui-icon>
              بررسی پیش از توزیع
            </span>
          </div>

          <dl class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-xl border border-border bg-background/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <dt class="text-xs text-muted">عنوان سند</dt>
              <dd class="mt-1 break-words text-sm font-extrabold text-foreground dark:text-slate-100">{{ state.documentTitle }}</dd>
            </div>
            <div class="rounded-xl border border-border bg-background/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <dt class="text-xs text-muted">شرکت / کارگاه</dt>
              <dd class="mt-1 text-sm font-extrabold text-foreground dark:text-slate-100">{{ state.companyName }}</dd>
            </div>
            <div class="rounded-xl border border-border bg-background/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <dt class="text-xs text-muted">فایل انتخاب‌شده</dt>
              <dd class="mt-1 truncate text-sm font-extrabold text-foreground dark:text-slate-100" dir="ltr">{{ state.fileName }}</dd>
            </div>
            <div class="rounded-xl border border-border bg-background/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <dt class="text-xs text-muted">مدت میزبانی</dt>
              <dd class="mt-1 text-sm font-extrabold text-foreground dark:text-slate-100">{{ state.hostingLabel }}</dd>
            </div>
            <div class="rounded-xl border border-border bg-background/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <dt class="text-xs text-muted">تاریخ انقضاء میزبانی</dt>
              <dd class="mt-1 text-sm font-extrabold text-foreground dark:text-slate-100" dir="ltr">{{ state.expirationPreview }}</dd>
            </div>
            <div class="rounded-xl border border-border bg-background/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <dt class="text-xs text-muted">تعداد صفحات</dt>
              <dd class="mt-1 text-sm font-extrabold text-foreground dark:text-slate-100" dir="ltr">{{ pageCount() }}</dd>
            </div>
          </dl>

          <div class="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div class="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-xs font-bold text-muted">کل شماره موبایل ها</p>
                  <p class="mt-1 text-2xl font-black text-primary" dir="ltr">{{ validPageResults().length }}</p>
                </div>
                <button
                  type="button"
                  (click)="openMobileModal()"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-surface px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25 dark:bg-slate-800 sm:w-auto">
                  <ui-icon name="eye" [size]="17"></ui-icon>
                  مشاهده همه
                </button>
              </div>
            </div>

            <div class="rounded-xl border border-border bg-background/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <p class="text-xs font-bold text-muted">مبلغ قابل پرداخت</p>
              <p class="mt-2 text-sm font-extrabold leading-6 text-foreground dark:text-slate-100">محاسبه نهایی در مرحله اتصال به سرویس</p>
              <p class="mt-1 text-xs leading-5 text-muted">قیمت میزبانی، مالیات و خدمات پیامکی در مبلغ نهایی لحاظ خواهد شد.</p>
            </div>
          </div>

          @if (hasProcessingErrors()) {
            <div class="mt-5 rounded-xl border border-danger/25 bg-danger/5 p-4" role="alert">
              <h3 class="flex items-center gap-2 text-sm font-extrabold text-danger">
                <ui-icon name="alert-circle" [size]="18"></ui-icon>
                بررسی فایل نامعتبر است و کل فایل قابل توزیع نیست.
              </h3>
              <ul class="mt-3 space-y-2 text-xs font-semibold leading-5 text-danger">
                @for (page of pageErrors(); track page.pageNumber) {
                  <li>صفحه {{ page.pageNumber }}: {{ page.error ? errorLabel(page.error) : '' }}</li>
                }
              </ul>
              <p class="mt-3 text-xs font-bold text-danger">امکان رد کردن صفحه، نادیده‌گرفتن خطا یا ادامه اجباری وجود ندارد.</p>
            </div>
          } @else {
            <div class="mt-5 flex items-start gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm font-bold leading-6 text-success">
              <ui-icon name="check-circle" [size]="19" class="mt-0.5 shrink-0"></ui-icon>
              <span>پیش‌نمایش صفحات بدون خطای نمایشی آماده تأیید است.</span>
            </div>
          }
        </section>

        <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="document-final-confirmation-title">
          <h2 id="document-final-confirmation-title" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">تأیید مسئولیت و اقدام نهایی</h2>

          <label class="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/60 p-4 text-sm font-semibold leading-7 text-foreground transition-colors hover:border-primary/40 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
            <input
              type="checkbox"
              [checked]="acknowledgement()"
              (change)="onAcknowledgementChange($event)"
              class="mt-1 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary/25 dark:border-slate-600 dark:bg-slate-900">
            <span>تأیید می‌کنم فایل انتخاب‌شده و شماره‌های موبایل نمایش‌داده‌شده صحیح است و مسئولیت خطاهای ناشی از انتخاب یا محتوای فایل و غیرقابل‌استرداد بودن مبلغ پرداختی را می‌پذیرم.</span>
          </label>

          @if (finalActionMessage()) {
            <div class="mt-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold leading-6 text-primary" role="status">
              <ui-icon name="info" [size]="19" class="mt-0.5 shrink-0"></ui-icon>
              <span>{{ finalActionMessage() }}</span>
            </div>
          }

          <div class="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
            <button
              type="button"
              (click)="cancel()"
              class="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">
              انصراف
            </button>
            <button
              type="button"
              [disabled]="!canUseFinalAction()"
              (click)="showFinalActionInformation()"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/15 transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:w-auto">
              <ui-icon name="wallet" [size]="18"></ui-icon>
              کسر مبلغ از کیف پول و توزیع سند
            </button>
          </div>
        </section>

        @if (isMobileModalOpen()) {
          <div
            appEscToClose
            (escPressed)="closeMobileModal()"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-6 backdrop-blur-sm sm:items-center sm:pt-4"
            (click)="closeMobileModal()">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="extracted-mobile-modal-title"
              class="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl dark:border-slate-700 dark:bg-slate-800"
              (click)="$event.stopPropagation()">
              <div class="flex items-start justify-between gap-3 border-b border-border p-4 dark:border-slate-700 sm:p-5">
                <div class="min-w-0">
                  <h2 id="extracted-mobile-modal-title" class="text-base font-extrabold leading-6 text-foreground dark:text-slate-100 sm:text-lg">همه شماره موبایل های موجود در سند ارسالی</h2>
                  <p class="mt-1 text-xs text-muted">شماره‌ها فقط داده مصنوعی پیش‌نمایش این مرحله هستند.</p>
                </div>
                <button
                  type="button"
                  (click)="closeMobileModal()"
                  class="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 dark:hover:bg-slate-700"
                  aria-label="بستن پنجره">
                  <ui-icon name="x" [size]="20"></ui-icon>
                </button>
              </div>

              <div class="max-h-[60vh] overflow-y-auto p-4 sm:p-5">
                <div class="overflow-hidden rounded-xl border border-border dark:border-slate-700">
                  <table class="w-full table-fixed text-sm">
                    <thead class="bg-background/80 dark:bg-slate-900/60">
                      <tr>
                        <th class="w-1/3 px-3 py-3 text-right font-bold text-muted">شماره صفحه</th>
                        <th class="px-3 py-3 text-right font-bold text-muted">موبایل</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border dark:divide-slate-700">
                      @for (page of validPageResults(); track page.pageNumber) {
                        <tr>
                          <td class="px-3 py-3 font-bold text-foreground dark:text-slate-200" dir="ltr">{{ page.pageNumber }}</td>
                          <td class="px-3 py-3 font-bold text-foreground dark:text-slate-100" dir="ltr">{{ page.mobile }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="border-t border-border p-4 dark:border-slate-700 sm:p-5">
                <button
                  type="button"
                  (click)="closeMobileModal()"
                  class="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto">
                  بستن
                </button>
              </div>
            </section>
          </div>
        }
      </div>
    }
  `
})
export class EmployerDocumentReviewComponent implements OnInit {
  readonly reviewState = this.workflow.reviewState;
  readonly acknowledgement = signal(false);
  readonly isMobileModalOpen = signal(false);
  readonly finalActionMessage = signal<string | null>(null);

  readonly validPageResults = computed(() =>
    (this.reviewState()?.pageResults ?? []).filter((page) => page.mobile && !page.error)
  );

  readonly pageErrors = computed(() =>
    (this.reviewState()?.pageResults ?? []).filter((page) => page.error)
  );

  readonly hasProcessingErrors = computed(() => this.pageErrors().length > 0);
  readonly pageCount = computed(() => this.reviewState()?.pageResults.length ?? 0);
  readonly canUseFinalAction = computed(() =>
    this.reviewState() !== null && this.acknowledgement() && !this.hasProcessingErrors()
  );

  constructor(
    private readonly router: Router,
    private readonly workflow: EmployerDocumentWorkflowService
  ) {}

  ngOnInit(): void {
    if (!this.reviewState()) {
      void this.router.navigate(['/fish24/employer/documents/new'], { replaceUrl: true });
    }
  }

  errorLabel(error: keyof typeof DOCUMENT_PAGE_ERROR_LABELS): string {
    return DOCUMENT_PAGE_ERROR_LABELS[error];
  }

  openMobileModal(): void {
    this.isMobileModalOpen.set(true);
  }

  closeMobileModal(): void {
    this.isMobileModalOpen.set(false);
  }

  onAcknowledgementChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.acknowledgement.set(checkbox.checked);
    this.finalActionMessage.set(null);
  }

  showFinalActionInformation(): void {
    if (!this.canUseFinalAction()) {
      return;
    }

    this.finalActionMessage.set('توزیع نهایی پس از اتصال سرویس پردازش، قیمت‌گذاری و کیف پول فعال خواهد شد.');
  }

  cancel(): void {
    this.workflow.clear();
    void this.router.navigate(['/fish24/employer/documents']);
  }
}

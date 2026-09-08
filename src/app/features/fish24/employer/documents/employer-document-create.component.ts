import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { EmployerDocumentWorkflowService } from './employer-document-workflow.service';

interface DocumentCompanyOption {
  readonly id: number;
  readonly name: string;
}

interface HostingPreviewOption {
  readonly id: string;
  readonly label: '1 ماهه' | '12 ماهه';
  readonly expirationPreview: string;
}

@Component({
  selector: 'app-employer-document-create',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="mx-auto max-w-5xl space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
      <header class="flex items-center gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
          <ui-icon name="file-plus" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">ارسال سند جدید</h1>
          <p class="mt-1 text-sm text-muted sm:text-base">اطلاعات سند را تکمیل و پیش از تأیید نهایی بررسی کنید.</p>
        </div>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="new-document-form-title">
        <div class="mb-5 flex items-center gap-3 border-b border-border pb-4 dark:border-slate-700">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ui-icon name="clipboard-check" [size]="21"></ui-icon>
          </div>
          <div>
            <h2 id="new-document-form-title" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">مشخصات سند</h2>
            <p class="mt-0.5 text-xs text-muted sm:text-sm">فیلدهای ستاره‌دار برای ورود به مرحله بررسی الزامی هستند.</p>
          </div>
        </div>

        <form (ngSubmit)="continueToReview()" novalidate>
          <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <label for="employer-document-title" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">
                عنوان سند ارسالی <span class="text-danger" aria-hidden="true">*</span>
              </label>
              <input
                id="employer-document-title"
                name="documentTitle"
                type="text"
                [(ngModel)]="documentTitle"
                [attr.aria-invalid]="showTitleError()"
                [attr.aria-describedby]="showTitleError() ? 'employer-document-title-error' : null"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                placeholder="برای مثال: فیش حقوقی شهریور">
              @if (showTitleError()) {
                <p id="employer-document-title-error" role="alert" class="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
                  <ui-icon name="alert-circle" [size]="14"></ui-icon>
                  عنوان سند را وارد کنید.
                </p>
              }
            </div>

            <div>
              <label for="employer-document-company" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">
                انتخاب شرکت یا کارگاه <span class="text-danger" aria-hidden="true">*</span>
              </label>
              <select
                id="employer-document-company"
                name="documentCompany"
                [(ngModel)]="selectedCompanyId"
                [attr.aria-invalid]="showCompanyError()"
                [attr.aria-describedby]="showCompanyError() ? 'employer-document-company-error' : null"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                <option value="">انتخاب کنید</option>
                @for (company of companyOptions; track company.id) {
                  <option [value]="company.id">{{ company.name }}</option>
                }
              </select>
              @if (showCompanyError()) {
                <p id="employer-document-company-error" role="alert" class="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
                  <ui-icon name="alert-circle" [size]="14"></ui-icon>
                  یک شرکت یا کارگاه را انتخاب کنید.
                </p>
              }
            </div>

            <div class="lg:col-span-2">
              <label for="employer-document-pdf" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">
                فایل PDF <span class="text-danger" aria-hidden="true">*</span>
              </label>
              <div class="rounded-xl border border-dashed border-border bg-background/60 p-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 dark:border-slate-600 dark:bg-slate-900/50">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
                    <ui-icon name="file-text" [size]="23"></ui-icon>
                  </div>
                  <div class="min-w-0 flex-1">
                    <input
                      id="employer-document-pdf"
                      name="documentPdf"
                      type="file"
                      accept="application/pdf,.pdf"
                      (change)="onFileSelected($event)"
                      [attr.aria-invalid]="showFileError()"
                      [attr.aria-describedby]="showFileError() ? 'employer-document-pdf-error' : 'employer-document-pdf-help'"
                      class="block w-full cursor-pointer text-sm font-semibold text-foreground file:ml-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-primary-hover dark:text-slate-200">
                    <p id="employer-document-pdf-help" class="mt-2 text-xs leading-5 text-muted">
                      فقط فایل PDF انتخاب کنید. بارگذاری واقعی پس از اتصال سرویس انجام خواهد شد.
                    </p>
                  </div>
                </div>
                @if (selectedFileName()) {
                  <div class="mt-3 flex min-w-0 items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-xs font-bold text-success">
                    <ui-icon name="check-circle" [size]="16" class="shrink-0"></ui-icon>
                    <span class="truncate" dir="ltr">{{ selectedFileName() }}</span>
                  </div>
                }
              </div>
              @if (showFileError()) {
                <p id="employer-document-pdf-error" role="alert" class="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
                  <ui-icon name="alert-circle" [size]="14"></ui-icon>
                  {{ fileError() || 'یک فایل PDF انتخاب کنید.' }}
                </p>
              }
            </div>

            <div>
              <label for="employer-document-hosting" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">
                مدت و قیمت میزبانی <span class="text-danger" aria-hidden="true">*</span>
              </label>
              <select
                id="employer-document-hosting"
                name="documentHosting"
                [(ngModel)]="selectedHostingId"
                [attr.aria-invalid]="showHostingError()"
                [attr.aria-describedby]="showHostingError() ? 'employer-document-hosting-error' : 'employer-document-hosting-help'"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                <option value="">انتخاب کنید</option>
                @for (option of hostingOptions; track option.id) {
                  <option [value]="option.id">{{ option.label }}</option>
                }
              </select>
              <p id="employer-document-hosting-help" class="mt-1.5 text-xs leading-5 text-muted">قیمت نهایی پس از اتصال سرویس قیمت‌گذاری محاسبه می‌شود.</p>
              @if (showHostingError()) {
                <p id="employer-document-hosting-error" role="alert" class="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
                  <ui-icon name="alert-circle" [size]="14"></ui-icon>
                  مدت میزبانی را انتخاب کنید.
                </p>
              }
            </div>

            <div>
              <span class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">تاریخ انقضاء میزبانی</span>
              <div class="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 dark:border-slate-600 dark:bg-slate-900">
                <ui-icon name="calendar" [size]="18" class="shrink-0 text-muted"></ui-icon>
                @if (selectedHostingOption(); as option) {
                  <span class="text-sm font-bold text-foreground dark:text-slate-100" dir="ltr">{{ option.expirationPreview }}</span>
                } @else {
                  <span class="text-sm text-muted">پس از انتخاب مدت نمایش داده می‌شود</span>
                }
              </div>
              <p class="mt-1.5 text-xs leading-5 text-muted">تاریخ شمسی پیش‌نمایش است؛ محاسبه قطعی بر عهده سرویس خواهد بود.</p>
            </div>
          </div>

          <div class="mt-5 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/10 px-3 py-3 text-sm font-bold leading-6 text-foreground dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-slate-100">
            <ui-icon name="alert-triangle" [size]="19" class="mt-0.5 shrink-0 text-warning"></ui-icon>
            <span>توجه: مبلغ ارزش افزوده و هزینه خدمات پیامکی اضافه می‌گردد.</span>
          </div>

          <section class="mt-5 rounded-xl border border-border bg-background/60 p-4 dark:border-slate-700 dark:bg-slate-900/40" aria-labelledby="pdf-rules-title">
            <h3 id="pdf-rules-title" class="flex items-center gap-2 text-sm font-extrabold text-foreground dark:text-slate-100">
              <ui-icon name="info" [size]="17" class="text-primary"></ui-icon>
              قواعد بررسی فایل
            </h3>
            <ul class="mt-3 grid gap-2 text-xs leading-5 text-muted sm:grid-cols-2">
              <li>هر صفحه PDF معادل یک فیش است.</li>
              <li>هر صفحه باید دقیقاً یک نشانگر «Mobile 09...» داشته باشد؛ محل آن مهم نیست.</li>
              <li>نبودن یا چندبار تکرار نشانگر در یک صفحه خطاست.</li>
              <li>تکرار یک موبایل در چند صفحه خطاست و هر خطا کل فایل را رد می‌کند.</li>
            </ul>
          </section>

          <div class="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
            <button
              type="button"
              (click)="cancel()"
              class="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">
              انصراف
            </button>
            <button
              type="submit"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/15 transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto">
              <ui-icon name="arrow-left" [size]="18"></ui-icon>
              بررسی فایل و ادامه ...
            </button>
          </div>
        </form>
      </section>
    </div>
  `
})
export class EmployerDocumentCreateComponent {
  readonly companyOptions: readonly DocumentCompanyOption[] = [
    { id: 101, name: 'مجموعه نمونه سپهر' },
    { id: 102, name: 'مجموعه آزمایشی باران' },
    { id: 103, name: 'مجموعه نمایشی نارنج' }
  ];

  readonly hostingOptions: readonly HostingPreviewOption[] = [
    { id: 'one-month', label: '1 ماهه', expirationPreview: '1405/07/16' },
    { id: 'twelve-months', label: '12 ماهه', expirationPreview: '1406/06/16' }
  ];

  documentTitle = '';
  selectedCompanyId = '';
  selectedHostingId = '';

  readonly selectedFileName = signal('');
  readonly fileError = signal<string | null>(null);
  readonly submitted = signal(false);

  constructor(
    private readonly router: Router,
    private readonly workflow: EmployerDocumentWorkflowService
  ) {
    this.workflow.clear();
  }

  selectedHostingOption(): HostingPreviewOption | undefined {
    return this.hostingOptions.find((option) => option.id === this.selectedHostingId);
  }

  showTitleError(): boolean {
    return this.submitted() && this.documentTitle.trim().length === 0;
  }

  showCompanyError(): boolean {
    return this.submitted() && this.selectedCompanyId.length === 0;
  }

  showHostingError(): boolean {
    return this.submitted() && this.selectedHostingId.length === 0;
  }

  showFileError(): boolean {
    return this.fileError() !== null || (this.submitted() && this.selectedFileName().length === 0);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);

    this.fileError.set(null);
    this.selectedFileName.set('');

    if (!file) {
      return;
    }

    const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
    const hasSupportedMime = file.type.length === 0 || file.type === 'application/pdf';

    if (!hasPdfExtension || !hasSupportedMime) {
      this.fileError.set('فرمت فایل باید PDF باشد.');
      input.value = '';
      return;
    }

    this.selectedFileName.set(file.name);
  }

  continueToReview(): void {
    this.submitted.set(true);

    const company = this.companyOptions.find((option) => String(option.id) === this.selectedCompanyId);
    const hosting = this.selectedHostingOption();

    if (
      this.documentTitle.trim().length === 0 ||
      !company ||
      !hosting ||
      this.selectedFileName().length === 0 ||
      this.fileError() !== null
    ) {
      return;
    }

    this.workflow.prepareFrontendPreview({
      documentTitle: this.documentTitle.trim(),
      companyId: company.id,
      companyName: company.name,
      fileName: this.selectedFileName(),
      hostingOptionId: hosting.id,
      hostingLabel: hosting.label,
      expirationPreview: hosting.expirationPreview
    });

    void this.router.navigate(['/fish24/employer/documents/review']);
  }

  cancel(): void {
    this.workflow.clear();
    void this.router.navigate(['/fish24/employer/documents']);
  }
}

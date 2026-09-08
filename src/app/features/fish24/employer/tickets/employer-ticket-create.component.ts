import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { EmployerTicketPreviewService } from './employer-ticket-preview.service';

@Component({
  selector: 'app-employer-ticket-create',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    @if (document; as selectedDocument) {
      <div class="mx-auto max-w-4xl space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
        <header class="flex min-w-0 items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14"><ui-icon name="ticket" [size]="30" class="text-primary"></ui-icon></div>
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-primary sm:text-3xl">ایجاد تیکت برای سند</h1>
            <p class="mt-1 text-sm text-muted sm:text-base">درخواست مرتبط با سند انتخاب‌شده را ثبت کنید.</p>
          </div>
        </header>

        <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="ticket-document-context-title">
          <div class="mb-4 flex items-center gap-3 border-b border-border pb-4 dark:border-slate-700">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon name="file-text" [size]="20"></ui-icon></div>
            <div><h2 id="ticket-document-context-title" class="text-lg font-bold text-foreground dark:text-slate-100">مشخصات سند</h2><p class="mt-0.5 text-xs text-muted">موضوع و محل کار از سند ارسالی دریافت شده‌اند.</p></div>
          </div>
          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="rounded-xl border border-border bg-background/60 p-3 dark:border-slate-700 dark:bg-slate-900/40"><dt class="text-xs text-muted">موضوع</dt><dd id="ticket-create-subject" class="mt-1.5 break-words text-sm font-bold text-foreground dark:text-slate-100">{{ selectedDocument.title }}</dd></div>
            <div class="rounded-xl border border-border bg-background/60 p-3 dark:border-slate-700 dark:bg-slate-900/40"><dt class="text-xs text-muted">محل کار</dt><dd id="ticket-create-workplace" class="mt-1.5 break-words text-sm font-bold text-foreground dark:text-slate-100">{{ selectedDocument.companyName }}</dd></div>
          </dl>
        </section>

        <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="ticket-request-title">
          <div class="mb-5 flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon name="message-square" [size]="20"></ui-icon></div><div><h2 id="ticket-request-title" class="text-lg font-bold text-foreground dark:text-slate-100">درخواست تیکت</h2><p class="mt-0.5 text-xs text-muted">اطلاعات درخواست فقط در حافظه نسخه نمایشی نگهداری می‌شود.</p></div></div>
          <form (ngSubmit)="submit()" novalidate>
            <div class="space-y-4">
              <div>
                <label for="ticket-create-department" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">دپارتمان دریافت کننده</label>
                <select id="ticket-create-department" name="ticketDepartment" [(ngModel)]="department" [attr.aria-invalid]="showDepartmentError()" [attr.aria-describedby]="showDepartmentError() ? 'ticket-create-department-error' : null" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                  <option value="">انتخاب دپارتمان</option>
                  <option value="پشتیبانی">پشتیبانی</option>
                </select>
                @if (showDepartmentError()) { <p id="ticket-create-department-error" role="alert" class="mt-1.5 text-xs font-medium text-danger">دپارتمان دریافت کننده را انتخاب کنید.</p> }
              </div>
              <div>
                <label for="ticket-create-request" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">درخواست</label>
                <textarea id="ticket-create-request" name="ticketRequest" [(ngModel)]="requestText" rows="6" [attr.aria-invalid]="showRequestError()" [attr.aria-describedby]="showRequestError() ? 'ticket-create-request-error' : null" class="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-7 text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" placeholder="درخواست خود را وارد کنید"></textarea>
                @if (showRequestError()) { <p id="ticket-create-request-error" role="alert" class="mt-1.5 text-xs font-medium text-danger">درخواست را وارد کنید.</p> }
              </div>
            </div>
            <div class="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 dark:border-slate-700 sm:flex-row sm:justify-end">
              <a routerLink="/fish24/employer/documents" class="inline-flex w-full items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">انصراف</a>
              <button type="submit" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto"><ui-icon name="check" [size]="18"></ui-icon>ثبت</button>
            </div>
          </form>
        </section>
      </div>
    }
  `
})
export class EmployerTicketCreateComponent {
  private readonly preview = inject(EmployerTicketPreviewService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly documentId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly document = this.preview.findDocument(this.documentId);
  readonly submitted = signal(false);
  department = '';
  requestText = '';

  constructor() {
    if (!this.document) {
      queueMicrotask(() => void this.router.navigate(['/fish24/employer/documents']));
    }
  }

  showDepartmentError(): boolean {
    return this.submitted() && this.department.trim().length === 0;
  }

  showRequestError(): boolean {
    return this.submitted() && this.requestText.trim().length === 0;
  }

  submit(): void {
    this.submitted.set(true);
    if (this.showDepartmentError() || this.showRequestError()) return;

    const ticketId = this.preview.createTicketFromDocument(this.documentId, this.department, this.requestText);
    if (ticketId === null) {
      void this.router.navigate(['/fish24/employer/documents']);
      return;
    }

    this.toast.show('تیکت در نسخه نمایشی ثبت شد.', 'success');
    void this.router.navigate(['/fish24/employer/tickets']);
  }
}

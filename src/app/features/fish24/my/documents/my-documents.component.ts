import { Component, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

interface PersonalDocument {
  readonly id: number;
  readonly title: string;
  readonly documentDate: string;
  readonly senderDisplayName: string;
  readonly expirationDate: string;
  readonly downloadAvailable: boolean;
}

const PERSONAL_DOCUMENTS: readonly PersonalDocument[] = [
  { id: 1, title: 'فیش حقوق مرداد ۱۴۰۵', documentDate: '۱۴۰۵/۰۶/۰۵', senderDisplayName: 'مجموعه نمونه سپهر', expirationDate: '۱۴۰۵/۰۹/۰۵', downloadAvailable: false },
  { id: 2, title: 'گواهی پرداخت پاداش', documentDate: '۱۴۰۵/۰۵/۲۸', senderDisplayName: 'کارگاه آزمایشی باران', expirationDate: '۱۴۰۵/۱۱/۲۸', downloadAvailable: false },
  { id: 3, title: 'فیش حقوق تیر ۱۴۰۵', documentDate: '۱۴۰۵/۰۵/۰۳', senderDisplayName: 'مجموعه نمونه سپهر', expirationDate: '۱۴۰۵/۰۸/۰۳', downloadAvailable: false },
  { id: 4, title: 'صورت‌حساب همکاری', documentDate: '۱۴۰۵/۰۴/۱۹', senderDisplayName: 'شرکت نمایشی نارنج', expirationDate: '۱۴۰۵/۱۰/۱۹', downloadAvailable: false }
];

@Component({
  selector: 'app-my-documents',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-3 animate-fade-in-up sm:space-y-4" dir="rtl">
      <header class="flex min-w-0 items-center gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
          <ui-icon name="save" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">اسناد من</h1>
          <p class="mt-1 text-sm text-muted sm:text-base">اسناد دریافتی شما از شرکت‌ها و کارگاه‌های مختلف</p>
        </div>
      </header>

      <section aria-labelledby="my-documents-list-title">
        <div class="mb-2 flex items-center justify-between gap-3">
          <h2 id="my-documents-list-title" class="text-lg font-bold text-foreground dark:text-slate-100">فهرست اسناد</h2>
          <span class="shrink-0 text-xs font-semibold text-muted">{{ documents.length }} سند</span>
        </div>
        @if (downloadNotice(); as notice) {
          <p class="mb-3 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/10 p-3 text-sm font-semibold leading-6 text-warning" role="status" aria-live="polite">
            <ui-icon name="alert-circle" [size]="18" class="mt-0.5 shrink-0"></ui-icon>
            <span>{{ notice }}</span>
          </p>
        }
        <div class="grid grid-cols-1 gap-2 xl:grid-cols-2">
          @for (document of documents; track document.id) {
            <article class="min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:px-4 sm:py-3">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-1.5 text-xs text-muted">
                  <span>تاریخ سند</span>
                  <time class="font-semibold text-foreground dark:text-slate-200" dir="ltr">{{ document.documentDate }}</time>
                </div>
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ui-icon name="file-text" [size]="17"></ui-icon></div>
              </div>
              <p class="mt-1 break-words text-xs font-semibold leading-5 text-primary sm:text-sm">{{ document.senderDisplayName }}</p>
              <h3 class="mt-0.5 break-words text-base font-extrabold leading-6 text-foreground dark:text-slate-100">{{ document.title }}</h3>
              <div class="mt-2.5 flex items-center justify-between gap-3 border-t border-border pt-2.5 dark:border-slate-700">
                <div class="min-w-0 text-xs"><span class="text-muted">انقضا: </span><time class="font-semibold text-foreground dark:text-slate-200" dir="ltr">{{ document.expirationDate }}</time></div>
                <button type="button" (click)="requestDownload(document)" [attr.aria-label]="'دانلود و مشاهده ' + document.title" class="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/25"><ui-icon name="download" [size]="16"></ui-icon>دانلود و مشاهده</button>
              </div>
            </article>
          }
        </div>
      </section>
    </div>
  `
})
export class MyDocumentsComponent {
  readonly documents = PERSONAL_DOCUMENTS;
  readonly downloadNotice = signal('');

  requestDownload(document: PersonalDocument): void {
    if (!document.downloadAvailable) {
      this.downloadNotice.set('فایل این سند هنوز به سرویس دانلود متصل نشده است.');
    }
  }
}

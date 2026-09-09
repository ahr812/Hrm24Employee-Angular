import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [FormsModule, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
      <header class="flex min-w-0 items-center gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
          <ui-icon name="save" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">اسناد من</h1>
          <p class="mt-1 text-sm text-muted sm:text-base">اسناد دریافتی شما از شرکت‌ها و کارگاه‌های مختلف</p>
        </div>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="my-documents-search-title">
        <div class="mb-3 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon name="search" [size]="20"></ui-icon></div>
          <div><h2 id="my-documents-search-title" class="text-lg font-bold text-foreground dark:text-slate-100">جستجو</h2><p class="mt-0.5 text-xs text-muted">جستجو در عنوان سند یا نام فرستنده</p></div>
        </div>
        <label for="my-documents-search" class="sr-only">جستجو در عنوان سند یا نام فرستنده</label>
        <div class="relative">
          <ui-icon name="search" [size]="18" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
          <input id="my-documents-search" type="search" autocomplete="off" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="عنوان سند یا نام شرکت / کارگاه" class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
        </div>
      </section>

      <section aria-labelledby="my-documents-list-title">
        <div class="mb-3 flex items-center justify-between gap-3">
          <h2 id="my-documents-list-title" class="text-lg font-bold text-foreground dark:text-slate-100">فهرست اسناد</h2>
          <span class="shrink-0 text-xs font-semibold text-muted" aria-live="polite">{{ filteredDocuments().length }} سند</span>
        </div>
        @if (downloadNotice(); as notice) {
          <p class="mb-3 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/10 p-3 text-sm font-semibold leading-6 text-warning" role="status" aria-live="polite">
            <ui-icon name="alert-circle" [size]="18" class="mt-0.5 shrink-0"></ui-icon>
            <span>{{ notice }}</span>
          </p>
        }
        @if (filteredDocuments().length > 0) {
          <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
            @for (document of filteredDocuments(); track document.id) {
              <article class="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
                <div class="flex min-w-0 items-start gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon name="file-text" [size]="20"></ui-icon></div>
                  <div class="min-w-0 flex-1"><h3 class="break-words text-base font-extrabold leading-7 text-foreground dark:text-slate-100 sm:text-lg">{{ document.title }}</h3><p class="mt-1 break-words text-sm font-semibold leading-6 text-primary">{{ document.senderDisplayName }}</p></div>
                </div>
                <dl class="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-4 text-sm dark:border-slate-700 sm:grid-cols-2">
                  <div class="flex items-center justify-between gap-3 rounded-lg bg-background/70 px-3 py-2 dark:bg-slate-900/50"><dt class="text-muted">تاریخ سند</dt><dd class="font-semibold text-foreground dark:text-slate-200" dir="ltr">{{ document.documentDate }}</dd></div>
                  <div class="flex items-center justify-between gap-3 rounded-lg bg-background/70 px-3 py-2 dark:bg-slate-900/50"><dt class="text-muted">انقضا</dt><dd class="font-semibold text-foreground dark:text-slate-200" dir="ltr">{{ document.expirationDate }}</dd></div>
                </dl>
                <div class="mt-4 flex justify-end">
                  <button type="button" (click)="requestDownload(document)" [attr.aria-label]="'دانلود ' + document.title" class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/25 sm:w-auto"><ui-icon name="download" [size]="18"></ui-icon>دانلود</button>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="rounded-2xl border border-dashed border-border bg-surface px-4 py-12 text-center dark:border-slate-700 dark:bg-slate-800"><ui-icon name="search" [size]="34" class="mx-auto text-muted opacity-70"></ui-icon><p class="mt-3 text-sm font-bold text-foreground dark:text-slate-200">سندی مطابق جستجو پیدا نشد.</p></div>
        }
      </section>
    </div>
  `
})
export class MyDocumentsComponent {
  readonly searchQuery = signal('');
  readonly downloadNotice = signal('');
  readonly filteredDocuments = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase('fa-IR');
    if (!query) return PERSONAL_DOCUMENTS;
    return PERSONAL_DOCUMENTS.filter(document =>
      document.title.toLocaleLowerCase('fa-IR').includes(query) ||
      document.senderDisplayName.toLocaleLowerCase('fa-IR').includes(query)
    );
  });

  requestDownload(document: PersonalDocument): void {
    if (!document.downloadAvailable) {
      this.downloadNotice.set('فایل این سند هنوز به سرویس دانلود متصل نشده است.');
    }
  }
}

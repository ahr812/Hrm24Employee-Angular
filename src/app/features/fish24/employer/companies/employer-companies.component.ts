import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EscToCloseDirective } from '../../../../shared/directives/esc-to-close.directive';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface EmployerCompanyRecord {
  readonly id: number;
  readonly name: string;
  readonly createdAt: string;
  readonly isActive: boolean;
}

type CompanyStatusFilter = 'all' | 'active' | 'inactive';
type CompanyFormMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-employer-companies',
  standalone: true,
  imports: [FormsModule, EscToCloseDirective, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
            <ui-icon name="briefcase" [size]="30" class="text-primary"></ui-icon>
          </div>
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-primary sm:text-3xl">شرکت‌ها و کارگاه‌ها</h1>
            <p class="mt-1 text-sm text-muted sm:text-base">مدیریت شرکت‌ها و کارگاه‌های ثبت‌شده</p>
          </div>
        </div>

        <button
          type="button"
          (click)="openCreateModal()"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto">
          <ui-icon name="plus" [size]="19"></ui-icon>
          جدید
        </button>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="employer-company-search-title">
        <div class="mb-4 flex items-center gap-3 border-b border-border pb-4 dark:border-slate-700">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ui-icon name="search" [size]="21"></ui-icon>
          </div>
          <div>
            <h2 id="employer-company-search-title" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">جستجو</h2>
            <p class="mt-0.5 text-xs text-muted sm:text-sm">فهرست را بر اساس نام و وضعیت محدود کنید.</p>
          </div>
        </div>

        <form (ngSubmit)="applyFilters()" novalidate>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(11rem,0.35fr)]">
            <div>
              <label for="employer-company-search-name" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">نام شرکت یا کارگاه</label>
              <div class="relative">
                <ui-icon name="search" [size]="18" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                <input
                  id="employer-company-search-name"
                  name="companySearchName"
                  type="text"
                  [(ngModel)]="filterForm.name"
                  autocomplete="off"
                  class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="نام را وارد کنید">
              </div>
            </div>

            <div>
              <label for="employer-company-status-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">وضعیت</label>
              <select
                id="employer-company-status-filter"
                name="companyStatusFilter"
                [(ngModel)]="filterForm.status"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                <option value="all">همه</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
              </select>
            </div>
          </div>

          <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              (click)="showAllRecords()"
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

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="employer-company-list-title">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ui-icon name="briefcase" [size]="21"></ui-icon>
          </div>
          <div>
            <h2 id="employer-company-list-title" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">فهرست شرکت‌ها و کارگاه‌ها</h2>
            <p class="mt-0.5 text-xs text-muted sm:text-sm">اطلاعات ثبت‌شده و وضعیت فعالیت</p>
          </div>
        </div>

        @if (filteredRecords().length > 0) {
          <div class="hidden overflow-hidden rounded-xl border border-border dark:border-slate-700 md:block">
            <table class="w-full table-fixed text-sm">
              <thead class="bg-background/80 dark:bg-slate-900/60">
                <tr>
                  <th class="w-16 px-3 py-3 text-right text-xs font-bold text-muted">شناسه</th>
                  <th class="w-28 px-3 py-3 text-right text-xs font-bold text-muted">تاریخ ایجاد</th>
                  <th class="px-3 py-3 text-right text-xs font-bold text-muted">نام شرکت یا کارگاه</th>
                  <th class="w-24 px-3 py-3 text-right text-xs font-bold text-muted">وضعیت</th>
                  <th class="w-56 px-3 py-3 text-right text-xs font-bold text-muted">عملیات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border dark:divide-slate-700">
                @for (record of filteredRecords(); track record.id) {
                  <tr class="transition-colors hover:bg-primary/5 dark:hover:bg-primary/10">
                    <td class="px-3 py-3 font-bold text-foreground dark:text-slate-200"><span dir="ltr">{{ record.id }}</span></td>
                    <td class="px-3 py-3 text-muted"><span dir="ltr">{{ record.createdAt }}</span></td>
                    <td class="px-3 py-3 font-bold leading-6 text-foreground dark:text-slate-100">{{ record.name }}</td>
                    <td class="px-3 py-3">
                      <span [class]="record.isActive
                        ? 'inline-flex items-center rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success'
                        : 'inline-flex items-center rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300'">
                        {{ record.isActive ? 'فعال' : 'غیرفعال' }}
                      </span>
                    </td>
                    <td class="px-3 py-3">
                      <div class="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          (click)="openEditModal(record)"
                          [attr.aria-label]="'ویرایش ' + record.name"
                          class="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25">
                          <ui-icon name="edit" [size]="15"></ui-icon>
                          ویرایش
                        </button>
                        <button
                          type="button"
                          (click)="requestStatusChange(record)"
                          [attr.aria-label]="statusActionLabel(record) + ' ' + record.name"
                          [class]="record.isActive
                            ? 'inline-flex items-center gap-1.5 rounded-lg border border-danger/30 px-2.5 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger/20'
                            : 'inline-flex items-center gap-1.5 rounded-lg border border-success/30 px-2.5 py-1.5 text-xs font-bold text-success transition-colors hover:bg-success/10 focus:outline-none focus:ring-2 focus:ring-success/20'">
                          <ui-icon [name]="record.isActive ? 'lock' : 'check-circle'" [size]="15"></ui-icon>
                          {{ statusActionLabel(record) }}
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="space-y-3 md:hidden">
            @for (record of filteredRecords(); track record.id) {
              <article class="rounded-xl border border-border bg-background/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div class="flex items-start justify-between gap-3">
                  <h3 class="min-w-0 break-words text-base font-extrabold leading-6 text-foreground dark:text-slate-100">{{ record.name }}</h3>
                  <span [class]="record.isActive
                    ? 'inline-flex shrink-0 items-center rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success'
                    : 'inline-flex shrink-0 items-center rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300'">
                    {{ record.isActive ? 'فعال' : 'غیرفعال' }}
                  </span>
                </div>
                <dl class="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div>
                    <dt class="text-[11px] text-muted">شناسه</dt>
                    <dd class="mt-1 text-sm font-bold text-foreground dark:text-slate-200" dir="ltr">{{ record.id }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] text-muted">تاریخ ایجاد</dt>
                    <dd class="mt-1 text-sm font-bold text-foreground dark:text-slate-200" dir="ltr">{{ record.createdAt }}</dd>
                  </div>
                </dl>
                <div class="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    (click)="openEditModal(record)"
                    [attr.aria-label]="'ویرایش ' + record.name"
                    class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25">
                    <ui-icon name="edit" [size]="15"></ui-icon>
                    ویرایش
                  </button>
                  <button
                    type="button"
                    (click)="requestStatusChange(record)"
                    [attr.aria-label]="statusActionLabel(record) + ' ' + record.name"
                    [class]="record.isActive
                      ? 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-danger/30 px-3 py-2 text-xs font-bold text-danger transition-colors hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger/20'
                      : 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-success/30 px-3 py-2 text-xs font-bold text-success transition-colors hover:bg-success/10 focus:outline-none focus:ring-2 focus:ring-success/20'">
                    <ui-icon [name]="record.isActive ? 'lock' : 'check-circle'" [size]="15"></ui-icon>
                    {{ statusActionLabel(record) }}
                  </button>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center dark:border-slate-600 dark:bg-slate-900/40">
            <ui-icon name="inbox" [size]="34" class="mx-auto text-muted opacity-70"></ui-icon>
            <p class="mt-3 text-sm font-bold text-foreground dark:text-slate-200">{{ emptyStateMessage() }}</p>
            <p class="mt-1 text-xs leading-5 text-muted">برای ثبت مورد جدید از دکمه «جدید» استفاده کنید.</p>
          </div>
        }
      </section>

      @if (formModalMode()) {
        <div
          appEscToClose
          (escPressed)="closeFormModal()"
          (click)="closeFormModal()"
          class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="employer-company-form-title"
            (click)="$event.stopPropagation()"
            class="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in dark:border-slate-700 dark:bg-slate-800">
            <div class="flex items-center justify-between gap-3 border-b border-border p-4 dark:border-slate-700 sm:p-5">
              <h2 id="employer-company-form-title" class="text-lg font-bold text-foreground dark:text-slate-100">
                {{ formModalMode() === 'create' ? 'ثبت شرکت یا کارگاه جدید' : 'ویرایش شرکت یا کارگاه' }}
              </h2>
              <button
                type="button"
                (click)="closeFormModal()"
                aria-label="بستن"
                class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 dark:hover:bg-slate-700">
                <ui-icon name="x" [size]="18"></ui-icon>
              </button>
            </div>

            <form (ngSubmit)="saveCompanyRecord()" novalidate>
              <div class="p-4 sm:p-5">
                <label for="employer-company-name" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">نام شرکت یا کارگاه</label>
                <input
                  id="employer-company-name"
                  name="companyName"
                  type="text"
                  [(ngModel)]="companyForm.name"
                  required
                  autofocus
                  autocomplete="off"
                  [attr.aria-invalid]="showCompanyNameError()"
                  [attr.aria-describedby]="showCompanyNameError() ? 'employer-company-name-error' : null"
                  class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="نام را وارد کنید">
                @if (showCompanyNameError()) {
                  <p id="employer-company-name-error" role="alert" class="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-danger">
                    <ui-icon name="alert-circle" [size]="14" class="mt-0.5 shrink-0"></ui-icon>
                    نام شرکت یا کارگاه را وارد کنید.
                  </p>
                }
              </div>

              <div class="flex flex-col-reverse gap-2 border-t border-border p-4 dark:border-slate-700 sm:flex-row sm:justify-end sm:p-5">
                <button
                  type="button"
                  (click)="closeFormModal()"
                  class="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">
                  انصراف
                </button>
                <button
                  type="submit"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/15 transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto">
                  <ui-icon [name]="formModalMode() === 'create' ? 'plus' : 'save'" [size]="17"></ui-icon>
                  {{ formModalMode() === 'create' ? 'ثبت' : 'ذخیره تغییرات' }}
                </button>
              </div>
            </form>
          </section>
        </div>
      }

      @if (pendingStatusRecord(); as record) {
        <div
          appEscToClose
          (escPressed)="closeStatusConfirmation()"
          (click)="closeStatusConfirmation()"
          class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          role="presentation">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="employer-company-status-title"
            aria-describedby="employer-company-status-description"
            (click)="$event.stopPropagation()"
            class="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in dark:border-slate-700 dark:bg-slate-800">
            <div class="p-5 text-center">
              <div [class]="record.isActive
                ? 'mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger'
                : 'mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success'">
                <ui-icon [name]="record.isActive ? 'lock' : 'check-circle'" [size]="25"></ui-icon>
              </div>
              <h2 id="employer-company-status-title" class="mt-3 text-lg font-bold text-foreground dark:text-slate-100">تغییر وضعیت</h2>
              <p id="employer-company-status-description" class="mt-2 text-sm leading-6 text-muted">
                {{ record.isActive ? 'آیا از غیرفعال کردن این مورد اطمینان دارید؟' : 'آیا از فعال کردن این مورد اطمینان دارید؟' }}
              </p>
            </div>
            <div class="flex flex-col-reverse gap-2 border-t border-border p-4 dark:border-slate-700 sm:flex-row sm:justify-end">
              <button
                type="button"
                (click)="closeStatusConfirmation()"
                class="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">
                انصراف
              </button>
              <button
                type="button"
                (click)="confirmStatusChange()"
                [class]="record.isActive
                  ? 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-danger px-5 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-danger/25 sm:w-auto'
                  : 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-success/25 sm:w-auto'">
                <ui-icon [name]="record.isActive ? 'lock' : 'check-circle'" [size]="17"></ui-icon>
                {{ statusActionLabel(record) }}
              </button>
            </div>
          </section>
        </div>
      }
    </div>
  `
})
export class EmployerCompaniesComponent {
  private readonly toastService = inject(ToastService);
  private readonly localCreationDate = '۱۴۰۵/۰۶/۱۱';

  readonly records = signal<readonly EmployerCompanyRecord[]>([
    { id: 101, name: 'مجموعه نمونه سپهر', createdAt: '۱۴۰۵/۰۵/۱۸', isActive: true },
    { id: 102, name: 'مجموعه آزمایشی باران', createdAt: '۱۴۰۵/۰۴/۰۹', isActive: false },
    { id: 103, name: 'مجموعه نمایشی نارنج', createdAt: '۱۴۰۵/۰۳/۲۱', isActive: true },
    { id: 104, name: 'مجموعه فرضی آفتاب', createdAt: '۱۴۰۵/۰۲/۱۲', isActive: true }
  ]);

  filterForm: { name: string; status: CompanyStatusFilter } = {
    name: '',
    status: 'all'
  };

  companyForm = { name: '' };

  readonly appliedNameFilter = signal('');
  readonly appliedStatusFilter = signal<CompanyStatusFilter>('all');
  readonly formModalMode = signal<CompanyFormMode>(null);
  readonly editingRecordId = signal<number | null>(null);
  readonly formSubmissionAttempted = signal(false);
  readonly pendingStatusRecord = signal<EmployerCompanyRecord | null>(null);

  readonly filteredRecords = computed(() => {
    const normalizedName = this.appliedNameFilter().trim().toLocaleLowerCase('fa-IR');
    const status = this.appliedStatusFilter();

    return this.records().filter((record) => {
      const matchesName = normalizedName.length === 0
        || record.name.toLocaleLowerCase('fa-IR').includes(normalizedName);
      const matchesStatus = status === 'all'
        || (status === 'active' && record.isActive)
        || (status === 'inactive' && !record.isActive);

      return matchesName && matchesStatus;
    });
  });

  readonly emptyStateMessage = computed(() => this.records().length === 0
    ? 'هنوز شرکت یا کارگاهی ثبت نشده است.'
    : 'موردی مطابق فیلترهای انتخاب‌شده پیدا نشد.');

  applyFilters(): void {
    this.appliedNameFilter.set(this.filterForm.name.trim());
    this.appliedStatusFilter.set(this.filterForm.status);
  }

  showAllRecords(): void {
    this.filterForm = { name: '', status: 'all' };
    this.appliedNameFilter.set('');
    this.appliedStatusFilter.set('all');
  }

  openCreateModal(): void {
    this.companyForm = { name: '' };
    this.editingRecordId.set(null);
    this.formSubmissionAttempted.set(false);
    this.formModalMode.set('create');
  }

  openEditModal(record: EmployerCompanyRecord): void {
    this.companyForm = { name: record.name };
    this.editingRecordId.set(record.id);
    this.formSubmissionAttempted.set(false);
    this.formModalMode.set('edit');
  }

  closeFormModal(): void {
    this.formModalMode.set(null);
    this.editingRecordId.set(null);
    this.formSubmissionAttempted.set(false);
    this.companyForm = { name: '' };
  }

  showCompanyNameError(): boolean {
    return this.formSubmissionAttempted() && this.companyForm.name.trim().length === 0;
  }

  saveCompanyRecord(): void {
    this.formSubmissionAttempted.set(true);

    if (this.showCompanyNameError()) {
      return;
    }

    const name = this.companyForm.name.trim();
    const mode = this.formModalMode();

    if (mode === 'edit') {
      const recordId = this.editingRecordId();
      this.records.update((records) => records.map((record) => record.id === recordId
        ? { ...record, name }
        : record));
      this.closeFormModal();
      this.toastService.show('نام شرکت یا کارگاه به‌صورت محلی ویرایش شد.', 'success');
      return;
    }

    if (mode === 'create') {
      const nextId = this.records().reduce((highestId, record) => Math.max(highestId, record.id), 100) + 1;
      const newRecord: EmployerCompanyRecord = {
        id: nextId,
        name,
        createdAt: this.localCreationDate,
        isActive: true
      };

      this.records.update((records) => [...records, newRecord]);
      this.closeFormModal();
      this.toastService.show('شرکت یا کارگاه جدید به‌صورت محلی ثبت شد.', 'success');
    }
  }

  statusActionLabel(record: EmployerCompanyRecord): string {
    return record.isActive ? 'غیرفعال کردن' : 'فعال کردن';
  }

  requestStatusChange(record: EmployerCompanyRecord): void {
    this.pendingStatusRecord.set(record);
  }

  closeStatusConfirmation(): void {
    this.pendingStatusRecord.set(null);
  }

  confirmStatusChange(): void {
    const targetRecord = this.pendingStatusRecord();

    if (!targetRecord) {
      return;
    }

    const nextIsActive = !targetRecord.isActive;
    this.records.update((records) => records.map((record) => record.id === targetRecord.id
      ? { ...record, isActive: nextIsActive }
      : record));
    this.closeStatusConfirmation();
    this.toastService.show(`وضعیت مورد به ${nextIsActive ? 'فعال' : 'غیرفعال'} تغییر کرد.`, 'success');
  }
}

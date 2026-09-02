import { NgClass } from '@angular/common';
import { Component, isDevMode, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

type EmployerProfilePreviewState = 'approved' | 'unapproved';

interface EmployerProfileFormModel {
  mobile: string;
  fullName: string;
  nationalCode: string;
  email: string;
  landline: string;
  province: string;
  county: string;
  city: string;
  userType: string;
  gender: string;
  companyName: string;
  registrationNumber: string;
  nationalId: string;
  economicCode: string;
  registeredAddress: string;
  financialResponsibleName: string;
  financialResponsiblePhone: string;
  refundIban: string;
}

type EmployerProfileFieldKey = keyof EmployerProfileFormModel;

interface EmployerProfileField {
  readonly id: string;
  readonly key: EmployerProfileFieldKey;
  readonly label: string;
  readonly control?: 'input' | 'select' | 'textarea';
  readonly inputMode?: 'text' | 'email' | 'tel' | 'numeric';
  readonly direction?: 'ltr';
  readonly fullWidth?: boolean;
  readonly options?: readonly string[];
}

interface EmployerProfileSection {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly fields: readonly EmployerProfileField[];
}

const INITIAL_EMPLOYER_PROFILE: EmployerProfileFormModel = {
  mobile: '09120000000',
  fullName: 'کاربر نمونه',
  nationalCode: '1234567890',
  email: 'employer@example.test',
  landline: '02112345678',
  province: 'تهران',
  county: 'تهران',
  city: 'تهران',
  userType: 'کارفرما',
  gender: 'مرد',
  companyName: 'شرکت نمونه',
  registrationNumber: '123456',
  nationalId: '14001234567',
  economicCode: '411111111111',
  registeredAddress: 'تهران، خیابان نمونه، پلاک ۱۲',
  financialResponsibleName: 'مسئول مالی نمونه',
  financialResponsiblePhone: '02187654321',
  refundIban: 'IR00 0000 0000 0000 0000 0000 00'
};

@Component({
  selector: 'app-employer-profile',
  standalone: true,
  imports: [NgClass, IconComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-5 sm:space-y-6 animate-fade-in-up" dir="rtl">
      <header class="flex items-center gap-4">
        <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <ui-icon name="user" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl sm:text-3xl font-bold text-primary">پروفایل کارفرما</h1>
          <p class="mt-1 text-sm sm:text-base text-muted">مشاهده اطلاعات حساب کارفرما</p>
        </div>
      </header>

      @if (isDevelopmentPreviewAvailable) {
        <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 sm:px-4" aria-label="پیش‌نمایش توسعه وضعیت پروفایل">
          <div class="flex items-center gap-2 text-xs sm:text-sm text-muted">
            <ui-icon name="sliders" [size]="18" class="text-primary"></ui-icon>
            <span><strong class="text-foreground dark:text-slate-100">پیش‌نمایش وضعیت پروفایل (Dev)</strong> — فقط برای تست رابط کاربری</span>
          </div>
          <select
            [value]="profilePreviewState()"
            (change)="onProfilePreviewStateChange($event)"
            class="w-full sm:w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
            <option value="approved">تأیید شده</option>
            <option value="unapproved">تأیید نشده</option>
          </select>
        </section>
      }

      <section
        class="rounded-2xl border p-4 sm:p-5"
        [ngClass]="profilePreviewState() === 'approved'
          ? 'border-success/30 bg-success/5 dark:bg-success/10'
          : 'border-warning/30 bg-warning/5 dark:bg-warning/10'"
        aria-labelledby="employer-profile-status">
        <div class="flex items-start gap-3 sm:gap-4">
          <div
            class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
            [ngClass]="profilePreviewState() === 'approved' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'">
            <ui-icon [name]="profilePreviewState() === 'approved' ? 'check-circle' : 'clock'" [size]="25"></ui-icon>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 id="employer-profile-status" class="text-base sm:text-lg font-bold text-foreground dark:text-slate-100">وضعیت پروفایل</h2>
              <span
                class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
                [ngClass]="profilePreviewState() === 'approved' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'">
                {{ profilePreviewState() === 'approved' ? 'تأیید شده' : 'تأیید نشده' }}
              </span>
            </div>
            @if (profilePreviewState() === 'approved') {
              <p class="mt-2 text-sm leading-6 text-foreground dark:text-slate-200">
                پروفایل شما تأیید شده است و اطلاعات آن قابل ویرایش مستقیم نیست.
              </p>
              <p class="mt-1 flex items-start gap-1.5 text-xs sm:text-sm leading-6 text-muted">
                <ui-icon name="lock" [size]="16" class="mt-1 shrink-0"></ui-icon>
                <span>برای تغییر اطلاعات، با پشتیبانی سامانه تماس بگیرید.</span>
              </p>
            } @else {
              <p class="mt-2 text-sm leading-6 text-foreground dark:text-slate-200">
                پروفایل شما هنوز توسط پشتیبانی تأیید نشده است.
              </p>
              <p class="mt-1 flex items-start gap-1.5 text-xs sm:text-sm leading-6 text-muted">
                <ui-icon name="info" [size]="16" class="mt-1 shrink-0"></ui-icon>
                <span>می‌توانید اطلاعات را تکمیل یا ویرایش کنید؛ پشتیبانی پیش از تأیید آن را بررسی خواهد کرد.</span>
              </p>
            }
          </div>
        </div>
      </section>

      <form class="space-y-4 sm:space-y-5" autocomplete="off" (submit)="saveProfile($event)">
        @for (row of profileSectionRows; track $index) {
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            @for (section of row; track section.id) {
              <section class="h-full flex flex-col rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800" [attr.aria-labelledby]="section.id + '-title'">
                <div class="mb-3 sm:mb-4 flex items-center gap-3 border-b border-border pb-3 dark:border-slate-700">
                  <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ui-icon [name]="section.icon" [size]="22"></ui-icon>
                  </div>
                  <h2 [id]="section.id + '-title'" class="text-lg sm:text-xl font-bold text-foreground dark:text-slate-100">{{ section.title }}</h2>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-4 sm:gap-y-3">
                  @for (field of section.fields; track field.id) {
                    <div class="min-w-0" [ngClass]="{ 'sm:col-span-2': field.fullWidth }">
                      <label [for]="field.id" class="mb-1.5 block text-xs sm:text-sm font-bold leading-5 text-muted">{{ field.label }}</label>
                      @if (field.control === 'textarea') {
                        <textarea
                          [id]="field.id"
                          [readonly]="profilePreviewState() === 'approved'"
                          [attr.aria-readonly]="profilePreviewState() === 'approved'"
                          [value]="profileFieldValue(field.key)"
                          (input)="onProfileFieldInput(field.key, $event)"
                          rows="3"
                          autocomplete="off"
                          class="min-h-20 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-right text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 read-only:cursor-text read-only:resize-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                        </textarea>
                      } @else if (field.control === 'select') {
                        <select
                          [id]="field.id"
                          [disabled]="profilePreviewState() === 'approved'"
                          [attr.aria-readonly]="profilePreviewState() === 'approved'"
                          [value]="profileFieldValue(field.key)"
                          (change)="onProfileFieldInput(field.key, $event)"
                          class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-right text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-default disabled:opacity-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:disabled:text-slate-100">
                          @for (option of field.options ?? []; track option) {
                            <option [value]="option">{{ option }}</option>
                          }
                        </select>
                      } @else {
                        <input
                          [id]="field.id"
                          type="text"
                          [attr.inputmode]="field.inputMode ?? null"
                          [attr.dir]="field.direction ?? null"
                          [readonly]="profilePreviewState() === 'approved'"
                          [attr.aria-readonly]="profilePreviewState() === 'approved'"
                          [value]="profileFieldValue(field.key)"
                          (input)="onProfileFieldInput(field.key, $event)"
                          autocomplete="off"
                          class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-right text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 read-only:cursor-text dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                      }
                    </div>
                  }
                </div>
              </section>
            }
          </div>
        }

        @if (profilePreviewState() === 'unapproved') {
          <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-2xl border border-border bg-surface p-3 sm:px-4 dark:border-slate-700 dark:bg-slate-800">
            <div class="min-h-5">
              @if (saveFeedbackVisible()) {
                <p role="status" class="flex items-center gap-2 text-sm font-bold text-success">
                  <ui-icon name="check-circle" [size]="18"></ui-icon>
                  اطلاعات در پیش‌نمایش محلی ذخیره شد.
                </p>
              }
            </div>
            <button
              type="submit"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">
              <ui-icon name="save" [size]="19"></ui-icon>
              ذخیره اطلاعات
            </button>
          </div>
        }
      </form>
    </div>
  `
})
export class EmployerProfileComponent {
  readonly isDevelopmentPreviewAvailable = isDevMode();
  readonly profilePreviewState = signal<EmployerProfilePreviewState>('approved');
  readonly savedProfile = signal<EmployerProfileFormModel>({ ...INITIAL_EMPLOYER_PROFILE });
  readonly saveFeedbackVisible = signal(false);
  draftProfile: EmployerProfileFormModel = { ...INITIAL_EMPLOYER_PROFILE };

  // Presentation-only field metadata and select options; replace them after real backend contracts are defined.
  readonly profileSectionRows: readonly (readonly EmployerProfileSection[])[] = [
    [
      {
        id: 'user-information',
        title: 'مشخصات کاربر',
        icon: 'user',
        fields: [
          { id: 'employer-field-01', key: 'mobile', label: 'موبایل', inputMode: 'tel', direction: 'ltr' },
          { id: 'full-name', key: 'fullName', label: 'نام و نام خانوادگی' },
          { id: 'national-code', key: 'nationalCode', label: 'کد ملی', inputMode: 'numeric', direction: 'ltr' },
          { id: 'employer-field-04', key: 'email', label: 'ایمیل', inputMode: 'email', direction: 'ltr' }
        ]
      },
      {
        id: 'additional-information',
        title: 'اطلاعات تکمیلی',
        icon: 'map-pin',
        fields: [
          { id: 'landline', key: 'landline', label: 'تلفن ثابت', inputMode: 'tel', direction: 'ltr' },
          { id: 'province', key: 'province', label: 'استان', control: 'select', options: ['تهران', 'البرز'] },
          { id: 'county', key: 'county', label: 'شهرستان', control: 'select', options: ['تهران', 'کرج'] },
          { id: 'city', key: 'city', label: 'شهر', control: 'select', options: ['تهران', 'کرج'] },
          { id: 'user-type', key: 'userType', label: 'نوع کاربر', control: 'select', options: ['کارفرما', 'کارمند'] },
          { id: 'gender', key: 'gender', label: 'جنسیت', control: 'select', options: ['مرد', 'زن'] }
        ]
      }
    ],
    [
      {
        id: 'legal-company-information',
        title: 'مشخصات شرکت حقوقی',
        icon: 'briefcase',
        fields: [
          { id: 'company-name', key: 'companyName', label: 'نام شرکت یا موسسه' },
          { id: 'registration-number', key: 'registrationNumber', label: 'شماره ثبت', inputMode: 'numeric', direction: 'ltr' },
          { id: 'national-id', key: 'nationalId', label: 'شناسه ملی', inputMode: 'numeric', direction: 'ltr' },
          { id: 'economic-code', key: 'economicCode', label: 'کد اقتصادی', inputMode: 'numeric', direction: 'ltr' },
          { id: 'registered-address', key: 'registeredAddress', label: 'آدرس ثبتی شرکت', control: 'textarea', fullWidth: true }
        ]
      },
      {
        id: 'financial-responsible-information',
        title: 'مشخصات مسئول مالی',
        icon: 'banknote',
        fields: [
          { id: 'financial-responsible-name', key: 'financialResponsibleName', label: 'نام و نام خانوادگی مسئول مالی' },
          { id: 'employer-field-17', key: 'financialResponsiblePhone', label: 'تلفن ثابت مسئول مالی', inputMode: 'tel', direction: 'ltr' },
          { id: 'refund-iban', key: 'refundIban', label: 'شماره شبا جهت بازگشت وجه', direction: 'ltr', fullWidth: true }
        ]
      }
    ]
  ];

  onProfilePreviewStateChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'approved' || value === 'unapproved') {
      if (value === 'unapproved') {
        this.draftProfile = { ...this.savedProfile() };
      }
      this.saveFeedbackVisible.set(false);
      this.profilePreviewState.set(value);
    }
  }

  updateDraftField(key: EmployerProfileFieldKey, value: string): void {
    if (this.profilePreviewState() === 'approved') {
      return;
    }

    this.draftProfile[key] = value;
    this.saveFeedbackVisible.set(false);
  }

  profileFieldValue(key: EmployerProfileFieldKey): string {
    return this.profilePreviewState() === 'approved'
      ? this.savedProfile()[key]
      : this.draftProfile[key];
  }

  onProfileFieldInput(key: EmployerProfileFieldKey, event: Event): void {
    const control = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    this.updateDraftField(key, control.value);
  }

  saveProfile(event: SubmitEvent): void {
    event.preventDefault();

    if (this.profilePreviewState() !== 'unapproved') {
      return;
    }

    this.savedProfile.set({ ...this.draftProfile });
    this.saveFeedbackVisible.set(true);
  }
}

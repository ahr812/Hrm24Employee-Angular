import { NgClass } from '@angular/common';
import { Component, isDevMode, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

type EmployerProfilePreviewState = 'approved' | 'unapproved';

interface EmployerProfileField {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly direction?: 'ltr';
  readonly fullWidth?: boolean;
}

interface EmployerProfileSection {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly fields: readonly EmployerProfileField[];
}

@Component({
  selector: 'app-employer-profile',
  standalone: true,
  imports: [NgClass, IconComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-6 sm:space-y-8 animate-fade-in-up" dir="rtl">
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
                <span>اطلاعات پروفایل در حال بررسی و تکمیل است.</span>
              </p>
            }
          </div>
        </div>
      </section>

      <div class="space-y-5 sm:space-y-6">
        @for (row of profileSectionRows; track $index) {
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            @for (section of row; track section.id) {
              <section class="h-full flex flex-col rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800" [attr.aria-labelledby]="section.id + '-title'">
                <div class="mb-4 sm:mb-5 flex items-center gap-3 border-b border-border pb-4 dark:border-slate-700">
                  <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ui-icon [name]="section.icon" [size]="22"></ui-icon>
                  </div>
                  <h2 [id]="section.id + '-title'" class="text-lg sm:text-xl font-bold text-foreground dark:text-slate-100">{{ section.title }}</h2>
                </div>

                <dl class="flex-1 grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-3">
                  @for (field of section.fields; track field.id) {
                    <div
                      class="min-w-0 rounded-xl border border-border bg-background/70 p-3.5 sm:p-4 dark:border-slate-700 dark:bg-slate-900/50"
                      [ngClass]="{ 'sm:col-span-2': field.fullWidth }">
                      <dt class="text-xs sm:text-sm leading-5 text-muted">{{ field.label }}</dt>
                      <dd
                        class="mt-2 min-w-0 break-words text-sm sm:text-base font-bold leading-7 text-right text-foreground dark:text-slate-100"
                        [class.break-all]="field.direction === 'ltr'"
                        [attr.dir]="field.direction ?? null">
                        {{ field.value }}
                      </dd>
                    </div>
                  }
                </dl>
              </section>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class EmployerProfileComponent {
  readonly isDevelopmentPreviewAvailable = isDevMode();
  readonly profilePreviewState = signal<EmployerProfilePreviewState>('approved');

  // Presentation-only profile values; replace after real backend contracts are defined.
  readonly profileSectionRows: readonly (readonly EmployerProfileSection[])[] = [
    [
      {
        id: 'user-information',
        title: 'مشخصات کاربر',
        icon: 'user',
        fields: [
          { id: 'mobile', label: 'موبایل', value: '09120000000', direction: 'ltr' },
          { id: 'full-name', label: 'نام و نام خانوادگی', value: 'کاربر نمونه' },
          { id: 'national-code', label: 'کد ملی', value: '1234567890', direction: 'ltr' },
          { id: 'email', label: 'ایمیل', value: 'employer@example.test', direction: 'ltr' }
        ]
      },
      {
        id: 'additional-information',
        title: 'اطلاعات تکمیلی',
        icon: 'map-pin',
        fields: [
          { id: 'landline', label: 'تلفن ثابت', value: '02112345678', direction: 'ltr' },
          { id: 'province', label: 'استان', value: 'تهران' },
          { id: 'county', label: 'شهرستان', value: 'تهران' },
          { id: 'city', label: 'شهر', value: 'تهران' },
          { id: 'user-type', label: 'نوع کاربر', value: 'کارفرما' },
          { id: 'gender', label: 'جنسیت', value: 'مرد' }
        ]
      }
    ],
    [
      {
        id: 'legal-company-information',
        title: 'مشخصات شرکت حقوقی',
        icon: 'briefcase',
        fields: [
          { id: 'company-name', label: 'نام شرکت یا موسسه', value: 'شرکت نمونه' },
          { id: 'registration-number', label: 'شماره ثبت', value: '123456', direction: 'ltr' },
          { id: 'national-id', label: 'شناسه ملی', value: '14001234567', direction: 'ltr' },
          { id: 'economic-code', label: 'کد اقتصادی', value: '411111111111', direction: 'ltr' },
          { id: 'registered-address', label: 'آدرس ثبتی شرکت', value: 'تهران، خیابان نمونه، پلاک ۱۲', fullWidth: true }
        ]
      },
      {
        id: 'financial-responsible-information',
        title: 'مشخصات مسئول مالی',
        icon: 'banknote',
        fields: [
          { id: 'financial-responsible-name', label: 'نام و نام خانوادگی مسئول مالی', value: 'مسئول مالی نمونه' },
          { id: 'financial-responsible-phone', label: 'تلفن ثابت مسئول مالی', value: '02187654321', direction: 'ltr' },
          { id: 'refund-iban', label: 'شماره شبا جهت بازگشت وجه', value: 'IR00 0000 0000 0000 0000 0000 00', direction: 'ltr', fullWidth: true }
        ]
      }
    ]
  ];

  onProfilePreviewStateChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'approved' || value === 'unapproved') {
      this.profilePreviewState.set(value);
    }
  }
}

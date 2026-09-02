import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

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
          <p class="mt-1 text-sm sm:text-base text-muted">اطلاعات تأییدشده حساب کارفرما</p>
        </div>
      </header>

      <section class="rounded-2xl border border-success/30 bg-success/5 p-4 sm:p-5 dark:bg-success/10" aria-labelledby="employer-profile-status">
        <div class="flex items-start gap-3 sm:gap-4">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
            <ui-icon name="check-circle" [size]="25"></ui-icon>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 id="employer-profile-status" class="text-base sm:text-lg font-bold text-foreground dark:text-slate-100">وضعیت پروفایل</h2>
              <span class="inline-flex items-center rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">تأیید شده</span>
            </div>
            <p class="mt-2 text-sm leading-6 text-foreground dark:text-slate-200">
              پروفایل شما تأیید شده است و اطلاعات آن قابل ویرایش مستقیم نیست.
            </p>
            <p class="mt-1 flex items-start gap-1.5 text-xs sm:text-sm leading-6 text-muted">
              <ui-icon name="lock" [size]="16" class="mt-1 shrink-0"></ui-icon>
              <span>برای تغییر اطلاعات، با پشتیبانی سامانه تماس بگیرید.</span>
            </p>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 items-start">
        @for (section of profileSections; track section.id) {
          <section class="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800" [attr.aria-labelledby]="section.id + '-title'">
            <div class="mb-4 sm:mb-5 flex items-center gap-3 border-b border-border pb-4 dark:border-slate-700">
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ui-icon [name]="section.icon" [size]="22"></ui-icon>
              </div>
              <h2 [id]="section.id + '-title'" class="text-lg sm:text-xl font-bold text-foreground dark:text-slate-100">{{ section.title }}</h2>
            </div>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
    </div>
  `
})
export class EmployerProfileComponent {
  // Presentation-only approved-profile values; replace after real backend contracts are defined.
  readonly profileSections: readonly EmployerProfileSection[] = [
    {
      id: 'user-information',
      title: 'مشخصات کاربر',
      icon: 'user',
      fields: [
        { id: 'mobile', label: 'موبایل', value: '۰۹۱۲•••۴۵۶۷', direction: 'ltr' },
        { id: 'full-name', label: 'نام و نام خانوادگی', value: 'کاربر نمونه' },
        { id: 'national-code', label: 'کد ملی', value: '۰۰۱•••••۲۳', direction: 'ltr' },
        { id: 'email', label: 'ایمیل', value: 'employer@example.test', direction: 'ltr' }
      ]
    },
    {
      id: 'additional-information',
      title: 'اطلاعات تکمیلی',
      icon: 'map-pin',
      fields: [
        { id: 'landline', label: 'تلفن ثابت', value: '۰۲۱-••••••••', direction: 'ltr' },
        { id: 'province', label: 'استان', value: 'تهران' },
        { id: 'county', label: 'شهرستان', value: 'تهران' },
        { id: 'city', label: 'شهر', value: 'تهران' },
        { id: 'user-type', label: 'نوع کاربر', value: 'کارفرما' },
        { id: 'gender', label: 'جنسیت', value: 'مرد' }
      ]
    },
    {
      id: 'legal-company-information',
      title: 'مشخصات شرکت حقوقی',
      icon: 'briefcase',
      fields: [
        { id: 'company-name', label: 'نام شرکت یا موسسه', value: 'شرکت نمونه' },
        { id: 'registration-number', label: 'شماره ثبت', value: '۱۲•••۶', direction: 'ltr' },
        { id: 'national-id', label: 'شناسه ملی', value: '۱۴۰۰•••••••', direction: 'ltr' },
        { id: 'economic-code', label: 'کد اقتصادی', value: '۴۱۱••••••••', direction: 'ltr' },
        { id: 'registered-address', label: 'آدرس ثبتی شرکت', value: 'تهران، خیابان نمونه، پلاک ۱۲', fullWidth: true }
      ]
    },
    {
      id: 'financial-responsible-information',
      title: 'مشخصات مسئول مالی',
      icon: 'banknote',
      fields: [
        { id: 'financial-responsible-name', label: 'نام و نام خانوادگی مسئول مالی', value: 'مسئول مالی نمونه' },
        { id: 'financial-responsible-phone', label: 'تلفن ثابت مسئول مالی', value: '۰۲۱-••••••••', direction: 'ltr' },
        { id: 'refund-iban', label: 'شماره شبا جهت بازگشت وجه', value: 'IR•• •••• •••• •••• •••• •••• ••', direction: 'ltr', fullWidth: true }
      ]
    }
  ];
}

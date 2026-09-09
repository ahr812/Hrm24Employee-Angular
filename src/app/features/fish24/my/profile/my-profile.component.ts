import { Component, inject, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface EmployeeProfileIdentity {
  mobile: string;
  name: string;
  nationalId: string;
}

const EMPLOYEE_PROFILE_IDENTITY: EmployeeProfileIdentity = {
  mobile: '09191239004',
  name: 'امیر رنجبر',
  nationalId: '0014133729'
};

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-3 animate-fade-in-up sm:space-y-4" dir="rtl">
      <header class="flex min-w-0 items-center gap-3">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
          <ui-icon name="user" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">تنظیمات پروفایل شما</h1>
          <p class="mt-0.5 text-sm text-muted">مشاهده اطلاعات هویتی و تنظیم رمز ورود کارمندی</p>
        </div>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="employee-identity-title">
        <h2 id="employee-identity-title" class="sr-only">اطلاعات هویتی کارمند</h2>

        <div class="flex flex-col items-center">
          <label class="group relative block h-24 w-24 cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-primary/30 sm:h-28 sm:w-28">
            <span class="sr-only">انتخاب عکس پروفایل</span>
            <img
              [src]="profileImage() || 'images/avatar3.jpg'"
              [alt]="'تصویر پروفایل ' + (name().trim() || 'کارمند')"
              class="h-full w-full rounded-full border-4 border-primary/15 object-cover shadow-sm">
            <span class="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <ui-icon name="camera" [size]="25"></ui-icon>
            </span>
            <input
              type="file"
              accept="image/*"
              class="sr-only"
              (change)="onProfileImageSelected($event)">
          </label>
          <p class="mt-2 text-center text-xs font-semibold text-muted">جهت انتخاب عکس بر روی تصویر کلیک کنید</p>

          <div class="mt-3 flex items-center justify-center gap-1.5 text-sm font-bold text-primary sm:text-base">
            <ui-icon name="phone" [size]="17"></ui-icon>
            <span>شماره موبایل:</span>
            <span dir="ltr">{{ identity.mobile }}</span>
          </div>

          <div class="mt-3 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label for="employee-profile-name" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">نام و نام خانوادگی</label>
              <input
                id="employee-profile-name"
                form="employee-profile-form"
                type="text"
                autocomplete="name"
                required
                [value]="name()"
                [attr.aria-invalid]="submissionAttempted() && !isNameValid()"
                [attr.aria-describedby]="submissionAttempted() && !isNameValid() ? 'employee-profile-name-error' : null"
                (input)="onNameInput($event)"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              @if (submissionAttempted() && !isNameValid()) {
                <p id="employee-profile-name-error" class="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-danger" role="alert">
                  <ui-icon name="alert-circle" [size]="14"></ui-icon>
                  نام و نام خانوادگی را وارد کنید.
                </p>
              }
            </div>
            <div>
              <label for="employee-profile-national-id" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">کد ملی</label>
              <input
                id="employee-profile-national-id"
                form="employee-profile-form"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="10"
                autocomplete="off"
                required
                dir="ltr"
                [value]="nationalId()"
                [attr.aria-invalid]="submissionAttempted() && !isNationalIdValid()"
                [attr.aria-describedby]="submissionAttempted() && !isNationalIdValid() ? 'employee-profile-national-id-error' : null"
                (input)="onNationalIdInput($event)"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-left text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              @if (submissionAttempted() && !isNationalIdValid()) {
                <p id="employee-profile-national-id-error" class="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-danger" role="alert">
                  <ui-icon name="alert-circle" [size]="14"></ui-icon>
                  کد ملی باید دقیقاً شامل ۱۰ رقم باشد.
                </p>
              }
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="employee-pin-title">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ui-icon name="key" [size]="21"></ui-icon>
          </div>
          <div class="min-w-0">
            <h2 id="employee-pin-title" class="text-base font-bold text-foreground dark:text-slate-100 sm:text-lg">رمز عبور ۵ رقمی</h2>
            <p class="mt-0.5 text-xs leading-5 text-muted sm:text-sm">جهت تغییر رمز عبور، لطفا رمز جدید ۵ رقمی را وارد نمایید.</p>
          </div>
        </div>

        <form id="employee-profile-form" class="mt-4" (submit)="submitProfile($event)" novalidate>
          <fieldset class="min-w-0">
            <legend class="sr-only">رمز جدید ۵ رقمی</legend>
            <div class="mx-auto flex w-full max-w-sm justify-center gap-2" dir="ltr">
              @for (digit of pinDigits(); track $index) {
                <input
                  [id]="'employee-pin-' + $index"
                  type="password"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="1"
                  autocomplete="new-password"
                  [value]="digit"
                  [attr.aria-label]="'رقم ' + ($index + 1) + ' از رمز ۵ رقمی'"
                  [attr.aria-invalid]="submissionAttempted() && !isPinValid()"
                  (input)="onPinInput($index, $event)"
                  (keydown)="onPinKeydown($index, $event)"
                  (paste)="onPinPaste($index, $event)"
                  class="h-12 min-w-0 w-0 flex-1 rounded-xl border border-border bg-background text-center text-xl font-extrabold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 sm:h-14 sm:max-w-16">
              }
            </div>
          </fieldset>

          @if (submissionAttempted() && !isPinValid()) {
            <p class="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-danger" role="alert">
              <ui-icon name="alert-circle" [size]="15"></ui-icon>
              رمز عبور باید دقیقاً شامل ۵ رقم باشد.
            </p>
          }

          <div class="mt-4 border-t border-border pt-4 dark:border-slate-700">
            <button type="submit" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:mr-auto sm:w-auto">
              <ui-icon name="save" [size]="19"></ui-icon>
              ذخیره پروفایل
            </button>
          </div>
        </form>
      </section>
    </div>
  `
})
export class MyProfileComponent {
  private readonly toastService = inject(ToastService);

  readonly identity = EMPLOYEE_PROFILE_IDENTITY;
  readonly profileImage = signal<string | null>(null);
  readonly name = signal(EMPLOYEE_PROFILE_IDENTITY.name);
  readonly nationalId = signal(EMPLOYEE_PROFILE_IDENTITY.nationalId);
  readonly pinDigits = signal<string[]>(['', '', '', '', '']);
  readonly submissionAttempted = signal(false);

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.profileImage.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onNameInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  onNationalIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = this.normalizeDigits(input.value).slice(0, 10);
    this.nationalId.set(value);
    input.value = value;
  }

  onPinInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digit = this.normalizeDigits(input.value).slice(-1);
    this.setPinDigit(index, digit);
    input.value = digit;

    if (digit && index < 4) {
      this.focusPinDigit(index + 1);
    }
  }

  onPinKeydown(index: number, event: KeyboardEvent): void {
    if (event.key !== 'Backspace' || this.pinDigits()[index] || index === 0) {
      return;
    }

    event.preventDefault();
    this.setPinDigit(index - 1, '');
    this.focusPinDigit(index - 1);
  }

  onPinPaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    const pastedDigits = this.normalizeDigits(event.clipboardData?.getData('text') ?? '').slice(0, 5 - index);
    if (!pastedDigits) {
      return;
    }

    const digits = [...this.pinDigits()];
    [...pastedDigits].forEach((digit, offset) => digits[index + offset] = digit);
    this.pinDigits.set(digits);
    this.focusPinDigit(Math.min(index + pastedDigits.length, 4));
  }

  isPinValid(): boolean {
    return /^\d{5}$/.test(this.pinDigits().join(''));
  }

  isNameValid(): boolean {
    return this.name().trim().length > 0;
  }

  isNationalIdValid(): boolean {
    return /^\d{10}$/.test(this.nationalId());
  }

  submitProfile(event: Event): void {
    event.preventDefault();
    this.submissionAttempted.set(true);
    const trimmedName = this.name().trim();
    this.name.set(trimmedName);

    if (!this.isNameValid() || !this.isNationalIdValid() || !this.isPinValid()) {
      return;
    }

    this.toastService.show('فرم با موفقیت بررسی شد.', 'success');
    this.pinDigits.set(['', '', '', '', '']);
    this.submissionAttempted.set(false);
    this.focusPinDigit(0);
  }

  private setPinDigit(index: number, digit: string): void {
    const digits = [...this.pinDigits()];
    digits[index] = digit;
    this.pinDigits.set(digits);
  }

  private focusPinDigit(index: number): void {
    document.getElementById(`employee-pin-${index}`)?.focus();
  }

  private normalizeDigits(value: string): string {
    return value
      .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
      .replace(/\D/g, '');
  }
}

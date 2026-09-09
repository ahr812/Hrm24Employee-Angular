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
            <h2 id="employee-pin-title" class="text-base font-bold text-foreground dark:text-slate-100 sm:text-lg">تغییر رمز عبور</h2>
            <p class="mt-0.5 text-xs leading-5 text-muted sm:text-sm">در صورت تمایل به تغییر رمز، هر دو فیلد را با یک رمز ۵ رقمی یکسان تکمیل کنید.</p>
          </div>
        </div>

        <form id="employee-profile-form" class="mt-4" (submit)="submitProfile($event)" novalidate>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label for="employee-new-password" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">رمز عبور جدید</label>
              <div class="relative">
                <ui-icon name="key" [size]="17" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                <input
                  id="employee-new-password"
                  type="password"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="5"
                  autocomplete="new-password"
                  dir="ltr"
                  [value]="newPassword()"
                  [attr.aria-invalid]="submissionAttempted() && hasNewPasswordError()"
                  [attr.aria-describedby]="submissionAttempted() && hasNewPasswordError() ? 'employee-new-password-error' : null"
                  (input)="onPasswordInput('new', $event)"
                  class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-3 text-center text-base font-extrabold tracking-[0.35em] text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="۵ رقم">
              </div>
              @if (submissionAttempted() && hasNewPasswordError()) {
                <p id="employee-new-password-error" class="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-danger" role="alert">
                  <ui-icon name="alert-circle" [size]="14"></ui-icon>
                  {{ newPasswordErrorMessage() }}
                </p>
              }
            </div>
            <div>
              <label for="employee-password-confirmation" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">تکرار رمز عبور</label>
              <div class="relative">
                <ui-icon name="lock" [size]="17" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                <input
                  id="employee-password-confirmation"
                  type="password"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="5"
                  autocomplete="new-password"
                  dir="ltr"
                  [value]="passwordConfirmation()"
                  [attr.aria-invalid]="submissionAttempted() && hasPasswordConfirmationError()"
                  [attr.aria-describedby]="submissionAttempted() && hasPasswordConfirmationError() ? 'employee-password-confirmation-error' : null"
                  (input)="onPasswordInput('confirmation', $event)"
                  class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-3 text-center text-base font-extrabold tracking-[0.35em] text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="۵ رقم">
              </div>
              @if (submissionAttempted() && hasPasswordConfirmationError()) {
                <p id="employee-password-confirmation-error" class="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-danger" role="alert">
                  <ui-icon name="alert-circle" [size]="14"></ui-icon>
                  {{ passwordConfirmationErrorMessage() }}
                </p>
              }
            </div>
          </div>

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
  readonly newPassword = signal('');
  readonly passwordConfirmation = signal('');
  readonly newPasswordHadNonDigit = signal(false);
  readonly passwordConfirmationHadNonDigit = signal(false);
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

  onPasswordInput(field: 'new' | 'confirmation', event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;
    const value = this.normalizeDigits(rawValue).slice(0, 5);
    const hadNonDigit = /[^0-9۰-۹٠-٩]/.test(rawValue);
    input.value = value;

    if (field === 'new') {
      this.newPassword.set(value);
      this.newPasswordHadNonDigit.set(hadNonDigit);
    } else {
      this.passwordConfirmation.set(value);
      this.passwordConfirmationHadNonDigit.set(hadNonDigit);
    }
  }

  passwordChangeRequested(): boolean {
    return this.newPassword().length > 0
      || this.passwordConfirmation().length > 0
      || this.newPasswordHadNonDigit()
      || this.passwordConfirmationHadNonDigit();
  }

  hasNewPasswordError(): boolean {
    return this.passwordChangeRequested()
      && (this.newPasswordHadNonDigit() || !/^\d{5}$/.test(this.newPassword()));
  }

  hasPasswordConfirmationError(): boolean {
    if (!this.passwordChangeRequested()) {
      return false;
    }

    if (this.passwordConfirmationHadNonDigit() || !/^\d{5}$/.test(this.passwordConfirmation())) {
      return true;
    }

    return /^\d{5}$/.test(this.newPassword())
      && !this.newPasswordHadNonDigit()
      && this.newPassword() !== this.passwordConfirmation();
  }

  newPasswordErrorMessage(): string {
    if (this.newPasswordHadNonDigit()) {
      return 'رمز عبور جدید فقط باید شامل اعداد باشد.';
    }
    if (!this.newPassword()) {
      return 'رمز عبور جدید را وارد کنید.';
    }
    return 'رمز عبور جدید باید دقیقاً ۵ رقم باشد.';
  }

  passwordConfirmationErrorMessage(): string {
    if (this.passwordConfirmationHadNonDigit()) {
      return 'تکرار رمز عبور فقط باید شامل اعداد باشد.';
    }
    if (!this.passwordConfirmation()) {
      return 'تکرار رمز عبور را وارد کنید.';
    }
    if (!/^\d{5}$/.test(this.passwordConfirmation())) {
      return 'تکرار رمز عبور باید دقیقاً ۵ رقم باشد.';
    }
    return 'رمز عبور جدید و تکرار آن یکسان نیستند.';
  }

  arePasswordFieldsValid(): boolean {
    return !this.passwordChangeRequested()
      || (!this.hasNewPasswordError() && !this.hasPasswordConfirmationError());
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

    if (!this.isNameValid() || !this.isNationalIdValid() || !this.arePasswordFieldsValid()) {
      return;
    }

    this.toastService.show('فرم با موفقیت بررسی شد.', 'success');
    this.newPassword.set('');
    this.passwordConfirmation.set('');
    this.newPasswordHadNonDigit.set(false);
    this.passwordConfirmationHadNonDigit.set(false);
    this.submissionAttempted.set(false);
  }

  private normalizeDigits(value: string): string {
    return value
      .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
      .replace(/\D/g, '');
  }
}

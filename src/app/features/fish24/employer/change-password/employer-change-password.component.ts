import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface EmployerFixedPasswordForm {
  newPassword: string;
  confirmation: string;
}

@Component({
  selector: 'app-employer-change-password',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-5 sm:space-y-6 animate-fade-in-up" dir="rtl">
      <header class="flex items-center gap-4">
        <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <ui-icon name="key" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl sm:text-3xl font-bold text-primary">تغییر رمز ثابت</h1>
          <p class="mt-1 text-sm sm:text-base text-muted">تنظیم رمز ثابت ورود به حساب کاربری</p>
        </div>
      </header>

      <section class="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="employer-fixed-password-title">
        <div class="mb-4 flex items-start gap-3 border-b border-border pb-4 dark:border-slate-700">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ui-icon name="lock" [size]="22"></ui-icon>
          </div>
          <div class="min-w-0">
            <h2 id="employer-fixed-password-title" class="text-lg sm:text-xl font-bold text-foreground dark:text-slate-100">رمز ثابت جدید</h2>
            <p class="mt-1 text-xs sm:text-sm leading-6 text-muted">مقدار جدید را در هر دو فیلد به‌صورت یکسان وارد کنید.</p>
          </div>
        </div>

        <form class="space-y-4" (ngSubmit)="submitFixedPassword()" novalidate>
          <div>
            <label for="employer-new-fixed-password" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">رمز ثابت جدید</label>
            <div class="relative">
              <ui-icon name="key" [size]="18" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
              <input
                id="employer-new-fixed-password"
                name="newFixedPassword"
                [type]="showNewPassword() ? 'text' : 'password'"
                [(ngModel)]="fixedPasswordForm.newPassword"
                required
                autocomplete="new-password"
                dir="ltr"
                [attr.aria-invalid]="showNewPasswordRequiredError()"
                [attr.aria-describedby]="showNewPasswordRequiredError() ? 'employer-new-fixed-password-error' : null"
                class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-11 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                placeholder="رمز ثابت جدید را وارد کنید">
              <button
                type="button"
                (click)="toggleNewPasswordVisibility()"
                [attr.aria-label]="showNewPassword() ? 'مخفی کردن رمز ثابت جدید' : 'نمایش رمز ثابت جدید'"
                [attr.aria-pressed]="showNewPassword()"
                class="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/25">
                <ui-icon [name]="showNewPassword() ? 'eye' : 'eye-off'" [size]="18"></ui-icon>
              </button>
            </div>
            @if (showNewPasswordRequiredError()) {
              <p id="employer-new-fixed-password-error" role="alert" class="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
                <ui-icon name="alert-circle" [size]="14"></ui-icon>
                رمز ثابت جدید را وارد کنید.
              </p>
            }
          </div>

          <div>
            <label for="employer-new-fixed-password-confirmation" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">تکرار رمز ثابت جدید</label>
            <div class="relative">
              <ui-icon name="lock" [size]="18" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
              <input
                id="employer-new-fixed-password-confirmation"
                name="newFixedPasswordConfirmation"
                [type]="showConfirmation() ? 'text' : 'password'"
                [(ngModel)]="fixedPasswordForm.confirmation"
                required
                autocomplete="new-password"
                dir="ltr"
                [attr.aria-invalid]="showConfirmationRequiredError() || showPasswordMismatchError()"
                [attr.aria-describedby]="confirmationErrorId()"
                class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-11 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                placeholder="رمز ثابت جدید را تکرار کنید">
              <button
                type="button"
                (click)="toggleConfirmationVisibility()"
                [attr.aria-label]="showConfirmation() ? 'مخفی کردن تکرار رمز ثابت' : 'نمایش تکرار رمز ثابت'"
                [attr.aria-pressed]="showConfirmation()"
                class="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/25">
                <ui-icon [name]="showConfirmation() ? 'eye' : 'eye-off'" [size]="18"></ui-icon>
              </button>
            </div>
            @if (showConfirmationRequiredError()) {
              <p id="employer-new-fixed-password-confirmation-required" role="alert" class="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
                <ui-icon name="alert-circle" [size]="14"></ui-icon>
                تکرار رمز ثابت جدید را وارد کنید.
              </p>
            } @else if (showPasswordMismatchError()) {
              <p id="employer-new-fixed-password-mismatch" role="alert" class="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
                <ui-icon name="alert-circle" [size]="14"></ui-icon>
                رمز ثابت و تکرار آن یکسان نیستند.
              </p>
            }
          </div>

          <div class="flex justify-end border-t border-border pt-4 dark:border-slate-700">
            <button
              type="submit"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto">
              <ui-icon name="key" [size]="19"></ui-icon>
              تغییر رمز ثابت
            </button>
          </div>
        </form>
      </section>
    </div>
  `
})
export class EmployerChangePasswordComponent {
  private readonly toastService = inject(ToastService);

  readonly showNewPassword = signal(false);
  readonly showConfirmation = signal(false);
  readonly submissionAttempted = signal(false);

  fixedPasswordForm: EmployerFixedPasswordForm = {
    newPassword: '',
    confirmation: ''
  };

  toggleNewPasswordVisibility(): void {
    this.showNewPassword.update((visible) => !visible);
  }

  toggleConfirmationVisibility(): void {
    this.showConfirmation.update((visible) => !visible);
  }

  showNewPasswordRequiredError(): boolean {
    return this.submissionAttempted() && this.fixedPasswordForm.newPassword.length === 0;
  }

  showConfirmationRequiredError(): boolean {
    return this.submissionAttempted() && this.fixedPasswordForm.confirmation.length === 0;
  }

  showPasswordMismatchError(): boolean {
    return this.submissionAttempted()
      && this.fixedPasswordForm.newPassword.length > 0
      && this.fixedPasswordForm.confirmation.length > 0
      && this.fixedPasswordForm.newPassword !== this.fixedPasswordForm.confirmation;
  }

  confirmationErrorId(): string | null {
    if (this.showConfirmationRequiredError()) {
      return 'employer-new-fixed-password-confirmation-required';
    }

    if (this.showPasswordMismatchError()) {
      return 'employer-new-fixed-password-mismatch';
    }

    return null;
  }

  submitFixedPassword(): void {
    this.submissionAttempted.set(true);

    if (this.showNewPasswordRequiredError() || this.showConfirmationRequiredError() || this.showPasswordMismatchError()) {
      return;
    }

    this.toastService.show('فرم تغییر رمز با موفقیت بررسی شد.', 'success');
    this.fixedPasswordForm = { newPassword: '', confirmation: '' };
    this.submissionAttempted.set(false);
    this.showNewPassword.set(false);
    this.showConfirmation.set(false);
  }
}

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-background dark:bg-slate-900 transition-colors">
      <div class="w-full max-w-md animate-scale-in">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/30">
            <ui-icon name="users" [size]="32" class="text-white"></ui-icon>
          </div>
          <h1 class="text-2xl font-bold text-foreground dark:text-slate-100">Fish24</h1>
          <p class="text-sm text-muted mt-1">پلتفرم فیش حقوقی</p>
        </div>

        <!-- Card -->
        <div class="bg-surface rounded-2xl p-6 md:p-8 border border-border dark:bg-slate-800 dark:border-slate-700 shadow-lg">

          <!-- ═══ STEP 1: Mobile Number ═══ -->
          @if (currentStep() === 1) {
            <div class="animate-step-in">
              <h2 class="text-xl font-bold text-foreground mb-2 dark:text-slate-100 text-center">ورود به حساب کاربری</h2>
              <p class="text-sm text-muted text-center mb-6">شماره موبایل خود را وارد کنید</p>

              <form (ngSubmit)="onSendOTP()" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">شماره موبایل</label>
                  <div class="relative">
                    <ui-icon name="phone" [size]="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                    <input
                      type="tel"
                      [(ngModel)]="mobile"
                      name="mobile"
                      required
                      autocomplete="tel"
                      inputmode="numeric"
                      maxlength="11"
                      dir="ltr"
                      class="w-full pr-10 pl-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-base tracking-wider text-left"
                      placeholder="09123456789"
                      (input)="onMobileInput($event)">
                  </div>
                  @if (mobileError()) {
                    <p class="text-xs text-danger mt-1.5 flex items-center gap-1">
                      <ui-icon name="alert-circle" [size]="12"></ui-icon>
                      {{ mobileError() }}
                    </p>
                  }
                </div>

                <button
                  type="submit"
                  [disabled]="isLoading() || !mobile.trim()"
                  class="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                  @if (isLoading()) {
                    <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    در حال ارسال...
                  } @else {
                    <ui-icon name="send" [size]="18"></ui-icon>
                    دریافت کد تأیید
                  }
                </button>
              </form>
            </div>
          }

          <!-- ═══ STEP 2: OTP Verification ═══ -->
          @if (currentStep() === 2) {
            <div class="animate-step-in">
              <h2 class="text-xl font-bold text-foreground mb-2 dark:text-slate-100 text-center">کد تأیید</h2>
              <p class="text-sm text-muted text-center mb-1">کد ۵ رقمی ارسال شده به</p>
              <p class="text-sm font-bold text-foreground text-center mb-6 dir-ltr">{{ maskedMobile() }}</p>

              <!-- OTP Input Boxes (LTR: index 0=left, index 4=right) -->
              <div class="flex justify-center gap-2 md:gap-3 mb-6" dir="ltr">
                @for (digit of otpDigits(); track $index) {
                  <input
                    type="tel"
                    inputmode="numeric"
                    maxlength="1"
                    [value]="digit"
                    class="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold rounded-xl border-2 bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    [class.border-primary]="digit !== ''"
                    [class.border-border]="digit === ''"
                    (input)="onOTPInput($index, $event)"
                    (keydown)="onOTPKeydown($index, $event)"
                    (paste)="onOTPPaste($event)"
                    (focus)="onOTPFocus($index)">
                }
              </div>

              @if (otpError()) {
                <p class="text-xs text-danger text-center mb-4 flex items-center justify-center gap-1">
                  <ui-icon name="alert-circle" [size]="12"></ui-icon>
                  {{ otpError() }}
                </p>
              }

              <!-- Timer & Resend -->
              <div class="mb-6">
                @if (resendCooldown() > 0) {
                  <div class="relative w-full h-10 bg-border/30 rounded-xl overflow-hidden dark:bg-slate-700/50">
                    <div
                      class="absolute top-0 left-0 h-full bg-primary/15 transition-all duration-1000 ease-linear"
                      [style.width.%]="(resendCooldown() / OTP_COOLDOWN) * 100">
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-xs font-bold text-muted flex items-center gap-1.5">
                        <ui-icon name="clock" [size]="14"></ui-icon>
                        ارسال مجدد تا {{ toPersianNum(resendCooldown()) }} ثانیه دیگر
                      </span>
                    </div>
                  </div>
                } @else {
                  <button
                    (click)="onResendOTP()"
                    [disabled]="isLoading()"
                    class="w-full h-10 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5 dark:hover:bg-primary/10">
                    <ui-icon name="refresh-cw" [size]="14"></ui-icon>
                    ارسال مجدد کد تأیید
                  </button>
                }
              </div>

              <!-- Verify Button -->
              <button
                (click)="onVerifyOTP()"
                [disabled]="isLoading() || !isOTPComplete()"
                class="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mb-4">
                @if (isLoading()) {
                  <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  در حال بررسی...
                } @else {
                  <ui-icon name="check-circle" [size]="18"></ui-icon>
                  تأیید و ورود
                }
              </button>

              <!-- Back Button -->
              <button
                (click)="goBack()"
                class="w-full py-2.5 text-muted text-xs font-bold hover:text-foreground transition-colors flex items-center justify-center gap-1">
                <ui-icon name="arrow-right" [size]="14"></ui-icon>
                تغییر شماره موبایل
              </button>
            </div>
          }

          <!-- ═══ STEP 3: Entering System ═══ -->
          @if (currentStep() === 3) {
            <div class="animate-step-in flex flex-col items-center justify-center py-8">
              <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
                <ui-icon name="login" [size]="32" class="text-success animate-pulse"></ui-icon>
              </div>
              <h2 class="text-xl font-bold text-foreground mb-2 dark:text-slate-100">در حال ورود به سامانه...</h2>
              <p class="text-sm text-muted">لطفاً صبر کنید...</p>
            </div>
          }

        </div>

        <p class="text-center text-xs text-muted mt-6">نسخه ۱.۰.۰ | Fish24</p>
      </div>
    </div>
  `,
  styles: [`
    @keyframes scale-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }

    @keyframes step-in {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .animate-step-in { animation: step-in 0.3s ease-out forwards; }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .animate-spin { animation: spin 0.8s linear infinite; }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  currentStep = signal<1 | 2 | 3>(1);

  // Step 1
  mobile = '';
  mobileError = signal('');

  // Step 2
  otpDigits = signal<string[]>(['', '', '', '', '']);
  otpError = signal('');
  resendCooldown = signal(0);
  isLoading = signal(false);

  readonly OTP_COOLDOWN = 120;
  private cooldownTimer: any = null;

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('hrm24_otp');
    }
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
  }

  // ══════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════
  toPersianNum(num: number | string): string {
    return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }

  maskedMobile(): string {
    const m = this.authService.normalizeMobile(this.mobile);
    if (m.length >= 11) {
      return m.substring(0, 4) + '***' + m.substring(7);
    }
    return m;
  }

  isOTPComplete(): boolean {
    return this.otpDigits().every(d => d !== '');
  }

  getOTPCode(): string {
    return this.otpDigits().join('');
  }

  // ══════════════════════════════════════
  // Step 1: Mobile Input
  // ══════════════════════════════════════
  onMobileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.mobile = input.value;
    this.mobileError.set('');
  }

  onSendOTP(): void {
    this.mobileError.set('');
    this.otpError.set('');

    const validation = this.authService.validateMobile(this.mobile);
    if (!validation.valid) {
      this.mobileError.set(validation.message);
      return;
    }

    this.isLoading.set(true);

    setTimeout(() => {
      const result = this.authService.sendOTP(this.mobile);
      this.isLoading.set(false);

      if (result.success) {
        this.toastService.show(result.message, 'success');
        this.currentStep.set(2);
        this.startCooldown();
        this.otpDigits.set(['', '', '', '', '']);
        setTimeout(() => {
          const firstInput = document.querySelector('input[inputmode="numeric"]') as HTMLInputElement;
          if (firstInput) firstInput.focus();
        }, 100);
      } else {
        this.toastService.show(result.message, 'error');
        this.mobileError.set(result.message);
      }
    }, 800);
  }

  // ══════════════════════════════════════
  // Step 2: OTP Input
  // LTR layout: index 0 = leftmost, index 4 = rightmost
  // ArrowRight → move right (higher index)
  // ArrowLeft → move left (lower index)
  // ══════════════════════════════════════
  onOTPInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
    const digit = value.slice(-1);

    const newDigits = [...this.otpDigits()];
    newDigits[index] = digit;
    this.otpDigits.set(newDigits);
    this.otpError.set('');

    if (digit && index < 4) {
      const inputs = document.querySelectorAll('input[inputmode="numeric"]');
      (inputs[index + 1] as HTMLInputElement)?.focus();
    }

    if (newDigits.every(d => d !== '')) {
      setTimeout(() => this.onVerifyOTP(), 200);
    }
  }

  onOTPKeydown(index: number, event: KeyboardEvent): void {
    const inputs = document.querySelectorAll('input[inputmode="numeric"]');

    if (event.key === 'Backspace') {
      const newDigits = [...this.otpDigits()];
      if (newDigits[index] === '' && index > 0) {
        newDigits[index - 1] = '';
        this.otpDigits.set(newDigits);
        (inputs[index - 1] as HTMLInputElement)?.focus();
      } else {
        newDigits[index] = '';
        this.otpDigits.set(newDigits);
      }
      event.preventDefault();
    }

    // LTR: ArrowRight = next box (right), ArrowLeft = previous box (left)
    if (event.key === 'ArrowRight' && index < 4) {
      (inputs[index + 1] as HTMLInputElement)?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      (inputs[index - 1] as HTMLInputElement)?.focus();
    }
  }

  onOTPPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = (event.clipboardData?.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 5);

    if (paste.length > 0) {
      const newDigits = [...this.otpDigits()];
      for (let i = 0; i < paste.length && i < 5; i++) {
        newDigits[i] = paste[i];
      }
      this.otpDigits.set(newDigits);

      const nextIndex = Math.min(paste.length, 4);
      const inputs = document.querySelectorAll('input[inputmode="numeric"]');
      (inputs[nextIndex] as HTMLInputElement)?.focus();

      if (newDigits.every(d => d !== '')) {
        setTimeout(() => this.onVerifyOTP(), 200);
      }
    }
  }

  onOTPFocus(index: number): void {
    const inputs = document.querySelectorAll('input[inputmode="numeric"]');
    (inputs[index] as HTMLInputElement)?.select();
  }

  onVerifyOTP(): void {
    if (!this.isOTPComplete()) return;

    this.otpError.set('');
    this.isLoading.set(true);

    const code = this.getOTPCode();

    setTimeout(() => {
      const verifyResult = this.authService.verifyOTP(this.mobile, code);

      if (verifyResult.success) {
        this.isLoading.set(false);
        this.currentStep.set(3);

        setTimeout(() => {
          const loginResult = this.authService.loginWithMobile(this.mobile);
          if (loginResult.success) {
            this.toastService.show(loginResult.message, 'success');
            this.router.navigate(['/dashboard']);
          } else {
            this.toastService.show(loginResult.message, 'error');
            this.currentStep.set(2);
          }
        }, 3000);
      } else {
        this.isLoading.set(false);
        this.otpError.set(verifyResult.message);
        this.toastService.show(verifyResult.message, 'error');
      }
    }, 600);
  }

  onResendOTP(): void {
    this.otpError.set('');
    this.isLoading.set(true);

    setTimeout(() => {
      const result = this.authService.sendOTP(this.mobile);
      this.isLoading.set(false);

      if (result.success) {
        this.toastService.show(result.message, 'success');
        this.otpDigits.set(['', '', '', '', '']);
        this.startCooldown();
        const firstInput = document.querySelector('input[inputmode="numeric"]') as HTMLInputElement;
        if (firstInput) firstInput.focus();
      } else {
        this.toastService.show(result.message, 'error');
      }
    }, 500);
  }

  goBack(): void {
    this.currentStep.set(1);
    this.otpDigits.set(['', '', '', '', '']);
    this.otpError.set('');
    this.stopCooldown();
  }

  // ══════════════════════════════════════
  // Cooldown Timer
  // ══════════════════════════════════════
  private startCooldown(): void {
    this.stopCooldown();
    this.resendCooldown.set(this.OTP_COOLDOWN);

    this.cooldownTimer = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        this.stopCooldown();
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  private stopCooldown(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }
}
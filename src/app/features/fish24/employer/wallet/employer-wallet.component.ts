import { Component, computed, inject, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

type ChargeAmountSource = 'quick' | 'custom' | null;

@Component({
  selector: 'app-employer-wallet',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
      <header class="flex items-center gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
          <ui-icon name="wallet" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">کیف پول</h1>
          <p class="mt-1 text-sm text-muted sm:text-base">مشاهده موجودی و افزایش اعتبار کیف پول</p>
        </div>
      </header>

      <section class="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-l from-primary/20 via-primary/10 to-surface p-4 shadow-sm dark:to-slate-800 sm:p-6" aria-labelledby="employer-wallet-balance-title">
        <div class="absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-primary/10" aria-hidden="true"></div>
        <div class="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-w-0 items-center gap-3 sm:gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 sm:h-14 sm:w-14">
              <ui-icon name="wallet" [size]="28"></ui-icon>
            </div>
            <div class="min-w-0">
              <h2 id="employer-wallet-balance-title" class="text-sm font-bold text-muted">موجودی کیف پول شما</h2>
              <p class="mt-2 flex flex-wrap items-baseline gap-1 text-2xl font-extrabold text-foreground dark:text-slate-100 sm:text-3xl" dir="ltr">
                <span>{{ formatAmount(currentWalletBalance) }}</span>
                <span class="text-sm font-bold text-muted sm:text-base" dir="rtl">ریال</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-describedby="employer-transactions-status"
            class="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-surface/80 px-4 py-2.5 text-sm font-bold text-muted opacity-80 dark:border-slate-600 dark:bg-slate-900/60 sm:w-auto">
            <ui-icon name="history" [size]="19"></ui-icon>
            لیست تراکنش‌ها
            <span id="employer-transactions-status" class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">به‌زودی</span>
          </button>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)] lg:items-start">
        <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="employer-wallet-charge-title">
          <div class="mb-4 flex items-start gap-3 border-b border-border pb-4 dark:border-slate-700">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ui-icon name="plus" [size]="22"></ui-icon>
            </div>
            <div class="min-w-0">
              <h2 id="employer-wallet-charge-title" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">افزایش اعتبار</h2>
              <p class="mt-1 text-xs leading-6 text-muted sm:text-sm">یکی از مبالغ پیشنهادی را انتخاب کنید یا مبلغ دلخواه را وارد کنید.</p>
            </div>
          </div>

          <fieldset>
            <legend class="mb-2.5 text-sm font-bold text-foreground dark:text-slate-200">مبالغ پیشنهادی</legend>
            <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              @for (amount of quickChargeAmounts; track amount) {
                <button
                  type="button"
                  (click)="selectQuickAmount(amount)"
                  [attr.aria-pressed]="isQuickAmountSelected(amount)"
                  [attr.aria-label]="'انتخاب مبلغ ' + formatAmount(amount) + ' ریال'"
                  [class]="isQuickAmountSelected(amount)
                    ? 'min-w-0 rounded-xl border border-primary bg-primary/10 p-3 text-right ring-2 ring-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30'
                    : 'min-w-0 rounded-xl border border-border bg-background p-3 text-right transition-colors hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:bg-slate-900/60'">
                  <span class="flex flex-wrap items-baseline gap-1 text-base font-extrabold text-foreground dark:text-slate-100" dir="ltr">
                    <span>{{ formatAmount(amount) }}</span>
                    <span class="text-[11px] font-bold text-muted" dir="rtl">ریال</span>
                  </span>
                  <span class="mt-2 flex items-center gap-1 text-[11px] font-bold" [class.text-primary]="isQuickAmountSelected(amount)" [class.text-muted]="!isQuickAmountSelected(amount)">
                    @if (isQuickAmountSelected(amount)) {
                      <ui-icon name="check-circle" [size]="14"></ui-icon>
                      انتخاب شده
                    } @else {
                      انتخاب مبلغ
                    }
                  </span>
                </button>
              }
            </div>
          </fieldset>

          <div class="mt-5 border-t border-border pt-5 dark:border-slate-700">
            <label for="employer-custom-charge-amount" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">مبلغ دلخواه</label>
            <div class="relative">
              <ui-icon name="banknote" [size]="19" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
              <input
                id="employer-custom-charge-amount"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                spellcheck="false"
                [value]="customAmountDisplay()"
                (input)="onCustomAmountInput($event)"
                [attr.aria-invalid]="customAmountError() !== null"
                [attr.aria-describedby]="customAmountError() ? 'employer-custom-charge-hint employer-custom-charge-error' : 'employer-custom-charge-hint'"
                class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-14 text-left text-sm font-bold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                dir="ltr"
                placeholder="12,800,000">
              <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">ریال</span>
            </div>
            <p id="employer-custom-charge-hint" class="mt-1.5 text-xs leading-5 text-muted">
              حداقل مبلغ شارژ {{ formatAmount(minimumChargeAmount) }} ریال است و سه رقم آخر باید صفر باشد.
            </p>
            @if (customAmountError()) {
              <p id="employer-custom-charge-error" role="alert" class="mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-5 text-danger">
                <ui-icon name="alert-circle" [size]="14" class="mt-0.5 shrink-0"></ui-icon>
                {{ customAmountError() }}
              </p>
            }
          </div>
        </section>

        <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="employer-wallet-summary-title">
          <div class="mb-4 flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ui-icon name="calculator" [size]="22"></ui-icon>
            </div>
            <div>
              <h2 id="employer-wallet-summary-title" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">خلاصه پرداخت</h2>
              <p class="mt-0.5 text-xs text-muted">پیش‌نمایش مبلغ قابل پرداخت</p>
            </div>
          </div>

          @if (baseAmount(); as amount) {
            <dl class="overflow-hidden rounded-xl border border-border bg-background/70 dark:border-slate-700 dark:bg-slate-900/50">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-3 dark:border-slate-700">
                <dt class="text-sm text-muted">مبلغ شارژ</dt>
                <dd class="flex items-baseline gap-1 text-sm font-extrabold text-foreground dark:text-slate-100" dir="ltr">
                  <span>{{ formatAmount(amount) }}</span><span class="text-xs text-muted" dir="rtl">ریال</span>
                </dd>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-3 dark:border-slate-700">
                <dt class="text-sm text-muted">ارزش افزوده ({{ formatPersianAmount(vatPreviewPercentage) }}٪)</dt>
                <dd class="flex items-baseline gap-1 text-sm font-extrabold text-foreground dark:text-slate-100" dir="ltr">
                  <span>{{ formatAmount(vatAmount()) }}</span><span class="text-xs text-muted" dir="rtl">ریال</span>
                </dd>
              </div>
              <div class="bg-primary/10 px-3 py-4">
                <dt class="text-xs font-bold text-primary">مبلغ قابل پرداخت</dt>
                <dd class="mt-2 flex flex-wrap items-baseline gap-1 text-xl font-extrabold text-primary sm:text-2xl" dir="ltr">
                  <span>{{ formatAmount(finalPayableAmount()) }}</span><span class="text-xs font-bold" dir="rtl">ریال</span>
                </dd>
              </div>
            </dl>
          } @else {
            <div class="rounded-xl border border-dashed border-border bg-background/60 px-4 py-6 text-center dark:border-slate-600 dark:bg-slate-900/40">
              <ui-icon name="calculator" [size]="28" class="mx-auto text-muted"></ui-icon>
              <p class="mt-2 text-sm font-bold text-foreground dark:text-slate-200">مبلغ شارژ را انتخاب کنید</p>
              <p class="mt-1 text-xs leading-5 text-muted">پس از انتخاب یک مبلغ معتبر، محاسبه ارزش افزوده نمایش داده می‌شود.</p>
            </div>
          }

          <button
            type="button"
            (click)="prepareOnlinePayment()"
            [disabled]="baseAmount() === null"
            [attr.aria-disabled]="baseAmount() === null"
            class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50">
            <ui-icon name="credit-card" [size]="19"></ui-icon>
            پرداخت آنلاین
          </button>
          <p class="mt-2 text-center text-[11px] leading-5 text-muted">در این مرحله هیچ پرداخت واقعی یا تغییری در موجودی انجام نمی‌شود.</p>
        </section>
      </div>
    </div>
  `
})
export class EmployerWalletComponent {
  private readonly toastService = inject(ToastService);
  private readonly amountFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  private readonly persianAmountFormatter = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });

  // Frontend-only presentation values pending backend/system configuration.
  readonly currentWalletBalance = 32_750_000;
  readonly minimumChargeAmount = 5_000_000;
  readonly vatPreviewPercentage = 10;
  readonly quickChargeAmounts: readonly number[] = [50_000_000, 100_000_000, 150_000_000];

  readonly selectedQuickAmount = signal<number | null>(null);
  readonly customAmount = signal<number | null>(null);
  readonly customAmountDisplay = signal('');
  readonly customAmountIsInteger = signal(true);
  readonly amountSource = signal<ChargeAmountSource>(null);

  readonly customAmountError = computed<string | null>(() => {
    if (this.amountSource() !== 'custom') {
      return null;
    }

    const displayValue = this.customAmountDisplay().trim();
    const amount = this.customAmount();

    if (displayValue.length === 0) {
      return 'مبلغ شارژ را وارد کنید.';
    }

    if (!this.customAmountIsInteger() || amount === null || !Number.isSafeInteger(amount) || amount <= 0) {
      return 'مبلغ شارژ باید یک عدد صحیح مثبت باشد.';
    }

    if (amount < this.minimumChargeAmount) {
      return `حداقل مبلغ شارژ ${this.formatPersianAmount(this.minimumChargeAmount)} ریال است.`;
    }

    if (amount % 1000 !== 0) {
      return 'سه رقم آخر مبلغ باید صفر باشد.';
    }

    return null;
  });

  readonly baseAmount = computed<number | null>(() => {
    if (this.amountSource() === 'quick') {
      return this.selectedQuickAmount();
    }

    if (this.amountSource() === 'custom' && this.customAmountError() === null) {
      return this.customAmount();
    }

    return null;
  });

  readonly vatAmount = computed(() => {
    const amount = this.baseAmount();
    return amount === null ? 0 : (amount * this.vatPreviewPercentage) / 100;
  });

  readonly finalPayableAmount = computed(() => {
    const amount = this.baseAmount();
    return amount === null ? 0 : amount + this.vatAmount();
  });

  selectQuickAmount(amount: number): void {
    this.amountSource.set('quick');
    this.selectedQuickAmount.set(amount);
    this.customAmount.set(null);
    this.customAmountDisplay.set('');
    this.customAmountIsInteger.set(true);
  }

  isQuickAmountSelected(amount: number): boolean {
    return this.amountSource() === 'quick' && this.selectedQuickAmount() === amount;
  }

  onCustomAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalizedInput = input.value.replace(/,/g, '').trim();
    const isIntegerInput = /^\d*$/.test(normalizedInput);
    const digits = isIntegerInput ? normalizedInput : '';
    const numericAmount = isIntegerInput && digits.length > 0 ? Number(digits) : null;
    const displayValue = isIntegerInput ? this.groupDigits(digits) : input.value;

    this.amountSource.set('custom');
    this.selectedQuickAmount.set(null);
    this.customAmountDisplay.set(displayValue);
    this.customAmountIsInteger.set(isIntegerInput);
    this.customAmount.set(numericAmount);
    input.value = displayValue;
  }

  prepareOnlinePayment(): void {
    if (this.baseAmount() === null) {
      return;
    }

    this.toastService.show('اطلاعات پرداخت برای اتصال به درگاه آماده است.', 'success');
  }

  formatAmount(amount: number): string {
    return this.amountFormatter.format(amount);
  }

  formatPersianAmount(amount: number): string {
    return this.persianAmountFormatter.format(amount);
  }

  private groupDigits(digits: string): string {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { AdvanceService, Advance } from '../../core/advance/advance.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { ExportService } from '../../core/export/export.service';

@Component({
  selector: 'app-advance',
  standalone: true,
  imports: [FormsModule, IconComponent, EscToCloseDirective],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">

      <!-- Header (Matches Payslip Structure) -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="credit-card" [size]="36" class="text-yellow-500"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">مساعده‌ها</h1>
            <p class="text-lg text-muted">مساعده‌ها و وضعیت آنها</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button type="button" (click)="openAddModal()" class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
            <ui-icon name="plus" [size]="20"></ui-icon>
            درخواست مساعده
          </button>
          <button type="button" (click)="exportAll()" class="px-5 py-3 bg-success text-white rounded-xl hover:bg-success/90 transition-colors font-bold flex items-center gap-2 shadow-sm">
            <ui-icon name="download" [size]="20"></ui-icon>
            خروجی
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ toFa(stats().total) }}</p>
          <p class="text-xs text-muted mt-1">کل مساعده‌ها</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-warning">{{ toFa(stats().pending) }}</p>
          <p class="text-xs text-muted mt-1">در انتظار</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-info">{{ toFa(stats().approved) }}</p>
          <p class="text-xs text-muted mt-1">تأیید شده</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-success">{{ toFa(stats().deducted) }}</p>
          <p class="text-xs text-muted mt-1">کسر شده</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-lg font-bold text-primary">{{ formatCompact(stats().totalAmount) }}</p>
          <p class="text-xs text-muted mt-1">کل مبلغ</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-lg font-bold text-warning">{{ formatCompact(stats().pendingAmount) }}</p>
          <p class="text-xs text-muted mt-1">مانده کسر نشده</p>
        </div>
      </div>

      <!-- Advances Grid -->
      <div>
        <h2 class="text-xl font-bold text-foreground mb-4 dark:text-slate-100">لیست مساعده‌ها</h2>
        @if (advList().length === 0) {
          <div class="bg-surface rounded-xl p-12 border border-border text-center dark:bg-slate-800 dark:border-slate-700">
            <ui-icon name="credit-card" [size]="64" class="mx-auto mb-4 text-muted opacity-50"></ui-icon>
            <p class="text-lg text-muted">مساعده‌ای ثبت نشده است</p>
          </div>
        }
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (adv of advList(); track adv.id) {
            <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group" (click)="openDetailModal(adv)">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ui-icon name="credit-card" [size]="24" class="text-primary"></ui-icon>
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-base font-bold text-foreground dark:text-slate-100 truncate">{{ adv.titleLabel }}</h3>
                    <p class="text-xs text-muted">{{ toFa(adv.createdAt) }}</p>
                  </div>
                </div>
                <span [class]="advService.getStatusBadgeClass(adv.status)" class="px-2 py-1 rounded-md text-[10px] font-bold flex-shrink-0">{{ advService.getStatusLabel(adv.status) }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div><span class="text-muted">مبلغ:</span> <span class="font-bold text-foreground dark:text-slate-200">{{ formatCompact(adv.amount) }}</span></div>
                <div><span class="text-muted">محل کسر:</span> <span class="font-bold text-foreground dark:text-slate-200">{{ adv.deductionLocationLabel }}</span></div>
                <div><span class="text-muted">زمان سررسید:</span> <span class="font-bold text-foreground dark:text-slate-200">{{ advService.getMonthName(adv.dueDateMonth) }} {{ toFa(adv.dueDateYear) }}</span></div>
                <div><span class="text-muted">زمان کسر:</span> <span class="font-bold text-foreground dark:text-slate-200">{{ advService.getMonthName(adv.deductionDateMonth) }} {{ toFa(adv.deductionDateYear) }}</span></div>
              </div>
              <div class="flex items-center justify-between pt-3 border-t border-border dark:border-slate-700">
                <span class="text-[10px] text-muted">{{ adv.description || '-' }}</span>
                <div class="flex items-center gap-1">
                  @if (adv.status === 'pending') {
                    <button type="button" (click)="deleteAdvance(adv.id); $event.stopPropagation()" class="p-1.5 rounded-lg hover:bg-danger/10 transition-colors" title="حذف">
                      <ui-icon name="trash-2" [size]="14" class="text-muted hover:text-danger"></ui-icon>
                    </button>
                  }
                  <ui-icon name="chevron-left" [size]="16" class="text-muted group-hover:text-primary transition-colors"></ui-icon>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Detail Modal -->
      @if (detailAdv()) {
        <div appEscToClose (escPressed)="closeDetailModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeDetailModal()">
          <div class="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[85vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1 ml-3">
                  <div class="flex items-center gap-2 mb-1">
                    <h2 class="text-lg font-bold text-foreground dark:text-slate-100">{{ detailAdv()!.titleLabel }}</h2>
                    <span [class]="advService.getStatusBadgeClass(detailAdv()!.status)" class="px-2 py-0.5 rounded-md text-[10px] font-bold">{{ advService.getStatusLabel(detailAdv()!.status) }}</span>
                  </div>
                  <p class="text-xs text-muted">{{ toFa(detailAdv()!.createdAt) }}</p>
                </div>
                <button type="button" (click)="closeDetailModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="بستن"><ui-icon name="x" [size]="18" class="text-muted"></ui-icon></button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">مبلغ مساعده</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ toFa(advService.formatMoney(detailAdv()!.amount)) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">وضعیت</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ advService.getStatusLabel(detailAdv()!.status) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">زمان سررسید</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ advService.getMonthName(detailAdv()!.dueDateMonth) }} {{ toFa(detailAdv()!.dueDateYear) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">زمان کسر</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ advService.getMonthName(detailAdv()!.deductionDateMonth) }} {{ toFa(detailAdv()!.deductionDateYear) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">محل کسر</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ detailAdv()!.deductionLocationLabel }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">تاریخ ثبت</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ toFa(detailAdv()!.createdAt) }}</p></div>
              </div>
              @if (detailAdv()!.description) {
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted mb-1">توضیحات</p><p class="text-xs text-foreground dark:text-slate-200">{{ detailAdv()!.description }}</p></div>
              }
              @if (detailAdv()!.approvedBy) {
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted mb-1">تأیید کننده</p><p class="text-xs text-foreground dark:text-slate-200">{{ detailAdv()!.approvedBy }} - {{ toFa(detailAdv()!.approvedAt || '') }}</p></div>
              }
              @if (detailAdv()!.rejectReason) {
                <div class="bg-danger/5 border border-danger/20 rounded-lg p-3"><p class="text-[10px] text-danger mb-1">دلیل رد</p><p class="text-xs text-danger">{{ detailAdv()!.rejectReason }}</p></div>
              }
              @if (detailAdv()!.deductedAt) {
                <div class="bg-success/5 border border-success/20 rounded-lg p-3"><p class="text-[10px] text-success mb-1">تاریخ کسر</p><p class="text-xs text-success">{{ toFa(detailAdv()!.deductedAt || '') }}</p></div>
              }
            </div>
            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
              <button type="button" (click)="closeDetailModal()" class="w-full py-2.5 border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">بستن</button>
            </div>
          </div>
        </div>
      }

      <!-- Add Advance Modal -->
      @if (isModalOpen()) {
        <div appEscToClose (escPressed)="closeModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeModal()">
          <div class="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">درخواست مساعده جدید</h2>
                <button type="button" (click)="closeModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="بستن"><ui-icon name="x" [size]="18" class="text-muted"></ui-icon></button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">عنوان مساعده *</label>
                <select [(ngModel)]="formData.titleId" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                  @for (t of advTitles; track t.id) {
                    <option [value]="t.id">{{ t.title }} (حداکثر {{ formatNum(t.maxAmount) }} تومان)</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">مبلغ مساعده (تومان) *</label>
                <input type="number" [(ngModel)]="formData.amount" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr" placeholder="مثال: ۱۰۰۰۰۰۰۰">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">سال سررسید *</label>
                  <input type="number" [(ngModel)]="formData.dueDateYear" min="1400" max="1410" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr">
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">ماه سررسید *</label>
                  <select [(ngModel)]="formData.dueDateMonth" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    @for (m of months; track m.value) {
                      <option [value]="m.value">{{ m.label }}</option>
                    }
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">محل کسر *</label>
                <select [(ngModel)]="formData.deductionLocationId" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                  @for (dl of deductionLocs; track dl.id) {
                    <option [value]="dl.id">{{ dl.title }} - {{ dl.description }}</option>
                  }
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">سال کسر *</label>
                  <input type="number" [(ngModel)]="formData.deductionDateYear" min="1400" max="1410" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr">
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">ماه کسر *</label>
                  <select [(ngModel)]="formData.deductionDateMonth" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    @for (m of months; track m.value) {
                      <option [value]="m.value">{{ m.label }}</option>
                    }
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">توضیحات</label>
                <textarea [(ngModel)]="formData.description" rows="2" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="توضیحات تکمیلی..."></textarea>
              </div>
            </div>
            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex gap-3">
                <button type="button" (click)="closeModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">انصراف</button>
                <button type="button" (click)="saveAdvance()" class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-sm flex items-center justify-center gap-2">
                  <ui-icon name="send" [size]="16"></ui-icon>
                  ثبت درخواست
                </button>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fade-in 0.2s ease-out; }
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
    .animate-scale-in { animation: scale-in 0.2s ease-out; }
  `]
})
export class AdvanceComponent {
  advService = inject(AdvanceService);
  private toastService = inject(ToastService);
  private exportService = inject(ExportService);

  stats = this.advService.stats;
  advList = this.advService.myAdvances;
  advTitles = this.advService.advanceTitles();
  deductionLocs = this.advService.deductionLocations();

  isModalOpen = signal(false);
  detailAdv = signal<Advance | null>(null);

  months = [
    { value: 1, label: 'فروردین' }, { value: 2, label: 'اردیبهشت' }, { value: 3, label: 'خرداد' },
    { value: 4, label: 'تیر' }, { value: 5, label: 'مرداد' }, { value: 6, label: 'شهریور' },
    { value: 7, label: 'مهر' }, { value: 8, label: 'آبان' }, { value: 9, label: 'آذر' },
    { value: 10, label: 'دی' }, { value: 11, label: 'بهمن' }, { value: 12, label: 'اسفند' }
  ];

  formData = {
    titleId: 'at-1',
    amount: null as number | null,
    dueDateYear: 1403,
    dueDateMonth: 9,
    deductionLocationId: 'dl-1',
    deductionDateYear: 1403,
    deductionDateMonth: 10,
    description: ''
  };

  openAddModal(): void {
    this.formData = { titleId: 'at-1', amount: null, dueDateYear: 1403, dueDateMonth: 9, deductionLocationId: 'dl-1', deductionDateYear: 1403, deductionDateMonth: 10, description: '' };
    this.isModalOpen.set(true);
  }

  closeModal(): void { this.isModalOpen.set(false); }
  openDetailModal(adv: Advance): void { this.detailAdv.set(adv); }
  closeDetailModal(): void { this.detailAdv.set(null); }

  saveAdvance(): void {
    if (!this.formData.amount || this.formData.amount <= 0) {
      this.toastService.show('لطفاً مبلغ مساعده را وارد کنید.', 'error');
      return;
    }
    this.advService.addAdvance({
      titleId: this.formData.titleId,
      amount: this.formData.amount,
      dueDateYear: this.formData.dueDateYear,
      dueDateMonth: this.formData.dueDateMonth,
      deductionLocationId: this.formData.deductionLocationId,
      deductionDateYear: this.formData.deductionDateYear,
      deductionDateMonth: this.formData.deductionDateMonth,
      description: this.formData.description
    });
    this.toastService.show('درخواست مساعده با موفقیت ثبت شد.', 'success');
    this.closeModal();
  }

  deleteAdvance(id: string): void {
    this.advService.deleteAdvance(id);
    this.toastService.show('درخواست مساعده حذف شد.', 'success');
  }

  formatCompact(amount: number): string {
    if (amount >= 1000000000) return this.toFa((amount / 1000000000).toFixed(1)) + ' میلیارد';
    if (amount >= 1000000) return this.toFa((amount / 1000000).toFixed(0)) + ' میلیون';
    return new Intl.NumberFormat('fa-IR').format(amount);
  }

  formatNum(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount);
  }

  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }

  exportAll(): void {
    const data = this.advService.myAdvances().map((a: Advance) => ({
      'عنوان': a.titleLabel, 'مبلغ': a.amount, 'وضعیت': this.advService.getStatusLabel(a.status),
      'زمان سررسید': `${a.dueDateYear}/${String(a.dueDateMonth).padStart(2, '0')}`,
      'محل کسر': a.deductionLocationLabel,
      'زمان کسر': `${a.deductionDateYear}/${String(a.deductionDateMonth).padStart(2, '0')}`,
      'تأیید کننده': a.approvedBy || '-', 'تاریخ ثبت': a.createdAt, 'توضیحات': a.description
    }));
    this.exportService.exportToCSV(data, 'advances-report');
  }
}
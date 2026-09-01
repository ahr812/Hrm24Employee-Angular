import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { LoanService, Loan } from '../../core/loan/loan.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { ExportService } from '../../core/export/export.service';

@Component({
  selector: 'app-loan',
  standalone: true,
  imports: [FormsModule, IconComponent, EscToCloseDirective],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">

      <!-- Header (Matches Payslip Structure) -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-blue-600/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="banknote" [size]="36" class="text-blue-600"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">وام و تسهیلات</h1>
            <p class="text-lg text-muted">وام‌ها و تسهیلات دریافتی</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button type="button" (click)="openAddModal()" class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
            <ui-icon name="plus" [size]="20"></ui-icon>
            درخواست وام
          </button>
          <button type="button" (click)="exportAll()" class="px-5 py-3 bg-success text-white rounded-xl hover:bg-success/90 transition-colors font-bold flex items-center gap-2 shadow-sm">
            <ui-icon name="download" [size]="20"></ui-icon>
            خروجی
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ toFa(stats().totalLoans) }}</p>
          <p class="text-xs text-muted mt-1">کل وام‌ها</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-primary">{{ toFa(stats().activeLoans) }}</p>
          <p class="text-xs text-muted mt-1">وام فعال</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-success">{{ toFa(stats().completedLoans) }}</p>
          <p class="text-xs text-muted mt-1">تکمیل شده</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-lg font-bold text-info">{{ formatCompact(stats().totalPaid) }}</p>
          <p class="text-xs text-muted mt-1">کل پرداخت شده</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-lg font-bold text-warning">{{ formatCompact(stats().totalRemaining) }}</p>
          <p class="text-xs text-muted mt-1">کل مانده بدهی</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ toFa(stats().avgProgress) }}٪</p>
          <p class="text-xs text-muted mt-1">میانگین بازپرداخت</p>
        </div>
      </div>

      <!-- Detailed Summary Panel -->
      <div class="bg-gradient-to-l from-primary/5 to-success/5 rounded-2xl p-5 border border-primary/20 dark:border-primary/30">
        <h3 class="text-sm font-bold text-foreground mb-3 dark:text-slate-100 flex items-center gap-2">
          <ui-icon name="chart" [size]="16" class="text-primary"></ui-icon>
          خلاصه کل وام‌ها و اقساط
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
          <div><span class="text-muted block text-xs">کل مبلغ اعطایی</span><span class="font-bold text-foreground dark:text-slate-200">{{ toFa(loanService.formatMoney(stats().totalAmountGranted)) }}</span></div>
          <div><span class="text-muted block text-xs">کل پرداخت شده</span><span class="font-bold text-success">{{ toFa(loanService.formatMoney(stats().totalPaid)) }}</span></div>
          <div><span class="text-muted block text-xs">کل مانده بدهی</span><span class="font-bold text-warning">{{ toFa(loanService.formatMoney(stats().totalRemaining)) }}</span></div>
          <div><span class="text-muted block text-xs">کل اقساط</span><span class="font-bold text-foreground dark:text-slate-200">{{ toFa(stats().totalInstallments) }} قسط</span></div>
          <div><span class="text-muted block text-xs">اقساط پرداخت شده</span><span class="font-bold text-success">{{ toFa(stats().totalPaidInstallments) }} قسط</span></div>
          <div><span class="text-muted block text-xs">اقساط مانده</span><span class="font-bold text-warning">{{ toFa(stats().totalRemainingInstallments) }} قسط</span></div>
        </div>
      </div>

      <!-- Loans Grid -->
      <div>
        <h2 class="text-xl font-bold text-foreground mb-4 dark:text-slate-100">لیست وام‌ها</h2>
        @if (myLoans().length === 0) {
          <div class="bg-surface rounded-xl p-12 border border-border text-center dark:bg-slate-800 dark:border-slate-700">
            <ui-icon name="banknote" [size]="64" class="mx-auto mb-4 text-muted opacity-50"></ui-icon>
            <p class="text-lg text-muted">وامی ثبت نشده است</p>
          </div>
        }
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (loan of myLoans(); track loan.id) {
            <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group" (click)="openDetailModal(loan)">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ui-icon name="banknote" [size]="24" class="text-primary"></ui-icon>
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-base font-bold text-foreground dark:text-slate-100 truncate">{{ loan.loanTypeTitle }}</h3>
                    <p class="text-xs text-muted">{{ toFa(loan.paymentDate || loan.createdAt) }}</p>
                  </div>
                </div>
                <span [class]="loanService.getStatusBadgeClass(loan.status)" class="px-2 py-1 rounded-md text-[10px] font-bold flex-shrink-0">{{ loanService.getStatusLabel(loan.status) }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div><span class="text-muted">مبلغ کل:</span> <span class="font-bold text-foreground dark:text-slate-200">{{ formatCompact(loan.totalWithInterest) }}</span></div>
                <div><span class="text-muted">قسط ماهانه:</span> <span class="font-bold text-foreground dark:text-slate-200">{{ formatCompact(loan.installmentAmount) }}</span></div>
                <div><span class="text-muted">پرداخت شده:</span> <span class="font-bold text-success">{{ formatCompact(loan.totalPaidAmount) }}</span></div>
                <div><span class="text-muted">مانده:</span> <span class="font-bold text-warning">{{ formatCompact(loan.remainingAmount) }}</span></div>
              </div>
              <div class="mb-3">
                <div class="flex justify-between text-[10px] mb-1">
                  <span class="text-muted">پیشرفت بازپرداخت</span>
                  <span class="font-bold text-foreground dark:text-slate-200">{{ toFa(getProgress(loan)) }}٪</span>
                </div>
                <div class="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500" [class]="getProgressColor(loan)" [style.width.%]="getProgress(loan)"></div>
                </div>
                <p class="text-[10px] text-muted mt-1">{{ toFa(loan.paidInstallments) }} از {{ toFa(loan.installmentCount) }} قسط پرداخت شده</p>
              </div>
              <div class="flex items-center justify-between pt-3 border-t border-border dark:border-slate-700">
                <span class="text-[10px] text-muted">{{ loan.deductionConditionTitle }}</span>
                <div class="flex items-center gap-1">
                  <button type="button" (click)="exportSingle(loan); $event.stopPropagation()" class="p-1.5 rounded-lg hover:bg-success/10 transition-colors" title="خروجی این وام">
                    <ui-icon name="download" [size]="14" class="text-success"></ui-icon>
                  </button>
                  @if (loan.status === 'pending') {
                    <button type="button" (click)="deleteLoan(loan.id); $event.stopPropagation()" class="p-1.5 rounded-lg hover:bg-danger/10 transition-colors" title="حذف">
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
      @if (detailLoan()) {
        <div appEscToClose (escPressed)="closeDetailModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeDetailModal()">
          <div class="bg-surface w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[85vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1 ml-3">
                  <div class="flex items-center gap-2 mb-1">
                    <h2 class="text-lg font-bold text-foreground dark:text-slate-100">{{ detailLoan()!.loanTypeTitle }}</h2>
                    <span [class]="loanService.getStatusBadgeClass(detailLoan()!.status)" class="px-2 py-0.5 rounded-md text-[10px] font-bold">{{ loanService.getStatusLabel(detailLoan()!.status) }}</span>
                  </div>
                  <p class="text-xs text-muted">تاریخ پرداخت: {{ toFa(detailLoan()!.paymentDate || '-') }} | شرایط: {{ detailLoan()!.deductionConditionTitle }}</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button type="button" (click)="exportSingle(detailLoan()!)" class="p-2 rounded-lg hover:bg-success/10 transition-colors" title="خروجی"><ui-icon name="download" [size]="18" class="text-success"></ui-icon></button>
                  <button type="button" (click)="closeDetailModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="بستن"><ui-icon name="x" [size]="18" class="text-muted"></ui-icon></button>
                </div>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">مبلغ وام</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ toFa(loanService.formatMoney(detailLoan()!.totalAmount)) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">سود</p><p class="text-sm font-bold text-warning">{{ toFa(loanService.formatMoney(detailLoan()!.interestAmount)) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">کل بازپرداخت</p><p class="text-sm font-bold text-primary">{{ toFa(loanService.formatMoney(detailLoan()!.totalWithInterest)) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">قسط ماهانه</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ toFa(loanService.formatMoney(detailLoan()!.installmentAmount)) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">تعداد اقساط</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ toFa(detailLoan()!.installmentCount) }} قسط</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">شروع کسر</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ loanService.getMonthName(detailLoan()!.startDeductionMonth) }} {{ toFa(detailLoan()!.startDeductionYear) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">پرداخت شده</p><p class="text-sm font-bold text-success">{{ toFa(loanService.formatMoney(detailLoan()!.totalPaidAmount)) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">مانده بدهی</p><p class="text-sm font-bold text-warning">{{ toFa(loanService.formatMoney(detailLoan()!.remainingAmount)) }}</p></div>
              </div>
              @if (detailLoan()!.description) {
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted mb-1">توضیحات</p><p class="text-xs text-foreground dark:text-slate-200">{{ detailLoan()!.description }}</p></div>
              }
              @if (detailLoan()!.installments.length > 0) {
                <div>
                  <h3 class="text-sm font-bold text-foreground mb-3 dark:text-slate-100 flex items-center gap-2">
                    <ui-icon name="list-check" [size]="16" class="text-primary"></ui-icon>
                    ریز اقساط ({{ toFa(detailLoan()!.installments.length) }} قسط)
                  </h3>
                  <div class="bg-background rounded-xl border border-border overflow-hidden dark:bg-slate-900 dark:border-slate-700">
                    <div class="overflow-x-auto">
                      <table class="w-full text-xs">
                        <thead class="bg-surface dark:bg-slate-800">
                          <tr>
                            <th class="px-3 py-2 text-right font-bold text-muted">#</th>
                            <th class="px-3 py-2 text-right font-bold text-muted">سررسید</th>
                            <th class="px-3 py-2 text-right font-bold text-muted">زمان کسر</th>
                            <th class="px-3 py-2 text-right font-bold text-muted">محل کسر</th>
                            <th class="px-3 py-2 text-right font-bold text-muted">مبلغ</th>
                            <th class="px-3 py-2 text-right font-bold text-muted">وضعیت</th>
                            <th class="px-3 py-2 text-right font-bold text-muted">توضیحات</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (inst of detailLoan()!.installments; track inst.id) {
                            <tr class="border-t border-border dark:border-slate-700">
                              <td class="px-3 py-2 font-bold text-foreground dark:text-slate-200">{{ toFa(inst.installmentNumber) }}</td>
                              <td class="px-3 py-2 text-foreground dark:text-slate-200">{{ loanService.getMonthName(inst.dueDateMonth) }} {{ toFa(inst.dueDateYear) }}</td>
                              <td class="px-3 py-2 text-foreground dark:text-slate-200">{{ loanService.getMonthName(inst.deductionDateMonth) }} {{ toFa(inst.deductionDateYear) }}</td>
                              <td class="px-3 py-2 text-muted">{{ inst.deductionLocation }}</td>
                              <td class="px-3 py-2 font-bold text-foreground dark:text-slate-200">{{ toFa(formatNum(inst.amount)) }}</td>
                              <td class="px-3 py-2"><span [class]="loanService.getInstallmentStatusBadgeClass(inst.status)" class="px-2 py-0.5 rounded-md text-[10px] font-bold">{{ loanService.getInstallmentStatusLabel(inst.status) }}</span></td>
                              <td class="px-3 py-2 text-muted truncate max-w-[120px]">{{ inst.notes || '-' }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              }
            </div>
            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
              <button type="button" (click)="closeDetailModal()" class="w-full py-2.5 border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">بستن</button>
            </div>
          </div>
        </div>
      }

      <!-- Add Loan Modal -->
      @if (isModalOpen()) {
        <div appEscToClose (escPressed)="closeModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeModal()">
          <div class="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">درخواست وام جدید</h2>
                <button type="button" (click)="closeModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="بستن"><ui-icon name="x" [size]="18" class="text-muted"></ui-icon></button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">نوع وام *</label>
                <select [(ngModel)]="formData.loanTypeId" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                  @for (lt of loanService.loanTypes(); track lt.id) {
                    <option [value]="lt.id">{{ lt.title }} (حداکثر {{ formatNum(lt.maxAmount) }} تومان - {{ toFa(lt.maxMonths) }} ماهه)</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">مبلغ وام (تومان) *</label>
                <input type="number" [(ngModel)]="formData.totalAmount" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr" placeholder="مثال: ۱۰۰۰۰۰۰۰۰">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">تعداد اقساط *</label>
                  <input type="number" [(ngModel)]="formData.installmentCount" min="1" max="60" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr">
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">شرایط کسر *</label>
                  <select [(ngModel)]="formData.deductionConditionId" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    @for (dc of loanService.deductionConditions(); track dc.id) {
                      <option [value]="dc.id">{{ dc.title }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">سال شروع کسر *</label>
                  <input type="number" [(ngModel)]="formData.startYear" min="1400" max="1410" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr">
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">ماه شروع کسر *</label>
                  <select [(ngModel)]="formData.startMonth" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
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
                <button type="button" (click)="saveLoan()" class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-sm flex items-center justify-center gap-2">
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
export class LoanComponent {
  loanService = inject(LoanService);
  private toastService = inject(ToastService);
  private exportService = inject(ExportService);

  stats = this.loanService.stats;
  myLoans = this.loanService.myLoans;

  isModalOpen = signal(false);
  detailLoan = signal<Loan | null>(null);

  months = [
    { value: 1, label: 'فروردین' }, { value: 2, label: 'اردیبهشت' }, { value: 3, label: 'خرداد' },
    { value: 4, label: 'تیر' }, { value: 5, label: 'مرداد' }, { value: 6, label: 'شهریور' },
    { value: 7, label: 'مهر' }, { value: 8, label: 'آبان' }, { value: 9, label: 'آذر' },
    { value: 10, label: 'دی' }, { value: 11, label: 'بهمن' }, { value: 12, label: 'اسفند' }
  ];

  formData = {
    loanTypeId: 'lt-5',
    totalAmount: null as number | null,
    installmentCount: 12,
    startYear: 1403,
    startMonth: 1,
    deductionConditionId: 'dc-1',
    description: ''
  };

  openAddModal(): void {
    this.formData = { loanTypeId: 'lt-5', totalAmount: null, installmentCount: 12, startYear: 1403, startMonth: 1, deductionConditionId: 'dc-1', description: '' };
    this.isModalOpen.set(true);
  }

  closeModal(): void { this.isModalOpen.set(false); }
  openDetailModal(loan: Loan): void { this.detailLoan.set(loan); }
  closeDetailModal(): void { this.detailLoan.set(null); }

  saveLoan(): void {
    if (!this.formData.totalAmount || this.formData.totalAmount <= 0) {
      this.toastService.show('لطفاً مبلغ وام را وارد کنید.', 'error');
      return;
    }
    this.loanService.addLoan({
      loanTypeId: this.formData.loanTypeId,
      totalAmount: this.formData.totalAmount,
      installmentCount: this.formData.installmentCount,
      startDeductionYear: this.formData.startYear,
      startDeductionMonth: this.formData.startMonth,
      deductionConditionId: this.formData.deductionConditionId,
      description: this.formData.description
    });
    this.toastService.show('درخواست وام با موفقیت ثبت شد.', 'success');
    this.closeModal();
  }

  deleteLoan(id: string): void {
    this.loanService.deleteLoan(id);
    this.toastService.show('درخواست وام حذف شد.', 'success');
  }

  getProgress(loan: Loan): number {
    return loan.installmentCount > 0 ? Math.round((loan.paidInstallments / loan.installmentCount) * 100) : 0;
  }

  getProgressColor(loan: Loan): string {
    const p = this.getProgress(loan);
    if (p >= 100) return 'bg-success';
    if (p >= 50) return 'bg-primary';
    if (p >= 25) return 'bg-warning';
    return 'bg-danger';
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
    const data = this.loanService.loans().map(l => ({
      'نوع وام': l.loanTypeTitle, 'وضعیت': this.loanService.getStatusLabel(l.status),
      'مبلغ کل': l.totalWithInterest, 'پرداخت شده': l.totalPaidAmount, 'مانده': l.remainingAmount,
      'تعداد اقساط': l.installmentCount, 'اقساط پرداخت شده': l.paidInstallments, 'اقساط مانده': l.remainingInstallments,
      'قسط ماهانه': l.installmentAmount, 'شروع کسر': `${l.startDeductionYear}/${String(l.startDeductionMonth).padStart(2, '0')}`,
      'شرایط': l.deductionConditionTitle, 'تاریخ پرداخت': l.paymentDate || '-', 'توضیحات': l.description
    }));
    this.exportService.exportToCSV(data, 'loans-summary-report');
  }

  exportSingle(loan: Loan): void {
    const summary = [{
      'نوع وام': loan.loanTypeTitle, 'وضعیت': this.loanService.getStatusLabel(loan.status),
      'مبلغ وام': loan.totalAmount, 'سود': loan.interestAmount, 'کل بازپرداخت': loan.totalWithInterest,
      'قسط ماهانه': loan.installmentAmount, 'تعداد اقساط': loan.installmentCount,
      'پرداخت شده': loan.totalPaidAmount, 'مانده': loan.remainingAmount,
      'شروع کسر': `${loan.startDeductionYear}/${String(loan.startDeductionMonth).padStart(2, '0')}`,
      'شرایط': loan.deductionConditionTitle, 'توضیحات': loan.description
    }];
    const installments = loan.installments.map(i => ({
      'قسط #': i.installmentNumber, 'سررسید': `${i.dueDateYear}/${String(i.dueDateMonth).padStart(2, '0')}`,
      'زمان کسر': `${i.deductionDateYear}/${String(i.deductionDateMonth).padStart(2, '0')}`,
      'محل کسر': i.deductionLocation, 'مبلغ': i.amount,
      'وضعیت': this.loanService.getInstallmentStatusLabel(i.status), 'توضیحات': i.notes
    }));
    this.exportService.exportToCSV([...summary, ...installments], `loan-${loan.id}-detail`);
  }
}
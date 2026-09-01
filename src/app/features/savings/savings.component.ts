import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { SavingsService, SavingsMembership, SavingsFundOption } from '../../core/savings/savings.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { ExportService } from '../../core/export/export.service';

// Interface کمکی برای نمایش ترکیبی
interface FundDisplayItem {
  fund: SavingsFundOption;
  membership?: SavingsMembership;
  hasMembership: boolean;
}

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [FormsModule, IconComponent, EscToCloseDirective],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-emerald-600/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="archive-restore" [size]="36" class="text-emerald-600"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">صندوق پس‌انداز</h1>
            <p class="text-lg text-muted">صندوق‌های پس‌انداز سازمانی</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button type="button" (click)="openAddModal()" class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
            <ui-icon name="plus" [size]="20"></ui-icon>
            درخواست عضویت
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
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ toFa(stats().totalMemberships) }}</p>
          <p class="text-xs text-muted mt-1">کل عضویت‌ها</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-success">{{ toFa(stats().activeMemberships) }}</p>
          <p class="text-xs text-muted mt-1">عضویت فعال</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-warning">{{ toFa(stats().pendingMemberships) }}</p>
          <p class="text-xs text-muted mt-1">در انتظار/تسویه</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-lg font-bold text-primary">{{ formatCompact(stats().totalDeposited) }}</p>
          <p class="text-xs text-muted mt-1">کل واریزی</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-lg font-bold text-info">{{ formatCompact(stats().totalInterest) }}</p>
          <p class="text-xs text-muted mt-1">کل سود</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-lg font-bold text-success">{{ formatCompact(stats().totalBalance) }}</p>
          <p class="text-xs text-muted mt-1">موجودی کل</p>
        </div>
      </div>

      <!-- Available Funds Grid -->
      <div>
        <h2 class="text-xl font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
          <ui-icon name="archive-restore" [size]="22" class="text-primary"></ui-icon>
          لیست صندوق‌ها و وضعیت شما
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (item of fundDisplayList(); track item.fund.id) {
            
            <!-- حالت ۱، ۲، ۳، ۴: کاربر عضویت دارد (Active, Pending, Pending-Settlement) -->
            @if (item.hasMembership && item.membership) {
              <div class="bg-surface rounded-2xl p-5 border-2 dark:bg-slate-800 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                   [class.border-primary]="item.membership.status === 'active'"
                   [class.border-warning]="item.membership.status === 'pending'"
                   [class.border-orange-500]="item.membership.status === 'pending-settlement'"
                   (click)="openDetailModal(item.membership)">
                
                <!-- نوار رنگی بالا -->
                @if (item.membership.status === 'active') {
                  <div class="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                } @else if (item.membership.status === 'pending') {
                  <div class="absolute top-0 left-0 w-full h-1 bg-warning"></div>
                } @else if (item.membership.status === 'pending-settlement') {
                  <div class="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
                }

                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                         [class]="item.membership.status === 'active' ? 'bg-primary/10' : item.membership.status === 'pending' ? 'bg-warning/10' : 'bg-orange-500/10'">
                      <ui-icon name="archive-restore" [size]="24"
                               [class]="item.membership.status === 'active' ? 'text-primary' : item.membership.status === 'pending' ? 'text-warning' : 'text-orange-500'"></ui-icon>
                    </div>
                    <div class="min-w-0">
                      <h3 class="text-base font-bold text-foreground dark:text-slate-100 truncate">{{ item.fund.title }}</h3>
                      <span [class]="savService.getStatusBadgeClass(item.membership.status)" class="px-2 py-0.5 rounded-md text-[10px] font-bold inline-block mt-1">
                        {{ savService.getStatusLabel(item.membership.status) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- اطلاعات مالی فقط برای Active و Pending-Settlement -->
                @if (item.membership.status !== 'pending') {
                  <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div><span class="text-muted">ماهانه:</span> <span class="font-bold text-foreground dark:text-slate-200">{{ formatCompact(item.membership.monthlyAmount) }}</span></div>
                    <div><span class="text-muted">موجودی:</span> <span class="font-bold text-success">{{ formatCompact(item.membership.currentBalance) }}</span></div>
                    <div><span class="text-muted">واریزی:</span> <span class="font-bold text-foreground dark:text-slate-200">{{ formatCompact(item.membership.totalDeposited) }}</span></div>
                    <div><span class="text-muted">سود:</span> <span class="font-bold text-info">{{ formatCompact(item.membership.totalInterest) }}</span></div>
                  </div>
                  
                  <!-- نوار پیشرفت -->
                  <div class="mb-3">
                    <div class="flex justify-between text-[10px] mb-1">
                      <span class="text-muted">پیشرفت دوره</span>
                      <span class="font-bold text-foreground dark:text-slate-200">{{ toFa(getDurationProgress(item.membership)) }}٪</span>
                    </div>
                    <div class="w-full h-2 bg-border rounded-full overflow-hidden">
                      <div class="h-full bg-primary rounded-full transition-all duration-500" [style.width.%]="getDurationProgress(item.membership)"></div>
                    </div>
                  </div>
                } @else {
                  <!-- پیام برای Pending -->
                  <div class="mb-3 p-3 bg-warning/5 rounded-lg border border-warning/20">
                    <p class="text-xs text-warning text-center">درخواست عضویت شما ثبت شده و در انتظار تأیید است.</p>
                  </div>
                }

                <div class="flex items-center justify-between pt-3 border-t border-border dark:border-slate-700">
                  <span class="text-[10px] text-muted">{{ item.membership.conditionLabel }}</span>
                  <ui-icon name="chevron-left" [size]="16" class="text-muted group-hover:text-primary transition-colors"></ui-icon>
                </div>
              </div>
            } 
            
            <!-- حالت ۵: کاربر عضویت ندارد -->
            @else {
              <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-all opacity-90 hover:opacity-100">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-muted/10 flex items-center justify-center flex-shrink-0">
                      <ui-icon name="archive-restore" [size]="24" class="text-muted"></ui-icon>
                    </div>
                    <div class="min-w-0">
                      <h3 class="text-base font-bold text-foreground dark:text-slate-100 truncate">{{ item.fund.title }}</h3>
                      <p class="text-[10px] text-muted mt-1">سود {{ toFa(item.fund.interestRate) }}٪ | {{ toFa(item.fund.minDurationMonths) }}-{{ toFa(item.fund.maxDurationMonths) }} ماهه</p>
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div><span class="text-muted">حداقل ماهانه:</span> <span class="font-bold text-foreground dark:text-slate-200">{{ formatCompact(item.fund.minMonthlyAmount) }}</span></div>
                  <div><span class="text-muted">حداکثر ماهانه:</span> <span class="font-bold text-foreground dark:text-slate-200">{{ formatCompact(item.fund.maxMonthlyAmount) }}</span></div>
                </div>
                <div class="pt-3 border-t border-border dark:border-slate-700">
                  <button type="button" (click)="openAddModalForFund(item.fund.id)" class="w-full py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-bold text-xs">درخواست عضویت</button>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Confirm Settlement Dialog -->
      @if (confirmSettlementDialog()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div class="w-80 bg-surface dark:bg-slate-900 border border-border dark:border-slate-700 rounded-2xl p-5 text-center animate-scale-in mx-4 shadow-2xl">
            <div class="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
              <ui-icon name="alert-triangle" [size]="24" class="text-warning"></ui-icon>
            </div>
            <p class="text-base font-bold text-foreground dark:text-white mb-1">توقف پس‌انداز و تسویه</p>
            <p class="text-xs text-muted mb-4">آیا مطمئن هستید؟ پس از تأیید، وضعیت به «در انتظار تسویه» تغییر کرده و دیگر امکان واریز نخواهید داشت.</p>
            <div class="flex gap-2">
              <button (click)="cancelSettlement()" class="flex-1 py-2.5 rounded-xl border border-border dark:border-slate-700 text-sm font-bold text-muted hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">انصراف</button>
              <button (click)="executeSettlement()" class="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-bold hover:bg-danger/90 transition-colors">تأیید تسویه</button>
            </div>
          </div>
        </div>
      }

      <!-- Detail Modal -->
      @if (detailMem()) {
        <div appEscToClose (escPressed)="closeDetailModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 pb-4 px-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto" (click)="closeDetailModal()">
          <div class="bg-surface w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[85vh] flex flex-col my-auto" (click)="$event.stopPropagation()">
            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1 ml-3">
                  <div class="flex items-center gap-2 mb-1">
                    <h2 class="text-lg font-bold text-foreground dark:text-slate-100">{{ detailMem()!.fundTitle }}</h2>
                    <span [class]="savService.getStatusBadgeClass(detailMem()!.status)" class="px-2 py-0.5 rounded-md text-[10px] font-bold">{{ savService.getStatusLabel(detailMem()!.status) }}</span>
                  </div>
                  <p class="text-xs text-muted">شرایط: {{ detailMem()!.conditionLabel }} | عضویت: {{ toFa(detailMem()!.joinedAt || '-') }}</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button type="button" (click)="printDetail()" class="p-2 rounded-lg hover:bg-primary/10 transition-colors" title="چاپ">
                    <ui-icon name="printer" [size]="18" class="text-primary"></ui-icon>
                  </button>
                  <button type="button" (click)="closeDetailModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="بستن"><ui-icon name="x" [size]="18" class="text-muted"></ui-icon></button>
                </div>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-5" id="savings-detail-content">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">ماهانه</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ toFa(savService.formatMoney(detailMem()!.monthlyAmount)) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">کل واریزی</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ toFa(savService.formatMoney(detailMem()!.totalDeposited)) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">سود دریافتی</p><p class="text-sm font-bold text-info">{{ toFa(savService.formatMoney(detailMem()!.totalInterest)) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">موجودی فعلی</p><p class="text-sm font-bold text-success">{{ toFa(savService.formatMoney(detailMem()!.currentBalance)) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">شروع</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ savService.getMonthName(detailMem()!.startMonth) }} {{ toFa(detailMem()!.startYear) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">خاتمه</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ savService.getMonthName(detailMem()!.endMonth) }} {{ toFa(detailMem()!.endYear) }}</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">تعداد تراکنش</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ toFa(detailMem()!.transactions.length) }} مورد</p></div>
                <div class="bg-background rounded-lg p-3 dark:bg-slate-900"><p class="text-[10px] text-muted">وضعیت</p><p class="text-sm font-bold text-foreground dark:text-slate-200">{{ savService.getStatusLabel(detailMem()!.status) }}</p></div>
              </div>

              <div class="bg-gradient-to-l from-primary/5 to-success/5 rounded-xl p-4 border border-primary/20 dark:border-primary/30">
                <h3 class="text-sm font-bold text-foreground mb-3 dark:text-slate-100 flex items-center gap-2">
                  <ui-icon name="users" [size]="16" class="text-primary"></ui-icon>
                  آمار کلی صندوق {{ detailMem()!.fundTitle }}
                </h3>
                @if (getFundStatsData(detailMem()!.fundId); as fs) {
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span class="text-muted block text-xs">تعداد اعضا</span><span class="font-bold text-foreground dark:text-slate-200">{{ toFa(fs.totalMembers) }} نفر</span></div>
                    <div><span class="text-muted block text-xs">اعضای فعال</span><span class="font-bold text-success">{{ toFa(fs.activeMembers) }} نفر</span></div>
                    <div><span class="text-muted block text-xs">جمع واریزی</span><span class="font-bold text-foreground dark:text-slate-200">{{ toFa(savService.formatMoney(fs.totalDeposited)) }}</span></div>
                    <div><span class="text-muted block text-xs">جمع موجودی</span><span class="font-bold text-primary">{{ toFa(savService.formatMoney(fs.totalBalance)) }}</span></div>
                  </div>
                }
              </div>

              @if (detailMem()!.transactions.length > 0) {
                <div>
                  <h3 class="text-sm font-bold text-foreground mb-3 dark:text-slate-100 flex items-center gap-2">
                    <ui-icon name="list-check" [size]="16" class="text-primary"></ui-icon>
                    ریز تراکنش‌ها ({{ toFa(detailMem()!.transactions.length) }} مورد)
                  </h3>
                  <div class="bg-background rounded-xl border border-border overflow-hidden dark:bg-slate-900 dark:border-slate-700">
                    <div class="overflow-x-auto">
                      <table class="w-full text-xs">
                        <thead class="bg-surface dark:bg-slate-800">
                          <tr>
                            <th class="px-3 py-2 text-right font-bold text-muted">نوع</th>
                            <th class="px-3 py-2 text-right font-bold text-muted">تاریخ</th>
                            <th class="px-3 py-2 text-right font-bold text-muted">مبلغ</th>
                            <th class="px-3 py-2 text-right font-bold text-muted">مانده</th>
                            <th class="px-3 py-2 text-right font-bold text-muted">توضیحات</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (tx of detailMem()!.transactions; track tx.id) {
                            <tr class="border-t border-border dark:border-slate-700">
                              <td class="px-3 py-2"><span [class]="savService.getTransactionBadgeClass(tx.type)" class="px-2 py-0.5 rounded-md text-[10px] font-bold">{{ savService.getTransactionTypeLabel(tx.type) }}</span></td>
                              <td class="px-3 py-2 text-foreground dark:text-slate-200">{{ toFa(tx.createdAt) }}</td>
                              <td class="px-3 py-2 font-bold text-foreground dark:text-slate-200">{{ toFa(formatNum(tx.amount)) }}</td>
                              <td class="px-3 py-2 text-muted">{{ toFa(formatNum(tx.balanceAfter)) }}</td>
                              <td class="px-3 py-2 text-muted truncate max-w-[150px]">{{ tx.description }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              }
            </div>
            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0 flex gap-2">
              @if (canSettle(detailMem()!)) {
                <button type="button" (click)="openSettlementConfirm()" class="flex-1 py-2.5 rounded-xl bg-danger text-white font-bold text-sm hover:bg-danger/90 transition-colors flex items-center justify-center gap-2">
                  <ui-icon name="circle-stop" [size]="18"></ui-icon>
                  توقف و تسویه
                </button>
              }
              <button type="button" (click)="printDetail()" class="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                <ui-icon name="printer" [size]="18"></ui-icon>
                چاپ
              </button>
              <button type="button" (click)="closeDetailModal()" class="px-5 py-2.5 rounded-xl border border-border dark:border-slate-700 text-foreground font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                بستن
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Add Membership Modal -->
      @if (isModalOpen()) {
        <div appEscToClose (escPressed)="closeModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeModal()">
          <div class="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">درخواست عضویت در صندوق</h2>
                <button type="button" (click)="closeModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="بستن"><ui-icon name="x" [size]="18" class="text-muted"></ui-icon></button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">صندوق پس‌انداز *</label>
                <select [(ngModel)]="formData.fundId" (ngModelChange)="onFundChange()" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                  @for (f of availableFunds; track f.id) {
                    <option [value]="f.id">{{ f.title }} ({{ formatNum(f.minMonthlyAmount) }} - {{ formatNum(f.maxMonthlyAmount) }} تومان)</option>
                  }
                </select>
              </div>
              @if (selectedFund) {
                <div class="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-foreground dark:text-slate-200">
                  <p>💡 حداقل ماهانه: <span class="font-bold">{{ formatNum(selectedFund.minMonthlyAmount) }}</span> | حداکثر: <span class="font-bold">{{ formatNum(selectedFund.maxMonthlyAmount) }}</span></p>
                  <p>📊 نرخ سود: <span class="font-bold">{{ toFa(selectedFund.interestRate) }}٪</span> | مدت: <span class="font-bold">{{ toFa(selectedFund.minDurationMonths) }}-{{ toFa(selectedFund.maxDurationMonths) }} ماه</span></p>
                </div>
              }
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">مبلغ پس‌انداز ماهانه (تومان) *</label>
                <input type="number" [(ngModel)]="formData.monthlyAmount" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr" placeholder="مبلغ ماهانه">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">سال شروع *</label>
                  <input type="number" [(ngModel)]="formData.startYear" min="1400" max="1410" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr">
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">ماه شروع *</label>
                  <select [(ngModel)]="formData.startMonth" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    @for (m of months; track m.value) {
                      <option [value]="m.value">{{ m.label }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">سال خاتمه *</label>
                  <input type="number" [(ngModel)]="formData.endYear" min="1400" max="1415" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr">
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">ماه خاتمه *</label>
                  <select [(ngModel)]="formData.endMonth" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    @for (m of months; track m.value) {
                      <option [value]="m.value">{{ m.label }}</option>
                    }
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">شرایط بازپرداخت *</label>
                <select [(ngModel)]="formData.conditionId" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                  @for (c of savConditions; track c.id) {
                    <option [value]="c.id">{{ c.title }} - {{ c.description }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex gap-3">
                <button type="button" (click)="closeModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">انصراف</button>
                <button type="button" (click)="saveMembership()" class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-sm flex items-center justify-center gap-2">
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

    @media print {
      body * { visibility: hidden !important; }
      #savings-detail-content, #savings-detail-content * { visibility: visible !important; }
      #savings-detail-content {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-height: none !important;
        overflow: visible !important;
        padding: 20px !important;
        background: white !important;
        color: black !important;
      }
    }
  `]
})
export class SavingsComponent {
  savService = inject(SavingsService);
  private toastService = inject(ToastService);
  private exportService = inject(ExportService);

  // Inject مستقیم signal برای تضمین reactivity
  private memberships = this.savService.memberships;

  stats = this.savService.stats;
  fundTypes = this.savService.fundTypes();
  savConditions = this.savService.conditions();

  isModalOpen = signal(false);
  detailMem = signal<SavingsMembership | null>(null);
  selectedFund: SavingsFundOption | null = this.savService.fundTypes()[0];

  confirmSettlementDialog = signal(false);
  private pendingSettlementId: string | null = null;

  // Computed signal هوشمند برای ساخت لیست نمایش
  fundDisplayList = computed<FundDisplayItem[]>(() => {
    const funds = this.savService.fundTypes();
    const allMemberships = this.memberships();

    return funds.map(fund => {
      // پیدا کردن عضویت مرتبط با این صندوق (که رد یا لغو نشده باشد)
      const membership = allMemberships.find(m =>
        m.fundId === fund.id &&
        m.status !== 'rejected' &&
        m.status !== 'cancelled' &&
        m.status !== 'settled'
      );

      return {
        fund,
        membership,
        hasMembership: !!membership
      };
    });
  });

  months = [
    { value: 1, label: 'فروردین' }, { value: 2, label: 'اردیبهشت' }, { value: 3, label: 'خرداد' },
    { value: 4, label: 'تیر' }, { value: 5, label: 'مرداد' }, { value: 6, label: 'شهریور' },
    { value: 7, label: 'مهر' }, { value: 8, label: 'آبان' }, { value: 9, label: 'آذر' },
    { value: 10, label: 'دی' }, { value: 11, label: 'بهمن' }, { value: 12, label: 'اسفند' }
  ];

  formData = {
    fundId: 'sf-1',
    monthlyAmount: null as number | null,
    startYear: 1403,
    startMonth: 9,
    endYear: 1405,
    endMonth: 8,
    conditionId: 'sc-1'
  };

  get availableFunds(): SavingsFundOption[] {
    return this.savService.fundTypes();
  }

  onFundChange(): void {
    this.selectedFund = this.savService.fundTypes().find((f: SavingsFundOption) => f.id === this.formData.fundId) ?? null;
  }

  openAddModal(): void {
    this.formData = { fundId: 'sf-1', monthlyAmount: null, startYear: 1403, startMonth: 9, endYear: 1405, endMonth: 8, conditionId: 'sc-1' };
    this.selectedFund = this.savService.fundTypes()[0];
    this.isModalOpen.set(true);
  }

  openAddModalForFund(fundId: string): void {
    const fund = this.savService.fundTypes().find((f: SavingsFundOption) => f.id === fundId);
    if (!fund) return;
    this.formData = { fundId, monthlyAmount: fund.minMonthlyAmount, startYear: 1403, startMonth: 9, endYear: 1405, endMonth: 8, conditionId: 'sc-1' };
    this.selectedFund = fund;
    this.isModalOpen.set(true);
  }

  closeModal(): void { this.isModalOpen.set(false); }
  openDetailModal(mem: SavingsMembership): void { this.detailMem.set(mem); }
  closeDetailModal(): void { this.detailMem.set(null); }

  canSettle(mem: SavingsMembership): boolean {
    return mem.status === 'active';
  }

  openSettlementConfirm(): void {
    const mem = this.detailMem();
    if (!mem) return;
    this.pendingSettlementId = mem.id;
    this.confirmSettlementDialog.set(true);
  }

  cancelSettlement(): void {
    this.confirmSettlementDialog.set(false);
    this.pendingSettlementId = null;
  }

  executeSettlement(): void {
    if (!this.pendingSettlementId) return;
    this.savService.requestSettlement(this.pendingSettlementId);
    this.toastService.show('درخواست تسویه ثبت شد. منتظر تأیید HR باشید.', 'success');
    this.confirmSettlementDialog.set(false);
    this.pendingSettlementId = null;
    const mem = this.detailMem();
    if (mem) {
      const updated = this.memberships().find(m => m.id === mem.id);
      if (updated) this.detailMem.set(updated);
    }
  }

  printDetail(): void {
    window.print();
  }

  saveMembership(): void {
    if (!this.formData.monthlyAmount || this.formData.monthlyAmount <= 0) {
      this.toastService.show('لطفاً مبلغ ماهانه را وارد کنید.', 'error');
      return;
    }
    if (this.selectedFund && (this.formData.monthlyAmount < this.selectedFund.minMonthlyAmount || this.formData.monthlyAmount > this.selectedFund.maxMonthlyAmount)) {
      this.toastService.show(`مبلغ باید بین ${this.formatNum(this.selectedFund.minMonthlyAmount)} تا ${this.formatNum(this.selectedFund.maxMonthlyAmount)} تومان باشد.`, 'error');
      return;
    }
    this.savService.requestMembership({
      fundId: this.formData.fundId,
      monthlyAmount: this.formData.monthlyAmount,
      startYear: this.formData.startYear,
      startMonth: this.formData.startMonth,
      endYear: this.formData.endYear,
      endMonth: this.formData.endMonth,
      conditionId: this.formData.conditionId
    });
    this.toastService.show('درخواست عضویت با موفقیت ثبت شد. در انتظار تأیید.', 'success');
    this.closeModal();
  }

  getDurationProgress(mem: SavingsMembership): number {
    const startMonths = mem.startYear * 12 + mem.startMonth;
    const endMonths = mem.endYear * 12 + mem.endMonth;
    const now = new Date();
    const currentMonths = (now.getFullYear() - 621) * 12 + (now.getMonth() + 1);
    const total = endMonths - startMonths;
    const elapsed = currentMonths - startMonths;
    if (total <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  getFundStatsData(fundId: string) {
    return this.savService.getFundStats(fundId);
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
    const data = this.memberships().map((m: SavingsMembership) => ({
      'صندوق': m.fundTitle, 'وضعیت': this.savService.getStatusLabel(m.status),
      'ماهانه': m.monthlyAmount, 'کل واریزی': m.totalDeposited, 'سود': m.totalInterest,
      'موجودی': m.currentBalance, 'شروع': `${m.startYear}/${String(m.startMonth).padStart(2, '0')}`,
      'خاتمه': `${m.endYear}/${String(m.endMonth).padStart(2, '0')}`,
      'شرایط': m.conditionLabel, 'تاریخ عضویت': m.joinedAt || '-'
    }));
    this.exportService.exportToCSV(data, 'savings-report');
  }
}
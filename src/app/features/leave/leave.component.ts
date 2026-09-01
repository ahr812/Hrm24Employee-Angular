import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { LeaveService, LeaveRequest, LeaveType, LeaveStatus, LeaveDurationUnit } from '../../core/leave/leave.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { ExportService } from '../../core/export/export.service';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [FormsModule, IconComponent, EscToCloseDirective],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-orange-400/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="calendar" [size]="36" class="text-orange-400"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">مدیریت مرخصی</h1>
            <p class="text-lg text-muted">درخواست و پیگیری انواع مرخصی</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            (click)="openAddModal()"
            class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
            <ui-icon name="plus" [size]="20"></ui-icon>
            درخواست مرخصی
          </button>
          <button
            type="button"
            (click)="exportData()"
            class="px-5 py-3 bg-success text-white rounded-xl hover:bg-success/90 transition-colors font-bold flex items-center gap-2 shadow-sm">
            <ui-icon name="download" [size]="20"></ui-icon>
            خروجی
          </button>
        </div>
      </div>

      <!-- Balance Overview -->
      <div class="bg-surface rounded-2xl p-6 border border-border dark:bg-slate-800 dark:border-slate-700">
        <h2 class="text-lg font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
          <ui-icon name="chart" [size]="20" class="text-primary"></ui-icon>
          مانده مرخصی‌ها
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          @for (item of balanceItems(); track item.label) {
            <div class="bg-background rounded-xl p-3 text-center dark:bg-slate-900">
              <p class="text-xs text-muted mb-1">{{ item.label }}</p>
              <p class="text-lg font-bold" [class]="item.remaining > 0 ? 'text-success' : 'text-danger'">
                {{ toFa(item.remaining) }}
              </p>
              <p class="text-[10px] text-muted">از {{ toFa(item.total) }} {{ item.unit }}</p>
            </div>
          }
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ toFa(stats().total) }}</p>
          <p class="text-xs text-muted mt-1">کل درخواست‌ها</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-warning">{{ toFa(stats().pending) }}</p>
          <p class="text-xs text-muted mt-1">در انتظار</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-success">{{ toFa(stats().approved) }}</p>
          <p class="text-xs text-muted mt-1">تأیید شده</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-danger">{{ toFa(stats().rejected) }}</p>
          <p class="text-xs text-muted mt-1">رد شده</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-muted">{{ toFa(stats().cancelled) }}</p>
          <p class="text-xs text-muted mt-1">لغو شده</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
        <div class="flex flex-col md:flex-row gap-3">
          <div class="flex-1">
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              placeholder="جستجو در درخواست‌ها..."
              class="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
          </div>
          <select [(ngModel)]="filterStatus" class="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <option value="all">همه وضعیت‌ها</option>
            <option value="pending">در انتظار تأیید</option>
            <option value="approved">تأیید شده</option>
            <option value="rejected">رد شده</option>
            <option value="cancelled">لغو شده</option>
          </select>
          <select [(ngModel)]="filterType" class="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <option value="all">همه انواع</option>
            <option value="annual-daily">استحقاقی روزانه</option>
            <option value="annual-hourly">استحقاقی ساعتی</option>
            <option value="sick-insurance">استعلاجی (بیمه)</option>
            <option value="sick-employer">استعلاجی (کارفرما)</option>
            <option value="unpaid">بدون حقوق</option>
            <option value="marriage">ازدواج</option>
            <option value="pregnancy">بارداری</option>
            <option value="maternity">زایمان</option>
            <option value="breastfeeding">شیردهی ساعتی</option>
            <option value="funeral">فوت اقوام</option>
            <option value="hajj">سفر حج</option>
            <option value="educational">تحصیلی</option>
            <option value="incentive">تشویقی</option>
          </select>
        </div>
      </div>

      <!-- Requests List -->
      <div class="space-y-4">
        @if (displayedRequests().length === 0) {
          <div class="bg-surface rounded-xl p-12 border border-border text-center dark:bg-slate-800 dark:border-slate-700">
            <ui-icon name="calendar" [size]="64" class="mx-auto mb-4 text-muted opacity-50"></ui-icon>
            <p class="text-lg text-muted mb-2">درخواستی یافت نشد</p>
            <p class="text-sm text-muted">اولین درخواست مرخصی خود را ثبت کنید</p>
          </div>
        }
        @for (request of displayedRequests(); track request.id) {
          <div class="bg-surface rounded-2xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-all duration-300">
            
            <div class="flex items-start justify-between gap-4 mb-2">
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <h3 class="text-lg font-bold text-foreground dark:text-slate-100">{{ leaveService.getLeaveTypeLabel(request.type) }}</h3>
                  <span [class]="getStatusBadgeClass(request.status)" class="px-2.5 py-1 rounded-md text-xs font-bold">
                    {{ leaveService.getStatusLabel(request.status) }}
                  </span>
                  <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-background dark:bg-slate-900 text-muted">
                    {{ toFa(request.durationValue) }} {{ request.durationUnit === 'day' ? 'روز' : 'ساعت' }}
                  </span>
                </div>
                @if (request.reason) {
                  <p class="text-sm text-muted mb-2">علت: {{ request.reason }}</p>
                }
                @if (request.attachmentNote) {
                  <p class="text-xs text-info flex items-center gap-1">
                    <ui-icon name="info" [size]="12"></ui-icon>
                    {{ request.attachmentNote }}
                  </p>
                }
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                @if (request.status === 'pending') {
                  <button type="button" (click)="deleteRequest(request.id)" class="p-2 rounded-lg hover:bg-danger/10 transition-colors" title="حذف">
                    <ui-icon name="trash-2" [size]="18" class="text-muted hover:text-danger"></ui-icon>
                  </button>
                }
                @if (request.status === 'approved') {
                  <button type="button" (click)="cancelRequest(request.id)" class="p-2 rounded-lg hover:bg-danger/10 transition-colors" title="لغو">
                    <ui-icon name="x" [size]="18" class="text-muted hover:text-danger"></ui-icon>
                  </button>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-0">
              <div class="flex items-center gap-2 text-sm">
                <ui-icon name="calendar" [size]="16" class="text-primary flex-shrink-0"></ui-icon>
                <span class="text-muted">
                  {{ toFa(request.startDate) }}
                  @if (request.endDate !== request.startDate) { - {{ toFa(request.endDate) }} }
                </span>
              </div>
              @if (request.durationUnit === 'hour') {
                <div class="flex items-center gap-2 text-sm">
                  <ui-icon name="clock" [size]="16" class="text-primary flex-shrink-0"></ui-icon>
                  <span class="text-muted">{{ toFa(request.startHour) }} - {{ toFa(request.endHour) }}</span>
                </div>
              }
              <div class="flex items-center gap-2 text-sm">
                <ui-icon name="user" [size]="16" class="text-primary flex-shrink-0"></ui-icon>
                <span class="text-muted">تأییدکننده: {{ request.approverName }}</span>
              </div>
            </div>

            @if (request.status === 'rejected' && request.rejectReason) {
              <div class="mt-3 p-3 bg-danger/5 border border-danger/20 rounded-xl">
                <div class="flex items-start gap-2">
                  <ui-icon name="alert-triangle" [size]="16" class="text-danger mt-0.5 flex-shrink-0"></ui-icon>
                  <div>
                    <p class="text-xs font-bold text-danger mb-1">دلیل رد:</p>
                    <p class="text-sm text-foreground dark:text-slate-200">{{ request.rejectReason }}</p>
                  </div>
                </div>
              </div>
            }

          </div>
        }
      </div>

      <!-- Add Leave Modal -->
      @if (isAddModalOpen()) {
        <div 
          appEscToClose
          (escPressed)="closeAddModal()"
          class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" 
          (click)="closeAddModal()">
          <div class="bg-surface w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
            
            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">درخواست مرخصی جدید</h2>
                <button type="button" (click)="closeAddModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="بستن">
                  <ui-icon name="x" [size]="18" class="text-muted"></ui-icon>
                </button>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              
              @if (formData.type && getSelectedBalance(); as bal) {
                <div class="p-2.5 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                  <span class="text-sm text-foreground dark:text-slate-200">مانده قابل استفاده:</span>
                  <span class="font-bold text-primary">{{ toFa(bal.remaining) }} {{ bal.unit }}</span>
                </div>
              }

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">نوع مرخصی *</label>
                  <select [(ngModel)]="formData.type" (ngModelChange)="onTypeChange()" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="">انتخاب کنید...</option>
                    <option value="annual-daily">استحقاقی روزانه</option>
                    <option value="annual-hourly">استحقاقی ساعتی</option>
                    <option value="sick-insurance">استعلاجی (عهده بیمه)</option>
                    <option value="sick-employer">استعلاجی (عهده کارفرما)</option>
                    <option value="unpaid">بدون حقوق</option>
                    <option value="marriage">ازدواج</option>
                    <option value="pregnancy">بارداری</option>
                    <option value="maternity">زایمان</option>
                    <option value="breastfeeding">شیردهی ساعتی</option>
                    <option value="funeral">فوت اقوام درجه یک</option>
                    <option value="hajj">سفر حج</option>
                    <option value="educational">تحصیلی</option>
                    <option value="incentive">تشویقی</option>
                  </select>
                </div>

                @if (currentDurationUnit() === 'hour') {
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">تاریخ *</label>
                    <input type="date" [(ngModel)]="formData.startDate" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr text-sm">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">ساعت شروع *</label>
                    <input type="time" [(ngModel)]="formData.startHour" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr text-sm">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">ساعت پایان *</label>
                    <input type="time" [(ngModel)]="formData.endHour" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr text-sm">
                  </div>
                } @else {
                  <div>
                    <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">تاریخ شروع *</label>
                    <input type="date" [(ngModel)]="formData.startDate" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr text-sm">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">تاریخ پایان *</label>
                    <input type="date" [(ngModel)]="formData.endDate" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr text-sm">
                  </div>
                }

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">علت مرخصی *</label>
                  <textarea [(ngModel)]="formData.reason" rows="2" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="علت درخواست مرخصی را بنویسید..."></textarea>
                </div>

                @if (formData.type && leaveService.requiresAttachment(formData.type)) {
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">
                      توضیحات ضمیمه
                      <span class="text-danger text-xs mr-1">(الزامی)</span>
                    </label>
                    <input type="text" [(ngModel)]="formData.attachmentNote" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="مثال: گواهی پزشک ضمیمه شده است">
                  </div>
                }
              </div>
            </div>

            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex gap-3">
                <button type="button" (click)="closeAddModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">انصراف</button>
                <button type="button" (click)="submitRequest()" class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center justify-center gap-2 text-sm">
                  <ui-icon name="send" [size]="16"></ui-icon>
                  ارسال درخواست
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
export class LeaveComponent {
  leaveService = inject(LeaveService);
  private toastService = inject(ToastService);
  private exportService = inject(ExportService);

  requests = this.leaveService.requests;
  stats = this.leaveService.stats;
  balance = this.leaveService.balance;

  searchQuery = '';
  filterStatus: 'all' | LeaveStatus = 'all';
  filterType: 'all' | LeaveType = 'all';

  isAddModalOpen = signal(false);

  formData = {
    type: '' as LeaveType | '',
    startDate: '',
    endDate: '',
    startHour: '',
    endHour: '',
    reason: '',
    attachmentNote: ''
  };

  balanceItems = computed(() => {
    const b = this.balance();
    return [
      { label: 'استحقاقی روزانه', remaining: b.annualDailyTotal - b.annualDailyUsed, total: b.annualDailyTotal, unit: 'روز' },
      { label: 'استحقاقی ساعتی', remaining: b.annualHourlyTotal - b.annualHourlyUsed, total: b.annualHourlyTotal, unit: 'ساعت' },
      { label: 'استعلاجی (بیمه)', remaining: b.sickInsuranceTotal - b.sickInsuranceUsed, total: b.sickInsuranceTotal, unit: 'روز' },
      { label: 'استعلاجی (کارفرما)', remaining: b.sickEmployerTotal - b.sickEmployerUsed, total: b.sickEmployerTotal, unit: 'روز' },
      { label: 'شیردهی', remaining: b.breastfeedingTotal - b.breastfeedingUsed, total: b.breastfeedingTotal, unit: 'ساعت' },
      { label: 'تشویقی', remaining: b.incentiveTotal - b.incentiveUsed, total: b.incentiveTotal, unit: 'روز' }
    ];
  });

  displayedRequests = computed(() => {
    let result = this.requests();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(r =>
        this.leaveService.getLeaveTypeLabel(r.type).toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    }

    if (this.filterStatus !== 'all') {
      result = result.filter(r => r.status === this.filterStatus);
    }

    if (this.filterType !== 'all') {
      result = result.filter(r => r.type === this.filterType);
    }

    return result;
  });

  currentDurationUnit = computed((): LeaveDurationUnit => {
    if (!this.formData.type) return 'day';
    return this.leaveService.getDurationUnit(this.formData.type as LeaveType);
  });

  openAddModal(): void {
    this.formData = {
      type: '',
      startDate: '',
      endDate: '',
      startHour: '',
      endHour: '',
      reason: '',
      attachmentNote: ''
    };
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }

  onTypeChange(): void {
    this.formData.endDate = this.formData.startDate;
    this.formData.startHour = '';
    this.formData.endHour = '';
    this.formData.attachmentNote = '';
  }

  getSelectedBalance(): { remaining: number; unit: string } | null {
    if (!this.formData.type) return null;
    const type = this.formData.type as LeaveType;
    const unit = this.leaveService.getDurationUnit(type);
    const bal = this.leaveService.getRemainingBalance(type);
    if (bal.total === 0) return null;
    return { remaining: bal.remaining, unit: unit === 'day' ? 'روز' : 'ساعت' };
  }

  submitRequest(): void {
    if (!this.formData.type) {
      this.toastService.show('لطفاً نوع مرخصی را انتخاب کنید.', 'error');
      return;
    }
    if (!this.formData.startDate) {
      this.toastService.show('لطفاً تاریخ شروع را مشخص کنید.', 'error');
      return;
    }
    if (!this.formData.reason.trim()) {
      this.toastService.show('لطفاً علت مرخصی را بنویسید.', 'error');
      return;
    }

    const type = this.formData.type as LeaveType;
    const unit = this.leaveService.getDurationUnit(type);

    if (unit === 'hour') {
      if (!this.formData.startHour || !this.formData.endHour) {
        this.toastService.show('لطفاً ساعت شروع و پایان را مشخص کنید.', 'error');
        return;
      }
      const startMinutes = this.timeToMinutes(this.formData.startHour);
      const endMinutes = this.timeToMinutes(this.formData.endHour);
      if (endMinutes <= startMinutes) {
        this.toastService.show('ساعت پایان باید بعد از ساعت شروع باشد.', 'error');
        return;
      }
      const hours = (endMinutes - startMinutes) / 60;

      this.leaveService.addRequest({
        type,
        status: 'pending',
        startDate: this.formData.startDate,
        endDate: this.formData.startDate,
        startHour: this.formData.startHour,
        endHour: this.formData.endHour,
        durationValue: hours,
        durationUnit: 'hour',
        reason: this.formData.reason,
        attachmentNote: this.formData.attachmentNote,
        requesterId: 'current-user',
        requesterName: 'علی احمدی',
        approverName: 'مهندس رضایی'
      });
    } else {
      if (!this.formData.endDate) {
        this.toastService.show('لطفاً تاریخ پایان را مشخص کنید.', 'error');
        return;
      }
      if (this.formData.endDate < this.formData.startDate) {
        this.toastService.show('تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.', 'error');
        return;
      }

      const days = this.calculateDays(this.formData.startDate, this.formData.endDate);

      this.leaveService.addRequest({
        type,
        status: 'pending',
        startDate: this.formData.startDate,
        endDate: this.formData.endDate,
        startHour: '',
        endHour: '',
        durationValue: days,
        durationUnit: 'day',
        reason: this.formData.reason,
        attachmentNote: this.formData.attachmentNote,
        requesterId: 'current-user',
        requesterName: 'علی احمدی',
        approverName: 'مهندس رضایی'
      });
    }

    this.toastService.show('درخواست مرخصی با موفقیت ثبت شد.', 'success');
    this.closeAddModal();
  }

  deleteRequest(id: string): void {
    this.leaveService.deleteRequest(id);
    this.toastService.show('درخواست حذف شد.', 'success');
  }

  cancelRequest(id: string): void {
    this.leaveService.cancelRequest(id);
    this.toastService.show('درخواست لغو شد.', 'success');
  }

  exportData(): void {
    const exportData = this.displayedRequests().map(r => ({
      'نوع مرخصی': this.leaveService.getLeaveTypeLabel(r.type),
      'وضعیت': this.leaveService.getStatusLabel(r.status),
      'مدت': `${r.durationValue} ${r.durationUnit === 'day' ? 'روز' : 'ساعت'}`,
      'تاریخ شروع': r.startDate,
      'تاریخ پایان': r.endDate,
      'ساعت شروع': r.startHour || '-',
      'ساعت پایان': r.endHour || '-',
      'علت': r.reason,
      'تأییدکننده': r.approverName
    }));

    this.exportService.exportToCSV(exportData, 'leave-report');
  }

  getStatusBadgeClass(status: LeaveStatus): string {
    const map: Record<LeaveStatus, string> = {
      pending: 'bg-warning/10 text-warning',
      approved: 'bg-success/10 text-success',
      rejected: 'bg-danger/10 text-danger',
      cancelled: 'bg-muted/10 text-muted'
    };
    return map[status];
  }

  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private calculateDays(start: string, end: string): number {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  }
}
import { Component, inject, signal, computed, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { MissionService, Mission, MissionType, MissionDuration, MissionStatus, TransportType, AccommodationType, MissionResult } from '../../core/missions/mission.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { ExportService } from '../../core/export/export.service';

// --- Internal Jalali DatePicker Component ---
@Component({
  selector: 'app-jalali-date-picker',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="absolute z-50 mt-2 bg-surface dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl shadow-2xl p-4 w-72 animate-scale-in" 
         [style.top.px]="y" [style.left.px]="x"
         (click)="$event.stopPropagation()">
      
      <!-- Header: Year/Month Nav -->
      <div class="flex items-center justify-between mb-4">
        <button (click)="changeYear(-1)" class="p-1 hover:bg-background rounded"><ui-icon name="chevron-right" [size]="16"></ui-icon></button>
        <div class="flex flex-col items-center cursor-pointer" (click)="toggleMonthPicker()">
          <span class="text-sm font-bold text-primary">{{ toFa(selectedYear) }}</span>
          <span class="text-xs text-muted">{{ getMonthName(selectedMonth) }}</span>
        </div>
        <button (click)="changeYear(1)" class="p-1 hover:bg-background rounded"><ui-icon name="chevron-left" [size]="16"></ui-icon></button>
      </div>

      <!-- Month Picker Overlay -->
      @if (showMonthPicker) {
        <div class="grid grid-cols-3 gap-2 mb-2">
          @for (m of months; track m.value) {
            <button (click)="selectMonth(m.value)" 
                    class="py-2 text-xs rounded-lg hover:bg-primary/10 transition-colors"
                    [class.bg-primary]="selectedMonth === m.value"
                    [class.text-white]="selectedMonth === m.value"
                    [class.text-primary]="selectedMonth !== m.value">
              {{ m.label }}
            </button>
          }
        </div>
      }

      <!-- Days Grid -->
      @if (!showMonthPicker) {
        <div class="grid grid-cols-7 gap-1 text-center text-xs">
          @for (day of weekDays; track day) {
            <span class="text-muted font-bold py-1">{{ day }}</span>
          }
          @for (day of calendarDays; track day.date) {
            <button (click)="selectDay(day.date)" 
                    class="py-1.5 rounded-lg transition-colors relative"
                    [class.bg-primary]="isSelected(day.date)"
                    [class.text-white]="isSelected(day.date)"
                    [class.text-foreground]="!isSelected(day.date) && !day.isOtherMonth"
                    [class.text-muted]="day.isOtherMonth"
                    [class.opacity-50]="day.isOtherMonth">
              {{ toFa(day.day) }}
            </button>
          }
        </div>
      }
      
      <!-- Footer Actions -->
      <div class="flex justify-between mt-4 pt-3 border-t border-border dark:border-slate-700">
        <button (click)="setToday()" class="text-xs text-primary font-bold hover:underline">امروز</button>
        <button (click)="close.emit()" class="text-xs text-muted hover:text-foreground">بستن</button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-scale-in { animation: scale-in 0.2s ease-out; }
  `]
})
export class JalaliDatePickerComponent {
  @Input() x: number = 0;
  @Input() y: number = 0;
  @Input() selectedYear: number = 1403;
  @Input() selectedMonth: number = 1;

  @Output() select = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  showMonthPicker = false;

  months = [
    { value: 1, label: 'فروردین' }, { value: 2, label: 'اردیبهشت' }, { value: 3, label: 'خرداد' },
    { value: 4, label: 'تیر' }, { value: 5, label: 'مرداد' }, { value: 6, label: 'شهریور' },
    { value: 7, label: 'مهر' }, { value: 8, label: 'آبان' }, { value: 9, label: 'آذر' },
    { value: 10, label: 'دی' }, { value: 11, label: 'بهمن' }, { value: 12, label: 'اسفند' }
  ];

  weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  get calendarDays() {
    const days = [];
    const daysInMonth = this.selectedMonth <= 6 ? 31 : (this.selectedMonth === 12 ? 29 : 30);
    const emptySlots = Array(6).fill(null).map((_, i) => ({ date: 0, day: '', isOtherMonth: true }));
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: i, day: i, isOtherMonth: false });
    }
    return [...emptySlots, ...days];
  }

  isSelected(day: number): boolean {
    return false;
  }

  changeYear(delta: number) {
    this.selectedYear += delta;
  }

  toggleMonthPicker() {
    this.showMonthPicker = !this.showMonthPicker;
  }

  selectMonth(m: number) {
    this.selectedMonth = m;
    this.showMonthPicker = false;
  }

  selectDay(d: number) {
    const y = this.selectedYear;
    const m = String(this.selectedMonth).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    this.select.emit(`${y}/${m}/${dStr}`);
  }

  setToday() {
    this.selectedYear = 1403;
    this.selectedMonth = 5;
    this.select.emit('1403/05/20');
  }

  getMonthName(m: number): string {
    return this.months.find(x => x.value === m)?.label || '';
  }

  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }
}

// --- Main Missions Component ---

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [FormsModule, IconComponent, EscToCloseDirective, JalaliDatePickerComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="map-pin" [size]="36" class="text-rose-500"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">مدیریت مأموریت</h1>
            <p class="text-lg text-muted">ثبت درخواست‌های مأموریت اداری و خارجی</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button type="button" (click)="openAddModal()" class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
            <ui-icon name="plus" [size]="20"></ui-icon>
            درخواست مأموریت
          </button>
          <button type="button" (click)="exportData()" class="px-5 py-3 bg-success text-white rounded-xl hover:bg-success/90 transition-colors font-bold flex items-center gap-2 shadow-sm">
            <ui-icon name="download" [size]="20"></ui-icon>
            خروجی
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ toFa(stats().total) }}</p>
          <p class="text-xs text-muted mt-1">کل</p>
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
          <p class="text-2xl font-bold text-info">{{ toFa(stats().inProgress) }}</p>
          <p class="text-xs text-muted mt-1">در حال اجرا</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-primary">{{ toFa(stats().completed) }}</p>
          <p class="text-xs text-muted mt-1">تکمیل شده</p>
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
            <input type="text" [(ngModel)]="searchQuery" placeholder="جستجو در مأموریت‌ها..." class="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
          </div>
          <select [(ngModel)]="filterStatus" class="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <option value="all">همه وضعیت‌ها</option>
            <option value="pending">در انتظار تأیید</option>
            <option value="approved">تأیید شده</option>
            <option value="in-progress">در حال اجرا</option>
            <option value="completed">تکمیل شده</option>
            <option value="rejected">رد شده</option>
            <option value="cancelled">لغو شده</option>
          </select>
          <select [(ngModel)]="filterType" class="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <option value="all">همه انواع</option>
            <option value="internal">داخلی</option>
            <option value="external">خارجی</option>
          </select>
        </div>
      </div>

      <!-- Missions List -->
      <div class="space-y-4">
        @if (displayedMissions().length === 0) {
          <div class="bg-surface rounded-xl p-12 border border-border text-center dark:bg-slate-800 dark:border-slate-700">
            <ui-icon name="map-pin" [size]="64" class="mx-auto mb-4 text-muted opacity-50"></ui-icon>
            <p class="text-lg text-muted mb-2">مأموریتی یافت نشد</p>
            <p class="text-sm text-muted">اولین درخواست مأموریت خود را ثبت کنید</p>
          </div>
        }
        @for (mission of displayedMissions(); track mission.id) {
          <div class="bg-surface rounded-2xl p-6 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-all duration-300">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <h3 class="text-lg font-bold text-foreground dark:text-slate-100">{{ mission.title }}</h3>
                  <span [class]="getStatusBadgeClass(mission.status)" class="px-2.5 py-1 rounded-md text-xs font-bold">{{ missionService.getStatusLabel(mission.status) }}</span>
                  <span [class]="mission.type === 'internal' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'" class="px-2.5 py-1 rounded-md text-xs font-bold">{{ missionService.getTypeLabel(mission.type) }}</span>
                  <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-background dark:bg-slate-900 text-muted">{{ missionService.getDurationLabel(mission.duration) }}</span>
                </div>
                <p class="text-sm text-muted mb-3">{{ mission.description }}</p>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                @if (mission.status === 'approved') {
                  <button type="button" (click)="startMission(mission.id)" class="p-2 rounded-lg hover:bg-success/10 transition-colors" title="شروع مأموریت"><ui-icon name="activity" [size]="18" class="text-success"></ui-icon></button>
                }
                @if (mission.status === 'in-progress') {
                  <button type="button" (click)="openResultModal(mission)" class="p-2 rounded-lg hover:bg-primary/10 transition-colors" title="ثبت نتیجه"><ui-icon name="check-circle" [size]="18" class="text-primary"></ui-icon></button>
                }
                @if (mission.status === 'pending' || mission.status === 'draft') {
                  <button type="button" (click)="deleteMission(mission.id)" class="p-2 rounded-lg hover:bg-danger/10 transition-colors" title="حذف"><ui-icon name="trash-2" [size]="18" class="text-muted hover:text-danger"></ui-icon></button>
                }
                @if (mission.status === 'approved' || mission.status === 'in-progress') {
                  <button type="button" (click)="cancelMission(mission.id)" class="p-2 rounded-lg hover:bg-danger/10 transition-colors" title="لغو"><ui-icon name="x" [size]="18" class="text-muted hover:text-danger"></ui-icon></button>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div class="flex items-center gap-2 text-sm">
                <ui-icon name="map-pin" [size]="16" class="text-primary flex-shrink-0"></ui-icon>
                <span class="text-muted truncate">{{ mission.destination }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <ui-icon name="calendar" [size]="16" class="text-primary flex-shrink-0"></ui-icon>
                <span class="text-muted">
                  {{ toFa(mission.startDate) }}
                  @if (mission.duration !== 'hourly') { تا {{ toFa(mission.endDate) }} }
                </span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <ui-icon name="clock" [size]="16" class="text-primary flex-shrink-0"></ui-icon>
                <span class="text-muted">
                  @if (mission.duration === 'hourly') {
                    <span>{{ toFa(mission.startHour) }} - {{ toFa(mission.endHour) }}</span>
                  } @else {
                    {{ missionService.getDurationLabel(mission.duration) }}
                  }
                </span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <ui-icon name="chart" [size]="16" class="text-primary flex-shrink-0"></ui-icon>
                <span class="text-muted">بودجه: <span class="font-bold text-foreground dark:text-slate-200">{{ missionService.formatCurrency(mission.estimatedBudget) }}</span> تومان</span>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 text-xs text-muted">
              <span class="flex items-center gap-1 bg-background px-2 py-1 rounded dark:bg-slate-900">
                <ui-icon name="users" [size]="12"></ui-icon>
                حمل‌ونقل: {{ missionService.getTransportLabel(mission.transport) }}
              </span>
              @if (mission.accommodation !== 'none') {
                <span class="flex items-center gap-1 bg-background px-2 py-1 rounded dark:bg-slate-900">
                  <ui-icon name="shield" [size]="12"></ui-icon>
                  اسکان: {{ missionService.getAccommodationLabel(mission.accommodation) }}
                </span>
              }
              <span class="flex items-center gap-1 bg-background px-2 py-1 rounded dark:bg-slate-900">
                <ui-icon name="user" [size]="12"></ui-icon>
                تأییدکننده: {{ mission.approverName }}
              </span>
            </div>

            @if (mission.status === 'rejected' && mission.rejectReason) {
              <div class="mt-4 p-3 bg-danger/5 border border-danger/20 rounded-xl">
                <div class="flex items-start gap-2">
                  <ui-icon name="alert-triangle" [size]="16" class="text-danger mt-0.5 flex-shrink-0"></ui-icon>
                  <div>
                    <p class="text-xs font-bold text-danger mb-1">دلیل رد:</p>
                    <p class="text-sm text-foreground dark:text-slate-200">{{ mission.rejectReason }}</p>
                  </div>
                </div>
              </div>
            }

            @if (mission.result) {
              <div class="mt-4 p-4 bg-success/5 border border-success/20 rounded-xl">
                <div class="flex items-center gap-2 mb-2">
                  <ui-icon name="check-circle" [size]="18" class="text-success"></ui-icon>
                  <h4 class="text-sm font-bold text-success">نتیجه مأموریت</h4>
                </div>
                <p class="text-sm text-foreground dark:text-slate-200 mb-2">{{ mission.result.summary }}</p>
                @if (mission.result.achievements.length > 0) {
                  <div class="mb-2">
                    <p class="text-xs font-bold text-muted mb-1">دستاوردها:</p>
                    <ul class="list-disc list-inside text-xs text-foreground dark:text-slate-200 space-y-0.5">
                      @for (achievement of mission.result.achievements; track $index) {
                        <li>{{ achievement }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Add Mission Modal -->
      @if (isAddModalOpen()) {
        <div appEscToClose (escPressed)="closeAddModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeAddModal()">
          <div class="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[80vh] flex flex-col relative" (click)="$event.stopPropagation()">
            
            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">درخواست مأموریت جدید</h2>
                <button type="button" (click)="closeAddModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="بستن">
                  <ui-icon name="x" [size]="18" class="text-muted"></ui-icon>
                </button>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              
              <!-- Date Pickers Container -->
              @if (showStartDatePicker()) {
                <app-jalali-date-picker 
                  [x]="startDateX" [y]="startDateY"
                  [selectedYear]="1403" [selectedMonth]="1"
                  (select)="onStartDateSelect($event)"
                  (close)="showStartDatePicker.set(false)">
                </app-jalali-date-picker>
              }
              @if (showEndDatePicker()) {
                <app-jalali-date-picker 
                  [x]="endDateX" [y]="endDateY"
                  [selectedYear]="1403" [selectedMonth]="1"
                  (select)="onEndDateSelect($event)"
                  (close)="showEndDatePicker.set(false)">
                </app-jalali-date-picker>
              }

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">عنوان مأموریت *</label>
                  <input type="text" [(ngModel)]="formData.title" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="مثال: بازدید از شعبه اصفهان">
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">شرح مأموریت *</label>
                  <textarea [(ngModel)]="formData.description" rows="2" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="توضیحات تکمیلی..."></textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">نوع مأموریت *</label>
                  <select [(ngModel)]="formData.type" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="internal">داخلی</option>
                    <option value="external">خارجی</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">مدت مأموریت *</label>
                  <select [(ngModel)]="formData.duration" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="hourly">ساعتی</option>
                    <option value="daily">روزانه</option>
                    <option value="multi-day">چندروزه</option>
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">مقصد *</label>
                  <input type="text" [(ngModel)]="formData.destination" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="آدرس کامل مقصد">
                </div>
                
                @if (formData.duration === 'hourly') {
                  <div>
                    <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">ساعت شروع *</label>
                    <input type="time" [(ngModel)]="formData.startHour" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr text-sm">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">ساعت پایان *</label>
                    <input type="time" [(ngModel)]="formData.endHour" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr text-sm">
                  </div>
                } @else {
                  <div class="relative">
                    <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">تاریخ شروع *</label>
                    <div class="relative">
                      <input #startDateInput type="text" readonly [(ngModel)]="formData.startDate" 
                             (click)="toggleStartDatePicker($event)"
                             class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm cursor-pointer" 
                             placeholder="انتخاب تاریخ شمسی">
                      <ui-icon name="calendar" [size]="16" class="absolute left-3 top-3 text-muted pointer-events-none"></ui-icon>
                    </div>
                  </div>
                  <div class="relative">
                    <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">تاریخ پایان *</label>
                    <div class="relative">
                      <input #endDateInput type="text" readonly [(ngModel)]="formData.endDate" 
                             (click)="toggleEndDatePicker($event)"
                             class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm cursor-pointer" 
                             placeholder="انتخاب تاریخ شمسی">
                      <ui-icon name="calendar" [size]="16" class="absolute left-3 top-3 text-muted pointer-events-none"></ui-icon>
                    </div>
                  </div>
                }

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">هدف مأموریت *</label>
                  <textarea [(ngModel)]="formData.purpose" rows="2" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="هدف اصلی این مأموریت چیست؟"></textarea>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">نتایج مورد انتظار</label>
                  <textarea [(ngModel)]="formData.expectedOutcomes" rows="2" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="چه نتایجی انتظار دارید؟"></textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">وسیله نقلیه</label>
                  <select [(ngModel)]="formData.transport" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="personal-car">خودرو شخصی</option>
                    <option value="company-car">خودرو سازمانی</option>
                    <option value="taxi">تاکسی / اسنپ</option>
                    <option value="bus">اتوبوس</option>
                    <option value="train">قطار</option>
                    <option value="plane">هواپیما</option>
                    <option value="other">سایر</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">اسکان</label>
                  <select [(ngModel)]="formData.accommodation" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="none">بدون اسکان</option>
                    <option value="hotel">هتل</option>
                    <option value="guest-house">مهمانسرا</option>
                    <option value="relative">اقوام / آشنا</option>
                    <option value="other">سایر</option>
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">بودجه تخمینی (تومان) *</label>
                  <input type="number" [(ngModel)]="formData.estimatedBudget" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr text-sm" placeholder="0">
                </div>
              </div>
            </div>

            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex gap-3">
                <button type="button" (click)="closeAddModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">انصراف</button>
                <button type="button" (click)="submitMission()" class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center justify-center gap-2 text-sm">
                  <ui-icon name="send" [size]="16"></ui-icon>
                  ارسال درخواست
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Result Modal -->
      @if (resultMission()) {
        <div appEscToClose (escPressed)="closeResultModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeResultModal()">
          <div class="bg-surface w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1 ml-3">
                  <h2 class="text-lg font-bold text-foreground dark:text-slate-100">ثبت نتیجه مأموریت</h2>
                  <p class="text-xs text-muted mt-0.5 truncate">{{ resultMission()!.title }}</p>
                </div>
                <button type="button" (click)="closeResultModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700 flex-shrink-0" aria-label="بستن">
                  <ui-icon name="x" [size]="18" class="text-muted"></ui-icon>
                </button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">خلاصه نتیجه *</label>
                <textarea [(ngModel)]="resultForm.summary" rows="2" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="خلاصه‌ای از نتایج مأموریت..."></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">دستاوردها (هر خط یک مورد)</label>
                <textarea [(ngModel)]="resultForm.achievementsText" rows="2" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="دستاورد اول&#10;دستاورد دوم"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">مشکلات (هر خط یک مورد)</label>
                <textarea [(ngModel)]="resultForm.issuesText" rows="2" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="مشکل اول&#10;مشکل دوم"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">اقدامات پیگیری (هر خط یک مورد)</label>
                <textarea [(ngModel)]="resultForm.followUpText" rows="2" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="اقدام اول&#10;اقدام دوم"></textarea>
              </div>
            </div>
            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex gap-3">
                <button type="button" (click)="closeResultModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">انصراف</button>
                <button type="button" (click)="submitResult()" class="flex-1 py-2.5 bg-success text-white rounded-xl hover:bg-success/90 transition-colors font-bold flex items-center justify-center gap-2 text-sm">
                  <ui-icon name="check-circle" [size]="16"></ui-icon>
                  ثبت نتیجه
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
export class MissionsComponent {
  missionService = inject(MissionService);
  private toastService = inject(ToastService);
  private exportService = inject(ExportService);

  missions = this.missionService.missions;
  stats = this.missionService.stats;

  searchQuery = '';
  filterStatus: 'all' | MissionStatus = 'all';
  filterType: 'all' | MissionType = 'all';

  isAddModalOpen = signal(false);
  resultMission = signal<Mission | null>(null);

  // Date Picker State
  showStartDatePicker = signal(false);
  showEndDatePicker = signal(false);
  startDateX = 0;
  startDateY = 0;
  endDateX = 0;
  endDateY = 0;

  @ViewChild('startDateInput') startDateInputRef!: ElementRef;
  @ViewChild('endDateInput') endDateInputRef!: ElementRef;

  formData = {
    title: '',
    description: '',
    type: 'internal' as MissionType,
    duration: 'daily' as MissionDuration,
    destination: '',
    startDate: '',
    endDate: '',
    startHour: '',
    endHour: '',
    purpose: '',
    expectedOutcomes: '',
    transport: 'company-car' as TransportType,
    accommodation: 'none' as AccommodationType,
    estimatedBudget: 0
  };

  resultForm = {
    summary: '',
    achievementsText: '',
    issuesText: '',
    followUpText: ''
  };

  displayedMissions = computed(() => {
    let result = this.missions();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.destination.toLowerCase().includes(q)
      );
    }
    if (this.filterStatus !== 'all') result = result.filter(m => m.status === this.filterStatus);
    if (this.filterType !== 'all') result = result.filter(m => m.type === this.filterType);
    return result;
  });

  openAddModal(): void {
    this.formData = {
      title: '', description: '', type: 'internal', duration: 'daily',
      destination: '', startDate: '', endDate: '', startHour: '', endHour: '',
      purpose: '', expectedOutcomes: '', transport: 'company-car',
      accommodation: 'none', estimatedBudget: 0
    };
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
    this.showStartDatePicker.set(false);
    this.showEndDatePicker.set(false);
  }

  // Date Picker Handlers
  toggleStartDatePicker(event: MouseEvent): void {
    event.stopPropagation();
    this.startDateX = 0;
    this.startDateY = 40;
    this.showStartDatePicker.set(true);
    this.showEndDatePicker.set(false);
  }

  toggleEndDatePicker(event: MouseEvent): void {
    event.stopPropagation();
    this.endDateX = 0;
    this.endDateY = 40;
    this.showEndDatePicker.set(true);
    this.showStartDatePicker.set(false);
  }

  onStartDateSelect(date: string): void {
    this.formData.startDate = date;
    this.showStartDatePicker.set(false);
  }

  onEndDateSelect(date: string): void {
    this.formData.endDate = date;
    this.showEndDatePicker.set(false);
  }

  submitMission(): void {
    if (!this.formData.title.trim() || !this.formData.destination.trim() || !this.formData.purpose.trim()) {
      this.toastService.show('لطفاً فیلدهای الزامی را پر کنید.', 'error');
      return;
    }
    if (this.formData.duration !== 'hourly' && (!this.formData.startDate || !this.formData.endDate)) {
      this.toastService.show('لطفاً تاریخ شروع و پایان را مشخص کنید.', 'error');
      return;
    }
    if (this.formData.duration === 'hourly' && (!this.formData.startHour || !this.formData.endHour)) {
      this.toastService.show('لطفاً ساعت شروع و پایان را مشخص کنید.', 'error');
      return;
    }
    if (this.formData.estimatedBudget <= 0) {
      this.toastService.show('لطفاً بودجه تخمینی را وارد کنید.', 'error');
      return;
    }

    this.missionService.addMission({
      ...this.formData,
      status: 'pending',
      requesterId: 'current-user',
      requesterName: 'علی احمدی',
      approverName: 'مهندس رضایی'
    });
    this.toastService.show('درخواست مأموریت با موفقیت ثبت شد.', 'success');
    this.closeAddModal();
  }

  deleteMission(id: string): void {
    this.missionService.deleteMission(id);
    this.toastService.show('مأموریت حذف شد.', 'success');
  }

  startMission(id: string): void {
    this.missionService.startMission(id);
    this.toastService.show('مأموریت آغاز شد. موفق باشید!', 'success');
  }

  cancelMission(id: string): void {
    this.missionService.cancelMission(id);
    this.toastService.show('مأموریت لغو شد.', 'success');
  }

  openResultModal(mission: Mission): void {
    this.resultMission.set(mission);
    this.resultForm = { summary: '', achievementsText: '', issuesText: '', followUpText: '' };
  }

  closeResultModal(): void {
    this.resultMission.set(null);
  }

  submitResult(): void {
    if (!this.resultForm.summary.trim()) {
      this.toastService.show('لطفاً خلاصه نتیجه را بنویسید.', 'error');
      return;
    }
    const mission = this.resultMission();
    if (!mission) return;

    const result: MissionResult = {
      summary: this.resultForm.summary,
      achievements: this.resultForm.achievementsText.split('\n').filter(l => l.trim()),
      issues: this.resultForm.issuesText.split('\n').filter(l => l.trim()),
      followUpActions: this.resultForm.followUpText.split('\n').filter(l => l.trim()),
      submittedAt: new Date().toISOString()
    };

    this.missionService.completeMission(mission.id, result);
    this.toastService.show('نتیجه مأموریت با موفقیت ثبت شد.', 'success');
    this.closeResultModal();
  }

  exportData(): void {
    const exportData = this.displayedMissions().map(m => ({
      'عنوان': m.title,
      'نوع': this.missionService.getTypeLabel(m.type),
      'مدت': this.missionService.getDurationLabel(m.duration),
      'وضعیت': this.missionService.getStatusLabel(m.status),
      'مقصد': m.destination,
      'تاریخ شروع': m.startDate,
      'تاریخ پایان': m.endDate,
      'بودجه تخمینی': m.estimatedBudget,
      'حمل‌ونقل': this.missionService.getTransportLabel(m.transport),
      'اسکان': this.missionService.getAccommodationLabel(m.accommodation),
      'تأییدکننده': m.approverName
    }));
    this.exportService.exportToCSV(exportData, 'missions-report');
  }

  getStatusBadgeClass(status: MissionStatus): string {
    const map: Record<MissionStatus, string> = {
      draft: 'bg-muted/10 text-muted',
      pending: 'bg-warning/10 text-warning',
      approved: 'bg-success/10 text-success',
      rejected: 'bg-danger/10 text-danger',
      'in-progress': 'bg-info/10 text-info',
      completed: 'bg-primary/10 text-primary',
      cancelled: 'bg-muted/10 text-muted'
    };
    return map[status];
  }

  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }
}
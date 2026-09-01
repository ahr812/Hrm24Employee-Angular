import { Component, inject, signal, computed, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ReminderService, Reminder, ReminderPriority, ReminderRepeat } from '../../core/reminders/reminder.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { ExportService } from '../../core/export/export.service';
import { IranLocalizationService } from '../../core/localization/iran-localization.service';

// ── Internal Jalali DatePicker for Reminders ──
@Component({
    selector: 'app-reminder-jalali-picker',
    standalone: true,
    imports: [IconComponent],
    template: `
    <div class="absolute z-50 mt-2 bg-surface dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl shadow-2xl p-4 w-72 animate-scale-in"
         [style.top.px]="y" [style.left.px]="x"
         (click)="$event.stopPropagation()">
      <div class="flex items-center justify-between mb-4">
        <button (click)="changeYear(-1)" class="p-1 hover:bg-background rounded"><ui-icon name="chevron-right" [size]="16"></ui-icon></button>
        <div class="flex flex-col items-center cursor-pointer" (click)="toggleMonthPicker()">
          <span class="text-sm font-bold text-primary">{{ toFa(selectedYear) }}</span>
          <span class="text-xs text-muted">{{ getMonthName(selectedMonth) }}</span>
        </div>
        <button (click)="changeYear(1)" class="p-1 hover:bg-background rounded"><ui-icon name="chevron-left" [size]="16"></ui-icon></button>
      </div>
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
      <div class="flex justify-between mt-4 pt-3 border-t border-border dark:border-slate-700">
        <button (click)="setToday()" class="text-xs text-primary font-bold hover:underline">امروز</button>
        <button (click)="onClose()" class="text-xs text-muted hover:text-foreground">بستن</button>
      </div>
    </div>
  `,
    styles: [`@keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-scale-in { animation: scale-in 0.2s ease-out; }`]
})
export class ReminderJalaliPickerComponent {
    @Input() x: number = 0;
    @Input() y: number = 0;
    @Input() selectedYear: number = 1404;
    @Input() selectedMonth: number = 1;

    @Output() select = new EventEmitter<string>();
    @Output() close = new EventEmitter<void>();

    selectedDay: number | null = null;
    showMonthPicker = false;

    months = [
        { value: 1, label: 'فروردین' }, { value: 2, label: 'اردیبهشت' }, { value: 3, label: 'خرداد' },
        { value: 4, label: 'تیر' }, { value: 5, label: 'مرداد' }, { value: 6, label: 'شهریور' },
        { value: 7, label: 'مهر' }, { value: 8, label: 'آبان' }, { value: 9, label: 'آذر' },
        { value: 10, label: 'دی' }, { value: 11, label: 'بهمن' }, { value: 12, label: 'اسفند' }
    ];
    weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    get calendarDays() {
        const days: { date: number; day: number | string; isOtherMonth: boolean }[] = [];
        const daysInMonth = this.selectedMonth <= 6 ? 31 : (this.selectedMonth === 12 ? 29 : 30);
        const emptySlots = Array(6).fill(null).map(() => ({ date: 0, day: '' as string | number, isOtherMonth: true }));
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: i, day: i, isOtherMonth: false });
        }
        return [...emptySlots, ...days];
    }

    isSelected(day: number): boolean { return this.selectedDay === day; }
    changeYear(delta: number) { this.selectedYear += delta; }
    toggleMonthPicker() { this.showMonthPicker = !this.showMonthPicker; }
    selectMonth(m: number) { this.selectedMonth = m; this.showMonthPicker = false; }
    selectDay(d: number) {
        this.selectedDay = d;
        const y = this.selectedYear;
        const m = String(this.selectedMonth).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        this.select.emit(`${y}/${m}/${dStr}`);
    }
    setToday() { this.selectedYear = 1404; this.selectedMonth = 5; this.select.emit('1404/05/20'); }
    onClose() { this.close.emit(); }
    getMonthName(m: number): string { return this.months.find(x => x.value === m)?.label || ''; }
    toFa(num: number | string): string { return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]); }
}

// ── Main Reminders Component ──
@Component({
    selector: 'app-reminders',
    standalone: true,
    imports: [CommonModule, FormsModule, IconComponent, EscToCloseDirective, ReminderJalaliPickerComponent],
    template: `
        <div class="max-w-[95%] mx-auto space-y-6 animate-fade-in-up">

            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                        <ui-icon name="bell" [size]="36" class="text-amber-400"></ui-icon>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-primary mb-1">یادآورها</h1>
                        <p class="text-lg text-muted">یادآوری رویدادهای مهم</p>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button
                        (click)="openAddModal()"
                        class="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20">
                        <ui-icon name="plus" [size]="18"></ui-icon>
                        یادآور جدید
                    </button>
                    <button
                        (click)="exportData()"
                        class="px-4 py-2.5 bg-success text-white rounded-xl hover:bg-success/90 transition-colors font-bold text-sm flex items-center gap-2 shadow-sm">
                        <ui-icon name="download" [size]="18"></ui-icon>
                        خروجی
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-3 border border-border dark:border-slate-700">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[10px] font-medium text-muted">کل</span>
                        <ui-icon name="bell" [size]="16" class="text-primary"></ui-icon>
                    </div>
                    <p class="text-xl font-bold text-foreground dark:text-slate-100">{{ toFa(stats().total) }}</p>
                </div>
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-3 border border-border dark:border-slate-700">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[10px] font-medium text-muted">در انتظار</span>
                        <ui-icon name="clock" [size]="16" class="text-amber-500"></ui-icon>
                    </div>
                    <p class="text-xl font-bold text-amber-500">{{ toFa(stats().pending) }}</p>
                </div>
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-3 border border-border dark:border-slate-700">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[10px] font-medium text-muted">امروز</span>
                        <ui-icon name="calendar" [size]="16" class="text-blue-500"></ui-icon>
                    </div>
                    <p class="text-xl font-bold text-blue-500">{{ toFa(stats().today) }}</p>
                </div>
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-3 border border-border dark:border-slate-700">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[10px] font-medium text-muted">اولویت بالا</span>
                        <ui-icon name="flag" [size]="16" class="text-red-500"></ui-icon>
                    </div>
                    <p class="text-xl font-bold text-red-500">{{ toFa(stats().highPriority) }}</p>
                </div>
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-3 border border-border dark:border-slate-700">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[10px] font-medium text-muted">تکمیل شده</span>
                        <ui-icon name="check-circle" [size]="16" class="text-emerald-500"></ui-icon>
                    </div>
                    <p class="text-xl font-bold text-emerald-500">{{ toFa(stats().completed) }}</p>
                </div>
            </div>

            <!-- Filters -->
            <div class="bg-surface dark:bg-slate-800 rounded-xl p-3 border border-border dark:border-slate-700">
                <div class="flex flex-col md:flex-row gap-2">
                    <div class="flex-1 relative">
                        <ui-icon name="search" [size]="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                        <input
                            type="text"
                            [(ngModel)]="searchQuery"
                            placeholder="جستجو..."
                            class="w-full pr-9 pl-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                    </div>
                    <select [(ngModel)]="filterStatus" class="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                        <option value="all">همه</option>
                        <option value="pending">در انتظار</option>
                        <option value="completed">تکمیل شده</option>
                    </select>
                    <select [(ngModel)]="filterPriority" class="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                        <option value="all">همه اولویت‌ها</option>
                        <option value="high">بالا</option>
                        <option value="medium">متوسط</option>
                        <option value="low">پایین</option>
                    </select>
                </div>
            </div>

            <!-- Reminders List -->
            <div class="space-y-2">
                @if (displayedReminders().length === 0) {
                    <div class="bg-surface dark:bg-slate-800 rounded-xl p-10 border border-dashed border-border dark:border-slate-700 text-center">
                        <ui-icon name="bell" [size]="48" class="mx-auto mb-3 text-muted opacity-40"></ui-icon>
                        <p class="text-sm text-muted mb-3">یادآوری یافت نشد</p>
                        <button (click)="openAddModal()" class="px-5 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover transition-colors">
                            افزودن یادآور
                        </button>
                    </div>
                }
                @for (reminder of displayedReminders(); track reminder.id) {
                    <div
                        class="bg-surface dark:bg-slate-800 rounded-xl p-4 border transition-all duration-200 hover:shadow-md dark:border-slate-700"
                        [class]="reminder.isCompleted ? 'opacity-50 border-slate-200 dark:border-slate-800' : 'border-border'">

                        <div class="flex items-start gap-3">
                            <!-- Checkbox -->
                            <button
                                (click)="toggleComplete(reminder.id)"
                                class="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 cursor-pointer"
                                [class]="reminder.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500'"
                                [attr.title]="reminder.isCompleted ? 'علامت‌گذاری به عنوان ناتمام' : 'علامت‌گذاری به عنوان تکمیل شده'">
                                <ui-icon name="check" [size]="12"></ui-icon>
                            </button>

                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <div class="flex items-start justify-between gap-2 mb-1">
                                    <h3 class="text-sm font-bold truncate"
                                        [class]="reminder.isCompleted ? 'text-muted line-through' : 'text-foreground dark:text-slate-100'">
                                        {{ reminder.title }}
                                    </h3>
                                    <div class="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            (click)="openEditModal(reminder)"
                                            class="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors"
                                            title="ویرایش">
                                            <ui-icon name="edit" [size]="14"></ui-icon>
                                        </button>
                                        <button
                                            (click)="deleteReminder(reminder.id)"
                                            class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted hover:text-red-500 transition-colors"
                                            title="حذف">
                                            <ui-icon name="trash-2" [size]="14"></ui-icon>
                                        </button>
                                    </div>
                                </div>

                                @if (reminder.description) {
                                    <p class="text-xs text-muted mb-2 line-clamp-2">{{ reminder.description }}</p>
                                }

                                <div class="flex flex-wrap items-center gap-1.5">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold" [class]="getPriorityBadgeClass(reminder.priority)">
                                        {{ reminderService.getPriorityLabel(reminder.priority) }}
                                    </span>

                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-muted flex items-center gap-1">
                                        <ui-icon name="calendar" [size]="10"></ui-icon>
                                        {{ toFa(reminderService.formatDate(reminder.date)) }}
                                    </span>

                                    @if (reminder.time) {
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-muted">
                                            {{ toFa(reminder.time) }}
                                        </span>
                                    }

                                    @if (reminder.repeat !== 'none') {
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                            {{ reminderService.getRepeatLabel(reminder.repeat) }}
                                        </span>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div>

            <!-- Add/Edit Modal -->
            @if (isModalOpen()) {
                <div
                    appEscToClose
                    (escPressed)="closeModal()"
                    class="fixed inset-0 z-50 flex items-start justify-center pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    (click)="closeModal()">
                    <div
                        class="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border dark:border-slate-700 animate-scale-in max-h-[85vh] flex flex-col relative"
                        (click)="$event.stopPropagation()">

                        <!-- Jalali Date Picker Popup -->
                        @if (showDatePicker()) {
                            <app-reminder-jalali-picker
                                [x]="0" [y]="40"
                                [selectedYear]="pickerYear"
                                [selectedMonth]="pickerMonth"
                                (select)="onDateSelect($event)"
                                (close)="showDatePicker.set(false)">
                            </app-reminder-jalali-picker>
                        }

                        <div class="p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
                            <div class="flex items-center justify-between">
                                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">
                                    {{ editingReminderId ? 'ویرایش یادآور' : 'یادآور جدید' }}
                                </h2>
                                <button (click)="closeModal()" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <ui-icon name="x" [size]="18" class="text-muted"></ui-icon>
                                </button>
                            </div>
                        </div>

                        <div class="flex-1 overflow-y-auto p-5 space-y-3">
                            <div>
                                <label class="block text-xs font-bold text-muted mb-1">عنوان *</label>
                                <input
                                    type="text"
                                    [(ngModel)]="formData.title"
                                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                                    placeholder="مثال: جلسه با مدیر">
                            </div>

                            <div>
                                <label class="block text-xs font-bold text-muted mb-1">توضیحات</label>
                                <textarea
                                    [(ngModel)]="formData.description"
                                    rows="2"
                                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                                    placeholder="جزئیات یادآور..."></textarea>
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div class="relative">
                                    <label class="block text-xs font-bold text-muted mb-1">تاریخ *</label>
                                    <div class="relative">
                                        <input type="text" readonly [(ngModel)]="formData.date"
                                               (click)="toggleDatePicker($event)"
                                               class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 cursor-pointer"
                                               placeholder="انتخاب تاریخ شمسی">
                                        <ui-icon name="calendar" [size]="16" class="absolute left-3 top-3 text-muted pointer-events-none"></ui-icon>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-muted mb-1">ساعت</label>
                                    <input
                                        type="time"
                                        [(ngModel)]="formData.time"
                                        class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr">
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-bold text-muted mb-1">اولویت</label>
                                    <select
                                        [(ngModel)]="formData.priority"
                                        class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                        <option value="low">پایین</option>
                                        <option value="medium">متوسط</option>
                                        <option value="high">بالا</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-muted mb-1">تکرار</label>
                                    <select
                                        [(ngModel)]="formData.repeat"
                                        class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                        <option value="none">بدون تکرار</option>
                                        <option value="daily">روزانه</option>
                                        <option value="weekly">هفتگی</option>
                                        <option value="monthly">ماهانه</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
                            <div class="flex gap-3">
                                <button (click)="closeModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200">
                                    انصراف
                                </button>
                                <button (click)="saveReminder()" class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-sm">
                                    {{ editingReminderId ? 'ذخیره تغییرات' : 'افزودن' }}
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
export class RemindersComponent {
    reminderService = inject(ReminderService);
    private toastService = inject(ToastService);
    private exportService = inject(ExportService);
    protected loc = inject(IranLocalizationService);

    reminders = this.reminderService.reminders;
    stats = this.reminderService.stats;

    searchQuery = '';
    filterStatus: 'all' | 'pending' | 'completed' = 'all';
    filterPriority: 'all' | ReminderPriority = 'all';

    isModalOpen = signal(false);
    editingReminderId: string | null = null;
    showDatePicker = signal(false);
    pickerYear = 1404;
    pickerMonth = 1;

    formData = {
        title: '',
        description: '',
        date: '',
        time: '',
        priority: 'medium' as ReminderPriority,
        repeat: 'none' as ReminderRepeat
    };

    displayedReminders = computed(() => {
        let result = this.reminders();

        if (this.searchQuery.trim()) {
            const q = this.searchQuery.trim().toLowerCase();
            result = result.filter(r =>
                r.title.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q)
            );
        }

        if (this.filterStatus === 'pending') {
            result = result.filter(r => !r.isCompleted);
        } else if (this.filterStatus === 'completed') {
            result = result.filter(r => r.isCompleted);
        }

        if (this.filterPriority !== 'all') {
            result = result.filter(r => r.priority === this.filterPriority);
        }

        return result.sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    });

    openAddModal(): void {
        this.editingReminderId = null;
        const today = new Date().toLocaleDateString('fa-IR');
        this.formData = {
            title: '',
            description: '',
            date: today,
            time: '',
            priority: 'medium',
            repeat: 'none'
        };
        // Parse today for picker defaults
        const parts = today.split('/').map(p => parseInt(p.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())));
        this.pickerYear = parts[0] || 1404;
        this.pickerMonth = parts[1] || 1;
        this.showDatePicker.set(false);
        this.isModalOpen.set(true);
    }

    openEditModal(reminder: Reminder): void {
        this.editingReminderId = reminder.id;
        this.formData = {
            title: reminder.title,
            description: reminder.description,
            date: reminder.date,
            time: reminder.time,
            priority: reminder.priority,
            repeat: reminder.repeat
        };
        // Parse existing date for picker defaults
        if (reminder.date) {
            const parts = reminder.date.split('/');
            if (parts.length === 3) {
                this.pickerYear = parseInt(parts[0].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())) || 1404;
                this.pickerMonth = parseInt(parts[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())) || 1;
            }
        }
        this.showDatePicker.set(false);
        this.isModalOpen.set(true);
    }

    closeModal(): void {
        this.isModalOpen.set(false);
        this.editingReminderId = null;
        this.showDatePicker.set(false);
    }

    toggleDatePicker(event: MouseEvent): void {
        event.stopPropagation();
        this.showDatePicker.update(v => !v);
    }

    onDateSelect(date: string): void {
        this.formData.date = date;
        this.showDatePicker.set(false);
    }

    saveReminder(): void {
        if (!this.formData.title.trim() || !this.formData.date) {
            this.toastService.show('عنوان و تاریخ الزامی هستند.', 'error');
            return;
        }

        if (this.editingReminderId) {
            this.reminderService.updateReminder(this.editingReminderId, {
                title: this.formData.title,
                description: this.formData.description,
                date: this.formData.date,
                time: this.formData.time,
                priority: this.formData.priority,
                repeat: this.formData.repeat
            });
            this.toastService.show('یادآور ویرایش شد.', 'success');
        } else {
            this.reminderService.addReminder({ ...this.formData });
            this.toastService.show('یادآور اضافه شد.', 'success');
        }

        this.closeModal();
    }

    deleteReminder(id: string): void {
        this.reminderService.deleteReminder(id);
        this.toastService.show('یادآور حذف شد.', 'success');
    }

    toggleComplete(id: string): void {
        this.reminderService.toggleComplete(id);
    }

    getPriorityBadgeClass(priority: ReminderPriority): string {
        if (priority === 'high') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        if (priority === 'medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }

    exportData(): void {
        const exportData = this.displayedReminders().map(r => ({
            'عنوان': r.title,
            'توضیحات': r.description,
            'تاریخ': r.date,
            'ساعت': r.time || '-',
            'اولویت': this.reminderService.getPriorityLabel(r.priority),
            'تکرار': this.reminderService.getRepeatLabel(r.repeat),
            'وضعیت': r.isCompleted ? 'تکمیل شده' : 'در انتظار'
        }));

        this.exportService.exportToCSV(exportData, 'reminders-report');
    }

    toFa(num: number | string): string {
        return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
    }
}
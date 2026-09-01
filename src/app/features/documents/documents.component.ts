import { Component, inject, signal, computed, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { DocumentService, AppDocument, DocumentCategory, DocumentStatus } from '../../core/documents/document.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { ExportService } from '../../core/export/export.service';

// ── Internal Jalali DatePicker for Documents ──
@Component({
  selector: 'app-doc-jalali-picker',
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
export class DocJalaliPickerComponent {
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

// ── Main Documents Component ──
@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [FormsModule, IconComponent, EscToCloseDirective, DocJalaliPickerComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="save" [size]="36" class="text-violet-500"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">مدیریت اسناد</h1>
            <p class="text-lg text-muted">ارسال مدارک و مستندات</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            (click)="openAddModal()"
            class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
            <ui-icon name="plus" [size]="20"></ui-icon>
            ارسال فایل
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

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ toFa(stats().total) }}</p>
          <p class="text-xs text-muted mt-1">کل اسناد</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-success">{{ toFa(stats().active) }}</p>
          <p class="text-xs text-muted mt-1">فعال</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-danger">{{ toFa(stats().expired) }}</p>
          <p class="text-xs text-muted mt-1">منقضی</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-warning">{{ toFa(stats().expiringSoon) }}</p>
          <p class="text-xs text-muted mt-1">نزدیک انقضا</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-info">{{ toFa(stats().pendingReview) }}</p>
          <p class="text-xs text-muted mt-1">در انتظار بررسی</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
        <div class="flex flex-col md:flex-row gap-3">
          <div class="flex-1">
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              placeholder="جستجو در اسناد..."
              class="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
          </div>
          <select [(ngModel)]="filterCategory" class="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <option value="all">همه دسته‌ها</option>
            <option value="contract">قرارداد</option>
            <option value="certificate">گواهینامه</option>
            <option value="payslip">فیش حقوقی</option>
            <option value="identity">مدارک هویتی</option>
            <option value="medical">پزشکی</option>
            <option value="educational">تحصیلی</option>
            <option value="other">سایر</option>
          </select>
          <select [(ngModel)]="filterStatus" class="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="expired">منقضی</option>
            <option value="pending-review">در انتظار بررسی</option>
          </select>
        </div>
      </div>

      <!-- Documents List -->
      <div class="space-y-3">
        @if (displayedDocuments().length === 0) {
          <div class="bg-surface rounded-xl p-12 border border-border text-center dark:bg-slate-800 dark:border-slate-700">
            <ui-icon name="save" [size]="64" class="mx-auto mb-4 text-muted opacity-50"></ui-icon>
            <p class="text-lg text-muted mb-2">سندی یافت نشد</p>
            <p class="text-sm text-muted">اولین سند خود را آپلود کنید</p>
          </div>
        }
        @for (doc of displayedDocuments(); track doc.id) {
          <div class="bg-surface rounded-xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-4 flex-1 min-w-0">
                <div [class]="getFileIconClass(doc.category)" class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ui-icon [name]="getFileIcon(doc.category)" [size]="24"></ui-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 class="text-base font-bold text-foreground dark:text-slate-100 truncate">{{ doc.title }}</h3>
                    <span [class]="getStatusBadgeClass(doc.status)" class="px-2 py-0.5 rounded-md text-xs font-bold flex-shrink-0">
                      {{ docService.getStatusLabel(doc.status) }}
                    </span>
                    <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-background dark:bg-slate-900 text-muted flex-shrink-0">
                      {{ docService.getCategoryLabel(doc.category) }}
                    </span>
                  </div>
                  @if (doc.description) {
                    <p class="text-sm text-muted mb-2 truncate">{{ doc.description }}</p>
                  }
                  <div class="flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span class="flex items-center gap-1">
                      <ui-icon name="save" [size]="12"></ui-icon>
                      {{ doc.fileName }}
                    </span>
                    <span class="flex items-center gap-1">
                      <ui-icon name="chart" [size]="12"></ui-icon>
                      {{ docService.formatFileSize(doc.fileSize) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <ui-icon name="calendar" [size]="12"></ui-icon>
                      <span>{{ toFa(doc.uploadDate) }}</span>
                    </span>
                    @if (doc.expiryDate) {
                      <span [class]="getExpiryClass(doc)" class="flex items-center gap-1">
                        <ui-icon name="clock" [size]="12"></ui-icon>
                        <span>{{ toFa(doc.expiryDate) }}</span>
                        @if (getDaysUntilExpiry(doc); as days) {
                          @if (days > 0 && days <= 30) {
                            <span>({{ toFa(days) }} روز مانده)</span>
                          } @else if (days <= 0) {
                            <span>(منقضی)</span>
                          }
                        }
                      </span>
                    }
                  </div>
                  @if (doc.tags.length > 0) {
                    <div class="flex flex-wrap gap-1.5 mt-2">
                      @for (tag of doc.tags; track tag) {
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary">{{ tag }}</span>
                      }
                    </div>
                  }
                </div>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button 
                  type="button"
                  (click)="downloadDocument(doc)"
                  class="p-2 rounded-lg hover:bg-success/10 transition-colors"
                  title="دانلود فایل">
                  <ui-icon name="download" [size]="16" class="text-muted hover:text-success"></ui-icon>
                </button>
                <button 
                  type="button"
                  (click)="deleteDocument(doc.id)"
                  class="p-2 rounded-lg hover:bg-danger/10 transition-colors"
                  aria-label="حذف">
                  <ui-icon name="trash-2" [size]="16" class="text-muted hover:text-danger"></ui-icon>
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Add Document Modal -->
      @if (isModalOpen()) {
        <div 
          appEscToClose
          (escPressed)="closeModal()"
          class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          (click)="closeModal()">
          <div 
            class="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[80vh] flex flex-col relative"
            (click)="$event.stopPropagation()">
            
            <!-- Jalali Date Picker Popup -->
            @if (showDatePicker()) {
              <app-doc-jalali-picker
                [x]="0" [y]="40"
                [selectedYear]="pickerYear"
                [selectedMonth]="pickerMonth"
                (select)="onDateSelect($event)"
                (close)="showDatePicker.set(false)">
              </app-doc-jalali-picker>
            }

            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">آپلود سند جدید</h2>
                <button 
                  type="button"
                  (click)="closeModal()"
                  class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700"
                  aria-label="بستن">
                  <ui-icon name="x" [size]="18" class="text-muted"></ui-icon>
                </button>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">عنوان سند *</label>
                <input 
                  type="text" 
                  [(ngModel)]="formData.title"
                  class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm"
                  placeholder="مثال: قرارداد کاری سال ۱۴۰۳">
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">توضیحات</label>
                <textarea 
                  [(ngModel)]="formData.description"
                  rows="2"
                  class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm"
                  placeholder="توضیحات تکمیلی..."></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">دسته‌بندی *</label>
                  <select 
                    [(ngModel)]="formData.category"
                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="contract">قرارداد</option>
                    <option value="certificate">گواهینامه</option>
                    <option value="payslip">فیش حقوقی</option>
                    <option value="identity">مدارک هویتی</option>
                    <option value="medical">پزشکی</option>
                    <option value="educational">تحصیلی</option>
                    <option value="other">سایر</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">وضعیت</label>
                  <select 
                    [(ngModel)]="formData.status"
                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="active">فعال</option>
                    <option value="pending-review">در انتظار بررسی</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">نام فایل *</label>
                  <input 
                    type="text" 
                    [(ngModel)]="formData.fileName"
                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr"
                    placeholder="example.pdf">
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">حجم فایل (KB)</label>
                  <input 
                    type="number" 
                    [(ngModel)]="formData.fileSize"
                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr"
                    placeholder="0">
                </div>
              </div>

              <div class="relative">
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">تاریخ انقضا</label>
                <div class="relative">
                  <input type="text" readonly [(ngModel)]="formData.expiryDate"
                         (click)="toggleDatePicker($event)"
                         class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm cursor-pointer"
                         placeholder="انتخاب تاریخ شمسی">
                  <ui-icon name="calendar" [size]="16" class="absolute left-3 top-3 text-muted pointer-events-none"></ui-icon>
                </div>
                <p class="text-[10px] text-muted mt-1">برای اسناد بدون انقضا خالی بگذارید</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">برچسب‌ها (با کاما جدا کنید)</label>
                <input 
                  type="text" 
                  [(ngModel)]="formData.tagsInput"
                  class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm"
                  placeholder="قرارداد، رسمی، ۱۴۰۳">
              </div>
            </div>

            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex gap-3">
                <button 
                  type="button"
                  (click)="closeModal()"
                  class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                  انصراف
                </button>
                <button 
                  type="button"
                  (click)="saveDocument()"
                  class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-sm flex items-center justify-center gap-2">
                  <ui-icon name="save" [size]="16"></ui-icon>
                  ذخیره سند
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
export class DocumentsComponent {
  docService = inject(DocumentService);
  private toastService = inject(ToastService);
  private exportService = inject(ExportService);

  documents = this.docService.documents;
  stats = this.docService.stats;

  searchQuery = '';
  filterCategory: 'all' | DocumentCategory = 'all';
  filterStatus: 'all' | DocumentStatus = 'all';

  isModalOpen = signal(false);
  showDatePicker = signal(false);
  pickerYear = 1404;
  pickerMonth = 1;

  formData = {
    title: '',
    description: '',
    category: 'contract' as DocumentCategory,
    status: 'active' as DocumentStatus,
    fileName: '',
    fileSize: 0,
    expiryDate: '',
    tagsInput: ''
  };

  displayedDocuments = computed(() => {
    let result = this.documents();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (this.filterCategory !== 'all') {
      result = result.filter(d => d.category === this.filterCategory);
    }

    if (this.filterStatus !== 'all') {
      result = result.filter(d => d.status === this.filterStatus);
    }

    return result;
  });

  openAddModal(): void {
    this.formData = {
      title: '',
      description: '',
      category: 'contract',
      status: 'active',
      fileName: '',
      fileSize: 0,
      expiryDate: '',
      tagsInput: ''
    };
    this.pickerYear = 1404;
    this.pickerMonth = 1;
    this.showDatePicker.set(false);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.showDatePicker.set(false);
  }

  toggleDatePicker(event: MouseEvent): void {
    event.stopPropagation();
    this.showDatePicker.update(v => !v);
  }

  onDateSelect(date: string): void {
    this.formData.expiryDate = date;
    this.showDatePicker.set(false);
  }

  saveDocument(): void {
    if (!this.formData.title.trim() || !this.formData.fileName.trim()) {
      this.toastService.show('عنوان و نام فایل الزامی هستند.', 'error');
      return;
    }

    const tags = this.formData.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    this.docService.addDocument({
      title: this.formData.title,
      description: this.formData.description,
      category: this.formData.category,
      status: this.formData.status,
      fileName: this.formData.fileName,
      fileSize: this.formData.fileSize * 1024,
      fileType: 'application/pdf',
      uploadDate: new Date().toLocaleDateString('fa-IR'),
      expiryDate: this.formData.expiryDate || null,
      tags
    });

    this.toastService.show('سند با موفقیت ذخیره شد.', 'success');
    this.closeModal();
  }

  downloadDocument(doc: AppDocument): void {
    // Create a dummy file for download simulation
    const content = `سند: ${doc.title}\nتوضیحات: ${doc.description || '-'}\nنام فایل: ${doc.fileName}\nتاریخ آپلود: ${doc.uploadDate}`;
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toastService.show(`فایل «${doc.fileName}» دانلود شد.`, 'success');
  }

  deleteDocument(id: string): void {
    this.docService.deleteDocument(id);
    this.toastService.show('سند حذف شد.', 'success');
  }

  exportData(): void {
    const exportData = this.displayedDocuments().map(d => ({
      'عنوان': d.title,
      'توضیحات': d.description,
      'دسته‌بندی': this.docService.getCategoryLabel(d.category),
      'وضعیت': this.docService.getStatusLabel(d.status),
      'نام فایل': d.fileName,
      'حجم': this.docService.formatFileSize(d.fileSize),
      'تاریخ آپلود': d.uploadDate,
      'تاریخ انقضا': d.expiryDate || '-',
      'برچسب‌ها': d.tags.join('، ')
    }));

    this.exportService.exportToCSV(exportData, 'documents-report');
  }

  getFileIcon(category: DocumentCategory): string {
    const icons: Record<DocumentCategory, string> = {
      contract: 'save',
      certificate: 'shield',
      payslip: 'chart',
      identity: 'user',
      medical: 'activity',
      educational: 'list-check',
      other: 'save'
    };
    return icons[category];
  }

  getFileIconClass(category: DocumentCategory): string {
    const classes: Record<DocumentCategory, string> = {
      contract: 'bg-primary/10 text-primary',
      certificate: 'bg-success/10 text-success',
      payslip: 'bg-info/10 text-info',
      identity: 'bg-warning/10 text-warning',
      medical: 'bg-danger/10 text-danger',
      educational: 'bg-primary/10 text-primary',
      other: 'bg-muted/10 text-muted'
    };
    return classes[category];
  }

  getStatusBadgeClass(status: DocumentStatus): string {
    const map: Record<DocumentStatus, string> = {
      active: 'bg-success/10 text-success',
      expired: 'bg-danger/10 text-danger',
      'pending-review': 'bg-warning/10 text-warning'
    };
    return map[status];
  }

  getExpiryClass(doc: AppDocument): string {
    const days = this.docService.getDaysUntilExpiry(doc);
    if (days === null) return 'text-muted';
    if (days <= 0) return 'text-danger font-bold';
    if (days <= 30) return 'text-warning font-bold';
    return 'text-muted';
  }

  getDaysUntilExpiry(doc: AppDocument): number | null {
    return this.docService.getDaysUntilExpiry(doc);
  }

  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }
}
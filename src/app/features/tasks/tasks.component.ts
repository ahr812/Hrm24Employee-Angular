import { Component, inject, signal, computed, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { TaskService, Task, TaskPriority, TaskStatus } from '../../core/tasks/task.service';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ExportService } from '../../core/export/export.service';

// ── Internal Jalali DatePicker for Tasks ──
@Component({
  selector: 'app-task-jalali-picker',
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
export class TaskJalaliPickerComponent {
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

// ── Main Tasks Component ──
@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [FormsModule, IconComponent, EscToCloseDirective, TaskJalaliPickerComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="list-check" [size]="36" class="text-orange-500"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">مدیریت وظایف</h1>
            <p class="text-lg text-muted">وظایف روزانه خود را مدیریت کنید</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button type="button" (click)="openAddModal()" class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
            <ui-icon name="plus" [size]="20"></ui-icon>
            وظیفه جدید
          </button>
          <button type="button" (click)="exportData()" class="px-5 py-3 bg-success text-white rounded-xl hover:bg-success/90 transition-colors font-bold flex items-center gap-2 shadow-sm">
            <ui-icon name="download" [size]="20"></ui-icon>
            خروجی
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-muted">کل وظایف</span>
            <ui-icon name="list-check" [size]="18" class="text-primary"></ui-icon>
          </div>
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ toFa(stats().total) }}</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-muted">در انتظار</span>
            <ui-icon name="clock" [size]="18" class="text-warning"></ui-icon>
          </div>
          <p class="text-2xl font-bold text-warning">{{ toFa(stats().pending) }}</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-muted">در حال انجام</span>
            <ui-icon name="activity" [size]="18" class="text-info"></ui-icon>
          </div>
          <p class="text-2xl font-bold text-info">{{ toFa(stats().inProgress) }}</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-muted">تکمیل شده</span>
            <ui-icon name="check-circle" [size]="18" class="text-success"></ui-icon>
          </div>
          <p class="text-2xl font-bold text-success">{{ toFa(stats().done) }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
        <div class="flex flex-col md:flex-row gap-3">
          <div class="flex-1">
            <input type="text" [(ngModel)]="searchQuery" placeholder="جستجو در وظایف..." class="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
          </div>
          <select [(ngModel)]="statusFilter" class="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <option value="all">همه وضعیت‌ها</option>
            <option value="pending">در انتظار</option>
            <option value="in-progress">در حال انجام</option>
            <option value="done">تکمیل شده</option>
          </select>
          <select [(ngModel)]="priorityFilter" class="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <option value="all">همه اولویت‌ها</option>
            <option value="high">بالا</option>
            <option value="medium">متوسط</option>
            <option value="low">پایین</option>
          </select>
        </div>
      </div>

      <!-- Tasks List -->
      <div class="space-y-3">
        @if (displayedTasks().length === 0) {
          <div class="bg-surface rounded-xl p-12 border border-border text-center dark:bg-slate-800 dark:border-slate-700">
            <ui-icon name="list-check" [size]="64" class="mx-auto mb-4 text-muted opacity-50"></ui-icon>
            <p class="text-lg text-muted mb-2">وظیفه‌ای یافت نشد</p>
            <p class="text-sm text-muted">اولین وظیفه خود را اضافه کنید</p>
          </div>
        }
        @for (task of displayedTasks(); track task.id) {
          <div [class]="getTaskCardClass(task)" draggable="true" (dragstart)="onDragStart($event, task)" (dragover)="onDragOver($event)" (drop)="onDrop($event, task)" (dragend)="onDragEnd()">
            <div class="flex items-start gap-4">
              
              <!-- Single-state Checkbox: only for completing (done) -->
              @if (task.status !== 'done') {
                <button
                  type="button"
                  (click)="completeTask(task.id)"
                  class="mt-1 w-6 h-6 rounded-md border-2 border-slate-300 dark:border-slate-600 bg-transparent flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:border-success hover:bg-success/10 cursor-pointer"
                  title="تکمیل وظیفه">
                </button>
              } @else {
                <div class="mt-1 w-6 h-6 rounded-md border-2 border-success bg-success flex items-center justify-center flex-shrink-0">
                  <ui-icon name="check" [size]="14" class="text-white"></ui-icon>
                </div>
              }

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <h3 [class]="getTitleClass(task)">{{ task.title }}</h3>
                    <!-- Start Button: only visible when status is pending -->
                    @if (task.status === 'pending') {
                      <button
                        type="button"
                        (click)="startTask(task.id)"
                        class="px-3 py-1 rounded-lg bg-info/10 text-info hover:bg-info hover:text-white text-[10px] font-bold transition-all flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                        <ui-icon name="activity" [size]="12"></ui-icon>
                        شروع انجام وظیفه
                      </button>
                    }
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <button type="button" (click)="openEditModal(task)" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="ویرایش">
                      <ui-icon name="edit" [size]="16" class="text-muted"></ui-icon>
                    </button>
                    <button type="button" (click)="deleteTask(task.id)" class="p-1.5 rounded-lg hover:bg-danger/10 transition-colors" aria-label="حذف">
                      <ui-icon name="trash-2" [size]="16" class="text-muted hover:text-danger"></ui-icon>
                    </button>
                  </div>
                </div>
                
                @if (task.description) {
                  <p class="text-sm text-muted mb-3">{{ task.description }}</p>
                }
                
                <div class="flex flex-wrap items-center gap-2">
                  <span [class]="getPriorityBadgeClass(task.priority)" class="px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                    <ui-icon name="flag" [size]="12"></ui-icon>
                    {{ getPriorityLabel(task.priority) }}
                  </span>
                  <span [class]="getStatusBadgeClass(task.status)" class="px-2.5 py-1 rounded-md text-xs font-bold">
                    {{ getStatusLabel(task.status) }}
                  </span>
                  @if (task.dueDate) {
                    <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-background dark:bg-slate-900 text-muted flex items-center gap-1">
                      <ui-icon name="calendar" [size]="12"></ui-icon>
                      <span>{{ toFa(task.dueDate) }}</span>
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
        <div appEscToClose (escPressed)="closeModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeModal()">
          <div class="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[80vh] flex flex-col relative" (click)="$event.stopPropagation()">
            
            @if (showDatePicker()) {
              <app-task-jalali-picker
                [x]="0" [y]="40"
                [selectedYear]="pickerYear"
                [selectedMonth]="pickerMonth"
                (select)="onDateSelect($event)"
                (close)="showDatePicker.set(false)">
              </app-task-jalali-picker>
            }

            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">
                  {{ editingTask() ? 'ویرایش وظیفه' : 'وظیفه جدید' }}
                </h2>
                <button type="button" (click)="closeModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="بستن">
                  <ui-icon name="x" [size]="18" class="text-muted"></ui-icon>
                </button>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">عنوان وظیفه *</label>
                <input type="text" [(ngModel)]="formData.title" name="title" required class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="مثال: تکمیل گزارش ماهانه">
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">توضیحات</label>
                <textarea [(ngModel)]="formData.description" name="description" rows="2" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="جزئیات وظیفه..."></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">اولویت</label>
                  <select [(ngModel)]="formData.priority" name="priority" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="low">پایین</option>
                    <option value="medium">متوسط</option>
                    <option value="high">بالا</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">وضعیت</label>
                  <select [(ngModel)]="formData.status" name="status" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="pending">در انتظار</option>
                    <option value="in-progress">در حال انجام</option>
                    <option value="done">تکمیل شده</option>
                  </select>
                </div>
              </div>

              <div class="relative">
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">تاریخ سررسید</label>
                <div class="relative">
                  <input type="text" readonly [(ngModel)]="formData.dueDate" name="dueDate"
                         (click)="toggleDatePicker($event)"
                         class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm cursor-pointer"
                         placeholder="انتخاب تاریخ شمسی">
                  <ui-icon name="calendar" [size]="16" class="absolute left-3 top-3 text-muted pointer-events-none"></ui-icon>
                </div>
              </div>
            </div>

            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex gap-3">
                <button type="button" (click)="closeModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                  انصراف
                </button>
                <button type="submit" (click)="saveTask()" class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-sm">
                  {{ editingTask() ? 'بروزرسانی' : 'افزودن' }}
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
    .dragging { opacity: 0.5; }
    .drag-over { border-color: rgb(var(--color-primary)) !important; background-color: rgba(var(--color-primary), 0.05) !important; }
  `]
})
export class TasksComponent {
  private taskService = inject(TaskService);
  private toastService = inject(ToastService);
  private exportService = inject(ExportService);

  tasks = this.taskService.tasks;
  stats = this.taskService.stats;

  searchQuery = '';
  statusFilter: 'all' | TaskStatus = 'all';
  priorityFilter: 'all' | TaskPriority = 'all';

  isModalOpen = signal(false);
  editingTask = signal<Task | null>(null);
  draggedTask = signal<Task | null>(null);
  showDatePicker = signal(false);
  pickerYear = 1404;
  pickerMonth = 1;

  formData = {
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
    dueDate: ''
  };

  displayedTasks = computed(() => {
    let result = this.tasks();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (this.statusFilter !== 'all') result = result.filter(t => t.status === this.statusFilter);
    if (this.priorityFilter !== 'all') result = result.filter(t => t.priority === this.priorityFilter);
    return result;
  });

  openAddModal(): void {
    this.editingTask.set(null);
    this.formData = { title: '', description: '', priority: 'medium', status: 'pending', dueDate: '' };
    this.pickerYear = 1404;
    this.pickerMonth = 1;
    this.showDatePicker.set(false);
    this.isModalOpen.set(true);
  }

  openEditModal(task: Task): void {
    this.editingTask.set(task);
    this.formData = { title: task.title, description: task.description, priority: task.priority, status: task.status, dueDate: task.dueDate };
    if (task.dueDate) {
      const parts = task.dueDate.split('/');
      if (parts.length === 3) {
        this.pickerYear = parseInt(parts[0]) || 1404;
        this.pickerMonth = parseInt(parts[1]) || 1;
      }
    }
    this.showDatePicker.set(false);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingTask.set(null);
    this.showDatePicker.set(false);
  }

  toggleDatePicker(event: MouseEvent): void {
    event.stopPropagation();
    this.showDatePicker.update(v => !v);
  }

  onDateSelect(date: string): void {
    this.formData.dueDate = date;
    this.showDatePicker.set(false);
  }

  saveTask(): void {
    if (!this.formData.title.trim()) {
      this.toastService.show('عنوان وظیفه الزامی است.', 'error');
      return;
    }
    const editing = this.editingTask();
    if (editing) {
      this.taskService.updateTask(editing.id, { ...this.formData });
      this.toastService.show('وظیفه با موفقیت بروزرسانی شد.', 'success');
    } else {
      this.taskService.addTask({ ...this.formData });
      this.toastService.show('وظیفه جدید با موفقیت اضافه شد.', 'success');
    }
    this.closeModal();
  }

  deleteTask(id: string): void {
    this.taskService.deleteTask(id);
    this.toastService.show('وظیفه حذف شد.', 'success');
  }

  // ── New workflow methods ──

  startTask(id: string): void {
    this.taskService.updateTask(id, { status: 'in-progress' });
    this.toastService.show('شروع انجام وظیفه ثبت شد.', 'success');
  }

  completeTask(id: string): void {
    this.taskService.updateTask(id, { status: 'done' });
    this.toastService.show('وظیفه تکمیل شد.', 'success');
  }

  toggleStatus(id: string): void {
    this.taskService.toggleStatus(id);
  }

  onDragStart(event: DragEvent, task: Task): void {
    this.draggedTask.set(task);
    (event.target as HTMLElement).classList.add('dragging');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.add('drag-over');
  }

  onDrop(event: DragEvent, targetTask: Task): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
    const dragged = this.draggedTask();
    if (!dragged || dragged.id === targetTask.id) return;
    const currentTasks = [...this.tasks()];
    const draggedIndex = currentTasks.findIndex(t => t.id === dragged.id);
    const targetIndex = currentTasks.findIndex(t => t.id === targetTask.id);
    if (draggedIndex === -1 || targetIndex === -1) return;
    currentTasks.splice(draggedIndex, 1);
    currentTasks.splice(targetIndex, 0, dragged);
    this.taskService.reorderTasks(currentTasks);
    this.draggedTask.set(null);
  }

  onDragEnd(): void {
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    this.draggedTask.set(null);
  }

  exportData(): void {
    const exportData = this.displayedTasks().map(t => ({
      'عنوان': t.title,
      'توضیحات': t.description,
      'اولویت': this.getPriorityLabel(t.priority),
      'وضعیت': this.getStatusLabel(t.status),
      'تاریخ سررسید': t.dueDate || '-',
      'تاریخ ایجاد': new Date(t.createdAt).toLocaleDateString('fa-IR')
    }));
    this.exportService.exportToCSV(exportData, 'tasks-report');
  }

  getTaskCardClass(task: Task): string {
    const base = 'bg-surface rounded-xl p-5 border border-border transition-all duration-200 hover:shadow-md dark:bg-slate-800 dark:border-slate-700 cursor-move';
    if (task.status === 'done') return `${base} opacity-70`;
    return base;
  }

  getTitleClass(task: Task): string {
    if (task.status === 'done') return 'font-bold text-muted line-through';
    return 'font-bold text-foreground dark:text-slate-100';
  }

  getPriorityBadgeClass(priority: TaskPriority): string {
    if (priority === 'high') return 'bg-danger/10 text-danger';
    if (priority === 'medium') return 'bg-warning/10 text-warning';
    return 'bg-info/10 text-info';
  }

  getStatusBadgeClass(status: TaskStatus): string {
    if (status === 'done') return 'bg-success/10 text-success';
    if (status === 'in-progress') return 'bg-info/10 text-info';
    return 'bg-muted/10 text-muted';
  }

  getPriorityLabel(priority: TaskPriority): string {
    const labels: Record<TaskPriority, string> = { high: 'بالا', medium: 'متوسط', low: 'پایین' };
    return labels[priority];
  }

  getStatusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = { 'pending': 'در انتظار', 'in-progress': 'در حال انجام', 'done': 'تکمیل شده' };
    return labels[status];
  }

  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }
}
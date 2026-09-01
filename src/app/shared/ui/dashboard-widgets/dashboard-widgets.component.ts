import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { AttendanceService } from '../../../core/attendance/attendance.service';
import { TrainingService } from '../../../core/training/training.service';
import { TaskService } from '../../../core/tasks/task.service';

@Component({
    selector: 'app-dashboard-widgets',
    standalone: true,
    imports: [RouterLink, IconComponent],
    template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-surface rounded-2xl p-6 border border-border dark:bg-slate-800 dark:border-slate-700">
        <h3 class="text-lg font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
          <ui-icon name="zap" [size]="20" class="text-warning"></ui-icon>
          دسترسی سریع
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <a routerLink="/tasks" class="flex flex-col items-center justify-center p-4 rounded-xl bg-background hover:bg-primary/5 border border-transparent transition-all dark:bg-slate-900 dark:hover:bg-slate-700">
            <ui-icon name="plus" [size]="24" class="text-primary mb-2"></ui-icon>
            <span class="text-sm font-medium text-foreground dark:text-slate-200">وظیفه جدید</span>
          </a>
          <a routerLink="/leave" class="flex flex-col items-center justify-center p-4 rounded-xl bg-background hover:bg-success/5 border border-transparent transition-all dark:bg-slate-900 dark:hover:bg-slate-700">
            <ui-icon name="calendar" [size]="24" class="text-success mb-2"></ui-icon>
            <span class="text-sm font-medium text-foreground dark:text-slate-200">درخواست مرخصی</span>
          </a>
          <a routerLink="/attendance" class="flex flex-col items-center justify-center p-4 rounded-xl bg-background hover:bg-info/5 border border-transparent transition-all dark:bg-slate-900 dark:hover:bg-slate-700">
            <ui-icon name="clock" [size]="24" class="text-info mb-2"></ui-icon>
            <span class="text-sm font-medium text-foreground dark:text-slate-200">ثبت تردد</span>
          </a>
          <a routerLink="/training" class="flex flex-col items-center justify-center p-4 rounded-xl bg-background hover:bg-warning/5 border border-transparent transition-all dark:bg-slate-900 dark:hover:bg-slate-700">
            <ui-icon name="zap" [size]="24" class="text-warning mb-2"></ui-icon>
            <span class="text-sm font-medium text-foreground dark:text-slate-200">دوره‌های آموزشی</span>
          </a>
        </div>
      </div>
      <div class="bg-gradient-to-br from-primary to-primary-hover rounded-2xl p-6 text-white shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <ui-icon name="clock" [size]="20"></ui-icon>
            وضعیت امروز
          </h3>
          <span class="text-xs opacity-80 dir-ltr">{{ currentTime() }}</span>
        </div>
        @if (todayRecord(); as rec) {
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm opacity-80">وضعیت:</span>
              <span class="font-bold bg-white/20 px-3 py-1 rounded-lg text-sm">{{ attService.getStatusLabel(rec.status) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm opacity-80">ورود:</span>
              <span class="font-mono font-bold dir-ltr">{{ rec.checkInTime || '-' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm opacity-80">خروج:</span>
              <span class="font-mono font-bold dir-ltr">{{ rec.checkOutTime || '-' }}</span>
            </div>
            @if (rec.workHours > 0) {
              <div class="flex items-center justify-between">
                <span class="text-sm opacity-80">ساعات کار:</span>
                <span class="font-bold">{{ rec.workHours.toFixed(1) }} ساعت</span>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-6">
            <ui-icon name="clock" [size]="48" class="mx-auto mb-3 opacity-50"></ui-icon>
            <p class="opacity-80">هنوز ترددی ثبت نشده</p>
            <a routerLink="/attendance" class="inline-block mt-3 px-4 py-2 bg-white/20 rounded-lg text-sm font-bold hover:bg-white/30 transition-colors">ثبت ورود</a>
          </div>
        }
        <div class="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-2 text-center text-xs">
          <div><p class="opacity-70">نرخ حضور ماه</p><p class="font-bold text-lg">{{ attSummary().attendanceRate }}٪</p></div>
          <div><p class="opacity-70">ساعات کاری</p><p class="font-bold text-lg">{{ attSummary().totalWorkHours }}</p></div>
          <div><p class="opacity-70">اضافه‌کاری</p><p class="font-bold text-lg">{{ attSummary().totalOvertimeHours }}h</p></div>
        </div>
      </div>
      <div class="space-y-4">
        @if (expiringCerts().length > 0) {
          <div class="bg-warning/5 border border-warning/20 rounded-2xl p-5">
            <h3 class="text-sm font-bold text-warning mb-3 flex items-center gap-2">
              <ui-icon name="alert-triangle" [size]="16"></ui-icon>
              گواهینامه‌های نزدیک انقضا
            </h3>
            <div class="space-y-2">
              @for (cert of expiringCerts(); track cert.id) {
                <div class="flex items-center justify-between p-2.5 bg-surface rounded-lg dark:bg-slate-800">
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-foreground dark:text-slate-200 truncate">{{ cert.courseTitle }}</p>
                    <p class="text-[10px] text-muted">انقضا: <span class="dir-ltr">{{ cert.expiresAt }}</span></p>
                  </div>
                  <a routerLink="/training" class="text-[10px] text-primary font-bold hover:underline flex-shrink-0 mr-2">تمدید</a>
                </div>
              }
            </div>
          </div>
        }
        @if (activeTrainings().length > 0) {
          <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700">
            <h3 class="text-sm font-bold text-foreground mb-3 dark:text-slate-100 flex items-center gap-2">
              <ui-icon name="zap" [size]="16" class="text-success"></ui-icon>
              دوره‌های فعال من
            </h3>
            <div class="space-y-2">
              @for (enr of activeTrainings(); track enr.id) {
                <div class="p-2.5 bg-background rounded-lg dark:bg-slate-900">
                  <div class="flex items-center justify-between mb-1.5">
                    <p class="text-xs font-bold text-foreground dark:text-slate-200 truncate">{{ enr.courseTitle }}</p>
                    <span class="text-[10px] font-bold text-primary">{{ enr.progress }}٪</span>
                  </div>
                  <div class="w-full h-1.5 bg-border rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full transition-all" [style.width.%]="enr.progress"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
        <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
              <ui-icon name="list-check" [size]="16" class="text-info"></ui-icon>
              وظایف در انتظار
            </h3>
            <a routerLink="/tasks" class="text-[10px] text-primary font-bold hover:underline">مشاهده همه</a>
          </div>
          @if (pendingTasks().length > 0) {
            <div class="space-y-2">
              @for (task of pendingTasks(); track task.id) {
                <div class="flex items-center gap-2 p-2 bg-background rounded-lg dark:bg-slate-900">
                  <div [class]="getPriorityDot(task.priority)" class="w-2 h-2 rounded-full flex-shrink-0"></div>
                  <p class="text-xs text-foreground dark:text-slate-200 truncate flex-1">{{ task.title }}</p>
                </div>
              }
            </div>
          } @else {
            <p class="text-xs text-muted text-center py-2">وظیفه‌ای در انتظار نیست ✅</p>
          }
        </div>
      </div>
    </div>
  `
})
export class DashboardWidgetsComponent {
    attService = inject(AttendanceService);
    private trainingService = inject(TrainingService);
    private taskService = inject(TaskService);

    todayRecord = this.attService.todayRecord;
    attSummary = this.attService.currentMonthSummary;
    currentTime = signal(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));

    expiringCerts = computed(() => {
        return this.trainingService.certificates().filter(c => {
            if (!c.expiresAt) return false;
            const days = Math.ceil((new Date(c.expiresAt).getTime() - Date.now()) / 86400000);
            return days > 0 && days <= 60;
        });
    });

    activeTrainings = computed(() => this.trainingService.myEnrollments().filter(e => e.status === 'in-progress'));

    pendingTasks = computed(() => this.taskService.tasks().filter(t => t.status === 'pending').slice(0, 3));

    getPriorityDot(priority: string): string {
        if (priority === 'high') return 'bg-danger';
        if (priority === 'medium') return 'bg-warning';
        return 'bg-info';
    }

    constructor() {
        setInterval(() => this.currentTime.set(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })), 30000);
    }
}
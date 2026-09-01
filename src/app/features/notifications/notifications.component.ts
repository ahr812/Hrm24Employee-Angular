import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EmployeeDataService } from '../../core/data/employee-data.service';
import { OrganizationService } from '../../core/organization/organization.service';
import { ExportService } from '../../core/export/export.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [NgClass, IconComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="bell" [size]="36" class="text-rose-500"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">اعلان‌ها</h1>
            <p class="text-lg text-muted">
              <span class="font-bold text-foreground dark:text-slate-100">{{ toFa(unreadCount()) }}</span>
              اعلان خوانده‌نشده در 
              <span class="font-bold text-foreground dark:text-slate-100">{{ activeOrg().name }}</span>
            </p>
          </div>
        </div>
        <div class="flex gap-3">
          <button (click)="markAllAsRead()" class="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2 shadow-sm">
            <ui-icon name="check" [size]="18"></ui-icon>
            خواندن همه
          </button>
          <button (click)="exportData()" class="px-5 py-2.5 bg-success text-white rounded-xl hover:bg-success/90 transition-colors font-bold flex items-center gap-2 shadow-sm">
            <ui-icon name="download" [size]="18"></ui-icon>
            خروجی
          </button>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="bg-surface rounded-2xl border border-border overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div class="divide-y divide-border dark:divide-slate-700">
          @for (notification of notifications(); track notification.id) {
            <div
              [ngClass]="getContainerClass(notification.isRead)"
              (click)="markAsRead(notification.id)">
              
              <div [ngClass]="getIconBgClass(notification.type)">
                <ui-icon
                  [name]="getIconName(notification.type)"
                  [size]="24"
                  [ngClass]="getIconColorClass(notification.type)">
                </ui-icon>
              </div>

              <div class="flex-1">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="font-bold text-foreground dark:text-slate-100 mb-1">{{ notification.title }}</p>
                    <p class="text-sm text-muted">{{ notification.message }}</p>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-xs text-muted">{{ toFa(notification.date) }}</span>
                    @if (!notification.isRead) {
                      <span class="w-2 h-2 bg-primary rounded-full"></span>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          @if (notifications().length === 0) {
            <div class="p-12 text-center">
              <ui-icon name="bell" [size]="48" class="mx-auto mb-4 text-muted opacity-50"></ui-icon>
              <p class="text-muted">اعلانی وجود ندارد</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
  `]
})
export class NotificationsComponent {
  private dataService = inject(EmployeeDataService);
  private orgService = inject(OrganizationService);
  private exportService = inject(ExportService);

  activeOrg = this.orgService.activeOrg;
  notifications = this.dataService.notifications;
  unreadCount = this.dataService.unreadCount;

  markAsRead(id: number): void {
    this.dataService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.dataService.markAllAsRead();
  }

  exportData(): void {
    const rows = this.notifications().map(n => ({
      'عنوان': n.title,
      'پیام': n.message,
      'نوع': n.type,
      'تاریخ': n.date,
      'وضعیت': n.isRead ? 'خوانده شده' : 'خوانده نشده'
    }));
    this.exportService.exportToCSV(rows, 'notifications-report-' + this.activeOrg().id);
  }

  getContainerClass(isRead: boolean): string {
    const base = 'p-6 flex items-start gap-4 hover:bg-background transition-colors dark:hover:bg-slate-900/50 cursor-pointer';
    return isRead ? base : base + ' bg-primary/5';
  }

  getIconBgClass(type: string): string {
    const map: Record<string, string> = {
      success: 'bg-success/10',
      warning: 'bg-warning/10',
      danger: 'bg-danger/10'
    };
    return 'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ' + (map[type] || 'bg-info/10');
  }

  getIconName(type: string): string {
    const map: Record<string, string> = {
      success: 'check-circle',
      warning: 'alert-triangle',
      danger: 'alert-circle'
    };
    return map[type] || 'info';
  }

  getIconColorClass(type: string): string {
    const map: Record<string, string> = {
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-danger'
    };
    return map[type] || 'text-info';
  }

  /** تبدیل قطعی تمام ارقام لاتین به فارسی */
  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }
}
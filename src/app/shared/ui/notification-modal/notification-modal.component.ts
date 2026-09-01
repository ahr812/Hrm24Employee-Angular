import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

interface NotificationOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'financial' | 'hr' | 'system';
  isEnabled: boolean;
}

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (isOpen()) {
      <div 
        class="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm transition-opacity duration-300"
        (click)="close()"
      ></div>

      <div 
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl z-[70] animate-scale-in dark:bg-slate-800 dark:border-slate-700 flex flex-col max-h-[90vh]"
        (click)="$event.stopPropagation()"
      >
        
        <!-- Header -->
        <div class="flex items-center justify-between p-5 border-b border-border dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ui-icon name="bell" [size]="22"></ui-icon>
            </div>
            <div>
              <h3 class="text-lg font-bold text-foreground">مرکز کنترل اعلان‌ها</h3>
              <p class="text-xs text-muted">مدیریت هوشمند رویدادهای سامانه</p>
            </div>
          </div>
          <button (click)="close()" class="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-muted hover:text-foreground">
            <ui-icon name="x" [size]="20"></ui-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto custom-scrollbar space-y-8">
          
          @for (category of categories; track category.id) {
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                {{ category.title }}
              </h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                @for (option of getOptionsByCategory(category.id); track option.id) {
                  <div 
                    class="group relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none hover:shadow-md"
                    [ngClass]="isOptionEnabled(option.id) ? 'border-primary bg-primary/5' : 'border-border dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/40'"
                    (click)="toggleOption(option.id)"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex gap-3 min-w-0">
                        <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                             [ngClass]="getIconClasses(option.category)">
                          <ui-icon [name]="option.icon" [size]="18"></ui-icon>
                        </div>
                        
                        <div class="min-w-0">
                          <p class="font-bold text-sm text-foreground transition-colors">{{ option.title }}</p>
                          <p class="text-[11px] text-muted mt-0.5 leading-relaxed">{{ option.description }}</p>
                        </div>
                      </div>
                      
                      <div class="flex-shrink-0 mt-0.5">
                        <div 
                          class="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                          [ngClass]="isOptionEnabled(option.id) ? 'bg-primary shadow-md shadow-primary/30' : 'border-2 border-border dark:border-slate-600'"
                        >
                          @if (isOptionEnabled(option.id)) {
                            <ui-icon name="check" [size]="16" class="text-white"></ui-icon>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-border dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          <button (click)="resetDefaults()" class="text-xs font-bold text-muted hover:text-danger transition-colors">
            بازگشت به پیش‌فرض
          </button>
          <div class="flex gap-3">
            <button (click)="close()" class="px-5 py-2.5 text-sm font-bold text-muted hover:text-foreground transition-colors">
              انصراف
            </button>
            <button (click)="saveSettings()" class="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
              <ui-icon name="check" [size]="16"></ui-icon>
              ذخیره تنظیمات
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes scale-in {
      from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    .animate-scale-in { animation: scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
  `]
})
export class NotificationModalComponent {
  isOpen = signal(false);

  categories = [
    { id: 'financial', title: 'امور مالی و رفاهی' },
    { id: 'hr', title: 'منابع انسانی و اداری' },
    { id: 'system', title: 'سیستم و امنیتی' }
  ];

  private options: NotificationOption[] = [
    { id: 'loan_approval', title: 'موافقت با وام', description: 'اطلاع‌رسانی هنگام تایید درخواست وام', icon: 'credit-card', category: 'financial', isEnabled: true },
    { id: 'advance_approval', title: 'موافقت با مساعده', description: 'دریافت اعلان پس از پرداخت مساعده حقوق', icon: 'banknote', category: 'financial', isEnabled: true },
    { id: 'salary_deposit', title: 'واریز حقوق', description: 'اعلان لحظه‌ای واریز فیش حقوقی به حساب', icon: 'wallet', category: 'financial', isEnabled: true },
    { id: 'leave_status', title: 'وضعیت مرخصی', description: 'تایید یا رد درخواست‌های مرخصی و ساعتی', icon: 'calendar-check', category: 'hr', isEnabled: true },
    { id: 'mission_status', title: 'ماموریت‌های کاری', description: 'تغییرات و تاییدیه‌های مربوط به حکم ماموریت', icon: 'briefcase', category: 'hr', isEnabled: false },
    { id: 'security_alerts', title: 'هشدارهای امنیتی', description: 'ورود به سیستم از دستگاه‌های ناشناس', icon: 'shield-alert', category: 'system', isEnabled: true },
    { id: 'policy_update', title: 'بخشنامه‌های جدید', description: 'انتشار قوانین و مقررات جدید سازمان', icon: 'file-text', category: 'system', isEnabled: false },
  ];

  currentStatus = signal<Record<string, boolean>>({});

  // ══════════════════════════════════════
  // Close modal with Escape key
  // ══════════════════════════════════════
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  open(): void {
    const status: Record<string, boolean> = {};
    this.options.forEach(opt => status[opt.id] = opt.isEnabled);
    this.currentStatus.set(status);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  getOptionsByCategory(categoryId: string): NotificationOption[] {
    return this.options.filter(o => o.category === categoryId);
  }

  isOptionEnabled(id: string): boolean {
    return this.currentStatus()[id] ?? false;
  }

  toggleOption(id: string): void {
    const current = this.currentStatus();
    this.currentStatus.set({ ...current, [id]: !current[id] });
  }

  getIconClasses(category: string): string {
    switch (category) {
      case 'financial': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'hr': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'system': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  saveSettings(): void {
    const finalStatus = this.currentStatus();
    this.options.forEach(opt => {
      if (finalStatus.hasOwnProperty(opt.id)) {
        opt.isEnabled = finalStatus[opt.id];
      }
    });
    console.log('Saved Settings:', this.options);
    this.close();
  }

  resetDefaults(): void {
    this.open();
  }
}
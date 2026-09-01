import { Component, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { OrganizationService } from '../../core/organization/organization.service';
import { EmployeeDataService } from '../../core/data/employee-data.service';
import { LoanService } from '../../core/loan/loan.service';
import { AdvanceService } from '../../core/advance/advance.service';
import { SavingsService } from '../../core/savings/savings.service';
import { TaskService } from '../../core/tasks/task.service';
import { ReminderService } from '../../core/reminders/reminder.service';
import { ChatService } from '../../core/chat/chat.service';
import { LeaveService } from '../../core/leave/leave.service';
import { ChartComponent } from '../../shared/ui/charts/chart.component';
import { ThemeService } from '../../shared/layout/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IconComponent, ChartComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">
      
      <!-- ═══════════ 1. HEADER ═══════════ -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-primary mb-2">سلام، {{ userName }} 👋</h1>
          <p class="text-lg text-muted">
            خوش آمدید به <span class="font-bold text-foreground dark:text-slate-100">{{ activeOrg().name }}</span>
          </p>
        </div>
        <div class="flex flex-col items-center justify-center gap-1 bg-surface px-6 py-3 rounded-xl border border-border dark:bg-slate-800 dark:border-slate-700 shadow-sm min-w-[220px]">
          <span class="text-sm font-extrabold text-foreground dark:text-slate-100 vazirmatn">{{ currentDate }}</span>
          <span class="text-xl font-extrabold text-primary vazirmatn tracking-wide">{{ currentTime }}</span>
        </div>
      </div>

      <!-- ═══════════ 2. SMART REMINDERS ═══════════ -->
      @if (reminders().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (reminder of reminders(); track reminder.id) {
            <div class="flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer"
                 [class]="reminder.type === 'warning' ? 'bg-warning/5 border-warning/20' : reminder.type === 'danger' ? 'bg-danger/5 border-danger/20' : 'bg-info/5 border-info/20'">
              <div class="mt-1">
                <ui-icon [name]="reminder.icon" [size]="20" [class]="reminder.type === 'warning' ? 'text-warning' : reminder.type === 'danger' ? 'text-danger' : 'text-info'"></ui-icon>
              </div>
              <div>
                <p class="text-sm font-bold text-foreground dark:text-slate-100">{{ reminder.title }}</p>
                <p class="text-xs text-muted mt-1">{{ reminder.message }}</p>
              </div>
            </div>
          }
        </div>
      }

      <!-- ═══════════ 3. MY TODAY ═══════════ -->
      <div>
        <h2 class="text-xl font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
          <ui-icon name="sun" [size]="22" class="text-amber-500"></ui-icon>
          امروز من
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group cursor-pointer">
            <div class="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <ui-icon name="list-check" [size]="22" class="text-orange-500"></ui-icon>
            </div>
            <p class="text-2xl font-extrabold text-foreground dark:text-slate-100">{{ toFa(taskStats().pending + taskStats().inProgress) }}</p>
            <p class="text-[11px] text-muted mt-1 font-bold">وظیفه فعال</p>
            @if (taskStats().highPriority > 0) {
              <span class="inline-block mt-1.5 px-2 py-0.5 bg-danger/10 text-danger text-[9px] font-bold rounded-full">{{ toFa(taskStats().highPriority) }} فوری</span>
            }
          </div>
          <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group cursor-pointer">
            <div class="w-11 h-11 rounded-xl bg-amber-400/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <ui-icon name="bell" [size]="22" class="text-amber-400"></ui-icon>
            </div>
            <p class="text-2xl font-extrabold text-foreground dark:text-slate-100">{{ toFa(reminderStats().today) }}</p>
            <p class="text-[11px] text-muted mt-1 font-bold">یادآور امروز</p>
          </div>
          <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group cursor-pointer">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform" [class]="attendanceStatus().isCheckedIn ? 'bg-teal-500/10' : 'bg-red-500/10'">
              <ui-icon name="clock" [size]="22" [class]="attendanceStatus().isCheckedIn ? 'text-teal-500' : 'text-red-500'"></ui-icon>
            </div>
            <p class="text-2xl font-extrabold" [class]="attendanceStatus().isCheckedIn ? 'text-teal-500' : 'text-red-500'">{{ attendanceStatus().isCheckedIn ? 'حاضر' : 'غایب' }}</p>
            <p class="text-[11px] text-muted mt-1 font-bold">وضعیت حضور</p>
          </div>
          <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group cursor-pointer">
            <div class="w-11 h-11 rounded-xl bg-orange-400/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <ui-icon name="calendar" [size]="22" class="text-orange-400"></ui-icon>
            </div>
            <p class="text-2xl font-extrabold text-foreground dark:text-slate-100">{{ toFa(leaveRemaining()) }}</p>
            <p class="text-[11px] text-muted mt-1 font-bold">مانده مرخصی روزانه</p>
            @if (leaveStats().pending > 0) {
              <span class="inline-block mt-1.5 px-2 py-0.5 bg-warning/10 text-warning text-[9px] font-bold rounded-full">{{ toFa(leaveStats().pending) }} در انتظار</span>
            }
          </div>
          <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group cursor-pointer">
            <div class="w-11 h-11 rounded-xl bg-blue-400/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <ui-icon name="message-circle" [size]="22" class="text-blue-400"></ui-icon>
            </div>
            <p class="text-2xl font-extrabold text-foreground dark:text-slate-100">{{ toFa(unreadMessages()) }}</p>
            <p class="text-[11px] text-muted mt-1 font-bold">پیام جدید</p>
            @if (unreadNotifications() > 0) {
              <span class="inline-block mt-1.5 px-2 py-0.5 bg-danger/10 text-danger text-[9px] font-bold rounded-full">{{ toFa(unreadNotifications()) }} اعلان</span>
            }
          </div>
        </div>
      </div>

      <!-- ═══════════ 4. MY FINANCE ═══════════ -->
      <div>
        <h2 class="text-xl font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
          <ui-icon name="wallet" [size]="22" class="text-primary"></ui-icon>
          وضعیت مالی من
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Loan -->
          <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                <ui-icon name="wallet" [size]="20" class="text-blue-600"></ui-icon>
              </div>
              <div>
                <h3 class="text-sm font-extrabold text-foreground dark:text-slate-100">وام و تسهیلات</h3>
                <p class="text-xs text-muted">{{ toFa(loanStats().activeLoans) }} وام فعال</p>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-xs"><span class="text-muted">کل بازپرداخت</span><span class="font-bold text-foreground dark:text-slate-200">{{ formatMoney(loanStats().totalAmountGranted) }}</span></div>
              <div class="flex justify-between text-xs"><span class="text-muted">پرداخت شده</span><span class="font-bold text-success">{{ formatMoney(loanStats().totalPaid) }}</span></div>
              <div class="flex justify-between text-xs"><span class="text-muted">مانده بدهی</span><span class="font-bold text-warning">{{ formatMoney(loanStats().totalRemaining) }}</span></div>
              <div class="w-full h-2 bg-border rounded-full overflow-hidden mt-2">
                <div class="h-full bg-blue-600 rounded-full transition-all duration-500" [style.width.%]="loanProgress()"></div>
              </div>
              <p class="text-[10px] text-muted text-left font-bold">{{ toFa(loanProgress()) }}٪ بازپرداخت شده</p>
            </div>
          </div>
          <!-- Advance -->
          <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <ui-icon name="dollar-sign" [size]="20" class="text-yellow-500"></ui-icon>
              </div>
              <div>
                <h3 class="text-sm font-extrabold text-foreground dark:text-slate-100">مساعده‌ها</h3>
                <p class="text-xs text-muted">{{ toFa(advanceStats().total) }} مساعده</p>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-xs"><span class="text-muted">کل مبلغ</span><span class="font-bold text-foreground dark:text-slate-200">{{ formatMoney(advanceStats().totalAmount) }}</span></div>
              <div class="flex justify-between text-xs"><span class="text-muted">کسر شده</span><span class="font-bold text-success">{{ formatMoney(advanceStats().deductedAmount) }}</span></div>
              <div class="flex justify-between text-xs"><span class="text-muted">کسر نشده</span><span class="font-bold text-warning">{{ formatMoney(advanceStats().pendingAmount) }}</span></div>
              <div class="w-full h-2 bg-border rounded-full overflow-hidden mt-2">
                <div class="h-full bg-yellow-500 rounded-full transition-all duration-500" [style.width.%]="advanceProgress()"></div>
              </div>
              <p class="text-[10px] text-muted text-left font-bold">{{ toFa(advanceProgress()) }}٪ کسر شده</p>
            </div>
          </div>
          <!-- Savings -->
          <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center">
                <ui-icon name="trending-up" [size]="20" class="text-emerald-600"></ui-icon>
              </div>
              <div>
                <h3 class="text-sm font-extrabold text-foreground dark:text-slate-100">صندوق پس‌انداز</h3>
                <p class="text-xs text-muted">{{ toFa(savingsStats().activeMemberships) }} عضویت فعال</p>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-xs"><span class="text-muted">کل واریزی</span><span class="font-bold text-foreground dark:text-slate-200">{{ formatMoney(savingsStats().totalDeposited) }}</span></div>
              <div class="flex justify-between text-xs"><span class="text-muted">سود دریافتی</span><span class="font-bold text-info">{{ formatMoney(savingsStats().totalInterest) }}</span></div>
              <div class="flex justify-between text-xs"><span class="text-muted">موجودی کل</span><span class="font-bold text-success">{{ formatMoney(savingsStats().totalBalance) }}</span></div>
              <div class="w-full h-2 bg-border rounded-full overflow-hidden mt-2">
                <div class="h-full bg-emerald-600 rounded-full transition-all duration-500" [style.width.%]="savingsGrowth()"></div>
              </div>
              <p class="text-[10px] text-muted text-left font-bold">{{ toFa(savingsGrowth()) }}٪ رشد</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ 5. CHARTS ═══════════ -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-surface rounded-2xl p-6 border border-border dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
          <h2 class="text-lg font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
            <ui-icon name="activity" [size]="20" class="text-primary"></ui-icon>
            کارکرد ۱۰ روز اخیر
          </h2>
          <div class="h-72 relative">
            <app-chart [type]="'line'" [data]="workChartData()" [options]="chartOptions()"></app-chart>
          </div>
        </div>
        <div class="bg-surface rounded-2xl p-6 border border-border dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
          <h2 class="text-lg font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
            <ui-icon name="trending-up" [size]="20" class="text-success"></ui-icon>
            روند حقوق ۶ ماه گذشته
          </h2>
          <div class="h-72 relative">
            <app-chart [type]="'bar'" [data]="salaryChartData()" [options]="chartOptions()"></app-chart>
          </div>
        </div>
      </div>

      <!-- ═══════════ 6. PERFORMANCE ═══════════ -->
      <div>
        <h2 class="text-xl font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
          <ui-icon name="bar-chart-2" [size]="22" class="text-indigo-500"></ui-icon>
          تحلیل عملکرد
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
            <h3 class="text-sm font-bold text-foreground mb-3 dark:text-slate-100">عملکرد ماهانه</h3>
            <div class="h-60 relative">
              <app-chart [type]="'line'" [data]="monthlyPerformanceData()" [options]="chartOptions()"></app-chart>
            </div>
          </div>
          <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
            <h3 class="text-sm font-bold text-foreground mb-3 dark:text-slate-100">توزیع وظایف</h3>
            <div class="h-64 relative">
              <app-chart [type]="'doughnut'" [data]="taskDistributionData()" [options]="doughnutOptions()"></app-chart>
            </div>
          </div>
          <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
            <h3 class="text-sm font-bold text-foreground mb-3 dark:text-slate-100">اولویت‌بندی وظایف</h3>
            <div class="h-64 relative">
              <app-chart [type]="'doughnut'" [data]="priorityData()" [options]="doughnutOptions()"></app-chart>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ 7. ACTIVITIES + CONTRACT ═══════════ -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div class="bg-surface rounded-2xl p-6 border border-border dark:bg-slate-800 dark:border-slate-700">
            <h2 class="text-lg font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
              <ui-icon name="history" [size]="20" class="text-info"></ui-icon>
              آخرین فعالیت‌ها در {{ activeOrg().name }}
            </h2>
            <div class="space-y-4">
              @for (activity of activities(); track activity.id) {
                <div class="flex items-start gap-4 p-3 rounded-xl hover:bg-background transition-colors">
                  <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ui-icon name="check" [size]="18" class="text-primary"></ui-icon>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-foreground dark:text-slate-200">{{ activity.title }}</p>
                    <p class="text-xs text-muted mt-1">{{ activity.date }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
        <div class="bg-surface rounded-2xl p-6 border border-border dark:bg-slate-800 dark:border-slate-700">
          <h2 class="text-lg font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
            <ui-icon name="shield" [size]="20" class="text-warning"></ui-icon>
            وضعیت قرارداد
          </h2>
          <div class="p-6 bg-background rounded-xl border border-border dark:bg-slate-900 dark:border-slate-700 text-center space-y-3">
            <div class="w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-transform duration-300 hover:scale-110"
                 [class]="activeOrg().contractStatus === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'">
              <ui-icon [name]="activeOrg().contractStatus === 'active' ? 'check-circle' : 'alert-triangle'" [size]="32"></ui-icon>
            </div>
            <p class="font-bold text-lg text-foreground dark:text-slate-100">{{ activeOrg().contractStatus === 'active' ? 'قرارداد فعال است' : 'در حال انقضا' }}</p>
            <p class="text-sm text-muted">نوع همکاری: {{ activeOrg().role }}</p>
            <div class="pt-3 border-t border-border dark:border-slate-700">
              <p class="text-xs text-muted mb-1">شماره پرسنلی</p>
              <p class="text-sm font-mono font-bold text-primary dir-ltr">{{ activeOrg().personnelCode }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vazirmatn { font-family: 'Vazirmatn', sans-serif; }
    @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private orgService = inject(OrganizationService);
  private dataService = inject(EmployeeDataService);
  private themeService = inject(ThemeService);
  private loanService = inject(LoanService);
  private advanceService = inject(AdvanceService);
  private savingsService = inject(SavingsService);
  private taskService = inject(TaskService);
  private reminderService = inject(ReminderService);
  private chatService = inject(ChatService);
  private leaveService = inject(LeaveService);

  activeOrg = this.orgService.activeOrg;
  userName = 'علی احمدی';

  loanStats = this.loanService.stats;
  advanceStats = this.advanceService.stats;
  savingsStats = this.savingsService.stats;
  taskStats = this.taskService.stats;
  reminderStats = this.reminderService.stats;
  leaveStats = this.leaveService.stats;
  unreadMessages = this.chatService.totalUnread;
  unreadNotifications = this.dataService.unreadCount;
  attendanceStatus = this.dataService.attendanceStatus;

  leaveRemaining = computed(() => {
    const b = this.leaveService.balance();
    return b.annualDailyTotal - b.annualDailyUsed;
  });

  currentDate = '';
  currentTime = '';
  private clockInterval: any;

  ngOnInit(): void {
    this.updateDateTime();
    this.clockInterval = setInterval(() => this.updateDateTime(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  /**
   * فرمت تاریخ: پنجشنبه، ۲۹ مرداد ۱۴۰۵
   * ترتیب: روز هفته، روز ماه، نام ماه، سال
   */
  private updateDateTime(): void {
    const now = new Date();

    // استخراج اجزای تاریخ شمسی با ارقام لاتین برای پردازش
    const parts = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).formatToParts(now);

    let weekday = '';
    let day = '';
    let month = '';
    let year = '';

    for (const part of parts) {
      if (part.type === 'weekday') weekday = part.value;
      if (part.type === 'day') day = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'year') year = part.value;
    }

    // فرمت نهایی: پنجشنبه، ۲۹ مرداد ۱۴۰۵
    this.currentDate = `${weekday}، ${this.toFa(day)} ${month} ${this.toFa(year)}`;

    // ساعت فارسی
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    this.currentTime = this.toFa(timeStr);
  }

  loanProgress = computed(() => {
    const s = this.loanStats();
    return s.totalAmountGranted === 0 ? 0 : Math.round((s.totalPaid / s.totalAmountGranted) * 100);
  });

  advanceProgress = computed(() => {
    const s = this.advanceStats();
    return s.totalAmount === 0 ? 0 : Math.round((s.deductedAmount / s.totalAmount) * 100);
  });

  savingsGrowth = computed(() => {
    const s = this.savingsStats();
    return s.totalBalance === 0 ? 0 : Math.round((s.totalInterest / s.totalBalance) * 100);
  });

  reminders = computed((): any[] => {
    const orgId = this.activeOrg().id;
    if (orgId === 'org1') return [{ id: 1, type: 'info', icon: 'bell', title: 'یادآوری', message: 'جلسه هفتگی تیم فنی فردا ساعت ۱۰ صبح برگزار می‌شود.' }];
    if (orgId === 'org2') return [{ id: 2, type: 'warning', icon: 'calendar', title: 'پایان قرارداد', message: 'قرارداد مشاوره شما ۱۵ روز دیگر به پایان می‌رسد.' }];
    return [{ id: 3, type: 'danger', icon: 'alert-triangle', title: 'اخطار', message: 'لطفاً اطلاعات بانکی خود را بروزرسانی کنید.' }];
  });

  activities = computed(() => {
    const orgId = this.activeOrg().id;
    if (orgId === 'org1') return [
      { id: 1, title: 'ثبت ورود موفق در سامانه تردد', date: 'امروز، ۰۸:۱۵' },
      { id: 2, title: 'فیش حقوقی آبان ماه صادر شد', date: '۲ روز پیش' },
      { id: 3, title: 'قسط ۸ وام شخصی کسر شد', date: '۳ روز پیش' }
    ];
    if (orgId === 'org2') return [
      { id: 3, title: 'تأیید صورت‌وضعیت مشاوره توسط کارفرما', date: '۳ روز پیش' },
      { id: 4, title: 'درخواست مرخصی ساعتی ثبت شد', date: '۱ هفته پیش' }
    ];
    return [
      { id: 5, title: 'افزودن عضو جدید به تیم', date: 'دیروز' },
      { id: 6, title: 'بروزرسانی اطلاعات بانکی شرکت', date: '۵ روز پیش' }
    ];
  });

  workChartData = computed(() => {
    const data = this.dataService.monthlyWorkData();
    return {
      labels: data.days.map((d: string | number) => this.toFa(String(d))),
      datasets: [{ label: 'ساعات کاری', data: data.hours, borderColor: 'rgb(59,130,246)', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4, fill: true }]
    };
  });

  salaryChartData = computed(() => {
    const data = this.dataService.salaryComparisonData();
    return {
      labels: data.months.map((m: string | number) => this.toFa(String(m))),
      datasets: [{ label: 'حقوق (تومان)', data: data.salaries, backgroundColor: 'rgba(16,185,129,0.8)', borderColor: 'rgb(16,185,129)', borderWidth: 1, borderRadius: 6 }]
    };
  });

  monthlyPerformanceData = computed(() => ({
    labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
    datasets: [
      { label: 'عملکرد', data: [78, 82, 85, 88, 91, 94], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true, borderWidth: 2 },
      { label: 'هدف', data: [80, 80, 85, 85, 90, 90], borderColor: '#94a3b8', borderDash: [5, 5], tension: 0, fill: false, borderWidth: 2 }
    ]
  }));

  taskDistributionData = computed(() => {
    const s = this.taskStats();
    return { labels: ['در انتظار', 'در حال انجام', 'تکمیل شده'], datasets: [{ label: 'وظایف', data: [s.pending, s.inProgress, s.done], backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'], borderWidth: 0 }] };
  });

  priorityData = computed(() => {
    const tasks = this.taskService.filteredTasks();
    return {
      labels: ['بالا', 'متوسط', 'پایین'],
      datasets: [{ label: 'اولویت', data: [tasks.filter((t: any) => t.priority === 'high').length, tasks.filter((t: any) => t.priority === 'medium').length, tasks.filter((t: any) => t.priority === 'low').length], backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'], borderWidth: 0 }]
    };
  });

  chartOptions = computed(() => {
    const isDark = this.themeService.isDark();
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const self = this;
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' as const, labels: { color: isDark ? '#e2e8f0' : '#1e293b', font: { family: 'Vazirmatn,sans-serif', size: 12 } } },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#fff', titleColor: isDark ? '#e2e8f0' : '#1e293b', bodyColor: isDark ? '#e2e8f0' : '#1e293b',
          borderColor: isDark ? '#475569' : '#e2e8f0', borderWidth: 1, rtl: true, textDirection: 'rtl' as const,
          titleFont: { family: 'Vazirmatn,sans-serif' }, bodyFont: { family: 'Vazirmatn,sans-serif' },
          callbacks: { label: (ctx: any) => ctx.dataset.label + ': ' + self.formatChartValue(ctx.parsed.y ?? ctx.parsed) }
        }
      },
      scales: {
        x: { ticks: { color: textColor, font: { family: 'Vazirmatn,sans-serif' }, callback: (v: any) => self.toFa(String(v)) }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, font: { family: 'Vazirmatn,sans-serif' }, callback: (v: any) => self.formatChartValue(v) }, grid: { color: gridColor } }
      }
    };
  });

  doughnutOptions = computed(() => {
    const isDark = this.themeService.isDark();
    const self = this;
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' as const, labels: { color: isDark ? '#e2e8f0' : '#1e293b', font: { family: 'Vazirmatn,sans-serif', size: 11 }, padding: 15 } },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#fff', titleColor: isDark ? '#e2e8f0' : '#1e293b', bodyColor: isDark ? '#e2e8f0' : '#1e293b',
          rtl: true, textDirection: 'rtl' as const,
          titleFont: { family: 'Vazirmatn,sans-serif' }, bodyFont: { family: 'Vazirmatn,sans-serif' },
          callbacks: { label: (ctx: any) => ctx.label + ': ' + self.toFa(ctx.parsed) }
        }
      }
    };
  });

  formatMoney(amount: number): string {
    if (amount >= 1_000_000_000) {
      return this.toFa((amount / 1_000_000_000).toFixed(1)) + ' میلیارد';
    }
    if (amount >= 1_000_000) {
      return this.toFa(Math.round(amount / 1_000_000)) + ' میلیون';
    }
    const formatted = new Intl.NumberFormat('en-US').format(amount);
    return this.toFa(formatted).replace(/,/g, '٬');
  }

  formatChartValue(value: number): string {
    if (value >= 1_000_000) return this.formatMoney(value);
    if (value >= 1000) {
      const formatted = new Intl.NumberFormat('en-US').format(Math.round(value));
      return this.toFa(formatted).replace(/,/g, '٬');
    }
    return this.toFa(value);
  }

  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }
}
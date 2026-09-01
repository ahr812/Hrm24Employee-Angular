import { Injectable, inject, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';
import { EmployeeDataService } from '../data/employee-data.service';
import { TaskService } from '../tasks/task.service';
import { ReminderService } from '../reminders/reminder.service';
import { SurveyService } from '../survey/survey.service';
import { LoanService } from '../loan/loan.service';
import { AdvanceService } from '../advance/advance.service';
import { SavingsService } from '../savings/savings.service';

export interface KPI {
    label: string;
    value: number | string;
    unit: string;
    trend: 'up' | 'down' | 'neutral';
    trendValue: number;
    color: string;
}

export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string;
        borderWidth?: number;
        borderRadius?: number;
        tension?: number;
        fill?: boolean;
        borderDash?: number[];
    }[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
    private orgService = inject(OrganizationService);
    private dataService = inject(EmployeeDataService);
    private taskService = inject(TaskService);
    private reminderService = inject(ReminderService);
    private surveyService = inject(SurveyService);
    private loanService = inject(LoanService);
    private advanceService = inject(AdvanceService);
    private savingsService = inject(SavingsService);

    kpis = computed((): KPI[] => {
        const taskStats = this.taskService.stats();
        const reminderStats = this.reminderService.stats();
        const surveyStats = this.surveyService.stats();
        const leaveData = this.dataService.leaveData();
        const attendanceStatus = this.dataService.attendanceStatus();
        const loanStats = this.loanService.stats();
        const advanceStats = this.advanceService.stats();
        const savingsStats = this.savingsService.stats();

        return [
            {
                label: 'نرخ تکمیل وظایف',
                value: taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0,
                unit: '٪',
                trend: 'up',
                trendValue: 12,
                color: 'success'
            },
            {
                label: 'وظایف اولویت بالا',
                value: taskStats.highPriority,
                unit: 'عدد',
                trend: taskStats.highPriority > 3 ? 'down' : 'up',
                trendValue: taskStats.highPriority > 3 ? -5 : 8,
                color: taskStats.highPriority > 3 ? 'danger' : 'warning'
            },
            {
                label: 'یادآورهای امروز',
                value: reminderStats.today,
                unit: 'عدد',
                trend: 'neutral',
                trendValue: 0,
                color: 'info'
            },
            {
                label: 'مانده مرخصی',
                value: leaveData.remaining,
                unit: 'روز',
                trend: leaveData.remaining > 10 ? 'up' : 'down',
                trendValue: leaveData.remaining > 10 ? 5 : -3,
                color: leaveData.remaining > 10 ? 'success' : 'warning'
            },
            {
                label: 'پاسخ نظرسنجی‌ها',
                value: surveyStats.totalResponses,
                unit: 'عدد',
                trend: 'up',
                trendValue: 23,
                color: 'primary'
            },
            {
                label: 'وضعیت حضور',
                value: attendanceStatus.isCheckedIn ? 'حاضر' : 'غایب',
                unit: '',
                trend: attendanceStatus.isCheckedIn ? 'up' : 'down',
                trendValue: attendanceStatus.isCheckedIn ? 100 : 0,
                color: attendanceStatus.isCheckedIn ? 'success' : 'danger'
            },
            {
                label: 'وام‌های فعال',
                value: loanStats.activeLoans,
                unit: 'عدد',
                trend: loanStats.activeLoans > 0 ? 'neutral' : 'up',
                trendValue: 0,
                color: 'primary'
            },
            {
                label: 'مانده بدهی وام',
                value: loanStats.totalRemaining > 0 ? Math.round(loanStats.totalRemaining / 1000000) + ' میلیون' : '۰',
                unit: 'تومان',
                trend: loanStats.totalRemaining > 0 ? 'down' : 'up',
                trendValue: loanStats.totalRemaining > 0 ? -5 : 0,
                color: loanStats.totalRemaining > 0 ? 'warning' : 'success'
            },
            {
                label: 'مساعده‌های کسر نشده',
                value: advanceStats.notDeducted + advanceStats.approved,
                unit: 'عدد',
                trend: advanceStats.notDeducted > 0 ? 'down' : 'up',
                trendValue: advanceStats.notDeducted > 0 ? -3 : 0,
                color: advanceStats.notDeducted > 0 ? 'warning' : 'success'
            },
            {
                label: 'موجودی پس‌انداز',
                value: savingsStats.totalBalance > 0 ? Math.round(savingsStats.totalBalance / 1000000) + ' میلیون' : '۰',
                unit: 'تومان',
                trend: savingsStats.totalBalance > 0 ? 'up' : 'neutral',
                trendValue: savingsStats.totalBalance > 0 ? 8 : 0,
                color: 'success'
            }
        ];
    });

    taskDistributionChart = computed((): ChartData => {
        const stats = this.taskService.stats();
        return {
            labels: ['در انتظار', 'در حال انجام', 'تکمیل شده'],
            datasets: [{
                label: 'وظایف',
                data: [stats.pending, stats.inProgress, stats.done],
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
                borderWidth: 0
            }]
        };
    });

    weeklyActivityChart = computed((): ChartData => {
        return {
            labels: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'],
            datasets: [{
                label: 'ساعات کاری',
                data: [8.5, 9, 8, 9.5, 8, 7, 0],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2
            }]
        };
    });

    monthlyPerformanceChart = computed((): ChartData => {
        return {
            labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
            datasets: [
                {
                    label: 'عملکرد',
                    data: [78, 82, 85, 88, 91, 94],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: 'هدف',
                    data: [80, 80, 85, 85, 90, 90],
                    borderColor: '#94a3b8',
                    borderDash: [5, 5],
                    tension: 0,
                    fill: false,
                    borderWidth: 2
                }
            ]
        };
    });

    priorityBreakdownChart = computed((): ChartData => {
        const tasks = this.taskService.filteredTasks();
        const high = tasks.filter(t => t.priority === 'high').length;
        const medium = tasks.filter(t => t.priority === 'medium').length;
        const low = tasks.filter(t => t.priority === 'low').length;

        return {
            labels: ['بالا', 'متوسط', 'پایین'],
            datasets: [{
                label: 'اولویت',
                data: [high, medium, low],
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                borderWidth: 0
            }]
        };
    });

    // --- Financial Charts (جدید) ---
    financialOverviewChart = computed((): ChartData => {
        const loanStats = this.loanService.stats();
        const advanceStats = this.advanceService.stats();
        const savingsStats = this.savingsService.stats();

        return {
            labels: ['وام پرداختی', 'مانده وام', 'مساعده کل', 'مساعده کسر شده', 'پس‌انداز واریزی', 'موجودی پس‌انداز'],
            datasets: [{
                label: 'مبلغ (میلیون تومان)',
                data: [
                    Math.round(loanStats.totalAmountGranted / 1000000),
                    Math.round(loanStats.totalRemaining / 1000000),
                    Math.round(advanceStats.totalAmount / 1000000),
                    Math.round(advanceStats.deductedAmount / 1000000),
                    Math.round(savingsStats.totalDeposited / 1000000),
                    Math.round(savingsStats.totalBalance / 1000000)
                ],
                backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'],
                borderWidth: 0,
                borderRadius: 6
            }]
        };
    });

    loanStatusChart = computed((): ChartData => {
        const loans = this.loanService.myLoans();
        const active = loans.filter((l: any) => l.status === 'active').length;
        const pending = loans.filter((l: any) => l.status === 'pending').length;
        const completed = loans.filter((l: any) => l.status === 'completed').length;

        return {
            labels: ['فعال', 'در انتظار', 'تکمیل شده'],
            datasets: [{
                label: 'وام‌ها',
                data: [active, pending, completed],
                backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
                borderWidth: 0
            }]
        };
    });

    savingsGrowthChart = computed((): ChartData => {
        const savingsStats = this.savingsService.stats();
        const deposited = Math.round(savingsStats.totalDeposited / 1000000);
        const interest = Math.round(savingsStats.totalInterest / 1000000);
        const balance = Math.round(savingsStats.totalBalance / 1000000);

        return {
            labels: ['کل واریزی', 'سود دریافتی', 'موجودی فعلی'],
            datasets: [{
                label: 'مبلغ (میلیون تومان)',
                data: [deposited, interest, balance],
                backgroundColor: ['#8b5cf6', '#06b6d4', '#10b981'],
                borderWidth: 0,
                borderRadius: 6
            }]
        };
    });

    advanceStatusChart = computed((): ChartData => {
        const advanceStats = this.advanceService.stats();
        return {
            labels: ['در انتظار', 'تأیید شده', 'کسر شده', 'رد شده'],
            datasets: [{
                label: 'مساعده‌ها',
                data: [advanceStats.pending, advanceStats.approved, advanceStats.deducted, advanceStats.rejected],
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
                borderWidth: 0
            }]
        };
    });
}
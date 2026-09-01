import { Injectable, inject, computed, signal } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';
import { AIAnalysisService, FullAIAnalysis } from '../ai/ai-analysis.service';

// --- Interfaces ---
export interface LeaveData {
    total: number;
    used: number;
    remaining: number;
    hourlyBalance: number;
}

export interface LeaveRequest {
    id: number;
    type: string;
    fromDate: string;
    toDate: string;
    status: 'تأیید شده' | 'در انتظار' | 'رد شده';
}

export interface LeavePolicy {
    maxSickLeaveDays: number;
    requiresAttachment: boolean;
}

export interface PayslipData {
    month: string;
    baseSalary: number;
    netPay: number;
    performanceCoefficient: number;
}

export interface AttendanceRecord {
    id: number;
    date: string;
    dayName: string;
    checkIn: string;
    checkOut: string;
    hours: string;
    status: 'حاضر' | 'تاخیر' | 'غیبت';
}

export interface AttendanceStatus {
    isCheckedIn: boolean;
    lastActionTime: string;
    todayWorkedHours: string;
}

export interface Ticket {
    id: number;
    title: string;
    status: 'در انتظار بررسی' | 'پاسخ داده شد' | 'بسته شده';
    date: string;
    department: string;
}

export interface JobProfile {
    personnelCode: string;
    jobTitle: string;
    department: string;
    manager: string;
    startDate: string;
    employmentType: 'رسمی' | 'قراردادی' | 'مشاوره' | 'پاره‌وقت';
}

export interface Notification {
    id: number;
    type: 'info' | 'warning' | 'success' | 'danger';
    title: string;
    message: string;
    date: string;
    isRead: boolean;
}

export interface MonthlyWorkData {
    days: string[];
    hours: number[];
}

export interface SalaryComparisonData {
    months: string[];
    salaries: number[];
}

export interface CalendarEvent {
    id: number;
    date: string;
    type: 'leave' | 'meeting' | 'holiday' | 'deadline';
    title: string;
    description: string;
    time?: string;
}

export interface CompanyComparison {
    companyId: string;
    companyName: string;
    logoColor: string;
    monthlyHours: number;
    avgDailyHours: number;
    leaveUsed: number;
    leaveRemaining: number;
    lastSalary: number;
    salaryGrowth: number;
    openTickets: number;
    attendanceRate: number;
    overtimeHours: number;
}

export interface PerformanceMetrics {
    labels: string[];
    datasets: {
        company: string;
        color: string;
        data: number[];
    }[];
}

export interface EvaluationDimension {
    name: string;
    score: number;
    weight: number;
}

export interface EvaluationCycle {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: 'upcoming' | 'active' | 'completed';
}

export interface MyEvaluation {
    cycleId: string;
    cycleTitle: string;
    overallScore: number;
    selfScore: number;
    managerScore: number;
    peerScore: number;
    status: 'not-started' | 'in-progress' | 'completed';
    completedAt: string | null;
    dimensions: EvaluationDimension[];
    feedbacks: string[];
}

export interface PendingEvaluation {
    id: string;
    employeeName: string;
    role: string;
    cycleTitle: string;
    deadline: string;
    type: 'self' | 'manager' | 'peer';
}

export type QuestionType = 'rating' | 'text' | 'multiple-choice';

export interface EvaluationQuestionOption {
    value: number;
    label: string;
}

export interface EvaluationQuestion {
    id: string;
    dimension: string;
    text: string;
    type: QuestionType;
    weight: number;
    options?: EvaluationQuestionOption[];
    maxRating?: number;
    required: boolean;
}

export interface EvaluationForm {
    id: string;
    cycleId: string;
    title: string;
    description: string;
    type: 'self' | 'manager' | 'peer';
    questions: EvaluationQuestion[];
    deadline: string;
}

export interface EvaluationAnswer {
    questionId: string;
    value: number | string;
    comment?: string;
}

export interface EvaluationResponse {
    id: string;
    formId: string;
    evaluatorId: string;
    targetEmployeeId: string;
    targetEmployeeName: string;
    cycleId: string;
    answers: EvaluationAnswer[];
    submittedAt: string | null;
    status: 'draft' | 'submitted';
    calculatedScore: number;
}

export interface DimensionTrend {
    name: string;
    currentScore: number;
    previousScore: number;
    change: number;
}

export interface PersonalAnalytics {
    overallTrend: number;
    strongestDimension: string;
    weakestDimension: string;
    dimensionTrends: DimensionTrend[];
    scoreHistory: { cycle: string; score: number }[];
    percentileRank: number;
}

export interface TeamMemberAnalytics {
    name: string;
    role: string;
    overallScore: number;
    trend: number;
    strongestDimension: string;
    weakestDimension: string;
}

export interface ScoreDistribution {
    range: string;
    count: number;
    percentage: number;
}

export interface TeamAnalytics {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    memberCount: number;
    members: TeamMemberAnalytics[];
    scoreDistribution: ScoreDistribution[];
    teamDimensionAverages: { name: string; average: number }[];
}

@Injectable({ providedIn: 'root' })
export class EmployeeDataService {
    private orgService = inject(OrganizationService);
    private aiService = inject(AIAnalysisService);
    private activeOrg = this.orgService.activeOrg;
    private readNotifications = signal<Set<number>>(new Set());
    private removedPendingIds = signal<Set<string>>(new Set());
    private evaluationResponses = signal<EvaluationResponse[]>([]);

    // ── Calendar Events Signal (mutable) ──
    calendarEvents = signal<CalendarEvent[]>(this.loadCalendarEvents());

    private loadCalendarEvents(): CalendarEvent[] {
        if (typeof localStorage === 'undefined') return this.getDefaultCalendarEvents();
        try {
            const stored = localStorage.getItem('hrm24_calendar_events');
            return stored ? JSON.parse(stored) : this.getDefaultCalendarEvents();
        } catch {
            return this.getDefaultCalendarEvents();
        }
    }

    private saveCalendarEvents(): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem('hrm24_calendar_events', JSON.stringify(this.calendarEvents()));
        } catch (error) {
            console.error('Error saving calendar events:', error);
        }
    }

    addCalendarEvent(event: Omit<CalendarEvent, 'id'>): void {
        const newId = Date.now();
        const newEvent: CalendarEvent = { ...event, id: newId };
        this.calendarEvents.update(events => [...events, newEvent]);
        this.saveCalendarEvents();
    }

    updateCalendarEvent(id: number, updates: Partial<CalendarEvent>): void {
        this.calendarEvents.update(events =>
            events.map(e => e.id === id ? { ...e, ...updates } : e)
        );
        this.saveCalendarEvents();
    }

    deleteCalendarEvent(id: number): void {
        this.calendarEvents.update(events => events.filter(e => e.id !== id));
        this.saveCalendarEvents();
    }

    private getDefaultCalendarEvents(): CalendarEvent[] {
        return [
            { id: 1, date: '1405/05/10', type: 'leave', title: 'مرخصی استحقاقی', description: 'مرخصی ۳ روزه' },
            { id: 2, date: '1405/05/15', type: 'meeting', title: 'جلسه تیم فنی', description: 'بررسی پروژه جدید', time: '10:00' },
            { id: 3, date: '1405/05/20', type: 'deadline', title: 'تحویل پروژه', description: 'مهلت فاز اول' },
            { id: 4, date: '1405/05/22', type: 'holiday', title: 'تعطیل رسمی', description: 'روز جمهوری' }
        ];
    }

    // --- Leave Data ---
    leaveData = computed((): LeaveData => {
        const orgId = this.activeOrg().id;
        if (orgId === 'org1') return { total: 17, used: 5, remaining: 12, hourlyBalance: 8 };
        if (orgId === 'org2') return { total: 0, used: 0, remaining: 0, hourlyBalance: 0 };
        return { total: 20, used: 2, remaining: 18, hourlyBalance: 20 };
    });

    leaveRequests = computed((): LeaveRequest[] => {
        const orgId = this.activeOrg().id;
        if (orgId === 'org1') {
            return [
                { id: 1, type: 'استحقاقی', fromDate: '1403/08/10', toDate: '1403/08/12', status: 'تأیید شده' },
                { id: 2, type: 'استعلاجی', fromDate: '1403/07/05', toDate: '1403/07/05', status: 'در انتظار' }
            ];
        } else if (orgId === 'org2') {
            return [
                { id: 3, type: 'بدون حقوق', fromDate: '1403/09/01', toDate: '1403/09/03', status: 'در انتظار' }
            ];
        }
        return [];
    });

    leavePolicy = computed((): LeavePolicy => {
        const orgId = this.activeOrg().id;
        if (orgId === 'org1') return { maxSickLeaveDays: 7, requiresAttachment: true };
        if (orgId === 'org2') return { maxSickLeaveDays: 0, requiresAttachment: false };
        return { maxSickLeaveDays: 30, requiresAttachment: false };
    });

    // --- Payslip Data ---
    payslipData = computed((): PayslipData[] => {
        const orgId = this.activeOrg().id;
        const perfCoeff = this.getPerformanceCoefficient();

        if (orgId === 'org1') {
            return [
                { month: 'آبان ۱۴۰۳', baseSalary: 12000000, netPay: 13700000, performanceCoefficient: perfCoeff },
                { month: 'مهر ۱۴۰۳', baseSalary: 12000000, netPay: 13500000, performanceCoefficient: 1.0 }
            ];
        } else if (orgId === 'org2') {
            return [
                { month: 'آبان ۱۴۰۳', baseSalary: 5000000, netPay: 5000000, performanceCoefficient: perfCoeff },
                { month: 'مهر ۱۴۰۳', baseSalary: 5000000, netPay: 5000000, performanceCoefficient: 1.0 }
            ];
        } else {
            return [
                { month: 'آبان ۱۴۰۳', baseSalary: 20000000, netPay: 22000000, performanceCoefficient: perfCoeff },
                { month: 'مهر ۱۴۰۳', baseSalary: 20000000, netPay: 22000000, performanceCoefficient: 1.0 }
            ];
        }
    });

    // --- Attendance Data ---
    attendanceStatus = computed((): AttendanceStatus => {
        const orgId = this.activeOrg().id;
        if (orgId === 'org1') return { isCheckedIn: true, lastActionTime: '08:15', todayWorkedHours: '4:30' };
        if (orgId === 'org2') return { isCheckedIn: false, lastActionTime: '--:--', todayWorkedHours: '0:00' };
        return { isCheckedIn: true, lastActionTime: '18:00', todayWorkedHours: '8:00' };
    });

    attendanceRecords = computed((): AttendanceRecord[] => {
        const orgId = this.activeOrg().id;
        if (orgId === 'org1') {
            return [
                { id: 1, date: '1403/08/10', dayName: 'شنبه', checkIn: '08:00', checkOut: '17:00', hours: '9', status: 'حاضر' },
                { id: 2, date: '1403/08/09', dayName: 'پنج‌شنبه', checkIn: '08:30', checkOut: '17:00', hours: '8.5', status: 'تاخیر' }
            ];
        } else if (orgId === 'org2') {
            return [
                { id: 3, date: '1403/08/10', dayName: 'شنبه', checkIn: '10:00', checkOut: '14:00', hours: '4', status: 'حاضر' },
                { id: 4, date: '1403/08/08', dayName: 'چهارشنبه', checkIn: '10:00', checkOut: '14:00', hours: '4', status: 'حاضر' }
            ];
        } else {
            return [
                { id: 5, date: '1403/08/10', dayName: 'شنبه', checkIn: '18:00', checkOut: '02:00', hours: '8', status: 'حاضر' },
                { id: 6, date: '1403/08/09', dayName: 'پنج‌شنبه', checkIn: '18:00', checkOut: '02:00', hours: '8', status: 'حاضر' }
            ];
        }
    });

    // --- Tickets Data ---
    tickets = computed((): Ticket[] => {
        const orgId = this.activeOrg().id;
        if (orgId === 'org1') {
            return [
                { id: 1, title: 'درخواست وام مسکن', status: 'در انتظار بررسی', date: '1403/08/01', department: 'امور مالی' },
                { id: 2, title: 'مشکل در دسترسی شبکه', status: 'پاسخ داده شد', date: '1403/07/25', department: 'فناوری اطلاعات' }
            ];
        } else if (orgId === 'org2') {
            return [
                { id: 3, title: 'تمدید قرارداد مشاوره', status: 'بسته شده', date: '1403/07/10', department: 'منابع انسانی' }
            ];
        } else {
            return [
                { id: 4, title: 'خرید سرور جدید', status: 'در انتظار بررسی', date: '1403/08/05', department: 'مدیریت عامل' },
                { id: 5, title: 'استخدام نیروی جدید', status: 'پاسخ داده شد', date: '1403/07/20', department: 'منابع انسانی' }
            ];
        }
    });

    // --- Job Profile Data ---
    jobProfile = computed((): JobProfile => {
        const orgId = this.activeOrg().id;
        if (orgId === 'org1') {
            return {
                personnelCode: '90215',
                jobTitle: 'کارشناس ارشد نرم‌افزار',
                department: 'فناوری اطلاعات',
                manager: 'مهندس رضایی',
                startDate: '1400/03/15',
                employmentType: 'رسمی'
            };
        } else if (orgId === 'org2') {
            return {
                personnelCode: '44102',
                jobTitle: 'مشاور فنی پروژه',
                department: 'مدیریت پروژه',
                manager: 'دکتر احمدی',
                startDate: '1402/01/10',
                employmentType: 'مشاوره'
            };
        } else {
            return {
                personnelCode: '001',
                jobTitle: 'هم‌بنیان‌گذار و مدیر فنی',
                department: 'هیئت مدیره',
                manager: '-',
                startDate: '1398/06/01',
                employmentType: 'رسمی'
            };
        }
    });

    // --- Notifications Data ---
    notifications = computed((): Notification[] => {
        const orgId = this.activeOrg().id;
        const readSet = this.readNotifications();

        let notifications: Notification[] = [];

        if (orgId === 'org1') {
            notifications = [
                { id: 1, type: 'success', title: 'فیش حقوقی آبان صادر شد', message: 'فیش حقوقی ماه جاری در بخش فیش حقوقی قابل مشاهده است.', date: 'امروز', isRead: readSet.has(1) },
                { id: 2, type: 'info', title: 'جلسه تیم فنی', message: 'جلسه هفتگی تیم فنی فردا ساعت ۱۰ صبح برگزار می‌شود.', date: 'دیروز', isRead: readSet.has(2) },
                { id: 3, type: 'warning', title: 'قرارداد در حال انقضا', message: 'قرارداد شما ۳۰ روز دیگر به پایان می‌رسد. لطفاً برای تمدید اقدام کنید.', date: '۳ روز پیش', isRead: readSet.has(3) }
            ];
        } else if (orgId === 'org2') {
            notifications = [
                { id: 4, type: 'success', title: 'تأیید صورت‌وضعیت', message: 'صورت‌وضعیت مشاوره شما توسط کارفرما تأیید شد.', date: 'امروز', isRead: readSet.has(4) },
                { id: 5, type: 'info', title: 'تمدید قرارداد', message: 'پیشنهاد تمدید قرارداد برای شما ارسال شده است.', date: '۲ روز پیش', isRead: readSet.has(5) }
            ];
        } else {
            notifications = [
                { id: 6, type: 'danger', title: 'نیاز به اقدام فوری', message: 'لطفاً اطلاعات بانکی شرکت را بروزرسانی کنید.', date: 'امروز', isRead: readSet.has(6) },
                { id: 7, type: 'info', title: 'جلسه هیئت مدیره', message: 'جلسه هیئت مدیره هفته آینده برگزار خواهد شد.', date: 'دیروز', isRead: readSet.has(7) }
            ];
        }

        return notifications;
    });

    unreadCount = computed(() => {
        return this.notifications().filter(n => !n.isRead).length;
    });

    markAsRead(notificationId: number): void {
        const currentSet = new Set(this.readNotifications());
        currentSet.add(notificationId);
        this.readNotifications.set(currentSet);
    }

    markAllAsRead(): void {
        const allIds = this.notifications().map(n => n.id);
        this.readNotifications.set(new Set(allIds));
    }

    // --- Chart Data ---
    monthlyWorkData = computed((): MonthlyWorkData => {
        const orgId = this.activeOrg().id;
        if (orgId === 'org1') {
            return {
                days: ['۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '۱۰'],
                hours: [8, 8.5, 9, 8, 7.5, 8, 9, 8.5, 8, 9]
            };
        } else if (orgId === 'org2') {
            return {
                days: ['۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '۱۰'],
                hours: [4, 4, 0, 4, 4, 0, 4, 4, 0, 4]
            };
        } else {
            return {
                days: ['۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '۱۰'],
                hours: [10, 12, 8, 11, 9, 10, 12, 11, 10, 9]
            };
        }
    });

    salaryComparisonData = computed((): SalaryComparisonData => {
        const orgId = this.activeOrg().id;
        if (orgId === 'org1') {
            return {
                months: ['مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی'],
                salaries: [12500000, 12800000, 13000000, 13200000, 13500000, 13700000]
            };
        } else if (orgId === 'org2') {
            return {
                months: ['مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی'],
                salaries: [4500000, 4800000, 5000000, 5000000, 5200000, 5500000]
            };
        } else {
            return {
                months: ['مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی'],
                salaries: [18000000, 19000000, 20000000, 21000000, 22000000, 23000000]
            };
        }
    });

    // --- Company Comparison Data ---
    companyComparison = computed((): CompanyComparison[] => {
        const orgs = this.orgService.allOrgs;

        return orgs.map(org => {
            const orgId = org.id;
            const leaveData = this.getLeaveDataForOrg(orgId);
            const payslipData = this.getPayslipDataForOrg(orgId);
            const attendanceData = this.getAttendanceDataForOrg(orgId);
            const tickets = this.getTicketsForOrg(orgId);

            const lastSalary = payslipData.length > 0 ? payslipData[0].netPay : 0;
            const prevSalary = payslipData.length > 1 ? payslipData[1].netPay : lastSalary;
            const salaryGrowth = prevSalary > 0 ? Math.round(((lastSalary - prevSalary) / prevSalary) * 100) : 0;

            const totalHours = attendanceData.reduce((sum, r) => {
                const hours = parseFloat(r.hours) || 0;
                return sum + hours;
            }, 0);

            const avgDailyHours = attendanceData.length > 0 ? Math.round((totalHours / attendanceData.length) * 10) / 10 : 0;

            const openTickets = tickets.filter(t => t.status !== 'بسته شده').length;

            const presentDays = attendanceData.filter(r => r.status === 'حاضر').length;
            const attendanceRate = attendanceData.length > 0 ? Math.round((presentDays / attendanceData.length) * 100) : 0;

            const overtimeHours = attendanceData.reduce((sum, r) => {
                const hours = parseFloat(r.hours) || 0;
                return hours > 8 ? sum + (hours - 8) : sum;
            }, 0);

            return {
                companyId: orgId,
                companyName: org.name,
                logoColor: org.logoColor,
                monthlyHours: Math.round(totalHours),
                avgDailyHours,
                leaveUsed: leaveData.used,
                leaveRemaining: leaveData.remaining,
                lastSalary,
                salaryGrowth,
                openTickets,
                attendanceRate,
                overtimeHours: Math.round(overtimeHours * 10) / 10
            };
        });
    });

    performanceMetrics = computed((): PerformanceMetrics => {
        const orgs = this.orgService.allOrgs;

        return {
            labels: ['ساعات کاری', 'نرخ حضور', 'اضافه کاری', 'مانده مرخصی', 'تیکت‌های باز'],
            datasets: orgs.map(org => {
                const comparison = this.companyComparison().find(c => c.companyId === org.id);
                if (!comparison) {
                    return { company: org.name, color: '#94a3b8', data: [0, 0, 0, 0, 0] };
                }

                return {
                    company: org.name,
                    color: this.getOrgColor(org.id),
                    data: [
                        comparison.monthlyHours,
                        comparison.attendanceRate,
                        comparison.overtimeHours,
                        comparison.leaveRemaining,
                        comparison.openTickets
                    ]
                };
            })
        };
    });

    salaryTrendComparison = computed(() => {
        const orgs = this.orgService.allOrgs;
        const months = ['مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی'];

        return {
            labels: months,
            datasets: orgs.map(org => {
                const payslipData = this.getPayslipDataForOrg(org.id);
                const salaries = months.map((_, index) => {
                    if (index < payslipData.length) {
                        return payslipData[payslipData.length - 1 - index].netPay;
                    }
                    return 0;
                }).reverse();

                return {
                    company: org.name,
                    color: this.getOrgColor(org.id),
                    data: salaries
                };
            })
        };
    });

    // --- Performance Evaluation Data ---
    evaluationCycles = computed((): EvaluationCycle[] => {
        const now = new Date();

        const cycles: EvaluationCycle[] = [
            { id: 'eval-1', title: 'ارزیابی عملکرد نیمه اول ۱۴۰۳', startDate: '1403/04/01', endDate: '1403/06/31', status: 'completed' },
            { id: 'eval-2', title: 'ارزیابی عملکرد سه‌ماهه سوم ۱۴۰۳', startDate: '1403/07/01', endDate: '1403/09/30', status: 'active' },
            { id: 'eval-3', title: 'ارزیابی عملکرد سالانه ۱۴۰۳', startDate: '1403/10/01', endDate: '1403/12/29', status: 'upcoming' }
        ];

        return cycles.map(cycle => ({
            ...cycle,
            status: this.calculateCycleStatus(cycle.startDate, cycle.endDate, now)
        }));
    });

    myEvaluations = computed((): MyEvaluation[] => {
        const orgId = this.activeOrg().id;
        if (orgId === 'org1') {
            return [
                {
                    cycleId: 'eval-1', cycleTitle: 'ارزیابی عملکرد نیمه اول ۱۴۰۳',
                    overallScore: 85, selfScore: 88, managerScore: 82, peerScore: 86,
                    status: 'completed', completedAt: '1403/07/15',
                    dimensions: [
                        { name: 'دانش فنی', score: 90, weight: 30 },
                        { name: 'کار تیمی', score: 85, weight: 25 },
                        { name: 'خلاقیت و نوآوری', score: 80, weight: 20 },
                        { name: 'مسئولیت‌پذیری', score: 88, weight: 15 },
                        { name: 'ارتباطات', score: 82, weight: 10 }
                    ],
                    feedbacks: [
                        'عملکرد فنی بسیار عالی و قابل تحسین است. دانش عمیقی در حوزه فرانت‌اند دارد.',
                        'همکاری تیمی خوبی دارد اما گاهی در ارتباطات کلامی نیاز به بهبود دارد.',
                        'خلاقیت خوب در حل مسائل پیچیده. مسئولیت‌پذیری بالا در تحویل پروژه‌ها.',
                        'پیشنهاد می‌شود در ارائه و مستندسازی بیشتر تلاش کند.'
                    ]
                },
                {
                    cycleId: 'eval-2', cycleTitle: 'ارزیابی عملکرد سه‌ماهه سوم ۱۴۰۳',
                    overallScore: 0, selfScore: 0, managerScore: 0, peerScore: 0,
                    status: 'in-progress', completedAt: null,
                    dimensions: [
                        { name: 'دانش فنی', score: 0, weight: 30 },
                        { name: 'کار تیمی', score: 0, weight: 25 },
                        { name: 'خلاقیت و نوآوری', score: 0, weight: 20 },
                        { name: 'مسئولیت‌پذیری', score: 0, weight: 15 },
                        { name: 'ارتباطات', score: 0, weight: 10 }
                    ],
                    feedbacks: []
                }
            ];
        } else if (orgId === 'org2') {
            return [
                {
                    cycleId: 'eval-1', cycleTitle: 'ارزیابی عملکرد نیمه اول ۱۴۰۳',
                    overallScore: 78, selfScore: 80, managerScore: 76, peerScore: 79,
                    status: 'completed', completedAt: '1403/07/20',
                    dimensions: [
                        { name: 'کیفیت مشاوره', score: 82, weight: 35 },
                        { name: 'مدیریت زمان', score: 75, weight: 25 },
                        { name: 'گزارش‌دهی', score: 78, weight: 20 },
                        { name: 'تعامل با کارفرما', score: 80, weight: 20 }
                    ],
                    feedbacks: [
                        'کیفیت مشاوره خوب است اما نیاز به سرعت عمل بیشتر در پاسخگویی دارد.',
                        'گزارش‌ها ساختار مناسبی دارند ولی گاهی تاخیر در ارسال مشاهده می‌شود.',
                        'تعامل حرفه‌ای با کارفرما قابل قبول است. مدیریت زمان نیاز به بهبود دارد.'
                    ]
                }
            ];
        }
        return [];
    });

    pendingEvaluations = computed((): PendingEvaluation[] => {
        const orgId = this.activeOrg().id;
        const removed = this.removedPendingIds();
        let result: PendingEvaluation[] = [];

        if (orgId === 'org1') {
            result = [
                { id: 'pe-1', employeeName: 'رضا کریمی', role: 'توسعه‌دهنده فرانت‌اند', cycleTitle: 'سه‌ماهه سوم ۱۴۰۳', deadline: '1403/09/25', type: 'manager' },
                { id: 'pe-2', employeeName: 'مریم حسینی', role: 'طراح UI/UX', cycleTitle: 'سه‌ماهه سوم ۱۴۰۳', deadline: '1403/09/25', type: 'peer' }
            ];
        }

        return result.filter(p => !removed.has(p.id));
    });

    // --- Evaluation Forms ---
    evaluationForms = computed((): EvaluationForm[] => {
        const orgId = this.activeOrg().id;

        if (orgId === 'org1') {
            return [
                {
                    id: 'form-self-eval-2',
                    cycleId: 'eval-2',
                    title: 'خودارزیابی سه‌ماهه سوم ۱۴۰۳',
                    description: 'لطفاً عملکرد خود را در سه‌ماهه سوم سال ۱۴۰۳ ارزیابی کنید.',
                    type: 'self',
                    deadline: '1403/09/30',
                    questions: [
                        { id: 'q1', dimension: 'دانش فنی', text: 'دانش فنی خود را چگونه ارزیابی می‌کنید؟', type: 'rating', weight: 30, maxRating: 5, required: true },
                        { id: 'q2', dimension: 'دانش فنی', text: 'یک نمونه از چالش فنی که حل کردید را توضیح دهید.', type: 'text', weight: 0, required: false },
                        { id: 'q3', dimension: 'کار تیمی', text: 'میزان همکاری شما در کارهای تیمی چقدر بوده است؟', type: 'rating', weight: 25, maxRating: 5, required: true },
                        {
                            id: 'q4', dimension: 'کار تیمی', text: 'نقش شما در تیم بیشتر چه بوده است؟', type: 'multiple-choice', weight: 0, required: false, options: [
                                { value: 1, label: 'رهبر تیم' },
                                { value: 2, label: 'عضو فعال' },
                                { value: 3, label: 'عضو معمولی' },
                                { value: 4, label: 'کمتر مشارکت' }
                            ]
                        },
                        { id: 'q5', dimension: 'خلاقیت و نوآوری', text: 'چقدر در ارائه راه‌حل‌های نوآورانه مشارکت داشته‌اید؟', type: 'rating', weight: 20, maxRating: 5, required: true },
                        { id: 'q6', dimension: 'مسئولیت‌پذیری', text: 'تعهد شما به تحویل به موقع وظایف چگونه بوده است؟', type: 'rating', weight: 15, maxRating: 5, required: true },
                        { id: 'q7', dimension: 'ارتباطات', text: 'کیفیت ارتباط شما با همکاران و مدیران چگونه است؟', type: 'rating', weight: 10, maxRating: 5, required: true }
                    ]
                },
                {
                    id: 'form-manager-eval-pe-1',
                    cycleId: 'eval-2',
                    title: 'ارزیابی مدیر: رضا کریمی',
                    description: 'لطفاً عملکرد رضا کریمی را ارزیابی کنید.',
                    type: 'manager',
                    deadline: '1403/09/25',
                    questions: [
                        { id: 'q1', dimension: 'دانش فنی', text: 'سطح دانش فنی رضا کریمی؟', type: 'rating', weight: 30, maxRating: 5, required: true },
                        { id: 'q2', dimension: 'کار تیمی', text: 'میزان همکاری رضا؟', type: 'rating', weight: 25, maxRating: 5, required: true },
                        { id: 'q3', dimension: 'خلاقیت و نوآوری', text: 'مشارکت در نوآوری؟', type: 'rating', weight: 20, maxRating: 5, required: true },
                        { id: 'q4', dimension: 'مسئولیت‌پذیری', text: 'تعهد به تحویل به موقع؟', type: 'rating', weight: 15, maxRating: 5, required: true },
                        { id: 'q5', dimension: 'ارتباطات', text: 'کیفیت ارتباط؟', type: 'rating', weight: 10, maxRating: 5, required: true },
                        { id: 'q6', dimension: 'نقاط قوت', text: 'نقاط قوت اصلی را ذکر کنید.', type: 'text', weight: 0, required: true },
                        { id: 'q7', dimension: 'پیشنهادات', text: 'پیشنهادات برای بهبود؟', type: 'text', weight: 0, required: false }
                    ]
                },
                {
                    id: 'form-peer-eval-pe-2',
                    cycleId: 'eval-2',
                    title: 'ارزیابی همکار: مریم حسینی',
                    description: 'ارزیابی ناشناس عملکرد مریم حسینی.',
                    type: 'peer',
                    deadline: '1403/09/25',
                    questions: [
                        { id: 'q1', dimension: 'کیفیت کار', text: 'کیفیت کارهای طراحی مریم؟', type: 'rating', weight: 30, maxRating: 5, required: true },
                        { id: 'q2', dimension: 'همکاری', text: 'میزان همکاری و پاسخگویی؟', type: 'rating', weight: 25, maxRating: 5, required: true },
                        { id: 'q3', dimension: 'خلاقیت', text: 'سطح خلاقیت در طراحی‌ها؟', type: 'rating', weight: 25, maxRating: 5, required: true },
                        { id: 'q4', dimension: 'ارتباطات', text: 'کیفیت ارتباط حرفه‌ای؟', type: 'rating', weight: 20, maxRating: 5, required: true },
                        { id: 'q5', dimension: 'بازخورد', text: 'بازخورد یا پیشنهاد.', type: 'text', weight: 0, required: false }
                    ]
                }
            ];
        }

        return [];
    });

    // --- Personal Analytics ---
    personalAnalytics = computed((): PersonalAnalytics => {
        const evaluations = this.myEvaluations().filter(e => e.status === 'completed');

        if (evaluations.length === 0) {
            return {
                overallTrend: 0,
                strongestDimension: '-',
                weakestDimension: '-',
                dimensionTrends: [],
                scoreHistory: [],
                percentileRank: 0
            };
        }

        const latest = evaluations[0];
        const previous = evaluations.length > 1 ? evaluations[1] : null;

        const overallTrend = previous ? latest.overallScore - previous.overallScore : 0;

        const sortedDims = [...latest.dimensions].sort((a, b) => b.score - a.score);
        const strongestDimension = sortedDims.length > 0 ? sortedDims[0].name : '-';
        const weakestDimension = sortedDims.length > 0 ? sortedDims[sortedDims.length - 1].name : '-';

        const dimensionTrends: DimensionTrend[] = latest.dimensions.map(dim => {
            const prevDim = previous?.dimensions.find(d => d.name === dim.name);
            const prevScore = prevDim ? prevDim.score : dim.score;
            return {
                name: dim.name,
                currentScore: dim.score,
                previousScore: prevScore,
                change: dim.score - prevScore
            };
        });

        const scoreHistory = evaluations.map(e => ({
            cycle: e.cycleTitle,
            score: e.overallScore
        }));

        const percentileRank = Math.min(99, Math.max(1, Math.round(latest.overallScore * 0.9)));

        return {
            overallTrend,
            strongestDimension,
            weakestDimension,
            dimensionTrends,
            scoreHistory,
            percentileRank
        };
    });

    // --- Team Analytics ---
    teamAnalytics = computed((): TeamAnalytics => {
        const orgId = this.activeOrg().id;

        let members: TeamMemberAnalytics[] = [];

        if (orgId === 'org1') {
            members = [
                { name: 'علی احمدی', role: 'کارشناس ارشد نرم‌افزار', overallScore: 85, trend: 3, strongestDimension: 'دانش فنی', weakestDimension: 'خلاقیت و نوآوری' },
                { name: 'رضا کریمی', role: 'توسعه‌دهنده فرانت‌اند', overallScore: 78, trend: -2, strongestDimension: 'کار تیمی', weakestDimension: 'ارتباطات' },
                { name: 'مریم حسینی', role: 'طراح UI/UX', overallScore: 92, trend: 5, strongestDimension: 'خلاقیت و نوآوری', weakestDimension: 'مسئولیت‌پذیری' },
                { name: 'حسن محمدی', role: 'توسعه‌دهنده بک‌اند', overallScore: 71, trend: 1, strongestDimension: 'دانش فنی', weakestDimension: 'کار تیمی' },
                { name: 'زهرا نوری', role: 'تستر نرم‌افزار', overallScore: 88, trend: 4, strongestDimension: 'مسئولیت‌پذیری', weakestDimension: 'خلاقیت و نوآوری' }
            ];
        } else if (orgId === 'org2') {
            members = [
                { name: 'سارا محمدی', role: 'مشاور پروژه', overallScore: 78, trend: 2, strongestDimension: 'کیفیت مشاوره', weakestDimension: 'مدیریت زمان' },
                { name: 'امیر رضایی', role: 'تحلیلگر کسب‌وکار', overallScore: 82, trend: -1, strongestDimension: 'تعامل با کارفرما', weakestDimension: 'گزارش‌دهی' }
            ];
        } else {
            members = [
                { name: 'محمد جلالی', role: 'مدیر فنی', overallScore: 95, trend: 2, strongestDimension: 'رهبری', weakestDimension: 'مستندسازی' }
            ];
        }

        const scores = members.map(m => m.overallScore);
        const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

        const ranges = [
            { range: '۹۰-۱۰۰', min: 90, max: 100 },
            { range: '۸۰-۸۹', min: 80, max: 89 },
            { range: '۷۰-۷۹', min: 70, max: 79 },
            { range: '۶۰-۶۹', min: 60, max: 69 },
            { range: 'زیر ۶۰', min: 0, max: 59 }
        ];

        const scoreDistribution: ScoreDistribution[] = ranges.map(r => {
            const count = scores.filter(s => s >= r.min && s <= r.max).length;
            const percentage = scores.length > 0 ? Math.round((count / scores.length) * 100) : 0;
            return { range: r.range, count, percentage };
        });

        const teamDimensionAverages = [
            { name: 'دانش فنی', average: 83 },
            { name: 'کار تیمی', average: 79 },
            { name: 'خلاقیت و نوآوری', average: 76 },
            { name: 'مسئولیت‌پذیری', average: 85 },
            { name: 'ارتباطات', average: 80 }
        ];

        return {
            averageScore,
            highestScore,
            lowestScore,
            memberCount: members.length,
            members: members.sort((a, b) => b.overallScore - a.overallScore),
            scoreDistribution,
            teamDimensionAverages
        };
    });

    // --- AI Analysis Methods ---
    runAIAnalysis(): FullAIAnalysis | null {
        const evaluations = this.myEvaluations().filter(e => e.status === 'completed');
        if (evaluations.length === 0) return null;

        const latest = evaluations[0];
        const scoreHistory = this.personalAnalytics().scoreHistory;
        const teamMembers = this.getTeamMembersForAI();

        return this.aiService.runFullAnalysis(latest, latest.feedbacks, scoreHistory, teamMembers);
    }

    getTeamMembersForAI(): { name: string; dimensions: EvaluationDimension[] }[] {
        const orgId = this.activeOrg().id;

        if (orgId === 'org1') {
            return [
                {
                    name: 'علی احمدی', dimensions: [
                        { name: 'دانش فنی', score: 90, weight: 30 }, { name: 'کار تیمی', score: 85, weight: 25 },
                        { name: 'خلاقیت و نوآوری', score: 80, weight: 20 }, { name: 'مسئولیت‌پذیری', score: 88, weight: 15 },
                        { name: 'ارتباطات', score: 82, weight: 10 }
                    ]
                },
                {
                    name: 'رضا کریمی', dimensions: [
                        { name: 'دانش فنی', score: 75, weight: 30 }, { name: 'کار تیمی', score: 82, weight: 25 },
                        { name: 'خلاقیت و نوآوری', score: 70, weight: 20 }, { name: 'مسئولیت‌پذیری', score: 78, weight: 15 },
                        { name: 'ارتباطات', score: 65, weight: 10 }
                    ]
                },
                {
                    name: 'مریم حسینی', dimensions: [
                        { name: 'دانش فنی', score: 88, weight: 30 }, { name: 'کار تیمی', score: 90, weight: 25 },
                        { name: 'خلاقیت و نوآوری', score: 95, weight: 20 }, { name: 'مسئولیت‌پذیری', score: 72, weight: 15 },
                        { name: 'ارتباطات', score: 92, weight: 10 }
                    ]
                },
                {
                    name: 'حسن محمدی', dimensions: [
                        { name: 'دانش فنی', score: 85, weight: 30 }, { name: 'کار تیمی', score: 60, weight: 25 },
                        { name: 'خلاقیت و نوآوری', score: 68, weight: 20 }, { name: 'مسئولیت‌پذیری', score: 80, weight: 15 },
                        { name: 'ارتباطات', score: 58, weight: 10 }
                    ]
                },
                {
                    name: 'زهرا نوری', dimensions: [
                        { name: 'دانش فنی', score: 82, weight: 30 }, { name: 'کار تیمی', score: 85, weight: 25 },
                        { name: 'خلاقیت و نوآوری', score: 70, weight: 20 }, { name: 'مسئولیت‌پذیری', score: 95, weight: 15 },
                        { name: 'ارتباطات', score: 88, weight: 10 }
                    ]
                }
            ];
        } else if (orgId === 'org2') {
            return [
                {
                    name: 'سارا محمدی', dimensions: [
                        { name: 'کیفیت مشاوره', score: 82, weight: 35 }, { name: 'مدیریت زمان', score: 75, weight: 25 },
                        { name: 'گزارش‌دهی', score: 78, weight: 20 }, { name: 'تعامل با کارفرما', score: 80, weight: 20 }
                    ]
                },
                {
                    name: 'امیر رضایی', dimensions: [
                        { name: 'کیفیت مشاوره', score: 78, weight: 35 }, { name: 'مدیریت زمان', score: 80, weight: 25 },
                        { name: 'گزارش‌دهی', score: 65, weight: 20 }, { name: 'تعامل با کارفرما', score: 85, weight: 20 }
                    ]
                }
            ];
        }

        return [];
    }

    // --- Performance Coefficient Calculation ---
    getPerformanceCoefficient(): number {
        const evaluations = this.myEvaluations();
        const completed = evaluations.filter(e => e.status === 'completed');

        if (completed.length === 0) return 1.0;

        const latest = completed[0];
        const score = latest.overallScore;

        const coefficient = 0.8 + (score / 100) * 0.7;
        return Math.round(coefficient * 100) / 100;
    }

    getLastCompletedScore(): number {
        const evaluations = this.myEvaluations();
        const completed = evaluations.filter(e => e.status === 'completed');
        return completed.length > 0 ? completed[0].overallScore : 0;
    }

    // --- Evaluation Methods ---
    getFormById(formId: string): EvaluationForm | null {
        return this.evaluationForms().find(f => f.id === formId) || null;
    }

    calculateWeightedScore(answers: EvaluationAnswer[], questions: EvaluationQuestion[]): number {
        let totalWeight = 0;
        let weightedSum = 0;

        answers.forEach(answer => {
            const question = questions.find(q => q.id === answer.questionId);
            if (!question || question.weight === 0) return;

            if (question.type === 'rating' || question.type === 'multiple-choice') {
                const value = typeof answer.value === 'number' ? answer.value : 0;
                const maxRating = question.maxRating || 5;
                const normalizedScore = (value / maxRating) * 100;
                weightedSum += normalizedScore * question.weight;
                totalWeight += question.weight;
            }
        });

        if (totalWeight === 0) return 0;
        return Math.round(weightedSum / totalWeight);
    }

    getOrCreateResponse(formId: string, targetEmployeeId: string, targetEmployeeName: string): EvaluationResponse {
        const existingResponse = this.evaluationResponses().find(
            r => r.formId === formId && r.targetEmployeeId === targetEmployeeId
        );

        if (existingResponse) return existingResponse;

        const form = this.getFormById(formId);
        if (!form) throw new Error('Form not found');

        const newResponse: EvaluationResponse = {
            id: `resp-${Date.now()}`,
            formId: formId,
            evaluatorId: 'current-user',
            targetEmployeeId: targetEmployeeId,
            targetEmployeeName: targetEmployeeName,
            cycleId: form.cycleId,
            answers: [],
            submittedAt: null,
            status: 'draft',
            calculatedScore: 0
        };

        const currentResponses = this.evaluationResponses();
        this.evaluationResponses.set([...currentResponses, newResponse]);

        return newResponse;
    }

    saveEvaluationResponse(response: EvaluationResponse): void {
        const currentResponses = this.evaluationResponses();
        const index = currentResponses.findIndex(r => r.id === response.id);

        const form = this.getFormById(response.formId);
        if (form) {
            response.calculatedScore = this.calculateWeightedScore(response.answers, form.questions);
        }

        if (index >= 0) {
            currentResponses[index] = response;
        } else {
            currentResponses.push(response);
        }

        this.evaluationResponses.set([...currentResponses]);
    }

    removePendingEvaluation(pendingId: string): void {
        const current = new Set(this.removedPendingIds());
        current.add(pendingId);
        this.removedPendingIds.set(current);
    }

    // --- Cycle Status Auto-Calculation ---
    private calculateCycleStatus(startDate: string, endDate: string, now: Date): 'upcoming' | 'active' | 'completed' {
        const start = this.shamsiToGregorian(startDate);
        const end = this.shamsiToGregorian(endDate);

        if (!start || !end) return 'upcoming';

        if (now < start) return 'upcoming';
        if (now > end) return 'completed';
        return 'active';
    }

    private shamsiToGregorian(shamsiDate: string): Date | null {
        try {
            const parts = shamsiDate.split('/');
            if (parts.length !== 3) return null;

            const jy = parseInt(parts[0]);
            const jm = parseInt(parts[1]);
            const jd = parseInt(parts[2]);

            let gy = jy + 621;
            let leapJ = -14;
            const jp = jy + 621;

            if (jp < 0) leapJ = -15;

            const jump = Math.floor((jp - 1) / 33) * 8 + Math.floor(((jp - 1) % 33 + 3) / 4);
            const n = jd + (jm <= 6 ? (jm - 1) * 31 : (jm - 1) * 30 + 6);
            const m = jump + n + leapJ;
            let gd = m % 365;

            gy += Math.floor(m / 365);

            if (gd === 0) {
                gd = 365;
                gy -= 1;
            }

            let gm: number;
            if (gd <= 186) {
                gm = Math.ceil(gd / 31);
                gd = gd - (gm - 1) * 31;
            } else {
                gm = Math.ceil((gd - 186) / 30) + 6;
                gd = gd - 186 - (gm - 7) * 30;
            }

            return new Date(gy, gm - 1, gd);
        } catch {
            return null;
        }
    }

    // --- Helper Methods ---
    private getLeaveDataForOrg(orgId: string): LeaveData {
        if (orgId === 'org1') return { total: 17, used: 5, remaining: 12, hourlyBalance: 8 };
        if (orgId === 'org2') return { total: 0, used: 0, remaining: 0, hourlyBalance: 0 };
        return { total: 20, used: 2, remaining: 18, hourlyBalance: 20 };
    }

    private getPayslipDataForOrg(orgId: string): PayslipData[] {
        const perfCoeff = this.getPerformanceCoefficient();
        if (orgId === 'org1') {
            return [
                { month: 'آبان ۱۴۰۳', baseSalary: 12000000, netPay: 13700000, performanceCoefficient: perfCoeff },
                { month: 'مهر ۱۴۰۳', baseSalary: 12000000, netPay: 13500000, performanceCoefficient: 1.0 }
            ];
        } else if (orgId === 'org2') {
            return [
                { month: 'آبان ۱۴۰۳', baseSalary: 5000000, netPay: 5000000, performanceCoefficient: perfCoeff },
                { month: 'مهر ۱۴۰۳', baseSalary: 5000000, netPay: 5000000, performanceCoefficient: 1.0 }
            ];
        } else {
            return [
                { month: 'آبان ۱۴۰۳', baseSalary: 20000000, netPay: 22000000, performanceCoefficient: perfCoeff },
                { month: 'مهر ۱۴۰۳', baseSalary: 20000000, netPay: 22000000, performanceCoefficient: 1.0 }
            ];
        }
    }

    private getAttendanceDataForOrg(orgId: string): AttendanceRecord[] {
        if (orgId === 'org1') {
            return [
                { id: 1, date: '1403/08/10', dayName: 'شنبه', checkIn: '08:00', checkOut: '17:00', hours: '9', status: 'حاضر' },
                { id: 2, date: '1403/08/09', dayName: 'پنج‌شنبه', checkIn: '08:30', checkOut: '17:00', hours: '8.5', status: 'تاخیر' }
            ];
        } else if (orgId === 'org2') {
            return [
                { id: 3, date: '1403/08/10', dayName: 'شنبه', checkIn: '10:00', checkOut: '14:00', hours: '4', status: 'حاضر' },
                { id: 4, date: '1403/08/08', dayName: 'چهارشنبه', checkIn: '10:00', checkOut: '14:00', hours: '4', status: 'حاضر' }
            ];
        } else {
            return [
                { id: 5, date: '1403/08/10', dayName: 'شنبه', checkIn: '18:00', checkOut: '02:00', hours: '8', status: 'حاضر' },
                { id: 6, date: '1403/08/09', dayName: 'پنج‌شنبه', checkIn: '18:00', checkOut: '02:00', hours: '8', status: 'حاضر' }
            ];
        }
    }

    private getTicketsForOrg(orgId: string): Ticket[] {
        if (orgId === 'org1') {
            return [
                { id: 1, title: 'درخواست وام مسکن', status: 'در انتظار بررسی', date: '1403/08/01', department: 'امور مالی' },
                { id: 2, title: 'مشکل در دسترسی شبکه', status: 'پاسخ داده شد', date: '1403/07/25', department: 'فناوری اطلاعات' }
            ];
        } else if (orgId === 'org2') {
            return [
                { id: 3, title: 'تمدید قرارداد مشاوره', status: 'بسته شده', date: '1403/07/10', department: 'منابع انسانی' }
            ];
        } else {
            return [
                { id: 4, title: 'خرید سرور جدید', status: 'در انتظار بررسی', date: '1403/08/05', department: 'مدیریت عامل' },
                { id: 5, title: 'استخدام نیروی جدید', status: 'پاسخ داده شد', date: '1403/07/20', department: 'منابع انسانی' }
            ];
        }
    }

    private getOrgColor(orgId: string): string {
        const colors: { [key: string]: string } = {
            'org1': '#3b82f6',
            'org2': '#10b981',
            'org3': '#8b5cf6'
        };
        return colors[orgId] || '#94a3b8';
    }
}
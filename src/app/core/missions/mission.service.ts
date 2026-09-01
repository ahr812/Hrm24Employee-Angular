import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export type MissionType = 'internal' | 'external';
export type MissionDuration = 'hourly' | 'daily' | 'multi-day';
export type MissionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed' | 'cancelled';
export type TransportType = 'personal-car' | 'company-car' | 'taxi' | 'bus' | 'train' | 'plane' | 'other';
export type AccommodationType = 'none' | 'hotel' | 'guest-house' | 'relative' | 'other';

export interface MissionExpense {
    id: string;
    title: string;
    amount: number;
    receiptAttached: boolean;
}

export interface MissionResult {
    summary: string;
    achievements: string[];
    issues: string[];
    followUpActions: string[];
    submittedAt: string;
}

export interface Mission {
    id: string;
    title: string;
    description: string;
    type: MissionType;
    duration: MissionDuration;
    status: MissionStatus;

    destination: string;
    startDate: string;
    endDate: string;
    startHour: string;
    endHour: string;

    purpose: string;
    expectedOutcomes: string;

    transport: TransportType;
    accommodation: AccommodationType;

    estimatedBudget: number;
    actualExpenses: MissionExpense[];

    result: MissionResult | null;

    requesterId: string;
    requesterName: string;
    approverName: string;
    approvedAt: string | null;
    rejectReason: string | null;

    createdAt: string;
    orgId: string;
}

@Injectable({ providedIn: 'root' })
export class MissionService {
    private readonly STORAGE_KEY = 'hrm24_missions';
    private orgService = inject(OrganizationService);

    missions = signal<Mission[]>(this.loadMissions());

    stats = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const all = this.missions().filter(m => m.orgId === orgId);
        return {
            total: all.length,
            pending: all.filter(m => m.status === 'pending').length,
            approved: all.filter(m => m.status === 'approved').length,
            inProgress: all.filter(m => m.status === 'in-progress').length,
            completed: all.filter(m => m.status === 'completed').length,
            rejected: all.filter(m => m.status === 'rejected').length,
            cancelled: all.filter(m => m.status === 'cancelled').length,
            totalBudget: all.reduce((sum, m) => sum + m.estimatedBudget, 0),
            totalActual: all.reduce((sum, m) => sum + m.actualExpenses.reduce((s, e) => s + e.amount, 0), 0)
        };
    });

    myMissions = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        return this.missions().filter(m => m.requesterId === 'current-user' && m.orgId === orgId);
    });

    private loadMissions(): Mission[] {
        if (typeof localStorage === 'undefined') {
            return this.getDefaultMissions();
        }
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : this.getDefaultMissions();
        } catch {
            return this.getDefaultMissions();
        }
    }

    private saveMissions(): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.missions()));
        } catch (error) {
            console.error('Error saving missions:', error);
        }
    }

    private getDefaultMissions(): Mission[] {
        return [
            {
                id: 'mission-1',
                title: 'بازدید از شعبه اصفهان',
                description: 'بررسی عملکرد شعبه و جلسه با مدیران منطقه‌ای',
                type: 'internal',
                duration: 'multi-day',
                status: 'completed',
                destination: 'اصفهان، خیابان چهارباغ، شعبه مرکزی',
                startDate: '1403/08/10',
                endDate: '1403/08/12',
                startHour: '',
                endHour: '',
                purpose: 'ارزیابی عملکرد فصلی شعبه اصفهان و هماهنگی برنامه‌های توسعه',
                expectedOutcomes: 'گزارش عملکرد، برنامه عملیاتی فصل آینده',
                transport: 'company-car',
                accommodation: 'hotel',
                estimatedBudget: 8500000,
                actualExpenses: [
                    { id: 'exp-1', title: 'هتل ۲ شب', amount: 4000000, receiptAttached: true },
                    { id: 'exp-2', title: 'هزینه رفت و آمد', amount: 2500000, receiptAttached: true },
                    { id: 'exp-3', title: 'پذیرایی و غذا', amount: 1800000, receiptAttached: true }
                ],
                result: {
                    summary: 'بازدید با موفقیت انجام شد. عملکرد شعبه رضایت‌بخش ارزیابی گردید.',
                    achievements: ['افزایش ۱۵٪ فروش نسبت به فصل قبل', 'استخدام ۳ نیروی جدید'],
                    issues: ['نیاز به بروزرسانی سیستم نرم‌افزاری'],
                    followUpActions: ['ارسال گزارش کامل تا پایان هفته', 'هماهنگی برای بروزرسانی سیستم'],
                    submittedAt: new Date(Date.now() - 86400000).toISOString()
                },
                requesterId: 'current-user',
                requesterName: 'علی احمدی',
                approverName: 'مهندس رضایی',
                approvedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                rejectReason: null,
                createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
                orgId: 'org1'
            },
            {
                id: 'mission-2',
                title: 'جلسه با مشتری کلیدی',
                description: 'مذاکره برای تمدید قرارداد سالانه',
                type: 'external',
                duration: 'hourly',
                status: 'approved',
                destination: 'تهران، ونک، برج نگار، طبقه ۸',
                startDate: '1403/08/20',
                endDate: '1403/08/20',
                startHour: '10:00',
                endHour: '13:00',
                purpose: 'مذاکره و تمدید قرارداد همکاری سالانه با شرکت پارس‌تکنولوژی',
                expectedOutcomes: 'تمدید قرارداد، توافق بر سر شرایط جدید',
                transport: 'taxi',
                accommodation: 'none',
                estimatedBudget: 500000,
                actualExpenses: [],
                result: null,
                requesterId: 'current-user',
                requesterName: 'علی احمدی',
                approverName: 'مهندس رضایی',
                approvedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                rejectReason: null,
                createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
                orgId: 'org1'
            },
            {
                id: 'mission-3',
                title: 'شرکت در همایش ملی فناوری',
                description: 'حضور در همایش و ارائه مقاله',
                type: 'external',
                duration: 'daily',
                status: 'pending',
                destination: 'مشهد، مرکز همایش‌های بین‌المللی',
                startDate: '1403/09/05',
                endDate: '1403/09/05',
                startHour: '08:00',
                endHour: '18:00',
                purpose: 'شرکت در همایش ملی فناوری اطلاعات و ارائه مقاله پژوهشی',
                expectedOutcomes: 'شبکه‌سازی حرفه‌ای، آشنایی با روندهای جدید',
                transport: 'plane',
                accommodation: 'none',
                estimatedBudget: 3500000,
                actualExpenses: [],
                result: null,
                requesterId: 'current-user',
                requesterName: 'علی احمدی',
                approverName: 'دکتر محمدی',
                approvedAt: null,
                rejectReason: null,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                orgId: 'org1'
            },
            {
                id: 'mission-4',
                title: 'آموزش تیم فنی شیراز',
                description: 'برگزاری دوره آموزشی ۳ روزه',
                type: 'internal',
                duration: 'multi-day',
                status: 'rejected',
                destination: 'شیراز، دفتر مرکزی',
                startDate: '1403/08/25',
                endDate: '1403/08/27',
                startHour: '',
                endHour: '',
                purpose: 'آموزش تکنولوژی جدید به تیم فنی شعبه شیراز',
                expectedOutcomes: 'ارتقای مهارت تیم، افزایش بهره‌وری',
                transport: 'train',
                accommodation: 'guest-house',
                estimatedBudget: 6000000,
                actualExpenses: [],
                result: null,
                requesterId: 'current-user',
                requesterName: 'علی احمدی',
                approverName: 'مهندس رضایی',
                approvedAt: null,
                rejectReason: 'بودجه فعلی کافی نیست. لطفاً پس از تأمین بودجه مجدداً درخواست دهید.',
                createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
                orgId: 'org1'
            }
        ];
    }

    addMission(mission: Omit<Mission, 'id' | 'createdAt' | 'orgId' | 'result' | 'actualExpenses' | 'approvedAt' | 'rejectReason'>): void {
        const newMission: Mission = {
            ...mission,
            id: `mission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            orgId: this.orgService.activeOrg().id,
            result: null,
            actualExpenses: [],
            approvedAt: null,
            rejectReason: null
        };
        this.missions.update(current => [newMission, ...current]);
        this.saveMissions();
    }

    updateMission(id: string, updates: Partial<Mission>): void {
        this.missions.update(current =>
            current.map(m => m.id === id ? { ...m, ...updates } : m)
        );
        this.saveMissions();
    }

    deleteMission(id: string): void {
        this.missions.update(current => current.filter(m => m.id !== id));
        this.saveMissions();
    }

    approveMission(id: string, approverName: string): void {
        this.updateMission(id, {
            status: 'approved',
            approverName,
            approvedAt: new Date().toISOString()
        });
    }

    rejectMission(id: string, reason: string, approverName: string): void {
        this.updateMission(id, {
            status: 'rejected',
            approverName,
            rejectReason: reason,
            approvedAt: new Date().toISOString()
        });
    }

    startMission(id: string): void {
        this.updateMission(id, { status: 'in-progress' });
    }

    completeMission(id: string, result: MissionResult): void {
        this.updateMission(id, { status: 'completed', result });
    }

    cancelMission(id: string): void {
        this.updateMission(id, { status: 'cancelled' });
    }

    addExpense(missionId: string, expense: Omit<MissionExpense, 'id'>): void {
        this.missions.update(current =>
            current.map(m => {
                if (m.id !== missionId) return m;
                return {
                    ...m,
                    actualExpenses: [...m.actualExpenses, {
                        ...expense,
                        id: `exp-${Date.now()}`
                    }]
                };
            })
        );
        this.saveMissions();
    }

    getTypeLabel(type: MissionType): string {
        return type === 'internal' ? 'داخلی' : 'خارجی';
    }

    getDurationLabel(duration: MissionDuration): string {
        const labels: Record<MissionDuration, string> = {
            hourly: 'ساعتی',
            daily: 'روزانه',
            'multi-day': 'چندروزه'
        };
        return labels[duration];
    }

    getStatusLabel(status: MissionStatus): string {
        const labels: Record<MissionStatus, string> = {
            draft: 'پیش‌نویس',
            pending: 'در انتظار تأیید',
            approved: 'تأیید شده',
            rejected: 'رد شده',
            'in-progress': 'در حال اجرا',
            completed: 'تکمیل شده',
            cancelled: 'لغو شده'
        };
        return labels[status];
    }

    getTransportLabel(transport: TransportType): string {
        const labels: Record<TransportType, string> = {
            'personal-car': 'خودرو شخصی',
            'company-car': 'خودرو سازمانی',
            taxi: 'تاکسی / اسنپ',
            bus: 'اتوبوس',
            train: 'قطار',
            plane: 'هواپیما',
            other: 'سایر'
        };
        return labels[transport];
    }

    getAccommodationLabel(accommodation: AccommodationType): string {
        const labels: Record<AccommodationType, string> = {
            none: 'بدون اسکان',
            hotel: 'هتل',
            'guest-house': 'مهمانسرا',
            relative: 'اقوام / آشنا',
            other: 'سایر'
        };
        return labels[accommodation];
    }

    formatCurrency(amount: number): string {
        return amount.toLocaleString('fa-IR');
    }
}
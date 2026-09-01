import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export type LeaveType =
    | 'annual-daily'
    | 'annual-hourly'
    | 'sick-insurance'
    | 'sick-employer'
    | 'unpaid'
    | 'marriage'
    | 'pregnancy'
    | 'maternity'
    | 'breastfeeding'
    | 'funeral'
    | 'hajj'
    | 'educational'
    | 'incentive';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveDurationUnit = 'day' | 'hour';

export interface LeaveRequest {
    id: string;
    type: LeaveType;
    status: LeaveStatus;

    startDate: string;
    endDate: string;
    startHour: string;
    endHour: string;

    durationValue: number;
    durationUnit: LeaveDurationUnit;

    reason: string;
    attachmentNote: string;

    requesterId: string;
    requesterName: string;
    approverName: string;
    approvedAt: string | null;
    rejectReason: string | null;

    createdAt: string;
    orgId: string;
}

export interface LeaveBalance {
    annualDailyTotal: number;
    annualDailyUsed: number;
    annualHourlyTotal: number;
    annualHourlyUsed: number;
    sickInsuranceTotal: number;
    sickInsuranceUsed: number;
    sickEmployerTotal: number;
    sickEmployerUsed: number;
    unpaidUsed: number;
    marriageUsed: number;
    pregnancyUsed: number;
    maternityUsed: number;
    breastfeedingTotal: number;
    breastfeedingUsed: number;
    funeralUsed: number;
    hajjUsed: number;
    educationalUsed: number;
    incentiveTotal: number;
    incentiveUsed: number;
}

@Injectable({ providedIn: 'root' })
export class LeaveService {
    private readonly STORAGE_KEY = 'hrm24_leaves_v2';
    private orgService = inject(OrganizationService);

    requests = signal<LeaveRequest[]>(this.loadRequests());

    balance = signal<LeaveBalance>({
        annualDailyTotal: 26,
        annualDailyUsed: 8,
        annualHourlyTotal: 50,
        annualHourlyUsed: 12,
        sickInsuranceTotal: 90,
        sickInsuranceUsed: 3,
        sickEmployerTotal: 3,
        sickEmployerUsed: 0,
        unpaidUsed: 2,
        marriageUsed: 0,
        pregnancyUsed: 0,
        maternityUsed: 0,
        breastfeedingTotal: 180,
        breastfeedingUsed: 0,
        funeralUsed: 0,
        hajjUsed: 0,
        educationalUsed: 0,
        incentiveTotal: 5,
        incentiveUsed: 1
    });

    stats = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const all = this.requests().filter(r => r.orgId === orgId);
        return {
            total: all.length,
            pending: all.filter(r => r.status === 'pending').length,
            approved: all.filter(r => r.status === 'approved').length,
            rejected: all.filter(r => r.status === 'rejected').length,
            cancelled: all.filter(r => r.status === 'cancelled').length
        };
    });

    getLeaveTypeLabel(type: LeaveType): string {
        const labels: Record<LeaveType, string> = {
            'annual-daily': 'استحقاقی روزانه',
            'annual-hourly': 'استحقاقی ساعتی',
            'sick-insurance': 'استعلاجی (عهده بیمه)',
            'sick-employer': 'استعلاجی (عهده کارفرما)',
            'unpaid': 'بدون حقوق',
            'marriage': 'ازدواج',
            'pregnancy': 'بارداری',
            'maternity': 'زایمان',
            'breastfeeding': 'شیردهی ساعتی',
            'funeral': 'فوت اقوام درجه یک',
            'hajj': 'سفر حج',
            'educational': 'تحصیلی',
            'incentive': 'تشویقی'
        };
        return labels[type];
    }

    getLeaveTypeCategory(type: LeaveType): 'annual' | 'sick' | 'special' | 'other' {
        if (type === 'annual-daily' || type === 'annual-hourly') return 'annual';
        if (type === 'sick-insurance' || type === 'sick-employer') return 'sick';
        if (['marriage', 'pregnancy', 'maternity', 'breastfeeding', 'funeral'].includes(type)) return 'special';
        return 'other';
    }

    getDurationUnit(type: LeaveType): LeaveDurationUnit {
        if (type === 'annual-hourly' || type === 'breastfeeding') return 'hour';
        return 'day';
    }

    getStatusLabel(status: LeaveStatus): string {
        const labels: Record<LeaveStatus, string> = {
            pending: 'در انتظار تأیید',
            approved: 'تأیید شده',
            rejected: 'رد شده',
            cancelled: 'لغو شده'
        };
        return labels[status];
    }

    getMaxDaysForType(type: LeaveType): number | null {
        const limits: Partial<Record<LeaveType, number>> = {
            'marriage': 3,
            'funeral': 3,
            'hajj': 30,
            'pregnancy': 270,
            'maternity': 210,
            'sick-employer': 3
        };
        return limits[type] || null;
    }

    requiresAttachment(type: LeaveType): boolean {
        return ['sick-insurance', 'sick-employer', 'pregnancy', 'maternity', 'educational'].includes(type);
    }

    private loadRequests(): LeaveRequest[] {
        if (typeof localStorage === 'undefined') {
            return this.getDefaultRequests();
        }
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : this.getDefaultRequests();
        } catch {
            return this.getDefaultRequests();
        }
    }

    private saveRequests(): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.requests()));
        } catch (error) {
            console.error('Error saving leaves:', error);
        }
    }

    private getDefaultRequests(): LeaveRequest[] {
        return [
            {
                id: 'leave-1',
                type: 'annual-daily',
                status: 'approved',
                startDate: '1403/08/15',
                endDate: '1403/08/17',
                startHour: '',
                endHour: '',
                durationValue: 3,
                durationUnit: 'day',
                reason: 'سفر شخصی',
                attachmentNote: '',
                requesterId: 'current-user',
                requesterName: 'علی احمدی',
                approverName: 'مهندس رضایی',
                approvedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                rejectReason: null,
                createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
                orgId: 'org1'
            },
            {
                id: 'leave-2',
                type: 'annual-hourly',
                status: 'approved',
                startDate: '1403/08/20',
                endDate: '1403/08/20',
                startHour: '08:00',
                endHour: '11:30',
                durationValue: 3.5,
                durationUnit: 'hour',
                reason: 'مراجعه به بانک',
                attachmentNote: '',
                requesterId: 'current-user',
                requesterName: 'علی احمدی',
                approverName: 'مهندس رضایی',
                approvedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                rejectReason: null,
                createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
                orgId: 'org1'
            },
            {
                id: 'leave-3',
                type: 'sick-insurance',
                status: 'pending',
                startDate: '1403/08/25',
                endDate: '1403/08/27',
                startHour: '',
                endHour: '',
                durationValue: 3,
                durationUnit: 'day',
                reason: 'بیماری و نیاز به استراحت',
                attachmentNote: 'گواهی پزشک ضمیمه شده است',
                requesterId: 'current-user',
                requesterName: 'علی احمدی',
                approverName: 'خانم محمدی',
                approvedAt: null,
                rejectReason: null,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                orgId: 'org1'
            },
            {
                id: 'leave-4',
                type: 'unpaid',
                status: 'rejected',
                startDate: '1403/09/01',
                endDate: '1403/09/05',
                startHour: '',
                endHour: '',
                durationValue: 5,
                durationUnit: 'day',
                reason: 'مسائل شخصی',
                attachmentNote: '',
                requesterId: 'current-user',
                requesterName: 'علی احمدی',
                approverName: 'مهندس رضایی',
                approvedAt: null,
                rejectReason: 'با توجه به حجم کاری فعلی، امکان موافقت وجود ندارد.',
                createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
                orgId: 'org1'
            }
        ];
    }

    addRequest(request: Omit<LeaveRequest, 'id' | 'createdAt' | 'orgId' | 'approvedAt' | 'rejectReason'>): void {
        const newRequest: LeaveRequest = {
            ...request,
            id: `leave-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            orgId: this.orgService.activeOrg().id,
            approvedAt: null,
            rejectReason: null
        };
        this.requests.update(current => [newRequest, ...current]);
        this.saveRequests();
    }

    deleteRequest(id: string): void {
        this.requests.update(current => current.filter(r => r.id !== id));
        this.saveRequests();
    }

    approveRequest(id: string, approverName: string): void {
        this.requests.update(current =>
            current.map(r => r.id === id ? { ...r, status: 'approved' as LeaveStatus, approverName, approvedAt: new Date().toISOString() } : r)
        );
        this.saveRequests();
    }

    rejectRequest(id: string, reason: string, approverName: string): void {
        this.requests.update(current =>
            current.map(r => r.id === id ? { ...r, status: 'rejected' as LeaveStatus, approverName, rejectReason: reason, approvedAt: new Date().toISOString() } : r)
        );
        this.saveRequests();
    }

    cancelRequest(id: string): void {
        this.requests.update(current =>
            current.map(r => r.id === id ? { ...r, status: 'cancelled' as LeaveStatus } : r)
        );
        this.saveRequests();
    }

    getRemainingBalance(type: LeaveType): { used: number; total: number; remaining: number } {
        const b = this.balance();
        switch (type) {
            case 'annual-daily': return { used: b.annualDailyUsed, total: b.annualDailyTotal, remaining: b.annualDailyTotal - b.annualDailyUsed };
            case 'annual-hourly': return { used: b.annualHourlyUsed, total: b.annualHourlyTotal, remaining: b.annualHourlyTotal - b.annualHourlyUsed };
            case 'sick-insurance': return { used: b.sickInsuranceUsed, total: b.sickInsuranceTotal, remaining: b.sickInsuranceTotal - b.sickInsuranceUsed };
            case 'sick-employer': return { used: b.sickEmployerUsed, total: b.sickEmployerTotal, remaining: b.sickEmployerTotal - b.sickEmployerUsed };
            case 'breastfeeding': return { used: b.breastfeedingUsed, total: b.breastfeedingTotal, remaining: b.breastfeedingTotal - b.breastfeedingUsed };
            case 'incentive': return { used: b.incentiveUsed, total: b.incentiveTotal, remaining: b.incentiveTotal - b.incentiveUsed };
            default: return { used: 0, total: 0, remaining: 0 };
        }
    }
}
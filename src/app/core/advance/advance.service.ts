import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export type AdvanceTitle = 'salary-advance' | 'mid-period' | 'emergency' | 'travel' | 'medical' | 'education' | 'housing' | 'other';
export type DeductionLocation = 'salary' | 'mid-period' | 'settlement' | 'bonus' | 'other';
export type AdvanceStatus = 'pending' | 'approved' | 'rejected' | 'deducted' | 'not-deducted' | 'cancelled';

export interface AdvanceTitleOption {
    id: string;
    title: string;
    maxAmount: number;
}

export interface DeductionLocationOption {
    id: string;
    title: string;
    description: string;
}

export interface Advance {
    id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    orgId: string;
    titleId: string;
    titleLabel: string;
    amount: number;
    dueDateYear: number;
    dueDateMonth: number;
    deductionLocationId: string;
    deductionLocationLabel: string;
    deductionDateYear: number;
    deductionDateMonth: number;
    status: AdvanceStatus;
    approvedBy: string | null;
    approvedAt: string | null;
    rejectReason: string | null;
    deductedAt: string | null;
    description: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdvanceService {
    private readonly STORAGE_KEY = 'hrm24_advances';
    private orgService = inject(OrganizationService);

    advances = signal<Advance[]>(this.loadAdvances());

    advanceTitles = signal<AdvanceTitleOption[]>([
        { id: 'at-1', title: 'مساعده حقوق', maxAmount: 50000000 },
        { id: 'at-2', title: 'مساعده میان‌دوره', maxAmount: 30000000 },
        { id: 'at-3', title: 'مساعده ضروری', maxAmount: 20000000 },
        { id: 'at-4', title: 'مساعده سفر', maxAmount: 40000000 },
        { id: 'at-5', title: 'مساعده درمانی', maxAmount: 100000000 },
        { id: 'at-6', title: 'مساعده تحصیلی', maxAmount: 60000000 },
        { id: 'at-7', title: 'مساعده مسکن', maxAmount: 80000000 },
        { id: 'at-8', title: 'سایر', maxAmount: 30000000 }
    ]);

    deductionLocations = signal<DeductionLocationOption[]>([
        { id: 'dl-1', title: 'حقوق ماهانه', description: 'کسر از فیش حقوقی ماه بعد' },
        { id: 'dl-2', title: 'میان‌دوره', description: 'کسر از پرداختی میان‌دوره' },
        { id: 'dl-3', title: 'تسویه حساب', description: 'کسر هنگام تسویه نهایی' },
        { id: 'dl-4', title: 'پاداش', description: 'کسر از پاداش عملکرد' },
        { id: 'dl-5', title: 'سایر', description: 'روش کسر دیگر' }
    ]);

    stats = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const all = this.advances().filter(a => a.orgId === orgId);
        return {
            total: all.length,
            pending: all.filter(a => a.status === 'pending').length,
            approved: all.filter(a => a.status === 'approved').length,
            rejected: all.filter(a => a.status === 'rejected').length,
            deducted: all.filter(a => a.status === 'deducted').length,
            notDeducted: all.filter(a => a.status === 'not-deducted').length,
            totalAmount: all.reduce((s, a) => s + a.amount, 0),
            deductedAmount: all.filter(a => a.status === 'deducted').reduce((s, a) => s + a.amount, 0),
            pendingAmount: all.filter(a => a.status === 'approved' || a.status === 'not-deducted').reduce((s, a) => s + a.amount, 0)
        };
    });

    myAdvances = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        return this.advances().filter(a => a.employeeId === 'emp-current' && a.orgId === orgId);
    });

    private loadAdvances(): Advance[] {
        if (typeof localStorage === 'undefined') return this.getDefaultAdvances();
        try { const s = localStorage.getItem(this.STORAGE_KEY); return s ? JSON.parse(s) : this.getDefaultAdvances(); } catch { return this.getDefaultAdvances(); }
    }

    private saveAdvances(): void { if (typeof localStorage !== 'undefined') try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.advances())); } catch { } }

    private getDefaultAdvances(): Advance[] {
        return [
            {
                id: 'adv-1', employeeId: 'emp-current', employeeName: 'علی احمدی', department: 'فناوری اطلاعات',
                orgId: 'org1', titleId: 'at-1', titleLabel: 'مساعده حقوق', amount: 15000000,
                dueDateYear: 1403, dueDateMonth: 9, deductionLocationId: 'dl-1', deductionLocationLabel: 'حقوق ماهانه',
                deductionDateYear: 1403, deductionDateMonth: 10, status: 'deducted',
                approvedBy: 'مهندس رضایی', approvedAt: '1403/09/05', rejectReason: null,
                deductedAt: '1403/10/01', description: 'مساعده جهت پرداخت اجاره', createdAt: '1403/09/01', updatedAt: '1403/10/01'
            },
            {
                id: 'adv-2', employeeId: 'emp-current', employeeName: 'علی احمدی', department: 'فناوری اطلاعات',
                orgId: 'org1', titleId: 'at-3', titleLabel: 'مساعده ضروری', amount: 8000000,
                dueDateYear: 1403, dueDateMonth: 11, deductionLocationId: 'dl-2', deductionLocationLabel: 'میان‌دوره',
                deductionDateYear: 1403, deductionDateMonth: 12, status: 'approved',
                approvedBy: 'مدیر مالی', approvedAt: '1403/11/10', rejectReason: null,
                deductedAt: null, description: 'هزینه تعمیرات خودرو', createdAt: '1403/11/05', updatedAt: '1403/11/10'
            },
            {
                id: 'adv-3', employeeId: 'emp-current', employeeName: 'علی احمدی', department: 'فناوری اطلاعات',
                orgId: 'org1', titleId: 'at-5', titleLabel: 'مساعده درمانی', amount: 25000000,
                dueDateYear: 1403, dueDateMonth: 8, deductionLocationId: 'dl-1', deductionLocationLabel: 'حقوق ماهانه',
                deductionDateYear: 1403, deductionDateMonth: 9, status: 'rejected',
                approvedBy: null, approvedAt: null, rejectReason: 'سقف مساعده درمانی تکمیل شده است.',
                deductedAt: null, description: 'هزینه دندانپزشکی', createdAt: '1403/08/15', updatedAt: '1403/08/16'
            }
        ];
    }

    addAdvance(data: { titleId: string; amount: number; dueDateYear: number; dueDateMonth: number; deductionLocationId: string; deductionDateYear: number; deductionDateMonth: number; description: string }): void {
        const titleOpt = this.advanceTitles().find(t => t.id === data.titleId);
        const dlOpt = this.deductionLocations().find(d => d.id === data.deductionLocationId);
        if (!titleOpt || !dlOpt) return;

        const now = new Date().toLocaleDateString('fa-IR');
        const advance: Advance = {
            id: `adv-${Date.now()}`, employeeId: 'emp-current', employeeName: 'علی احمدی', department: 'فناوری اطلاعات',
            orgId: this.orgService.activeOrg().id,
            titleId: titleOpt.id, titleLabel: titleOpt.title, amount: data.amount,
            dueDateYear: data.dueDateYear, dueDateMonth: data.dueDateMonth,
            deductionLocationId: dlOpt.id, deductionLocationLabel: dlOpt.title,
            deductionDateYear: data.deductionDateYear, deductionDateMonth: data.deductionDateMonth,
            status: 'pending', approvedBy: null, approvedAt: null, rejectReason: null, deductedAt: null,
            description: data.description, createdAt: now, updatedAt: now
        };

        this.advances.update(a => [advance, ...a]);
        this.saveAdvances();
    }

    deleteAdvance(id: string): void {
        this.advances.update(a => a.filter(x => x.id !== id));
        this.saveAdvances();
    }

    approveAdvance(id: string, approver: string): void {
        this.advances.update(a => a.map(x => x.id === id ? { ...x, status: 'approved' as AdvanceStatus, approvedBy: approver, approvedAt: new Date().toLocaleDateString('fa-IR'), updatedAt: new Date().toLocaleDateString('fa-IR') } : x));
        this.saveAdvances();
    }

    rejectAdvance(id: string, reason: string): void {
        this.advances.update(a => a.map(x => x.id === id ? { ...x, status: 'rejected' as AdvanceStatus, rejectReason: reason, updatedAt: new Date().toLocaleDateString('fa-IR') } : x));
        this.saveAdvances();
    }

    markAsDeducted(id: string): void {
        this.advances.update(a => a.map(x => x.id === id ? { ...x, status: 'deducted' as AdvanceStatus, deductedAt: new Date().toLocaleDateString('fa-IR'), updatedAt: new Date().toLocaleDateString('fa-IR') } : x));
        this.saveAdvances();
    }

    getTitleLabel(id: string): string {
        return this.advanceTitles().find(t => t.id === id)?.title || id;
    }

    getStatusLabel(s: AdvanceStatus): string {
        return { pending: 'در انتظار تأیید', approved: 'تأیید شده', rejected: 'رد شده', deducted: 'کسر شده', 'not-deducted': 'کسر نشده', cancelled: 'لغو شده' }[s];
    }

    getStatusBadgeClass(s: AdvanceStatus): string {
        return { pending: 'bg-warning/10 text-warning', approved: 'bg-info/10 text-info', rejected: 'bg-danger/10 text-danger', deducted: 'bg-success/10 text-success', 'not-deducted': 'bg-muted/10 text-muted', cancelled: 'bg-muted/10 text-muted' }[s];
    }

    formatMoney(amount: number): string {
        return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
    }

    getMonthName(month: number): string {
        const names = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        return names[month - 1] || '';
    }
}
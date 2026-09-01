import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export type LoanType = 'housing' | 'marriage' | 'education' | 'medical' | 'personal' | 'emergency' | 'vehicle' | 'other';
export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted';
export type DeductionCondition = 'salary-deduction' | 'bank-transfer' | 'check' | 'guarantor' | 'collateral' | 'mixed';
export type InstallmentStatus = 'paid' | 'pending' | 'overdue' | 'deferred';

export interface LoanTypeOption {
    id: string;
    title: string;
    maxAmount: number;
    maxMonths: number;
    interestRate: number;
}

export interface DeductionConditionOption {
    id: string;
    title: string;
    description: string;
}

export interface Installment {
    id: string;
    installmentNumber: number;
    dueDateYear: number;
    dueDateMonth: number;
    deductionDateYear: number;
    deductionDateMonth: number;
    deductionLocation: string;
    amount: number;
    status: InstallmentStatus;
    paidAt: string | null;
    notes: string;
}

export interface Loan {
    id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    orgId: string;
    loanTypeId: string;
    loanTypeTitle: string;
    totalAmount: number;
    interestAmount: number;
    totalWithInterest: number;
    installmentCount: number;
    installmentAmount: number;
    startDeductionYear: number;
    startDeductionMonth: number;
    deductionConditionId: string;
    deductionConditionTitle: string;
    paidInstallments: number;
    totalPaidAmount: number;
    remainingInstallments: number;
    remainingAmount: number;
    status: LoanStatus;
    paymentDate: string;
    description: string;
    installments: Installment[];
    createdAt: string;
    updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class LoanService {
    private readonly STORAGE_KEY = 'hrm24_loans';
    private orgService = inject(OrganizationService);

    loans = signal<Loan[]>(this.loadLoans());

    loanTypes = signal<LoanTypeOption[]>([
        { id: 'lt-1', title: 'وام مسکن', maxAmount: 500000000, maxMonths: 60, interestRate: 18 },
        { id: 'lt-2', title: 'وام ازدواج', maxAmount: 300000000, maxMonths: 36, interestRate: 4 },
        { id: 'lt-3', title: 'وام تحصیلی', maxAmount: 100000000, maxMonths: 24, interestRate: 12 },
        { id: 'lt-4', title: 'وام درمانی', maxAmount: 200000000, maxMonths: 24, interestRate: 10 },
        { id: 'lt-5', title: 'وام شخصی', maxAmount: 150000000, maxMonths: 36, interestRate: 18 },
        { id: 'lt-6', title: 'وام ضروری', maxAmount: 50000000, maxMonths: 12, interestRate: 15 },
        { id: 'lt-7', title: 'وام خودرو', maxAmount: 400000000, maxMonths: 48, interestRate: 18 },
        { id: 'lt-8', title: 'سایر', maxAmount: 100000000, maxMonths: 24, interestRate: 18 }
    ]);

    deductionConditions = signal<DeductionConditionOption[]>([
        { id: 'dc-1', title: 'کسر از حقوق', description: 'کسر خودکار از فیش حقوقی ماهانه' },
        { id: 'dc-2', title: 'واریز بانکی', description: 'واریز مستقیم به حساب بانک عامل' },
        { id: 'dc-3', title: 'چک', description: 'ارائه چک‌های صیادی معتبر' },
        { id: 'dc-4', title: 'ضامن', description: 'تضمین توسط ضامن معتبر' },
        { id: 'dc-5', title: 'وثیقه', description: 'ترهین سند یا وثیقه ملکی' },
        { id: 'dc-6', title: 'ترکیبی', description: 'ترکیب چند روش فوق' }
    ]);

    stats = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const all = this.loans().filter(l => l.orgId === orgId);
        const active = all.filter(l => l.status === 'active');
        const completed = all.filter(l => l.status === 'completed');
        return {
            totalLoans: all.length,
            activeLoans: active.length,
            completedLoans: completed.length,
            pendingLoans: all.filter(l => l.status === 'pending').length,
            rejectedLoans: all.filter(l => l.status === 'rejected').length,
            totalAmountGranted: all.reduce((s, l) => s + l.totalWithInterest, 0),
            totalPaid: all.reduce((s, l) => s + l.totalPaidAmount, 0),
            totalRemaining: all.reduce((s, l) => s + l.remainingAmount, 0),
            totalInstallments: all.reduce((s, l) => s + l.installmentCount, 0),
            totalPaidInstallments: all.reduce((s, l) => s + l.paidInstallments, 0),
            totalRemainingInstallments: all.reduce((s, l) => s + l.remainingInstallments, 0),
            avgProgress: active.length > 0 ? Math.round(active.reduce((s, l) => s + (l.installmentCount > 0 ? (l.paidInstallments / l.installmentCount) * 100 : 0), 0) / active.length) : 0
        };
    });

    myLoans = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        return this.loans().filter(l => l.employeeId === 'emp-current' && l.orgId === orgId);
    });

    private loadLoans(): Loan[] {
        if (typeof localStorage === 'undefined') return this.getDefaultLoans();
        try { const s = localStorage.getItem(this.STORAGE_KEY); return s ? JSON.parse(s) : this.getDefaultLoans(); } catch { return this.getDefaultLoans(); }
    }

    private saveLoans(): void { if (typeof localStorage !== 'undefined') try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.loans())); } catch { } }

    private generateInstallments(totalAmount: number, count: number, startYear: number, startMonth: number): Installment[] {
        const amount = Math.round(totalAmount / count);
        const installments: Installment[] = [];
        let y = startYear;
        let m = startMonth;
        for (let i = 1; i <= count; i++) {
            installments.push({
                id: `inst-${i}`,
                installmentNumber: i,
                dueDateYear: y,
                dueDateMonth: m,
                deductionDateYear: y,
                deductionDateMonth: m,
                deductionLocation: 'حسابداری مرکزی',
                amount,
                status: 'pending',
                paidAt: null,
                notes: ''
            });
            m++;
            if (m > 12) { m = 1; y++; }
        }
        return installments;
    }

    private getDefaultLoans(): Loan[] {
        const inst1 = this.generateInstallments(120000000, 24, 1403, 1);
        inst1.slice(0, 8).forEach(i => { i.status = 'paid'; i.paidAt = '1403/' + String(i.dueDateMonth).padStart(2, '0') + '/01'; });
        const inst2 = this.generateInstallments(60000000, 12, 1403, 4);
        inst2.forEach(i => { i.status = 'paid'; i.paidAt = '1403/' + String(i.dueDateMonth).padStart(2, '0') + '/01'; });

        return [
            {
                id: 'loan-1', employeeId: 'emp-current', employeeName: 'علی احمدی', department: 'فناوری اطلاعات',
                orgId: 'org1',
                loanTypeId: 'lt-5', loanTypeTitle: 'وام شخصی', totalAmount: 100000000, interestAmount: 20000000,
                totalWithInterest: 120000000, installmentCount: 24, installmentAmount: 5000000,
                startDeductionYear: 1403, startDeductionMonth: 1,
                deductionConditionId: 'dc-1', deductionConditionTitle: 'کسر از حقوق',
                paidInstallments: 8, totalPaidAmount: 40000000, remainingInstallments: 16, remainingAmount: 80000000,
                status: 'active', paymentDate: '1402/12/15', description: 'وام شخصی جهت خرید لوازم خانگی',
                installments: inst1, createdAt: '1402/12/10', updatedAt: '1403/08/01'
            },
            {
                id: 'loan-2', employeeId: 'emp-current', employeeName: 'علی احمدی', department: 'فناوری اطلاعات',
                orgId: 'org1',
                loanTypeId: 'lt-3', loanTypeTitle: 'وام تحصیلی', totalAmount: 50000000, interestAmount: 10000000,
                totalWithInterest: 60000000, installmentCount: 12, installmentAmount: 5000000,
                startDeductionYear: 1403, startDeductionMonth: 4,
                deductionConditionId: 'dc-1', deductionConditionTitle: 'کسر از حقوق',
                paidInstallments: 12, totalPaidAmount: 60000000, remainingInstallments: 0, remainingAmount: 0,
                status: 'completed', paymentDate: '1403/03/20', description: 'وام تحصیلی فرزند',
                installments: inst2, createdAt: '1403/03/15', updatedAt: '1403/08/01'
            },
            {
                id: 'loan-3', employeeId: 'emp-current', employeeName: 'علی احمدی', department: 'فناوری اطلاعات',
                orgId: 'org1',
                loanTypeId: 'lt-6', loanTypeTitle: 'وام ضروری', totalAmount: 30000000, interestAmount: 4500000,
                totalWithInterest: 34500000, installmentCount: 6, installmentAmount: 5750000,
                startDeductionYear: 1403, startDeductionMonth: 9,
                deductionConditionId: 'dc-3', deductionConditionTitle: 'چک',
                paidInstallments: 0, totalPaidAmount: 0, remainingInstallments: 6, remainingAmount: 34500000,
                status: 'pending', paymentDate: '', description: 'درخواست وام ضروری',
                installments: [], createdAt: '1403/08/10', updatedAt: '1403/08/10'
            }
        ];
    }

    addLoan(data: { loanTypeId: string; totalAmount: number; installmentCount: number; startDeductionYear: number; startDeductionMonth: number; deductionConditionId: string; description: string }): void {
        const lt = this.loanTypes().find(t => t.id === data.loanTypeId);
        const dc = this.deductionConditions().find(d => d.id === data.deductionConditionId);
        if (!lt || !dc) return;

        const interestAmount = Math.round(data.totalAmount * (lt.interestRate / 100));
        const totalWithInterest = data.totalAmount + interestAmount;
        const installmentAmount = Math.round(totalWithInterest / data.installmentCount);
        const installments = this.generateInstallments(totalWithInterest, data.installmentCount, data.startDeductionYear, data.startDeductionMonth);
        const now = new Date().toLocaleDateString('fa-IR');

        const loan: Loan = {
            id: `loan-${Date.now()}`, employeeId: 'emp-current', employeeName: 'علی احمدی', department: 'فناوری اطلاعات',
            orgId: this.orgService.activeOrg().id,
            loanTypeId: lt.id, loanTypeTitle: lt.title, totalAmount: data.totalAmount, interestAmount,
            totalWithInterest, installmentCount: data.installmentCount, installmentAmount,
            startDeductionYear: data.startDeductionYear, startDeductionMonth: data.startDeductionMonth,
            deductionConditionId: dc.id, deductionConditionTitle: dc.title,
            paidInstallments: 0, totalPaidAmount: 0, remainingInstallments: data.installmentCount, remainingAmount: totalWithInterest,
            status: 'pending', paymentDate: '', description: data.description,
            installments, createdAt: now, updatedAt: now
        };

        this.loans.update(l => [loan, ...l]);
        this.saveLoans();
    }

    deleteLoan(id: string): void {
        this.loans.update(l => l.filter(x => x.id !== id));
        this.saveLoans();
    }

    getLoanTypeLabel(id: string): string {
        return this.loanTypes().find(t => t.id === id)?.title || id;
    }

    getStatusLabel(s: LoanStatus): string {
        return { pending: 'در انتظار تأیید', approved: 'تأیید شده', rejected: 'رد شده', active: 'فعال', completed: 'تکمیل شده', defaulted: 'معوقه' }[s];
    }

    getStatusBadgeClass(s: LoanStatus): string {
        return { pending: 'bg-warning/10 text-warning', approved: 'bg-info/10 text-info', rejected: 'bg-danger/10 text-danger', active: 'bg-primary/10 text-primary', completed: 'bg-success/10 text-success', defaulted: 'bg-danger/10 text-danger' }[s];
    }

    getInstallmentStatusLabel(s: InstallmentStatus): string {
        return { paid: 'پرداخت شده', pending: 'در انتظار', overdue: 'معوقه', deferred: 'تعویق' }[s];
    }

    getInstallmentStatusBadgeClass(s: InstallmentStatus): string {
        return { paid: 'bg-success/10 text-success', pending: 'bg-warning/10 text-warning', overdue: 'bg-danger/10 text-danger', deferred: 'bg-muted/10 text-muted' }[s];
    }

    formatMoney(amount: number): string {
        return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
    }

    getMonthName(month: number): string {
        const names = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        return names[month - 1] || '';
    }
}
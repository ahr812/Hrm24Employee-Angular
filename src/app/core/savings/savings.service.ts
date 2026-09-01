import { Injectable, signal, computed } from '@angular/core';

export type SavingsMembershipStatus = 'active' | 'pending' | 'completed' | 'rejected' | 'cancelled' | 'pending-settlement' | 'settled';
export type SavingsTransactionType = 'deposit' | 'interest' | 'withdrawal' | 'settlement';

export interface SavingsFundOption {
    id: string;
    title: string;
    description: string;
    interestRate: number;
    minMonthlyAmount: number;
    maxMonthlyAmount: number;
    minDurationMonths: number;
    maxDurationMonths: number;
}

export interface SavingsTransaction {
    id: string;
    membershipId: string;
    type: SavingsTransactionType;
    amount: number;
    balanceAfter: number;
    createdAt: string;
    description: string;
}

export interface SavingsMembership {
    id: string;
    fundId: string;
    fundTitle: string;
    status: SavingsMembershipStatus;
    monthlyAmount: number;
    totalDeposited: number;
    totalInterest: number;
    currentBalance: number;
    startYear: number;
    startMonth: number;
    endYear: number;
    endMonth: number;
    conditionId: string;
    conditionLabel: string;
    joinedAt: string | null;
    settledAt: string | null;
    transactions: SavingsTransaction[];
}

export interface SavingsCondition {
    id: string;
    title: string;
    description: string;
}

@Injectable({ providedIn: 'root' })
export class SavingsService {
    private readonly MEMBERSHIPS_KEY = 'hrm24_savings_memberships';

    memberships = signal<SavingsMembership[]>(this.loadMemberships());

    stats = computed(() => {
        const list = this.memberships();
        return {
            totalMemberships: list.length,
            activeMemberships: list.filter(m => m.status === 'active').length,
            pendingMemberships: list.filter(m => ['pending', 'pending-settlement'].includes(m.status)).length,
            totalDeposited: list.reduce((s, m) => s + m.totalDeposited, 0),
            totalInterest: list.reduce((s, m) => s + m.totalInterest, 0),
            totalBalance: list.reduce((s, m) => s + m.currentBalance, 0)
        };
    });

    myMemberships = computed(() => this.memberships());

    fundTypes(): SavingsFundOption[] {
        return [
            { id: 'sf-1', title: 'صندوق پس‌انداز عادی', description: 'پس‌انداز ماهانه با سود ثابت', interestRate: 18, minMonthlyAmount: 500000, maxMonthlyAmount: 5000000, minDurationMonths: 6, maxDurationMonths: 24 },
            { id: 'sf-2', title: 'صندوق پس‌انداز ویژه', description: 'نرخ سود بالاتر برای مبالغ بیشتر', interestRate: 22, minMonthlyAmount: 2000000, maxMonthlyAmount: 20000000, minDurationMonths: 12, maxDurationMonths: 36 },
            { id: 'sf-3', title: 'صندوق مسکن', description: 'تسهیلات ویژه خرید مسکن', interestRate: 15, minMonthlyAmount: 1000000, maxMonthlyAmount: 10000000, minDurationMonths: 12, maxDurationMonths: 48 },
            { id: 'sf-4', title: 'صندوق کمک به ازدواج همکاران', description: 'کمک هزینه ازدواج کارکنان با شرایط ویژه', interestRate: 5, minMonthlyAmount: 100000, maxMonthlyAmount: 2000000, minDurationMonths: 6, maxDurationMonths: 24 }
        ];
    }

    conditions(): SavingsCondition[] {
        return [
            { id: 'sc-1', title: 'بازپرداخت یکجا', description: 'دریافت کل مبلغ در پایان دوره' },
            { id: 'sc-2', title: 'بازپرداخت اقساطی', description: 'دریافت در چند قسط پس از پایان' },
            { id: 'sc-3', title: 'تمدید خودکار', description: 'تمدید دوره با سود انباشته' }
        ];
    }

    getFundStats(fundId: string) {
        const members = this.memberships().filter(m => m.fundId === fundId);
        return {
            totalMembers: members.length,
            activeMembers: members.filter(m => m.status === 'active').length,
            totalDeposited: members.reduce((s, m) => s + m.totalDeposited, 0),
            totalBalance: members.reduce((s, m) => s + m.currentBalance, 0)
        };
    }

    requestMembership(data: {
        fundId: string;
        monthlyAmount: number;
        startYear: number;
        startMonth: number;
        endYear: number;
        endMonth: number;
        conditionId: string;
    }): void {
        const fund = this.fundTypes().find(f => f.id === data.fundId);
        const condition = this.conditions().find(c => c.id === data.conditionId);
        if (!fund || !condition) return;

        const newMem: SavingsMembership = {
            id: `sm-${Date.now()}`,
            fundId: data.fundId,
            fundTitle: fund.title,
            status: 'pending',
            monthlyAmount: data.monthlyAmount,
            totalDeposited: 0,
            totalInterest: 0,
            currentBalance: 0,
            startYear: data.startYear,
            startMonth: data.startMonth,
            endYear: data.endYear,
            endMonth: data.endMonth,
            conditionId: data.conditionId,
            conditionLabel: condition.title,
            joinedAt: new Date().toLocaleDateString('fa-IR'),
            settledAt: null,
            transactions: []
        };

        this.memberships.update(list => [...list, newMem]);
        this.saveMemberships();
    }

    requestSettlement(membershipId: string): void {
        this.memberships.update(list => list.map(m =>
            m.id === membershipId && m.status === 'active'
                ? { ...m, status: 'pending-settlement' as SavingsMembershipStatus }
                : m
        ));
        this.saveMemberships();
    }

    getStatusLabel(status: SavingsMembershipStatus): string {
        const map: Record<SavingsMembershipStatus, string> = {
            active: 'فعال',
            pending: 'در انتظار تأیید',
            completed: 'تکمیل شده',
            rejected: 'رد شده',
            cancelled: 'لغو شده',
            'pending-settlement': 'در انتظار تسویه',
            settled: 'تسویه شده'
        };
        return map[status] || status;
    }

    getStatusBadgeClass(status: SavingsMembershipStatus): string {
        const map: Record<SavingsMembershipStatus, string> = {
            active: 'bg-success/10 text-success',
            pending: 'bg-warning/10 text-warning',
            completed: 'bg-info/10 text-info',
            rejected: 'bg-danger/10 text-danger',
            cancelled: 'bg-muted/10 text-muted',
            'pending-settlement': 'bg-orange-500/10 text-orange-500',
            settled: 'bg-primary/10 text-primary'
        };
        return map[status] || 'bg-muted/10 text-muted';
    }

    getTransactionTypeLabel(type: SavingsTransactionType): string {
        const map: Record<SavingsTransactionType, string> = {
            deposit: 'واریز',
            interest: 'سود',
            withdrawal: 'برداشت',
            settlement: 'تسویه'
        };
        return map[type] || type;
    }

    getTransactionBadgeClass(type: SavingsTransactionType): string {
        const map: Record<SavingsTransactionType, string> = {
            deposit: 'bg-success/10 text-success',
            interest: 'bg-info/10 text-info',
            withdrawal: 'bg-warning/10 text-warning',
            settlement: 'bg-primary/10 text-primary'
        };
        return map[type] || 'bg-muted/10 text-muted';
    }

    formatMoney(amount: number): string {
        return new Intl.NumberFormat('fa-IR').format(amount);
    }

    getMonthName(month: number): string {
        const months = ['', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        return months[month] || '';
    }

    private loadMemberships(): SavingsMembership[] {
        try {
            const s = localStorage.getItem(this.MEMBERSHIPS_KEY);
            // اگر داده‌ای نبود یا خراب بود، داده‌های پیش‌فرض کامل را برگردان
            if (!s) return this.getDefaultMemberships();
            const parsed = JSON.parse(s);
            // اگر تعداد داده‌ها کمتر از ۴ تاست (یعنی دمو کامل نیست)، دوباره دمو را لود کن
            if (parsed.length < 4) return this.getDefaultMemberships();
            return parsed;
        } catch {
            return this.getDefaultMemberships();
        }
    }

    private saveMemberships(): void {
        try { localStorage.setItem(this.MEMBERSHIPS_KEY, JSON.stringify(this.memberships())); } catch { }
    }

    private getDefaultMemberships(): SavingsMembership[] {
        const today = new Date().toLocaleDateString('fa-IR');
        return [
            // 1. Active (صندوق عادی)
            {
                id: 'sm-1', fundId: 'sf-1', fundTitle: 'صندوق پس‌انداز عادی', status: 'active',
                monthlyAmount: 2000000, totalDeposited: 12000000, totalInterest: 900000, currentBalance: 12900000,
                startYear: 1403, startMonth: 1, endYear: 1404, endMonth: 12,
                conditionId: 'sc-1', conditionLabel: 'بازپرداخت یکجا',
                joinedAt: '۱۴۰۳/۰۱/۱۵', settledAt: null,
                transactions: [
                    { id: 'tx-1', membershipId: 'sm-1', type: 'deposit', amount: 2000000, balanceAfter: 2000000, createdAt: '۱۴۰۳/۰۱/۲۸', description: 'واریز ماهانه فروردین' }
                ]
            },
            // 2. Pending (صندوق ویژه - در انتظار تایید)
            {
                id: 'sm-2', fundId: 'sf-2', fundTitle: 'صندوق پس‌انداز ویژه', status: 'pending',
                monthlyAmount: 5000000, totalDeposited: 0, totalInterest: 0, currentBalance: 0,
                startYear: 1405, startMonth: 1, endYear: 1406, endMonth: 1,
                conditionId: 'sc-2', conditionLabel: 'بازپرداخت اقساطی',
                joinedAt: today, settledAt: null,
                transactions: []
            },
            // 3. Pending Settlement (صندوق مسکن - در انتظار تسویه)
            {
                id: 'sm-3', fundId: 'sf-3', fundTitle: 'صندوق مسکن', status: 'pending-settlement',
                monthlyAmount: 3000000, totalDeposited: 36000000, totalInterest: 2700000, currentBalance: 38700000,
                startYear: 1402, startMonth: 1, endYear: 1403, endMonth: 12,
                conditionId: 'sc-1', conditionLabel: 'بازپرداخت یکجا',
                joinedAt: '۱۴۰۲/۰۱/۱۰', settledAt: null,
                transactions: [
                    { id: 'tx-3-1', membershipId: 'sm-3', type: 'deposit', amount: 3000000, balanceAfter: 3000000, createdAt: '۱۴۰۲/۰۱/۲۸', description: 'واریز اولیه' }
                ]
            },
            // 4. No Membership (صندوق ازدواج - هنوز عضو نشده) -> این در لیست memberships نیست، بلکه غیبت آن نشان‌دهنده این وضعیت است
        ];
    }
}
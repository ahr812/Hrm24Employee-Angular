import { TestBed } from '@angular/core/testing';
import { SavingsService } from './savings.service';

describe('SavingsService', () => {
    let service: SavingsService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(SavingsService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have default memberships', () => {
        const memberships = service.memberships();
        expect(memberships.length).toBeGreaterThan(0);
    });

    it('should have fund types defined', () => {
        const funds = service.fundTypes();
        expect(funds.length).toBeGreaterThan(0);
        expect(funds[0].title).toBeTruthy();
        expect(funds[0].minMonthlyAmount).toBeGreaterThan(0);
        expect(funds[0].maxMonthlyAmount).toBeGreaterThan(funds[0].minMonthlyAmount);
        expect(funds[0].interestRate).toBeGreaterThan(0);
    });

    it('should have conditions defined', () => {
        const conditions = service.conditions();
        expect(conditions.length).toBe(3);
        expect(conditions[0].title).toBeTruthy();
    });

    it('should return correct status labels', () => {
        expect(service.getStatusLabel('pending')).toBe('در انتظار تأیید');
        expect(service.getStatusLabel('active')).toBe('فعال');
        expect(service.getStatusLabel('rejected')).toBe('رد شده');
        expect(service.getStatusLabel('completed')).toBe('تکمیل شده');
    });

    it('should return correct status badge classes', () => {
        expect(service.getStatusBadgeClass('pending')).toContain('warning');
        expect(service.getStatusBadgeClass('active')).toContain('success');
        expect(service.getStatusBadgeClass('rejected')).toContain('danger');
    });

    it('should format money correctly', () => {
        const formatted = service.formatMoney(1000000);
        expect(formatted).toContain('تومان');
    });

    it('should return correct month names', () => {
        expect(service.getMonthName(1)).toBe('فروردین');
        expect(service.getMonthName(12)).toBe('اسفند');
        expect(service.getMonthName(0)).toBe('');
    });

    it('should return correct transaction type labels', () => {
        expect(service.getTransactionTypeLabel('deposit')).toBe('واریز');
        expect(service.getTransactionTypeLabel('withdrawal')).toBe('برداشت');
        expect(service.getTransactionTypeLabel('interest')).toBe('سود');
    });

    it('should request membership successfully', () => {
        const beforeCount = service.memberships().length;
        service.requestMembership({
            fundId: 'sf-1', monthlyAmount: 2000000, startYear: 1403, startMonth: 9,
            endYear: 1405, endMonth: 8, conditionId: 'sc-1'
        });
        expect(service.memberships().length).toBe(beforeCount + 1);
        const newMem = service.memberships()[0];
        expect(newMem.monthlyAmount).toBe(2000000);
        expect(newMem.status).toBe('pending');
        expect(newMem.orgId).toBeTruthy();
        expect(newMem.totalDeposited).toBe(0);
    });

    it('should delete membership', () => {
        const firstId = service.memberships()[0].id;
        const beforeCount = service.memberships().length;
        service.deleteMembership(firstId);
        expect(service.memberships().length).toBe(beforeCount - 1);
    });

    it('should approve membership', () => {
        const pendingMem = service.memberships().find(m => m.status === 'pending');
        if (pendingMem) {
            service.approveMembership(pendingMem.id, 'مدیر تست');
            const updated = service.memberships().find(m => m.id === pendingMem.id);
            expect(updated!.status).toBe('active');
            expect(updated!.approvedBy).toBe('مدیر تست');
            expect(updated!.joinedAt).toBeTruthy();
        }
    });

    it('should reject membership', () => {
        const pendingMem = service.memberships().find(m => m.status === 'pending');
        if (pendingMem) {
            service.rejectMembership(pendingMem.id, 'شرایط احراز نشده');
            const updated = service.memberships().find(m => m.id === pendingMem.id);
            expect(updated!.status).toBe('rejected');
            expect(updated!.rejectReason).toBe('شرایط احراز نشده');
        }
    });

    it('should filter my memberships by orgId', () => {
        const myMems = service.myMemberships();
        myMems.forEach((m: any) => {
            expect(m.employeeId).toBe('emp-current');
            expect(m.orgId).toBeTruthy();
        });
    });

    it('should calculate stats correctly', () => {
        const stats = service.stats();
        expect(stats.totalMemberships).toBeGreaterThan(0);
        expect(stats.activeMemberships).toBeGreaterThanOrEqual(0);
        expect(stats.totalDeposited).toBeGreaterThanOrEqual(0);
        expect(stats.totalBalance).toBeGreaterThanOrEqual(0);
    });

    it('should get fund stats', () => {
        const fundStats = service.getFundStats('sf-1');
        expect(fundStats.totalMembers).toBeGreaterThanOrEqual(0);
        expect(fundStats.totalDeposited).toBeGreaterThanOrEqual(0);
    });

    it('should persist data to localStorage after modification', () => {
        service.requestMembership({
            fundId: 'sf-6', monthlyAmount: 500000, startYear: 1403, startMonth: 6,
            endYear: 1404, endMonth: 5, conditionId: 'sc-1'
        });
        const stored = localStorage.getItem('hrm24_savings');
        expect(stored).toBeTruthy();
    });
});
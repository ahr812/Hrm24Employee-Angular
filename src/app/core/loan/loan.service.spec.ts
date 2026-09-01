import { TestBed } from '@angular/core/testing';
import { LoanService } from './loan.service';

describe('LoanService', () => {
    let service: LoanService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(LoanService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have default loans', () => {
        const loans = service.loans();
        expect(loans.length).toBeGreaterThan(0);
    });

    it('should have loan types defined', () => {
        const types = service.loanTypes();
        expect(types.length).toBeGreaterThan(0);
        expect(types[0].title).toBeTruthy();
        expect(types[0].maxAmount).toBeGreaterThan(0);
        expect(types[0].interestRate).toBeGreaterThan(0);
    });

    it('should have deduction conditions defined', () => {
        const conditions = service.deductionConditions();
        expect(conditions.length).toBeGreaterThan(0);
        expect(conditions[0].title).toBeTruthy();
    });

    it('should return correct status labels', () => {
        expect(service.getStatusLabel('pending')).toBe('در انتظار تأیید');
        expect(service.getStatusLabel('approved')).toBe('تأیید شده');
        expect(service.getStatusLabel('rejected')).toBe('رد شده');
        expect(service.getStatusLabel('active')).toBe('فعال');
        expect(service.getStatusLabel('completed')).toBe('تکمیل شده');
        expect(service.getStatusLabel('defaulted')).toBe('معوقه');
    });

    it('should return correct installment status labels', () => {
        expect(service.getInstallmentStatusLabel('paid')).toBe('پرداخت شده');
        expect(service.getInstallmentStatusLabel('pending')).toBe('در انتظار');
        expect(service.getInstallmentStatusLabel('overdue')).toBe('معوقه');
        expect(service.getInstallmentStatusLabel('deferred')).toBe('تعویق');
    });

    it('should return correct status badge classes', () => {
        expect(service.getStatusBadgeClass('active')).toContain('primary');
        expect(service.getStatusBadgeClass('completed')).toContain('success');
        expect(service.getStatusBadgeClass('rejected')).toContain('danger');
        expect(service.getStatusBadgeClass('pending')).toContain('warning');
    });

    it('should return correct installment status badge classes', () => {
        expect(service.getInstallmentStatusBadgeClass('paid')).toContain('success');
        expect(service.getInstallmentStatusBadgeClass('pending')).toContain('warning');
        expect(service.getInstallmentStatusBadgeClass('overdue')).toContain('danger');
    });

    it('should format money correctly', () => {
        const formatted = service.formatMoney(1000000);
        expect(formatted).toContain('تومان');
        expect(formatted).toContain('۱');
    });

    it('should return correct month names', () => {
        expect(service.getMonthName(1)).toBe('فروردین');
        expect(service.getMonthName(6)).toBe('شهریور');
        expect(service.getMonthName(12)).toBe('اسفند');
        expect(service.getMonthName(0)).toBe('');
        expect(service.getMonthName(13)).toBe('');
    });

    it('should add loan successfully', () => {
        const beforeCount = service.loans().length;
        service.addLoan({
            loanTypeId: 'lt-5',
            totalAmount: 50000000,
            installmentCount: 12,
            startDeductionYear: 1403,
            startDeductionMonth: 6,
            deductionConditionId: 'dc-1',
            description: 'تست وام'
        });
        expect(service.loans().length).toBe(beforeCount + 1);
        const newLoan = service.loans()[0];
        expect(newLoan.totalAmount).toBe(50000000);
        expect(newLoan.installmentCount).toBe(12);
        expect(newLoan.status).toBe('pending');
        expect(newLoan.paidInstallments).toBe(0);
        expect(newLoan.installments.length).toBe(12);
    });

    it('should calculate interest correctly when adding loan', () => {
        service.addLoan({
            loanTypeId: 'lt-5',
            totalAmount: 100000000,
            installmentCount: 24,
            startDeductionYear: 1403,
            startDeductionMonth: 1,
            deductionConditionId: 'dc-1',
            description: ''
        });
        const newLoan = service.loans()[0];
        const lt = service.loanTypes().find(t => t.id === 'lt-5');
        expect(newLoan.interestAmount).toBe(Math.round(100000000 * (lt!.interestRate / 100)));
        expect(newLoan.totalWithInterest).toBe(newLoan.totalAmount + newLoan.interestAmount);
    });

    it('should generate correct number of installments', () => {
        service.addLoan({
            loanTypeId: 'lt-5',
            totalAmount: 60000000,
            installmentCount: 6,
            startDeductionYear: 1403,
            startDeductionMonth: 1,
            deductionConditionId: 'dc-1',
            description: ''
        });
        const newLoan = service.loans()[0];
        expect(newLoan.installments.length).toBe(6);
        expect(newLoan.installments[0].installmentNumber).toBe(1);
        expect(newLoan.installments[5].installmentNumber).toBe(6);
    });

    it('should handle year rollover in installments', () => {
        service.addLoan({
            loanTypeId: 'lt-5',
            totalAmount: 120000000,
            installmentCount: 18,
            startDeductionYear: 1403,
            startDeductionMonth: 10,
            deductionConditionId: 'dc-1',
            description: ''
        });
        const newLoan = service.loans()[0];
        // قسط 1: مهر 1403
        expect(newLoan.installments[0].dueDateYear).toBe(1403);
        expect(newLoan.installments[0].dueDateMonth).toBe(10);
        // قسط 2: آبان 1403
        expect(newLoan.installments[1].dueDateYear).toBe(1403);
        expect(newLoan.installments[1].dueDateMonth).toBe(11);
        // قسط 3: آذر 1403
        expect(newLoan.installments[2].dueDateYear).toBe(1403);
        expect(newLoan.installments[2].dueDateMonth).toBe(12);
        // قسط 4: فروردین 1404 (سال جدید)
        expect(newLoan.installments[3].dueDateYear).toBe(1404);
        expect(newLoan.installments[3].dueDateMonth).toBe(1);
    });

    it('should delete loan', () => {
        const firstId = service.loans()[0].id;
        const beforeCount = service.loans().length;
        service.deleteLoan(firstId);
        expect(service.loans().length).toBe(beforeCount - 1);
        expect(service.loans().find(l => l.id === firstId)).toBeUndefined();
    });

    it('should filter my loans', () => {
        const myLoans = service.myLoans();
        myLoans.forEach(l => {
            expect(l.employeeId).toBe('emp-current');
        });
    });

    it('should calculate stats correctly', () => {
        const stats = service.stats();
        expect(stats.totalLoans).toBeGreaterThan(0);
        expect(stats.activeLoans).toBeGreaterThanOrEqual(0);
        expect(stats.completedLoans).toBeGreaterThanOrEqual(0);
        expect(stats.totalAmountGranted).toBeGreaterThan(0);
        expect(stats.totalPaid).toBeGreaterThanOrEqual(0);
        expect(stats.totalRemaining).toBeGreaterThanOrEqual(0);
        expect(stats.totalInstallments).toBeGreaterThan(0);
        expect(stats.avgProgress).toBeGreaterThanOrEqual(0);
        expect(stats.avgProgress).toBeLessThanOrEqual(100);
    });

    it('should get loan type label', () => {
        expect(service.getLoanTypeLabel('lt-1')).toBe('وام مسکن');
        expect(service.getLoanTypeLabel('lt-5')).toBe('وام شخصی');
        expect(service.getLoanTypeLabel('invalid')).toBe('invalid');
    });

    it('should persist data to localStorage after modification', () => {
        service.addLoan({
            loanTypeId: 'lt-5', totalAmount: 10000000, installmentCount: 6,
            startDeductionYear: 1403, startDeductionMonth: 1,
            deductionConditionId: 'dc-1', description: 'تست پایداری'
        });
        const stored = localStorage.getItem('hrm24_loans');
        expect(stored).toBeTruthy();
    });
});
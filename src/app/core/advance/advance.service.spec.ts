import { TestBed } from '@angular/core/testing';
import { AdvanceService } from './advance.service';

describe('AdvanceService', () => {
    let service: AdvanceService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(AdvanceService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have default advances', () => {
        const advances = service.advances();
        expect(advances.length).toBeGreaterThan(0);
    });

    it('should have advance titles defined', () => {
        const titles = service.advanceTitles();
        expect(titles.length).toBeGreaterThan(0);
        expect(titles[0].title).toBeTruthy();
        expect(titles[0].maxAmount).toBeGreaterThan(0);
    });

    it('should have deduction locations defined', () => {
        const locations = service.deductionLocations();
        expect(locations.length).toBeGreaterThan(0);
        expect(locations[0].title).toBeTruthy();
    });

    it('should return correct status labels', () => {
        expect(service.getStatusLabel('pending')).toBe('در انتظار تأیید');
        expect(service.getStatusLabel('approved')).toBe('تأیید شده');
        expect(service.getStatusLabel('rejected')).toBe('رد شده');
        expect(service.getStatusLabel('deducted')).toBe('کسر شده');
        expect(service.getStatusLabel('not-deducted')).toBe('کسر نشده');
    });

    it('should return correct status badge classes', () => {
        expect(service.getStatusBadgeClass('pending')).toContain('warning');
        expect(service.getStatusBadgeClass('approved')).toContain('info');
        expect(service.getStatusBadgeClass('rejected')).toContain('danger');
        expect(service.getStatusBadgeClass('deducted')).toContain('success');
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

    it('should add advance successfully', () => {
        const beforeCount = service.advances().length;
        service.addAdvance({
            titleId: 'at-1', amount: 10000000, dueDateYear: 1403, dueDateMonth: 9,
            deductionLocationId: 'dl-1', deductionDateYear: 1403, deductionDateMonth: 10,
            description: 'تست مساعده'
        });
        expect(service.advances().length).toBe(beforeCount + 1);
        const newAdv = service.advances()[0];
        expect(newAdv.amount).toBe(10000000);
        expect(newAdv.status).toBe('pending');
        expect(newAdv.orgId).toBeTruthy();
    });

    it('should delete advance', () => {
        const firstId = service.advances()[0].id;
        const beforeCount = service.advances().length;
        service.deleteAdvance(firstId);
        expect(service.advances().length).toBe(beforeCount - 1);
    });

    it('should approve advance', () => {
        const pendingAdv = service.advances().find(a => a.status === 'pending');
        if (pendingAdv) {
            service.approveAdvance(pendingAdv.id, 'مدیر تست');
            const updated = service.advances().find(a => a.id === pendingAdv.id);
            expect(updated!.status).toBe('approved');
            expect(updated!.approvedBy).toBe('مدیر تست');
        }
    });

    it('should reject advance', () => {
        const pendingAdv = service.advances().find(a => a.status === 'pending');
        if (pendingAdv) {
            service.rejectAdvance(pendingAdv.id, 'بودجه کافی نیست');
            const updated = service.advances().find(a => a.id === pendingAdv.id);
            expect(updated!.status).toBe('rejected');
            expect(updated!.rejectReason).toBe('بودجه کافی نیست');
        }
    });

    it('should mark as deducted', () => {
        const approvedAdv = service.advances().find(a => a.status === 'approved');
        if (approvedAdv) {
            service.markAsDeducted(approvedAdv.id);
            const updated = service.advances().find(a => a.id === approvedAdv.id);
            expect(updated!.status).toBe('deducted');
            expect(updated!.deductedAt).toBeTruthy();
        }
    });

    it('should filter my advances by orgId', () => {
        const myAdvs = service.myAdvances();
        myAdvs.forEach(a => {
            expect(a.employeeId).toBe('emp-current');
            expect(a.orgId).toBeTruthy();
        });
    });

    it('should calculate stats correctly', () => {
        const stats = service.stats();
        expect(stats.total).toBeGreaterThan(0);
        expect(stats.totalAmount).toBeGreaterThan(0);
        expect(stats.pending).toBeGreaterThanOrEqual(0);
        expect(stats.deducted).toBeGreaterThanOrEqual(0);
    });

    it('should persist data to localStorage after modification', () => {
        service.addAdvance({
            titleId: 'at-1', amount: 5000000, dueDateYear: 1403, dueDateMonth: 6,
            deductionLocationId: 'dl-1', deductionDateYear: 1403, deductionDateMonth: 7,
            description: 'تست پایداری'
        });
        const stored = localStorage.getItem('hrm24_advances');
        expect(stored).toBeTruthy();
    });
});
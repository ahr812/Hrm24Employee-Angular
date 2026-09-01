import { TestBed } from '@angular/core/testing';
import { AttendanceService, DailyAttendance } from './attendance.service';

describe('AttendanceService', () => {
    let service: AttendanceService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(AttendanceService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have default records', () => {
        const records = service.records();
        expect(records.length).toBeGreaterThan(0);
    });

    it('should return correct status labels', () => {
        expect(service.getStatusLabel('present')).toBe('حاضر');
        expect(service.getStatusLabel('absent')).toBe('غایب');
        expect(service.getStatusLabel('late')).toBe('تأخیر');
        expect(service.getStatusLabel('early-leave')).toBe('تعجیل');
        expect(service.getStatusLabel('holiday')).toBe('تعطیل');
        expect(service.getStatusLabel('leave')).toBe('مرخصی');
        expect(service.getStatusLabel('mission')).toBe('مأموریت');
        expect(service.getStatusLabel('remote')).toBe('دورکاری');
    });

    it('should return correct method labels', () => {
        expect(service.getMethodLabel('web')).toBe('وب');
        expect(service.getMethodLabel('fingerprint')).toBe('اثر انگشت');
        expect(service.getMethodLabel('gps')).toBe('GPS');
        expect(service.getMethodLabel('card')).toBe('کارت');
    });

    it('should format minutes correctly', () => {
        expect(service.formatMinutes(0)).toBe('0 دقیقه');
        expect(service.formatMinutes(30)).toBe('30 دقیقه');
        expect(service.formatMinutes(60)).toBe('1 ساعت');
        expect(service.formatMinutes(90)).toBe('1 ساعت و 30 دقیقه');
        expect(service.formatMinutes(150)).toBe('2 ساعت و 30 دقیقه');
    });

    it('should check in successfully', () => {
        // Clear existing today record
        const today = new Date().toLocaleDateString('fa-IR');
        service.records.update(recs => recs.filter(r => r.date !== today));

        const result = service.checkIn('web');
        expect(result.success).toBeTrue();
        expect(result.message).toContain('ورود');

        const todayRecord = service.todayRecord();
        expect(todayRecord).toBeTruthy();
        expect(todayRecord?.checkInTime).toBeTruthy();
        expect(todayRecord?.checkInMethod).toBe('web');
    });

    it('should prevent double check in', () => {
        const today = new Date().toLocaleDateString('fa-IR');
        service.records.update(recs => recs.filter(r => r.date !== today));

        service.checkIn('web');
        const result = service.checkIn('web');
        expect(result.success).toBeFalse();
        expect(result.message).toContain('قبلاً');
    });

    it('should check out successfully after check in', () => {
        const today = new Date().toLocaleDateString('fa-IR');
        service.records.update(recs => recs.filter(r => r.date !== today));

        service.checkIn('web');
        const result = service.checkOut('web');
        expect(result.success).toBeTrue();
        expect(result.message).toContain('خروج');

        const todayRecord = service.todayRecord();
        expect(todayRecord?.checkOutTime).toBeTruthy();
        expect(todayRecord?.workHours).toBeGreaterThanOrEqual(0);
    });

    it('should fail check out without check in', () => {
        const today = new Date().toLocaleDateString('fa-IR');
        service.records.update(recs => recs.filter(r => r.date !== today));

        const result = service.checkOut('web');
        expect(result.success).toBeFalse();
        expect(result.message).toContain('ورود');
    });

    it('should calculate monthly summary correctly', () => {
        const summary = service.currentMonthSummary();
        expect(summary).toBeTruthy();
        expect(summary.totalWorkingDays).toBeGreaterThanOrEqual(0);
        expect(summary.attendanceRate).toBeGreaterThanOrEqual(0);
        expect(summary.attendanceRate).toBeLessThanOrEqual(100);
        expect(summary.totalWorkHours).toBeGreaterThanOrEqual(0);
    });

    it('should calculate weekly stats correctly', () => {
        const weekly = service.weeklyStats();
        expect(weekly).toBeTruthy();
        expect(weekly.rate).toBeGreaterThanOrEqual(0);
        expect(weekly.rate).toBeLessThanOrEqual(100);
        expect(weekly.totalHours).toBeGreaterThanOrEqual(0);
    });

    it('should update rules', () => {
        service.updateRules({ workStartTime: '09:00', lateThresholdMinutes: 20 });
        const rules = service.rules();
        expect(rules.workStartTime).toBe('09:00');
        expect(rules.lateThresholdMinutes).toBe(20);
    });

    it('should persist data to localStorage', () => {
        const today = new Date().toLocaleDateString('fa-IR');
        service.records.update(recs => recs.filter(r => r.date !== today));

        service.checkIn('web');
        const stored = localStorage.getItem('hrm24_attendance_v2');
        expect(stored).toBeTruthy();
        expect(JSON.parse(stored!).length).toBeGreaterThan(0);
    });

    it('should return correct status badge classes', () => {
        expect(service.getStatusBadgeClass('present')).toContain('success');
        expect(service.getStatusBadgeClass('absent')).toContain('danger');
        expect(service.getStatusBadgeClass('late')).toContain('warning');
        expect(service.getStatusBadgeClass('holiday')).toContain('muted');
    });
});
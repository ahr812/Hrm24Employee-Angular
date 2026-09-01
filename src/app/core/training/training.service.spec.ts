import { TestBed } from '@angular/core/testing';
import { TrainingService } from './training.service';

describe('TrainingService', () => {
    let service: TrainingService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(TrainingService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have default courses', () => {
        const courses = service.courses();
        expect(courses.length).toBeGreaterThan(0);
        expect(courses[0].title).toBeTruthy();
        expect(courses[0].code).toBeTruthy();
    });

    it('should have default enrollments', () => {
        const enrollments = service.enrollments();
        expect(enrollments.length).toBeGreaterThan(0);
    });

    it('should have default certificates', () => {
        const certs = service.certificates();
        expect(certs.length).toBeGreaterThan(0);
        expect(certs[0].verificationCode).toBeTruthy();
    });

    it('should return correct category labels', () => {
        expect(service.getCategoryLabel('technical')).toBe('فنی و تخصصی');
        expect(service.getCategoryLabel('soft-skills')).toBe('مهارت‌های نرم');
        expect(service.getCategoryLabel('management')).toBe('مدیریتی');
        expect(service.getCategoryLabel('compliance')).toBe('انطباق و مقررات');
        expect(service.getCategoryLabel('language')).toBe('زبان');
    });

    it('should return correct level labels', () => {
        expect(service.getLevelLabel('beginner')).toBe('مقدماتی');
        expect(service.getLevelLabel('intermediate')).toBe('متوسط');
        expect(service.getLevelLabel('advanced')).toBe('پیشرفته');
        expect(service.getLevelLabel('expert')).toBe('تخصصی');
    });

    it('should return correct format labels', () => {
        expect(service.getFormatLabel('online-live')).toBe('آنلاین زنده');
        expect(service.getFormatLabel('in-person')).toBe('حضوری');
        expect(service.getFormatLabel('hybrid')).toBe('ترکیبی');
        expect(service.getFormatLabel('workshop')).toBe('کارگاه');
    });

    it('should return correct status labels', () => {
        expect(service.getStatusLabel('registered')).toBe('ثبت‌نام شده');
        expect(service.getStatusLabel('in-progress')).toBe('در حال گذراندن');
        expect(service.getStatusLabel('completed')).toBe('تکمیل شده');
        expect(service.getStatusLabel('certified')).toBe('گواهینامه صادر شده');
        expect(service.getStatusLabel('failed')).toBe('مردود');
    });

    it('should register for a course', () => {
        const courseId = service.courses()[0].id;
        const beforeCount = service.enrollments().length;
        service.register(courseId, 'emp-test', 'تست کاربر', 'IT');
        expect(service.enrollments().length).toBe(beforeCount + 1);
    });

    it('should prevent duplicate registration', () => {
        const courseId = service.courses()[0].id;
        service.register(courseId, 'emp-dup', 'تست تکراری', 'IT');
        const countAfterFirst = service.enrollments().length;
        service.register(courseId, 'emp-dup', 'تست تکراری', 'IT');
        expect(service.enrollments().length).toBe(countAfterFirst);
    });

    it('should start a course', () => {
        const enrollment = service.enrollments().find(e => e.status === 'approved' || e.status === 'registered');
        if (enrollment) {
            service.startCourse(enrollment.id);
            const updated = service.enrollments().find(e => e.id === enrollment.id);
            expect(updated?.status).toBe('in-progress');
            expect(updated?.startedAt).toBeTruthy();
        }
    });

    it('should complete a module and update progress', () => {
        const enrollment = service.enrollments().find(e => e.status === 'in-progress');
        if (enrollment) {
            const course = service.courses().find(c => c.id === enrollment.courseId);
            if (course && course.modules.length > 0) {
                const moduleId = course.modules.find(m => !enrollment.completedModules.includes(m.id))?.id;
                if (moduleId) {
                    const progressBefore = enrollment.progress;
                    service.completeModule(enrollment.id, moduleId, 60);
                    const updated = service.enrollments().find(e => e.id === enrollment.id);
                    expect(updated!.progress).toBeGreaterThan(progressBefore);
                    expect(updated!.completedModules).toContain(moduleId);
                }
            }
        }
    });

    it('should calculate stats correctly', () => {
        const stats = service.stats();
        expect(stats.totalCourses).toBeGreaterThan(0);
        expect(stats.totalEnrollments).toBeGreaterThanOrEqual(0);
        expect(stats.examPassRate).toBeGreaterThanOrEqual(0);
        expect(stats.examPassRate).toBeLessThanOrEqual(100);
    });

    it('should filter my enrollments', () => {
        const myEnrollments = service.myEnrollments();
        myEnrollments.forEach(e => {
            expect(e.employeeId).toBe('emp-current');
        });
    });

    it('should filter available courses excluding enrolled ones', () => {
        const available = service.availableCourses();
        const enrolledIds = new Set(service.myEnrollments().map(e => e.courseId));
        available.forEach(c => {
            expect(enrolledIds.has(c.id)).toBeFalse();
        });
    });

    it('should persist data to localStorage after modification', () => {
        service.register(service.courses()[0].id, 'emp-persist', 'تست', 'IT');
        const stored = localStorage.getItem('hrm24_enrollments_v2');
        expect(stored).toBeTruthy();
    });
});
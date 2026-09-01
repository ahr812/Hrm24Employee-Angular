import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export type CourseCategory = 'technical' | 'soft-skills' | 'management' | 'compliance' | 'language' | 'safety' | 'hr' | 'other';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type CourseFormat = 'online-live' | 'online-recorded' | 'in-person' | 'hybrid' | 'workshop' | 'seminar';
export type EnrollmentStatus = 'registered' | 'approved' | 'rejected' | 'in-progress' | 'exam-pending' | 'completed' | 'failed' | 'certified' | 'expired' | 'dropped';
export type ExamType = 'multiple-choice' | 'descriptive' | 'practical' | 'oral' | 'project' | 'mixed';
export type CertificateType = 'attendance' | 'completion' | 'competency' | 'professional' | 'renewal';
export type LearningPathStatus = 'not-started' | 'active' | 'completed' | 'paused';

export interface CoursePrerequisite { courseId: string; courseTitle: string; minScore: number; }
export interface CourseModule { id: string; title: string; durationMinutes: number; order: number; completed: boolean; }
export interface ExamQuestion { id: string; text: string; type: 'single-choice' | 'multi-choice' | 'true-false' | 'descriptive'; options?: string[]; correctAnswer?: string | string[]; points: number; }
export interface Exam { id: string; courseId: string; title: string; type: ExamType; durationMinutes: number; passingScore: number; maxAttempts: number; questions: ExamQuestion[]; allowReview: boolean; showResultImmediately: boolean; }
export interface ExamAttempt { id: string; examId: string; enrollmentId: string; attemptNumber: number; startedAt: string; submittedAt: string | null; answers: { questionId: string; answer: string | string[] }[]; score: number | null; passed: boolean | null; gradedBy: string | null; gradedAt: string | null; feedback: string; }

export interface Course {
    id: string; code: string; title: string; description: string; category: CourseCategory; level: CourseLevel; format: CourseFormat;
    instructor: string; department: string; durationHours: number; creditPoints: number; maxParticipants: number; currentParticipants: number;
    startDate: string; endDate: string; registrationDeadline: string; location: string; prerequisites: CoursePrerequisite[];
    objectives: string[]; modules: CourseModule[]; exam: Exam | null; certificateType: CertificateType;
    certificateValidityMonths: number | null; cost: number; isMandatory: boolean; tags: string[]; createdAt: string; orgId: string;
}

export interface Enrollment {
    id: string; courseId: string; courseTitle: string; courseCode: string; employeeId: string; employeeName: string; department: string;
    status: EnrollmentStatus; registeredAt: string; approvedAt: string | null; approvedBy: string | null; startedAt: string | null;
    completedAt: string | null; progress: number; completedModules: string[]; totalStudyHours: number; examAttempts: ExamAttempt[];
    finalScore: number | null; passCount: number; failCount: number; certificateId: string | null; certificateIssuedAt: string | null;
    certificateExpiresAt: string | null; feedback: string; managerComment: string; orgId: string;
}

export interface Certificate {
    id: string; enrollmentId: string; employeeId: string; employeeName: string; courseTitle: string; courseCode: string;
    type: CertificateType; issuedAt: string; expiresAt: string | null; verificationCode: string; issuer: string; score: number; grade: string; orgId: string;
}

export interface LearningPath {
    id: string; title: string; description: string; targetRole: string; courseIds: string[]; requiredCredits: number;
    earnedCredits: number; status: LearningPathStatus; startedAt: string | null; completedAt: string | null; orgId: string;
}

export interface PathEnrollment {
    id: string; pathId: string; employeeId: string; enrolledAt: string; orgId: string;
}

@Injectable({ providedIn: 'root' })
export class TrainingService {
    private readonly COURSES_KEY = 'hrm24_courses_v3';
    private readonly ENROLLMENTS_KEY = 'hrm24_enrollments_v3';
    private readonly CERTIFICATES_KEY = 'hrm24_certificates_v3';
    private readonly PATHS_KEY = 'hrm24_learning_paths_v3';
    private readonly PATH_ENROLLMENTS_KEY = 'hrm24_path_enrollments_v3';
    private orgService = inject(OrganizationService);

    courses = signal<Course[]>(this.loadCourses());
    enrollments = signal<Enrollment[]>(this.loadEnrollments());
    certificates = signal<Certificate[]>(this.loadCertificates());
    learningPaths = signal<LearningPath[]>(this.loadLearningPaths());
    pathEnrollments = signal<PathEnrollment[]>(this.loadPathEnrollments());

    stats = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const all = this.enrollments().filter(e => e.orgId === orgId);
        const completed = all.filter(e => e.status === 'completed' || e.status === 'certified');
        const active = all.filter(e => e.status === 'in-progress' || e.status === 'exam-pending');
        const orgCourses = this.courses().filter(c => c.orgId === orgId);
        const orgCerts = this.certificates().filter(c => c.orgId === orgId);
        return {
            totalCourses: orgCourses.length, mandatoryCourses: orgCourses.filter(c => c.isMandatory).length,
            totalEnrollments: all.length, activeEnrollments: active.length, completedEnrollments: completed.length,
            certifiedEnrollments: all.filter(e => e.status === 'certified').length,
            failedEnrollments: all.filter(e => e.status === 'failed').length,
            pendingApproval: all.filter(e => e.status === 'registered').length,
            totalCertificates: orgCerts.length,
            expiredCertificates: orgCerts.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length,
            avgProgress: active.length > 0 ? Math.round(active.reduce((s, e) => s + e.progress, 0) / active.length) : 0,
            totalHoursCompleted: completed.reduce((s, e) => s + e.totalStudyHours, 0),
            totalCreditsEarned: completed.reduce((s, e) => { const c = orgCourses.find(x => x.id === e.courseId); return s + (c ? c.creditPoints : 0); }, 0),
            examPassRate: all.filter(e => e.examAttempts.length > 0).length > 0 ? Math.round(all.filter(e => e.passCount > 0).length / all.filter(e => e.examAttempts.length > 0).length * 100) : 0
        };
    });

    myEnrollments = computed(() => this.enrollments().filter(e => e.employeeId === 'emp-current' && e.orgId === this.orgService.activeOrg().id));
    availableCourses = computed(() => { const orgId = this.orgService.activeOrg().id; const enrolled = new Set(this.myEnrollments().map(e => e.courseId)); return this.courses().filter(c => c.orgId === orgId && !enrolled.has(c.id)); });
    myLearningPaths = computed(() => this.learningPaths().filter(p => p.orgId === this.orgService.activeOrg().id));
    myPathEnrollments = computed(() => this.pathEnrollments().filter(pe => pe.employeeId === 'emp-current' && pe.orgId === this.orgService.activeOrg().id));

    calculatePathProgress(pathId: string): { earnedCredits: number; completedCourses: number; totalCourses: number; courseStatuses: { courseId: string; status: string }[] } {
        const path = this.learningPaths().find(p => p.id === pathId);
        if (!path) return { earnedCredits: 0, completedCourses: 0, totalCourses: 0, courseStatuses: [] };
        const myEnr = this.myEnrollments();
        let earned = 0, completedCount = 0;
        const statuses = path.courseIds.map(cid => {
            const enr = myEnr.find(e => e.courseId === cid);
            const course = this.courses().find(c => c.id === cid);
            if (!enr) return { courseId: cid, status: 'not-enrolled' };
            if (enr.status === 'certified' || enr.status === 'completed') { earned += course?.creditPoints || 0; completedCount++; return { courseId: cid, status: 'completed' }; }
            if (enr.status === 'in-progress' || enr.status === 'exam-pending') return { courseId: cid, status: 'in-progress' };
            return { courseId: cid, status: enr.status };
        });
        return { earnedCredits: earned, completedCourses: completedCount, totalCourses: path.courseIds.length, courseStatuses: statuses };
    }

    isEnrolledInPath(pathId: string): boolean { return this.myPathEnrollments().some(pe => pe.pathId === pathId); }
    registerPath(pathId: string): void { if (this.isEnrolledInPath(pathId)) return; const pe: PathEnrollment = { id: `pe-${Date.now()}`, pathId, employeeId: 'emp-current', enrolledAt: new Date().toLocaleDateString('fa-IR'), orgId: this.orgService.activeOrg().id }; this.pathEnrollments.update(list => [...list, pe]); this.savePathEnrollments(); }
    unregisterPath(pathId: string): void { this.pathEnrollments.update(list => list.filter(pe => !(pe.pathId === pathId && pe.employeeId === 'emp-current'))); this.savePathEnrollments(); }

    addCourse(course: Omit<Course, 'id' | 'createdAt' | 'orgId'>): void { this.courses.update(c => [...c, { ...course, id: `course-${Date.now()}`, createdAt: new Date().toLocaleDateString('fa-IR'), orgId: this.orgService.activeOrg().id }]); this.saveCourses(); }
    updateCourse(id: string, updates: Partial<Course>): void { this.courses.update(c => c.map(x => x.id === id ? { ...x, ...updates } : x)); this.saveCourses(); }
    deleteCourse(id: string): void { this.courses.update(c => c.filter(x => x.id !== id)); this.enrollments.update(e => e.filter(x => x.courseId !== id)); this.saveCourses(); this.saveEnrollments(); }
    getCourseById(id: string): Course | undefined { return this.courses().find(c => c.id === id); }

    register(courseId: string, employeeId: string, employeeName: string, department: string): void {
        const course = this.courses().find(c => c.id === courseId); if (!course) return;
        if (this.enrollments().find(e => e.courseId === courseId && e.employeeId === employeeId)) return;
        const autoApprove = course.format === 'online-recorded' || course.format === 'online-live';
        const enrollment: Enrollment = { id: `enr-${Date.now()}`, courseId, courseTitle: course.title, courseCode: course.code, employeeId, employeeName, department, status: autoApprove ? 'approved' : 'registered', registeredAt: new Date().toLocaleDateString('fa-IR'), approvedAt: autoApprove ? new Date().toLocaleDateString('fa-IR') : null, approvedBy: autoApprove ? 'سیستم خودکار' : null, startedAt: null, completedAt: null, progress: 0, completedModules: [], totalStudyHours: 0, examAttempts: [], finalScore: null, passCount: 0, failCount: 0, certificateId: null, certificateIssuedAt: null, certificateExpiresAt: null, feedback: '', managerComment: '', orgId: this.orgService.activeOrg().id };
        this.enrollments.update(e => [enrollment, ...e]); this.courses.update(c => c.map(x => x.id === courseId ? { ...x, currentParticipants: x.currentParticipants + 1 } : x)); this.saveEnrollments(); this.saveCourses();
    }
    startCourse(id: string): void { this.enrollments.update(e => e.map(x => x.id === id ? { ...x, status: 'in-progress' as EnrollmentStatus, startedAt: new Date().toLocaleDateString('fa-IR') } : x)); this.saveEnrollments(); }
    completeModule(enrollmentId: string, moduleId: string, studyMinutes: number): void {
        this.enrollments.update(e => e.map(x => { if (x.id !== enrollmentId || x.completedModules.includes(moduleId)) return x; const course = this.courses().find(c => c.id === x.courseId); const updated = [...x.completedModules, moduleId]; const total = course?.modules.length || 1; const progress = Math.round((updated.length / total) * 100); const hours = x.totalStudyHours + (studyMinutes / 60); const allDone = updated.length >= total; let status = x.status; if (allDone && course?.exam) status = 'exam-pending'; else if (allDone && !course?.exam) status = 'completed'; return { ...x, completedModules: updated, progress, totalStudyHours: hours, status: status as EnrollmentStatus }; })); this.saveEnrollments();
    }
    canTakeExam(enrollmentId: string): boolean { const e = this.enrollments().find(x => x.id === enrollmentId); if (!e) return false; const c = this.courses().find(x => x.id === e.courseId); if (!c?.exam) return false; return e.completedModules.length >= c.modules.length && e.examAttempts.length < c.exam.maxAttempts && e.status !== 'certified' && e.status !== 'failed'; }
    submitExamAttempt(enrollmentId: string, answers: { questionId: string; answer: string | string[] }[]): { score: number; passed: boolean; maxScore: number } {
        const enrollment = this.enrollments().find(e => e.id === enrollmentId); if (!enrollment) return { score: 0, passed: false, maxScore: 0 };
        const course = this.courses().find(c => c.id === enrollment.courseId); if (!course?.exam) return { score: 0, passed: false, maxScore: 0 };
        let earned = 0, max = 0;
        for (const q of course.exam.questions) { max += q.points; if (q.type === 'descriptive') continue; const ua = answers.find(a => a.questionId === q.id); if (!ua) continue; if ((q.type === 'single-choice' || q.type === 'true-false') && String(ua.answer) === String(q.correctAnswer)) earned += q.points; else if (q.type === 'multi-choice' && Array.isArray(q.correctAnswer) && Array.isArray(ua.answer) && q.correctAnswer.sort().join('|') === (ua.answer as string[]).sort().join('|')) earned += q.points; }
        const scorePercent = max > 0 ? Math.round((earned / max) * 100) : 0; const passed = scorePercent >= course.exam.passingScore; const attemptNum = enrollment.examAttempts.length + 1;
        const newAttempt: ExamAttempt = { id: `att-${Date.now()}`, examId: course.exam.id, enrollmentId, attemptNumber: attemptNum, startedAt: new Date().toISOString(), submittedAt: new Date().toISOString(), answers, score: scorePercent, passed, gradedBy: 'سیستم', gradedAt: new Date().toISOString(), feedback: '' };
        this.enrollments.update(e => e.map(x => { if (x.id !== enrollmentId) return x; const atts = [...x.examAttempts, newAttempt]; const pc = atts.filter(a => a.passed === true).length; const fc = atts.filter(a => a.passed === false).length; let st: EnrollmentStatus = x.status; if (passed) st = 'completed'; else if (attemptNum >= course.exam!.maxAttempts) st = 'failed'; else st = 'exam-pending'; return { ...x, examAttempts: atts, passCount: pc, failCount: fc, finalScore: scorePercent, status: st, completedAt: passed ? new Date().toLocaleDateString('fa-IR') : x.completedAt }; }));
        if (passed) this.issueCertificate(enrollmentId);
        this.saveEnrollments(); return { score: scorePercent, passed, maxScore: max };
    }
    issueCertificate(enrollmentId: string): void {
        const e = this.enrollments().find(x => x.id === enrollmentId); if (!e || e.certificateId) return; const c = this.courses().find(x => x.id === e.courseId); if (!c) return;
        const cert: Certificate = { id: `cert-${Date.now()}`, enrollmentId, employeeId: e.employeeId, employeeName: e.employeeName, courseTitle: c.title, courseCode: c.code, type: c.certificateType, issuedAt: new Date().toLocaleDateString('fa-IR'), expiresAt: c.certificateValidityMonths ? new Date(Date.now() + c.certificateValidityMonths * 30 * 86400000).toLocaleDateString('fa-IR') : null, verificationCode: `VR-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, issuer: 'واحد آموزش HRM24', score: e.finalScore || 0, grade: (e.finalScore || 0) >= 90 ? 'عالی' : (e.finalScore || 0) >= 80 ? 'خیلی خوب' : (e.finalScore || 0) >= 70 ? 'خوب' : 'قابل قبول', orgId: this.orgService.activeOrg().id };
        this.certificates.update(list => [cert, ...list]); this.enrollments.update(list => list.map(x => x.id === enrollmentId ? { ...x, status: 'certified' as EnrollmentStatus, certificateId: cert.id, certificateIssuedAt: cert.issuedAt, certificateExpiresAt: cert.expiresAt } : x)); this.saveCertificates(); this.saveEnrollments();
    }

    // ── انصراف = حذف کامل + کاهش ظرفیت ──
    dropEnrollment(id: string): void {
        const enrollment = this.enrollments().find(e => e.id === id);
        if (!enrollment) return;
        // حذف enrollment
        this.enrollments.update(e => e.filter(x => x.id !== id));
        // کاهش currentParticipants
        this.courses.update(c => c.map(x => x.id === enrollment.courseId ? { ...x, currentParticipants: Math.max(0, x.currentParticipants - 1) } : x));
        this.saveEnrollments();
        this.saveCourses();
    }

    addLearningPath(path: Omit<LearningPath, 'id' | 'orgId' | 'earnedCredits' | 'status' | 'startedAt' | 'completedAt'>): void { this.learningPaths.update(p => [...p, { ...path, id: `path-${Date.now()}`, earnedCredits: 0, status: 'not-started', startedAt: null, completedAt: null, orgId: this.orgService.activeOrg().id }]); this.saveLearningPaths(); }
    updateLearningPath(id: string, updates: Partial<LearningPath>): void { this.learningPaths.update(p => p.map(x => x.id === id ? { ...x, ...updates } : x)); this.saveLearningPaths(); }
    deleteLearningPath(id: string): void { this.learningPaths.update(p => p.filter(x => x.id !== id)); this.pathEnrollments.update(pe => pe.filter(x => x.pathId !== id)); this.saveLearningPaths(); this.savePathEnrollments(); }

    getCategoryLabel(c: CourseCategory): string { return { technical: 'فنی', 'soft-skills': 'مهارت نرم', management: 'مدیریتی', compliance: 'انطباق', language: 'زبان', safety: 'ایمنی', hr: 'HR', other: 'سایر' }[c]; }
    getLevelLabel(l: CourseLevel): string { return { beginner: 'مقدماتی', intermediate: 'متوسط', advanced: 'پیشرفته', expert: 'تخصصی' }[l]; }
    getFormatLabel(f: CourseFormat): string { return { 'online-live': 'آنلاین زنده', 'online-recorded': 'ضبط شده', 'in-person': 'حضوری', hybrid: 'ترکیبی', workshop: 'کارگاه', seminar: 'سمینار' }[f]; }
    getStatusLabel(s: EnrollmentStatus): string { return { registered: 'ثبت‌نام', approved: 'تأیید', rejected: 'رد', 'in-progress': 'در حال گذراندن', 'exam-pending': 'آماده آزمون', completed: 'تکمیل', failed: 'مردود', certified: 'گواهینامه صادر شده', expired: 'منقضی', dropped: 'انصراف' }[s]; }
    getCertTypeLabel(t: CertificateType): string { return { attendance: 'حضور', completion: 'تکمیل', competency: 'شایستگی', professional: 'حرفه‌ای', renewal: 'تمدید' }[t]; }
    getStatusBadgeClass(s: EnrollmentStatus): string { return { registered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', approved: 'bg-primary/10 text-primary', rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', 'in-progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', 'exam-pending': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', certified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', expired: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400', dropped: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' }[s]; }
    getCategoryBadgeClass(c: CourseCategory): string { return { technical: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 'soft-skills': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', management: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', compliance: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', language: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', safety: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', hr: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', other: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' }[c]; }
    getLevelBadgeClass(l: CourseLevel): string { return { beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', expert: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }[l]; }

    private loadCourses(): Course[] { if (typeof localStorage === 'undefined') return this.getDefaultCourses(); try { const s = localStorage.getItem(this.COURSES_KEY); return s ? JSON.parse(s) : this.getDefaultCourses(); } catch { return this.getDefaultCourses(); } }
    private loadEnrollments(): Enrollment[] { if (typeof localStorage === 'undefined') return this.getDefaultEnrollments(); try { const s = localStorage.getItem(this.ENROLLMENTS_KEY); return s ? JSON.parse(s) : this.getDefaultEnrollments(); } catch { return this.getDefaultEnrollments(); } }
    private loadCertificates(): Certificate[] { if (typeof localStorage === 'undefined') return this.getDefaultCertificates(); try { const s = localStorage.getItem(this.CERTIFICATES_KEY); return s ? JSON.parse(s) : this.getDefaultCertificates(); } catch { return this.getDefaultCertificates(); } }
    private loadLearningPaths(): LearningPath[] { if (typeof localStorage === 'undefined') return this.getDefaultLearningPaths(); try { const s = localStorage.getItem(this.PATHS_KEY); return s ? JSON.parse(s) : this.getDefaultLearningPaths(); } catch { return this.getDefaultLearningPaths(); } }
    private loadPathEnrollments(): PathEnrollment[] { if (typeof localStorage === 'undefined') return []; try { const s = localStorage.getItem(this.PATH_ENROLLMENTS_KEY); return s ? JSON.parse(s) : []; } catch { return []; } }
    private saveCourses(): void { if (typeof localStorage !== 'undefined') try { localStorage.setItem(this.COURSES_KEY, JSON.stringify(this.courses())); } catch { } }
    private saveEnrollments(): void { if (typeof localStorage !== 'undefined') try { localStorage.setItem(this.ENROLLMENTS_KEY, JSON.stringify(this.enrollments())); } catch { } }
    private saveCertificates(): void { if (typeof localStorage !== 'undefined') try { localStorage.setItem(this.CERTIFICATES_KEY, JSON.stringify(this.certificates())); } catch { } }
    private saveLearningPaths(): void { if (typeof localStorage !== 'undefined') try { localStorage.setItem(this.PATHS_KEY, JSON.stringify(this.learningPaths())); } catch { } }
    private savePathEnrollments(): void { if (typeof localStorage !== 'undefined') try { localStorage.setItem(this.PATH_ENROLLMENTS_KEY, JSON.stringify(this.pathEnrollments())); } catch { } }

    private getDefaultCourses(): Course[] {
        return [
            { id: 'course-1', code: 'IT-ANG-ADV-01', title: 'Angular پیشرفته و Signals', description: 'آموزش مفاهیم پیشرفته Angular 17+ شامل Signals، SSR و Performance', category: 'technical', level: 'advanced', format: 'online-live', instructor: 'مهندس رضایی', department: 'فناوری اطلاعات', durationHours: 24, creditPoints: 3, maxParticipants: 20, currentParticipants: 15, startDate: '1405/05/01', endDate: '1405/06/15', registrationDeadline: '1405/12/30', location: 'آنلاین', prerequisites: [], objectives: ['تسلط بر Signals', 'SSR', 'Performance'], modules: [{ id: 'mod-1-1', title: 'مرور پایه Angular', durationMinutes: 120, order: 1, completed: false }, { id: 'mod-1-2', title: 'Signals و Reactive State', durationMinutes: 180, order: 2, completed: false }, { id: 'mod-1-3', title: 'Server-Side Rendering', durationMinutes: 180, order: 3, completed: false }, { id: 'mod-1-4', title: 'Deferrable Views', durationMinutes: 120, order: 4, completed: false }, { id: 'mod-1-5', title: 'Performance Optimization', durationMinutes: 180, order: 5, completed: false }, { id: 'mod-1-6', title: 'پروژه نهایی', durationMinutes: 240, order: 6, completed: false }], exam: { id: 'exam-1', courseId: 'course-1', title: 'آزمون Angular پیشرفته', type: 'mixed', durationMinutes: 90, passingScore: 70, maxAttempts: 3, allowReview: true, showResultImmediately: true, questions: [{ id: 'q1', text: 'کدام درباره Signals صحیح است؟', type: 'single-choice', options: ['فقط خواندن', 'Primitive reactive', 'جایگزین RxJS', 'فقط کامپوننت'], correctAnswer: 'Primitive reactive', points: 10 }, { id: 'q2', text: 'مزایای SSR؟', type: 'multi-choice', options: ['بهبود SEO', 'بارگذاری سریع‌تر', 'حذف سرور', 'UX بهتر'], correctAnswer: ['بهبود SEO', 'بارگذاری سریع‌تر', 'UX بهتر'], points: 15 }, { id: 'q3', text: 'Signals جایگزین کامل RxJS هستند؟', type: 'true-false', options: ['صحیح', 'غلط'], correctAnswer: 'غلط', points: 10 }, { id: 'q4', text: 'دکوراتور lazy loading؟', type: 'single-choice', options: ['@defer', '@lazy', '@delay', '@suspend'], correctAnswer: '@defer', points: 10 }, { id: 'q5', text: 'تفاوت computed و effect را توضیح دهید.', type: 'descriptive', points: 20 }] }, certificateType: 'professional', certificateValidityMonths: 24, cost: 0, isMandatory: false, tags: ['Angular', 'Frontend'], createdAt: '1405/03/01', orgId: 'org1' },
            { id: 'course-2', code: 'HR-SFT-001', title: 'مدیریت زمان و بهره‌وری', description: 'تکنیک‌های Pomodoro، ماتریس آیزنهاور و برنامه‌ریزی مؤثر', category: 'soft-skills', level: 'beginner', format: 'workshop', instructor: 'دکتر محمدی', department: 'منابع انسانی', durationHours: 8, creditPoints: 1, maxParticipants: 30, currentParticipants: 22, startDate: '1405/06/01', endDate: '1405/06/05', registrationDeadline: '1405/12/30', location: 'سالن کنفرانس', prerequisites: [], objectives: ['Pomodoro', 'آیزنهاور', 'برنامه‌ریزی'], modules: [{ id: 'mod-2-1', title: 'اتلاف‌کنندگان زمان', durationMinutes: 90, order: 1, completed: false }, { id: 'mod-2-2', title: 'Pomodoro و Time Blocking', durationMinutes: 120, order: 2, completed: false }, { id: 'mod-2-3', title: 'ماتریس آیزنهاور', durationMinutes: 120, order: 3, completed: false }, { id: 'mod-2-4', title: 'کارگاه عملی', durationMinutes: 150, order: 4, completed: false }], exam: { id: 'exam-2', courseId: 'course-2', title: 'آزمون مدیریت زمان', type: 'multiple-choice', durationMinutes: 30, passingScore: 60, maxAttempts: 2, allowReview: true, showResultImmediately: true, questions: [{ id: 'q6', text: 'کارهای فوری و مهم در کدام ربع؟', type: 'single-choice', options: ['ربع اول', 'ربع دوم', 'ربع سوم', 'ربع چهارم'], correctAnswer: 'ربع اول', points: 10 }, { id: 'q7', text: 'مدت استاندارد Pomodoro؟', type: 'single-choice', options: ['۱۵ دقیقه', '۲۵ دقیقه', '۴۵ دقیقه', '۶۰ دقیقه'], correctAnswer: '۲۵ دقیقه', points: 10 }, { id: 'q8', text: 'Time Blocking یعنی؟', type: 'single-choice', options: ['مسدود کردن زمان', 'بلوک وبسایت', 'تنظیم آلارم', 'لیست کارها'], correctAnswer: 'مسدود کردن زمان', points: 10 }] }, certificateType: 'completion', certificateValidityMonths: null, cost: 0, isMandatory: true, tags: ['بهره‌وری'], createdAt: '1405/03/15', orgId: 'org1' },
            { id: 'course-3', code: 'MG-AGL-001', title: 'رهبری تیم‌های چابک', description: 'اصول Scrum، نقش Scrum Master و مدیریت Sprint', category: 'management', level: 'intermediate', format: 'hybrid', instructor: 'خانم کریمی', department: 'مدیریت پروژه', durationHours: 16, creditPoints: 2, maxParticipants: 15, currentParticipants: 10, startDate: '1405/07/01', endDate: '1405/07/20', registrationDeadline: '1405/12/30', location: 'ترکیبی', prerequisites: [], objectives: ['Scrum', 'Daily Standup', 'Retrospective'], modules: [{ id: 'mod-3-1', title: 'مبانی Agile', durationMinutes: 180, order: 1, completed: false }, { id: 'mod-3-2', title: 'نقش‌ها', durationMinutes: 120, order: 2, completed: false }, { id: 'mod-3-3', title: 'Sprint و Backlog', durationMinutes: 180, order: 3, completed: false }, { id: 'mod-3-4', title: 'جلسات Scrum', durationMinutes: 180, order: 4, completed: false }, { id: 'mod-3-5', title: 'شبیه‌سازی Sprint', durationMinutes: 240, order: 5, completed: false }], exam: { id: 'exam-3', courseId: 'course-3', title: 'آزمون Scrum Master', type: 'mixed', durationMinutes: 60, passingScore: 75, maxAttempts: 2, allowReview: false, showResultImmediately: false, questions: [{ id: 'q9', text: 'کدام جزو مراسم Scrum نیست؟', type: 'single-choice', options: ['Daily Standup', 'Sprint Review', 'Weekly Meeting', 'Retrospective'], correctAnswer: 'Weekly Meeting', points: 10 }, { id: 'q10', text: 'Sprint معمولاً چند هفته؟', type: 'single-choice', options: ['۱-۴ هفته', '۱-۲ ماه', '۳-۶ ماه', '۱ روز'], correctAnswer: '۱-۴ هفته', points: 10 }, { id: 'q11', text: 'سه رکن اصلی Scrum؟', type: 'descriptive', points: 20 }] }, certificateType: 'competency', certificateValidityMonths: 36, cost: 0, isMandatory: false, tags: ['Agile', 'Scrum'], createdAt: '1405/04/01', orgId: 'org1' },
            { id: 'course-4', code: 'CMP-SEC-001', title: 'امنیت اطلاعات', description: 'الزامات امنیتی، رمزنگاری و مدیریت حوادث', category: 'compliance', level: 'beginner', format: 'online-recorded', instructor: 'مهندس حسینی', department: 'امنیت', durationHours: 4, creditPoints: 1, maxParticipants: 100, currentParticipants: 78, startDate: '1405/04/15', endDate: '1405/04/20', registrationDeadline: '1405/12/30', location: 'آنلاین', prerequisites: [], objectives: ['تهدیدات', 'رمزعبور', 'حوادث'], modules: [{ id: 'mod-4-1', title: 'مقدمه امنیت', durationMinutes: 60, order: 1, completed: false }, { id: 'mod-4-2', title: 'تهدیدات', durationMinutes: 90, order: 2, completed: false }, { id: 'mod-4-3', title: 'رمزنگاری', durationMinutes: 60, order: 3, completed: false }, { id: 'mod-4-4', title: 'مدیریت حوادث', durationMinutes: 30, order: 4, completed: false }], exam: { id: 'exam-4', courseId: 'course-4', title: 'آزمون امنیت', type: 'multiple-choice', durationMinutes: 20, passingScore: 80, maxAttempts: 3, allowReview: true, showResultImmediately: true, questions: [{ id: 'q12', text: 'Phishing چیست؟', type: 'single-choice', options: ['بدافزار', 'مهندسی اجتماعی', 'رمزنگاری', 'پروتکل'], correctAnswer: 'مهندسی اجتماعی', points: 10 }, { id: 'q13', text: 'حداقل طول رمزعبور؟', type: 'single-choice', options: ['۶', '۸', '۱۲', '۱۶'], correctAnswer: '۱۲', points: 10 }, { id: 'q14', text: 'MFA مخفف؟', type: 'single-choice', options: ['Multi-Factor Authentication', 'Main Firewall', 'Managed File', 'Mobile Feature'], correctAnswer: 'Multi-Factor Authentication', points: 10 }] }, certificateType: 'completion', certificateValidityMonths: 12, cost: 0, isMandatory: true, tags: ['امنیت'], createdAt: '1405/02/01', orgId: 'org1' },
            { id: 'course-5', code: 'LNG-ENG-BIZ', title: 'انگلیسی تجاری', description: 'مکالمه، نگارش ایمیل و ارائه شفاهی', category: 'language', level: 'intermediate', format: 'in-person', instructor: 'استاد نوری', department: 'آموزش', durationHours: 32, creditPoints: 4, maxParticipants: 12, currentParticipants: 8, startDate: '1405/05/10', endDate: '1405/08/10', registrationDeadline: '1405/12/30', location: 'اتاق B2', prerequisites: [], objectives: ['مکالمه', 'ایمیل', 'ارائه'], modules: [{ id: 'mod-5-1', title: 'Business Vocabulary', durationMinutes: 240, order: 1, completed: false }, { id: 'mod-5-2', title: 'Email Writing', durationMinutes: 240, order: 2, completed: false }, { id: 'mod-5-3', title: 'Meeting Skills', durationMinutes: 360, order: 3, completed: false }, { id: 'mod-5-4', title: 'Presentation', durationMinutes: 360, order: 4, completed: false }, { id: 'mod-5-5', title: 'Negotiation', durationMinutes: 240, order: 5, completed: false }, { id: 'mod-5-6', title: 'Final Presentation', durationMinutes: 180, order: 6, completed: false }], exam: { id: 'exam-5', courseId: 'course-5', title: 'آزمون انگلیسی تجاری', type: 'oral', durationMinutes: 30, passingScore: 70, maxAttempts: 2, allowReview: false, showResultImmediately: false, questions: [{ id: 'q15', text: 'ارائه ۵ دقیقه‌ای', type: 'descriptive', points: 30 }, { id: 'q16', text: 'مکالمه شبیه‌سازی', type: 'descriptive', points: 20 }] }, certificateType: 'professional', certificateValidityMonths: 24, cost: 0, isMandatory: false, tags: ['زبان'], createdAt: '1405/03/20', orgId: 'org1' }
        ];
    }
    private getDefaultEnrollments(): Enrollment[] {
        return [
            { id: 'enr-1', courseId: 'course-4', courseTitle: 'امنیت اطلاعات', courseCode: 'CMP-SEC-001', employeeId: 'emp-current', employeeName: 'علی احمدی', department: 'فناوری اطلاعات', status: 'certified', registeredAt: '1405/04/10', approvedAt: '1405/04/10', approvedBy: 'سیستم', startedAt: '1405/04/12', completedAt: '1405/04/15', progress: 100, completedModules: ['mod-4-1', 'mod-4-2', 'mod-4-3', 'mod-4-4'], totalStudyHours: 4, examAttempts: [{ id: 'att-1', examId: 'exam-4', enrollmentId: 'enr-1', attemptNumber: 1, startedAt: '1405/04/15T09:00', submittedAt: '1405/04/15T09:18', answers: [], score: 100, passed: true, gradedBy: 'سیستم', gradedAt: '1405/04/15T09:18', feedback: '' }], finalScore: 100, passCount: 1, failCount: 0, certificateId: 'cert-1', certificateIssuedAt: '1405/04/15', certificateExpiresAt: '1406/04/15', feedback: '', managerComment: '', orgId: 'org1' },
            { id: 'enr-2', courseId: 'course-1', courseTitle: 'Angular پیشرفته و Signals', courseCode: 'IT-ANG-ADV-01', employeeId: 'emp-current', employeeName: 'علی احمدی', department: 'فناوری اطلاعات', status: 'in-progress', registeredAt: '1405/05/01', approvedAt: '1405/05/01', approvedBy: 'مهندس رضایی', startedAt: '1405/05/03', completedAt: null, progress: 50, completedModules: ['mod-1-1', 'mod-1-2', 'mod-1-3'], totalStudyHours: 12, examAttempts: [], finalScore: null, passCount: 0, failCount: 0, certificateId: null, certificateIssuedAt: null, certificateExpiresAt: null, feedback: '', managerComment: '', orgId: 'org1' }
        ];
    }
    private getDefaultCertificates(): Certificate[] { return [{ id: 'cert-1', enrollmentId: 'enr-1', employeeId: 'emp-current', employeeName: 'علی احمدی', courseTitle: 'امنیت اطلاعات', courseCode: 'CMP-SEC-001', type: 'completion', issuedAt: '1405/04/15', expiresAt: '1406/04/15', verificationCode: 'VR-1405-SEC-A7K2', issuer: 'واحد آموزش HRM24', score: 100, grade: 'عالی', orgId: 'org1' }]; }
    private getDefaultLearningPaths(): LearningPath[] { return [{ id: 'path-1', title: 'مسیر Full-Stack Developer', description: 'مسیر جامع توسعه‌دهنده Full-Stack با Angular و Agile', targetRole: 'توسعه‌دهنده ارشد Full-Stack', courseIds: ['course-1', 'course-3'], requiredCredits: 5, earnedCredits: 0, status: 'not-started', startedAt: null, completedAt: null, orgId: 'org1' }, { id: 'path-2', title: 'مسیر مهارت‌های مدیریتی', description: 'مسیر توسعه مهارت‌های رهبری و مدیریت تیم', targetRole: 'مدیر تیم فنی', courseIds: ['course-2', 'course-3'], requiredCredits: 3, earnedCredits: 0, status: 'not-started', startedAt: null, completedAt: null, orgId: 'org1' }]; }
}
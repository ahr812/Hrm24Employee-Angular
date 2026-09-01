import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export type EvaluationPeriod = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
export type EvaluationStatus = 'draft' | 'self-assessment' | 'peer-review' | 'manager-review' | 'subordinate-review' | 'customer-review' | 'calibration' | 'completed';
export type EvaluatorRole = 'self' | 'manager' | 'peer' | 'subordinate' | 'customer';

export interface CompetencyDimension {
    id: string;
    title: string;
    description: string;
    weight: number;
    indicators: CompetencyIndicator[];
}

export interface CompetencyIndicator {
    id: string;
    text: string;
    score: number;
    maxScore: number;
    comment: string;
}

export interface KPIItem {
    id: string;
    title: string;
    category: 'financial' | 'customer' | 'process' | 'learning';
    target: number;
    actual: number;
    unit: string;
    weight: number;
    source: string;
}

export interface EvaluatorFeedback {
    evaluatorId: string;
    evaluatorName: string;
    evaluatorRole: EvaluatorRole;
    dimensionScores: { dimensionId: string; score: number; comment: string }[];
    strengths: string[];
    improvements: string[];
    overallComment: string;
    submittedAt: string;
}

export interface DevelopmentPlan {
    shortTermGoals: { goal: string; deadline: string; status: 'pending' | 'in-progress' | 'done' }[];
    longTermGoals: { goal: string; deadline: string; status: 'pending' | 'in-progress' | 'done' }[];
    trainingNeeds: { topic: string; priority: 'high' | 'medium' | 'low'; completed: boolean }[];
    mentoringNeeded: boolean;
    mentoringTopic: string;
}

export interface Evaluation360 {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeRole: string;
    department: string;
    period: EvaluationPeriod;
    periodLabel: string;
    status: EvaluationStatus;
    competencies: CompetencyDimension[];
    kpis: KPIItem[];
    selfAssessment: EvaluatorFeedback | null;
    managerAssessment: EvaluatorFeedback | null;
    peerAssessments: EvaluatorFeedback[];
    subordinateAssessments: EvaluatorFeedback[];
    customerAssessments: EvaluatorFeedback[];
    finalScores: {
        competencyScores: { dimensionId: string; weightedScore: number; evaluatorCount: number }[];
        kpiScore: number;
        competencyAverage: number;
        overallScore: number;
        rank: string;
    };
    developmentPlan: DevelopmentPlan;
    calibrationNotes: string;
    approvedBy: string;
    approvedAt: string | null;
    createdAt: string;
    completedAt: string | null;
    orgId: string;
}

@Injectable({ providedIn: 'root' })
export class EvaluationService {
    private readonly STORAGE_KEY = 'hrm24_evaluations_360';
    private orgService = inject(OrganizationService);

    evaluations = signal<Evaluation360[]>(this.loadEvaluations());

    stats = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const all = this.evaluations().filter(e => e.orgId === orgId);
        const completed = all.filter(e => e.status === 'completed');
        return {
            total: all.length,
            completed: completed.length,
            pending: all.filter(e => e.status !== 'completed').length,
            avgScore: completed.length > 0
                ? Math.round(completed.reduce((sum, e) => sum + e.finalScores.overallScore, 0) / completed.length)
                : 0,
            inSelfAssessment: all.filter(e => e.status === 'self-assessment').length,
            inPeerReview: all.filter(e => e.status === 'peer-review').length,
            inManagerReview: all.filter(e => e.status === 'manager-review').length
        };
    });

    latestEvaluation = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const completed = this.evaluations().filter(e => e.status === 'completed' && e.orgId === orgId);
        return completed.length > 0 ? completed[0] : null;
    });

    private loadEvaluations(): Evaluation360[] {
        if (typeof localStorage === 'undefined') return this.getDefaultEvaluations();
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : this.getDefaultEvaluations();
        } catch {
            return this.getDefaultEvaluations();
        }
    }

    private saveEvaluations(): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.evaluations()));
        } catch (error) {
            console.error('Error saving evaluations:', error);
        }
    }

    private getDefaultEvaluations(): Evaluation360[] {
        return [
            {
                id: 'eval-1',
                employeeId: 'emp-1',
                employeeName: 'علی احمدی',
                employeeRole: 'توسعه‌دهنده ارشد',
                department: 'فناوری اطلاعات',
                period: 'quarterly',
                periodLabel: 'تابستان ۱۴۰۳',
                status: 'completed',
                competencies: this.getDefaultCompetencies(),
                kpis: this.getDefaultKPIs(),
                selfAssessment: {
                    evaluatorId: 'self',
                    evaluatorName: 'علی احمدی',
                    evaluatorRole: 'self',
                    dimensionScores: [
                        { dimensionId: 'dim-1', score: 4, comment: '' },
                        { dimensionId: 'dim-2', score: 5, comment: '' },
                        { dimensionId: 'dim-3', score: 4, comment: '' },
                        { dimensionId: 'dim-4', score: 4, comment: '' },
                        { dimensionId: 'dim-5', score: 3, comment: '' },
                        { dimensionId: 'dim-6', score: 4, comment: '' },
                        { dimensionId: 'dim-7', score: 3, comment: '' },
                        { dimensionId: 'dim-8', score: 5, comment: '' }
                    ],
                    strengths: ['تعهد بالا', 'کیفیت کار عالی'],
                    improvements: ['مدیریت زمان'],
                    overallComment: 'عملکرد خوب با جای بهبود',
                    submittedAt: '1403/07/05'
                },
                managerAssessment: {
                    evaluatorId: 'mgr-1',
                    evaluatorName: 'مهندس رضایی',
                    evaluatorRole: 'manager',
                    dimensionScores: [
                        { dimensionId: 'dim-1', score: 5, comment: '' },
                        { dimensionId: 'dim-2', score: 5, comment: '' },
                        { dimensionId: 'dim-3', score: 4, comment: '' },
                        { dimensionId: 'dim-4', score: 5, comment: '' },
                        { dimensionId: 'dim-5', score: 4, comment: '' },
                        { dimensionId: 'dim-6', score: 4, comment: '' },
                        { dimensionId: 'dim-7', score: 3, comment: '' },
                        { dimensionId: 'dim-8', score: 5, comment: '' }
                    ],
                    strengths: ['تعهد بالا به deadlines', 'کیفیت کار عالی', 'همکاری تیمی فوق‌العاده'],
                    improvements: ['مدیریت زمان در جلسات', 'مستندسازی بیشتر'],
                    overallComment: 'عملکرد بسیار خوب. ادامه همین روند توصیه می‌شود.',
                    submittedAt: '1403/07/10'
                },
                peerAssessments: [
                    {
                        evaluatorId: 'peer-1',
                        evaluatorName: 'سارا محمدی',
                        evaluatorRole: 'peer',
                        dimensionScores: [
                            { dimensionId: 'dim-1', score: 4, comment: '' },
                            { dimensionId: 'dim-2', score: 5, comment: '' },
                            { dimensionId: 'dim-3', score: 4, comment: '' },
                            { dimensionId: 'dim-4', score: 5, comment: '' },
                            { dimensionId: 'dim-5', score: 3, comment: '' },
                            { dimensionId: 'dim-6', score: 4, comment: '' },
                            { dimensionId: 'dim-7', score: 3, comment: '' },
                            { dimensionId: 'dim-8', score: 5, comment: '' }
                        ],
                        strengths: ['همکاری عالی', 'دانش فنی بالا'],
                        improvements: ['ارتباطات کتبی'],
                        overallComment: '',
                        submittedAt: '1403/07/08'
                    }
                ],
                subordinateAssessments: [],
                customerAssessments: [],
                finalScores: {
                    competencyScores: [
                        { dimensionId: 'dim-1', weightedScore: 18, evaluatorCount: 3 },
                        { dimensionId: 'dim-2', weightedScore: 15, evaluatorCount: 3 },
                        { dimensionId: 'dim-3', weightedScore: 12, evaluatorCount: 3 },
                        { dimensionId: 'dim-4', weightedScore: 14, evaluatorCount: 3 },
                        { dimensionId: 'dim-5', weightedScore: 7, evaluatorCount: 3 },
                        { dimensionId: 'dim-6', weightedScore: 8, evaluatorCount: 3 },
                        { dimensionId: 'dim-7', weightedScore: 6, evaluatorCount: 3 },
                        { dimensionId: 'dim-8', weightedScore: 5, evaluatorCount: 3 }
                    ],
                    kpiScore: 91,
                    competencyAverage: 85,
                    overallScore: 88,
                    rank: 'خیلی خوب'
                },
                developmentPlan: {
                    shortTermGoals: [
                        { goal: 'یادگیری فریمورک جدید', deadline: '1403/10/01', status: 'in-progress' },
                        { goal: 'رهبری یک پروژه کوچک', deadline: '1403/12/01', status: 'pending' }
                    ],
                    longTermGoals: [
                        { goal: 'ارتقا به سمت سرپرست تیم', deadline: '1404/06/01', status: 'pending' }
                    ],
                    trainingNeeds: [
                        { topic: 'مدیریت پروژه', priority: 'high', completed: false },
                        { topic: 'مهارت‌های ارتباطی', priority: 'medium', completed: false }
                    ],
                    mentoringNeeded: true,
                    mentoringTopic: 'رهبری تیم'
                },
                calibrationNotes: '',
                approvedBy: 'مهندس رضایی',
                approvedAt: '1403/07/15',
                createdAt: '1403/07/01',
                completedAt: '1403/07/15',
                orgId: 'org1'
            },
            {
                id: 'eval-2',
                employeeId: 'emp-1',
                employeeName: 'علی احمدی',
                employeeRole: 'توسعه‌دهنده ارشد',
                department: 'فناوری اطلاعات',
                period: 'quarterly',
                periodLabel: 'پاییز ۱۴۰۳',
                status: 'self-assessment',
                competencies: this.getDefaultCompetencies(),
                kpis: this.getDefaultKPIs(),
                selfAssessment: null,
                managerAssessment: null,
                peerAssessments: [],
                subordinateAssessments: [],
                customerAssessments: [],
                finalScores: { competencyScores: [], kpiScore: 0, competencyAverage: 0, overallScore: 0, rank: '' },
                developmentPlan: { shortTermGoals: [], longTermGoals: [], trainingNeeds: [], mentoringNeeded: false, mentoringTopic: '' },
                calibrationNotes: '',
                approvedBy: '',
                approvedAt: null,
                createdAt: '1403/10/01',
                completedAt: null,
                orgId: 'org1'
            }
        ];
    }

    getDefaultCompetencies(): CompetencyDimension[] {
        return [
            {
                id: 'dim-1', title: 'دانش و مهارت تخصصی', description: 'سطح تسلط بر دانش فنی و مهارت‌های مورد نیاز شغل', weight: 20,
                indicators: [
                    { id: 'ind-1-1', text: 'تسلط کافی بر ابزارها و تکنولوژی‌های مرتبط', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-1-2', text: 'به‌روز بودن دانش تخصصی', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-1-3', text: 'قابلیت حل مسائل پیچیده تخصصی', score: 0, maxScore: 5, comment: '' }
                ]
            },
            {
                id: 'dim-2', title: 'کیفیت کار و دقت', description: 'سطح کیفیت خروجی‌ها و توجه به جزئیات', weight: 15,
                indicators: [
                    { id: 'ind-2-1', text: 'ارائه کار بدون خطا و نقص', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-2-2', text: 'رعایت استانداردها و رویه‌ها', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-2-3', text: 'توجه به جزئیات و ظرافت‌ها', score: 0, maxScore: 5, comment: '' }
                ]
            },
            {
                id: 'dim-3', title: 'مسئولیت‌پذیری و تعهد', description: 'میزان تعهد به وظایف و مسئولیت‌پذیری در قبال نتایج', weight: 15,
                indicators: [
                    { id: 'ind-3-1', text: 'تحویل به موقع وظایف محوله', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-3-2', text: 'پیگیری تا حصول نتیجه نهایی', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-3-3', text: 'پذیرش مسئولیت اشتباهات و اصلاح آن‌ها', score: 0, maxScore: 5, comment: '' }
                ]
            },
            {
                id: 'dim-4', title: 'ارتباطات و کار تیمی', description: 'توانایی ارتباط مؤثر و همکاری با دیگران', weight: 15,
                indicators: [
                    { id: 'ind-4-1', text: 'ارتباط واضح و مؤثر با همکاران', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-4-2', text: 'همکاری و حمایت از اعضای تیم', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-4-3', text: 'گوش دادن فعال و پذیرش بازخورد', score: 0, maxScore: 5, comment: '' }
                ]
            },
            {
                id: 'dim-5', title: 'رهبری و مدیریت', description: 'توانایی هدایت، انگیزه‌بخشی و تصمیم‌گیری', weight: 10,
                indicators: [
                    { id: 'ind-5-1', text: 'تصمیم‌گیری به موقع و صحیح', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-5-2', text: 'انگیزه‌بخشی و الهام‌بخشی به دیگران', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-5-3', text: 'مدیریت تعارض و حل اختلاف', score: 0, maxScore: 5, comment: '' }
                ]
            },
            {
                id: 'dim-6', title: 'نوآوری و خلاقیت', description: 'ارائه ایده‌های جدید و بهبود فرآیندها', weight: 10,
                indicators: [
                    { id: 'ind-6-1', text: 'ارائه پیشنهادات بهبود', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-6-2', text: 'استفاده از روش‌های نوین در کار', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-6-3', text: 'انعطاف‌پذیری در برابر تغییر', score: 0, maxScore: 5, comment: '' }
                ]
            },
            {
                id: 'dim-7', title: 'توسعه فردی و یادگیری', description: 'تعهد به یادگیری مستمر و رشد شخصی', weight: 10,
                indicators: [
                    { id: 'ind-7-1', text: 'شرکت در دوره‌های آموزشی', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-7-2', text: 'یادگیری مهارت‌های جدید', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-7-3', text: 'اشتراک‌گذاری دانش با همکاران', score: 0, maxScore: 5, comment: '' }
                ]
            },
            {
                id: 'dim-8', title: 'اخلاق حرفه‌ای و سازمانی', description: 'رعایت اصول اخلاقی و ارزش‌های سازمانی', weight: 5,
                indicators: [
                    { id: 'ind-8-1', text: 'صداقت و امانتداری', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-8-2', text: 'احترام به همکاران و مشتریان', score: 0, maxScore: 5, comment: '' },
                    { id: 'ind-8-3', text: 'رعایت قوانین و مقررات سازمان', score: 0, maxScore: 5, comment: '' }
                ]
            }
        ];
    }

    getDefaultKPIs(): KPIItem[] {
        return [
            { id: 'kpi-1', title: 'نرخ تکمیل پروژه‌ها', category: 'process', target: 100, actual: 95, unit: '٪', weight: 25, source: 'PMO' },
            { id: 'kpi-2', title: 'رضایت مشتریان داخلی', category: 'customer', target: 90, actual: 92, unit: '٪', weight: 20, source: 'نظرسنجی' },
            { id: 'kpi-3', title: 'کاهش هزینه‌های عملیاتی', category: 'financial', target: 10, actual: 8, unit: '٪', weight: 20, source: 'مالی' },
            { id: 'kpi-4', title: 'ساعات آموزش تکمیل شده', category: 'learning', target: 40, actual: 35, unit: 'ساعت', weight: 15, source: 'آموزش' },
            { id: 'kpi-5', title: 'تعداد پیشنهادات بهبود اجرا شده', category: 'process', target: 5, actual: 6, unit: 'عدد', weight: 10, source: 'بهبود مستمر' },
            { id: 'kpi-6', title: 'نرخ حضور به موقع', category: 'process', target: 100, actual: 98, unit: '٪', weight: 10, source: 'HR' }
        ];
    }

    addEvaluation(evalData: Omit<Evaluation360, 'id' | 'orgId'>): void {
        const newEval: Evaluation360 = {
            ...evalData,
            id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            orgId: this.orgService.activeOrg().id
        };
        this.evaluations.update(current => [newEval, ...current]);
        this.saveEvaluations();
    }

    updateEvaluation(id: string, updates: Partial<Evaluation360>): void {
        this.evaluations.update(current =>
            current.map(e => e.id === id ? { ...e, ...updates } : e)
        );
        this.saveEvaluations();
    }

    deleteEvaluation(id: string): void {
        this.evaluations.update(current => current.filter(e => e.id !== id));
        this.saveEvaluations();
    }

    submitSelfAssessment(evalId: string, feedback: EvaluatorFeedback): void {
        this.updateEvaluation(evalId, { selfAssessment: feedback, status: 'peer-review' });
    }

    submitPeerAssessment(evalId: string, feedback: EvaluatorFeedback): void {
        this.evaluations.update(current =>
            current.map(e => {
                if (e.id !== evalId) return e;
                const updatedPeers = [...e.peerAssessments, feedback];
                const nextStatus = updatedPeers.length >= 3 ? 'manager-review' : e.status;
                return { ...e, peerAssessments: updatedPeers, status: nextStatus as EvaluationStatus };
            })
        );
        this.saveEvaluations();
    }

    submitManagerAssessment(evalId: string, feedback: EvaluatorFeedback): void {
        this.updateEvaluation(evalId, { managerAssessment: feedback, status: 'subordinate-review' });
    }

    calculateFinalScores(evalData: Evaluation360): Evaluation360['finalScores'] {
        const allAssessments: EvaluatorFeedback[] = [];
        if (evalData.selfAssessment) allAssessments.push(evalData.selfAssessment);
        if (evalData.managerAssessment) allAssessments.push(evalData.managerAssessment);
        allAssessments.push(...evalData.peerAssessments);
        allAssessments.push(...evalData.subordinateAssessments);
        allAssessments.push(...evalData.customerAssessments);

        const competencyScores = evalData.competencies.map(dim => {
            const scores = allAssessments
                .map(a => a.dimensionScores.find(ds => ds.dimensionId === dim.id))
                .filter((ds): ds is { dimensionId: string; score: number; comment: string } => ds !== undefined)
                .map(ds => ds.score);

            const avg = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
            const normalizedAvg = (avg / 5) * 100;
            return {
                dimensionId: dim.id,
                weightedScore: Math.round(normalizedAvg * (dim.weight / 100)),
                evaluatorCount: scores.length
            };
        });

        const competencyAverage = competencyScores.length > 0
            ? Math.round(competencyScores.reduce((s, c) => s + c.weightedScore, 0))
            : 0;

        const totalKPIWeight = evalData.kpis.reduce((s, k) => s + k.weight, 0);
        const kpiScore = totalKPIWeight > 0
            ? Math.round(evalData.kpis.reduce((s, k) => {
                const pct = Math.min(100, (k.actual / k.target) * 100);
                return s + (pct * (k.weight / totalKPIWeight));
            }, 0))
            : 0;

        const overallScore = Math.round((competencyAverage * 0.6) + (kpiScore * 0.4));

        let rank = 'نیاز به بهبود';
        if (overallScore >= 90) rank = 'عالی';
        else if (overallScore >= 80) rank = 'خیلی خوب';
        else if (overallScore >= 70) rank = 'خوب';
        else if (overallScore >= 60) rank = 'قابل قبول';

        return { competencyScores, kpiScore, competencyAverage, overallScore, rank };
    }

    completeEvaluation(evalId: string, approvedBy: string): void {
        const evalData = this.evaluations().find(e => e.id === evalId);
        if (!evalData) return;
        const finalScores = this.calculateFinalScores(evalData);
        this.updateEvaluation(evalId, {
            finalScores,
            status: 'completed',
            approvedBy,
            approvedAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
        });
    }

    getPeriodLabel(period: EvaluationPeriod): string {
        const labels: Record<EvaluationPeriod, string> = { monthly: 'ماهانه', quarterly: 'فصلی', 'semi-annual': 'نیم‌ساله', annual: 'سالانه' };
        return labels[period];
    }

    getStatusLabel(status: EvaluationStatus): string {
        const labels: Record<EvaluationStatus, string> = {
            draft: 'پیش‌نویس', 'self-assessment': 'خودارزیابی', 'peer-review': 'ارزیابی همکاران',
            'manager-review': 'ارزیابی مدیر', 'subordinate-review': 'ارزیابی زیردستان',
            'customer-review': 'ارزیابی مشتریان', calibration: 'کالیبراسیون', completed: 'تکمیل شده'
        };
        return labels[status];
    }

    getEvaluatorRoleLabel(role: EvaluatorRole): string {
        const labels: Record<EvaluatorRole, string> = { self: 'خودارزیابی', manager: 'مدیر مستقیم', peer: 'همکار', subordinate: 'زیردست', customer: 'مشتری' };
        return labels[role];
    }

    getKPICategoryLabel(category: KPIItem['category']): string {
        const labels: Record<KPIItem['category'], string> = { financial: 'مالی', customer: 'مشتری', process: 'فرآیند', learning: 'یادگیری و رشد' };
        return labels[category];
    }

    getScoreColor(score: number): string {
        if (score >= 90) return 'text-success';
        if (score >= 80) return 'text-primary';
        if (score >= 70) return 'text-info';
        if (score >= 60) return 'text-warning';
        return 'text-danger';
    }

    getScoreBadgeClass(score: number): string {
        if (score >= 90) return 'bg-success/10 text-success';
        if (score >= 80) return 'bg-primary/10 text-primary';
        if (score >= 70) return 'bg-info/10 text-info';
        if (score >= 60) return 'bg-warning/10 text-warning';
        return 'bg-danger/10 text-danger';
    }

    getStatusBadgeClass(status: EvaluationStatus): string {
        const map: Record<EvaluationStatus, string> = {
            draft: 'bg-muted/10 text-muted', 'self-assessment': 'bg-info/10 text-info',
            'peer-review': 'bg-warning/10 text-warning', 'manager-review': 'bg-primary/10 text-primary',
            'subordinate-review': 'bg-info/10 text-info', 'customer-review': 'bg-info/10 text-info',
            calibration: 'bg-warning/10 text-warning', completed: 'bg-success/10 text-success'
        };
        return map[status];
    }
}
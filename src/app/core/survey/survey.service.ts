import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';
import { AIAnalysisService } from '../ai/ai-analysis.service';

export type SurveyStatus = 'active' | 'closed' | 'draft';
export type QuestionType = 'rating' | 'text' | 'choice' | 'yesno' | 'scale';

export interface SurveyQuestion {
    id: string;
    text: string;
    type: QuestionType;
    required: boolean;
    options?: string[];
    maxRating?: number;
}

export interface SurveyResponse {
    questionId: string;
    value: string | number;
}

export interface Survey {
    id: string;
    title: string;
    description: string;
    status: SurveyStatus;
    questions: SurveyQuestion[];
    createdAt: string;
    expiresAt: string;
    responseCount: number;
    orgId: string;
}

export interface SurveySubmission {
    id: string;
    surveyId: string;
    responses: SurveyResponse[];
    submittedAt: string;
    userId: string;
    orgId: string;
}

export interface QuestionAnalysis {
    questionId: string;
    questionText: string;
    type: QuestionType;
    averageScore?: number;
    distribution?: { label: string; count: number; percentage: number }[];
    sentimentSummary?: string;
    sentimentLabel?: 'مثبت' | 'منفی' | 'خنثی';
    topKeywords?: string[];
    totalResponses: number;
}

export interface SurveyAIAnalysis {
    overallSentiment: 'مثبت' | 'منفی' | 'خنثی';
    overallSentimentScore: number;
    summary: string;
    keyInsights: string[];
    questionAnalyses: QuestionAnalysis[];
    totalResponses: number;
    analyzedAt: string;
}

@Injectable({ providedIn: 'root' })
export class SurveyService {
    private readonly STORAGE_KEY = 'hrm24_surveys';
    private readonly SUBMISSIONS_KEY = 'hrm24_survey_submissions';
    private orgService = inject(OrganizationService);
    private aiService = inject(AIAnalysisService);

    surveys = signal<Survey[]>(this.loadSurveys());
    submissions = signal<SurveySubmission[]>(this.loadSubmissions());

    activeSurveys = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        return this.surveys()
            .filter(s => s.status === 'active' && s.orgId === orgId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    closedSurveys = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        return this.surveys()
            .filter(s => s.status === 'closed' && s.orgId === orgId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    draftSurveys = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        return this.surveys()
            .filter(s => s.status === 'draft' && s.orgId === orgId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    stats = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const all = this.surveys().filter(s => s.orgId === orgId);
        return {
            total: all.length,
            active: all.filter(s => s.status === 'active').length,
            closed: all.filter(s => s.status === 'closed').length,
            draft: all.filter(s => s.status === 'draft').length,
            totalResponses: all.reduce((sum, s) => sum + s.responseCount, 0)
        };
    });

    hasSubmitted = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const activeIds = this.activeSurveys().map(s => s.id);
        const submittedSurveyIds = this.submissions().filter(sub => sub.orgId === orgId).map(sub => sub.surveyId);
        return activeIds.filter(id => !submittedSurveyIds.includes(id));
    });

    // ── CRUD Operations ──

    addSurvey(survey: Omit<Survey, 'id' | 'responseCount'>): void {
        const newSurvey: Survey = {
            ...survey,
            id: `survey-${Date.now()}`,
            responseCount: 0
        };
        this.surveys.update(current => [...current, newSurvey]);
        this.saveSurveys();
    }

    updateSurvey(id: string, updates: Partial<Survey>): void {
        this.surveys.update(current =>
            current.map(s => s.id === id ? { ...s, ...updates } : s)
        );
        this.saveSurveys();
    }

    deleteSurvey(id: string): void {
        this.surveys.update(current => current.filter(s => s.id !== id));
        this.submissions.update(current => current.filter(sub => sub.surveyId !== id));
        this.saveSurveys();
        this.saveSubmissions();
    }

    // ── Submission ──

    submitSurvey(surveyId: string, responses: SurveyResponse[]): void {
        const submission: SurveySubmission = {
            id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            surveyId,
            responses,
            submittedAt: new Date().toISOString(),
            userId: 'current-user',
            orgId: this.orgService.activeOrg().id
        };

        this.submissions.update(current => [...current, submission]);

        this.surveys.update(current =>
            current.map(s =>
                s.id === surveyId ? { ...s, responseCount: s.responseCount + 1 } : s
            )
        );

        this.saveSubmissions();
        this.saveSurveys();
    }

    getSubmissionForSurvey(surveyId: string): SurveySubmission | undefined {
        const orgId = this.orgService.activeOrg().id;
        return this.submissions().find(sub => sub.surveyId === surveyId && sub.orgId === orgId);
    }

    getSubmissionsForSurvey(surveyId: string): SurveySubmission[] {
        return this.submissions().filter(sub => sub.surveyId === surveyId);
    }

    // ── AI Analysis ──

    analyzeSurveyResults(surveyId: string): SurveyAIAnalysis | null {
        const survey = this.surveys().find(s => s.id === surveyId);
        if (!survey) return null;

        const submissions = this.getSubmissionsForSurvey(surveyId);
        if (submissions.length === 0) return null;

        const questionAnalyses: QuestionAnalysis[] = [];
        const allTextResponses: string[] = [];
        let totalRatingSum = 0;
        let totalRatingCount = 0;

        for (const question of survey.questions) {
            const qResponses = submissions
                .map(sub => sub.responses.find(r => r.questionId === question.id))
                .filter((r): r is SurveyResponse => r !== undefined);

            const analysis: QuestionAnalysis = {
                questionId: question.id,
                questionText: question.text,
                type: question.type,
                totalResponses: qResponses.length
            };

            if (question.type === 'rating' || question.type === 'scale') {
                const scores = qResponses.map(r => Number(r.value)).filter(v => !isNaN(v));
                if (scores.length > 0) {
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    analysis.averageScore = Math.round(avg * 10) / 10;
                    totalRatingSum += scores.reduce((a, b) => a + b, 0);
                    totalRatingCount += scores.length;

                    const maxRating = question.maxRating || 5;
                    const dist: { label: string; count: number; percentage: number }[] = [];
                    for (let i = 1; i <= maxRating; i++) {
                        const count = scores.filter(s => s === i).length;
                        dist.push({
                            label: `${i}`,
                            count,
                            percentage: Math.round((count / scores.length) * 100)
                        });
                    }
                    analysis.distribution = dist;
                }
            } else if (question.type === 'choice' || question.type === 'yesno') {
                const values = qResponses.map(r => String(r.value));
                const uniqueValues = [...new Set(values)];
                const dist = uniqueValues.map(val => ({
                    label: val,
                    count: values.filter(v => v === val).length,
                    percentage: Math.round((values.filter(v => v === val).length / values.length) * 100)
                })).sort((a, b) => b.count - a.count);
                analysis.distribution = dist;
            } else if (question.type === 'text') {
                const texts = qResponses.map(r => String(r.value)).filter(t => t.trim().length > 0);
                if (texts.length > 0) {
                    allTextResponses.push(...texts);
                    const combinedText = texts.join(' ');
                    const sentiment = this.aiService.analyzeSentiment(combinedText);
                    analysis.sentimentLabel = sentiment.label;
                    analysis.sentimentSummary = `از ${texts.length} پاسخ تشریحی، احساس کلی ${sentiment.label} است.`;
                    analysis.topKeywords = sentiment.keywords.slice(0, 5);
                }
            }

            questionAnalyses.push(analysis);
        }

        const overallSentiment = allTextResponses.length > 0
            ? this.aiService.analyzeSentiment(allTextResponses.join(' '))
            : { label: 'خنثی' as const, score: 0, keywords: [] };

        const keyInsights: string[] = [];

        const ratingQuestions = questionAnalyses.filter(q => q.type === 'rating' || q.type === 'scale');
        for (const rq of ratingQuestions) {
            if (rq.averageScore !== undefined) {
                if (rq.averageScore >= 4) {
                    keyInsights.push(`امتیاز بالا در «${rq.questionText}» (${rq.averageScore} از ۵)`);
                } else if (rq.averageScore < 3) {
                    keyInsights.push(`نیاز به بهبود در «${rq.questionText}» (${rq.averageScore} از ۵)`);
                }
            }
        }

        const choiceQuestions = questionAnalyses.filter(q => q.type === 'choice' || q.type === 'yesno');
        for (const cq of choiceQuestions) {
            if (cq.distribution && cq.distribution.length > 0) {
                const topChoice = cq.distribution[0];
                if (topChoice.percentage >= 70) {
                    keyInsights.push(`${topChoice.percentage}٪ پاسخ‌دهندگان «${topChoice.label}» را در «${cq.questionText}» انتخاب کردند`);
                }
            }
        }

        const textQuestions = questionAnalyses.filter(q => q.type === 'text' && q.sentimentLabel);
        for (const tq of textQuestions) {
            if (tq.sentimentLabel === 'منفی') {
                keyInsights.push(`بازخوردهای منفی در «${tq.questionText}» - نیاز به توجه ویژه`);
            }
        }

        if (keyInsights.length === 0) {
            keyInsights.push('نتایج نظرسنجی در محدوده نرمال قرار دارد.');
        }

        const avgRating = totalRatingCount > 0 ? Math.round((totalRatingSum / totalRatingCount) * 10) / 10 : 0;
        let summary = `این نظرسنجی ${submissions.length} پاسخ دریافت کرده است.`;
        if (avgRating > 0) {
            summary += ` میانگین امتیاز سوالات ارزیابی ${avgRating} از ۵ است.`;
        }
        summary += ` احساس کلی بازخوردهای تشریحی ${overallSentiment.label} است.`;

        return {
            overallSentiment: overallSentiment.label as 'مثبت' | 'منفی' | 'خنثی',
            overallSentimentScore: overallSentiment.score,
            summary,
            keyInsights,
            questionAnalyses,
            totalResponses: submissions.length,
            analyzedAt: new Date().toISOString()
        };
    }

    // ── Helpers ──

    getStatusLabel(status: SurveyStatus): string {
        const labels: Record<SurveyStatus, string> = {
            active: 'فعال',
            closed: 'بسته شده',
            draft: 'پیش‌نویس'
        };
        return labels[status];
    }

    getDaysRemaining(expiresAt: string): number {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    // ── Storage ──

    private loadSurveys(): Survey[] {
        if (typeof localStorage === 'undefined') return this.getDefaultSurveys();
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : this.getDefaultSurveys();
        } catch {
            return this.getDefaultSurveys();
        }
    }

    private loadSubmissions(): SurveySubmission[] {
        if (typeof localStorage === 'undefined') return [];
        try {
            const stored = localStorage.getItem(this.SUBMISSIONS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    private saveSurveys(): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.surveys()));
        } catch (error) {
            console.error('Error saving surveys:', error);
        }
    }

    private saveSubmissions(): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.SUBMISSIONS_KEY, JSON.stringify(this.submissions()));
        } catch (error) {
            console.error('Error saving submissions:', error);
        }
    }

    private getDefaultSurveys(): Survey[] {
        return [
            {
                id: 'survey-1',
                title: 'نظرسنجی رضایت شغلی',
                description: 'لطفاً میزان رضایت خود از محیط کار و شرایط کاری را مشخص کنید.',
                status: 'active',
                questions: [
                    { id: 'q1', text: 'از محیط کاری خود چقدر راضی هستید؟', type: 'rating', required: true, maxRating: 5 },
                    { id: 'q2', text: 'آیا از حقوق و مزایا رضایت دارید؟', type: 'choice', required: true, options: ['بله', 'خیر', 'تا حدودی'] },
                    { id: 'q3', text: 'پیشنهادات یا انتقادات خود را بنویسید:', type: 'text', required: false }
                ],
                createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
                expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
                responseCount: 45,
                orgId: 'org1'
            },
            {
                id: 'survey-2',
                title: 'ارزیابی دوره آموزشی',
                description: 'نظر شما درباره کیفیت دوره آموزشی اخیر چیست؟',
                status: 'active',
                questions: [
                    { id: 'q4', text: 'کیفیت محتوا چطور بود؟', type: 'rating', required: true, maxRating: 5 },
                    { id: 'q5', text: 'مدرس دوره چقدر مسلط بود؟', type: 'rating', required: true, maxRating: 5 },
                    { id: 'q6', text: 'آیا این دوره را به همکاران پیشنهاد می‌کنید؟', type: 'choice', required: true, options: ['بله', 'خیر'] }
                ],
                createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
                expiresAt: new Date(Date.now() + 86400000 * 14).toISOString(),
                responseCount: 28,
                orgId: 'org1'
            },
            {
                id: 'survey-3',
                title: 'نظرسنجی امکانات رفاهی',
                description: 'این نظرسنجی بسته شده است.',
                status: 'closed',
                questions: [
                    { id: 'q7', text: 'از امکانات رفاهی شرکت راضی هستید؟', type: 'rating', required: true, maxRating: 5 }
                ],
                createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
                expiresAt: new Date(Date.now() - 86400000 * 30).toISOString(),
                responseCount: 120,
                orgId: 'org1'
            }
        ];
    }
}
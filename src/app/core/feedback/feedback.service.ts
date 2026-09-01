import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export type FeedbackType = 'suggestion' | 'complaint' | 'appreciation' | 'report' | 'idea';
export type FeedbackStatus = 'submitted' | 'under-review' | 'approved' | 'rejected' | 'implemented' | 'archived';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'urgent';
export type FeedbackCategory = 'process' | 'technology' | 'environment' | 'hr' | 'management' | 'customer' | 'safety' | 'other';

export interface FeedbackComment {
    id: string;
    authorName: string;
    authorRole: string;
    content: string;
    createdAt: string;
}

export interface Feedback {
    id: string;
    title: string;
    description: string;
    type: FeedbackType;
    category: FeedbackCategory;
    priority: FeedbackPriority;
    status: FeedbackStatus;
    submitterId: string;
    submitterName: string;
    department: string;
    createdAt: string;
    updatedAt: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    reviewComment: string;
    implementedAt: string | null;
    impactScore: number | null;
    likes: number;
    comments: FeedbackComment[];
    tags: string[];
    anonymous: boolean;
    orgId: string;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
    private readonly STORAGE_KEY = 'hrm24_feedbacks';
    private orgService = inject(OrganizationService);

    feedbacks = signal<Feedback[]>(this.loadFeedbacks());

    stats = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const all = this.feedbacks().filter(f => f.orgId === orgId);
        return {
            total: all.length,
            submitted: all.filter(f => f.status === 'submitted').length,
            underReview: all.filter(f => f.status === 'under-review').length,
            approved: all.filter(f => f.status === 'approved').length,
            implemented: all.filter(f => f.status === 'implemented').length,
            rejected: all.filter(f => f.status === 'rejected').length,
            totalLikes: all.reduce((s, f) => s + f.likes, 0),
            avgImpact: all.filter(f => f.impactScore !== null).length > 0
                ? Math.round(all.filter(f => f.impactScore !== null).reduce((s, f) => s + (f.impactScore || 0), 0) / all.filter(f => f.impactScore !== null).length)
                : 0,
            suggestions: all.filter(f => f.type === 'suggestion').length,
            complaints: all.filter(f => f.type === 'complaint').length,
            ideas: all.filter(f => f.type === 'idea').length
        };
    });

    myFeedbacks = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        return this.feedbacks().filter(f => f.submitterId === 'emp-current' && f.orgId === orgId);
    });

    topIdeas = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        return [...this.feedbacks()].filter(f => f.orgId === orgId && f.status !== 'rejected' && f.status !== 'archived').sort((a, b) => b.likes - a.likes).slice(0, 5);
    });

    private loadFeedbacks(): Feedback[] {
        if (typeof localStorage === 'undefined') return this.getDefaultFeedbacks();
        try { const s = localStorage.getItem(this.STORAGE_KEY); return s ? JSON.parse(s) : this.getDefaultFeedbacks(); } catch { return this.getDefaultFeedbacks(); }
    }

    private saveFeedbacks(): void { if (typeof localStorage !== 'undefined') try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.feedbacks())); } catch { } }

    private getDefaultFeedbacks(): Feedback[] {
        return [
            {
                id: 'fb-1', title: 'استفاده از مانیتور دوم برای تیم فنی', description: 'پیشنهاد می‌شود برای افزایش بهره‌وری تیم توسعه، مانیتور دوم در اختیار برنامه‌نویسان قرار گیرد. تحقیقات نشان داده که استفاده از دو مانیتور تا ۳۰٪ بهره‌وری را افزایش می‌دهد.',
                type: 'suggestion', category: 'technology', priority: 'medium', status: 'approved',
                submitterId: 'emp-current', submitterName: 'علی احمدی', department: 'فناوری اطلاعات',
                createdAt: '1403/08/10', updatedAt: '1403/08/15', reviewedBy: 'مهندس رضایی', reviewedAt: '1403/08/12',
                reviewComment: 'پیشنهاد خوبی است. در بودجه فصل بعد لحاظ خواهد شد.', implementedAt: null, impactScore: 8,
                likes: 15, comments: [{ id: 'c1', authorName: 'سارا محمدی', authorRole: 'توسعه‌دهنده', content: 'موافقم. خیلی کمک‌کننده خواهد بود.', createdAt: '1403/08/11' }],
                tags: ['بهره‌وری', 'تجهیزات'], anonymous: false, orgId: 'org1'
            },
            {
                id: 'fb-2', title: 'بهینه‌سازی فرآیند درخواست مرخصی', description: 'فرآیند فعلی درخواست مرخصی پیچیده است. پیشنهاد می‌شود با چند کلیک ساده و بدون نیاز به تأیید چند مرحله‌ای انجام شود.',
                type: 'idea', category: 'process', priority: 'high', status: 'implemented',
                submitterId: 'emp-2', submitterName: 'سارا محمدی', department: 'فناوری اطلاعات',
                createdAt: '1403/07/20', updatedAt: '1403/08/01', reviewedBy: 'مدیر HR', reviewedAt: '1403/07/25',
                reviewComment: 'پیاده‌سازی شد در نسخه جدید.', implementedAt: '1403/08/01', impactScore: 9,
                likes: 22, comments: [], tags: ['مرخصی', 'فرآیند'], anonymous: false, orgId: 'org1'
            },
            {
                id: 'fb-3', title: 'تهویه نامناسب طبقه سوم', description: 'سیستم تهویه طبقه سوم به درستی کار نمی‌کند و دمای محیط بسیار بالاست.',
                type: 'complaint', category: 'environment', priority: 'urgent', status: 'under-review',
                submitterId: 'emp-3', submitterName: 'ناشناس', department: 'مالی',
                createdAt: '1403/08/18', updatedAt: '1403/08/18', reviewedBy: null, reviewedAt: null,
                reviewComment: '', implementedAt: null, impactScore: null,
                likes: 8, comments: [], tags: ['تهویه', 'محیط کار'], anonymous: true, orgId: 'org1'
            },
            {
                id: 'fb-4', title: 'تشکر از تیم پشتیبانی', description: 'تیم پشتیبانی IT در حل مشکل سرور آخر هفته فوق‌العاده عمل کردند. قدردانی ویژه از مهندس حسینی.',
                type: 'appreciation', category: 'hr', priority: 'low', status: 'approved',
                submitterId: 'emp-current', submitterName: 'علی احمدی', department: 'فناوری اطلاعات',
                createdAt: '1403/08/16', updatedAt: '1403/08/17', reviewedBy: 'مدیر IT', reviewedAt: '1403/08/17',
                reviewComment: 'از لطف شما سپاسگزاریم.', implementedAt: null, impactScore: null,
                likes: 12, comments: [], tags: ['قدردانی', 'پشتیبانی'], anonymous: false, orgId: 'org1'
            }
        ];
    }

    addFeedback(fb: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt' | 'reviewedBy' | 'reviewedAt' | 'reviewComment' | 'implementedAt' | 'impactScore' | 'likes' | 'comments' | 'orgId'>): void {
        const now = new Date().toLocaleDateString('fa-IR');
        const newFb: Feedback = { ...fb, id: `fb-${Date.now()}`, createdAt: now, updatedAt: now, reviewedBy: null, reviewedAt: null, reviewComment: '', implementedAt: null, impactScore: null, likes: 0, comments: [], orgId: this.orgService.activeOrg().id };
        this.feedbacks.update(f => [newFb, ...f]);
        this.saveFeedbacks();
    }

    deleteFeedback(id: string): void {
        this.feedbacks.update(f => f.filter(x => x.id !== id));
        this.saveFeedbacks();
    }

    likeFeedback(id: string): void {
        this.feedbacks.update(f => f.map(x => x.id === id ? { ...x, likes: x.likes + 1 } : x));
        this.saveFeedbacks();
    }

    addComment(feedbackId: string, comment: Omit<FeedbackComment, 'id' | 'createdAt'>): void {
        const newComment: FeedbackComment = { ...comment, id: `c-${Date.now()}`, createdAt: new Date().toLocaleDateString('fa-IR') };
        this.feedbacks.update(f => f.map(x => x.id === feedbackId ? { ...x, comments: [...x.comments, newComment] } : x));
        this.saveFeedbacks();
    }

    getTypeLabel(t: FeedbackType): string {
        return { suggestion: 'پیشنهاد', complaint: 'گلایه', appreciation: 'قدردانی', report: 'گزارش', idea: 'ایده' }[t];
    }
    getStatusLabel(s: FeedbackStatus): string {
        return { submitted: 'ارسال شده', 'under-review': 'در حال بررسی', approved: 'تأیید شده', rejected: 'رد شده', implemented: 'اجرا شده', archived: 'بایگانی' }[s];
    }
    getPriorityLabel(p: FeedbackPriority): string {
        return { low: 'کم', medium: 'متوسط', high: 'بالا', urgent: 'فوری' }[p];
    }
    getCategoryLabel(c: FeedbackCategory): string {
        return { process: 'فرآیند', technology: 'فناوری', environment: 'محیط کار', hr: 'منابع انسانی', management: 'مدیریت', customer: 'مشتری', safety: 'ایمنی', other: 'سایر' }[c];
    }
    getTypeBadgeClass(t: FeedbackType): string {
        return { suggestion: 'bg-primary/10 text-primary', complaint: 'bg-danger/10 text-danger', appreciation: 'bg-success/10 text-success', report: 'bg-info/10 text-info', idea: 'bg-warning/10 text-warning' }[t];
    }
    getStatusBadgeClass(s: FeedbackStatus): string {
        return { submitted: 'bg-info/10 text-info', 'under-review': 'bg-warning/10 text-warning', approved: 'bg-success/10 text-success', rejected: 'bg-danger/10 text-danger', implemented: 'bg-primary/10 text-primary', archived: 'bg-muted/10 text-muted' }[s];
    }
    getPriorityBadgeClass(p: FeedbackPriority): string {
        return { low: 'bg-muted/10 text-muted', medium: 'bg-info/10 text-info', high: 'bg-warning/10 text-warning', urgent: 'bg-danger/10 text-danger' }[p];
    }
}
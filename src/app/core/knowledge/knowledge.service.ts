import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export type ArticleCategory = 'hr-policy' | 'technical' | 'onboarding' | 'compliance' | 'process' | 'faq' | 'news' | 'other';
export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface ArticleComment {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
}

export interface Article {
    id: string;
    title: string;
    summary: string;
    content: string;
    category: ArticleCategory;
    status: ArticleStatus;
    authorName: string;
    department: string;
    tags: string[];
    views: number;
    likes: number;
    comments: ArticleComment[];
    createdAt: string;
    updatedAt: string;
    orgId: string;
}

@Injectable({ providedIn: 'root' })
export class KnowledgeService {
    private readonly STORAGE_KEY = 'hrm24_knowledge_base';
    private orgService = inject(OrganizationService);

    articles = signal<Article[]>(this.loadArticles());

    stats = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const all = this.articles().filter(a => a.orgId === orgId);
        const published = all.filter(a => a.status === 'published');
        return {
            total: all.length,
            published: published.length,
            drafts: all.filter(a => a.status === 'draft').length,
            totalViews: published.reduce((s, a) => s + a.views, 0),
            totalLikes: published.reduce((s, a) => s + a.likes, 0),
            totalComments: published.reduce((s, a) => s + a.comments.length, 0),
            categories: [...new Set(published.map(a => a.category))].length
        };
    });

    publishedArticles = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        return this.articles().filter(a => a.status === 'published' && a.orgId === orgId);
    });

    popularArticles = computed(() => [...this.publishedArticles()].sort((a, b) => b.views - a.views).slice(0, 5));

    recentArticles = computed(() => [...this.publishedArticles()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));

    private loadArticles(): Article[] {
        if (typeof localStorage === 'undefined') return this.getDefaultArticles();
        try { const s = localStorage.getItem(this.STORAGE_KEY); return s ? JSON.parse(s) : this.getDefaultArticles(); } catch { return this.getDefaultArticles(); }
    }

    private saveArticles(): void { if (typeof localStorage !== 'undefined') try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.articles())); } catch { } }

    private getDefaultArticles(): Article[] {
        return [
            {
                id: 'art-1', title: 'راهنمای جامع مرخصی‌ها و قوانین سازمانی',
                summary: 'تمام قوانین مربوط به انواع مرخصی، نحوه درخواست و تأیید در این راهنما آمده است.',
                content: 'طبق قانون کار جمهوری اسلامی ایران، هر کارمند حق استفاده از ۲۶ روز مرخصی استحقاقی در سال را دارد...',
                category: 'hr-policy', status: 'published', authorName: 'واحد منابع انسانی', department: 'HR',
                tags: ['مرخصی', 'قانون کار', 'حقوق'], views: 342, likes: 45,
                comments: [{ id: 'c1', authorName: 'علی احمدی', content: 'بسیار مفید بود. ممنون.', createdAt: '1403/08/10' }],
                createdAt: '1403/06/01', updatedAt: '1403/07/15', orgId: 'org1'
            },
            {
                id: 'art-2', title: 'آشنایی با فرآیند Onboarding کارکنان جدید',
                summary: 'مراحل ورود کارکنان جدید به سازمان، مستندات مورد نیاز و چک‌لیست روز اول.',
                content: 'فرآیند آنبوردینگ شامل مراحل زیر است: ۱. تکمیل مدارک هویتی ۲. دریافت تجهیزات ۳. آشنایی با تیم...',
                category: 'onboarding', status: 'published', authorName: 'سارا محمدی', department: 'HR',
                tags: ['آنبوردینگ', 'ورود', 'کارمند جدید'], views: 218, likes: 32,
                comments: [], createdAt: '1403/05/20', updatedAt: '1403/06/10', orgId: 'org1'
            },
            {
                id: 'art-3', title: 'استانداردهای امنیتی و حفاظت از داده‌ها',
                summary: 'الزامات امنیتی سازمان، نحوه مدیریت رمز عبور و پروتکل‌های حفاظت از اطلاعات.',
                content: 'تمام کارکنان موظف به رعایت موارد زیر هستند: استفاده از رمز عبور قوی، عدم اشتراک‌گذاری حساب کاربری...',
                category: 'compliance', status: 'published', authorName: 'مهندس حسینی', department: 'امنیت اطلاعات',
                tags: ['امنیت', 'رمز عبور', 'GDPR'], views: 189, likes: 28,
                comments: [], createdAt: '1403/07/01', updatedAt: '1403/07/01', orgId: 'org1'
            },
            {
                id: 'art-4', title: 'راهنمای استفاده از سامانه HRM24',
                summary: 'آموزش کامل نحوه استفاده از تمام بخش‌های سامانه منابع انسانی.',
                content: 'سامانه HRM24 شامل بخش‌های داشبورد، وظایف، مرخصی، فیش حقوقی، آموزش و...',
                category: 'technical', status: 'published', authorName: 'تیم فنی', department: 'IT',
                tags: ['HRM24', 'راهنما', 'سامانه'], views: 456, likes: 67,
                comments: [{ id: 'c2', authorName: 'رضا کریمی', content: 'بخش آموزش عالی است!', createdAt: '1403/08/05' }],
                createdAt: '1403/04/15', updatedAt: '1403/08/01', orgId: 'org1'
            },
            {
                id: 'art-5', title: 'فرآیند ثبت و پیگیری تیکت پشتیبانی',
                summary: 'نحوه ثبت تیکت، سطوح اولویت و زمان پاسخگویی استاندارد.',
                content: 'برای ثبت تیکت به بخش تیکت‌ها مراجعه کنید. تیکت‌ها بر اساس اولویت پردازش می‌شوند...',
                category: 'process', status: 'published', authorName: 'واحد پشتیبانی', department: 'IT',
                tags: ['تیکت', 'پشتیبانی', 'فرآیند'], views: 134, likes: 19,
                comments: [], createdAt: '1403/06/20', updatedAt: '1403/06/20', orgId: 'org1'
            }
        ];
    }

    addArticle(article: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'comments' | 'orgId'>): void {
        const now = new Date().toLocaleDateString('fa-IR');
        const newArt: Article = { ...article, id: `art-${Date.now()}`, createdAt: now, updatedAt: now, views: 0, likes: 0, comments: [], orgId: this.orgService.activeOrg().id };
        this.articles.update(a => [newArt, ...a]);
        this.saveArticles();
    }

    updateArticle(id: string, updates: Partial<Article>): void {
        this.articles.update(a => a.map(x => x.id === id ? { ...x, ...updates, updatedAt: new Date().toLocaleDateString('fa-IR') } : x));
        this.saveArticles();
    }

    deleteArticle(id: string): void {
        this.articles.update(a => a.filter(x => x.id !== id));
        this.saveArticles();
    }

    incrementView(id: string): void {
        this.articles.update(a => a.map(x => x.id === id ? { ...x, views: x.views + 1 } : x));
        this.saveArticles();
    }

    likeArticle(id: string): void {
        this.articles.update(a => a.map(x => x.id === id ? { ...x, likes: x.likes + 1 } : x));
        this.saveArticles();
    }

    addComment(articleId: string, comment: Omit<ArticleComment, 'id' | 'createdAt'>): void {
        const newComment: ArticleComment = { ...comment, id: `c-${Date.now()}`, createdAt: new Date().toLocaleDateString('fa-IR') };
        this.articles.update(a => a.map(x => x.id === articleId ? { ...x, comments: [...x.comments, newComment] } : x));
        this.saveArticles();
    }

    getCategoryLabel(c: ArticleCategory): string {
        return { 'hr-policy': 'سیاست‌های HR', technical: 'فنی', onboarding: 'آنبوردینگ', compliance: 'انطباق', process: 'فرآیند', faq: 'سوالات متداول', news: 'اخبار', other: 'سایر' }[c];
    }
    getStatusLabel(s: ArticleStatus): string {
        return { draft: 'پیش‌نویس', published: 'منتشر شده', archived: 'بایگانی' }[s];
    }
    getCategoryBadgeClass(c: ArticleCategory): string {
        return { 'hr-policy': 'bg-primary/10 text-primary', technical: 'bg-info/10 text-info', onboarding: 'bg-success/10 text-success', compliance: 'bg-danger/10 text-danger', process: 'bg-warning/10 text-warning', faq: 'bg-muted/10 text-muted', news: 'bg-primary/10 text-primary', other: 'bg-muted/10 text-muted' }[c];
    }
    getStatusBadgeClass(s: ArticleStatus): string {
        return { draft: 'bg-muted/10 text-muted', published: 'bg-success/10 text-success', archived: 'bg-muted/10 text-muted' }[s];
    }
}
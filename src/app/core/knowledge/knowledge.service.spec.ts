import { TestBed } from '@angular/core/testing';
import { KnowledgeService } from './knowledge.service';

describe('KnowledgeService', () => {
    let service: KnowledgeService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(KnowledgeService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have default articles', () => {
        const articles = service.articles();
        expect(articles.length).toBeGreaterThan(0);
        expect(articles[0].title).toBeTruthy();
        expect(articles[0].content).toBeTruthy();
    });

    it('should return correct category labels', () => {
        expect(service.getCategoryLabel('hr-policy')).toBe('سیاست‌های HR');
        expect(service.getCategoryLabel('technical')).toBe('فنی');
        expect(service.getCategoryLabel('onboarding')).toBe('آنبوردینگ');
        expect(service.getCategoryLabel('compliance')).toBe('انطباق');
        expect(service.getCategoryLabel('process')).toBe('فرآیند');
        expect(service.getCategoryLabel('faq')).toBe('سوالات متداول');
    });

    it('should return correct status labels', () => {
        expect(service.getStatusLabel('draft')).toBe('پیش‌نویس');
        expect(service.getStatusLabel('published')).toBe('منتشر شده');
        expect(service.getStatusLabel('archived')).toBe('بایگانی');
    });

    it('should add article successfully', () => {
        const beforeCount = service.articles().length;
        service.addArticle({
            title: 'مقاله تست',
            summary: 'خلاصه تست',
            content: 'متن کامل تست',
            category: 'technical',
            status: 'published',
            authorName: 'تستر',
            department: 'IT',
            tags: ['تست']
        });
        expect(service.articles().length).toBe(beforeCount + 1);
        const newArticle = service.articles()[0];
        expect(newArticle.title).toBe('مقاله تست');
        expect(newArticle.views).toBe(0);
        expect(newArticle.likes).toBe(0);
    });

    it('should delete article', () => {
        const firstId = service.articles()[0].id;
        const beforeCount = service.articles().length;
        service.deleteArticle(firstId);
        expect(service.articles().length).toBe(beforeCount - 1);
        expect(service.articles().find(a => a.id === firstId)).toBeUndefined();
    });

    it('should increment view count', () => {
        const firstId = service.articles()[0].id;
        const viewsBefore = service.articles()[0].views;
        service.incrementView(firstId);
        const updated = service.articles().find(a => a.id === firstId);
        expect(updated!.views).toBe(viewsBefore + 1);
    });

    it('should like article', () => {
        const firstId = service.articles()[0].id;
        const likesBefore = service.articles()[0].likes;
        service.likeArticle(firstId);
        const updated = service.articles().find(a => a.id === firstId);
        expect(updated!.likes).toBe(likesBefore + 1);
    });

    it('should add comment to article', () => {
        const firstId = service.articles()[0].id;
        const commentsBefore = service.articles()[0].comments.length;
        service.addComment(firstId, { authorName: 'تستر', content: 'نظر تست' });
        const updated = service.articles().find(a => a.id === firstId);
        expect(updated!.comments.length).toBe(commentsBefore + 1);
        expect(updated!.comments[commentsBefore].content).toBe('نظر تست');
    });

    it('should update article', () => {
        const firstId = service.articles()[0].id;
        service.updateArticle(firstId, { title: 'عنوان جدید' });
        const updated = service.articles().find(a => a.id === firstId);
        expect(updated!.title).toBe('عنوان جدید');
        expect(updated!.updatedAt).toBeTruthy();
    });

    it('should filter published articles', () => {
        const published = service.publishedArticles();
        published.forEach(a => {
            expect(a.status).toBe('published');
        });
    });

    it('should sort popular articles by views', () => {
        const popular = service.popularArticles();
        for (let i = 1; i < popular.length; i++) {
            expect(popular[i - 1].views).toBeGreaterThanOrEqual(popular[i].views);
        }
    });

    it('should calculate stats correctly', () => {
        const stats = service.stats();
        expect(stats.total).toBeGreaterThan(0);
        expect(stats.published).toBeGreaterThanOrEqual(0);
        expect(stats.totalViews).toBeGreaterThanOrEqual(0);
        expect(stats.totalLikes).toBeGreaterThanOrEqual(0);
    });

    it('should persist data to localStorage', () => {
        service.addArticle({
            title: 'تست پایداری', summary: 'تست', content: 'تست',
            category: 'other', status: 'published', authorName: 'تست', department: 'تست', tags: []
        });
        const stored = localStorage.getItem('hrm24_knowledge_base');
        expect(stored).toBeTruthy();
        expect(JSON.parse(stored!).length).toBeGreaterThan(0);
    });
});
import { TestBed } from '@angular/core/testing';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
    let service: FeedbackService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(FeedbackService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have default feedbacks', () => {
        const feedbacks = service.feedbacks();
        expect(feedbacks.length).toBeGreaterThan(0);
    });

    it('should return correct type labels', () => {
        expect(service.getTypeLabel('suggestion')).toBe('پیشنهاد');
        expect(service.getTypeLabel('complaint')).toBe('گلایه');
        expect(service.getTypeLabel('appreciation')).toBe('قدردانی');
        expect(service.getTypeLabel('idea')).toBe('ایده');
        expect(service.getTypeLabel('report')).toBe('گزارش');
    });

    it('should return correct status labels', () => {
        expect(service.getStatusLabel('submitted')).toBe('ارسال شده');
        expect(service.getStatusLabel('under-review')).toBe('در حال بررسی');
        expect(service.getStatusLabel('approved')).toBe('تأیید شده');
        expect(service.getStatusLabel('implemented')).toBe('اجرا شده');
        expect(service.getStatusLabel('rejected')).toBe('رد شده');
    });

    it('should return correct priority labels', () => {
        expect(service.getPriorityLabel('low')).toBe('کم');
        expect(service.getPriorityLabel('medium')).toBe('متوسط');
        expect(service.getPriorityLabel('high')).toBe('بالا');
        expect(service.getPriorityLabel('urgent')).toBe('فوری');
    });

    it('should add feedback successfully', () => {
        const beforeCount = service.feedbacks().length;
        service.addFeedback({
            title: 'تست بازخورد',
            description: 'شرح تست',
            type: 'suggestion',
            category: 'process',
            priority: 'medium',
            status: 'submitted',
            submitterId: 'emp-test',
            submitterName: 'تستر',
            department: 'IT',
            tags: [],
            anonymous: false
        });
        expect(service.feedbacks().length).toBe(beforeCount + 1);
        const newFb = service.feedbacks()[0];
        expect(newFb.title).toBe('تست بازخورد');
        expect(newFb.likes).toBe(0);
        expect(newFb.comments.length).toBe(0);
    });

    it('should delete feedback', () => {
        const firstId = service.feedbacks()[0].id;
        const beforeCount = service.feedbacks().length;
        service.deleteFeedback(firstId);
        expect(service.feedbacks().length).toBe(beforeCount - 1);
    });

    it('should like feedback', () => {
        const firstId = service.feedbacks()[0].id;
        const likesBefore = service.feedbacks()[0].likes;
        service.likeFeedback(firstId);
        const updated = service.feedbacks().find(f => f.id === firstId);
        expect(updated!.likes).toBe(likesBefore + 1);
    });

    it('should add comment to feedback', () => {
        const firstId = service.feedbacks()[0].id;
        const commentsBefore = service.feedbacks()[0].comments.length;
        service.addComment(firstId, { authorName: 'تستر', authorRole: 'کارمند', content: 'نظر تست' });
        const updated = service.feedbacks().find(f => f.id === firstId);
        expect(updated!.comments.length).toBe(commentsBefore + 1);
    });

    it('should filter my feedbacks', () => {
        const myFbs = service.myFeedbacks();
        myFbs.forEach(f => {
            expect(f.submitterId).toBe('emp-current');
        });
    });

    it('should sort top ideas by likes', () => {
        const top = service.topIdeas();
        for (let i = 1; i < top.length; i++) {
            expect(top[i - 1].likes).toBeGreaterThanOrEqual(top[i].likes);
        }
    });

    it('should calculate stats correctly', () => {
        const stats = service.stats();
        expect(stats.total).toBeGreaterThan(0);
        expect(stats.totalLikes).toBeGreaterThanOrEqual(0);
        expect(stats.suggestions).toBeGreaterThanOrEqual(0);
    });

    it('should persist data to localStorage after modification', () => {
        service.likeFeedback(service.feedbacks()[0].id);
        const stored = localStorage.getItem('hrm24_feedbacks');
        expect(stored).toBeTruthy();
    });
});
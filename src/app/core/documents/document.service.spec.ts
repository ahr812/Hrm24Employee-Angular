import { TestBed } from '@angular/core/testing';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
    let service: DocumentService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(DocumentService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have default documents', () => {
        const docs = service.documents();
        expect(docs.length).toBeGreaterThan(0);
    });

    it('should return correct category labels', () => {
        expect(service.getCategoryLabel('contract')).toBe('قرارداد');
        expect(service.getCategoryLabel('certificate')).toBe('گواهینامه');
        expect(service.getCategoryLabel('payslip')).toBe('فیش حقوقی');
        expect(service.getCategoryLabel('identity')).toBe('مدارک هویتی');
        expect(service.getCategoryLabel('medical')).toBe('پزشکی');
        expect(service.getCategoryLabel('educational')).toBe('تحصیلی');
    });

    it('should return correct status labels', () => {
        expect(service.getStatusLabel('active')).toBe('فعال');
        expect(service.getStatusLabel('expired')).toBe('منقضی');
        expect(service.getStatusLabel('pending-review')).toBe('در انتظار بررسی');
    });

    it('should format file size correctly', () => {
        expect(service.formatFileSize(500)).toBe('500 B');
        expect(service.formatFileSize(1024)).toBe('1.0 KB');
        expect(service.formatFileSize(1048576)).toBe('1.0 MB');
        expect(service.formatFileSize(245000)).toContain('KB');
    });

    it('should add document successfully', () => {
        const beforeCount = service.documents().length;
        service.addDocument({
            title: 'سند تست',
            description: 'توضیح تست',
            category: 'other',
            status: 'active',
            fileName: 'test.pdf',
            fileSize: 1000,
            fileType: 'application/pdf',
            uploadDate: '1403/09/01',
            expiryDate: null,
            tags: ['تست']
        });
        expect(service.documents().length).toBe(beforeCount + 1);
        expect(service.documents()[0].title).toBe('سند تست');
    });

    it('should delete document', () => {
        const firstId = service.documents()[0].id;
        const beforeCount = service.documents().length;
        service.deleteDocument(firstId);
        expect(service.documents().length).toBe(beforeCount - 1);
    });

    it('should update document', () => {
        const firstId = service.documents()[0].id;
        service.updateDocument(firstId, { title: 'عنوان جدید' });
        const updated = service.documents().find(d => d.id === firstId);
        expect(updated!.title).toBe('عنوان جدید');
    });

    it('should calculate stats correctly', () => {
        const stats = service.stats();
        expect(stats.total).toBeGreaterThan(0);
        expect(stats.active).toBeGreaterThanOrEqual(0);
        expect(stats.expired).toBeGreaterThanOrEqual(0);
    });

    it('should detect expiring soon documents', () => {
        const docs = service.documents();
        const expiringDoc = docs.find(d => d.expiryDate && d.status !== 'expired');
        if (expiringDoc) {
            const result = service.isExpiringSoon(expiringDoc);
            expect(typeof result).toBe('boolean');
        }
    });

    it('should calculate days until expiry', () => {
        const docWithExpiry = service.documents().find(d => d.expiryDate !== null);
        if (docWithExpiry) {
            const days = service.getDaysUntilExpiry(docWithExpiry);
            expect(days).not.toBeNull();
            expect(typeof days).toBe('number');
        }
    });

    it('should return null for documents without expiry', () => {
        const docWithoutExpiry = service.documents().find(d => d.expiryDate === null);
        if (docWithoutExpiry) {
            const days = service.getDaysUntilExpiry(docWithoutExpiry);
            expect(days).toBeNull();
        }
    });

    it('should persist data to localStorage after modification', () => {
        service.addDocument({
            title: 'تست پایداری', description: 'تست', category: 'other', status: 'active',
            fileName: 'test.pdf', fileSize: 100, fileType: 'pdf', uploadDate: '1403/09/01',
            expiryDate: null, tags: []
        });
        const stored = localStorage.getItem('hrm24_documents');
        expect(stored).toBeTruthy();
    });
});
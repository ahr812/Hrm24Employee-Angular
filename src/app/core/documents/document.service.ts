import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export type DocumentCategory = 'contract' | 'certificate' | 'payslip' | 'identity' | 'medical' | 'educational' | 'other';
export type DocumentStatus = 'active' | 'expired' | 'pending-review';

export interface AppDocument {
    id: string;
    title: string;
    description: string;
    category: DocumentCategory;
    status: DocumentStatus;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadDate: string;
    expiryDate: string | null;
    tags: string[];
    orgId: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
    private readonly STORAGE_KEY = 'hrm24_documents';
    private orgService = inject(OrganizationService);

    documents = signal<AppDocument[]>(this.loadDocuments());

    filteredDocuments = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        return this.documents().filter(d => d.orgId === orgId);
    });

    stats = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const all = this.documents().filter(d => d.orgId === orgId);
        return {
            total: all.length,
            active: all.filter(d => d.status === 'active').length,
            expired: all.filter(d => d.status === 'expired').length,
            pendingReview: all.filter(d => d.status === 'pending-review').length,
            expiringSoon: all.filter(d => this.isExpiringSoon(d)).length
        };
    });

    private loadDocuments(): AppDocument[] {
        if (typeof localStorage === 'undefined') return this.getDefaultDocuments();
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : this.getDefaultDocuments();
        } catch {
            return this.getDefaultDocuments();
        }
    }

    private saveDocuments(): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.documents()));
        } catch (error) {
            console.error('Error saving documents:', error);
        }
    }

    private getDefaultDocuments(): AppDocument[] {
        return [
            {
                id: 'doc-1', title: 'قرارداد کاری سال ۱۴۰۳', description: 'قرارداد رسمی همکاری با شرکت HRM24',
                category: 'contract', status: 'active', fileName: 'contract-1403.pdf', fileSize: 245000,
                fileType: 'application/pdf', uploadDate: '1403/01/15', expiryDate: '1403/12/29',
                tags: ['قرارداد', 'رسمی'], orgId: 'org1'
            },
            {
                id: 'doc-2', title: 'گواهی عدم سوءپیشینه', description: 'گواهی صادره از نیروی انتظامی',
                category: 'identity', status: 'active', fileName: 'no-criminal-record.pdf', fileSize: 180000,
                fileType: 'application/pdf', uploadDate: '1403/02/10', expiryDate: '1403/08/10',
                tags: ['هویت', 'گواهی'], orgId: 'org1'
            },
            {
                id: 'doc-3', title: 'مدرک لیسانس کامپیوتر', description: 'دانشگاه تهران - دانشکده فنی',
                category: 'educational', status: 'active', fileName: 'bs-computer.pdf', fileSize: 520000,
                fileType: 'application/pdf', uploadDate: '1403/01/20', expiryDate: null,
                tags: ['تحصیلی', 'مدرک'], orgId: 'org1'
            },
            {
                id: 'doc-4', title: 'فیش حقوقی مهر ۱۴۰۳', description: 'فیش حقوقی ماه مهر',
                category: 'payslip', status: 'active', fileName: 'payslip-mehr-1403.pdf', fileSize: 95000,
                fileType: 'application/pdf', uploadDate: '1403/07/30', expiryDate: null,
                tags: ['حقوق', 'فیش'], orgId: 'org1'
            },
            {
                id: 'doc-5', title: 'گواهی پزشکی معاینه دوره‌ای', description: 'معاینه طب کار - منقضی شده',
                category: 'medical', status: 'expired', fileName: 'medical-checkup.pdf', fileSize: 310000,
                fileType: 'application/pdf', uploadDate: '1402/06/15', expiryDate: '1403/06/15',
                tags: ['پزشکی', 'طب کار'], orgId: 'org1'
            }
        ];
    }

    addDocument(doc: Omit<AppDocument, 'id' | 'orgId'>): void {
        const newDoc: AppDocument = {
            ...doc,
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            orgId: this.orgService.activeOrg().id
        };
        this.documents.update(current => [newDoc, ...current]);
        this.saveDocuments();
    }

    deleteDocument(id: string): void {
        this.documents.update(current => current.filter(d => d.id !== id));
        this.saveDocuments();
    }

    updateDocument(id: string, updates: Partial<AppDocument>): void {
        this.documents.update(current =>
            current.map(d => d.id === id ? { ...d, ...updates } : d)
        );
        this.saveDocuments();
    }

    getCategoryLabel(category: DocumentCategory): string {
        const labels: Record<DocumentCategory, string> = {
            contract: 'قرارداد', certificate: 'گواهینامه', payslip: 'فیش حقوقی',
            identity: 'مدارک هویتی', medical: 'پزشکی', educational: 'تحصیلی', other: 'سایر'
        };
        return labels[category];
    }

    getStatusLabel(status: DocumentStatus): string {
        const labels: Record<DocumentStatus, string> = {
            active: 'فعال', expired: 'منقضی', 'pending-review': 'در انتظار بررسی'
        };
        return labels[status];
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    isExpiringSoon(doc: AppDocument): boolean {
        if (!doc.expiryDate || doc.status === 'expired') return false;
        const now = new Date();
        const expiry = new Date(doc.expiryDate);
        const diff = expiry.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 && days <= 30;
    }

    getDaysUntilExpiry(doc: AppDocument): number | null {
        if (!doc.expiryDate) return null;
        const now = new Date();
        const expiry = new Date(doc.expiryDate);
        const diff = expiry.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
}
import { Injectable, signal } from '@angular/core';

export type DocumentPageValidationError =
  | 'no-mobile-marker'
  | 'multiple-mobile-markers'
  | 'duplicate-mobile';

export interface EmployerDocumentPageReview {
  readonly pageNumber: number;
  readonly mobile?: string;
  readonly error?: DocumentPageValidationError;
}

export interface EmployerDocumentReviewState {
  readonly documentTitle: string;
  readonly companyId: number;
  readonly companyName: string;
  readonly fileName: string;
  readonly hostingOptionId: string;
  readonly hostingLabel: string;
  readonly expirationPreview: string;
  readonly processingMode: 'frontend-preview';
  readonly pageResults: readonly EmployerDocumentPageReview[];
}

export interface EmployerDocumentReviewInput {
  readonly documentTitle: string;
  readonly companyId: number;
  readonly companyName: string;
  readonly fileName: string;
  readonly hostingOptionId: string;
  readonly hostingLabel: string;
  readonly expirationPreview: string;
}

export const DOCUMENT_PAGE_ERROR_LABELS: Readonly<Record<DocumentPageValidationError, string>> = {
  'no-mobile-marker': 'نشانگر موبایل در صفحه پیدا نشد.',
  'multiple-mobile-markers': 'بیش از یک نشانگر موبایل در صفحه پیدا شد.',
  'duplicate-mobile': 'شماره موبایل این صفحه در صفحه دیگری تکرار شده است.'
};

@Injectable({ providedIn: 'root' })
export class EmployerDocumentWorkflowService {
  private readonly reviewStateSignal = signal<EmployerDocumentReviewState | null>(null);

  readonly reviewState = this.reviewStateSignal.asReadonly();

  prepareFrontendPreview(input: EmployerDocumentReviewInput): void {
    this.reviewStateSignal.set({
      ...input,
      processingMode: 'frontend-preview',
      pageResults: this.createValidFrontendPreview()
    });
  }

  clear(): void {
    this.reviewStateSignal.set(null);
  }

  private createValidFrontendPreview(): readonly EmployerDocumentPageReview[] {
    return [
      { pageNumber: 1, mobile: '09120000011' },
      { pageNumber: 2, mobile: '09120000022' },
      { pageNumber: 3, mobile: '09120000033' }
    ];
  }
}

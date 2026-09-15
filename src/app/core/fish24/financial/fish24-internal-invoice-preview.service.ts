import { Injectable, computed } from '@angular/core';
import { EmployerInvoicePreview, Fish24FormalInvoiceSource, isLegacyFormalInvoice } from '../../../features/fish24/employer/invoices/employer-invoice-preview.data';
import { Fish24FinancialPreviewService, normalizeFish24Digits } from './fish24-financial-preview.service';
import { Fish24TransactionPreviewService, FormalInvoiceOperationResult } from './fish24-transaction-preview.service';
import { Fish24WalletPreviewService } from './fish24-wallet-preview.service';

export interface InternalFormalInvoiceListItem {
  readonly sourceIdentity: string;
  readonly formalInvoiceNumber: string;
  readonly issueDate: string | null;
  readonly mobile: string | null;
  readonly name: string | null;
  readonly companyName: string | null;
  readonly userType: 'حقیقی' | 'حقوقی' | null;
  readonly title: string | null;
  readonly amountRial: number;
  readonly linkedTransactionId: string | null;
  readonly printableInvoiceId: number | null;
  readonly deletionEligible: boolean;
  readonly sourceKind: 'current' | 'legacy';
  readonly originalSource: Fish24FormalInvoiceSource;
}

export function normalizedFormalNumber(value: string): string | null {
  const normalized = normalizeFish24Digits(value).trim();
  return /^\d+$/.test(normalized) ? normalized : null;
}

export function compareFormalNumbers(left: string, right: string): number {
  const normalizedLeft = normalizedFormalNumber(left);
  const normalizedRight = normalizedFormalNumber(right);
  if (!normalizedLeft || !normalizedRight) return left.localeCompare(right, 'fa', { numeric: false });
  const significantLeft = normalizedLeft.replace(/^0+(?=\d)/, '');
  const significantRight = normalizedRight.replace(/^0+(?=\d)/, '');
  if (significantLeft.length !== significantRight.length) return significantLeft.length - significantRight.length;
  return significantLeft.localeCompare(significantRight, 'en', { numeric: false });
}

@Injectable({ providedIn: 'root' })
export class Fish24InternalInvoicePreviewService {
  readonly invoices = computed<readonly InternalFormalInvoiceListItem[]>(() => this.financial.formalInvoiceSources()
    .map(source => this.normalize(source))
    .filter((item): item is InternalFormalInvoiceListItem => item !== null));

  constructor(
    private readonly financial: Fish24FinancialPreviewService,
    private readonly wallets: Fish24WalletPreviewService,
    private readonly transactions: Fish24TransactionPreviewService
  ) {}

  find(sourceIdentity: string): InternalFormalInvoiceListItem | null {
    return this.invoices().find(invoice => invoice.sourceIdentity === sourceIdentity) ?? null;
  }

  deleteManualInvoice(sourceIdentity: string): FormalInvoiceOperationResult {
    const invoice = this.find(sourceIdentity);
    if (!invoice) return { ok: false, existing: false, error: 'not-found' };
    if (!invoice.deletionEligible || !invoice.linkedTransactionId) {
      return { ok: false, existing: false, error: 'automatic-transaction' };
    }
    return this.transactions.deleteFormalInvoice(invoice.linkedTransactionId);
  }

  private normalize(source: Fish24FormalInvoiceSource): InternalFormalInvoiceListItem | null {
    if (isLegacyFormalInvoice(source)) {
      const number = source.formalInvoiceNumber?.trim();
      if (!number) return null;
      return {
        sourceIdentity: source.legacyId,
        formalInvoiceNumber: number,
        issueDate: source.issueDate,
        mobile: source.mobile,
        name: source.name,
        companyName: source.companyName,
        userType: source.userType,
        title: source.title,
        amountRial: source.amountRial,
        linkedTransactionId: null,
        printableInvoiceId: null,
        deletionEligible: false,
        sourceKind: 'legacy',
        originalSource: source
      };
    }
    return this.normalizeCurrent(source);
  }

  private normalizeCurrent(source: EmployerInvoicePreview): InternalFormalInvoiceListItem | null {
    const number = source.invoiceNumber.trim();
    if (!number) return null;
    const transaction = this.wallets.transactions().find(item =>
      item.formalInvoiceId === source.id || item.formalInvoiceNumber === source.invoiceNumber
    );
    return {
      sourceIdentity: `current-${source.id}`,
      formalInvoiceNumber: number,
      issueDate: source.issuedAt || null,
      mobile: transaction?.mobile || null,
      name: transaction?.fullName || null,
      companyName: transaction?.companyName || null,
      userType: transaction?.userType ?? null,
      title: source.title || null,
      amountRial: source.amountRial,
      linkedTransactionId: transaction?.id ?? null,
      printableInvoiceId: source.id,
      deletionEligible: transaction?.origin === 'manual',
      sourceKind: 'current',
      originalSource: source
    };
  }
}

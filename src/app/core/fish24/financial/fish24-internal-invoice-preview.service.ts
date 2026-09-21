import { Injectable, computed } from '@angular/core';
import { EmployerInvoicePreview, Fish24FormalInvoiceSource, isLegacyFormalInvoice } from '../../../features/fish24/employer/invoices/employer-invoice-preview.data';
import { Fish24FinancialPreviewService, normalizeFish24Digits } from './fish24-financial-preview.service';
import { Fish24TransactionPreviewService, FormalInvoiceOperationResult } from './fish24-transaction-preview.service';
import { Fish24WalletPreviewService } from './fish24-wallet-preview.service';
import { BusinessUserPreviewService, BusinessUserRecord } from '../../../features/fish24/internal/users/business-user-preview.service';

export interface InternalFormalInvoiceListItem {
  readonly sourceIdentity: string;
  readonly formalInvoiceNumber: string;
  readonly employerId: string;
  readonly issueDate: string;
  readonly mobile: string;
  readonly name: string | null;
  readonly companyName: string | null;
  readonly userType: 'حقیقی' | 'حقوقی' | null;
  readonly title: string | null;
  readonly amountRial: number;
  readonly baseAmountRial: number;
  readonly taxAmountRial: number;
  readonly voucherEligibility: 'credit' | 'debit' | 'unknown';
  readonly voucherAmountRial: number;
  readonly voucherDate: string;
  readonly trackingIdentifier: string | null;
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
    private readonly transactions: Fish24TransactionPreviewService,
    private readonly users: BusinessUserPreviewService
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
      if (!number || !source.issueDate) return null;
      const employer = this.requireEmployer(source.employerId, source.legacyId);
      return {
        sourceIdentity: source.legacyId,
        employerId: source.employerId,
        formalInvoiceNumber: number,
        issueDate: source.issueDate,
        mobile: employer.mobile,
        name: employer.fullName,
        companyName: employer.companyName,
        userType: employer.userType,
        title: source.title,
        amountRial: source.amountRial,
        baseAmountRial: source.baseAmountRial,
        taxAmountRial: source.taxAmountRial,
        voucherEligibility: source.accountingVoucherProvenance,
        voucherAmountRial: source.amountRial,
        voucherDate: source.issueDate,
        trackingIdentifier: source.trackingNumber,
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
    const employer = this.requireEmployer(source.employerId, `current-${source.id}`);
    const transaction = this.wallets.transactions().find(item =>
      item.formalInvoiceId === source.id || item.formalInvoiceNumber === source.invoiceNumber
    );
    return {
      sourceIdentity: `current-${source.id}`,
      employerId: source.employerId,
      formalInvoiceNumber: number,
      issueDate: source.issuedAt,
      mobile: employer.mobile,
      name: employer.fullName,
      companyName: employer.companyName,
      userType: employer.userType,
      title: source.title || null,
      amountRial: source.amountRial,
      baseAmountRial: source.line.afterDiscountAmountRial,
      taxAmountRial: source.line.taxAmountRial,
      voucherEligibility: transaction?.direction ?? source.accountingVoucherProvenance,
      voucherAmountRial: transaction?.amountRial ?? source.amountRial,
      voucherDate: transaction?.createdAt.slice(0, 10) ?? source.issuedAt,
      trackingIdentifier: transaction?.trackingCode?.trim() || source.trackingNumber,
      linkedTransactionId: transaction?.id ?? null,
      printableInvoiceId: source.id,
      deletionEligible: transaction?.origin === 'manual',
      sourceKind: 'current',
      originalSource: source
    };
  }

  private requireEmployer(employerId: string, invoiceIdentity: string): BusinessUserRecord {
    const numericId = Number(employerId);
    const employer = Number.isSafeInteger(numericId) ? this.users.findUser(numericId) : null;
    if (!employer || !employer.roles.includes('employer') || !/^09\d{9}$/.test(employer.mobile)) {
      throw new Error(`Invoice ${invoiceIdentity} has no authoritative current employer profile.`);
    }
    return employer;
  }
}

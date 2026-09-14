import { Injectable, computed, inject, signal } from '@angular/core';
import { DocumentPricingDurationMonths, Fish24DocumentPricingPreviewService, InternalDocumentReceipt } from './fish24-document-pricing-preview.service';
import { Fish24RolePreviewService } from '../dev/fish24-role-preview.service';
import { Fish24WalletPreviewService, Fish24WalletTransaction } from './fish24-wallet-preview.service';
import { Fish24PermissionService } from '../permissions/fish24-permission.service';
import { FISH24_PERMISSIONS } from '../permissions/fish24-permissions';

export type Fish24SendUserType = 'حقیقی' | 'حقوقی';

export interface Fish24DocumentSend {
  readonly id: string;
  readonly createdAt: string;
  readonly employerId: string;
  readonly employerName: string;
  readonly employerMobile: string;
  readonly companyId: number;
  readonly companyName: string;
  readonly title: string;
  readonly expiresAt: string;
  readonly durationMonths: DocumentPricingDurationMonths;
  readonly userType: Fish24SendUserType;
  readonly hasFreeCredit: boolean;
  readonly pageCount: number;
  readonly smsEnabled: boolean;
  readonly recipientMobiles: readonly string[];
  readonly sourceFileName: string;
  readonly sourceFile: Blob | null;
  readonly isPaid: boolean;
  readonly paidAmountRial: number | null;
  readonly employeeAccessActive: boolean;
}

export interface Fish24DocumentSendInput extends Omit<Fish24DocumentSend, 'isPaid' | 'paidAmountRial' | 'employeeAccessActive'> {}

export interface Fish24DistributionResult {
  readonly ok: boolean;
  readonly existing: boolean;
  readonly send?: Fish24DocumentSend;
  readonly receipt?: InternalDocumentReceipt;
  readonly transaction?: Fish24WalletTransaction;
  readonly error?: 'not-found' | 'forbidden' | 'already-paid' | 'invalid-distribution' | 'receipt-unavailable' | 'wallet-not-found' | 'insufficient-funds' | 'invalid-amount';
}

const SEEDS: readonly Fish24DocumentSendInput[] = [
  { id: '2001', createdAt: '1405/06/20', employerId: '1001', employerName: 'مریم احمدی', employerMobile: '09121234567', companyId: 101, companyName: 'مجموعه نمونه سپهر', title: 'فیش حقوق مرداد ۱۴۰۵', expiresAt: '1405/09/20', durationMonths: 3, userType: 'حقوقی', hasFreeCredit: false, pageCount: 3, smsEnabled: true, recipientMobiles: ['09123456789', '09120000022', '09120000033'], sourceFileName: 'payslip-1405-05.pdf', sourceFile: null },
  { id: '2002', createdAt: '1405/06/18', employerId: '1002', employerName: 'رضا کریمی', employerMobile: '09129876543', companyId: 102, companyName: 'مجموعه آزمایشی باران', title: 'گواهی پرداخت پاداش', expiresAt: '1405/07/18', durationMonths: 1, userType: 'حقوقی', hasFreeCredit: true, pageCount: 2, smsEnabled: true, recipientMobiles: ['09123456789', '09120000044'], sourceFileName: 'bonus-certificate.pdf', sourceFile: null },
  { id: '2003', createdAt: '1405/06/16', employerId: '1001', employerName: 'مریم احمدی', employerMobile: '09121234567', companyId: 101, companyName: 'مجموعه نمونه سپهر', title: 'فیش حقوق تیر ۱۴۰۵', expiresAt: '1405/07/16', durationMonths: 1, userType: 'حقوقی', hasFreeCredit: false, pageCount: 4, smsEnabled: true, recipientMobiles: ['09123456789', '09120000055', '09120000066', '09120000077'], sourceFileName: 'payslip-1405-04.pdf', sourceFile: null },
  { id: '2004', createdAt: '1405/06/12', employerId: '1007', employerName: 'حامد اکبری', employerMobile: '09123334455', companyId: 103, companyName: 'مجموعه نمایشی نارنج', title: 'صورت‌حساب همکاری', expiresAt: '1406/06/12', durationMonths: 12, userType: 'حقوقی', hasFreeCredit: false, pageCount: 2, smsEnabled: true, recipientMobiles: ['09123456789', '09120000088'], sourceFileName: 'cooperation-statement.pdf', sourceFile: null },
  { id: '2006', createdAt: '1405/06/12', employerId: 'user-1', employerName: 'علی احمدی', employerMobile: '09123456789', companyId: 103, companyName: 'مجموعه نمایشی نارنج', title: 'پیش‌نمایش پرداخت شهریور', expiresAt: '1405/07/12', durationMonths: 1, userType: 'حقیقی', hasFreeCredit: false, pageCount: 3, smsEnabled: true, recipientMobiles: ['09120000011', '09120000022', '09120000033'], sourceFileName: 'preview-shahrivar.pdf', sourceFile: null }
];

@Injectable({ providedIn: 'root' })
export class Fish24DocumentDistributionPreviewService {
  private readonly pricing = inject(Fish24DocumentPricingPreviewService);
  private readonly wallets = inject(Fish24WalletPreviewService);
  private readonly roles = inject(Fish24RolePreviewService);
  private readonly permissions = inject(Fish24PermissionService);
  private readonly sendsState = signal<readonly Fish24DocumentSend[]>(SEEDS.map((seed, index) => ({
    ...seed,
    isPaid: index < 4,
    paidAmountRial: null,
    employeeAccessActive: index < 4
  })));
  private readonly inFlight = new Set<string>();

  readonly sends = this.sendsState.asReadonly();
  readonly transactions = this.wallets.transactions;
  readonly receipts = this.pricing.internalReceipts;
  readonly paidSends = computed(() => this.sendsState().filter(send => send.isPaid));

  constructor() {
    for (const send of this.sendsState()) {
      const receipt = this.pricing.createInternalReceipt(this.receiptInput(send)).receipt;
      if (send.isPaid && receipt) this.updateSend(send.id, { paidAmountRial: receipt.breakdown.totalRial });
    }
  }

  findSend(id: string): Fish24DocumentSend | null { return this.sendsState().find(send => send.id === id) ?? null; }
  receiptFor(id: string): InternalDocumentReceipt | null { return this.pricing.findInternalReceipt(id); }
  walletBalance(employerId: string): number | null { return this.wallets.balance(employerId); }

  registerUnpaidSend(input: Fish24DocumentSendInput): Fish24DistributionResult {
    const existing = this.findSend(input.id);
    if (existing) return { ok: true, existing: true, send: existing, receipt: this.receiptFor(input.id) ?? undefined };
    if (!this.validDistribution(input)) return { ok: false, existing: false, error: 'invalid-distribution' };
    const receiptResult = this.pricing.createInternalReceipt(this.receiptInput(input));
    if (!receiptResult.ok || !receiptResult.receipt) return { ok: false, existing: false, error: 'receipt-unavailable' };
    const send: Fish24DocumentSend = { ...input, isPaid: false, paidAmountRial: null, employeeAccessActive: false };
    this.sendsState.update(sends => [send, ...sends]);
    return { ok: true, existing: false, send, receipt: receiptResult.receipt };
  }

  confirmPayment(id: string): Fish24DistributionResult {
    if (!this.hasFinancialPermission()) return { ok: false, existing: false, error: 'forbidden' };
    const send = this.findSend(id);
    if (!send) return { ok: false, existing: false, error: 'not-found' };
    if (send.isPaid) return { ok: true, existing: true, send, receipt: this.receiptFor(id) ?? undefined, transaction: this.wallets.transactions().find(item => item.operationId === id) };
    if (this.inFlight.has(id)) return { ok: false, existing: false, error: 'already-paid' };
    if (!this.validDistribution(send)) return { ok: false, existing: false, error: 'invalid-distribution' };
    const receipt = this.receiptFor(id);
    if (!receipt) return { ok: false, existing: false, error: 'receipt-unavailable' };
    this.inFlight.add(id);
    try {
      const debit = this.wallets.debitDocumentDistribution(send.employerId, id, receipt.breakdown.totalRial, this.currentJalaliTimestamp());
      if (!debit.ok) return { ok: false, existing: false, error: debit.error };
      this.updateSend(id, { isPaid: true, paidAmountRial: debit.transaction!.amountRial, employeeAccessActive: true });
      return { ok: true, existing: debit.existing, send: this.findSend(id)!, receipt, transaction: debit.transaction };
    } finally {
      this.inFlight.delete(id);
    }
  }

  deleteUnpaid(id: string): boolean {
    const send = this.findSend(id);
    if (!send || send.isPaid || !this.hasFinancialPermission()) return false;
    this.sendsState.update(sends => sends.filter(item => item.id !== id));
    this.pricing.removeInternalReceipt(id);
    return true;
  }

  setEmployeeAccess(id: string, active: boolean): boolean {
    const send = this.findSend(id);
    if (!send?.isPaid || !this.hasFinancialPermission()) return false;
    this.updateSend(id, { employeeAccessActive: active });
    return true;
  }

  accessibleForEmployee(mobile: string, today: string): readonly Fish24DocumentSend[] {
    return this.sendsState().filter(send => send.isPaid && send.employeeAccessActive && send.expiresAt >= today && send.recipientMobiles.includes(mobile));
  }

  private hasFinancialPermission(): boolean {
    return this.permissions.hasAnyPermission(this.roles.getPreviewRoles(), [
      FISH24_PERMISSIONS.financialManagement,
      FISH24_PERMISSIONS.employerOutgoingDocuments
    ]);
  }

  private validDistribution(send: Fish24DocumentSendInput | Fish24DocumentSend): boolean {
    return Boolean(send.id.trim() && send.employerId.trim() && send.companyId && send.title.trim() && send.pageCount > 0 && send.recipientMobiles.length === send.pageCount && send.recipientMobiles.every(mobile => /^09\d{9}$/.test(mobile)));
  }

  private receiptInput(send: Fish24DocumentSendInput | Fish24DocumentSend) {
    return { sourceOperationId: send.id, issueDate: send.createdAt, pageCount: send.pageCount, durationMonths: send.durationMonths, smsEnabled: true } as const;
  }

  private updateSend(id: string, changes: Partial<Fish24DocumentSend>): void {
    this.sendsState.update(sends => sends.map(send => send.id === id ? { ...send, ...changes } : send));
  }

  private currentJalaliTimestamp(): string {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? '';
    return `${value('year')}/${value('month')}/${value('day')} ${value('hour')}:${value('minute')}`;
  }
}

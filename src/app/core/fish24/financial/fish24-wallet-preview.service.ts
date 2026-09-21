import { Injectable, signal } from '@angular/core';
import { normalizeFish24Digits } from './fish24-financial-preview.service';

export type Fish24TransactionDirection = 'debit' | 'credit';
export type Fish24TransactionOrigin = 'manual' | 'wallet-top-up' | 'document-distribution';
export type Fish24TransactionStatus = 'success' | 'failed';

export interface Fish24WalletRecord { readonly employerId: string; readonly balanceRial: number; }

export interface Fish24WalletTransaction {
  readonly id: string; readonly employerId: string; readonly operationId: string; readonly createdAt: string;
  readonly amountRial: number; readonly balanceAfterRial: number; readonly direction: Fish24TransactionDirection;
  readonly origin: Fish24TransactionOrigin; readonly status: Fish24TransactionStatus; readonly mobile: string;
  readonly fullName: string; readonly companyName: string; readonly workplaceName: string; readonly trackingCode: string;
  readonly userType: 'حقیقی' | 'حقوقی'; readonly description: string; readonly formalInvoiceId: number | null;
  readonly formalInvoiceNumber: string | null;
}

export interface Fish24ManualTransactionInput {
  readonly requestId: string; readonly employerId: string; readonly mobile: string; readonly fullName: string;
  readonly companyName: string; readonly workplaceName: string; readonly userType: 'حقیقی' | 'حقوقی';
  readonly amountRial: string; readonly direction: Fish24TransactionDirection; readonly createdAt: string;
}

export interface Fish24WalletDebitResult {
  readonly ok: boolean; readonly existing: boolean; readonly transaction?: Fish24WalletTransaction;
  readonly error?: 'forbidden' | 'wallet-not-found' | 'insufficient-funds' | 'invalid-amount';
}

const SEED_TRANSACTIONS: readonly Fish24WalletTransaction[] = [
  { id: '4006', employerId: '1002', operationId: 'top-up-22562', createdAt: '1405/06/19 09:25', amountRial: 500_000, balanceAfterRial: 18_000_000, direction: 'credit', origin: 'wallet-top-up', status: 'success', mobile: '09129876543', fullName: 'رضا کریمی', companyName: 'شرکت راهکار نوین', workplaceName: 'شرکت راهکار نوین', trackingCode: '014096', userType: 'حقوقی', description: 'شارژ خودکار کیف پول', formalInvoiceId: 2, formalInvoiceNumber: '22562' },
  { id: '4005', employerId: '1001', operationId: '2001', createdAt: '1405/06/18 14:10', amountRial: 780_000, balanceAfterRial: 75_000_000, direction: 'debit', origin: 'document-distribution', status: 'success', mobile: '09121234567', fullName: 'مریم احمدی', companyName: 'مجموعه نمونه سپهر', workplaceName: 'مجموعه نمونه سپهر', trackingCode: 'DOC-2001', userType: 'حقوقی', description: 'هزینه توزیع فیش حقوق مرداد ۱۴۰۵', formalInvoiceId: null, formalInvoiceNumber: null },
  { id: '4004', employerId: '1007', operationId: 'manual-seed-4004', createdAt: '1405/06/17 11:45', amountRial: 2_500_000, balanceAfterRial: 0, direction: 'debit', origin: 'manual', status: 'success', mobile: '09123334455', fullName: 'حامد اکبری', companyName: 'کارگاه توسعه پارس', workplaceName: 'کارگاه توسعه پارس', trackingCode: 'MAN-4004', userType: 'حقوقی', description: 'تراکنش دستی بدهکار', formalInvoiceId: null, formalInvoiceNumber: null },
  { id: '4003', employerId: '1001', operationId: 'manual-seed-4003', createdAt: '1405/06/16 08:30', amountRial: 3_000_000, balanceAfterRial: 77_500_000, direction: 'credit', origin: 'manual', status: 'success', mobile: '09121234567', fullName: 'مریم احمدی', companyName: 'مجموعه نمونه سپهر', workplaceName: 'مجموعه نمونه سپهر', trackingCode: 'MAN-4003', userType: 'حقوقی', description: 'تراکنش دستی بستانکار', formalInvoiceId: null, formalInvoiceNumber: null },
  { id: '4002', employerId: '1002', operationId: 'top-up-failed-4002', createdAt: '1405/06/15 16:20', amountRial: 1_000_000, balanceAfterRial: 17_500_000, direction: 'credit', origin: 'wallet-top-up', status: 'failed', mobile: '09129876543', fullName: 'رضا کریمی', companyName: 'شرکت راهکار نوین', workplaceName: 'شرکت راهکار نوین', trackingCode: 'TRX-FAILED-4002', userType: 'حقوقی', description: 'شارژ ناموفق کیف پول', formalInvoiceId: null, formalInvoiceNumber: null },
  { id: '4001', employerId: '1001', operationId: 'top-up-22561', createdAt: '1405/06/14 12:00', amountRial: 250_000, balanceAfterRial: 74_500_000, direction: 'credit', origin: 'wallet-top-up', status: 'success', mobile: '09121234567', fullName: 'مریم احمدی', companyName: 'مجموعه نمونه سپهر', workplaceName: 'مجموعه نمونه سپهر', trackingCode: '014101', userType: 'حقوقی', description: 'شارژ خودکار کیف پول', formalInvoiceId: 1, formalInvoiceNumber: '22561' }
];

export function parsePositiveRialAmount(value: string): number | null {
  const normalized = normalizeFish24Digits(value).trim();
  if (!/^\d+$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

@Injectable({ providedIn: 'root' })
export class Fish24WalletPreviewService {
  private readonly walletsState = signal<readonly Fish24WalletRecord[]>([
    { employerId: 'user-1', balanceRial: 32_750_000 }, { employerId: '1001', balanceRial: 75_000_000 },
    { employerId: '1002', balanceRial: 18_000_000 }, { employerId: '1007', balanceRial: 0 }
  ]);
  private readonly transactionsState = signal<readonly Fish24WalletTransaction[]>(SEED_TRANSACTIONS);
  private readonly inFlight = new Set<string>();
  readonly wallets = this.walletsState.asReadonly();
  readonly transactions = this.transactionsState.asReadonly();

  balance(employerId: string): number | null { return this.walletsState().find(wallet => wallet.employerId === employerId)?.balanceRial ?? null; }

  createManualTransaction(input: Fish24ManualTransactionInput): Fish24WalletDebitResult {
    const existing = this.transactionsState().find(transaction => transaction.operationId === input.requestId);
    if (existing) return { ok: true, existing: true, transaction: existing };
    const amountRial = parsePositiveRialAmount(input.amountRial);
    if (amountRial === null) return { ok: false, existing: false, error: 'invalid-amount' };
    const wallet = this.walletsState().find(item => item.employerId === input.employerId);
    if (!wallet) return { ok: false, existing: false, error: 'wallet-not-found' };
    if (this.inFlight.has(input.requestId)) return { ok: false, existing: false, error: 'invalid-amount' };
    if (input.direction === 'debit' && wallet.balanceRial < amountRial) return { ok: false, existing: false, error: 'insufficient-funds' };
    this.inFlight.add(input.requestId);
    try {
      const balanceAfterRial = wallet.balanceRial + (input.direction === 'credit' ? amountRial : -amountRial);
      const nextId = Math.max(0, ...this.transactionsState().map(item => Number(item.id))) + 1;
      const transaction: Fish24WalletTransaction = {
        id: String(nextId), employerId: input.employerId, operationId: input.requestId, createdAt: input.createdAt,
        amountRial, balanceAfterRial, direction: input.direction, origin: 'manual', status: 'success', mobile: input.mobile,
        fullName: input.fullName, companyName: input.companyName, workplaceName: input.workplaceName,
        trackingCode: `MAN-${nextId}`, userType: input.userType,
        description: input.direction === 'debit' ? 'تراکنش دستی بدهکار' : 'تراکنش دستی بستانکار', formalInvoiceId: null, formalInvoiceNumber: null
      };
      this.walletsState.update(wallets => wallets.map(item => item.employerId === input.employerId ? { ...item, balanceRial: balanceAfterRial } : item));
      this.transactionsState.update(transactions => [transaction, ...transactions]);
      return { ok: true, existing: false, transaction };
    } finally { this.inFlight.delete(input.requestId); }
  }

  associateFormalInvoice(transactionId: string, invoiceId: number | null, invoiceNumber: string | null): boolean {
    const target = this.transactionsState().find(transaction => transaction.id === transactionId);
    if (!target || target.origin !== 'manual') return false;
    this.transactionsState.update(transactions => transactions.map(transaction => transaction.id === transactionId ? { ...transaction, formalInvoiceId: invoiceId, formalInvoiceNumber: invoiceNumber } : transaction));
    return true;
  }

  debitDocumentDistribution(employerId: string, operationId: string, amountRial: number, createdAt: string): Fish24WalletDebitResult {
    const existing = this.transactionsState().find(transaction => transaction.operationId === operationId);
    if (existing) return { ok: true, existing: true, transaction: existing };
    const wallet = this.walletsState().find(item => item.employerId === employerId);
    if (!wallet) return { ok: false, existing: false, error: 'wallet-not-found' };
    if (!Number.isSafeInteger(amountRial) || amountRial < 0 || wallet.balanceRial < amountRial) return { ok: false, existing: false, error: 'insufficient-funds' };
    const balanceAfterRial = wallet.balanceRial - amountRial;
    const nextId = Math.max(0, ...this.transactionsState().map(item => Number(item.id))) + 1;
    const transaction: Fish24WalletTransaction = {
      id: String(nextId), employerId, operationId, createdAt, amountRial, balanceAfterRial, direction: 'debit', origin: 'document-distribution', status: 'success', mobile: '', fullName: '', companyName: '', workplaceName: '', trackingCode: `DOC-${operationId}`, userType: 'حقوقی', description: 'هزینه توزیع سند', formalInvoiceId: null, formalInvoiceNumber: null
    };
    this.walletsState.update(wallets => wallets.map(item => item.employerId === employerId ? { ...item, balanceRial: balanceAfterRial } : item));
    this.transactionsState.update(transactions => [transaction, ...transactions]);
    return { ok: true, existing: false, transaction };
  }
}

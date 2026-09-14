import { Injectable, signal } from '@angular/core';

export interface Fish24WalletRecord {
  readonly employerId: string;
  readonly balanceRial: number;
}

export interface Fish24WalletTransaction {
  readonly id: string;
  readonly employerId: string;
  readonly operationId: string;
  readonly createdAt: string;
  readonly amountRial: number;
  readonly balanceAfterRial: number;
  readonly kind: 'document-distribution-debit';
}

export interface Fish24WalletDebitResult {
  readonly ok: boolean;
  readonly existing: boolean;
  readonly transaction?: Fish24WalletTransaction;
  readonly error?: 'wallet-not-found' | 'insufficient-funds';
}

@Injectable({ providedIn: 'root' })
export class Fish24WalletPreviewService {
  private readonly walletsState = signal<readonly Fish24WalletRecord[]>([
    { employerId: 'user-1', balanceRial: 32_750_000 },
    { employerId: '1001', balanceRial: 75_000_000 },
    { employerId: '1002', balanceRial: 18_000_000 },
    { employerId: '1007', balanceRial: 0 }
  ]);
  private readonly transactionsState = signal<readonly Fish24WalletTransaction[]>([]);

  readonly wallets = this.walletsState.asReadonly();
  readonly transactions = this.transactionsState.asReadonly();

  balance(employerId: string): number | null {
    return this.walletsState().find(wallet => wallet.employerId === employerId)?.balanceRial ?? null;
  }

  debitDocumentDistribution(employerId: string, operationId: string, amountRial: number, createdAt: string): Fish24WalletDebitResult {
    const existing = this.transactionsState().find(transaction => transaction.operationId === operationId);
    if (existing) return { ok: true, existing: true, transaction: existing };
    const wallet = this.walletsState().find(item => item.employerId === employerId);
    if (!wallet) return { ok: false, existing: false, error: 'wallet-not-found' };
    if (!Number.isSafeInteger(amountRial) || amountRial < 0 || wallet.balanceRial < amountRial) {
      return { ok: false, existing: false, error: 'insufficient-funds' };
    }
    const balanceAfterRial = wallet.balanceRial - amountRial;
    const transaction: Fish24WalletTransaction = {
      id: `document-distribution-${operationId}`,
      employerId,
      operationId,
      createdAt,
      amountRial,
      balanceAfterRial,
      kind: 'document-distribution-debit'
    };
    this.walletsState.update(wallets => wallets.map(item => item.employerId === employerId ? { ...item, balanceRial: balanceAfterRial } : item));
    this.transactionsState.update(transactions => [transaction, ...transactions]);
    return { ok: true, existing: false, transaction };
  }
}

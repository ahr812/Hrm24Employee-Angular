import { Injectable } from '@angular/core';
import { EmployerInvoicePreview } from '../../../features/fish24/employer/invoices/employer-invoice-preview.data';
import { Fish24RolePreviewService } from '../dev/fish24-role-preview.service';
import { FISH24_PERMISSIONS } from '../permissions/fish24-permissions';
import { Fish24PermissionService } from '../permissions/fish24-permission.service';
import { Fish24FinancialPreviewService } from './fish24-financial-preview.service';
import { Fish24ManualTransactionInput, Fish24WalletDebitResult, Fish24WalletPreviewService } from './fish24-wallet-preview.service';

export interface FormalInvoiceOperationResult {
  readonly ok: boolean;
  readonly existing: boolean;
  readonly invoice?: EmployerInvoicePreview;
  readonly error?: 'forbidden' | 'not-found' | 'automatic-transaction' | 'invoice-unavailable';
}

@Injectable({ providedIn: 'root' })
export class Fish24TransactionPreviewService {
  constructor(
    private readonly wallets: Fish24WalletPreviewService,
    private readonly financial: Fish24FinancialPreviewService,
    private readonly roles: Fish24RolePreviewService,
    private readonly permissions: Fish24PermissionService
  ) {}

  createManualTransaction(input: Fish24ManualTransactionInput): Fish24WalletDebitResult {
    return this.canManage() ? this.wallets.createManualTransaction(input) : { ok: false, existing: false, error: 'forbidden' };
  }

  issueFormalInvoice(transactionId: string): FormalInvoiceOperationResult {
    if (!this.canManage()) return { ok: false, existing: false, error: 'forbidden' };
    const transaction = this.wallets.transactions().find(item => item.id === transactionId);
    if (!transaction) return { ok: false, existing: false, error: 'not-found' };
    if (transaction.origin !== 'manual') return { ok: false, existing: false, error: 'automatic-transaction' };
    if (transaction.formalInvoiceId) {
      const invoice = this.financial.findInvoice(transaction.formalInvoiceId);
      return invoice ? { ok: true, existing: true, invoice } : { ok: false, existing: true, error: 'invoice-unavailable' };
    }
    const result = this.financial.issueManualInvoice(transaction.id, transaction.amountRial, transaction.createdAt.slice(0, 10));
    if (!result.ok || !result.invoice) return { ok: false, existing: false, error: 'invoice-unavailable' };
    if (!this.wallets.associateFormalInvoice(transaction.id, result.invoice.id, result.invoice.invoiceNumber)) {
      this.financial.deleteManualInvoice(transaction.id);
      return { ok: false, existing: false, error: 'invoice-unavailable' };
    }
    return { ok: true, existing: result.existing, invoice: result.invoice };
  }

  deleteFormalInvoice(transactionId: string): FormalInvoiceOperationResult {
    if (!this.canManage()) return { ok: false, existing: false, error: 'forbidden' };
    const transaction = this.wallets.transactions().find(item => item.id === transactionId);
    if (!transaction) return { ok: false, existing: false, error: 'not-found' };
    if (transaction.origin !== 'manual') return { ok: false, existing: false, error: 'automatic-transaction' };
    if (!transaction.formalInvoiceId) return { ok: true, existing: true };
    const invoice = this.financial.findInvoice(transaction.formalInvoiceId) ?? undefined;
    if (!this.financial.deleteManualInvoice(transaction.id)) return { ok: false, existing: false, error: 'invoice-unavailable' };
    if (!this.wallets.associateFormalInvoice(transaction.id, null, null)) return { ok: false, existing: false, error: 'invoice-unavailable' };
    return { ok: true, existing: false, invoice };
  }

  private canManage(): boolean {
    return this.permissions.hasPermission(this.roles.getPreviewRoles(), FISH24_PERMISSIONS.financialManagement);
  }
}

import { Fish24RolePreviewService } from '../dev/fish24-role-preview.service';
import { Fish24PermissionService } from '../permissions/fish24-permission.service';
import { Fish24FinancialPreviewService } from './fish24-financial-preview.service';
import { compareFormalNumbers, Fish24InternalInvoicePreviewService } from './fish24-internal-invoice-preview.service';
import { Fish24TransactionPreviewService } from './fish24-transaction-preview.service';
import { Fish24WalletPreviewService } from './fish24-wallet-preview.service';

describe('Fish24InternalInvoicePreviewService', () => {
  function setup() {
    const financial = new Fish24FinancialPreviewService();
    const wallet = new Fish24WalletPreviewService();
    const roles = new Fish24RolePreviewService();
    const permissions = new Fish24PermissionService();
    const transactions = new Fish24TransactionPreviewService(wallet, financial, roles, permissions);
    return { financial, wallet, roles, transactions, service: new Fish24InternalInvoicePreviewService(financial, wallet, transactions) };
  }

  it('includes every numbered current and legacy source', () => {
    const { financial, service } = setup();
    const numberedSources = financial.formalInvoiceSources().filter(source =>
      ('invoiceNumber' in source ? source.invoiceNumber : source.formalInvoiceNumber)?.trim()
    );
    expect(service.invoices().length).toBe(numberedSources.length);
    expect(service.invoices().some(invoice => invoice.formalInvoiceNumber === '00022343')).toBeTrue();
  });

  it('preserves formal-number text and compares values without numeric precision loss', () => {
    const { service } = setup();
    expect(service.invoices().find(invoice => invoice.sourceIdentity === 'legacy-00022343')?.formalInvoiceNumber).toBe('00022343');
    expect(compareFormalNumbers('00022343', '22342')).toBeGreaterThan(0);
    expect(compareFormalNumbers('99999999999999999999', '100000000000000000000')).toBeLessThan(0);
  });

  it('requires an authoritative amount for every listed invoice', () => {
    const { service } = setup();
    expect(service.invoices().every(invoice => Number.isFinite(invoice.amountRial))).toBeTrue();
  });

  it('deletes a disposable manual invoice without changing the transaction or wallet facts', () => {
    const { wallet, transactions, service } = setup();
    const created = transactions.createManualTransaction({ requestId: 'invoice-deletion-proof', employerId: '1001', mobile: '09121234567', fullName: 'مریم احمدی', companyName: 'مجموعه نمونه سپهر', workplaceName: 'مجموعه نمونه سپهر', userType: 'حقوقی', amountRial: '125000', direction: 'debit', createdAt: '1405/06/22 11:20' }).transaction!;
    const balanceAfterTransaction = wallet.balance('1001');
    expect(transactions.issueFormalInvoice(created.id).ok).toBeTrue();
    const listItem = service.invoices().find(invoice => invoice.linkedTransactionId === created.id)!;
    const factsBefore = wallet.transactions().find(transaction => transaction.id === created.id)!;
    expect(listItem.deletionEligible).toBeTrue();
    expect(service.deleteManualInvoice(listItem.sourceIdentity).ok).toBeTrue();
    const factsAfter = wallet.transactions().find(transaction => transaction.id === created.id)!;
    expect(service.find(listItem.sourceIdentity)).toBeNull();
    expect(wallet.balance('1001')).toBe(balanceAfterTransaction);
    expect({ ...factsAfter, formalInvoiceId: factsBefore.formalInvoiceId, formalInvoiceNumber: factsBefore.formalInvoiceNumber }).toEqual(factsBefore);
    expect(factsAfter.formalInvoiceId).toBeNull();
    expect(factsAfter.formalInvoiceNumber).toBeNull();
  });

  it('rejects deletion for automatic and unknown-origin legacy invoices at the service boundary', () => {
    const { service } = setup();
    const automatic = service.invoices().find(invoice => invoice.linkedTransactionId === '4001')!;
    expect(automatic.deletionEligible).toBeFalse();
    expect(service.deleteManualInvoice(automatic.sourceIdentity).error).toBe('automatic-transaction');
    expect(service.deleteManualInvoice('legacy-00022343').error).toBe('automatic-transaction');
  });
});

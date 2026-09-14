import { Fish24FinancialPreviewService } from './fish24-financial-preview.service';
import { Fish24TransactionPreviewService } from './fish24-transaction-preview.service';
import { Fish24WalletPreviewService, parsePositiveRialAmount } from './fish24-wallet-preview.service';

describe('Fish24WalletPreviewService manual transactions', () => {
  const transactionService = (wallet: Fish24WalletPreviewService, financial: Fish24FinancialPreviewService, roles = new Fish24RolePreviewService()) =>
    new Fish24TransactionPreviewService(wallet, financial, roles, new Fish24PermissionService());
  it('accepts Persian and Latin positive integer Rial values only', () => {
    expect(parsePositiveRialAmount('۰۰۱۲۵۰')).toBe(1250);
    expect(parsePositiveRialAmount('250000')).toBe(250000);
    expect(parsePositiveRialAmount('0')).toBeNull();
    expect(parsePositiveRialAmount('-1')).toBeNull();
    expect(parsePositiveRialAmount('1.5')).toBeNull();
    expect(parsePositiveRialAmount('Infinity')).toBeNull();
  });

  it('credits the authoritative wallet and deduplicates the same request', () => {
    const service = new Fish24WalletPreviewService();
    const before = service.balance('1001')!;
    const input = { requestId: 'request-credit', employerId: '1001', mobile: '09121234567', fullName: 'مریم احمدی', companyName: 'مجموعه نمونه سپهر', workplaceName: 'مجموعه نمونه سپهر', userType: 'حقوقی' as const, amountRial: '۱۰۰۰۰۰۰', direction: 'credit' as const, createdAt: '1405/06/20 10:00' };
    const first = service.createManualTransaction(input);
    const second = service.createManualTransaction(input);
    expect(first.ok).toBeTrue();
    expect(first.existing).toBeFalse();
    expect(second.existing).toBeTrue();
    expect(service.balance('1001')).toBe(before + 1_000_000);
    expect(service.transactions().filter(item => item.operationId === input.requestId).length).toBe(1);
  });

  it('rejects an insufficient debit without changing wallet or transactions', () => {
    const service = new Fish24WalletPreviewService();
    const beforeBalance = service.balance('1007');
    const beforeTransactions = service.transactions();
    const result = service.createManualTransaction({ requestId: 'request-debit', employerId: '1007', mobile: '09123334455', fullName: 'حامد اکبری', companyName: 'کارگاه توسعه پارس', workplaceName: 'کارگاه توسعه پارس', userType: 'حقوقی', amountRial: '1', direction: 'debit', createdAt: '1405/06/20 10:00' });
    expect(result.error).toBe('insufficient-funds');
    expect(service.balance('1007')).toBe(beforeBalance);
    expect(service.transactions()).toBe(beforeTransactions);
  });

  it('issues and deletes formal invoices for both manual directions without changing transaction facts or balances', () => {
    const wallet = new Fish24WalletPreviewService();
    const financial = new Fish24FinancialPreviewService();
    const transactions = transactionService(wallet, financial);
    const created = wallet.createManualTransaction({ requestId: 'request-invoice', employerId: '1001', mobile: '09121234567', fullName: 'مریم احمدی', companyName: 'مجموعه نمونه سپهر', workplaceName: 'مجموعه نمونه سپهر', userType: 'حقوقی', amountRial: '1000000', direction: 'debit', createdAt: '1405/06/20 10:00' }).transaction!;
    const balanceAfterTransaction = wallet.balance('1001');
    const invoice = transactions.issueFormalInvoice(created.id).invoice!;
    expect(invoice.line.taxAmountRial).toBe(100_000);
    expect(wallet.transactions().find(item => item.id === created.id)?.formalInvoiceNumber).toBe(invoice.invoiceNumber);
    expect(transactions.issueFormalInvoice(created.id).existing).toBeTrue();
    const manualCredit = wallet.transactions().find(item => item.id === '4003')!;
    expect(transactions.issueFormalInvoice(manualCredit.id).ok).toBeTrue();
    expect(wallet.transactions().find(item => item.id === manualCredit.id)?.formalInvoiceNumber).not.toBeNull();
    expect(wallet.balance('1001')).toBe(balanceAfterTransaction);
    expect(transactions.deleteFormalInvoice(created.id).ok).toBeTrue();
    expect(wallet.transactions().find(item => item.id === created.id)?.amountRial).toBe(1_000_000);
    expect(wallet.transactions().find(item => item.id === created.id)?.formalInvoiceNumber).toBeNull();
    expect(wallet.balance('1001')).toBe(balanceAfterTransaction);
  });

  it('rejects invoice issuance and deletion for automatic transactions at the service boundary', () => {
    const wallet = new Fish24WalletPreviewService();
    const financial = new Fish24FinancialPreviewService();
    const transactions = transactionService(wallet, financial);
    const automaticTopUp = wallet.transactions().find(item => item.origin === 'wallet-top-up')!;
    const automaticDocument = wallet.transactions().find(item => item.origin === 'document-distribution')!;
    const invoicesBefore = financial.invoices();
    expect(transactions.issueFormalInvoice(automaticTopUp.id).error).toBe('automatic-transaction');
    expect(transactions.deleteFormalInvoice(automaticTopUp.id).error).toBe('automatic-transaction');
    expect(transactions.issueFormalInvoice(automaticDocument.id).error).toBe('automatic-transaction');
    expect(financial.invoices()).toBe(invoicesBefore);
  });

  it('rejects internal financial mutations for Support', () => {
    const wallet = new Fish24WalletPreviewService();
    const financial = new Fish24FinancialPreviewService();
    const roles = new Fish24RolePreviewService();
    roles.setPreviewRole('support-expert');
    const transactions = transactionService(wallet, financial, roles);
    const balanceBefore = wallet.balance('1001');
    const recordsBefore = wallet.transactions();
    const result = transactions.createManualTransaction({ requestId: 'support-request', employerId: '1001', mobile: '09121234567', fullName: 'مریم احمدی', companyName: 'مجموعه نمونه سپهر', workplaceName: 'مجموعه نمونه سپهر', userType: 'حقوقی', amountRial: '1000', direction: 'credit', createdAt: '1405/06/20 10:00' });
    expect(result.error).toBe('forbidden');
    expect(transactions.issueFormalInvoice('4003').error).toBe('forbidden');
    expect(wallet.balance('1001')).toBe(balanceBefore);
    expect(wallet.transactions()).toBe(recordsBefore);
  });
});
import { Fish24RolePreviewService } from '../dev/fish24-role-preview.service';
import { Fish24PermissionService } from '../permissions/fish24-permission.service';

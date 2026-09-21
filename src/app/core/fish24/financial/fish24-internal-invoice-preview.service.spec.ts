import { Fish24RolePreviewService } from '../dev/fish24-role-preview.service';
import { Fish24PermissionService } from '../permissions/fish24-permission.service';
import { Fish24FinancialPreviewService } from './fish24-financial-preview.service';
import { compareFormalNumbers, Fish24InternalInvoicePreviewService } from './fish24-internal-invoice-preview.service';
import { Fish24TransactionPreviewService } from './fish24-transaction-preview.service';
import { Fish24WalletPreviewService } from './fish24-wallet-preview.service';
import { BusinessUserPreviewService } from '../../../features/fish24/internal/users/business-user-preview.service';
import { buildAccountingVoucherExport } from '../../../features/fish24/internal/invoices/accounting-voucher-export';

describe('Fish24InternalInvoicePreviewService', () => {
  function setup() {
    const financial = new Fish24FinancialPreviewService();
    const wallet = new Fish24WalletPreviewService();
    const roles = new Fish24RolePreviewService();
    const permissions = new Fish24PermissionService();
    const transactions = new Fish24TransactionPreviewService(wallet, financial, roles, permissions);
    const users = new BusinessUserPreviewService();
    return { financial, wallet, roles, transactions, service: new Fish24InternalInvoicePreviewService(financial, wallet, transactions, users) };
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

  it('resolves a current employer mobile for every listed invoice', () => {
    const { service } = setup();
    expect(service.invoices().every(invoice => /^09\d{9}$/.test(invoice.mobile))).toBeTrue();
    expect(service.invoices().find(invoice => invoice.formalInvoiceNumber === '22561')?.employerId).toBe('1001');
    expect(service.invoices().find(invoice => invoice.formalInvoiceNumber === '22562')?.employerId).toBe('1002');
    expect(service.invoices().find(invoice => invoice.formalInvoiceNumber === '00022343')?.employerId).toBe('1007');
  });

  it('uses explicit transaction provenance and stored transaction facts for voucher eligibility', () => {
    const { service } = setup();
    const linkedCredit = service.invoices().find(invoice => invoice.formalInvoiceNumber === '22561')!;
    expect([linkedCredit.voucherEligibility, linkedCredit.voucherAmountRial, linkedCredit.voucherDate, linkedCredit.trackingIdentifier])
      .toEqual(['credit', 250_000, '1405/06/14', '014101']);
    expect(service.invoices().find(invoice => invoice.formalInvoiceNumber === '22562')?.trackingIdentifier).toBe('014096');
    expect(['22563', '22564', '22565'].every(number =>
      service.invoices().find(invoice => invoice.formalInvoiceNumber === number)?.voucherEligibility === 'credit'
    )).toBeTrue();
    expect(service.invoices().find(invoice => invoice.formalInvoiceNumber === '00022343')?.voucherEligibility).toBe('credit');
  });

  it('reconciles all six demo invoices into balanced voucher pairs', () => {
    const { wallet, service } = setup();
    const invoices = service.invoices();
    const result = buildAccountingVoucherExport(invoices);
    expect(invoices.length).toBe(6);
    expect(invoices.every(invoice => invoice.voucherEligibility === 'credit')).toBeTrue();
    expect(Object.fromEntries(invoices.map(invoice => [invoice.formalInvoiceNumber, invoice.employerId]))).toEqual({
      '22561': '1001', '22562': '1002', '22563': '1007', '22564': '1001', '22565': '1002', '00022343': '1007'
    });
    expect(result.exportedInvoiceCount).toBe(6);
    expect(result.rows.length).toBe(12);
    expect(result.excludedUnknownSources).toEqual([]);
    expect(result.incompatibleTrackingSources).toEqual([]);
    for (let index = 0; index < result.rows.length; index += 2) {
      expect(result.rows[index][12]).toBe(result.rows[index + 1][13]);
    }
    const debit = result.rows.reduce((sum, row) => sum + Number(row[12]), 0);
    const credit = result.rows.reduce((sum, row) => sum + Number(row[13]), 0);
    expect([debit, credit]).toEqual([552_696_000, 552_696_000]);
    for (const invoice of invoices.filter(item => item.linkedTransactionId !== null)) {
      const transaction = wallet.transactions().find(item => item.id === invoice.linkedTransactionId)!;
      expect(invoice.amountRial).toBe(transaction.amountRial);
      expect(invoice.baseAmountRial + invoice.taxAmountRial).toBe(invoice.amountRial);
      expect(invoice.voucherAmountRial).toBe(invoice.amountRial);
    }
    expect([wallet.balance('1001'), wallet.balance('1002'), wallet.balance('1007')]).toEqual([75_000_000, 18_000_000, 0]);
  });

  it('deletes a disposable manual invoice without changing the transaction or wallet facts', () => {
    const { wallet, transactions, service } = setup();
    const created = transactions.createManualTransaction({ requestId: 'invoice-deletion-proof', employerId: '1001', mobile: '09121234567', fullName: 'مریم احمدی', companyName: 'مجموعه نمونه سپهر', workplaceName: 'مجموعه نمونه سپهر', userType: 'حقوقی', amountRial: '125000', direction: 'debit', createdAt: '1405/06/22 11:20' }).transaction!;
    const balanceAfterTransaction = wallet.balance('1001');
    expect(transactions.issueFormalInvoice(created.id).ok).toBeTrue();
    const listItem = service.invoices().find(invoice => invoice.linkedTransactionId === created.id)!;
    const factsBefore = wallet.transactions().find(transaction => transaction.id === created.id)!;
    expect(listItem.deletionEligible).toBeTrue();
    expect(listItem.voucherEligibility).toBe('debit');
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

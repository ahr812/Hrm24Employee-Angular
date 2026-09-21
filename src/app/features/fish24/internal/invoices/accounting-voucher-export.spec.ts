import { InternalFormalInvoiceListItem } from '../../../../core/fish24/financial/fish24-internal-invoice-preview.service';
import { ACCOUNTING_VOUCHER_HEADERS, buildAccountingVoucherExport } from './accounting-voucher-export';

describe('accounting voucher export', () => {
  const invoice = (overrides: Partial<InternalFormalInvoiceListItem> = {}): InternalFormalInvoiceListItem => ({
    sourceIdentity: 'legacy-leading-zero', employerId: '1007', formalInvoiceNumber: '00022343', issueDate: '1405/06/21',
    mobile: '09123334455', name: 'حامد اکبری', companyName: 'کارگاه توسعه پارس', userType: 'حقوقی',
    title: 'فاکتور شارژ کیف پول', amountRial: 550_000_000, baseAmountRial: 500_000_000, taxAmountRial: 50_000_000,
    voucherEligibility: 'credit', voucherAmountRial: 550_000_000, voucherDate: '1405/06/21', trackingIdentifier: null,
    linkedTransactionId: null, printableInvoiceId: null, deletionEligible: false, sourceKind: 'legacy', originalSource: {} as never,
    ...overrides
  });

  it('matches the exact 16-column reference headers', () => {
    expect(ACCOUNTING_VOUCHER_HEADERS).toEqual([
      'شماره سند', 'تاریخ', 'شرح سند', 'کد معین', 'نام معین', 'کد تفصیلی', 'نام تفصیلی',
      'کد سطح پنجم', 'نام سطح پنجم', 'کد سطح ششم', 'نام سطح ششم', 'شرح', 'بدهکار',
      'بستانکار', 'شماره پیگیری', 'تاریخ پیگیری'
    ]);
  });

  it('creates two balanced rows per invoice with sequential shared voucher numbers', () => {
    const result = buildAccountingVoucherExport([invoice(), invoice({ sourceIdentity: 'current-1', formalInvoiceNumber: '22561', voucherAmountRial: 250_000 })]);
    expect(result.rows.length).toBe(4);
    expect(result.rows.every(row => row.length === 16)).toBeTrue();
    expect(result.rows.map(row => row[0])).toEqual([1, 1, 2, 2]);
    expect(result.rows[0].slice(3, 7)).toEqual([111005, 'موجودی بانکهای ریالی', 47, 'بانک ملی']);
    expect(result.rows[1].slice(3, 7)).toEqual([111201, 'حسابهای دریافتنی تجاری', 9123334455, 'کارگاه توسعه پارس 09123334455']);
    expect(result.rows.map(row => [row[12], row[13]])).toEqual([[550_000_000, 0], [0, 550_000_000], [250_000, 0], [0, 250_000]]);
    const debit = result.rows.reduce((sum, row) => sum + Number(row[12]), 0);
    const credit = result.rows.reduce((sum, row) => sum + Number(row[13]), 0);
    expect(debit).toBe(credit);
  });

  it('uses transaction date, current natural-person identity and numeric tracking while preserving leading zeros in text', () => {
    const result = buildAccountingVoucherExport([invoice({
      userType: 'حقیقی', name: 'حامد اکبری', companyName: null, voucherDate: '۱۴۰۵/۰۶/۲۴', trackingIdentifier: '014101'
    })]);
    const [debit, credit] = result.rows;
    expect(debit[1]).toBe('1405/06/24');
    expect(debit[11]).toBe('واریز بابت سامانه فیش 24 توسط حامد اکبری برای فاکتور 00022343 پیگیری 014101');
    expect(debit[14]).toBe(14101);
    expect(debit[15]).toBe('1405/06/24');
    expect(credit[6]).toBe('حامد اکبری 09123334455');
  });

  it('includes legacy invoices without tracking and leaves all required blank columns empty', () => {
    const result = buildAccountingVoucherExport([invoice()]);
    expect(result.exportedInvoiceCount).toBe(1);
    expect(result.rows[0][11]).toBe('واریز بابت سامانه فیش 24 توسط کارگاه توسعه پارس برای فاکتور 00022343');
    expect(result.rows[0][14]).toBeNull();
    for (const row of result.rows) expect([2, 7, 8, 9, 10].every(index => row[index] === null)).toBeTrue();
  });

  it('includes credit, debit and unknown provenance without mutating input order or financial values', () => {
    const credit = invoice();
    const debit = invoice({ sourceIdentity: 'debit', voucherEligibility: 'debit' });
    const unknown = invoice({ sourceIdentity: 'unknown', voucherEligibility: 'unknown' });
    const before = JSON.stringify([credit, debit, unknown]);
    const result = buildAccountingVoucherExport([credit, debit, unknown]);
    expect(result.exportedInvoiceCount).toBe(3);
    expect(result.rows.length).toBe(6);
    expect(result.rows.map(row => row[0])).toEqual([1, 1, 2, 2, 3, 3]);
    expect(result.rows.reduce((sum, row) => sum + Number(row[12]), 0)).toBe(1_650_000_000);
    expect(result.rows.reduce((sum, row) => sum + Number(row[13]), 0)).toBe(1_650_000_000);
    expect(JSON.stringify([credit, debit, unknown])).toBe(before);
  });

  it('preserves incompatible tracking in description without corrupting the numeric column', () => {
    const result = buildAccountingVoucherExport([invoice({ sourceIdentity: 'current-1', trackingIdentifier: 'TRX-22561' })]);
    expect(result.rows[0][11]).toContain('پیگیری TRX-22561');
    expect(result.rows[0][14]).toBeNull();
    expect(result.incompatibleTrackingSources).toEqual(['current-1']);
  });
});

import { InternalFormalInvoiceListItem } from '../../../../core/fish24/financial/fish24-internal-invoice-preview.service';
import { buildInvoiceExportRows, INVOICE_EXPORT_HEADERS } from './invoice-export';

describe('specialized invoice export', () => {
  const invoice = (overrides: Partial<InternalFormalInvoiceListItem> = {}): InternalFormalInvoiceListItem => ({
    sourceIdentity: 'legacy-leading-zero', employerId: '1007', formalInvoiceNumber: '00022343', issueDate: '1405/06/21',
    mobile: '09123334455', name: 'حامد اکبری', companyName: 'کارگاه توسعه پارس', userType: 'حقوقی',
    title: 'فاکتور شارژ کیف پول', amountRial: 550_000_000, baseAmountRial: 500_000_000, taxAmountRial: 50_000_000,
    voucherEligibility: 'credit', voucherAmountRial: 550_000_000, voucherDate: '1405/06/21', trackingIdentifier: null,
    linkedTransactionId: null, printableInvoiceId: null, deletionEligible: false, sourceKind: 'legacy', originalSource: {} as never,
    ...overrides
  });

  it('keeps the exact 45-column schema and empty schema columns', () => {
    expect(INVOICE_EXPORT_HEADERS.length).toBe(45);
    expect(INVOICE_EXPORT_HEADERS[0]).toBe('شماره فاکتور');
    expect(INVOICE_EXPORT_HEADERS[44]).toBe('نام سطح ششم مالیات');
    const row = buildInvoiceExportRows([invoice()])[0];
    expect(row.length).toBe(45);
    expect([8, 9, 10, 11, 15, 16, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 39, 40, 41, 42, 43, 44].every(index => row[index] === null)).toBeTrue();
  });

  it('preserves formal-number text and stored amounts without recalculation', () => {
    const row = buildInvoiceExportRows([invoice({ baseAmountRial: 123_456, taxAmountRial: 0 })])[0];
    expect(row[0]).toBe('00022343');
    expect(typeof row[0]).toBe('string');
    expect(row[1]).toBe('1405/06/21');
    expect(row[18]).toBe(123_456);
    expect(row[19]).toBe(123_456);
    expect(row[38]).toBe(0);
  });

  it('uses current employer identity with numeric customer code', () => {
    const legal = buildInvoiceExportRows([invoice()])[0];
    expect(legal[2]).toBe(9123334455);
    expect(legal[3]).toBe('کارگاه توسعه پارس 09123334455');
    expect(legal[6]).toBe(legal[2]);
    expect(legal[7]).toBe(legal[3]);
    expect(legal[22]).toBe(legal[2]);
    expect(legal[23]).toBe(legal[3]);
    const natural = buildInvoiceExportRows([invoice({ userType: 'حقیقی', name: 'حامد اکبری' })])[0];
    expect(natural[3]).toBe('حامد اکبری 09123334455');
  });

  it('uses the fixed accounting values for every source kind without mutating invoices', () => {
    const legacy = invoice();
    const current = invoice({ sourceIdentity: 'current-1', sourceKind: 'current', printableInvoiceId: 1 });
    const before = JSON.stringify([legacy, current]);
    const rows = buildInvoiceExportRows([legacy, current]);
    for (const row of rows) {
      expect([row[4], row[5], row[12], row[13], row[14], row[17], row[20], row[21], row[37]])
        .toEqual([111201, 'حسابهای دریافتنی تجاری', 600000, 'سامانه فیش حقوق', 'عدد', 1, 411017, 'فروش سامانه فیش حقوق', 2]);
    }
    expect(JSON.stringify([legacy, current])).toBe(before);
  });
});

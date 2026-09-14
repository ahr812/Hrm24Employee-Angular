import { Fish24DocumentPricingPreviewService, DocumentPricingDraft, DocumentPricingRecord, validateRialPrice } from './fish24-document-pricing-preview.service';
import { Fish24FinancialPreviewService } from './fish24-financial-preview.service';

describe('Fish24DocumentPricingPreviewService', () => {
  let service: Fish24DocumentPricingPreviewService;

  beforeEach(() => { service = new Fish24DocumentPricingPreviewService(); });

  it('accepts zero and integer rial values while rejecting empty, decimal, negative and invalid values', () => {
    expect(validateRialPrice('۰')).toBe(0);
    expect(validateRialPrice('۱۲۳۴')).toBe(1234);
    expect(validateRialPrice('')).toBeNull();
    expect(validateRialPrice('1.5')).toBeNull();
    expect(validateRialPrice('-1')).toBeNull();
    expect(validateRialPrice('abc')).toBeNull();
  });

  it('requires valid dates and every price field', () => {
    const empty = service.savePricing(emptyDraft(), null);
    expect(empty.ok).toBeFalse();
    expect(empty.fieldErrors['startDate']).toBeDefined();
    expect(empty.fieldErrors['endDate']).toBeDefined();
    expect(empty.fieldErrors['page1Rial']).toBeDefined();
    expect(empty.fieldErrors['personnel12Rial']).toBeDefined();
    const reversed = service.savePricing({ ...validDraft('1406/02/01', '1406/01/01') }, null);
    expect(reversed.ok).toBeFalse();
    expect(reversed.fieldErrors['endDate']).toBeDefined();
  });

  it('treats active boundaries as inclusive, accepts adjacent periods and permits inactive overlap', () => {
    const sharedBoundary = service.savePricing(validDraft('1405/12/29', '1406/01/20'), null);
    expect(sharedBoundary.ok).toBeFalse();
    expect(sharedBoundary.conflict?.id).toBe(12);
    expect(service.savePricing(validDraft('1406/01/01', '1406/12/29'), null).ok).toBeTrue();
    expect(service.savePricing({ ...validDraft('1405/06/01', '1405/08/01'), isActive: false }, null).ok).toBeTrue();
  });

  it('rejects conflicting activation and excludes the edited record itself', () => {
    const created = service.savePricing({ ...validDraft('1405/06/01', '1405/08/01'), isActive: false }, null);
    expect(created.ok).toBeTrue();
    const inactive = service.pricingSettings().find(record => !record.isActive)!;
    expect(service.togglePricing(inactive.id).conflict?.id).toBe(12);
    const existingActive = service.pricingSettings().find(record => record.id === 12)!;
    expect(service.savePricing(draftFrom(existingActive), existingActive.id).ok).toBeTrue();
  });

  it('calculates page and optional SMS charges by page count without multiplying by duration', () => {
    const threeMonth = service.quote({ sourceOperationId: 'calc-3', issueDate: '1405/06/01', pageCount: 2, durationMonths: 3, smsEnabled: true });
    expect(threeMonth.receipt?.breakdown.pageChargeRial).toBe(500_000);
    expect(threeMonth.receipt?.breakdown.smsChargeRial).toBe(20_000);
    expect(threeMonth.receipt?.breakdown.totalRial).toBe(520_000);
    const noSms = service.quote({ sourceOperationId: 'calc-12', issueDate: '1405/06/01', pageCount: 2, durationMonths: 12, smsEnabled: false });
    expect(noSms.receipt?.breakdown.pageChargeRial).toBe(1_000_000);
    expect(noSms.receipt?.breakdown.smsChargeRial).toBe(0);
    expect(noSms.receipt?.breakdown.totalRial).toBe(1_000_000);
  });

  it('creates one internal receipt per operation and does not duplicate it', () => {
    const input = { sourceOperationId: 'distribution-1', issueDate: '1405/06/01', pageCount: 3, durationMonths: 1 as const, smsEnabled: false };
    const first = service.createInternalReceipt(input);
    const second = service.createInternalReceipt(input);
    expect(first.ok).toBeTrue();
    expect(first.existing).toBeFalse();
    expect(second.existing).toBeTrue();
    expect(service.internalReceipts().length).toBe(1);
    expect(service.internalReceipts()[0].id).toBe('document-receipt-distribution-1');
    expect(service.internalReceipts()[0].smsEnabled).toBeTrue();
    expect(service.internalReceipts()[0].breakdown.smsChargeRial).toBe(30_000);
  });

  it('always includes mandatory SMS for new receipts when either page or SMS unit price is zero', () => {
    const zeroPage = validDraft('1406/01/01', '1406/06/31');
    expect(service.savePricing({ ...zeroPage, page1Rial: '0', smsUnitPriceRial: '100' }, null).ok).toBeTrue();
    const pageFree = service.createInternalReceipt({ sourceOperationId: 'zero-page', issueDate: '1406/02/01', pageCount: 2, durationMonths: 1, smsEnabled: false }).receipt!;
    expect(pageFree.breakdown).toEqual({ pageUnitPriceRial: 0, pageChargeRial: 0, smsUnitPriceRial: 100, smsChargeRial: 200, totalRial: 200 });

    const zeroSms = validDraft('1406/07/01', '1406/12/29');
    expect(service.savePricing({ ...zeroSms, page1Rial: '100', smsUnitPriceRial: '0' }, null).ok).toBeTrue();
    const smsFree = service.createInternalReceipt({ sourceOperationId: 'zero-sms', issueDate: '1406/08/01', pageCount: 2, durationMonths: 1, smsEnabled: false }).receipt!;
    expect(smsFree.breakdown).toEqual({ pageUnitPriceRial: 100, pageChargeRial: 200, smsUnitPriceRial: 0, smsChargeRial: 0, totalRial: 200 });
  });

  it('preserves the recorded SMS metadata of a historical fixture during recalculation', () => {
    const historical = service.quote({ sourceOperationId: 'legacy-without-sms', issueDate: '1405/06/01', pageCount: 2, durationMonths: 1, smsEnabled: false }).receipt!;
    service['receiptsState'].set([historical]);
    const setting = service.pricingSettings().find(record => record.id === 12)!;
    expect(service.savePricing(draftFrom(setting, { page1Rial: '210000' }), setting.id).ok).toBeTrue();
    expect(service.internalReceipts()[0].smsEnabled).toBeFalse();
    expect(service.internalReceipts()[0].breakdown.smsChargeRial).toBe(0);
  });

  it('recalculates historical test receipts from immutable metadata and remains idempotent', () => {
    service.createInternalReceipt({ sourceOperationId: 'historical-fixture', issueDate: '1405/06/01', pageCount: 3, durationMonths: 1, smsEnabled: true });
    const setting = service.pricingSettings().find(record => record.id === 12)!;
    const edited = draftFrom(setting, { page1Rial: '300000', smsUnitPriceRial: '20000' });
    expect(service.savePricing(edited, setting.id).ok).toBeTrue();
    const once = service.internalReceipts()[0];
    expect(once.breakdown.totalRial).toBe(960_000);
    expect(service.savePricing(edited, setting.id).ok).toBeTrue();
    expect(service.internalReceipts()[0]).toEqual(once);
  });

  it('rejects atomically a mutation that would orphan a dependent receipt', () => {
    service.createInternalReceipt({ sourceOperationId: 'orphan-fixture', issueDate: '1405/06/01', pageCount: 1, durationMonths: 1, smsEnabled: false });
    const settingsBefore = service.pricingSettings();
    const receiptsBefore = service.internalReceipts();
    const result = service.togglePricing(12);
    expect(result.ok).toBeFalse();
    expect(result.orphanedReceipt?.sourceOperationId).toBe('orphan-fixture');
    expect(service.pricingSettings()).toBe(settingsBefore);
    expect(service.internalReceipts()).toBe(receiptsBefore);
  });

  it('does not involve wallet top-up invoices in pricing changes and preserves their VAT behavior', () => {
    const financial = new Fish24FinancialPreviewService();
    const invoicesBefore = JSON.stringify(financial.invoices());
    expect(service.savePricing(validDraft('1406/01/01', '1406/12/29'), null).ok).toBeTrue();
    expect(JSON.stringify(financial.invoices())).toBe(invoicesBefore);
    expect(financial.calculateVat(100_000, '1405/06/01')).toEqual({ vatAmountRial: 10_000, finalAmountRial: 110_000 });
  });

  it('blocks a document operation when no active pricing matches its issue date', () => {
    const result = service.createInternalReceipt({ sourceOperationId: 'outside-range', issueDate: '1406/06/01', pageCount: 1, durationMonths: 1, smsEnabled: false });
    expect(result.ok).toBeFalse();
    expect(result.error).toContain('تعرفه فعال');
    expect(service.internalReceipts().length).toBe(0);
  });
});

function validDraft(startDate = '1406/01/01', endDate = '1406/12/29'): DocumentPricingDraft {
  return {
    startDate, endDate, smsUnitPriceRial: '10000', postalUnitPriceRial: '1000000',
    page1Rial: '100', page3Rial: '200', page6Rial: '300', page12Rial: '400',
    file1Rial: '500', file3Rial: '600', file6Rial: '700', file12Rial: '800',
    personnel1Rial: '900', personnel3Rial: '1000', personnel6Rial: '1100', personnel12Rial: '1200',
    isActive: true
  };
}

function emptyDraft(): DocumentPricingDraft {
  return {
    startDate: '', endDate: '', smsUnitPriceRial: '', postalUnitPriceRial: '',
    page1Rial: '', page3Rial: '', page6Rial: '', page12Rial: '',
    file1Rial: '', file3Rial: '', file6Rial: '', file12Rial: '',
    personnel1Rial: '', personnel3Rial: '', personnel6Rial: '', personnel12Rial: '',
    isActive: true
  };
}

function draftFrom(record: DocumentPricingRecord, overrides: Partial<DocumentPricingDraft> = {}): DocumentPricingDraft {
  return {
    startDate: record.startDate, endDate: record.endDate,
    smsUnitPriceRial: String(record.smsUnitPriceRial), postalUnitPriceRial: String(record.postalUnitPriceRial),
    page1Rial: String(record.pagePricesRial[1]), page3Rial: String(record.pagePricesRial[3]), page6Rial: String(record.pagePricesRial[6]), page12Rial: String(record.pagePricesRial[12]),
    file1Rial: String(record.filePricesRial[1]), file3Rial: String(record.filePricesRial[3]), file6Rial: String(record.filePricesRial[6]), file12Rial: String(record.filePricesRial[12]),
    personnel1Rial: String(record.personnelPricesRial[1]), personnel3Rial: String(record.personnelPricesRial[3]), personnel6Rial: String(record.personnelPricesRial[6]), personnel12Rial: String(record.personnelPricesRial[12]),
    isActive: record.isActive,
    ...overrides
  };
}

import { Fish24FinancialPreviewService, VatSettingDraft, normalizeJalaliDate, validateVatPercent, vatPeriodsOverlap } from './fish24-financial-preview.service';

describe('Fish24FinancialPreviewService', () => {
  const validDraft = (overrides: Partial<VatSettingDraft> = {}): VatSettingDraft => ({
    title: 'بازه آزمون', startDate: '۱۴۰۶/۰۱/۰۱', endDate: '۱۴۰۶/۱۲/۲۹', taxPercent: '۶.۵', dutyPercent: '۳٫۵', description: '', isActive: true, ...overrides
  });

  it('validates percentages, Jalali dates and inclusive period overlap', () => {
    expect(validateVatPercent('۰')).toBe(0);
    expect(validateVatPercent('۶٫۵')).toBe(6.5);
    expect(validateVatPercent('-1')).toBeNull();
    expect(validateVatPercent('101')).toBeNull();
    expect(normalizeJalaliDate('۱۴۰۵/۰۱/۰۱')).toBe('1405/01/01');
    expect(normalizeJalaliDate('1405/13/01')).toBeNull();
    expect(vatPeriodsOverlap({ startDate: '1405/01/01', endDate: '1405/06/31' }, { startDate: '1405/06/31', endDate: '1405/12/29' })).toBeTrue();
  });

  it('keeps historical invoice snapshots unchanged on construction', () => {
    const service = new Fish24FinancialPreviewService();
    expect(service.findInvoice(1)?.amountRial).toBe(250_000);
    expect(service.findInvoice(1)?.line.afterDiscountAmountRial).toBe(227_273);
    expect(service.findInvoice(1)?.line.taxAmountRial).toBe(22_727);
    expect([service.findInvoice(1)?.vatRatePercent, service.findInvoice(1)?.vatSettingId]).toEqual([10, 5]);
  });

  it('splits VAT-inclusive gross to whole rials and reconciles exactly', () => {
    const service = new Fish24FinancialPreviewService();
    expect(service.splitVatIncluded(110, '1405/06/01')).toEqual({
      grossAmountRial: 110, baseAmountRial: 100, taxAmountRial: 10, vatRatePercent: 10, vatSettingId: 5
    });
    const rounded = service.splitVatIncluded(100, '1405/06/01');
    expect(rounded.baseAmountRial).toBe(91);
    expect(rounded.baseAmountRial + rounded.taxAmountRial).toBe(rounded.grossAmountRial);
  });

  it('uses zero VAT when no active setting applies', () => {
    const service = new Fish24FinancialPreviewService();
    expect(service.splitVatIncluded(110, '1406/01/01')).toEqual({
      grossAmountRial: 110, baseAmountRial: 110, taxAmountRial: 0, vatRatePercent: 0, vatSettingId: null
    });
    expect(service.toggleVatSetting(5).ok).toBeTrue();
    expect(service.splitVatIncluded(110, '1405/06/01').taxAmountRial).toBe(0);
  });

  it('persists an issuance snapshot and never changes it on deactivation or reactivation', () => {
    const service = new Fish24FinancialPreviewService();
    const issued = service.issueManualInvoice('vat-snapshot', '1001', 110, '1405/06/01').invoice!;
    expect([issued.line.afterDiscountAmountRial, issued.line.taxAmountRial, issued.amountRial]).toEqual([100, 10, 110]);
    expect([issued.vatRatePercent, issued.vatSettingId]).toEqual([10, 5]);
    expect(service.toggleVatSetting(5).ok).toBeTrue();
    expect(service.findInvoice(issued.id)).toEqual(issued);
    const noVat = service.issueManualInvoice('vat-inactive', '1001', 110, '1405/06/02').invoice!;
    expect([noVat.line.afterDiscountAmountRial, noVat.line.taxAmountRial, noVat.amountRial]).toEqual([110, 0, 110]);
    expect(service.toggleVatSetting(5).ok).toBeTrue();
    expect(service.findInvoice(issued.id)).toEqual(issued);
    expect(service.findInvoice(noVat.id)).toEqual(noVat);
  });

  it('rejects edit and delete using the setting current range even when proposed dates move', () => {
    const service = new Fish24FinancialPreviewService();
    const current = service.vatSettings().find(setting => setting.id === 5)!;
    const edit = service.saveVatSetting(validDraft({ startDate: '1407/01/01', endDate: '1407/12/29' }), current.id);
    expect(edit.ok).toBeFalse();
    expect(edit.protectedSetting?.id).toBe(5);
    expect(service.vatSettings().find(setting => setting.id === 5)).toEqual(current);
    expect(service.deleteVatSetting(5).protectedSetting?.id).toBe(5);
  });

  it('protects both inclusive boundaries after invoice issuance', () => {
    const service = new Fish24FinancialPreviewService();
    expect(service.saveVatSetting(validDraft({ startDate: '1406/01/01', endDate: '1406/01/02' }), null).ok).toBeTrue();
    const setting = service.vatSettings().find(item => item.title === 'بازه آزمون')!;
    service.issueManualInvoice('boundary-start', '1001', 110, '1406/01/01');
    service.issueManualInvoice('boundary-end', '1001', 110, '1406/01/02');
    expect(service.saveVatSetting(validDraft({ title: 'جابجایی', startDate: '1407/01/01', endDate: '1407/12/29' }), setting.id).protectedSetting?.id).toBe(setting.id);
    expect(service.deleteVatSetting(setting.id).protectedSetting?.id).toBe(setting.id);
  });

  it('allows deactivation for protected periods and retains activation overlap protection', () => {
    const service = new Fish24FinancialPreviewService();
    const before = service.invoices();
    expect(service.toggleVatSetting(5).ok).toBeTrue();
    expect(service.invoices()).toBe(before);
    expect(service.toggleVatSetting(5).ok).toBeTrue();
    expect(service.saveVatSetting(validDraft({ startDate: '1405/06/01', endDate: '1405/07/01', isActive: false }), null).ok).toBeTrue();
    const inactive = service.vatSettings().find(setting => setting.title === 'بازه آزمون')!;
    expect(service.toggleVatSetting(inactive.id).conflict?.id).toBe(5);
  });

  it('allows editing and deleting a setting that has no issued invoices', () => {
    const service = new Fish24FinancialPreviewService();
    expect(service.saveVatSetting(validDraft(), null).ok).toBeTrue();
    const setting = service.vatSettings().find(item => item.title === 'بازه آزمون')!;
    expect(service.saveVatSetting(validDraft({ title: 'ویرایش مجاز', isActive: false }), setting.id).ok).toBeTrue();
    expect(service.deleteVatSetting(setting.id).ok).toBeTrue();
  });

  it('retains add-on VAT calculation for document-pricing receipts', () => {
    const service = new Fish24FinancialPreviewService();
    expect(service.calculateVat(100_000, '1405/06/01')).toEqual({ vatAmountRial: 10_000, finalAmountRial: 110_000 });
  });
});

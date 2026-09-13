import { Fish24FinancialPreviewService, VatSettingDraft, normalizeJalaliDate, validateVatPercent, vatPeriodsOverlap } from './fish24-financial-preview.service';

describe('Fish24FinancialPreviewService', () => {
  const validDraft = (overrides: Partial<VatSettingDraft> = {}): VatSettingDraft => ({
    title: 'بازه آزمون',
    startDate: '۱۴۰۶/۰۱/۰۱',
    endDate: '۱۴۰۶/۱۲/۲۹',
    taxPercent: '۶.۵',
    dutyPercent: '۳٫۵',
    description: '',
    isActive: true,
    ...overrides
  });

  it('accepts zero and Persian decimals but rejects invalid percentages and totals above 100', () => {
    expect(validateVatPercent('۰')).toBe(0);
    expect(validateVatPercent('۶٫۵')).toBe(6.5);
    expect(validateVatPercent('-1')).toBeNull();
    expect(validateVatPercent('')).toBeNull();
    expect(validateVatPercent('abc')).toBeNull();
    expect(validateVatPercent('Infinity')).toBeNull();
    expect(validateVatPercent('101')).toBeNull();

    const service = new Fish24FinancialPreviewService();
    const result = service.saveVatSetting(validDraft({ taxPercent: '60', dutyPercent: '41' }), null);
    expect(result.ok).toBeFalse();
    expect(result.fieldErrors['totalPercent']).toBeTruthy();
    expect(service.saveVatSetting(validDraft({ taxPercent: '60', dutyPercent: '40' }), null).ok).toBeTrue();
  });

  it('validates Jalali dates and treats shared boundaries as overlap', () => {
    expect(normalizeJalaliDate('۱۴۰۵/۰۱/۰۱')).toBe('1405/01/01');
    expect(normalizeJalaliDate('1405/13/01')).toBeNull();
    expect(normalizeJalaliDate('1404/12/30')).toBeNull();
    expect(vatPeriodsOverlap(
      { startDate: '1405/01/01', endDate: '1405/06/31' },
      { startDate: '1405/06/31', endDate: '1405/12/29' }
    )).toBeTrue();
    expect(vatPeriodsOverlap(
      { startDate: '1405/02/01', endDate: '1405/03/01' },
      { startDate: '1405/01/01', endDate: '1405/12/29' }
    )).toBeTrue();
    expect(vatPeriodsOverlap(
      { startDate: '1405/01/01', endDate: '1405/12/29' },
      { startDate: '1405/02/01', endDate: '1405/03/01' }
    )).toBeTrue();
    expect(vatPeriodsOverlap(
      { startDate: '1405/01/01', endDate: '1405/01/01' },
      { startDate: '1405/01/02', endDate: '1405/01/02' }
    )).toBeFalse();
  });

  it('rejects active overlap atomically while allowing inactive overlap', () => {
    const service = new Fish24FinancialPreviewService();
    const beforeSettings = service.vatSettings();
    const beforeInvoices = service.invoices();
    const rejected = service.saveVatSetting(validDraft({ startDate: '1405/12/29', endDate: '1406/02/01' }), null);
    expect(rejected.ok).toBeFalse();
    expect(rejected.conflict?.id).toBe(5);
    expect(service.vatSettings()).toBe(beforeSettings);
    expect(service.invoices()).toBe(beforeInvoices);
    expect(service.saveVatSetting(validDraft({ startDate: '1405/12/29', endDate: '1406/02/01', isActive: false }), null).ok).toBeTrue();
  });

  it('blocks activation of an overlapping inactive period and permits self-edit', () => {
    const service = new Fish24FinancialPreviewService();
    expect(service.saveVatSetting(validDraft({ startDate: '1405/06/01', endDate: '1405/07/01', isActive: false }), null).ok).toBeTrue();
    const inactive = service.vatSettings().find(setting => setting.title === 'بازه آزمون')!;
    expect(service.toggleVatSetting(inactive.id).conflict?.id).toBe(5);
    const current = service.vatSettings().find(setting => setting.id === 5)!;
    expect(service.saveVatSetting({
      title: '  سال ۱۴۰۵ ویرایش‌شده  ',
      startDate: current.startDate,
      endDate: current.endDate,
      taxPercent: String(current.taxPercent),
      dutyPercent: String(current.dutyPercent),
      description: '',
      isActive: true
    }, current.id).ok).toBeTrue();
    expect(service.vatSettings().find(setting => setting.id === 5)?.title).toBe('سال ۱۴۰۵ ویرایش‌شده');
  });

  it('accepts a valid same-day period and an adjacent non-overlapping active period', () => {
    const service = new Fish24FinancialPreviewService();
    expect(service.saveVatSetting(validDraft({ startDate: '1406/01/01', endDate: '1406/01/01' }), null).ok).toBeTrue();
    expect(service.saveVatSetting(validDraft({ title: 'روز بعد', startDate: '1406/01/02', endDate: '1406/01/02' }), null).ok).toBeTrue();
  });

  it('matches both inclusive boundaries and excludes dates outside the period', () => {
    const service = new Fish24FinancialPreviewService();
    expect(service.calculateVat(1_000, '1405/01/01').vatAmountRial).toBe(100);
    expect(service.calculateVat(1_000, '1405/12/29').vatAmountRial).toBe(100);
    expect(service.calculateVat(1_000, '1406/01/01').vatAmountRial).toBe(0);
  });

  it('recalculates every historical invoice in the edited period from the authoritative after-discount base', () => {
    const service = new Fish24FinancialPreviewService();
    expect(service.findInvoice(1)?.line.taxAmountRial).toBe(25_000);
    const current = service.vatSettings().find(setting => setting.id === 5)!;
    const result = service.saveVatSetting({
      title: current.title,
      startDate: current.startDate,
      endDate: current.endDate,
      taxPercent: '5',
      dutyPercent: '2',
      description: current.description,
      isActive: true
    }, current.id);
    expect(result.ok).toBeTrue();
    expect(service.findInvoice(1)?.line.taxAmountRial).toBe(17_500);
    expect(service.findInvoice(1)?.amountRial).toBe(267_500);
    expect(service.findInvoice(5)?.line.taxAmountRial).toBe(56_000);
  });

  it('removes, reapplies and date-resolves VAT without compounding', () => {
    const service = new Fish24FinancialPreviewService();
    expect(service.toggleVatSetting(5).ok).toBeTrue();
    expect(service.findInvoice(1)?.line.taxAmountRial).toBe(0);
    expect(service.findInvoice(1)?.amountRial).toBe(250_000);
    expect(service.toggleVatSetting(5).ok).toBeTrue();
    expect(service.findInvoice(1)?.line.taxAmountRial).toBe(25_000);
    expect(service.toggleVatSetting(5).ok).toBeTrue();
    expect(service.toggleVatSetting(5).ok).toBeTrue();
    expect(service.findInvoice(1)?.line.taxAmountRial).toBe(25_000);

    const current = service.vatSettings().find(setting => setting.id === 5)!;
    expect(service.saveVatSetting({
      title: current.title,
      startDate: '1405/06/01',
      endDate: current.endDate,
      taxPercent: String(current.taxPercent),
      dutyPercent: String(current.dutyPercent),
      description: current.description,
      isActive: true
    }, current.id).ok).toBeTrue();
    expect(service.findInvoice(1)?.line.taxAmountRial).toBe(25_000);
    expect(service.findInvoice(2)?.line.taxAmountRial).toBe(0);
  });

  it('updates old and new ranges when a period moves while preserving unaffected invoice identity and base', () => {
    const service = new Fish24FinancialPreviewService();
    const unaffectedBefore = service.findInvoice(1)!;
    const current = service.vatSettings().find(setting => setting.id === 5)!;
    expect(service.saveVatSetting({
      title: current.title,
      startDate: '1405/03/01',
      endDate: '1405/05/30',
      taxPercent: String(current.taxPercent),
      dutyPercent: String(current.dutyPercent),
      description: current.description,
      isActive: true
    }, current.id).ok).toBeTrue();
    const movedOutside = service.findInvoice(1)!;
    const movedInside = service.findInvoice(2)!;
    expect(movedOutside.id).toBe(unaffectedBefore.id);
    expect(movedOutside.issuedAt).toBe(unaffectedBefore.issuedAt);
    expect(movedOutside.line.afterDiscountAmountRial).toBe(unaffectedBefore.line.afterDiscountAmountRial);
    expect(movedOutside.line.taxAmountRial).toBe(0);
    expect(movedInside.line.taxAmountRial).toBe(50_000);

    expect(service.saveVatSetting({
      title: current.title,
      startDate: '1405/02/01',
      endDate: '1405/06/30',
      taxPercent: String(current.taxPercent),
      dutyPercent: String(current.dutyPercent),
      description: current.description,
      isActive: true
    }, current.id).ok).toBeTrue();
    expect(service.findInvoice(1)?.line.taxAmountRial).toBe(25_000);
    expect(service.findInvoice(5)?.line.taxAmountRial).toBe(80_000);
  });
});

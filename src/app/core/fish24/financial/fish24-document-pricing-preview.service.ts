import { Injectable, computed, signal } from '@angular/core';
import { normalizeFish24Digits, normalizeJalaliDate } from './fish24-financial-preview.service';

export type DocumentPricingDurationMonths = 1 | 3 | 6 | 12;
export type DocumentPricingCategory = 'page' | 'file' | 'personnel';
export type DocumentPricingPriceField = Exclude<keyof DocumentPricingDraft, 'startDate' | 'endDate' | 'isActive'>;

export interface DocumentPricingRecord {
  readonly id: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly smsUnitPriceRial: number;
  readonly postalUnitPriceRial: number;
  readonly pagePricesRial: Readonly<Record<DocumentPricingDurationMonths, number>>;
  readonly filePricesRial: Readonly<Record<DocumentPricingDurationMonths, number>>;
  readonly personnelPricesRial: Readonly<Record<DocumentPricingDurationMonths, number>>;
  readonly isActive: boolean;
}

export interface DocumentPricingDraft {
  readonly startDate: string;
  readonly endDate: string;
  readonly smsUnitPriceRial: string;
  readonly postalUnitPriceRial: string;
  readonly page1Rial: string;
  readonly page3Rial: string;
  readonly page6Rial: string;
  readonly page12Rial: string;
  readonly file1Rial: string;
  readonly file3Rial: string;
  readonly file6Rial: string;
  readonly file12Rial: string;
  readonly personnel1Rial: string;
  readonly personnel3Rial: string;
  readonly personnel6Rial: string;
  readonly personnel12Rial: string;
  readonly isActive: boolean;
}

export interface InternalDocumentReceiptInput {
  readonly sourceOperationId: string;
  readonly issueDate: string;
  readonly pageCount: number;
  readonly durationMonths: DocumentPricingDurationMonths;
  readonly smsEnabled: boolean;
}

export interface InternalDocumentReceiptBreakdown {
  readonly pageUnitPriceRial: number;
  readonly pageChargeRial: number;
  readonly smsUnitPriceRial: number;
  readonly smsChargeRial: number;
  readonly totalRial: number;
}

export interface InternalDocumentReceipt extends InternalDocumentReceiptInput {
  readonly id: string;
  readonly appliedPricingId: number;
  readonly breakdown: InternalDocumentReceiptBreakdown;
}

export interface PricingMutationResult {
  readonly ok: boolean;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly conflict?: DocumentPricingRecord;
  readonly orphanedReceipt?: InternalDocumentReceipt;
}

export interface ReceiptCreationResult {
  readonly ok: boolean;
  readonly receipt?: InternalDocumentReceipt;
  readonly existing: boolean;
  readonly error?: string;
}

const DURATIONS: readonly DocumentPricingDurationMonths[] = [1, 3, 6, 12];

export function validateRialPrice(value: string): number | null {
  const normalized = normalizeFish24Digits(value).trim();
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function pricingPeriodsOverlap(
  left: Pick<DocumentPricingRecord, 'startDate' | 'endDate'>,
  right: Pick<DocumentPricingRecord, 'startDate' | 'endDate'>
): boolean {
  return left.startDate <= right.endDate && left.endDate >= right.startDate;
}

@Injectable({ providedIn: 'root' })
export class Fish24DocumentPricingPreviewService {
  private readonly settingsState = signal<readonly DocumentPricingRecord[]>([
    this.seedRecord(12, '1405/01/01', '1405/12/29', [200_000, 250_000, 400_000, 500_000], 10_000, 2_000_000),
    this.seedRecord(11, '1404/01/01', '1404/12/29', [120_000, 140_000, 230_000, 290_000], 7_500, 1_000_000),
    this.seedRecord(10, '1403/01/01', '1403/12/29', [95_000, 105_000, 180_000, 230_000], 7_500, 1_000_000)
  ]);
  private readonly receiptsState = signal<readonly InternalDocumentReceipt[]>([]);

  readonly pricingSettings = this.settingsState.asReadonly();
  readonly internalReceipts = this.receiptsState.asReadonly();
  readonly activePricingSettings = computed(() => this.settingsState().filter(setting => setting.isActive));

  quote(input: InternalDocumentReceiptInput): ReceiptCreationResult {
    const validationError = this.validateReceiptInput(input);
    if (validationError) return { ok: false, existing: false, error: validationError };
    const receipt = this.calculateReceipt(input, this.settingsState());
    return receipt
      ? { ok: true, receipt, existing: false }
      : { ok: false, existing: false, error: `برای تاریخ ${input.issueDate} تعرفه فعال وجود ندارد.` };
  }

  createInternalReceipt(input: InternalDocumentReceiptInput): ReceiptCreationResult {
    const existing = this.receiptsState().find(receipt => receipt.sourceOperationId === input.sourceOperationId);
    if (existing) return { ok: true, receipt: existing, existing: true };
    const result = this.quote(input);
    if (!result.ok || !result.receipt) return result;
    this.receiptsState.update(receipts => [result.receipt!, ...receipts]);
    return result;
  }

  savePricing(draft: DocumentPricingDraft, editingId: number | null): PricingMutationResult {
    const validated = this.validateDraft(draft);
    if (!validated.ok || !validated.record) return { ok: false, fieldErrors: validated.fieldErrors };
    const current = this.settingsState();
    const nextId = editingId ?? Math.max(0, ...current.map(setting => setting.id)) + 1;
    const candidate = { ...validated.record, id: nextId };
    const conflict = candidate.isActive
      ? current.find(setting => setting.isActive && setting.id !== editingId && pricingPeriodsOverlap(candidate, setting))
      : undefined;
    if (conflict) return { ok: false, fieldErrors: {}, conflict };
    const exists = editingId !== null && current.some(setting => setting.id === editingId);
    const nextSettings = exists
      ? current.map(setting => setting.id === editingId ? candidate : setting)
      : [candidate, ...current];
    return this.commitPricingState(nextSettings);
  }

  togglePricing(id: number): PricingMutationResult {
    const current = this.settingsState();
    const target = current.find(setting => setting.id === id);
    if (!target) return { ok: false, fieldErrors: {} };
    if (!target.isActive) {
      const conflict = current.find(setting => setting.isActive && setting.id !== id && pricingPeriodsOverlap(target, setting));
      if (conflict) return { ok: false, fieldErrors: {}, conflict };
    }
    return this.commitPricingState(current.map(setting => setting.id === id ? { ...setting, isActive: !setting.isActive } : setting));
  }

  private commitPricingState(settings: readonly DocumentPricingRecord[]): PricingMutationResult {
    const recalculated: InternalDocumentReceipt[] = [];
    for (const receipt of this.receiptsState()) {
      const next = this.calculateReceipt(receipt, settings);
      if (!next) return { ok: false, fieldErrors: {}, orphanedReceipt: receipt };
      recalculated.push(next);
    }
    this.settingsState.set(settings);
    this.receiptsState.set(recalculated);
    return { ok: true, fieldErrors: {} };
  }

  private calculateReceipt(input: InternalDocumentReceiptInput, settings: readonly DocumentPricingRecord[]): InternalDocumentReceipt | null {
    const issueDate = normalizeJalaliDate(input.issueDate);
    if (!issueDate) return null;
    const pricing = settings.find(setting => setting.isActive && setting.startDate <= issueDate && setting.endDate >= issueDate);
    if (!pricing) return null;
    const pageUnitPriceRial = pricing.pagePricesRial[input.durationMonths];
    const pageChargeRial = pageUnitPriceRial * input.pageCount;
    const smsUnitPriceRial = input.smsEnabled ? pricing.smsUnitPriceRial : 0;
    const smsChargeRial = smsUnitPriceRial * input.pageCount;
    return {
      id: `document-receipt-${input.sourceOperationId}`,
      sourceOperationId: input.sourceOperationId,
      issueDate,
      pageCount: input.pageCount,
      durationMonths: input.durationMonths,
      smsEnabled: input.smsEnabled,
      appliedPricingId: pricing.id,
      breakdown: { pageUnitPriceRial, pageChargeRial, smsUnitPriceRial, smsChargeRial, totalRial: pageChargeRial + smsChargeRial }
    };
  }

  private validateReceiptInput(input: InternalDocumentReceiptInput): string | null {
    if (!input.sourceOperationId.trim()) return 'شناسه عملیات توزیع معتبر نیست.';
    if (!normalizeJalaliDate(input.issueDate)) return 'تاریخ صدور رسید معتبر نیست.';
    if (!Number.isSafeInteger(input.pageCount) || input.pageCount <= 0) return 'تعداد صفحات معتبر نیست.';
    if (!DURATIONS.includes(input.durationMonths)) return 'مدت انتخاب‌شده معتبر نیست.';
    return null;
  }

  private validateDraft(draft: DocumentPricingDraft): { ok: boolean; record?: DocumentPricingRecord; fieldErrors: Readonly<Record<string, string>> } {
    const fieldErrors: Record<string, string> = {};
    const startDate = normalizeJalaliDate(draft.startDate);
    const endDate = normalizeJalaliDate(draft.endDate);
    if (!startDate) fieldErrors['startDate'] = 'تاریخ شروع معتبر و الزامی است.';
    if (!endDate) fieldErrors['endDate'] = 'تاریخ پایان معتبر و الزامی است.';
    if (startDate && endDate && startDate > endDate) fieldErrors['endDate'] = 'تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.';
    const values: Record<string, number> = {};
    for (const field of this.priceFields()) {
      const price = validateRialPrice(draft[field]);
      if (price === null) fieldErrors[field] = 'مبلغ صحیح و غیرمنفی به ریال وارد کنید.';
      else values[field] = price;
    }
    if (Object.keys(fieldErrors).length || !startDate || !endDate) return { ok: false, fieldErrors };
    return {
      ok: true,
      fieldErrors,
      record: {
        id: 0, startDate, endDate,
        smsUnitPriceRial: values['smsUnitPriceRial'], postalUnitPriceRial: values['postalUnitPriceRial'],
        pagePricesRial: { 1: values['page1Rial'], 3: values['page3Rial'], 6: values['page6Rial'], 12: values['page12Rial'] },
        filePricesRial: { 1: values['file1Rial'], 3: values['file3Rial'], 6: values['file6Rial'], 12: values['file12Rial'] },
        personnelPricesRial: { 1: values['personnel1Rial'], 3: values['personnel3Rial'], 6: values['personnel6Rial'], 12: values['personnel12Rial'] },
        isActive: draft.isActive
      }
    };
  }

  private priceFields(): readonly DocumentPricingPriceField[] {
    return ['smsUnitPriceRial', 'postalUnitPriceRial', 'page1Rial', 'page3Rial', 'page6Rial', 'page12Rial', 'file1Rial', 'file3Rial', 'file6Rial', 'file12Rial', 'personnel1Rial', 'personnel3Rial', 'personnel6Rial', 'personnel12Rial'];
  }

  private seedRecord(id: number, startDate: string, endDate: string, pages: readonly [number, number, number, number], sms: number, postal: number): DocumentPricingRecord {
    return {
      id, startDate, endDate, smsUnitPriceRial: sms, postalUnitPriceRial: postal,
      pagePricesRial: { 1: pages[0], 3: pages[1], 6: pages[2], 12: pages[3] },
      filePricesRial: { 1: 0, 3: 0, 6: 0, 12: 0 },
      personnelPricesRial: { 1: 0, 3: 0, 6: 0, 12: 0 },
      isActive: true
    };
  }
}

import { Injectable, computed, signal } from '@angular/core';
import {
  EMPLOYER_INVOICE_PREVIEWS,
  EmployerInvoicePreview,
  Fish24FormalInvoiceSource,
  LEGACY_FORMAL_INVOICE_PREVIEWS
} from '../../../features/fish24/employer/invoices/employer-invoice-preview.data';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export interface VatSettingRecord {
  readonly id: number;
  readonly createdAt: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly taxPercent: number;
  readonly dutyPercent: number;
  readonly description: string;
  readonly isActive: boolean;
}

export interface VatSettingDraft {
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly taxPercent: string;
  readonly dutyPercent: string;
  readonly description: string;
  readonly isActive: boolean;
}

export interface VatMutationResult {
  readonly ok: boolean;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly conflict?: VatSettingRecord;
}

export interface ManualInvoiceMutationResult {
  readonly ok: boolean;
  readonly invoice?: EmployerInvoicePreview;
  readonly existing: boolean;
}

export function normalizeFish24Digits(value: string): string {
  return value
    .replace(/[۰-۹]/g, digit => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String(ARABIC_DIGITS.indexOf(digit)));
}

export function normalizeJalaliDate(value: string): string | null {
  const normalized = normalizeFish24Digits(value).trim().replace(/[-.]/g, '/');
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(normalized);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1200 || year > 1600 || month < 1 || month > 12 || day < 1) return null;
  const maximumDay = month <= 6 ? 31 : month <= 11 ? 30 : isJalaliLeapYear(year) ? 30 : 29;
  if (day > maximumDay) return null;
  return `${year.toString().padStart(4, '0')}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
}

export function validateVatPercent(value: string): number | null {
  const normalized = normalizeFish24Digits(value).trim().replace(/٫|,/g, '.');
  if (!normalized || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}

export function vatPeriodsOverlap(left: Pick<VatSettingRecord, 'startDate' | 'endDate'>, right: Pick<VatSettingRecord, 'startDate' | 'endDate'>): boolean {
  return left.startDate <= right.endDate && left.endDate >= right.startDate;
}

function isJalaliLeapYear(year: number): boolean {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  let leapJ = -14;
  let previous = breaks[0];
  let jump = 0;
  for (let index = 1; index < breaks.length; index++) {
    const current = breaks[index];
    jump = current - previous;
    if (year < current) break;
    leapJ += Math.floor(jump / 33) * 8 + Math.floor((jump % 33) / 4);
    previous = current;
  }
  let offset = year - previous;
  leapJ += Math.floor(offset / 33) * 8 + Math.floor(((offset % 33) + 3) / 4);
  if (jump % 33 === 4 && jump - offset === 4) leapJ++;
  const march = 20 + leapJ - (Math.floor(year / 4) - Math.floor((Math.floor(year / 100) + 1) * 3 / 4) - 150);
  if (jump - offset < 6) offset = offset - jump + Math.floor((jump + 4) / 33) * 33;
  let leap = ((offset + 1) % 33 - 1) % 4;
  if (leap === -1) leap = 4;
  return march > 0 && leap === 0;
}

@Injectable({ providedIn: 'root' })
export class Fish24FinancialPreviewService {
  private readonly settingsState = signal<readonly VatSettingRecord[]>([
    { id: 3, createdAt: '1402/12/29', title: 'سال ۱۴۰۳', startDate: '1403/01/01', endDate: '1403/12/29', taxPercent: 6, dutyPercent: 4, description: '', isActive: true },
    { id: 4, createdAt: '1403/12/28', title: 'سال ۱۴۰۴', startDate: '1404/01/01', endDate: '1404/12/29', taxPercent: 6, dutyPercent: 4, description: '', isActive: true },
    { id: 5, createdAt: '1404/12/29', title: 'سال ۱۴۰۵', startDate: '1405/01/01', endDate: '1405/12/29', taxPercent: 6, dutyPercent: 4, description: '', isActive: true }
  ]);
  private readonly baseInvoices = EMPLOYER_INVOICE_PREVIEWS.map(invoice => ({
    ...invoice,
    line: { ...invoice.line }
  }));
  private readonly invoicesState = signal<readonly EmployerInvoicePreview[]>([]);
  private readonly manualBaseInvoicesState = signal<readonly EmployerInvoicePreview[]>([]);

  readonly vatSettings = this.settingsState.asReadonly();
  readonly invoices = this.invoicesState.asReadonly();
  readonly formalInvoiceSources = computed<readonly Fish24FormalInvoiceSource[]>(() => [
    ...this.invoicesState(),
    ...LEGACY_FORMAL_INVOICE_PREVIEWS
  ]);
  readonly activeVatSettings = computed(() => this.settingsState().filter(setting => setting.isActive));

  constructor() {
    this.recalculateInvoices(this.settingsState());
  }

  findInvoice(id: number): EmployerInvoicePreview | null {
    return this.invoicesState().find(invoice => invoice.id === id) ?? null;
  }

  issueManualInvoice(sourceTransactionId: string, amountRial: number, issueDate: string): ManualInvoiceMutationResult {
    const existing = this.invoicesState().find(invoice => invoice.sourceTransactionId === sourceTransactionId);
    if (existing) return { ok: true, invoice: existing, existing: true };
    const normalizedDate = normalizeJalaliDate(issueDate);
    if (!sourceTransactionId.trim() || !Number.isSafeInteger(amountRial) || amountRial <= 0 || !normalizedDate) {
      return { ok: false, existing: false };
    }
    const id = Math.max(0, ...this.invoicesState().map(invoice => invoice.id)) + 1;
    const invoiceNumber = String(Math.max(22560, ...this.invoicesState().map(invoice => Number(invoice.invoiceNumber) || 0)) + 1);
    const tax = this.calculateVat(amountRial, normalizedDate);
    const invoice: EmployerInvoicePreview = {
      id,
      title: 'فاکتور تراکنش دستی',
      invoiceNumber,
      issuedAt: normalizedDate,
      amountRial: tax.finalAmountRial,
      sourceTransactionId,
      line: {
        code: `MAN-${id}`,
        description: 'تراکنش دستی کیف پول',
        quantity: '۱',
        unit: 'خدمت',
        unitAmountRial: amountRial,
        totalAmountRial: amountRial,
        discountAmountRial: 0,
        afterDiscountAmountRial: amountRial,
        taxAmountRial: tax.vatAmountRial,
        finalAmountRial: tax.finalAmountRial
      }
    };
    this.manualBaseInvoicesState.update(invoices => [invoice, ...invoices]);
    this.recalculateInvoices(this.settingsState());
    return { ok: true, invoice: this.findInvoice(id)!, existing: false };
  }

  deleteManualInvoice(sourceTransactionId: string): boolean {
    const current = this.manualBaseInvoicesState();
    if (!current.some(invoice => invoice.sourceTransactionId === sourceTransactionId)) return false;
    this.manualBaseInvoicesState.set(current.filter(invoice => invoice.sourceTransactionId !== sourceTransactionId));
    this.recalculateInvoices(this.settingsState());
    return true;
  }

  saveVatSetting(draft: VatSettingDraft, editingId: number | null): VatMutationResult {
    const validated = this.validateDraft(draft);
    if (!validated.ok || !validated.record) return { ok: false, fieldErrors: validated.fieldErrors };
    const candidate = validated.record;
    const conflict = candidate.isActive
      ? this.settingsState().find(setting => setting.isActive && setting.id !== editingId && vatPeriodsOverlap(candidate, setting))
      : undefined;
    if (conflict) return { ok: false, fieldErrors: {}, conflict };

    const current = this.settingsState();
    const nextId = editingId ?? Math.max(0, ...current.map(setting => setting.id)) + 1;
    const existing = editingId === null ? null : current.find(setting => setting.id === editingId) ?? null;
    const saved: VatSettingRecord = {
      ...candidate,
      id: nextId,
      createdAt: existing?.createdAt ?? this.currentJalaliDate()
    };
    const nextSettings = existing
      ? current.map(setting => setting.id === editingId ? saved : setting)
      : [saved, ...current];
    this.commitFinancialState(nextSettings);
    return { ok: true, fieldErrors: {} };
  }

  toggleVatSetting(id: number): VatMutationResult {
    const current = this.settingsState();
    const target = current.find(setting => setting.id === id);
    if (!target) return { ok: false, fieldErrors: {} };
    if (!target.isActive) {
      const conflict = current.find(setting => setting.isActive && setting.id !== id && vatPeriodsOverlap(target, setting));
      if (conflict) return { ok: false, fieldErrors: {}, conflict };
    }
    const nextSettings = current.map(setting => setting.id === id ? { ...setting, isActive: !setting.isActive } : setting);
    this.commitFinancialState(nextSettings);
    return { ok: true, fieldErrors: {} };
  }

  calculateVat(baseAmountRial: number, issueDate: string, settings: readonly VatSettingRecord[] = this.settingsState()): { vatAmountRial: number; finalAmountRial: number } {
    const normalizedDate = normalizeJalaliDate(issueDate);
    const setting = normalizedDate
      ? settings.find(item => item.isActive && item.startDate <= normalizedDate && item.endDate >= normalizedDate)
      : undefined;
    const totalPercent = setting ? setting.taxPercent + setting.dutyPercent : 0;
    const vatAmountRial = Math.round(baseAmountRial * totalPercent / 100);
    return { vatAmountRial, finalAmountRial: baseAmountRial + vatAmountRial };
  }

  private validateDraft(draft: VatSettingDraft): { ok: boolean; record?: VatSettingRecord; fieldErrors: Readonly<Record<string, string>> } {
    const fieldErrors: Record<string, string> = {};
    const title = draft.title.trim();
    if (!title) fieldErrors['title'] = 'عنوان الزامی است.';
    const startDate = normalizeJalaliDate(draft.startDate);
    const endDate = normalizeJalaliDate(draft.endDate);
    if (!startDate) fieldErrors['startDate'] = 'تاریخ شروع معتبر نیست.';
    if (!endDate) fieldErrors['endDate'] = 'تاریخ پایان معتبر نیست.';
    if (startDate && endDate && startDate > endDate) fieldErrors['endDate'] = 'تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.';
    const taxPercent = validateVatPercent(draft.taxPercent);
    const dutyPercent = validateVatPercent(draft.dutyPercent);
    if (taxPercent === null) fieldErrors['taxPercent'] = 'درصد مالیات باید عددی بین ۰ تا ۱۰۰ باشد.';
    if (dutyPercent === null) fieldErrors['dutyPercent'] = 'درصد عوارض باید عددی بین ۰ تا ۱۰۰ باشد.';
    if (taxPercent !== null && dutyPercent !== null && taxPercent + dutyPercent > 100) {
      fieldErrors['totalPercent'] = 'جمع مالیات و عوارض نمی‌تواند بیشتر از ۱۰۰ درصد باشد.';
    }
    if (Object.keys(fieldErrors).length || !startDate || !endDate || taxPercent === null || dutyPercent === null) {
      return { ok: false, fieldErrors };
    }
    return {
      ok: true,
      fieldErrors,
      record: { id: 0, createdAt: '', title, startDate, endDate, taxPercent, dutyPercent, description: draft.description.trim(), isActive: draft.isActive }
    };
  }

  private commitFinancialState(settings: readonly VatSettingRecord[]): void {
    const recalculated = this.buildRecalculatedInvoices(settings);
    this.settingsState.set(settings);
    this.invoicesState.set(recalculated);
  }

  private recalculateInvoices(settings: readonly VatSettingRecord[]): void {
    this.invoicesState.set(this.buildRecalculatedInvoices(settings));
  }

  private buildRecalculatedInvoices(settings: readonly VatSettingRecord[]): readonly EmployerInvoicePreview[] {
    return [...this.manualBaseInvoicesState(), ...this.baseInvoices].map(invoice => {
      const result = this.calculateVat(invoice.line.afterDiscountAmountRial, invoice.issuedAt, settings);
      return {
        ...invoice,
        amountRial: result.finalAmountRial,
        line: { ...invoice.line, taxAmountRial: result.vatAmountRial, finalAmountRial: result.finalAmountRial }
      };
    });
  }

  private currentJalaliDate(): string {
    return normalizeFish24Digits(new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
  }
}

import type { InternalFormalInvoiceListItem } from '../../../../core/fish24/financial/fish24-internal-invoice-preview.service';
import { normalizeFish24Digits, normalizeJalaliDate } from '../../../../core/fish24/financial/fish24-financial-preview.service';
import type { PlainXlsxCell } from '../../../../shared/ui/data-list/plain-xlsx.service';

export const ACCOUNTING_VOUCHER_HEADERS = [
  'شماره سند', 'تاریخ', 'شرح سند', 'کد معین', 'نام معین', 'کد تفصیلی', 'نام تفصیلی',
  'کد سطح پنجم', 'نام سطح پنجم', 'کد سطح ششم', 'نام سطح ششم', 'شرح', 'بدهکار',
  'بستانکار', 'شماره پیگیری', 'تاریخ پیگیری'
] as const;

export interface AccountingVoucherExportResult {
  readonly rows: readonly (readonly PlainXlsxCell[])[];
  readonly exportedInvoiceCount: number;
  readonly excludedUnknownSources: readonly string[];
  readonly incompatibleTrackingSources: readonly string[];
}

export function buildAccountingVoucherExport(invoices: readonly InternalFormalInvoiceListItem[]): AccountingVoucherExportResult {
  const eligible = invoices.filter(invoice => invoice.voucherEligibility === 'credit');
  const excludedUnknownSources = invoices
    .filter(invoice => invoice.voucherEligibility === 'unknown')
    .map(invoice => invoice.sourceIdentity);
  const incompatibleTrackingSources: string[] = [];
  const rows: PlainXlsxCell[][] = [];

  eligible.forEach((invoice, index) => {
    const mobile = normalizeFish24Digits(invoice.mobile).replace(/\D/g, '');
    const date = normalizeJalaliDate(invoice.voucherDate);
    const employerName = invoice.userType === 'حقوقی' ? invoice.companyName?.trim() : invoice.name?.trim();
    const amount = invoice.voucherAmountRial;
    if (!/^09\d{9}$/.test(mobile) || !date || !employerName || !Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error(`Invoice ${invoice.sourceIdentity} is missing required accounting-voucher data.`);
    }

    const tracking = parseTracking(invoice.trackingIdentifier);
    if (tracking.incompatible) incompatibleTrackingSources.push(invoice.sourceIdentity);
    const trackingFragment = tracking.descriptionValue === null ? '' : ` پیگیری ${tracking.descriptionValue}`;
    const description = `واریز بابت سامانه فیش 24 توسط ${employerName} برای فاکتور ${invoice.formalInvoiceNumber}${trackingFragment}`;
    const voucherNumber = index + 1;
    const customerCode = Number(mobile.slice(1));
    const customerName = `${employerName} ${mobile}`;
    const shared: readonly PlainXlsxCell[] = [voucherNumber, date, null];
    const trailing: readonly PlainXlsxCell[] = [null, null, null, null, description];

    rows.push([
      ...shared, 111005, 'موجودی بانکهای ریالی', 47, 'بانک ملی', ...trailing,
      amount, 0, tracking.numericValue, date
    ]);
    rows.push([
      ...shared, 111201, 'حسابهای دریافتنی تجاری', customerCode, customerName, ...trailing,
      0, amount, tracking.numericValue, date
    ]);
  });

  return { rows, exportedInvoiceCount: eligible.length, excludedUnknownSources, incompatibleTrackingSources };
}

function parseTracking(value: string | null): { readonly descriptionValue: string | null; readonly numericValue: number | null; readonly incompatible: boolean } {
  const original = value?.trim() ?? '';
  if (!original) return { descriptionValue: null, numericValue: null, incompatible: false };
  const normalized = normalizeFish24Digits(original);
  if (!/^\d+$/.test(normalized)) return { descriptionValue: original, numericValue: null, incompatible: true };
  const numericValue = Number(normalized);
  if (!Number.isSafeInteger(numericValue)) return { descriptionValue: original, numericValue: null, incompatible: true };
  return { descriptionValue: original, numericValue, incompatible: false };
}

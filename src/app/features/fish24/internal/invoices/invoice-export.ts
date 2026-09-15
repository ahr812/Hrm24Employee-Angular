import type { InternalFormalInvoiceListItem } from '../../../../core/fish24/financial/fish24-internal-invoice-preview.service';
import { normalizeFish24Digits, normalizeJalaliDate } from '../../../../core/fish24/financial/fish24-financial-preview.service';
import type { PlainXlsxCell } from '../../../../shared/ui/data-list/plain-xlsx.service';

export const INVOICE_EXPORT_HEADERS = [
  'شماره فاکتور', 'تاریخ', 'کد مشتری', 'نام مشتری', 'کد معین دریافتنی', 'نام معین دریافتنی',
  'کد سطح چهارم دریافتنی', 'نام سطح چهارم دریافتنی', 'کد سطح پنجم دریافتنی', 'نام سطح پنجم دریافتنی',
  'کد سطح ششم دریافتنی', 'نام سطح ششم دریافتنی', 'کد کالا یا خدمت', 'نام کالا یا خدمت',
  'واحد اندازه گیری', 'کد انبار', 'نام انبار', 'تعداد یا مقدار', 'قیمت واحد', 'قیمت کل کالا',
  'کد معین فروش', 'نام معین فروش', 'کد سطح چهارم فروش', 'نام سطح چهارم فروش',
  'کد سطح پنجم فروش', 'نام سطح پنجم فروش', 'کد سطح ششم فروش', 'نام سطح ششم فروش',
  'شرح آرتیکل', 'کد الگوی تخفیف', 'مبلغ تخفیف', 'کد سطح چهارم تخفیف', 'نام سطح چهارم تخفیف',
  'کد سطح پنجم تخفیف', 'نام سطح پنجم تخفیف', 'کد سطح ششم تخفیف', 'نام سطح ششم تخفیف',
  'کد الگوی مالیات', 'مبلغ مالیات', 'کد سطح چهارم مالیات', 'نام سطح چهارم مالیات',
  'کد سطح پنجم مالیات', 'نام سطح پنجم مالیات', 'کد سطح ششم مالیات', 'نام سطح ششم مالیات'
] as const;

export function buildInvoiceExportRows(invoices: readonly InternalFormalInvoiceListItem[]): readonly (readonly PlainXlsxCell[])[] {
  return invoices.map(invoice => {
    const mobile = normalizeFish24Digits(invoice.mobile).replace(/\D/g, '');
    const issueDate = normalizeJalaliDate(invoice.issueDate);
    const customerName = invoice.userType === 'حقوقی' ? invoice.companyName?.trim() : invoice.name?.trim();
    if (!/^09\d{9}$/.test(mobile) || !issueDate || !customerName) {
      throw new Error(`Invoice ${invoice.sourceIdentity} is missing required export identity data.`);
    }
    const customerCode = Number(mobile.slice(1));
    const customerText = `${customerName} ${mobile}`;
    return [
      invoice.formalInvoiceNumber, issueDate, customerCode, customerText, 111201, 'حسابهای دریافتنی تجاری',
      customerCode, customerText, null, null, null, null, 600000, 'سامانه فیش حقوق', 'عدد', null, null, 1,
      invoice.baseAmountRial, invoice.baseAmountRial, 411017, 'فروش سامانه فیش حقوق', customerCode, customerText,
      null, null, null, null, null, null, null, null, null, null, null, null, null, 2, invoice.taxAmountRial,
      null, null, null, null, null, null
    ];
  });
}

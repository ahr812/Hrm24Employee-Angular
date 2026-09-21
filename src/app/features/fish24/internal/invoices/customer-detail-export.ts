import type { BusinessUserRecord } from '../users/business-user-preview.service';
import type { InternalFormalInvoiceListItem } from '../../../../core/fish24/financial/fish24-internal-invoice-preview.service';
import { normalizeFish24Digits } from '../../../../core/fish24/financial/fish24-financial-preview.service';
import type { PlainXlsxCell } from '../../../../shared/ui/data-list/plain-xlsx.service';

export const CUSTOMER_DETAIL_EXPORT_HEADERS = [
  'گروه تفصیلی', 'کد تفصیلی', 'نام تفصیلی', 'نوع', 'نام', 'نام خانوادگی',
  'شناسه یا کد ملی', 'شماره ثبت', 'کد اقتصادی', 'ایمیل', 'وب سایت', 'تلفن',
  'استان', 'شهر', 'نشانی', 'کد پستی'
] as const;

export type EmployerProfileResolver = (employerId: string) => BusinessUserRecord | null;

export function buildCustomerDetailExportRows(
  invoices: readonly InternalFormalInvoiceListItem[],
  resolveEmployer: EmployerProfileResolver
): readonly (readonly PlainXlsxCell[])[] {
  const seenEmployerIds = new Set<string>();
  const rows: PlainXlsxCell[][] = [];

  for (const invoice of invoices) {
    if (seenEmployerIds.has(invoice.employerId)) continue;
    seenEmployerIds.add(invoice.employerId);

    const employer = resolveEmployer(invoice.employerId);
    const mobile = normalizeFish24Digits(employer?.mobile ?? '').replace(/\D/g, '');
    if (!employer || !employer.roles.includes('employer') || !/^09\d{9}$/.test(mobile)) {
      throw new Error(`Invoice employer ${invoice.employerId} is missing a valid current profile.`);
    }

    const isLegal = employer.userType === 'حقوقی';
    const currentName = (isLegal ? employer.companyName : employer.fullName)?.trim() ?? '';
    if (!currentName) throw new Error(`Invoice employer ${invoice.employerId} is missing a current export name.`);

    const detailName = `${currentName} ${mobile}`;
    rows.push([
      'اشخاص و شرکت ها',
      Number(mobile.slice(1)),
      detailName,
      isLegal ? 'شرکت' : 'شخص',
      detailName,
      null,
      textOrNull(isLegal ? employer.companyNationalId : employer.nationalId),
      textOrNull(employer.registrationNumber),
      textOrNull(employer.economicCode),
      null,
      null,
      null,
      textOrNull(employer.province),
      textOrNull(employer.city),
      textOrNull(isLegal ? employer.registeredAddress : employer.invoiceAddress),
      null
    ]);
  }

  return rows;
}

function textOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed || null;
}

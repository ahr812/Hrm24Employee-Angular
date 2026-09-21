import type { InternalFormalInvoiceListItem } from '../../../../core/fish24/financial/fish24-internal-invoice-preview.service';
import { BusinessUserPreviewService } from '../users/business-user-preview.service';
import { buildCustomerDetailExportRows, CUSTOMER_DETAIL_EXPORT_HEADERS } from './customer-detail-export';

describe('customer detail export', () => {
  const invoice = (employerId: string, sourceIdentity = employerId): InternalFormalInvoiceListItem => ({
    sourceIdentity, employerId, formalInvoiceNumber: sourceIdentity, issueDate: '1405/06/21',
    mobile: '09121234567', name: 'نام تاریخی', companyName: 'شرکت تاریخی', userType: 'حقوقی',
    title: 'فاکتور', amountRial: 1, baseAmountRial: 1, taxAmountRial: 0,
    voucherEligibility: 'unknown', voucherAmountRial: 1, voucherDate: '1405/06/21', trackingIdentifier: null,
    linkedTransactionId: null, printableInvoiceId: null, deletionEligible: false, sourceKind: 'legacy', originalSource: {} as never
  });

  const resolver = (users: BusinessUserPreviewService) => (employerId: string) => users.findUser(Number(employerId));

  it('matches the exact 16-column reference headers', () => {
    expect(CUSTOMER_DETAIL_EXPORT_HEADERS).toEqual([
      'گروه تفصیلی', 'کد تفصیلی', 'نام تفصیلی', 'نوع', 'نام', 'نام خانوادگی',
      'شناسه یا کد ملی', 'شماره ثبت', 'کد اقتصادی', 'ایمیل', 'وب سایت', 'تلفن',
      'استان', 'شهر', 'نشانی', 'کد پستی'
    ]);
  });

  it('maps a legal employer from the current profile and preserves identity fields as literal text', () => {
    const users = new BusinessUserPreviewService();
    users.updateUser(1001, { companyNationalId: '0014012728654', registrationNumber: '=437885', economicCode: '+0042' });
    const [row] = buildCustomerDetailExportRows([invoice('1001')], resolver(users));
    expect(row).toEqual([
      'اشخاص و شرکت ها', 9121234567, 'مجموعه نمونه سپهر 09121234567', 'شرکت',
      'مجموعه نمونه سپهر 09121234567', null, '0014012728654', '=437885', '+0042',
      null, null, null, 'تهران', 'تهران', 'تهران، خیابان نمونه، پلاک ۱۲', null
    ]);
    expect(row.length).toBe(16);
  });

  it('maps a natural employer with full name, national ID and invoice address', () => {
    const users = new BusinessUserPreviewService();
    users.updateUser(1001, {
      userType: 'حقیقی', fullName: 'مریم احمدی', nationalId: '0012345678',
      invoiceAddress: 'تهران، نشانی دریافت فاکتور', registeredAddress: 'نباید صادر شود',
      registrationNumber: '', companyNationalId: '', economicCode: ''
    });
    const [row] = buildCustomerDetailExportRows([invoice('1001')], resolver(users));
    expect(row[2]).toBe('مریم احمدی 09121234567');
    expect(row[3]).toBe('شخص');
    expect(row[4]).toBe(row[2]);
    expect(row[5]).toBeNull();
    expect(row[6]).toBe('0012345678');
    expect(row[14]).toBe('تهران، نشانی دریافت فاکتور');
  });

  it('deduplicates by stable employer identity in first-occurrence order', () => {
    const users = new BusinessUserPreviewService();
    const rows = buildCustomerDetailExportRows([
      invoice('1002', 'first'), invoice('1001', 'second'), invoice('1002', 'duplicate'), invoice('1007', 'third')
    ], resolver(users));
    expect(rows.map(row => row[1])).toEqual([9129876543, 9121234567, 9123334455]);
  });

  it('reflects later profile changes and does not mutate invoice or profile state', () => {
    const users = new BusinessUserPreviewService();
    const invoices = [invoice('1001')];
    const beforeInvoices = JSON.stringify(invoices);
    const beforeUsers = JSON.stringify(users.users());
    expect(buildCustomerDetailExportRows(invoices, resolver(users))[0][2]).toContain('مجموعه نمونه سپهر');
    expect(JSON.stringify(invoices)).toBe(beforeInvoices);
    expect(JSON.stringify(users.users())).toBe(beforeUsers);

    users.updateUser(1001, { companyName: 'نام جاری تازه' });
    expect(buildCustomerDetailExportRows(invoices, resolver(users))[0][2]).toBe('نام جاری تازه 09121234567');
  });

  it('keeps unsupported contact and postal columns empty even when the profile contains values', () => {
    const users = new BusinessUserPreviewService();
    users.updateUser(1001, { email: 'ignored@example.test', landline: '02100000000', invoicePostalCode: '1234567890' });
    const [row] = buildCustomerDetailExportRows([invoice('1001')], resolver(users));
    expect([row[9], row[10], row[11], row[15]]).toEqual([null, null, null, null]);
  });
});

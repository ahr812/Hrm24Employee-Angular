import { InternalSentSmsRecord } from './internal-sms-history-preview.service';
import { filterInternalSmsHistory, INTERNAL_SMS_COLUMNS, validateInternalSmsFilters } from './internal-sms-history.component';

describe('internal sent SMS history list contract', () => {
  const rows: readonly InternalSentSmsRecord[] = [
    { id: '2', sentAt: '1405/06/22', employerId: '1001', mobile: '09121234567', employerName: 'کارفرمای اول', employerCompanyName: 'شرکت اول', message: 'پیام اول', senderRole: 'support-expert', source: 'user-direct', submissionKey: 'a' },
    { id: '1', sentAt: '1405/06/20', employerId: '1002', mobile: '09129876543', employerName: 'کارفرمای دوم', employerCompanyName: null, message: 'پیام دوم', senderRole: 'super-admin', source: 'invoice-direct', submissionKey: 'b' }
  ];

  it('uses the exact six reference columns without operations', () => {
    expect(INTERNAL_SMS_COLUMNS.map(column => column.label)).toEqual(['شناسه', 'تاریخ', 'شماره موبایل', 'نام کارفرما', 'نام شرکت کارفرما', 'متن پیام']);
    expect(INTERNAL_SMS_COLUMNS.some(column => column.id === 'operations')).toBeFalse();
  });

  it('normalizes Persian digits and rejects obsolete filter values safely', () => {
    expect(validateInternalSmsFilters({ employerId: 12, mobile: '۰۹۱۲-۱۲۳۴۵۶۷', fromDate: '۱۴۰۵/۰۶/۲۰', toDate: 'bad' })).toEqual({ employerId: 'all', mobile: '09121234567', fromDate: '1405/06/20', toDate: '' });
    expect(validateInternalSmsFilters(null)).toBeNull();
  });

  it('applies employer, mobile and inclusive date boundaries together', () => {
    const filtered = filterInternalSmsHistory(rows, { employerId: '1001', mobile: '0912', fromDate: '1405/06/22', toDate: '1405/06/22' });
    expect(filtered.map(row => row.id)).toEqual(['2']);
  });

  it('keeps original shared order when no main filter is active', () => {
    expect(filterInternalSmsHistory(rows, { employerId: 'all', mobile: '', fromDate: '', toDate: '' })).toEqual(rows);
  });
});

import { BusinessUserPreviewService } from '../users/business-user-preview.service';
import { InternalSmsHistoryPreviewService } from './internal-sms-history-preview.service';

describe('InternalSmsHistoryPreviewService', () => {
  let service: InternalSmsHistoryPreviewService;
  let users: BusinessUserPreviewService;

  beforeEach(() => {
    service = new InternalSmsHistoryPreviewService();
    users = new BusinessUserPreviewService();
  });

  it('starts with explicit internal-panel preview records only', () => {
    expect(service.records().length).toBe(3);
    expect(service.records().every(record => ['user-direct', 'user-group', 'invoice-direct'].includes(record.source))).toBeTrue();
    expect(service.records().some(record => record.message.includes('OTP'))).toBeFalse();
  });

  it('records a completed employer send with submitted recipient data and full literal text', () => {
    const recipient = users.findUser(1001)!;
    const message = '=متن کامل و بدون تبدیل به فرمول';
    const recorded = service.recordCompletedMockSend({ recipient, message, senderRole: 'support-expert', source: 'transaction-direct', submissionKey: 'submission-1', sentAt: '1405/06/22' });
    const result = service.records()[0];
    expect(recorded).toBeTrue();
    expect(result.mobile).toBe(recipient.mobile);
    expect(result.employerId).toBe(String(recipient.id));
    expect(result.employerCompanyName).toBe(recipient.companyName);
    expect(result.message).toBe(message);
    expect(result.sentAt).toBe('1405/06/22');
  });

  it('does not duplicate repeated handling of one submission', () => {
    const input = { recipient: users.findUser(1001)!, message: 'پیام معتبر', senderRole: 'super-admin' as const, source: 'user-direct' as const, submissionKey: 'same-key' };
    expect(service.recordCompletedMockSend(input)).toBeTrue();
    expect(service.recordCompletedMockSend(input)).toBeFalse();
    expect(service.records().filter(record => record.submissionKey === 'same-key').length).toBe(1);
  });

  it('rejects blank, non-internal, invalid-mobile and employee-only events', () => {
    const employer = users.findUser(1001)!;
    const employee = users.findUser(1003)!;
    expect(service.recordCompletedMockSend({ recipient: employer, message: ' ', senderRole: 'super-admin', source: 'user-direct', submissionKey: 'blank' })).toBeFalse();
    expect(service.recordCompletedMockSend({ recipient: employer, message: 'پیام', senderRole: 'employer', source: 'user-direct', submissionKey: 'external' })).toBeFalse();
    expect(service.recordCompletedMockSend({ recipient: { ...employer, mobile: '123' }, message: 'پیام', senderRole: 'sales-expert', source: 'user-direct', submissionKey: 'bad-mobile' })).toBeFalse();
    expect(service.recordCompletedMockSend({ recipient: employee, message: 'پیام', senderRole: 'support-expert', source: 'user-direct', submissionKey: 'employee-only' })).toBeFalse();
  });

  it('permits Excel only for administrator and sales', () => {
    expect(service.canExport(['super-admin'])).toBeTrue();
    expect(service.canExport(['sales-expert'])).toBeTrue();
    expect(service.canExport(['support-expert'])).toBeFalse();
  });
});

import { Injectable, signal } from '@angular/core';
import { Fish24RoleId } from '../../../../core/fish24/models/fish24-role.model';
import { normalizeFish24Digits } from '../../../../core/fish24/financial/fish24-financial-preview.service';
import { BusinessUserRecord } from '../users/business-user-preview.service';

export type InternalSmsSource = 'user-direct' | 'user-group' | 'invoice-direct' | 'transaction-direct';
export type InternalSmsSenderRole = 'super-admin' | 'sales-expert' | 'support-expert';

export interface InternalSentSmsRecord {
  readonly id: string;
  readonly sentAt: string;
  readonly employerId: string;
  readonly mobile: string;
  readonly employerName: string;
  readonly employerCompanyName: string | null;
  readonly message: string;
  readonly senderRole: InternalSmsSenderRole;
  readonly source: InternalSmsSource;
  readonly submissionKey: string;
}

interface CompletedMockSmsInput {
  readonly recipient: BusinessUserRecord;
  readonly message: string;
  readonly senderRole: Fish24RoleId;
  readonly source: InternalSmsSource;
  readonly submissionKey: string;
  readonly sentAt?: string;
}

// Explicit preview-only records. They represent in-scope internal-panel sends,
// not production history and not the customer data shown in the legacy screenshot.
const PREVIEW_HISTORY: readonly InternalSentSmsRecord[] = [
  { id: '5003', sentAt: '1405/06/22', employerId: '1001', mobile: '09121234567', employerName: 'مریم احمدی', employerCompanyName: 'مجموعه نمونه سپهر', message: 'درخواست شما در پنل داخلی بررسی شد. در صورت نیاز به راهنمایی بیشتر با تیم پشتیبانی در تماس باشید.', senderRole: 'support-expert', source: 'user-direct', submissionKey: 'preview-5003' },
  { id: '5002', sentAt: '1405/06/21', employerId: '1002', mobile: '09129876543', employerName: 'رضا کریمی', employerCompanyName: 'شرکت راهکار نوین', message: 'اطلاعات حساب کاربری شما در پیش‌نمایش پنل داخلی بررسی شد.', senderRole: 'sales-expert', source: 'user-group', submissionKey: 'preview-5002' },
  { id: '5001', sentAt: '1405/06/20', employerId: '1007', mobile: '09123334455', employerName: 'حامد اکبری', employerCompanyName: 'کارگاه توسعه پارس', message: 'فاکتور شماره 00022343 در فهرست فاکتورهای رسمی قابل مشاهده است.', senderRole: 'super-admin', source: 'invoice-direct', submissionKey: 'preview-5001' }
];

@Injectable({ providedIn: 'root' })
export class InternalSmsHistoryPreviewService {
  private readonly recordsState = signal<readonly InternalSentSmsRecord[]>(PREVIEW_HISTORY);
  private submissionSequence = 0;
  private recordSequence = 5003;

  readonly records = this.recordsState.asReadonly();

  nextSubmissionKey(scope: InternalSmsSource): string {
    this.submissionSequence += 1;
    return `${scope}-${this.submissionSequence}`;
  }

  recordCompletedMockSend(input: CompletedMockSmsInput): boolean {
    const message = input.message.trim();
    const mobile = normalizeFish24Digits(input.recipient.mobile).replace(/\D/g, '');
    if (!this.isInternalRole(input.senderRole) || !input.recipient.roles.includes('employer') || !message || !/^09\d{9}$/.test(mobile) || !input.submissionKey.trim()) return false;
    if (this.recordsState().some(record => record.submissionKey === input.submissionKey)) return false;

    this.recordSequence += 1;
    const record: InternalSentSmsRecord = {
      id: String(this.recordSequence),
      sentAt: input.sentAt ?? this.currentJalaliDate(),
      employerId: String(input.recipient.id),
      mobile,
      employerName: input.recipient.fullName?.trim() || mobile,
      employerCompanyName: input.recipient.companyName.trim() || null,
      message,
      senderRole: input.senderRole,
      source: input.source,
      submissionKey: input.submissionKey.trim()
    };
    this.recordsState.update(records => [record, ...records]);
    return true;
  }

  canExport(roles: readonly Fish24RoleId[]): boolean {
    return roles.includes('super-admin') || roles.includes('sales-expert');
  }

  private isInternalRole(role: Fish24RoleId): role is InternalSmsSenderRole {
    return role === 'super-admin' || role === 'sales-expert' || role === 'support-expert';
  }

  private currentJalaliDate(): string {
    const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? '';
    return `${value('year')}/${value('month')}/${value('day')}`;
  }
}

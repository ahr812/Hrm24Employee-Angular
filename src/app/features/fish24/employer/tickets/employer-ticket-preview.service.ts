import { Injectable, signal } from '@angular/core';

export type EmployerTicketStatus = 'درحال بررسی' | 'بسته شده';
export type EmployerTicketOrigin = 'employerToSystem' | 'employeeToEmployer';
export type EmployerDocumentDistributionStatus = 'توزیع‌شده' | 'توزیع‌نشده';
export type EmployerDocumentHostingLabel = '1 ماهه' | '12 ماهه' | 'منقضی';

export interface EmployerTicketMessage {
  readonly id: number;
  readonly senderDisplay: string;
  readonly senderSide: 'employer' | 'system' | 'employee';
  readonly sentAt: string;
  readonly text: string;
}

export interface EmployerTicketRecord {
  readonly id: number;
  readonly subject: string;
  readonly workplace: string;
  readonly origin: EmployerTicketOrigin;
  readonly status: EmployerTicketStatus;
  readonly updatedAt: string;
  readonly employeeName?: string | null;
  readonly employeeMobile?: string | null;
  readonly recipientDepartment?: string | null;
  readonly messages: readonly EmployerTicketMessage[];
}

export interface EmployerDocumentRecord {
  readonly id: number;
  readonly sentAt: string;
  readonly title: string;
  readonly companyId: number;
  readonly companyName: string;
  readonly amountRial: number;
  readonly status: EmployerDocumentDistributionStatus;
  readonly hostingLabel: EmployerDocumentHostingLabel;
  readonly expiresAt: string;
  readonly isLocked: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmployerTicketPreviewService {
  private nextTicketId = 3100;
  private nextMessageId = 100;

  private readonly documentsSignal = signal<readonly EmployerDocumentRecord[]>([
    { id: 2001, sentAt: '1405/01/21', title: 'گزارش پرداخت فروردین', companyId: 101, companyName: 'مجموعه نمونه سپهر', amountRial: 340_000, status: 'توزیع‌شده', hostingLabel: '1 ماهه', expiresAt: '1405/02/21', isLocked: false },
    { id: 2002, sentAt: '1405/02/28', title: 'صورت‌حساب دوره‌ای کارکنان', companyId: 102, companyName: 'مجموعه آزمایشی باران', amountRial: 785_000, status: 'توزیع‌شده', hostingLabel: '12 ماهه', expiresAt: '1406/02/28', isLocked: true },
    { id: 2003, sentAt: '1404/08/16', title: 'گزارش تسویه پاییز', companyId: 101, companyName: 'مجموعه نمونه سپهر', amountRial: 420_000, status: 'توزیع‌شده', hostingLabel: 'منقضی', expiresAt: '1404/09/16', isLocked: false },
    { id: 2004, sentAt: '1405/04/01', title: 'خلاصه پرداخت خرداد', companyId: 103, companyName: 'مجموعه نمایشی نارنج', amountRial: 610_000, status: 'توزیع‌شده', hostingLabel: '1 ماهه', expiresAt: '1405/05/01', isLocked: false },
    { id: 2005, sentAt: '1405/04/23', title: 'گزارش تجمیعی تابستان', companyId: 102, companyName: 'مجموعه آزمایشی باران', amountRial: 925_000, status: 'توزیع‌شده', hostingLabel: '12 ماهه', expiresAt: '1406/04/23', isLocked: true },
    { id: 2006, sentAt: '1405/06/12', title: 'پیش‌نمایش پرداخت شهریور', companyId: 103, companyName: 'مجموعه نمایشی نارنج', amountRial: 515_000, status: 'توزیع‌نشده', hostingLabel: '1 ماهه', expiresAt: '1405/07/12', isLocked: false }
  ]);

  private readonly ticketsSignal = signal<readonly EmployerTicketRecord[]>([
    {
      id: 3001,
      subject: 'گزارش پرداخت فروردین',
      workplace: 'مجموعه نمونه سپهر',
      origin: 'employerToSystem',
      status: 'درحال بررسی',
      updatedAt: '1405/06/16 10:20',
      employeeName: null,
      employeeMobile: null,
      recipientDepartment: 'پشتیبانی',
      messages: [
        { id: 1, senderDisplay: 'شما', senderSide: 'employer', sentAt: '1405/06/16 09:45', text: 'لطفاً وضعیت سند ارسالی را در نسخه نمایشی بررسی کنید.' },
        { id: 2, senderDisplay: 'پشتیبانی', senderSide: 'system', sentAt: '1405/06/16 10:20', text: 'درخواست دریافت شد و درحال بررسی است.' }
      ]
    },
    {
      id: 3002,
      subject: 'صورت‌حساب دوره‌ای کارکنان',
      workplace: 'مجموعه آزمایشی باران',
      origin: 'employerToSystem',
      status: 'بسته شده',
      updatedAt: '1405/05/30 14:10',
      employeeName: null,
      employeeMobile: null,
      recipientDepartment: 'پشتیبانی',
      messages: [
        { id: 3, senderDisplay: 'شما', senderSide: 'employer', sentAt: '1405/05/30 11:05', text: 'لطفاً نتیجه پردازش این سند را بررسی کنید.' },
        { id: 4, senderDisplay: 'پشتیبانی', senderSide: 'system', sentAt: '1405/05/30 14:10', text: 'بررسی انجام شد و درخواست بسته شد.' }
      ]
    },
    {
      id: 3003,
      subject: 'خلاصه پرداخت خرداد',
      workplace: 'مجموعه نمایشی نارنج',
      origin: 'employeeToEmployer',
      status: 'درحال بررسی',
      updatedAt: '1405/06/15 08:40',
      employeeName: 'نیما آزمایشی',
      employeeMobile: '09120002001',
      recipientDepartment: null,
      messages: [
        { id: 5, senderDisplay: 'نیما آزمایشی', senderSide: 'employee', sentAt: '1405/06/15 08:40', text: 'لطفاً توضیحات این سند را بررسی کنید.' }
      ]
    },
    {
      id: 3004,
      subject: 'گزارش تجمیعی تابستان',
      workplace: 'مجموعه آزمایشی باران',
      origin: 'employeeToEmployer',
      status: 'بسته شده',
      updatedAt: '1405/06/10 16:25',
      employeeName: 'رها نمونه',
      employeeMobile: '09120002002',
      recipientDepartment: null,
      messages: [
        { id: 6, senderDisplay: 'رها نمونه', senderSide: 'employee', sentAt: '1405/06/10 15:00', text: 'درباره مبلغ درج‌شده در سند سؤال دارم.' },
        { id: 7, senderDisplay: 'شما', senderSide: 'employer', sentAt: '1405/06/10 16:25', text: 'جزئیات بررسی شد و توضیح لازم ارائه گردید.' }
      ]
    }
  ]);

  readonly documents = this.documentsSignal.asReadonly();
  readonly tickets = this.ticketsSignal.asReadonly();

  findDocument(id: number): EmployerDocumentRecord | undefined {
    return this.documentsSignal().find((document) => document.id === id);
  }

  findTicket(id: number): EmployerTicketRecord | undefined {
    return this.ticketsSignal().find((ticket) => ticket.id === id);
  }

  toggleDocumentLock(id: number): void {
    this.documentsSignal.update((documents) => documents.map((document) => document.id === id
      ? { ...document, isLocked: !document.isLocked }
      : document));
  }

  deleteUndistributedDocument(id: number): void {
    this.documentsSignal.update((documents) => documents.filter((document) => document.id !== id || document.status === 'توزیع‌شده'));
  }

  previewDistributeDocument(id: number): void {
    this.documentsSignal.update((documents) => documents.map((document) => document.id === id && document.status === 'توزیع‌نشده'
      ? { ...document, status: 'توزیع‌شده' }
      : document));
  }

  createTicketFromDocument(documentId: number, department: string, request: string): number | null {
    const document = this.findDocument(documentId);

    if (!document) {
      return null;
    }

    const ticketId = this.nextTicketId++;
    const timestamp = this.currentJalaliTimestamp();
    const ticket: EmployerTicketRecord = {
      id: ticketId,
      subject: document.title,
      workplace: document.companyName,
      origin: 'employerToSystem',
      status: 'درحال بررسی',
      updatedAt: timestamp,
      employeeName: null,
      employeeMobile: null,
      recipientDepartment: department,
      messages: [{ id: this.nextMessageId++, senderDisplay: 'شما', senderSide: 'employer', sentAt: timestamp, text: request.trim() }]
    };

    this.ticketsSignal.update((tickets) => [ticket, ...tickets]);
    return ticketId;
  }

  closeTicket(id: number): void {
    const timestamp = this.currentJalaliTimestamp();
    this.ticketsSignal.update((tickets) => tickets.map((ticket) => ticket.id === id && ticket.status === 'درحال بررسی'
      ? { ...ticket, status: 'بسته شده', updatedAt: timestamp }
      : ticket));
  }

  replyToTicket(id: number, text: string): void {
    const timestamp = this.currentJalaliTimestamp();
    this.ticketsSignal.update((tickets) => tickets.map((ticket) => ticket.id === id && ticket.status === 'درحال بررسی'
      ? {
          ...ticket,
          updatedAt: timestamp,
          messages: [...ticket.messages, { id: this.nextMessageId++, senderDisplay: 'شما', senderSide: 'employer' as const, sentAt: timestamp, text: text.trim() }]
        }
      : ticket));
  }

  private currentJalaliTimestamp(): string {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
    return `${value('year')}/${value('month')}/${value('day')} ${value('hour')}:${value('minute')}`;
  }
}

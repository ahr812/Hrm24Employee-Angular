import { Injectable, signal } from '@angular/core';

export type EmployerNotificationRecipientType = 'workplace' | 'employee';

export interface EmployerNotificationWorkplace {
  readonly id: number;
  readonly name: string;
}

export interface EmployerEmployeeNotificationRecord {
  readonly id: number;
  readonly recipientType: EmployerNotificationRecipientType;
  readonly recipientDisplayName: string;
  readonly message: string;
  readonly createdAt: string;
  readonly workplaceId: number;
  readonly employeeId?: number;
}

export const EMPLOYER_NOTIFICATION_WORKPLACES: readonly EmployerNotificationWorkplace[] = [
  { id: 201, name: 'مجموعه نمونه سپهر' },
  { id: 202, name: 'مجموعه آزمایشی باران' },
  { id: 203, name: 'مجموعه نمایشی نارنج' }
];

@Injectable({ providedIn: 'root' })
export class EmployerEmployeeNotificationsService {
  private nextNotificationId = 4100;

  private readonly notificationsSignal = signal<readonly EmployerEmployeeNotificationRecord[]>([
    {
      id: 4001,
      recipientType: 'workplace',
      recipientDisplayName: 'مجموعه نمونه سپهر',
      workplaceId: 201,
      message: 'اطلاع‌رسانی نمونه برای کارکنان این مجموعه ثبت شده است.',
      createdAt: '1405/06/15 09:30'
    },
    {
      id: 4002,
      recipientType: 'employee',
      recipientDisplayName: 'بهار آزمایشی',
      workplaceId: 202,
      employeeId: 1003,
      message: 'پیام آزمایشی مربوط به سند دوره اخیر را بررسی کنید.',
      createdAt: '1405/06/16 11:45'
    },
    {
      id: 4003,
      recipientType: 'workplace',
      recipientDisplayName: 'مجموعه نمایشی نارنج',
      workplaceId: 203,
      message: 'نسخه جدید اطلاعات پرداخت برای مشاهده در دسترس قرار گرفت.',
      createdAt: '1405/06/17 08:10'
    }
  ]);

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly workplaces = EMPLOYER_NOTIFICATION_WORKPLACES;

  createWorkplaceNotification(workplaceId: number, message: string): boolean {
    const workplace = this.workplaces.find((item) => item.id === workplaceId);
    const normalizedMessage = message.trim();
    if (!workplace || normalizedMessage.length === 0) return false;

    this.prepend({
      recipientType: 'workplace',
      recipientDisplayName: workplace.name,
      workplaceId,
      message: normalizedMessage
    });
    return true;
  }

  createEmployeeNotification(input: {
    employeeId: number;
    employeeName: string | null | undefined;
    workplaceId: number;
    message: string;
  }): boolean {
    const employeeName = input.employeeName?.trim();
    const normalizedMessage = input.message.trim();
    if (!employeeName || normalizedMessage.length === 0) return false;

    this.prepend({
      recipientType: 'employee',
      recipientDisplayName: employeeName,
      workplaceId: input.workplaceId,
      employeeId: input.employeeId,
      message: normalizedMessage
    });
    return true;
  }

  private prepend(input: Omit<EmployerEmployeeNotificationRecord, 'id' | 'createdAt'>): void {
    const notification: EmployerEmployeeNotificationRecord = {
      ...input,
      id: this.nextNotificationId++,
      createdAt: this.currentJalaliTimestamp()
    };
    this.notificationsSignal.update((records) => [notification, ...records]);
  }

  private currentJalaliTimestamp(): string {
    const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
    return `${value('year')}/${value('month')}/${value('day')} ${value('hour')}:${value('minute')}`;
  }
}

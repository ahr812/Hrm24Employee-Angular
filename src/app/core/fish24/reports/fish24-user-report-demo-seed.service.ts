import { Injectable, inject } from '@angular/core';
import { BusinessUserPreviewService, BusinessUserSeed } from '../../../features/fish24/internal/users/business-user-preview.service';
import { createFish24DemoPdf } from '../financial/fish24-demo-document-file';
import { Fish24DocumentDistributionPreviewService, Fish24DocumentSendDemoSeed } from '../financial/fish24-document-distribution-preview.service';
import { addJalaliDays, currentTehranJalaliDate, fish24ReportPeriodBounds, tehranSaturdayWeekday } from './fish24-report-calendar';

@Injectable({ providedIn: 'root' })
export class Fish24UserReportDemoSeedService {
  private readonly users = inject(BusinessUserPreviewService);
  private readonly distributions = inject(Fish24DocumentDistributionPreviewService);
  private initialized = false;

  initialize(now: Date): void {
    if (this.initialized) return;
    const today = currentTehranJalaliDate(now);
    const weekday = tehranSaturdayWeekday(now);
    const day = fish24ReportPeriodBounds('day', today, weekday);
    const week = fish24ReportPeriodBounds('week', today, weekday);
    const month = fish24ReportPeriodBounds('month', today, weekday);
    const year = fish24ReportPeriodBounds('year', today, weekday);
    const dates = {
      today,
      previousDay: day.previous!.start!,
      previousWeek: week.previous!.start!,
      previousMonth: month.previous!.start!,
      currentYear: year.current.start!,
      previousYear: year.previous!.start!
    };

    this.users.seedDemoUsers([
      this.user(1101, '09121100101', dates.today, 'کارفرمای امروز', 'مجموعه نمایشی آفتاب', ['employer'], true),
      this.user(1102, '09121100102', dates.previousDay, 'کارفرمای دیروز', 'مجموعه نمایشی دریا', ['employer'], false),
      this.user(1103, '09121100103', dates.previousWeek, 'کارفرمای هفته قبل', 'مجموعه نمایشی کوهستان', ['employer'], true),
      this.user(1104, '09121100104', dates.previousMonth, 'کارفرمای ماه قبل', 'مجموعه نمایشی رویش', ['employer'], false),
      this.user(1105, '09121100105', dates.currentYear, 'کارفرمای امسال', 'مجموعه نمایشی سپیدار', ['employer'], true),
      this.user(1106, '09121100106', dates.previousYear, 'کارفرمای سال قبل', 'مجموعه نمایشی پایدار', ['employer'], true),
      this.user(1201, '09121200101', dates.today, 'کارمند امروز', '', ['employee'], true, [101, 102]),
      this.user(1202, '09121200102', dates.previousDay, 'کارمند دیروز', '', ['employee'], false, [101]),
      this.user(1203, '09121200103', dates.previousWeek, 'کارمند هفته قبل', '', ['employee'], true, [103]),
      this.user(1204, '09121200104', dates.previousMonth, 'کارمند ماه قبل', '', ['employee'], false, [104]),
      this.user(1205, '09121200105', dates.currentYear, 'کارمند امسال', '', ['employee'], true, [105, 106]),
      this.user(1206, '09121200106', dates.previousYear, 'کارمند سال قبل', '', ['employee'], true, [])
    ]);

    this.distributions.seedDemoSends([
      this.send('demo-report-01', 1101, 'کارفرمای امروز', '09121100101', 201, 'مجموعه نمایشی آفتاب', dates.today, 'سند فعال امروز', ['09121200101', '09121200105'], true, true, addJalaliDays(today, 30), 160),
      this.send('demo-report-02', 1102, 'کارفرمای دیروز', '09121100102', 202, 'مجموعه نمایشی دریا', dates.previousDay, 'سند با دسترسی غیرفعال', ['09121200102'], true, false, addJalaliDays(today, 20), 410),
      this.send('demo-report-03', 1103, 'کارفرمای هفته قبل', '09121100103', 203, 'مجموعه نمایشی کوهستان', dates.previousWeek, 'سند منقضی‌شده', ['09121200103'], true, true, addJalaliDays(today, -1), 720),
      this.send('demo-report-04', 1104, 'کارفرمای ماه قبل', '09121100104', 204, 'مجموعه نمایشی رویش', dates.previousMonth, 'بارگذاری پرداخت‌نشده', ['09121200104'], false, false, addJalaliDays(today, 30), 1040),
      this.send('demo-report-05', 1105, 'کارفرمای امسال', '09121100105', 205, 'مجموعه نمایشی سپیدار', dates.currentYear, 'سند فعال امسال', ['09121200105'], true, true, addJalaliDays(today, 60), 1380),
      this.send('demo-report-06', 1106, 'کارفرمای سال قبل', '09121100106', 206, 'مجموعه نمایشی پایدار', dates.previousYear, 'بارگذاری قدیمی پرداخت‌نشده', ['09121200106'], false, false, dates.previousYear, 1770)
    ]);
    this.initialized = true;
  }

  private user(id: number, mobile: string, joinedAt: string, fullName: string, companyName: string, roles: BusinessUserSeed['roles'], isActive: boolean, workplaceIds: readonly number[] = []): BusinessUserSeed {
    return {
      id, mobile, joinedAt, fullName, nationalId: `00${id}123456`.slice(-10), companyName, workplaceIds,
      roles, userType: companyName ? 'حقوقی' : 'حقیقی', hasFreeCredit: false, freeCreditExpiresAt: null,
      rank: 1, lastOtpAt: null, otpCount: 0, hasSentDocuments: roles.includes('employer'), isActive,
      employerApproval: roles.includes('employer') ? 'approved' : undefined
    };
  }

  private send(id: string, employerId: number, employerName: string, employerMobile: string, companyId: number, companyName: string, uploadedAt: string, title: string, recipientMobiles: readonly string[], isPaid: boolean, employeeAccessActive: boolean, expiresAt: string, paddingBytes: number): Fish24DocumentSendDemoSeed {
    const file = createFish24DemoPdf(`Fish24 report ${id}`, paddingBytes);
    return {
      id, createdAt: uploadedAt, employerId: employerId.toString(), employerName, employerMobile, companyId, companyName,
      title, expiresAt, durationMonths: 1, userType: 'حقوقی', hasFreeCredit: false,
      pageCount: recipientMobiles.length, smsEnabled: true, recipientMobiles,
      sourceFileName: `${id}.pdf`, sourceFile: file, uploadedAt, sourceFileSizeBytes: file.size,
      isPaid, employeeAccessActive
    };
  }
}

import { Inject, Injectable, InjectionToken, inject } from '@angular/core';
import { BusinessUserPreviewService, BusinessUserRecord } from '../../../features/fish24/internal/users/business-user-preview.service';
import { Fish24DocumentDistributionPreviewService, Fish24DocumentSend } from '../financial/fish24-document-distribution-preview.service';
import { Fish24ReportPeriod, Fish24ReportPeriodBounds, currentTehranJalaliDate, dateInFish24Range, fish24ReportPeriodBounds, tehranSaturdayWeekday } from './fish24-report-calendar';
import { Fish24UserReportDemoSeedService } from './fish24-user-report-demo-seed.service';

export interface Fish24ReportsClock { now(): Date; }
export const FISH24_REPORTS_CLOCK = new InjectionToken<Fish24ReportsClock>('FISH24_REPORTS_CLOCK', { factory: () => ({ now: () => new Date() }) });
export const FISH24_USER_REPORT_DEMO_ENABLED = new InjectionToken<boolean>('FISH24_USER_REPORT_DEMO_ENABLED', { factory: () => true });

export type Fish24ComparativeMetricId = 'employerRegistrations' | 'employeeRegistrations' | 'uploadedFiles' | 'uploadedBytes';

export interface Fish24ComparativeReportMetric {
  readonly id: Fish24ComparativeMetricId;
  readonly current: number;
  readonly previous: number | null;
  readonly bounds: Fish24ReportPeriodBounds;
  readonly sourceRecordCount: number;
  readonly omittedRecordCount: number;
}

export interface Fish24UserReportSnapshot {
  readonly inactiveEmployers: number;
  readonly inactiveEmployees: number;
  readonly employersWithCompletedDistribution: number;
  readonly employeesWhoReceivedDocuments: number;
  readonly employeesWithActiveDocuments: number;
  readonly employeesWithoutActiveDocuments: number;
  readonly totalEmployees: number;
}

@Injectable({ providedIn: 'root' })
export class Fish24UserReportsService {
  private readonly users = inject(BusinessUserPreviewService);
  private readonly distributions = inject(Fish24DocumentDistributionPreviewService);
  private readonly demoSeed = inject(Fish24UserReportDemoSeedService);
  constructor(
    @Inject(FISH24_REPORTS_CLOCK) private readonly clock: Fish24ReportsClock,
    @Inject(FISH24_USER_REPORT_DEMO_ENABLED) demoEnabled: boolean
  ) {
    if (demoEnabled) this.demoSeed.initialize(this.clock.now());
  }

  comparative(id: Fish24ComparativeMetricId, period: Fish24ReportPeriod): Fish24ComparativeReportMetric {
    const now = this.clock.now();
    const bounds = fish24ReportPeriodBounds(period, currentTehranJalaliDate(now), tehranSaturdayWeekday(now));
    if (id === 'employerRegistrations') return this.registrationMetric(id, period, bounds, this.employers());
    if (id === 'employeeRegistrations') return this.registrationMetric(id, period, bounds, this.employees());
    const uploads = this.distributions.sends().filter(send => send.uploadedAt !== null);
    const omittedRecordCount = this.distributions.sends().length - uploads.length;
    const amount = (send: Fish24DocumentSend) => id === 'uploadedFiles' ? 1 : send.sourceFileSizeBytes ?? 0;
    return {
      id,
      current: this.sumInRange(uploads, bounds.current, amount),
      previous: bounds.previous ? this.sumInRange(uploads, bounds.previous, amount) : null,
      bounds,
      sourceRecordCount: uploads.length,
      omittedRecordCount
    };
  }

  snapshot(): Fish24UserReportSnapshot {
    const employees = this.employees();
    const completed = this.distributions.sends().filter(send => send.isPaid);
    const receivedEmployeeIds = this.employeeIdsForSends(completed, employees);
    const today = currentTehranJalaliDate(this.clock.now());
    const activeEmployeeIds = this.employeeIdsForSends(completed.filter(send => send.employeeAccessActive && send.expiresAt >= today), employees);
    return {
      inactiveEmployers: this.employers().filter(user => !user.isActive).length,
      inactiveEmployees: employees.filter(user => !user.isActive).length,
      employersWithCompletedDistribution: new Set(completed.map(send => send.employerId)).size,
      employeesWhoReceivedDocuments: receivedEmployeeIds.size,
      employeesWithActiveDocuments: activeEmployeeIds.size,
      employeesWithoutActiveDocuments: employees.length - activeEmployeeIds.size,
      totalEmployees: employees.length
    };
  }

  currentJalaliDate(): string { return currentTehranJalaliDate(this.clock.now()); }

  private registrationMetric(id: Fish24ComparativeMetricId, period: Fish24ReportPeriod, bounds: Fish24ReportPeriodBounds, records: readonly BusinessUserRecord[]): Fish24ComparativeReportMetric {
    const current = records.filter(record => dateInFish24Range(record.joinedAt, bounds.current)).length;
    const previous = bounds.previous ? records.filter(record => dateInFish24Range(record.joinedAt, bounds.previous!)).length : null;
    return { id, current, previous, bounds, sourceRecordCount: records.length, omittedRecordCount: 0 };
  }

  private sumInRange(records: readonly Fish24DocumentSend[], range: Fish24ReportPeriodBounds['current'], amount: (send: Fish24DocumentSend) => number): number {
    return records.filter(send => send.uploadedAt !== null && dateInFish24Range(send.uploadedAt, range)).reduce((total, send) => total + amount(send), 0);
  }

  private employeeIdsForSends(sends: readonly Fish24DocumentSend[], employees: readonly BusinessUserRecord[]): ReadonlySet<number> {
    const recipients = new Set(sends.flatMap(send => send.recipientMobiles));
    return new Set(employees.filter(employee => recipients.has(employee.mobile)).map(employee => employee.id));
  }

  private employers(): readonly BusinessUserRecord[] { return this.users.users().filter(user => user.roles.includes('employer')); }
  private employees(): readonly BusinessUserRecord[] { return this.users.users().filter(user => user.roles.includes('employee')); }
}

import { TestBed } from '@angular/core/testing';
import { BusinessUserPreviewService } from '../../../features/fish24/internal/users/business-user-preview.service';
import { Fish24DocumentDistributionPreviewService } from '../financial/fish24-document-distribution-preview.service';
import { FISH24_REPORTS_CLOCK, FISH24_USER_REPORT_DEMO_ENABLED, Fish24UserReportsService } from './fish24-user-reports.service';

describe('Fish24UserReportsService', () => {
  let reports: Fish24UserReportsService;
  let users: BusinessUserPreviewService;
  let distributions: Fish24DocumentDistributionPreviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      Fish24UserReportsService,
      { provide: FISH24_REPORTS_CLOCK, useValue: { now: () => new Date('2026-09-14T08:00:00Z') } },
      { provide: FISH24_USER_REPORT_DEMO_ENABLED, useValue: false }
    ] });
    reports = TestBed.inject(Fish24UserReportsService);
    users = TestBed.inject(BusinessUserPreviewService);
    distributions = TestBed.inject(Fish24DocumentDistributionPreviewService);
  });

  it('counts stable people once across roles and uses person registration/status', () => {
    const records = users.users();
    users.users.set(records.map(record => record.id === 1001 ? { ...record, joinedAt: '1405/06/02', isActive: false } : record.id === 1003 ? { ...record, joinedAt: '1405/06/03', isActive: false } : record));
    expect(reports.comparative('employerRegistrations', 'month').current).toBe(1);
    expect(reports.comparative('employeeRegistrations', 'month').current).toBe(2);
    expect(reports.snapshot().inactiveEmployers).toBe(2);
    expect(reports.snapshot().inactiveEmployees).toBe(2);
  });

  it('counts each original upload once with actual bytes regardless of payment', () => {
    const base = distributions.sends()[0];
    distributions['sendsState'].set([
      { ...base, id: 'upload-paid', uploadedAt: '1405/06/10', sourceFileSizeBytes: 1_250_000, pageCount: 3, recipientMobiles: ['09121234567', '09350000001', '09120000022'], isPaid: true },
      { ...base, id: 'upload-unpaid', uploadedAt: '1405/06/11', sourceFileSizeBytes: 750_000, pageCount: 2, recipientMobiles: ['09121234567', '09350000001'], isPaid: false, employeeAccessActive: false },
      { ...base, id: 'legacy-without-upload-facts', uploadedAt: null, sourceFileSizeBytes: null }
    ]);
    expect(reports.comparative('uploadedFiles', 'month').current).toBe(2);
    expect(reports.comparative('uploadedBytes', 'month').current).toBe(2_000_000);
    expect(reports.comparative('uploadedFiles', 'month').omittedRecordCount).toBe(1);
  });

  it('separates completed history from current access and partitions the employee population', () => {
    const base = distributions.sends()[0];
    distributions['sendsState'].set([
      { ...base, id: 'active', employerId: '1001', recipientMobiles: ['09121234567'], pageCount: 1, isPaid: true, employeeAccessActive: true, expiresAt: '1405/06/23' },
      { ...base, id: 'expired', employerId: '1002', recipientMobiles: ['09350000001'], pageCount: 1, isPaid: true, employeeAccessActive: false, expiresAt: '1405/06/22' },
      { ...base, id: 'upload-only', employerId: '1007', recipientMobiles: ['09350000001'], pageCount: 1, isPaid: false, employeeAccessActive: false }
    ]);
    const snapshot = reports.snapshot();
    expect(snapshot.employersWithCompletedDistribution).toBe(2);
    expect(snapshot.employeesWhoReceivedDocuments).toBe(2);
    expect(snapshot.employeesWithActiveDocuments).toBe(1);
    expect(snapshot.employeesWithoutActiveDocuments).toBe(1);
    expect(snapshot.employeesWithActiveDocuments + snapshot.employeesWithoutActiveDocuments).toBe(snapshot.totalEmployees);
  });
});

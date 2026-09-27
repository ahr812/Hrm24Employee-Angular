import { TestBed } from '@angular/core/testing';
import { Fish24WalletPreviewService } from '../financial/fish24-wallet-preview.service';
import { Fish24DocumentDistributionPreviewService } from '../financial/fish24-document-distribution-preview.service';
import { BusinessUserPreviewService } from '../../../features/fish24/internal/users/business-user-preview.service';
import { FISH24_REPORTS_CLOCK, Fish24UserReportsService } from './fish24-user-reports.service';

describe('Fish24 user report rolling demo data', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    Fish24UserReportsService,
    { provide: FISH24_REPORTS_CLOCK, useValue: { now: () => new Date('2026-09-14T08:00:00Z') } }
  ] }));

  it('seeds coherent unique people, uploads and access scenarios once without wallet activity', async () => {
    const users = TestBed.inject(BusinessUserPreviewService);
    const distributions = TestBed.inject(Fish24DocumentDistributionPreviewService);
    const wallets = TestBed.inject(Fish24WalletPreviewService);
    const userCountBefore = users.users().length;
    const sendCountBefore = distributions.sends().length;
    const transactionCountBefore = wallets.transactions().length;
    const reports = TestBed.inject(Fish24UserReportsService);

    expect(users.users().length).toBe(userCountBefore + 12);
    expect(distributions.sends().length).toBe(sendCountBefore + 6);
    expect(wallets.transactions().length).toBe(transactionCountBefore);
    expect(users.findUser(1201)?.workplaceIds).toEqual([101, 102]);
    expect(reports.snapshot().totalEmployees).toBe(8);
    expect(reports.snapshot()).toEqual(jasmine.objectContaining({
      inactiveEmployers: 3,
      inactiveEmployees: 2,
      employersWithCompletedDistribution: 7,
      employeesWhoReceivedDocuments: 4,
      employeesWithActiveDocuments: 2,
      employeesWithoutActiveDocuments: 6
    }));
    expect(reports.snapshot().employeesWithActiveDocuments + reports.snapshot().employeesWithoutActiveDocuments).toBe(reports.snapshot().totalEmployees);

    const uploads = distributions.sends().filter(send => send.uploadedAt !== null);
    expect(uploads.length).toBe(11);
    expect(uploads.every(send => send.sourceFile !== null && send.sourceFileSizeBytes === send.sourceFile.size)).toBeTrue();
    for (const upload of uploads) {
      const content = new TextDecoder().decode(await upload.sourceFile!.arrayBuffer());
      expect(content.startsWith('%PDF-1.4')).toBeTrue();
      expect(content.trimEnd().endsWith('%%EOF')).toBeTrue();
    }
    expect(distributions.sends().filter(send => !send.isPaid).length).toBe(3);
    expect(distributions.sends().filter(send => send.isPaid).length).toBe(8);
    expect(distributions.sends().find(send => send.id === 'demo-report-03')?.expiresAt).toBe('1405/06/22');
    expect(distributions.sends().find(send => send.id === 'demo-report-02')?.employeeAccessActive).toBeFalse();

    const bytes = uploads.reduce((sum, send) => sum + send.sourceFile!.size, 0);
    expect(reports.comparative('uploadedFiles', 'all').current).toBe(uploads.length);
    expect(reports.comparative('uploadedBytes', 'all').current).toBe(bytes);
    expect(reports.comparative('uploadedFiles', 'all').omittedRecordCount).toBe(0);

    const usersAfterFirstSeed = users.users().length;
    const sendsAfterFirstSeed = distributions.sends().length;
    TestBed.inject(Fish24UserReportsService);
    expect(users.users().length).toBe(usersAfterFirstSeed);
    expect(distributions.sends().length).toBe(sendsAfterFirstSeed);
  });

  it('covers current and complete previous day, week, month and year periods', () => {
    const reports = TestBed.inject(Fish24UserReportsService);
    for (const period of ['day', 'week', 'month', 'year'] as const) {
      const employers = reports.comparative('employerRegistrations', period);
      const employees = reports.comparative('employeeRegistrations', period);
      const uploads = reports.comparative('uploadedFiles', period);
      expect(employers.current).toBeGreaterThan(0);
      expect(employers.previous).toBeGreaterThan(0);
      expect(employees.current).toBeGreaterThan(0);
      expect(employees.previous).toBeGreaterThan(0);
      expect(uploads.current).toBeGreaterThan(0);
      expect(uploads.previous).toBeGreaterThan(0);
    }
  });
});

import { FISH24_USER_REPORT_PERIOD_DEFAULTS, validateFish24UserReportPeriods } from './internal-user-reports.component';

describe('InternalUserReports period preferences', () => {
  it('restores four independent valid period values', () => {
    expect(validateFish24UserReportPeriods({ employerRegistrations: 'day', employeeRegistrations: 'week', uploadedFiles: 'year', uploadedBytes: 'all' })).toEqual({ employerRegistrations: 'day', employeeRegistrations: 'week', uploadedFiles: 'year', uploadedBytes: 'all' });
  });

  it('rejects malformed or obsolete preferences', () => {
    expect(validateFish24UserReportPeriods({ ...FISH24_USER_REPORT_PERIOD_DEFAULTS, uploadedBytes: 'quarter' })).toBeNull();
    expect(validateFish24UserReportPeriods(null)).toBeNull();
  });
});

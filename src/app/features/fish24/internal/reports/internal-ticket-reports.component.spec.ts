import { validateTicketReportPeriod } from './internal-ticket-reports.component';

describe('InternalTicketReportsComponent preferences', () => {
  it('restores every supported period', () => { for(const period of ['day','week','month','year','all'] as const) expect(validateTicketReportPeriod({period})).toBe(period); });
  it('safely rejects malformed and obsolete preferences', () => { expect(validateTicketReportPeriod(null)).toBeNull(); expect(validateTicketReportPeriod({period:'quarter'})).toBeNull(); expect(validateTicketReportPeriod({period:3})).toBeNull(); });
});

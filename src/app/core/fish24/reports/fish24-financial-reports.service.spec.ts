import { TestBed } from '@angular/core/testing';
import { FISH24_REPORTS_CLOCK } from './fish24-user-reports.service';
import { Fish24FinancialReportsService } from './fish24-financial-reports.service';

describe('Fish24FinancialReportsService', () => {
  let service: Fish24FinancialReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: FISH24_REPORTS_CLOCK, useValue: { now: () => new Date('2026-10-27T08:00:00Z') } }] });
    service = TestBed.inject(Fish24FinancialReportsService);
  });

  it('uses the authoritative numbered invoice population including legacy gross amounts', () => {
    const audit = service.audit();
    expect(audit.numberedInvoiceCount).toBe(6);
    expect(audit.numberedInvoiceGrossRial).toBe(552_696_000);
    expect(service.comparison('invoiceCount', 'all').current).toBe(6);
    expect(service.comparison('invoiceAmount', 'all').current).toBe(552_696_000);
  });

  it('counts only completed sends with their successful debit event and reports missing demo metadata', () => {
    const audit = service.audit();
    expect(audit.completedSendCount).toBe(1);
    expect(audit.completedSendAmountRial).toBe(780_000);
    expect(audit.paidSendsWithoutAuthoritativeDebit).toEqual(['2002', '2003', '2004']);
    expect(audit.receiptPaymentMismatches).toEqual([]);
  });

  it('aggregates Jalali months, keeps historical months complete and marks current future months unobserved', () => {
    const invoices = service.monthly('formalInvoices', 1405);
    expect(invoices.selected.reduce<number>((sum, value) => sum + (value ?? 0), 0)).toBe(552_696_000);
    expect(invoices.selected.slice(8)).toEqual([null, null, null, null]);
    expect(invoices.previous).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const sends = service.monthly('paidDistributions', 1405);
    expect(sends.selected[5]).toBe(780_000);
  });

  it('uses full previous Jalali periods and keeps invoice count and amount independent', () => {
    const count = service.comparison('invoiceCount', 'year');
    const amount = service.comparison('invoiceAmount', 'year');
    expect(count.bounds.previous?.start).toBe('1404/01/01');
    expect(count.bounds.previous?.end).toBe('1404/12/29');
    expect(count.current).toBe(6);
    expect(amount.current).toBe(552_696_000);
  });
});

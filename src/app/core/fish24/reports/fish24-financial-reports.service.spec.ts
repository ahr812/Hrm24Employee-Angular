import { TestBed } from '@angular/core/testing';
import { Fish24DocumentDistributionPreviewService } from '../financial/fish24-document-distribution-preview.service';
import { Fish24WalletPreviewService } from '../financial/fish24-wallet-preview.service';
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
    expect(audit.completedSendCount).toBe(5);
    expect(audit.completedSendAmountRial).toBe(3_315_000);
    expect(audit.paidSendsWithoutAuthoritativeDebit).toEqual([]);
    expect(audit.receiptPaymentMismatches).toEqual([]);
  });

  it('uses each demonstration debit amount and completion timestamp without changing the unpaid send', () => {
    const wallets = TestBed.inject(Fish24WalletPreviewService);
    const distributions = TestBed.inject(Fish24DocumentDistributionPreviewService);
    const expected = [
      { sendId: '2002', employerId: '1002', createdAt: '1405/07/08 10:20' },
      { sendId: '2003', employerId: '1001', createdAt: '1405/08/02 09:15' },
      { sendId: '2004', employerId: '1007', createdAt: '1405/06/13 12:30' },
      { sendId: '2010', employerId: '1001', createdAt: '1404/08/03 10:05' }
    ];
    for (const item of expected) {
      const debit = wallets.transactions().find(transaction => transaction.operationId === item.sendId);
      expect(debit?.employerId).withContext(item.sendId).toBe(item.employerId);
      expect(debit?.createdAt).withContext(item.sendId).toBe(item.createdAt);
      expect(debit?.amountRial).withContext(item.sendId).toBe(distributions.receiptFor(item.sendId)?.breakdown.totalRial);
    }
    expect(distributions.findSend('2006')?.isPaid).toBeFalse();
    expect(wallets.transactions().some(transaction => transaction.operationId === '2006')).toBeFalse();
  });

  it('aggregates Jalali months, keeps historical months complete and marks current future months unobserved', () => {
    const invoices = service.monthly('formalInvoices', 1405);
    expect(invoices.selected.reduce<number>((sum, value) => sum + (value ?? 0), 0)).toBe(552_696_000);
    expect(invoices.selected.slice(8)).toEqual([null, null, null, null]);
    expect(invoices.previous).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const sends = service.monthly('paidDistributions', 1405);
    expect(sends.selected[5]).toBe(1_800_000);
    expect(sends.selected[6]).toBe(420_000);
    expect(sends.selected[7]).toBe(840_000);
    expect(sends.previous[7]).toBe(255_000);
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

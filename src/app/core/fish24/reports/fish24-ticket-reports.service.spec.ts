import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Fish24TicketPreviewService } from '../tickets/fish24-ticket-preview.service';
import { Fish24TicketReportsService } from './fish24-ticket-reports.service';

describe('Fish24TicketReportsService', () => {
  let source: Fish24TicketPreviewService;
  let reports: Fish24TicketReportsService;
  beforeEach(() => { TestBed.resetTestingModule(); source=TestBed.inject(Fish24TicketPreviewService); reports=TestBed.inject(Fish24TicketReportsService); });

  it('counts tickets once by original creation, not replies, referrals or attachments', () => {
    const before=reports.created('all').current;
    const id=source.createTicketFromDocument(2006,'user-1','support','گزارش جدید',[],'report-create')!;
    expect(reports.created('all').current).toBe(before+1);
    const createdAt=source.findTicket(id)!.createdAt;
    source.internalReply(id,'support-expert','پشتیبان','پاسخ',[],'report-reply');
    source.refer(id,'support-expert','sales','پشتیبان');
    expect(reports.created('all').current).toBe(before+1);
    expect(source.findTicket(id)!.createdAt).toBe(createdAt);
  });

  it('partitions every current ticket into the three authoritative statuses', () => {
    const status=reports.statuses();
    expect(status.needsReview+status.answered+status.closed).toBe(status.total);
    expect(status.total).toBe(source.tickets().length);
  });

  it('reacts to employer/internal replies, closure, reopening and referral rules', () => {
    const id=source.createTicketFromDocument(2006,'user-1','support','چرخه وضعیت',[],'workflow-create')!;
    expect(source.findTicket(id)?.status).toBe('نیاز به بررسی');
    source.internalReply(id,'support-expert','پشتیبان','پاسخ',[],'workflow-internal');
    expect(source.findTicket(id)?.status).toBe('جواب داده شده');
    source.employerReply(id,'user-1','پیگیری',[],'workflow-employer');
    expect(source.findTicket(id)?.status).toBe('نیاز به بررسی');
    source.closeInternal(id,'super-admin'); expect(source.findTicket(id)?.status).toBe('بسته شده');
    source.reopenInternal(id,'sales-expert'); expect(source.findTicket(id)?.status).toBe('نیاز به بررسی');
    source.refer(id,'support-expert','sales','پشتیبان'); expect(source.findTicket(id)?.status).toBe('نیاز به بررسی');
  });

  it('keeps current-status metrics independent of the selected creation period', () => {
    const snapshot=reports.statuses();
    for(const period of ['day','week','month','year','all'] as const){ reports.created(period); expect(reports.statuses()).toEqual(snapshot); }
  });

  it('supports current/complete-previous Jalali periods and all-time without a fabricated comparison', () => {
    const month=reports.created('month');
    expect(month.bounds.current.start).toMatch(/^\d{4}\/\d{2}\/01$/);
    expect(month.bounds.previous?.start).toMatch(/^\d{4}\/\d{2}\/01$/);
    expect(month.current).toBeGreaterThan(0); expect(month.previous).toBeGreaterThan(0);
    const all=reports.created('all'); expect(all.previous).toBeNull(); expect(all.current).toBe(all.total);
  });

  it('returns truthful zero metrics for an empty shared source', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [Fish24TicketReportsService, { provide: Fish24TicketPreviewService, useValue: { tickets: signal<readonly never[]>([]).asReadonly() } }] });
    const empty=TestBed.inject(Fish24TicketReportsService);
    expect(empty.created('month').current).toBe(0);
    expect(empty.created('month').previous).toBe(0);
    expect(empty.statuses()).toEqual({needsReview:0,answered:0,closed:0,total:0});
  });
});

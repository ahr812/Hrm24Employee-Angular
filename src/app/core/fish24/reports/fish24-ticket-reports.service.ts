import { Injectable, inject } from '@angular/core';
import { Fish24TicketPreviewService, Fish24TicketStatus } from '../tickets/fish24-ticket-preview.service';
import { Fish24ReportPeriod, Fish24ReportPeriodBounds, currentTehranJalaliDate, dateInFish24Range, fish24ReportPeriodBounds, tehranSaturdayWeekday } from './fish24-report-calendar';

export interface Fish24TicketCreatedMetric {
  readonly current: number;
  readonly previous: number | null;
  readonly bounds: Fish24ReportPeriodBounds;
  readonly total: number;
}

export interface Fish24TicketStatusSnapshot {
  readonly needsReview: number;
  readonly answered: number;
  readonly closed: number;
  readonly total: number;
}

@Injectable({ providedIn: 'root' })
export class Fish24TicketReportsService {
  private readonly source = inject(Fish24TicketPreviewService);

  created(period: Fish24ReportPeriod, now = new Date()): Fish24TicketCreatedMetric {
    const bounds = fish24ReportPeriodBounds(period, currentTehranJalaliDate(now), tehranSaturdayWeekday(now));
    const tickets = this.source.tickets();
    return {
      current: tickets.filter(ticket => dateInFish24Range(ticket.createdAt, bounds.current)).length,
      previous: bounds.previous ? tickets.filter(ticket => dateInFish24Range(ticket.createdAt, bounds.previous!)).length : null,
      bounds,
      total: tickets.filter(ticket => dateInFish24Range(ticket.createdAt, fish24ReportPeriodBounds('all', currentTehranJalaliDate(now), tehranSaturdayWeekday(now)).current)).length
    };
  }

  statuses(now = new Date()): Fish24TicketStatusSnapshot {
    const today = currentTehranJalaliDate(now);
    const tickets = this.source.tickets().filter(ticket => ticket.createdAt.slice(0, 10) <= today);
    const count = (status: Fish24TicketStatus) => tickets.filter(ticket => ticket.status === status).length;
    const snapshot = { needsReview: count('نیاز به بررسی'), answered: count('جواب داده شده'), closed: count('بسته شده'), total: tickets.length };
    if (snapshot.needsReview + snapshot.answered + snapshot.closed !== snapshot.total) throw new Error('Ticket statuses must partition the ticket population.');
    return snapshot;
  }

  currentJalaliDate(now = new Date()): string { return currentTehranJalaliDate(now); }
}

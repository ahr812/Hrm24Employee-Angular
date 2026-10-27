import { Inject, Injectable } from '@angular/core';
import { Fish24DocumentDistributionPreviewService } from '../financial/fish24-document-distribution-preview.service';
import { Fish24InternalInvoicePreviewService } from '../financial/fish24-internal-invoice-preview.service';
import { Fish24WalletPreviewService } from '../financial/fish24-wallet-preview.service';
import { FISH24_REPORTS_CLOCK, Fish24ReportsClock } from './fish24-user-reports.service';
import {
  Fish24ReportPeriod,
  Fish24ReportPeriodBounds,
  currentTehranJalaliDate,
  dateInFish24Range,
  fish24ReportPeriodBounds,
  tehranSaturdayWeekday
} from './fish24-report-calendar';

export type Fish24FinancialMetricId = 'invoiceCount' | 'invoiceAmount';
export type Fish24FinancialMonthlyMetricId = 'paidDistributions' | 'formalInvoices';

export interface Fish24FinancialComparison {
  readonly id: Fish24FinancialMetricId;
  readonly current: number;
  readonly previous: number | null;
  readonly bounds: Fish24ReportPeriodBounds;
}

export interface Fish24FinancialMonthlySeries {
  readonly id: Fish24FinancialMonthlyMetricId;
  readonly selectedYear: number;
  readonly previousYear: number;
  readonly selected: readonly (number | null)[];
  readonly previous: readonly number[];
}

export interface Fish24FinancialReportAudit {
  readonly numberedInvoiceCount: number;
  readonly numberedInvoiceGrossRial: number;
  readonly completedSendCount: number;
  readonly completedSendAmountRial: number;
  readonly paidSendsWithoutAuthoritativeDebit: readonly string[];
  readonly receiptPaymentMismatches: readonly { readonly sendId: string; readonly receiptRial: number; readonly debitRial: number }[];
}

interface DatedAmount { readonly date: string; readonly amount: number; }

@Injectable({ providedIn: 'root' })
export class Fish24FinancialReportsService {
  constructor(
    private readonly distributions: Fish24DocumentDistributionPreviewService,
    private readonly wallets: Fish24WalletPreviewService,
    private readonly invoices: Fish24InternalInvoicePreviewService,
    @Inject(FISH24_REPORTS_CLOCK) private readonly clock: Fish24ReportsClock
  ) {}

  currentJalaliDate(): string { return currentTehranJalaliDate(this.clock.now()); }

  availableYears(): readonly number[] {
    const current = Number(this.currentJalaliDate().slice(0, 4));
    const years = new Set<number>([current, current - 1]);
    this.invoiceEvents().forEach(event => years.add(Number(event.date.slice(0, 4))));
    this.completedDistributionEvents().forEach(event => years.add(Number(event.date.slice(0, 4))));
    return [...years].filter(Number.isSafeInteger).sort((left, right) => right - left);
  }

  comparison(id: Fish24FinancialMetricId, period: Fish24ReportPeriod): Fish24FinancialComparison {
    const now = this.clock.now();
    const bounds = fish24ReportPeriodBounds(period, currentTehranJalaliDate(now), tehranSaturdayWeekday(now));
    const events = this.invoiceEvents();
    const amount = (event: DatedAmount) => id === 'invoiceCount' ? 1 : event.amount;
    return {
      id,
      current: this.sum(events, bounds.current, amount),
      previous: bounds.previous ? this.sum(events, bounds.previous, amount) : null,
      bounds
    };
  }

  monthly(id: Fish24FinancialMonthlyMetricId, selectedYear: number): Fish24FinancialMonthlySeries {
    const currentDate = this.currentJalaliDate();
    const currentYear = Number(currentDate.slice(0, 4));
    const currentMonth = Number(currentDate.slice(5, 7));
    const events = id === 'formalInvoices' ? this.invoiceEvents() : this.completedDistributionEvents();
    const values = (year: number, hideFuture: boolean): readonly (number | null)[] => Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      if (hideFuture && month > currentMonth) return null;
      const prefix = `${year}/${String(month).padStart(2, '0')}/`;
      return events.filter(event => event.date.startsWith(prefix)).reduce((total, event) => total + event.amount, 0);
    });
    return {
      id,
      selectedYear,
      previousYear: selectedYear - 1,
      selected: values(selectedYear, selectedYear === currentYear),
      previous: values(selectedYear - 1, false) as readonly number[]
    };
  }

  audit(): Fish24FinancialReportAudit {
    const invoiceEvents = this.invoiceEvents();
    const completed = this.completedDistributionEvents();
    const debitBySend = new Map(this.wallets.transactions()
      .filter(transaction => transaction.origin === 'document-distribution' && transaction.direction === 'debit' && transaction.status === 'success')
      .map(transaction => [transaction.operationId, transaction]));
    const paidSends = this.distributions.sends().filter(send => send.isPaid && send.employeeAccessActive);
    const receiptPaymentMismatches = paidSends.flatMap(send => {
      const debit = debitBySend.get(send.id);
      const receipt = this.distributions.receiptFor(send.id);
      return debit && receipt && debit.amountRial !== receipt.breakdown.totalRial
        ? [{ sendId: send.id, receiptRial: receipt.breakdown.totalRial, debitRial: debit.amountRial }]
        : [];
    });
    return {
      numberedInvoiceCount: invoiceEvents.length,
      numberedInvoiceGrossRial: invoiceEvents.reduce((sum, event) => sum + event.amount, 0),
      completedSendCount: completed.length,
      completedSendAmountRial: completed.reduce((sum, event) => sum + event.amount, 0),
      paidSendsWithoutAuthoritativeDebit: paidSends.filter(send => !debitBySend.has(send.id)).map(send => send.id),
      receiptPaymentMismatches
    };
  }

  private completedDistributionEvents(): readonly DatedAmount[] {
    const eligible = new Set(this.distributions.sends()
      .filter(send => send.isPaid && send.employeeAccessActive)
      .map(send => send.id));
    return this.wallets.transactions()
      .filter(transaction => eligible.has(transaction.operationId)
        && transaction.origin === 'document-distribution'
        && transaction.direction === 'debit'
        && transaction.status === 'success')
      .map(transaction => ({ date: transaction.createdAt.slice(0, 10), amount: transaction.amountRial }));
  }

  private invoiceEvents(): readonly DatedAmount[] {
    return this.invoices.invoices().map(invoice => ({ date: invoice.issueDate, amount: invoice.amountRial }));
  }

  private sum(events: readonly DatedAmount[], range: Fish24ReportPeriodBounds['current'], amount: (event: DatedAmount) => number): number {
    return events.filter(event => dateInFish24Range(event.date, range)).reduce((total, event) => total + amount(event), 0);
  }
}

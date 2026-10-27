import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import type * as Highcharts from 'highcharts';
import { HighchartsChartDirective } from 'highcharts-angular';
import { Fish24FinancialComparison, Fish24FinancialMetricId, Fish24FinancialMonthlySeries, Fish24FinancialReportsService } from '../../../../core/fish24/reports/fish24-financial-reports.service';
import { FISH24_REPORT_PERIODS, Fish24ReportPeriod } from '../../../../core/fish24/reports/fish24-report-calendar';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

interface FinancialReportPreferences {
  readonly invoiceCountPeriod: Fish24ReportPeriod;
  readonly invoiceAmountPeriod: Fish24ReportPeriod;
  readonly paidDistributionYear: number;
  readonly formalInvoiceYear: number;
}

const LIST_ID = 'internal-financial-reports-dashboard';
const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const VALID_PERIODS = new Set(FISH24_REPORT_PERIODS.map(period => period.id));
const TOOLTIP: Highcharts.TooltipOptions = {
  useHTML: true, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#475569',
  backgroundColor: 'rgba(15, 23, 42, 0.96)', shadow: false,
  style: { color: '#f8fafc', fontFamily: 'Vazirmatn', fontSize: '12px', direction: 'rtl', textAlign: 'right', whiteSpace: 'nowrap' }
};

function tooltip(title: string, lines: readonly string[]): string {
  const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
  return `<div dir="rtl" style="display:inline-grid;gap:2px;white-space:nowrap;text-align:right;line-height:1.7"><strong>${escape(title)}</strong>${lines.map(line => `<span>${escape(line)}</span>`).join('')}</div>`;
}

@Component({
  selector: 'app-internal-financial-reports',
  standalone: true,
  imports: [HighchartsChartDirective, IconComponent, NgTemplateOutlet],
  template: `
    <main class="mx-auto max-w-[95%] space-y-5 animate-fade-in-up" dir="rtl">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3"><span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ui-icon name="trending-up" [size]="25"/></span><div><h1 class="text-2xl font-black text-foreground dark:text-slate-100 sm:text-3xl">گزارشات مالی</h1><p class="mt-1 text-sm text-muted">نمای تحلیلی پرداخت توزیع اسناد و فاکتورهای رسمی</p></div></div>
        <span class="w-fit rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">مبالغ به ریال • تا {{ displayDate() }}</span>
      </header>

      <section class="space-y-3" aria-labelledby="invoice-comparison-title">
        <div class="section-title"><ui-icon name="file-text" [size]="20"/><h2 id="invoice-comparison-title">فاکتورهای رسمی</h2></div>
        <div class="grid gap-4 xl:grid-cols-2">
          <ng-container [ngTemplateOutlet]="comparisonCard" [ngTemplateOutletContext]="{ id: 'invoiceCount', title: 'تعداد فاکتورهای صادرشده', icon: 'file-text', metric: invoiceCount(), chart: invoiceCountChart(), amount: false }"/>
          <ng-container [ngTemplateOutlet]="comparisonCard" [ngTemplateOutletContext]="{ id: 'invoiceAmount', title: 'مبلغ فاکتورهای صادرشده', icon: 'banknote', metric: invoiceAmount(), chart: invoiceAmountChart(), amount: true }"/>
        </div>
      </section>

      <section class="space-y-3" aria-labelledby="monthly-financial-title">
        <div class="section-title"><ui-icon name="bar-chart-2" [size]="20"/><h2 id="monthly-financial-title">روند ماهانه</h2></div>
        <div class="grid gap-4 xl:grid-cols-2">
          <article class="report-card min-w-0">
            <div class="chart-head"><div><h3 class="card-title">مبلغ ارسال‌های پرداخت‌شده و توزیع‌شده</h3><p class="card-subtitle">بر پایه برداشت موفق کیف پول و زمان تکمیل عملیات</p></div><label class="year-select">سال<select [value]="preferences().paidDistributionYear" (change)="setYear('paidDistributionYear', $event)">@for (year of years(); track year) {<option [value]="year">{{ number(year) }}</option>}</select></label></div>
            <div highchartsChart [options]="paidDistributionChart()" (chartInstance)="watchChart($event)" class="monthly-chart" aria-label="نمودار ماهانه مبلغ ارسال‌های پرداخت‌شده و توزیع‌شده"></div>
          </article>
          <article class="report-card min-w-0">
            <div class="chart-head"><div><h3 class="card-title">مبلغ فاکتورهای صادرشده</h3><p class="card-subtitle">مبلغ نهایی فاکتورهای شماره‌دار با احتساب ارزش افزوده</p></div><label class="year-select">سال<select [value]="preferences().formalInvoiceYear" (change)="setYear('formalInvoiceYear', $event)">@for (year of years(); track year) {<option [value]="year">{{ number(year) }}</option>}</select></label></div>
            <div highchartsChart [options]="formalInvoiceChart()" (chartInstance)="watchChart($event)" class="monthly-chart" aria-label="نمودار ماهانه مبلغ فاکتورهای صادرشده"></div>
          </article>
        </div>
        @if (audit().paidSendsWithoutAuthoritativeDebit.length) {<aside class="notice"><ui-icon name="info" [size]="17"/><p>{{ number(audit().paidSendsWithoutAuthoritativeDebit.length) }} ارسال نمایشی پرداخت‌شده فاقد رخداد برداشت معتبر است و بدون حدس تاریخ یا مبلغ از گزارش مالی کنار گذاشته شده است.</p></aside>}
      </section>

      <section class="space-y-3" aria-labelledby="discount-report-title">
        <div class="section-title"><ui-icon name="percent" [size]="20"/><h2 id="discount-report-title">شاخص‌های تخفیف</h2></div>
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">@for (label of discountLabels; track label) {<article class="deferred-card"><ui-icon name="clock" [size]="19"/><div><h3>{{ label }}</h3><p>پس از پیاده‌سازی تخفیفات</p></div></article>}</div>
      </section>

      <aside class="notice"><ui-icon name="info" [size]="17"/><p>این صفحه از منابع مشترک پیش‌نمایش استفاده می‌کند. رسیدهای داخلی سند در جمع فاکتور رسمی وارد نمی‌شوند و ارقام تخفیف تا زمان پیاده‌سازی نمایش داده نمی‌شوند.</p></aside>

      <ng-template #comparisonCard let-id="id" let-title="title" let-icon="icon" let-metric="metric" let-chart="chart" let-amount="amount">
        <article class="report-card min-w-0"><div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div class="flex items-center gap-2"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon [name]="icon" [size]="19"/></span><h3 class="card-title">{{ title }}</h3></div><div class="period-control" [attr.aria-label]="'انتخاب دوره ' + title">@for (period of reportPeriods; track period.id) {<button type="button" [class.period-active]="selectedPeriod(id) === period.id" (click)="setPeriod(id, period.id)">{{ period.label }}</button>}</div></div>
          <div class="mt-4 grid grid-cols-2 gap-2" [class.grid-cols-1]="metric.previous === null"><div class="metric"><span>دوره جاری</span><strong>{{ amount ? money(metric.current) : number(metric.current) }}</strong><small>{{ metric.bounds.current.label }}</small></div>@if (metric.previous !== null) {<div class="metric metric--previous"><span>دوره قبل</span><strong>{{ amount ? money(metric.previous) : number(metric.previous) }}</strong><small>{{ metric.bounds.previous?.label }}</small></div>}</div>
          @if (metric.current > 0 || (metric.previous ?? 0) > 0) {<div highchartsChart [options]="chart" (chartInstance)="watchChart($event)" class="comparison-chart" [attr.aria-label]="'نمودار مقایسه‌ای ' + title"></div>} @else {<div class="comparison-chart chart-empty" role="status"><ui-icon name="bar-chart-2" [size]="26"/><span>در این دوره فاکتور شماره‌داری ثبت نشده است.</span></div>}
        </article>
      </ng-template>
    </main>
  `,
  styles: [`
    .section-title{display:flex;align-items:center;gap:.5rem;color:rgb(var(--color-primary));font-weight:900;font-size:1.1rem}.report-card{border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));padding:1rem;box-shadow:0 1px 3px rgb(15 23 42/.06)}:host-context(.dark) .report-card{border-color:#334155;background:#1e293b}.card-title{font-size:.95rem;font-weight:900;color:rgb(var(--color-foreground))}:host-context(.dark) .card-title{color:#f1f5f9}.card-subtitle{margin-top:.35rem;font-size:.7rem;line-height:1.4rem;color:rgb(var(--color-muted))}.chart-head{display:flex;flex-direction:column;gap:.75rem}.year-select{display:flex;align-items:center;gap:.45rem;font-size:.75rem;font-weight:800;color:rgb(var(--color-muted))}.year-select select{min-height:2.5rem;border:1px solid rgb(var(--color-border));border-radius:.7rem;background:rgb(var(--color-background));padding:0 .65rem;color:rgb(var(--color-foreground))}:host-context(.dark) .year-select select{border-color:#475569;background:#0f172a;color:#f8fafc}.period-control{display:flex;max-width:100%;overflow-x:auto;border:1px solid rgb(var(--color-border));border-radius:.65rem;padding:.15rem}:host-context(.dark) .period-control{border-color:#475569}.period-control button{min-width:2.45rem;border-radius:.5rem;padding:.35rem .5rem;font-size:.7rem;font-weight:800;color:rgb(var(--color-muted))}.period-control .period-active{background:rgb(var(--color-primary));color:white}.metric{border-radius:.75rem;background:rgb(var(--color-primary)/.06);padding:.65rem}.metric--previous{background:#94a3b81c}.metric span,.metric small{display:block;font-size:.65rem;color:rgb(var(--color-muted))}.metric strong{display:block;margin:.25rem 0;font-size:1.05rem;font-weight:900;color:rgb(var(--color-foreground));direction:ltr;text-align:right}:host-context(.dark) .metric strong{color:#f8fafc}.monthly-chart{display:block;width:100%;height:290px;margin-top:.5rem}.comparison-chart{display:block;width:100%;height:220px;margin-top:.5rem}.chart-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;border:1px dashed rgb(var(--color-border));border-radius:.75rem;color:rgb(var(--color-muted));font-size:.75rem;font-weight:700}:host-context(.dark) .chart-empty{border-color:#475569}.deferred-card{display:flex;align-items:flex-start;gap:.7rem;border:1px dashed rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));padding:1rem;color:rgb(var(--color-muted))}:host-context(.dark) .deferred-card{border-color:#475569;background:#1e293b}.deferred-card h3{font-size:.8rem;font-weight:900;color:rgb(var(--color-foreground))}:host-context(.dark) .deferred-card h3{color:#e2e8f0}.deferred-card p{margin-top:.35rem;font-size:.72rem;font-weight:700}.notice{display:flex;gap:.55rem;border:1px solid rgb(var(--color-primary)/.2);border-radius:.8rem;background:rgb(var(--color-primary)/.05);padding:.75rem;font-size:.75rem;line-height:1.5rem;color:rgb(var(--color-muted))}.notice ui-icon{margin-top:.2rem;flex-shrink:0;color:rgb(var(--color-primary))}@media(min-width:640px){.report-card{padding:1.25rem}.chart-head{flex-direction:row;align-items:flex-start;justify-content:space-between}.card-title{font-size:1rem}.monthly-chart{height:320px}.comparison-chart{height:240px}}
  `]
})
export class InternalFinancialReportsComponent {
  private readonly reports = inject(Fish24FinancialReportsService);
  private readonly stored = inject(InternalListPreferencesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly observers = new Map<Highcharts.Chart, ResizeObserver>();
  readonly reportPeriods = FISH24_REPORT_PERIODS;
  readonly years = computed(() => this.reports.availableYears());
  readonly discountLabels = ['تعداد تخفیفات زمانی استفاده‌شده', 'مبلغ تخفیفات زمانی استفاده‌شده', 'تعداد تخفیفات تعدادی استفاده‌شده', 'مبلغ تخفیفات تعدادی استفاده‌شده', 'تعداد تخفیفات کوپنی استفاده‌شده', 'مبلغ تخفیفات کوپنی استفاده‌شده'];
  readonly preferences = signal(this.stored.loadFilters(LIST_ID, this.defaults(), value => this.validatePreferences(value)));
  readonly invoiceCount = computed(() => this.reports.comparison('invoiceCount', this.preferences().invoiceCountPeriod));
  readonly invoiceAmount = computed(() => this.reports.comparison('invoiceAmount', this.preferences().invoiceAmountPeriod));
  readonly paidDistribution = computed(() => this.reports.monthly('paidDistributions', this.preferences().paidDistributionYear));
  readonly formalInvoice = computed(() => this.reports.monthly('formalInvoices', this.preferences().formalInvoiceYear));
  readonly invoiceCountChart = computed(() => this.comparisonChart('تعداد فاکتورهای صادرشده', this.invoiceCount(), false));
  readonly invoiceAmountChart = computed(() => this.comparisonChart('مبلغ فاکتورهای صادرشده', this.invoiceAmount(), true));
  readonly paidDistributionChart = computed(() => this.monthlyChart('مبلغ ارسال‌های پرداخت‌شده و توزیع‌شده', this.paidDistribution()));
  readonly formalInvoiceChart = computed(() => this.monthlyChart('مبلغ فاکتورهای صادرشده', this.formalInvoice()));
  readonly audit = computed(() => this.reports.audit());
  readonly displayDate = computed(() => this.reports.currentJalaliDate().replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]));

  constructor() { this.destroyRef.onDestroy(() => { this.observers.forEach(observer => observer.disconnect()); this.observers.clear(); }); }

  selectedPeriod(id: Fish24FinancialMetricId): Fish24ReportPeriod { return id === 'invoiceCount' ? this.preferences().invoiceCountPeriod : this.preferences().invoiceAmountPeriod; }
  setPeriod(id: Fish24FinancialMetricId, period: Fish24ReportPeriod): void { this.update({ [id === 'invoiceCount' ? 'invoiceCountPeriod' : 'invoiceAmountPeriod']: period }); }
  setYear(key: 'paidDistributionYear' | 'formalInvoiceYear', event: Event): void { const year = Number((event.target as HTMLSelectElement).value); if (this.years().includes(year)) this.update({ [key]: year }); }
  number(value: number): string { return new Intl.NumberFormat('fa-IR').format(value); }
  money(value: number): string { return `${this.number(value)} ریال`; }
  watchChart(chart: Highcharts.Chart): void { if (this.observers.has(chart) || typeof ResizeObserver === 'undefined') return; const observer = new ResizeObserver(() => chart.reflow()); observer.observe(chart.container.parentElement ?? chart.container); this.observers.set(chart, observer); }

  private defaults(): FinancialReportPreferences { const year = Number(this.reports.currentJalaliDate().slice(0, 4)); return { invoiceCountPeriod: 'month', invoiceAmountPeriod: 'month', paidDistributionYear: year, formalInvoiceYear: year }; }
  private validatePreferences(value: unknown): FinancialReportPreferences | null { if (!value || typeof value !== 'object') return null; const candidate = value as Partial<FinancialReportPreferences>; const years = this.reports.availableYears(); if (!VALID_PERIODS.has(candidate.invoiceCountPeriod as Fish24ReportPeriod) || !VALID_PERIODS.has(candidate.invoiceAmountPeriod as Fish24ReportPeriod) || !years.includes(candidate.paidDistributionYear ?? NaN) || !years.includes(candidate.formalInvoiceYear ?? NaN)) return null; return candidate as FinancialReportPreferences; }
  private update(changes: Partial<FinancialReportPreferences>): void { const next = { ...this.preferences(), ...changes }; this.preferences.set(next); this.stored.saveFilters(LIST_ID, next); }
  private comparisonChart(title: string, metric: Fish24FinancialComparison, amount: boolean): Highcharts.Options { const values = metric.previous === null ? [{ y: metric.current, color: '#0f8fa8' }] : [{ y: metric.previous, color: '#94a3b8' }, { y: metric.current, color: '#0f8fa8' }]; const categories = metric.previous === null ? ['کل تا امروز'] : ['دوره قبل', 'دوره جاری']; return { chart: { type: 'column', backgroundColor: 'transparent', animation: false }, title: { text: undefined }, credits: { enabled: true }, legend: { enabled: false }, xAxis: { categories, labels: { style: { fontFamily: 'Vazirmatn', color: '#64748b' } } }, yAxis: { min: 0, title: { text: amount ? 'میلیون ریال' : 'تعداد', style: { fontFamily: 'Vazirmatn', color: '#64748b' } }, labels: { formatter: function () { const value = Number(this.value); return amount ? (value / 1_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 1 }) : value.toLocaleString('fa-IR'); }, style: { fontFamily: 'Vazirmatn', color: '#64748b' } } }, tooltip: { ...TOOLTIP, formatter: function () { const value = this.y ?? 0; return tooltip(String(this.key), [amount ? `${value.toLocaleString('fa-IR')} ریال` : value.toLocaleString('fa-IR')]); } }, accessibility: { enabled: true, description: `مقایسه ${title} در دوره جاری و قبلی.` }, plotOptions: { column: { animation: false, borderRadius: 5, maxPointWidth: 54, dataLabels: { enabled: true, formatter: function () { if (!this.y) return undefined; return amount ? `${(this.y / 1_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} م` : this.y.toLocaleString('fa-IR'); }, style: { fontFamily: 'Vazirmatn', textOutline: 'none', color: '#64748b', fontSize: '10px' } } } }, series: [{ type: 'column', name: title, data: values }] }; }
  private monthlyChart(title: string, data: Fish24FinancialMonthlySeries): Highcharts.Options { return { chart: { type: 'column', backgroundColor: 'transparent', animation: false, spacing: [10, 2, 8, 2] }, title: { text: undefined }, credits: { enabled: true }, legend: { enabled: true, rtl: true, itemStyle: { fontFamily: 'Vazirmatn', color: '#64748b' } }, xAxis: { categories: MONTHS, labels: { rotation: -45, style: { fontFamily: 'Vazirmatn', color: '#64748b', fontSize: '10px' } } }, yAxis: { min: 0, title: { text: 'میلیون ریال', style: { fontFamily: 'Vazirmatn', color: '#64748b' } }, labels: { formatter: function () { return (Number(this.value) / 1_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 1 }); }, style: { fontFamily: 'Vazirmatn', color: '#64748b' } } }, tooltip: { ...TOOLTIP, shared: true, formatter: function () { const lines = (this.points ?? []).map(point => `${point.series.name}: ${(point.y ?? 0).toLocaleString('fa-IR')} ریال`); return tooltip(String(this.x), lines); } }, accessibility: { enabled: true, description: `${title} به تفکیک ماه برای سال ${data.selectedYear} و ${data.previousYear}.` }, plotOptions: { column: { animation: false, borderRadius: 3, groupPadding: .12, pointPadding: .06, maxPointWidth: 28 } }, series: [{ type: 'column', name: `سال ${this.number(data.previousYear)}`, color: '#94a3b8', data: [...data.previous] }, { type: 'column', name: `سال ${this.number(data.selectedYear)}`, color: '#0f8fa8', data: [...data.selected] }] }; }
}

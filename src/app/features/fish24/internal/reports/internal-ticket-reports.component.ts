import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import type * as Highcharts from 'highcharts';
import { HighchartsChartDirective } from 'highcharts-angular';
import { FISH24_REPORT_PERIODS, Fish24ReportPeriod } from '../../../../core/fish24/reports/fish24-report-calendar';
import { Fish24TicketCreatedMetric, Fish24TicketReportsService } from '../../../../core/fish24/reports/fish24-ticket-reports.service';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

const LIST_ID = 'internal-ticket-reports-dashboard-period';
const VALID_PERIODS = new Set(FISH24_REPORT_PERIODS.map(item => item.id));
const TOOLTIP: Highcharts.TooltipOptions = {
  useHTML: true, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#475569',
  backgroundColor: 'rgba(15,23,42,.96)', shadow: false,
  style: { color: '#f8fafc', fontFamily: 'Vazirmatn', fontSize: '12px', direction: 'rtl', textAlign: 'right', whiteSpace: 'nowrap' }
};

function escape(value: string): string { return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!); }
function tooltip(title: string, value: number): string { return `<div dir="rtl" style="display:inline-grid;gap:2px;white-space:nowrap;text-align:right;line-height:1.7"><strong>${escape(title)}</strong><span><bdi>${value.toLocaleString('fa-IR')}</bdi> تیکت</span></div>`; }

export function validateTicketReportPeriod(value: unknown): Fish24ReportPeriod | null {
  if (!value || typeof value !== 'object') return null;
  const period = (value as { period?: unknown }).period;
  return VALID_PERIODS.has(period as Fish24ReportPeriod) ? period as Fish24ReportPeriod : null;
}

@Component({
  selector: 'app-internal-ticket-reports',
  standalone: true,
  imports: [HighchartsChartDirective, IconComponent],
  template: `
    <main class="mx-auto max-w-[95%] space-y-5 animate-fade-in-up" dir="rtl">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ui-icon name="ticket" [size]="25" /></span>
          <div><h1 class="text-2xl font-black text-foreground dark:text-slate-100 sm:text-3xl">گزارشات تیکت</h1><p class="mt-1 text-sm text-muted">نمای تحلیلی همهٔ تیکت‌های مشترک پیش‌نمایش فیش۲۴</p></div>
        </div>
        <span class="w-fit rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning">داده‌های نمایشی چرخان • تا {{ displayDate() }}</span>
      </header>

      <section aria-labelledby="created-heading" class="space-y-3">
        <div class="section-title"><ui-icon name="bar-chart-2" [size]="20" /><h2 id="created-heading">تیکت‌های ایجادشده</h2></div>
        <article class="report-card min-w-0">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 class="card-title">تعداد تیکت‌های ایجادشده</h3><p class="mt-1 text-xs text-muted">مبنای شمارش فقط زمان ایجاد اولیه تیکت است.</p></div>
            <div class="period-control" role="group" aria-label="دوره گزارش تیکت‌های ایجادشده">
              @for (item of periods; track item.id) { <button type="button" [class.period-active]="period() === item.id" (click)="setPeriod(item.id)">{{ item.label }}</button> }
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2" [class.grid-cols-1]="created().previous === null">
            <div class="metric-value"><span>{{ created().previous === null ? 'همهٔ تیکت‌ها تا امروز' : 'دوره جاری' }}</span><strong>{{ number(created().current) }}</strong><small>{{ created().bounds.current.label }}</small></div>
            @if (created().previous !== null) { <div class="metric-value metric-value--previous"><span>دوره قبل</span><strong>{{ number(created().previous!) }}</strong><small>{{ created().bounds.previous?.label }}</small></div> }
          </div>
          @if (hasCreatedData()) { <div highchartsChart [options]="createdChart()" (chartInstance)="watchChart($event)" class="chart" aria-label="نمودار مقایسه‌ای تعداد تیکت‌های ایجادشده"></div> }
          @else { <div class="chart chart-empty"><ui-icon name="ticket" [size]="26"/><span>در این دو دوره تیکتی ایجاد نشده است.</span></div> }
        </article>
      </section>

      <section aria-labelledby="status-heading" class="space-y-3">
        <div class="section-title"><ui-icon name="message-circle" [size]="20" /><div><h2 id="status-heading">وضعیت فعلی تیکت‌ها — همهٔ تیکت‌ها</h2><p class="mt-1 text-xs font-medium text-muted">این بخش مستقل از دوره انتخاب‌شده و بر پایه وضعیت فعلی است.</p></div></div>
        <div class="grid gap-3 sm:grid-cols-3">
          <article class="snapshot-card"><span class="status-dot bg-warning"></span><div><p class="snapshot-value">{{ number(statuses().needsReview) }}</p><p class="snapshot-label">نیاز به بررسی</p></div></article>
          <article class="snapshot-card"><span class="status-dot bg-primary"></span><div><p class="snapshot-value">{{ number(statuses().answered) }}</p><p class="snapshot-label">جواب داده شده</p></div></article>
          <article class="snapshot-card"><span class="status-dot bg-success"></span><div><p class="snapshot-value">{{ number(statuses().closed) }}</p><p class="snapshot-label">بسته شده</p></div></article>
        </div>
        <article class="report-card grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div>
            <h3 class="card-title">توزیع وضعیت فعلی</h3>
            <p class="mt-1 text-xs text-muted">مجموع وضعیت‌ها: {{ number(statuses().total) }} تیکت</p>
            <dl class="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <div class="legend-row"><span class="legend-dot bg-warning"></span><dt>نیاز به بررسی</dt><dd>{{ number(statuses().needsReview) }}</dd></div>
              <div class="legend-row"><span class="legend-dot bg-primary"></span><dt>جواب داده شده</dt><dd>{{ number(statuses().answered) }}</dd></div>
              <div class="legend-row"><span class="legend-dot bg-success"></span><dt>بسته شده</dt><dd>{{ number(statuses().closed) }}</dd></div>
            </dl>
          </div>
          @if (statuses().total > 0) { <div highchartsChart [options]="statusChart()" (chartInstance)="watchChart($event)" class="chart chart--status" aria-label="نمودار توزیع وضعیت فعلی همه تیکت‌ها"></div> }
          @else { <div class="chart chart--status chart-empty"><ui-icon name="ticket" [size]="26"/><span>هنوز تیکتی وجود ندارد.</span></div> }
        </article>
      </section>
    </main>
  `,
  styles: [`
    .section-title{display:flex;align-items:center;gap:.5rem;color:rgb(var(--color-primary));font-weight:900;font-size:1.1rem}.report-card{border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));padding:1rem;box-shadow:0 1px 3px rgb(15 23 42/.06)}:host-context(.dark) .report-card{border-color:#334155;background:#1e293b}.card-title{font-size:.95rem;font-weight:900;color:rgb(var(--color-foreground))}:host-context(.dark) .card-title{color:#f1f5f9}.period-control{display:flex;max-width:100%;overflow-x:auto;border:1px solid rgb(var(--color-border));border-radius:.65rem;padding:.15rem}:host-context(.dark) .period-control{border-color:#475569}.period-control button{min-width:2.45rem;border-radius:.5rem;padding:.35rem .5rem;font-size:.7rem;font-weight:800;color:rgb(var(--color-muted))}.period-control button.period-active{background:rgb(var(--color-primary));color:#fff}.metric-value{border-radius:.75rem;background:rgb(var(--color-primary)/.06);padding:.65rem}.metric-value span,.metric-value small{display:block;font-size:.65rem;color:rgb(var(--color-muted))}.metric-value strong{display:block;margin:.25rem 0;font-size:1.15rem;font-weight:900;color:rgb(var(--color-foreground));direction:ltr;text-align:right}:host-context(.dark) .metric-value strong{color:#f8fafc}.metric-value--previous{background:#94a3b81c}.snapshot-card{display:flex;min-width:0;align-items:center;gap:.75rem;border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));padding:.9rem}:host-context(.dark) .snapshot-card{border-color:#334155;background:#1e293b}.snapshot-value{font-size:1.55rem;line-height:1;font-weight:900;color:rgb(var(--color-foreground))}:host-context(.dark) .snapshot-value{color:#f8fafc}.snapshot-label{margin-top:.35rem;font-size:.78rem;font-weight:800;color:rgb(var(--color-muted))}.status-dot{height:.75rem;width:.75rem;flex:none;border-radius:999px}.chart{display:block;width:100%;height:235px;margin-top:.5rem}.chart--status{height:270px}.chart-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;border:1px dashed rgb(var(--color-border));border-radius:.75rem;color:rgb(var(--color-muted));font-size:.75rem;font-weight:700}:host-context(.dark) .chart-empty{border-color:#475569}.legend-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.5rem;border:1px solid rgb(var(--color-border));border-radius:.75rem;padding:.65rem;font-size:.75rem;color:rgb(var(--color-muted))}:host-context(.dark) .legend-row{border-color:#334155}.legend-row dd{font-size:1rem;font-weight:900;color:rgb(var(--color-foreground))}:host-context(.dark) .legend-row dd{color:#f8fafc}.legend-dot{width:.6rem;height:.6rem;border-radius:999px}@media(min-width:640px){.report-card{padding:1.25rem}.card-title{font-size:1rem}.chart{height:250px}}
  `]
})
export class InternalTicketReportsComponent {
  private readonly reports = inject(Fish24TicketReportsService);
  private readonly stored = inject(InternalListPreferencesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly observers = new Map<Highcharts.Chart, ResizeObserver>();
  readonly periods = FISH24_REPORT_PERIODS;
  readonly period = signal(this.stored.loadFilters(LIST_ID, { period: 'month' as Fish24ReportPeriod }, value => {
    const period = validateTicketReportPeriod(value); return period ? { period } : null;
  }).period);
  readonly created = computed(() => this.reports.created(this.period()));
  readonly statuses = computed(() => this.reports.statuses());
  readonly displayDate = computed(() => this.reports.currentJalaliDate().replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]));
  readonly createdChart = computed<Highcharts.Options>(() => this.comparisonChart(this.created()));
  readonly statusChart = computed<Highcharts.Options>(() => this.distributionChart());

  constructor() { this.destroyRef.onDestroy(() => { this.observers.forEach(observer => observer.disconnect()); this.observers.clear(); }); }
  setPeriod(period: Fish24ReportPeriod): void { if (!VALID_PERIODS.has(period)) return; this.period.set(period); this.stored.saveFilters(LIST_ID, { period }); }
  hasCreatedData(): boolean { return this.created().current > 0 || (this.created().previous ?? 0) > 0; }
  number(value: number): string { return new Intl.NumberFormat('fa-IR').format(value); }
  watchChart(chart: Highcharts.Chart): void { if (this.observers.has(chart) || typeof ResizeObserver === 'undefined') return; const observer = new ResizeObserver(() => chart.reflow()); observer.observe(chart.container.parentElement ?? chart.container); this.observers.set(chart, observer); }

  private comparisonChart(metric: Fish24TicketCreatedMetric): Highcharts.Options {
    const data = metric.previous === null ? [{ y: metric.current, color: '#0f8fa8' }] : [{ y: metric.previous, color: '#94a3b8' }, { y: metric.current, color: '#0f8fa8' }];
    const categories = metric.previous === null ? ['کل تا امروز'] : ['دوره قبل', 'دوره جاری'];
    return { chart: { type: 'column', backgroundColor: 'transparent', animation: false }, title: { text: undefined }, credits: { enabled: true }, legend: { enabled: false }, xAxis: { categories, labels: { style: { fontFamily: 'Vazirmatn', color: '#64748b' } } }, yAxis: { min: 0, allowDecimals: false, title: { text: 'تعداد تیکت', style: { fontFamily: 'Vazirmatn', color: '#64748b' } }, labels: { style: { fontFamily: 'Vazirmatn', color: '#64748b' } } }, tooltip: { ...TOOLTIP, formatter: function () { return tooltip(String(this.key), this.y ?? 0); } }, accessibility: { enabled: true, description: 'مقایسه تعداد تیکت‌های ایجادشده در دوره جاری و دوره کامل قبلی.' }, plotOptions: { column: { animation: false, borderRadius: 5, maxPointWidth: 58, dataLabels: { enabled: true, formatter: function () { return (this.y ?? 0).toLocaleString('fa-IR'); }, style: { fontFamily: 'Vazirmatn', textOutline: 'none', color: '#64748b' } } } }, series: [{ type: 'column', name: 'تعداد تیکت‌های ایجادشده', data }] };
  }

  private distributionChart(): Highcharts.Options {
    const status = this.statuses();
    return { chart: { type: 'pie', backgroundColor: 'transparent', animation: false }, title: { text: undefined }, credits: { enabled: true }, legend: { enabled: false }, tooltip: { ...TOOLTIP, formatter: function () { return tooltip(String(this.key), this.y ?? 0); } }, accessibility: { enabled: true, description: 'توزیع وضعیت فعلی همه تیکت‌ها میان نیاز به بررسی، جواب داده شده و بسته شده.' }, plotOptions: { pie: { animation: false, innerSize: '58%', borderWidth: 2, borderColor: 'transparent', dataLabels: { enabled: true, distance: 12, formatter: function () { return `${this.key}: ${(this.y ?? 0).toLocaleString('fa-IR')}`; }, style: { fontFamily: 'Vazirmatn', textOutline: 'none', color: '#64748b', fontSize: '11px' } } } }, series: [{ type: 'pie', name: 'وضعیت فعلی', data: [{ name: 'نیاز به بررسی', y: status.needsReview, color: '#f59e0b' }, { name: 'جواب داده شده', y: status.answered, color: '#0f8fa8' }, { name: 'بسته شده', y: status.closed, color: '#22c55e' }] }] };
  }
}

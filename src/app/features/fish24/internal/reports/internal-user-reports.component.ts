import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type * as Highcharts from 'highcharts';
import { HighchartsChartDirective } from 'highcharts-angular';
import {
  FISH24_REPORT_PERIODS,
  Fish24ReportPeriod
} from '../../../../core/fish24/reports/fish24-report-calendar';
import {
  Fish24ComparativeMetricId,
  Fish24ComparativeReportMetric,
  Fish24UserReportsService
} from '../../../../core/fish24/reports/fish24-user-reports.service';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

export interface Fish24UserReportPeriodPreferences {
  readonly employerRegistrations: Fish24ReportPeriod;
  readonly employeeRegistrations: Fish24ReportPeriod;
  readonly uploadedFiles: Fish24ReportPeriod;
  readonly uploadedBytes: Fish24ReportPeriod;
}

export const FISH24_USER_REPORT_PERIOD_DEFAULTS: Fish24UserReportPeriodPreferences = {
  employerRegistrations: 'month', employeeRegistrations: 'month', uploadedFiles: 'month', uploadedBytes: 'month'
};

const LIST_ID = 'internal-user-reports-dashboard-periods';
const VALID_PERIODS = new Set(FISH24_REPORT_PERIODS.map(period => period.id));

function formatMegabytes(value: number): string {
  if (value === 0) return '۰ MB';
  if (value < 10_000) return '< ۰٫۰۱ MB';
  return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(value / 1_000_000)} MB`;
}

export function validateFish24UserReportPeriods(value: unknown): Fish24UserReportPeriodPreferences | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Partial<Fish24UserReportPeriodPreferences>;
  const keys: readonly Fish24ComparativeMetricId[] = ['employerRegistrations', 'employeeRegistrations', 'uploadedFiles', 'uploadedBytes'];
  if (!keys.every(key => VALID_PERIODS.has(candidate[key] as Fish24ReportPeriod))) return null;
  return {
    employerRegistrations: candidate.employerRegistrations!, employeeRegistrations: candidate.employeeRegistrations!,
    uploadedFiles: candidate.uploadedFiles!, uploadedBytes: candidate.uploadedBytes!
  };
}

@Component({
  selector: 'app-internal-user-reports',
  standalone: true,
  imports: [HighchartsChartDirective, IconComponent, NgTemplateOutlet],
  template: `
    <main class="mx-auto max-w-[95%] space-y-5 animate-fade-in-up" dir="rtl">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ui-icon name="bar-chart-2" [size]="25" /></span>
          <div><h1 class="text-2xl font-black text-foreground dark:text-slate-100 sm:text-3xl">گزارشات کاربران</h1><p class="mt-1 text-sm text-muted">نمای تحلیلی اولیه بر پایه داده‌های مشترک پیش‌نمایش فیش۲۴</p></div>
        </div>
        <span class="w-fit rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning">داده‌های نمایشی چرخان • تا {{ displayDate() }}</span>
      </header>

      <section aria-labelledby="users-report-heading" class="space-y-3">
        <div class="section-title"><ui-icon name="users" [size]="20" /><h2 id="users-report-heading">کاربران</h2></div>
        <div class="grid gap-4 xl:grid-cols-2">
          <ng-container [ngTemplateOutlet]="comparisonCard" [ngTemplateOutletContext]="{ id: 'employerRegistrations', title: 'کارفرمایان ثبت‌شده', icon: 'briefcase', metric: employerMetric(), chart: employerChartOptions(), volume: false }" />
          <ng-container [ngTemplateOutlet]="comparisonCard" [ngTemplateOutletContext]="{ id: 'employeeRegistrations', title: 'کارمندان ثبت‌شده', icon: 'users', metric: employeeMetric(), chart: employeeChartOptions(), volume: false }" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <article class="snapshot-card"><ui-icon name="briefcase" [size]="21" class="text-warning"/><div><p class="snapshot-value">{{ count(snapshot().inactiveEmployers) }}</p><p class="snapshot-label">کارفرمای غیرفعال فعلی</p></div></article>
          <article class="snapshot-card"><ui-icon name="users" [size]="21" class="text-warning"/><div><p class="snapshot-value">{{ count(snapshot().inactiveEmployees) }}</p><p class="snapshot-label">کارمند غیرفعال فعلی</p></div></article>
        </div>
      </section>

      <section aria-labelledby="uploads-report-heading" class="space-y-3">
        <div class="section-title"><ui-icon name="folder-open" [size]="20" /><h2 id="uploads-report-heading">فایل‌های بارگذاری‌شده</h2></div>
        <div class="grid gap-4 xl:grid-cols-2">
          <ng-container [ngTemplateOutlet]="comparisonCard" [ngTemplateOutletContext]="{ id: 'uploadedFiles', title: 'تعداد فایل‌های بارگذاری‌شده', icon: 'file-text', metric: uploadCountMetric(), chart: uploadCountChartOptions(), volume: false }" />
          <ng-container [ngTemplateOutlet]="comparisonCard" [ngTemplateOutletContext]="{ id: 'uploadedBytes', title: 'حجم فایل‌های بارگذاری‌شده', icon: 'cloud', metric: uploadBytesMetric(), chart: uploadBytesChartOptions(), volume: true }" />
        </div>
        @if (uploadOmittedCount() > 0) {
          <aside class="flex gap-2 rounded-xl border border-warning/25 bg-warning/10 p-3 text-xs leading-6 text-muted"><ui-icon name="info" [size]="17" class="mt-1 shrink-0 text-warning"/><p>{{ count(uploadOmittedCount()) }} رکورد تاریخی فاقد زمان بارگذاری و اندازه واقعی فایل است و بدون حدس‌زدن از آمار بارگذاری کنار گذاشته شده است.</p></aside>
        }
      </section>

      <section aria-labelledby="coverage-report-heading" class="space-y-3">
        <div class="section-title"><ui-icon name="target" [size]="20" /><h2 id="coverage-report-heading">پوشش اسناد</h2></div>
        <div class="grid grid-cols-2 gap-3">
          <article class="snapshot-card"><ui-icon name="check-circle" [size]="21" class="text-success"/><div><p class="snapshot-value">{{ count(snapshot().employersWithCompletedDistribution) }}</p><p class="snapshot-label">کارفرما با توزیع تکمیل‌شده</p></div></article>
          <article class="snapshot-card"><ui-icon name="inbox" [size]="21" class="text-primary"/><div><p class="snapshot-value">{{ count(snapshot().employeesWhoReceivedDocuments) }}</p><p class="snapshot-label">کارمند دریافت‌کننده سند</p></div></article>
        </div>
        <article class="report-card grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div>
            <h3 class="card-title">وضعیت دسترسی فعلی کارکنان به اسناد</h3>
            <p class="mt-1 text-xs leading-6 text-muted">جمع دو گروه برابر با کل افراد یکتای دارای نقش کارمند است.</p>
            <div highchartsChart [options]="coverageChart()" (chartInstance)="watchChart($event)" class="chart chart--coverage" aria-label="نمودار توزیع کارکنان دارای سند فعال و بدون سند فعال"></div>
          </div>
          <dl class="space-y-2.5">
            <div class="legend-row"><span class="legend-dot bg-primary"></span><dt>دارای حداقل یک سند فعال</dt><dd>{{ count(snapshot().employeesWithActiveDocuments) }}</dd></div>
            <div class="legend-row"><span class="legend-dot bg-slate-400"></span><dt>بدون سند فعال</dt><dd>{{ count(snapshot().employeesWithoutActiveDocuments) }}</dd></div>
            <div class="flex items-center justify-between border-t border-border pt-3 font-extrabold dark:border-slate-700"><dt>کل کارکنان یکتا</dt><dd>{{ count(snapshot().totalEmployees) }}</dd></div>
          </dl>
        </article>
      </section>

      <aside class="flex gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-6 text-muted dark:bg-primary/10"><ui-icon name="info" [size]="17" class="mt-1 shrink-0 text-primary"/><p>این داشبورد از داده‌های نمایشی چرخان و حافظه‌ای استفاده می‌کند؛ این داده‌ها سابقه واقعی یا آمار پایدار محیط تولید نیستند.</p></aside>

      <ng-template #comparisonCard let-id="id" let-title="title" let-icon="icon" let-metric="metric" let-chart="chart" let-volume="volume">
        <article class="report-card min-w-0">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex items-center gap-2"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon [name]="icon" [size]="19"/></span><h3 class="card-title">{{ title }}</h3></div>
            <div class="period-control" [attr.aria-label]="'انتخاب دوره ' + title">
              @for (period of reportPeriods; track period.id) { <button type="button" [class.period-active]="selectedPeriod(id) === period.id" (click)="setPeriod(id, period.id)">{{ period.label }}</button> }
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2" [class.grid-cols-1]="metric.previous === null">
            <div class="metric-value"><span>دوره جاری</span><strong>{{ volume ? bytes(metric.current) : count(metric.current) }}</strong><small>{{ metric.bounds.current.label }}</small></div>
            @if (metric.previous !== null) { <div class="metric-value metric-value--previous"><span>دوره قبل</span><strong>{{ volume ? bytes(metric.previous) : count(metric.previous) }}</strong><small>{{ metric.bounds.previous?.label }}</small></div> }
          </div>
          @if (hasComparisonData(metric)) {
            <div highchartsChart [options]="chart" (chartInstance)="watchChart($event)" class="chart" [attr.aria-label]="'نمودار مقایسه‌ای ' + title"></div>
          } @else {
            <div class="chart chart-empty" role="status"><ui-icon name="bar-chart-2" [size]="28"/><span>در این دوره داده‌ای برای نمایش ثبت نشده است.</span></div>
          }
        </article>
      </ng-template>
    </main>
  `,
  styles: [`
    .section-title{display:flex;align-items:center;gap:.5rem;color:rgb(var(--color-primary));font-weight:900;font-size:1.1rem}.report-card{border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));padding:1rem;box-shadow:0 1px 3px rgb(15 23 42/.06)}:host-context(.dark) .report-card{border-color:#334155;background:#1e293b}.card-title{font-size:.95rem;font-weight:900;color:rgb(var(--color-foreground))}:host-context(.dark) .card-title{color:#f1f5f9}.snapshot-card{display:flex;min-width:0;align-items:center;gap:.75rem;border:1px solid rgb(var(--color-border));border-radius:1rem;background:rgb(var(--color-surface));padding:.9rem}:host-context(.dark) .snapshot-card{border-color:#334155;background:#1e293b}.snapshot-value{font-size:1.55rem;line-height:1;font-weight:900;color:rgb(var(--color-foreground))}:host-context(.dark) .snapshot-value{color:#f8fafc}.snapshot-label{margin-top:.35rem;font-size:.72rem;font-weight:700;color:rgb(var(--color-muted));line-height:1.35rem}.period-control{display:flex;max-width:100%;overflow-x:auto;border:1px solid rgb(var(--color-border));border-radius:.65rem;padding:.15rem}:host-context(.dark) .period-control{border-color:#475569}.period-control button{min-width:2.45rem;border-radius:.5rem;padding:.35rem .5rem;font-size:.7rem;font-weight:800;color:rgb(var(--color-muted))}.period-control button.period-active{background:rgb(var(--color-primary));color:white}.metric-value{border-radius:.75rem;background:rgb(var(--color-primary)/.06);padding:.65rem}.metric-value span,.metric-value small{display:block;font-size:.65rem;color:rgb(var(--color-muted))}.metric-value strong{display:block;margin:.25rem 0;font-size:1.15rem;font-weight:900;color:rgb(var(--color-foreground));direction:ltr;text-align:right}:host-context(.dark) .metric-value strong{color:#f8fafc}.metric-value--previous{background:#94a3b81c}.chart{display:block;width:100%;height:220px;margin-top:.5rem}.chart--coverage{height:260px}.chart-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;border:1px dashed rgb(var(--color-border));border-radius:.75rem;color:rgb(var(--color-muted));font-size:.75rem;font-weight:700}:host-context(.dark) .chart-empty{border-color:#475569}.legend-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.5rem;border:1px solid rgb(var(--color-border));border-radius:.75rem;padding:.65rem;font-size:.75rem;color:rgb(var(--color-muted))}:host-context(.dark) .legend-row{border-color:#334155}.legend-row dd{font-size:1rem;font-weight:900;color:rgb(var(--color-foreground))}:host-context(.dark) .legend-row dd{color:#f8fafc}.legend-dot{width:.6rem;height:.6rem;border-radius:999px}@media(min-width:640px){.report-card{padding:1.25rem}.card-title{font-size:1rem}.snapshot-label{font-size:.82rem}.period-control button{font-size:.75rem}.chart{height:240px}}
  `]
})
export class InternalUserReportsComponent {
  private readonly reports = inject(Fish24UserReportsService);
  private readonly preferences = inject(InternalListPreferencesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly chartObservers = new Map<Highcharts.Chart, ResizeObserver>();
  readonly reportPeriods = FISH24_REPORT_PERIODS;
  readonly periods = signal(this.preferences.loadFilters(LIST_ID, FISH24_USER_REPORT_PERIOD_DEFAULTS, validateFish24UserReportPeriods));
  readonly employerMetric = computed(() => this.reports.comparative('employerRegistrations', this.periods().employerRegistrations));
  readonly employeeMetric = computed(() => this.reports.comparative('employeeRegistrations', this.periods().employeeRegistrations));
  readonly uploadCountMetric = computed(() => this.reports.comparative('uploadedFiles', this.periods().uploadedFiles));
  readonly uploadBytesMetric = computed(() => this.reports.comparative('uploadedBytes', this.periods().uploadedBytes));
  readonly employerChartOptions = computed(() => this.comparisonChart('کارفرمایان ثبت‌شده', this.employerMetric(), false));
  readonly employeeChartOptions = computed(() => this.comparisonChart('کارمندان ثبت‌شده', this.employeeMetric(), false));
  readonly uploadCountChartOptions = computed(() => this.comparisonChart('تعداد فایل‌های بارگذاری‌شده', this.uploadCountMetric(), false));
  readonly uploadBytesChartOptions = computed(() => this.comparisonChart('حجم فایل‌های بارگذاری‌شده', this.uploadBytesMetric(), true));
  readonly uploadOmittedCount = computed(() => Math.max(this.uploadCountMetric().omittedRecordCount, this.uploadBytesMetric().omittedRecordCount));
  readonly snapshot = computed(() => this.reports.snapshot());
  readonly displayDate = computed(() => this.reports.currentJalaliDate().replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]));
  readonly coverageChart = computed<Highcharts.Options>(() => {
    const data = this.snapshot();
    const hasPopulation = data.totalEmployees > 0;
    return {
      chart: { type: 'pie', backgroundColor: 'transparent', animation: false, spacing: [4, 4, 4, 4] },
      title: { text: hasPopulation ? this.count(data.totalEmployees) : 'بدون داده', verticalAlign: 'middle', y: 8, style: { fontFamily: 'Vazirmatn', fontWeight: '800', color: '#64748b' } },
      subtitle: { text: hasPopulation ? 'کارمند یکتا' : '', verticalAlign: 'middle', y: 29, style: { fontFamily: 'Vazirmatn', color: '#94a3b8' } },
      credits: { enabled: true }, legend: { enabled: false }, tooltip: { pointFormat: '<b>{point.y:,.0f}</b> کارمند' },
      accessibility: { enabled: true, description: 'تعداد کارکنان دارای حداقل یک سند فعال در برابر کارکنان بدون سند فعال.', point: { valueSuffix: ' کارمند' } },
      plotOptions: { pie: { innerSize: '68%', borderWidth: 0, dataLabels: { enabled: false }, states: { inactive: { opacity: 1 } } } },
      series: [{ type: 'pie', name: 'کارکنان', data: hasPopulation ? [
        { name: 'دارای سند فعال', y: data.employeesWithActiveDocuments, color: '#0f8fa8' },
        { name: 'بدون سند فعال', y: data.employeesWithoutActiveDocuments, color: '#94a3b8' }
      ] : [] }]
    };
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const observer of this.chartObservers.values()) observer.disconnect();
      this.chartObservers.clear();
    });
  }

  selectedPeriod(id: Fish24ComparativeMetricId): Fish24ReportPeriod { return this.periods()[id]; }
  setPeriod(id: Fish24ComparativeMetricId, period: Fish24ReportPeriod): void {
    const next = { ...this.periods(), [id]: period };
    this.periods.set(next);
    this.preferences.saveFilters(LIST_ID, next);
  }
  count(value: number): string { return new Intl.NumberFormat('fa-IR').format(value); }
  bytes(value: number): string {
    return formatMegabytes(value);
  }
  hasComparisonData(metric: Fish24ComparativeReportMetric): boolean {
    return metric.current > 0 || (metric.previous ?? 0) > 0;
  }
  watchChart(chart: Highcharts.Chart): void {
    if (this.chartObservers.has(chart) || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => chart.reflow());
    observer.observe(chart.container.parentElement ?? chart.container);
    this.chartObservers.set(chart, observer);
  }
  comparisonChart(title: string, metric: Fish24ComparativeReportMetric, volume: boolean): Highcharts.Options {
    const values = metric.previous === null
      ? [{ y: metric.current, color: '#0f8fa8' }]
      : [{ y: metric.previous, color: '#94a3b8' }, { y: metric.current, color: '#0f8fa8' }];
    const categories = metric.previous === null ? ['کل تا امروز'] : ['دوره قبل', 'دوره جاری'];
    return {
      chart: { type: 'column', backgroundColor: 'transparent', animation: false, spacing: [10, 2, 4, 2] },
      title: { text: undefined }, credits: { enabled: true }, legend: { enabled: false },
      xAxis: { categories, lineColor: '#cbd5e1', labels: { style: { fontFamily: 'Vazirmatn', color: '#64748b', fontSize: '11px' } } },
      yAxis: { min: 0, allowDecimals: volume, title: { text: volume ? 'مگابایت' : 'تعداد', style: { fontFamily: 'Vazirmatn', color: '#64748b' } }, labels: { formatter: function () { const numeric = Number(this.value); return volume ? formatMegabytes(numeric).replace(' MB', '') : numeric.toLocaleString('fa-IR'); }, style: { fontFamily: 'Vazirmatn', color: '#64748b' } } },
      tooltip: { formatter: function () { const numeric = this.y ?? 0; const rendered = volume ? `${(numeric / 1_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 2 })} MB<br/><b>${numeric.toLocaleString('fa-IR')} بایت</b>` : `<b>${numeric.toLocaleString('fa-IR')}</b>`; return `${this.key}<br/>${rendered}`; }, style: { fontFamily: 'Vazirmatn', direction: 'rtl' } },
      accessibility: { enabled: true, description: `مقایسه ${title} در دوره جاری و دوره قبل.`, point: { valueSuffix: volume ? ' بایت' : '' } },
      plotOptions: { column: { animation: false, borderRadius: 5, maxPointWidth: 54, dataLabels: { enabled: true, formatter: function () { const numeric = this.y ?? 0; if (numeric === 0) return undefined; return volume ? formatMegabytes(numeric) : numeric.toLocaleString('fa-IR'); }, style: { fontFamily: 'Vazirmatn', textOutline: 'none', color: '#64748b', fontSize: '10px' } } } },
      series: [{ type: 'column', name: title, data: values }]
    };
  }
}

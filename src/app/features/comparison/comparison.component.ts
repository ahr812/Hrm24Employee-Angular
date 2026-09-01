import { Component, inject, computed } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EmployeeDataService } from '../../core/data/employee-data.service';
import { OrganizationService } from '../../core/organization/organization.service';
import { ChartComponent } from '../../shared/ui/charts/chart.component';
import { ThemeService } from '../../shared/layout/theme.service';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [IconComponent, ChartComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="bar-chart-2" [size]="36" class="text-indigo-500"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">مقایسه شرکت‌ها</h1>
            <p class="text-lg text-muted">تحلیل عملکرد شما در {{ toFa(orgService.allOrgs.length) }} شرکت</p>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-surface rounded-2xl p-6 border border-border hover:shadow-lg transition-all duration-300 dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-muted">مجموع ساعات کاری</h3>
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ui-icon name="clock" [size]="20" class="text-primary"></ui-icon>
            </div>
          </div>
          <p class="text-3xl font-bold text-primary">{{ toFa(totalMonthlyHours()) }} <span class="text-sm font-normal text-muted">ساعت</span></p>
          <p class="text-xs text-muted mt-2">در تمام شرکت‌ها</p>
        </div>

        <div class="bg-surface rounded-2xl p-6 border border-border hover:shadow-lg transition-all duration-300 dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-muted">مجموع دریافتی</h3>
            <div class="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <ui-icon name="chart" [size]="20" class="text-success"></ui-icon>
            </div>
          </div>
          <p class="text-2xl font-bold text-success">{{ formatMoney(totalSalary()) }}</p>
          <p class="text-xs text-muted mt-2">تومان در ماه جاری</p>
        </div>

        <div class="bg-surface rounded-2xl p-6 border border-border hover:shadow-lg transition-all duration-300 dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-muted">میانگین نرخ حضور</h3>
            <div class="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
              <ui-icon name="check-circle" [size]="20" class="text-info"></ui-icon>
            </div>
          </div>
          <p class="text-3xl font-bold text-info">{{ toFa(averageAttendanceRate()) }} <span class="text-sm font-normal text-muted">٪</span></p>
          <p class="text-xs text-muted mt-2">در تمام شرکت‌ها</p>
        </div>
      </div>

      <!-- Company Comparison Table -->
      <div class="bg-surface rounded-2xl border border-border overflow-hidden">
        <div class="p-6 border-b border-border dark:border-slate-700">
          <h2 class="text-xl font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
            <ui-icon name="bar-chart-2" [size]="24" class="text-primary"></ui-icon>
            مقایسه تفصیلی شرکت‌ها
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-background dark:bg-slate-900">
              <tr>
                <th class="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">شرکت</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">ساعات ماه</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">میانگین روزانه</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">اضافه کاری</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">نرخ حضور</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">مانده مرخصی</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">آخرین حقوق</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">رشد حقوق</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border dark:divide-slate-700">
              @for (company of comparisonData(); track company.companyId; let i = $index) {
                <tr [class]="getRowClass(company)">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                      <div [style.backgroundColor]="getChartColor(i)" class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
                        {{ company.companyName.charAt(0) }}
                      </div>
                      <div>
                        <p class="font-bold text-foreground dark:text-slate-100">{{ company.companyName }}</p>
                        @if (company.companyId === activeOrg().id) {
                          <span class="text-xs text-primary font-medium">شرکت فعال</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-lg font-bold text-foreground dark:text-slate-200">{{ toFa(company.monthlyHours) }}</span>
                    <span class="text-xs text-muted"> ساعت</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-lg font-bold text-foreground dark:text-slate-200">{{ toFa(company.avgDailyHours) }}</span>
                    <span class="text-xs text-muted"> ساعت</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-lg font-bold text-warning">{{ toFa(company.overtimeHours) }}</span>
                    <span class="text-xs text-muted"> ساعت</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <div class="w-16 h-2 bg-background rounded-full overflow-hidden dark:bg-slate-900">
                        <div 
                          class="h-full rounded-full transition-all duration-500"
                          [class]="getProgressClass(company.attendanceRate)"
                          [style.width.%]="company.attendanceRate">
                        </div>
                      </div>
                      <span class="text-sm font-bold text-foreground dark:text-slate-200">{{ toFa(company.attendanceRate) }}٪</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-lg font-bold text-info">{{ toFa(company.leaveRemaining) }}</span>
                    <span class="text-xs text-muted"> روز</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-lg font-bold text-success">{{ formatMoney(company.lastSalary) }}</span>
                    <span class="text-xs text-muted"> تومان</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-1" [class]="company.salaryGrowth >= 0 ? 'text-success' : 'text-danger'">
                      <ui-icon [name]="company.salaryGrowth >= 0 ? 'trending-up' : 'trending-down'" [size]="16"></ui-icon>
                      <span class="text-lg font-bold">{{ toFa(company.salaryGrowth) }}٪</span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Performance Radar Chart -->
        <div class="bg-surface rounded-2xl p-6 border border-border dark:bg-slate-800 dark:border-slate-700">
          <h2 class="text-lg font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
            <ui-icon name="activity" [size]="20" class="text-primary"></ui-icon>
            مقایسه عملکرد کلی
          </h2>
          <div class="h-96">
            <app-chart 
              [type]="'radar'" 
              [data]="radarChartData()" 
              [options]="radarChartOptions()">
            </app-chart>
          </div>
        </div>

        <!-- Salary Trend Chart -->
        <div class="bg-surface rounded-2xl p-6 border border-border dark:bg-slate-800 dark:border-slate-700">
          <h2 class="text-lg font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
            <ui-icon name="trending-up" [size]="20" class="text-success"></ui-icon>
            روند حقوق در شرکت‌ها
          </h2>
          <div class="h-96">
            <app-chart 
              [type]="'line'" 
              [data]="salaryTrendChartData()" 
              [options]="lineChartOptions()">
            </app-chart>
          </div>
        </div>

      </div>

      <!-- Hours Comparison Bar Chart -->
      <div class="bg-surface rounded-2xl p-6 border border-border dark:bg-slate-800 dark:border-slate-700">
        <h2 class="text-lg font-bold text-foreground mb-4 dark:text-slate-100 flex items-center gap-2">
          <ui-icon name="clock" [size]="20" class="text-info"></ui-icon>
          مقایسه ساعات کاری
        </h2>
        <div class="h-80">
          <app-chart 
            [type]="'bar'" 
            [data]="hoursChartData()" 
            [options]="barChartOptions()">
          </app-chart>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
  `]
})
export class ComparisonComponent {
  private dataService = inject(EmployeeDataService);
  protected orgService = inject(OrganizationService);
  private themeService = inject(ThemeService);

  /**
   * پالت رنگی ثابت — هر شرکت بر اساس ایندکس خود رنگ متمایز دریافت می‌کند
   * این رنگ‌ها مستقیماً به Chart.js داده می‌شوند و هیچ وابستگی به logoColor سرویس ندارند
   */
  private readonly COLORS = [
    '#6366f1', // Indigo
    '#10b981', // Emerald  
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ef4444', // Red
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#06b6d4'  // Cyan
  ];

  activeOrg = this.orgService.activeOrg;
  comparisonData = this.dataService.companyComparison;

  totalMonthlyHours = computed(() => {
    return this.comparisonData().reduce((sum, c) => sum + c.monthlyHours, 0);
  });

  totalSalary = computed(() => {
    return this.comparisonData().reduce((sum, c) => sum + c.lastSalary, 0);
  });

  averageAttendanceRate = computed(() => {
    const data = this.comparisonData();
    if (data.length === 0) return 0;
    const total = data.reduce((sum, c) => sum + c.attendanceRate, 0);
    return Math.round(total / data.length);
  });

  /** دریافت رنگ بر اساس ایندکس — مستقل از داده‌های سرویس */
  getChartColor(index: number): string {
    return this.COLORS[index % this.COLORS.length];
  }

  radarChartData = computed(() => {
    const metrics = this.dataService.performanceMetrics();
    return {
      labels: metrics.labels,
      datasets: metrics.datasets.map((ds, index) => {
        const color = this.getChartColor(index);
        return {
          label: ds.company,
          data: ds.data,
          backgroundColor: color + '33',
          borderColor: color,
          borderWidth: 2,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: color
        };
      })
    };
  });

  radarChartOptions = computed(() => {
    const isDark = this.themeService.isDark();
    const self = this;
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: isDark ? '#e2e8f0' : '#1e293b',
            font: { family: 'Vazirmatn, sans-serif', size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => ctx.dataset.label + ': ' + self.toFa(ctx.parsed.r)
          }
        }
      },
      scales: {
        r: {
          angleLines: { color: isDark ? '#475569' : '#e2e8f0' },
          grid: { color: isDark ? '#475569' : '#e2e8f0' },
          pointLabels: {
            color: isDark ? '#94a3b8' : '#64748b',
            font: { family: 'Vazirmatn, sans-serif', size: 11 }
          },
          ticks: {
            color: isDark ? '#94a3b8' : '#64748b',
            backdropColor: 'transparent',
            callback: (v: any) => self.toFa(v)
          }
        }
      }
    };
  });

  salaryTrendChartData = computed(() => {
    const trend = this.dataService.salaryTrendComparison();
    return {
      labels: trend.labels,
      datasets: trend.datasets.map((ds, index) => {
        const color = this.getChartColor(index);
        return {
          label: ds.company,
          data: ds.data,
          borderColor: color,
          backgroundColor: color + '1a',
          tension: 0.4,
          fill: true
        };
      })
    };
  });

  lineChartOptions = computed(() => {
    const isDark = this.themeService.isDark();
    const self = this;
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: isDark ? '#e2e8f0' : '#1e293b',
            font: { family: 'Vazirmatn, sans-serif', size: 12 }
          }
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          callbacks: {
            label: (ctx: any) => ctx.dataset.label + ': ' + self.formatMoney(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: {
          ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Vazirmatn, sans-serif' } },
          grid: { color: isDark ? '#334155' : '#e2e8f0' }
        },
        y: {
          ticks: {
            color: isDark ? '#94a3b8' : '#64748b',
            font: { family: 'Vazirmatn, sans-serif' },
            callback: (v: any) => self.formatMoney(v)
          },
          grid: { color: isDark ? '#334155' : '#e2e8f0' }
        }
      }
    };
  });

  /**
   * نمودار مقایسه ساعات کاری
   * راه‌حل قطعی: هر بار یک آرایه رنگ جدید بر اساس ایندکس تولید می‌شود
   * هیچ وابستگی به logoColor سرویس وجود ندارد
   */
  hoursChartData = computed(() => {
    const data = this.comparisonData();
    const bgColors = data.map((_, i) => this.getChartColor(i));
    const borderColors = data.map((_, i) => this.getChartColor(i));

    return {
      labels: data.map(c => c.companyName),
      datasets: [
        {
          label: 'ساعات ماهانه',
          data: data.map(c => c.monthlyHours),
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 8
        }
      ]
    };
  });

  barChartOptions = computed(() => {
    const isDark = this.themeService.isDark();
    const self = this;
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => 'ساعات: ' + self.toFa(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: {
          ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Vazirmatn, sans-serif' } },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: isDark ? '#94a3b8' : '#64748b',
            font: { family: 'Vazirmatn, sans-serif' },
            callback: (v: any) => self.toFa(v)
          },
          grid: { color: isDark ? '#334155' : '#e2e8f0' }
        }
      }
    };
  });

  getRowClass(company: any): string {
    const base = 'hover:bg-background/50 dark:hover:bg-slate-900/50 transition-colors';
    const active = company.companyId === this.activeOrg().id ? 'bg-primary/5' : '';
    return `${base} ${active}`.trim();
  }

  getProgressClass(rate: number): string {
    if (rate >= 90) return 'bg-success';
    if (rate >= 70) return 'bg-warning';
    return 'bg-danger';
  }

  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }

  formatMoney(amount: number): string {
    const formatted = new Intl.NumberFormat('en-US').format(amount);
    return this.toFa(formatted).replace(/,/g, '٬');
  }
}
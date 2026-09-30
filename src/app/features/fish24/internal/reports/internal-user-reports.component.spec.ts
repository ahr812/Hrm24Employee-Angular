import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHighcharts } from 'highcharts-angular';
import { FISH24_USER_REPORT_PERIOD_DEFAULTS, InternalUserReportsComponent, validateFish24UserReportPeriods } from './internal-user-reports.component';

describe('InternalUserReports period preferences', () => {
  it('restores four independent valid period values', () => {
    expect(validateFish24UserReportPeriods({ employerRegistrations: 'day', employeeRegistrations: 'week', uploadedFiles: 'year', uploadedBytes: 'all' })).toEqual({ employerRegistrations: 'day', employeeRegistrations: 'week', uploadedFiles: 'year', uploadedBytes: 'all' });
  });

  it('rejects malformed or obsolete preferences', () => {
    expect(validateFish24UserReportPeriods({ ...FISH24_USER_REPORT_PERIOD_DEFAULTS, uploadedBytes: 'quarter' })).toBeNull();
    expect(validateFish24UserReportPeriods(null)).toBeNull();
  });
});

describe('InternalUserReports chart rendering', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [InternalUserReportsComponent],
      providers: [
        provideRouter([]),
        provideHighcharts({ instance: () => import('highcharts/esm/highcharts').then(module => module.default) })
      ]
    });
  });

  it('keeps chart options stable between change-detection passes and only replaces them when their metric changes', () => {
    const fixture = TestBed.createComponent(InternalUserReportsComponent);
    const component = fixture.componentInstance;
    const employerOptions = component.employerChartOptions();
    expect(component.employerChartOptions()).toBe(employerOptions);
    fixture.detectChanges();
    expect(component.employerChartOptions()).toBe(employerOptions);

    component.setPeriod('employerRegistrations', 'day');
    expect(component.employerChartOptions()).not.toBe(employerOptions);
    expect(component.selectedPeriod('employerRegistrations')).toBe('day');
    expect(component.selectedPeriod('employeeRegistrations')).toBe('month');
  });

  it('builds numeric, visually distinct current and previous columns', () => {
    const component = TestBed.createComponent(InternalUserReportsComponent).componentInstance;
    const options = component.employerChartOptions();
    const data = (options.series?.[0] as unknown as { readonly data: readonly { readonly y: number; readonly color: string }[] }).data;
    expect(data.length).toBe(2);
    expect(data.every(point => typeof point.y === 'number' && point.y > 0)).toBeTrue();
    expect(data[0].color).toBe('#94a3b8');
    expect(data[1].color).toBe('#0f8fa8');
  });

  it('uses naturally measured RTL HTML tooltips for comparison and coverage charts', () => {
    const component = TestBed.createComponent(InternalUserReportsComponent).componentInstance;
    const comparisonTooltip = component.employerChartOptions().tooltip!;
    const coverageTooltip = component.coverageChart().tooltip!;
    expect(comparisonTooltip.useHTML).toBeTrue();
    expect(coverageTooltip.useHTML).toBeTrue();
    expect((comparisonTooltip.style as Record<string, unknown>)['whiteSpace']).toBe('nowrap');
    expect((coverageTooltip.style as Record<string, unknown>)['direction']).toBe('rtl');

    const comparisonMarkup = (comparisonTooltip.formatter as Function).call({ key: 'دوره قبل', y: 123456 }, comparisonTooltip) as string;
    const coverageMarkup = (coverageTooltip.formatter as Function).call({ key: 'دارای سند فعال', y: 12 }, coverageTooltip) as string;
    expect(comparisonMarkup).toContain('<div dir="rtl"');
    expect(comparisonMarkup).toContain('display:inline-grid');
    expect(comparisonMarkup).not.toContain('<br');
    expect(coverageMarkup).toContain('دارای سند فعال');
    expect(coverageMarkup).toContain('۱۲');
  });

  it('renders positive-height SVG marks in all four monthly comparison charts', async () => {
    const fixture = TestBed.createComponent(InternalUserReportsComponent);
    fixture.nativeElement.style.display = 'block';
    fixture.nativeElement.style.width = '1200px';
    fixture.detectChanges();
    await fixture.whenStable();
    let hosts: HTMLElement[] = [];
    for (let attempt = 0; attempt < 50; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 20));
      fixture.detectChanges();
      hosts = Array.from(fixture.nativeElement.querySelectorAll('.report-card .chart:not(.chart--coverage)')) as HTMLElement[];
      if (hosts.length === 4 && hosts.every(host => host.querySelector('.highcharts-point'))) break;
    }
    expect(hosts.length).toBe(4);
    for (const host of hosts) {
      const marks = Array.from(host.querySelectorAll<SVGGraphicsElement>('.highcharts-point'));
      expect(marks.length).toBeGreaterThan(0);
      expect(marks.some(mark => mark.getBBox().height > 1 && getComputedStyle(mark).opacity !== '0')).toBeTrue();
    }
  });
});

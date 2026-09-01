import { Component, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EmployeeDataService } from '../../core/data/employee-data.service';
import { OrganizationService } from '../../core/organization/organization.service';

interface PayslipItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'salary' | 'advance' | 'midterm' | 'settlement';
  year: string;
  monthKey: string;
  publishedAt: string;
  baseSalary: number;
  netPay: number;
}

@Component({
  selector: 'app-payslip',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="wallet" [size]="36" class="text-green-500"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">فیش‌های من</h1>
            <p class="text-lg text-muted">مشاهده و دانلود فیش‌ها</p>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center"><ui-icon name="calculator" [size]="24" class="text-info"></ui-icon></div>
          <div><p class="text-xs text-muted">جمع کل خالص دریافتی سال جاری</p><p class="text-xl font-extrabold text-info">{{ toPersianNum(latestNetPay()) }} <span class="text-xs font-normal">تومان</span></p></div>
        </div>

        <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center"><ui-icon name="square-sigma" [size]="24" class="text-info"></ui-icon></div>
          <div><p class="text-xs text-muted">حقوق پایه ماه جاری</p><p class="text-xl font-extrabold text-info">{{ toPersianNum(latestBaseSalary()) }} <span class="text-xs font-normal">تومان</span></p></div>
        </div>

        <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><ui-icon name="calendar" [size]="24" class="text-primary"></ui-icon></div>
          <div><p class="text-xs text-muted">مانده مرخصی استحقاقی</p><p class="text-xl font-extrabold text-primary">{{ toPersianNum(leaveData().remaining) }} <span class="text-xs font-normal">روز</span></p></div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-surface rounded-2xl border border-border p-3 dark:bg-slate-800 dark:border-slate-700">
        <div class="flex flex-col md:grid md:grid-cols-3 gap-3">
          <select [(ngModel)]="filterType" class="px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 text-sm">
            <option value="all">همه انواع</option>
            <option value="salary">فیش حقوق</option>
            <option value="advance">فیش مساعده</option>
            <option value="midterm">فیش میان‌دوره</option>
            <option value="settlement">فیش تسویه حساب</option>
          </select>
          <select [(ngModel)]="filterYear" class="px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 text-sm">
            <option value="">همه سال‌ها</option>
            <option value="1403">۱۴۰۳</option>
          </select>
          <select [(ngModel)]="filterMonth" class="px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 text-sm">
            <option value="">همه ماه‌ها</option>
            <option value="aban">آبان</option>
          </select>
        </div>
      </div>

      <!-- List -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        @for (item of filteredItems(); track item.id) {
          <article class="relative bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700">
            <div class="absolute top-0 right-0 w-1.5 h-full" [style.backgroundColor]="getTypeColor(item.type)"></div>
            <div class="px-5 py-3 flex flex-col gap-2">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-extrabold text-foreground dark:text-slate-100">{{ item.title }}</h3>
                  <p class="text-xs text-muted mt-0.5">{{ item.subtitle }}</p>
                </div>
                <span [class]="getTypeBadgeClass(item.type)" class="px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap">{{ getTypeLabel(item.type) }}</span>
              </div>
              <hr class="border-border/50 dark:border-slate-700/50">
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted">صدور: {{ toFa(item.publishedAt) }}</span>
                <button (click)="viewPayslip(item.id)" class="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all text-xs font-bold flex items-center gap-1.5">
                  <ui-icon name="eye" [size]="14"></ui-icon> مشاهده و دانلود
                </button>
              </div>
            </div>
          </article>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
  `]
})
export class PayslipComponent {
  private router = inject(Router);
  private dataService = inject(EmployeeDataService);
  private orgService = inject(OrganizationService);

  activeOrg = this.orgService.activeOrg;
  payslips = this.dataService.payslipData;
  leaveData = this.dataService.leaveData;
  jobProfile = this.dataService.jobProfile;

  filterType = signal<string>('all');
  filterYear = signal<string>('');
  filterMonth = signal<string>('');

  allItems = computed((): PayslipItem[] => {
    const orgId = this.activeOrg().id;
    const rawPayslips = this.payslips();
    let items: PayslipItem[] = rawPayslips.map((p, index) => ({
      id: `salary-${index}`, title: p.month, subtitle: 'پرداخت ماهانه حقوق و مزایا', type: 'salary' as const,
      year: p.month.split(' ')[1] || '1403', monthKey: this.getMonthKey(p.month),
      publishedAt: '1403/' + (index + 1).toString().padStart(2, '0') + '/01', baseSalary: p.baseSalary, netPay: p.netPay
    }));
    if (orgId === 'org1') {
      items.push({ id: 'adv-1', title: 'مساعده آبان ۱۴۰۳', subtitle: 'پرداخت مساعده حقوق', type: 'advance', year: '1403', monthKey: 'aban', publishedAt: '1403/08/15', baseSalary: 0, netPay: 5000000 });
      items.push({ id: 'mid-1', title: 'میان‌دوره مهر ۱۴۰۳', subtitle: 'پرداخت میان‌دوره حقوق', type: 'midterm', year: '1403', monthKey: 'mehr', publishedAt: '1403/07/20', baseSalary: 0, netPay: 6500000 });
      items.push({ id: 'set-1', title: 'عیدی و پاداش ۱۴۰۳', subtitle: 'پایان سال', type: 'settlement', year: '1403', monthKey: 'esfand', publishedAt: '1403/12/25', baseSalary: 0, netPay: 24000000 });
    }
    return items.sort((a, b) => b.year.localeCompare(a.year));
  });

  filteredItems = computed(() => {
    let result = this.allItems();
    if (this.filterType() !== 'all') result = result.filter(i => i.type === this.filterType());
    if (this.filterYear()) result = result.filter(i => i.year === this.filterYear());
    if (this.filterMonth()) result = result.filter(i => i.monthKey === this.filterMonth());
    return result;
  });

  latestNetPay = computed(() => this.payslips()[0]?.netPay || 0);
  latestBaseSalary = computed(() => this.payslips()[0]?.baseSalary || 0);

  viewPayslip(id: string): void {
    this.router.navigate(['/payslip', id]);
  }

  toPersianNum(num: number | string): string {
    const n = Number(num);
    if (isNaN(n)) return num.toString();
    return n.toLocaleString('fa-IR');
  }

  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }

  private getMonthKey(monthStr: string): string {
    const map: Record<string, string> = { 'فروردین': 'farvardin', 'اردیبهشت': 'ordibehesht', 'آبان': 'aban', 'مهر': 'mehr', 'اسفند': 'esfand' };
    for (const key in map) if (monthStr.includes(key)) return map[key];
    return '';
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = { 'salary': 'فیش حقوق', 'advance': 'فیش مساعده', 'midterm': 'فیش میان‌دوره', 'settlement': 'تسویه حساب' };
    return map[type] || type;
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = { 'salary': '#696cff', 'advance': '#ef4444', 'midterm': '#10b981', 'settlement': '#f59e0b' };
    return map[type] || '#94a3b8';
  }

  getTypeBadgeClass(type: string): string {
    const map: Record<string, string> = {
      'salary': 'bg-[#696cff]/10 text-[#696cff]',
      'advance': 'bg-red-500/10 text-red-500',
      'midterm': 'bg-emerald-500/10 text-emerald-500',
      'settlement': 'bg-amber-500/10 text-amber-500'
    };
    return map[type] || 'bg-slate-500/10 text-slate-500';
  }
}
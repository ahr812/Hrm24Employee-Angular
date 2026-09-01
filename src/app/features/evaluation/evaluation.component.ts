import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EmployeeDataService, MyEvaluation, EvaluationCycle, EvaluationDimension } from '../../core/data/employee-data.service';
import { AuthService } from '../../core/auth/auth.service';
import { IranLocalizationService } from '../../core/localization/iran-localization.service';
import { FullAIAnalysis } from '../../core/ai/ai-analysis.service';

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-6 animate-fade-in-up">

      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
            <ui-icon name="target" [size]="28" class="text-primary"></ui-icon>
            سامانه ارزیابی عملکرد
          </h1>
          <p class="text-muted text-sm mt-1">چرخه‌های ارزیابی، خودارزیابی و بازخورد ۳۶۰ درجه</p>
        </div>
        <div class="flex items-center gap-3">
          <a 
            routerLink="/evaluation/analytics"
            class="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <ui-icon name="bar-chart-2" [size]="16"></ui-icon>
            تحلیل عملکرد با هوش مصنوعی
          </a>
          <!-- <div class="flex items-center gap-2 px-4 py-2 bg-surface dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 shadow-sm">
            <ui-icon name="user" [size]="18" class="text-primary"></ui-icon>
            <span class="text-sm font-bold text-foreground">{{ currentUser()?.fullName }}</span>
            <span class="text-xs text-muted px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">{{ currentUser()?.role }}</span>
          </div> -->
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-surface dark:bg-slate-800 rounded-2xl p-5 border border-border dark:border-slate-700 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ui-icon name="clipboard-check" [size]="20"></ui-icon>
            </div>
            <span class="text-xs font-bold text-muted">چرخه فعال</span>
          </div>
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ loc.toPersianNum(activeCycleCount()) }}</p>
          <p class="text-xs text-muted mt-1">ارزیابی در حال انجام</p>
        </div>

        <div class="bg-surface dark:bg-slate-800 rounded-2xl p-5 border border-border dark:border-slate-700 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ui-icon name="clock" [size]="20"></ui-icon>
            </div>
            <span class="text-xs font-bold text-muted">در انتظار</span>
          </div>
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ loc.toPersianNum(pendingEvaluations().length) }}</p>
          <p class="text-xs text-muted mt-1">ارزیابی دیگران</p>
        </div>

        <div class="bg-surface dark:bg-slate-800 rounded-2xl p-5 border border-border dark:border-slate-700 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ui-icon name="award" [size]="20"></ui-icon>
            </div>
            <span class="text-xs font-bold text-muted">آخرین امتیاز</span>
          </div>
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">
            {{ latestCompletedScore() > 0 ? loc.toPersianNum(latestCompletedScore()) : '-' }}
          </p>
          <p class="text-xs text-muted mt-1">از ۱۰۰ امتیاز</p>
        </div>

        <div class="bg-surface dark:bg-slate-800 rounded-2xl p-5 border border-border dark:border-slate-700 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ui-icon name="history" [size]="20"></ui-icon>
            </div>
            <span class="text-xs font-bold text-muted">سابقه</span>
          </div>
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ loc.toPersianNum(completedCount()) }}</p>
          <p class="text-xs text-muted mt-1">ارزیابی تکمیل شده</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Left Column -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Active Self-Evaluation -->
          @if (activeSelfEvaluation(); as eval) {
            <div class="bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-slate-800 rounded-2xl border border-primary/20 dark:border-primary/30 p-6">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                    <ui-icon name="edit" [size]="20"></ui-icon>
                  </div>
                  <div>
                    <h3 class="font-bold text-foreground dark:text-slate-100">خودارزیابی فعال</h3>
                    <p class="text-xs text-muted">{{ eval.cycleTitle }}</p>
                  </div>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse">
                  در انتظار تکمیل
                </span>
              </div>

              <div class="space-y-2 mb-4">
                @for (dim of eval.dimensions; track dim.name) {
                  <div class="flex items-center justify-between bg-surface dark:bg-slate-800 rounded-lg px-3 py-2 border border-border dark:border-slate-700">
                    <span class="text-sm text-foreground dark:text-slate-200">{{ dim.name }}</span>
                    <span class="text-xs text-muted">وزن: {{ loc.toPersianNum(dim.weight) }}٪</span>
                  </div>
                }
              </div>

              <div class="flex gap-3">
                <button 
                  (click)="openSelfEvaluationForm()"
                  class="flex-1 px-4 py-2.5 bg-surface border border-border dark:border-slate-700 text-foreground dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <ui-icon name="eye" [size]="16"></ui-icon>
                  مشاهده فرم
                </button>
                <button 
                  (click)="openSelfEvaluationForm()"
                  class="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <ui-icon name="edit" [size]="16"></ui-icon>
                  شروع خودارزیابی
                </button>
              </div>
            </div>
          }

          <!-- Evaluation History with Radar Chart -->
          <div class="bg-surface dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden">
            <div class="p-5 border-b border-border dark:border-slate-700">
              <h3 class="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                <ui-icon name="history" [size]="18" class="text-primary"></ui-icon>
                تاریخچه ارزیابی‌ها
              </h3>
            </div>
            <div class="divide-y divide-border dark:divide-slate-700">
              @for (eval of completedEvaluations(); track eval.cycleId) {
                <div class="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div class="flex flex-col md:flex-row gap-5">
                    
                    <!-- Radar Chart SVG -->
                    <div class="flex-shrink-0 flex items-center justify-center">
                      <svg viewBox="0 0 300 300" class="w-48 h-48 md:w-56 md:h-56">
                        <circle cx="150" cy="150" r="120" fill="none" stroke="#e2e8f0" stroke-width="0.5" class="dark:stroke-slate-600"></circle>
                        <circle cx="150" cy="150" r="90" fill="none" stroke="#e2e8f0" stroke-width="0.5" class="dark:stroke-slate-600"></circle>
                        <circle cx="150" cy="150" r="60" fill="none" stroke="#e2e8f0" stroke-width="0.5" class="dark:stroke-slate-600"></circle>
                        <circle cx="150" cy="150" r="30" fill="none" stroke="#e2e8f0" stroke-width="0.5" class="dark:stroke-slate-600"></circle>

                        @for (dim of eval.dimensions; track dim.name; let i = $index) {
                          <line 
                            x1="150" y1="150"
                            [attr.x2]="getAxisEndPoint(i, eval.dimensions.length, 120).x"
                            [attr.y2]="getAxisEndPoint(i, eval.dimensions.length, 120).y"
                            stroke="#cbd5e1" stroke-width="0.5" class="dark:stroke-slate-600"
                          ></line>
                        }

                        <polygon 
                          [attr.points]="getRadarPoints(eval.dimensions)"
                          fill="rgba(59, 130, 246, 0.2)" 
                          stroke="#3b82f6" 
                          stroke-width="2"
                        ></polygon>

                        @for (dim of eval.dimensions; track dim.name; let i = $index) {
                          <circle 
                            [attr.cx]="getDataPoint(i, eval.dimensions, dim.score).x"
                            [attr.cy]="getDataPoint(i, eval.dimensions, dim.score).y"
                            r="4" fill="#3b82f6" stroke="white" stroke-width="2"
                          ></circle>
                        }

                        @for (dim of eval.dimensions; track dim.name; let i = $index) {
                          <text 
                            [attr.x]="getLabelPoint(i, eval.dimensions.length).x"
                            [attr.y]="getLabelPoint(i, eval.dimensions.length).y"
                            text-anchor="middle" 
                            dominant-baseline="middle"
                            class="fill-slate-600 dark:fill-slate-300"
                            style="font-size: 9px; font-weight: bold;"
                          >{{ dim.name }}</text>
                        }
                      </svg>
                    </div>

                    <!-- Details -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-3">
                        <div>
                          <h4 class="font-bold text-foreground dark:text-slate-200">{{ eval.cycleTitle }}</h4>
                          <p class="text-xs text-muted mt-0.5">تکمیل شده در {{ eval.completedAt ? loc.formatShamsiDate(eval.completedAt) : '-' }}</p>
                        </div>
                        <div class="text-left">
                          <p class="text-2xl font-extrabold text-primary dir-ltr">{{ loc.toPersianNum(eval.overallScore) }}</p>
                          <p class="text-[10px] text-muted">امتیاز کل</p>
                        </div>
                      </div>

                      <div class="grid grid-cols-3 gap-2 mb-3">
                        <div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 text-center">
                          <p class="text-[10px] text-muted">خودارزیابی</p>
                          <p class="font-bold text-sm text-foreground dark:text-slate-200 dir-ltr">{{ loc.toPersianNum(eval.selfScore) }}</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 text-center">
                          <p class="text-[10px] text-muted">مدیر مستقیم</p>
                          <p class="font-bold text-sm text-foreground dark:text-slate-200 dir-ltr">{{ loc.toPersianNum(eval.managerScore) }}</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 text-center">
                          <p class="text-[10px] text-muted">همکاران</p>
                          <p class="font-bold text-sm text-foreground dark:text-slate-200 dir-ltr">{{ loc.toPersianNum(eval.peerScore) }}</p>
                        </div>
                      </div>

                      <div class="space-y-1.5">
                        @for (dim of eval.dimensions; track dim.name) {
                          <div class="flex items-center gap-2">
                            <span class="text-[10px] text-muted w-24 flex-shrink-0 truncate">{{ dim.name }}</span>
                            <div class="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div class="h-full rounded-full transition-all duration-500"
                                [style.width.%]="dim.score"
                                [class]="getDimColorClass(dim.score)">
                              </div>
                            </div>
                            <span class="text-[10px] font-bold text-muted w-6 text-left dir-ltr">{{ loc.toPersianNum(dim.score) }}</span>
                          </div>
                        }
                      </div>

                      <!-- AI Mini Summary for latest completed evaluation -->
                      @if ($first && aiAnalysis()) {
                        <div class="mt-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800/50">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="text-sm">🤖</span>
                            <span class="text-[10px] font-bold text-indigo-700 dark:text-indigo-400">خلاصه هوشمند AI</span>
                          </div>
                          <p class="text-[10px] text-foreground dark:text-slate-300 leading-relaxed line-clamp-2">
                            {{ aiAnalysis()!.summary.overallAssessment }}
                          </p>
                          <a 
                            routerLink="/evaluation/analytics"
                            class="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-primary hover:text-primary-hover transition-colors"
                          >
                            مشاهده تحلیل کامل
                            <ui-icon name="chevron-left" [size]="12"></ui-icon>
                          </a>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="p-8 text-center">
                  <ui-icon name="inbox" [size]="32" class="text-muted mx-auto mb-2 opacity-50"></ui-icon>
                  <p class="text-sm text-muted">هنوز ارزیابی تکمیل شده‌ای ثبت نشده است.</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="space-y-6">

          <!-- Pending Evaluations -->
          <div class="bg-surface dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden">
            <div class="p-5 border-b border-border dark:border-slate-700 flex items-center justify-between">
              <h3 class="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                <ui-icon name="users" [size]="18" class="text-amber-500"></ui-icon>
                ارزیابی‌های در انتظار
              </h3>
              @if (pendingEvaluations().length > 0) {
                <span class="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                  {{ loc.toPersianNum(pendingEvaluations().length) }}
                </span>
              }
            </div>
            <div class="divide-y divide-border dark:divide-slate-700">
              @for (pending of pendingEvaluations(); track pending.id) {
                <div 
                  (click)="openPendingEvaluation(pending)"
                  class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-sm text-foreground dark:text-slate-200 group-hover:text-primary transition-colors">
                      {{ pending.employeeName }}
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold" [class]="getPendingTypeClass(pending.type)">
                      {{ pending.type === 'manager' ? 'ارزیابی مدیر' : 'ارزیابی همکار' }}
                    </span>
                  </div>
                  <p class="text-xs text-muted mb-2">{{ pending.role }}</p>
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-muted">{{ pending.cycleTitle }}</span>
                    <span class="text-[10px] font-bold text-red-500 flex items-center gap-1">
                      <ui-icon name="clock" [size]="12"></ui-icon>
                      {{ loc.daysUntilText(pending.deadline) }}
                    </span>
                  </div>
                  <button 
                    (click)="openPendingEvaluation(pending); $event.stopPropagation()"
                    class="mt-3 w-full px-3 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <ui-icon name="edit" [size]="14"></ui-icon>
                    شروع ارزیابی
                  </button>
                </div>
              } @empty {
                <div class="p-6 text-center">
                  <ui-icon name="check-circle" [size]="28" class="text-emerald-500 mx-auto mb-2"></ui-icon>
                  <p class="text-sm font-bold text-foreground dark:text-slate-200">همه ارزیابی‌ها تکمیل شده!</p>
                  <p class="text-xs text-muted mt-1">در حال حاضر ارزیابی در انتظاری ندارید.</p>
                </div>
              }
            </div>
          </div>

          <!-- Evaluation Cycles Timeline -->
          <div class="bg-surface dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden">
            <div class="p-5 border-b border-border dark:border-slate-700">
              <h3 class="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                <ui-icon name="calendar" [size]="18" class="text-primary"></ui-icon>
                چرخه‌های ارزیابی
              </h3>
            </div>
            <div class="p-5 space-y-4">
              @for (cycle of evaluationCycles(); track cycle.id) {
                <div class="relative pr-6">
                  @if (!$last) {
                    <div class="absolute right-[7px] top-6 bottom-[-16px] w-0.5 bg-border dark:bg-slate-700"></div>
                  }
                  <div class="absolute right-0 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800"
                       [class]="getCycleDotClass(cycle.status)"></div>
                  <div>
                    <h4 class="font-bold text-sm text-foreground dark:text-slate-200">{{ cycle.title }}</h4>
                    <p class="text-xs text-muted mt-0.5">{{ loc.formatShamsiDate(cycle.startDate) }} تا {{ loc.formatShamsiDate(cycle.endDate) }}</p>
                    <span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold" [class]="getCycleStatusClass(cycle.status)">
                      {{ cycle.status === 'completed' ? 'تکمیل شده' : cycle.status === 'active' ? 'فعال' : 'آینده' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .dir-ltr { direction: ltr; }
    @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
  `]
})
export class EvaluationComponent {
  private dataService = inject(EmployeeDataService);
  private authService = inject(AuthService);
  private router = inject(Router);
  protected loc = inject(IranLocalizationService);

  currentUser = this.authService.currentUser;
  evaluationCycles = this.dataService.evaluationCycles;
  pendingEvaluations = this.dataService.pendingEvaluations;

  activeSelfEvaluation = computed(() => {
    return this.dataService.myEvaluations().find((e: MyEvaluation) => e.status === 'in-progress') || null;
  });

  completedEvaluations = computed(() => {
    return this.dataService.myEvaluations().filter((e: MyEvaluation) => e.status === 'completed');
  });

  activeCycleCount = computed(() => {
    return this.dataService.evaluationCycles().filter((c: EvaluationCycle) => c.status === 'active').length;
  });

  completedCount = computed(() => this.completedEvaluations().length);

  latestCompletedScore = computed(() => {
    const completed = this.completedEvaluations();
    return completed.length > 0 ? completed[0].overallScore : 0;
  });

  aiAnalysis = computed<FullAIAnalysis | null>(() => {
    return this.dataService.runAIAnalysis();
  });

  getAxisEndPoint(index: number, total: number, radius: number): { x: number; y: number } {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    return {
      x: 150 + radius * Math.cos(angle),
      y: 150 + radius * Math.sin(angle)
    };
  }

  getRadarPoints(dimensions: EvaluationDimension[]): string {
    const total = dimensions.length;
    const maxRadius = 120;
    const points = dimensions.map((dim, i) => {
      const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
      const radius = (dim.score / 100) * maxRadius;
      const x = 150 + radius * Math.cos(angle);
      const y = 150 + radius * Math.sin(angle);
      return `${x},${y}`;
    });
    return points.join(' ');
  }

  getDataPoint(index: number, dimensions: EvaluationDimension[], score: number): { x: number; y: number } {
    const total = dimensions.length;
    const maxRadius = 120;
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const radius = (score / 100) * maxRadius;
    return {
      x: 150 + radius * Math.cos(angle),
      y: 150 + radius * Math.sin(angle)
    };
  }

  getLabelPoint(index: number, total: number): { x: number; y: number } {
    const labelRadius = 140;
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    return {
      x: 150 + labelRadius * Math.cos(angle),
      y: 150 + labelRadius * Math.sin(angle)
    };
  }

  openSelfEvaluationForm(): void {
    const activeEval = this.activeSelfEvaluation();
    if (!activeEval) return;
    const selfForm = this.dataService.evaluationForms().find(
      f => f.type === 'self' && f.cycleId === activeEval.cycleId
    );
    if (selfForm) {
      this.router.navigate(['/evaluation', 'form', 'self', selfForm.id]);
    }
  }

  openPendingEvaluation(pending: any): void {
    const formType = pending.type === 'manager' ? 'manager' : 'peer';
    const form = this.dataService.evaluationForms().find(
      f => f.type === formType && f.id.includes(pending.id)
    );
    if (form) {
      this.router.navigate(['/evaluation', 'form', formType, form.id]);
    }
  }

  getDimColorClass(score: number): string {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  }

  getPendingTypeClass(type: string): string {
    if (type === 'manager') return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
    return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
  }

  getCycleDotClass(status: string): string {
    if (status === 'completed') return 'bg-emerald-500';
    if (status === 'active') return 'bg-blue-500';
    return 'bg-slate-300 dark:bg-slate-600';
  }

  getCycleStatusClass(status: string): string {
    if (status === 'completed') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
    if (status === 'active') return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
    return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
  }
}
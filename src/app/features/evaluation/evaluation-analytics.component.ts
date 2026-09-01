import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EmployeeDataService } from '../../core/data/employee-data.service';
import { AuthService } from '../../core/auth/auth.service';
import { IranLocalizationService } from '../../core/localization/iran-localization.service';
import { FullAIAnalysis } from '../../core/ai/ai-analysis.service';

@Component({
  selector: 'app-evaluation-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div class="max-w-7xl mx-auto space-y-6">

        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
              <ui-icon name="bar-chart-2" [size]="28" class="text-primary"></ui-icon>
              تحلیل عملکرد هوشمند
            </h1>
            <p class="text-muted text-sm mt-1">داشبورد تحلیلی ارزیابی عملکرد ۳۶۰ درجه با تحلیل AI</p>
          </div>
          <div class="flex items-center gap-3">
            <button (click)="goBack()" class="px-4 py-2 bg-surface border border-border dark:border-slate-700 text-foreground dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2">
              <ui-icon name="arrow-right" [size]="16"></ui-icon>
              بازگشت
            </button>
          </div>
        </div>

        @if (personalAnalytics().scoreHistory.length === 0) {
          <div class="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-border dark:border-slate-700 p-10 text-center">
            <ui-icon name="inbox" [size]="48" class="text-muted mx-auto mb-3 opacity-50"></ui-icon>
            <h3 class="text-lg font-bold text-foreground dark:text-slate-100">هنوز داده‌ای برای تحلیل وجود ندارد</h3>
            <p class="text-muted text-sm mt-2 max-w-md mx-auto">
              پس از تکمیل حداقل یک چرخه ارزیابی، تحلیل عملکرد شما در اینجا نمایش داده خواهد شد.
            </p>
            <a 
              routerLink="/evaluation"
              class="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
            >
              <ui-icon name="target" [size]="16"></ui-icon>
              مشاهده چرخه‌های ارزیابی
            </a>
          </div>
        } @else {

          <!-- ═══════════════════════════════════════ -->
          <!-- AI SUMMARY CARD -->
          <!-- ═══════════════════════════════════════ -->
          @if (aiAnalysis()) {
            <div class="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 overflow-hidden shadow-lg">
              <div class="bg-indigo-600 px-5 py-3 flex items-center gap-2">
                <span class="text-white text-lg">🤖</span>
                <h2 class="font-bold text-white text-base">تحلیل هوشمند AI</h2>
                <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold mr-auto">Beta</span>
              </div>
              <div class="p-5 space-y-4">
                <!-- Overall Assessment -->
                <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/50">
                  <p class="text-sm text-foreground dark:text-slate-200 leading-relaxed font-medium">
                    {{ aiAnalysis()!.summary.overallAssessment }}
                  </p>
                </div>

                <!-- AI Insights Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <!-- Strengths -->
                  <div class="bg-white dark:bg-slate-800 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30">
                    <div class="flex items-center gap-2 mb-2">
                      <ui-icon name="star" [size]="16" class="text-emerald-500"></ui-icon>
                      <span class="text-xs font-bold text-emerald-700 dark:text-emerald-400">نقاط قوت کلیدی</span>
                    </div>
                    <ul class="space-y-1">
                      @for (strength of aiAnalysis()!.summary.keyStrengths; track strength) {
                        <li class="text-xs text-foreground dark:text-slate-300 flex items-start gap-1">
                          <span class="text-emerald-500 mt-0.5">•</span>
                          {{ strength }}
                        </li>
                      }
                    </ul>
                  </div>

                  <!-- Weaknesses -->
                  <div class="bg-white dark:bg-slate-800 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30">
                    <div class="flex items-center gap-2 mb-2">
                      <ui-icon name="target" [size]="16" class="text-amber-500"></ui-icon>
                      <span class="text-xs font-bold text-amber-700 dark:text-amber-400">نیاز به بهبود</span>
                    </div>
                    @if (aiAnalysis()!.summary.keyWeaknesses.length > 0) {
                      <ul class="space-y-1">
                        @for (weakness of aiAnalysis()!.summary.keyWeaknesses; track weakness) {
                          <li class="text-xs text-foreground dark:text-slate-300 flex items-start gap-1">
                            <span class="text-amber-500 mt-0.5">•</span>
                            {{ weakness }}
                          </li>
                        }
                      </ul>
                    } @else {
                      <p class="text-xs text-muted">همه ابعاد در سطح مطلوب هستند.</p>
                    }
                  </div>

                  <!-- Trend Outlook -->
                  <div class="bg-white dark:bg-slate-800 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
                    <div class="flex items-center gap-2 mb-2">
                      <ui-icon [name]="getTrendIcon(aiAnalysis()!.prediction.direction)" [size]="16" [class]="getTrendColor(aiAnalysis()!.prediction.direction)"></ui-icon>
                      <span class="text-xs font-bold" [class]="getTrendColor(aiAnalysis()!.prediction.direction)">پیش‌بینی روند</span>
                    </div>
                    <p class="text-xs text-foreground dark:text-slate-300 leading-relaxed">
                      {{ aiAnalysis()!.summary.trendOutlook }}
                    </p>
                  </div>
                </div>

                <!-- Sentiment + Development Focus -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div class="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm">{{ getSentimentEmoji(aiAnalysis()!.sentiment.label) }}</span>
                      <span class="text-xs font-bold text-foreground dark:text-slate-200">تحلیل احساسات بازخوردها</span>
                    </div>
                    <p class="text-xs text-muted leading-relaxed">{{ aiAnalysis()!.summary.sentimentOverview }}</p>
                  </div>
                  <div class="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                    <div class="flex items-center gap-2 mb-1">
                      <ui-icon name="zap" [size]="14" class="text-primary"></ui-icon>
                      <span class="text-xs font-bold text-foreground dark:text-slate-200">اولویت توسعه</span>
                    </div>
                    <p class="text-xs text-muted leading-relaxed">{{ aiAnalysis()!.summary.developmentFocus }}</p>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- ═══════════════════════════════════════ -->
          <!-- PERSONAL ANALYTICS -->
          <!-- ═══════════════════════════════════════ -->
          <div class="space-y-6">
            <h2 class="text-lg font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
              <ui-icon name="user" [size]="20" class="text-primary"></ui-icon>
              تحلیل شخصی
            </h2>

            <!-- Personal Stats Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-border dark:border-slate-700 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                  <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <ui-icon name="award" [size]="20"></ui-icon>
                  </div>
                  <span class="text-xs font-bold text-muted">آخرین امتیاز</span>
                </div>
                <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ loc.toPersianNum(lastScore()) }}</p>
                <div class="flex items-center gap-1 mt-1" [class]="getTrendClass(personalAnalytics().overallTrend)">
                  <ui-icon [name]="personalAnalytics().overallTrend >= 0 ? 'trending-up' : 'trending-down'" [size]="14"></ui-icon>
                  <span class="text-xs font-bold">
                    {{ personalAnalytics().overallTrend >= 0 ? '+' : '' }}{{ loc.toPersianNum(personalAnalytics().overallTrend) }} نسبت به دوره قبل
                  </span>
                </div>
              </div>

              <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-border dark:border-slate-700 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                  <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ui-icon name="star" [size]="20"></ui-icon>
                  </div>
                  <span class="text-xs font-bold text-muted">نقطه قوت</span>
                </div>
                <p class="text-lg font-bold text-foreground dark:text-slate-100 truncate">{{ personalAnalytics().strongestDimension }}</p>
                <p class="text-xs text-muted mt-1">بالاترین امتیاز در آخرین ارزیابی</p>
              </div>

              <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-border dark:border-slate-700 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <ui-icon name="target" [size]="20"></ui-icon>
                  </div>
                  <span class="text-xs font-bold text-muted">نیاز به بهبود</span>
                </div>
                <p class="text-lg font-bold text-foreground dark:text-slate-100 truncate">{{ personalAnalytics().weakestDimension }}</p>
                <p class="text-xs text-muted mt-1">پایین‌ترین امتیاز در آخرین ارزیابی</p>
              </div>

              <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-border dark:border-slate-700 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                  <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <ui-icon name="users" [size]="20"></ui-icon>
                  </div>
                  <span class="text-xs font-bold text-muted">رتبه درصدی</span>
                </div>
                <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ loc.toPersianNum(personalAnalytics().percentileRank) }}٪</p>
                <p class="text-xs text-muted mt-1">بهتر از {{ loc.toPersianNum(personalAnalytics().percentileRank) }}٪ همکاران</p>
              </div>
            </div>

            <!-- Dimension Trends -->
            @if (personalAnalytics().dimensionTrends.length > 0) {
              <div class="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden shadow-sm">
                <div class="p-5 border-b border-border dark:border-slate-700">
                  <h3 class="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                    <ui-icon name="activity" [size]="18" class="text-primary"></ui-icon>
                    روند ابعاد عملکرد
                  </h3>
                </div>
                <div class="p-5 space-y-4">
                  @for (dim of personalAnalytics().dimensionTrends; track dim.name) {
                    <div>
                      <div class="flex items-center justify-between mb-1.5">
                        <span class="text-sm font-bold text-foreground dark:text-slate-200">{{ dim.name }}</span>
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-bold dir-ltr" [class]="getDimScoreColor(dim.currentScore)">{{ loc.toPersianNum(dim.currentScore) }}</span>
                          @if (dim.change !== 0) {
                            <span class="text-xs font-bold px-1.5 py-0.5 rounded" [class]="getChangeClass(dim.change)">
                              {{ dim.change > 0 ? '+' : '' }}{{ loc.toPersianNum(dim.change) }}
                            </span>
                          }
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] text-muted w-8 dir-ltr">{{ loc.toPersianNum(dim.previousScore) }}</span>
                        <div class="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                          <div class="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10"
                               [style.left.%]="dim.previousScore"></div>
                          <div class="h-full rounded-full transition-all duration-500"
                               [style.width.%]="dim.currentScore"
                               [class]="getDimBarColor(dim.currentScore)">
                          </div>
                        </div>
                        <span class="text-[10px] font-bold text-muted w-8 dir-ltr text-left" [class]="getDimScoreColor(dim.currentScore)">{{ loc.toPersianNum(dim.currentScore) }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Score History Chart -->
            @if (personalAnalytics().scoreHistory.length > 0) {
              <div class="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden shadow-sm">
                <div class="p-5 border-b border-border dark:border-slate-700">
                  <h3 class="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                    <ui-icon name="history" [size]="18" class="text-primary"></ui-icon>
                    تاریخچه امتیازات
                  </h3>
                </div>
                <div class="p-5">
                  <svg viewBox="0 0 500 200" class="w-full h-48">
                    <line x1="50" y1="20" x2="480" y2="20" stroke="#e2e8f0" stroke-width="0.5" class="dark:stroke-slate-600"></line>
                    <line x1="50" y1="65" x2="480" y2="65" stroke="#e2e8f0" stroke-width="0.5" class="dark:stroke-slate-600"></line>
                    <line x1="50" y1="110" x2="480" y2="110" stroke="#e2e8f0" stroke-width="0.5" class="dark:stroke-slate-600"></line>
                    <line x1="50" y1="155" x2="480" y2="155" stroke="#e2e8f0" stroke-width="0.5" class="dark:stroke-slate-600"></line>

                    <text x="45" y="24" text-anchor="end" class="fill-slate-400" style="font-size: 10px;">100</text>
                    <text x="45" y="69" text-anchor="end" class="fill-slate-400" style="font-size: 10px;">75</text>
                    <text x="45" y="114" text-anchor="end" class="fill-slate-400" style="font-size: 10px;">50</text>
                    <text x="45" y="159" text-anchor="end" class="fill-slate-400" style="font-size: 10px;">25</text>

                    @for (item of personalAnalytics().scoreHistory; track item.cycle; let i = $index) {
                      <rect
                        [attr.x]="70 + i * 120"
                        [attr.y]="175 - (item.score / 100) * 155"
                        width="80"
                        [attr.height]="(item.score / 100) * 155"
                        rx="4"
                        [attr.fill]="getSvgBarColor(item.score)"
                        class="transition-all duration-500"
                      ></rect>
                      <text
                        [attr.x]="110 + i * 120"
                        [attr.y]="170 - (item.score / 100) * 155"
                        text-anchor="middle"
                        class="fill-slate-700 dark:fill-slate-200"
                        style="font-size: 11px; font-weight: bold;"
                      >{{ loc.toPersianNum(item.score) }}</text>
                      <text
                        [attr.x]="110 + i * 120"
                        y="192"
                        text-anchor="middle"
                        class="fill-slate-500"
                        style="font-size: 8px;"
                      >{{ getShortCycleName(item.cycle) }}</text>
                    }
                  </svg>
                </div>
              </div>
            }

            <!-- ═══════════════════════════════════════ -->
            <!-- AI: DEVELOPMENT SUGGESTIONS -->
            <!-- ═══════════════════════════════════════ -->
            @if (aiAnalysis() && aiAnalysis()!.suggestions.length > 0) {
              <div class="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden shadow-sm">
                <div class="p-5 border-b border-border dark:border-slate-700 flex items-center gap-2">
                  <span class="text-lg">💡</span>
                  <h3 class="font-bold text-foreground dark:text-slate-100">پیشنهادات توسعه فردی AI</h3>
                </div>
                <div class="p-5 space-y-3">
                  @for (suggestion of aiAnalysis()!.suggestions; track suggestion.dimension) {
                    <div class="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                           [class]="getPriorityBgClass(suggestion.priority)">
                        {{ loc.toPersianNum($index + 1) }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-sm font-bold text-foreground dark:text-slate-200">{{ suggestion.dimension }}</span>
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold" [class]="getPriorityTextClass(suggestion.priority)">
                            {{ suggestion.priority }}
                          </span>
                        </div>
                        <p class="text-xs text-foreground dark:text-slate-300 leading-relaxed">{{ suggestion.suggestion }}</p>
                        <div class="flex items-center gap-3 mt-2 text-[10px] text-muted">
                          <span class="flex items-center gap-1">
                            <ui-icon name="briefcase" [size]="12"></ui-icon>
                            {{ suggestion.actionType }}
                          </span>
                          <span class="flex items-center gap-1">
                            <ui-icon name="clock" [size]="12"></ui-icon>
                            {{ suggestion.estimatedEffort }}
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- ═══════════════════════════════════════ -->
            <!-- AI: TREND PREDICTION -->
            <!-- ═══════════════════════════════════════ -->
            @if (aiAnalysis()) {
              <div class="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden shadow-sm">
                <div class="p-5 border-b border-border dark:border-slate-700 flex items-center gap-2">
                  <span class="text-lg">📈</span>
                  <h3 class="font-bold text-foreground dark:text-slate-100">پیش‌بینی روند عملکرد</h3>
                </div>
                <div class="p-5">
                  <div class="flex items-center gap-4 mb-4">
                    <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                         [class]="getPredictionBgClass(aiAnalysis()!.prediction.direction)">
                      {{ getPredictionEmoji(aiAnalysis()!.prediction.direction) }}
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-lg font-bold text-foreground dark:text-slate-100">
                          {{ aiAnalysis()!.prediction.direction }}
                        </span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-muted">
                          اعتماد: {{ loc.toPersianNum(aiAnalysis()!.prediction.confidence) }}٪
                        </span>
                      </div>
                      <p class="text-sm text-muted leading-relaxed">{{ aiAnalysis()!.prediction.description }}</p>
                    </div>
                    <div class="text-left flex-shrink-0">
                      <p class="text-[10px] text-muted">پیش‌بینی دوره بعد</p>
                      <p class="text-2xl font-extrabold dir-ltr" [class]="getPredictionScoreColor(aiAnalysis()!.prediction.predictedNextScore)">
                        {{ loc.toPersianNum(aiAnalysis()!.prediction.predictedNextScore) }}
                      </p>
                    </div>
                  </div>

                  <!-- Prediction Bar -->
                  <div class="relative h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div class="absolute top-0 bottom-0 bg-slate-300 dark:bg-slate-500 rounded-full transition-all duration-700"
                         [style.width.%]="lastScore()"></div>
                    <div class="absolute top-0 bottom-0 w-1 bg-white dark:bg-slate-900 z-10"
                         [style.left.%]="lastScore()"></div>
                  </div>
                  <div class="flex justify-between mt-1 text-[10px] text-muted">
                    <span>دوره فعلی: {{ loc.toPersianNum(lastScore()) }}</span>
                    <span>پیش‌بینی: {{ loc.toPersianNum(aiAnalysis()!.prediction.predictedNextScore) }}</span>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- ═══════════════════════════════════════ -->
          <!-- TEAM ANALYTICS (Managers Only) -->
          <!-- ═══════════════════════════════════════ -->
          @if (canViewTeam()) {
            <div class="space-y-6 pt-6 border-t border-border dark:border-slate-700">
              <h2 class="text-lg font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                <ui-icon name="users" [size]="20" class="text-emerald-500"></ui-icon>
                تحلیل تیمی
                <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold">مدیریتی</span>
              </h2>

              <!-- AI Team Patterns -->
              @if (aiAnalysis() && aiAnalysis()!.teamPatterns.length > 0) {
                <div class="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden shadow-sm">
                  <div class="p-5 border-b border-border dark:border-slate-700 flex items-center gap-2">
                    <span class="text-lg">🔍</span>
                    <h3 class="font-bold text-foreground dark:text-slate-100">الگوهای شناسایی شده تیم (AI)</h3>
                  </div>
                  <div class="p-5 space-y-3">
                    @for (pattern of aiAnalysis()!.teamPatterns; track pattern.dimension + pattern.type) {
                      <div class="p-3 rounded-xl border flex items-start gap-3"
                           [class]="pattern.type === 'strength' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/10' : 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'">
                        <span class="text-lg flex-shrink-0">{{ pattern.type === 'strength' ? '✅' : '⚠️' }}</span>
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="text-sm font-bold" [class]="pattern.type === 'strength' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'">
                              {{ pattern.dimension }}
                            </span>
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                  [class]="pattern.type === 'strength' ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300'">
                              {{ pattern.type === 'strength' ? 'نقطه قوت تیم' : 'نقطه ضعف تیم' }}
                            </span>
                          </div>
                          <p class="text-xs text-foreground dark:text-slate-300 mb-1">{{ pattern.description }}</p>
                          <p class="text-[10px] font-bold text-muted">💡 {{ pattern.recommendation }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Team Stats Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-border dark:border-slate-700 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <ui-icon name="users" [size]="20"></ui-icon>
                    </div>
                    <span class="text-xs font-bold text-muted">تعداد اعضا</span>
                  </div>
                  <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ loc.toPersianNum(teamAnalytics().memberCount) }}</p>
                  <p class="text-xs text-muted mt-1">کارمند ارزیابی شده</p>
                </div>

                <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-border dark:border-slate-700 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <ui-icon name="trending-up" [size]="20"></ui-icon>
                    </div>
                    <span class="text-xs font-bold text-muted">میانگین تیم</span>
                  </div>
                  <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ loc.toPersianNum(teamAnalytics().averageScore) }}</p>
                  <p class="text-xs text-muted mt-1">از ۱۰۰ امتیاز</p>
                </div>

                <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-border dark:border-slate-700 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                    <div class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                      <ui-icon name="award" [size]="20"></ui-icon>
                    </div>
                    <span class="text-xs font-bold text-muted">بالاترین</span>
                  </div>
                  <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ loc.toPersianNum(teamAnalytics().highestScore) }}</p>
                  <p class="text-xs text-muted mt-1">بهترین عملکرد تیم</p>
                </div>

                <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-border dark:border-slate-700 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                    <div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                      <ui-icon name="alert-triangle" [size]="20"></ui-icon>
                    </div>
                    <span class="text-xs font-bold text-muted">پایین‌ترین</span>
                  </div>
                  <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ loc.toPersianNum(teamAnalytics().lowestScore) }}</p>
                  <p class="text-xs text-muted mt-1">نیاز به توجه ویژه</p>
                </div>
              </div>

              <!-- Team Ranking Table -->
              <div class="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden shadow-sm">
                <div class="p-5 border-b border-border dark:border-slate-700">
                  <h3 class="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                    <ui-icon name="list-check" [size]="18" class="text-primary"></ui-icon>
                    رتبه‌بندی اعضای تیم
                  </h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-right">
                    <thead class="bg-slate-50 dark:bg-slate-900/50 border-b border-border dark:border-slate-700">
                      <tr>
                        <th class="px-5 py-3 text-xs font-bold text-muted uppercase tracking-wider text-center">رتبه</th>
                        <th class="px-5 py-3 text-xs font-bold text-muted uppercase tracking-wider">نام</th>
                        <th class="px-5 py-3 text-xs font-bold text-muted uppercase tracking-wider">سمت</th>
                        <th class="px-5 py-3 text-xs font-bold text-muted uppercase tracking-wider text-center">امتیاز</th>
                        <th class="px-5 py-3 text-xs font-bold text-muted uppercase tracking-wider text-center">روند</th>
                        <th class="px-5 py-3 text-xs font-bold text-muted uppercase tracking-wider">نقطه قوت</th>
                        <th class="px-5 py-3 text-xs font-bold text-muted uppercase tracking-wider">نیاز به بهبود</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border dark:divide-slate-700">
                      @for (member of teamAnalytics().members; track member.name; let i = $index) {
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td class="px-5 py-3 text-center">
                            <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                                  [class]="getRankClass(i)">
                              {{ loc.toPersianNum(i + 1) }}
                            </span>
                          </td>
                          <td class="px-5 py-3">
                            <span class="font-bold text-sm text-foreground dark:text-slate-200">{{ member.name }}</span>
                          </td>
                          <td class="px-5 py-3">
                            <span class="text-xs text-muted">{{ member.role }}</span>
                          </td>
                          <td class="px-5 py-3 text-center">
                            <span class="font-bold text-sm dir-ltr" [class]="getDimScoreColor(member.overallScore)">{{ loc.toPersianNum(member.overallScore) }}</span>
                          </td>
                          <td class="px-5 py-3 text-center">
                            <span class="text-xs font-bold px-1.5 py-0.5 rounded" [class]="getChangeClass(member.trend)">
                              {{ member.trend > 0 ? '+' : '' }}{{ loc.toPersianNum(member.trend) }}
                            </span>
                          </td>
                          <td class="px-5 py-3">
                            <span class="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{{ member.strongestDimension }}</span>
                          </td>
                          <td class="px-5 py-3">
                            <span class="text-xs text-amber-600 dark:text-amber-400 font-bold">{{ member.weakestDimension }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Score Distribution + Team Dimension Averages -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden shadow-sm">
                  <div class="p-5 border-b border-border dark:border-slate-700">
                    <h3 class="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                      <ui-icon name="chart" [size]="18" class="text-primary"></ui-icon>
                      توزیع امتیازات تیم
                    </h3>
                  </div>
                  <div class="p-5 space-y-3">
                    @for (dist of teamAnalytics().scoreDistribution; track dist.range) {
                      <div class="flex items-center gap-3">
                        <span class="text-xs font-bold text-muted w-16 flex-shrink-0">{{ dist.range }}</span>
                        <div class="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                          <div class="h-full rounded-lg transition-all duration-500 bg-primary/70"
                               [style.width.%]="dist.percentage">
                          </div>
                        </div>
                        <span class="text-xs font-bold text-muted w-12 text-left dir-ltr">
                          {{ loc.toPersianNum(dist.count) }} نفر ({{ loc.toPersianNum(dist.percentage) }}٪)
                        </span>
                      </div>
                    }
                  </div>
                </div>

                <div class="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden shadow-sm">
                  <div class="p-5 border-b border-border dark:border-slate-700">
                    <h3 class="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                      <ui-icon name="target" [size]="18" class="text-primary"></ui-icon>
                      میانگین ابعاد تیم
                    </h3>
                  </div>
                  <div class="p-5 space-y-3">
                    @for (dim of teamAnalytics().teamDimensionAverages; track dim.name) {
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-sm font-bold text-foreground dark:text-slate-200">{{ dim.name }}</span>
                          <span class="text-sm font-bold dir-ltr" [class]="getDimScoreColor(dim.average)">{{ loc.toPersianNum(dim.average) }}</span>
                        </div>
                        <div class="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-500"
                               [style.width.%]="dim.average"
                               [class]="getDimBarColor(dim.average)">
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

        }

      </div>
    </div>
  `,
  styles: [`
    .dir-ltr { direction: ltr; }
  `]
})
export class EvaluationAnalyticsComponent {
  private dataService = inject(EmployeeDataService);
  private authService = inject(AuthService);
  private router = inject(Router);
  protected loc = inject(IranLocalizationService);

  personalAnalytics = this.dataService.personalAnalytics;
  teamAnalytics = this.dataService.teamAnalytics;
  canViewTeam = this.authService.canViewTeamAnalytics;

  aiAnalysis = computed<FullAIAnalysis | null>(() => {
    return this.dataService.runAIAnalysis();
  });

  lastScore(): number {
    return this.dataService.getLastCompletedScore();
  }

  goBack(): void {
    this.router.navigate(['/evaluation']);
  }

  // --- Sentiment Helpers ---
  getSentimentEmoji(label: string): string {
    if (label === 'مثبت') return '😊';
    if (label === 'منفی') return '😟';
    return '😐';
  }

  // --- Trend Helpers ---
  getTrendClass(trend: number): string {
    if (trend > 0) return 'text-emerald-500';
    if (trend < 0) return 'text-red-500';
    return 'text-muted';
  }

  getTrendIcon(direction: string): string {
    if (direction === 'صعودی') return 'trending-up';
    if (direction === 'نزولی') return 'trending-down';
    return 'activity';
  }

  getTrendColor(direction: string): string {
    if (direction === 'صعودی') return 'text-emerald-500';
    if (direction === 'نزولی') return 'text-red-500';
    return 'text-blue-500';
  }

  // --- Change Helpers ---
  getChangeClass(change: number): string {
    if (change > 0) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (change < 0) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
  }

  // --- Dimension Score Colors ---
  getDimScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  }

  getDimBarColor(score: number): string {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  }

  getSvgBarColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  // --- Priority Helpers ---
  getPriorityBgClass(priority: string): string {
    if (priority === 'بالا') return 'bg-red-500';
    if (priority === 'متوسط') return 'bg-amber-500';
    return 'bg-blue-500';
  }

  getPriorityTextClass(priority: string): string {
    if (priority === 'بالا') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (priority === 'متوسط') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  }

  // --- Prediction Helpers ---
  getPredictionEmoji(direction: string): string {
    if (direction === 'صعودی') return '📈';
    if (direction === 'نزولی') return '📉';
    return '➡️';
  }

  getPredictionBgClass(direction: string): string {
    if (direction === 'صعودی') return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (direction === 'نزولی') return 'bg-red-100 dark:bg-red-900/30';
    return 'bg-blue-100 dark:bg-blue-900/30';
  }

  getPredictionScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  }

  // --- Rank Helper ---
  getRankClass(index: number): string {
    if (index === 0) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (index === 1) return 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300';
    if (index === 2) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
  }

  getShortCycleName(cycle: string): string {
    if (cycle.includes('نیمه اول')) return 'نیمه ۱';
    if (cycle.includes('سه‌ماهه')) return 'س‌م ۳';
    if (cycle.includes('سالانه')) return 'سالانه';
    return cycle.substring(0, 10);
  }
}
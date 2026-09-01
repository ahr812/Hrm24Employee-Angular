import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { SurveyService, Survey, SurveyResponse, SurveyAIAnalysis } from '../../core/survey/survey.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { ExportService } from '../../core/export/export.service';
import { IranLocalizationService } from '../../core/localization/iran-localization.service';

@Component({
    selector: 'app-surveys',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, IconComponent, EscToCloseDirective],
    template: `
        <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">

            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-cyan-600/10 flex items-center justify-center flex-shrink-0">
                        <ui-icon name="thumbs-up" [size]="36" class="text-cyan-600"></ui-icon>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-primary mb-1">نظرسنجی‌ها</h1>
                        <p class="text-lg text-muted">در نظرسنجی‌ها مشارکت کنید...</p>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button
                        type="button"
                        (click)="openCreateModal()"
                        class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
                        <ui-icon name="plus" [size]="20"></ui-icon>
                        ایجاد نظرسنجی
                    </button>
                    <button
                        type="button"
                        (click)="exportData()"
                        class="px-5 py-3 bg-success text-white rounded-xl hover:bg-success/90 transition-colors font-bold flex items-center gap-2 shadow-sm">
                        <ui-icon name="download" [size]="20"></ui-icon>
                        خروجی
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-4 border border-border dark:border-slate-700">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-muted">کل نظرسنجی‌ها</span>
                        <ui-icon name="chart" [size]="18" class="text-primary"></ui-icon>
                    </div>
                    <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ toFa(stats().total) }}</p>
                </div>
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-4 border border-border dark:border-slate-700">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-muted">فعال</span>
                        <ui-icon name="activity" [size]="18" class="text-emerald-500"></ui-icon>
                    </div>
                    <p class="text-2xl font-bold text-emerald-500">{{ toFa(stats().active) }}</p>
                </div>
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-4 border border-border dark:border-slate-700">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-muted">بسته شده</span>
                        <ui-icon name="lock" [size]="18" class="text-muted"></ui-icon>
                    </div>
                    <p class="text-2xl font-bold text-muted">{{ toFa(stats().closed) }}</p>
                </div>
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-4 border border-border dark:border-slate-700">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-muted">پیش‌نویس</span>
                        <ui-icon name="edit" [size]="18" class="text-amber-500"></ui-icon>
                    </div>
                    <p class="text-2xl font-bold text-amber-500">{{ toFa(stats().draft) }}</p>
                </div>
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-4 border border-border dark:border-slate-700">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-muted">کل پاسخ‌ها</span>
                        <ui-icon name="users" [size]="18" class="text-blue-500"></ui-icon>
                    </div>
                    <p class="text-2xl font-bold text-blue-500">{{ toFa(stats().totalResponses) }}</p>
                </div>
            </div>

            <!-- Active Surveys -->
            @if (activeSurveys().length > 0) {
                <div>
                    <h2 class="text-xl font-bold text-foreground dark:text-slate-100 mb-4 flex items-center gap-2">
                        <ui-icon name="activity" [size]="20" class="text-emerald-500"></ui-icon>
                        نظرسنجی‌های فعال
                    </h2>
                    <div class="space-y-4">
                        @for (survey of activeSurveys(); track survey.id) {
                            <div class="bg-surface dark:bg-slate-800 rounded-2xl p-6 border border-border dark:border-slate-700 hover:shadow-md transition-all duration-300">
                                <div class="flex items-start justify-between gap-4 mb-4">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-3 mb-2">
                                            <h3 class="text-lg font-bold text-foreground dark:text-slate-100">{{ survey.title }}</h3>
                                            <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">فعال</span>
                                        </div>
                                        <p class="text-sm text-muted mb-3">{{ survey.description }}</p>
                                        <div class="flex flex-wrap items-center gap-3 text-xs text-muted">
                                            <span class="flex items-center gap-1">
                                                <ui-icon name="users" [size]="14"></ui-icon>
                                                {{ toFa(survey.responseCount) }} پاسخ
                                            </span>
                                            <span class="flex items-center gap-1">
                                                <ui-icon name="clock" [size]="14"></ui-icon>
                                                {{ toFa(surveyService.getDaysRemaining(survey.expiresAt)) }} روز باقی‌مانده
                                            </span>
                                            <span class="flex items-center gap-1">
                                                <ui-icon name="list-check" [size]="14"></ui-icon>
                                                {{ toFa(survey.questions.length) }} سوال
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            (click)="viewResults(survey)"
                                            class="px-4 py-2.5 bg-surface border border-border dark:border-slate-700 text-foreground dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-sm flex items-center gap-2">
                                            <ui-icon name="bar-chart-2" [size]="16"></ui-icon>
                                            نتایج
                                        </button>
                                        <button
                                            (click)="openEditModal(survey)"
                                            class="p-2.5 bg-surface border border-border dark:border-slate-700 text-muted rounded-xl hover:bg-slate-50 hover:text-primary dark:hover:bg-slate-700 transition-colors"
                                            title="ویرایش">
                                            <ui-icon name="edit" [size]="18"></ui-icon>
                                        </button>
                                        <button
                                            (click)="confirmDelete(survey)"
                                            class="p-2.5 bg-surface border border-border dark:border-slate-700 text-muted rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:border-red-800 transition-colors"
                                            title="حذف">
                                            <ui-icon name="trash-2" [size]="18"></ui-icon>
                                        </button>
                                        <button
                                            (click)="openSurveyModal(survey)"
                                            class="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2">
                                            <ui-icon name="send" [size]="18"></ui-icon>
                                            شرکت
                                        </button>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            }

            <!-- Draft Surveys -->
            @if (draftSurveys().length > 0) {
                <div>
                    <h2 class="text-xl font-bold text-foreground dark:text-slate-100 mb-4 flex items-center gap-2">
                        <ui-icon name="edit" [size]="20" class="text-amber-500"></ui-icon>
                        پیش‌نویس‌ها
                    </h2>
                    <div class="space-y-4">
                        @for (survey of draftSurveys(); track survey.id) {
                            <div class="bg-surface dark:bg-slate-800 rounded-2xl p-6 border border-dashed border-amber-300 dark:border-amber-800">
                                <div class="flex items-start justify-between gap-4">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-3 mb-2">
                                            <h3 class="text-lg font-bold text-foreground dark:text-slate-100">{{ survey.title }}</h3>
                                            <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">پیش‌نویس</span>
                                            <span class="text-[10px] text-muted px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">قابل شرکت نیست</span>
                                        </div>
                                        <p class="text-sm text-muted mb-3">{{ survey.description }}</p>
                                        <div class="flex items-center gap-3 text-xs text-muted">
                                            <span class="flex items-center gap-1">
                                                <ui-icon name="list-check" [size]="14"></ui-icon>
                                                {{ toFa(survey.questions.length) }} سوال
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            (click)="openEditModal(survey)"
                                            class="px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-bold text-sm flex items-center gap-2">
                                            <ui-icon name="edit" [size]="16"></ui-icon>
                                            ویرایش
                                        </button>
                                        <button
                                            (click)="confirmDelete(survey)"
                                            class="p-2.5 bg-surface border border-border dark:border-slate-700 text-muted rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:border-red-800 transition-colors"
                                            title="حذف">
                                            <ui-icon name="trash-2" [size]="18"></ui-icon>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            }

            <!-- Closed Surveys -->
            @if (closedSurveys().length > 0) {
                <div>
                    <h2 class="text-xl font-bold text-foreground dark:text-slate-100 mb-4 flex items-center gap-2">
                        <ui-icon name="lock" [size]="20" class="text-muted"></ui-icon>
                        نظرسنجی‌های بسته شده
                    </h2>
                    <div class="space-y-4">
                        @for (survey of closedSurveys(); track survey.id) {
                            <div class="bg-surface dark:bg-slate-800 rounded-2xl p-6 border border-border dark:border-slate-700 opacity-80">
                                <div class="flex items-start justify-between gap-4">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-3 mb-2">
                                            <h3 class="text-lg font-bold text-foreground dark:text-slate-100">{{ survey.title }}</h3>
                                            <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">بسته شده</span>
                                        </div>
                                        <p class="text-sm text-muted mb-3">{{ survey.description }}</p>
                                        <div class="flex items-center gap-3 text-xs text-muted">
                                            <span class="flex items-center gap-1">
                                                <ui-icon name="users" [size]="14"></ui-icon>
                                                {{ toFa(survey.responseCount) }} پاسخ
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            (click)="viewResults(survey)"
                                            class="px-4 py-2.5 bg-surface border border-border dark:border-slate-700 text-foreground dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-sm flex items-center gap-2">
                                            <ui-icon name="bar-chart-2" [size]="16"></ui-icon>
                                            نتایج و تحلیل
                                        </button>
                                        <button
                                            (click)="openEditModal(survey)"
                                            class="p-2.5 bg-surface border border-border dark:border-slate-700 text-muted rounded-xl hover:bg-slate-50 hover:text-primary dark:hover:bg-slate-700 transition-colors"
                                            title="ویرایش">
                                            <ui-icon name="edit" [size]="18"></ui-icon>
                                        </button>
                                        <button
                                            (click)="confirmDelete(survey)"
                                            class="p-2.5 bg-surface border border-border dark:border-slate-700 text-muted rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:border-red-800 transition-colors"
                                            title="حذف">
                                            <ui-icon name="trash-2" [size]="18"></ui-icon>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            }

            <!-- Empty State -->
            @if (surveys().length === 0) {
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-12 border border-dashed border-border dark:border-slate-700 text-center">
                    <ui-icon name="chart" [size]="64" class="mx-auto mb-4 text-muted opacity-50"></ui-icon>
                    <p class="text-lg text-muted mb-2">نظرسنجی وجود ندارد</p>
                    <p class="text-sm text-muted mb-4">اولین نظرسنجی خود را ایجاد کنید</p>
                    <button (click)="openCreateModal()" class="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors">
                        ایجاد نظرسنجی
                    </button>
                </div>
            }

            <!-- Survey Response Modal -->
            @if (selectedSurvey()) {
                <div
                    appEscToClose
                    (escPressed)="closeModal()"
                    class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    (click)="closeModal()">
                    <div
                        class="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-border dark:border-slate-700 animate-scale-in max-h-[85vh] flex flex-col"
                        (click)="$event.stopPropagation()">

                        <div class="p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
                            <div class="flex items-center justify-between">
                                <div class="min-w-0 flex-1 ml-3">
                                    <h2 class="text-lg font-bold text-foreground dark:text-slate-100 truncate">{{ selectedSurvey()!.title }}</h2>
                                    <p class="text-xs text-muted mt-0.5 truncate">{{ selectedSurvey()!.description }}</p>
                                </div>
                                <button (click)="closeModal()" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <ui-icon name="x" [size]="18" class="text-muted"></ui-icon>
                                </button>
                            </div>
                        </div>

                        <div class="flex-1 overflow-y-auto p-5 space-y-5">
                            @for (question of selectedSurvey()!.questions; track question.id; let i = $index) {
                                <div class="space-y-2">
                                    <label class="block text-sm font-bold text-foreground dark:text-slate-200">
                                        {{ toFa(i + 1) }}. {{ question.text }}
                                        @if (question.required) {
                                            <span class="text-red-500 mr-1">*</span>
                                        }
                                    </label>

                                    @if (question.type === 'rating' || question.type === 'scale') {
                                        <div class="flex items-center gap-1.5">
                                            @for (star of getStarRange(question.maxRating || 5); track star) {
                                                <button
                                                    type="button"
                                                    (click)="setRating(question.id, star)"
                                                    class="transition-transform hover:scale-125 focus:outline-none">
                                                    <ui-icon name="star" [size]="28"
                                                        [class]="star <= getRatingValue(question.id) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'">
                                                    </ui-icon>
                                                </button>
                                            }
                                            <span class="text-xs text-muted mr-2">
                                                {{ getRatingValue(question.id) > 0 ? toFa(getRatingValue(question.id)) + '/' + toFa(question.maxRating || 5) : '-' }}
                                            </span>
                                        </div>
                                    }

                                    @if (question.type === 'choice' && question.options) {
                                        <div class="space-y-1.5">
                                            @for (option of question.options; track option) {
                                                <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-border hover:bg-slate-50 cursor-pointer transition-colors dark:border-slate-700 dark:hover:bg-slate-700">
                                                    <input
                                                        type="radio"
                                                        [name]="question.id"
                                                        [value]="option"
                                                        [(ngModel)]="responses[question.id]"
                                                        class="w-3.5 h-3.5 text-primary focus:ring-primary/20">
                                                    <span class="text-sm text-foreground dark:text-slate-200">{{ option }}</span>
                                                </label>
                                            }
                                        </div>
                                    }

                                    @if (question.type === 'yesno') {
                                        <div class="flex gap-3">
                                            <button type="button" (click)="responses[question.id] = 'بله'"
                                                class="flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all"
                                                [class]="responses[question.id] === 'بله' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-border bg-background text-foreground dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200'">
                                                بله
                                            </button>
                                            <button type="button" (click)="responses[question.id] = 'خیر'"
                                                class="flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all"
                                                [class]="responses[question.id] === 'خیر' ? 'bg-red-500 text-white border-red-500' : 'border-border bg-background text-foreground dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200'">
                                                خیر
                                            </button>
                                        </div>
                                    }

                                    @if (question.type === 'text') {
                                        <textarea
                                            [(ngModel)]="responses[question.id]"
                                            rows="2"
                                            class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm"
                                            placeholder="پاسخ خود را بنویسید..."></textarea>
                                    }
                                </div>
                            }
                        </div>

                        <div class="p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
                            <div class="flex gap-3">
                                <button (click)="closeModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200">
                                    انصراف
                                </button>
                                <button (click)="submitSurvey()" class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center justify-center gap-2 text-sm">
                                    <ui-icon name="send" [size]="16"></ui-icon>
                                    ارسال پاسخ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            }

            <!-- Results & AI Analysis Modal -->
            @if (resultsSurvey()) {
                <div
                    appEscToClose
                    (escPressed)="closeResultsModal()"
                    class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    (click)="closeResultsModal()">
                    <div
                        class="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-border dark:border-slate-700 animate-scale-in max-h-[90vh] flex flex-col"
                        (click)="$event.stopPropagation()">

                        <div class="p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h2 class="text-lg font-bold text-foreground dark:text-slate-100">نتایج و تحلیل: {{ resultsSurvey()!.title }}</h2>
                                    <p class="text-xs text-muted mt-0.5">{{ toFa(resultsSurvey()!.responseCount) }} پاسخ ثبت شده</p>
                                </div>
                                <button (click)="closeResultsModal()" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <ui-icon name="x" [size]="18" class="text-muted"></ui-icon>
                                </button>
                            </div>
                        </div>

                        <div class="flex-1 overflow-y-auto p-5 space-y-6">
                            @if (aiAnalysis()) {
                                <div class="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-5">
                                    <div class="flex items-center gap-2 mb-3">
                                        <span class="text-lg">🤖</span>
                                        <h3 class="font-bold text-indigo-700 dark:text-indigo-400">تحلیل هوشمند AI</h3>
                                    </div>
                                    <p class="text-sm text-foreground dark:text-slate-200 leading-relaxed mb-3">{{ aiAnalysis()!.summary }}</p>

                                    <div class="flex items-center gap-2 mb-3">
                                        <span class="text-xs font-bold text-muted">احساس کلی:</span>
                                        <span class="px-2.5 py-1 rounded-lg text-xs font-bold"
                                              [class]="getSentimentClass(aiAnalysis()!.overallSentiment)">
                                            {{ getSentimentEmoji(aiAnalysis()!.overallSentiment) }} {{ aiAnalysis()!.overallSentiment }}
                                        </span>
                                    </div>

                                    @if (aiAnalysis()!.keyInsights.length > 0) {
                                        <div class="space-y-1.5">
                                            <span class="text-xs font-bold text-muted">نکات کلیدی:</span>
                                            @for (insight of aiAnalysis()!.keyInsights; track insight) {
                                                <div class="flex items-start gap-2 text-xs text-foreground dark:text-slate-300">
                                                    <ui-icon name="zap" [size]="12" class="text-amber-500 mt-0.5 flex-shrink-0"></ui-icon>
                                                    {{ insight }}
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>

                                @for (qa of aiAnalysis()!.questionAnalyses; track qa.questionId) {
                                    <div class="bg-white dark:bg-slate-900/50 rounded-xl border border-border dark:border-slate-700 p-4">
                                        <h4 class="text-sm font-bold text-foreground dark:text-slate-200 mb-3">{{ qa.questionText }}</h4>

                                        @if ((qa.type === 'rating' || qa.type === 'scale') && qa.averageScore !== undefined) {
                                            <div class="mb-3">
                                                <div class="flex items-center justify-between mb-1">
                                                    <span class="text-xs text-muted">میانگین امتیاز</span>
                                                    <span class="text-lg font-bold" [class]="getScoreColor(qa.averageScore!)">{{ toFa(qa.averageScore) }} / {{ toFa(5) }}</span>
                                                </div>
                                                <div class="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div class="h-full rounded-full" [style.width.%]="(qa.averageScore! / 5) * 100" [class]="getScoreBarColor(qa.averageScore!)"></div>
                                                </div>
                                            </div>
                                            @if (qa.distribution) {
                                                <div class="space-y-1">
                                                    @for (d of qa.distribution; track d.label) {
                                                        <div class="flex items-center gap-2 text-xs">
                                                            <div class="flex items-center gap-1 w-8">
                                                                @for (s of getStarRange(toNumber(d.label)); track s) {
                                                                    <ui-icon name="star" [size]="10" class="text-yellow-400 fill-yellow-400"></ui-icon>
                                                                }
                                                            </div>
                                                            <div class="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                                                                <div class="h-full bg-primary/60 rounded" [style.width.%]="d.percentage"></div>
                                                            </div>
                                                            <span class="text-muted w-12 text-left">{{ toFa(d.percentage) }}٪ ({{ toFa(d.count) }})</span>
                                                        </div>
                                                    }
                                                </div>
                                            }
                                        }

                                        @if ((qa.type === 'choice' || qa.type === 'yesno') && qa.distribution) {
                                            <div class="space-y-1.5">
                                                @for (d of qa.distribution; track d.label) {
                                                    <div class="flex items-center gap-2 text-xs">
                                                        <span class="w-20 truncate font-bold text-foreground dark:text-slate-300">{{ d.label }}</span>
                                                        <div class="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                                                            <div class="h-full bg-primary/60 rounded flex items-center px-2" [style.width.%]="d.percentage">
                                                                @if (d.percentage > 15) {
                                                                    <span class="text-[10px] text-white font-bold">{{ toFa(d.percentage) }}٪</span>
                                                                }
                                                            </div>
                                                        </div>
                                                        <span class="text-muted w-8 text-left">{{ toFa(d.count) }}</span>
                                                    </div>
                                                }
                                            </div>
                                        }

                                        @if (qa.type === 'text' && qa.sentimentLabel) {
                                            <div class="space-y-2">
                                                <div class="flex items-center gap-2">
                                                    <span class="text-xs text-muted">تحلیل احساسات:</span>
                                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold" [class]="getSentimentClass(qa.sentimentLabel)">
                                                        {{ getSentimentEmoji(qa.sentimentLabel) }} {{ qa.sentimentLabel }}
                                                    </span>
                                                </div>
                                                <p class="text-xs text-muted leading-relaxed">{{ qa.sentimentSummary }}</p>
                                                @if (qa.topKeywords && qa.topKeywords.length > 0) {
                                                    <div class="flex flex-wrap gap-1">
                                                        @for (kw of qa.topKeywords; track kw) {
                                                            <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] text-muted">{{ kw }}</span>
                                                        }
                                                    </div>
                                                }
                                            </div>
                                        }

                                        <p class="text-[10px] text-muted mt-2">{{ toFa(qa.totalResponses) }} پاسخ</p>
                                    </div>
                                }
                            } @else {
                                <div class="text-center py-8">
                                    <ui-icon name="bar-chart-2" [size]="40" class="mx-auto mb-3 text-muted opacity-40"></ui-icon>
                                    <p class="text-sm text-muted">هنوز پاسخی ثبت نشده یا تحلیل امکان‌پذیر نیست.</p>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }

            <!-- Create/Edit Survey Modal -->
            @if (isFormModalOpen()) {
                <div
                    appEscToClose
                    (escPressed)="closeFormModal()"
                    class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    (click)="closeFormModal()">
                    <div
                        class="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-border dark:border-slate-700 animate-scale-in max-h-[90vh] flex flex-col"
                        (click)="$event.stopPropagation()">

                        <div class="p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
                            <div class="flex items-center justify-between">
                                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">
                                    {{ editingSurveyId ? 'ویرایش نظرسنجی' : 'ایجاد نظرسنجی جدید' }}
                                </h2>
                                <button (click)="closeFormModal()" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <ui-icon name="x" [size]="18" class="text-muted"></ui-icon>
                                </button>
                            </div>
                        </div>

                        <div class="flex-1 overflow-y-auto p-5 space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-muted mb-1">عنوان نظرسنجی *</label>
                                <input type="text" [(ngModel)]="createForm.title" placeholder="مثلاً: نظرسنجی رضایت شغلی"
                                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-muted mb-1">توضیحات</label>
                                <textarea [(ngModel)]="createForm.description" rows="2" placeholder="توضیحات نظرسنجی..."
                                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"></textarea>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-bold text-muted mb-1">وضعیت</label>
                                    <select [(ngModel)]="createForm.status"
                                        class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                        <option value="active">فعال - قابل شرکت</option>
                                        <option value="draft">پیش‌نویس - ذخیره برای بعد</option>
                                        <option value="closed">بسته شده</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-muted mb-1">مهلت پاسخ (روز)</label>
                                    <input type="number" [(ngModel)]="createForm.expiresDays" min="1" max="365"
                                        class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr">
                                </div>
                            </div>

                            @if (createForm.status === 'draft') {
                                <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center gap-2">
                                    <ui-icon name="info" [size]="16" class="text-amber-500 flex-shrink-0"></ui-icon>
                                    <p class="text-xs text-amber-700 dark:text-amber-400">نظرسنجی پیش‌نویس برای کسی نمایش داده نمی‌شود و امکان شرکت وجود ندارد. پس از تکمیل ویرایش، وضعیت را به «فعال» تغییر دهید.</p>
                                </div>
                            }

                            <!-- Questions Builder -->
                            <div class="pt-3 border-t border-border dark:border-slate-700">
                                <div class="flex items-center justify-between mb-3">
                                    <h3 class="text-sm font-bold text-foreground dark:text-slate-100">سوالات ({{ toFa(createForm.questions.length) }})</h3>
                                    <button (click)="addQuestion()" class="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-1">
                                        <ui-icon name="plus" [size]="14"></ui-icon> افزودن سوال
                                    </button>
                                </div>

                                <div class="space-y-3">
                                    @for (q of createForm.questions; track $index; let qi = $index) {
                                        <div class="p-3 rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                                            <div class="flex items-center justify-between">
                                                <span class="text-xs font-bold text-muted">سوال {{ toFa(qi + 1) }}</span>
                                                <button (click)="removeQuestion(qi)" class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted hover:text-red-500 transition-colors">
                                                    <ui-icon name="trash-2" [size]="14"></ui-icon>
                                                </button>
                                            </div>
                                            <input type="text" [(ngModel)]="q.text" placeholder="متن سوال..."
                                                class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                            <div class="grid grid-cols-2 gap-2">
                                                <select [(ngModel)]="q.type"
                                                    class="px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                                    <option value="rating">امتیازی (ستاره)</option>
                                                    <option value="choice">چندگزینه‌ای</option>
                                                    <option value="yesno">بله / خیر</option>
                                                    <option value="text">تشریحی</option>
                                                    <option value="scale">مقیاس (۱ تا ۱۰)</option>
                                                </select>
                                                <label class="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-xs cursor-pointer dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200">
                                                    <input type="checkbox" [(ngModel)]="q.required" class="rounded text-primary focus:ring-primary/20">
                                                    اجباری
                                                </label>
                                            </div>
                                            @if (q.type === 'choice') {
                                                <div>
                                                    <label class="text-[10px] text-muted block mb-1">گزینه‌ها (با کاما جدا کنید)</label>
                                                    <input type="text" [(ngModel)]="q.optionsStr" placeholder="گزینه ۱، گزینه ۲، گزینه ۳"
                                                        class="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                                </div>
                                            }
                                            @if (q.type === 'rating') {
                                                <div>
                                                    <label class="text-[10px] text-muted block mb-1">حداکثر امتیاز</label>
                                                    <select [(ngModel)]="q.maxRating"
                                                        class="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                                        <option [ngValue]="5">۵ ستاره</option>
                                                        <option [ngValue]="10">۱۰ امتیاز</option>
                                                    </select>
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>

                        <div class="p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
                            <div class="flex gap-3">
                                <button (click)="closeFormModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200">
                                    انصراف
                                </button>
                                <button (click)="saveSurvey()" class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-sm">
                                    {{ editingSurveyId ? 'ذخیره تغییرات' : 'ذخیره نظرسنجی' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            }

            <!-- Delete Confirmation Modal -->
            @if (surveyToDelete()) {
                <div
                    appEscToClose
                    (escPressed)="cancelDelete()"
                    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    (click)="cancelDelete()">
                    <div class="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-border dark:border-slate-700 p-6 animate-scale-in"
                         (click)="$event.stopPropagation()">
                        <div class="text-center mb-4">
                            <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                                <ui-icon name="trash-2" [size]="28" class="text-red-500"></ui-icon>
                            </div>
                            <h3 class="text-lg font-bold text-foreground dark:text-slate-100 mb-2">حذف نظرسنجی</h3>
                            <p class="text-sm text-muted">آیا از حذف نظرسنجی «{{ surveyToDelete()!.title }}» مطمئن هستید؟ این عمل قابل بازگشت نیست و تمام پاسخ‌های ثبت شده نیز حذف خواهند شد.</p>
                        </div>
                        <div class="flex gap-3">
                            <button (click)="cancelDelete()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200">
                                انصراف
                            </button>
                            <button (click)="executeDelete()" class="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-bold text-sm">
                                حذف قطعی
                            </button>
                        </div>
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
    `]
})
export class SurveysComponent {
    surveyService = inject(SurveyService);
    private toastService = inject(ToastService);
    private exportService = inject(ExportService);
    protected loc = inject(IranLocalizationService);
    private router = inject(Router);

    surveys = this.surveyService.surveys;
    stats = this.surveyService.stats;
    activeSurveys = this.surveyService.activeSurveys;
    closedSurveys = this.surveyService.closedSurveys;
    draftSurveys = this.surveyService.draftSurveys;

    // ── Response Modal ──
    selectedSurvey = signal<Survey | null>(null);
    responses: { [key: string]: string | number } = {};

    // ── Results Modal ──
    resultsSurvey = signal<Survey | null>(null);
    aiAnalysis = signal<SurveyAIAnalysis | null>(null);

    // ── Create/Edit Modal ──
    isFormModalOpen = signal(false);
    editingSurveyId: string | null = null;
    createForm = {
        title: '',
        description: '',
        status: 'active' as 'active' | 'draft' | 'closed',
        expiresDays: 30,
        questions: [] as { text: string; type: string; required: boolean; optionsStr: string; maxRating: number }[]
    };

    // ── Delete Confirmation ──
    surveyToDelete = signal<Survey | null>(null);

    // ══════════════════════════════════════
    // Survey Response
    // ══════════════════════════════════════

    openSurveyModal(survey: Survey): void {
        const existing = this.surveyService.getSubmissionForSurvey(survey.id);
        if (existing) {
            this.toastService.show('شما قبلاً در این نظرسنجی شرکت کرده‌اید.', 'error');
            return;
        }
        this.selectedSurvey.set(survey);
        this.responses = {};
    }

    closeModal(): void {
        this.selectedSurvey.set(null);
        this.responses = {};
    }

    setRating(questionId: string, value: number): void {
        this.responses[questionId] = value;
    }

    getRatingValue(questionId: string): number {
        return (this.responses[questionId] as number) || 0;
    }

    getStarRange(max: number): number[] {
        return Array.from({ length: max }, (_, i) => i + 1);
    }

    toNumber(value: string): number {
        return parseInt(value, 10) || 0;
    }

    submitSurvey(): void {
        const survey = this.selectedSurvey();
        if (!survey) return;

        for (const question of survey.questions) {
            if (question.required && !this.responses[question.id]) {
                this.toastService.show(`لطفاً به سوال "${question.text}" پاسخ دهید.`, 'error');
                return;
            }
        }

        const surveyResponses: SurveyResponse[] = Object.entries(this.responses).map(([questionId, value]) => ({
            questionId,
            value
        }));

        this.surveyService.submitSurvey(survey.id, surveyResponses);
        this.toastService.show('پاسخ شما با موفقیت ثبت شد. ممنون از مشارکت!', 'success');
        this.closeModal();
    }

    // ══════════════════════════════════════
    // Results & AI Analysis
    // ══════════════════════════════════════

    viewResults(survey: Survey): void {
        this.resultsSurvey.set(survey);
        const analysis = this.surveyService.analyzeSurveyResults(survey.id);
        this.aiAnalysis.set(analysis);
    }

    closeResultsModal(): void {
        this.resultsSurvey.set(null);
        this.aiAnalysis.set(null);
    }

    getSentimentClass(label: string): string {
        if (label === 'مثبت') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        if (label === 'منفی') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    }

    getSentimentEmoji(label: string): string {
        if (label === 'مثبت') return '😊';
        if (label === 'منفی') return '😟';
        return '😐';
    }

    getScoreColor(score: number): string {
        if (score >= 4) return 'text-emerald-500';
        if (score >= 3) return 'text-blue-500';
        if (score >= 2) return 'text-amber-500';
        return 'text-red-500';
    }

    getScoreBarColor(score: number): string {
        if (score >= 4) return 'bg-emerald-500';
        if (score >= 3) return 'bg-blue-500';
        if (score >= 2) return 'bg-amber-500';
        return 'bg-red-500';
    }

    // ══════════════════════════════════════
    // Create / Edit Survey
    // ══════════════════════════════════════

    openCreateModal(): void {
        this.editingSurveyId = null;
        this.createForm = {
            title: '',
            description: '',
            status: 'active',
            expiresDays: 30,
            questions: []
        };
        this.isFormModalOpen.set(true);
    }

    openEditModal(survey: Survey): void {
        this.editingSurveyId = survey.id;
        const expiresMs = new Date(survey.expiresAt).getTime() - new Date(survey.createdAt).getTime();
        const expiresDays = Math.max(1, Math.ceil(expiresMs / (1000 * 60 * 60 * 24)));

        this.createForm = {
            title: survey.title,
            description: survey.description,
            status: survey.status,
            expiresDays,
            questions: survey.questions.map(q => ({
                text: q.text,
                type: q.type,
                required: q.required,
                optionsStr: q.options ? q.options.join('، ') : '',
                maxRating: q.maxRating || 5
            }))
        };
        this.isFormModalOpen.set(true);
    }

    closeFormModal(): void {
        this.isFormModalOpen.set(false);
        this.editingSurveyId = null;
    }

    addQuestion(): void {
        this.createForm.questions.push({
            text: '',
            type: 'rating',
            required: true,
            optionsStr: '',
            maxRating: 5
        });
    }

    removeQuestion(index: number): void {
        this.createForm.questions.splice(index, 1);
    }

    saveSurvey(): void {
        if (!this.createForm.title.trim()) {
            this.toastService.show('عنوان نظرسنجی الزامی است.', 'error');
            return;
        }
        if (this.createForm.questions.length === 0) {
            this.toastService.show('حداقل یک سوال اضافه کنید.', 'error');
            return;
        }
        for (let i = 0; i < this.createForm.questions.length; i++) {
            if (!this.createForm.questions[i].text.trim()) {
                this.toastService.show(`متن سوال ${i + 1} الزامی است.`, 'error');
                return;
            }
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.createForm.expiresDays);

        const questions = this.createForm.questions.map((q, i) => ({
            id: `q-${Date.now()}-${i}`,
            text: q.text,
            type: q.type as any,
            required: q.required,
            options: q.type === 'choice' ? q.optionsStr.split(/[,،]/).map(o => o.trim()).filter(o => o) : undefined,
            maxRating: q.type === 'rating' ? q.maxRating : undefined
        }));

        if (this.editingSurveyId) {
            this.surveyService.updateSurvey(this.editingSurveyId, {
                title: this.createForm.title,
                description: this.createForm.description,
                status: this.createForm.status,
                questions,
                expiresAt: expiresAt.toISOString()
            });
            this.toastService.show('نظرسنجی ویرایش شد.', 'success');
        } else {
            this.surveyService.addSurvey({
                title: this.createForm.title,
                description: this.createForm.description,
                status: this.createForm.status,
                questions,
                createdAt: new Date().toISOString(),
                expiresAt: expiresAt.toISOString(),
                orgId: 'org1'
            });
            this.toastService.show('نظرسنجی با موفقیت ایجاد شد.', 'success');
        }

        this.closeFormModal();
    }

    // ══════════════════════════════════════
    // Delete Survey
    // ══════════════════════════════════════

    confirmDelete(survey: Survey): void {
        this.surveyToDelete.set(survey);
    }

    cancelDelete(): void {
        this.surveyToDelete.set(null);
    }

    executeDelete(): void {
        const survey = this.surveyToDelete();
        if (!survey) return;

        this.surveyService.deleteSurvey(survey.id);
        this.toastService.show(`نظرسنجی «${survey.title}» حذف شد.`, 'success');
        this.surveyToDelete.set(null);
    }

    // ══════════════════════════════════════
    // Export
    // ══════════════════════════════════════

    exportData(): void {
        const exportData = this.surveys().map(s => ({
            'عنوان': s.title,
            'وضعیت': this.surveyService.getStatusLabel(s.status),
            'تعداد پاسخ': s.responseCount.toString(),
            'تعداد سوالات': s.questions.length.toString(),
            'تاریخ ایجاد': new Date(s.createdAt).toLocaleDateString('fa-IR'),
            'تاریخ انقضا': new Date(s.expiresAt).toLocaleDateString('fa-IR')
        }));

        this.exportService.exportToCSV(exportData, 'surveys-report');
    }

    toFa(num: number | string): string {
        return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
    }
}
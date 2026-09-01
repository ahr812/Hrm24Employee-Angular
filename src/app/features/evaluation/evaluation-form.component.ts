import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EmployeeDataService, EvaluationForm, EvaluationQuestion, EvaluationAnswer, EvaluationResponse } from '../../core/data/employee-data.service';
import { IranLocalizationService } from '../../core/localization/iran-localization.service';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">

      <!-- Inline Notification -->
      @if (notification(); as notif) {
        <div 
          class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-down"
          [class]="getNotificationClass(notif.type)"
        >
          <ui-icon [name]="getNotificationIcon(notif.type)" [size]="20"></ui-icon>
          <span class="text-sm font-bold">{{ notif.message }}</span>
        </div>
      }

      <!-- Header -->
      <div class="sticky top-0 z-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border-b border-border dark:border-slate-700 shadow-sm">
        <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button (click)="goBack()" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <ui-icon name="arrow-right" [size]="20" class="text-foreground"></ui-icon>
            </button>
            <div>
              <h1 class="font-bold text-lg text-foreground dark:text-slate-100">{{ form()?.title }}</h1>
              <p class="text-xs text-muted max-w-md truncate">{{ form()?.description }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-bold" [class]="getFormTypeClass()">
              {{ getFormTypeLabel() }}
            </span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="max-w-4xl mx-auto px-4 pb-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-muted">پیشرفت تکمیل فرم</span>
            <span class="text-xs font-bold text-primary">{{ loc.toPersianNum(completionPercentage()) }}٪</span>
          </div>
          <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-primary to-blue-600 transition-all duration-500 rounded-full"
              [style.width.%]="completionPercentage()"
            ></div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-4xl mx-auto px-4 py-6 space-y-6">

        <!-- Target Employee Info -->
        @if (form()?.type !== 'self') {
          <div class="bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-slate-800 rounded-2xl border border-primary/20 dark:border-primary/30 p-5">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {{ response()?.targetEmployeeName?.charAt(0) || '?' }}
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-lg text-foreground dark:text-slate-100">{{ response()?.targetEmployeeName }}</h3>
                <p class="text-sm text-muted mt-0.5">کارمند مورد ارزیابی</p>
              </div>
              <div class="text-left flex-shrink-0">
                <p class="text-xs text-muted">مهلت تکمیل</p>
                <p class="font-bold text-sm text-red-500">{{ loc.formatShamsiDate(form()?.deadline || '') }}</p>
                <p class="text-[10px] text-muted mt-0.5">{{ loc.daysUntilText(form()?.deadline || '') }}</p>
              </div>
            </div>
          </div>
        }

        <!-- Self Evaluation Info -->
        @if (form()?.type === 'self') {
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl border border-blue-200 dark:border-blue-800 p-5">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ui-icon name="info" [size]="24"></ui-icon>
              </div>
              <div>
                <h3 class="font-bold text-foreground dark:text-slate-100">راهنمای خودارزیابی</h3>
                <p class="text-xs text-muted mt-0.5 leading-relaxed">
                  پاسخ‌های صادقانه شما به رشد حرفه‌ای‌تان کمک می‌کند. سوالات ستاره‌دار (*) اجباری هستند.
                </p>
              </div>
            </div>
          </div>
        }

        <!-- Current Score Display -->
        @if (hasRatingQuestions()) {
          <div class="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 p-5 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <ui-icon name="award" [size]="20" class="text-primary"></ui-icon>
                <span class="font-bold text-foreground dark:text-slate-100">امتیاز فعلی شما</span>
              </div>
              <span class="text-3xl font-extrabold dir-ltr" [class]="getScoreTextClass()">{{ loc.toPersianNum(currentScore()) }}</span>
            </div>
            <div class="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-700"
                [style.width.%]="currentScore()"
                [class]="getScoreColorClass()"
              ></div>
            </div>
            <div class="flex justify-between mt-2 text-[10px] text-muted">
              <span>ضعیف (۰)</span>
              <span>متوسط (۵۰)</span>
              <span>عالی (۱۰۰)</span>
            </div>
          </div>
        }

        <!-- Questions Grouped by Dimension -->
        @for (dimension of getDimensions(); track dimension) {
          <div class="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden shadow-sm">
            <div class="bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 px-5 py-3 border-b border-border dark:border-slate-700">
              <h3 class="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                <ui-icon name="target" [size]="18" class="text-primary"></ui-icon>
                {{ dimension }}
              </h3>
            </div>

            <div class="p-5 space-y-5">
              @for (question of getQuestionsByDimension(dimension); track question.id) {
                <div class="space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <span class="flex-1 text-sm font-bold text-foreground dark:text-slate-200 leading-relaxed">
                      {{ question.text }}
                      @if (question.required) {
                        <span class="text-red-500 mr-1">*</span>
                      }
                    </span>
                    @if (question.weight > 0) {
                      <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] text-muted flex-shrink-0 font-bold">
                        وزن: {{ loc.toPersianNum(question.weight) }}٪
                      </span>
                    }
                  </div>

                  @if (question.type === 'rating') {
                    <div class="flex gap-2">
                      @for (rating of getRatingScale(question.maxRating || 5); track rating) {
                        <button
                          (click)="setAnswer(question.id, rating)"
                          class="flex-1 py-3 rounded-xl border-2 transition-all duration-200 font-bold text-sm"
                          [class]="getRatingButtonClass(question.id, rating)"
                        >
                          {{ loc.toPersianNum(rating) }}
                        </button>
                      }
                    </div>
                    <div class="flex justify-between text-[10px] text-muted px-1">
                      <span>ضعیف</span>
                      <span>عالی</span>
                    </div>
                  }

                  @if (question.type === 'text') {
                    <textarea
                      [value]="getAnswerValue(question.id)"
                      (input)="setAnswer(question.id, $any($event.target).value)"
                      rows="3"
                      class="w-full px-4 py-3 rounded-xl border border-border dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-foreground dark:text-slate-100 placeholder-muted focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm"
                      placeholder="پاسخ خود را اینجا بنویسید..."
                    ></textarea>
                  }

                  @if (question.type === 'multiple-choice' && question.options) {
                    <div class="space-y-2">
                      @for (option of question.options; track option.value) {
                        <div 
                          class="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer text-sm"
                          [class]="getOptionClass(question.id, option.value)"
                          (click)="setAnswer(question.id, option.value)"
                        >
                          <div 
                            class="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            [class.border-primary]="getAnswerValue(question.id) === option.value"
                            [class.border-slate-300]="getAnswerValue(question.id) !== option.value"
                            [class.dark:border-slate-500]="getAnswerValue(question.id) !== option.value"
                          >
                            @if (getAnswerValue(question.id) === option.value) {
                              <div class="w-2 h-2 rounded-full bg-primary"></div>
                            }
                          </div>
                          <span class="text-foreground dark:text-slate-200">{{ option.label }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>

                @if (!$last) {
                  <div class="h-px bg-border dark:bg-slate-700"></div>
                }
              }
            </div>
          </div>
        }

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4">
          <button 
            (click)="saveAsDraft()"
            class="flex-1 px-6 py-3.5 bg-surface border border-border dark:border-slate-700 text-foreground dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <ui-icon name="save" [size]="18"></ui-icon>
            ذخیره موقت
          </button>
          <button 
            (click)="submitFinal()"
            [disabled]="!canSubmit()"
            class="flex-1 px-6 py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ui-icon name="check-circle" [size]="18"></ui-icon>
            ثبت نهایی ارزیابی
          </button>
        </div>

        <!-- Validation Hint -->
        @if (!canSubmit()) {
          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
            <ui-icon name="alert-triangle" [size]="20" class="text-amber-500 flex-shrink-0"></ui-icon>
            <p class="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              برای ثبت نهایی، لطفاً تمام سوالات ستاره‌دار (*) را پاسخ دهید. 
              پیشرفت فعلی: {{ loc.toPersianNum(completionPercentage()) }}٪
            </p>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .dir-ltr { direction: ltr; }

    @keyframes slide-down {
      from { opacity: 0; transform: translate(-50%, -20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    .animate-slide-down { animation: slide-down 0.3s ease-out forwards; }
  `]
})
export class EvaluationFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private dataService = inject(EmployeeDataService);
  protected loc = inject(IranLocalizationService);

  form = signal<EvaluationForm | null>(null);
  response = signal<EvaluationResponse | null>(null);
  answers = signal<EvaluationAnswer[]>([]);
  notification = signal<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type');
    const id = this.route.snapshot.paramMap.get('id');

    if (type && id) {
      this.loadForm(type, id);
    }
  }

  loadForm(type: string, id: string): void {
    const form = this.dataService.getFormById(id);
    if (!form) {
      this.router.navigate(['/evaluation']);
      return;
    }

    this.form.set(form);

    let targetEmployeeId = 'self';
    let targetEmployeeName = 'خودم';

    if (type === 'manager' || type === 'peer') {
      const pending = this.dataService.pendingEvaluations().find(p => p.id === id);
      if (pending) {
        targetEmployeeId = pending.id;
        targetEmployeeName = pending.employeeName;
      }
    }

    const response = this.dataService.getOrCreateResponse(id, targetEmployeeId, targetEmployeeName);
    this.response.set(response);
    this.answers.set(response.answers);
  }

  showNotification(type: 'success' | 'error' | 'info', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => {
      this.notification.set(null);
    }, 3500);
  }

  getNotificationClass(type: string): string {
    if (type === 'success') return 'bg-emerald-500 text-white';
    if (type === 'error') return 'bg-red-500 text-white';
    return 'bg-blue-500 text-white';
  }

  getNotificationIcon(type: string): string {
    if (type === 'success') return 'check-circle';
    if (type === 'error') return 'alert-circle';
    return 'info';
  }

  getDimensions(): string[] {
    const questions = this.form()?.questions || [];
    const dimensions = new Set(questions.map(q => q.dimension));
    return Array.from(dimensions);
  }

  getQuestionsByDimension(dimension: string): EvaluationQuestion[] {
    return this.form()?.questions.filter(q => q.dimension === dimension) || [];
  }

  hasRatingQuestions(): boolean {
    return this.form()?.questions.some(q => q.type === 'rating' && q.weight > 0) || false;
  }

  getRatingScale(max: number): number[] {
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  setAnswer(questionId: string, value: number | string): void {
    const currentAnswers = [...this.answers()];
    const existingIndex = currentAnswers.findIndex(a => a.questionId === questionId);

    if (existingIndex >= 0) {
      currentAnswers[existingIndex].value = value;
    } else {
      currentAnswers.push({ questionId, value });
    }

    this.answers.set(currentAnswers);
    this.updateResponse();
  }

  getAnswerValue(questionId: string): number | string {
    const answer = this.answers().find(a => a.questionId === questionId);
    return answer?.value || '';
  }

  updateResponse(): void {
    const response = this.response();
    if (response) {
      response.answers = this.answers();
      const form = this.form();
      if (form) {
        response.calculatedScore = this.dataService.calculateWeightedScore(this.answers(), form.questions);
      }
      this.response.set({ ...response });
    }
  }

  currentScore(): number {
    return this.response()?.calculatedScore || 0;
  }

  completionPercentage(): number {
    const form = this.form();
    if (!form) return 0;

    const requiredQuestions = form.questions.filter(q => q.required);
    const answeredRequired = requiredQuestions.filter(q => {
      const answer = this.answers().find(a => a.questionId === q.id);
      return answer && answer.value !== '' && answer.value !== undefined;
    });

    if (requiredQuestions.length === 0) return 100;
    return Math.round((answeredRequired.length / requiredQuestions.length) * 100);
  }

  canSubmit(): boolean {
    return this.completionPercentage() === 100;
  }

  getFormTypeClass(): string {
    const type = this.form()?.type;
    if (type === 'self') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (type === 'manager') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  }

  getFormTypeLabel(): string {
    const type = this.form()?.type;
    if (type === 'self') return 'خودارزیابی';
    if (type === 'manager') return 'ارزیابی مدیر';
    return 'ارزیابی همکار';
  }

  getRatingButtonClass(questionId: string, rating: number): string {
    const currentValue = this.getAnswerValue(questionId);
    if (currentValue === rating) {
      return 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105';
    }
    return 'bg-surface border-border dark:border-slate-600 text-foreground dark:text-slate-200 hover:border-primary/50';
  }

  getOptionClass(questionId: string, optionValue: number): string {
    const currentValue = this.getAnswerValue(questionId);
    if (currentValue === optionValue) {
      return 'bg-primary/5 border-primary dark:border-primary';
    }
    return 'border-border dark:border-slate-600 hover:border-primary/50 dark:hover:border-primary/50';
  }

  getScoreColorClass(): string {
    const score = this.currentScore();
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  }

  getScoreTextClass(): string {
    const score = this.currentScore();
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  }

  saveAsDraft(): void {
    const response = this.response();
    if (response) {
      response.status = 'draft';
      response.answers = this.answers();
      this.dataService.saveEvaluationResponse(response);
      this.showNotification('info', 'ارزیابی به صورت موقت ذخیره شد.');
    }
  }

  submitFinal(): void {
    if (!this.canSubmit()) {
      this.showNotification('error', 'لطفاً تمام سوالات اجباری را پاسخ دهید.');
      return;
    }

    const response = this.response();
    if (response) {
      response.status = 'submitted';
      response.submittedAt = new Date().toISOString();
      response.answers = this.answers();
      this.dataService.saveEvaluationResponse(response);

      if (this.form()?.type === 'manager' || this.form()?.type === 'peer') {
        const pendingId = this.route.snapshot.paramMap.get('id');
        if (pendingId) {
          this.dataService.removePendingEvaluation(pendingId);
        }
      }

      this.showNotification('success', 'ارزیابی با موفقیت ثبت شد!');

      setTimeout(() => {
        this.router.navigate(['/evaluation']);
      }, 1500);
    }
  }

  goBack(): void {
    this.location.back();
  }
}
import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { KnowledgeService, Article, ArticleCategory, ArticleStatus } from '../../core/knowledge/knowledge.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { ExportService } from '../../core/export/export.service';

@Component({
  selector: 'app-knowledge',
  standalone: true,
  imports: [FormsModule, IconComponent, EscToCloseDirective],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="book-marked" [size]="36" class="text-cyan-500"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">مدیریت دانش</h1>
            <p class="text-lg text-muted">پایگاه مقالات و مستندات</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button type="button" (click)="openAddModal()" class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
            <ui-icon name="plus" [size]="20"></ui-icon>
            مقاله جدید
          </button>
          <button type="button" (click)="exportData()" class="px-5 py-3 bg-success text-white rounded-xl hover:bg-success/90 transition-colors font-bold flex items-center gap-2 shadow-sm">
            <ui-icon name="download" [size]="20"></ui-icon>
            خروجی
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ toFa(stats().published) }}</p>
          <p class="text-xs text-muted mt-1">مقالات منتشر شده</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-info">{{ toFa(stats().totalViews) }}</p>
          <p class="text-xs text-muted mt-1">کل بازدیدها</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-primary">{{ toFa(stats().totalLikes) }}</p>
          <p class="text-xs text-muted mt-1">کل پسندها</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-success">{{ toFa(stats().totalComments) }}</p>
          <p class="text-xs text-muted mt-1">نظرات</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-warning">{{ toFa(stats().categories) }}</p>
          <p class="text-xs text-muted mt-1">دسته‌بندی‌ها</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700 text-center">
          <p class="text-2xl font-bold text-muted">{{ toFa(stats().drafts) }}</p>
          <p class="text-xs text-muted mt-1">پیش‌نویس</p>
        </div>
      </div>

      <!-- Search & Filter -->
      <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
        <div class="flex flex-col md:flex-row gap-3">
          <div class="flex-1">
            <input type="text" [(ngModel)]="searchQuery" placeholder="جستجو در مقالات..." class="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
          </div>
          <select [(ngModel)]="filterCategory" class="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
            <option value="all">همه دسته‌ها</option>
            <option value="hr-policy">سیاست‌های HR</option>
            <option value="technical">فنی</option>
            <option value="onboarding">آنبوردینگ</option>
            <option value="compliance">انطباق</option>
            <option value="process">فرآیند</option>
            <option value="faq">سوالات متداول</option>
            <option value="news">اخبار</option>
          </select>
        </div>
      </div>

      <!-- Articles List -->
      <div class="space-y-4">
        @if (filteredArticles().length === 0) {
          <div class="bg-surface rounded-xl p-12 border border-border text-center dark:bg-slate-800 dark:border-slate-700">
            <ui-icon name="save" [size]="64" class="mx-auto mb-4 text-muted opacity-50"></ui-icon>
            <p class="text-lg text-muted">مقاله‌ای یافت نشد</p>
          </div>
        }
        @for (article of filteredArticles(); track article.id) {
          <div class="bg-surface rounded-2xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer" (click)="openDetailModal(article)">
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span [class]="kbService.getCategoryBadgeClass(article.category)" class="px-2 py-0.5 rounded-md text-[10px] font-bold">{{ kbService.getCategoryLabel(article.category) }}</span>
                  <span [class]="kbService.getStatusBadgeClass(article.status)" class="px-2 py-0.5 rounded-md text-[10px] font-bold">{{ kbService.getStatusLabel(article.status) }}</span>
                </div>
                <h3 class="text-base font-bold text-foreground dark:text-slate-100 mb-1 group-hover:text-primary transition-colors">{{ article.title }}</h3>
                <p class="text-sm text-muted line-clamp-2">{{ article.summary }}</p>
                <div class="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted">
                  <span class="flex items-center gap-1"><ui-icon name="user" [size]="12"></ui-icon>{{ article.authorName }}</span>
                  <span class="flex items-center gap-1"><ui-icon name="calendar" [size]="12"></ui-icon><span>{{ toFa(article.createdAt) }}</span></span>
                  <span class="flex items-center gap-1"><ui-icon name="eye" [size]="12"></ui-icon>{{ toFa(article.views) }}</span>
                  <span class="flex items-center gap-1 text-primary"><ui-icon name="zap" [size]="12"></ui-icon>{{ toFa(article.likes) }}</span>
                  @if (article.comments.length > 0) {
                    <span class="flex items-center gap-1"><ui-icon name="message-circle" [size]="12"></ui-icon>{{ toFa(article.comments.length) }}</span>
                  }
                </div>
                @if (article.tags.length > 0) {
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    @for (tag of article.tags; track tag) {
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary">{{ tag }}</span>
                    }
                  </div>
                }
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button type="button" (click)="likeArticle(article.id); $event.stopPropagation()" class="p-2 rounded-lg hover:bg-primary/10 transition-colors" title="پسندیدن">
                  <ui-icon name="zap" [size]="16" class="text-primary"></ui-icon>
                </button>
                <button type="button" (click)="deleteArticle(article.id); $event.stopPropagation()" class="p-2 rounded-lg hover:bg-danger/10 transition-colors" title="حذف">
                  <ui-icon name="trash-2" [size]="16" class="text-muted hover:text-danger"></ui-icon>
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Detail Modal -->
      @if (detailArticle()) {
        <div appEscToClose (escPressed)="closeDetailModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeDetailModal()">
          <div class="bg-surface w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[85vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1 ml-3">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span [class]="kbService.getCategoryBadgeClass(detailArticle()!.category)" class="px-2 py-0.5 rounded-md text-[10px] font-bold">{{ kbService.getCategoryLabel(detailArticle()!.category) }}</span>
                    <span class="text-xs text-muted">{{ toFa(detailArticle()!.createdAt) }}</span>
                  </div>
                  <h2 class="text-lg font-bold text-foreground dark:text-slate-100 truncate">{{ detailArticle()!.title }}</h2>
                </div>
                <button type="button" (click)="closeDetailModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700 flex-shrink-0" aria-label="بستن"><ui-icon name="x" [size]="18" class="text-muted"></ui-icon></button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
              <div class="flex items-center gap-3 text-xs text-muted">
                <span class="flex items-center gap-1"><ui-icon name="user" [size]="12"></ui-icon>{{ detailArticle()!.authorName }}</span>
                <span class="flex items-center gap-1"><ui-icon name="eye" [size]="12"></ui-icon>{{ toFa(detailArticle()!.views) }} بازدید</span>
                <span class="flex items-center gap-1 text-primary"><ui-icon name="zap" [size]="12"></ui-icon>{{ toFa(detailArticle()!.likes) }} پسند</span>
              </div>
              <div class="prose prose-sm max-w-none text-foreground dark:text-slate-200 leading-relaxed whitespace-pre-line">{{ detailArticle()!.content }}</div>
              @if (detailArticle()!.comments.length > 0) {
                <div class="border-t border-border dark:border-slate-700 pt-4">
                  <h3 class="text-sm font-bold text-foreground mb-3 dark:text-slate-100">نظرات ({{ toFa(detailArticle()!.comments.length) }})</h3>
                  <div class="space-y-2">
                    @for (comment of detailArticle()!.comments; track comment.id) {
                      <div class="p-3 bg-background rounded-lg dark:bg-slate-900">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-bold text-foreground dark:text-slate-200">{{ comment.authorName }}</span>
                          <span class="text-[10px] text-muted">{{ toFa(comment.createdAt) }}</span>
                        </div>
                        <p class="text-xs text-muted">{{ comment.content }}</p>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
              <button type="button" (click)="closeDetailModal()" class="w-full py-2.5 border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">بستن</button>
            </div>
          </div>
        </div>
      }

      <!-- Add Article Modal -->
      @if (isModalOpen()) {
        <div appEscToClose (escPressed)="closeModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeModal()">
          <div class="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">افزودن مقاله جدید</h2>
                <button type="button" (click)="closeModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="بستن"><ui-icon name="x" [size]="18" class="text-muted"></ui-icon></button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">عنوان *</label>
                <input type="text" [(ngModel)]="formData.title" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="عنوان مقاله">
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">خلاصه *</label>
                <textarea [(ngModel)]="formData.summary" rows="2" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="خلاصه کوتاه مقاله..."></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">متن کامل *</label>
                <textarea [(ngModel)]="formData.content" rows="4" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="متن کامل مقاله..."></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">دسته‌بندی *</label>
                  <select [(ngModel)]="formData.category" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="hr-policy">سیاست‌های HR</option>
                    <option value="technical">فنی</option>
                    <option value="onboarding">آنبوردینگ</option>
                    <option value="compliance">انطباق</option>
                    <option value="process">فرآیند</option>
                    <option value="faq">سوالات متداول</option>
                    <option value="news">اخبار</option>
                    <option value="other">سایر</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">وضعیت</label>
                  <select [(ngModel)]="formData.status" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="published">منتشر شده</option>
                    <option value="draft">پیش‌نویس</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">برچسب‌ها (با کاما جدا کنید)</label>
                <input type="text" [(ngModel)]="formData.tagsInput" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="مرخصی، قانون کار، حقوق">
              </div>
            </div>
            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex gap-3">
                <button type="button" (click)="closeModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">انصراف</button>
                <button type="button" (click)="saveArticle()" class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-sm flex items-center justify-center gap-2">
                  <ui-icon name="save" [size]="16"></ui-icon>
                  ذخیره مقاله
                </button>
              </div>
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
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `]
})
export class KnowledgeComponent {
  kbService = inject(KnowledgeService);
  private toastService = inject(ToastService);
  private exportService = inject(ExportService);

  stats = this.kbService.stats;

  searchQuery = '';
  filterCategory: 'all' | ArticleCategory = 'all';
  isModalOpen = signal(false);
  detailArticle = signal<Article | null>(null);

  formData = {
    title: '',
    summary: '',
    content: '',
    category: 'hr-policy' as ArticleCategory,
    status: 'published' as ArticleStatus,
    tagsInput: ''
  };

  filteredArticles = computed(() => {
    let result = this.kbService.publishedArticles();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q)));
    }
    if (this.filterCategory !== 'all') result = result.filter(a => a.category === this.filterCategory);
    return result;
  });

  openAddModal(): void {
    this.formData = { title: '', summary: '', content: '', category: 'hr-policy', status: 'published', tagsInput: '' };
    this.isModalOpen.set(true);
  }

  closeModal(): void { this.isModalOpen.set(false); }

  openDetailModal(article: Article): void {
    this.kbService.incrementView(article.id);
    this.detailArticle.set(article);
  }

  closeDetailModal(): void { this.detailArticle.set(null); }

  saveArticle(): void {
    if (!this.formData.title.trim() || !this.formData.summary.trim() || !this.formData.content.trim()) {
      this.toastService.show('عنوان، خلاصه و متن مقاله الزامی هستند.', 'error');
      return;
    }
    const tags = this.formData.tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    this.kbService.addArticle({
      title: this.formData.title,
      summary: this.formData.summary,
      content: this.formData.content,
      category: this.formData.category,
      status: this.formData.status,
      authorName: 'علی احمدی',
      department: 'فناوری اطلاعات',
      tags
    });
    this.toastService.show('مقاله با موفقیت ذخیره شد.', 'success');
    this.closeModal();
  }

  deleteArticle(id: string): void {
    this.kbService.deleteArticle(id);
    this.toastService.show('مقاله حذف شد.', 'success');
  }

  likeArticle(id: string): void {
    this.kbService.likeArticle(id);
  }

  exportData(): void {
    const data = this.kbService.publishedArticles().map(a => ({
      'عنوان': a.title, 'دسته': this.kbService.getCategoryLabel(a.category),
      'نویسنده': a.authorName, 'تاریخ': a.createdAt, 'بازدید': a.views,
      'پسند': a.likes, 'نظرات': a.comments.length, 'برچسب‌ها': a.tags.join('، ')
    }));
    this.exportService.exportToCSV(data, 'knowledge-base-report');
  }

  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }
}
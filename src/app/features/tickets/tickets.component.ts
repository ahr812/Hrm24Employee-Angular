import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ExportService } from '../../core/export/export.service';

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: string;
  senderRole: 'user' | 'support';
  content: string;
  attachment?: string;
  rating?: number;
  createdAt: string;
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  action: 'created' | 'status_changed' | 'priority_changed' | 'assigned' | 'message_sent' | 'rated' | 'edited' | 'attachment_added';
  description: string;
  actor: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignee: string | null;
  slaDeadline: string;
  satisfactionRating: number | null;
  attachments: string[];
  messages: TicketMessage[];
  activities: TicketActivity[];
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, EscToCloseDirective],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="ticket" [size]="36" class="text-violet-500"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">تیکت‌ها</h1>
            <p class="text-lg text-muted">ثبت و پیگیری تیکت‌ها</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button type="button" (click)="openAddModal()" class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
            <ui-icon name="plus" [size]="20"></ui-icon>
            تیکت جدید
          </button>
          <button type="button" (click)="exportData()" class="px-5 py-3 bg-success text-white rounded-xl hover:bg-success/90 transition-colors font-bold flex items-center gap-2 shadow-sm">
            <ui-icon name="download" [size]="20"></ui-icon>
            خروجی
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-muted">کل تیکت‌ها</span>
            <ui-icon name="ticket" [size]="18" class="text-primary"></ui-icon>
          </div>
          <p class="text-2xl font-bold text-foreground dark:text-slate-100">{{ toFa(tickets().length) }}</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-muted">باز</span>
            <ui-icon name="alert-circle" [size]="18" class="text-warning"></ui-icon>
          </div>
          <p class="text-2xl font-bold text-warning">{{ toFa(getCount('open')) }}</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-muted">در حال بررسی</span>
            <ui-icon name="activity" [size]="18" class="text-info"></ui-icon>
          </div>
          <p class="text-2xl font-bold text-info">{{ toFa(getCount('in-progress')) }}</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-muted">حل شده</span>
            <ui-icon name="check-circle" [size]="18" class="text-success"></ui-icon>
          </div>
          <p class="text-2xl font-bold text-success">{{ toFa(getCount('resolved') + getCount('closed')) }}</p>
        </div>
        <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-muted">نقض مهلت پاسخگویی</span>
            <ui-icon name="alert-triangle" [size]="18" class="text-danger"></ui-icon>
          </div>
          <p class="text-2xl font-bold text-danger">{{ toFa(slaBreachedCount()) }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-surface rounded-xl p-4 border border-border dark:bg-slate-800 dark:border-slate-700">
        <div class="flex flex-col md:flex-row gap-3">
          <div class="flex-1 relative">
            <ui-icon name="search" [size]="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
            <input type="text" [(ngModel)]="searchQuery" placeholder="جستجو در عنوان و شرح تیکت‌ها..." class="w-full pr-10 pl-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
          </div>
          <select [(ngModel)]="filterStatus" class="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <option value="all">همه وضعیت‌ها</option>
            <option value="open">باز</option>
            <option value="in-progress">در حال بررسی</option>
            <option value="resolved">حل شده</option>
            <option value="closed">بسته شده</option>
          </select>
          <select [(ngModel)]="filterPriority" class="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <option value="all">همه اولویت‌ها</option>
            <option value="critical">بحرانی</option>
            <option value="high">بالا</option>
            <option value="medium">متوسط</option>
            <option value="low">پایین</option>
          </select>
          <select [(ngModel)]="filterCategory" class="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <option value="all">همه دسته‌ها</option>
            <option value="فنی">فنی</option>
            <option value="مالی">مالی</option>
            <option value="اداری">اداری</option>
            <option value="نرم‌افزار">نرم‌افزار</option>
            <option value="سخت‌افزار">سخت‌افزار</option>
            <option value="حقوقی">حقوقی</option>
            <option value="منابع انسانی">منابع انسانی</option>
            <option value="سایر">سایر</option>
          </select>
        </div>
      </div>

      <!-- Tickets List -->
      <div class="space-y-3">
        @if (displayedTickets().length === 0) {
          <div class="bg-surface rounded-xl p-12 border border-border text-center dark:bg-slate-800 dark:border-slate-700">
            <ui-icon name="ticket" [size]="64" class="mx-auto mb-4 text-muted opacity-50"></ui-icon>
            <p class="text-lg text-muted mb-2">تیکتی یافت نشد</p>
            <p class="text-sm text-muted">اولین تیکت خود را ثبت کنید یا فیلترها را تغییر دهید</p>
          </div>
        }
        @for (ticket of displayedTickets(); track ticket.id) {
          <a [routerLink]="['/tickets', ticket.id]" class="block bg-surface rounded-xl p-5 border border-border dark:bg-slate-800 dark:border-slate-700 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group">
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <img [src]="getAvatar(ticket.createdBy)" alt="{{ ticket.createdBy }}" class="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2 mb-2">
                    <h3 class="text-base font-bold text-foreground dark:text-slate-100 group-hover:text-primary transition-colors">{{ ticket.title }}</h3>
                    <span [class]="getStatusBadgeClass(ticket.status)" class="px-2 py-0.5 rounded-md text-xs font-bold">{{ getStatusLabel(ticket.status) }}</span>
                    <span [class]="getPriorityBadgeClass(ticket.priority)" class="px-2 py-0.5 rounded-md text-xs font-bold">{{ getPriorityLabel(ticket.priority) }}</span>
                    @if (isSlaBreached(ticket)) {
                      <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-danger/10 text-danger animate-pulse">⏰ مهلت پاسخگویی نقض شده</span>
                    }
                  </div>
                  <p class="text-sm text-muted line-clamp-2">{{ ticket.description }}</p>
                </div>
              </div>
              @if (ticket.satisfactionRating) {
                <div class="flex items-center gap-0.5 flex-shrink-0">
                  @for (star of [1,2,3,4,5]; track star) {
                    <ui-icon name="star" [size]="14" [class]="star <= ticket.satisfactionRating! ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'"></ui-icon>
                  }
                </div>
              }
            </div>
            <div class="flex flex-wrap items-center gap-3 text-xs text-muted mr-[52px]">
              <span class="flex items-center gap-1">
                <img [src]="getAvatar(ticket.createdBy)" alt="" class="w-4 h-4 rounded-full object-cover">
                {{ ticket.createdBy }}
              </span>
              @if (ticket.assignee) {
                <span class="flex items-center gap-1 text-primary">
                  <ui-icon name="user" [size]="12"></ui-icon>
                  واگذار به: {{ ticket.assignee }}
                </span>
              }
              <span class="flex items-center gap-1">
                <ui-icon name="sliders" [size]="12"></ui-icon>
                {{ ticket.category }}
              </span>
              <span class="flex items-center gap-1">
                <ui-icon name="calendar" [size]="12"></ui-icon>
                {{ toFa(ticket.createdAt) }}
              </span>
              <span class="flex items-center gap-1">
                <ui-icon name="message-square" [size]="12"></ui-icon>
                {{ toFa(ticket.messages.length) }} پیام
              </span>
              @if (ticket.attachments.length > 0) {
                <span class="flex items-center gap-1">
                  <ui-icon name="download" [size]="12"></ui-icon>
                  {{ toFa(ticket.attachments.length) }} پیوست
                </span>
              }
            </div>
          </a>
        }
      </div>

      <!-- Add Ticket Modal -->
      @if (isModalOpen()) {
        <div appEscToClose (escPressed)="closeModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeModal()">
          <div class="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden dark:bg-slate-800 border border-border dark:border-slate-700 animate-scale-in max-h-[85vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-4 md:p-5 border-b border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">تیکت جدید</h2>
                <button type="button" (click)="closeModal()" class="p-1.5 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="بستن"><ui-icon name="x" [size]="18" class="text-muted"></ui-icon></button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">عنوان تیکت *</label>
                <input type="text" [(ngModel)]="formData.title" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="مثال: مشکل در ورود به سیستم">
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">شرح مشکل *</label>
                <textarea [(ngModel)]="formData.description" rows="3" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm" placeholder="جزئیات مشکل را توضیح دهید..."></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">اولویت</label>
                  <select [(ngModel)]="formData.priority" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="low">پایین</option>
                    <option value="medium">متوسط</option>
                    <option value="high">بالا</option>
                    <option value="critical">بحرانی</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">دسته‌بندی</label>
                  <select [(ngModel)]="formData.category" class="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                    <option value="فنی">فنی</option>
                    <option value="مالی">مالی</option>
                    <option value="اداری">اداری</option>
                    <option value="نرم‌افزار">نرم‌افزار</option>
                    <option value="سخت‌افزار">سخت‌افزار</option>
                    <option value="حقوقی">حقوقی</option>
                    <option value="منابع انسانی">منابع انسانی</option>
                    <option value="سایر">سایر</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">پیوست (اختیاری)</label>
                <div class="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer" (click)="simulateAttachment()">
                  @if (formData.attachmentName) {
                    <div class="flex items-center justify-center gap-2 text-primary">
                      <ui-icon name="check-circle" [size]="20"></ui-icon>
                      <span class="text-sm font-bold">{{ formData.attachmentName }}</span>
                    </div>
                  } @else {
                    <div class="flex flex-col items-center gap-1 text-muted">
                      <ui-icon name="download" [size]="24"></ui-icon>
                      <span class="text-xs">کلیک برای انتخاب فایل</span>
                    </div>
                  }
                </div>
              </div>
            </div>
            <div class="p-4 md:p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
              <div class="flex gap-3">
                <button type="button" (click)="closeModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">انصراف</button>
                <button type="button" (click)="saveTicket()" class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-sm">ثبت تیکت</button>
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
  `]
})
export class TicketsComponent {
  private toastService = inject(ToastService);
  private exportService = inject(ExportService);
  private router = inject(Router);

  tickets = signal<Ticket[]>(this.loadTickets());

  searchQuery = '';
  filterStatus: 'all' | 'open' | 'in-progress' | 'resolved' | 'closed' = 'all';
  filterPriority: 'all' | 'low' | 'medium' | 'high' | 'critical' = 'all';
  filterCategory = 'all';

  isModalOpen = signal(false);

  formData = {
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    category: 'فنی',
    attachmentName: ''
  };

  private knownAvatars: Record<string, string> = {
    'علی احمدی': 'images/avatar3.jpg',
    'مهندس رضایی': 'images/avatar6.jpg',
    'خانم محمدی': 'images/avatar5.jpg',
    'رضا کریمی': 'images/avatar4.jpg',
    'پشتیبانی فنی': 'images/avatar6.jpg',
    'پشتیبانی مالی': 'images/avatar5.jpg'
  };

  private femaleKeywords = ['خانم', 'فاطمه', 'زهرا', 'مریم', 'سارا', 'نازنین', 'نگار', 'مینا', 'لیلا', 'نسرین', 'آزاده', 'شبنم', 'الهه', 'پریسا', 'سمیه', 'مهسا', 'نیلوفر', 'رویا', 'هدیه', 'الهام', 'بانو'];
  private maleAvatars = ['images/avatar3.jpg', 'images/avatar4.jpg', 'images/avatar6.jpg'];
  private femaleAvatars = ['images/avatar5.jpg'];

  getAvatar(name: string): string {
    if (this.knownAvatars[name]) return this.knownAvatars[name];
    const isFemale = this.femaleKeywords.some(kw => name.includes(kw));
    const hash = this.simpleHash(name);
    return isFemale ? this.femaleAvatars[hash % this.femaleAvatars.length] : this.maleAvatars[hash % this.maleAvatars.length];
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
    return Math.abs(hash);
  }

  displayedTickets = computed(() => {
    let result = this.tickets();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (this.filterStatus !== 'all') result = result.filter(t => t.status === this.filterStatus);
    if (this.filterPriority !== 'all') result = result.filter(t => t.priority === this.filterPriority);
    if (this.filterCategory !== 'all') result = result.filter(t => t.category === this.filterCategory);
    return result;
  });

  slaBreachedCount = computed(() => this.tickets().filter(t => this.isSlaBreached(t)).length);

  isSlaBreached(ticket: Ticket): boolean {
    if (ticket.status === 'resolved' || ticket.status === 'closed') return false;
    // تبدیل تاریخ شمسی SLA به میلادی برای مقایسه
    const parts = ticket.slaDeadline.split('/');
    if (parts.length !== 3) return false;
    const jy = parseInt(parts[0].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()));
    const jm = parseInt(parts[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()));
    const jd = parseInt(parts[2].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()));
    const g = this.jalaliToGregorian(jy, jm, jd);
    return new Date() > new Date(g.gy, g.gm - 1, g.gd);
  }

  private loadTickets(): Ticket[] {
    if (typeof localStorage === 'undefined') return this.getDefaultTickets();
    try {
      const stored = localStorage.getItem('hrm24_tickets_v2');
      return stored ? JSON.parse(stored) : this.getDefaultTickets();
    } catch { return this.getDefaultTickets(); }
  }

  saveTickets(): void {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem('hrm24_tickets_v2', JSON.stringify(this.tickets())); } catch { }
  }

  private getDefaultTickets(): Ticket[] {
    return [
      {
        id: 'ticket-1', title: 'مشکل در ورود به سامانه',
        description: 'پس از وارد کردن رمز عبور، صفحه خطا نمایش داده می‌شود. این مشکل از دیروز شروع شده و با پاک کردن کش مرورگر هم حل نشد.',
        status: 'open', priority: 'high', category: 'فنی',
        createdAt: '۱۴۰۳/۰۸/۱۸', updatedAt: '۱۴۰۳/۰۸/۱۸', createdBy: 'علی احمدی', assignee: null, slaDeadline: '۱۴۰۳/۰۸/۲۰',
        satisfactionRating: null, attachments: [],
        messages: [{ id: 'msg-1', ticketId: 'ticket-1', sender: 'علی احمدی', senderRole: 'user', content: 'لطفاً سریعاً بررسی شود. کار من متوقف شده است.', createdAt: '۱۴۰۳/۰۸/۱۸' }],
        activities: [{ id: 'act-1', ticketId: 'ticket-1', action: 'created', description: 'تیکت ایجاد شد', actor: 'علی احمدی', createdAt: '۱۴۰۳/۰۸/۱۸' }]
      },
      {
        id: 'ticket-2', title: 'درخواست تغییر شماره حساب',
        description: 'لطفاً شماره حساب بانکی من را بروزرسانی کنید. شماره جدید: ۶۱۰۴-۳۳۷۸-XXXX-XXXX',
        status: 'in-progress', priority: 'medium', category: 'مالی',
        createdAt: '۱۴۰۳/۰۸/۱۵', updatedAt: '۱۴۰۳/۰۸/۱۷', createdBy: 'خانم محمدی', assignee: 'پشتیبانی مالی', slaDeadline: '۱۴۰۳/۰۸/۲۲',
        satisfactionRating: null, attachments: ['فرم_تغییر_حساب.pdf'],
        messages: [
          { id: 'msg-2', ticketId: 'ticket-2', sender: 'خانم محمدی', senderRole: 'user', content: 'شماره حساب جدیدم را ارسال کردم.', createdAt: '۱۴۰۳/۰۸/۱۵' },
          { id: 'msg-3', ticketId: 'ticket-2', sender: 'پشتیبانی مالی', senderRole: 'support', content: 'درخواست شما دریافت شد. در حال بررسی هستیم.', createdAt: '۱۴۰۳/۰۸/۱۶' },
          { id: 'msg-4', ticketId: 'ticket-2', sender: 'خانم محمدی', senderRole: 'user', content: 'ممنون از پیگیری.', createdAt: '۱۴۰۳/۰۸/۱۷', rating: 4 }
        ],
        activities: [
          { id: 'act-2', ticketId: 'ticket-2', action: 'created', description: 'تیکت ایجاد شد', actor: 'خانم محمدی', createdAt: '۱۴۰۳/۰۸/۱۵' },
          { id: 'act-3', ticketId: 'ticket-2', action: 'assigned', description: 'واگذار شد به: پشتیبانی مالی', actor: 'سیستم', createdAt: '۱۴۰۳/۰۸/۱۵' },
          { id: 'act-4', ticketId: 'ticket-2', action: 'status_changed', description: 'وضعیت تغییر کرد: باز → در حال بررسی', actor: 'پشتیبانی مالی', createdAt: '۱۴۰۳/۰۸/۱۶' }
        ]
      },
      {
        id: 'ticket-3', title: 'عدم نمایش فیش حقوقی',
        description: 'فیش حقوقی ماه مهر قابل دانلود نیست. دکمه دانلود کار نمی‌کند.',
        status: 'resolved', priority: 'medium', category: 'نرم‌افزار',
        createdAt: '۱۴۰۳/۰۸/۱۰', updatedAt: '۱۴۰۳/۰۸/۱۲', createdBy: 'رضا کریمی', assignee: 'پشتیبانی فنی', slaDeadline: '۱۴۰۳/۰۸/۱۷',
        satisfactionRating: 5, attachments: ['screenshot_error.png'],
        messages: [
          { id: 'msg-5', ticketId: 'ticket-3', sender: 'رضا کریمی', senderRole: 'user', content: 'اسکرین‌شات خطا پیوست شد.', createdAt: '۱۴۰۳/۰۸/۱۰' },
          { id: 'msg-6', ticketId: 'ticket-3', sender: 'پشتیبانی فنی', senderRole: 'support', content: 'مشکل شناسایی و رفع شد. لطفاً دوباره تلاش کنید.', createdAt: '۱۴۰۳/۰۸/۱۱' },
          { id: 'msg-7', ticketId: 'ticket-3', sender: 'رضا کریمی', senderRole: 'user', content: 'بله درست شد. ممنون از سرعت عمل!', createdAt: '۱۴۰۳/۰۸/۱۲', rating: 5 }
        ],
        activities: [
          { id: 'act-5', ticketId: 'ticket-3', action: 'created', description: 'تیکت ایجاد شد', actor: 'رضا کریمی', createdAt: '۱۴۰۳/۰۸/۱۰' },
          { id: 'act-6', ticketId: 'ticket-3', action: 'assigned', description: 'واگذار شد به: پشتیبانی فنی', actor: 'سیستم', createdAt: '۱۴۰۳/۰۸/۱۰' },
          { id: 'act-7', ticketId: 'ticket-3', action: 'status_changed', description: 'وضعیت تغییر کرد: باز → در حال بررسی', actor: 'پشتیبانی فنی', createdAt: '۱۴۰۳/۰۸/۱۱' },
          { id: 'act-8', ticketId: 'ticket-3', action: 'status_changed', description: 'وضعیت تغییر کرد: در حال بررسی → حل شده', actor: 'پشتیبانی فنی', createdAt: '۱۴۰۳/۰۸/۱۲' },
          { id: 'act-9', ticketId: 'ticket-3', action: 'rated', description: 'امتیاز رضایت: ۵ از ۵', actor: 'رضا کریمی', createdAt: '۱۴۰۳/۰۸/۱۲' }
        ]
      }
    ];
  }

  openAddModal(): void {
    this.formData = { title: '', description: '', priority: 'medium', category: 'فنی', attachmentName: '' };
    this.isModalOpen.set(true);
  }

  closeModal(): void { this.isModalOpen.set(false); }

  simulateAttachment(): void {
    const names = ['گزارش_خطا.pdf', 'screenshot.png', 'لاگ_سیستم.txt', 'مستندات.docx'];
    this.formData.attachmentName = names[Math.floor(Math.random() * names.length)];
  }

  saveTicket(): void {
    if (!this.formData.title.trim() || !this.formData.description.trim()) {
      this.toastService.show('عنوان و شرح تیکت الزامی هستند.', 'error');
      return;
    }
    const now = new Date();
    const dateParts = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    let y = '', m = '', d = '';
    for (const p of dateParts) {
      if (p.type === 'year') y = p.value;
      if (p.type === 'month') m = p.value;
      if (p.type === 'day') d = p.value;
    }
    const todayStr = `${this.toFa(y)}/${this.toFa(m.padStart(2, '0'))}/${this.toFa(d.padStart(2, '0'))}`;

    const slaDays = this.formData.priority === 'critical' ? 1 : this.formData.priority === 'high' ? 2 : this.formData.priority === 'medium' ? 5 : 7;
    const slaDate = new Date(now);
    slaDate.setDate(slaDate.getDate() + slaDays);
    const slaParts = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(slaDate);
    let sy = '', sm = '', sd = '';
    for (const p of slaParts) {
      if (p.type === 'year') sy = p.value;
      if (p.type === 'month') sm = p.value;
      if (p.type === 'day') sd = p.value;
    }
    const slaDeadline = `${this.toFa(sy)}/${this.toFa(sm.padStart(2, '0'))}/${this.toFa(sd.padStart(2, '0'))}`;

    const ticketId = `ticket-${Date.now()}`;
    const newTicket: Ticket = {
      id: ticketId, title: this.formData.title, description: this.formData.description,
      status: 'open', priority: this.formData.priority, category: this.formData.category,
      createdAt: todayStr, updatedAt: todayStr, createdBy: 'علی احمدی', assignee: null,
      slaDeadline, satisfactionRating: null,
      attachments: this.formData.attachmentName ? [this.formData.attachmentName] : [],
      messages: [],
      activities: [{ id: `act-${Date.now()}`, ticketId, action: 'created', description: 'تیکت ایجاد شد', actor: 'علی احمدی', createdAt: todayStr }]
    };
    if (this.formData.attachmentName) {
      newTicket.activities.push({ id: `act-${Date.now()}-att`, ticketId, action: 'attachment_added', description: `پیوست اضافه شد: ${this.formData.attachmentName}`, actor: 'علی احمدی', createdAt: todayStr });
    }
    this.tickets.update(current => [newTicket, ...current]);
    this.saveTickets();
    this.toastService.show('تیکت با موفقیت ثبت شد.', 'success');
    this.closeModal();
  }

  deleteTicket(id: string): void {
    this.tickets.update(current => current.filter(t => t.id !== id));
    this.saveTickets();
    this.toastService.show('تیکت حذف شد.', 'success');
  }

  getCount(status: string): number { return this.tickets().filter(t => t.status === status).length; }

  exportData(): void {
    const data = this.displayedTickets().map(t => ({
      'عنوان': t.title, 'شرح': t.description, 'وضعیت': this.getStatusLabel(t.status),
      'اولویت': this.getPriorityLabel(t.priority), 'دسته‌بندی': t.category,
      'ثبت‌کننده': t.createdBy, 'واگذار شده به': t.assignee || '-',
      'تاریخ ایجاد': t.createdAt, 'تاریخ بروزرسانی': t.updatedAt,
      'مهلت پاسخگویی': t.slaDeadline, 'تعداد پیام': t.messages.length.toString(),
      'امتیاز رضایت': t.satisfactionRating ? t.satisfactionRating.toString() + '/5' : '-'
    }));
    this.exportService.exportToCSV(data, 'tickets-report');
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = { 'open': 'bg-warning/10 text-warning', 'in-progress': 'bg-info/10 text-info', 'resolved': 'bg-success/10 text-success', 'closed': 'bg-muted/10 text-muted' };
    return map[status] || 'bg-muted/10 text-muted';
  }

  getPriorityBadgeClass(priority: string): string {
    const map: Record<string, string> = { 'critical': 'bg-red-600/10 text-red-600 dark:text-red-400', 'high': 'bg-danger/10 text-danger', 'medium': 'bg-warning/10 text-warning', 'low': 'bg-info/10 text-info' };
    return map[priority] || 'bg-muted/10 text-muted';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { 'open': 'باز', 'in-progress': 'در حال بررسی', 'resolved': 'حل شده', 'closed': 'بسته شده' };
    return map[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = { 'critical': 'بحرانی', 'high': 'بالا', 'medium': 'متوسط', 'low': 'پایین' };
    return map[priority] || priority;
  }

  /** تبدیل قطعی تمام ارقام لاتین به فارسی */
  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }

  /** تبدیل شمسی به میلادی برای محاسبات SLA */
  private jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
    let gy = jy + 621;
    let leapJ = -14;
    const jp = jy + 621;
    if (jp < 0) leapJ = -15;
    const jump = Math.floor((jp - 1) / 33) * 8 + Math.floor(((jp - 1) % 33 + 3) / 4);
    const n = jd + (jm <= 6 ? (jm - 1) * 31 : (jm - 1) * 30 + 6);
    const m = jump + n + leapJ;
    let gd = m % 365;
    gy += Math.floor(m / 365);
    if (gd === 0) { gd = 365; gy -= 1; }
    let gm: number;
    if (gd <= 186) { gm = Math.ceil(gd / 31); gd = gd - (gm - 1) * 31; }
    else { gm = Math.ceil((gd - 186) / 30) + 6; gd = gd - 186 - (gm - 7) * 30; }
    return { gy, gm, gd };
  }
}
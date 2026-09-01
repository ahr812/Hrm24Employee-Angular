import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { IranLocalizationService } from '../../core/localization/iran-localization.service';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  relatedLinks?: { label: string; route: string }[];
  helpfulCount: number;
  notHelpfulCount: number;
}

interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  route?: string;
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">

      <!-- Header -->
      <div class="text-center space-y-3">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
          <ui-icon name="life-buoy" [size]="32" class="text-primary"></ui-icon>
        </div>
        <h1 class="text-3xl font-bold text-foreground dark:text-slate-100">مرکز راهنمایی</h1>
        <!-- <p class="text-lg text-muted max-w-xl mx-auto">پاسخ سوالات خود را بیابید یا با تیم پشتیبانی در ارتباط باشید</p> -->
      </div>

      <!-- Search Box -->
      <div class="relative max-w-2xl mx-auto">
        <ui-icon name="search" [size]="22" class="absolute right-4 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          placeholder="جستجو در سوالات متداول..."
          class="w-full pr-14 pl-4 py-4 text-base rounded-2xl border border-border bg-surface dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm">
        @if (searchQuery) {
          <button (click)="searchQuery = ''" class="absolute left-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
            <ui-icon name="x" [size]="18"></ui-icon>
          </button>
        }
      </div>

      <!-- Quick Contact Cards -->
      <!-- <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a routerLink="/tickets" class="group p-5 bg-surface dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl flex items-center gap-4 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer">
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <ui-icon name="ticket" [size]="24" class="text-primary group-hover:text-white"></ui-icon>
          </div>
          <div class="text-right flex-1">
            <p class="font-bold text-foreground dark:text-slate-100">ارسال تیکت پشتیبانی</p>
            <p class="text-xs text-muted mt-0.5">درخواست کتبی ثبت و پیگیری کنید</p>
          </div>
          <ui-icon name="chevron-left" [size]="16" class="text-muted group-hover:text-primary transition-colors"></ui-icon>
        </a>

        <a routerLink="/chat" class="group p-5 bg-surface dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl flex items-center gap-4 hover:shadow-lg hover:border-emerald-500/30 transition-all cursor-pointer">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <ui-icon name="message-circle" [size]="24" class="text-emerald-500 group-hover:text-white"></ui-icon>
          </div>
          <div class="text-right flex-1">
            <p class="font-bold text-foreground dark:text-slate-100">چت آنلاین</p>
            <p class="text-xs text-muted mt-0.5">گفتگوی مستقیم با پشتیبانی</p>
          </div>
          <ui-icon name="chevron-left" [size]="16" class="text-muted group-hover:text-emerald-500 transition-colors"></ui-icon>
        </a>

        <div class="p-5 bg-surface dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <ui-icon name="phone" [size]="24" class="text-amber-500"></ui-icon>
          </div>
          <div class="text-right flex-1">
            <p class="font-bold text-foreground dark:text-slate-100">تماس تلفنی</p>
            <p class="text-xs text-muted mt-0.5">داخلی {{ loc.toPersianNum(102) }} (پشتیبانی)</p>
          </div>
        </div>
      </div> -->

      <!-- Category Filter -->
      <div class="flex flex-wrap gap-2 justify-center">
        <button
          (click)="selectedCategory.set('all')"
          class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
          [class]="selectedCategory() === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface dark:bg-slate-800 border border-border dark:border-slate-700 text-muted hover:text-foreground dark:hover:text-slate-200'">
          همه موضوعات
        </button>
        @for (cat of categories; track cat.id) {
          <button
            (click)="selectedCategory.set(cat.id)"
            class="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            [class]="selectedCategory() === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface dark:bg-slate-800 border border-border dark:border-slate-700 text-muted hover:text-foreground dark:hover:text-slate-200'">
            <ui-icon [name]="cat.icon" [size]="16"></ui-icon>
            {{ cat.title }}
          </button>
        }
      </div>

      <!-- FAQ List -->
      <div class="space-y-3">
        @if (filteredFAQs().length === 0) {
          <div class="text-center py-16 bg-surface dark:bg-slate-800 rounded-2xl border border-dashed border-border dark:border-slate-700">
            <ui-icon name="search" [size]="48" class="text-muted mx-auto mb-4 opacity-40"></ui-icon>
            <p class="text-lg font-bold text-foreground dark:text-slate-100 mb-2">نتیجه‌ای یافت نشد</p>
            <p class="text-sm text-muted mb-4">عبارت دیگری را جستجو کنید یا دسته‌بندی را تغییر دهید</p>
            <a routerLink="/tickets" class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors">
              <ui-icon name="ticket" [size]="16"></ui-icon>
              ارسال تیکت پشتیبانی
            </a>
          </div>
        }

        @for (faq of filteredFAQs(); track faq.id) {
          <div class="bg-surface dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden transition-all duration-300"
               [class.shadow-md]="activeFAQ() === faq.id">
            <!-- Question Header -->
            <button
              (click)="toggleFAQ(faq.id)"
              class="w-full flex items-center gap-4 p-5 text-right hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                   [class]="getCategoryColor(faq.category)">
                <ui-icon [name]="getCategoryIcon(faq.category)" [size]="20"></ui-icon>
              </div>
              <span class="flex-1 text-base font-bold text-foreground dark:text-slate-100">{{ faq.question }}</span>
              <ui-icon
                name="chevron-down"
                [size]="20"
                class="text-muted transition-transform duration-300 flex-shrink-0"
                [class.rotate-180]="activeFAQ() === faq.id">
              </ui-icon>
            </button>

            <!-- Answer Body -->
            @if (activeFAQ() === faq.id) {
              <div class="px-5 pb-5 pt-0 mr-[56px] animate-fade-in">
                <div class="border-t border-border dark:border-slate-700 pt-4">
                  <p class="text-sm leading-relaxed text-foreground dark:text-slate-300">{{ faq.answer }}</p>

                  <!-- Related Links -->
                  @if (faq.relatedLinks && faq.relatedLinks.length > 0) {
                    <div class="mt-4 space-y-2">
                      <p class="text-xs font-bold text-muted">صفحات مرتبط:</p>
                      <div class="flex flex-wrap gap-2">
                        @for (link of faq.relatedLinks; track link.route) {
                          <a [routerLink]="link.route"
                             class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg text-xs font-bold transition-colors">
                            <ui-icon name="external-link" [size]="12"></ui-icon>
                            {{ link.label }}
                          </a>
                        }
                      </div>
                    </div>
                  }

                  <!-- Feedback -->
                  <div class="mt-4 pt-3 border-t border-border dark:border-slate-700 flex items-center justify-between">
                    <span class="text-xs text-muted">آیا این پاسخ مفید بود؟</span>
                    <div class="flex items-center gap-2">
                      <button
                        (click)="markHelpful(faq.id, true)"
                        class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        [class]="userFeedbacks()[faq.id] === 'helpful' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-slate-100 dark:bg-slate-700 text-muted hover:text-emerald-600 dark:hover:text-emerald-400'">
                        <ui-icon name="thumbs-up" [size]="14"></ui-icon>
                        مفید ({{ loc.toPersianNum(faq.helpfulCount) }})
                      </button>
                      <button
                        (click)="markHelpful(faq.id, false)"
                        class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        [class]="userFeedbacks()[faq.id] === 'not-helpful' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                          : 'bg-slate-100 dark:bg-slate-700 text-muted hover:text-red-600 dark:hover:text-red-400'">
                        <ui-icon name="thumbs-down" [size]="14"></ui-icon>
                        غیرمفید ({{ loc.toPersianNum(faq.notHelpfulCount) }})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Quick Navigation Grid -->
      <!-- <div class="pt-6 border-t border-border dark:border-slate-700">
        <h2 class="text-lg font-bold text-foreground dark:text-slate-100 mb-4 flex items-center gap-2">
          <ui-icon name="layout-dashboard" [size]="20" class="text-primary"></ui-icon>
          دسترسی سریع به بخش‌های سامانه
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          @for (cat of categories; track cat.id) {
            <a
              [routerLink]="cat.route || '/dashboard'"
              class="p-4 bg-surface dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl hover:shadow-md hover:border-primary/30 transition-all group text-center">
              <div class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                   [class]="cat.color">
                <ui-icon [name]="cat.icon" [size]="20"></ui-icon>
              </div>
              <p class="text-sm font-bold text-foreground dark:text-slate-100 group-hover:text-primary transition-colors">{{ cat.title }}</p>
              <p class="text-[10px] text-muted mt-0.5 line-clamp-1">{{ cat.description }}</p>
            </a>
          }
        </div>
      </div> -->

      <!-- Footer Info -->
      <div class="text-center pt-6 border-t border-border dark:border-slate-700">
        <p class="text-xs text-muted">
          آخرین بروزرسانی: {{ loc.getCurrentPersianDate() }} •
          تعداد راهنما: {{ loc.toPersianNum(faqs.length) }} •
          نسخه سامانه: {{ loc.toPersianNum(1) }}.{{ loc.toPersianNum(0) }}.{{ loc.toPersianNum(0) }}
        </p>
      </div>

    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.25s ease-out forwards; }
    @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
  `]
})
export class HelpComponent {
  protected loc = inject(IranLocalizationService);
  private router = inject(Router);

  searchQuery = '';
  activeFAQ = signal<number | null>(null);
  selectedCategory = signal<string>('all');
  userFeedbacks = signal<Record<number, 'helpful' | 'not-helpful'>>({});

  categories: HelpCategory[] = [
    { id: 'account', title: 'حساب کاربری', icon: 'user', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', description: 'ورود، رمز عبور، پروفایل', route: '/profile' },
    { id: 'payslip', title: 'حقوق و دستمزد', icon: 'wallet', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', description: 'فیش حقوقی، وام، مساعده', route: '/payslip' },
    { id: 'leave', title: 'مرخصی و حضور', icon: 'calendar-check', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', description: 'درخواست مرخصی، تردد', route: '/leave' },
    { id: 'evaluation', title: 'ارزیابی عملکرد', icon: 'target', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', description: 'ارزیابی ۳۶۰ درجه، تحلیل AI', route: '/evaluation' },
    { id: 'tickets', title: 'تیکت و پشتیبانی', icon: 'ticket', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', description: 'ثبت و پیگیری درخواست‌ها', route: '/tickets' },
    { id: 'system', title: 'سامانه', icon: 'settings', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400', description: 'تنظیمات، اعلان‌ها، تقویم', route: '/notifications' }
  ];

  faqs: FAQItem[] = [
    {
      id: 1,
      question: 'چگونه وارد سامانه شوم؟',
      answer: 'در صفحه ورود، شماره موبایل خود را وارد کنید و دکمه «دریافت کد تأیید» را بزنید. کد ۵ رقمی ارسال شده را وارد نمایید تا وارد سامانه شوید.',
      category: 'account',
      relatedLinks: [{ label: 'صفحه ورود', route: '/login' }],
      helpfulCount: 45,
      notHelpfulCount: 3
    },
    {
      id: 2,
      question: 'رمز عبورم را فراموش کرده‌ام، چه کار کنم؟',
      answer: 'ورود به سامانه از طریق شماره موبایل و کد تأیید پیامکی انجام می‌شود. نیازی به رمز عبور نیست. کافی است شماره موبایل ثبت‌شده خود را وارد کنید.',
      category: 'account',
      relatedLinks: [{ label: 'صفحه ورود', route: '/login' }, { label: 'پروفایل', route: '/profile' }],
      helpfulCount: 62,
      notHelpfulCount: 5
    },
    {
      id: 3,
      question: 'چگونه اطلاعات پروفایل خود را ویرایش کنم؟',
      answer: 'از منوی سمت راست روی «پروفایل» کلیک کنید. در صفحه پروفایل می‌توانید نام، ایمیل، شماره موبایل و سایر اطلاعات شخصی خود را ویرایش و ذخیره نمایید.',
      category: 'account',
      relatedLinks: [{ label: 'صفحه پروفایل', route: '/profile' }],
      helpfulCount: 28,
      notHelpfulCount: 2
    },
    {
      id: 4,
      question: 'فیش حقوقی من کی صادر می‌شود؟',
      answer: 'فیش حقوقی هر ماه معمولاً در روزهای پایانی ماه صادر می‌شود. پس از صدور، از طریق بخش «فیش حقوقی» قابل مشاهده و دانلود است. همچنین اعلان صدور فیش از طریق نوتیفیکیشن سامانه اطلاع‌رسانی می‌شود.',
      category: 'payslip',
      relatedLinks: [{ label: 'مشاهده فیش حقوقی', route: '/payslip' }, { label: 'اعلان‌ها', route: '/notifications' }],
      helpfulCount: 89,
      notHelpfulCount: 4
    },
    {
      id: 5,
      question: 'چگونه فیش حقوقی را دانلود یا چاپ کنم؟',
      answer: 'به بخش «فیش حقوقی» بروید و روی ماه مورد نظر کلیک کنید. در صفحه جزئیات فیش، دو دکمه «دانلود PDF» و «چاپ فیش» وجود دارد. فایل PDF با کیفیت بالا تولید شده و قابل ذخیره است.',
      category: 'payslip',
      relatedLinks: [{ label: 'فیش حقوقی', route: '/payslip' }],
      helpfulCount: 54,
      notHelpfulCount: 1
    },
    {
      id: 6,
      question: 'چگونه درخواست وام یا مساعده دهم؟',
      answer: 'از منوی سمت راست به بخش «وام» یا «مساعده» مراجعه کنید. فرم درخواست را تکمیل و ارسال نمایید. وضعیت درخواست شما از همان بخش قابل پیگیری است و نتیجه از طریق اعلان اطلاع‌رسانی می‌شود.',
      category: 'payslip',
      relatedLinks: [{ label: 'درخواست وام', route: '/loan' }, { label: 'درخواست مساعده', route: '/advance' }],
      helpfulCount: 37,
      notHelpfulCount: 6
    },
    {
      id: 7,
      question: 'چگونه درخواست مرخصی ثبت کنم؟',
      answer: 'از منوی سمت راست روی «مرخصی‌ها» کلیک کنید. دکمه «درخواست جدید» را بزنید، نوع مرخصی (استحقاقی، استعلاجی، بدون حقوق)، تاریخ شروع و پایان را انتخاب کنید و توضیحات لازم را بنویسید. پس از ارسال، درخواست برای تأیید به مدیر شما ارجاع می‌شود.',
      category: 'leave',
      relatedLinks: [{ label: 'مدیریت مرخصی‌ها', route: '/leave' }, { label: 'تقویم', route: '/calendar' }],
      helpfulCount: 73,
      notHelpfulCount: 3
    },
    {
      id: 8,
      question: 'مانده مرخصی استحقاقی من چقدر است؟',
      answer: 'در بخش «مرخصی‌ها» کارت آمار مانده مرخصی نمایش داده می‌شود. همچنین در داشبورد اصلی نیز خلاصه مانده مرخصی قابل مشاهده است. طبق قانون کار، هر کارمند سالانه ۲۶ روز مرخصی استحقاقی دارد.',
      category: 'leave',
      relatedLinks: [{ label: 'مرخصی‌ها', route: '/leave' }, { label: 'داشبورد', route: '/dashboard' }],
      helpfulCount: 41,
      notHelpfulCount: 2
    },
    {
      id: 9,
      question: 'تردد و ساعت کاری من چگونه ثبت می‌شود؟',
      answer: 'ورود و خروج شما از طریق سیستم حضور و غیاب ثبت می‌شود. گزارش کامل تردد شامل ساعت ورود، خروج، اضافه‌کاری و کسر کار در بخش «حضور و غیاب» قابل مشاهده است.',
      category: 'leave',
      relatedLinks: [{ label: 'حضور و غیاب', route: '/attendance' }],
      helpfulCount: 35,
      notHelpfulCount: 4
    },
    {
      id: 10,
      question: 'ارزیابی عملکرد ۳۶۰ درجه چیست؟',
      answer: 'ارزیابی ۳۶۰ درجه شامل سه بخش است: خودارزیابی (شما عملکرد خودتان را ارزیابی می‌کنید)، ارزیابی مدیر (مدیر مستقیم شما را ارزیابی می‌کند) و ارزیابی همکار (همکاران تیم شما را ارزیابی می‌کنند). نتایج ترکیبی، تصویر کاملی از عملکرد شما ارائه می‌دهد.',
      category: 'evaluation',
      relatedLinks: [{ label: 'سامانه ارزیابی', route: '/evaluation' }, { label: 'تحلیل عملکرد', route: '/evaluation/analytics' }],
      helpfulCount: 56,
      notHelpfulCount: 8
    },
    {
      id: 11,
      question: 'چگونه خودارزیابی را تکمیل کنم؟',
      answer: 'در صفحه ارزیابی، بخش «خودارزیابی فعال» را پیدا کنید و دکمه «شروع خودارزیابی» را بزنید. فرم شامل سوالات امتیازی (۱ تا ۵) و تشریحی است. تمام سوالات ستاره‌دار (*) اجباری هستند. می‌توانید قبل از ثبت نهایی، پاسخ‌ها را به صورت موقت ذخیره کنید.',
      category: 'evaluation',
      relatedLinks: [{ label: 'شروع ارزیابی', route: '/evaluation' }],
      helpfulCount: 48,
      notHelpfulCount: 3
    },
    {
      id: 12,
      question: 'تحلیل هوشمند AI چگونه کار می‌کند؟',
      answer: 'سیستم AI به صورت خودکار بازخوردهای متنی را تحلیل احساسات می‌کند، نقاط قوت و ضعف شما را شناسایی می‌کند، پیشنهادات توسعه فردی ارائه می‌دهد و روند عملکرد آینده را پیش‌بینی می‌کند. تمام پردازش‌ها داخل سامانه انجام می‌شود و داده‌ای به سرور خارجی ارسال نمی‌شود.',
      category: 'evaluation',
      relatedLinks: [{ label: 'تحلیل عملکرد AI', route: '/evaluation/analytics' }],
      helpfulCount: 39,
      notHelpfulCount: 5
    },
    {
      id: 13,
      question: 'چگونه تیکت پشتیبانی ثبت کنم؟',
      answer: 'از منوی سمت راست روی «تیکت‌ها» کلیک کنید و دکمه «تیکت جدید» را بزنید. عنوان و شرح مشکل را بنویسید، اولویت و دسته‌بندی را انتخاب کنید. در صورت نیاز می‌توانید فایل پیوست اضافه کنید. پس از ثبت، تیکت به تیم مربوطه ارجاع می‌شود.',
      category: 'tickets',
      relatedLinks: [{ label: 'ثبت تیکت جدید', route: '/tickets' }],
      helpfulCount: 67,
      notHelpfulCount: 2
    },
    {
      id: 14,
      question: 'مهلت پاسخگویی (SLA) تیکت‌ها چقدر است؟',
      answer: 'مهلت پاسخگویی بر اساس اولویت تیکت تعیین می‌شود: بحرانی = ۱ روز، بالا = ۲ روز، متوسط = ۵ روز، پایین = ۷ روز. در صورت نقض مهلت، هشدار قرمز رنگ در لیست و جزئیات تیکت نمایش داده می‌شود.',
      category: 'tickets',
      relatedLinks: [{ label: 'لیست تیکت‌ها', route: '/tickets' }],
      helpfulCount: 31,
      notHelpfulCount: 1
    },
    {
      id: 15,
      question: 'چگونه به پاسخ پشتیبان امتیاز دهم؟',
      answer: 'در صفحه جزئیات تیکت، زیر هر پیام پشتیبان ۵ ستاره نمایش داده می‌شود. با کلیک روی ستاره مورد نظر، امتیاز شما ثبت می‌شود. پس از حل شدن تیکت نیز می‌توانید امتیاز رضایت کلی بدهید.',
      category: 'tickets',
      relatedLinks: [{ label: 'تیکت‌های من', route: '/tickets' }],
      helpfulCount: 22,
      notHelpfulCount: 0
    },
    {
      id: 16,
      question: 'چگونه اعلان‌های سامانه را مدیریت کنم؟',
      answer: 'از منوی سمت راست روی «اعلان‌ها» کلیک کنید. تمام اعلان‌های خوانده نشده و خوانده شده در اینجا نمایش داده می‌شوند. می‌توانید اعلان‌ها را به صورت تکی یا گروهی علامت‌گذاری کنید.',
      category: 'system',
      relatedLinks: [{ label: 'اعلان‌ها', route: '/notifications' }],
      helpfulCount: 19,
      notHelpfulCount: 1
    },
    {
      id: 17,
      question: 'آیا سامانه از حالت تاریک پشتیبانی می‌کند؟',
      answer: 'بله. سامانه به صورت خودکار تم تاریک/روشن سیستم عامل شما را تشخیص می‌دهد. همچنین می‌توانید از دکمه تغییر تم در هدر سامانه استفاده کنید.',
      category: 'system',
      helpfulCount: 25,
      notHelpfulCount: 0
    },
    {
      id: 18,
      question: 'تاریخ‌ها در سامانه به چه تقویمی نمایش داده می‌شوند؟',
      answer: 'تمام تاریخ‌های سامانه بر اساس تقویم شمسی (جلالی) نمایش داده می‌شوند. اعداد نیز به صورت فارسی نمایش داده می‌شوند. این تنظیمات مطابق استانداردهای سازمانی ایران است.',
      category: 'system',
      helpfulCount: 15,
      notHelpfulCount: 0
    }
  ];

  filteredFAQs = computed(() => {
    let result = this.faqs;

    if (this.selectedCategory() !== 'all') {
      result = result.filter(f => f.category === this.selectedCategory());
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(f =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
      );
    }

    return result;
  });

  toggleFAQ(id: number): void {
    this.activeFAQ.update(current => current === id ? null : id);
  }

  markHelpful(faqId: number, isHelpful: boolean): void {
    const feedbacks = { ...this.userFeedbacks() };
    const faqIndex = this.faqs.findIndex(f => f.id === faqId);

    if (feedbacks[faqId]) {
      if (feedbacks[faqId] === 'helpful') this.faqs[faqIndex].helpfulCount--;
      else this.faqs[faqIndex].notHelpfulCount--;
      delete feedbacks[faqId];
    } else {
      if (isHelpful) this.faqs[faqIndex].helpfulCount++;
      else this.faqs[faqIndex].notHelpfulCount++;
      feedbacks[faqId] = isHelpful ? 'helpful' : 'not-helpful';
    }

    this.userFeedbacks.set(feedbacks);
  }

  getCategoryIcon(category: string): string {
    const cat = this.categories.find(c => c.id === category);
    return cat?.icon || 'help-circle';
  }

  getCategoryColor(category: string): string {
    const cat = this.categories.find(c => c.id === category);
    return cat?.color || 'bg-slate-100 text-slate-600';
  }
}
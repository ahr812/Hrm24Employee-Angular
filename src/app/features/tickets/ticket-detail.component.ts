import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { IranLocalizationService } from '../../core/localization/iran-localization.service';
import { Ticket, TicketMessage, TicketActivity } from './tickets.component';

@Component({
    selector: 'app-ticket-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, IconComponent],
    template: `
        <div class="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
            @if (!ticket()) {
                <div class="flex flex-col items-center justify-center h-64 gap-4">
                    <p class="text-muted text-lg">تیکت یافت نشد</p>
                    <button (click)="navigateToTickets()" class="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors">
                        بازگشت به لیست تیکت‌ها
                    </button>
                </div>
            } @else {
                <div class="max-w-6xl mx-auto space-y-6">

                    <!-- Header -->
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <button (click)="goBack()" class="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                                <ui-icon name="arrow-right" [size]="20" class="text-foreground"></ui-icon>
                            </button>
                            <div>
                                <h1 class="text-xl font-bold text-foreground dark:text-slate-100">{{ ticket()!.title }}</h1>
                                <p class="text-xs text-muted mt-0.5">#{{ ticket()!.id }} • ایجاد شده در {{ loc.formatShamsiDate(ticket()!.createdAt) || ticket()!.createdAt }}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span [class]="getStatusBadgeClass(ticket()!.status)" class="px-3 py-1.5 rounded-lg text-xs font-bold">
                                {{ getStatusLabel(ticket()!.status) }}
                            </span>
                            <span [class]="getPriorityBadgeClass(ticket()!.priority)" class="px-3 py-1.5 rounded-lg text-xs font-bold">
                                {{ getPriorityLabel(ticket()!.priority) }}
                            </span>
                        </div>
                    </div>

                    <!-- مهلت پاسخگویی Alert -->
                    @if (isSlaBreached()) {
                        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                            <ui-icon name="alert-triangle" [size]="24" class="text-red-500 flex-shrink-0"></ui-icon>
                            <div>
                                <p class="text-sm font-bold text-red-700 dark:text-red-400">مهلت پاسخگویی نقض شده است!</p>
                                <p class="text-xs text-red-600 dark:text-red-500 mt-0.5">مهلت: {{ loc.formatShamsiDate(ticket()!.slaDeadline) || ticket()!.slaDeadline }}</p>
                            </div>
                        </div>
                    } @else if (ticket()!.status !== 'resolved' && ticket()!.status !== 'closed') {
                        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center gap-3">
                            <ui-icon name="clock" [size]="20" class="text-blue-500 flex-shrink-0"></ui-icon>
                            <p class="text-xs text-blue-700 dark:text-blue-400">
                                مهلت پاسخگویی: {{ loc.formatShamsiDate(ticket()!.slaDeadline) || ticket()!.slaDeadline }}
                                ({{ slaDaysRemaining() }})
                            </p>
                        </div>
                    }

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        <!-- Left: Chat & Messages -->
                        <div class="lg:col-span-2 space-y-4">

                            <!-- Description Card -->
                            <div class="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-5">
                                <h3 class="text-sm font-bold text-muted mb-2 flex items-center gap-2">
                                    <ui-icon name="file-text" [size]="16"></ui-icon>
                                    شرح مشکل
                                </h3>
                                <p class="text-sm text-foreground dark:text-slate-200 leading-relaxed">{{ ticket()!.description }}</p>
                                @if (ticket()!.attachments.length > 0) {
                                    <div class="mt-3 flex flex-wrap gap-2">
                                        @for (att of ticket()!.attachments; track att) {
                                            <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs text-foreground dark:text-slate-200">
                                                <ui-icon name="download" [size]="14"></ui-icon>
                                                {{ att }}
                                            </span>
                                        }
                                    </div>
                                }
                            </div>

                            <!-- Messages / Chat -->
                            <div class="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 overflow-hidden">
                                <div class="p-4 border-b border-border dark:border-slate-700">
                                    <h3 class="text-sm font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                                        <ui-icon name="message-square" [size]="16" class="text-primary"></ui-icon>
                                        گفتگو ({{ loc.toPersianNum(ticket()!.messages.length) }} پیام)
                                    </h3>
                                </div>

                                <div class="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                                    @if (ticket()!.messages.length === 0) {
                                        <div class="text-center py-8">
                                            <ui-icon name="message-circle" [size]="32" class="mx-auto mb-2 text-muted opacity-50"></ui-icon>
                                            <p class="text-xs text-muted">هنوز پیامی ارسال نشده است.</p>
                                        </div>
                                    }
                                    @for (msg of ticket()!.messages; track msg.id) {
                                        <div class="flex gap-3" [class.flex-row-reverse]="msg.senderRole === 'support'">
                                            <img [src]="getAvatar(msg.sender)" alt="" class="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1">
                                            <div class="max-w-[75%] space-y-1" [class.text-left]="msg.senderRole === 'support'">
                                                <div class="flex items-center gap-2" [class.flex-row-reverse]="msg.senderRole === 'support'">
                                                    <span class="text-xs font-bold text-foreground dark:text-slate-200">{{ msg.sender }}</span>
                                                    <span class="text-[10px] text-muted">{{ msg.senderRole === 'support' ? 'پشتیبان' : 'کاربر' }}</span>
                                                    <span class="text-[10px] text-muted">{{ msg.createdAt }}</span>
                                                </div>
                                                <div class="p-3 rounded-xl text-sm leading-relaxed"
                                                     [class]="msg.senderRole === 'support' 
                                                        ? 'bg-primary/10 text-foreground dark:text-slate-200 rounded-tr-sm' 
                                                        : 'bg-slate-100 dark:bg-slate-700 text-foreground dark:text-slate-200 rounded-tl-sm'">
                                                    {{ msg.content }}
                                                </div>
                                                <!-- امتیازدهی به پاسخ پشتیبان -->
                                                @if (msg.senderRole === 'support' && ticket()!.status !== 'closed') {
                                                    <div class="flex items-center gap-1 justify-end">
                                                        <span class="text-[10px] text-muted ml-1">امتیاز به این پاسخ:</span>
                                                        @for (star of [1,2,3,4,5]; track star) {
                                                            <button
                                                                (click)="rateMessage(msg.id, star)"
                                                                class="transition-transform hover:scale-125 focus:outline-none"
                                                                [class.cursor-pointer]="!msg.rating"
                                                                [class.opacity-50]="msg.rating && star > msg.rating"
                                                                [disabled]="!!msg.rating">
                                                                <ui-icon name="star" [size]="18"
                                                                    [class]="star <= (msg.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'">
                                                                </ui-icon>
                                                            </button>
                                                        }
                                                        @if (msg.rating) {
                                                            <span class="text-[10px] text-emerald-500 font-bold mr-1">✓ ثبت شد</span>
                                                        }
                                                    </div>
                                                }
                                                @if (msg.senderRole === 'support' && msg.rating && ticket()!.status === 'closed') {
                                                    <div class="flex items-center gap-1 justify-end">
                                                        <span class="text-[10px] text-muted">امتیاز:</span>
                                                        @for (star of [1,2,3,4,5]; track star) {
                                                            <ui-icon name="star" [size]="16"
                                                                [class]="star <= msg.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'">
                                                            </ui-icon>
                                                        }
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    }
                                </div>

                                <!-- Send Message -->
                                @if (ticket()!.status !== 'closed') {
                                    <div class="p-4 border-t border-border dark:border-slate-700">
                                        <div class="flex gap-2">
                                            <input
                                                type="text"
                                                [(ngModel)]="newMessage"
                                                (keyup.enter)="sendMessage()"
                                                placeholder="پیام خود را بنویسید..."
                                                class="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm">
                                            <button
                                                (click)="simulateAttachMessage()"
                                                class="px-3 py-2.5 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                title="پیوست فایل">
                                                <ui-icon name="download" [size]="18" class="text-muted"></ui-icon>
                                            </button>
                                            <button
                                                (click)="sendMessage()"
                                                [disabled]="!newMessage.trim()"
                                                class="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                                <ui-icon name="send" [size]="18"></ui-icon>
                                            </button>
                                        </div>
                                        @if (messageAttachment) {
                                            <div class="mt-2 flex items-center gap-2 text-xs text-primary">
                                                <ui-icon name="check-circle" [size]="14"></ui-icon>
                                                {{ messageAttachment }}
                                                <button (click)="messageAttachment = ''" class="text-muted hover:text-danger">✕</button>
                                            </div>
                                        }
                                    </div>
                                } @else {
                                    <div class="p-4 border-t border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center">
                                        <p class="text-xs text-muted">این تیکت بسته شده است. امکان ارسال پیام جدید وجود ندارد.</p>
                                    </div>
                                }
                            </div>

                            <!-- Satisfaction Rating (when resolved) -->
                            @if (ticket()!.status === 'resolved' && !ticket()!.satisfactionRating) {
                                <div class="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-5 text-center">
                                    <h3 class="text-base font-bold text-emerald-700 dark:text-emerald-400 mb-2">آیا از نحوه رسیدگی رضایت دارید؟</h3>
                                    <p class="text-xs text-muted mb-3">لطفاً به کیفیت پشتیبانی امتیاز دهید</p>
                                    <div class="flex items-center justify-center gap-2">
                                        @for (star of [1,2,3,4,5]; track star) {
                                            <button
                                                (click)="rateOverall(star)"
                                                class="transition-transform hover:scale-125 focus:outline-none">
                                                <ui-icon name="star" [size]="32"
                                                    [class]="star <= tempRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'">
                                                </ui-icon>
                                            </button>
                                        }
                                    </div>
                                    @if (tempRating > 0) {
                                        <button
                                            (click)="submitOverallRating()"
                                            class="mt-3 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">
                                            ثبت امتیاز
                                        </button>
                                    }
                                </div>
                            }
                            @if (ticket()!.satisfactionRating) {
                                <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <ui-icon name="check-circle" [size]="20" class="text-emerald-500"></ui-icon>
                                        <span class="text-sm font-bold text-emerald-700 dark:text-emerald-400">امتیاز رضایت شما</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        @for (star of [1,2,3,4,5]; track star) {
                                            <ui-icon name="star" [size]="18"
                                                [class]="star <= ticket()!.satisfactionRating! ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'">
                                            </ui-icon>
                                        }
                                        <span class="text-sm font-bold text-emerald-700 dark:text-emerald-400 mr-1">({{ loc.toPersianNum(ticket()!.satisfactionRating!) }})</span>
                                    </div>
                                </div>
                            }
                        </div>

                        <!-- Right: Sidebar -->
                        <div class="space-y-4">

                            <!-- Info Card -->
                            <div class="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-4 space-y-3">
                                <h3 class="text-sm font-bold text-foreground dark:text-slate-100 mb-2">اطلاعات تیکت</h3>
                                
                                <div class="space-y-2.5">
                                    <div class="flex justify-between text-xs">
                                        <span class="text-muted">ثبت‌کننده</span>
                                        <span class="font-bold text-foreground dark:text-slate-200 flex items-center gap-1">
                                            <img [src]="getAvatar(ticket()!.createdBy)" class="w-4 h-4 rounded-full"> {{ ticket()!.createdBy }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-muted">دسته‌بندی</span>
                                        <span class="font-bold text-foreground dark:text-slate-200">{{ ticket()!.category }}</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-muted">واگذار شده به</span>
                                        <span class="font-bold" [class]="ticket()!.assignee ? 'text-primary' : 'text-muted'">
                                            {{ ticket()!.assignee || 'نامشخص' }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-muted">مهلت پاسخگویی</span>
                                        <span class="font-bold dir-ltr" [class]="isSlaBreached() ? 'text-danger' : 'text-foreground dark:text-slate-200'">
                                            {{ ticket()!.slaDeadline }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-muted">تاریخ ایجاد</span>
                                        <span class="font-bold text-foreground dark:text-slate-200 dir-ltr">{{ ticket()!.createdAt }}</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-muted">آخرین بروزرسانی</span>
                                        <span class="font-bold text-foreground dark:text-slate-200 dir-ltr">{{ ticket()!.updatedAt }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Actions Card -->
                            @if (ticket()!.status !== 'closed') {
                                <div class="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-4 space-y-3">
                                    <h3 class="text-sm font-bold text-foreground dark:text-slate-100 mb-2">عملیات</h3>

                                    <div>
                                        <label class="block text-xs text-muted mb-1">تغییر وضعیت</label>
                                        <select
                                            [ngModel]="ticket()!.status"
                                            (ngModelChange)="changeStatus($event)"
                                            class="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                            <option value="open">باز</option>
                                            <option value="in-progress">در حال بررسی</option>
                                            <option value="resolved">حل شده</option>
                                            <option value="closed">بسته شود</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block text-xs text-muted mb-1">تغییر اولویت</label>
                                        <select
                                            [ngModel]="ticket()!.priority"
                                            (ngModelChange)="changePriority($event)"
                                            class="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                            <option value="low">پایین</option>
                                            <option value="medium">متوسط</option>
                                            <option value="high">بالا</option>
                                            <option value="critical">بحرانی</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block text-xs text-muted mb-1">واگذاری به پشتیبان</label>
                                        <select
                                            [ngModel]="ticket()!.assignee || ''"
                                            (ngModelChange)="assignTo($event)"
                                            class="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                            <option value="">بدون واگذاری</option>
                                            <option value="پشتیبانی فنی">پشتیبانی فنی</option>
                                            <option value="پشتیبانی مالی">پشتیبانی مالی</option>
                                            <option value="مهندس رضایی">مهندس رضایی</option>
                                            <option value="خانم محمدی">خانم محمدی</option>
                                        </select>
                                    </div>

                                    <button
                                        (click)="toggleEditMode()"
                                        class="w-full py-2 border border-border rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-foreground dark:text-slate-200 flex items-center justify-center gap-1">
                                        <ui-icon name="edit" [size]="14"></ui-icon>
                                        ویرایش تیکت
                                    </button>
                                </div>
                            }

                            <!-- Activity Log -->
                            <div class="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 overflow-hidden">
                                <div class="p-3 border-b border-border dark:border-slate-700">
                                    <h3 class="text-sm font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                                        <ui-icon name="history" [size]="14" class="text-primary"></ui-icon>
                                        تاریخچه فعالیت
                                    </h3>
                                </div>
                                <div class="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                                    @for (activity of ticket()!.activities; track activity.id) {
                                        <div class="flex gap-2 text-[10px]">
                                            <div class="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                                 [class]="getActivityDotColor(activity.action)"></div>
                                            <div class="flex-1 min-w-0">
                                                <p class="text-foreground dark:text-slate-300 leading-relaxed">{{ activity.description }}</p>
                                                <div class="flex items-center gap-2 mt-0.5 text-muted">
                                                    <span>{{ activity.actor }}</span>
                                                    <span>•</span>
                                                    <span class="dir-ltr">{{ activity.createdAt }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Edit Modal -->
                @if (isEditMode()) {
                    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="toggleEditMode()">
                        <div class="bg-surface w-full max-w-md rounded-2xl shadow-2xl dark:bg-slate-800 border border-border dark:border-slate-700 p-5 space-y-4" (click)="$event.stopPropagation()">
                            <h2 class="text-lg font-bold text-foreground dark:text-slate-100">ویرایش تیکت</h2>
                            
                            <div>
                                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">عنوان</label>
                                <input type="text" [(ngModel)]="editForm.title"
                                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">شرح</label>
                                <textarea [(ngModel)]="editForm.description" rows="3"
                                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"></textarea>
                            </div>

                            <div class="flex gap-3 pt-2">
                                <button (click)="toggleEditMode()" class="flex-1 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 text-foreground dark:text-slate-200">انصراف</button>
                                <button (click)="saveEdit()" class="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover">ذخیره تغییرات</button>
                            </div>
                        </div>
                    </div>
                }
            }
        </div>
    `,
    styles: [`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
    `]
})
export class TicketDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private toastService = inject(ToastService);
    protected loc = inject(IranLocalizationService);

    ticket = signal<Ticket | null>(null);
    newMessage = '';
    messageAttachment = '';
    tempRating = 0;
    isEditMode = signal(false);

    editForm = { title: '', description: '' };

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

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            const tickets = this.loadTickets();
            const found = tickets.find(t => t.id === id);
            if (found) {
                this.ticket.set(found);
            }
        }
    }

    goBack(): void {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.navigateToTickets();
        }
    }

    navigateToTickets(): void {
        this.router.navigate(['/tickets']);
    }

    getAvatar(name: string): string {
        if (this.knownAvatars[name]) return this.knownAvatars[name];
        const isFemale = this.femaleKeywords.some(kw => name.includes(kw));
        let hash = 0;
        for (let i = 0; i < name.length; i++) { hash = ((hash << 5) - hash) + name.charCodeAt(i); hash |= 0; }
        hash = Math.abs(hash);
        return isFemale ? this.femaleAvatars[hash % this.femaleAvatars.length] : this.maleAvatars[hash % this.maleAvatars.length];
    }

    sendMessage(): void {
        if (!this.newMessage.trim() || !this.ticket()) return;

        const now = new Date().toLocaleDateString('fa-IR');
        const msgId = `msg-${Date.now()}`;
        const ticketId = this.ticket()!.id;

        const newMsg: TicketMessage = {
            id: msgId,
            ticketId,
            sender: 'علی احمدی',
            senderRole: 'user',
            content: this.newMessage.trim(),
            attachment: this.messageAttachment || undefined,
            createdAt: now
        };

        const newActivity: TicketActivity = {
            id: `act-${Date.now()}`,
            ticketId,
            action: 'message_sent',
            description: 'پیام جدید ارسال شد',
            actor: 'علی احمدی',
            createdAt: now
        };

        this.ticket.update(t => {
            if (!t) return null;
            return {
                ...t,
                updatedAt: now,
                messages: [...t.messages, newMsg],
                activities: [...t.activities, newActivity]
            };
        });

        this.saveCurrentTicket();
        this.newMessage = '';
        this.messageAttachment = '';
        this.toastService.show('پیام ارسال شد.', 'success');
    }

    simulateAttachMessage(): void {
        const names = ['اسکرین‌شات.png', 'لاگ.txt', 'سند.pdf'];
        this.messageAttachment = names[Math.floor(Math.random() * names.length)];
    }

    rateMessage(messageId: string, rating: number): void {
        const t = this.ticket();
        if (!t) return;

        const msgIndex = t.messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1 || t.messages[msgIndex].rating) return;

        const now = new Date().toLocaleDateString('fa-IR');
        const updatedMessages = [...t.messages];
        updatedMessages[msgIndex] = { ...updatedMessages[msgIndex], rating };

        const newActivity: TicketActivity = {
            id: `act-${Date.now()}`,
            ticketId: t.id,
            action: 'rated',
            description: `امتیاز ${rating} از ۵ به پاسخ پشتیبان`,
            actor: 'علی احمدی',
            createdAt: now
        };

        this.ticket.set({
            ...t,
            updatedAt: now,
            messages: updatedMessages,
            activities: [...t.activities, newActivity]
        });

        this.saveCurrentTicket();
        this.toastService.show(`امتیاز ${rating} ستاره ثبت شد.`, 'success');
    }

    rateOverall(rating: number): void {
        this.tempRating = rating;
    }

    submitOverallRating(): void {
        const t = this.ticket();
        if (!t || this.tempRating === 0) return;

        const now = new Date().toLocaleDateString('fa-IR');
        const newActivity: TicketActivity = {
            id: `act-${Date.now()}`,
            ticketId: t.id,
            action: 'rated',
            description: `امتیاز رضایت کلی: ${this.tempRating} از ۵`,
            actor: 'علی احمدی',
            createdAt: now
        };

        this.ticket.set({
            ...t,
            updatedAt: now,
            satisfactionRating: this.tempRating,
            activities: [...t.activities, newActivity]
        });

        this.saveCurrentTicket();
        this.tempRating = 0;
        this.toastService.show('امتیاز رضایت شما ثبت شد. ممنون!', 'success');
    }

    changeStatus(newStatus: string): void {
        const t = this.ticket();
        if (!t || t.status === newStatus) return;

        const now = new Date().toLocaleDateString('fa-IR');
        const oldLabel = this.getStatusLabel(t.status);
        const newLabel = this.getStatusLabel(newStatus);

        const newActivity: TicketActivity = {
            id: `act-${Date.now()}`,
            ticketId: t.id,
            action: 'status_changed',
            description: `وضعیت تغییر کرد: ${oldLabel} → ${newLabel}`,
            actor: 'علی احمدی',
            createdAt: now
        };

        this.ticket.set({ ...t, status: newStatus as any, updatedAt: now, activities: [...t.activities, newActivity] });
        this.saveCurrentTicket();
        this.toastService.show(`وضعیت به "${newLabel}" تغییر کرد.`, 'success');
    }

    changePriority(newPriority: string): void {
        const t = this.ticket();
        if (!t || t.priority === newPriority) return;

        const now = new Date().toLocaleDateString('fa-IR');
        const oldLabel = this.getPriorityLabel(t.priority);
        const newLabel = this.getPriorityLabel(newPriority);

        const newActivity: TicketActivity = {
            id: `act-${Date.now()}`,
            ticketId: t.id,
            action: 'priority_changed',
            description: `اولویت تغییر کرد: ${oldLabel} → ${newLabel}`,
            actor: 'علی احمدی',
            createdAt: now
        };

        this.ticket.set({ ...t, priority: newPriority as any, updatedAt: now, activities: [...t.activities, newActivity] });
        this.saveCurrentTicket();
        this.toastService.show(`اولویت به "${newLabel}" تغییر کرد.`, 'success');
    }

    assignTo(assignee: string): void {
        const t = this.ticket();
        if (!t) return;

        const now = new Date().toLocaleDateString('fa-IR');
        const desc = assignee ? `واگذار شد به: ${assignee}` : 'واگذاری لغو شد';

        const newActivity: TicketActivity = {
            id: `act-${Date.now()}`,
            ticketId: t.id,
            action: 'assigned',
            description: desc,
            actor: 'علی احمدی',
            createdAt: now
        };

        this.ticket.set({ ...t, assignee: assignee || null, updatedAt: now, activities: [...t.activities, newActivity] });
        this.saveCurrentTicket();
        this.toastService.show(desc, 'success');
    }

    toggleEditMode(): void {
        const t = this.ticket();
        if (!this.isEditMode() && t) {
            this.editForm = { title: t.title, description: t.description };
        }
        this.isEditMode.update(v => !v);
    }

    saveEdit(): void {
        const t = this.ticket();
        if (!t || !this.editForm.title.trim()) return;

        const now = new Date().toLocaleDateString('fa-IR');
        const newActivity: TicketActivity = {
            id: `act-${Date.now()}`,
            ticketId: t.id,
            action: 'edited',
            description: 'تیکت ویرایش شد',
            actor: 'علی احمدی',
            createdAt: now
        };

        this.ticket.set({
            ...t,
            title: this.editForm.title,
            description: this.editForm.description,
            updatedAt: now,
            activities: [...t.activities, newActivity]
        });

        this.saveCurrentTicket();
        this.isEditMode.set(false);
        this.toastService.show('تیکت ویرایش شد.', 'success');
    }

    isSlaBreached(): boolean {
        const t = this.ticket();
        if (!t || t.status === 'resolved' || t.status === 'closed') return false;
        const deadline = this.loc.shamsiToGregorian(t.slaDeadline);
        if (!deadline) return false;
        return new Date() > deadline;
    }

    slaDaysRemaining(): string {
        const t = this.ticket();
        if (!t) return '-';
        const deadline = this.loc.shamsiToGregorian(t.slaDeadline);
        if (!deadline) return '-';
        const diff = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (diff <= 0) return 'منقضی شده';
        return `${this.loc.toPersianNum(diff)} روز مانده`;
    }

    getActivityDotColor(action: string): string {
        const map: Record<string, string> = {
            'created': 'bg-blue-500',
            'status_changed': 'bg-amber-500',
            'priority_changed': 'bg-purple-500',
            'assigned': 'bg-indigo-500',
            'message_sent': 'bg-emerald-500',
            'rated': 'bg-yellow-500',
            'edited': 'bg-cyan-500',
            'attachment_added': 'bg-orange-500'
        };
        return map[action] || 'bg-slate-400';
    }

    getStatusBadgeClass(status: string): string {
        const map: Record<string, string> = {
            'open': 'bg-warning/10 text-warning',
            'in-progress': 'bg-info/10 text-info',
            'resolved': 'bg-success/10 text-success',
            'closed': 'bg-muted/10 text-muted'
        };
        return map[status] || 'bg-muted/10 text-muted';
    }

    getPriorityBadgeClass(priority: string): string {
        const map: Record<string, string> = {
            'critical': 'bg-red-600/10 text-red-600 dark:text-red-400',
            'high': 'bg-danger/10 text-danger',
            'medium': 'bg-warning/10 text-warning',
            'low': 'bg-info/10 text-info'
        };
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

    private loadTickets(): Ticket[] {
        try {
            const stored = localStorage.getItem('hrm24_tickets_v2');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    }

    private saveCurrentTicket(): void {
        const t = this.ticket();
        if (!t) return;
        try {
            const all = this.loadTickets();
            const idx = all.findIndex(x => x.id === t.id);
            if (idx >= 0) all[idx] = t;
            localStorage.setItem('hrm24_tickets_v2', JSON.stringify(all));
        } catch (e) { console.error(e); }
    }
}
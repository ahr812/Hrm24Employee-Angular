import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { EmployeeDataService, CalendarEvent } from '../../core/data/employee-data.service';
import { OrganizationService } from '../../core/organization/organization.service';
import { IranLocalizationService } from '../../core/localization/iran-localization.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

interface DayCell {
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isHoliday: boolean;
    isFriday: boolean;
    events: CalendarEvent[];
    dateStr: string;
}

type EventType = 'leave' | 'meeting' | 'holiday' | 'deadline';

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, IconComponent, EscToCloseDirective],
    template: `
        <div class="max-w-[95%] mx-auto space-y-6 animate-fade-in-up">

            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <ui-icon name="calendar-check" [size]="36" class="text-red-500"></ui-icon>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-primary mb-1">تقویم کاری</h1>
                        <p class="text-lg text-muted">رویدادهای خود را مدیریت کنید...</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button
                        (click)="goToToday()"
                        class="px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                        <ui-icon name="calendar" [size]="16"></ui-icon>
                        امروز
                    </button>
                    <button
                        (click)="openAddModal()"
                        class="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
                        <ui-icon name="plus" [size]="18"></ui-icon>
                        رویداد جدید
                    </button>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-4 border border-border dark:border-slate-700 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <ui-icon name="calendar-check" [size]="20" class="text-emerald-600 dark:text-emerald-400"></ui-icon>
                    </div>
                    <div>
                        <p class="text-xs text-muted">مرخصی‌ها</p>
                        <p class="text-lg font-bold text-foreground dark:text-slate-100">{{ toFa(getEventCount('leave')) }}</p>
                    </div>
                </div>
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-4 border border-border dark:border-slate-700 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <ui-icon name="users" [size]="20" class="text-blue-600 dark:text-blue-400"></ui-icon>
                    </div>
                    <div>
                        <p class="text-xs text-muted">جلسات</p>
                        <p class="text-lg font-bold text-foreground dark:text-slate-100">{{ toFa(getEventCount('meeting')) }}</p>
                    </div>
                </div>
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-4 border border-border dark:border-slate-700 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <ui-icon name="flag" [size]="20" class="text-amber-600 dark:text-amber-400"></ui-icon>
                    </div>
                    <div>
                        <p class="text-xs text-muted">مهلت‌ها</p>
                        <p class="text-lg font-bold text-foreground dark:text-slate-100">{{ toFa(getEventCount('deadline')) }}</p>
                    </div>
                </div>
                <div class="bg-surface dark:bg-slate-800 rounded-xl p-4 border border-border dark:border-slate-700 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <ui-icon name="sun" [size]="20" class="text-red-600 dark:text-red-400"></ui-icon>
                    </div>
                    <div>
                        <p class="text-xs text-muted">تعطیلات</p>
                        <p class="text-lg font-bold text-foreground dark:text-slate-100">{{ toFa(getEventCount('holiday')) }}</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">

                <!-- Sidebar -->
                <div class="lg:col-span-1 space-y-4">
                    <!-- Mini Month Navigator -->
                    <div class="bg-surface dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-4">
                        <div class="flex items-center justify-between mb-3">
                            <button (click)="previousMonth()" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <ui-icon name="chevron-right" [size]="16" class="text-muted"></ui-icon>
                            </button>
                            <span class="text-sm font-bold text-foreground dark:text-slate-100">{{ currentMonthName() }}</span>
                            <button (click)="nextMonth()" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <ui-icon name="chevron-left" [size]="16" class="text-muted"></ui-icon>
                            </button>
                        </div>
                        <div class="grid grid-cols-7 gap-0.5 text-center">
                            @for (d of weekDaysShort; track d) {
                                <span class="text-[10px] text-muted font-bold py-1">{{ d }}</span>
                            }
                            @for (day of calendarDays(); track day.dateStr) {
                                <button
                                    (click)="day.isCurrentMonth && selectDay(day)"
                                    class="text-[10px] py-1 rounded transition-colors"
                                    [class]="getMiniDayClass(day)">
                                    {{ toFa(day.day) }}
                                </button>
                            }
                        </div>
                    </div>

                    <!-- Filter -->
                    <div class="bg-surface dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-4 space-y-2">
                        <h3 class="text-sm font-bold text-foreground dark:text-slate-100 mb-2">فیلتر رویدادها</h3>
                        @for (filter of eventFilters; track filter.type) {
                            <label class="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    [checked]="activeFilters().includes(filter.type)"
                                    (change)="toggleFilter(filter.type)"
                                    class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20">
                                <div class="w-2.5 h-2.5 rounded-full" [class]="filter.dotClass"></div>
                                <span class="text-xs text-foreground dark:text-slate-200 group-hover:text-primary transition-colors">{{ filter.label }}</span>
                            </label>
                        }
                    </div>

                    <!-- Today's Events -->
                    <div class="bg-surface dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-4">
                        <h3 class="text-sm font-bold text-foreground dark:text-slate-100 mb-3 flex items-center gap-2">
                            <ui-icon name="zap" [size]="14" class="text-amber-500"></ui-icon>
                            رویدادهای امروز
                        </h3>
                        @if (todayEvents().length > 0) {
                            <div class="space-y-2">
                                @for (event of todayEvents(); track event.id) {
                                    <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border-r-2" [class]="getBorderClass(event.type)">
                                        <p class="text-xs font-bold text-foreground dark:text-slate-200">{{ event.title }}</p>
                                        @if (event.time) {
                                            <p class="text-[10px] text-muted mt-0.5">{{ toFa(event.time) }}</p>
                                        }
                                    </div>
                                }
                            </div>
                        } @else {
                            <p class="text-xs text-muted text-center py-3">رویدادی برای امروز نیست</p>
                        }
                    </div>
                </div>

                <!-- Main Calendar -->
                <div class="lg:col-span-3">
                    <div class="bg-surface dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden shadow-sm">

                        <!-- Calendar Header -->
                        <div class="p-5 border-b border-border dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div class="flex items-center gap-3">
                                <button (click)="previousMonth()" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <ui-icon name="chevron-right" [size]="20" class="text-foreground"></ui-icon>
                                </button>
                                <h2 class="text-xl font-bold text-foreground dark:text-slate-100 min-w-[160px] text-center">{{ currentMonthName() }}</h2>
                                <button (click)="nextMonth()" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <ui-icon name="chevron-left" [size]="20" class="text-foreground"></ui-icon>
                                </button>
                            </div>
                            <div class="relative">
                                <ui-icon name="search" [size]="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                                <input
                                    type="text"
                                    [(ngModel)]="searchQuery"
                                    placeholder="جستجوی رویداد..."
                                    class="pr-9 pl-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 w-full sm:w-48">
                            </div>
                        </div>

                        <!-- Week Days -->
                        <div class="grid grid-cols-7 border-b border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            @for (day of weekDays; track day) {
                                <div class="p-3 text-center text-xs font-bold text-muted uppercase tracking-wider">
                                    {{ day }}
                                </div>
                            }
                        </div>

                        <!-- Calendar Grid -->
                        <div class="grid grid-cols-7">
                            @for (day of calendarDays(); track day.dateStr) {
                                <div
                                    (click)="day.isCurrentMonth && selectDay(day)"
                                    class="min-h-[100px] md:min-h-[120px] border-b border-l border-border dark:border-slate-700 p-2 transition-colors relative"
                                    [class]="getDayCellClass(day)"
                                    [class.cursor-pointer]="day.isCurrentMonth">

                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-sm font-medium" [class]="getDayNumberClass(day)">
                                            {{ toFa(day.day) }}
                                        </span>
                                        @if (day.isToday) {
                                            <span class="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                                                {{ toFa(day.day) }}
                                            </span>
                                        }
                                    </div>

                                    @if (day.isHoliday && day.isCurrentMonth) {
                                        <span class="text-[9px] text-red-500 font-bold block mb-1 truncate">تعطیل</span>
                                    }

                                    @if (day.isCurrentMonth) {
                                        <div class="space-y-0.5 mt-1">
                                            @for (event of getFilteredEvents(day.events).slice(0, 3); track event.id) {
                                                <div class="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold truncate"
                                                     [class]="getEventBadgeClass(event.type)">
                                                    <ui-icon [name]="getEventIcon(event.type)" [size]="10"></ui-icon>
                                                    <span class="truncate">{{ event.title }}</span>
                                                </div>
                                            }
                                            @if (getFilteredEvents(day.events).length > 3) {
                                                <span class="text-[9px] text-muted px-1">+{{ toFa(getFilteredEvents(day.events).length - 3) }} بیشتر</span>
                                            }
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    </div>

                    <!-- Upcoming Events List -->
                    <div class="mt-6 bg-surface dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 overflow-hidden">
                        <div class="p-5 border-b border-border dark:border-slate-700 flex items-center justify-between">
                            <h3 class="font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                                <ui-icon name="calendar-days" [size]="18" class="text-primary"></ui-icon>
                                رویدادهای پیش رو
                            </h3>
                            <span class="text-xs text-muted">{{ toFa(upcomingEvents().length) }} رویداد</span>
                        </div>
                        @if (upcomingEvents().length > 0) {
                            <div class="divide-y divide-border dark:divide-slate-700">
                                @for (event of upcomingEvents(); track event.id) {
                                    <div class="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                             [class]="getEventIconClass(event.type)">
                                            <ui-icon [name]="getEventIcon(event.type)" [size]="22"></ui-icon>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="font-bold text-sm text-foreground dark:text-slate-100 truncate">{{ event.title }}</p>
                                            <p class="text-xs text-muted truncate mt-0.5">{{ event.description }}</p>
                                        </div>
                                        <div class="text-left flex-shrink-0">
                                            <p class="text-xs font-bold text-foreground dark:text-slate-200">{{ toFa(event.date) }}</p>
                                            @if (event.time) {
                                                <p class="text-[10px] text-muted mt-0.5">{{ toFa(event.time) }}</p>
                                            }
                                        </div>
                                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button (click)="editEvent(event)" class="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors" title="ویرایش">
                                                <ui-icon name="edit" [size]="14"></ui-icon>
                                            </button>
                                            <button (click)="handleDeleteEvent(event.id)" class="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors" title="حذف">
                                                <ui-icon name="trash-2" [size]="14"></ui-icon>
                                            </button>
                                        </div>
                                    </div>
                                }
                            </div>
                        } @else {
                            <div class="p-8 text-center">
                                <ui-icon name="calendar" [size]="40" class="mx-auto mb-3 text-muted opacity-40"></ui-icon>
                                <p class="text-sm text-muted">رویدادی در پیش نیست</p>
                            </div>
                        }
                    </div>
                </div>
            </div>

            <!-- Day Detail Modal -->
            @if (selectedDay()) {
                <div
                    appEscToClose
                    (escPressed)="closeDayDetail()"
                    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    (click)="closeDayDetail()">
                    <div class="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border dark:border-slate-700 animate-scale-in max-h-[80vh] flex flex-col"
                         (click)="$event.stopPropagation()">
                        <div class="p-5 border-b border-border dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                            <h2 class="text-lg font-bold text-foreground dark:text-slate-100">
                                {{ toFa(selectedDay()!.day) }} {{ loc.getPersianMonthName(selectedDay()!.month) }} {{ toFa(selectedDay()!.year) }}
                            </h2>
                            <button (click)="closeDayDetail()" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <ui-icon name="x" [size]="18" class="text-muted"></ui-icon>
                            </button>
                        </div>
                        <div class="flex-1 overflow-y-auto p-5 space-y-3">
                            @if (selectedDay()!.events.length > 0) {
                                @for (event of selectedDay()!.events; track event.id) {
                                    <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-border dark:border-slate-700">
                                        <div class="flex items-start gap-3">
                                            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                 [class]="getEventIconClass(event.type)">
                                                <ui-icon [name]="getEventIcon(event.type)" [size]="20"></ui-icon>
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <div class="flex items-center justify-between mb-1">
                                                    <h3 class="font-bold text-sm text-foreground dark:text-slate-100">{{ event.title }}</h3>
                                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold" [class]="getEventBadgeClass(event.type)">
                                                        {{ getEventTypeLabel(event.type) }}
                                                    </span>
                                                </div>
                                                <p class="text-xs text-muted leading-relaxed">{{ event.description }}</p>
                                                @if (event.time) {
                                                    <div class="flex items-center gap-1.5 mt-2 text-xs text-muted">
                                                        <ui-icon name="clock" [size]="12"></ui-icon>
                                                        <span>{{ toFa(event.time) }}</span>
                                                    </div>
                                                }
                                                <div class="flex items-center gap-2 mt-3">
                                                    <button (click)="editEvent(event)" class="text-[10px] font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
                                                        <ui-icon name="edit" [size]="12"></ui-icon> ویرایش
                                                    </button>
                                                    <button (click)="handleDeleteEvent(event.id)" class="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1">
                                                        <ui-icon name="trash-2" [size]="12"></ui-icon> حذف
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                }
                            } @else {
                                <div class="text-center py-8">
                                    <ui-icon name="calendar" [size]="40" class="mx-auto mb-3 text-muted opacity-40"></ui-icon>
                                    <p class="text-sm text-muted mb-3">رویدادی برای این روز ثبت نشده</p>
                                    <button (click)="openAddModalForDay(selectedDay()!)" class="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover transition-colors">
                                        افزودن رویداد
                                    </button>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }

            <!-- Add/Edit Event Modal -->
            @if (isEventModalOpen()) {
                <div
                    appEscToClose
                    (escPressed)="closeEventModal()"
                    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    (click)="closeEventModal()">
                    <div class="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border dark:border-slate-700 animate-scale-in"
                         (click)="$event.stopPropagation()">
                        <div class="p-5 border-b border-border dark:border-slate-700">
                            <h2 class="text-lg font-bold text-foreground dark:text-slate-100">
                                {{ editingEvent ? 'ویرایش رویداد' : 'رویداد جدید' }}
                            </h2>
                        </div>
                        <div class="p-5 space-y-3">
                            <div>
                                <label class="block text-xs font-bold text-muted mb-1">عنوان *</label>
                                <input type="text" [(ngModel)]="eventForm.title" placeholder="مثلاً: جلسه تیم فنی"
                                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-muted mb-1">توضیحات</label>
                                <textarea [(ngModel)]="eventForm.description" rows="2" placeholder="جزئیات رویداد..."
                                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"></textarea>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-bold text-muted mb-1">نوع رویداد</label>
                                    <select [(ngModel)]="eventForm.type"
                                        class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                        <option value="meeting">جلسه</option>
                                        <option value="leave">مرخصی</option>
                                        <option value="deadline">مهلت</option>
                                        <option value="holiday">تعطیل</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-muted mb-1">ساعت (اختیاری)</label>
                                    <input type="time" [(ngModel)]="eventForm.time"
                                        class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr">
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-muted mb-1">تاریخ (شمسی)</label>
                                <input type="text" [(ngModel)]="eventForm.date" placeholder="۱۴۰۵/۰۵/۱۴"
                                    class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr">
                            </div>
                        </div>
                        <div class="p-5 border-t border-border dark:border-slate-700 flex gap-3">
                            <button (click)="closeEventModal()" class="flex-1 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 text-foreground dark:text-slate-200 transition-colors">
                                انصراف
                            </button>
                            <button (click)="saveEvent()" class="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors">
                                {{ editingEvent ? 'ذخیره تغییرات' : 'ثبت رویداد' }}
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
export class CalendarComponent {
    private dataService = inject(EmployeeDataService);
    private orgService = inject(OrganizationService);
    protected loc = inject(IranLocalizationService);
    private toastService = inject(ToastService);
    private router = inject(Router);

    activeOrg = this.orgService.activeOrg;

    currentMonth = signal(5);
    currentYear = signal(1405);
    selectedDay = signal<DayCell | null>(null);
    searchQuery = '';
    activeFilters = signal<EventType[]>(['leave', 'meeting', 'holiday', 'deadline']);

    isEventModalOpen = signal(false);
    editingEvent: CalendarEvent | null = null;
    eventForm = { title: '', description: '', type: 'meeting' as EventType, date: '', time: '' };

    weekDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    weekDaysShort = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    eventFilters: { type: EventType; label: string; dotClass: string }[] = [
        { type: 'leave', label: 'مرخصی', dotClass: 'bg-emerald-500' },
        { type: 'meeting', label: 'جلسه', dotClass: 'bg-blue-500' },
        { type: 'deadline', label: 'مهلت', dotClass: 'bg-amber-500' },
        { type: 'holiday', label: 'تعطیل', dotClass: 'bg-red-500' }
    ];

    private iranHolidays1405: { date: string; title: string }[] = [
        { date: '1405/01/01', title: 'عید نوروز' },
        { date: '1405/01/02', title: 'عید نوروز' },
        { date: '1405/01/03', title: 'عید نوروز' },
        { date: '1405/01/04', title: 'عید نوروز' },
        { date: '1405/01/12', title: 'روز جمهوری اسلامی' },
        { date: '1405/01/13', title: 'روز طبیعت' },
        { date: '1405/02/10', title: 'شهادت امام علی (ع)' },
        { date: '1405/02/20', title: 'عید فطر' },
        { date: '1405/02/21', title: 'عید فطر' },
        { date: '1405/03/04', title: 'رحلت امام خمینی (ره)' },
        { date: '1405/03/05', title: 'قیام ۱۵ خرداد' },
        { date: '1405/03/19', title: 'تاسوعای حسینی' },
        { date: '1405/03/20', title: 'عاشورای حسینی' },
        { date: '1405/03/28', title: 'اربعین حسینی' },
        { date: '1405/04/06', title: 'رحلت رسول اکرم (ص)' },
        { date: '1405/04/08', title: 'شهادت امام حسن مجتبی (ع)' },
        { date: '1405/04/15', title: 'شهادت امام رضا (ع)' },
        { date: '1405/04/23', title: 'شهادت امام حسن عسکری (ع)' },
        { date: '1405/05/02', title: 'میلاد رسول اکرم (ص)' },
        { date: '1405/06/12', title: 'شهادت حضرت زهرا (س)' },
        { date: '1405/06/21', title: 'ولادت امام علی (ع)' },
        { date: '1405/07/05', title: 'مبعث رسول اکرم (ص)' },
        { date: '1405/08/12', title: 'ولادت حضرت مهدی (عج)' },
        { date: '1405/09/30', title: 'شب یلدا' },
        { date: '1405/11/22', title: 'پیروزی انقلاب اسلامی' },
        { date: '1405/12/29', title: 'روز ملی شدن صنعت نفت' }
    ];

    currentMonthName = computed(() => {
        return `${this.loc.getPersianMonthName(this.currentMonth())} ${this.toFa(this.currentYear())}`;
    });

    calendarDays = computed((): DayCell[] => {
        const month = this.currentMonth();
        const year = this.currentYear();
        const events = this.dataService.calendarEvents();

        const daysInMonth = month <= 6 ? 31 : (month <= 11 ? 30 : 29);
        const firstDayOfWeek = this.getFirstDayOfWeek(year, month);

        const days: DayCell[] = [];

        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevMonthDays = prevMonth <= 6 ? 31 : (prevMonth <= 11 ? 30 : 29);
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                month: prevMonth,
                year: prevYear,
                isCurrentMonth: false,
                isToday: false,
                isHoliday: false,
                isFriday: false,
                events: [],
                dateStr: ''
            });
        }

        const todayJalali = this.getTodayJalali();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const isHolidayDate = this.iranHolidays1405.some((h: { date: string; title: string }) => h.date === dateStr);
            const dayOfWeek = (firstDayOfWeek + day - 1) % 7;

            days.push({
                day,
                month,
                year,
                isCurrentMonth: true,
                isToday: todayJalali.year === year && todayJalali.month === month && todayJalali.day === day,
                isHoliday: isHolidayDate,
                isFriday: dayOfWeek === 6,
                events: dayEvents,
                dateStr
            });
        }

        const remainingDays = 42 - days.length;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        for (let day = 1; day <= remainingDays; day++) {
            days.push({
                day,
                month: nextMonth,
                year: nextYear,
                isCurrentMonth: false,
                isToday: false,
                isHoliday: false,
                isFriday: false,
                events: [],
                dateStr: ''
            });
        }

        return days;
    });

    todayEvents = computed(() => {
        const todayJalali = this.getTodayJalali();
        const dateStr = `${todayJalali.year}/${String(todayJalali.month).padStart(2, '0')}/${String(todayJalali.day).padStart(2, '0')}`;
        return this.dataService.calendarEvents().filter(e => e.date === dateStr);
    });

    upcomingEvents = computed(() => {
        const events = this.dataService.calendarEvents();
        const todayJalali = this.getTodayJalali();
        const todayStr = `${todayJalali.year}/${String(todayJalali.month).padStart(2, '0')}/${String(todayJalali.day).padStart(2, '0')}`;
        return events.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
    });

    getEventCount(type: string): number {
        return this.dataService.calendarEvents().filter(e => e.type === type).length;
    }

    getFilteredEvents(events: CalendarEvent[]): CalendarEvent[] {
        let filtered = events.filter(e => this.activeFilters().includes(e.type as EventType));
        if (this.searchQuery.trim()) {
            const q = this.searchQuery.trim().toLowerCase();
            filtered = filtered.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
        }
        return filtered;
    }

    toggleFilter(type: EventType): void {
        const current = [...this.activeFilters()];
        const idx = current.indexOf(type);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(type);
        this.activeFilters.set(current);
    }

    previousMonth(): void {
        if (this.currentMonth() === 1) {
            this.currentMonth.set(12);
            this.currentYear.update(y => y - 1);
        } else {
            this.currentMonth.update(m => m - 1);
        }
    }

    nextMonth(): void {
        if (this.currentMonth() === 12) {
            this.currentMonth.set(1);
            this.currentYear.update(y => y + 1);
        } else {
            this.currentMonth.update(m => m + 1);
        }
    }

    goToToday(): void {
        const today = this.getTodayJalali();
        this.currentMonth.set(today.month);
        this.currentYear.set(today.year);
        this.selectedDay.set(null);
        this.toastService.show(`تقویم به امروز (${this.toFa(today.year)}/${this.toFa(String(today.month).padStart(2, '0'))}/${this.toFa(String(today.day).padStart(2, '0'))}) منتقل شد`, 'success');
    }

    selectDay(day: DayCell): void {
        this.selectedDay.set(day);
    }

    closeDayDetail(): void {
        this.selectedDay.set(null);
    }

    openAddModal(): void {
        this.editingEvent = null;
        const todayJalali = this.getTodayJalali();
        this.eventForm = {
            title: '',
            description: '',
            type: 'meeting',
            date: `${todayJalali.year}/${String(todayJalali.month).padStart(2, '0')}/${String(todayJalali.day).padStart(2, '0')}`,
            time: ''
        };
        this.isEventModalOpen.set(true);
    }

    openAddModalForDay(day: DayCell): void {
        this.closeDayDetail();
        this.editingEvent = null;
        this.eventForm = {
            title: '',
            description: '',
            type: 'meeting',
            date: `${day.year}/${String(day.month).padStart(2, '0')}/${String(day.day).padStart(2, '0')}`,
            time: ''
        };
        this.isEventModalOpen.set(true);
    }

    editEvent(event: CalendarEvent): void {
        this.editingEvent = event;
        this.eventForm = {
            title: event.title,
            description: event.description,
            type: event.type as EventType,
            date: event.date,
            time: event.time || ''
        };
        this.isEventModalOpen.set(true);
    }

    closeEventModal(): void {
        this.isEventModalOpen.set(false);
        this.editingEvent = null;
    }

    saveEvent(): void {
        if (!this.eventForm.title.trim()) {
            this.toastService.show('عنوان رویداد الزامی است.', 'error');
            return;
        }

        if (this.editingEvent) {
            this.dataService.updateCalendarEvent(this.editingEvent.id, {
                title: this.eventForm.title,
                description: this.eventForm.description,
                type: this.eventForm.type,
                date: this.eventForm.date,
                time: this.eventForm.time || undefined
            });
            this.toastService.show('رویداد ویرایش شد.', 'success');
        } else {
            this.dataService.addCalendarEvent({
                date: this.eventForm.date,
                type: this.eventForm.type,
                title: this.eventForm.title,
                description: this.eventForm.description,
                time: this.eventForm.time || undefined
            });
            this.toastService.show('رویداد جدید ثبت شد.', 'success');
        }
        this.closeEventModal();
    }

    handleDeleteEvent(id: number): void {
        this.dataService.deleteCalendarEvent(id);
        this.toastService.show('رویداد حذف شد.', 'success');
        this.closeDayDetail();
    }

    // ── Style Helpers ──

    getDayCellClass(day: DayCell): string {
        if (!day.isCurrentMonth) return 'bg-slate-50/50 dark:bg-slate-900/30';
        if (day.isToday) return 'bg-primary/5 dark:bg-primary/10';
        if (day.isFriday || day.isHoliday) return 'bg-red-50/50 dark:bg-red-900/5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors';
        return 'hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors';
    }

    getDayNumberClass(day: DayCell): string {
        if (!day.isCurrentMonth) return 'text-muted/40';
        if (day.isToday) return 'text-primary font-bold hidden';
        if (day.isFriday || day.isHoliday) return 'text-red-500 font-bold';
        return 'text-foreground dark:text-slate-200';
    }

    getMiniDayClass(day: DayCell): string {
        if (!day.isCurrentMonth) return 'text-muted/30';
        if (day.isToday) return 'bg-primary text-white font-bold';
        if (day.events.length > 0) return 'bg-primary/10 text-primary font-bold';
        if (day.isFriday) return 'text-red-400';
        return 'text-foreground dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700';
    }

    getEventIcon(type: string): string {
        const map: Record<string, string> = {
            'leave': 'calendar-check',
            'meeting': 'users',
            'deadline': 'flag',
            'holiday': 'sun'
        };
        return map[type] || 'calendar';
    }

    getEventIconClass(type: string): string {
        const map: Record<string, string> = {
            'leave': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            'meeting': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            'deadline': 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
            'holiday': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        };
        return map[type] || 'bg-slate-100 text-slate-600';
    }

    getEventBadgeClass(type: string): string {
        const map: Record<string, string> = {
            'leave': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
            'meeting': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
            'deadline': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
            'holiday': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
        };
        return map[type] || 'bg-slate-100 text-slate-600';
    }

    getBorderClass(type: string): string {
        const map: Record<string, string> = {
            'leave': 'border-emerald-500',
            'meeting': 'border-blue-500',
            'deadline': 'border-amber-500',
            'holiday': 'border-red-500'
        };
        return map[type] || 'border-slate-400';
    }

    getEventTypeLabel(type: string): string {
        const map: Record<string, string> = {
            'leave': 'مرخصی',
            'meeting': 'جلسه',
            'deadline': 'مهلت',
            'holiday': 'تعطیل'
        };
        return map[type] || type;
    }

    toFa(num: number | string): string {
        return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
    }

    // ── Jalali Helpers ──

    private getTodayJalali(): { year: number; month: number; day: number } {
        const now = new Date();
        const dateStr = now.toLocaleDateString('fa-IR');
        const parts = dateStr.split('/').map(p =>
            parseInt(p.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()))
        );
        return { year: parts[0], month: parts[1], day: parts[2] };
    }

    private getFirstDayOfWeek(jy: number, jm: number): number {
        const g = this.jalaliToGregorian(jy, jm, 1);
        const d = new Date(g.gy, g.gm - 1, g.gd);
        const dow = d.getDay();
        return (dow + 1) % 7;
    }

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
        if (gd <= 186) {
            gm = Math.ceil(gd / 31);
            gd = gd - (gm - 1) * 31;
        } else {
            gm = Math.ceil((gd - 186) / 30) + 6;
            gd = gd - 186 - (gm - 7) * 30;
        }
        return { gy, gm, gd };
    }
}
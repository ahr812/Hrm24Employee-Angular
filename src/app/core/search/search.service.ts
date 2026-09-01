import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeDataService } from '../data/employee-data.service';
import { OrganizationService } from '../organization/organization.service';
import { ThemeService } from '../../shared/layout/theme.service';

export interface SearchResult {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'page' | 'notification' | 'ticket' | 'action';
    route?: string;
    action?: () => void;
    badge?: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
    private router = inject(Router);
    private dataService = inject(EmployeeDataService);
    private orgService = inject(OrganizationService);
    private themeService = inject(ThemeService);

    isOpen = signal(false);
    query = signal('');
    selectedIndex = signal(0);

    private allItems = computed((): SearchResult[] => {
        const notifications = this.dataService.notifications();
        const tickets = this.dataService.tickets();

        return [
            {
                id: 'page-dashboard',
                title: 'داشبورد',
                description: 'مشاهده نمای کلی و آمار',
                icon: 'dashboard',
                category: 'page',
                route: '/dashboard'
            },
            {
                id: 'page-attendance',
                title: 'تردد من',
                description: 'ثبت ورود و خروج و مشاهده سوابق',
                icon: 'clock',
                category: 'page',
                route: '/attendance'
            },
            {
                id: 'page-leave',
                title: 'مرخصی‌ها',
                description: 'درخواست مرخصی و مشاهده مانده',
                icon: 'calendar',
                category: 'page',
                route: '/leave'
            },
            {
                id: 'page-payslip',
                title: 'فیش حقوقی',
                description: 'مشاهده و دانلود فیش حقوقی',
                icon: 'chart',
                category: 'page',
                route: '/payslip'
            },
            {
                id: 'page-tickets',
                title: 'تیکت‌ها',
                description: 'ارتباط با پشتیبانی و واحدها',
                icon: 'ticket',
                category: 'page',
                route: '/tickets'
            },
            {
                id: 'page-notifications',
                title: 'اعلان‌ها',
                description: 'مشاهده پیام‌ها و اطلاعیه‌ها',
                icon: 'bell',
                category: 'page',
                route: '/notifications',
                badge: this.dataService.unreadCount() > 0 ? `${this.dataService.unreadCount()} جدید` : undefined
            },
            {
                id: 'page-profile',
                title: 'پروفایل من',
                description: 'مشاهده و ویرایش اطلاعات شخصی',
                icon: 'user',
                category: 'page',
                route: '/profile'
            },
            {
                id: 'page-help',
                title: 'راهنما',
                description: 'سوالات متداول و پشتیبانی',
                icon: 'help-circle',
                category: 'page',
                route: '/help'
            },
            ...notifications
                .filter(n => !n.isRead)
                .map(n => ({
                    id: `notification-${n.id}`,
                    title: n.title,
                    description: n.message,
                    icon: n.type === 'success' ? 'check-circle' : n.type === 'warning' ? 'alert-triangle' : n.type === 'danger' ? 'alert-circle' : 'bell',
                    category: 'notification' as const,
                    route: '/notifications',
                    badge: n.date
                })),
            ...tickets
                .filter(t => t.status !== 'بسته شده')
                .map(t => ({
                    id: `ticket-${t.id}`,
                    title: t.title,
                    description: `واحد: ${t.department} | وضعیت: ${t.status}`,
                    icon: 'ticket',
                    category: 'ticket' as const,
                    route: '/tickets',
                    badge: t.status
                })),
            {
                id: 'action-toggle-theme',
                title: 'تغییر تم تاریک/روشن',
                description: 'سوییچ بین حالت روز و شب',
                icon: 'moon',
                category: 'action',
                action: () => this.themeService.toggle()
            },
            {
                id: 'action-logout',
                title: 'خروج از حساب کاربری',
                description: 'پایان جلسه کاری',
                icon: 'logout',
                category: 'action',
                route: '/'
            }
        ];
    });

    filteredResults = computed((): SearchResult[] => {
        const q = this.query().trim().toLowerCase();
        if (!q) return this.allItems();
        return this.allItems().filter(item =>
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
        );
    });

    groupedResults = computed(() => {
        const results = this.filteredResults();
        const groups: Record<string, SearchResult[]> = {
            page: [],
            notification: [],
            ticket: [],
            action: []
        };
        results.forEach(item => {
            groups[item.category].push(item);
        });
        return groups;
    });

    open(): void {
        this.isOpen.set(true);
        this.query.set('');
        this.selectedIndex.set(0);
    }

    close(): void {
        this.isOpen.set(false);
        this.query.set('');
        this.selectedIndex.set(0);
    }

    toggle(): void {
        if (this.isOpen()) {
            this.close();
        } else {
            this.open();
        }
    }

    updateQuery(value: string): void {
        this.query.set(value);
        this.selectedIndex.set(0);
    }

    selectNext(): void {
        const total = this.filteredResults().length;
        if (total === 0) return;
        this.selectedIndex.update(i => (i + 1) % total);
    }

    selectPrevious(): void {
        const total = this.filteredResults().length;
        if (total === 0) return;
        this.selectedIndex.update(i => (i - 1 + total) % total);
    }

    selectCurrent(): void {
        const results = this.filteredResults();
        const selected = results[this.selectedIndex()];
        if (!selected) return;
        this.selectItem(selected);
    }

    selectItem(item: SearchResult): void {
        if (item.action) {
            item.action();
        }
        if (item.route) {
            this.router.navigate([item.route]);
        }
        this.close();
    }
}
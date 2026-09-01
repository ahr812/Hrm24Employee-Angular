import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export type ReminderPriority = 'high' | 'medium' | 'low';
export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Reminder {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    priority: ReminderPriority;
    repeat: ReminderRepeat;
    isCompleted: boolean;
    createdAt: string;
    orgId: string;
}

@Injectable({ providedIn: 'root' })
export class ReminderService {
    private readonly STORAGE_KEY = 'hrm24_reminders';
    private orgService = inject(OrganizationService);

    reminders = signal<Reminder[]>(this.loadReminders());

    stats = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const all = this.reminders().filter(r => r.orgId === orgId);
        return {
            total: all.length,
            pending: all.filter(r => !r.isCompleted).length,
            completed: all.filter(r => r.isCompleted).length,
            highPriority: all.filter(r => r.priority === 'high' && !r.isCompleted).length,
            today: all.filter(r => this.isToday(r.date) && !r.isCompleted).length
        };
    });

    upcomingReminders = computed(() => {
        const orgId = this.orgService.activeOrg().id;
        const now = new Date();
        return this.reminders()
            .filter(r => r.orgId === orgId && !r.isCompleted)
            .filter(r => new Date(r.date) >= now)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);
    });

    addReminder(reminder: Omit<Reminder, 'id' | 'createdAt' | 'orgId' | 'isCompleted'>): void {
        const newReminder: Reminder = {
            ...reminder,
            id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            orgId: this.orgService.activeOrg().id,
            isCompleted: false
        };
        this.reminders.update(current => [newReminder, ...current]);
        this.saveReminders();
    }

    updateReminder(id: string, updates: Partial<Reminder>): void {
        this.reminders.update(current =>
            current.map(r => r.id === id ? { ...r, ...updates } : r)
        );
        this.saveReminders();
    }

    deleteReminder(id: string): void {
        this.reminders.update(current => current.filter(r => r.id !== id));
        this.saveReminders();
    }

    toggleComplete(id: string): void {
        this.reminders.update(current =>
            current.map(r => r.id === id ? { ...r, isCompleted: !r.isCompleted } : r)
        );
        this.saveReminders();
    }

    getReminderById(id: string): Reminder | undefined {
        return this.reminders().find(r => r.id === id);
    }

    private isToday(dateStr: string): boolean {
        const today = new Date();
        const date = new Date(dateStr);
        return today.getDate() === date.getDate() &&
            today.getMonth() === date.getMonth() &&
            today.getFullYear() === date.getFullYear();
    }

    formatDate(dateStr: string): string {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    }

    formatTime(timeStr: string): string {
        return timeStr || '--:--';
    }

    getPriorityLabel(priority: ReminderPriority): string {
        const labels: Record<ReminderPriority, string> = {
            high: 'بالا',
            medium: 'متوسط',
            low: 'پایین'
        };
        return labels[priority];
    }

    getRepeatLabel(repeat: ReminderRepeat): string {
        const labels: Record<ReminderRepeat, string> = {
            none: 'بدون تکرار',
            daily: 'روزانه',
            weekly: 'هفتگی',
            monthly: 'ماهانه'
        };
        return labels[repeat];
    }

    private loadReminders(): Reminder[] {
        if (typeof localStorage === 'undefined') return this.getDefaultReminders();
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : this.getDefaultReminders();
        } catch {
            return this.getDefaultReminders();
        }
    }

    private saveReminders(): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.reminders()));
        } catch (error) {
            console.error('Error saving reminders:', error);
        }
    }

    private getDefaultReminders(): Reminder[] {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);

        return [
            {
                id: 'reminder-default-1',
                title: 'جلسه هفتگی تیم فنی',
                description: 'بررسی پیشرفت پروژه‌ها و برنامه‌ریزی هفته آینده',
                date: tomorrow.toISOString().split('T')[0],
                time: '10:00',
                priority: 'high',
                repeat: 'weekly',
                isCompleted: false,
                createdAt: new Date().toISOString(),
                orgId: 'org1'
            },
            {
                id: 'reminder-default-2',
                title: 'ارسال گزارش ماهانه',
                description: 'گزارش عملکرد ماه جاری را آماده و ارسال کنید',
                date: nextWeek.toISOString().split('T')[0],
                time: '17:00',
                priority: 'medium',
                repeat: 'monthly',
                isCompleted: false,
                createdAt: new Date().toISOString(),
                orgId: 'org1'
            },
            {
                id: 'reminder-default-3',
                title: 'تمدید گواهی SSL',
                description: 'گواهی SSL سرور اصلی تا پایان هفته منقضی می‌شود',
                date: now.toISOString().split('T')[0],
                time: '09:00',
                priority: 'high',
                repeat: 'none',
                isCompleted: false,
                createdAt: new Date().toISOString(),
                orgId: 'org1'
            }
        ];
    }
}
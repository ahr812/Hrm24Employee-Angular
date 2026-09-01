import { Injectable, signal, inject } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

export type PermissionState = 'default' | 'granted' | 'denied';

export interface PushNotificationSettings {
    enabled: boolean;
    soundEnabled: boolean;
    desktopNotifications: boolean;
    emailNotifications: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
}

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
    private readonly SETTINGS_KEY = 'hrm24_push_settings';
    private orgService = inject(OrganizationService);

    permission = signal<PermissionState>('default');
    settings = signal<PushNotificationSettings>(this.loadSettings());
    isSupported = signal(false);

    constructor() {
        this.checkBrowserSupport();
        this.loadPermission();
    }

    private checkBrowserSupport(): void {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            this.isSupported.set(true);
        }
    }

    private loadPermission(): void {
        if (this.isSupported()) {
            this.permission.set(Notification.permission as PermissionState);
        }
    }

    private loadSettings(): PushNotificationSettings {
        if (typeof localStorage === 'undefined') {
            return this.getDefaultSettings();
        }

        try {
            const stored = localStorage.getItem(this.SETTINGS_KEY);
            if (stored) {
                return { ...this.getDefaultSettings(), ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('Error loading push settings:', error);
        }

        return this.getDefaultSettings();
    }

    private getDefaultSettings(): PushNotificationSettings {
        return {
            enabled: true,
            soundEnabled: true,
            desktopNotifications: false,
            emailNotifications: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00'
        };
    }

    private saveSettings(): void {
        if (typeof localStorage === 'undefined') return;

        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings()));
        } catch (error) {
            console.error('Error saving push settings:', error);
        }
    }

    async requestPermission(): Promise<boolean> {
        if (!this.isSupported()) return false;

        try {
            const result = await Notification.requestPermission();
            this.permission.set(result as PermissionState);

            if (result === 'granted') {
                this.updateSettings({ desktopNotifications: true });
                this.showTestNotification();
            }

            return result === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    private showTestNotification(): void {
        if (this.permission() !== 'granted') return;

        const org = this.orgService.activeOrg();
        new Notification('اعلان‌ها فعال شدند 🎉', {
            body: `اعلان‌های ${org.name} با موفقیت فعال شدند.`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'test-notification',
            dir: 'rtl',
            lang: 'fa'
        });
    }

    showNotification(title: string, body: string, options?: Partial<NotificationOptions>): void {
        if (!this.settings().enabled) return;

        if (this.isInQuietHours()) return;

        if (this.settings().desktopNotifications && this.permission() === 'granted') {
            try {
                const notification = new Notification(title, {
                    body,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    dir: 'rtl',
                    lang: 'fa',
                    tag: `notification-${Date.now()}`,
                    ...options
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                setTimeout(() => notification.close(), 5000);
            } catch (error) {
                console.error('Error showing notification:', error);
            }
        }

        if (this.settings().soundEnabled) {
            this.playNotificationSound();
        }
    }

    private playNotificationSound(): void {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgipW...');
            audio.volume = 0.3;
            audio.play().catch(() => { });
        } catch (error) {
            // Silent fail
        }
    }

    private isInQuietHours(): boolean {
        const { quietHoursStart, quietHoursEnd } = this.settings();
        if (!quietHoursStart || !quietHoursEnd) return false;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (quietHoursStart <= quietHoursEnd) {
            return currentTime >= quietHoursStart && currentTime <= quietHoursEnd;
        } else {
            return currentTime >= quietHoursStart || currentTime <= quietHoursEnd;
        }
    }

    updateSettings(partial: Partial<PushNotificationSettings>): void {
        this.settings.set({ ...this.settings(), ...partial });
        this.saveSettings();
    }

    resetSettings(): void {
        this.settings.set(this.getDefaultSettings());
        this.saveSettings();
    }

    getPermissionText(): string {
        switch (this.permission()) {
            case 'granted': return 'فعال';
            case 'denied': return 'مسدود شده';
            default: return 'درخواست نشده';
        }
    }

    getPermissionColor(): string {
        switch (this.permission()) {
            case 'granted': return 'success';
            case 'denied': return 'danger';
            default: return 'warning';
        }
    }
}
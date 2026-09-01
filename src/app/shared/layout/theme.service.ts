import { Injectable, signal, effect, inject } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange';

interface ThemeConfig {
    mode: ThemeMode;
    color: ThemeColor;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly STORAGE_KEY = 'hrm24_theme';

    isDark = signal(false);
    themeColor = signal<ThemeColor>('blue');
    themeMode = signal<ThemeMode>('system');

    constructor() {
        this.loadThemeFromStorage();
        this.applyTheme();

        // گوش دادن به تغییرات تم سیستم
        if (typeof window !== 'undefined') {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.themeMode() === 'system') {
                    this.isDark.set(e.matches);
                    this.applyThemeToDOM();
                }
            });
        }
    }

    private loadThemeFromStorage(): void {
        if (typeof localStorage === 'undefined') return;

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const config: ThemeConfig = JSON.parse(stored);
                this.themeMode.set(config.mode);
                this.themeColor.set(config.color);

                if (config.mode === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    this.isDark.set(prefersDark);
                } else {
                    this.isDark.set(config.mode === 'dark');
                }
            } else {
                // تم پیش‌فرض
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.isDark.set(prefersDark);
                this.themeMode.set('system');
                this.themeColor.set('blue');
            }
        } catch (error) {
            console.error('Error loading theme from storage:', error);
        }
    }

    private saveThemeToStorage(): void {
        if (typeof localStorage === 'undefined') return;

        try {
            const config: ThemeConfig = {
                mode: this.themeMode(),
                color: this.themeColor()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
        } catch (error) {
            console.error('Error saving theme to storage:', error);
        }
    }

    private applyTheme(): void {
        this.applyThemeToDOM();
        this.applyColorTheme();
    }

    private applyThemeToDOM(): void {
        if (typeof document === 'undefined') return;

        if (this.isDark()) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    private applyColorTheme(): void {
        if (typeof document === 'undefined') return;

        const color = this.themeColor();
        document.documentElement.setAttribute('data-theme', color);
    }

    toggle(): void {
        const newMode: ThemeMode = this.isDark() ? 'light' : 'dark';
        this.setThemeMode(newMode);
    }

    setThemeMode(mode: ThemeMode): void {
        this.themeMode.set(mode);

        if (mode === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.isDark.set(prefersDark);
        } else {
            this.isDark.set(mode === 'dark');
        }

        this.applyThemeToDOM();
        this.saveThemeToStorage();
    }

    setThemeColor(color: ThemeColor): void {
        this.themeColor.set(color);
        this.applyColorTheme();
        this.saveThemeToStorage();
    }

    getThemeMode(): ThemeMode {
        return this.themeMode();
    }

    getThemeColor(): ThemeColor {
        return this.themeColor();
    }
}
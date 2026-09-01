import { Component, inject, signal, HostListener } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { ThemeService, ThemeMode, ThemeColor } from '../../layout/theme.service';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="relative">
      <!-- Toggle Button -->
      <button
        type="button"
        (click)="toggleDropdown()"
        class="p-2 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700"
        aria-label="تنظیمات تم"
      >
        <ui-icon name="settings" [size]="20" class="text-slate-700 dark:text-slate-200"></ui-icon>
      </button>

      <!-- Dropdown Menu -->
      @if (isOpen()) {
        <div class="absolute left-0 mt-2 w-72 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-down dark:bg-slate-800 dark:border-slate-700">
          
          <!-- Header -->
          <div class="p-4 border-b border-border dark:border-slate-700">
            <h3 class="font-bold text-foreground dark:text-slate-100">تنظیمات ظاهری</h3>
            <p class="text-xs text-muted mt-1">حالت و رنگ تم را انتخاب کنید</p>
          </div>

          <!-- Theme Mode Selection -->
          <div class="p-4 border-b border-border dark:border-slate-700">
            <p class="text-sm font-medium text-foreground mb-3 dark:text-slate-200">حالت نمایش</p>
            <div class="grid grid-cols-3 gap-2">
              @for (mode of themeModes; track mode.value) {
                <button
                  type="button"
                  (click)="setMode(mode.value)"
                  class="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all"
                  [class]="themeService.themeMode() === mode.value 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-border hover:border-primary/50 text-muted dark:border-slate-700 dark:hover:border-slate-600'"
                >
                  <ui-icon [name]="mode.icon" [size]="20"></ui-icon>
                  <span class="text-xs font-medium">{{ mode.label }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Theme Color Selection -->
          <div class="p-4">
            <p class="text-sm font-medium text-foreground mb-3 dark:text-slate-200">رنگ تم</p>
            <div class="grid grid-cols-4 gap-3">
              @for (color of themeColors; track color.value) {
                <button
                  type="button"
                  (click)="setColor(color.value)"
                  class="relative w-full aspect-square rounded-xl border-2 transition-all hover:scale-110"
                  [class]="color.bgClass"
                  [style.border-color]="themeService.themeColor() === color.value ? 'currentColor' : 'transparent'"
                  [attr.aria-label]="color.label"
                >
                  @if (themeService.themeColor() === color.value) {
                    <div class="absolute inset-0 flex items-center justify-center">
                      <ui-icon name="check" [size]="20" class="text-white drop-shadow-lg"></ui-icon>
                    </div>
                  }
                </button>
              }
            </div>
            <div class="flex justify-between mt-2 text-xs text-muted">
              @for (color of themeColors; track color.value) {
                <span>{{ color.label }}</span>
              }
            </div>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fade-in-down {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fade-in-down {
      animation: fade-in-down 0.2s ease-out;
    }
  `]
})
export class ThemeSwitcherComponent {
  themeService = inject(ThemeService);
  isOpen = signal(false);

  themeModes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'روشن', icon: 'sun' },
    { value: 'dark', label: 'تاریک', icon: 'moon' },
    { value: 'system', label: 'سیستم', icon: 'monitor' }
  ];

  themeColors: { value: ThemeColor; label: string; bgClass: string }[] = [
    { value: 'blue', label: 'آبی', bgClass: 'bg-blue-500' },
    { value: 'green', label: 'سبز', bgClass: 'bg-green-500' },
    { value: 'purple', label: 'بنفش', bgClass: 'bg-purple-500' },
    { value: 'orange', label: 'نارنجی', bgClass: 'bg-orange-500' }
  ];

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  setMode(mode: ThemeMode): void {
    this.themeService.setThemeMode(mode);
  }

  setColor(color: ThemeColor): void {
    this.themeService.setThemeColor(color);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-theme-switcher')) {
      this.isOpen.set(false);
    }
  }
}
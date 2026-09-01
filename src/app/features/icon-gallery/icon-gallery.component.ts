import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-icon-gallery',
  standalone: true,
  imports: [IconComponent, FormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto">
      <h1 class="text-2xl font-bold mb-2">گالری آیکون‌ها</h1>
      <p class="text-sm text-muted mb-6">{{ filteredIcons().length }} آیکون • کلیک = کپی نام</p>
      <div class="mb-6">
        <input type="text" [(ngModel)]="searchQuery" placeholder="جستجوی آیکون..."
          class="w-full max-w-md px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
      </div>
      <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
        @for (icon of filteredIcons(); track icon) {
          <div class="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:bg-primary/5 hover:border-primary/30 transition-colors cursor-pointer"
               (click)="copyName(icon)">
            <ui-icon [name]="icon" [size]="28" class="text-foreground"></ui-icon>
            <span class="text-[9px] text-muted text-center truncate w-full">{{ icon }}</span>
          </div>
        }
      </div>
      @if (filteredIcons().length === 0) {
        <div class="text-center py-12"><p class="text-muted">آیکونی یافت نشد</p></div>
      }
    </div>
  `
})
export class IconGalleryComponent {
  searchQuery = '';
  allIcons = [
    'menu', 'dashboard', 'layout-dashboard', 'clock', 'calendar', 'calendar-check', 'calendar-days',
    'chart', 'bar-chart-2', 'ticket', 'bell', 'user', 'users', 'help-circle', 'search', 'sun', 'moon',
    'logout', 'download', 'eye', 'eye-off', 'printer', 'x', 'check', 'check-circle', 'alert-triangle',
    'alert-circle', 'info', 'chevron-down', 'chevron-left', 'chevron-right', 'corner-down-left',
    'activity', 'trending-up', 'trending-down', 'history', 'shield', 'shield-alert', 'sliders',
    'camera', 'save', 'lock', 'key', 'list-check', 'plus', 'edit', 'trash-2', 'flag', 'zap', 'cloud',
    'message-circle', 'message-square', 'send', 'map-pin', 'login', 'arrow-right', 'target', 'star',
    'award', 'clipboard-check', 'file-text', 'wallet', 'inbox', 'briefcase', 'banknote', 'piggy-bank',
    'graduation-cap', 'poll', 'folder-open', 'check-square', 'credit-card', 'palette', 'phone', 'mail',
    'book-open', 'thumbs-up', 'thumbs-down', 'external-link', 'life-buoy', 'settings'
  ];

  filteredIcons(): string[] {
    if (!this.searchQuery.trim()) return this.allIcons;
    const q = this.searchQuery.trim().toLowerCase();
    return this.allIcons.filter(n => n.includes(q));
  }

  copyName(name: string): void {
    navigator.clipboard.writeText(name);
  }
}
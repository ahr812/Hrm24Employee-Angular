import { Component, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { IconComponent } from '../../ui/icon/icon.component';
import { LayoutService } from '../layout.service';
import { SearchService } from '../../../core/search/search.service';
import { ProfileMenuComponent } from './profile-menu/profile-menu.component';
import { NotificationModalComponent } from '../../ui/notification-modal/notification-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    IconComponent,
    ProfileMenuComponent,
    NotificationModalComponent
  ],
  template: `
    <header class="flex items-center justify-between h-16 px-4 md:px-6 bg-surface border-b border-border shadow-sm sticky top-0 z-30 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300">
      
      <!-- Right: Menu + Logo -->
      <div class="flex items-center gap-3">
        <button 
          type="button"
          (click)="layoutService.toggleSidebar()" 
          class="p-2 rounded-lg hover:bg-primary/10 transition-colors dark:hover:bg-slate-700" 
          aria-label="منو">
          <ui-icon name="menu" [size]="24"></ui-icon>
        </button>
        <img 
          src="images/logofull.svg" 
          alt="Fish24" 
          class="h-9 w-auto cursor-pointer hover:opacity-80 transition-opacity"
          (click)="goToDashboard()" />
      </div>
      
      <!-- Left: Actions -->
      <div class="flex items-center gap-2">
        
        <!-- Search Button -->
        <button 
          type="button"
          (click)="searchService.open()"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors dark:bg-slate-900 dark:border-slate-700 dark:hover:border-slate-600"
          aria-label="جستجو">
          <ui-icon name="search" [size]="18" class="text-muted"></ui-icon>
          <span class="text-sm text-muted hidden sm:inline">جستجو...</span>
          <kbd class="hidden md:inline px-2 py-0.5 text-xs bg-surface border border-border rounded dark:bg-slate-800 dark:border-slate-700">Ctrl+K</kbd>
        </button>

        <!-- Notification Modal -->
        <app-notification-modal #notifModal></app-notification-modal>

        <!-- Profile Menu -->
        <app-profile-menu (requestOpenNotification)="openNotification()"></app-profile-menu>

      </div>
    </header>
  `
})
export class HeaderComponent {
  protected layoutService = inject(LayoutService);
  protected searchService = inject(SearchService);
  private router = inject(Router);

  @ViewChild('notifModal') notifModal?: NotificationModalComponent;

  openNotification(): void {
    if (this.notifModal) {
      this.notifModal.open();
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
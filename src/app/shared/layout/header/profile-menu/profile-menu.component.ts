import { Component, inject, signal, HostListener, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '../../../ui/icon/icon.component';
import { ThemeService, ThemeColor } from '../../theme.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { EmployeeDataService } from '../../../../core/data/employee-data.service';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="relative user-dropdown-container">
      <!-- دکمه آواتار -->
      <button 
        type="button"
        (click)="toggleMenu($event)"
        class="w-10 h-10 rounded-full overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 shadow-sm cursor-pointer ring-2 ring-transparent hover:ring-primary/30"
        aria-label="منوی کاربر">
        <img src="images/avatar3.jpg" alt="پروفایل" class="w-full h-full object-cover" />
      </button>

      <!-- منوی کشویی -->
      @if (isMenuOpen()) {
        <div 
          class="absolute top-full left-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-up dark:bg-slate-800 dark:border-slate-700"
          (click)="$event.stopPropagation()">
          
          <!-- بخش اطلاعات کاربر -->
          <div class="px-4 py-4 border-b border-border dark:border-slate-700 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
             <img src="images/avatar3.jpg" alt="پروفایل" class="w-16 h-16 rounded-full object-cover ring-4 ring-white dark:ring-slate-700 mb-2" />
             <h3 class="font-bold text-foreground text-base">{{ displayName() }}</h3>
             <p class="text-xs text-muted mt-1">{{ jobProfile().jobTitle }}</p>
             <p class="text-[11px] mt-1 flex items-center justify-center gap-1">
               <span class="text-muted">کد پرسنلی:</span>
               <span class="font-mono dir-ltr font-bold text-foreground dark:text-slate-200">{{ jobProfile().personnelCode }}</span>
             </p>
          </div>

          <!-- لیست منو -->
          <div class="p-2 space-y-1">
            
            <!-- دکمه تنظیمات اعلان‌ها -->
            <button 
              type="button"
              (click)="triggerNotification()"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors text-right group">
              <ui-icon name="bell" [size]="18" class="text-muted group-hover:text-primary transition-colors"></ui-icon>
              <span class="text-sm font-bold text-foreground dark:text-slate-100">تنظیمات اعلان‌ها</span>
            </button>

            <!-- پروفایل -->
            <button 
              type="button"
              (click)="goToProfile()"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors text-right group">
              <ui-icon name="user" [size]="18" class="text-muted group-hover:text-primary transition-colors"></ui-icon>
              <span class="text-sm font-bold text-foreground dark:text-slate-100">پروفایل کاربری</span>
            </button>
            
            <!-- تنظیمات سامانه -->
            <button 
              type="button"
              (click)="goToSettings()"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors text-right group">
              <ui-icon name="settings" [size]="18" class="text-muted group-hover:text-primary transition-colors"></ui-icon>
              <span class="text-sm font-bold text-foreground dark:text-slate-100">تنظیمات سامانه</span>
            </button>
          </div>

          <!-- تنظیمات ظاهری -->
          <div class="px-3 py-2 border-b border-dashed border-border dark:border-slate-700 mb-2">
            <div class="text-xs font-bold text-muted mb-2 flex items-center gap-2">
              <ui-icon name="palette" [size]="14"></ui-icon>
              تنظیمات ظاهری
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-foreground dark:text-slate-200">حالت تاریک</span>
              <button
                (click)="themeService.toggle()"
                class="relative w-9 h-5 rounded-full transition-colors"
                [class.bg-primary]="themeService.isDark()"
                [class.bg-slate-300]="!themeService.isDark()"
              >
                <span
                  class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                  [class.translate-x-4]="themeService.isDark()"
                  [class.translate-x-0.5]="!themeService.isDark()"
                ></span>
              </button>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-foreground dark:text-slate-200">رنگ سازمانی</span>
              <div class="flex gap-1">
                @for (color of colors; track color.id) {
                  <button
                    (click)="themeService.setThemeColor(color.id)"
                    class="w-5 h-5 rounded-full ring-1 ring-offset-1 ring-offset-surface dark:ring-offset-slate-800"
                    [class.ring-primary]="themeService.getThemeColor() === color.id"
                    [style.backgroundColor]="color.hex"
                  ></button>
                }
              </div>
            </div>
          </div>

          <!-- خروج -->
          <div class="p-2 border-t border-border dark:border-slate-700 bg-red-50/50 dark:bg-red-900/10">
            <button 
              type="button"
              (click)="logout()"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-right">
              <ui-icon name="logout" [size]="18" class="text-danger"></ui-icon>
              <span class="text-sm font-bold text-danger">خروج از سامانه</span>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up { animation: fade-in-up 0.2s ease-out forwards; }
  `]
})
export class ProfileMenuComponent {
  private router = inject(Router);
  protected themeService = inject(ThemeService);
  protected authService = inject(AuthService);
  private dataService = inject(EmployeeDataService);

  isMenuOpen = signal(false);
  jobProfile = this.dataService.jobProfile;

  requestOpenNotification = output<void>();

  // Get display name from auth service or fallback
  displayName(): string {
    const user = this.authService.currentUser();
    return user?.fullName || 'کاربر';
  }

  colors: { id: ThemeColor; name: string; hex: string }[] = [
    { id: 'blue', name: 'آبی', hex: '#3b82f6' },
    { id: 'green', name: 'سبز', hex: '#10b981' },
    { id: 'purple', name: 'بنفش', hex: '#8b5cf6' },
    { id: 'orange', name: 'نارنجی', hex: '#f97316' }
  ];

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen.update(v => !v);
  }

  triggerNotification(): void {
    this.isMenuOpen.set(false);
    setTimeout(() => {
      this.requestOpenNotification.emit();
    }, 100);
  }

  goToProfile(): void {
    this.isMenuOpen.set(false);
    this.router.navigate(['/profile']);
  }

  goToSettings(): void {
    this.isMenuOpen.set(false);
  }

  logout(): void {
    this.isMenuOpen.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isMenuOpen()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-dropdown-container')) {
        this.isMenuOpen.set(false);
      }
    }
  }
}
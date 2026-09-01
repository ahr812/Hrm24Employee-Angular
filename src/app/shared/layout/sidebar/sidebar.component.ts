import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../ui/icon/icon.component';
import { LayoutService } from '../layout.service';
import { EmployeeDataService } from '../../../core/data/employee-data.service';
import { ChatService } from '../../../core/chat/chat.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Fish24PermissionService } from '../../../core/fish24/permissions/fish24-permission.service';
import { Fish24RolePreviewService } from '../../../core/fish24/dev/fish24-role-preview.service';
import { getFish24NavigationConfig } from '../navigation/fish24-nav.config';
import { Fish24NavItem } from '../navigation/nav-item.model';
import { Fish24RoleId } from '../../../core/fish24/models/fish24-role.model';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  color: string;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, CommonModule],
  template: `
    <!-- ===== Desktop Sidebar (lg and above) ===== -->
    <div class="hidden lg:flex flex-col h-full bg-surface dark:bg-slate-800">
      <!-- Role Preview Selector (Development Only) -->
      <div class="px-4 pt-3 pb-2 border-b border-border dark:border-slate-700">
        <label class="text-xs font-bold text-muted dark:text-slate-400 block mb-1">پیش‌نمایش نقش (Dev)</label>
        <select 
          [value]="previewRoleService.getPreviewRole()"
          (change)="onRoleChange($event)"
          class="w-full px-2 py-1.5 text-xs rounded border border-border dark:border-slate-600 bg-white dark:bg-slate-700 text-foreground dark:text-slate-200 font-semibold">
          <option value="super-admin">مدیر اصلی سامانه</option>
          <option value="sales-expert">کارشناس فروش</option>
          <option value="support-expert">کارشناس پشتیبانی</option>
          <option value="employer">کارفرما</option>
          <option value="employee">کارمند</option>
        </select>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-1.5">
        <div class="h-4"></div>
        
        <!-- Fish24 Role-Aware Navigation -->
        @for (item of filteredNavigationItems(); track item.id) {
          <div>
            @if (item.children && item.children.length > 0) {
              <!-- Group with children - expandable -->
              <div class="mb-2">
                <button
                  (click)="toggleGroup(item.id)"
                  type="button"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted dark:text-slate-300 transition-all duration-200 hover:bg-primary/8 dark:hover:bg-primary/15 group">
                  <ui-icon [name]="item.icon || 'folder'" [size]="20" class="text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform duration-200"></ui-icon>
                  <span class="font-extrabold text-sm flex-1">{{ item.label }}</span>
                  <ui-icon 
                    [name]="'chevron-down'" 
                    [size]="18" 
                    class="text-slate-400 dark:text-slate-500 transition-transform duration-300"
                    [style.transform]="isGroupExpanded(item.id) ? 'rotate(180deg)' : 'rotate(0deg)'">
                  </ui-icon>
                </button>
                
                <!-- Children - shown when expanded -->
                @if (isGroupExpanded(item.id)) {
                  <div class="pl-8 space-y-1.5 mt-3 mb-1">
                    @for (child of item.children; track child.id) {
                      <div class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors duration-200 group cursor-default text-foreground dark:text-slate-300">
                        <span class="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 flex-shrink-0 mt-0.5"></span>
                        <span class="text-sm font-medium leading-tight">{{ child.label }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            } @else if (item.route) {
              <!-- Clickable item with route (leaf navigation) -->
              <a [routerLink]="item.route" routerLinkActive="bg-primary/10 text-primary" 
                 class="flex items-center gap-3 px-4 py-3 rounded-xl text-muted transition-all duration-200 group hover:bg-primary/8 dark:hover:bg-primary/15"
                 (click)="onDesktopNavClick()">
                <ui-icon [name]="item.icon || 'file-text'" [size]="20" class="text-blue-500 group-hover:scale-110 transition-transform duration-200"></ui-icon>
                <span class="font-extrabold text-sm">{{ item.label }}</span>
              </a>
            } @else {
              <!-- Non-clickable future item (no route, no children) -->
              <div class="flex items-center gap-3 px-4 py-3 rounded-xl text-muted dark:text-slate-300">
                <ui-icon [name]="item.icon || 'file-text'" [size]="20" class="text-blue-500"></ui-icon>
                <span class="font-extrabold text-sm">{{ item.label }}</span>
              </div>
            }
          </div>
        }

        <!-- Logout -->
        <button
          (click)="onLogout()"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted mt-6 transition-all duration-200 group hover:bg-danger/8 dark:hover:bg-danger/15"
          type="button">
          <ui-icon name="log-out" [size]="20" class="text-danger group-hover:scale-110 transition-transform duration-200"></ui-icon>
          <span class="font-extrabold text-sm">خروج</span>
        </button>
      </nav>
    </div>

    <!-- ===== Mobile/Tablet Sidebar (below lg) ===== -->
    <div class="lg:hidden w-full h-full flex flex-col bg-surface dark:bg-slate-800">
      <!-- Role Preview (Mobile) -->
      <div class="px-3 pt-3 pb-2 border-b border-border dark:border-slate-700">
        <label class="text-xs font-bold text-muted dark:text-slate-400 block mb-1">نقش</label>
        <select 
          [value]="previewRoleService.getPreviewRole()"
          (change)="onRoleChange($event)"
          class="w-full px-2 py-1 text-xs rounded border border-border dark:border-slate-600 bg-white dark:bg-slate-700 text-foreground dark:text-slate-200 font-semibold">
          <option value="super-admin">مدیر</option>
          <option value="sales-expert">فروش</option>
          <option value="support-expert">پشتیبانی</option>
          <option value="employer">کارفرما</option>
          <option value="employee">کارمند</option>
        </select>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 pb-3 pt-2">
        <div class="space-y-2">
          <!-- Mobile Fish24 Navigation Items -->
          @for (item of filteredNavigationItems(); track item.id) {
            <div>
              @if (item.children && item.children.length > 0) {
                <!-- Mobile group with expandable children -->
                <button
                  (click)="toggleGroup(item.id)"
                  type="button"
                  class="mobile-nav-item w-full relative flex flex-col items-center justify-center gap-2 py-3.5 px-1 rounded-xl border border-border dark:border-slate-700 transition-all duration-300"
                  [class.mobile-nav-active]="isGroupExpanded(item.id)">
                  <ui-icon [name]="item.icon || 'folder'" [size]="isTablet ? 40 : 28" class="text-blue-500 mobile-nav-icon transition-all duration-300"></ui-icon>
                  <span class="mobile-nav-label text-[13px] font-extrabold text-foreground dark:text-slate-200 text-center" [class.tablet-label]="isTablet">{{ item.label }}</span>
                </button>
                
                <!-- Mobile expanded children panel -->
                @if (isGroupExpanded(item.id)) {
                  <div class="px-3 py-2.5 ml-2 border-l-2 border-primary/20 dark:border-primary/30 space-y-1.5 mt-2">
                    @for (child of item.children; track child.id) {
                      <div class="text-sm text-foreground dark:text-slate-300 px-3 py-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-700/30 border border-slate-200/30 dark:border-slate-600/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-colors duration-200">
                        <span class="inline-block w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 mr-2.5 align-middle"></span>
                        <span class="font-medium">{{ child.label }}</span>
                      </div>
                    }
                  </div>
                }
              } @else if (item.route) {
                <!-- Mobile clickable item with route (leaf navigation) -->
                <a [routerLink]="item.route" routerLinkActive="mobile-nav-active"
                   class="mobile-nav-item relative flex flex-col items-center justify-center gap-2 py-3.5 px-1 rounded-xl border border-border dark:border-slate-700 transition-all duration-300"
                   (click)="onMobileLeafNavClick()">
                  <ui-icon [name]="item.icon || 'file-text'" [size]="isTablet ? 40 : 28" class="text-blue-500 mobile-nav-icon transition-all duration-300"></ui-icon>
                  <span class="mobile-nav-label text-[13px] font-extrabold text-foreground dark:text-slate-200 text-center" [class.tablet-label]="isTablet">{{ item.label }}</span>
                </a>
              } @else {
                <!-- Mobile non-clickable future leaf item -->
                <div class="mobile-nav-item relative flex flex-col items-center justify-center gap-2 py-3.5 px-1 rounded-xl border border-border dark:border-slate-700">
                  <ui-icon [name]="item.icon || 'file-text'" [size]="isTablet ? 40 : 28" class="text-blue-500 mobile-nav-icon transition-all duration-300"></ui-icon>
                  <span class="mobile-nav-label text-[13px] font-extrabold text-foreground dark:text-slate-200 text-center" [class.tablet-label]="isTablet">{{ item.label }}</span>
                </div>
              }
            </div>
          }

          <!-- Logout Mobile -->
          <button
            (click)="onLogout()"
            class="mobile-nav-item w-full relative flex flex-col items-center justify-center gap-2 py-3.5 px-1 rounded-xl border border-danger/30 dark:border-danger/20 transition-all duration-300"
            type="button">
            <ui-icon name="log-out" [size]="isTablet ? 40 : 28" class="text-danger mobile-nav-icon transition-all duration-300"></ui-icon>
            <span class="mobile-nav-label text-[13px] font-extrabold text-danger dark:text-danger text-center" [class.tablet-label]="isTablet">خروج</span>
          </button>
        </div>
      </nav>
    </div>
  `,
  styles: [`
    .mobile-nav-item {
      position: relative;
      overflow: hidden;
    }

    .mobile-nav-item::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: inherit;
    }

    .mobile-nav-item:hover::before,
    .mobile-nav-item:active::before {
      opacity: 1;
    }

    .mobile-nav-item:hover .mobile-nav-icon,
    .mobile-nav-item:active .mobile-nav-icon {
      transform: scale(1.25) rotate(-3deg);
    }

    .mobile-nav-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      line-height: 1.3;
      direction: rtl;
      font-weight: 800;
    }

    .mobile-nav-active {
      border-color: rgba(59, 130, 246, 0.5) !important;
      background: rgba(59, 130, 246, 0.08) !important;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.12);
    }

    .mobile-nav-active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 55%;
      height: 3px;
      background: linear-gradient(90deg, transparent, #3b82f6, transparent);
      border-radius: 3px 3px 0 0;
    }

    .mobile-nav-item:active {
      transform: scale(0.93);
    }

    /* ── Tablet only: larger tiles ── */
    @media (min-width: 640px) and (max-width: 1023px) {
      .mobile-nav-item {
        padding-top: 24px !important;
        padding-bottom: 24px !important;
        gap: 14px !important;
      }

      .tablet-label {
        font-size: 17px !important;
      }

      .tablet-grid {
        gap: 12px !important;
      }
    }

    @media (min-width: 1024px) {
      button:hover ui-icon {
        transform: scale(1.15) rotate(-3deg);
      }
    }
  `]
})
export class SidebarComponent {
  private layoutService = inject(LayoutService);
  private dataService = inject(EmployeeDataService);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private router = inject(Router);

  protected permissionService = inject(Fish24PermissionService);
  protected previewRoleService = inject(Fish24RolePreviewService);

  unreadCount = this.dataService.unreadCount;
  unreadMessages = this.chatService.totalUnread;

  get isTablet(): boolean {
    return window.innerWidth >= 640 && window.innerWidth < 1024;
  }

  // Track which groups are expanded
  private expandedGroups = signal<Set<string>>(new Set());

  // Computed Fish24 navigation for every active preview role.
  filteredNavigationItems = computed(() => {
    const previewRoles = this.previewRoleService.getPreviewRoles();
    const navigationItems = getFish24NavigationConfig(previewRoles);
    return this.filterNavItems(navigationItems, previewRoles);
  });

  /**
   * Check if a group is expanded
   */
  isGroupExpanded(groupId: string): boolean {
    return this.expandedGroups().has(groupId);
  }

  /**
   * Toggle group expansion state
   */
  toggleGroup(groupId: string): void {
    const expanded = new Set(this.expandedGroups());
    if (expanded.has(groupId)) {
      expanded.delete(groupId);
    } else {
      expanded.add(groupId);
    }
    this.expandedGroups.set(expanded);
  }

  /**
   * Recursively filter navigation items based on user permissions
   */
  private filterNavItems(items: readonly Fish24NavItem[], roles: readonly Fish24RoleId[]): Fish24NavItem[] {
    return items
      .filter(item => !item.permission || this.permissionService.hasPermission(roles, item.permission as any))
      .map(item => ({
        ...item,
        children: item.children ? this.filterNavItems(item.children, roles) : undefined
      }));
  }

  onRoleChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const role = selectElement.value as Fish24RoleId;
    this.previewRoleService.setPreviewRole(role);
  }

  // HRM24 Employee Navigation (preserved from original)
  navItems: NavItem[] = [
    { path: '/dashboard', label: 'داشبورد', icon: 'dashboard', color: 'text-blue-500' },
    { path: '/payslip', label: 'فیش حقوق', icon: 'wallet', color: 'text-green-500' },
    { path: '/attendance', label: 'حضور و غیاب', icon: 'clock', color: 'text-teal-500' },
    { path: '/leave', label: 'مرخصی‌ها', icon: 'calendar', color: 'text-orange-400' },
    { path: '/advance', label: 'مساعده‌ها', icon: 'credit-card', color: 'text-yellow-500' },
    { path: '/loan', label: 'وام و تسهیلات', icon: 'banknote', color: 'text-blue-600' },
    { path: '/savings', label: 'صندوق پس‌انداز', icon: 'archive-restore', color: 'text-emerald-600' },
    { path: '/missions', label: 'مأموریت‌ها', icon: 'map-pin', color: 'text-rose-500' },
    { path: '/training', label: 'آموزش و توسعه', icon: 'book-open', color: 'text-amber-500' },
    { path: '/evaluation', label: 'ارزیابی ۳۶۰°', icon: 'target', color: 'text-indigo-500' },
    { path: '/tasks', label: 'وظایف من', icon: 'list-check', color: 'text-orange-500' },
    { path: '/calendar', label: 'تقویم کاری', icon: 'calendar-check', color: 'text-red-500' },
    { path: '/surveys', label: 'نظرسنجی‌ها', icon: 'thumbs-up', color: 'text-cyan-600' },
    { path: '/documents', label: 'اسناد و مدارک', icon: 'save', color: 'text-violet-500' },
    { path: '/reminders', label: 'یادآورها', icon: 'bell', color: 'text-amber-400' },
    { path: '/knowledge', label: 'پایگاه دانش', icon: 'book-marked', color: 'text-cyan-500' },
    { path: '/chat', label: 'پیام‌رسان', icon: 'message-circle', color: 'text-blue-400', badge: 'chat' },
    { path: '/comparison', label: 'مقایسه شرکت‌ها', icon: 'bar-chart-2', color: 'text-fuchsia-500' },
    { path: '/tickets', label: 'تیکت‌ها', icon: 'ticket', color: 'text-orange-600' },
    { path: '/notifications', label: 'اعلان‌ها', icon: 'bell', color: 'text-red-400', badge: 'unread' },
    { path: '/help', label: 'راهنما', icon: 'life-buoy', color: 'text-primary' }
  ];

  scrollToTop(): void {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Called when user clicks a mobile leaf navigation item with a route.
   * Closes the mobile navigation after navigation.
   */
  onMobileLeafNavClick(): void {
    this.scrollToTop();
    if (window.innerWidth < 1024) {
      this.layoutService.closeSidebar();
    }
  }

  /**
   * Called for desktop route navigation.
   * Does not close the sidebar (desktop sidebar is always visible).
   */
  onDesktopNavClick(): void {
    this.scrollToTop();
  }

  onLogout(): void {
    this.authService.logout();
  }
}

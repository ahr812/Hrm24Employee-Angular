import { Component, inject } from '@angular/core';
import { OrganizationService } from '../../../core/organization/organization.service';
import { IconComponent } from '../../ui/icon/icon.component';

@Component({
  selector: 'app-org-context-bar',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="w-full bg-surface border-b border-border px-4 py-2 flex items-center justify-between shadow-sm z-20 relative dark:bg-slate-800 dark:border-slate-700">
      
      <!-- Org Switcher - Full Width on Mobile -->
      <div class="flex items-center group relative flex-1 md:flex-none">
        <div 
          (click)="toggleDropdown()"
          class="flex items-center gap-2 hover:bg-background px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-border cursor-pointer w-full md:w-auto md:min-w-[400px]"
        >
          <div [class]="activeOrg().logoColor + ' w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0'">
            {{ activeOrg().name.charAt(0) }}
          </div>
          <div class="text-right flex-1 min-w-0">
            <p class="text-sm font-bold text-foreground leading-tight dark:text-slate-100 truncate">{{ activeOrg().name }}</p>
            <p class="text-[10px] text-muted">{{ activeOrg().role }}</p>
          </div>
          <ui-icon name="chevron-down" [size]="16" class="text-muted flex-shrink-0" />
        </div>

        <!-- Dropdown Menu -->
        @if (isDropdownOpen) {
          <div class="absolute top-full right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-up dark:bg-slate-800 dark:border-slate-700">
            <div class="p-2 space-y-1 max-h-96 overflow-y-auto">
              @for (org of orgService.allOrgs; track org.id) {
                <div 
                  (click)="selectOrg(org.id)"
                  class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors text-right border border-transparent hover:border-border cursor-pointer"
                  [class]="activeOrg().id === org.id ? 'bg-primary/5' : ''"
                >
                  <div [class]="org.logoColor + ' w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-sm'">
                    {{ org.name.charAt(0) }}
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-bold text-foreground dark:text-slate-100">{{ org.name }}</p>
                    <p class="text-xs text-muted mt-1">{{ org.role }}</p>
                  </div>
                  @if (activeOrg().id === org.id) {
                    <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <ui-icon name="check" [size]="14" class="text-primary" />
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Contract Status - Hidden on Mobile -->
      <div class="hidden md:flex items-center gap-2 flex-shrink-0">
        <span class="text-xs text-muted">وضعیت قرارداد:</span>
        <div [class]="statusClass" class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border">
          <span [class]="dotClass" class="w-1.5 h-1.5 rounded-full"></span>
          <span>{{ statusText }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up { animation: fade-in-up 0.2s ease-out forwards; }
  `]
})
export class OrgContextBarComponent {
  protected orgService = inject(OrganizationService);
  activeOrg = this.orgService.activeOrg;
  isDropdownOpen = false;

  get statusText(): string {
    const s = this.activeOrg().contractStatus;
    return s === 'active' ? 'فعال' : s === 'expired' ? 'منقضی' : 'در انتظار';
  }

  get statusClass(): string {
    const s = this.activeOrg().contractStatus;
    if (s === 'active') return 'bg-success/10 text-success border-success/20';
    if (s === 'expired') return 'bg-danger/10 text-danger border-danger/20';
    return 'bg-warning/10 text-warning border-warning/20';
  }

  get dotClass(): string {
    const s = this.activeOrg().contractStatus;
    if (s === 'active') return 'bg-success';
    if (s === 'expired') return 'bg-danger';
    return 'bg-warning';
  }

  toggleDropdown(): void { this.isDropdownOpen = !this.isDropdownOpen; }

  selectOrg(id: string): void {
    this.orgService.switchOrg(id);
    this.isDropdownOpen = false;
  }
}
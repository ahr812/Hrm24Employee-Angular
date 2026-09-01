import { Component, inject, viewChild, ElementRef, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { SearchService, SearchResult } from '../../../core/search/search.service';
import { EscToCloseDirective } from '../../directives/esc-to-close.directive';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [FormsModule, IconComponent, EscToCloseDirective],
  template: `
    @if (searchService.isOpen()) {
      <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" (click)="searchService.close()"></div>

      <div 
        appEscToClose
        (escPressed)="searchService.close()"
        class="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 animate-scale-in" 
        (click)="searchService.close()">
        <div class="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl dark:bg-slate-800 dark:border-slate-700" (click)="$event.stopPropagation()">
          
          <div class="p-4 border-b border-border dark:border-slate-700">
            <div class="flex items-center gap-3">
              <ui-icon name="search" [size]="24" class="text-muted flex-shrink-0"></ui-icon>
              <input #searchInput type="text" [ngModel]="searchService.query()" (ngModelChange)="searchService.updateQuery($event)" placeholder="جستجو در صفحات، اعلان‌ها، تیکت‌ها و ..." class="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted focus:outline-none dark:text-slate-100" autocomplete="off" spellcheck="false" aria-label="جستجوی سراسری" />
              <button type="button" (click)="searchService.close()" class="p-2 rounded-lg hover:bg-background transition-colors dark:hover:bg-slate-700" aria-label="بستن">
                <ui-icon name="x" [size]="20"></ui-icon>
              </button>
            </div>
          </div>

          <div class="max-h-[60vh] overflow-y-auto p-2">
            @if (searchService.filteredResults().length === 0) {
              <div class="py-12 text-center text-muted">
                <ui-icon name="search" [size]="48" class="mx-auto mb-4 opacity-50"></ui-icon>
                <p class="text-lg">نتیجه‌ای یافت نشد</p>
                <p class="text-sm mt-2">عبارت دیگری را امتحان کنید</p>
              </div>
            } @else {
              @for (group of getGroups(); track group.key) {
                @if (group.items.length > 0) {
                  <div class="mb-4">
                    <h3 class="px-3 py-2 text-xs font-bold text-muted uppercase tracking-wider">{{ group.label }}</h3>
                    
                    @for (item of group.items; track item.id) {
                      <div 
                        role="button" 
                        tabindex="0"
                        [class]="getContainerClass(item)"
                        (click)="searchService.selectItem(item)" 
                        (keydown.enter)="searchService.selectItem(item)"
                        (mouseenter)="selectOnHover(item)" 
                        [attr.aria-selected]="isSelected(item)">
                        
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" [class]="getCategoryColor(item.category)">
                          <ui-icon [name]="item.icon" [size]="20"></ui-icon>
                        </div>
                        
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2">
                            <p class="font-bold text-foreground truncate dark:text-slate-100">{{ item.title }}</p>
                            @if (item.badge) {
                              <span class="px-2 py-0.5 text-xs font-bold bg-primary/10 text-primary rounded-full">{{ item.badge }}</span>
                            }
                          </div>
                          <p class="text-sm text-muted truncate">{{ item.description }}</p>
                        </div>
                        
                        @if (isSelected(item)) {
                          <ui-icon name="corner-down-left" [size]="16" class="text-muted flex-shrink-0"></ui-icon>
                        }
                      </div>
                    }
                  </div>
                }
              }
            }
          </div>

          <div class="p-3 border-t border-border bg-background/50 dark:bg-slate-900/50 dark:border-slate-700 rounded-b-2xl">
            <div class="flex items-center justify-center gap-4 text-xs text-muted">
              <div class="flex items-center gap-1.5">
                <kbd class="px-2 py-1 bg-surface border border-border rounded dark:bg-slate-800 dark:border-slate-700">↑↓</kbd>
                <span>ناوبری</span>
              </div>
              <div class="flex items-center gap-1.5">
                <kbd class="px-2 py-1 bg-surface border border-border rounded dark:bg-slate-800 dark:border-slate-700">Enter</kbd>
                <span>انتخاب</span>
              </div>
              <div class="flex items-center gap-1.5">
                <kbd class="px-2 py-1 bg-surface border border-border rounded dark:bg-slate-800 dark:border-slate-700">Esc</kbd>
                <span>بستن</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scale-in { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .animate-fade-in { animation: fade-in 0.2s ease-out; }
    .animate-scale-in { animation: scale-in 0.2s ease-out; }
  `]
})
export class GlobalSearchComponent {
  searchService = inject(SearchService);
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  constructor() {
    afterNextRender(() => {
      this.focusInput();
    });
  }

  private focusInput(): void {
    setTimeout(() => {
      this.searchInput()?.nativeElement.focus();
    }, 100);
  }

  getGroups(): { key: string; label: string; items: SearchResult[] }[] {
    const grouped = this.searchService.groupedResults();
    return [
      { key: 'page', label: 'صفحات', items: grouped['page'] || [] },
      { key: 'notification', label: 'اعلان‌ها', items: grouped['notification'] || [] },
      { key: 'ticket', label: 'تیکت‌ها', items: grouped['ticket'] || [] },
      { key: 'action', label: 'اکشن‌ها', items: grouped['action'] || [] }
    ];
  }

  isSelected(item: SearchResult): boolean {
    const results = this.searchService.filteredResults();
    const selectedIndex = this.searchService.selectedIndex();
    return results[selectedIndex]?.id === item.id;
  }

  selectOnHover(item: SearchResult): void {
    const results = this.searchService.filteredResults();
    const index = results.findIndex(r => r.id === item.id);
    if (index !== -1) {
      this.searchService.selectedIndex.set(index);
    }
  }

  getContainerClass(item: SearchResult): string {
    const base = 'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-right transition-colors hover:bg-background dark:hover:bg-slate-700 cursor-pointer';
    const selected = this.isSelected(item) ? 'bg-primary/10' : '';
    return `${base} ${selected}`.trim();
  }

  getCategoryColor(category: string): string {
    if (category === 'page') return 'bg-primary/10 text-primary';
    if (category === 'notification') return 'bg-warning/10 text-warning';
    if (category === 'ticket') return 'bg-info/10 text-info';
    if (category === 'action') return 'bg-success/10 text-success';
    return 'bg-muted/10 text-muted';
  }
}
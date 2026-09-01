import { Component } from '@angular/core';
import { IconComponent } from '../../ui/icon/icon.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [IconComponent],
  template: `
    <footer class="bg-surface border-t border-border py-8 mt-auto dark:bg-slate-800 dark:border-slate-700">
      <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <!-- Copyright -->
        <div class="text-center md:text-right">
          <p class="text-sm font-bold text-foreground dark:text-slate-100">فیش24</p>
          <p class="text-xs text-muted mt-1">تمامی حقوق محفوظ است © ۱۴۰۳</p>
        </div>

        <!-- Support Info -->
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 text-sm text-muted">
            <ui-icon name="phone" [size]="16" class="text-primary" />
            <span class="dir-ltr">021-88888888</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted">
            <ui-icon name="mail" [size]="16" class="text-primary" />
            <span>support&#64;hrm24.ir</span>
          </div>
        </div>

      </div>
    </footer>
  `
})
export class FooterComponent { }
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="min-h-[80vh] flex flex-col items-center justify-center text-center p-6">
      <!-- Big Icon -->
      <div class="w-32 h-32 rounded-full bg-warning/10 text-warning flex items-center justify-center mb-8 animate-bounce">
        <ui-icon name="alert-triangle" [size]="64" />
      </div>
      
      <!-- Clear Message -->
      <h1 class="text-5xl font-bold text-foreground mb-4 dark:text-slate-100">صفحه پیدا نشد</h1>
      <p class="text-xl text-muted max-w-lg mb-10">
        آدرسی که وارد کردید اشتباه است یا این صفحه وجود ندارد. نگران نباشید، می‌توانید به خانه برگردید.
      </p>
      
      <!-- Big Action Button -->
      <a 
        routerLink="/dashboard"
        class="px-10 py-4 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-xl shadow-lg shadow-primary/20 flex items-center gap-3"
      >
        <ui-icon name="dashboard" [size]="24" />
        بازگشت به صفحه اصلی
      </a>
    </div>
  `
})
export class NotFoundComponent { }
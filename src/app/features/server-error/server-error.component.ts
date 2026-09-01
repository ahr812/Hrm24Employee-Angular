import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
    selector: 'app-server-error',
    standalone: true,
    imports: [RouterLink, IconComponent],
    template: `
    <div class="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background dark:bg-slate-900">
      
      <!-- Error Illustration -->
      <div class="w-32 h-32 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-8 animate-pulse">
        <ui-icon name="alert-triangle" [size]="64" />
      </div>
      
      <!-- Clear Message -->
      <h1 class="text-4xl font-bold text-foreground mb-4 dark:text-slate-100">مشکل فنی موقت</h1>
      <p class="text-xl text-muted max-w-lg mb-10">
        متأسفانه سرور در حال حاضر پاسخگو نیست. لطفاً چند دقیقه دیگر تلاش کنید یا با پشتیبانی تماس بگیرید.
      </p>
      
      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4">
        <button 
          (click)="reloadPage()"
          class="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          <ui-icon name="check-circle" [size]="20" />
          تلاش مجدد
        </button>
        
        <a 
          routerLink="/help"
          class="px-8 py-3 bg-surface border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-lg flex items-center justify-center gap-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
        >
          <ui-icon name="phone" [size]="20" />
          تماس با پشتیبانی
        </a>
      </div>

      <p class="mt-12 text-sm text-muted opacity-50">
        کد خطا: 500 Internal Server Error
      </p>
    </div>
  `
})
export class ServerErrorComponent {
    // تعریف window برای دسترسی در تمپلیت
    window = window;

    reloadPage(): void {
        window.location.reload();
    }
}
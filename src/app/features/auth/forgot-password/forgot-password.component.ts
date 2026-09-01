import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [FormsModule, RouterLink, IconComponent],
    template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-background dark:bg-slate-900 transition-colors">
      <div class="w-full max-w-md animate-scale-in">
        
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/30">
            <ui-icon name="key" [size]="32" class="text-white"></ui-icon>
          </div>
          <h1 class="text-2xl font-bold text-foreground dark:text-slate-100">بازیابی رمز عبور</h1>
          <p class="text-sm text-muted mt-1">نام کاربری و ایمیل خود را وارد کنید</p>
        </div>

        <div class="bg-surface rounded-2xl p-6 md:p-8 border border-border dark:bg-slate-800 dark:border-slate-700 shadow-lg">
          
          @if (!resetResult()) {
            <form (ngSubmit)="onReset()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">نام کاربری *</label>
                <div class="relative">
                  <ui-icon name="user" [size]="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="formData.username" 
                    name="username"
                    required
                    class="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm"
                    placeholder="نام کاربری خود را وارد کنید">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">ایمیل *</label>
                <div class="relative">
                  <ui-icon name="info" [size]="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                  <input 
                    type="email" 
                    [(ngModel)]="formData.email" 
                    name="email"
                    required
                    class="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr"
                    placeholder="example@email.com">
                </div>
              </div>

              <button 
                type="submit"
                [disabled]="isLoading()"
                class="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                @if (isLoading()) {
                  <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  در حال پردازش...
                } @else {
                  <ui-icon name="key" [size]="18"></ui-icon>
                  بازیابی رمز عبور
                }
              </button>
            </form>
          } @else {
            <div class="text-center space-y-4">
              <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <ui-icon name="check-circle" [size]="32" class="text-success"></ui-icon>
              </div>
              <h3 class="text-lg font-bold text-foreground dark:text-slate-100">رمز عبور موقت صادر شد</h3>
              <div class="p-4 bg-background rounded-xl border border-border dark:bg-slate-900 dark:border-slate-700">
                <p class="text-xs text-muted mb-2">رمز عبور موقت شما:</p>
                <p class="text-xl font-mono font-bold text-primary dir-ltr">{{ resetResult() }}</p>
              </div>
              <p class="text-xs text-muted">لطفاً پس از ورود، رمز عبور خود را تغییر دهید.</p>
            </div>
          }

          <div class="mt-6 pt-4 border-t border-border dark:border-slate-700 text-center">
            <a routerLink="/login" class="text-sm text-primary hover:text-primary-hover font-bold transition-colors flex items-center justify-center gap-1">
              <ui-icon name="chevron-right" [size]="16"></ui-icon>
              بازگشت به صفحه ورود
            </a>
          </div>
        </div>

        <p class="text-center text-xs text-muted mt-6">نسخه ۱.۰.۰ | Fish24</p>
      </div>
    </div>
  `,
    styles: [`
    @keyframes scale-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .animate-spin { animation: spin 0.8s linear infinite; }
  `]
})
export class ForgotPasswordComponent {
    private authService = inject(AuthService);
    private toastService = inject(ToastService);

    isLoading = signal(false);
    resetResult = signal<string | null>(null);

    formData = {
        username: '',
        email: ''
    };

    onReset(): void {
        if (!this.formData.username.trim() || !this.formData.email.trim()) {
            this.toastService.show('لطفاً نام کاربری و ایمیل را وارد کنید.', 'error');
            return;
        }

        this.isLoading.set(true);

        setTimeout(() => {
            const result = this.authService.resetPassword(this.formData.username, this.formData.email);
            this.isLoading.set(false);

            if (result.success) {
                const tempPass = result.message.split(': ')[1]?.split(' (')[0] || '';
                this.resetResult.set(tempPass);
                this.toastService.show('رمز عبور موقت صادر شد.', 'success');
            } else {
                this.toastService.show(result.message, 'error');
            }
        }, 600);
    }
}
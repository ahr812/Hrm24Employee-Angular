import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [FormsModule, RouterLink, IconComponent],
    template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-background dark:bg-slate-900 transition-colors">
      <div class="w-full max-w-md animate-scale-in">
        
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/30">
            <ui-icon name="users" [size]="32" class="text-white"></ui-icon>
          </div>
          <h1 class="text-2xl font-bold text-foreground dark:text-slate-100">Fish24</h1>
          <p class="text-sm text-muted mt-1">ایجاد حساب کاربری جدید</p>
        </div>

        <div class="bg-surface rounded-2xl p-6 md:p-8 border border-border dark:bg-slate-800 dark:border-slate-700 shadow-lg">
          <h2 class="text-xl font-bold text-foreground mb-6 dark:text-slate-100 text-center">ثبت‌نام</h2>
          
          <form (ngSubmit)="onRegister()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">نام و نام خانوادگی *</label>
              <input 
                type="text" 
                [(ngModel)]="formData.fullName" 
                name="fullName"
                required
                class="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm"
                placeholder="مثال: علی احمدی">
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">نام کاربری *</label>
              <div class="relative">
                <ui-icon name="user" [size]="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                <input 
                  type="text" 
                  [(ngModel)]="formData.username" 
                  name="username"
                  required
                  autocomplete="username"
                  class="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm"
                  placeholder="نام کاربری دلخواه">
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
                  autocomplete="email"
                  class="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm dir-ltr"
                  placeholder="example@email.com">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">رمز عبور *</label>
              <div class="relative">
                <ui-icon name="lock" [size]="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                <input 
                  [type]="showPassword() ? 'text' : 'password'" 
                  [(ngModel)]="formData.password" 
                  name="password"
                  required
                  minlength="6"
                  autocomplete="new-password"
                  class="w-full pr-10 pl-10 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm"
                  placeholder="حداقل ۶ کاراکتر">
                <button 
                  type="button"
                  (click)="togglePassword()"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                  <ui-icon [name]="showPassword() ? 'eye' : 'eye-off'" [size]="18"></ui-icon>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5 dark:text-slate-200">تکرار رمز عبور *</label>
              <div class="relative">
                <ui-icon name="lock" [size]="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                <input 
                  [type]="showPassword() ? 'text' : 'password'" 
                  [(ngModel)]="formData.confirmPassword" 
                  name="confirmPassword"
                  required
                  autocomplete="new-password"
                  class="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 text-sm"
                  placeholder="رمز عبور را مجدداً وارد کنید">
              </div>
            </div>

            <button 
              type="submit"
              [disabled]="isLoading()"
              class="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
              @if (isLoading()) {
                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                در حال ثبت‌نام...
              } @else {
                <ui-icon name="plus" [size]="18"></ui-icon>
                ثبت‌نام
              }
            </button>
          </form>

          <div class="mt-6 pt-4 border-t border-border dark:border-slate-700 text-center">
            <p class="text-sm text-muted">
              قبلاً ثبت‌نام کرده‌اید؟
              <a routerLink="/login" class="text-primary hover:text-primary-hover font-bold mr-1 transition-colors">وارد شوید</a>
            </p>
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
export class RegisterComponent {
    private authService = inject(AuthService);
    private router = inject(Router);
    private toastService = inject(ToastService);

    showPassword = signal(false);
    isLoading = signal(false);

    formData = {
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    };

    togglePassword(): void {
        this.showPassword.set(!this.showPassword());
    }

    onRegister(): void {
        if (!this.formData.fullName.trim() || !this.formData.username.trim() || !this.formData.email.trim() || !this.formData.password) {
            this.toastService.show('لطفاً تمام فیلدهای الزامی را پر کنید.', 'error');
            return;
        }

        if (this.formData.password.length < 6) {
            this.toastService.show('رمز عبور باید حداقل ۶ کاراکتر باشد.', 'error');
            return;
        }

        if (this.formData.password !== this.formData.confirmPassword) {
            this.toastService.show('رمز عبور و تکرار آن مطابقت ندارند.', 'error');
            return;
        }

        this.isLoading.set(true);

        setTimeout(() => {
            const result = this.authService.register(
                this.formData.username,
                this.formData.password,
                this.formData.fullName,
                this.formData.email
            );
            this.isLoading.set(false);

            if (result.success) {
                this.toastService.show(result.message, 'success');
                this.router.navigate(['/login']);
            } else {
                this.toastService.show(result.message, 'error');
            }
        }, 600);
    }
}
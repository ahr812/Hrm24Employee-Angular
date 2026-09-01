import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],
    template: `
    <div class="min-h-screen flex items-center justify-center bg-background p-4">
      <div class="w-full max-w-md bg-surface rounded-xl border border-border p-8 shadow-sm">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-primary mb-2">ورود به سامانه HRM24</h1>
          <p class="text-muted text-sm">لطفاً اطلاعات کاربری خود را وارد کنید</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">ایمیل یا نام کاربری</label>
            <input 
              type="text" 
              [(ngModel)]="email" 
              name="email"
              class="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="example@company.com"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">رمز عبور</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password"
              class="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          
          @if (error) {
            <div class="p-3 bg-danger/10 text-danger rounded-lg text-sm">
              {{ error }}
            </div>
          }
          
          <button 
            type="submit"
            class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            ورود به سامانه
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    email = '';
    password = '';
    error = '';

    onSubmit() {
        if (this.authService.login(this.email, this.password)) {
            this.router.navigate(['/dashboard']);
        } else {
            this.error = 'نام کاربری یا رمز عبور اشتباه است';
        }
    }
}
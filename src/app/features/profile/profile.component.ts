import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EmployeeDataService } from '../../core/data/employee-data.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-primary mb-2">پروفایل من</h1>
        <p class="text-lg text-muted">مدیریت اطلاعات شخصی و تنظیمات حساب کاربری</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Avatar & Basic Info -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-surface rounded-2xl p-6 border border-border text-center dark:bg-slate-800 dark:border-slate-700">
            <!-- Avatar Upload -->
            <div class="relative w-32 h-32 mx-auto mb-4 group cursor-pointer">
              <img 
                [src]="profileImage() || 'images/avatar3.jpg'" 
                alt="Profile" 
                class="w-full h-full rounded-full object-cover border-4 border-primary/20 shadow-lg">
              
              <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ui-icon name="camera" [size]="32" class="text-white"></ui-icon>
              </div>
              
              <input 
                type="file" 
                #fileInput
                (change)="onFileSelected($event)"
                accept="image/*"
                class="absolute inset-0 opacity-0 cursor-pointer">
            </div>

            <h2 class="text-xl font-bold text-foreground dark:text-slate-100">{{ jobProfile().jobTitle }}</h2>
            <p class="text-sm text-muted mb-4">{{ jobProfile().department }}</p>
            
            <div class="space-y-2 text-sm text-right">
              <div class="flex justify-between p-2 bg-background rounded-lg dark:bg-slate-900">
                <span class="text-muted">شماره پرسنلی:</span>
                <span class="font-mono dir-ltr font-bold">{{ jobProfile().personnelCode }}</span>
              </div>
              <div class="flex justify-between p-2 bg-background rounded-lg dark:bg-slate-900">
                <span class="text-muted">تاریخ شروع:</span>
                <span class="font-bold">{{ jobProfile().startDate }}</span>
              </div>
              <div class="flex justify-between p-2 bg-background rounded-lg dark:bg-slate-900">
                <span class="text-muted">نوع همکاری:</span>
                <span class="font-bold">{{ jobProfile().employmentType }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Forms -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Personal Information Form -->
          <div class="bg-surface rounded-2xl p-6 border border-border dark:bg-slate-800 dark:border-slate-700">
            <h3 class="text-lg font-bold text-foreground mb-6 dark:text-slate-100 flex items-center gap-2">
              <ui-icon name="user" [size]="20" class="text-primary"></ui-icon>
              اطلاعات شخصی
            </h3>
            
            <form (ngSubmit)="savePersonalInfo()" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-2 dark:text-slate-200">نام کامل</label>
                  <input 
                    type="text" 
                    [(ngModel)]="personalInfo.name" 
                    name="name"
                    class="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-2 dark:text-slate-200">ایمیل</label>
                  <input 
                    type="email" 
                    [(ngModel)]="personalInfo.email" 
                    name="email"
                    class="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr">
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-2 dark:text-slate-200">شماره موبایل</label>
                  <input 
                    type="tel" 
                    [(ngModel)]="personalInfo.phone" 
                    name="phone"
                    class="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr">
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-2 dark:text-slate-200">آدرس</label>
                  <input 
                    type="text" 
                    [(ngModel)]="personalInfo.address" 
                    name="address"
                    class="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                </div>
              </div>
              
              <div class="pt-4 flex justify-end">
                <button 
                  type="submit"
                  class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold flex items-center gap-2">
                  <ui-icon name="save" [size]="20"></ui-icon>
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>

          <!-- Change Password Form -->
          <div class="bg-surface rounded-2xl p-6 border border-border dark:bg-slate-800 dark:border-slate-700">
            <h3 class="text-lg font-bold text-foreground mb-6 dark:text-slate-100 flex items-center gap-2">
              <ui-icon name="lock" [size]="20" class="text-warning"></ui-icon>
              تغییر رمز عبور
            </h3>
            
            <form (ngSubmit)="changePassword()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-2 dark:text-slate-200">رمز عبور فعلی</label>
                <input 
                  type="password" 
                  [(ngModel)]="passwordData.current" 
                  name="current"
                  class="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr">
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-2 dark:text-slate-200">رمز عبور جدید</label>
                  <input 
                    type="tel"
                    inputmode="numeric"
                    maxlength="5"
                    [(ngModel)]="passwordData.new" 
                    name="new"
                    (input)="onNumericInput($event)"
                    placeholder="۵ رقم"
                    class="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr tracking-widest text-center text-lg">
                  <p class="text-[11px] text-muted mt-1.5 flex items-center gap-1">
                    <ui-icon name="info" [size]="10"></ui-icon>
                    رمز عبور باید دقیقاً ۵ رقم باشد
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-2 dark:text-slate-200">تکرار رمز عبور</label>
                  <input 
                    type="tel"
                    inputmode="numeric"
                    maxlength="5"
                    [(ngModel)]="passwordData.confirm" 
                    name="confirm"
                    (input)="onNumericInput($event)"
                    placeholder="۵ رقم"
                    class="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr tracking-widest text-center text-lg">
                  <p class="text-[11px] text-muted mt-1.5 flex items-center gap-1">
                    <ui-icon name="info" [size]="10"></ui-icon>
                    همان ۵ رقم رمز جدید را وارد کنید
                  </p>
                </div>
              </div>
              
              <div class="pt-4 flex justify-end">
                <button 
                  type="submit"
                  class="px-6 py-3 bg-warning text-white rounded-xl hover:bg-warning-hover transition-colors font-bold flex items-center gap-2">
                  <ui-icon name="key" [size]="20"></ui-icon>
                  بروزرسانی رمز عبور
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
  `]
})
export class ProfileComponent {
  private dataService = inject(EmployeeDataService);
  private toastService = inject(ToastService);

  jobProfile = this.dataService.jobProfile;

  profileImage = signal<string | null>(null);

  personalInfo = {
    name: 'علی احمدی',
    email: 'ali.ahmadi@example.com',
    phone: '09123456789',
    address: 'تهران، خیابان ولیعصر'
  };

  passwordData = {
    current: '',
    new: '',
    confirm: ''
  };

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImage.set(reader.result as string);
        this.toastService.show('عکس پروفایل با موفقیت بروزرسانی شد.', 'success');
      };
      reader.readAsDataURL(file);
    }
  }

  savePersonalInfo(): void {
    this.toastService.show('اطلاعات شخصی با موفقیت بروزرسانی شد.', 'success');
  }

  // Only allow digits in numeric inputs
  onNumericInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
  }

  changePassword(): void {
    if (!this.passwordData.current) {
      this.toastService.show('لطفاً رمز عبور فعلی را وارد کنید.', 'error');
      return;
    }

    if (!this.passwordData.new) {
      this.toastService.show('لطفاً رمز عبور جدید را وارد کنید.', 'error');
      return;
    }

    if (this.passwordData.new.length !== 5) {
      this.toastService.show('رمز عبور جدید باید دقیقاً ۵ رقم باشد.', 'error');
      return;
    }

    if (!/^\d{5}$/.test(this.passwordData.new)) {
      this.toastService.show('رمز عبور جدید فقط باید شامل اعداد باشد.', 'error');
      return;
    }

    if (!this.passwordData.confirm) {
      this.toastService.show('لطفاً تکرار رمز عبور را وارد کنید.', 'error');
      return;
    }

    if (this.passwordData.confirm.length !== 5) {
      this.toastService.show('تکرار رمز عبور باید دقیقاً ۵ رقم باشد.', 'error');
      return;
    }

    if (this.passwordData.new !== this.passwordData.confirm) {
      this.toastService.show('رمز عبور جدید و تکرار آن مطابقت ندارند.', 'error');
      return;
    }

    this.toastService.show('رمز عبور با موفقیت تغییر یافت.', 'success');
    this.passwordData = { current: '', new: '', confirm: '' };
  }
}
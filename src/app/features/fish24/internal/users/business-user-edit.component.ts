import { Component, computed, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { Fish24RolePreviewService } from '../../../../core/fish24/dev/fish24-role-preview.service';
import { Fish24PermissionService } from '../../../../core/fish24/permissions/fish24-permission.service';
import { FISH24_PERMISSIONS } from '../../../../core/fish24/permissions/fish24-permissions';
import { BusinessUserPreviewService, BusinessUserRole, UserRank } from './business-user-preview.service';

type ImageField = 'profile' | 'national-card' | 'official-newspaper' | 'vat-certificate';

@Component({
  selector: 'app-business-user-edit',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-4 animate-fade-in-up sm:space-y-5" dir="rtl">
      @if (user(); as currentUser) {
        <header class="flex min-w-0 items-center gap-3 sm:gap-4">
          <button type="button" (click)="cancel()" aria-label="بازگشت به فهرست کاربران" class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-primary shadow-sm hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-800"><ui-icon name="arrow-right" [size]="21"></ui-icon></button>
          <div class="min-w-0"><h1 class="text-2xl font-bold text-primary sm:text-3xl">ویرایش کاربر</h1><p class="mt-0.5 truncate text-sm text-muted sm:mt-1 sm:text-base">{{ currentUser.fullName || currentUser.mobile }} — تغییرات فقط در پیش‌نمایش فعلی نگهداری می‌شوند.</p></div>
        </header>

        <form [formGroup]="form" (ngSubmit)="save()" novalidate class="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
          <section class="min-w-0 rounded-2xl border border-border bg-surface shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="edit-user-main-title">
            <div class="border-b border-border px-4 py-3 dark:border-slate-700"><h2 id="edit-user-main-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">مشخصات کاربر</h2></div>
            <div class="grid min-w-0 grid-cols-1 gap-4 p-4 md:grid-cols-2">
              <div><label for="edit-user-mobile" class="field-label">موبایل</label><input id="edit-user-mobile" formControlName="mobile" type="text" inputmode="numeric" maxlength="11" dir="ltr" class="field-input"><p class="field-error" [class.hidden]="!hasError('mobile')">موبایل باید ۱۱ رقم و با ۰۹ شروع شود.</p><p class="field-error" [class.hidden]="!mobileConflict()">این موبایل قبلاً برای هویت دیگری ثبت شده است.</p></div>
              <div><label for="edit-user-name" class="field-label">نام و نام خانوادگی</label><input id="edit-user-name" formControlName="fullName" type="text" class="field-input"><p class="field-error" [class.hidden]="!hasError('fullName')">نام و نام خانوادگی را وارد کنید.</p></div>
              <div><label for="edit-user-national-id" class="field-label">کدملی</label><input id="edit-user-national-id" formControlName="nationalId" type="text" inputmode="numeric" maxlength="10" dir="ltr" class="field-input"><p class="field-error" [class.hidden]="!hasError('nationalId')">کدملی باید دقیقاً ۱۰ رقم باشد.</p></div>
              <div><label for="edit-user-email" class="field-label">ایمیل</label><input id="edit-user-email" formControlName="email" type="email" dir="ltr" class="field-input"><p class="field-error" [class.hidden]="!hasError('email')">قالب ایمیل صحیح نیست.</p></div>
              <div><label for="edit-user-rank" class="field-label">رتبه</label><select id="edit-user-rank" formControlName="rank" class="field-input">@for (rank of ranks; track rank) {<option [value]="rank">{{ rank }}</option>}</select></div>
              <div><label for="edit-user-expiration" class="field-label">تاریخ انقضای دسترسی کاربر</label><input id="edit-user-expiration" formControlName="accessExpiresAt" type="text" dir="ltr" placeholder="۱۴۰۵/۱۲/۲۹" class="field-input"></div>
              <fieldset class="md:col-span-2"><legend class="field-label">نقش</legend><div class="grid grid-cols-1 gap-2 sm:grid-cols-2"><label class="choice-box"><input formControlName="roleEmployer" type="checkbox" class="h-4 w-4 accent-primary">کارفرما</label><label class="choice-box"><input formControlName="roleEmployee" type="checkbox" class="h-4 w-4 accent-primary">کارمند</label></div><p class="field-error" [class.hidden]="!roleError()">حداقل یک نقش تجاری را انتخاب کنید.</p></fieldset>
              <label class="toggle-row"><span>آیا اعتبار دارد؟</span><input formControlName="hasFreeCredit" type="checkbox" class="h-5 w-5 accent-primary"></label>
              <label class="toggle-row"><span>مجاز به استفاده از بخش تیکت ها</span><input formControlName="ticketAccess" type="checkbox" class="h-5 w-5 accent-primary"></label>
              <label class="toggle-row md:col-span-2"><span>امکان درخواست استرداد وجه</span><input formControlName="refundRequestAllowed" type="checkbox" class="h-5 w-5 accent-primary"></label>
            </div>
          </section>

          <section class="min-w-0 rounded-2xl border border-border bg-surface shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="edit-user-invoice-title">
            <div class="border-b border-border px-4 py-3 dark:border-slate-700"><h2 id="edit-user-invoice-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">مشخصات صدور فاکتور</h2></div>
            <div class="grid min-w-0 grid-cols-1 gap-4 p-4 md:grid-cols-2">
              <div><label for="edit-invoice-method" class="field-label">نحوه ارسال فاکتور</label><select id="edit-invoice-method" formControlName="invoiceDeliveryMethod" class="field-input"><option value="ارسال نشود">ارسال نشود</option></select></div>
              <div><label for="edit-invoice-postal-code" class="field-label">کد پستی ارسال فاکتور</label><input id="edit-invoice-postal-code" formControlName="invoicePostalCode" type="text" dir="ltr" class="field-input"></div>
              <div><label for="edit-invoice-recipient" class="field-label">نام و نام خانوادگی تحویل گیرنده فاکتور</label><input id="edit-invoice-recipient" formControlName="invoiceRecipientName" type="text" class="field-input"></div>
              <div><label for="edit-invoice-mobile" class="field-label">شماره موبایل تحویل گیرنده فاکتور</label><input id="edit-invoice-mobile" formControlName="invoiceRecipientMobile" type="text" inputmode="numeric" maxlength="11" dir="ltr" class="field-input"><p class="field-error" [class.hidden]="!hasError('invoiceRecipientMobile')">شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.</p></div>
              <div class="md:col-span-2"><label for="edit-invoice-address" class="field-label">آدرس ارسال فاکتور</label><textarea id="edit-invoice-address" formControlName="invoiceAddress" rows="3" class="field-textarea"></textarea></div>
            </div>
          </section>

          <section class="min-w-0 rounded-2xl border border-border bg-surface shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="edit-user-supplementary-title">
            <div class="border-b border-border px-4 py-3 dark:border-slate-700"><h2 id="edit-user-supplementary-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">اطلاعات تکمیلی</h2></div>
            <div class="grid min-w-0 grid-cols-1 gap-4 p-4 md:grid-cols-2">
              <div class="file-box"><span class="field-label">عکس</span><div class="file-preview">@if (profileImage()) {<img [src]="profileImage()" alt="پیش‌نمایش عکس کاربر" class="h-full w-full object-cover">} @else {<ui-icon name="image" [size]="30" class="text-muted"></ui-icon>}</div><input id="edit-user-photo" type="file" accept="image/*" (change)="selectImage($event, 'profile')" class="file-input"></div>
              <div class="file-box"><span class="field-label">عکس کارت ملی</span><div class="file-preview">@if (nationalCardImage()) {<img [src]="nationalCardImage()" alt="پیش‌نمایش کارت ملی" class="h-full w-full object-cover">} @else {<ui-icon name="image" [size]="30" class="text-muted"></ui-icon>}</div><input id="edit-national-card" type="file" accept="image/*" (change)="selectImage($event, 'national-card')" class="file-input"></div>
              <div><label for="edit-user-landline" class="field-label">تلفن ثابت</label><input id="edit-user-landline" formControlName="landline" type="text" dir="ltr" class="field-input"></div>
              <div><label for="edit-user-province" class="field-label">استان</label><select id="edit-user-province" formControlName="province" class="field-input">@for (item of provinces; track item) {<option [value]="item">{{ item }}</option>}</select></div>
              <div><label for="edit-user-county" class="field-label">شهرستان</label><select id="edit-user-county" formControlName="county" class="field-input">@for (item of counties; track item) {<option [value]="item">{{ item }}</option>}</select></div>
              <div><label for="edit-user-city" class="field-label">شهر</label><select id="edit-user-city" formControlName="city" class="field-input">@for (item of cities; track item) {<option [value]="item">{{ item }}</option>}</select></div>
              <div><label for="edit-user-type" class="field-label">نوع کاربر</label><select id="edit-user-type" formControlName="userType" class="field-input"><option value="حقیقی">حقیقی</option><option value="حقوقی">حقوقی</option></select></div>
              <div><label for="edit-user-gender" class="field-label">جنسیت</label><select id="edit-user-gender" formControlName="gender" class="field-input"><option value="مرد">مرد</option><option value="زن">زن</option></select></div>
            </div>
          </section>

          <section class="min-w-0 rounded-2xl border border-border bg-surface shadow-sm transition-opacity dark:border-slate-700 dark:bg-slate-800" [class.opacity-60]="form.controls.userType.value === 'حقیقی'" aria-labelledby="edit-user-company-title">
            <div class="border-b border-border px-4 py-3 dark:border-slate-700"><h2 id="edit-user-company-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">مشخصات شرکت حقوقی</h2><p class="mt-1 text-xs text-muted">این بخش برای کاربران حقوقی کاربرد دارد و تغییر نوع کاربر، داده‌های واردشده را حذف نمی‌کند.</p></div>
            <div class="grid min-w-0 grid-cols-1 gap-4 p-4 md:grid-cols-2">
              <div class="file-box"><span class="field-label">تصویر روزنامه رسمی</span><div class="file-preview">@if (officialNewspaperImage()) {<img [src]="officialNewspaperImage()" alt="پیش‌نمایش روزنامه رسمی" class="h-full w-full object-cover">} @else {<ui-icon name="image" [size]="30" class="text-muted"></ui-icon>}</div><input id="edit-official-newspaper" type="file" accept="image/*" (change)="selectImage($event, 'official-newspaper')" class="file-input"></div>
              <div class="file-box"><span class="field-label">تصویر گواهی ارزش افزوده</span><div class="file-preview">@if (vatCertificateImage()) {<img [src]="vatCertificateImage()" alt="پیش‌نمایش گواهی ارزش افزوده" class="h-full w-full object-cover">} @else {<ui-icon name="image" [size]="30" class="text-muted"></ui-icon>}</div><input id="edit-vat-certificate" type="file" accept="image/*" (change)="selectImage($event, 'vat-certificate')" class="file-input"></div>
              <div><label for="edit-company-name" class="field-label">نام شرکت یا موسسه</label><input id="edit-company-name" formControlName="companyName" type="text" class="field-input"></div>
              <div><label for="edit-registration-number" class="field-label">شماره ثبت</label><input id="edit-registration-number" formControlName="registrationNumber" type="text" dir="ltr" class="field-input"></div>
              <div><label for="edit-company-national-id" class="field-label">شناسه ملی</label><input id="edit-company-national-id" formControlName="companyNationalId" type="text" dir="ltr" class="field-input"></div>
              <div><label for="edit-economic-code" class="field-label">کد اقتصادی</label><input id="edit-economic-code" formControlName="economicCode" type="text" dir="ltr" class="field-input"></div>
              <div class="md:col-span-2"><label for="edit-registered-address" class="field-label">آدرس ثبتی شرکت</label><textarea id="edit-registered-address" formControlName="registeredAddress" rows="3" class="field-textarea"></textarea></div>
            </div>
          </section>

          <section class="min-w-0 rounded-2xl border border-border bg-surface shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="edit-user-financial-title">
            <div class="border-b border-border px-4 py-3 dark:border-slate-700"><h2 id="edit-user-financial-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">مشخصات مسئول مالی</h2></div>
            <div class="grid min-w-0 grid-cols-1 gap-4 p-4 md:grid-cols-2">
              <div><label for="edit-financial-name" class="field-label">نام و نام خانوادگی مسئول مالی</label><input id="edit-financial-name" formControlName="financialContactName" type="text" class="field-input"></div>
              <div><label for="edit-financial-mobile" class="field-label">شماره موبایل مسئول مالی</label><input id="edit-financial-mobile" formControlName="financialContactMobile" type="text" inputmode="numeric" maxlength="11" dir="ltr" class="field-input"><p class="field-error" [class.hidden]="!hasError('financialContactMobile')">شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.</p></div>
              <div><label for="edit-financial-landline" class="field-label">تلفن ثابت مسئول مالی</label><input id="edit-financial-landline" formControlName="financialContactLandline" type="text" dir="ltr" class="field-input"></div>
              <div><label for="edit-refund-iban" class="field-label">شماره شبا جهت برگشت وجه</label><input id="edit-refund-iban" formControlName="refundIban" type="text" dir="ltr" class="field-input"></div>
              <label class="toggle-row md:col-span-2"><span>درگاه پرداخت غیرفعال باشد</span><input formControlName="paymentGatewayDisabled" type="checkbox" class="h-5 w-5 accent-primary"></label>
            </div>
          </section>

          <section class="min-w-0 rounded-2xl border border-border bg-surface shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="edit-user-notification-title">
            <div class="border-b border-border px-4 py-3 dark:border-slate-700"><h2 id="edit-user-notification-title" class="text-lg font-extrabold text-foreground dark:text-slate-100">نحوه اطلاع رسانی</h2></div>
            <div class="grid min-w-0 grid-cols-1 gap-4 p-4 md:grid-cols-2">
              <div><label for="edit-ticket-notification" class="field-label">اطلاع رسانی تیکت ها</label><select id="edit-ticket-notification" formControlName="ticketNotification" class="field-input"><option value="پیامک">پیامک</option></select></div>
              <div><label for="edit-document-notification" class="field-label">اطلاع رسانی ارسال فیش حقوق و سایر اسناد</label><select id="edit-document-notification" formControlName="documentNotification" class="field-input"><option value="پیامک">پیامک</option></select></div>
              <div><label for="edit-financial-notification" class="field-label">اطلاع رسانی تراکنشهای مالی</label><select id="edit-financial-notification" formControlName="financialNotification" class="field-input"><option value="پیامک">پیامک</option></select></div>
              <div><label for="edit-shipment-notification" class="field-label">اطلاع رسانی مرسولات پستی</label><select id="edit-shipment-notification" formControlName="shipmentNotification" class="field-input"><option value="پیامک">پیامک</option></select></div>
              <div><label for="edit-discount-notification" class="field-label">اطلاع رسانی تخفیفات</label><select id="edit-discount-notification" formControlName="discountNotification" class="field-input"><option value="پیامک">پیامک</option></select></div>
              <label class="toggle-row"><span>اشتراک خبرنامه به صورت ایمیل</span><input formControlName="newsletterEmail" type="checkbox" class="h-5 w-5 accent-primary"></label>
            </div>
          </section>

          <div class="sticky bottom-3 z-10 flex min-w-0 flex-col-reverse gap-2 rounded-2xl border border-border bg-surface/95 p-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-800/95 sm:flex-row sm:justify-end xl:col-span-2">
            <button type="button" (click)="cancel()" class="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-bold text-foreground hover:bg-background dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">انصراف</button>
            <button id="business-user-edit-submit" type="submit" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30"><ui-icon name="check" [size]="18"></ui-icon>ویرایش</button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .field-label { display: block; margin-bottom: .375rem; font-size: .875rem; line-height: 1.4; font-weight: 700; color: rgb(var(--color-foreground)); }
    .field-input { width: 100%; min-width: 0; height: 2.75rem; border: 1px solid rgb(var(--color-border)); border-radius: .75rem; background: rgb(var(--color-background)); padding: 0 .75rem; font-size: .875rem; color: rgb(var(--color-foreground)); outline: none; }
    .field-input:focus, .field-textarea:focus { border-color: rgb(var(--color-primary)); box-shadow: 0 0 0 2px rgb(var(--color-primary) / .15); }
    .field-textarea { width: 100%; min-width: 0; resize: vertical; border: 1px solid rgb(var(--color-border)); border-radius: .75rem; background: rgb(var(--color-background)); padding: .625rem .75rem; font-size: .875rem; line-height: 1.6; color: rgb(var(--color-foreground)); outline: none; }
    .field-error { margin-top: .375rem; font-size: .75rem; font-weight: 600; color: rgb(var(--color-danger)); }
    .choice-box, .toggle-row { display: flex; min-width: 0; align-items: center; gap: .625rem; border: 1px solid rgb(var(--color-border)); border-radius: .75rem; background: rgb(var(--color-background) / .7); padding: .7rem .75rem; font-size: .875rem; font-weight: 700; color: rgb(var(--color-foreground)); }
    .toggle-row { justify-content: space-between; }
    .file-box { min-width: 0; }
    .file-preview { display: flex; width: 100%; height: 6rem; align-items: center; justify-content: center; overflow: hidden; border: 1px dashed rgb(var(--color-border)); border-radius: .75rem; background: rgb(var(--color-background)); }
    .file-input { margin-top: .5rem; width: 100%; min-width: 0; font-size: .75rem; color: rgb(var(--color-muted)); }
    :host-context(.dark) .field-label { color: rgb(226 232 240); }
    :host-context(.dark) .field-input, :host-context(.dark) .field-textarea { border-color: rgb(71 85 105); background: rgb(15 23 42); color: rgb(241 245 249); }
    :host-context(.dark) .choice-box, :host-context(.dark) .toggle-row { border-color: rgb(71 85 105); background: rgb(15 23 42 / .45); color: rgb(226 232 240); }
    :host-context(.dark) .file-preview { border-color: rgb(71 85 105); background: rgb(15 23 42); }
  `]
})
export class BusinessUserEditComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(BusinessUserPreviewService);
  private readonly rolePreviewService = inject(Fish24RolePreviewService);
  private readonly permissionService = inject(Fish24PermissionService);

  readonly ranks: readonly UserRank[] = [1, 2, 3, 4, 5];
  readonly provinces = ['تهران', 'البرز'] as const;
  readonly counties = ['تهران', 'کرج'] as const;
  readonly cities = ['تهران', 'کرج'] as const;
  readonly submitted = signal(false);
  readonly mobileConflict = signal(false);
  readonly profileImage = signal<string | null>(null);
  readonly nationalCardImage = signal<string | null>(null);
  readonly officialNewspaperImage = signal<string | null>(null);
  readonly vatCertificateImage = signal<string | null>(null);
  readonly userId = Number(this.route.snapshot.paramMap.get('id'));
  readonly user = computed(() => this.userService.findUser(this.userId));
  readonly hasAccess = computed(() => this.permissionService.hasPermission(this.rolePreviewService.getPreviewRoles(), FISH24_PERMISSIONS.userManagement));
  readonly form = this.createForm();

  private readonly enforceAccess = effect(() => {
    if (!this.hasAccess() || !this.user()) void this.router.navigate(['/fish24/internal/users']);
  });

  constructor() {
    const user = this.user();
    if (user) {
      this.profileImage.set(user.profileImage);
      this.nationalCardImage.set(user.nationalCardImage);
      this.officialNewspaperImage.set(user.officialNewspaperImage);
      this.vatCertificateImage.set(user.vatCertificateImage);
    }
  }

  hasError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control?.invalid && (control.touched || this.submitted()));
  }

  roleError(): boolean {
    return this.submitted() && !this.form.controls.roleEmployer.value && !this.form.controls.roleEmployee.value;
  }

  selectImage(event: Event, field: ImageField): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      input.value = '';
      this.toastService.show('فقط فایل تصویری قابل انتخاب است.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.setImage(field, typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  }

  save(): void {
    this.submitted.set(true);
    this.mobileConflict.set(false);
    const user = this.user();
    const values = this.form.getRawValue();
    const mobile = this.normalizeDigits(values.mobile);
    const nationalId = this.normalizeDigits(values.nationalId);
    this.form.controls.mobile.setValue(mobile);
    this.form.controls.nationalId.setValue(nationalId);
    this.form.markAllAsTouched();
    if (!user || this.form.invalid || this.roleError()) return;
    if (!this.userService.isMobileUnique(mobile, user.id)) {
      this.mobileConflict.set(true);
      return;
    }

    const roles: BusinessUserRole[] = [];
    if (values.roleEmployer) roles.push('employer');
    if (values.roleEmployee) roles.push('employee');
    const companyName = roles.includes('employer') ? values.companyName.trim() : '';
    this.userService.updateUser(user.id, {
      mobile,
      fullName: values.fullName.trim(),
      nationalId,
      email: values.email.trim(),
      rank: Number(values.rank) as UserRank,
      freeCreditExpiresAt: values.accessExpiresAt.trim() || null,
      roles,
      hasFreeCredit: values.hasFreeCredit,
      ticketAccess: values.ticketAccess,
      refundRequestAllowed: values.refundRequestAllowed,
      invoiceDeliveryMethod: 'ارسال نشود',
      invoicePostalCode: values.invoicePostalCode.trim(),
      invoiceRecipientName: values.invoiceRecipientName.trim(),
      invoiceRecipientMobile: this.normalizeDigits(values.invoiceRecipientMobile),
      invoiceAddress: values.invoiceAddress.trim(),
      profileImage: this.profileImage(),
      nationalCardImage: this.nationalCardImage(),
      landline: values.landline.trim(),
      province: values.province,
      county: values.county,
      city: values.city,
      userType: values.userType,
      gender: values.gender,
      officialNewspaperImage: this.officialNewspaperImage(),
      vatCertificateImage: this.vatCertificateImage(),
      companyName,
      registrationNumber: values.registrationNumber.trim(),
      companyNationalId: values.companyNationalId.trim(),
      economicCode: values.economicCode.trim(),
      registeredAddress: values.registeredAddress.trim(),
      financialContactName: values.financialContactName.trim(),
      financialContactMobile: this.normalizeDigits(values.financialContactMobile),
      financialContactLandline: values.financialContactLandline.trim(),
      refundIban: values.refundIban.trim(),
      paymentGatewayDisabled: values.paymentGatewayDisabled,
      ticketNotification: 'پیامک',
      documentNotification: 'پیامک',
      financialNotification: 'پیامک',
      shipmentNotification: 'پیامک',
      discountNotification: 'پیامک',
      newsletterEmail: values.newsletterEmail
    });
    this.toastService.show('اطلاعات کاربر فقط در پیش‌نمایش فعلی به‌روزرسانی شد.', 'success');
    void this.router.navigate(['/fish24/internal/users']);
  }

  cancel(): void { void this.router.navigate(['/fish24/internal/users']); }

  private createForm() {
    const user = this.user();
    const optionalMobile = /^(|09\d{9})$/;
    return this.formBuilder.nonNullable.group({
      mobile: [user?.mobile ?? '', [Validators.required, Validators.pattern(/^09\d{9}$/)]],
      fullName: [user?.fullName ?? '', Validators.required],
      nationalId: [user?.nationalId ?? '', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: [user?.email ?? '', Validators.email],
      rank: [user?.rank ?? 1, [Validators.required, Validators.min(1), Validators.max(5)]],
      accessExpiresAt: [user?.freeCreditExpiresAt ?? ''],
      roleEmployer: [user?.roles.includes('employer') ?? false],
      roleEmployee: [user?.roles.includes('employee') ?? false],
      hasFreeCredit: [user?.hasFreeCredit ?? false],
      ticketAccess: [user?.ticketAccess ?? false],
      refundRequestAllowed: [user?.refundRequestAllowed ?? false],
      invoiceDeliveryMethod: [user?.invoiceDeliveryMethod ?? 'ارسال نشود'],
      invoicePostalCode: [user?.invoicePostalCode ?? ''],
      invoiceRecipientName: [user?.invoiceRecipientName ?? ''],
      invoiceRecipientMobile: [user?.invoiceRecipientMobile ?? '', Validators.pattern(optionalMobile)],
      invoiceAddress: [user?.invoiceAddress ?? ''],
      landline: [user?.landline ?? ''],
      province: [user?.province ?? 'تهران'],
      county: [user?.county ?? 'تهران'],
      city: [user?.city ?? 'تهران'],
      userType: [user?.userType ?? 'حقیقی'],
      gender: [user?.gender ?? 'مرد'],
      companyName: [user?.companyName ?? ''],
      registrationNumber: [user?.registrationNumber ?? ''],
      companyNationalId: [user?.companyNationalId ?? ''],
      economicCode: [user?.economicCode ?? ''],
      registeredAddress: [user?.registeredAddress ?? ''],
      financialContactName: [user?.financialContactName ?? ''],
      financialContactMobile: [user?.financialContactMobile ?? '', Validators.pattern(optionalMobile)],
      financialContactLandline: [user?.financialContactLandline ?? ''],
      refundIban: [user?.refundIban ?? ''],
      paymentGatewayDisabled: [user?.paymentGatewayDisabled ?? false],
      ticketNotification: [user?.ticketNotification ?? 'پیامک'],
      documentNotification: [user?.documentNotification ?? 'پیامک'],
      financialNotification: [user?.financialNotification ?? 'پیامک'],
      shipmentNotification: [user?.shipmentNotification ?? 'پیامک'],
      discountNotification: [user?.discountNotification ?? 'پیامک'],
      newsletterEmail: [user?.newsletterEmail ?? false]
    });
  }

  private setImage(field: ImageField, value: string | null): void {
    if (field === 'profile') this.profileImage.set(value);
    else if (field === 'national-card') this.nationalCardImage.set(value);
    else if (field === 'official-newspaper') this.officialNewspaperImage.set(value);
    else this.vatCertificateImage.set(value);
  }

  private normalizeDigits(value: string): string {
    return value.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/\D/g, '');
  }
}

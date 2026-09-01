import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { EmployeeDataService } from '../../../core/data/employee-data.service';
import { OrganizationService } from '../../../core/organization/organization.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-payslip-detail',
  standalone: true,
  imports: [RouterModule, IconComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-slate-900 pb-10">
      
      <!-- نوار ابزار -->
      <div class="print:hidden sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between shadow-sm dark:border-slate-700">
        <div class="flex items-center gap-3">
          <button (click)="goBack()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <ui-icon name="arrow-right" [size]="20" class="text-foreground"></ui-icon>
          </button>
          <h1 class="font-bold text-foreground dark:text-slate-100">مشاهده فیش حقوقی</h1>
        </div>
        <div class="flex gap-2">
          <button (click)="downloadPDF()" class="px-4 py-2 bg-surface border border-border text-foreground rounded-xl hover:bg-background transition-colors font-bold text-sm flex items-center gap-2 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
            <ui-icon name="download" [size]="18"></ui-icon> دانلود PDF
          </button>
          <button (click)="printPayslip()" class="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20">
            <ui-icon name="printer" [size]="18"></ui-icon> چاپ فیش
          </button>
        </div>
      </div>

      <!-- محتوای کامل فیش -->
      <div id="payslip-content" class="max-w-[297mm] mx-auto mt-4 bg-white p-6 shadow-2xl text-slate-800 font-vazir text-[9px] leading-tight">
        
        <!-- هدر فیش -->
        <div class="flex items-center justify-between mb-2 pb-2 border-b-2 border-primary">
          <div>
            <h1 class="text-lg font-bold text-primary">{{ activeOrg().name }}</h1>
            <p class="text-[10px] text-slate-500">سامانه جامع منابع انسانی HRM24</p>
          </div>
          <div class="text-left">
            <h2 class="text-base font-bold text-slate-700">فیش حقوق و دستمزد</h2>
            <p class="text-[10px] text-slate-500 mt-0.5">تاریخ تهیه: {{ currentDate }}</p>
          </div>
        </div>

        <!-- اطلاعات پرسنلی -->
        <div class="border border-slate-300 rounded mb-2 bg-slate-50 overflow-hidden">
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-2 gap-y-0 divide-x divide-x-reverse divide-slate-200">
            <div class="p-1.5 flex flex-col"><span class="text-slate-500 text-[8px]">نام و نام خانوادگی</span><b class="text-[10px]">محمد دملا افکن</b></div>
            <div class="p-1.5 flex flex-col"><span class="text-slate-500 text-[8px]">شماره پرسنلی</span><b class="dir-ltr text-[10px]">{{ toPersianNum(activeOrg().personnelCode) }}</b></div>
            <div class="p-1.5 flex flex-col"><span class="text-slate-500 text-[8px]">سمت / شغل</span><b class="text-[10px]">{{ jobProfile().jobTitle }}</b></div>
            <div class="p-1.5 flex flex-col"><span class="text-slate-500 text-[8px]">واحد سازمانی</span><b class="text-[10px]">{{ jobProfile().department }}</b></div>
            <div class="p-1.5 flex flex-col"><span class="text-slate-500 text-[8px]">شماره حساب</span><b class="dir-ltr text-[10px] truncate">۳۱۱.۸۰۰۰.۱۰۶۴۰۷۵۸.۱</b></div>
            <div class="p-1.5 flex flex-col"><span class="text-slate-500 text-[8px]">شماره موبایل</span><b class="dir-ltr text-[10px]">۰۹۱۲۱۱۲۸۳۸۲</b></div>
            
            <div class="p-1.5 flex flex-col border-t border-slate-200"><span class="text-slate-500 text-[8px]">کد ملی</span><b class="dir-ltr text-[10px]">۲۰۷۳۶۱۹۴</b></div>
            <div class="p-1.5 flex flex-col border-t border-slate-200"><span class="text-slate-500 text-[8px]">نام پدر</span><b class="text-[10px]">اسماعیل</b></div>
            <div class="p-1.5 flex flex-col border-t border-slate-200"><span class="text-slate-500 text-[8px]">تحصیلات</span><b class="text-[10px]">دیپلم</b></div>
            <div class="p-1.5 flex flex-col border-t border-slate-200"><span class="text-slate-500 text-[8px]">وضعیت تاهل</span><b class="text-[10px]">متاهل</b></div>
            <div class="p-1.5 flex flex-col border-t border-slate-200"><span class="text-slate-500 text-[8px]">تعداد فرزند</span><b class="text-[10px]">۱ نفر</b></div>
            <div class="p-1.5 flex flex-col border-t border-slate-200"><span class="text-slate-500 text-[8px]">کد پستی</span><b class="dir-ltr text-[10px]">۰۰۱۹۵۳۲۱۹۹</b></div>
            
            <div class="p-1.5 flex flex-col border-t border-slate-200"><span class="text-slate-500 text-[8px]">شماره بیمه</span><b class="dir-ltr text-[10px]">۰۹۱۲۱۱۲۸۳۸۲</b></div>
            <div class="p-1.5 flex flex-col border-t border-slate-200"><span class="text-slate-500 text-[8px]">محل خدمت</span><b class="text-[10px]">پژوهشگاه</b></div>
            <div class="p-1.5 flex flex-col border-t border-slate-200"><span class="text-slate-500 text-[8px]">نوع استخدام</span><b class="text-[10px]">قراردادی</b></div>
            <div class="p-1.5 flex flex-col border-t border-slate-200"><span class="text-slate-500 text-[8px]">گروه شغلی</span><b class="text-[10px]">۴</b></div>
            <div class="p-1.5 flex flex-col border-t border-slate-200"><span class="text-slate-500 text-[8px]">شغل</span><b class="text-[10px]">حسابدار</b></div>
            <div class="p-1.5 flex flex-col border-t border-slate-200"><span class="text-slate-500 text-[8px]">شماره شناسنامه</span><b class="dir-ltr text-[10px]">۲۵۱۲۶</b></div>
          </div>
        </div>

        <!-- گرید اصلی ۴ ستونه -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-2">
          
          <!-- ستون ۱: کارکرد و مرخصی -->
          <div class="col-span-1 md:col-span-1 xl:col-span-3 space-y-2">
            <div class="border border-slate-300 rounded overflow-hidden break-inside-avoid">
              <div class="bg-slate-100 p-1 font-bold text-center border-b border-slate-300 text-slate-700 text-[9px]">کارکرد ماه جاری</div>
              <div class="p-1.5 space-y-1">
                <div class="flex justify-between text-[9px]"><span>روزهای کارکرد</span><span class="font-bold">۳۱</span></div>
                <div class="flex justify-between text-[9px]"><span>روزهای غیبت</span><span class="font-bold">۰</span></div>
                <div class="flex justify-between text-[9px]"><span>ساعات کارکرد</span><span class="font-bold">۰۰:۰۰</span></div>
                <div class="flex justify-between text-[9px]"><span>روزهای موظفی</span><span class="font-bold">۰</span></div>
              </div>
            </div>

            <div class="border border-slate-300 rounded overflow-hidden break-inside-avoid">
              <div class="bg-orange-50 p-1 font-bold text-center border-b border-slate-300 text-orange-700 text-[9px]">سایر کارکردها</div>
              <div class="p-1.5 space-y-1">
                <div class="flex justify-between text-[9px]"><span>اضافه کاری</span><span class="font-bold">۱۱۶</span></div>
                <div class="flex justify-between text-[9px]"><span>تعطیل کاری</span><span class="font-bold">۱۵:۴۲</span></div>
                <div class="flex justify-between text-[9px]"><span>جمعه کاری</span><span class="font-bold">۸:۴۸</span></div>
                <div class="flex justify-between text-[9px]"><span>کسر کار ساعتی</span><span class="font-bold">۱۵:۵۵</span></div>
              </div>
            </div>

            <div class="border border-slate-300 rounded overflow-hidden break-inside-avoid">
              <div class="bg-orange-50 p-1 font-bold text-center border-b border-slate-300 text-orange-700 text-[9px]">مرخصی‌های ماه جاری</div>
              <div class="p-1.5 space-y-1">
                <div class="flex justify-between text-[9px]"><span>مرخصی استحقاقی</span><span class="font-bold">۱۰۰.۰۰</span></div>
                <div class="flex justify-between text-[9px]"><span>استعلاجی عهده بیمه</span><span class="font-bold">۰</span></div>
                <div class="flex justify-between text-[9px]"><span>استعلاجی عهده کارفرما</span><span class="font-bold">۰</span></div>
                <div class="flex justify-between text-[9px]"><span>بدون حقوق</span><span class="font-bold">۰</span></div>
              </div>
            </div>

            <div class="border border-slate-300 rounded overflow-hidden break-inside-avoid">
              <div class="bg-blue-50 p-1 font-bold text-center border-b border-slate-300 text-blue-700 text-[9px]">مانده مرخصی استحقاقی</div>
              <div class="p-1.5 space-y-1">
                <div class="flex justify-between text-[9px]"><span>مانده از ابتدای سال تا ماه قبل</span><span class="font-bold">۰.۰۰</span></div>
                <div class="flex justify-between text-[9px]"><span>مانده ماه جاری</span><span class="font-bold">-۹۷.۷۹</span></div>
                <div class="flex justify-between text-[9px]"><span>ذخیره سال‌های قبل</span><span class="font-bold">۰.۰۰</span></div>
                <div class="flex justify-between font-bold text-blue-600 text-[9px]"><span>مانده نهایی</span><span>-۹۷.۷۹</span></div>
              </div>
            </div>
          </div>

          <!-- ستون ۲: پرداخت‌ها -->
          <div class="col-span-1 md:col-span-1 xl:col-span-3">
            <div class="border border-slate-300 rounded overflow-hidden h-full break-inside-avoid">
              <div class="bg-emerald-50 p-1 font-bold text-center border-b border-slate-300 text-emerald-700 text-[9px]">پرداخت‌ها (ریال)</div>
              <div class="p-1.5 space-y-0.5">
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>حقوق ماهیانه</span><span class="dir-ltr">۱۷۲,۶۴۹,۲۶۱</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>پایه سنوات</span><span class="dir-ltr">۳۰,۶۳۴,۰۷۶</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>حق اولاد</span><span class="dir-ltr">۱۶,۶۲۵,۵۵۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>حق تاهل</span><span class="dir-ltr">۵,۰۰۰,۰۰۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>حق مسکن</span><span class="dir-ltr">۳۰,۰۰۰,۰۰۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>بن</span><span class="dir-ltr">۲۲,۰۰۰,۰۰۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>اضافه کاری</span><span class="dir-ltr">۱۴۵,۲۸۵,۴۵۵</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>تعطیل کاری</span><span class="dir-ltr">۳۶,۵۱۸,۱۷۹</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>حق ماموریت</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>شب‌کاری</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>نوبت‌کاری ۲۲.۵٪</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>جمعه کاری</span><span class="dir-ltr">۲۲,۰۴۳,۳۱۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>حق فنی</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>پاداش</span><span class="dir-ltr">۳۰,۰۰۰,۰۰۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>بازخرید مرخصی</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>عیدی و پاداش</span><span class="dir-ltr">۳۳,۴۱۶,۴۳۹</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>سنوات خدمت</span><span class="dir-ltr">۱۶,۷۰۸,۲۱۹</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>معوقه</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>سایر</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] pt-1 font-bold text-emerald-700 border-t border-slate-200"><span>جمع کل</span><span class="dir-ltr">{{ formatRial(totalPayments()) }}</span></div>
              </div>
            </div>
          </div>

          <!-- ستون ۳: کسورات و وام‌ها -->
          <div class="col-span-1 md:col-span-1 xl:col-span-3 space-y-2">
            <div class="border border-slate-300 rounded overflow-hidden break-inside-avoid">
              <div class="bg-red-50 p-1 font-bold text-center border-b border-slate-300 text-red-700 text-[9px]">کسورات (ریال)</div>
              <div class="p-1.5 space-y-0.5">
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>مالیات</span><span class="dir-ltr">۸,۲۳۶,۶۰۲</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>بیمه سهم کارمند</span><span class="dir-ltr">۳۴,۵۸۹,۱۲۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>صندوق پس‌انداز</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>وام قرض‌الحسنه</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>وام ازدواج</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>وام مسکن</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>وام خودرو</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>وام خرید کالا</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>وام تحصیلی</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>مساعده</span><span class="dir-ltr">۱۰۰,۰۰۰,۰۰۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>بیمه تکمیلی</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>بیمه عمر</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>کسر کار ساعتی</span><span class="dir-ltr">۱۴,۲۳۹,۲۸۷</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>هزینه بن کارت</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>بدهی به شرکت</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>بدهی به پژوهشگاه</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>اقساط لازم خانگی</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>هزینه دندانپزشکی</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>بیمه حوادث</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] pt-1 font-bold text-red-700 border-t border-slate-200"><span>جمع کل</span><span class="dir-ltr">{{ formatRial(totalDeductions()) }}</span></div>
              </div>
            </div>

            <div class="border border-slate-300 rounded overflow-hidden break-inside-avoid">
              <div class="bg-purple-50 p-1 font-bold text-center border-b border-slate-300 text-purple-700 text-[9px]">مانده وام‌ها</div>
              <div class="p-1.5 space-y-1">
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>وام ازدواج (۱۰ قسط)</span><span class="dir-ltr">۱۰۱,۰۰۰,۰۰۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>وام مسکن</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-100 pb-0.5"><span>وام خودرو</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] font-bold text-purple-600"><span>وام قرض‌الحسنه</span><span class="dir-ltr">۰</span></div>
              </div>
            </div>
          </div>

          <!-- ستون ۴: سایر اطلاعات و نتایج نهایی -->
          <div class="col-span-1 md:col-span-1 xl:col-span-3 space-y-2">
            <div class="border border-slate-300 rounded overflow-hidden break-inside-avoid">
              <div class="bg-gray-100 p-1 font-bold text-center border-b border-slate-300 text-gray-700 text-[9px]">سایر اطلاعات</div>
              <div class="p-1.5 space-y-1">
                <div class="flex justify-between text-[9px]"><span>مزد شغل روزانه</span><b class="dir-ltr">۰</b></div>
                <div class="flex justify-between text-[9px]"><span>پایه سنوات روزانه</span><b class="dir-ltr">۰</b></div>
                <div class="flex justify-between text-[9px]"><span>جمع مزد مبنا</span><b class="dir-ltr">۰</b></div>
                <div class="flex justify-between text-[9px]"><span>بیمه سخت و زیان‌آور</span><b class="dir-ltr">۵,۵۶۹,۳۳۱</b></div>
                <div class="flex justify-between text-[9px]"><span>بیمه بیکاری</span><b class="dir-ltr">۹۸۸,۱۹۶</b></div>
                <div class="flex justify-between text-[9px]"><span>بیمه سهم کارفرما</span><b class="dir-ltr">۶,۵۵۷,۵۲۷</b></div>
              </div>
            </div>

            <div class="border border-slate-300 rounded overflow-hidden break-inside-avoid">
              <div class="bg-blue-600 text-white p-1 font-bold text-center border-b border-blue-700 text-[9px]">نتایج نهایی (ریال)</div>
              <div class="p-1.5 space-y-1.5">
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-200 pb-0.5"><span>جمع ناخالص</span><span class="dir-ltr font-bold">{{ formatRial(totalPayments()) }}</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-200 pb-0.5"><span>جمع کسور</span><span class="dir-ltr font-bold text-red-600">{{ formatRial(totalDeductions()) }}</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-200 pb-0.5"><span>طلب ابتدای دوره</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-200 pb-0.5"><span>مانده انتقال</span><span class="dir-ltr">۰</span></div>
                <div class="flex justify-between text-[9px] border-b border-dashed border-slate-200 pb-0.5"><span>خالص ماه جاری</span><span class="dir-ltr font-bold text-blue-600">{{ formatRial(netPayAmount()) }}</span></div>
                <div class="flex justify-between bg-blue-50 p-1 rounded mt-1 text-[9px]"><span class="font-bold">مبلغ پرداختی</span><span class="dir-ltr font-extrabold text-sm text-blue-700">{{ formatRial(netPayAmount()) }}</span></div>
              </div>
            </div>

            <!-- NEW: Performance Coefficient Section -->
            <div class="border border-slate-300 rounded overflow-hidden break-inside-avoid">
              <div class="bg-indigo-50 p-1 font-bold text-center border-b border-slate-300 text-indigo-700 text-[9px] flex items-center justify-center gap-1">
                <span>⭐</span> ضریب عملکرد (ارزیابی ۳۶۰ درجه)
              </div>
              <div class="p-1.5 space-y-1.5">
                <div class="flex justify-between text-[9px]"><span>آخرین امتیاز ارزیابی</span><b class="dir-ltr text-indigo-700">{{ toPersianNum(lastCompletedScore()) }} از ۱۰۰</b></div>
                <div class="flex justify-between text-[9px]"><span>ضریب عملکرد</span><b class="dir-ltr text-indigo-700 text-[10px]">{{ performanceCoefficient() }}</b></div>
                
                <!-- Progress Bar -->
                <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                  <div 
                    class="h-full rounded-full"
                    [style.width.%]="lastCompletedScore()"
                    [class]="getScoreBarClass()"
                  ></div>
                </div>
                
                <div class="flex justify-between text-[7px] text-slate-400 mt-0.5">
                  <span>۰</span>
                  <span>۵۰</span>
                  <span>۱۰۰</span>
                </div>

                <!-- Explanation -->
                <div class="bg-indigo-50 rounded p-1 mt-1 text-[7px] text-indigo-600 leading-relaxed">
                  ضریب عملکرد بر اساس آخرین ارزیابی ۳۶۰ درجه محاسبه شده و در محاسبه پاداش عملکرد اعمال می‌شود.
                  <br>
                  فرمول: <span class="dir-ltr font-mono">0.8 + (score/100) × 0.7</span>
                </div>

                <!-- Link to Evaluation (print:hidden) -->
                <div class="print:hidden mt-1">
                  <a 
                    routerLink="/evaluation"
                    class="flex items-center justify-center gap-1 w-full py-1 bg-indigo-600 text-white rounded text-[8px] font-bold hover:bg-indigo-700 transition-colors"
                  >
                    مشاهده جزئیات ارزیابی ←
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- فوتر -->
        <div class="mt-4 flex justify-between items-end text-[8px] text-slate-400 border-t border-slate-200 pt-2">
          <div>
            <p>این فیش توسط سامانه اینترنتی فیش حقوق Fish24.ir صادر شده است.</p>
            <p>اختلاف حساب احتمالی در ماه بعد اصلاح می‌شود.</p>
            <p>Mobile: 09121128382</p>
          </div>
          <div class="text-left">
            <p>محل امضاء</p>
            <p class="mt-2">....................</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @media (max-width: 768px) {
      #payslip-content { padding: 10px; font-size: 8px; }
    }
  `]
})
export class PayslipDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private dataService = inject(EmployeeDataService);
  private orgService = inject(OrganizationService);

  activeOrg = this.orgService.activeOrg;
  payslips = this.dataService.payslipData;
  leaveData = this.dataService.leaveData;
  jobProfile = this.dataService.jobProfile;
  selectedItem = signal<any>(this.dataService.payslipData()[0]);
  currentDate = new Date().toLocaleDateString('fa-IR');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.payslips().find(p => p.month.includes(id));
      if (found) this.selectedItem.set(found);
    }
  }

  goBack(): void { this.location.back(); }

  printPayslip(): void {
    window.print();
  }

  downloadPDF(): void {
    const content = document.getElementById('payslip-content');
    if (!content) return;

    const parents: HTMLElement[] = [];
    let el: HTMLElement | null = content.parentElement;
    while (el) {
      parents.push(el);
      el.style.setProperty('overflow', 'visible', 'important');
      el.style.setProperty('height', 'auto', 'important');
      el = el.parentElement;
    }

    html2canvas(content, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false })
      .then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Payslip-${this.currentDate}.pdf`);
      })
      .finally(() => {
        parents.forEach(p => {
          p.style.removeProperty('overflow');
          p.style.removeProperty('height');
        });
      });
  }

  performanceCoefficient(): string {
    const item = this.selectedItem();
    const coeff = item?.performanceCoefficient || 1.0;
    return coeff.toFixed(2);
  }

  lastCompletedScore(): number {
    return this.dataService.getLastCompletedScore();
  }

  getScoreBarClass(): string {
    const score = this.lastCompletedScore();
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  }

  toPersianNum(num: number | string): string {
    return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }

  formatRial(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount * 10);
  }

  totalPayments(): number {
    const item = this.selectedItem();
    return item ? item.baseSalary + 30000000 + 22000000 + 16625550 + 172649261 + 33416439 + 16708219 : 0;
  }

  totalDeductions(): number {
    return 8236602 + 34589120 + 14239287 + 100000000;
  }

  netPayAmount(): number {
    return this.totalPayments() - this.totalDeductions();
  }
}
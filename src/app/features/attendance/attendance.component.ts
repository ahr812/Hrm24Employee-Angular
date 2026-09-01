import { Component, inject, signal, computed, OnInit, OnDestroy, ViewChild, effect, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { AttendanceService, CheckInMethod } from '../../core/attendance/attendance.service';
import { ClockVerifyModalComponent } from './clock-verify-modal.component';
import { ExportService } from '../../core/export/export.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [FormsModule, IconComponent, ClockVerifyModalComponent],
  template: `
    <div class="max-w-[95%] mx-auto space-y-8 animate-fade-in-up">

      <!-- Inline Feedback Overlay -->
      @if (feedbackVisible()) {
        <div class="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fade-in">
          <div class="px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
               [class]="feedbackType() === 'success' ? 'bg-success/90 backdrop-blur-md text-white' : 'bg-danger/90 backdrop-blur-md text-white'">
            <ui-icon [name]="feedbackType() === 'success' ? 'check-circle' : 'alert-circle'" [size]="24"></ui-icon>
            <span class="text-base font-extrabold">{{ feedbackText() }}</span>
          </div>
        </div>
      }

      <!-- Confirm Dialog -->
      @if (confirmDialog()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div class="w-72 bg-surface dark:bg-slate-900 border border-border dark:border-slate-700 rounded-2xl p-5 text-center animate-scale-in mx-4 shadow-2xl">
            <div class="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
              <ui-icon name="alert-triangle" [size]="24" class="text-warning"></ui-icon>
            </div>
            <p class="text-base font-bold text-foreground dark:text-white mb-1">{{ confirmTitle() }}</p>
            <p class="text-xs text-muted mb-4">{{ confirmMessage() }}</p>
            <div class="flex gap-2">
              <button (click)="cancelConfirm()" class="flex-1 py-2.5 rounded-xl border border-border dark:border-slate-700 text-sm font-bold text-muted hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">انصراف</button>
              <button (click)="executeConfirm()" class="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">تأیید</button>
            </div>
          </div>
        </div>
      }

      <!-- Quick Note Modal -->
      @if (noteModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div class="w-80 bg-surface dark:bg-slate-900 border border-border dark:border-slate-700 rounded-2xl p-5 animate-scale-in mx-4 shadow-2xl">
            <h3 class="text-base font-bold text-foreground dark:text-white mb-3 flex items-center gap-2">
              <ui-icon name="edit" [size]="18" class="text-primary"></ui-icon>
              یادداشت سریع
            </h3>
            <textarea [(ngModel)]="quickNoteText" rows="3" placeholder="یادداشت خود را بنویسید..."
                      class="w-full px-3 py-2 rounded-xl border border-border dark:border-slate-700 bg-background dark:bg-slate-950 text-sm text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none mb-3"></textarea>
            <div class="flex gap-2">
              <button (click)="noteModalOpen.set(false)" class="flex-1 py-2.5 rounded-xl border border-border dark:border-slate-700 text-sm font-bold text-muted hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">انصراف</button>
              <button (click)="submitQuickNote()" class="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">ثبت</button>
            </div>
          </div>
        </div>
      }

      <!-- Report Modal -->
      @if (reportModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 pb-4 px-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto" (click)="closeReportModal()">
          <div class="relative w-full max-w-2xl max-h-[85vh] bg-surface dark:bg-slate-900 border border-border dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col animate-scale-in overflow-hidden my-auto" (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-border dark:border-slate-800 flex-shrink-0">
              <div class="flex items-center gap-2">
                <ui-icon name="bar-chart-2" [size]="20" class="text-primary"></ui-icon>
                <h2 class="text-lg font-bold text-foreground dark:text-white">گزارش حضور و غیاب</h2>
              </div>
              <div class="flex items-center gap-1">
                <button (click)="printReport()" class="p-2 rounded-lg hover:bg-primary/10 transition-colors" title="چاپ">
                  <ui-icon name="printer" [size]="20" class="text-primary"></ui-icon>
                </button>
                <button (click)="closeReportModal()" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <ui-icon name="x" [size]="20" class="text-muted"></ui-icon>
                </button>
              </div>
            </div>
            <!-- Body -->
            <div class="flex-1 overflow-y-auto p-4 space-y-3" id="attendance-report-content">

              <!-- Today Stats -->
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-background dark:bg-slate-950 rounded-xl p-3 text-center border border-border dark:border-slate-700">
                  <p class="text-[10px] text-muted mb-1">ورود</p>
                  <p class="text-lg font-black text-foreground dark:text-white">{{ toFa(todayCheckIn() || '--:--') }}</p>
                </div>
                <div class="bg-background dark:bg-slate-950 rounded-xl p-3 text-center border border-border dark:border-slate-700">
                  <p class="text-[10px] text-muted mb-1">خروج</p>
                  <p class="text-lg font-black text-foreground dark:text-white">{{ toFa(todayCheckOut() || '--:--') }}</p>
                </div>
                <div class="bg-background dark:bg-slate-950 rounded-xl p-3 text-center border border-border dark:border-slate-700">
                  <p class="text-[10px] text-muted mb-1">وضعیت</p>
                  <span [class]="getStatusBadgeClass()" class="inline-block px-2 py-0.5 rounded-md text-xs font-bold">{{ getStatusLabel() }}</span>
                </div>
              </div>

              <!-- Progress -->
              <div class="space-y-1.5">
                <div class="flex justify-between text-xs"><span class="text-muted">پیشرفت شیفت</span><span class="font-bold text-foreground dark:text-white">{{ toFa(shiftProgress()) }}٪</span></div>
                <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-1000" [class]="getProgressBarClass()" [style.width.%]="shiftProgress()"></div>
                </div>
              </div>

              <!-- Weekly Comparison -->
              <div class="bg-background dark:bg-slate-950 rounded-xl p-3 border border-border dark:border-slate-700">
                <h3 class="text-sm font-bold text-foreground dark:text-white mb-2 flex items-center gap-2">
                  <ui-icon name="trending-up" [size]="16" class="text-primary"></ui-icon>
                  مقایسه هفتگی
                </h3>
                <div class="grid grid-cols-2 gap-3">
                  <div class="text-center p-2.5 rounded-xl bg-surface dark:bg-slate-900 border border-border dark:border-slate-700">
                    <p class="text-[10px] text-muted mb-1">این هفته</p>
                    <p class="text-lg font-black text-primary">{{ toFa(weekComp().currentRate) }}%</p>
                    <p class="text-[9px] text-muted">{{ toFa(weekComp().currentPresent) }} روز حاضر</p>
                  </div>
                  <div class="text-center p-2.5 rounded-xl bg-surface dark:bg-slate-900 border border-border dark:border-slate-700">
                    <p class="text-[10px] text-muted mb-1">هفته قبل</p>
                    <p class="text-lg font-black text-muted">{{ toFa(weekComp().prevRate) }}%</p>
                    <p class="text-[9px] text-muted">{{ toFa(weekComp().prevPresent) }} روز حاضر</p>
                  </div>
                </div>
                <div class="mt-2 flex items-center justify-center gap-2">
                  @if (weekComp().trend === 'up') {
                    <div class="flex items-center gap-1 text-success text-xs font-bold">
                      <ui-icon name="trending-up" [size]="14"></ui-icon>
                      <span>{{ toFa(weekComp().diff) }}% بهبود نسبت به هفته قبل</span>
                    </div>
                  } @else if (weekComp().trend === 'down') {
                    <div class="flex items-center gap-1 text-danger text-xs font-bold">
                      <ui-icon name="trending-down" [size]="14"></ui-icon>
                      <span>{{ toFa(weekComp().diff * -1) }}% کاهش نسبت به هفته قبل</span>
                    </div>
                  } @else {
                    <div class="flex items-center gap-1 text-muted text-xs font-bold">
                      <span>بدون تغییر نسبت به هفته قبل</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Leave Balance -->
              <div class="bg-background dark:bg-slate-950 rounded-xl p-3 border border-border dark:border-slate-700 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ui-icon name="calendar" [size]="18" class="text-primary"></ui-icon>
                  </div>
                  <span class="text-sm font-bold text-foreground dark:text-slate-200">مانده مرخصی استحقاقی</span>
                </div>
                <span class="text-xl font-black text-primary">{{ toFa(leaveBalance()) }} <span class="text-sm font-normal text-muted">روز</span></span>
              </div>

              <!-- Monthly Summary -->
              <div class="bg-background dark:bg-slate-950 rounded-xl p-3 border border-border dark:border-slate-700">
                <h3 class="text-sm font-bold text-foreground dark:text-white mb-2 flex items-center gap-2">
                  <ui-icon name="calendar" [size]="16" class="text-primary"></ui-icon>
                  خلاصه ماه جاری
                </h3>
                <div class="grid grid-cols-2 gap-x-3 gap-y-0">
                  <div class="flex justify-between py-1.5 border-b border-border/50 dark:border-slate-700/50">
                    <span class="text-xs text-muted">روزهای حاضر</span>
                    <span class="text-xs font-bold text-success">{{ toFa(monthSummary().presentDays) }}</span>
                  </div>
                  <div class="flex justify-between py-1.5 border-b border-border/50 dark:border-slate-700/50">
                    <span class="text-xs text-muted">روزهای غایب</span>
                    <span class="text-xs font-bold text-danger">{{ toFa(monthSummary().absentDays) }}</span>
                  </div>
                  <div class="flex justify-between py-1.5 border-b border-border/50 dark:border-slate-700/50">
                    <span class="text-xs text-muted">تأخیرها</span>
                    <span class="text-xs font-bold text-warning">{{ toFa(monthSummary().lateDays) }}</span>
                  </div>
                  <div class="flex justify-between py-1.5 border-b border-border/50 dark:border-slate-700/50">
                    <span class="text-xs text-muted">مرخصی‌ها</span>
                    <span class="text-xs font-bold text-info">{{ toFa(monthSummary().leaveDays) }}</span>
                  </div>
                  <div class="flex justify-between py-1.5 border-b border-border/50 dark:border-slate-700/50">
                    <span class="text-xs text-muted">کل ساعات کاری</span>
                    <span class="text-xs font-bold text-foreground dark:text-white">{{ toFa(monthSummary().totalWorkHours) }} ساعت</span>
                  </div>
                  <div class="flex justify-between py-1.5 border-b border-border/50 dark:border-slate-700/50">
                    <span class="text-xs text-muted">اضافه‌کاری</span>
                    <span class="text-xs font-bold text-violet-500">{{ toFa(monthSummary().totalOvertimeHours) }} ساعت</span>
                  </div>
                  <div class="flex justify-between py-1.5">
                    <span class="text-xs text-muted">نرخ حضور</span>
                    <span class="text-xs font-bold text-primary">{{ toFa(monthSummary().attendanceRate) }}%</span>
                  </div>
                  <div class="flex justify-between py-1.5">
                    <span class="text-xs text-muted">میانگین روزانه</span>
                    <span class="text-xs font-bold text-foreground dark:text-white">{{ toFa(monthSummary().avgDailyHours) }} ساعت</span>
                  </div>
                </div>
              </div>

              <!-- Monthly Detail Table -->
              <div class="bg-background dark:bg-slate-950 rounded-xl border border-border dark:border-slate-700 overflow-hidden">
                <div class="px-3 py-2 border-b border-border dark:border-slate-700">
                  <h3 class="text-sm font-bold text-foreground dark:text-white flex items-center gap-2">
                    <ui-icon name="list-check" [size]="16" class="text-primary"></ui-icon>
                    ریز عملکرد ماهانه
                  </h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-xs">
                    <thead class="bg-surface dark:bg-slate-800">
                      <tr>
                        <th class="px-3 py-2 text-right font-bold text-muted">تاریخ</th>
                        <th class="px-3 py-2 text-right font-bold text-muted">وضعیت</th>
                        <th class="px-3 py-2 text-right font-bold text-muted">ورود</th>
                        <th class="px-3 py-2 text-right font-bold text-muted">خروج</th>
                        <th class="px-3 py-2 text-right font-bold text-muted">ساعات</th>
                        <th class="px-3 py-2 text-right font-bold text-muted">تأخیر</th>
                        <th class="px-3 py-2 text-right font-bold text-muted">یادداشت</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (rec of currentMonthRecords(); track rec.id) {
                        <tr class="border-t border-border/50 dark:border-slate-700/50">
                          <td class="px-3 py-2 text-foreground dark:text-slate-200">{{ toFa(rec.date) }}</td>
                          <td class="px-3 py-2"><span [class]="attService.getStatusBadgeClass(rec.status)" class="px-1.5 py-0.5 rounded text-[10px] font-bold">{{ attService.getStatusLabel(rec.status) }}</span></td>
                          <td class="px-3 py-2 text-foreground dark:text-slate-200">{{ toFa(rec.checkInTime || '-') }}</td>
                          <td class="px-3 py-2 text-foreground dark:text-slate-200">{{ toFa(rec.checkOutTime || '-') }}</td>
                          <td class="px-3 py-2 text-foreground dark:text-slate-200">{{ rec.workHours > 0 ? toFa(rec.workHours.toFixed(1)) : '-' }}</td>
                          <td class="px-3 py-2 text-foreground dark:text-slate-200">{{ rec.lateMinutes > 0 ? toFa(rec.lateMinutes) : '-' }}</td>
                          <td class="px-3 py-2 text-muted truncate max-w-[100px]">{{ rec.note || '-' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <!-- Footer -->
            <!-- <div class="px-4 py-3 border-t border-border dark:border-slate-800 flex-shrink-0 flex gap-2">
              <button (click)="printReport()"
                      class="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                <ui-icon name="printer" [size]="18"></ui-icon>
                چاپ گزارش
              </button>
              <button (click)="closeReportModal()"
                      class="px-5 py-2.5 rounded-xl border border-border dark:border-slate-700 text-foreground font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                بستن
              </button>
            </div> -->
          </div>
        </div>
      }

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0">
            <ui-icon name="clock" [size]="36" class="text-teal-500"></ui-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-primary mb-1">حضور و غیاب
              <button (click)="resetToday()"
                      class="px-3 py-1.5 rounded-lg border border-danger/30 text-danger text-[10px] font-bold hover:bg-danger/10 transition-colors self-start mt-2">
                ریست امروز
              </button>
            </h1>
          </div>
        </div>
      </div>

      <!-- Main Clock Area -->
      <div class="flex flex-col items-center gap-3">

        <!-- Status Line -->
        <div class="flex items-center gap-2">
          @if (isClockedIn()) {
            <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20">
              <div class="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span class="text-xs font-bold text-success">حاضر</span>
            </div>
            @if (isOnBreak()) {
              <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
                <ui-icon name="armchair" [size]="12" class="text-violet-500"></ui-icon>
                <span class="text-xs font-bold text-violet-500">استراحت</span>
              </div>
            }
          } @else if (todayRecord()) {
            <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-info/10 border border-info/20">
              <ui-icon name="check-circle" [size]="12" class="text-info"></ui-icon>
              <span class="text-xs font-bold text-info">{{ getStatusLabel() }}</span>
            </div>
          } @else {
            <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/10 border border-border dark:border-slate-700">
              <div class="w-2 h-2 rounded-full bg-muted"></div>
              <span class="text-xs font-bold text-muted">منتظر ورود</span>
            </div>
          }
        </div>

        <!-- Digital Clock -->
        <div class="relative">
          <h1 class="text-[4rem] md:text-[5.6rem] lg:text-[6.4rem] font-black leading-none tracking-tight tabular-nums text-foreground dark:text-white transition-colors duration-300"
              [class.text-success]="isClockedIn() && !isOvertime()"
              [class.text-warning]="isNearEnd()"
              [class.text-violet-500]="isOvertime()"
              [class.text-primary]="!isClockedIn()">
            {{ currentTime() }}
          </h1>
          <!-- <div class="flex justify-center gap-1.5 mt-2">
            @for (dot of [0,1,2]; track dot) {
              <div class="w-2 h-2 rounded-full transition-all duration-300" [class]="getSecondDotClass(dot)"></div>
            }
          </div> -->
        </div>

        <!-- Date + Shift Info -->
        <div class="text-center space-y-1">
          <p class="text-lg md:text-xl font-bold text-muted">{{ persianDate() }}</p>
          <div class="flex items-center justify-center gap-2 text-sm flex-wrap">
            <span class="text-muted">شیفت: <span class="text-foreground dark:text-slate-200 font-bold">{{ toFa(shiftLabel()) }}</span></span>
            @if (isClockedIn()) {
              <span class="text-muted">|</span>
              <span class="text-muted">مدت: <span class="text-success font-bold">{{ elapsedDisplay() }}</span></span>
              <span class="text-muted">|</span>
              <span class="text-muted">مانده: <span class="font-bold" [class.text-warning]="isNearEnd()" [class.text-foreground]="!isNearEnd()">{{ remainingDisplay() }}</span></span>
            }
          </div>
        </div>

        <!-- Warning Banner -->
        @if (warningMessage()) {
          <div class="px-4 py-2 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-2 max-w-md">
            <ui-icon name="alert-triangle" [size]="16" class="text-warning"></ui-icon>
            <span class="text-sm font-bold text-warning">{{ warningMessage() }}</span>
          </div>
        }

        <!-- Last Action Line -->
        @if (lastActionDisplay()) {
          <p class="text-xs text-muted">{{ toFa(lastActionDisplay()) }}</p>
        }

        <!-- Main Action Button -->
        <div class="my-[5px] pb-2">
          <button
            (click)="handleClockAction()"
            [disabled]="isProcessing()"
            class="group relative w-56 h-[5rem] md:w-64 md:h-[5.6rem] rounded-[3rem] border-4 transition-all duration-500 ease-out active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
            [class]="getMainButtonClass()">
            @if (!isClockedIn() && !todayRecord()?.checkOutTime && !isProcessing()) {
              <div class="absolute inset-0 rounded-[3rem] border-2 border-success/30 animate-ping-slow"></div>
              <div class="absolute -inset-3 rounded-[3rem] border border-success/10 animate-ping-slower"></div>
            }
            <div class="flex flex-row items-center justify-center gap-3 relative z-10">
              <ui-icon [name]="getActionButtonIcon()" [size]="28" class="transition-transform group-active:scale-90"></ui-icon>
              <div class="flex flex-col items-start">
                <span class="text-lg font-black">{{ getActionButtonLabel() }}</span>
                @if (isClockedIn()) {
                  <span class="text-[10px] opacity-70 font-bold">{{ elapsedDisplay() }}</span>
                }
              </div>
            </div>
          </button>
        </div>

        <!-- Function Keys Grid -->
        <div class="grid grid-cols-3 gap-2 w-full max-w-md">
          <button (click)="onFunctionClick('break')"
                  class="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all active:scale-95"
                  [class]="isOnBreak() ? 'bg-violet-500/10 border-violet-500/30 text-violet-500' : 'bg-surface dark:bg-slate-900 border-border dark:border-slate-700 text-muted hover:bg-slate-50 dark:hover:bg-slate-800'">
            <ui-icon name="armchair" [size]="20"></ui-icon>
            <span class="text-xs font-bold">{{ isOnBreak() ? 'پایان استراحت' : 'استراحت' }}</span>
          </button>
          <button (click)="onFunctionClick('leave')"
                  class="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border bg-surface dark:bg-slate-900 border-border dark:border-slate-700 text-muted hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all">
            <ui-icon name="calendar" [size]="20"></ui-icon>
            <span class="text-xs font-bold">مرخصی</span>
          </button>
          <button (click)="onFunctionClick('mission')"
                  class="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border bg-surface dark:bg-slate-900 border-border dark:border-slate-700 text-muted hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all">
            <ui-icon name="briefcase" [size]="20"></ui-icon>
            <span class="text-xs font-bold">مأموریت</span>
          </button>
          <button (click)="onFunctionClick('overtime')"
                  class="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border bg-surface dark:bg-slate-900 border-border dark:border-slate-700 text-muted hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all">
            <ui-icon name="clock" [size]="20"></ui-icon>
            <span class="text-xs font-bold">اضافه‌کاری</span>
          </button>
          <button (click)="openQuickNote()"
                  class="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border bg-surface dark:bg-slate-900 border-border dark:border-slate-700 text-muted hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all">
            <ui-icon name="edit" [size]="20"></ui-icon>
            <span class="text-xs font-bold">یادداشت</span>
          </button>
          <button (click)="openReportModal()"
                  class="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border bg-surface dark:bg-slate-900 border-border dark:border-slate-700 text-muted hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all">
            <ui-icon name="bar-chart-2" [size]="20"></ui-icon>
            <span class="text-xs font-bold">گزارش</span>
          </button>
        </div>

        <!-- Weekly Strip -->
        <div class="flex items-center justify-between w-full max-w-md px-1 mt-2">
          @for (day of last7Days(); track day.date) {
            <div class="flex flex-col items-center gap-1">
              <span class="text-[10px] text-muted font-bold">{{ day.label }}</span>
              <div class="w-2 h-2 rounded-full" [class]="getDayDotClass(day.status)"></div>
            </div>
          }
        </div>
      </div>

      <app-clock-verify-modal #verifyModal (verified)="onVerified($event)" (closed)="onModalClosed()"></app-clock-verify-modal>
    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    @keyframes ping-slow { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.4); opacity: 0; } }
    @keyframes ping-slower { 0% { transform: scale(1); opacity: 0.3; } 100% { transform: scale(1.6); opacity: 0; } }
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
    .animate-scale-in { animation: scale-in 0.3s ease-out; }
    .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
    .animate-ping-slower { animation: ping-slower 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
    .tabular-nums { font-variant-numeric: tabular-nums; }

    @media print {
      body * { visibility: hidden !important; }
      #attendance-report-content, #attendance-report-content * { visibility: visible !important; }
      #attendance-report-content {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-height: none !important;
        overflow: visible !important;
        padding: 20px !important;
        background: white !important;
        color: black !important;
      }
    }
  `]
})
export class AttendanceComponent implements OnInit, OnDestroy {
  attService = inject(AttendanceService);
  private exportService = inject(ExportService);
  @ViewChild('verifyModal') verifyModal!: ClockVerifyModalComponent;

  currentTime = signal('');
  currentSeconds = signal(0);
  persianDate = signal('');
  isProcessing = signal(false);

  feedbackVisible = signal(false);
  feedbackText = signal('');
  feedbackType = signal<'success' | 'error'>('success');
  private feedbackTimer: any;

  confirmDialog = signal(false);
  confirmTitle = signal('');
  confirmMessage = signal('');
  private pendingAction: string | null = null;

  noteModalOpen = signal(false);
  quickNoteText = '';

  reportModalOpen = signal(false);

  welcomeMsg = this.attService.welcomeMessage;
  streak = this.attService.currentStreak;
  weekComp = this.attService.weeklyComparison;
  monthSummary = this.attService.currentMonthSummary;

  todayRecord = this.attService.todayRecord;
  rules = this.attService.rules;
  isOnBreak = computed(() => this.attService.isOnBreak());

  currentMonthRecords = computed(() => this.attService.getCurrentMonthRecords());

  private clockTimer: any;
  private elapsedTimer: any;
  private audioCtx: AudioContext | null = null;

  isClockedIn = computed(() => { const r = this.todayRecord(); return !!r?.checkInTime && !r?.checkOutTime; });

  elapsedDisplay = computed(() => {
    const r = this.todayRecord();
    if (!r?.checkInTime) return '00:00';
    if (r.checkOutTime) return this.fmtDur(r.workHours * 60);
    const [h, m] = r.checkInTime.split(':').map(Number);
    const n = new Date();
    return this.fmtDur(Math.max(0, (n.getHours() * 60 + n.getMinutes()) - (h * 60 + m)));
  });

  remainingDisplay = computed(() => {
    const r = this.todayRecord();
    const rl = this.rules();
    if (!r?.checkInTime) return this.shiftRange();
    const [eh, em] = rl.workEndTime.split(':').map(Number);
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return this.fmtDur(Math.max(0, (eh * 60 + em) - nowMin));
  });

  shiftLabel = computed(() => { const r = this.rules(); return `${r.workStartTime} - ${r.workEndTime}`; });
  shiftRange = computed(() => { const r = this.rules(); const [sh, sm] = r.workStartTime.split(':').map(Number); const [eh, em] = r.workEndTime.split(':').map(Number); const t = (eh * 60 + em) - (sh * 60 + sm); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; });

  shiftProgress = computed((): number => {
    const rec = this.todayRecord(); const r = this.rules();
    const [sh, sm] = r.workStartTime.split(':').map(Number);
    const [eh, em] = r.workEndTime.split(':').map(Number);
    const total = (eh * 60 + em) - (sh * 60 + sm);
    if (!rec?.checkInTime) return 0;
    let el = rec.checkOutTime ? rec.workHours * 60 : ((new Date().getHours() * 60 + new Date().getMinutes()) - (rec.checkInTime.split(':').map(Number)[0] * 60 + rec.checkInTime.split(':').map(Number)[1]));
    return Math.min(100, Math.max(0, Math.round((el / total) * 100)));
  });

  isNearEnd = computed(() => this.isClockedIn() && this.shiftProgress() >= 85 && this.shiftProgress() < 100);
  isOvertime = computed(() => this.isClockedIn() && this.shiftProgress() >= 100);

  warningMessage = computed(() => {
    const r = this.todayRecord();
    if (!r) return '';
    if (r.lateMinutes > 0 && !r.checkOutTime) return `${r.lateMinutes} دقیقه تأخیر`;
    if (this.isOvertime()) return 'اضافه‌کاری فعال';
    if (this.isNearEnd()) return 'کمتر از ۳۰ دقیقه تا پایان شیفت';
    return '';
  });

  lastActionDisplay = computed(() => {
    const a = this.attService.lastAction();
    return a ? `${a.time} | ${a.label}` : '';
  });

  todayCheckIn = computed(() => this.todayRecord()?.checkInTime || null);
  todayCheckOut = computed(() => this.todayRecord()?.checkOutTime || null);
  leaveBalance = computed(() => 12);

  last7Days = computed(() => {
    const days: { date: string; label: string; labelShort: string; dayNum: string; status: string }[] = [];
    const full = ['جمعه', 'پنجشنبه', 'چهارشنبه', 'سه‌شنبه', 'دوشنبه', 'یکشنبه', 'شنبه'];
    const short = ['ج', 'پ', 'چ', 'س', 'د', 'ی', 'ش'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = this.fmtJalali(d);
      const rec = this.attService.records().find(r => r.date === ds);
      days.push({ date: ds, label: full[d.getDay()], labelShort: short[d.getDay()], dayNum: this.toFa(d.toLocaleDateString('fa-IR', { day: 'numeric' })), status: rec?.status || (rec?.isWorkingDay ? 'absent' : 'holiday') });
    }
    return days;
  });

  constructor() {
    effect(() => { const a = this.attService.lastAction(); if (a) { } });
  }

  ngOnInit(): void {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.elapsedTimer = setInterval(() => this.currentSeconds.set(new Date().getSeconds()), 1000);
    this.requestNotificationPermission();
  }

  ngOnDestroy(): void {
    clearInterval(this.clockTimer);
    clearInterval(this.elapsedTimer);
    clearTimeout(this.feedbackTimer);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.reportModalOpen()) { this.closeReportModal(); return; }
    if (this.noteModalOpen()) { this.noteModalOpen.set(false); return; }
    if (this.confirmDialog()) { this.cancelConfirm(); return; }
  }

  openReportModal(): void { this.reportModalOpen.set(true); }
  closeReportModal(): void { this.reportModalOpen.set(false); }

  printReport(): void {
    window.print();
  }

  openQuickNote(): void {
    this.quickNoteText = '';
    this.noteModalOpen.set(true);
  }

  submitQuickNote(): void {
    const text = this.quickNoteText.trim();
    if (!text) { this.noteModalOpen.set(false); return; }
    const result = this.attService.addQuickNote(text);
    this.playBeep(result.success ? 'success' : 'error');
    this.showFeedback(result.message, result.success ? 'success' : 'error');
    this.noteModalOpen.set(false);
  }

  private requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    this.scheduleShiftReminder();
  }

  private scheduleShiftReminder(): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const r = this.rules();
    const [sh, sm] = r.workStartTime.split(':').map(Number);
    const now = new Date();
    const shiftStart = new Date(now);
    shiftStart.setHours(sh, sm, 0, 0);
    const reminderTime = new Date(shiftStart.getTime() - 30 * 60 * 1000);
    const delay = reminderTime.getTime() - now.getTime();
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        new Notification('⏰ یادآوری شیفت', { body: `شیفت شما ۳۰ دقیقه دیگر شروع می‌شود (${r.workStartTime})` });
      }, delay);
    }
  }

  private playBeep(type: 'success' | 'error'): void {
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      const o = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();
      o.connect(g); g.connect(this.audioCtx.destination);
      if (type === 'success') {
        o.frequency.setValueAtTime(880, this.audioCtx.currentTime);
        o.frequency.setValueAtTime(1100, this.audioCtx.currentTime + 0.1);
        g.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
        o.start(); o.stop(this.audioCtx.currentTime + 0.3);
      } else {
        o.frequency.setValueAtTime(300, this.audioCtx.currentTime);
        o.frequency.setValueAtTime(200, this.audioCtx.currentTime + 0.15);
        g.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);
        o.start(); o.stop(this.audioCtx.currentTime + 0.4);
      }
    } catch { }
  }

  private showFeedback(msg: string, type: 'success' | 'error'): void {
    clearTimeout(this.feedbackTimer);
    this.feedbackText.set(msg);
    this.feedbackType.set(type);
    this.feedbackVisible.set(true);
    this.feedbackTimer = setTimeout(() => this.feedbackVisible.set(false), 2500);
  }

  onFunctionClick(action: string): void {
    if (action === 'break') {
      const r = this.attService.toggleBreak();
      this.playBeep(r.success ? 'success' : 'error');
      this.showFeedback(r.message, r.success ? 'success' : 'error');
      try { navigator.vibrate?.(r.success ? 100 : 400); } catch { }
      return;
    }
    if (action === 'overtime') {
      const r = this.attService.startOvertime();
      this.playBeep(r.success ? 'success' : 'error');
      this.showFeedback(r.message, r.success ? 'success' : 'error');
      try { navigator.vibrate?.(r.success ? 100 : 400); } catch { }
      return;
    }
    if (action === 'forgot') {
      const r = this.attService.markForgot();
      this.playBeep(r.success ? 'success' : 'error');
      this.showFeedback(r.message, r.success ? 'success' : 'error');
      try { navigator.vibrate?.(r.success ? 100 : 400); } catch { }
      return;
    }
    if (action === 'leave') {
      this.pendingAction = 'leave';
      this.confirmTitle.set('اعلام مرخصی');
      this.confirmMessage.set('آیا مطمئن هستید که امروز مرخصی هستید؟ این عملیات قابل بازگشت نیست.');
      this.confirmDialog.set(true);
      return;
    }
    if (action === 'mission') {
      this.pendingAction = 'mission';
      this.confirmTitle.set('اعلام مأموریت');
      this.confirmMessage.set('آیا مطمئن هستید که امروز مأموریت اداری دارید؟ این عملیات قابل بازگشت نیست.');
      this.confirmDialog.set(true);
      return;
    }
  }

  executeConfirm(): void {
    this.confirmDialog.set(false);
    if (!this.pendingAction) return;
    let r: { success: boolean; message: string };
    if (this.pendingAction === 'leave') r = this.attService.markLeave();
    else if (this.pendingAction === 'mission') r = this.attService.markMission();
    else return;
    this.playBeep(r.success ? 'success' : 'error');
    this.showFeedback(r.message, r.success ? 'success' : 'error');
    try { navigator.vibrate?.(r.success ? [100, 50, 100] : 400); } catch { }
    this.pendingAction = null;
  }

  cancelConfirm(): void { this.confirmDialog.set(false); this.pendingAction = null; }

  handleClockAction(): void {
    if (this.isProcessing()) return;
    const r = this.todayRecord();
    if (!r?.checkInTime) this.verifyModal.open('in');
    else if (!r.checkOutTime) this.verifyModal.open('out');
    else { this.playBeep('error'); this.showFeedback('امروز تکمیل شده', 'error'); }
  }

  onVerified(data: { method: CheckInMethod; location?: string; selfie?: string }): void {
    this.isProcessing.set(true);
    const r = this.todayRecord();
    let res: { success: boolean; message: string };
    if (!r?.checkInTime) res = this.attService.checkInVerified(data.method, data.location, data.selfie);
    else res = this.attService.checkOutVerified(data.method, data.location, data.selfie);
    setTimeout(() => {
      this.isProcessing.set(false);
      this.playBeep(res.success ? 'success' : 'error');
      this.showFeedback(res.message, res.success ? 'success' : 'error');
      try { navigator.vibrate?.(res.success ? [100, 50, 100] : 400); } catch { }
    }, 400);
  }

  onModalClosed(): void { }

  resetToday(): void {
    const t = this.fmtJalali(new Date());
    this.attService.records.update(r => r.filter(x => x.date !== t));
    this.showFeedback('رکورد امروز ریست شد', 'success');
  }

  /**
   * فرمت تاریخ: پنجشنبه، ۲۹ مرداد ۱۴۰۵
   * تایمر: اعداد انگلیسی
   */
  private updateClock(): void {
    const n = new Date();

    // ساعت به اعداد انگلیسی
    const timeStr = n.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    this.currentTime.set(timeStr);
    this.currentSeconds.set(n.getSeconds());

    // تاریخ شمسی با فرمت: پنجشنبه، ۲۹ مرداد ۱۴۰۵
    const parts = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).formatToParts(n);

    let weekday = '';
    let day = '';
    let month = '';
    let year = '';

    for (const part of parts) {
      if (part.type === 'weekday') weekday = part.value;
      if (part.type === 'day') day = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'year') year = part.value;
    }

    this.persianDate.set(`${weekday}، ${this.toFa(day)} ${month} ${this.toFa(year)}`);
  }

  private fmtDur(m: number): string { return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`; }
  private fmtJalali(d: Date): string { const p = d.toLocaleDateString('fa-IR').split('/'); return `${this.toEn(p[0])}/${this.toEn(p[1]).padStart(2, '0')}/${this.toEn(p[2]).padStart(2, '0')}`; }
  private toEn(s: string): string { return s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()); }

  toFa(num: number | string): string {
    return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  }

  getMainButtonClass(): string {
    if (this.isProcessing()) return 'border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 cursor-wait';
    const r = this.todayRecord();
    if (!r?.checkInTime) return 'border-success bg-success/10 text-success hover:bg-success hover:text-white dark:border-success/50 dark:bg-success/20 dark:hover:bg-success shadow-success/30';
    if (!r.checkOutTime) return 'border-danger bg-danger/10 text-danger hover:bg-danger hover:text-white dark:border-danger/50 dark:bg-danger/20 dark:hover:bg-danger shadow-danger/30';
    return 'border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500';
  }

  getActionButtonIcon(): string { if (this.isProcessing()) return 'loader'; const r = this.todayRecord(); if (!r?.checkInTime) return 'login'; if (!r.checkOutTime) return 'logout'; return 'check-circle'; }
  getActionButtonLabel(): string { if (this.isProcessing()) return 'در حال ثبت...'; const r = this.todayRecord(); if (!r?.checkInTime) return 'ثبت ورود'; if (!r.checkOutTime) return 'ثبت خروج'; return 'تکمیل شده'; }
  getSecondDotClass(i: number): string { return i === this.currentSeconds() % 3 ? 'bg-primary scale-125' : 'bg-slate-200 dark:bg-slate-700 scale-100'; }
  getProgressBarClass(): string { if (this.isOvertime()) return 'bg-violet-500'; if (this.isNearEnd()) return 'bg-warning'; return 'bg-success'; }
  getStatusBadgeClass(): string { const r = this.todayRecord(); if (!r) return 'bg-muted/10 text-muted'; const m: Record<string, string> = { present: 'bg-success/10 text-success', late: 'bg-warning/10 text-warning', 'early-leave': 'bg-warning/10 text-warning', absent: 'bg-danger/10 text-danger', holiday: 'bg-muted/10 text-muted', leave: 'bg-info/10 text-info', mission: 'bg-primary/10 text-primary', remote: 'bg-info/10 text-info', overtime: 'bg-violet-500/10 text-violet-500' }; return m[r.status] || 'bg-muted/10 text-muted'; }
  getStatusLabel(): string { const r = this.todayRecord(); return r ? this.attService.getStatusLabel(r.status) : 'ثبت نشده'; }
  getDayDotClass(s: string): string { const m: Record<string, string> = { present: 'bg-success', late: 'bg-warning', 'early-leave': 'bg-warning', absent: 'bg-danger', holiday: 'bg-muted', leave: 'bg-info', mission: 'bg-primary', remote: 'bg-info' }; return m[s] || 'bg-muted'; }
}
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { TrainingService, Course, Enrollment, ExamQuestion, CourseCategory, CourseLevel, CourseFormat, CertificateType, CourseModule, Exam, LearningPath, Certificate } from '../../core/training/training.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { EscToCloseDirective } from '../../shared/directives/esc-to-close.directive';
import { ExportService } from '../../core/export/export.service';
import { IranLocalizationService } from '../../core/localization/iran-localization.service';
import { CertificatePdfService } from '../../core/training/certificate-pdf.service';

type TabKey = 'courses' | 'enrollments' | 'certificates' | 'paths' | 'admin';

@Component({
    selector: 'app-training',
    standalone: true,
    imports: [CommonModule, FormsModule, IconComponent, EscToCloseDirective],
    template: `
        <div class="max-w-[95%] mx-auto space-y-6 animate-fade-in-up">

            <!-- Header (Matches Payslip Structure) -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <ui-icon name="book-open" [size]="36" class="text-amber-500"></ui-icon>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-primary mb-1">آموزش و توسعه</h1>
                        <p class="text-lg text-muted">آموزش، آزمون‌ و گواهینامه</p>
                    </div>
                </div>
                <button (click)="exportData()" class="px-4 py-2.5 bg-success text-white rounded-xl hover:bg-success/90 transition-colors font-bold text-sm flex items-center gap-2 shadow-sm">
                    <ui-icon name="download" [size]="18"></ui-icon> خروجی
                </button>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                @for (stat of statCards; track stat.label) {
                    <div class="bg-surface dark:bg-slate-800 rounded-xl p-3 border border-border dark:border-slate-700 text-center">
                        <ui-icon [name]="stat.icon" [size]="20" [class]="stat.color + ' mx-auto mb-1'"></ui-icon>
                        <p class="text-xl font-bold text-foreground dark:text-slate-100">{{ toFa(stat.value) }}</p>
                        <p class="text-[10px] text-muted">{{ stat.label }}</p>
                    </div>
                }
            </div>

            <!-- Tabs -->
            <div class="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <div class="flex flex-nowrap gap-2 pb-2 min-w-max">
                    @for (tab of tabs; track tab.key) {
                        <button (click)="activeTab.set(tab.key)"
                            class="px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0"
                            [class]="activeTab() === tab.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface dark:bg-slate-800 text-muted hover:bg-slate-50 dark:hover:bg-slate-700 border border-border dark:border-slate-700'">
                            <ui-icon [name]="tab.icon" [size]="16"></ui-icon> {{ tab.label }}
                        </button>
                    }
                </div>
            </div>

            <!-- ═══ COURSES ═══ -->
            @if (activeTab() === 'courses') {
                <div class="space-y-4">
                    <div class="bg-surface dark:bg-slate-800 rounded-xl p-3 border border-border dark:border-slate-700">
                        <div class="flex flex-col md:flex-row gap-2">
                            <div class="flex-1 relative">
                                <ui-icon name="search" [size]="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
                                <input type="text" [(ngModel)]="courseSearch" placeholder="جستجو..." class="w-full pr-9 pl-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                            </div>
                            <select [(ngModel)]="courseCategoryFilter" class="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                <option value="all">همه دسته‌ها</option>
                                <option value="technical">فنی</option>
                                <option value="soft-skills">مهارت نرم</option>
                                <option value="management">مدیریتی</option>
                                <option value="compliance">انطباق</option>
                                <option value="language">زبان</option>
                            </select>
                        </div>
                    </div>
                    @if (filteredAvailableCourses().length === 0) {
                        <div class="bg-surface dark:bg-slate-800 rounded-xl p-10 border border-dashed border-border dark:border-slate-700 text-center">
                            <ui-icon name="book-open" [size]="48" class="mx-auto mb-3 text-muted opacity-40"></ui-icon>
                            <p class="text-sm text-muted">دوره‌ای یافت نشد</p>
                        </div>
                    }
                    @for (course of filteredAvailableCourses(); track course.id) {
                        <div class="bg-surface dark:bg-slate-800 rounded-xl p-5 border border-border dark:border-slate-700 hover:shadow-md transition-all">
                            <div class="flex items-start justify-between gap-4 mb-3">
                                <div class="flex-1 min-w-0">
                                    <div class="flex flex-wrap items-center gap-2 mb-2">
                                        <span class="text-[10px] font-mono text-muted dir-ltr">{{ course.code }}</span>
                                        <h3 class="text-base font-bold text-foreground dark:text-slate-100">{{ course.title }}</h3>
                                        <span [class]="trainingService.getCategoryBadgeClass(course.category)" class="px-2 py-0.5 rounded text-[10px] font-bold">{{ trainingService.getCategoryLabel(course.category) }}</span>
                                        <span [class]="trainingService.getLevelBadgeClass(course.level)" class="px-2 py-0.5 rounded text-[10px] font-bold">{{ trainingService.getLevelLabel(course.level) }}</span>
                                        @if (course.isMandatory) {
                                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">اجباری</span>
                                        }
                                    </div>
                                    <p class="text-xs text-muted mb-2 line-clamp-2">{{ course.description }}</p>
                                    <div class="flex flex-wrap gap-2 text-[10px] text-muted">
                                        <span class="flex items-center gap-1"><ui-icon name="clock" [size]="10"></ui-icon>{{ toFa(course.durationHours) }} ساعت</span>
                                        <span class="flex items-center gap-1"><ui-icon name="award" [size]="10"></ui-icon>{{ toFa(course.creditPoints) }} امتیاز</span>
                                        <span class="flex items-center gap-1"><ui-icon name="user" [size]="10"></ui-icon>{{ course.instructor }}</span>
                                        <span class="flex items-center gap-1"><ui-icon name="users" [size]="10"></ui-icon>{{ toFa(course.currentParticipants) }}/{{ toFa(course.maxParticipants) }}</span>
                                        <span class="flex items-center gap-1"><ui-icon name="list-check" [size]="10"></ui-icon>{{ toFa(course.modules.length) }} سرفصل</span>
                                    </div>
                                </div>
                                <button (click)="registerCourse(course)" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-bold text-xs flex-shrink-0">ثبت‌نام</button>
                            </div>
                            @if (course.exam) {
                                <div class="mt-3 pt-3 border-t border-border dark:border-slate-700 flex items-center gap-2 text-[10px] text-muted">
                                    <ui-icon name="edit" [size]="12" class="text-purple-500"></ui-icon>
                                    <span>آزمون: {{ toFa(course.exam.durationMinutes) }} دقیقه | قبولی: {{ toFa(course.exam.passingScore) }}٪ | {{ toFa(course.exam.maxAttempts) }} تلاش | {{ toFa(course.exam.questions.length) }} سوال</span>
                                </div>
                            }
                        </div>
                    }
                </div>
            }

            <!-- ═══ ENROLLMENTS ═══ -->
            @if (activeTab() === 'enrollments') {
                <div class="space-y-3">
                    @if (myEnrollments().length === 0) {
                        <div class="bg-surface dark:bg-slate-800 rounded-xl p-10 border border-dashed border-border dark:border-slate-700 text-center">
                            <ui-icon name="list-check" [size]="48" class="mx-auto mb-3 text-muted opacity-40"></ui-icon>
                            <p class="text-sm text-muted">هنوز در دوره‌ای ثبت‌نام نکرده‌اید</p>
                        </div>
                    }
                    @for (enrollment of myEnrollments(); track enrollment.id) {
                        <div class="bg-surface dark:bg-slate-800 rounded-xl p-4 border border-border dark:border-slate-700 hover:shadow-md transition-all">
                            <div class="flex items-start justify-between gap-3 mb-3">
                                <div class="flex-1 min-w-0">
                                    <div class="flex flex-wrap items-center gap-2 mb-1">
                                        <span class="text-[10px] font-mono text-muted dir-ltr">{{ enrollment.courseCode }}</span>
                                        <h3 class="text-sm font-bold text-foreground dark:text-slate-100 truncate">{{ enrollment.courseTitle }}</h3>
                                        <span [class]="trainingService.getStatusBadgeClass(enrollment.status)" class="px-2 py-0.5 rounded text-[10px] font-bold">{{ trainingService.getStatusLabel(enrollment.status) }}</span>
                                    </div>
                                    <div class="flex flex-wrap gap-2 text-[10px] text-muted mb-2">
                                        <span>ثبت: <span class="dir-ltr">{{ toFa(enrollment.registeredAt) }}</span></span>
                                        @if (enrollment.finalScore !== null) {
                                            <span>نمره: <span class="font-bold text-foreground dark:text-slate-200">{{ toFa(enrollment.finalScore!) }}٪</span></span>
                                        }
                                        <span>سرفصل: {{ toFa(enrollment.completedModules.length) }}/{{ toFa(getCourseModules(enrollment.courseId).length) }}</span>
                                    </div>
                                    <div>
                                        <div class="flex justify-between text-[10px] mb-0.5">
                                            <span class="text-muted">پیشرفت</span>
                                            <span class="font-bold text-foreground dark:text-slate-200">{{ toFa(enrollment.progress) }}٪</span>
                                        </div>
                                        <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div class="h-full bg-primary rounded-full transition-all duration-500" [style.width.%]="enrollment.progress"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-1.5 flex-shrink-0">
                                    @if (enrollment.status === 'approved') {
                                        <button (click)="startCourse(enrollment.id)" class="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-bold text-xs flex items-center gap-1"><ui-icon name="activity" [size]="14"></ui-icon> شروع</button>
                                    }
                                    @if (enrollment.status === 'in-progress' || enrollment.status === 'exam-pending') {
                                        <button (click)="openModuleModal(enrollment)" class="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-bold text-xs flex items-center gap-1"><ui-icon name="list-check" [size]="14"></ui-icon> سرفصل‌ها</button>
                                    }
                                    @if (canTakeExam(enrollment.id)) {
                                        <button (click)="openExamModal(enrollment)" class="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-bold text-xs flex items-center gap-1"><ui-icon name="edit" [size]="14"></ui-icon> آزمون</button>
                                    }
                                    @if (enrollment.status === 'registered' || enrollment.status === 'approved') {
                                        <button (click)="dropEnrollment(enrollment.id)" class="px-3 py-1.5 border border-border text-muted rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:border-red-800 transition-colors font-bold text-xs flex items-center gap-1 dark:border-slate-700"><ui-icon name="x" [size]="14"></ui-icon> انصراف</button>
                                    }
                                    <button (click)="openDetailModal(enrollment)" class="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors" title="جزئیات"><ui-icon name="eye" [size]="16"></ui-icon></button>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            }

            <!-- ═══ CERTIFICATES ═══ -->
            @if (activeTab() === 'certificates') {
                <div class="space-y-3">
                    @if (certificates().length === 0) {
                        <div class="bg-surface dark:bg-slate-800 rounded-xl p-10 border border-dashed border-border dark:border-slate-700 text-center">
                            <ui-icon name="shield" [size]="48" class="mx-auto mb-3 text-muted opacity-40"></ui-icon>
                            <p class="text-sm text-muted">گواهینامه‌ای نیست</p>
                        </div>
                    }
                    @for (cert of certificates(); track cert.id) {
                        <div class="bg-gradient-to-l from-emerald-50 to-blue-50 dark:from-emerald-900/10 dark:to-blue-900/10 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800/50">
                            <div class="flex items-start justify-between gap-4">
                                <div class="flex items-start gap-4 flex-1 min-w-0">
                                    <div class="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                        <ui-icon name="shield" [size]="24" class="text-emerald-600 dark:text-emerald-400"></ui-icon>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h3 class="text-sm font-bold text-foreground dark:text-slate-100 mb-1">{{ cert.courseTitle }}</h3>
                                        <div class="flex flex-wrap gap-2 text-[10px] text-muted mb-1">
                                            <span>{{ trainingService.getCertTypeLabel(cert.type) }}</span>
                                            <span>نمره: <b class="text-foreground dark:text-slate-200">{{ toFa(cert.score) }}٪</b> ({{ cert.grade }})</span>
                                            <span>صدور: <span class="dir-ltr">{{ toFa(cert.issuedAt) }}</span></span>
                                            @if (cert.expiresAt) {
                                                <span [class]="isExpired(cert.expiresAt) ? 'text-red-500 font-bold' : 'text-amber-500'">انقضا: <span class="dir-ltr">{{ toFa(cert.expiresAt) }}</span></span>
                                            }
                                        </div>
                                        <label class="text-[9px] font-light text-foreground dark:text-slate-100 mb-1">{{ cert.verificationCode }}</label>
                                    </div>
                                </div>
                                <button (click)="downloadCertificate(cert)" class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold text-xs flex items-center gap-2 flex-shrink-0 shadow-sm">
                                    <ui-icon name="download" [size]="16"></ui-icon> دانلود
                                </button>
                            </div>
                        </div>
                    }
                </div>
            }

            <!-- ═══ PATHS ═══ -->
            @if (activeTab() === 'paths') {
                <div class="space-y-4">
                    @if (learningPaths().length === 0) {
                        <div class="bg-surface dark:bg-slate-800 rounded-xl p-10 border border-dashed border-border dark:border-slate-700 text-center">
                            <ui-icon name="map-pin" [size]="48" class="mx-auto mb-3 text-muted opacity-40"></ui-icon>
                            <p class="text-sm text-muted">مسیر یادگیری تعریف نشده</p>
                        </div>
                    }
                    @for (path of learningPaths(); track path.id) {
                        @let progress = getPathProgress(path.id);
                        @let enrolled = isEnrolledInPath(path.id);
                        <div class="bg-surface dark:bg-slate-800 rounded-xl p-5 border border-border dark:border-slate-700 hover:shadow-md transition-all">
                            <div class="flex items-start justify-between gap-4 mb-3">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <h3 class="text-base font-bold text-foreground dark:text-slate-100">{{ path.title }}</h3>
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                                              [class]="progress.completedCourses >= progress.totalCourses && progress.totalCourses > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : enrolled ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'">
                                            {{ progress.completedCourses >= progress.totalCourses && progress.totalCourses > 0 ? 'تکمیل شده ✓' : enrolled ? 'فعال' : 'ثبت‌نام نشده' }}
                                        </span>
                                    </div>
                                    <p class="text-xs text-muted mb-1">{{ path.description }}</p>
                                    <p class="text-[10px] text-muted mb-3">🎯 هدف: <span class="font-bold text-foreground dark:text-slate-200">{{ path.targetRole }}</span> | اعتبار لازم: {{ toFa(path.requiredCredits) }} امتیاز</p>
                                    <div class="mb-3">
                                        <div class="flex justify-between text-[10px] mb-0.5">
                                            <span class="text-muted">پیشرفت مسیر</span>
                                            <span class="font-bold text-foreground dark:text-slate-200">{{ toFa(progress.earnedCredits) }} / {{ toFa(path.requiredCredits) }} امتیاز ({{ toFa(progress.completedCourses) }}/{{ toFa(progress.totalCourses) }} دوره)</span>
                                        </div>
                                        <div class="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500" [style.width.%]="path.requiredCredits > 0 ? Math.min(100, (progress.earnedCredits / path.requiredCredits) * 100) : 0"></div>
                                        </div>
                                    </div>
                                    <div class="space-y-1.5">
                                        @for (cid of path.courseIds; track cid) {
                                            @if (getCourseById(cid); as c) {
                                                @let cStatus = getCourseStatusInPath(cid, progress);
                                                <div class="flex items-center gap-2 p-2 rounded-lg text-xs"
                                                     [class]="cStatus === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30' : cStatus === 'in-progress' ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30' : 'bg-slate-50 dark:bg-slate-900/50 border border-border dark:border-slate-700'">
                                                    @if (cStatus === 'completed') {
                                                        <ui-icon name="check-circle" [size]="16" class="text-emerald-500 flex-shrink-0"></ui-icon>
                                                    } @else if (cStatus === 'in-progress') {
                                                        <ui-icon name="activity" [size]="16" class="text-blue-500 flex-shrink-0"></ui-icon>
                                                    } @else {
                                                        <ui-icon name="book-open" [size]="16" class="text-muted flex-shrink-0"></ui-icon>
                                                    }
                                                    <span class="flex-1 truncate font-medium" [class]="cStatus === 'completed' ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground dark:text-slate-200'">{{ c.title }}</span>
                                                    <span class="text-[10px] text-muted flex-shrink-0">{{ toFa(c.creditPoints) }} امتیاز</span>
                                                    @if (cStatus === 'not-enrolled' && enrolled) {
                                                        <button (click)="registerCourse(c)" class="px-2 py-1 bg-primary text-white rounded text-[10px] font-bold hover:bg-primary-hover flex-shrink-0">ثبت‌نام</button>
                                                    }
                                                    @if (cStatus === 'completed') {
                                                        <span class="text-[10px] font-bold text-emerald-500 flex-shrink-0">تکمیل ✓</span>
                                                    }
                                                </div>
                                            }
                                        }
                                    </div>
                                </div>
                                <div class="flex flex-col gap-2 flex-shrink-0">
                                    @if (!enrolled) {
                                        <button (click)="registerPath(path.id)" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-bold text-xs">ثبت‌نام در مسیر</button>
                                    } @else {
                                        <button (click)="unregisterPath(path.id)" class="px-4 py-2 border border-border text-muted rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:border-red-800 transition-colors font-bold text-xs dark:border-slate-700">انصراف</button>
                                    }
                                </div>
                            </div>
                        </div>
                    }
                </div>
            }

            <!-- ═══ ADMIN ═══ -->
            @if (activeTab() === 'admin') {
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-bold text-foreground dark:text-slate-100">مدیریت دوره‌ها</h2>
                        <button (click)="openCourseFormModal()" class="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover flex items-center gap-2">
                            <ui-icon name="plus" [size]="16"></ui-icon> دوره جدید
                        </button>
                    </div>
                    @for (course of allCourses(); track course.id) {
                        <div class="bg-surface dark:bg-slate-800 rounded-xl p-4 border border-border dark:border-slate-700">
                            <div class="flex items-start justify-between gap-3">
                                <div class="flex-1 min-w-0">
                                    <div class="flex flex-wrap items-center gap-2 mb-1">
                                        <span class="text-[10px] font-mono text-muted dir-ltr">{{ course.code }}</span>
                                        <h3 class="text-sm font-bold text-foreground dark:text-slate-100 truncate">{{ course.title }}</h3>
                                        <span [class]="trainingService.getCategoryBadgeClass(course.category)" class="px-2 py-0.5 rounded text-[10px] font-bold">{{ trainingService.getCategoryLabel(course.category) }}</span>
                                    </div>
                                    <div class="flex flex-wrap gap-2 text-[10px] text-muted">
                                        <span>{{ toFa(course.durationHours) }} ساعت</span>
                                        <span>{{ toFa(course.modules.length) }} سرفصل</span>
                                        <span>{{ course.exam ? toFa(course.exam.questions.length) + ' سوال' : 'بدون آزمون' }}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-1 flex-shrink-0">
                                    <button (click)="openCourseFormModal(course)" class="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors" title="ویرایش"><ui-icon name="edit" [size]="14"></ui-icon></button>
                                    <button (click)="confirmDeleteCourse(course)" class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted hover:text-red-500 transition-colors" title="حذف"><ui-icon name="trash-2" [size]="14"></ui-icon></button>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            }

            <!-- ═══ MODULE MODAL ═══ -->
            @if (moduleEnrollment()) {
                <div appEscToClose (escPressed)="closeModuleModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeModuleModal()">
                    <div class="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-border dark:border-slate-700 animate-scale-in max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
                        <div class="p-5 border-b border-border dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                            <div class="min-w-0 flex-1 ml-3">
                                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">سرفصل‌ها</h2>
                                <p class="text-xs text-muted truncate">{{ moduleEnrollment()!.courseTitle }}</p>
                            </div>
                            <button (click)="closeModuleModal()" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><ui-icon name="x" [size]="18" class="text-muted"></ui-icon></button>
                        </div>
                        <div class="flex-1 overflow-y-auto p-5 space-y-2">
                            @for (mod of getCourseModules(moduleEnrollment()!.courseId); track mod.id) {
                                <div class="flex items-center gap-3 p-3 rounded-lg border border-border dark:border-slate-700">
                                    <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                         [class]="moduleEnrollment()!.completedModules.includes(mod.id) ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-muted'">
                                        @if (moduleEnrollment()!.completedModules.includes(mod.id)) {
                                            <ui-icon name="check" [size]="14"></ui-icon>
                                        } @else {
                                            {{ toFa(mod.order) }}
                                        }
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-foreground dark:text-slate-200 truncate">{{ mod.title }}</p>
                                        <p class="text-[10px] text-muted">{{ toFa(Math.floor(mod.durationMinutes / 60)) }}س {{ toFa(mod.durationMinutes % 60) }}د</p>
                                    </div>
                                    @if (!moduleEnrollment()!.completedModules.includes(mod.id) && (moduleEnrollment()!.status === 'in-progress' || moduleEnrollment()!.status === 'approved')) {
                                        <button (click)="completeModule(moduleEnrollment()!.id, mod.id, mod.durationMinutes)" class="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover flex-shrink-0">تکمیل</button>
                                    }
                                    @if (moduleEnrollment()!.completedModules.includes(mod.id)) {
                                        <span class="text-[10px] font-bold text-emerald-500">✓</span>
                                    }
                                </div>
                            }
                        </div>
                        <div class="p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
                            <button (click)="closeModuleModal()" class="w-full py-2.5 border border-border text-foreground rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm dark:border-slate-700 dark:text-slate-200">بستن</button>
                        </div>
                    </div>
                </div>
            }

            <!-- ═══ EXAM MODAL ═══ -->
            @if (examEnrollment()) {
                <div class="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div class="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-border dark:border-slate-700 animate-scale-in max-h-[90vh] flex flex-col">
                        <div class="p-5 border-b border-border dark:border-slate-700 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                            <div>
                                <h2 class="text-lg font-bold text-foreground dark:text-slate-100 flex items-center gap-2">
                                    <ui-icon name="edit" [size]="20" class="text-purple-500"></ui-icon>
                                    {{ getExamForEnrollment(examEnrollment()!.id)?.title || 'آزمون' }}
                                </h2>
                                <p class="text-xs text-muted mt-0.5">{{ examEnrollment()!.courseTitle }}</p>
                            </div>
                            <div class="text-left">
                                <div class="flex items-center gap-1 text-sm font-bold text-purple-600 dark:text-purple-400">
                                    <ui-icon name="clock" [size]="16"></ui-icon>
                                    <span class="dir-ltr">{{ formatTimer(examTimeLeft()) }}</span>
                                </div>
                                <p class="text-[10px] text-muted">زمان باقیمانده</p>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-5 space-y-5">
                            @if (!examSubmitted()) {
                                @for (question of getExamQuestions(examEnrollment()!.id); track question.id; let qi = $index) {
                                    <div class="p-4 rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                        <div class="flex items-start gap-2 mb-3">
                                            <span class="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{{ toFa(qi + 1) }}</span>
                                            <div class="flex-1">
                                                <p class="text-sm font-bold text-foreground dark:text-slate-100">{{ question.text }}</p>
                                                <p class="text-[10px] text-muted mt-0.5">{{ toFa(question.points) }} امتیاز</p>
                                            </div>
                                        </div>
                                        @if (question.type === 'single-choice' || question.type === 'true-false') {
                                            <div class="space-y-1.5 mr-8">
                                                @for (option of question.options; track option) {
                                                    <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-border hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors dark:border-slate-600"
                                                           [class]="examAnswers[question.id] === option ? 'border-primary bg-primary/5 dark:bg-primary/10' : ''">
                                                        <input type="radio" [name]="question.id" [value]="option" [(ngModel)]="examAnswers[question.id]" class="w-3.5 h-3.5 text-primary focus:ring-primary/20">
                                                        <span class="text-sm text-foreground dark:text-slate-200">{{ option }}</span>
                                                    </label>
                                                }
                                            </div>
                                        }
                                        @if (question.type === 'multi-choice') {
                                            <div class="space-y-1.5 mr-8">
                                                @for (option of question.options; track option) {
                                                    <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-border hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors dark:border-slate-600">
                                                        <input type="checkbox" [value]="option" [checked]="isMultiChoiceSelected(question.id, option)" (change)="toggleMultiChoice(question.id, option)" class="w-3.5 h-3.5 rounded text-primary focus:ring-primary/20">
                                                        <span class="text-sm text-foreground dark:text-slate-200">{{ option }}</span>
                                                    </label>
                                                }
                                            </div>
                                        }
                                        @if (question.type === 'descriptive') {
                                            <div class="mr-8">
                                                <textarea [(ngModel)]="examAnswers[question.id]" rows="3" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" placeholder="پاسخ تشریحی..."></textarea>
                                            </div>
                                        }
                                    </div>
                                }
                            } @else {
                                <div class="text-center py-6">
                                    <div class="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                                         [class]="examResult()?.passed ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'">
                                        <ui-icon [name]="examResult()?.passed ? 'check-circle' : 'alert-triangle'" [size]="40"
                                                 [class]="examResult()?.passed ? 'text-emerald-500' : 'text-red-500'"></ui-icon>
                                    </div>
                                    <h3 class="text-2xl font-bold mb-2"
                                        [class]="examResult()?.passed ? 'text-emerald-500' : 'text-red-500'">
                                        {{ examResult()?.passed ? 'تبریک! قبول شدید 🎉' : 'مردود شدید' }}
                                    </h3>
                                    <div class="flex items-center justify-center gap-4 mb-4">
                                        <div class="text-center">
                                            <p class="text-3xl font-bold text-foreground dark:text-slate-100">{{ toFa(examResult()?.score || 0) }}٪</p>
                                            <p class="text-xs text-muted">نمره شما</p>
                                        </div>
                                        <div class="w-px h-12 bg-border dark:bg-slate-700"></div>
                                        <div class="text-center">
                                            <p class="text-3xl font-bold text-muted">{{ toFa(getExamPassingScore(examEnrollment()!.id)) }}٪</p>
                                            <p class="text-xs text-muted">نمره قبولی</p>
                                        </div>
                                    </div>
                                    @if (examResult()?.passed) {
                                        <p class="text-sm text-emerald-600 dark:text-emerald-400 font-bold">گواهینامه خودکار صادر شد ✓</p>
                                    } @else {
                                        <p class="text-sm text-muted">تلاش باقیمانده: {{ toFa(getRemainingAttempts(examEnrollment()!.id)) }}</p>
                                    }
                                </div>
                            }
                        </div>
                        <div class="p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
                            @if (!examSubmitted()) {
                                <div class="flex gap-3">
                                    <button (click)="closeExamModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm dark:border-slate-700 dark:text-slate-200">انصراف</button>
                                    <button (click)="submitExam()" class="flex-1 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold text-sm flex items-center justify-center gap-2">
                                        <ui-icon name="send" [size]="16"></ui-icon> ثبت پاسخ‌ها
                                    </button>
                                </div>
                            } @else {
                                <button (click)="closeExamModal()" class="w-full py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover font-bold text-sm">بستن</button>
                            }
                        </div>
                    </div>
                </div>
            }

            <!-- ═══ DETAIL MODAL ═══ -->
            @if (detailEnrollment()) {
                <div appEscToClose (escPressed)="closeDetailModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-8 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeDetailModal()">
                    <div class="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-border dark:border-slate-700 animate-scale-in max-h-[85vh] flex flex-col" (click)="$event.stopPropagation()">
                        <div class="p-5 border-b border-border dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                            <div class="min-w-0 flex-1 ml-3">
                                <h2 class="text-lg font-bold text-foreground dark:text-slate-100">جزئیات</h2>
                                <p class="text-xs text-muted truncate">{{ detailEnrollment()!.courseTitle }}</p>
                            </div>
                            <button (click)="closeDetailModal()" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><ui-icon name="x" [size]="18" class="text-muted"></ui-icon></button>
                        </div>
                        <div class="flex-1 overflow-y-auto p-5 space-y-4">
                            <div class="grid grid-cols-2 gap-3 text-sm">
                                <div><span class="text-xs text-muted">وضعیت:</span> <span [class]="trainingService.getStatusBadgeClass(detailEnrollment()!.status)" class="px-2 py-0.5 rounded text-[10px] font-bold mr-1">{{ trainingService.getStatusLabel(detailEnrollment()!.status) }}</span></div>
                                <div><span class="text-xs text-muted">پیشرفت:</span> <b>{{ toFa(detailEnrollment()!.progress) }}٪</b></div>
                                <div><span class="text-xs text-muted">ساعات:</span> <b>{{ toFa(detailEnrollment()!.totalStudyHours.toFixed(1)) }}</b></div>
                                @if (detailEnrollment()!.finalScore !== null) {
                                    <div><span class="text-xs text-muted">نمره:</span> <b>{{ toFa(detailEnrollment()!.finalScore!) }}٪</b></div>
                                }
                            </div>
                            @if (detailEnrollment()!.examAttempts.length > 0) {
                                <div>
                                    <h3 class="text-sm font-bold text-foreground dark:text-slate-100 mb-2">سوابق آزمون</h3>
                                    <div class="space-y-2">
                                        @for (att of detailEnrollment()!.examAttempts; track att.id) {
                                            <div class="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg flex items-center justify-between">
                                                <div>
                                                    <p class="text-sm font-medium">تلاش {{ toFa(att.attemptNumber) }}</p>
                                                    <p class="text-[10px] text-muted dir-ltr">{{ toFa(att.submittedAt || att.startedAt) }}</p>
                                                </div>
                                                <div class="text-center">
                                                    <p class="text-lg font-bold" [class]="att.passed ? 'text-emerald-500' : 'text-red-500'">{{ toFa(att.score || 0) }}٪</p>
                                                    <p class="text-[10px]" [class]="att.passed ? 'text-emerald-500' : 'text-red-500'">{{ att.passed ? 'قبول' : 'مردود' }}</p>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                </div>
                            }
                        </div>
                        <div class="p-5 border-t border-border dark:border-slate-700 flex-shrink-0">
                            <button (click)="closeDetailModal()" class="w-full py-2.5 border border-border text-foreground rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm dark:border-slate-700 dark:text-slate-200">بستن</button>
                        </div>
                    </div>
                </div>
            }

            <!-- ═══ COURSE FORM MODAL ═══ -->
            @if (isCourseFormOpen()) {
                <div appEscToClose (escPressed)="closeCourseFormModal()" class="fixed inset-0 z-50 flex items-start justify-center pt-4 p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="closeCourseFormModal()">
                    <div class="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-border dark:border-slate-700 animate-scale-in max-h-[92vh] flex flex-col" (click)="$event.stopPropagation()">
                        <div class="p-5 border-b border-border dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                            <h2 class="text-lg font-bold text-foreground dark:text-slate-100">{{ editingCourseId ? 'ویرایش دوره' : 'ایجاد دوره جدید' }}</h2>
                            <button (click)="closeCourseFormModal()" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><ui-icon name="x" [size]="18" class="text-muted"></ui-icon></button>
                        </div>
                        <div class="flex-1 overflow-y-auto p-5 space-y-5">
                            <!-- Basic Info -->
                            <div>
                                <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2"><ui-icon name="book-open" [size]="16"></ui-icon> اطلاعات پایه</h3>
                                <div class="space-y-3">
                                    <div class="grid grid-cols-2 gap-3">
                                        <div><label class="block text-xs font-bold text-muted mb-1">کد *</label><input type="text" [(ngModel)]="courseForm.code" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr" placeholder="IT-001"></div>
                                        <div><label class="block text-xs font-bold text-muted mb-1">عنوان *</label><input type="text" [(ngModel)]="courseForm.title" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"></div>
                                    </div>
                                    <div><label class="block text-xs font-bold text-muted mb-1">توضیحات</label><textarea [(ngModel)]="courseForm.description" rows="2" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"></textarea></div>
                                    <div class="grid grid-cols-3 gap-3">
                                        <div><label class="block text-xs font-bold text-muted mb-1">دسته</label><select [(ngModel)]="courseForm.category" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"><option value="technical">فنی</option><option value="soft-skills">مهارت نرم</option><option value="management">مدیریتی</option><option value="compliance">انطباق</option><option value="language">زبان</option><option value="safety">ایمنی</option><option value="hr">HR</option><option value="other">سایر</option></select></div>
                                        <div><label class="block text-xs font-bold text-muted mb-1">سطح</label><select [(ngModel)]="courseForm.level" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"><option value="beginner">مقدماتی</option><option value="intermediate">متوسط</option><option value="advanced">پیشرفته</option><option value="expert">تخصصی</option></select></div>
                                        <div><label class="block text-xs font-bold text-muted mb-1">فرمت</label><select [(ngModel)]="courseForm.format" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"><option value="online-live">آنلاین زنده</option><option value="online-recorded">ضبط شده</option><option value="in-person">حضوری</option><option value="hybrid">ترکیبی</option><option value="workshop">کارگاه</option><option value="seminar">سمینار</option></select></div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div><label class="block text-xs font-bold text-muted mb-1">مدرس</label><input type="text" [(ngModel)]="courseForm.instructor" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"></div>
                                        <div><label class="block text-xs font-bold text-muted mb-1">دپارتمان</label><input type="text" [(ngModel)]="courseForm.department" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"></div>
                                    </div>
                                    <div class="grid grid-cols-4 gap-3">
                                        <div><label class="block text-xs font-bold text-muted mb-1">ساعت</label><input type="number" [(ngModel)]="courseForm.durationHours" min="1" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr"></div>
                                        <div><label class="block text-xs font-bold text-muted mb-1">امتیاز</label><input type="number" [(ngModel)]="courseForm.creditPoints" min="0" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr"></div>
                                        <div><label class="block text-xs font-bold text-muted mb-1">ظرفیت</label><input type="number" [(ngModel)]="courseForm.maxParticipants" min="1" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr"></div>
                                        <div><label class="block text-xs font-bold text-muted mb-1">اعتبار گواهی (ماه)</label><input type="number" [(ngModel)]="courseForm.certificateValidityMonths" min="0" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr" placeholder="0=بدون انقضا"></div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div><label class="block text-xs font-bold text-muted mb-1">شروع</label><input type="text" [(ngModel)]="courseForm.startDate" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr" placeholder="۱۴۰۵/۰۶/۰۱"></div>
                                        <div><label class="block text-xs font-bold text-muted mb-1">مهلت ثبت‌نام</label><input type="text" [(ngModel)]="courseForm.registrationDeadline" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr" placeholder="۱۴۰۵/۰۵/۲۵"></div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div><label class="block text-xs font-bold text-muted mb-1">مکان</label><input type="text" [(ngModel)]="courseForm.location" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"></div>
                                        <div><label class="block text-xs font-bold text-muted mb-1">نوع گواهینامه</label><select [(ngModel)]="courseForm.certificateType" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"><option value="attendance">حضور</option><option value="completion">تکمیل</option><option value="competency">شایستگی</option><option value="professional">حرفه‌ای</option><option value="renewal">تمدید</option></select></div>
                                    </div>
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" [(ngModel)]="courseForm.isMandatory" class="rounded text-primary focus:ring-primary/20">
                                        <span class="text-xs font-bold text-foreground dark:text-slate-200">دوره اجباری</span>
                                    </label>
                                </div>
                            </div>
                            <!-- Modules -->
                            <div class="pt-4 border-t border-border dark:border-slate-700">
                                <div class="flex items-center justify-between mb-3">
                                    <h3 class="text-sm font-bold text-primary flex items-center gap-2"><ui-icon name="list-check" [size]="16"></ui-icon> سرفصل‌ها ({{ toFa(formModules.length) }})</h3>
                                    <button (click)="addFormModule()" class="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 flex items-center gap-1"><ui-icon name="plus" [size]="12"></ui-icon> سرفصل</button>
                                </div>
                                <div class="space-y-2">
                                    @for (mod of formModules; track $index; let mi = $index) {
                                        <div class="flex items-center gap-2 p-2 rounded-lg border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                            <span class="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{{ toFa(mi + 1) }}</span>
                                            <input type="text" [(ngModel)]="mod.title" placeholder="عنوان سرفصل" class="flex-1 px-2 py-1.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                            <input type="number" [(ngModel)]="mod.durationMinutes" min="1" placeholder="دقیقه" class="w-20 px-2 py-1.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr text-center">
                                            <button (click)="removeFormModule(mi)" class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted hover:text-red-500"><ui-icon name="trash-2" [size]="14"></ui-icon></button>
                                        </div>
                                    }
                                    @if (formModules.length === 0) {
                                        <p class="text-xs text-muted text-center py-2">سرفصلی اضافه نشده</p>
                                    }
                                </div>
                            </div>
                            <!-- Exam Design -->
                            <div class="pt-4 border-t border-border dark:border-slate-700">
                                <div class="flex items-center justify-between mb-3">
                                    <h3 class="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2"><ui-icon name="edit" [size]="16"></ui-icon> طراحی آزمون</h3>
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" [(ngModel)]="examEnabled" class="rounded text-purple-500 focus:ring-purple-500/20">
                                        <span class="text-xs font-bold text-foreground dark:text-slate-200">فعال</span>
                                    </label>
                                </div>
                                @if (examEnabled) {
                                    <div class="space-y-3">
                                        <div class="grid grid-cols-3 gap-3">
                                            <div><label class="block text-xs font-bold text-muted mb-1">زمان (دقیقه)</label><input type="number" [(ngModel)]="examForm.durationMinutes" min="1" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr"></div>
                                            <div><label class="block text-xs font-bold text-muted mb-1">نمره قبولی (٪)</label><input type="number" [(ngModel)]="examForm.passingScore" min="0" max="100" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr"></div>
                                            <div><label class="block text-xs font-bold text-muted mb-1">حداکثر تلاش</label><input type="number" [(ngModel)]="examForm.maxAttempts" min="1" class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr"></div>
                                        </div>
                                        <div class="grid grid-cols-2 gap-3">
                                            <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border dark:border-slate-700"><input type="checkbox" [(ngModel)]="examForm.allowReview" class="rounded text-purple-500 focus:ring-purple-500/20"><span class="text-xs text-foreground dark:text-slate-200">مرور پس از آزمون</span></label>
                                            <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border dark:border-slate-700"><input type="checkbox" [(ngModel)]="examForm.showResultImmediately" class="rounded text-purple-500 focus:ring-purple-500/20"><span class="text-xs text-foreground dark:text-slate-200">نمایش فوری نتیجه</span></label>
                                        </div>
                                        <div class="pt-3 border-t border-border dark:border-slate-700">
                                            <div class="flex items-center justify-between mb-2">
                                                <span class="text-xs font-bold text-muted">سوالات ({{ toFa(formQuestions.length) }})</span>
                                                <button (click)="addFormQuestion()" class="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-200 flex items-center gap-1"><ui-icon name="plus" [size]="12"></ui-icon> سوال</button>
                                            </div>
                                            <div class="space-y-3">
                                                @for (q of formQuestions; track $index; let qi = $index) {
                                                    <div class="p-3 rounded-xl border border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10 space-y-2">
                                                        <div class="flex items-center justify-between">
                                                            <span class="text-xs font-bold text-purple-600 dark:text-purple-400">سوال {{ toFa(qi + 1) }}</span>
                                                            <button (click)="removeFormQuestion(qi)" class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted hover:text-red-500"><ui-icon name="trash-2" [size]="14"></ui-icon></button>
                                                        </div>
                                                        <textarea [(ngModel)]="q.text" rows="2" placeholder="متن سوال..." class="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/20 resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"></textarea>
                                                        <div class="grid grid-cols-2 gap-2">
                                                            <select [(ngModel)]="q.type" class="px-2 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"><option value="single-choice">تک‌گزینه‌ای</option><option value="multi-choice">چندگزینه‌ای</option><option value="true-false">صحیح/غلط</option><option value="descriptive">تشریحی</option></select>
                                                            <input type="number" [(ngModel)]="q.points" min="1" placeholder="امتیاز" class="px-2 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dir-ltr">
                                                        </div>
                                                        @if (q.type !== 'descriptive') {
                                                            <div><label class="text-[10px] text-muted block mb-1">گزینه‌ها (با | جدا کنید)</label><input type="text" [(ngModel)]="q.optionsStr" placeholder="گزینه ۱|گزینه ۲|گزینه ۳" class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"></div>
                                                            <div><label class="text-[10px] text-muted block mb-1">پاسخ صحیح</label><input type="text" [(ngModel)]="q.correctAnswerStr" placeholder="پاسخ صحیح" class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"></div>
                                                        }
                                                    </div>
                                                }
                                                @if (formQuestions.length === 0) {
                                                    <p class="text-xs text-muted text-center py-2">سوالی اضافه نشده</p>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                } @else {
                                    <p class="text-xs text-muted text-center py-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">این دوره آزمون ندارد</p>
                                }
                            </div>
                        </div>
                        <div class="p-5 border-t border-border dark:border-slate-700 flex gap-3 flex-shrink-0">
                            <button (click)="closeCourseFormModal()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm dark:border-slate-700 dark:text-slate-200">انصراف</button>
                            <button (click)="saveCourse()" class="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover font-bold text-sm">{{ editingCourseId ? 'ذخیره تغییرات' : 'ایجاد دوره' }}</button>
                        </div>
                    </div>
                </div>
            }

            <!-- ═══ DELETE CONFIRM ═══ -->
            @if (courseToDelete()) {
                <div appEscToClose (escPressed)="cancelDeleteCourse()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="cancelDeleteCourse()">
                    <div class="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-border dark:border-slate-700 p-6 animate-scale-in" (click)="$event.stopPropagation()">
                        <div class="text-center mb-4">
                            <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3"><ui-icon name="trash-2" [size]="28" class="text-red-500"></ui-icon></div>
                            <h3 class="text-lg font-bold text-foreground dark:text-slate-100 mb-2">حذف دوره</h3>
                            <p class="text-sm text-muted">«{{ courseToDelete()!.title }}» حذف شود؟</p>
                        </div>
                        <div class="flex gap-3">
                            <button (click)="cancelDeleteCourse()" class="flex-1 py-2.5 border border-border text-foreground rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm dark:border-slate-700 dark:text-slate-200">انصراف</button>
                            <button (click)="executeDeleteCourse()" class="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold text-sm">حذف</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    `]
})
export class TrainingComponent {
    trainingService = inject(TrainingService);
    private toastService = inject(ToastService);
    private exportService = inject(ExportService);
    protected loc = inject(IranLocalizationService);
    private certPdfService = inject(CertificatePdfService);

    stats = this.trainingService.stats;
    myEnrollments = this.trainingService.myEnrollments;
    certificates = this.trainingService.certificates;
    availableCourses = this.trainingService.availableCourses;
    learningPaths = this.trainingService.myLearningPaths;
    allCourses = this.trainingService.courses;

    activeTab = signal<TabKey>('courses');
    courseSearch = '';
    courseCategoryFilter: 'all' | CourseCategory = 'all';
    moduleEnrollment = signal<Enrollment | null>(null);
    detailEnrollment = signal<Enrollment | null>(null);
    examEnrollment = signal<Enrollment | null>(null);
    examAnswers: { [qid: string]: string | string[] } = {};
    examTimeLeft = signal(0);
    examSubmitted = signal(false);
    examResult = signal<{ score: number; passed: boolean; maxScore: number } | null>(null);
    private examTimerInterval: any = null;
    isCourseFormOpen = signal(false);
    editingCourseId: string | null = null;
    courseForm = this.getEmptyCourseForm();
    formModules: { title: string; durationMinutes: number }[] = [];
    examEnabled = false;
    examForm = { durationMinutes: 60, passingScore: 70, maxAttempts: 3, allowReview: true, showResultImmediately: true };
    formQuestions: { text: string; type: string; points: number; optionsStr: string; correctAnswerStr: string }[] = [];
    courseToDelete = signal<Course | null>(null);

    tabs: { key: TabKey; label: string; icon: string }[] = [
        { key: 'courses', label: 'دوره‌ها', icon: 'book-open' },
        { key: 'enrollments', label: 'ثبت‌نام‌ها', icon: 'list-check' },
        { key: 'certificates', label: 'گواهینامه‌ها', icon: 'shield' },
        { key: 'paths', label: 'مسیرها', icon: 'map-pin' },
        { key: 'admin', label: 'مدیریت', icon: 'settings' }
    ];

    get statCards() {
        const s = this.stats();
        return [
            { label: 'کل دوره‌ها', value: s.totalCourses, icon: 'book-open', color: 'text-primary' },
            { label: 'در حال گذراندن', value: s.activeEnrollments, icon: 'activity', color: 'text-blue-500' },
            { label: 'تکمیل شده', value: s.completedEnrollments, icon: 'check-circle', color: 'text-emerald-500' },
            { label: 'گواهینامه‌ها', value: s.totalCertificates, icon: 'shield', color: 'text-amber-500' },
            { label: 'ساعات آموزشی', value: s.totalHoursCompleted, icon: 'clock', color: 'text-purple-500' },
            { label: 'نرخ قبولی', value: s.examPassRate, icon: 'award', color: 'text-indigo-500' }
        ];
    }

    filteredAvailableCourses = computed(() => {
        let r = this.availableCourses();
        if (this.courseSearch.trim()) {
            const q = this.courseSearch.trim().toLowerCase();
            r = r.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
        }
        if (this.courseCategoryFilter !== 'all') r = r.filter(c => c.category === this.courseCategoryFilter);
        return r;
    });

    registerCourse(c: Course): void { this.trainingService.register(c.id, 'emp-current', 'علی احمدی', 'فناوری اطلاعات'); this.toastService.show(`ثبت‌نام در «${c.title}»`, 'success'); }
    startCourse(id: string): void { this.trainingService.startCourse(id); this.toastService.show('دوره شروع شد.', 'success'); }
    completeModule(eid: string, mid: string, m: number): void { this.trainingService.completeModule(eid, mid, m); this.toastService.show('سرفصل تکمیل شد.', 'success'); this.moduleEnrollment.update(e => e ? { ...e, completedModules: [...e.completedModules, mid] } : null); }
    dropEnrollment(id: string): void { this.trainingService.dropEnrollment(id); this.toastService.show('از دوره انصراف دادید.', 'success'); }
    canTakeExam(id: string): boolean { return this.trainingService.canTakeExam(id); }
    openModuleModal(e: Enrollment): void { this.moduleEnrollment.set(e); }
    closeModuleModal(): void { this.moduleEnrollment.set(null); }
    openDetailModal(e: Enrollment): void { this.detailEnrollment.set(e); }
    closeDetailModal(): void { this.detailEnrollment.set(null); }
    getCourseModules(id: string) { return this.trainingService.getCourseById(id)?.modules || []; }
    getCourseById(id: string) { return this.trainingService.getCourseById(id); }
    isExpired(d: string): boolean { return new Date(d) < new Date(); }
    downloadCertificate(cert: Certificate): void { this.certPdfService.downloadCertificate(cert); this.toastService.show('گواهینامه دانلود شد.', 'success'); }
    getPathProgress(pathId: string) { return this.trainingService.calculatePathProgress(pathId); }
    isEnrolledInPath(pathId: string): boolean { return this.trainingService.isEnrolledInPath(pathId); }
    registerPath(pathId: string): void { this.trainingService.registerPath(pathId); this.toastService.show('در مسیر ثبت‌نام کردید.', 'success'); }
    unregisterPath(pathId: string): void { this.trainingService.unregisterPath(pathId); this.toastService.show('از مسیر انصراف دادید.', 'success'); }
    getCourseStatusInPath(courseId: string, progress: { courseStatuses: { courseId: string; status: string }[] }): string { const cs = progress.courseStatuses.find(c => c.courseId === courseId); return cs?.status || 'not-enrolled'; }
    openExamModal(e: Enrollment): void { const exam = this.getExamForEnrollment(e.id); if (!exam) return; this.examEnrollment.set(e); this.examAnswers = {}; this.examSubmitted.set(false); this.examResult.set(null); this.examTimeLeft.set(exam.durationMinutes * 60); this.startExamTimer(); }
    closeExamModal(): void { this.stopExamTimer(); this.examEnrollment.set(null); this.examAnswers = {}; this.examSubmitted.set(false); this.examResult.set(null); }
    getExamForEnrollment(id: string) { const e = this.trainingService.enrollments().find(x => x.id === id); return e ? this.trainingService.getCourseById(e.courseId)?.exam || null : null; }
    getExamQuestions(id: string): ExamQuestion[] { return this.getExamForEnrollment(id)?.questions || []; }
    getExamPassingScore(id: string): number { return this.getExamForEnrollment(id)?.passingScore || 0; }
    getRemainingAttempts(id: string): number { const e = this.trainingService.enrollments().find(x => x.id === id); const ex = this.getExamForEnrollment(id); return e && ex ? Math.max(0, ex.maxAttempts - e.examAttempts.length) : 0; }
    isMultiChoiceSelected(qid: string, opt: string): boolean { const a = this.examAnswers[qid]; return Array.isArray(a) && a.includes(opt); }
    toggleMultiChoice(qid: string, opt: string): void { let c = (this.examAnswers[qid] as string[]) || []; c = c.includes(opt) ? c.filter(o => o !== opt) : [...c, opt]; this.examAnswers[qid] = c; }
    submitExam(): void { const e = this.examEnrollment(); if (!e) return; const ans = Object.entries(this.examAnswers).map(([questionId, answer]) => ({ questionId, answer })); const res = this.trainingService.submitExamAttempt(e.id, ans); this.examResult.set(res); this.examSubmitted.set(true); this.stopExamTimer(); if (res.passed) this.toastService.show('قبول شدید! گواهینامه صادر شد.', 'success'); else this.toastService.show(`نمره: ${res.score}٪ - مردود`, 'error'); }
    private startExamTimer(): void { this.stopExamTimer(); this.examTimerInterval = setInterval(() => { const l = this.examTimeLeft(); if (l <= 0) { this.submitExam(); return; } this.examTimeLeft.set(l - 1); }, 1000); }
    private stopExamTimer(): void { if (this.examTimerInterval) { clearInterval(this.examTimerInterval); this.examTimerInterval = null; } }
    formatTimer(s: number): string { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
    getEmptyCourseForm() { return { code: '', title: '', description: '', category: 'technical' as CourseCategory, level: 'beginner' as CourseLevel, format: 'online-live' as CourseFormat, instructor: '', department: '', durationHours: 8, creditPoints: 1, maxParticipants: 20, currentParticipants: 0, startDate: '', endDate: '', registrationDeadline: '', location: '', prerequisites: [] as any[], objectives: [] as string[], modules: [] as any[], exam: null as any, certificateType: 'completion' as CertificateType, certificateValidityMonths: null as number | null, cost: 0, isMandatory: false, tags: [] as string[] }; }

    openCourseFormModal(course?: Course): void {
        if (course) {
            this.editingCourseId = course.id;
            this.courseForm = { code: course.code, title: course.title, description: course.description, category: course.category, level: course.level, format: course.format, instructor: course.instructor, department: course.department, durationHours: course.durationHours, creditPoints: course.creditPoints, maxParticipants: course.maxParticipants, currentParticipants: course.currentParticipants, startDate: course.startDate, endDate: course.endDate, registrationDeadline: course.registrationDeadline, location: course.location, prerequisites: course.prerequisites, objectives: course.objectives, modules: course.modules, exam: course.exam, certificateType: course.certificateType, certificateValidityMonths: course.certificateValidityMonths, cost: course.cost, isMandatory: course.isMandatory, tags: course.tags };
            this.formModules = course.modules.map(m => ({ title: m.title, durationMinutes: m.durationMinutes }));
            this.examEnabled = !!course.exam;
            if (course.exam) {
                this.examForm = { durationMinutes: course.exam.durationMinutes, passingScore: course.exam.passingScore, maxAttempts: course.exam.maxAttempts, allowReview: course.exam.allowReview, showResultImmediately: course.exam.showResultImmediately };
                this.formQuestions = course.exam.questions.map(q => ({ text: q.text, type: q.type, points: q.points, optionsStr: q.options ? q.options.join('|') : '', correctAnswerStr: Array.isArray(q.correctAnswer) ? q.correctAnswer.join('|') : String(q.correctAnswer || '') }));
            } else {
                this.examForm = { durationMinutes: 60, passingScore: 70, maxAttempts: 3, allowReview: true, showResultImmediately: true };
                this.formQuestions = [];
            }
        } else {
            this.editingCourseId = null;
            this.courseForm = this.getEmptyCourseForm();
            this.formModules = [];
            this.examEnabled = false;
            this.examForm = { durationMinutes: 60, passingScore: 70, maxAttempts: 3, allowReview: true, showResultImmediately: true };
            this.formQuestions = [];
        }
        this.isCourseFormOpen.set(true);
    }

    closeCourseFormModal(): void { this.isCourseFormOpen.set(false); this.editingCourseId = null; }
    addFormModule(): void { this.formModules.push({ title: '', durationMinutes: 60 }); }
    removeFormModule(i: number): void { this.formModules.splice(i, 1); }
    addFormQuestion(): void { this.formQuestions.push({ text: '', type: 'single-choice', points: 10, optionsStr: '', correctAnswerStr: '' }); }
    removeFormQuestion(i: number): void { this.formQuestions.splice(i, 1); }

    saveCourse(): void {
        if (!this.courseForm.title.trim() || !this.courseForm.code.trim()) { this.toastService.show('کد و عنوان الزامی هستند.', 'error'); return; }
        if (this.formModules.length === 0) { this.toastService.show('حداقل یک سرفصل اضافه کنید.', 'error'); return; }
        const modules: CourseModule[] = this.formModules.map((m, i) => ({ id: `mod-${Date.now()}-${i}`, title: m.title, durationMinutes: m.durationMinutes, order: i + 1, completed: false }));
        let exam: Exam | null = null;
        if (this.examEnabled && this.formQuestions.length > 0) {
            const questions: ExamQuestion[] = this.formQuestions.map((q, i) => ({ id: `q-${Date.now()}-${i}`, text: q.text, type: q.type as any, points: q.points, options: q.type !== 'descriptive' ? q.optionsStr.split('|').map(o => o.trim()).filter(o => o) : undefined, correctAnswer: q.type === 'multi-choice' ? q.correctAnswerStr.split('|').map(o => o.trim()).filter(o => o) : q.correctAnswerStr || undefined }));
            exam = { id: `exam-${Date.now()}`, courseId: '', title: `آزمون ${this.courseForm.title}`, type: questions.some(q => q.type === 'descriptive') ? 'mixed' : 'multiple-choice', durationMinutes: this.examForm.durationMinutes, passingScore: this.examForm.passingScore, maxAttempts: this.examForm.maxAttempts, questions, allowReview: this.examForm.allowReview, showResultImmediately: this.examForm.showResultImmediately };
        }
        const data = { ...this.courseForm, modules, exam };
        if (this.editingCourseId) { this.trainingService.updateCourse(this.editingCourseId, data as any); this.toastService.show('دوره ویرایش شد.', 'success'); } else { this.trainingService.addCourse(data as any); this.toastService.show('دوره ایجاد شد.', 'success'); }
        this.closeCourseFormModal();
    }

    confirmDeleteCourse(c: Course): void { this.courseToDelete.set(c); }
    cancelDeleteCourse(): void { this.courseToDelete.set(null); }
    executeDeleteCourse(): void { const c = this.courseToDelete(); if (!c) return; this.trainingService.deleteCourse(c.id); this.toastService.show('دوره حذف شد.', 'success'); this.courseToDelete.set(null); }

    exportData(): void {
        const d = this.myEnrollments().map(e => ({
            'دوره': e.courseTitle, 'وضعیت': this.trainingService.getStatusLabel(e.status),
            'پیشرفت': `${e.progress}٪`, 'نمره': e.finalScore !== null ? `${e.finalScore}٪` : '-'
        }));
        this.exportService.exportToCSV(d, 'training-report');
    }

    toFa(num: number | string): string {
        return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
    }

    protected readonly Math = Math;
}
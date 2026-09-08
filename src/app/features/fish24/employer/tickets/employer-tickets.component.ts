import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EscToCloseDirective } from '../../../../shared/directives/esc-to-close.directive';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { EmployerTicketPreviewService, EmployerTicketRecord, EmployerTicketStatus } from './employer-ticket-preview.service';

type TicketStatusFilter = 'all' | EmployerTicketStatus;

@Component({
  selector: 'app-employer-tickets',
  standalone: true,
  imports: [FormsModule, RouterLink, EscToCloseDirective, IconComponent],
  template: `
    <div class="mx-auto max-w-[95%] space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
      <header class="flex min-w-0 items-center gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
          <ui-icon name="ticket" [size]="30" class="text-primary"></ui-icon>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">فهرست تیکت‌ها</h1>
          <p class="mt-1 text-sm text-muted sm:text-base">پیگیری درخواست‌های مرتبط با اسناد ارسالی</p>
        </div>
      </header>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="employer-ticket-filter-title">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ui-icon name="search" [size]="20"></ui-icon>
          </div>
          <div>
            <h2 id="employer-ticket-filter-title" class="text-lg font-bold text-foreground dark:text-slate-100">جستجوی تیکت‌ها</h2>
            <p class="mt-0.5 text-xs text-muted">وضعیت و عنوان سند ارسالی را بررسی کنید.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(12rem,18rem)_minmax(16rem,1fr)_auto] md:items-end">
          <div>
            <label for="employer-ticket-status-filter" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">وضعیت</label>
            <select id="employer-ticket-status-filter" name="ticketStatusFilter" [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" class="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="all">همه</option>
              <option value="درحال بررسی">درحال بررسی</option>
              <option value="بسته شده">بسته شده</option>
            </select>
          </div>
          <div>
            <label for="employer-ticket-title-search" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">عنوان سند ارسالی</label>
            <div class="relative">
              <ui-icon name="search" [size]="18" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"></ui-icon>
              <input id="employer-ticket-title-search" name="ticketTitleSearch" type="search" [ngModel]="titleQuery()" (ngModelChange)="titleQuery.set($event)" autocomplete="off" class="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" placeholder="جستجو در عنوان...">
            </div>
          </div>
          <button type="button" (click)="showAll()" class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 md:w-auto">
            <ui-icon name="list-check" [size]="18"></ui-icon>
            مشاهده همه
          </button>
        </div>
      </section>

      <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5" aria-labelledby="employer-ticket-list-title">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ui-icon name="ticket" [size]="21"></ui-icon>
          </div>
          <div>
            <h2 id="employer-ticket-list-title" aria-live="polite" class="text-lg font-bold text-foreground dark:text-slate-100 sm:text-xl">لیست تیکت‌ها (شامل {{ formatNumber(filteredTickets().length) }} رکورد)</h2>
            <p class="mt-0.5 text-xs text-muted">ایجاد تیکت فقط از عملیات یک سند ارسالی انجام می‌شود.</p>
          </div>
        </div>

        @if (filteredTickets().length > 0) {
          <div class="hidden overflow-hidden rounded-xl border border-border dark:border-slate-700 xl:block">
            <table class="w-full table-fixed text-[11px] 2xl:text-xs">
              <thead class="bg-background/80 dark:bg-slate-900/60">
                <tr>
                  <th class="w-16 px-2 py-3 text-right font-bold text-muted">شناسه</th>
                  <th class="px-2 py-3 text-right font-bold text-muted">عنوان</th>
                  <th class="w-36 px-2 py-3 text-right font-bold text-muted">از طرف</th>
                  <th class="w-28 px-2 py-3 text-right font-bold text-muted">وضعیت</th>
                  <th class="w-36 px-2 py-3 text-right font-bold text-muted">تاریخ بروزرسانی</th>
                  <th class="w-32 px-2 py-3 text-right font-bold text-muted">موبایل</th>
                  <th class="w-40 px-2 py-3 text-right font-bold text-muted">نام و نام خانوادگی</th>
                  <th class="w-32 px-2 py-3 text-center font-bold text-muted">عملیات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border dark:divide-slate-700">
                @for (ticket of filteredTickets(); track ticket.id) {
                  <tr class="transition-colors hover:bg-primary/5 dark:hover:bg-primary/10">
                    <td class="px-2 py-3 font-bold text-foreground dark:text-slate-200"><span dir="ltr">{{ ticket.id }}</span></td>
                    <td class="px-2 py-3 font-bold leading-5 text-foreground dark:text-slate-100">{{ ticket.subject }}</td>
                    <td class="px-2 py-3 leading-5 text-foreground dark:text-slate-200">{{ fromLabel(ticket) }}</td>
                    <td class="px-2 py-3"><span [class]="statusClass(ticket)">{{ ticket.status }}</span></td>
                    <td class="whitespace-nowrap px-2 py-3 text-muted"><span dir="ltr">{{ ticket.updatedAt }}</span></td>
                    <td class="px-2 py-3 font-semibold text-foreground dark:text-slate-200">
                      @if (ticket.employeeMobile) { <span dir="ltr">{{ ticket.employeeMobile }}</span> } @else { <span class="sr-only">بدون موبایل کارمند</span> }
                    </td>
                    <td class="px-2 py-3 font-semibold text-foreground dark:text-slate-200">
                      @if (ticket.employeeName) { {{ ticket.employeeName }} } @else { <span class="sr-only">بدون نام کارمند</span> }
                    </td>
                    <td class="px-2 py-3">
                      <div class="flex items-center justify-center gap-2">
                        <a [routerLink]="['/fish24/employer/tickets', ticket.id]" [attr.aria-label]="'مشاهده تیکت ' + ticket.id" title="مشاهده تیکت" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25">
                          <ui-icon name="eye" [size]="17"></ui-icon>
                        </a>
                        @if (ticket.status === 'درحال بررسی') {
                          <button type="button" (click)="requestClose(ticket)" [attr.aria-label]="'بستن تیکت ' + ticket.id" title="بستن تیکت" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-danger/30 text-danger transition-colors hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger/25">
                            <ui-icon name="lock" [size]="17"></ui-icon>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="space-y-3 xl:hidden">
            @for (ticket of filteredTickets(); track ticket.id) {
              <article class="rounded-xl border border-border bg-background/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="break-words text-base font-extrabold leading-6 text-foreground dark:text-slate-100">{{ ticket.subject }}</h3>
                    <p class="mt-1 text-xs font-semibold text-muted">{{ fromLabel(ticket) }}</p>
                  </div>
                  <span [class]="statusClass(ticket)">{{ ticket.status }}</span>
                </div>
                <dl class="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div><dt class="text-[11px] text-muted">شناسه</dt><dd class="mt-1 text-sm font-bold text-foreground dark:text-slate-200" dir="ltr">{{ ticket.id }}</dd></div>
                  <div><dt class="text-[11px] text-muted">تاریخ بروزرسانی</dt><dd class="mt-1 text-sm font-bold text-foreground dark:text-slate-200" dir="ltr">{{ ticket.updatedAt }}</dd></div>
                  @if (ticket.employeeMobile) { <div><dt class="text-[11px] text-muted">موبایل</dt><dd class="mt-1 text-sm font-bold text-foreground dark:text-slate-200" dir="ltr">{{ ticket.employeeMobile }}</dd></div> }
                  @if (ticket.employeeName) { <div><dt class="text-[11px] text-muted">نام و نام خانوادگی</dt><dd class="mt-1 text-sm font-bold text-foreground dark:text-slate-200">{{ ticket.employeeName }}</dd></div> }
                </dl>
                <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <a [routerLink]="['/fish24/employer/tickets', ticket.id]" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 px-3 py-2 text-sm font-bold text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25"><ui-icon name="eye" [size]="17"></ui-icon>مشاهده تیکت</a>
                  @if (ticket.status === 'درحال بررسی') { <button type="button" (click)="requestClose(ticket)" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-danger/30 px-3 py-2 text-sm font-bold text-danger hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger/25"><ui-icon name="lock" [size]="17"></ui-icon>بستن تیکت</button> }
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center dark:border-slate-600 dark:bg-slate-900/40">
            <ui-icon name="inbox" [size]="34" class="mx-auto text-muted opacity-70"></ui-icon>
            <p class="mt-3 text-sm font-bold text-foreground dark:text-slate-200">تیکتی مطابق فیلترهای انتخاب‌شده پیدا نشد.</p>
          </div>
        }
      </section>

      @if (ticketToClose(); as ticket) {
        <div appEscToClose (escPressed)="cancelClose()" (click)="cancelClose()" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" role="presentation">
          <section role="alertdialog" aria-modal="true" aria-labelledby="close-ticket-title" aria-describedby="close-ticket-description" (click)="$event.stopPropagation()" class="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in dark:border-slate-700 dark:bg-slate-800">
            <div class="p-5 text-center">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger"><ui-icon name="lock" [size]="25"></ui-icon></div>
              <h2 id="close-ticket-title" class="mt-3 text-lg font-bold text-foreground dark:text-slate-100">بستن تیکت</h2>
              <p id="close-ticket-description" class="mt-2 text-sm leading-6 text-muted">آیا از بستن تیکت «{{ ticket.subject }}» اطمینان دارید؟</p>
            </div>
            <div class="flex flex-col-reverse gap-2 border-t border-border p-4 dark:border-slate-700 sm:flex-row sm:justify-end">
              <button type="button" (click)="cancelClose()" class="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground dark:border-slate-600 dark:text-slate-200 sm:w-auto">انصراف</button>
              <button type="button" (click)="confirmClose()" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-danger px-5 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-danger/25 sm:w-auto"><ui-icon name="lock" [size]="17"></ui-icon>بستن تیکت</button>
            </div>
          </section>
        </div>
      }
    </div>
  `
})
export class EmployerTicketsComponent {
  private readonly preview = inject(EmployerTicketPreviewService);
  private readonly toast = inject(ToastService);
  private readonly numberFormatter = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });

  readonly tickets = this.preview.tickets;
  readonly ticketToClose = signal<EmployerTicketRecord | null>(null);
  readonly statusFilter = signal<TicketStatusFilter>('all');
  readonly titleQuery = signal('');

  readonly filteredTickets = computed(() => {
    const query = this.titleQuery().trim().toLocaleLowerCase('fa-IR');
    const status = this.statusFilter();
    return this.tickets().filter((ticket) => (status === 'all' || ticket.status === status)
      && (query.length === 0 || ticket.subject.toLocaleLowerCase('fa-IR').includes(query)));
  });

  showAll(): void {
    this.statusFilter.set('all');
    this.titleQuery.set('');
  }

  fromLabel(ticket: EmployerTicketRecord): string {
    return ticket.origin === 'employerToSystem' ? 'از شما به سامانه' : 'از کارمند به شما';
  }

  statusClass(ticket: EmployerTicketRecord): string {
    return ticket.status === 'درحال بررسی'
      ? 'inline-flex shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary'
      : 'inline-flex shrink-0 rounded-full bg-muted/15 px-2.5 py-1 text-xs font-bold text-muted';
  }

  requestClose(ticket: EmployerTicketRecord): void {
    this.ticketToClose.set(ticket);
  }

  cancelClose(): void {
    this.ticketToClose.set(null);
  }

  confirmClose(): void {
    const ticket = this.ticketToClose();
    if (!ticket) return;
    this.preview.closeTicket(ticket.id);
    this.ticketToClose.set(null);
    this.toast.show('وضعیت تیکت در نسخه نمایشی به «بسته شده» تغییر کرد.', 'success');
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }
}

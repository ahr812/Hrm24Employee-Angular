import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { EmployerTicketMessage, EmployerTicketPreviewService } from './employer-ticket-preview.service';

@Component({
  selector: 'app-employer-ticket-view',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    @if (ticket(); as currentTicket) {
      <div class="mx-auto max-w-5xl space-y-5 animate-fade-in-up sm:space-y-6" dir="rtl">
        <header class="flex min-w-0 items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14"><ui-icon name="ticket" [size]="30" class="text-primary"></ui-icon></div>
          <div class="min-w-0"><h1 class="text-2xl font-bold text-primary sm:text-3xl">مشاهده تیکت</h1><p class="mt-1 text-sm text-muted sm:text-base">گفت‌وگوی مرتبط با سند ارسالی</p></div>
        </header>

        <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="ticket-view-context-title">
          <div class="mb-4 flex flex-col gap-3 border-b border-border pb-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="ticket-view-context-title" class="text-lg font-bold text-foreground dark:text-slate-100">مشخصات تیکت</h2>
            <span [class]="currentTicket.status === 'درحال بررسی' ? 'inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary' : 'inline-flex w-fit rounded-full bg-muted/15 px-3 py-1 text-xs font-bold text-muted'">{{ currentTicket.status }}</span>
          </div>
          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="rounded-xl border border-border bg-background/60 p-3 dark:border-slate-700 dark:bg-slate-900/40"><dt class="text-xs text-muted">موضوع</dt><dd class="mt-1.5 break-words text-sm font-bold text-foreground dark:text-slate-100">{{ currentTicket.subject }}</dd></div>
            <div class="rounded-xl border border-border bg-background/60 p-3 dark:border-slate-700 dark:bg-slate-900/40"><dt class="text-xs text-muted">محل کار</dt><dd class="mt-1.5 break-words text-sm font-bold text-foreground dark:text-slate-100">{{ currentTicket.workplace }}</dd></div>
          </dl>
        </section>

        <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="ticket-conversation-title">
          <div class="mb-5 flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ui-icon name="message-square" [size]="20"></ui-icon></div><div><h2 id="ticket-conversation-title" class="text-lg font-bold text-foreground dark:text-slate-100">گفت‌وگوی تیکت</h2><p class="mt-0.5 text-xs text-muted">پیام‌ها به‌ترتیب زمانی نمایش داده می‌شوند.</p></div></div>
          <ol class="space-y-4">
            @for (message of currentTicket.messages; track message.id) {
              <li [class]="messageContainerClass(message)">
                <article [class]="messageCardClass(message)">
                  <div class="flex flex-col gap-1 border-b border-current/10 pb-2 sm:flex-row sm:items-center sm:justify-between"><h3 class="text-sm font-bold">{{ message.senderDisplay }}</h3><time class="text-xs opacity-75" dir="ltr">{{ message.sentAt }}</time></div>
                  <p class="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{{ message.text }}</p>
                </article>
              </li>
            }
          </ol>
        </section>

        @if (currentTicket.status === 'درحال بررسی') {
          <section class="rounded-2xl border border-border bg-surface p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6" aria-labelledby="ticket-reply-title">
            <h2 id="ticket-reply-title" class="text-lg font-bold text-foreground dark:text-slate-100">ثبت پاسخ</h2>
            <form (ngSubmit)="submitReply()" novalidate class="mt-4">
              <label for="employer-ticket-reply" class="mb-1.5 block text-sm font-bold text-foreground dark:text-slate-200">متن پاسخ</label>
              <textarea id="employer-ticket-reply" name="ticketReply" [(ngModel)]="replyText" rows="5" [attr.aria-invalid]="showReplyError()" [attr.aria-describedby]="showReplyError() ? 'employer-ticket-reply-error' : null" class="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-7 text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" placeholder="پاسخ خود را وارد کنید"></textarea>
              @if (showReplyError()) { <p id="employer-ticket-reply-error" role="alert" class="mt-1.5 text-xs font-medium text-danger">متن پاسخ را وارد کنید.</p> }
              <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><a routerLink="/fish24/employer/tickets" class="inline-flex w-full items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-background dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">بازگشت به لیست</a><button type="submit" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto"><ui-icon name="send" [size]="17"></ui-icon>ثبت</button></div>
            </form>
          </section>
        } @else {
          <div class="flex justify-end"><a routerLink="/fish24/employer/tickets" class="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold text-foreground shadow-sm hover:bg-background dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">بازگشت به لیست</a></div>
        }
      </div>
    }
  `
})
export class EmployerTicketViewComponent {
  private readonly preview = inject(EmployerTicketPreviewService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly ticketId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly ticket = computed(() => this.preview.tickets().find((ticket) => ticket.id === this.ticketId));
  readonly replyAttempted = signal(false);
  replyText = '';

  constructor() {
    if (!this.preview.findTicket(this.ticketId)) {
      queueMicrotask(() => void this.router.navigate(['/fish24/employer/tickets']));
    }
  }

  showReplyError(): boolean {
    return this.replyAttempted() && this.replyText.trim().length === 0;
  }

  submitReply(): void {
    this.replyAttempted.set(true);
    const ticket = this.ticket();
    if (!ticket || ticket.status !== 'درحال بررسی' || this.showReplyError()) return;
    this.preview.replyToTicket(ticket.id, this.replyText);
    this.replyText = '';
    this.replyAttempted.set(false);
    this.toast.show('پاسخ در نسخه نمایشی ثبت شد.', 'success');
  }

  messageContainerClass(message: EmployerTicketMessage): string {
    return message.senderSide === 'employer' ? 'flex justify-start' : 'flex justify-end';
  }

  messageCardClass(message: EmployerTicketMessage): string {
    return message.senderSide === 'employer'
      ? 'w-full max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 p-4 text-foreground dark:border-primary/30 dark:bg-primary/10 dark:text-slate-100'
      : 'w-full max-w-2xl rounded-2xl border border-border bg-background/70 p-4 text-foreground dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100';
  }
}

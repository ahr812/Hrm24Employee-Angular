import { Injectable, computed, signal } from '@angular/core';
import { Fish24RoleId } from '../models/fish24-role.model';

export interface Fish24NewsComment {
  readonly id: number;
  readonly createdAt: string;
  readonly newsId: number;
  readonly authorName: string;
  readonly authorMobile: string;
  readonly message: string;
  readonly approved: boolean;
  readonly response: string | null;
  readonly responseAuthor: string | null;
  readonly responseUpdatedAt: string | null;
}

export type CommentMutationResult<T = void> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };

const INTERNAL_ROLES: readonly Fish24RoleId[] = ['super-admin', 'sales-expert', 'support-expert'];

/**
 * In-memory preview source for Phase 1D.11. These neutral fixtures demonstrate
 * moderation behavior only and are not production identities or persisted data.
 */
@Injectable({ providedIn: 'root' })
export class Fish24NewsCommentPreviewService {
  private readonly commentState = signal<readonly Fish24NewsComment[]>([
    {
      id: 7001,
      createdAt: '1405/06/29 09:15',
      newsId: 401,
      authorName: 'کاربر نمونه اول',
      authorMobile: '09120000001',
      message: 'راهنما مفید بود.\nلطفاً بخش گزارش‌ها را هم با یک مثال تکمیل کنید.',
      approved: true,
      response: null,
      responseAuthor: null,
      responseUpdatedAt: null
    },
    {
      id: 7002,
      createdAt: '1405/06/29 10:40',
      newsId: 401,
      authorName: 'کاربر نمونه دوم',
      authorMobile: '09120000002',
      message: 'Is the new document flow available on mobile?\nاین متن ترکیبی فارسی و English است.',
      approved: true,
      response: 'بله، جریان جدید در نمایش موبایل نیز قابل استفاده است.',
      responseAuthor: 'کارشناس پشتیبانی',
      responseUpdatedAt: '1405/06/29 11:05'
    },
    {
      id: 7003,
      createdAt: '1405/06/30 08:30',
      newsId: 402,
      authorName: 'کاربر نمونه سوم',
      authorMobile: '09120000003',
      message: '=HYPERLINK("https://example.invalid","این متن باید عیناً نمایش داده شود")',
      approved: false,
      response: null,
      responseAuthor: null,
      responseUpdatedAt: null
    }
  ]);

  readonly comments = computed(() => this.commentState());

  canManage(role: Fish24RoleId): boolean { return INTERNAL_ROLES.includes(role); }
  canExport(role: Fish24RoleId): boolean { return role === 'super-admin' || role === 'sales-expert'; }
  comment(id: number): Fish24NewsComment | undefined { return this.commentState().find(item => item.id === id); }
  approvedForNews(newsId: number): readonly Fish24NewsComment[] {
    return this.commentState().filter(item => item.newsId === newsId && item.approved);
  }
  approvedCount(newsId: number): number { return this.approvedForNews(newsId).length; }

  setApproval(role: Fish24RoleId, id: number, approved: boolean): CommentMutationResult<Fish24NewsComment> {
    if (!this.canManage(role)) return this.failure('مجوز مدیریت دیدگاه‌های خبر را ندارید.');
    const current = this.comment(id);
    if (!current) return this.failure('دیدگاه یافت نشد.');
    const updated = { ...current, approved };
    this.commentState.update(items => items.map(item => item.id === id ? updated : item));
    return { ok: true, value: updated };
  }

  saveResponse(role: Fish24RoleId, id: number, response: string, responseAuthor: string): CommentMutationResult<Fish24NewsComment> {
    if (!this.canManage(role)) return this.failure('مجوز پاسخ به دیدگاه‌های خبر را ندارید.');
    const current = this.comment(id);
    if (!current) return this.failure('دیدگاه یافت نشد.');
    if (!current.approved) return this.failure('فقط به دیدگاه تأییدشده می‌توان پاسخ داد.');
    const trimmed = response.trim();
    if (!trimmed) return this.failure('متن پاسخ نمی‌تواند خالی باشد.');
    const updated: Fish24NewsComment = {
      ...current,
      response: trimmed,
      responseAuthor: responseAuthor.trim() || 'کارشناس داخلی',
      responseUpdatedAt: this.nowJalali()
    };
    this.commentState.update(items => items.map(item => item.id === id ? updated : item));
    return { ok: true, value: updated };
  }

  removeForNews(newsId: number): void {
    this.commentState.update(items => items.filter(item => item.newsId !== newsId));
  }

  private failure<T>(error: string): CommentMutationResult<T> { return { ok: false, error }; }
  private nowJalali(): string {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date()).replace(/\u200e/g, '').replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
  }
}

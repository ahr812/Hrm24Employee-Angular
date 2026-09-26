import { Injectable, computed, signal } from '@angular/core';
import { Fish24RoleId } from '../models/fish24-role.model';

export interface Fish24Faq {
  readonly id: number;
  readonly question: string;
  readonly answer: string;
  readonly displayOrder: number;
  readonly active: boolean;
}

export interface Fish24FaqDraft {
  readonly question: string;
  readonly answer: string;
  readonly displayOrder: string | number;
}

export interface Fish24FaqMutationResult {
  readonly ok: boolean;
  readonly error: string;
}

const INTERNAL_ROLES: readonly Fish24RoleId[] = ['super-admin', 'sales-expert', 'support-expert'];
const EXPORT_ROLES: readonly Fish24RoleId[] = ['super-admin', 'sales-expert'];
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

@Injectable({ providedIn: 'root' })
export class Fish24FaqPreviewService {
  private readonly records = signal<readonly Fish24Faq[]>([
    { id: 1, question: 'چگونه یک سند جدید ارسال کنم؟', answer: 'از منوی «فیش‌ها و اسناد ارسالی» گزینه سند جدید را انتخاب کنید.\nسپس فایل را بررسی و تأیید نهایی کنید.', displayOrder: 0, active: true },
    { id: 2, question: 'هزینه ارسال سند چگونه محاسبه می‌شود؟', answer: 'هزینه بر اساس تنظیمات قیمت‌گذاری جاری و تعداد گیرندگان محاسبه می‌شود.', displayOrder: 1, active: true },
    { id: 3, question: 'چرا یک سند دیگر قابل حذف نیست؟', answer: 'سندی که توزیع شده باشد برای حفظ سابقه قابل حذف نیست.', displayOrder: 2, active: false },
    { id: 4, question: 'متن‌های ویژه چگونه نگهداری می‌شوند؟', answer: '=SUM(1,2) به‌صورت متن ساده ذخیره و صادر می‌شود؛ <b>HTML اجرا نمی‌شود</b>.', displayOrder: 2, active: true }
  ]);

  readonly faqs = computed(() => [...this.records()].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id));

  canManage(role: Fish24RoleId): boolean { return INTERNAL_ROLES.includes(role); }
  canExport(role: Fish24RoleId): boolean { return EXPORT_ROLES.includes(role); }

  create(role: Fish24RoleId, draft: Fish24FaqDraft): Fish24FaqMutationResult {
    if (!this.canManage(role)) return { ok: false, error: 'دسترسی مدیریت سؤالات متداول را ندارید.' };
    const normalized = this.normalize(draft);
    if ('error' in normalized) return { ok: false, error: normalized.error };
    const nextId = Math.max(0, ...this.records().map(item => item.id)) + 1;
    this.records.update(items => [...items, { id: nextId, ...normalized.value, active: true }]);
    return { ok: true, error: '' };
  }

  update(role: Fish24RoleId, id: number, draft: Fish24FaqDraft): Fish24FaqMutationResult {
    if (!this.canManage(role)) return { ok: false, error: 'دسترسی مدیریت سؤالات متداول را ندارید.' };
    const current = this.records().find(item => item.id === id);
    if (!current) return { ok: false, error: 'سؤال انتخاب‌شده یافت نشد.' };
    const normalized = this.normalize(draft);
    if ('error' in normalized) return { ok: false, error: normalized.error };
    this.records.update(items => items.map(item => item.id === id ? { ...item, ...normalized.value } : item));
    return { ok: true, error: '' };
  }

  toggleActive(role: Fish24RoleId, id: number): Fish24FaqMutationResult {
    if (!this.canManage(role)) return { ok: false, error: 'دسترسی مدیریت سؤالات متداول را ندارید.' };
    if (!this.records().some(item => item.id === id)) return { ok: false, error: 'سؤال انتخاب‌شده یافت نشد.' };
    this.records.update(items => items.map(item => item.id === id ? { ...item, active: !item.active } : item));
    return { ok: true, error: '' };
  }

  delete(role: Fish24RoleId, id: number): Fish24FaqMutationResult {
    if (!this.canManage(role)) return { ok: false, error: 'دسترسی مدیریت سؤالات متداول را ندارید.' };
    if (!this.records().some(item => item.id === id)) return { ok: false, error: 'سؤال انتخاب‌شده یافت نشد.' };
    this.records.update(items => items.filter(item => item.id !== id));
    return { ok: true, error: '' };
  }

  private normalize(draft: Fish24FaqDraft): { value: Omit<Fish24Faq, 'id' | 'active'> } | { error: string } {
    const question = draft.question.trim();
    const answer = draft.answer.trim();
    if (!question) return { error: 'متن سؤال الزامی است.' };
    if (!answer) return { error: 'متن پاسخ الزامی است.' };
    const normalizedOrder = String(draft.displayOrder).trim()
      .replace(/[۰-۹]/g, digit => String(PERSIAN_DIGITS.indexOf(digit)))
      .replace(/[٠-٩]/g, digit => String(ARABIC_DIGITS.indexOf(digit)));
    if (!/^\d+$/.test(normalizedOrder)) return { error: 'ترتیب نمایش باید یک عدد صحیح نامنفی باشد.' };
    const displayOrder = Number(normalizedOrder);
    if (!Number.isSafeInteger(displayOrder)) return { error: 'ترتیب نمایش معتبر نیست.' };
    return { value: { question, answer, displayOrder } };
  }
}

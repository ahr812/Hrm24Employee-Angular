import { Injectable, computed, signal } from '@angular/core';
import { Fish24RoleId } from '../models/fish24-role.model';

export interface Fish24NewsCategory {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly shortDescription: string;
  readonly order: number;
  readonly imageUrl: string;
  readonly imageAlt: string;
  readonly imageTitle: string;
  readonly keywords: string;
  readonly metaDescription: string;
  readonly active: boolean;
}

export interface Fish24NewsItem {
  readonly id: number;
  readonly createdAt: string;
  readonly title: string;
  readonly slug: string;
  readonly shortDescription: string;
  readonly contentHtml: string;
  readonly categoryIds: readonly number[];
  readonly mainImageUrl: string;
  readonly imageAlt: string;
  readonly imageTitle: string;
  readonly keywords: string;
  readonly metaDescription: string;
  readonly order: number;
  readonly active: boolean;
  readonly commentCount: number;
  readonly likeCount: number;
  readonly viewCount: number;
}

export type NewsMutationResult<T = void> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string };
type Mutable<T> = { -readonly [Key in keyof T]: T[Key] };
export type CategoryDraft = Mutable<Omit<Fish24NewsCategory, 'id'>>;
export type NewsDraft = Mutable<Omit<Fish24NewsItem, 'id' | 'createdAt' | 'commentCount' | 'likeCount' | 'viewCount'>>;

const INTERNAL_ROLES: readonly Fish24RoleId[] = ['super-admin', 'sales-expert', 'support-expert'];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable({ providedIn: 'root' })
export class Fish24NewsPreviewService {
  private nextCategoryId = 10;
  private nextNewsId = 500;
  private readonly categoryState = signal<readonly Fish24NewsCategory[]>([
    { id: 1, name: 'اخبار عمومی', slug: 'اخبار-عمومی', shortDescription: 'اطلاعیه‌ها و خبرهای عمومی سامانه', order: 0, imageUrl: '/images/dashboard-mockup.png', imageAlt: 'اخبار عمومی', imageTitle: 'اخبار عمومی', keywords: 'اخبار, عمومی', metaDescription: 'خبرهای عمومی Fish24', active: true },
    { id: 2, name: 'حقوق و دستمزد', slug: 'حقوق-و-دستمزد', shortDescription: 'خبرهای حوزه حقوق و مزایا', order: 1, imageUrl: '/images/logo.png', imageAlt: 'حقوق و دستمزد', imageTitle: 'حقوق و دستمزد', keywords: 'حقوق, دستمزد', metaDescription: 'خبرهای حقوق و دستمزد', active: true },
    { id: 3, name: 'آرشیو بخشنامه‌ها', slug: 'archive-circulars', shortDescription: 'دسته غیرفعال نمایشی با رابطه موجود', order: 2, imageUrl: '', imageAlt: '', imageTitle: '', keywords: 'آرشیو', metaDescription: '', active: false },
    { id: 4, name: 'دسته آماده انتشار', slug: 'ready-to-publish', shortDescription: 'دسته خالی نمایشی', order: 3, imageUrl: '', imageAlt: '', imageTitle: '', keywords: '', metaDescription: '', active: true }
  ]);
  private readonly newsState = signal<readonly Fish24NewsItem[]>([
    { id: 401, createdAt: '1405/06/28', title: 'راهنمای استفاده از خدمات جدید Fish24', slug: 'راهنمای-خدمات-جدید-fish24', shortDescription: 'مروری کوتاه بر امکانات تازه پنل', contentHtml: '<h2>امکانات تازه</h2><p>در این نسخه، <strong>مدیریت اسناد</strong> و گزارش‌ها ساده‌تر شده است.</p><blockquote>این رکورد فقط داده نمایشی پیش‌نمایش است.</blockquote>', categoryIds: [1, 2], mainImageUrl: '/images/dashboard-mockup.png', imageAlt: 'نمای پنل Fish24', imageTitle: 'خدمات جدید Fish24', keywords: 'Fish24, خدمات', metaDescription: 'معرفی قابلیت‌های تازه سامانه', order: 0, active: true, commentCount: 3, likeCount: 12, viewCount: 248 },
    { id: 402, createdAt: '1405/06/20', title: 'بخشنامه نمونه محاسبات حقوق', slug: 'sample-payroll-circular', shortDescription: 'نمونه خبر غیرفعال برای بررسی روابط دسته‌بندی', contentHtml: '<h2>بخشنامه نمونه</h2><p>این خبر غیرفعال است و فقط در پیش‌نمایش داخلی دیده می‌شود.</p>', categoryIds: [2, 3], mainImageUrl: '/images/logo.png', imageAlt: 'نشان Fish24', imageTitle: 'بخشنامه نمونه', keywords: 'بخشنامه, حقوق', metaDescription: 'بخشنامه نمایشی', order: 1, active: false, commentCount: 0, likeCount: 4, viewCount: 91 }
  ]);

  readonly categories = computed(() => this.stableOrder(this.categoryState()));
  readonly news = computed(() => this.stableOrder(this.newsState()));
  readonly activeCategories = computed(() => this.categories().filter(item => item.active));

  canManage(role: Fish24RoleId): boolean { return INTERNAL_ROLES.includes(role); }
  canExport(role: Fish24RoleId): boolean { return role === 'super-admin' || role === 'sales-expert'; }
  category(id: number): Fish24NewsCategory | undefined { return this.categoryState().find(item => item.id === id); }
  newsItem(id: number): Fish24NewsItem | undefined { return this.newsState().find(item => item.id === id); }
  categoryNames(ids: readonly number[]): readonly string[] { return ids.map(id => this.category(id)?.name).filter((name): name is string => Boolean(name)); }
  categoryNewsCount(id: number): number { return this.newsState().filter(item => item.categoryIds.includes(id)).length; }

  normalizeSlug(value: string): string {
    return value.trim().toLocaleLowerCase('fa-IR').replace(/ي/g, 'ی').replace(/ك/g, 'ک')
      .replace(/[\s_]+/g, '-').replace(/[^a-z0-9\u0600-\u06ff-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  createCategory(role: Fish24RoleId, draft: CategoryDraft): NewsMutationResult<Fish24NewsCategory> {
    if (!this.canManage(role)) return this.failure('مجوز مدیریت دسته‌بندی اخبار را ندارید.');
    const validated = this.validateCategory(draft);
    if (!validated.ok) return validated;
    const item: Fish24NewsCategory = { ...validated.value, id: this.nextCategoryId++ };
    this.categoryState.update(items => [...items, item]);
    return { ok: true, value: item };
  }

  updateCategory(role: Fish24RoleId, id: number, draft: CategoryDraft): NewsMutationResult<Fish24NewsCategory> {
    if (!this.canManage(role)) return this.failure('مجوز مدیریت دسته‌بندی اخبار را ندارید.');
    if (!this.category(id)) return this.failure('دسته‌بندی یافت نشد.');
    const validated = this.validateCategory(draft, id);
    if (!validated.ok) return validated;
    const item = { ...validated.value, id };
    this.categoryState.update(items => items.map(current => current.id === id ? item : current));
    return { ok: true, value: item };
  }

  toggleCategory(role: Fish24RoleId, id: number): NewsMutationResult<Fish24NewsCategory> {
    if (!this.canManage(role)) return this.failure('مجوز تغییر وضعیت دسته‌بندی را ندارید.');
    const current = this.category(id);
    if (!current) return this.failure('دسته‌بندی یافت نشد.');
    const item = { ...current, active: !current.active };
    this.categoryState.update(items => items.map(candidate => candidate.id === id ? item : candidate));
    return { ok: true, value: item };
  }

  deleteCategory(role: Fish24RoleId, id: number): NewsMutationResult<void> {
    if (!this.canManage(role)) return this.failure('مجوز حذف دسته‌بندی را ندارید.');
    if (!this.category(id)) return this.failure('دسته‌بندی یافت نشد.');
    if (this.categoryNewsCount(id) > 0) return this.failure('این دسته‌بندی به خبر فعال یا غیرفعال متصل است و قابل حذف نیست.');
    this.categoryState.update(items => items.filter(item => item.id !== id));
    return { ok: true, value: undefined };
  }

  createNews(role: Fish24RoleId, draft: NewsDraft): NewsMutationResult<Fish24NewsItem> {
    if (!this.canManage(role)) return this.failure('مجوز ایجاد خبر را ندارید.');
    const validated = this.validateNews(draft);
    if (!validated.ok) return validated;
    const item: Fish24NewsItem = { ...validated.value, id: this.nextNewsId++, createdAt: this.todayJalali(), commentCount: 0, likeCount: 0, viewCount: 0 };
    this.newsState.update(items => [...items, item]);
    return { ok: true, value: item };
  }

  updateNews(role: Fish24RoleId, id: number, draft: NewsDraft): NewsMutationResult<Fish24NewsItem> {
    if (!this.canManage(role)) return this.failure('مجوز ویرایش خبر را ندارید.');
    const current = this.newsItem(id);
    if (!current) return this.failure('خبر یافت نشد.');
    const validated = this.validateNews(draft, id, current.categoryIds);
    if (!validated.ok) return validated;
    const item: Fish24NewsItem = { ...current, ...validated.value, id };
    this.newsState.update(items => items.map(candidate => candidate.id === id ? item : candidate));
    return { ok: true, value: item };
  }

  toggleNews(role: Fish24RoleId, id: number): NewsMutationResult<Fish24NewsItem> {
    if (!this.canManage(role)) return this.failure('مجوز تغییر وضعیت خبر را ندارید.');
    const current = this.newsItem(id);
    if (!current) return this.failure('خبر یافت نشد.');
    const item = { ...current, active: !current.active };
    this.newsState.update(items => items.map(candidate => candidate.id === id ? item : candidate));
    return { ok: true, value: item };
  }

  deleteNews(role: Fish24RoleId, id: number): NewsMutationResult<void> {
    if (!this.canManage(role)) return this.failure('مجوز حذف خبر را ندارید.');
    if (!this.newsItem(id)) return this.failure('خبر یافت نشد.');
    this.newsState.update(items => items.filter(item => item.id !== id));
    return { ok: true, value: undefined };
  }

  validateImage(file: File): string | null {
    if (!IMAGE_TYPES.has(file.type)) return 'فقط تصویر JPG، PNG یا WebP مجاز است.';
    if (file.size > IMAGE_MAX_BYTES) return 'حجم تصویر نباید بیشتر از ۵ مگابایت باشد.';
    return null;
  }

  sanitizeHtml(html: string): string {
    if (typeof DOMParser === 'undefined') return html;
    const documentNode = new DOMParser().parseFromString(html, 'text/html');
    documentNode.querySelectorAll('script,style,iframe,object,embed,form,input,button').forEach(node => node.remove());
    documentNode.body.querySelectorAll('*').forEach(element => {
      for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        if (name === 'style') {
          const textAlign = attribute.value.match(/(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*(?:;|$)/i);
          if (textAlign) element.setAttribute('style', `text-align: ${textAlign[1].toLowerCase()}`);
          else element.removeAttribute(attribute.name);
          continue;
        }
        if (name.startsWith('on') || (['href', 'src'].includes(name) && /^(javascript|vbscript):/.test(value))) element.removeAttribute(attribute.name);
      }
    });
    return documentNode.body.innerHTML;
  }

  contentText(html: string): string {
    if (typeof DOMParser === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return (new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '').replace(/\u00a0/g, ' ').trim();
  }

  private validateCategory(draft: CategoryDraft, currentId?: number): NewsMutationResult<CategoryDraft> {
    const name = draft.name.trim();
    const slug = this.normalizeSlug(draft.slug);
    if (!name) return this.failure('نام دسته‌بندی الزامی است.');
    if (!slug) return this.failure('اسلاگ معتبر الزامی است.');
    if (!Number.isInteger(draft.order) || draft.order < 0) return this.failure('ترتیب باید عدد صحیح نامنفی باشد.');
    if (this.categoryState().some(item => item.id !== currentId && this.normalizeSlug(item.slug) === slug)) return this.failure('این اسلاگ دسته‌بندی قبلاً ثبت شده است.');
    return { ok: true, value: { ...draft, name, slug, shortDescription: draft.shortDescription.trim(), imageAlt: draft.imageAlt.trim(), imageTitle: draft.imageTitle.trim(), keywords: draft.keywords.trim(), metaDescription: draft.metaDescription.trim() } };
  }

  private validateNews(draft: NewsDraft, currentId?: number, previousCategoryIds: readonly number[] = []): NewsMutationResult<NewsDraft> {
    const title = draft.title.trim();
    const slug = this.normalizeSlug(draft.slug);
    const shortDescription = draft.shortDescription.trim();
    const categoryIds = Array.from(new Set(draft.categoryIds)).filter(id => this.category(id));
    if (!title) return this.failure('عنوان خبر الزامی است.');
    if (!slug) return this.failure('اسلاگ معتبر الزامی است.');
    if (!shortDescription) return this.failure('توضیحات کوتاه الزامی است.');
    if (!categoryIds.length) return this.failure('حداقل یک دسته‌بندی انتخاب کنید.');
    if (!Number.isInteger(draft.order) || draft.order < 0) return this.failure('ترتیب باید عدد صحیح نامنفی باشد.');
    if (this.newsState().some(item => item.id !== currentId && this.normalizeSlug(item.slug) === slug)) return this.failure('این اسلاگ خبر قبلاً ثبت شده است.');
    const newlyInactive = categoryIds.find(id => !this.category(id)?.active && !previousCategoryIds.includes(id));
    if (newlyInactive) return this.failure('دسته‌بندی غیرفعال را نمی‌توان به خبر اضافه کرد.');
    const contentHtml = this.sanitizeHtml(draft.contentHtml);
    if (!this.contentText(contentHtml)) return this.failure('محتوای متنی خبر الزامی است.');
    return { ok: true, value: { ...draft, title, slug, shortDescription, contentHtml, categoryIds, imageAlt: draft.imageAlt.trim(), imageTitle: draft.imageTitle.trim(), keywords: draft.keywords.trim(), metaDescription: draft.metaDescription.trim() } };
  }

  private stableOrder<T extends { readonly order: number; readonly id: number }>(items: readonly T[]): readonly T[] { return [...items].sort((a, b) => a.order - b.order || a.id - b.id); }
  private failure<T>(error: string): NewsMutationResult<T> { return { ok: false, error }; }
  private todayJalali(): string { return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replace(/\u200e/g, '').replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))); }
}

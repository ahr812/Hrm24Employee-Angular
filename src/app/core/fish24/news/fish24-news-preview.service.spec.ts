import { TestBed } from '@angular/core/testing';
import { Fish24NewsPreviewService, NewsDraft } from './fish24-news-preview.service';

describe('Fish24NewsPreviewService', () => {
  let service: Fish24NewsPreviewService;
  beforeEach(() => { TestBed.configureTestingModule({}); service = TestBed.inject(Fish24NewsPreviewService); });
  const newsDraft = (overrides: Partial<NewsDraft> = {}): NewsDraft => ({ title: 'خبر آزمایشی', slug: 'خبر-آزمایشی', shortDescription: 'توضیح کوتاه', contentHtml: '<h2>عنوان</h2><p><strong>متن فارسی</strong> and English ۱۲۳</p>', categoryIds: [1, 2], mainImageUrl: '', imageAlt: '', imageTitle: '', keywords: '', metaDescription: '', order: 0, active: true, ...overrides });

  it('derives distinct multi-category counts and propagates category renames', () => {
    expect(service.categoryNewsCount(2)).toBe(2);
    const current = service.category(2)!;
    const result = service.updateCategory('super-admin', 2, { ...current, name: 'حقوق و مزایای جدید' });
    expect(result.ok).toBeTrue();
    expect(service.categoryNames(service.newsItem(401)!.categoryIds)).toContain('حقوق و مزایای جدید');
    expect(service.categoryNewsCount(2)).toBe(2);
  });

  it('blocks deletion for categories linked to active or inactive news and deletes empty categories', () => {
    expect(service.deleteCategory('sales-expert', 1).ok).toBeFalse();
    expect(service.deleteCategory('sales-expert', 3).ok).toBeFalse();
    expect(service.deleteCategory('support-expert', 4).ok).toBeTrue();
    expect(service.category(4)).toBeUndefined();
  });

  it('keeps relationships when a category is deactivated and blocks new inactive assignment', () => {
    expect(service.toggleCategory('support-expert', 2).ok).toBeTrue();
    expect(service.newsItem(401)!.categoryIds).toContain(2);
    const create = service.createNews('super-admin', newsDraft({ slug: 'inactive-new', categoryIds: [2] }));
    expect(create.ok).toBeFalse();
  });

  it('preserves an existing inactive relationship across unrelated edits but allows explicit removal', () => {
    const current = service.newsItem(402)!;
    const keep = service.updateNews('sales-expert', current.id, { ...current, title: 'عنوان ویرایش‌شده' });
    expect(keep.ok).toBeTrue();
    expect(service.newsItem(402)!.categoryIds).toContain(3);
    const remove = service.updateNews('sales-expert', current.id, { ...service.newsItem(402)!, categoryIds: [2] });
    expect(remove.ok).toBeTrue();
    expect(service.newsItem(402)!.categoryIds).not.toContain(3);
  });

  it('normalizes Persian and Latin slugs and rejects normalized duplicates', () => {
    expect(service.normalizeSlug('  خبر  جدید _ Fish24! ')).toBe('خبر-جدید-fish24');
    const first = service.createNews('super-admin', newsDraft({ slug: 'Mixed Slug' }));
    expect(first.ok).toBeTrue();
    expect(service.createNews('super-admin', newsDraft({ title: 'دوم', slug: 'mixed---slug' })).ok).toBeFalse();
  });

  it('keeps a manually supplied slug when the title changes', () => {
    const item = service.createNews('super-admin', newsDraft({ slug: 'manual-slug' }));
    expect(item.ok).toBeTrue();
    if (!item.ok) return;
    expect(service.updateNews('super-admin', item.value.id, { ...item.value, title: 'عنوان تازه', slug: item.value.slug }).ok).toBeTrue();
    expect(service.newsItem(item.value.id)!.slug).toBe('manual-slug');
  });

  it('creates news active by default through the form contract and removes relationships on deletion', () => {
    const result = service.createNews('support-expert', newsDraft());
    expect(result.ok).toBeTrue();
    if (!result.ok) return;
    expect(result.value.active).toBeTrue();
    expect(service.categoryNewsCount(1)).toBe(2);
    expect(service.deleteNews('support-expert', result.value.id).ok).toBeTrue();
    expect(service.categoryNewsCount(1)).toBe(1);
    expect(service.newsItem(result.value.id)).toBeUndefined();
  });

  it('derives approved-only comment counts and cascades comments on news deletion', () => {
    expect(service.approvedCommentCount(401)).toBe(2);
    expect(service.approvedCommentCount(402)).toBe(0);
    expect(service.deleteNews('super-admin', 401).ok).toBeTrue();
    expect(service.approvedCommentCount(401)).toBe(0);
  });

  it('sanitizes executable markup and unsafe URLs while preserving supported structure', () => {
    const html = service.sanitizeHtml('<h2>تیتر</h2><p onclick="evil()" style="color: red; text-align: center">متن</p><script>alert(1)</script><a href="javascript:alert(1)">پیوند</a><table><tr><td>سلول</td></tr></table>');
    expect(html).toContain('<h2>تیتر</h2>');
    expect(html).toContain('<table>');
    expect(html).not.toContain('script');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('color: red');
    expect(html).toContain('style="text-align: center"');
  });

  it('rejects empty editor markup, bad order, and invalid images', () => {
    expect(service.createNews('super-admin', newsDraft({ slug: 'empty', contentHtml: '<p> &nbsp; </p>' })).ok).toBeFalse();
    expect(service.createNews('super-admin', newsDraft({ slug: 'order', order: -1 })).ok).toBeFalse();
    expect(service.validateImage(new File(['x'], 'x.svg', { type: 'image/svg+xml' }))).toContain('JPG');
    expect(service.validateImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'x.png', { type: 'image/png' }))).toContain('۵ مگابایت');
  });

  it('enforces management and export permissions in service paths', () => {
    expect(service.createNews('employer', newsDraft()).ok).toBeFalse();
    expect(service.canManage('super-admin')).toBeTrue(); expect(service.canManage('sales-expert')).toBeTrue(); expect(service.canManage('support-expert')).toBeTrue();
    expect(service.canExport('super-admin')).toBeTrue(); expect(service.canExport('sales-expert')).toBeTrue(); expect(service.canExport('support-expert')).toBeFalse();
  });
});

import { TestBed } from '@angular/core/testing';
import { Fish24NewsCommentPreviewService } from './fish24-news-comment-preview.service';

describe('Fish24NewsCommentPreviewService', () => {
  let service: Fish24NewsCommentPreviewService;
  beforeEach(() => { TestBed.configureTestingModule({}); service = TestBed.inject(Fish24NewsCommentPreviewService); });

  it('enforces internal management and Support export restrictions', () => {
    for (const role of ['super-admin', 'sales-expert', 'support-expert'] as const) expect(service.canManage(role)).toBeTrue();
    expect(service.canManage('employer')).toBeFalse();
    expect(service.setApproval('employee', 7003, true).ok).toBeFalse();
    expect(service.canExport('super-admin')).toBeTrue();
    expect(service.canExport('sales-expert')).toBeTrue();
    expect(service.canExport('support-expert')).toBeFalse();
  });

  it('approves, unapproves and reapproves without deleting a preserved response', () => {
    expect(service.approvedCount(401)).toBe(2);
    expect(service.setApproval('support-expert', 7002, false).ok).toBeTrue();
    expect(service.approvedCount(401)).toBe(1);
    expect(service.approvedForNews(401).some(item => item.id === 7002)).toBeFalse();
    expect(service.comment(7002)?.response).toContain('نمایش موبایل');
    expect(service.setApproval('sales-expert', 7002, true).ok).toBeTrue();
    expect(service.approvedCount(401)).toBe(2);
    expect(service.approvedForNews(401).find(item => item.id === 7002)?.response).toContain('نمایش موبایل');
  });

  it('permits one response only on approved comments and replaces it on edit', () => {
    const original = service.comment(7001)!;
    expect(service.saveResponse('super-admin', original.id, '   ', 'مدیر').ok).toBeFalse();
    expect(service.comment(original.id)).toEqual(original);
    expect(service.saveResponse('super-admin', 7003, 'پاسخ', 'مدیر').ok).toBeFalse();
    expect(service.saveResponse('super-admin', original.id, 'پاسخ اول', 'مدیر').ok).toBeTrue();
    expect(service.saveResponse('super-admin', original.id, 'پاسخ جایگزین', 'مدیر').ok).toBeTrue();
    expect(service.comment(original.id)?.response).toBe('پاسخ جایگزین');
    expect(service.comment(original.id)?.response).not.toContain('پاسخ اول');
    expect(service.comment(original.id)?.approved).toBeTrue();
    expect(service.approvedCount(401)).toBe(2);
  });

  it('keeps formula-looking and markup-looking user content as literal plain text', () => {
    const text = service.comment(7003)?.message ?? '';
    expect(text.startsWith('=HYPERLINK')).toBeTrue();
    expect(text).toContain('https://example.invalid');
  });

  it('cascades preview comments only when their owning news is removed', () => {
    service.removeForNews(401);
    expect(service.comments().some(item => item.newsId === 401)).toBeFalse();
    expect(service.comments().some(item => item.newsId === 402)).toBeTrue();
  });
});

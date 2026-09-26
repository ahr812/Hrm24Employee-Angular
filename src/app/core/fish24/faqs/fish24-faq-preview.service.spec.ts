import { TestBed } from '@angular/core/testing';
import { Fish24FaqPreviewService } from './fish24-faq-preview.service';

describe('Fish24FaqPreviewService', () => {
  let service: Fish24FaqPreviewService;
  beforeEach(() => { TestBed.configureTestingModule({}); service = TestBed.inject(Fish24FaqPreviewService); });

  it('enforces management and Excel permissions by service action', () => {
    for (const role of ['super-admin', 'sales-expert', 'support-expert'] as const) expect(service.canManage(role)).toBeTrue();
    expect(service.canManage('employer')).toBeFalse();
    expect(service.create('employee', { question: 'سؤال', answer: 'پاسخ', displayOrder: 0 }).ok).toBeFalse();
    expect(service.canExport('super-admin')).toBeTrue();
    expect(service.canExport('sales-expert')).toBeTrue();
    expect(service.canExport('support-expert')).toBeFalse();
  });

  it('creates active records and accepts Persian or Latin nonnegative integers', () => {
    expect(service.create('support-expert', { question: ' سؤال تازه ', answer: ' خط اول\nخط دوم ', displayOrder: '۰۳' }).ok).toBeTrue();
    const created = service.faqs().find(item => item.question === 'سؤال تازه')!;
    expect(created.answer).toBe('خط اول\nخط دوم');
    expect(created.displayOrder).toBe(3);
    expect(created.active).toBeTrue();
  });

  it('rejects empty text and invalid order without mutating data', () => {
    const original = service.faqs();
    for (const displayOrder of ['-1', '1.2', 'abc']) expect(service.create('super-admin', { question: 'سؤال', answer: 'پاسخ', displayOrder }).ok).toBeFalse();
    expect(service.create('super-admin', { question: '   ', answer: 'پاسخ', displayOrder: 0 }).ok).toBeFalse();
    expect(service.create('super-admin', { question: 'سؤال', answer: '   ', displayOrder: 0 }).ok).toBeFalse();
    expect(service.faqs()).toEqual(original);
  });

  it('keeps stable identity and status on edit and orders by display order then id', () => {
    const original = service.faqs().find(item => item.id === 3)!;
    expect(original.active).toBeFalse();
    expect(service.update('sales-expert', 3, { question: 'ویرایش', answer: 'پاسخ', displayOrder: 0 }).ok).toBeTrue();
    const updated = service.faqs().find(item => item.id === 3)!;
    expect(updated.active).toBeFalse();
    expect(updated.id).toBe(3);
    expect(service.faqs().map(item => item.id).slice(0, 2)).toEqual([1, 3]);
  });

  it('toggles and deletes deterministically while preserving literal fixture text', () => {
    expect(service.faqs().find(item => item.id === 4)?.answer).toContain('=SUM(1,2)');
    expect(service.faqs().find(item => item.id === 4)?.answer).toContain('<b>HTML اجرا نمی‌شود</b>');
    expect(service.toggleActive('support-expert', 1).ok).toBeTrue();
    expect(service.faqs().find(item => item.id === 1)?.active).toBeFalse();
    expect(service.delete('super-admin', 1).ok).toBeTrue();
    expect(service.faqs().some(item => item.id === 1)).toBeFalse();
  });
});

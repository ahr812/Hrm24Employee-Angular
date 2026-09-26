import { FISH24_ADMIN_NAV_CONFIG } from './fish24-nav.config';
import { ROLE_CAPABILITIES } from '../../../core/fish24/permissions/role-capabilities';

describe('Fish24 internal ticket navigation', () => {
  const internalRoles = ['super-admin', 'sales-expert', 'support-expert'] as const;

  it('keeps the ticket and SMS routes together under the requested menu label', () => {
    const group = FISH24_ADMIN_NAV_CONFIG.find(item => item.id === 'fish24-admin-tickets');

    expect(group?.label).toBe('تیکت و پیام');
    expect(group?.children?.map(item => [item.label, item.route])).toEqual([
      ['لیست تیکت‌ها', '/fish24/internal/tickets'],
      ['لیست پیامک‌ها', '/fish24/internal/sms-history']
    ]);
  });

  it('makes the group and both children available to every internal role', () => {
    const group = FISH24_ADMIN_NAV_CONFIG.find(item => item.id === 'fish24-admin-tickets')!;

    for (const role of internalRoles) {
      const capabilities: readonly string[] = ROLE_CAPABILITIES[role];
      expect(capabilities).toContain(group.permission!);
      for (const child of group.children ?? []) {
        expect(capabilities).toContain(child.permission!);
      }
    }
  });
});

describe('Fish24 FAQ navigation', () => {
  it('places FAQ management under site settings for every internal role', () => {
    const group = FISH24_ADMIN_NAV_CONFIG.find(item => item.id === 'fish24-admin-settings')!;
    const faq = group.children?.find(item => item.id === 'fish24-admin-settings-faqs');
    expect(group.label).toBe('تنظیمات سایت');
    expect(faq?.label).toBe('سؤالات متداول');
    expect(faq?.route).toBe('/fish24/internal/faqs');
    for (const role of ['super-admin', 'sales-expert', 'support-expert'] as const) {
      const capabilities: readonly string[] = ROLE_CAPABILITIES[role];
      expect(capabilities).toContain(group.permission!);
      expect(capabilities).toContain(faq?.permission!);
    }
  });
});

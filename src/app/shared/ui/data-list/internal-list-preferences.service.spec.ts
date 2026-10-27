import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../core/auth/auth.service';
import { InternalListPreferencesService } from './internal-list-preferences.service';

describe('InternalListPreferencesService financial dashboard preferences', () => {
  const currentUser = signal<{ id: string; mobile: string } | null>({ id: 'admin-a', mobile: '09120000001' });
  let service: InternalListPreferencesService;

  beforeEach(() => {
    localStorage.clear();
    currentUser.set({ id: 'admin-a', mobile: '09120000001' });
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: { currentUser } }] });
    service = TestBed.inject(InternalListPreferencesService);
  });

  afterEach(() => localStorage.clear());

  it('keeps independently validated financial controls scoped to each user', () => {
    const defaults = { invoiceCountPeriod: 'month', invoiceAmountPeriod: 'month', paidDistributionYear: 1405, formalInvoiceYear: 1405 };
    const saved = { ...defaults, invoiceCountPeriod: 'week', formalInvoiceYear: 1404 };
    const validate = (value: unknown) => typeof value === 'object' && value !== null ? value as typeof defaults : null;
    service.saveFilters('internal-financial-reports-dashboard', saved);
    expect(service.loadFilters('internal-financial-reports-dashboard', defaults, validate)).toEqual(saved);
    currentUser.set({ id: 'sales-b', mobile: '09120000002' });
    expect(service.loadFilters('internal-financial-reports-dashboard', defaults, validate)).toEqual(defaults);
    currentUser.set({ id: 'admin-a', mobile: '09120000001' });
    expect(service.loadFilters('internal-financial-reports-dashboard', defaults, validate)).toEqual(saved);
  });

  it('ignores malformed stored filter payloads', () => {
    const defaults = { invoiceCountPeriod: 'month' };
    localStorage.setItem(service.filterStorageKeyFor('internal-financial-reports-dashboard'), '{broken');
    expect(service.loadFilters('internal-financial-reports-dashboard', defaults, () => null)).toEqual(defaults);
  });
});

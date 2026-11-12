import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { InternalSubscribersComponent } from './internal-subscribers.component';
import { BusinessUserPreviewService } from '../users/business-user-preview.service';
import { Fish24RolePreviewService } from '../../../../core/fish24/dev/fish24-role-preview.service';
import { subscriberManagementGuard } from '../../../../core/fish24/permissions/subscriber-management.guard';
import { InternalListPreferencesService } from '../../../../shared/ui/data-list/internal-list-preferences.service';
import { PlainXlsxService } from '../../../../shared/ui/data-list/plain-xlsx.service';
import { FISH24_ADMIN_NAV_CONFIG } from '../../../../shared/layout/navigation/fish24-nav.config';

describe('Internal subscribers integration', () => {
  let component: InternalSubscribersComponent;
  let users: BusinessUserPreviewService;
  let roles: Fish24RolePreviewService;
  let exportSpy: jasmine.Spy;
  beforeEach(() => {
    exportSpy = jasmine.createSpy('export');
    TestBed.configureTestingModule({ providers: [
      { provide: PlainXlsxService, useValue: { export: exportSpy } },
      { provide: InternalListPreferencesService, useValue: {
        load: (_: string, ids: string[]) => ids,
        save: (_: string, ids: string[]) => ids,
        reset: (_: string, ids: string[]) => ids
      } }
    ] });
    users = TestBed.inject(BusinessUserPreviewService);
    roles = TestBed.inject(Fish24RolePreviewService);
    component = TestBed.createComponent(InternalSubscribersComponent).componentInstance;
  });

  it('derives membership and edited values from the shared user source without changing users', () => {
    expect(component.subscribers()).toEqual([]);
    users.updateUser(1001, { newsletterEmail: true });
    users.updateUser(1007, { newsletterEmail: true });
    expect(component.subscribers().map(user => user.id)).toEqual([1001, 1007]);
    expect(component.subscribers()[1].isActive).toBeFalse();
    expect(component.subscribers()[1].email).toBe('');
    users.updateUser(1001, { fullName: 'نام جدید', email: '=literal@example.test' });
    expect(component.subscribers()[0].fullName).toBe('نام جدید');
    users.updateUser(1001, { newsletterEmail: false });
    expect(component.subscribers().map(user => user.id)).toEqual([1007]);
  });

  it('exports selected columns for all subscribers in source order despite header search, sorting and pagination', () => {
    users.updateUser(1001, { newsletterEmail: true });
    users.updateUser(1002, { newsletterEmail: true });
    component.selectedColumns.set(['mobile', 'email']);
    component.searches.set({ mobile: 'NO-MATCH' });
    component.sort('mobile'); component.sort('mobile'); component.page.set(8);
    expect(component.pageRows()).toEqual([]);
    component.exportRows();
    expect(exportSpy).toHaveBeenCalledOnceWith('fish24-subscribers.xlsx', ['موبایل', 'ایمیل'], [
      ['09121234567', 'maryam@example.test'], ['09129876543', 'reza@example.test']
    ]);
  });

  it('combines header searches, normalizes Persian digits and keeps three-state sorting', () => {
    users.updateUser(1001, { newsletterEmail: true }); users.updateUser(1002, { newsletterEmail: true });
    component.searches.set({ mobile: '۰۹۱۲', email: 'maryam' });
    expect(component.tableRows().map(user => user.id)).toEqual([1001]);
    component.sort('mobile'); expect(component.tableSort().direction).toBe('asc');
    component.sort('mobile'); expect(component.tableSort().direction).toBe('desc');
    component.sort('mobile'); expect(component.tableSort().direction).toBeNull();
  });

  it('blocks unsupported exports and external roles even when the export method is called directly', () => {
    for (const role of ['super-admin', 'sales-expert', 'support-expert', 'employer', 'employee'] as const) {
      roles.setPreviewRole(role); exportSpy.calls.reset(); component.exportRows();
      expect(exportSpy.calls.count()).toBe(role === 'super-admin' || role === 'sales-expert' ? 1 : 0);
      expect(component.canView()).toBe(!['employer', 'employee'].includes(role));
    }
  });

  it('keeps one visible column and clamps pages after live unsubscription', () => {
    component.selectedColumns.set(['name']);
    component.toggleColumn('name', { target: { checked: false } } as unknown as Event);
    expect(component.selectedColumns()).toEqual(['name']);
    component.page.set(9); expect(component.currentPage()).toBe(1);
  });

  it('renders exactly the approved columns without mutation or messaging actions', () => {
    const fixture = TestBed.createComponent(InternalSubscribersComponent); fixture.detectChanges();
    expect(Array.from(fixture.nativeElement.querySelectorAll('th')).length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('مشترکی ثبت نشده است.');
    expect(fixture.nativeElement.textContent).not.toContain('عملیات');
    expect(FISH24_ADMIN_NAV_CONFIG.find(item => item.id === 'fish24-admin-subscribers')?.route).toBe('/fish24/internal/subscribers');
  });

  it('guards the route for all internal roles and rejects employer and employee', () => {
    const router = TestBed.inject(Router);
    for (const role of ['super-admin', 'sales-expert', 'support-expert', 'employer', 'employee'] as const) {
      roles.setPreviewRole(role);
      const result = TestBed.runInInjectionContext(() => subscriberManagementGuard({} as never, {} as never));
      if (role === 'employer' || role === 'employee') expect(result).toEqual(router.createUrlTree(['/dashboard']));
      else expect(result).toBeTrue();
    }
  });
});

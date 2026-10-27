import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { Fish24RolePreviewService } from '../dev/fish24-role-preview.service';
import { financialReportsGuard } from './financial-reports.guard';

describe('financialReportsGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  function evaluate(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() => financialReportsGuard({} as never, {} as never)) as boolean | UrlTree;
  }

  it('allows Administrator and Sales', () => {
    const roles = TestBed.inject(Fish24RolePreviewService);
    roles.setPreviewRole('super-admin');
    expect(evaluate()).toBeTrue();
    roles.setPreviewRole('sales-expert');
    expect(evaluate()).toBeTrue();
  });

  it('denies Support with a dashboard redirect', () => {
    TestBed.inject(Fish24RolePreviewService).setPreviewRole('support-expert');
    expect(TestBed.inject(Router).serializeUrl(evaluate() as UrlTree)).toBe('/dashboard');
  });
});

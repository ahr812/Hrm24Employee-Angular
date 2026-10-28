import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { Fish24RolePreviewService } from '../dev/fish24-role-preview.service';
import { ticketReportsGuard } from './ticket-reports.guard';

describe('ticketReportsGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));
  const evaluate = () => TestBed.runInInjectionContext(() => ticketReportsGuard({} as never, {} as never)) as boolean | UrlTree;
  it('allows Administrator, Sales and Support', () => { const roles=TestBed.inject(Fish24RolePreviewService); for(const role of ['super-admin','sales-expert','support-expert'] as const){ roles.setPreviewRole(role); expect(evaluate()).toBeTrue(); } });
  it('denies employer and employee roles', () => { const roles=TestBed.inject(Fish24RolePreviewService); for(const role of ['employer','employee'] as const){ roles.setPreviewRole(role); expect(TestBed.inject(Router).serializeUrl(evaluate() as UrlTree)).toBe('/dashboard'); } });
});

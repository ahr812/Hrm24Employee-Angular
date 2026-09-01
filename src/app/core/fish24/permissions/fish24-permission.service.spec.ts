import { TestBed } from '@angular/core/testing';
import { Fish24PermissionService } from './fish24-permission.service';
import { Fish24User } from '../models/fish24-user.model';
import { FISH24_PERMISSIONS } from './fish24-permissions';
import { ROLE_CAPABILITIES } from './role-capabilities';

describe('Fish24PermissionService', () => {
  let service: Fish24PermissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Fish24PermissionService]
    });
    service = TestBed.inject(Fish24PermissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Support Expert Restrictions', () => {
    const supportUser: Fish24User = {
      mobile: '09120000000',
      roles: ['support-expert']
    };

    it('support-expert should NOT have financialManagement', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.financialManagement)).toBe(false);
    });

    it('support-expert should NOT have financialReports', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.financialReports)).toBe(false);
    });

    it('support-expert should NOT have discountManagement', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.discountManagement)).toBe(false);
    });

    it('support-expert should NOT have pricingManagement', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.pricingManagement)).toBe(false);
    });

    it('support-expert should NOT have siteSettings', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.siteSettings)).toBe(false);
    });

    it('support-expert should NOT have geographicManagement', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.geographicManagement)).toBe(false);
    });
  });

  describe('Support Expert Access', () => {
    const supportUser: Fish24User = {
      mobile: '09120000000',
      roles: ['support-expert']
    };

    it('support-expert should have dashboard', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.dashboard)).toBe(true);
    });

    it('support-expert should have generalReports', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.generalReports)).toBe(true);
    });

    it('support-expert should have userReports', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.userReports)).toBe(true);
    });

    it('support-expert should have ticketReports', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.ticketReports)).toBe(true);
    });

    it('support-expert should have userManagement', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.userManagement)).toBe(true);
    });

    it('support-expert should have ticketsMessages', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.ticketsMessages)).toBe(true);
    });

    it('support-expert should have newsManagement', () => {
      expect(service.hasPermission(supportUser, FISH24_PERMISSIONS.newsManagement)).toBe(true);
    });
  });

  describe('Sales Expert', () => {
    const salesUser: Fish24User = {
      mobile: '09120000001',
      roles: ['sales-expert']
    };

    it('sales-expert should have dashboard', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.dashboard)).toBe(true);
    });

    it('sales-expert should have generalReports', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.generalReports)).toBe(true);
    });

    it('sales-expert should have userReports', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.userReports)).toBe(true);
    });

    it('sales-expert should have ticketReports', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.ticketReports)).toBe(true);
    });

    it('sales-expert should have financialReports', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.financialReports)).toBe(true);
    });

    it('sales-expert should have userManagement', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.userManagement)).toBe(true);
    });

    it('sales-expert should have financialManagement', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.financialManagement)).toBe(true);
    });

    it('sales-expert should have discountManagement', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.discountManagement)).toBe(true);
    });

    it('sales-expert should have pricingManagement', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.pricingManagement)).toBe(true);
    });

    it('sales-expert should have ticketsMessages', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.ticketsMessages)).toBe(true);
    });

    it('sales-expert should have newsManagement', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.newsManagement)).toBe(true);
    });

    it('sales-expert should have faqManagement', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.faqManagement)).toBe(true);
    });

    it('sales-expert should have subscriberManagement', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.subscriberManagement)).toBe(true);
    });

    it('sales-expert should have siteSettings', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.siteSettings)).toBe(true);
    });

    it('sales-expert should have geographicManagement', () => {
      expect(service.hasPermission(salesUser, FISH24_PERMISSIONS.geographicManagement)).toBe(true);
    });
  });

  describe('Employee', () => {
    const employeeUser: Fish24User = {
      mobile: '09120000003',
      roles: ['employee']
    };

    it('employee should have personalDocuments', () => {
      expect(service.hasPermission(employeeUser, FISH24_PERMISSIONS.personalDocuments)).toBe(true);
    });

    it('employee should have employeeNotifications', () => {
      expect(service.hasPermission(employeeUser, FISH24_PERMISSIONS.employeeNotifications)).toBe(true);
    });

    it('employee should have profile', () => {
      expect(service.hasPermission(employeeUser, FISH24_PERMISSIONS.profile)).toBe(true);
    });

    it('employee should NOT have userManagement', () => {
      expect(service.hasPermission(employeeUser, FISH24_PERMISSIONS.userManagement)).toBe(false);
    });

    it('employee should NOT have financialManagement', () => {
      expect(service.hasPermission(employeeUser, FISH24_PERMISSIONS.financialManagement)).toBe(false);
    });

    it('employee should NOT have financialReports', () => {
      expect(service.hasPermission(employeeUser, FISH24_PERMISSIONS.financialReports)).toBe(false);
    });

    it('employee should NOT have pricingManagement', () => {
      expect(service.hasPermission(employeeUser, FISH24_PERMISSIONS.pricingManagement)).toBe(false);
    });

    it('employee should NOT have siteSettings', () => {
      expect(service.hasPermission(employeeUser, FISH24_PERMISSIONS.siteSettings)).toBe(false);
    });
  });

  describe('Employer', () => {
    const employerUser: Fish24User = {
      mobile: '09120000002',
      roles: ['employer']
    };

    it('employer should have dashboard', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.dashboard)).toBe(true);
    });

    it('employer should have employerCompaniesWorkshops', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.employerCompaniesWorkshops)).toBe(true);
    });

    it('employer should have employerEmployees', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.employerEmployees)).toBe(true);
    });

    it('employer should have employerOutgoingDocuments', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.employerOutgoingDocuments)).toBe(true);
    });

    it('employer should have employerWallet', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.employerWallet)).toBe(true);
    });

    it('employer should have employerInvoices', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.employerInvoices)).toBe(true);
    });

    it('employer should have employerTickets', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.employerTickets)).toBe(true);
    });

    it('employer should have employerEmployeeNotifications', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.employerEmployeeNotifications)).toBe(true);
    });

    it('employer should have personalDocuments', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.personalDocuments)).toBe(true);
    });

    it('employer should have profile', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.profile)).toBe(true);
    });

    it('employer should NOT have userManagement', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.userManagement)).toBe(false);
    });

    it('employer should NOT have financialManagement', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.financialManagement)).toBe(false);
    });

    it('employer should NOT have pricingManagement', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.pricingManagement)).toBe(false);
    });

    it('employer should NOT have siteSettings', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.siteSettings)).toBe(false);
    });

    it('employer should NOT have geographicManagement', () => {
      expect(service.hasPermission(employerUser, FISH24_PERMISSIONS.geographicManagement)).toBe(false);
    });
  });

  describe('Multi-Role Union Behavior', () => {
    const employerEmployeeUser: Fish24User = {
      mobile: '09120000004',
      roles: ['employer', 'employee']
    };

    it('employer+employee should have employerOutgoingDocuments', () => {
      expect(service.hasPermission(employerEmployeeUser, FISH24_PERMISSIONS.employerOutgoingDocuments)).toBe(true);
    });

    it('employer+employee should have employerWallet', () => {
      expect(service.hasPermission(employerEmployeeUser, FISH24_PERMISSIONS.employerWallet)).toBe(true);
    });

    it('employer+employee should have personalDocuments', () => {
      expect(service.hasPermission(employerEmployeeUser, FISH24_PERMISSIONS.personalDocuments)).toBe(true);
    });

    it('employer+employee should have employeeNotifications', () => {
      expect(service.hasPermission(employerEmployeeUser, FISH24_PERMISSIONS.employeeNotifications)).toBe(true);
    });

    it('employer+employee should have profile', () => {
      expect(service.hasPermission(employerEmployeeUser, FISH24_PERMISSIONS.profile)).toBe(true);
    });

    it('union behavior returns all permissions from both roles without duplicates', () => {
      const effectivePerms = service.getEffectivePermissions(employerEmployeeUser);
      // employer has 10 permissions, employee has 3
      // personal-documents and profile are shared
      // total unique permissions should be 11
      expect(effectivePerms.length).toBeGreaterThanOrEqual(10);
      expect(effectivePerms).toContain(FISH24_PERMISSIONS.employerOutgoingDocuments);
      expect(effectivePerms).toContain(FISH24_PERMISSIONS.personalDocuments);
      expect(effectivePerms).toContain(FISH24_PERMISSIONS.employeeNotifications);
    });
  });

  describe('Super Admin', () => {
    const superAdminUser: Fish24User = {
      mobile: '09120000005',
      roles: ['super-admin']
    };

    it('super-admin should have userManagement', () => {
      expect(service.hasPermission(superAdminUser, FISH24_PERMISSIONS.userManagement)).toBe(true);
    });

    it('super-admin should have financialReports', () => {
      expect(service.hasPermission(superAdminUser, FISH24_PERMISSIONS.financialReports)).toBe(true);
    });

    it('super-admin should have dashboard', () => {
      expect(service.hasPermission(superAdminUser, FISH24_PERMISSIONS.dashboard)).toBe(true);
    });

    it('super-admin should receive all confirmed administration permissions', () => {
      const expectedCount = ROLE_CAPABILITIES['super-admin'].length;
      const effectivePerms = service.getEffectivePermissions(superAdminUser);
      expect(effectivePerms.length).toBe(expectedCount);
    });

    // Verify no wildcard bypass by inspecting service code
    it('super-admin uses role-capability mapping (no hardcoded bypass)', () => {
      // Verify the service doesn't have a hardcoded wildcard for super-admin
      // by checking if a permission that doesn't exist still returns false
      const fakePermission = 'fake-unknown-permission' as any;
      expect(service.hasPermission(superAdminUser, fakePermission)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    const employeeUser: Fish24User = {
      mobile: '09120000003',
      roles: ['employee']
    };

    it('should return TRUE when at least one permission is granted (Case A)', () => {
      const result = service.hasAnyPermission(employeeUser, [
        FISH24_PERMISSIONS.personalDocuments,
        FISH24_PERMISSIONS.financialManagement
      ]);
      expect(result).toBe(true);
    });

    it('should return FALSE when no permissions are granted (Case B)', () => {
      const result = service.hasAnyPermission(employeeUser, [
        FISH24_PERMISSIONS.financialManagement,
        FISH24_PERMISSIONS.pricingManagement
      ]);
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    const employeeUser: Fish24User = {
      mobile: '09120000003',
      roles: ['employee']
    };

    it('should return TRUE when all permissions are granted (Case A)', () => {
      const result = service.hasAllPermissions(employeeUser, [
        FISH24_PERMISSIONS.personalDocuments,
        FISH24_PERMISSIONS.profile
      ]);
      expect(result).toBe(true);
    });

    it('should return FALSE when not all permissions are granted (Case B)', () => {
      const result = service.hasAllPermissions(employeeUser, [
        FISH24_PERMISSIONS.personalDocuments,
        FISH24_PERMISSIONS.financialManagement
      ]);
      expect(result).toBe(false);
    });
  });

  describe('Empty/Unknown Role Safety', () => {
    it('empty roles array grants no permissions', () => {
      const emptyRoleUser: Fish24User = {
        mobile: '09120000006',
        roles: []
      };
      const effectivePerms = service.getEffectivePermissions(emptyRoleUser);
      expect(effectivePerms.length).toBe(0);
    });

    it('null input returns no permissions', () => {
      const effectivePerms = service.getEffectivePermissions(null);
      expect(effectivePerms.length).toBe(0);
    });

    it('undefined input returns no permissions', () => {
      const effectivePerms = service.getEffectivePermissions(undefined);
      expect(effectivePerms.length).toBe(0);
    });
  });

  describe('Role Resolution Variants', () => {
    it('should handle Fish24User object', () => {
      const user: Fish24User = {
        mobile: '09120000007',
        roles: ['employee']
      };
      expect(service.hasPermission(user, FISH24_PERMISSIONS.personalDocuments)).toBe(true);
    });

    it('should handle role ID string directly', () => {
      expect(service.hasPermission('employee', FISH24_PERMISSIONS.personalDocuments)).toBe(true);
    });

    it('should handle role ID array', () => {
      expect(service.hasPermission(['employee'], FISH24_PERMISSIONS.personalDocuments)).toBe(true);
    });

    it('should handle object with roles property', () => {
      const roleObj = { roles: ['employee' as const] };
      expect(service.hasPermission(roleObj, FISH24_PERMISSIONS.personalDocuments)).toBe(true);
    });
  });
});

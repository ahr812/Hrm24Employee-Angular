import { Fish24RoleId } from '../models/fish24-role.model';
import { Fish24Permission, FISH24_PERMISSIONS } from './fish24-permissions';

export const ROLE_CAPABILITIES: Record<Fish24RoleId, readonly Fish24Permission[]> = {
  'super-admin': [
    FISH24_PERMISSIONS.dashboard,
    FISH24_PERMISSIONS.generalReports,
    FISH24_PERMISSIONS.userReports,
    FISH24_PERMISSIONS.ticketReports,
    FISH24_PERMISSIONS.financialReports,
    FISH24_PERMISSIONS.userManagement,
    FISH24_PERMISSIONS.financialManagement,
    FISH24_PERMISSIONS.discountManagement,
    FISH24_PERMISSIONS.pricingManagement,
    FISH24_PERMISSIONS.ticketsMessages,
    FISH24_PERMISSIONS.newsManagement,
    FISH24_PERMISSIONS.faqManagement,
    FISH24_PERMISSIONS.subscriberManagement,
    FISH24_PERMISSIONS.siteSettings,
    FISH24_PERMISSIONS.geographicManagement,
    FISH24_PERMISSIONS.employerCompaniesWorkshops,
    FISH24_PERMISSIONS.employerEmployees,
    FISH24_PERMISSIONS.employerOutgoingDocuments,
    FISH24_PERMISSIONS.employerWallet,
    FISH24_PERMISSIONS.employerInvoices,
    FISH24_PERMISSIONS.employerTickets,
    FISH24_PERMISSIONS.employerEmployeeNotifications,
    FISH24_PERMISSIONS.personalDocuments,
    FISH24_PERMISSIONS.employeeNotifications,
    FISH24_PERMISSIONS.profile
  ],
  'sales-expert': [
    FISH24_PERMISSIONS.dashboard,
    FISH24_PERMISSIONS.generalReports,
    FISH24_PERMISSIONS.userReports,
    FISH24_PERMISSIONS.ticketReports,
    FISH24_PERMISSIONS.financialReports,
    FISH24_PERMISSIONS.userManagement,
    FISH24_PERMISSIONS.financialManagement,
    FISH24_PERMISSIONS.discountManagement,
    FISH24_PERMISSIONS.pricingManagement,
    FISH24_PERMISSIONS.ticketsMessages,
    FISH24_PERMISSIONS.newsManagement,
    FISH24_PERMISSIONS.faqManagement,
    FISH24_PERMISSIONS.subscriberManagement,
    FISH24_PERMISSIONS.siteSettings,
    FISH24_PERMISSIONS.geographicManagement,
    FISH24_PERMISSIONS.profile
  ],
  'support-expert': [
    FISH24_PERMISSIONS.dashboard,
    FISH24_PERMISSIONS.generalReports,
    FISH24_PERMISSIONS.userReports,
    FISH24_PERMISSIONS.ticketReports,
    FISH24_PERMISSIONS.userManagement,
    FISH24_PERMISSIONS.ticketsMessages,
    FISH24_PERMISSIONS.newsManagement,
    FISH24_PERMISSIONS.faqManagement,
    FISH24_PERMISSIONS.subscriberManagement,
    FISH24_PERMISSIONS.profile
  ],
  employer: [
    FISH24_PERMISSIONS.dashboard,
    FISH24_PERMISSIONS.employerCompaniesWorkshops,
    FISH24_PERMISSIONS.employerEmployees,
    FISH24_PERMISSIONS.employerOutgoingDocuments,
    FISH24_PERMISSIONS.employerWallet,
    FISH24_PERMISSIONS.employerInvoices,
    FISH24_PERMISSIONS.employerTickets,
    FISH24_PERMISSIONS.employerEmployeeNotifications,
    FISH24_PERMISSIONS.personalDocuments,
    FISH24_PERMISSIONS.profile
  ],
  employee: [
    FISH24_PERMISSIONS.personalDocuments,
    FISH24_PERMISSIONS.employeeNotifications,
    FISH24_PERMISSIONS.profile
  ]
};

export const FISH24_ROLE_CAPABILITY_SUMMARY: Record<Fish24RoleId, string> = {
  'super-admin': 'Administrative access to confirmed Fish24 admin modules. Direct employer or employee panel access is not yet specified.',
  'sales-expert': 'Access to all currently identified Sales/Support administration functionality.',
  'support-expert': 'Access to non-financial support administration only. Financial reports, pricing, discounts, settings, and geographic management remain restricted.',
  employer: 'Employer dashboard and employer-owned business operations.',
  employee: 'Primary landing: My Documents. Profile and notifications remain available.'
};

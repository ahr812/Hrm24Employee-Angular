export const FISH24_PERMISSIONS = {
  dashboard: 'dashboard',
  generalReports: 'general-reports',
  userReports: 'user-reports',
  ticketReports: 'ticket-reports',
  financialReports: 'financial-reports',
  userManagement: 'user-management',
  financialManagement: 'financial-management',
  discountManagement: 'discount-management',
  pricingManagement: 'pricing-management',
  ticketsMessages: 'tickets-messages',
  newsManagement: 'news-management',
  faqManagement: 'faq-management',
  subscriberManagement: 'subscriber-management',
  siteSettings: 'site-settings',
  geographicManagement: 'geographic-management',
  employerCompaniesWorkshops: 'employer-companies-workshops',
  employerEmployees: 'employer-employees',
  employerOutgoingDocuments: 'employer-outgoing-documents',
  employerWallet: 'employer-wallet',
  employerInvoices: 'employer-invoices',
  employerTickets: 'employer-tickets',
  employerEmployeeNotifications: 'employer-employee-notifications',
  personalDocuments: 'personal-documents',
  employeeNotifications: 'employee-notifications',
  profile: 'profile'
} as const;

export type Fish24Permission = typeof FISH24_PERMISSIONS[keyof typeof FISH24_PERMISSIONS];

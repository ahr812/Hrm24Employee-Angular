import { Fish24NavItem } from './nav-item.model';
import { Fish24RoleId } from '../../../core/fish24/models/fish24-role.model';

/**
 * Fish24 Administration Navigation Configuration
 * 
 * This configuration is primarily for Admin/Sales/Support roles.
 * Each nav item specifies a permission requirement that will be validated
 * against the current preview role's capabilities.
 * 
 * Permission-aware visibility: items are shown only if the current role
 * has the required permission.
 * 
 * For future implementation: replace role preview with authenticated role/context.
 */
export const FISH24_ADMIN_NAV_CONFIG: readonly Fish24NavItem[] = [
  {
    id: 'fish24-admin-dashboard',
    label: 'داشبورد',
    icon: 'dashboard',
    permission: 'dashboard'
    // Future: route: '/fish24/admin/dashboard'
  },
  {
    id: 'fish24-admin-reports',
    label: 'گزارشات',
    icon: 'bar-chart-2',
    permission: 'general-reports',
    children: [
      {
        id: 'fish24-admin-reports-general',
        label: 'گزارشات عمومی',
        icon: 'file-text',
        permission: 'general-reports'
        // Future: route: '/fish24/admin/reports/general'
      },
      {
        id: 'fish24-admin-reports-users',
        label: 'گزارشات کاربران',
        icon: 'users',
        permission: 'user-reports'
        // Future: route: '/fish24/admin/reports/users'
      },
      {
        id: 'fish24-admin-reports-tickets',
        label: 'گزارشات تیکت ها',
        icon: 'ticket',
        permission: 'ticket-reports'
        // Future: route: '/fish24/admin/reports/tickets'
      },
      {
        id: 'fish24-admin-reports-financial',
        label: 'گزارشات مالی',
        icon: 'trending-up',
        permission: 'financial-reports'
        // Future: route: '/fish24/admin/reports/financial'
      }
    ]
  },
  {
    id: 'fish24-admin-user-system',
    label: 'سیستم کاربران',
    icon: 'users',
    permission: 'user-management'
    // Future: route: '/fish24/admin/user-system'
  },
  {
    id: 'fish24-admin-financial',
    label: 'مدیریت مالی',
    icon: 'banknote',
    permission: 'financial-management',
    children: [
      {
        id: 'fish24-admin-financial-shipments',
        label: 'لیست ارسالها',
        permission: 'financial-management'
        // Future: route: '/fish24/admin/financial/shipments'
      },
      {
        id: 'fish24-admin-financial-transactions',
        label: 'لیست تراکنش',
        permission: 'financial-management'
        // Future: route: '/fish24/admin/financial/transactions'
      },
      {
        id: 'fish24-admin-financial-invoices',
        label: 'لیست فاکتورها',
        permission: 'financial-management'
        // Future: route: '/fish24/admin/financial/invoices'
      },
      {
        id: 'fish24-admin-financial-vat',
        label: 'تنظیمات ارزش افزوده',
        permission: 'financial-management'
        // Future: route: '/fish24/admin/financial/vat-settings'
      }
    ]
  },
  {
    id: 'fish24-admin-tickets',
    label: 'تیکت ها و پیام ها',
    icon: 'message-circle',
    permission: 'tickets-messages'
    // Future: route: '/fish24/admin/tickets'
  },
  {
    id: 'fish24-admin-discounts',
    label: 'مدیریت تخفیفات',
    icon: 'percent',
    permission: 'discount-management',
    children: [
      {
        id: 'fish24-admin-discounts-quantity',
        label: 'مدیریت تخفیف تعدادی',
        permission: 'discount-management'
        // Future: route: '/fish24/admin/discounts/quantity'
      },
      {
        id: 'fish24-admin-discounts-coupon',
        label: 'مدیریت کوپن تخفیف',
        permission: 'discount-management'
        // Future: route: '/fish24/admin/discounts/coupon'
      },
      {
        id: 'fish24-admin-discounts-time-based',
        label: 'مدیریت تخفیف زمانی',
        permission: 'discount-management'
        // Future: route: '/fish24/admin/discounts/time-based'
      }
    ]
  },
  {
    id: 'fish24-admin-pricing',
    label: 'قیمت گذاری',
    icon: 'tag',
    permission: 'pricing-management'
    // Future: route: '/fish24/admin/pricing'
  },
  {
    id: 'fish24-admin-news',
    label: 'مدیریت اخبار',
    icon: 'newspaper',
    permission: 'news-management'
    // Future: route: '/fish24/admin/news'
  },
  {
    id: 'fish24-admin-faq',
    label: 'سوالات متداول',
    icon: 'help-circle',
    permission: 'faq-management'
    // Future: route: '/fish24/admin/faq'
  },
  {
    id: 'fish24-admin-subscribers',
    label: 'مشترکین',
    icon: 'mail',
    permission: 'subscriber-management'
    // Future: route: '/fish24/admin/subscribers'
  },
  {
    id: 'fish24-admin-settings',
    label: 'تنظیمات سایت',
    icon: 'settings',
    permission: 'site-settings'
    // Future: route: '/fish24/admin/settings'
  },
  {
    id: 'fish24-admin-geographic',
    label: 'مناطق جغرافیایی',
    icon: 'map',
    permission: 'geographic-management',
    children: [
      {
        id: 'fish24-admin-geographic-provinces',
        label: 'استان ها',
        permission: 'geographic-management'
        // Future: route: '/fish24/admin/geographic/provinces'
      },
      {
        id: 'fish24-admin-geographic-cities',
        label: 'شهرستان ها',
        permission: 'geographic-management'
        // Future: route: '/fish24/admin/geographic/cities'
      },
      {
        id: 'fish24-admin-geographic-regions',
        label: 'شهرها',
        permission: 'geographic-management'
        // Future: route: '/fish24/admin/geographic/regions'
      }
    ]
  }
];

/**
 * Fish24 Employer navigation.
 *
 * These entries intentionally have no routes until their Fish24 pages are
 * migrated. Item visibility is still evaluated by Fish24PermissionService.
 */
export const FISH24_EMPLOYER_NAV_CONFIG: readonly Fish24NavItem[] = [
  {
    id: 'fish24-employer-dashboard',
    label: 'داشبورد',
    icon: 'dashboard',
    permission: 'dashboard',
    route: '/fish24/employer/dashboard'
  },
  {
    id: 'fish24-employer-profile',
    label: 'پروفایل',
    icon: 'user',
    permission: 'profile',
    route: '/fish24/employer/profile'
  },
  {
    id: 'fish24-employer-change-password',
    label: 'تغییر رمز ثابت',
    icon: 'key',
    permission: 'profile',
    route: '/fish24/employer/change-password'
  },
  {
    id: 'fish24-employer-wallet',
    label: 'کیف پول',
    icon: 'wallet',
    permission: 'employer-wallet',
    route: '/fish24/employer/wallet'
  },
  {
    id: 'fish24-employer-companies-workshops',
    label: 'شرکت‌ها و کارگاه‌ها',
    icon: 'briefcase',
    permission: 'employer-companies-workshops'
  },
  {
    id: 'fish24-employer-outgoing-documents',
    label: 'فیش‌ها و اسناد ارسالی',
    icon: 'file-text',
    permission: 'employer-outgoing-documents'
  },
  {
    id: 'fish24-employer-invoices',
    label: 'لیست فاکتورها',
    icon: 'file-text',
    permission: 'employer-invoices'
  },
  {
    id: 'fish24-employer-employees',
    label: 'کارکنان تحت پوشش',
    icon: 'users',
    permission: 'employer-employees'
  },
  {
    id: 'fish24-employer-tickets',
    label: 'فهرست تیکت‌ها',
    icon: 'ticket',
    permission: 'employer-tickets'
  },
  {
    id: 'fish24-employer-employee-notifications',
    label: 'اطلاع‌رسانی کارکنان',
    icon: 'bell',
    permission: 'employer-employee-notifications'
  },
  {
    id: 'fish24-employer-personal-documents',
    label: 'اسناد شخصی من',
    icon: 'save',
    permission: 'personal-documents'
  },
  {
    id: 'fish24-employer-system-training',
    label: 'آموزش سامانه',
    icon: 'graduation-cap',
    permission: 'system-training'
  }
];

/**
 * Fish24 Employee navigation.
 *
 * Employee pages have not been migrated yet, so every item intentionally
 * remains non-routed and is filtered through Fish24PermissionService.
 */
export const FISH24_EMPLOYEE_NAV_CONFIG: readonly Fish24NavItem[] = [
  {
    id: 'fish24-employee-personal-documents',
    label: 'اسناد من',
    icon: 'save',
    permission: 'personal-documents'
  },
  {
    id: 'fish24-employee-profile',
    label: 'پروفایل',
    icon: 'user',
    permission: 'profile'
  },
  {
    id: 'fish24-employee-notifications',
    label: 'اطلاع‌رسانی',
    icon: 'bell',
    permission: 'employee-notifications'
  }
];

const FISH24_ADMIN_ROLE_IDS: readonly Fish24RoleId[] = [
  'super-admin',
  'sales-expert',
  'support-expert'
];

/**
 * Select navigation areas for all active roles.
 *
 * Keeping this selection centralized preserves multi-role union compatibility;
 * permission filtering for every selected item remains in the sidebar's
 * Fish24PermissionService integration.
 */
export function getFish24NavigationConfig(roles: readonly Fish24RoleId[]): readonly Fish24NavItem[] {
  const items: Fish24NavItem[] = [];

  if (roles.some(role => FISH24_ADMIN_ROLE_IDS.includes(role))) {
    items.push(...FISH24_ADMIN_NAV_CONFIG);
  }

  if (roles.includes('employer')) {
    items.push(...FISH24_EMPLOYER_NAV_CONFIG);
  }

  if (roles.includes('employee')) {
    items.push(...FISH24_EMPLOYEE_NAV_CONFIG);
  }

  return items;
}

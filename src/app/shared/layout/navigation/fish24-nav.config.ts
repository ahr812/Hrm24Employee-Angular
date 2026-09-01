import { Fish24NavItem } from './nav-item.model';

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
 * Employee/Employer personal navigation (for future phases).
 * Currently not used in this task.
 */
export const FISH24_NAV_CONFIG: readonly Fish24NavItem[] = [
  {
    id: 'fish24-dashboard',
    label: 'داشبورد',
    icon: 'dashboard',
    route: '/dashboard',
    permission: 'dashboard'
  },
  {
    id: 'fish24-my-documents',
    label: 'اسناد من',
    icon: 'save',
    route: '/documents',
    permission: 'personal-documents'
  },
  {
    id: 'fish24-profile',
    label: 'پروفایل',
    icon: 'user',
    route: '/profile',
    permission: 'profile'
  }
];

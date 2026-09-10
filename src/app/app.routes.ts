import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent), canActivate: [guestGuard] },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent), canActivate: [guestGuard] },

  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  { path: 'dashboard', loadComponent: () => import('./features/fish24/internal/dashboard/internal-dashboard.component').then(m => m.InternalDashboardComponent), canActivate: [authGuard] },
  { path: 'fish24/internal/users', loadComponent: () => import('./features/fish24/internal/users/internal-users.component').then(m => m.InternalUsersComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/dashboard', loadComponent: () => import('./features/fish24/employer/dashboard/employer-dashboard.component').then(m => m.EmployerDashboardComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/profile', loadComponent: () => import('./features/fish24/employer/profile/employer-profile.component').then(m => m.EmployerProfileComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/change-password', loadComponent: () => import('./features/fish24/employer/change-password/employer-change-password.component').then(m => m.EmployerChangePasswordComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/wallet', loadComponent: () => import('./features/fish24/employer/wallet/employer-wallet.component').then(m => m.EmployerWalletComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/companies', loadComponent: () => import('./features/fish24/employer/companies/employer-companies.component').then(m => m.EmployerCompaniesComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/documents/new', loadComponent: () => import('./features/fish24/employer/documents/employer-document-create.component').then(m => m.EmployerDocumentCreateComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/documents/review', loadComponent: () => import('./features/fish24/employer/documents/employer-document-review.component').then(m => m.EmployerDocumentReviewComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/documents/:id/ticket', loadComponent: () => import('./features/fish24/employer/tickets/employer-ticket-create.component').then(m => m.EmployerTicketCreateComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/documents', loadComponent: () => import('./features/fish24/employer/documents/employer-documents.component').then(m => m.EmployerDocumentsComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/invoices/:id/print', loadComponent: () => import('./features/fish24/employer/invoices/employer-invoice-print.component').then(m => m.EmployerInvoicePrintComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/invoices', loadComponent: () => import('./features/fish24/employer/invoices/employer-invoices.component').then(m => m.EmployerInvoicesComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/employees', loadComponent: () => import('./features/fish24/employer/employees/employer-employees.component').then(m => m.EmployerEmployeesComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/employee-notifications', loadComponent: () => import('./features/fish24/employer/employee-notifications/employer-employee-notifications.component').then(m => m.EmployerEmployeeNotificationsComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/training', loadComponent: () => import('./features/fish24/employer/training/employer-training.component').then(m => m.EmployerTrainingComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/tickets/:id', loadComponent: () => import('./features/fish24/employer/tickets/employer-ticket-view.component').then(m => m.EmployerTicketViewComponent), canActivate: [authGuard] },
  { path: 'fish24/employer/tickets', loadComponent: () => import('./features/fish24/employer/tickets/employer-tickets.component').then(m => m.EmployerTicketsComponent), canActivate: [authGuard] },
  { path: 'fish24/my/documents', loadComponent: () => import('./features/fish24/my/documents/my-documents.component').then(m => m.MyDocumentsComponent), canActivate: [authGuard] },
  { path: 'fish24/my/profile', loadComponent: () => import('./features/fish24/my/profile/my-profile.component').then(m => m.MyProfileComponent), canActivate: [authGuard] },
  { path: 'fish24/my/notifications', loadComponent: () => import('./features/fish24/my/notifications/my-notifications.component').then(m => m.MyNotificationsComponent), canActivate: [authGuard] },

  { path: 'tasks', loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent), canActivate: [authGuard] },
  { path: 'missions', loadComponent: () => import('./features/missions/missions.component').then(m => m.MissionsComponent), canActivate: [authGuard] },
  { path: 'documents', loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent), canActivate: [authGuard] },

  { path: 'evaluation', loadComponent: () => import('./features/evaluation/evaluation.component').then(m => m.EvaluationComponent), canActivate: [authGuard] },
  { path: 'evaluation/form/:type/:id', loadComponent: () => import('./features/evaluation/evaluation-form.component').then(m => m.EvaluationFormComponent), canActivate: [authGuard] },
  { path: 'evaluation/analytics', loadComponent: () => import('./features/evaluation/evaluation-analytics.component').then(m => m.EvaluationAnalyticsComponent), canActivate: [authGuard] },
  { path: 'training', loadComponent: () => import('./features/training/training.component').then(m => m.TrainingComponent), canActivate: [authGuard] },
  { path: 'attendance', loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent), canActivate: [authGuard] },
  { path: 'leave', loadComponent: () => import('./features/leave/leave.component').then(m => m.LeaveComponent), canActivate: [authGuard] },

  { path: 'payslip', loadComponent: () => import('./features/payslip/payslip.component').then(m => m.PayslipComponent), canActivate: [authGuard] },
  { path: 'payslip/:id', loadComponent: () => import('./features/payslip/payslip-detail/payslip-detail.component').then(m => m.PayslipDetailComponent), canActivate: [authGuard] },

  { path: 'loan', loadComponent: () => import('./features/loan/loan.component').then(m => m.LoanComponent), canActivate: [authGuard] },
  { path: 'advance', loadComponent: () => import('./features/advance/advance.component').then(m => m.AdvanceComponent), canActivate: [authGuard] },
  { path: 'savings', loadComponent: () => import('./features/savings/savings.component').then(m => m.SavingsComponent), canActivate: [authGuard] },

  { path: 'chat', loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent), canActivate: [authGuard] },
  { path: 'reminders', loadComponent: () => import('./features/reminders/reminders.component').then(m => m.RemindersComponent), canActivate: [authGuard] },
  { path: 'surveys', loadComponent: () => import('./features/surveys/surveys.component').then(m => m.SurveysComponent), canActivate: [authGuard] },
  { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent), canActivate: [authGuard] },

  { path: 'knowledge', loadComponent: () => import('./features/knowledge/knowledge.component').then(m => m.KnowledgeComponent), canActivate: [authGuard] },

  { path: 'comparison', loadComponent: () => import('./features/comparison/comparison.component').then(m => m.ComparisonComponent), canActivate: [authGuard] },
  { path: 'calendar', loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent), canActivate: [authGuard] },
  { path: 'tickets', loadComponent: () => import('./features/tickets/tickets.component').then(m => m.TicketsComponent), canActivate: [authGuard] },
  { path: 'tickets/:id', loadComponent: () => import('./features/tickets/ticket-detail.component').then(m => m.TicketDetailComponent), canActivate: [authGuard] },

  { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'help', loadComponent: () => import('./features/help/help.component').then(m => m.HelpComponent), canActivate: [authGuard] },

  { path: 'icons', loadComponent: () => import('./features/icon-gallery/icon-gallery.component').then(m => m.IconGalleryComponent) },

  { path: 'error', loadComponent: () => import('./features/server-error/server-error.component').then(m => m.ServerErrorComponent) },
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) }

];

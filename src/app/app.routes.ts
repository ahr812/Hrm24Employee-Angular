import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent), canActivate: [guestGuard] },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent), canActivate: [guestGuard] },

  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },

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
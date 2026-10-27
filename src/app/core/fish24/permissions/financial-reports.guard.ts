import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Fish24RolePreviewService } from '../dev/fish24-role-preview.service';
import { Fish24PermissionService } from './fish24-permission.service';
import { FISH24_PERMISSIONS } from './fish24-permissions';

export const financialReportsGuard: CanActivateFn = () => {
  const roles = inject(Fish24RolePreviewService).getPreviewRoles();
  const allowed = inject(Fish24PermissionService).hasPermission(roles, FISH24_PERMISSIONS.financialReports);
  return allowed ? true : inject(Router).createUrlTree(['/dashboard']);
};

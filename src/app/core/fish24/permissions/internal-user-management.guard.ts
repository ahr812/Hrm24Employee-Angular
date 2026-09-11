import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Fish24RolePreviewService } from '../dev/fish24-role-preview.service';
import { Fish24PermissionService } from './fish24-permission.service';
import { FISH24_PERMISSIONS } from './fish24-permissions';

export const internalUserManagementGuard: CanActivateFn = () => {
  const previewRoleService = inject(Fish24RolePreviewService);
  const permissionService = inject(Fish24PermissionService);
  const router = inject(Router);
  const roles = previewRoleService.getPreviewRoles();

  return permissionService.hasPermission(roles, FISH24_PERMISSIONS.internalUserManagement)
    ? true
    : router.createUrlTree(['/fish24/internal/users']);
};

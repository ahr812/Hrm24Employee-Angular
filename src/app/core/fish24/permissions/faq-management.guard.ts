import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Fish24RolePreviewService } from '../dev/fish24-role-preview.service';
import { Fish24PermissionService } from './fish24-permission.service';
import { FISH24_PERMISSIONS } from './fish24-permissions';

export const faqManagementGuard: CanActivateFn = () => inject(Fish24PermissionService).hasPermission(inject(Fish24RolePreviewService).getPreviewRoles(), FISH24_PERMISSIONS.faqManagement) ? true : inject(Router).createUrlTree(['/dashboard']);

import { Fish24RoleId } from './fish24-role.model';

export interface Fish24UserContext {
  readonly mobile: string;
  readonly activeRoleIds: readonly Fish24RoleId[];
  readonly activeEmployerId?: string;
  readonly activeCompanyWorkshopId?: string;
  readonly personalContext: 'personal-user';
}

export interface Fish24GlobalIdentity {
  readonly mobile: string;
  readonly isGlobalMobileIdentity: true;
}

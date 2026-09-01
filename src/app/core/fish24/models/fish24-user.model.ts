export type Fish24RoleId =
  | 'super-admin'
  | 'sales-expert'
  | 'support-expert'
  | 'employer'
  | 'employee';

export interface Fish24User {
  readonly mobile: string;
  readonly roles: readonly Fish24RoleId[];
  readonly displayName?: string;
}

export type Fish24RoleId =
  | 'super-admin'
  | 'sales-expert'
  | 'support-expert'
  | 'employer'
  | 'employee';

export interface Fish24RoleDefinition {
  readonly id: Fish24RoleId;
  readonly label: string;
  readonly meaning: string;
}

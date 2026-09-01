export interface Fish24NavItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly route?: string;
  readonly permission?: string;
  readonly children?: readonly Fish24NavItem[];
}

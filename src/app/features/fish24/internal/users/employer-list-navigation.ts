import { ParamMap } from '@angular/router';
import { InternalListColumnSearches, InternalListSort } from '../../../../shared/ui/data-list/internal-list.model';
import { BusinessUserRecord } from './business-user-preview.service';

export const EMPLOYER_ACTION_SOURCE = 'user-management';
export const EMPLOYER_ACTION_SOURCE_PARAM = 'source';
export const EMPLOYER_ACTION_ID_PARAM = 'employerId';

export interface EmployerActionQuery {
  readonly source: typeof EMPLOYER_ACTION_SOURCE;
  readonly employerId: string;
}

export interface EmployerNavigationReset<T extends { readonly employerId: string }> {
  readonly filters: T;
  readonly page: 1;
  readonly columnSearches: InternalListColumnSearches;
  readonly tableSort: InternalListSort;
}

export type EmployerNavigationRequest =
  | { readonly kind: 'absent' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'valid'; readonly employerId: string };

export function employerActionQuery(user: BusinessUserRecord): EmployerActionQuery | null {
  return user.roles.includes('employer')
    ? { source: EMPLOYER_ACTION_SOURCE, employerId: String(user.id) }
    : null;
}

export function readEmployerNavigation(params: ParamMap, validEmployerIds: readonly string[]): EmployerNavigationRequest {
  if (params.get(EMPLOYER_ACTION_SOURCE_PARAM) !== EMPLOYER_ACTION_SOURCE) return { kind: 'absent' };
  const employerId = params.get(EMPLOYER_ACTION_ID_PARAM)?.trim() ?? '';
  return employerId && validEmployerIds.includes(employerId)
    ? { kind: 'valid', employerId }
    : { kind: 'invalid' };
}

export function resetForEmployerNavigation<T extends { readonly employerId: string }>(defaults: T, employerId: string): EmployerNavigationReset<T> {
  return {
    filters: { ...defaults, employerId },
    page: 1,
    columnSearches: {},
    tableSort: { columnId: null, direction: null }
  };
}

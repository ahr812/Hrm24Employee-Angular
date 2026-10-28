import { convertToParamMap } from '@angular/router';
import { BusinessUserRecord } from './business-user-preview.service';
import { employerActionQuery, readEmployerNavigation, resetForEmployerNavigation } from './employer-list-navigation';

const user = (id: number, roles: BusinessUserRecord['roles']): BusinessUserRecord => ({ id, roles } as BusinessUserRecord);

describe('employer list navigation contract', () => {
  it('uses only the stable employer identity and rejects employee-only records', () => {
    expect(employerActionQuery(user(1001, ['employer', 'employee']))).toEqual({ source: 'user-management', employerId: '1001' });
    expect(employerActionQuery(user(1003, ['employee']))).toBeNull();
  });

  it('accepts only an action-scoped employer id present in the destination contract', () => {
    expect(readEmployerNavigation(convertToParamMap({ source: 'user-management', employerId: '1002' }), ['1001', '1002'])).toEqual({ kind: 'valid', employerId: '1002' });
    expect(readEmployerNavigation(convertToParamMap({ source: 'user-management', employerId: '9999' }), ['1001', '1002'])).toEqual({ kind: 'invalid' });
    expect(readEmployerNavigation(convertToParamMap({ employerId: '1002' }), ['1001', '1002'])).toEqual({ kind: 'absent' });
  });

  it('replaces old main filters while resetting transient table state and pagination', () => {
    const defaults = { employerId: 'all', mobile: '', fromDate: '', toDate: '' };
    expect(resetForEmployerNavigation(defaults, '1007')).toEqual({
      filters: { employerId: '1007', mobile: '', fromDate: '', toDate: '' },
      page: 1,
      columnSearches: {},
      tableSort: { columnId: null, direction: null }
    });
  });
});

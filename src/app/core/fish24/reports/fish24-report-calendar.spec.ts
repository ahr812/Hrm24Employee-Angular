import { addJalaliDays, dateInFish24Range, fish24ReportPeriodBounds, jalaliMonthLength } from './fish24-report-calendar';

describe('Fish24 report calendar', () => {
  it('uses a Saturday week boundary and a complete previous week', () => {
    const bounds = fish24ReportPeriodBounds('week', '1405/07/05', 0);
    expect(bounds.current).toEqual(jasmine.objectContaining({ start: '1405/07/05', end: '1405/07/05' }));
    expect(bounds.previous).toEqual(jasmine.objectContaining({ start: '1405/06/29', end: '1405/07/04' }));
  });

  it('compares a partial current month with the entire previous Jalali month', () => {
    const bounds = fish24ReportPeriodBounds('month', '1405/01/12', 4);
    expect(bounds.current).toEqual(jasmine.objectContaining({ start: '1405/01/01', end: '1405/01/12' }));
    expect(bounds.previous).toEqual(jasmine.objectContaining({ start: '1404/12/01', end: '1404/12/29' }));
  });

  it('handles Jalali leap-year and year transitions', () => {
    expect(jalaliMonthLength(1403, 12)).toBe(30);
    expect(jalaliMonthLength(1404, 12)).toBe(29);
    expect(addJalaliDays('1403/12/30', 1)).toBe('1404/01/01');
    expect(addJalaliDays('1404/01/01', -1)).toBe('1403/12/30');
  });

  it('excludes future records and hides an invented previous all-time period', () => {
    const day = fish24ReportPeriodBounds('day', '1405/06/23', 1);
    expect(dateInFish24Range('1405/06/24', day.current)).toBeFalse();
    const all = fish24ReportPeriodBounds('all', '1405/06/23', 1);
    expect(all.previous).toBeNull();
    expect(dateInFish24Range('1403/01/01', all.current)).toBeTrue();
    expect(dateInFish24Range('1405/06/24', all.current)).toBeFalse();
  });
});

import { normalizeFish24Digits, normalizeJalaliDate } from '../financial/fish24-financial-preview.service';

export type Fish24ReportPeriod = 'day' | 'week' | 'month' | 'year' | 'all';

export interface Fish24ReportDateRange {
  readonly start: string | null;
  readonly end: string;
  readonly label: string;
}

export interface Fish24ReportPeriodBounds {
  readonly current: Fish24ReportDateRange;
  readonly previous: Fish24ReportDateRange | null;
}

export const FISH24_REPORT_PERIODS: readonly { readonly id: Fish24ReportPeriod; readonly label: string }[] = [
  { id: 'day', label: 'روز' }, { id: 'week', label: 'هفته' }, { id: 'month', label: 'ماه' },
  { id: 'year', label: 'سال' }, { id: 'all', label: 'کل' }
];

export function currentTehranJalaliDate(now: Date): string {
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? '';
  return `${value('year')}/${value('month')}/${value('day')}`;
}

export function tehranSaturdayWeekday(now: Date): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', weekday: 'short' }).format(now);
  return ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(weekday);
}

export function fish24ReportPeriodBounds(period: Fish24ReportPeriod, today: string, saturdayWeekday: number): Fish24ReportPeriodBounds {
  const normalized = normalizeJalaliDate(today);
  if (!normalized) throw new Error('Invalid Jalali report date.');
  const [year, month] = normalized.split('/').map(Number);
  if (period === 'all') return { current: range(null, normalized, `تا ${display(normalized)}`), previous: null };
  let currentStart = normalized;
  if (period === 'week') currentStart = addJalaliDays(normalized, -Math.max(0, Math.min(6, saturdayWeekday)));
  if (period === 'month') currentStart = key(year, month, 1);
  if (period === 'year') currentStart = key(year, 1, 1);
  let previousStart: string;
  let previousEnd: string;
  if (period === 'day') {
    previousStart = previousEnd = addJalaliDays(normalized, -1);
  } else if (period === 'week') {
    previousStart = addJalaliDays(currentStart, -7);
    previousEnd = addJalaliDays(currentStart, -1);
  } else if (period === 'month') {
    const previousMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
    previousStart = key(previousMonth.year, previousMonth.month, 1);
    previousEnd = key(previousMonth.year, previousMonth.month, jalaliMonthLength(previousMonth.year, previousMonth.month));
  } else {
    previousStart = key(year - 1, 1, 1);
    previousEnd = key(year - 1, 12, jalaliMonthLength(year - 1, 12));
  }
  return {
    current: range(currentStart, normalized, rangeLabel(currentStart, normalized)),
    previous: range(previousStart, previousEnd, rangeLabel(previousStart, previousEnd))
  };
}

export function dateInFish24Range(candidate: string, rangeValue: Fish24ReportDateRange): boolean {
  const normalized = normalizeJalaliDate(normalizeFish24Digits(candidate).trim().slice(0, 10));
  return Boolean(normalized && (!rangeValue.start || normalized >= rangeValue.start) && normalized <= rangeValue.end);
}

export function addJalaliDays(value: string, amount: number): string {
  const normalized = normalizeJalaliDate(value);
  if (!normalized) throw new Error('Invalid Jalali date.');
  let [year, month, day] = normalized.split('/').map(Number);
  const direction = Math.sign(amount);
  for (let remaining = Math.abs(amount); remaining > 0; remaining--) {
    day += direction;
    if (direction > 0 && day > jalaliMonthLength(year, month)) { day = 1; month++; if (month > 12) { month = 1; year++; } }
    if (direction < 0 && day < 1) { month--; if (month < 1) { month = 12; year--; } day = jalaliMonthLength(year, month); }
  }
  return key(year, month, day);
}

export function jalaliMonthLength(year: number, month: number): number {
  return month <= 6 ? 31 : month <= 11 ? 30 : isJalaliLeapYear(year) ? 30 : 29;
}

function isJalaliLeapYear(year: number): boolean {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  let previous = breaks[0], jump = 0;
  for (let index = 1; index < breaks.length; index++) { const current = breaks[index]; jump = current - previous; if (year < current) break; previous = current; }
  let offset = year - previous;
  if (jump - offset < 6) offset = offset - jump + Math.floor((jump + 4) / 33) * 33;
  let leap = ((offset + 1) % 33 - 1) % 4;
  if (leap === -1) leap = 4;
  return leap === 0;
}

function key(year: number, month: number, day: number): string { return `${year.toString().padStart(4, '0')}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`; }
function display(value: string): string { return value.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]); }
function range(start: string | null, end: string, label: string): Fish24ReportDateRange { return { start, end, label }; }
function rangeLabel(start: string, end: string): string { return start === end ? display(start) : `${display(start)} تا ${display(end)}`; }

export type InternalListValue = string | number | boolean | null | undefined;
export type InternalListSortDirection = 'asc' | 'desc';

export interface InternalListSort {
  readonly columnId: string | null;
  readonly direction: InternalListSortDirection | null;
}

export interface InternalListColumn<T> {
  readonly id: string;
  readonly label: string;
  readonly value: (row: T) => InternalListValue;
  readonly searchValue?: (row: T) => InternalListValue;
  readonly exportValue?: (row: T) => string | number | null;
  readonly compare?: (left: T, right: T) => number;
  readonly minWidth?: string;
  readonly ltr?: boolean;
}

export type InternalListColumnSearches = Readonly<Record<string, string>>;

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeInternalListSearch(value: InternalListValue): string {
  return String(value ?? '')
    .replace(/[۰-۹]/g, digit => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .trim()
    .toLocaleLowerCase('fa-IR');
}

export function filterByInternalListColumns<T>(
  rows: readonly T[],
  columns: readonly InternalListColumn<T>[],
  visibleColumnIds: readonly string[],
  searches: InternalListColumnSearches
): readonly T[] {
  const visibleIds = new Set(visibleColumnIds);
  const activeSearches = columns
    .filter(column => visibleIds.has(column.id))
    .map(column => ({ column, query: normalizeInternalListSearch(searches[column.id]) }))
    .filter(item => item.query.length > 0);

  if (!activeSearches.length) return rows;
  return rows.filter(row => activeSearches.every(({ column, query }) =>
    normalizeInternalListSearch(column.searchValue ? column.searchValue(row) : column.value(row)).includes(query)
  ));
}

export function sortInternalListRows<T>(
  rows: readonly T[],
  columns: readonly InternalListColumn<T>[],
  sort: InternalListSort
): readonly T[] {
  if (!sort.columnId || !sort.direction) return rows;
  const column = columns.find(candidate => candidate.id === sort.columnId);
  if (!column) return rows;
  const multiplier = sort.direction === 'asc' ? 1 : -1;

  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const leftValue = column.value(left.row);
      const rightValue = column.value(right.row);
      const leftEmpty = leftValue === null || leftValue === undefined || leftValue === '';
      const rightEmpty = rightValue === null || rightValue === undefined || rightValue === '';
      if (leftEmpty || rightEmpty) {
        if (leftEmpty !== rightEmpty) return leftEmpty ? 1 : -1;
        return left.index - right.index;
      }
      const comparison = column.compare
        ? column.compare(left.row, right.row)
        : compareInternalListValues(leftValue, rightValue);
      return comparison === 0 ? left.index - right.index : comparison * multiplier;
    })
    .map(item => item.row);
}

export function compareInternalListValues(left: InternalListValue, right: InternalListValue): number {
  const leftEmpty = left === null || left === undefined || left === '';
  const rightEmpty = right === null || right === undefined || right === '';
  if (leftEmpty || rightEmpty) return leftEmpty === rightEmpty ? 0 : leftEmpty ? 1 : -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  return normalizeInternalListSearch(left).localeCompare(normalizeInternalListSearch(right), 'fa', {
    numeric: true,
    sensitivity: 'base'
  });
}

export function nextInternalListSort(current: InternalListSort, columnId: string): InternalListSort {
  if (current.columnId !== columnId) return { columnId, direction: 'asc' };
  if (current.direction === 'asc') return { columnId, direction: 'desc' };
  return { columnId: null, direction: null };
}

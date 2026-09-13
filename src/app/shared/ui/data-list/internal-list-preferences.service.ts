import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';

interface StoredColumnPreference {
  readonly version: 1;
  readonly selectedColumnIds: readonly string[];
}

interface StoredFilterPreference<T> {
  readonly version: 1;
  readonly filters: T;
}

@Injectable({ providedIn: 'root' })
export class InternalListPreferencesService {
  private readonly authService = inject(AuthService);
  private readonly columnStoragePrefix = 'fish24.internal-list-columns.v1';
  private readonly filterStoragePrefix = 'fish24.internal-list-filters.v1';

  load(listId: string, availableColumnIds: readonly string[], defaultColumnIds: readonly string[]): readonly string[] {
    const safeDefaults = this.sanitize(defaultColumnIds, availableColumnIds, availableColumnIds);
    if (typeof localStorage === 'undefined') return safeDefaults;
    try {
      const raw = localStorage.getItem(this.columnStorageKey(listId));
      if (!raw) return safeDefaults;
      const stored = JSON.parse(raw) as Partial<StoredColumnPreference>;
      if (stored.version !== 1 || !Array.isArray(stored.selectedColumnIds)) return safeDefaults;
      return this.sanitize(stored.selectedColumnIds, availableColumnIds, safeDefaults);
    } catch {
      return safeDefaults;
    }
  }

  save(listId: string, selectedColumnIds: readonly string[], availableColumnIds: readonly string[]): readonly string[] {
    const safeSelection = this.sanitize(selectedColumnIds, availableColumnIds, availableColumnIds);
    if (typeof localStorage !== 'undefined') {
      try {
        const value: StoredColumnPreference = { version: 1, selectedColumnIds: safeSelection };
        localStorage.setItem(this.columnStorageKey(listId), JSON.stringify(value));
      } catch {
        // A storage failure must not make the list unusable.
      }
    }
    return safeSelection;
  }

  reset(listId: string, availableColumnIds: readonly string[], defaultColumnIds: readonly string[]): readonly string[] {
    const defaults = this.sanitize(defaultColumnIds, availableColumnIds, availableColumnIds);
    if (typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(this.columnStorageKey(listId)); } catch { }
    }
    return defaults;
  }

  storageKeyFor(listId: string): string {
    return this.columnStorageKey(listId);
  }

  loadFilters<T>(listId: string, defaults: T, validate: (value: unknown) => T | null): T {
    if (typeof localStorage === 'undefined') return defaults;
    try {
      const raw = localStorage.getItem(this.filterStorageKey(listId));
      if (!raw) return defaults;
      const stored = JSON.parse(raw) as Partial<StoredFilterPreference<unknown>>;
      if (stored.version !== 1 || !Object.prototype.hasOwnProperty.call(stored, 'filters')) return defaults;
      return validate(stored.filters) ?? defaults;
    } catch {
      return defaults;
    }
  }

  saveFilters<T>(listId: string, filters: T): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const value: StoredFilterPreference<T> = { version: 1, filters };
      localStorage.setItem(this.filterStorageKey(listId), JSON.stringify(value));
    } catch {
      // A storage failure must not make the list unusable.
    }
  }

  resetFilters(listId: string): void {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(this.filterStorageKey(listId)); } catch { }
  }

  filterStorageKeyFor(listId: string): string {
    return this.filterStorageKey(listId);
  }

  private columnStorageKey(listId: string): string {
    return `${this.columnStoragePrefix}:${this.userIdentity()}:${listId}`;
  }

  private filterStorageKey(listId: string): string {
    return `${this.filterStoragePrefix}:${this.userIdentity()}:${listId}`;
  }

  private userIdentity(): string {
    const user = this.authService.currentUser();
    const identity = user?.id || user?.mobile || 'anonymous';
    return encodeURIComponent(identity);
  }

  private sanitize(
    requestedIds: readonly string[],
    availableIds: readonly string[],
    fallbackIds: readonly string[]
  ): readonly string[] {
    const requested = new Set(requestedIds);
    const selection = availableIds.filter(id => requested.has(id));
    if (selection.length) return selection;
    const fallback = new Set(fallbackIds);
    const safeFallback = availableIds.filter(id => fallback.has(id));
    return safeFallback.length ? safeFallback : availableIds.slice(0, 1);
  }
}

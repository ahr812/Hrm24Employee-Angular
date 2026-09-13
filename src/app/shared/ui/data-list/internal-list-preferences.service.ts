import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';

interface StoredColumnPreference {
  readonly version: 1;
  readonly selectedColumnIds: readonly string[];
}

@Injectable({ providedIn: 'root' })
export class InternalListPreferencesService {
  private readonly authService = inject(AuthService);
  private readonly storagePrefix = 'fish24.internal-list-columns.v1';

  load(listId: string, availableColumnIds: readonly string[], defaultColumnIds: readonly string[]): readonly string[] {
    const safeDefaults = this.sanitize(defaultColumnIds, availableColumnIds, availableColumnIds);
    if (typeof localStorage === 'undefined') return safeDefaults;
    try {
      const raw = localStorage.getItem(this.storageKey(listId));
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
        localStorage.setItem(this.storageKey(listId), JSON.stringify(value));
      } catch {
        // A storage failure must not make the list unusable.
      }
    }
    return safeSelection;
  }

  reset(listId: string, availableColumnIds: readonly string[], defaultColumnIds: readonly string[]): readonly string[] {
    const defaults = this.sanitize(defaultColumnIds, availableColumnIds, availableColumnIds);
    if (typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(this.storageKey(listId)); } catch { }
    }
    return defaults;
  }

  storageKeyFor(listId: string): string {
    return this.storageKey(listId);
  }

  private storageKey(listId: string): string {
    const user = this.authService.currentUser();
    const identity = user?.id || user?.mobile || 'anonymous';
    return `${this.storagePrefix}:${encodeURIComponent(identity)}:${listId}`;
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

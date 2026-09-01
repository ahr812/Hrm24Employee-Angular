import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { Fish24RoleId } from '../models/fish24-role.model';

/**
 * TEMPORARY DEVELOPMENT SERVICE
 * 
 * This service provides a role preview mechanism for testing Fish24 administration
 * menu visibility and permission filtering during development.
 * 
 * It is NOT a production authentication mechanism.
 * It does NOT interact with AuthService.
 * It does NOT persist to localStorage or session storage.
 * It is in-memory only and resets on page refresh.
 * 
 * Replace this with authenticated Fish24 role/context integration in a later phase.
 */
@Injectable({ providedIn: 'root' })
export class Fish24RolePreviewService {
  // Default preview role: Super Admin
  private readonly currentPreviewRole = signal<Fish24RoleId>('super-admin');

  // Public signal for reactive template binding
  get previewRole() {
    return this.currentPreviewRole.asReadonly();
  }

  /**
   * Set the preview role for testing administration menu visibility.
   * Valid roles: 'super-admin' | 'sales-expert' | 'support-expert'
   */
  setPreviewRole(role: Fish24RoleId) {
    if (['super-admin', 'sales-expert', 'support-expert'].includes(role)) {
      this.currentPreviewRole.set(role);
    }
  }

  /**
   * Get the current preview role.
   */
  getPreviewRole(): Fish24RoleId {
    return this.currentPreviewRole();
  }

  /**
   * For permission service integration: return the preview role as a single-role array.
   * This allows the permission service to evaluate menu visibility.
   */
  getPreviewRoles(): readonly Fish24RoleId[] {
    return [this.currentPreviewRole()];
  }

  /**
   * Reset to default (Super Admin).
   */
  resetToDefault(): void {
    this.currentPreviewRole.set('super-admin');
  }
}

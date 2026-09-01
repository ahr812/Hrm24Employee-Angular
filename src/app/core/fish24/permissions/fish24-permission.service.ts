import { Injectable } from '@angular/core';
import { Fish24User } from '../models/fish24-user.model';
import { Fish24RoleId } from '../models/fish24-role.model';
import { Fish24Permission, FISH24_PERMISSIONS } from './fish24-permissions';
import { ROLE_CAPABILITIES } from './role-capabilities';

type Fish24PermissionInput =
  | Fish24User
  | { roles?: readonly Fish24RoleId[] }
  | readonly Fish24RoleId[]
  | Fish24RoleId
  | null
  | undefined;

@Injectable({ providedIn: 'root' })
export class Fish24PermissionService {
  hasPermission(input: Fish24PermissionInput, permission: Fish24Permission): boolean {
    return this.getEffectivePermissions(input).includes(permission);
  }

  hasAnyPermission(input: Fish24PermissionInput, permissions: readonly Fish24Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(input, permission));
  }

  hasAllPermissions(input: Fish24PermissionInput, permissions: readonly Fish24Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(input, permission));
  }

  getEffectivePermissions(input: Fish24PermissionInput): readonly Fish24Permission[] {
    const roles = this.resolveRoles(input);
    const permissions = new Set<Fish24Permission>();

    for (const role of roles) {
      const rolePermissions = ROLE_CAPABILITIES[role] ?? [];
      for (const permission of rolePermissions) {
        permissions.add(permission);
      }
    }

    return Array.from(permissions);
  }

  private resolveRoles(input: Fish24PermissionInput): readonly Fish24RoleId[] {
    if (!input) {
      return [];
    }

    if (Array.isArray(input)) {
      return input;
    }

    if (typeof input === 'string') {
      return [input];
    }

    if ('roles' in input && Array.isArray(input.roles)) {
      return input.roles;
    }

    if ('mobile' in input && Array.isArray((input as Fish24User).roles)) {
      return (input as Fish24User).roles;
    }

    return [];
  }
}

export const fish24Permissions = FISH24_PERMISSIONS;

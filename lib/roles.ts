import type { Role } from '@prisma/client';

/** Matches JWT / client `AuthUser.role` */
export type AppRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export function dbRoleToApp(role: Role): AppRole {
  if (role === 'ADMIN') return 'ADMIN';
  if (role === 'MANAGER') return 'MANAGER';
  return 'VIEWER';
}

export function parseAppRole(value: unknown): AppRole | null {
  if (value === 'ADMIN' || value === 'MANAGER' || value === 'VIEWER') return value;
  return null;
}

export function isDataEditor(role: AppRole): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function isSuperAdmin(role: AppRole): boolean {
  return role === 'ADMIN';
}

export function roleLabelFa(role: AppRole): string {
  switch (role) {
    case 'ADMIN':
      return 'مدیر ارشد';
    case 'MANAGER':
      return 'مدیر عملیات';
    case 'VIEWER':
      return 'مشاهده‌گر';
    default:
      return role;
  }
}

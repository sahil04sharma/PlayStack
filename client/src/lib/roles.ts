import type { Role } from '../types';

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  hr_manager: 'HR Manager',
  employee: 'Employee',
};

export const ROLE_BADGE_CLASS: Record<Role, string> = {
  super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  hr_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  employee: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

export function canManageEmployees(role: Role): boolean {
  return role === 'super_admin' || role === 'hr_manager';
}

export function canDeleteEmployees(role: Role): boolean {
  return role === 'super_admin';
}

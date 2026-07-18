import type { ManagerRef } from '../types';

export function managerLabel(
  manager: string | ManagerRef | null | undefined
): string {
  if (!manager) return '—';
  if (typeof manager === 'string') return manager;
  return manager.name;
}

export function managerId(
  manager: string | ManagerRef | null | undefined
): string | null {
  if (!manager) return null;
  if (typeof manager === 'string') return manager;
  return manager._id;
}

export function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatSalary(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

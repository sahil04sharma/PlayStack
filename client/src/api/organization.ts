import { api } from './client';
import type { OrgTreeNode } from '../types';

export async function fetchOrgTree(): Promise<OrgTreeNode[]> {
  const { data } = await api.get<OrgTreeNode[]>('/organization/tree');
  return data;
}

export async function fetchReportees(id: string) {
  const { data } = await api.get(`/employees/${id}/reportees`);
  return data;
}

export async function updateManager(
  employeeId: string,
  managerId: string | null
) {
  const { data } = await api.patch(`/employees/${employeeId}/manager`, {
    managerId,
  });
  return data;
}

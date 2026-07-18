import { api } from './client';
import type { EmployeeDTO, OrgTreeNode } from '../types';

export async function fetchOrgTree(): Promise<OrgTreeNode[]> {
  const { data } = await api.get<OrgTreeNode[]>('/organization/tree');
  return data;
}

export async function fetchReportees(id: string): Promise<EmployeeDTO[]> {
  const { data } = await api.get<EmployeeDTO[]>(`/employees/${id}/reportees`);
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

import { api } from './client';
import type { EmployeeDTO, PaginatedResponse, Role, Status } from '../types';

export interface EmployeeListParams {
  search?: string;
  department?: string;
  role?: Role | '';
  status?: Status | '';
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface EmployeePayload {
  name: string;
  email: string;
  phone: string;
  password?: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: Status;
  role?: Role;
  reportingManager?: string | null;
  profileImage?: string;
}

export async function fetchEmployees(
  params: EmployeeListParams
): Promise<PaginatedResponse<EmployeeDTO>> {
  const { data } = await api.get<PaginatedResponse<EmployeeDTO>>('/employees', {
    params: Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      )
    ),
  });
  return data;
}

export async function fetchEmployee(id: string): Promise<EmployeeDTO> {
  const { data } = await api.get<EmployeeDTO>(`/employees/${id}`);
  return data;
}

export async function createEmployee(
  payload: EmployeePayload
): Promise<EmployeeDTO> {
  const { data } = await api.post<EmployeeDTO>('/employees', payload);
  return data;
}

export async function updateEmployee(
  id: string,
  payload: Partial<EmployeePayload>
): Promise<EmployeeDTO> {
  const { data } = await api.put<EmployeeDTO>(`/employees/${id}`, payload);
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`);
}

export interface ImportResult {
  message: string;
  created: number;
  failed: number;
  createdEmails: string[];
  errors: { row: number; email?: string; reason: string }[];
}

export async function importEmployeesCsv(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<ImportResult>('/employees/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

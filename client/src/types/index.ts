export type Role = 'super_admin' | 'hr_manager' | 'employee';
export type Status = 'active' | 'inactive';

export interface ManagerRef {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
}

export interface EmployeeDTO {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: Status;
  reportingManager: string | ManagerRef | null;
  profileImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { total: number; page: number; pages: number };
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentCount: number;
  departmentBreakdown: { _id: string; count: number }[];
}

export interface OrgTreeNode extends EmployeeDTO {
  directReports: OrgTreeNode[];
}

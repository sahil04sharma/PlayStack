import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Employee from '../models/Employee';
import { Role } from '../types';
import { wouldCreateCycle } from '../utils/hierarchy';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function nextEmployeeId(): Promise<string> {
  const count = await Employee.collection.countDocuments({});
  return `EMP-${String(count + 1).padStart(4, '0')}`;
}

export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
  const {
    search,
    department,
    role,
    status,
    sortBy = 'joiningDate',
    order = 'desc',
    page = '1',
    limit = '10',
  } = req.query as Record<string, string>;

  const query: Record<string, unknown> = {};

  if (search) {
    const safe = escapeRegex(search.trim());
    query.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ];
  }
  if (department) query.department = department;
  if (role) query.role = role;
  if (status) query.status = status;

  const allowedSort = new Set(['joiningDate', 'name', 'email', 'salary', 'createdAt']);
  const sortField = allowedSort.has(sortBy) ? sortBy : 'joiningDate';
  const sortOrder = order === 'asc' ? 1 : -1;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));

  const [employees, total] = await Promise.all([
    Employee.find(query)
      .sort({ [sortField]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('reportingManager', 'name email employeeId'),
    Employee.countDocuments(query),
  ]);

  res.json({
    data: employees,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
  });
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;

  if (req.user.role === 'employee' && String(req.user._id) !== id) {
    res.status(403).json({ message: 'You can only view your own profile' });
    return;
  }

  const employee = await Employee.findById(id).populate(
    'reportingManager',
    'name email employeeId'
  );

  if (!employee) {
    res.status(404).json({ message: 'Employee not found' });
    return;
  }

  res.json(employee);
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const {
    name,
    email,
    phone,
    password,
    department,
    designation,
    salary,
    joiningDate,
    status,
    role,
    reportingManager,
    profileImage,
  } = req.body as {
    name: string;
    email: string;
    phone: string;
    password: string;
    department: string;
    designation: string;
    salary: number;
    joiningDate: string;
    status?: 'active' | 'inactive';
    role?: Role;
    reportingManager?: string | null;
    profileImage?: string;
  };

  let assignedRole: Role = 'employee';
  if (req.user.role === 'super_admin') {
    assignedRole = role ?? 'employee';
  } else if (req.user.role === 'hr_manager') {
    if (role && role !== 'employee') {
      res.status(403).json({
        message: 'HR Manager can only create employees with role employee',
      });
      return;
    }
    assignedRole = 'employee';
  }

  const existing = await Employee.findOne({ email });
  if (existing) {
    res.status(409).json({ message: 'Email already in use' });
    return;
  }

  if (reportingManager) {
    const managerExists = await Employee.findById(reportingManager);
    if (!managerExists) {
      res.status(404).json({ message: 'Reporting manager not found' });
      return;
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const employeeId = await nextEmployeeId();

  // New employee has no subordinates yet — cycle only if manager === self (impossible on create)
  const employee = await Employee.create({
    employeeId,
    name,
    email,
    phone,
    passwordHash,
    role: assignedRole,
    department,
    designation,
    salary,
    joiningDate: new Date(joiningDate),
    status: status ?? 'active',
    reportingManager: reportingManager || null,
    profileImage: profileImage ?? '',
  });

  const created = await Employee.findById(employee._id).populate(
    'reportingManager',
    'name email employeeId'
  );

  res.status(201).json(created);
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;
  const body = { ...(req.body as Record<string, unknown>) };

  const target = await Employee.findById(id);
  if (!target) {
    res.status(404).json({ message: 'Employee not found' });
    return;
  }

  // HR cannot assign roles
  if (req.user.role === 'hr_manager') {
    delete body.role;
  }

  // Only Super Admin can assign super_admin
  if (body.role === 'super_admin' && req.user.role !== 'super_admin') {
    res.status(403).json({ message: 'Cannot assign Super Admin role' });
    return;
  }

  const rawPassword = body.password;
  delete body.password;
  delete body.passwordHash;
  delete body.employeeId;
  delete body.isDeleted;

  if (
    typeof rawPassword === 'string' &&
    rawPassword.length > 0 &&
    req.user.role !== 'employee'
  ) {
    body.passwordHash = await bcrypt.hash(rawPassword, 10);
  }

  if (body.email && body.email !== target.email) {
    const clash = await Employee.findOne({ email: body.email as string });
    if (clash) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }
  }

  if (body.joiningDate) {
    body.joiningDate = new Date(body.joiningDate as string);
  }

  if (body.reportingManager === '') {
    body.reportingManager = null;
  }

  if (body.reportingManager) {
    const managerId = String(body.reportingManager);
    const managerExists = await Employee.findById(managerId);
    if (!managerExists) {
      res.status(404).json({ message: 'Reporting manager not found' });
      return;
    }
    const cycle = await wouldCreateCycle(String(id), managerId);
    if (cycle) {
      res.status(400).json({
        message: 'This would create a circular reporting chain',
      });
      return;
    }
  }

  const updated = await Employee.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  }).populate('reportingManager', 'name email employeeId');

  res.json(updated);
};

export const softDeleteEmployee = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (req.user && String(req.user._id) === id) {
    res.status(400).json({ message: 'You cannot delete your own account' });
    return;
  }

  const employee = await Employee.findByIdAndUpdate(
    id,
    { isDeleted: true, status: 'inactive' },
    { new: true }
  );

  if (!employee) {
    res.status(404).json({ message: 'Employee not found' });
    return;
  }

  res.json({ message: 'Employee soft-deleted', id: employee._id });
};

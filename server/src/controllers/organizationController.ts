import { Request, Response } from 'express';
import Employee from '../models/Employee';
import { OrgTreeNode, Role, Status } from '../types';
import { wouldCreateCycle } from '../utils/hierarchy';

interface LeanEmployee {
  _id: { toString(): string };
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  department: string;
  designation: string;
  salary: number;
  joiningDate: Date | string;
  status: Status;
  reportingManager?: { toString(): string } | null;
  profileImage: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function toTreeNode(e: LeanEmployee, directReports: OrgTreeNode[]): OrgTreeNode {
  return {
    _id: String(e._id),
    employeeId: e.employeeId,
    name: e.name,
    email: e.email,
    phone: e.phone,
    role: e.role,
    department: e.department,
    designation: e.designation,
    salary: e.salary,
    joiningDate: toIso(e.joiningDate),
    status: e.status,
    reportingManager: e.reportingManager ? String(e.reportingManager) : null,
    profileImage: e.profileImage,
    createdAt: toIso(e.createdAt),
    updatedAt: toIso(e.updatedAt),
    directReports,
  };
}

function buildTree(
  all: LeanEmployee[],
  managerId: string | null = null
): OrgTreeNode[] {
  return all
    .filter((e) => String(e.reportingManager || null) === String(managerId))
    .map((e) => toTreeNode(e, buildTree(all, String(e._id))));
}

function findSubtree(
  nodes: OrgTreeNode[],
  employeeId: string
): OrgTreeNode | null {
  for (const node of nodes) {
    if (node._id === employeeId) return node;
    const found = findSubtree(node.directReports, employeeId);
    if (found) return found;
  }
  return null;
}

export const getOrgTree = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const all = (await Employee.find().lean()) as unknown as LeanEmployee[];
  const fullTree = buildTree(all, null);

  if (req.user.role === 'employee') {
    const branch = findSubtree(fullTree, String(req.user._id));
    res.json(branch ? [branch] : []);
    return;
  }

  res.json(fullTree);
};

export const getReportees = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;

  if (req.user.role === 'employee' && String(req.user._id) !== id) {
    res.status(403).json({ message: 'You can only view your own reportees' });
    return;
  }

  const reportees = await Employee.find({ reportingManager: id });
  res.json(reportees);
};

export const updateManager = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { managerId } = req.body as { managerId?: string | null };

  const employee = await Employee.findById(id);
  if (!employee) {
    res.status(404).json({ message: 'Employee not found' });
    return;
  }

  if (managerId) {
    const manager = await Employee.findById(managerId);
    if (!manager) {
      res.status(404).json({ message: 'Manager not found' });
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

  const updated = await Employee.findByIdAndUpdate(
    id,
    { reportingManager: managerId || null },
    { new: true }
  ).populate('reportingManager', 'name email employeeId');

  res.json(updated);
};

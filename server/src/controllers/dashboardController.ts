import { Request, Response } from 'express';
import Employee from '../models/Employee';
import { DashboardStats } from '../types';

const notDeleted = { isDeleted: { $ne: true } };

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  const [total, active, inactive, byDept] = await Promise.all([
    Employee.countDocuments(notDeleted),
    Employee.countDocuments({ ...notDeleted, status: 'active' }),
    Employee.countDocuments({ ...notDeleted, status: 'inactive' }),
    Employee.aggregate<{ _id: string; count: number }>([
      { $match: notDeleted },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const stats: DashboardStats = {
    totalEmployees: total,
    activeEmployees: active,
    inactiveEmployees: inactive,
    departmentCount: byDept.length,
    departmentBreakdown: byDept,
  };

  res.json(stats);
};

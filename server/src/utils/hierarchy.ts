import { Types } from 'mongoose';
import Employee, { IEmployee } from '../models/Employee';

/**
 * Walk up the prospective manager's chain.
 * Cycle if employeeId appears in that chain, or manager === employee.
 */
export async function wouldCreateCycle(
  employeeId: string,
  newManagerId: string
): Promise<boolean> {
  if (!newManagerId) return false;
  if (employeeId === newManagerId) return true;

  let current: Types.ObjectId | null = new Types.ObjectId(newManagerId);
  const visited = new Set<string>();

  while (current) {
    const currentStr = current.toString();
    if (visited.has(currentStr)) break;
    if (currentStr === employeeId) return true;
    visited.add(currentStr);

    const mgr: Pick<IEmployee, 'reportingManager'> | null = await Employee.findById(
      current
    ).select('reportingManager');
    current = mgr?.reportingManager ?? null;
  }

  return false;
}

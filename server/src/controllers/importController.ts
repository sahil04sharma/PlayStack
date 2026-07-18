import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { parse } from 'csv-parse/sync';
import Employee from '../models/Employee';
import { Role, Status } from '../types';

interface CsvRow {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  department?: string;
  designation?: string;
  salary?: string;
  joiningDate?: string;
  status?: string;
  role?: string;
}

async function nextEmployeeId(): Promise<string> {
  const count = await Employee.collection.countDocuments({});
  return `EMP-${String(count + 1).padStart(4, '0')}`;
}

export const importEmployeesCsv = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ message: 'CSV file is required (field name: file)' });
    return;
  }

  let rows: CsvRow[];
  try {
    rows = parse(file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRow[];
  } catch {
    res.status(400).json({ message: 'Invalid CSV format' });
    return;
  }

  if (rows.length === 0) {
    res.status(400).json({ message: 'CSV has no data rows' });
    return;
  }

  const created: string[] = [];
  const failed: { row: number; email?: string; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // header is row 1

    try {
      const name = row.name?.trim();
      const email = row.email?.trim().toLowerCase();
      const phone = row.phone?.trim();
      const password = row.password?.trim() || 'Password123!';
      const department = row.department?.trim();
      const designation = row.designation?.trim();
      const salary = Number(row.salary);
      const joiningDate = row.joiningDate?.trim();
      const status = (row.status?.trim() || 'active') as Status;
      let role = (row.role?.trim() || 'employee') as Role;

      if (!name || !email || !phone || !department || !designation || !joiningDate) {
        failed.push({
          row: rowNum,
          email,
          reason: 'Missing required fields',
        });
        continue;
      }
      if (!/^\d{10}$/.test(phone)) {
        failed.push({ row: rowNum, email, reason: 'Phone must be 10 digits' });
        continue;
      }
      if (!Number.isFinite(salary) || salary < 0) {
        failed.push({ row: rowNum, email, reason: 'Invalid salary' });
        continue;
      }
      if (Number.isNaN(Date.parse(joiningDate))) {
        failed.push({ row: rowNum, email, reason: 'Invalid joiningDate' });
        continue;
      }
      if (!['active', 'inactive'].includes(status)) {
        failed.push({ row: rowNum, email, reason: 'Invalid status' });
        continue;
      }
      if (!['super_admin', 'hr_manager', 'employee'].includes(role)) {
        failed.push({ row: rowNum, email, reason: 'Invalid role' });
        continue;
      }

      if (req.user.role === 'hr_manager') {
        if (role !== 'employee') {
          failed.push({
            row: rowNum,
            email,
            reason: 'HR can only import employees with role employee',
          });
          continue;
        }
        role = 'employee';
      }

      const exists = await Employee.findOne({ email });
      if (exists) {
        failed.push({ row: rowNum, email, reason: 'Email already in use' });
        continue;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const employeeId = await nextEmployeeId();

      await Employee.create({
        employeeId,
        name,
        email,
        phone,
        passwordHash,
        role,
        department,
        designation,
        salary,
        joiningDate: new Date(joiningDate),
        status,
        reportingManager: null,
        profileImage: '',
      });

      created.push(email);
    } catch (err) {
      failed.push({
        row: rowNum,
        email: row.email,
        reason: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  res.status(200).json({
    message: 'CSV import finished',
    created: created.length,
    failed: failed.length,
    createdEmails: created,
    errors: failed,
  });
};

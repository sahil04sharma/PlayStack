# EMS — Code Reference Drafts (TypeScript, full stack)

Reference implementations for the trickiest pieces (auth, RBAC, hierarchy).
Backend is TypeScript + Express + Mongoose. Adapt these into your project —
they're correct logic, not final polish.

## 0. Backend setup

```bash
npm init -y
npm install express mongoose bcrypt jsonwebtoken cors dotenv express-validator
npm install -D typescript ts-node-dev @types/node @types/express @types/bcrypt @types/jsonwebtoken @types/cors
npx tsc --init
```

`tsconfig.json` (key options):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

`package.json` scripts:
```json
"scripts": {
  "dev": "ts-node-dev --respawn src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

---

## 1. Shared types — `src/types/index.ts`

Mirror this file (or publish as a shared package) on the frontend so both
sides agree on shapes — this is the actual payoff of full-stack TS.

```ts
export type Role = 'super_admin' | 'hr_manager' | 'employee';
export type Status = 'active' | 'inactive';

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
  reportingManager: string | null;
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
```

---

## 2. Mongoose model — `src/models/Employee.ts`

```ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { Role, Status } from '../types';

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: Role;
  department: string;
  designation: string;
  salary: number;
  joiningDate: Date;
  status: Status;
  reportingManager: Types.ObjectId | null;
  profileImage: string;
  isDeleted: boolean;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeId: { type: String, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },

    role: { type: String, enum: ['super_admin', 'hr_manager', 'employee'], default: 'employee' },

    department: { type: String, required: true },
    designation: { type: String, required: true },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },

    reportingManager: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    profileImage: { type: String, default: '' },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

employeeSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  if (!this.getQuery().includeDeleted) this.where({ isDeleted: { $ne: true } });
  next();
});

export default mongoose.model<IEmployee>('Employee', employeeSchema);
```

---

## 3. Express type augmentation — `src/types/express.d.ts`

Needed so `req.user` is typed instead of `any` everywhere.

```ts
import { IEmployee } from '../models/Employee';

declare global {
  namespace Express {
    interface Request {
      user?: IEmployee;
    }
  }
}
```

---

## 4. Auth controller — `src/controllers/authController.ts`

```ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Employee from '../models/Employee';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password required' });
    return;
  }

  const user = await Employee.findOne({ email }).select('+passwordHash');
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '1d' }
  );

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Logged out' });
};
```

---

## 5. Auth middleware — `src/middleware/auth.ts`

```ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Employee from '../models/Employee';

interface JwtPayload {
  id: string;
  role: string;
}

export const verifyJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET as string) as JwtPayload;
    const user = await Employee.findById(decoded.id);
    if (!user || user.status === 'inactive') {
      res.status(401).json({ message: 'Invalid session' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

---

## 6. RBAC middleware — `src/middleware/rbac.ts`

```ts
import { Request, Response, NextFunction } from 'express';
import { Role } from '../types';

export const authorize = (...allowedRoles: Role[]) => (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !allowedRoles.includes(req.user.role as Role)) {
    res.status(403).json({ message: 'Forbidden: insufficient role' });
    return;
  }
  next();
};

// Employee can only edit their own profile, and only limited fields
export const restrictSelfEdit = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  if (req.user.role !== 'employee') {
    next();
    return;
  }
  if (req.user._id.toString() !== req.params.id) {
    res.status(403).json({ message: 'You can only edit your own profile' });
    return;
  }
  const allowedFields = ['phone', 'profileImage'];
  Object.keys(req.body).forEach((key) => {
    if (!allowedFields.includes(key)) delete req.body[key];
  });
  next();
};
```

Route wiring:

```ts
// src/routes/employeeRoutes.ts
import { Router } from 'express';
import { verifyJWT } from '../middleware/auth';
import { authorize, restrictSelfEdit } from '../middleware/rbac';
import * as employeeController from '../controllers/employeeController';

const router = Router();
router.use(verifyJWT);

router.get('/', authorize('super_admin', 'hr_manager'), employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', authorize('super_admin', 'hr_manager'), employeeController.createEmployee);
router.put('/:id', restrictSelfEdit, employeeController.updateEmployee);
router.delete('/:id', authorize('super_admin'), employeeController.softDeleteEmployee);
router.patch('/:id/manager', authorize('super_admin', 'hr_manager'), employeeController.updateManager);

export default router;
```

---

## 7. Circular reporting prevention + hierarchy — `src/controllers/organizationController.ts`

```ts
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Employee from '../models/Employee';
import { OrgTreeNode } from '../types';

async function wouldCreateCycle(employeeId: string, newManagerId: string): Promise<boolean> {
  if (!newManagerId) return false;
  if (employeeId.toString() === newManagerId.toString()) return true;

  let current: Types.ObjectId | null | undefined = new Types.ObjectId(newManagerId);
  const visited = new Set<string>();

  while (current) {
    const currentStr = current.toString();
    if (visited.has(currentStr)) break; // guard against pre-existing bad data
    if (currentStr === employeeId.toString()) return true;
    visited.add(currentStr);

    const mgr = await Employee.findById(current).select('reportingManager');
    current = mgr?.reportingManager ?? null;
  }
  return false;
}

export const updateManager = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { managerId } = req.body as { managerId?: string };

  if (managerId) {
    const cycle = await wouldCreateCycle(id, managerId);
    if (cycle) {
      res.status(400).json({ message: 'This would create a circular reporting chain' });
      return;
    }
  }

  const updated = await Employee.findByIdAndUpdate(
    id,
    { reportingManager: managerId || null },
    { new: true }
  );
  res.json(updated);
};

export const getReportees = async (req: Request, res: Response): Promise<void> => {
  const reportees = await Employee.find({ reportingManager: req.params.id });
  res.json(reportees);
};

export const getOrgTree = async (_req: Request, res: Response): Promise<void> => {
  const all = await Employee.find().lean();

  function buildTree(managerId: string | null = null): OrgTreeNode[] {
    return all
      .filter((e) => String(e.reportingManager || null) === String(managerId))
      .map((e) => ({
        ...(e as any),
        directReports: buildTree(String(e._id)),
      }));
  }

  res.json(buildTree(null));
};
```

---

## 8. Dashboard stats — `src/controllers/dashboardController.ts`

```ts
import { Request, Response } from 'express';
import Employee from '../models/Employee';

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  const [total, active, inactive, byDept] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: 'active' }),
    Employee.countDocuments({ status: 'inactive' }),
    Employee.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]),
  ]);

  res.json({
    totalEmployees: total,
    activeEmployees: active,
    inactiveEmployees: inactive,
    departmentCount: byDept.length,
    departmentBreakdown: byDept,
  });
};
```

---

## 9. Search / filter / sort / pagination — `src/controllers/employeeController.ts`

```ts
import { Request, Response } from 'express';
import Employee from '../models/Employee';

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

  const query: Record<string, any> = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (department) query.department = department;
  if (role) query.role = role;
  if (status) query.status = status;

  const sortOrder = order === 'asc' ? 1 : -1;
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const [employees, total] = await Promise.all([
    Employee.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Employee.countDocuments(query),
  ]);

  res.json({
    data: employees,
    pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
  });
};
```

---

## 10. Validation — `src/validators/employeeValidator.ts`

```ts
import { body } from 'express-validator';

export const employeeValidationRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('joiningDate').isISO8601().withMessage('Valid joining date required'),
  body('department').notEmpty(),
  body('designation').notEmpty(),
];
```

---

## 11. Seed script — `src/seed.ts`

```ts
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Employee from './models/Employee';

async function seed(): Promise<void> {
  await mongoose.connect(process.env.MONGO_URI as string);
  await Employee.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const superAdmin = await Employee.create({
    employeeId: 'EMP-0001',
    name: 'Alex Super',
    email: 'admin@ems.test',
    phone: '9999999999',
    passwordHash,
    role: 'super_admin',
    department: 'Executive',
    designation: 'CEO',
    salary: 200000,
    joiningDate: new Date('2020-01-01'),
    status: 'active',
  });

  const hr = await Employee.create({
    employeeId: 'EMP-0002',
    name: 'Priya HR',
    email: 'hr@ems.test',
    phone: '9888888888',
    passwordHash,
    role: 'hr_manager',
    department: 'Human Resources',
    designation: 'HR Manager',
    salary: 90000,
    joiningDate: new Date('2021-03-01'),
    status: 'active',
    reportingManager: superAdmin._id,
  });

  await Employee.create({
    employeeId: 'EMP-0003',
    name: 'Sahil Employee',
    email: 'employee@ems.test',
    phone: '9777777777',
    passwordHash,
    role: 'employee',
    department: 'Engineering',
    designation: 'Full Stack Developer',
    salary: 60000,
    joiningDate: new Date('2023-06-15'),
    status: 'active',
    reportingManager: hr._id,
  });

  console.log('Seeded 3 users: admin@ems.test / hr@ems.test / employee@ems.test');
  console.log('Password for all: Password123!');
  process.exit(0);
}

seed();
```

---

## 12. Frontend note

On the frontend (React + TS), reuse the exact same interfaces from
`src/types/index.ts` above — copy the file into `client/src/types/index.ts`
(or extract both into a shared `packages/shared-types` folder if you want to
go further). This is what makes full-stack TS pay off: your API client
functions, form schemas (zod), and component props all reference the same
`EmployeeDTO`, `Role`, `AuthUser` types, so a mismatch between what the
backend sends and what the frontend expects becomes a compile error instead
of a runtime bug.

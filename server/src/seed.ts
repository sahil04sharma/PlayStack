import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Employee from './models/Employee';
import type { Role, Status } from './types';

interface SeedEmployee {
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
  managerEmail?: string;
}

const EXTRA_EMPLOYEES: Omit<SeedEmployee, 'employeeId' | 'phone'>[] = [
  {
    name: 'Jordan Lee',
    email: 'jordan.lee@ems.test',
    role: 'employee',
    department: 'Engineering',
    designation: 'Backend Developer',
    salary: 72000,
    joiningDate: '2022-01-10',
    status: 'active',
    managerEmail: 'employee@ems.test',
  },
  {
    name: 'Maya Patel',
    email: 'maya.patel@ems.test',
    role: 'employee',
    department: 'Engineering',
    designation: 'Frontend Developer',
    salary: 70000,
    joiningDate: '2022-03-22',
    status: 'active',
    managerEmail: 'employee@ems.test',
  },
  {
    name: 'Chris Nguyen',
    email: 'chris.nguyen@ems.test',
    role: 'employee',
    department: 'Engineering',
    designation: 'DevOps Engineer',
    salary: 78000,
    joiningDate: '2021-11-05',
    status: 'active',
    managerEmail: 'hr@ems.test',
  },
  {
    name: 'Aisha Khan',
    email: 'aisha.khan@ems.test',
    role: 'employee',
    department: 'Engineering',
    designation: 'QA Engineer',
    salary: 58000,
    joiningDate: '2023-02-14',
    status: 'active',
    managerEmail: 'employee@ems.test',
  },
  {
    name: 'Ben Torres',
    email: 'ben.torres@ems.test',
    role: 'employee',
    department: 'Engineering',
    designation: 'Mobile Developer',
    salary: 68000,
    joiningDate: '2023-08-01',
    status: 'inactive',
    managerEmail: 'employee@ems.test',
  },
  {
    name: 'Sofia Martinez',
    email: 'sofia.martinez@ems.test',
    role: 'hr_manager',
    department: 'Human Resources',
    designation: 'HR Specialist',
    salary: 65000,
    joiningDate: '2022-06-18',
    status: 'active',
    managerEmail: 'hr@ems.test',
  },
  {
    name: 'Liam Chen',
    email: 'liam.chen@ems.test',
    role: 'employee',
    department: 'Human Resources',
    designation: 'Recruiter',
    salary: 52000,
    joiningDate: '2024-01-08',
    status: 'active',
    managerEmail: 'hr@ems.test',
  },
  {
    name: 'Emma Wilson',
    email: 'emma.wilson@ems.test',
    role: 'employee',
    department: 'Sales',
    designation: 'Sales Lead',
    salary: 85000,
    joiningDate: '2021-05-12',
    status: 'active',
    managerEmail: 'admin@ems.test',
  },
  {
    name: 'Noah Brown',
    email: 'noah.brown@ems.test',
    role: 'employee',
    department: 'Sales',
    designation: 'Account Executive',
    salary: 62000,
    joiningDate: '2022-09-30',
    status: 'active',
    managerEmail: 'emma.wilson@ems.test',
  },
  {
    name: 'Olivia Davis',
    email: 'olivia.davis@ems.test',
    role: 'employee',
    department: 'Sales',
    designation: 'SDR',
    salary: 48000,
    joiningDate: '2023-04-17',
    status: 'active',
    managerEmail: 'emma.wilson@ems.test',
  },
  {
    name: 'Ethan Clark',
    email: 'ethan.clark@ems.test',
    role: 'employee',
    department: 'Sales',
    designation: 'Account Manager',
    salary: 64000,
    joiningDate: '2023-12-01',
    status: 'inactive',
    managerEmail: 'emma.wilson@ems.test',
  },
  {
    name: 'Ava Robinson',
    email: 'ava.robinson@ems.test',
    role: 'employee',
    department: 'Marketing',
    designation: 'Marketing Manager',
    salary: 80000,
    joiningDate: '2021-08-20',
    status: 'active',
    managerEmail: 'admin@ems.test',
  },
  {
    name: 'Mason Lewis',
    email: 'mason.lewis@ems.test',
    role: 'employee',
    department: 'Marketing',
    designation: 'Content Strategist',
    salary: 56000,
    joiningDate: '2022-12-05',
    status: 'active',
    managerEmail: 'ava.robinson@ems.test',
  },
  {
    name: 'Isabella Walker',
    email: 'isabella.walker@ems.test',
    role: 'employee',
    department: 'Marketing',
    designation: 'Designer',
    salary: 59000,
    joiningDate: '2023-07-11',
    status: 'active',
    managerEmail: 'ava.robinson@ems.test',
  },
  {
    name: 'Lucas Hall',
    email: 'lucas.hall@ems.test',
    role: 'employee',
    department: 'Finance',
    designation: 'Finance Manager',
    salary: 95000,
    joiningDate: '2020-10-01',
    status: 'active',
    managerEmail: 'admin@ems.test',
  },
  {
    name: 'Mia Allen',
    email: 'mia.allen@ems.test',
    role: 'employee',
    department: 'Finance',
    designation: 'Accountant',
    salary: 55000,
    joiningDate: '2022-02-28',
    status: 'active',
    managerEmail: 'lucas.hall@ems.test',
  },
  {
    name: 'James Young',
    email: 'james.young@ems.test',
    role: 'employee',
    department: 'Finance',
    designation: 'Financial Analyst',
    salary: 61000,
    joiningDate: '2023-09-15',
    status: 'active',
    managerEmail: 'lucas.hall@ems.test',
  },
  {
    name: 'Charlotte King',
    email: 'charlotte.king@ems.test',
    role: 'employee',
    department: 'Engineering',
    designation: 'Tech Lead',
    salary: 110000,
    joiningDate: '2020-04-01',
    status: 'active',
    managerEmail: 'hr@ems.test',
  },
  {
    name: 'Henry Wright',
    email: 'henry.wright@ems.test',
    role: 'employee',
    department: 'Engineering',
    designation: 'Junior Developer',
    salary: 45000,
    joiningDate: '2024-03-01',
    status: 'active',
    managerEmail: 'charlotte.king@ems.test',
  },
  {
    name: 'Amelia Scott',
    email: 'amelia.scott@ems.test',
    role: 'employee',
    department: 'Human Resources',
    designation: 'HR Coordinator',
    salary: 47000,
    joiningDate: '2024-05-20',
    status: 'active',
    managerEmail: 'sofia.martinez@ems.test',
  },
  {
    name: 'Daniel Green',
    email: 'daniel.green@ems.test',
    role: 'employee',
    department: 'Sales',
    designation: 'Sales Intern',
    salary: 30000,
    joiningDate: '2024-06-01',
    status: 'inactive',
    managerEmail: 'noah.brown@ems.test',
  },
  {
    name: 'Harper Adams',
    email: 'harper.adams@ems.test',
    role: 'employee',
    department: 'Marketing',
    designation: 'Social Media Associate',
    salary: 42000,
    joiningDate: '2024-02-12',
    status: 'active',
    managerEmail: 'mason.lewis@ems.test',
  },
];

function padId(n: number): string {
  return `EMP-${String(n).padStart(4, '0')}`;
}

function phoneFor(n: number): string {
  return `9${String(100000000 + n).slice(0, 9)}`;
}

async function seed(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set');
  }

  await mongoose.connect(mongoUri);
  await Employee.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const byEmail = new Map<string, mongoose.Types.ObjectId>();

  const core: SeedEmployee[] = [
    {
      employeeId: 'EMP-0001',
      name: 'Alex Super',
      email: 'admin@ems.test',
      phone: '9999999999',
      role: 'super_admin',
      department: 'Executive',
      designation: 'CEO',
      salary: 200000,
      joiningDate: '2020-01-01',
      status: 'active',
    },
    {
      employeeId: 'EMP-0002',
      name: 'Priya HR',
      email: 'hr@ems.test',
      phone: '9888888888',
      role: 'hr_manager',
      department: 'Human Resources',
      designation: 'HR Manager',
      salary: 90000,
      joiningDate: '2021-03-01',
      status: 'active',
      managerEmail: 'admin@ems.test',
    },
    {
      employeeId: 'EMP-0003',
      name: 'Sahil Employee',
      email: 'employee@ems.test',
      phone: '9777777777',
      role: 'employee',
      department: 'Engineering',
      designation: 'Full Stack Developer',
      salary: 60000,
      joiningDate: '2023-06-15',
      status: 'active',
      managerEmail: 'hr@ems.test',
    },
  ];

  // Pass 1: create everyone without managers
  let counter = 1;
  for (const person of core) {
    const created = await Employee.create({
      ...person,
      passwordHash,
      joiningDate: new Date(person.joiningDate),
      reportingManager: null,
    });
    byEmail.set(person.email, created._id as mongoose.Types.ObjectId);
    counter += 1;
  }

  for (const person of EXTRA_EMPLOYEES) {
    const created = await Employee.create({
      employeeId: padId(counter),
      name: person.name,
      email: person.email,
      phone: phoneFor(counter),
      passwordHash,
      role: person.role,
      department: person.department,
      designation: person.designation,
      salary: person.salary,
      joiningDate: new Date(person.joiningDate),
      status: person.status,
      reportingManager: null,
    });
    byEmail.set(person.email, created._id as mongoose.Types.ObjectId);
    counter += 1;
  }

  // Pass 2: wire reporting managers
  const allPeople = [...core, ...EXTRA_EMPLOYEES.map((p, i) => ({
    ...p,
    employeeId: padId(i + 4),
    phone: phoneFor(i + 4),
  }))];

  for (const person of allPeople) {
    if (!person.managerEmail) continue;
    const selfId = byEmail.get(person.email);
    const managerId = byEmail.get(person.managerEmail);
    if (!selfId || !managerId) continue;
    await Employee.findByIdAndUpdate(selfId, { reportingManager: managerId });
  }

  const total = await Employee.countDocuments();
  console.log(`Seeded ${total} employees (enough for multi-page lists at limit=10).`);
  console.log('Login credentials (password for all: Password123!):');
  console.log('  admin@ems.test      → super_admin');
  console.log('  hr@ems.test         → hr_manager');
  console.log('  employee@ems.test   → employee');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

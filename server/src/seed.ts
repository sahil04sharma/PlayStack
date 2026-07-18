import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Employee from './models/Employee';

async function seed(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set');
  }

  await mongoose.connect(mongoUri);
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

  console.log('Seeded 3 users:');
  console.log('  admin@ems.test / Password123!  (super_admin)');
  console.log('  hr@ems.test / Password123!     (hr_manager)');
  console.log('  employee@ems.test / Password123! (employee)');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

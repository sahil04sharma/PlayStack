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
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeId: { type: String, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ['super_admin', 'hr_manager', 'employee'],
      default: 'employee',
    },

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

employeeSchema.pre(/^find/, function (this: mongoose.Query<unknown, IEmployee>) {
  const query = this.getQuery() as { includeDeleted?: boolean };
  if (!query.includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

export default mongoose.model<IEmployee>('Employee', employeeSchema);

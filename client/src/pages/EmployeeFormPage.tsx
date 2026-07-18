import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import {
  createEmployee,
  fetchEmployee,
  fetchEmployees,
  updateEmployee,
} from '../api/employees';
import { useAuth } from '../context/AuthContext';
import { managerId } from '../lib/format';
import { canManageEmployees } from '../lib/roles';
import type { EmployeeDTO, Role } from '../types';

const DEPARTMENTS = [
  'Executive',
  'Human Resources',
  'Engineering',
  'Sales',
  'Marketing',
  'Finance',
];

const baseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  password: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  salary: z.number().min(0, 'Salary must be a positive number'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.enum(['active', 'inactive']),
  role: z.enum(['super_admin', 'hr_manager', 'employee']),
  reportingManager: z.string().optional(),
  profileImage: z.string().optional(),
});

type FormValues = z.infer<typeof baseSchema>;

function toDateInput(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function EmployeeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [managers, setManagers] = useState<EmployeeDTO[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const createSchema = useMemo(
    () =>
      baseSchema.extend({
        password: z.string().min(8, 'Password must be at least 8 characters'),
      }),
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? baseSchema : createSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      department: 'Engineering',
      designation: '',
      salary: 0,
      joiningDate: new Date().toISOString().slice(0, 10),
      status: 'active',
      role: 'employee',
      reportingManager: '',
      profileImage: '',
    },
  });

  useEffect(() => {
    if (!user || !canManageEmployees(user.role)) return;

    void fetchEmployees({ limit: 100, sortBy: 'name', order: 'asc' })
      .then((res) => setManagers(res.data))
      .catch(() => setManagers([]));
  }, [user]);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const emp = await fetchEmployee(id!);
        if (cancelled) return;
        reset({
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          password: '',
          department: emp.department,
          designation: emp.designation,
          salary: emp.salary,
          joiningDate: toDateInput(emp.joiningDate),
          status: emp.status,
          role: emp.role,
          reportingManager: managerId(emp.reportingManager) ?? '',
          profileImage: emp.profileImage ?? '',
        });
      } catch (err) {
        if (!cancelled) {
          setServerError(
            isAxiosError(err)
              ? (err.response?.data as { message?: string })?.message ||
                  'Failed to load employee'
              : 'Failed to load employee'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, reset]);

  if (user && !canManageEmployees(user.role)) {
    return <Navigate to="/profile" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      department: values.department,
      designation: values.designation,
      salary: values.salary,
      joiningDate: values.joiningDate,
      status: values.status,
      role: values.role as Role,
      reportingManager: values.reportingManager || null,
      profileImage: values.profileImage || '',
      ...(values.password ? { password: values.password } : {}),
    };

    try {
      if (isEdit && id) {
        await updateEmployee(id, payload);
      } else {
        await createEmployee({
          ...payload,
          password: values.password || '',
        });
      }
      navigate('/employees');
    } catch (err) {
      if (isAxiosError(err)) {
        const data = err.response?.data as {
          message?: string;
          errors?: { field?: string; message: string }[];
        };
        if (data?.errors?.length) {
          setServerError(data.errors.map((e) => e.message).join(', '));
        } else {
          setServerError(data?.message || 'Save failed');
        }
      } else {
        setServerError('Save failed');
      }
    }
  });

  const fieldClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-accent focus:ring-2 dark:border-slate-600 dark:bg-slate-950';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          to="/employees"
          className="text-sm font-medium text-accent hover:underline"
        >
          ← Back to employees
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-ink dark:text-ink-dark">
          {isEdit ? 'Edit employee' : 'Add employee'}
        </h2>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {serverError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Name</span>
              <input className={fieldClass} {...register('name')} />
              {errors.name && (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.name.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Email</span>
              <input type="email" className={fieldClass} {...register('email')} />
              {errors.email && (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.email.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Phone</span>
              <input className={fieldClass} {...register('phone')} />
              {errors.phone && (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.phone.message}
                </span>
              )}
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">
                Password {isEdit && <span className="text-slate-400">(optional)</span>}
              </span>
              <input
                type="password"
                className={fieldClass}
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.password.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Department</span>
              <select className={fieldClass} {...register('department')}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Designation</span>
              <input className={fieldClass} {...register('designation')} />
              {errors.designation && (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.designation.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Salary</span>
              <input
                type="number"
                min={0}
                step={1}
                className={fieldClass}
                {...register('salary', { valueAsNumber: true })}
              />
              {errors.salary && (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.salary.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Joining date</span>
              <input type="date" className={fieldClass} {...register('joiningDate')} />
              {errors.joiningDate && (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.joiningDate.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Status</span>
              <select className={fieldClass} {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Role</span>
              <select
                className={fieldClass}
                {...register('role')}
                disabled={user?.role === 'hr_manager'}
              >
                <option value="employee">Employee</option>
                {user?.role === 'super_admin' && (
                  <>
                    <option value="hr_manager">HR Manager</option>
                    <option value="super_admin">Super Admin</option>
                  </>
                )}
              </select>
              {user?.role === 'hr_manager' && (
                <span className="mt-1 block text-xs text-slate-500">
                  HR can only create/keep the Employee role
                </span>
              )}
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">
                Reporting manager
              </span>
              <select className={fieldClass} {...register('reportingManager')}>
                <option value="">None</option>
                {managers
                  .filter((m) => m._id !== id)
                  .map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.employeeId})
                    </option>
                  ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">
                Profile image URL
              </span>
              <input className={fieldClass} {...register('profileImage')} />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link
              to="/employees"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

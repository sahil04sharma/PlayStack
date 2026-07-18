import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { fetchEmployee, updateEmployee } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatSalary, managerLabel } from '../lib/format';
import { ROLE_BADGE_CLASS, ROLE_LABELS } from '../lib/roles';
import type { EmployeeDTO } from '../types';

const profileSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  profileImage: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { phone: '', profileImage: '' },
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchEmployee(user!.id);
        if (cancelled) return;
        setEmployee(data);
        reset({
          phone: data.phone,
          profileImage: data.profileImage || '',
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            isAxiosError(err)
              ? (err.response?.data as { message?: string })?.message ||
                  'Failed to load profile'
              : 'Failed to load profile'
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
  }, [user, reset]);

  if (!user) return null;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateEmployee(user.id, {
        phone: values.phone,
        profileImage: values.profileImage || '',
      });
      setEmployee(updated);
      reset({
        phone: updated.phone,
        profileImage: updated.profileImage || '',
      });
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message ||
              'Update failed'
          : 'Update failed'
      );
    }
  });

  const fieldClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-accent focus:ring-2 dark:border-slate-600 dark:bg-slate-950';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-ink sm:text-2xl dark:text-ink-dark">Profile</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          You can update your phone number and profile image. Other fields are
          managed by HR/Admin.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {success}
        </div>
      )}

      {loading || !employee ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              {employee.profileImage ? (
                <img
                  src={employee.profileImage}
                  alt={employee.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-xl font-bold text-white">
                  {employee.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold">{employee.name}</h3>
                <p className="text-sm text-slate-500">{employee.email}</p>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE_CLASS[employee.role]}`}
                >
                  {ROLE_LABELS[employee.role]}
                </span>
              </div>
            </div>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Employee ID</dt>
                <dd className="font-medium">{employee.employeeId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium capitalize">{employee.status}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Department</dt>
                <dd className="font-medium">{employee.department}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Designation</dt>
                <dd className="font-medium">{employee.designation}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Salary</dt>
                <dd className="font-medium">{formatSalary(employee.salary)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Joined</dt>
                <dd className="font-medium">{formatDate(employee.joiningDate)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Reporting manager</dt>
                <dd className="font-medium">
                  {managerLabel(employee.reportingManager)}
                </dd>
              </div>
            </dl>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
            noValidate
          >
            <h3 className="text-base font-semibold">Editable details</h3>
            <p className="mt-1 text-xs text-slate-500">
              Limited self-service fields only
            </p>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Phone</span>
                <input className={fieldClass} {...register('phone')} />
                {errors.phone && (
                  <span className="mt-1 block text-xs text-red-600">
                    {errors.phone.message}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Profile image URL
                </span>
                <input className={fieldClass} {...register('profileImage')} />
                {errors.profileImage && (
                  <span className="mt-1 block text-xs text-red-600">
                    {errors.profileImage.message}
                  </span>
                )}
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

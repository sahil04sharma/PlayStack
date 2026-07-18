import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { deleteEmployee, fetchEmployees } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatDate, formatSalary, managerLabel } from '../lib/format';
import {
  ROLE_BADGE_CLASS,
  ROLE_LABELS,
  canDeleteEmployees,
  canManageEmployees,
} from '../lib/roles';
import type { EmployeeDTO, Role, Status } from '../types';

const DEPARTMENTS = [
  'Executive',
  'Human Resources',
  'Engineering',
  'Sales',
  'Marketing',
  'Finance',
];

type SortBy = 'joiningDate' | 'name' | 'email' | 'salary';

function SortHeader({
  label,
  field,
  sortBy,
  order,
  onSort,
}: {
  label: string;
  field: SortBy;
  sortBy: SortBy;
  order: 'asc' | 'desc';
  onSort: (field: SortBy) => void;
}) {
  const active = sortBy === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-accent dark:text-slate-300"
    >
      {label}
      <span className="text-xs text-slate-400">
        {active ? (order === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}

export function EmployeesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get('search') ?? '';
  const department = searchParams.get('department') ?? '';
  const role = (searchParams.get('role') ?? '') as Role | '';
  const status = (searchParams.get('status') ?? '') as Status | '';
  const sortBy = (searchParams.get('sortBy') as SortBy) || 'joiningDate';
  const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = 10;

  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const [rows, setRows] = useState<EmployeeDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManage = user ? canManageEmployees(user.role) : false;
  const canDelete = user ? canDeleteEmployees(user.role) : false;

  const updateParams = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === '') next.delete(key);
        else next.set(key, String(value));
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (debouncedSearch !== searchParam) {
      updateParams({ search: debouncedSearch || undefined, page: 1 });
    }
  }, [debouncedSearch, searchParam, updateParams]);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const load = useCallback(async () => {
    if (!canManage) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEmployees({
        search: searchParam || undefined,
        department: department || undefined,
        role: role || undefined,
        status: status || undefined,
        sortBy,
        order,
        page,
        limit,
      });
      setRows(res.data);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages);
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message ||
              'Failed to load employees'
          : 'Failed to load employees'
      );
    } finally {
      setLoading(false);
    }
  }, [
    canManage,
    searchParam,
    department,
    role,
    status,
    sortBy,
    order,
    page,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSort = (field: SortBy) => {
    if (sortBy === field) {
      updateParams({ order: order === 'asc' ? 'desc' : 'asc', page: 1 });
    } else {
      updateParams({ sortBy: field, order: 'asc', page: 1 });
    }
  };

  const onDelete = async (employee: EmployeeDTO) => {
    if (!canDelete) return;
    const ok = window.confirm(
      `Soft-delete ${employee.name}? They will be hidden from lists.`
    );
    if (!ok) return;

    setDeletingId(employee._id);
    setMessage(null);
    try {
      await deleteEmployee(employee._id);
      setMessage(`${employee.name} was soft-deleted.`);
      await load();
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message ||
              'Delete failed'
          : 'Delete failed'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const rangeLabel = useMemo(() => {
    if (total === 0) return '0 results';
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    return `${from}–${to} of ${total}`;
  }, [page, limit, total]);

  if (user && !canManage) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink sm:text-2xl dark:text-ink-dark">
            Employees
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Search, filter, and manage your workforce
          </p>
        </div>
        {canManage && (
          <Link
            to="/employees/new"
            className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover sm:w-auto"
          >
            Add employee
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {message}
        </div>
      )}

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Search
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Name or email"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-accent focus:ring-2 dark:border-slate-600 dark:bg-slate-950"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Department
          </span>
          <select
            value={department}
            onChange={(e) =>
              updateParams({ department: e.target.value || undefined, page: 1 })
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          >
            <option value="">All</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Role
          </span>
          <select
            value={role}
            onChange={(e) =>
              updateParams({ role: e.target.value || undefined, page: 1 })
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          >
            <option value="">All</option>
            <option value="super_admin">Super Admin</option>
            <option value="hr_manager">HR Manager</option>
            <option value="employee">Employee</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Status
          </span>
          <select
            value={status}
            onChange={(e) =>
              updateParams({ status: e.target.value || undefined, page: 1 })
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {/* Mobile cards */}
        <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="h-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))
          ) : rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              No employees match your filters
            </p>
          ) : (
            rows.map((emp) => (
              <div key={emp._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink dark:text-ink-dark">
                      {emp.name}
                    </p>
                    <p className="truncate text-sm text-slate-500">{emp.email}</p>
                    <p className="mt-1 font-mono text-xs text-slate-400">
                      {emp.employeeId}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE_CLASS[emp.role]}`}
                  >
                    {ROLE_LABELS[emp.role]}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    <dt className="text-slate-400">Department</dt>
                    <dd className="font-medium">{emp.department}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Status</dt>
                    <dd
                      className={
                        emp.status === 'active'
                          ? 'font-medium text-emerald-600 dark:text-emerald-400'
                          : 'font-medium'
                      }
                    >
                      {emp.status}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Joined</dt>
                    <dd className="font-medium">{formatDate(emp.joiningDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Salary</dt>
                    <dd className="font-medium">{formatSalary(emp.salary)}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/employees/${emp._id}/edit`}
                    className="flex-1 rounded-lg border border-slate-200 py-2 text-center text-xs font-semibold text-accent dark:border-slate-600"
                  >
                    Edit
                  </Link>
                  {canDelete && (
                    <button
                      type="button"
                      disabled={deletingId === emp._id}
                      onClick={() => void onDelete(emp)}
                      className="flex-1 rounded-lg border border-red-200 py-2 text-xs font-semibold text-red-600 disabled:opacity-50 dark:border-red-900"
                    >
                      {deletingId === emp._id ? '…' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">
                  <SortHeader
                    label="Name"
                    field="name"
                    sortBy={sortBy}
                    order={order}
                    onSort={onSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortHeader
                    label="Email"
                    field="email"
                    sortBy={sortBy}
                    order={order}
                    onSort={onSort}
                  />
                </th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <SortHeader
                    label="Joined"
                    field="joiningDate"
                    sortBy={sortBy}
                    order={order}
                    onSort={onSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortHeader
                    label="Salary"
                    field="salary"
                    sortBy={sortBy}
                    order={order}
                    onSort={onSort}
                  />
                </th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                    <td colSpan={10} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No employees match your filters
                  </td>
                </tr>
              ) : (
                rows.map((emp) => (
                  <tr
                    key={emp._id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                      {emp.employeeId}
                    </td>
                    <td className="px-4 py-3 font-medium">{emp.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {emp.email}
                    </td>
                    <td className="px-4 py-3">{emp.department}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE_CLASS[emp.role]}`}
                      >
                        {ROLE_LABELS[emp.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          emp.status === 'active'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-500'
                        }
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatDate(emp.joiningDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatSalary(emp.salary)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {managerLabel(emp.reportingManager)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/employees/${emp._id}/edit`}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-accent hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        >
                          Edit
                        </Link>
                        {canDelete && (
                          <button
                            type="button"
                            disabled={deletingId === emp._id}
                            onClick={() => void onDelete(emp)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
                          >
                            {deletingId === emp._id ? '…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-xs text-slate-500 sm:text-left">{rangeLabel}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => updateParams({ page: page - 1 })}
              className="min-w-[5.5rem] rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:border-slate-600"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page} of {pages || 1}
            </span>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => updateParams({ page: page + 1 })}
              className="min-w-[5.5rem] rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:border-slate-600"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

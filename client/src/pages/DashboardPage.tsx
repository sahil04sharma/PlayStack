import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { isAxiosError } from 'axios';
import { fetchDashboardStats } from '../api/dashboard';
import { fetchEmployee } from '../api/employees';
import { fetchReportees } from '../api/organization';
import type { DashboardStats, EmployeeDTO } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatDate, managerLabel } from '../lib/format';
import {
  ROLE_BADGE_CLASS,
  ROLE_LABELS,
  canManageEmployees,
} from '../lib/roles';

/** Soft multi-colors readable on light and dark backgrounds */
const CHART_COLORS = [
  '#93C5FD',
  '#6EE7B7',
  '#FCD34D',
  '#F9A8D4',
  '#A5B4FC',
  '#67E8F9',
  '#FDBA74',
  '#C4B5FD',
];

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | string | null;
  loading: boolean;
}) {
  const isText = typeof value === 'string';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {loading ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      ) : (
        <p
          className={
            isText
              ? 'mt-2 break-words text-base font-bold tracking-tight text-ink capitalize sm:text-lg dark:text-ink-dark'
              : 'mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl dark:text-ink-dark'
          }
        >
          {value ?? 0}
        </p>
      )}
    </div>
  );
}

function ManagerDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDashboardStats();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            isAxiosError(err)
              ? (err.response?.data as { message?: string })?.message ||
                  'Failed to load dashboard'
              : 'Failed to load dashboard'
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
  }, []);

  const chartData =
    stats?.departmentBreakdown.map((d) => ({
      department: d._id || 'Unknown',
      count: d.count,
    })) ?? [];

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const tooltipStyle = {
    borderRadius: 8,
    border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    color: isDark ? '#E2E8F0' : '#1E293B',
    fontSize: 13,
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-ink sm:text-2xl dark:text-ink-dark">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {user
            ? `Welcome back, ${user.name.split(' ')[0]}. Here’s your workforce snapshot.`
            : 'Workforce snapshot'}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Employees"
          value={stats?.totalEmployees ?? null}
          loading={loading}
        />
        <StatCard
          label="Active Employees"
          value={stats?.activeEmployees ?? null}
          loading={loading}
        />
        <StatCard
          label="Inactive Employees"
          value={stats?.inactiveEmployees ?? null}
          loading={loading}
        />
        <StatCard
          label="Departments"
          value={stats?.departmentCount ?? null}
          loading={loading}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-base font-semibold text-ink dark:text-ink-dark">
          Employees by department
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Headcount breakdown across departments
        </p>

        <div className="mt-4 h-64 w-full min-w-0 sm:mt-6 sm:h-72">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No department data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 4, left: -12, bottom: 48 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 10, fill: axisColor }}
                  stroke={gridColor}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: axisColor }}
                  stroke={gridColor}
                  width={36}
                />
                <Tooltip
                  cursor={{
                    fill: isDark
                      ? 'rgba(148, 163, 184, 0.12)'
                      : 'rgba(148, 163, 184, 0.16)',
                  }}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Employees">
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [reporteeCount, setReporteeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [profile, reportees] = await Promise.all([
          fetchEmployee(user!.id),
          fetchReportees(user!.id),
        ]);
        if (cancelled) return;
        setEmployee(profile);
        setReporteeCount(Array.isArray(reportees) ? reportees.length : 0);
      } catch (err) {
        if (!cancelled) {
          setError(
            isAxiosError(err)
              ? (err.response?.data as { message?: string })?.message ||
                  'Failed to load your dashboard'
              : 'Failed to load your dashboard'
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
  }, [user]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-ink sm:text-2xl dark:text-ink-dark">My dashboard</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {user
            ? `Welcome back, ${user.name.split(' ')[0]}. Here’s your personal snapshot.`
            : 'Your personal snapshot'}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Department"
          value={employee?.department ?? null}
          loading={loading}
        />
        <StatCard
          label="Designation"
          value={employee?.designation ?? null}
          loading={loading}
        />
        <StatCard
          label="Direct reports"
          value={loading ? null : reporteeCount}
          loading={loading}
        />
        <StatCard
          label="Status"
          value={employee?.status ?? null}
          loading={loading}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        {loading || !employee ? (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              {employee.profileImage ? (
                <img
                  src={employee.profileImage}
                  alt={employee.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
                  {employee.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-ink dark:text-ink-dark">
                  {employee.name}
                </h3>
                <p className="text-sm text-slate-500">{employee.email}</p>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE_CLASS[employee.role]}`}
                >
                  {ROLE_LABELS[employee.role]}
                </span>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Employee ID</dt>
                    <dd className="font-medium">{employee.employeeId}</dd>
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
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link
                to="/profile"
                className="rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Edit profile
              </Link>
              <Link
                to="/organization"
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold dark:border-slate-600"
              >
                My org branch
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (canManageEmployees(user.role)) {
    return <ManagerDashboard />;
  }

  return <EmployeeDashboard />;
}

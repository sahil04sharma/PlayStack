import { useEffect, useState } from 'react';
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
import type { DashboardStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/** Soft multi-colors readable on light and dark backgrounds */
const CHART_COLORS = [
  '#93C5FD', // soft blue
  '#6EE7B7', // soft mint
  '#FCD34D', // soft amber
  '#F9A8D4', // soft pink
  '#A5B4FC', // soft indigo
  '#67E8F9', // soft cyan
  '#FDBA74', // soft peach
  '#C4B5FD', // soft violet
];

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {loading ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      ) : (
        <p className="mt-2 text-3xl font-bold tracking-tight text-ink dark:text-ink-dark">
          {value ?? 0}
        </p>
      )}
    </div>
  );
}

export function DashboardPage() {
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
        <h2 className="text-2xl font-bold text-ink dark:text-ink-dark">Dashboard</h2>
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

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-base font-semibold text-ink dark:text-ink-dark">
          Employees by department
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Headcount breakdown across departments
        </p>

        <div className="mt-6 h-72 w-full">
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
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 12, fill: axisColor }}
                  stroke={gridColor}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: axisColor }}
                  stroke={gridColor}
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

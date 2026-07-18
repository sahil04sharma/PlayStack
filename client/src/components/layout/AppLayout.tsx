import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ROLE_BADGE_CLASS, ROLE_LABELS, canManageEmployees } from '../../lib/roles';

const allNavItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/employees', label: 'Employees', managerOnly: true },
  { to: '/organization', label: 'Organization' },
  { to: '/profile', label: 'Profile' },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = allNavItems.filter(
    (item) =>
      !item.managerOnly || (user && canManageEmployees(user.role))
  );

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-accent text-white'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    ].join(' ');

  return (
    <div className="flex min-h-screen min-h-dvh bg-surface dark:bg-surface-dark">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-[min(18rem,85vw)] flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-700 dark:bg-slate-900',
          'md:static md:w-64 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              PlayStack
            </p>
            <h1 className="mt-1 text-lg font-bold text-ink dark:text-ink-dark">
              EMS
            </h1>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-200 bg-white/90 px-3 py-2.5 backdrop-blur sm:gap-3 sm:px-4 sm:py-3 dark:border-slate-700 dark:bg-slate-900/90">
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink md:hidden dark:text-ink-dark">
              PlayStack EMS
            </p>
            <p className="hidden text-sm text-slate-500 md:block dark:text-slate-400">
              Employee Management System
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>

            {user && (
              <>
                <span
                  className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline ${ROLE_BADGE_CLASS[user.role]}`}
                >
                  {ROLE_LABELS[user.role]}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white sm:h-9 sm:w-9">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 overflow-x-hidden p-3 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

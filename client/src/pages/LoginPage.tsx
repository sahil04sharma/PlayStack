import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      const from = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;
      navigate(from || '/', { replace: true });
    } catch (err) {
      if (isAxiosError(err)) {
        setServerError(
          (err.response?.data as { message?: string })?.message ||
            'Login failed'
        );
      } else {
        setServerError('Login failed');
      }
    }
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 dark:bg-surface-dark">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.12),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.22),_transparent_55%)]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            PlayStack
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink dark:text-ink-dark">
            Sign in to EMS
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Use your seeded credentials to continue
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8"
          noValidate
        >
          {serverError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {serverError}
            </div>
          )}

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2 dark:border-slate-600 dark:bg-slate-950"
              {...register('email')}
            />
            {errors.email && (
              <span className="mt-1 block text-xs text-red-600">
                {errors.email.message}
              </span>
            )}
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2 dark:border-slate-600 dark:bg-slate-950"
              {...register('password')}
            />
            {errors.password && (
              <span className="mt-1 block text-xs text-red-600">
                {errors.password.message}
              </span>
            )}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
            Demo: admin@ems.test / hr@ems.test / employee@ems.test
            <br />
            Password: Password123!
          </p>
        </form>
      </div>
    </div>
  );
}

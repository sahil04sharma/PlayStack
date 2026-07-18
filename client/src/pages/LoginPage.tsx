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
    <div className="relative flex min-h-screen overflow-hidden bg-[#07131f] text-white">
      {/* Full-bleed studio atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 15% 20%, rgba(167, 139, 250, 0.2), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 80%, rgba(196, 181, 253, 0.12), transparent 50%), linear-gradient(160deg, #07131f 0%, #12182b 45%, #0a1a28 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148, 163, 184, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.35) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      <div
        aria-hidden
        className="login-drift pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-[#a78bfa]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center gap-8 px-4 py-8 sm:gap-10 sm:px-5 sm:py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-10">
        {/* Brand hero */}
        <div className="login-rise flex-1 lg:max-w-xl">
          <p className="font-game text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a78bfa] sm:text-xs sm:tracking-[0.35em]">
            Employee Management System
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:mt-4 sm:text-6xl lg:text-7xl">
            Play
            <span className="text-[#a78bfa]">Stack</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300 sm:mt-5 sm:text-lg">
            Secure access to manage employees, roles, departments, and your
            organizational hierarchy.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 font-game text-[11px] uppercase tracking-wider text-slate-400">
            <span className="rounded border border-white/10 bg-white/5 px-3 py-1.5">
              Dashboard
            </span>
            <span className="rounded border border-white/10 bg-white/5 px-3 py-1.5">
              Employees
            </span>
            <span className="rounded border border-white/10 bg-white/5 px-3 py-1.5">
              Organization
            </span>
          </div>
        </div>

        {/* Login panel */}
        <div className="login-rise-delay w-full max-w-md shrink-0">
          <form
            onSubmit={onSubmit}
            className="border border-white/10 bg-[#0b1c2c]/85 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8"
            noValidate
          >
            <div className="mb-6 border-b border-white/10 pb-4">
              <p className="font-game text-xs font-semibold uppercase tracking-[0.25em] text-[#a78bfa]">
                Secure login
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold">
                Sign in to EMS
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Use your seeded credentials to continue
              </p>
            </div>

            {serverError && (
              <div className="mb-4 border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {serverError}
              </div>
            )}

            <label className="mb-4 block">
              <span className="mb-1.5 block font-game text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Email
              </span>
              <input
                type="email"
                autoComplete="email"
                placeholder="admin@ems.test"
                className="w-full border border-white/15 bg-[#07131f] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#a78bfa]"
                {...register('email')}
              />
              {errors.email && (
                <span className="mt-1 block text-xs text-red-300">
                  {errors.email.message}
                </span>
              )}
            </label>

            <label className="mb-6 block">
              <span className="mb-1.5 block font-game text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Password
              </span>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-white/15 bg-[#07131f] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#a78bfa]"
                {...register('password')}
              />
              {errors.password && (
                <span className="mt-1 block text-xs text-red-300">
                  {errors.password.message}
                </span>
              )}
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#8b5cf6] px-4 py-3 font-game text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="mt-5 break-words text-center text-[11px] leading-relaxed text-slate-200">
              Demo:{' '}
              <span className="font-medium text-[#a78bfa]">admin@ems.test</span>
              <span className="text-slate-500"> · </span>
              <span className="font-medium text-[#a78bfa]">hr@ems.test</span>
              <span className="text-slate-500"> · </span>
              <span className="font-medium text-[#a78bfa]">employee@ems.test</span>
              <br />
              Password:{' '}
              <span className="font-medium text-white">Password123!</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useAuth } from '../context/AuthContext';
import { ROLE_BADGE_CLASS, ROLE_LABELS } from '../lib/roles';

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink dark:text-ink-dark">Profile</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Self-service editing will be added with the employee forms phase.
      </p>

      <div className="mt-6 max-w-lg rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd>
              <span
                className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE_CLASS[user.role]}`}
              >
                {ROLE_LABELS[user.role]}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { fetchOrgTree } from '../api/organization';
import { OrgTreeItem } from '../components/organization/OrgTreeItem';
import { useAuth } from '../context/AuthContext';
import type { OrgTreeNode } from '../types';

export function OrganizationPage() {
  const { user } = useAuth();
  const [tree, setTree] = useState<OrgTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrgTree();
        if (!cancelled) setTree(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            isAxiosError(err)
              ? (err.response?.data as { message?: string })?.message ||
                  'Failed to load organization tree'
              : 'Failed to load organization tree'
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink dark:text-ink-dark">
          Organization
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {user?.role === 'employee'
            ? 'Your branch of the reporting hierarchy'
            : 'Full reporting hierarchy — expand or collapse each node'}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : tree.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No organization data to display
          </p>
        ) : (
          <ul>
            {tree.map((node) => (
              <OrgTreeItem key={node._id} node={node} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

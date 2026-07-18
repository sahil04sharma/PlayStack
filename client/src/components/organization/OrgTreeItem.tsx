import { useState } from 'react';
import { ROLE_BADGE_CLASS, ROLE_LABELS } from '../../lib/roles';
import type { OrgTreeNode } from '../../types';

interface OrgTreeItemProps {
  node: OrgTreeNode;
  depth?: number;
}

export function OrgTreeItem({ node, depth = 0 }: OrgTreeItemProps) {
  const hasChildren = node.directReports.length > 0;
  const [open, setOpen] = useState(depth < 2);

  return (
    <li>
      <div
        className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-300 text-xs font-bold text-slate-600 dark:border-slate-600 dark:text-slate-300"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? '−' : '+'}
          </button>
        ) : (
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-slate-300">
            ·
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink dark:text-ink-dark">{node.name}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE_CLASS[node.role]}`}
            >
              {ROLE_LABELS[node.role]}
            </span>
            <span
              className={
                node.status === 'active'
                  ? 'text-xs text-emerald-600 dark:text-emerald-400'
                  : 'text-xs text-slate-500'
              }
            >
              {node.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {node.designation} · {node.department} · {node.employeeId}
          </p>
          {hasChildren && (
            <p className="mt-0.5 text-xs text-slate-400">
              {node.directReports.length} direct report
              {node.directReports.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>

      {hasChildren && open && (
        <ul className="border-l border-slate-200 ml-5 dark:border-slate-700">
          {node.directReports.map((child) => (
            <OrgTreeItem key={child._id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

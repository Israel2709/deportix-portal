import type { ReactNode } from 'react';

export function AmericanFootballAccordion({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      className="group rounded-xl border border-slate-800 bg-slate-900/50"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="font-medium text-slate-100">{title}</span>
        <span className="flex items-center gap-2 text-sm text-slate-400">
          {count != null && <span className="tabular-nums">{count}</span>}
          <span aria-hidden className="text-xs transition group-open:rotate-180">
            ▼
          </span>
        </span>
      </summary>
      <div className="border-t border-slate-800 px-5 py-4">{children}</div>
    </details>
  );
}

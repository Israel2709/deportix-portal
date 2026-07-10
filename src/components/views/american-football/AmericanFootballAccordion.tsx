import type { ReactNode } from 'react';

export function AmericanFootballAccordion({
  title,
  count,
  defaultOpen = false,
  filter,
  onFilterChange,
  filterPlaceholder = 'Buscar…',
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  filter?: string;
  onFilterChange?: (value: string) => void;
  filterPlaceholder?: string;
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
      <div className="border-t border-slate-800 px-5 py-4">
        {onFilterChange && (
          <div className="mb-4">
            <input
              type="search"
              value={filter ?? ''}
              onChange={(event) => onFilterChange(event.target.value)}
              placeholder={filterPlaceholder}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}
        {children}
      </div>
    </details>
  );
}
